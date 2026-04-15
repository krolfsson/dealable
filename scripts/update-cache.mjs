import { parse } from "csv-parse/sync";
import { gunzipSync } from "zlib";
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

const FEED_URL =
  "https://productdata.awin.com/datafeed/download/apikey/e1f765d6091f3fe2034630528473dd09/language/sv/fid/28201,66049,66051,71335,75951,85876,90563,92875,98177,109678,110674,111829/rid/0/hasEnhancedFeeds/0/columns/aw_deep_link,product_name,aw_product_id,merchant_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,merchant_id,category_name,category_id,aw_image_url,currency,store_price,delivery_cost,merchant_deep_link,language,last_updated,display_price,data_feed_id,brand_name,brand_id,colour,product_short_description,specifications,condition,product_model,model_number,dimensions,keywords,promotional_text,product_type,commission_group,merchant_product_category_path,merchant_product_second_category,merchant_product_third_category,rrp_price,saving,savings_percent,base_price,base_price_amount,base_price_text,product_price_old,in_stock,stock_quantity,valid_from,valid_to,is_for_sale,web_offer,pre_order,stock_status,size_stock_status,size_stock_amount,merchant_thumb_url,large_image,alternate_image,aw_thumb_url,alternate_image_two,alternate_image_three,alternate_image_four,reviews,average_rating,rating,number_available,Fashion%3Asuitable_for,Fashion%3Acategory,Fashion%3Asize,Fashion%3Amaterial,Fashion%3Apattern,Fashion%3Aswatch/format/csv/delimiter/%2C/compression/gzip/adultcontent/1/";

function isExcludedMerchant(merchantName) {
  const s = String(merchantName || "").toLowerCase();
  return (
    s.includes("babubas") ||
    s.includes("deluxehomeartshop") ||
    s.includes("perfumeza")
  );
}

const MIN_DISCOUNT = 20;
const CHUNK_SIZE = 2000;

function parsePrice(value) {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function listPriceAboveCurrent(row, currentPrice) {
  if (currentPrice <= 0) return 0;
  const candidates = [
    parsePrice(row.rrp_price),
    parsePrice(row.product_price_old),
    parsePrice(row.store_price),
    parsePrice(row.base_price_amount),
    parsePrice(row.base_price),
    parsePrice(row.base_price_text),
  ].filter((n) => n > currentPrice);
  return candidates.length ? Math.max(...candidates) : 0;
}

function maxPercentFromMarketingFields(row) {
  const blob = [row.saving, row.promotional_text, row.web_offer].map((s) => String(s || "")).join("");
  if (!blob) return 0;
  const re = /(?:^|[^\d])(\d{1,2}(?:[.,]\d+)?|100)\s*%/g;
  let max = 0;
  let m;
  while ((m = re.exec(blob)) !== null) {
    const v = Math.round(parseFloat(m[1].replace(",", ".")));
    if (Number.isFinite(v) && v > max && v <= 100) max = v;
  }
  return max;
}

function stableIntFromKey(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h === 0 ? 1 : h;
}

function dealDedupeKey(row, storeName) {
  const store = storeName.toLowerCase().trim();
  const mpid = String(row.merchant_product_id ?? "").trim();
  const pid = String(row.aw_product_id ?? "").trim();
  const fid = String(row.data_feed_id ?? "").trim();
  const title = String(row.product_name ?? "").trim().toLowerCase();
  if (mpid) return `${store}|${mpid}|${fid}`;
  if (pid) return `${store}|${pid}|${fid}`;
  return `${store}|${title}|${fid}`;
}

function normalizeImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.startsWith("//")) return `https:${s}`;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return "";
}

function pickProductImages(row) {
  const candidates = [
    row.large_image,
    row.aw_image_url,
    row.merchant_image_url,
    row.merchant_thumb_url,
    row.aw_thumb_url,
    row.alternate_image,
    row.alternate_image_two,
    row.alternate_image_three,
    row.alternate_image_four,
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);

  const deduped = [];
  const seen = new Set();
  for (const u of candidates) {
    if (seen.has(u)) continue;
    seen.add(u);
    deduped.push(u);
  }

  return {
    image: deduped[0] || "",
    imageFallbacks: deduped.slice(1, 6),
  };
}

