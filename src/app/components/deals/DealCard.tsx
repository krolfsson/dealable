"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Deal } from "@/lib/scraper";
import {
  formatDealBadge,
  formatPrice,
  getHiResImage,
  parseDiscountValue,
} from "@/lib/scraper";

function formatSaving(price: number, originalPrice: number): string | null {
  if (!originalPrice || !price || originalPrice <= price) return null;
  const saving = Math.round(originalPrice - price);
  if (saving < 10) return null;
  return `Spara ${saving.toLocaleString("sv-SE")} kr`;
}
import { getDealTrustSignals, type DealTrustSignals } from "@/lib/deal-ui";
import { formatStoreName } from "@/lib/seo";

function buildImageAttemptList(deal: Deal): string[] {
  const raw = [deal.image, ...(deal.imageFallbacks || [])]
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();

  for (const url of raw) {
    const hi = getHiResImage(url, 1200, 1200);
    for (const candidate of hi === url ? [url] : [hi, url]) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      out.push(candidate);
    }
  }

  return out;
}

function DealCardImage({
  deal,
  placeholderEmoji,
}: {
  deal: Deal;
  placeholderEmoji: string;
}) {
  const attempts = useMemo(() => buildImageAttemptList(deal), [deal]);
  const [idx, setIdx] = useState(0);
  const src = attempts[idx] || "";
  const unoptimized =
    src.includes("productserve.com") ||
    src.includes("res.cloudinary.com") ||
    src.includes("ellosgroup.com");
  const referrerPolicy = src.includes("productserve.com") ? "no-referrer" : undefined;

  if (!src) {
    return <PlaceholderImage emoji={placeholderEmoji} />;
  }

  return (
    <Image
      key={src}
      src={src}
      alt={deal.title}
      fill
      sizes="(max-width: 640px) 45vw, 280px"
      quality={75}
      unoptimized={unoptimized}
      referrerPolicy={referrerPolicy}
      style={{ objectFit: "cover" }}
      onError={() => {
        setIdx((i) => (i + 1 < attempts.length ? i + 1 : i));
      }}
    />
  );
}

function PlaceholderImage({ emoji }: { emoji: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f3ff",
        color: "#c4b5fd",
        fontSize: 40,
      }}
    >
      {emoji}
    </div>
  );
}

function TrustMeta({
  signals,
  showUpdated,
}: {
  signals: DealTrustSignals;
  showUpdated: boolean;
}) {
  return (
    <div className="card-meta">
      {signals.verifiedToday && (
        <span className="card-pill card-pill--trust">✓ Verifierad idag</span>
      )}
      {showUpdated && signals.updatedLabel && (
        <span className="card-pill">{signals.updatedLabel}</span>
      )}
      {signals.urgency === "few_left" && (
        <span className="card-pill card-pill--urgent">Få kvar</span>
      )}
      {signals.urgency === "ending_soon" && (
        <span className="card-pill card-pill--urgent">Slutar snart</span>
      )}
    </div>
  );
}

export default function DealCard({
  deal,
  storeEmoji,
  feedUpdatedAt,
  trendingKeys,
  onOutboundClick,
}: {
  deal: Deal;
  storeEmoji: string;
  feedUpdatedAt: string;
  trendingKeys: Set<string>;
  onOutboundClick: () => void;
}) {
  const signals = getDealTrustSignals(deal, feedUpdatedAt, {
    trending: trendingKeys.has(`${deal.store}|${deal.id}`),
  });
  const discountPct = parseDiscountValue(deal.discount);
  const badge = formatDealBadge(deal.discount);
  const isPercent = discountPct > 0;
  const saving = formatSaving(deal.price, deal.originalPrice);

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="deal-link"
      onClick={onOutboundClick}
    >
      <article className="deal-card">
        <div className="card-image">
          <div className="card-image-zoom">
            <DealCardImage deal={deal} placeholderEmoji={storeEmoji} />
          </div>
          <span
            className={`card-badge ${isPercent ? "card-badge--percent" : "card-badge--hot"}`}
          >
            {badge}
          </span>
          {signals.trending && <span className="card-trending">🔥 Trendar</span>}
        </div>

        <div className="card-info">
          <p className="card-store-line">{formatStoreName(deal.store)}</p>
          <h3 className="card-title">{deal.title}</h3>

          {(deal.price > 0 || deal.originalPrice > 0) && (
            <div className="card-price-row">
              {deal.price > 0 && (
                <span className="card-price">{formatPrice(deal.price)}</span>
              )}
              {deal.originalPrice > 0 && deal.originalPrice !== deal.price && (
                <span className="card-original">{formatPrice(deal.originalPrice)}</span>
              )}
              {saving && (
                <span className="card-saving">{saving}</span>
              )}
            </div>
          )}

          <TrustMeta signals={signals} showUpdated={!signals.verifiedToday} />

          <span className="card-cta">Se deal →</span>
        </div>
      </article>
    </a>
  );
}
