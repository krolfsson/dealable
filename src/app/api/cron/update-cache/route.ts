import { NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const isVercelCron = request.headers.get("x-vercel-cron") === "1";
    const authHeader = request.headers.get("authorization");
    const hasSecret =
      typeof process.env.CRON_SECRET === "string" &&
      process.env.CRON_SECRET.length > 0 &&
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // Vercel Cron calls will include `x-vercel-cron: 1`.
    // We also allow an optional Bearer secret for manual triggering.
    if (!isVercelCron && !hasSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deployHookUrl = process.env.DEPLOY_HOOK_URL;
    if (!deployHookUrl) {
      return NextResponse.json(
        { error: "Missing DEPLOY_HOOK_URL" },
        { status: 500 }
      );
    }

    // Runtime file system is read-only on Vercel. The cache lives in `public/cache`
    // and is generated during build (`scripts/update-cache.mjs` runs in `npm run build`).
    // So we trigger a rebuild/deploy instead of trying to write the cache here.
    const res = await fetch(deployHookUrl, { method: "POST" });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Deploy hook failed", status: res.status, body: text },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, triggered: "deploy_hook" });
  } catch (error) {
    console.error("❌ Cron error:", error);
    return NextResponse.json(
      { error: "Failed to update cache", message: String(error) },
      { status: 500 }
    );
  }
}