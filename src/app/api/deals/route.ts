import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { gunzipSync } from "zlib";

const FEED_URL =
  "https://productdata.awin.com/datafeed/download/apikey/e1f765d6091f3fe2034630528473dd09/language/sv/cid/97,98,142,144,146,129,595,539,147,149,613,626,135,163,159,161,170,137,171,548,174,183,178,179,175,172,623,139,614,189,194,141,205,198,206,203,208,199,204,201,61,62,72,73,71,74,75,76,77,78,63,80,64,83,84,85,65,86,88,90,89,91,67,92,94,33,53,52,603,66,128,130,133,212,209,210,211,68,69,213,220,221,70,224,225,226,227,228,229,4,5,10,11,537,19,15,14,6,20,22,23,24,25,7,30,32,619,8,35,618,43,9,50,634,230,538,235,241,556,245,242,521,576,575,577,579,281,283,285,286,282,290,287,288,627,173,193,642,177,196,379,648,181,645,384,387,646,598,611,391,393,647,395,631,602,570,600,405,187,411,412,414,415,416,417,649,418,419,420,99,100,101,107,110,111,113,114,115,116,118,121,122,127,581,624,123,594,125,421,605,604,599,422,433,434,436,532,428,474,475,476,477,423,608,437,438,441,444,445,446,424,451,448,453,449,452,450,425,455,457,459,460,456,458,426,616,463,464,465,466,427,625,597,473,469,617,470,429,430,481,615,483,484,485,529,596,431,432,490,361,633,362,366,367,368,371,369,363,372,373,374,377,375,536,535,364,380,365,383,385,390,392,394,399,402,404,406,407,540,542,544,546,547,246,247,252,559,255,248,256,265,593,258,259,632,260,261,262,557,249,266,267,268,269,612,251,277,250,272,270,271,561,560,347,348,354,350,351,349,357,358,360,586,588,328,629,333,336,338,493,635,495,507,563,564,566,567,569,568/fid/98177,111829/bid/63213,63233,65257,66219,64811,66517,63453,64633/columns/aw_deep_link,product_name,aw_product_id,merchant_product_id,merchant_image_url,description,merchant_category,search_price,merchant_name,merchant_id,category_name,category_id,aw_image_url,currency,store_price,delivery_cost,merchant_deep_link,language,last_updated,display_price,data_feed_id,rrp_price,saving,savings_percent,base_price,base_price_amount,base_price_text,product_price_old,brand_name,brand_id,colour,product_short_description,specifications,condition,product_model,model_number,dimensions,keywords,promotional_text,product_type,commission_group,merchant_product_category_path,merchant_product_second_category,merchant_product_third_category,in_stock,stock_quantity,valid_from,valid_to,is_for_sale,web_offer,pre_order,stock_status,size_stock_status,size_stock_amount,merchant_thumb_url,large_image,alternate_image,aw_thumb_url,alternate_image_two,alternate_image_three,alternate_image_four,reviews,average_rating,rating,number_available/format/csv/delimiter/%2C/compression/gzip/adultcontent/1/";

// In-memory cache
let cachedDeals: any[] | null = null;
let cachedCategories: string[] | null = null;
let cachedStores: string[] | null = null;
let lastFetched = 0;
const CACHE_DURATION = 60 * 60 * 1000;

function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  // Hantera "SEK1234.00", "1 234,50 kr", "1234.00" etc.
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function mapCategory(productName: string, merchantCategory: string, categoryPath: string): string {
  const name = (productName || "").toLowerCase();
  const cat = (merchantCategory || "").toLowerCase();
  const path = (categoryPath || "").toLowerCase();

  if (name.includes("(racket)") || name.includes("racket") || name.includes("padelracket")) return "Padelracketar";
  if (name.includes("(boll)") || name.includes("bollar") || name.includes("ball")) return "Bollar";
  if (name.includes("(skor)") || name.includes("skor") || name.includes("shoe")) return "Skor";
  if (name.includes("(väska)") || name.includes("väska") || name.includes("bag") || name.includes("ryggsäck") || name.includes("padelväska")) return "Väskor";
  if (
    name.includes("(t-shirt)") || name.includes("(shorts)") ||
    name.includes("(tröja)") || name.includes("(byxa)") ||
    name.includes("(jacka)") || name.includes("(kjol)") ||
    name.includes("(klänning)") || name.includes("(topp)") ||
    name.includes("t-shirt") || name.includes("shorts") ||
    name.includes("tröja") || name.includes("byxa") ||
    name.includes("jacka") || name.includes("leggings") ||
    name.includes("hoodie") || name.includes("piké")
  ) return "Kläder";
  if (
    name.includes("grip") || name.includes("overgrip") ||
    name.includes("(tillbehör)") || name.includes("dämpare")
  ) return "Tillbehör";
  if (name.includes("skydd") || name.includes("protect") || name.includes("(skydd)")) return "Skydd";
  if (
    name.includes("keps") || name.includes("mössa") ||
    name.includes("pannband") || name.includes("handduk") ||
    name.includes("strumpa") || name.includes("toalettväska") ||
    name.includes("solglasögon") || name.includes("armband") ||
    name.includes("visir")
  ) return "Accessoarer";

  if (path.includes("racket") || cat.includes("racket")) return "Padelracketar";
  if (path.includes("shoe") || path.includes("skor") || cat.includes("shoe")) return "Skor";
  if (path.includes("cloth") || path.includes("kläd")) return "Kläder";
  if (path.includes("bag") || path.includes("väsk")) return "Väskor";
  if (path.includes("ball") || path.includes("boll")) return "Bollar";
  if (path.includes("accessor") || path.includes("tillbehör")) return "Tillbehör";

  return "Övrigt";
}