function mapCategory(productName, merchantCategory, categoryPath, storeName) {
  const name = (productName || "").toLowerCase();
  const cat = (merchantCategory || "").toLowerCase();
  const path = (categoryPath || "").toLowerCase();
  const store = (storeName || "").toLowerCase();

  if (store.includes("apotek")) {
    // Apotek Hjärtat: merchant_category is a "Produkter > ..." taxonomy
    if (cat.includes("hudvård") || cat.includes("ansiktsvård") || cat.includes("kroppsvård")) return "Hudvård";
    if (cat.includes("hårvård") || cat.includes("schampo") || cat.includes("balsam")) return "Hårvård";
    if (cat.includes("smink") || cat.includes("makeup") || cat.includes("kosmetik")) return "Smink";
    if (cat.includes("parfym") || cat.includes("doft")) return "Parfym & doft";
    if (cat.includes("känslig hud") || cat.includes("derma") || cat.includes("eksem")) return "Derma";
    if (cat.includes("mun") || cat.includes("tand") || cat.includes("munvård")) return "Munvård";
    if (cat.includes("intim") || cat.includes("sex") || cat.includes("lust")) return "Sex & intim";
    if (cat.includes("kosttillskott") || cat.includes("vitamin") || cat.includes("mineral")) return "Kosttillskott";
    if (cat.includes("mage") || cat.includes("tarm") || cat.includes("mjölksyrabakterier")) return "Mage & tarm";
    if (cat.includes("barn") || cat.includes("baby") || cat.includes("gravid")) return "Barn & baby";
    if (cat.includes("sol") || cat.includes("spf") || cat.includes("solskydd")) return "Solskydd";
    if (cat.includes("rak") || cat.includes("deodorant") || cat.includes("hygien") || cat.includes("tvål")) return "Hygien";
    if (cat.includes("feber") || cat.includes("förkyl") || cat.includes("hosta") || cat.includes("allerg")) return "Hälsa";
    if (cat.includes("plåster") || cat.includes("förband") || cat.includes("sår")) return "Första hjälpen";
    return "Apotek";
  }

  if (store.includes("xiaomi")) {
    // Xiaomi: categoryPath carries the taxonomy: "Mi > ..."
    if (path.includes("telefon") || path.includes("smartphone")) return "Mobiler";
    if (path.includes("surfplatt") || path.includes("tablet")) return "Surfplattor";
    if (path.includes("hörlur") || path.includes("headset") || path.includes("högtalare") || path.includes("sound")) return "Ljud";
    if (path.includes("tv") || path.includes("tv-box") || path.includes("tv-stick") || path.includes("projektor")) return "TV & video";
    if (path.includes("dammsug")) return "Dammsugare & tillbehör";
    if (path.includes("luftren")) return "Luftrenare";
    if (path.includes("belysning")) return "Belysning";
    if (path.includes("klock") || path.includes("smartwatch") || path.includes("armband")) return "Wearables";
    if (path.includes("skrivare")) return "Skrivare";
    if (path.includes("router") || path.includes("wifi") || path.includes("nätverk")) return "Nätverk";
    if (path.includes("smart hem") || path.includes("sensor") || path.includes("kamera")) return "Smart hem";
    if (path.includes("hårfön") || path.includes("personvård")) return "Personvård";
    return "Elektronik";
  }

  if (store.includes("jotex")) {
    // Jotex: feed often lacks category fields; infer from product name keywords
    if (name.includes("lampa") || name.includes("lamp") || name.includes("ljuskälla") || name.includes("ljusstake") || name.includes("solcell")) return "Belysning";
    if (name.includes("gardin") || name.includes("rullgardin") || name.includes("persienn")) return "Gardiner";
    if (name.includes("matta") || name.includes("rug")) return "Mattor";
    if (name.includes("säng") || name.includes("påslakan") || name.includes("lakan") || name.includes("örngott") || name.includes("kudde") || name.includes("täcke") || name.includes("överkast")) return "Sovrum";
    if (name.includes("handduk") || name.includes("badlakan") || name.includes("badrock") || name.includes("dusch")) return "Badrum";
    if (name.includes("bord") || name.includes("stol") || name.includes("soffa") || name.includes("fåtölj") || name.includes("hylla") || name.includes("skåp")) return "Möbler";
    if (name.includes("duk") || name.includes("servett") || name.includes("glas") || name.includes("tallrik") || name.includes("bestick")) return "Kök & dukning";
    if (name.includes("kudde") || name.includes("pläd") || name.includes("filt") || name.includes("vas") || name.includes("ljus")) return "Inredning";
    return "Hem";
  }

  if (store.includes("padel")) {
    if (name.includes("racket") || name.includes("pala")) return "Padelracketar";
    if (name.includes("boll") || name.includes("ball")) return "Bollar";
    if (name.includes("skor") || name.includes("shoe")) return "Skor";
    if (name.includes("väska") || name.includes("bag") || name.includes("ryggsäck")) return "Väskor";
    if (name.includes("t-shirt") || name.includes("shorts") || name.includes("tröja") || name.includes("byxa") || name.includes("jacka") || name.includes("hoodie") || name.includes("piké") || name.includes("leggings")) return "Kläder";
    if (name.includes("grip") || name.includes("overgrip") || name.includes("dämpare")) return "Tillbehör";
    if (name.includes("skydd") || name.includes("protect")) return "Skydd";
    if (name.includes("keps") || name.includes("mössa") || name.includes("pannband") || name.includes("handduk") || name.includes("strumpa") || name.includes("solglasögon") || name.includes("armband") || name.includes("visir")) return "Accessoarer";
    return "Padel";
  }

  if (store.includes("nelly") || store.includes("nly")) {
    if (cat.includes("klänning") || path.includes("klänning")) return "Klänningar";
    if (cat.includes("bikini") || cat.includes("badkläder") || name.includes("bikini") || name.includes("baddräkt")) return "Badkläder";
    if (cat.includes("jacka") || cat.includes("kappa") || cat.includes("ytterkläder") || name.includes("jacka") || name.includes("kappa")) return "Jackor";
    if (cat.includes("jeans") || name.includes("jeans")) return "Jeans";
    if (cat.includes("kjol") || name.includes("kjol")) return "Kjolar";
    if (cat.includes("skor") || path.includes("skor") || name.includes("sneaker") || name.includes("sandal") || name.includes("klack")) return "Skor";
    if (cat.includes("väsk") || cat.includes("handväsk") || path.includes("väsk")) return "Väskor";
    if (cat.includes("smycke") || cat.includes("ring") || name.includes("halsband") || name.includes("örhänge")) return "Smycken";
    if (cat.includes("behå") || cat.includes("underkläder") || cat.includes("strump") || name.includes("behå") || name.includes("trosa") || name.includes("strumpa")) return "Underkläder";
    if (cat.includes("topp") || cat.includes("skjort") || cat.includes("kläder") || cat.includes("byxa") || path.includes("kläder") || name.includes("topp") || name.includes("t-shirt") || name.includes("blus") || name.includes("byxa") || name.includes("shorts") || name.includes("tröja") || name.includes("hoodie") || name.includes("skjorta")) return "Kläder";
    return "Kläder";
  }

  if (store.includes("diamond smile")) return "Hälsa";
  if (store.includes("bloomcabin")) return "Hem";
  if (store.includes("navimow")) return "Trädgård";

  if (store.includes("outnorth")) {
    if (cat.includes("dunjack") || cat.includes("jacka") || cat.includes("softshell") || cat.includes("skaljack") || cat.includes("fleece") || name.includes("jacka")) return "Jackor";
    if (cat.includes("skor") || cat.includes("kängor") || cat.includes("sandal") || cat.includes("vandringsskor") || name.includes("sko") || name.includes("boot") || name.includes("känga")) return "Skor";
    if (cat.includes("tält") || cat.includes("camping")) return "Camping";
    if (cat.includes("sovsäck") || name.includes("sovsäck")) return "Sovsäckar";
    if (cat.includes("ryggsäck") || cat.includes("väsk") || cat.includes("duffel") || name.includes("ryggsäck") || name.includes("väska")) return "Väskor";
    if (cat.includes("byxa") || cat.includes("shorts") || cat.includes("tröja") || cat.includes("t-shirt") || cat.includes("skjorta") || cat.includes("kläder") || cat.includes("underkläder") || cat.includes("badkläder") || name.includes("byxa") || name.includes("shorts") || name.includes("tröja")) return "Kläder";
    if (cat.includes("solglasögon") || cat.includes("keps") || cat.includes("mössa") || cat.includes("handskar") || cat.includes("bält")) return "Accessoarer";
    return "Friluftsliv";
  }

  if (path.includes("skor") || cat.includes("skor")) return "Skor";
  if (path.includes("kläd") || cat.includes("kläd")) return "Kläder";
  if (path.includes("väsk") || cat.includes("väsk")) return "Väskor";
  return "Övrigt";
}

