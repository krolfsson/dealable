import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 min timeout
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Skydda så bara Vercel Cron kan anropa
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Cron: Updating deal cache...");

    // Dynamiskt importera och köra scrapern
    const { scrapeAllStores } = await import("@/lib/scraper");
    const { writeFileSync, mkdirSync } = await import("fs");
    const { join } = await import("path");

    const deals = await scrapeAllStores();

    const stores = [...new Set(deals.map((d) => d.store))];
    const cacheData = {
      lastUpdated: new Date().toISOString(),
      totalDeals: deals.length,
      stores,
      deals: deals.sort((a, b) => b.discountNum - a.discountNum),
    };

    const cacheDir = join(process.cwd(), "public", "cache");
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(
      join(cacheDir, "deals.json"),
      JSON.stringify(cacheData)
    );

    console.log(`✅ Cron: Cached ${deals.length} deals`);

    return NextResponse.json({
      success: true,
      totalDeals: deals.length,
      stores,
      timestamp: cacheData.lastUpdated,
    });
  } catch (error) {
    console.error("❌ Cron error:", error);
    return NextResponse.json(
      { error: "Failed to update cache", message: String(error) },
      { status: 500 }
    );
  }
}