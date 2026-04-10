import { NextResponse } from "next/server";
import { readFileSync, existsSync, statSync } from "fs";
import { join } from "path";

const CACHE_PATH = join(process.cwd(), "public", "cache", "deals.json");

let memoryCache: any = null;
let memoryCacheMtime = 0;

function loadCache() {
  if (!existsSync(CACHE_PATH)) return null;

  const mtime = statSync(CACHE_PATH).mtimeMs;

  if (memoryCache && memoryCacheMtime === mtime) {
    return memoryCache;
  }

  const raw = readFileSync(CACHE_PATH, "utf-8");
  memoryCache = JSON.parse(raw);
  memoryCacheMtime = mtime;
  return memoryCache;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const store = searchParams.get("store");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "60", 10);
    const search = searchParams.get("q")?.toLowerCase() || "";
    const minDiscount = parseInt(searchParams.get("minDiscount") || "0", 10);

    const data = loadCache();

    if (!data) {
      return NextResponse.json(
        {
          error: "Cache not ready",
          message: "Kör: npx tsx scripts/update-cache.ts",
          lastUpdated: new Date().toISOString(),
          totalDeals: 0,
          totalPages: 0,
          page: 1,
          stores: [],
          deals: [],
        },
        { status: 503 }
      );
    }

    let filtered = data.deals;

    // Butik-filter
    if (store && store !== "Alla") {
      filtered = filtered.filter((d: any) => d.store === store);
    }

    // Sök-filter
    if (search) {
      filtered = filtered.filter(
        (d: any) =>
          d.title.toLowerCase().includes(search) ||
          d.brand.toLowerCase().includes(search) ||
          d.store.toLowerCase().includes(search) ||
          d.category.toLowerCase().includes(search)
      );
    }

    // Rabatt-filter
    if (minDiscount > 0) {
      filtered = filtered.filter((d: any) => d.discountNum >= minDiscount);
    }

    const totalDeals = filtered.length;
    const totalPages = Math.ceil(totalDeals / limit);
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    // Trimma bort onödiga fält
    const trimmed = paged.map((d: any) => ({
      id: d.id,
      title: d.title,
      brand: d.brand,
      store: d.store,
      price: d.price,
      originalPrice: d.originalPrice,
      discount: d.discount,
      discountNum: d.discountNum,
      category: d.category,
      image: d.image,
      url: d.url,
      hot: d.hot,
      firstSeen: d.firstSeen,
    }));

    return NextResponse.json(
      {
        lastUpdated: data.lastUpdated,
        totalDeals,
        totalPages,
        page,
        stores: data.stores,
        deals: trimmed,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to load deals",
        message: String(error),
        lastUpdated: new Date().toISOString(),
        totalDeals: 0,
        totalPages: 0,
        page: 1,
        stores: [],
        deals: [],
      },
      { status: 500 }
    );
  }
}