async function main() {
  const start = Date.now();
  console.log("📡 Fetching Awin feed...");

  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Awin feed error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`📦 Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

  const csv = gunzipSync(buffer).toString("utf-8");
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
  console.log(`📊 Parsed ${records.length} rows`);

  const deals = records
    .map((row) => {
      const storeName = String(row.merchant_name || "");
      if (isExcludedMerchant(storeName)) return null;

      const currentPrice = parsePrice(row.display_price) || parsePrice(row.search_price) || 0;
      const oldPrice = listPriceAboveCurrent(row, currentPrice);

      let discount =
        parseFloat(
          String(row.savings_percent ?? "")
            .replace(/%/g, "")
            .replace(",", ".")
        ) || 0;
      if (!discount && oldPrice > currentPrice && currentPrice > 0) {
        discount = Math.round((1 - currentPrice / oldPrice) * 100);
      }
      if (!discount) discount = maxPercentFromMarketingFields(row);

      const inStock = row.in_stock !== "0" && row.in_stock?.toLowerCase() !== "false";
      const storeLower = storeName.toLowerCase();
      const skipMinDiscount =
        storeLower.includes("jotex") ||
        storeLower.includes("bloomcabin") ||
        storeLower.includes("diamond smile") ||
        storeLower.includes("navimow");

      if (
        !inStock ||
        currentPrice <= 0 ||
        !row.product_name ||
        (!skipMinDiscount && discount < MIN_DISCOUNT)
      ) {
        return null;
      }

      const { image, imageFallbacks } = pickProductImages(row);
      const dedupeKey = dealDedupeKey(row, storeName);

      return {
        id: stableIntFromKey(dedupeKey),
        title: row.product_name || "",
        brand: row.brand_name || "",
        store: storeName,
        price: currentPrice,
        originalPrice: oldPrice > currentPrice ? oldPrice : 0,
        discount: discount > 0 ? `-${Math.round(discount)}%` : "DEAL",
        discountNum: discount,
        category: mapCategory(
          row.product_name || "",
          row.merchant_category || "",
          row.merchant_product_category_path || "",
          storeName
        ),
        image,
        ...(imageFallbacks.length ? { imageFallbacks } : {}),
        url: row.aw_deep_link || "",
        description: row.product_short_description || row.description || "",
        currency: row.currency || "SEK",
        colour: row.colour || "",
        inStock: true,
        hot: discount >= 40,
        firstSeen: row.last_updated || new Date().toISOString(),
        dedupeKey,
      };
    })
    .filter(Boolean);

  deals.sort((a, b) => {
    if (b.discountNum !== a.discountNum) return b.discountNum - a.discountNum;
    return a.price - b.price;
  });

  const seen = new Map();
  const uniqueDeals = deals.filter((d) => {
    const key = String(d.dedupeKey || "");
    if (!key || seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
  console.log(`🧹 Removed ${deals.length - uniqueDeals.length} duplicates (${uniqueDeals.length} unique)`);

  for (const d of uniqueDeals) {
    delete d.dedupeKey;
  }

  const stores = Array.from(new Set(uniqueDeals.map((d) => d.store))).sort((a, b) =>
    a.localeCompare(b, "sv")
  );

  // Spara till public/cache som chunks
  const cacheDir = join(process.cwd(), "public", "cache");
  mkdirSync(cacheDir, { recursive: true });

  // Rensa gamla filer
  try {
    const existing = readdirSync(cacheDir);
    for (const f of existing) {
      unlinkSync(join(cacheDir, f));
    }
  } catch {}

  // Dela upp i chunks
  const totalChunks = Math.ceil(uniqueDeals.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = uniqueDeals.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkPath = join(cacheDir, `deals-${i}.json`);
    writeFileSync(chunkPath, JSON.stringify(chunk));
    const size = (Buffer.byteLength(JSON.stringify(chunk)) / 1024).toFixed(0);
    console.log(`   📄 deals-${i}.json: ${chunk.length} deals (${size} KB)`);
  }

  // Meta-fil (liten, laddas först)
  const meta = {
    lastUpdated: new Date().toISOString(),
    totalDeals: uniqueDeals.length,
    stores,
    totalChunks,
    chunkSize: CHUNK_SIZE,
  };
  writeFileSync(join(cacheDir, "deals-meta.json"), JSON.stringify(meta));

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ ${uniqueDeals.length} deals saved in ${totalChunks} chunks in ${elapsed}s`);

  // Stats per butik
  const storeStats = {};
  uniqueDeals.forEach((d) => {
    storeStats[d.store] = (storeStats[d.store] || 0) + 1;
  });
  console.log("📊 Per butik:");
  Object.entries(storeStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, c]) => {
      console.log(`   ${s}: ${c} deals`);
    });
}

main().catch(console.error);
