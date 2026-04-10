import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Cron: Updating deal cache...");

    execSync("npx tsx scripts/update-cache.ts", {
      cwd: process.cwd(),
      stdio: "inherit",
      timeout: 240_000,
    });

    // Läs resultatet
    const { readFileSync } = await import("fs");
    const { join } = await import("path");
    const cachePath = join(process.cwd(), "public", "cache", "deals.json");
    const data = JSON.parse(readFileSync(cachePath, "utf-8"));

    console.log(`✅ Cron: Cached ${data.totalDeals} deals`);

    return NextResponse.json({
      success: true,
      totalDeals: data.totalDeals,
      stores: data.stores,
      timestamp: data.lastUpdated,
    });
  } catch (error) {
    console.error("❌ Cron error:", error);
    return NextResponse.json(
      { error: "Failed to update cache", message: String(error) },
      { status: 500 }
    );
  }
}