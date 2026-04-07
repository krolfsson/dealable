import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { DealsData } from "@/lib/scraper";

export const dynamic = "force-static";
export const revalidate = 7200; // Revalidate every 2 hours

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "deals.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const data: DealsData = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { lastUpdated: new Date().toISOString(), deals: [] },
      { status: 500 }
    );
  }
}