async function fetchDeals() {
  const now = Date.now();

  if (cachedDeals && now - lastFetched < CACHE_DURATION) {
    return { deals: cachedDeals, categories: cachedCategories!, stores: cachedStores! };
  }

  console.log("📡 Fetching Awin feed...");

  const res = await fetch(FEED_URL);
  if (!res.ok) {
    throw new Error(`Awin feed error: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  let csvText: string;
  try {
    csvText = gunzipSync(buffer).toString("utf-8");
  } catch {
    csvText = buffer.toString("utf-8");
  }

  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  console.log(`📊 Parsed ${records.length} rows from CSV`);

  // Debug: logga 3 rader så vi ser datan
  if (records.length > 0) {
    for (let i = 0; i < Math.min(3, records.length); i++) {
      const r = records[i] as any;
      console.log(`📋 Row ${i}:`, {
        product_name: r.product_name,
        display_price: r.display_price,
        search_price: r.search_price,
        product_price_old: r.product_price_old,
        rrp_price: r.rrp_price,
        saving: r.saving,
        savings_percent: r.savings_percent,
        store_price: r.store_price,
        brand_name: r.brand_name,
        in_stock: r.in_stock,
      });
    }
  }

  const deals = records
    .map((row: any) => {
      // ===== PRISER: display_price = nuvarande, product_price_old = original =====
      const currentPrice = parsePrice(row.display_price)
        || parsePrice(row.search_price)
        || 0;

      const oldPrice = parsePrice(row.product_price_old)
        || parsePrice(row.rrp_price)
        || 0;

      // Rabatt
      let discount = parseFloat(row.savings_percent) || 0;
      if (!discount && oldPrice > currentPrice && currentPrice > 0) {
        discount = Math.round((1 - currentPrice / oldPrice) * 100);
      }

      // Brand
      const brand = row.brand_name || "";

      // Bild: large_image > aw_image_url > merchant_image_url
      const image = row.large_image || row.aw_image_url || row.merchant_image_url || "";

      // Lagerstatus
      const inStock = row.in_stock !== "0" && row.in_stock?.toLowerCase() !== "false";

      return {
        id: row.aw_product_id,
        title: row.product_name || "",
        brand,
        store: row.merchant_name || "",
        price: currentPrice,
        originalPrice: oldPrice > currentPrice ? oldPrice : 0,
        discount: discount > 0 ? `-${Math.round(discount)}%` : "",
        discountNum: discount,
        category: mapCategory(
          row.product_name || "",
          row.merchant_category || "",
          row.merchant_product_category_path || ""
        ),
        image,
        url: row.aw_deep_link || "",
        description: row.product_short_description || row.description || "",
        currency: row.currency || "SEK",
        colour: row.colour || "",
        rating: parseFloat(row.average_rating) || 0,
        inStock,
        hot: discount >= 40,
        firstSeen: row.last_updated || new Date().toISOString(),
      };
    })
    .filter((deal: any) => deal.price > 0 && deal.title && deal.inStock);

  // Sortera: störst rabatt först, sedan billigast
  deals.sort((a: any, b: any) => {
    if (b.discountNum !== a.discountNum) return b.discountNum - a.discountNum;
    return a.price - b.price;
  });

  const categorySet = new Set(deals.map((d: any) => d.category));
  const categories = ["Alla", ...Array.from(categorySet).sort()] as string[];
  const stores = Array.from(new Set(deals.map((d: any) => d.store))).sort() as string[];

  cachedDeals = deals;
  cachedCategories = categories;
  cachedStores = stores;
  lastFetched = now;

  const withDiscount = deals.filter((d: any) => d.discountNum > 0).length;
  console.log(`✅ ${deals.length} deals loaded (${withDiscount} with discount)`);

  return { deals, categories, stores };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const store = searchParams.get("store");

    let { deals, categories, stores } = await fetchDeals();

    if (category && category !== "Alla") {
      deals = deals.filter((d: any) => d.category === category);
    }
    if (store) {
      deals = deals.filter((d: any) => d.store === store);
    }

    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      totalDeals: deals.length,
      categories,
      stores,
      deals,
    });
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch deals", message: String(error) },
      { status: 500 },
    );
  }
}