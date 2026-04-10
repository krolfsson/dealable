import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cachePath = join(process.cwd(), "public", "cache", "deals.json");

    if (!existsSync(cachePath)) {
      return NextResponse.json(
        { error: "Cache not found" },
        { status: 404 }
      );
    }

    const data = JSON.parse(readFileSync(cachePath, "utf-8"));

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error reading cache:", error);
    return NextResponse.json(
      { error: "Failed to read cache", message: String(error) },
      { status: 500 }
    );
  }
}