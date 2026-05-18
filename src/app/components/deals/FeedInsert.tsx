"use client";

import Image from "next/image";
import type { Deal } from "@/lib/scraper";
import { formatDealBadge, formatPrice, parseDiscountValue } from "@/lib/scraper";
import { formatStoreName } from "@/lib/seo";
import type { FeedInsertVariant } from "@/lib/deal-ui";

const LABELS: Record<FeedInsertVariant, { kicker: string; cta: string }> = {
  "best-today": { kicker: "Dagens bästa rabatt", cta: "Se dealen" },
  hero: { kicker: "Utvald för dig", cta: "Shoppa nu" },
  editorial: { kicker: "Redaktörens val", cta: "Upptäck mer" },
};

export default function FeedInsert({
  deal,
  variant,
  onClick,
}: {
  deal: Deal;
  variant: FeedInsertVariant;
  onClick: () => void;
}) {
  const { kicker, cta } = LABELS[variant];
  const img = deal.image || "";
  const discount = formatDealBadge(deal.discount);

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="feed-insert feed-insert--hero"
      onClick={onClick}
    >
      <div className="feed-insert-image">
        {img ? (
          <Image
            src={img}
            alt={deal.title}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized={img.includes("productserve.com")}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              background: "#f5f3ff",
            }}
          >
            ✨
          </div>
        )}
      </div>
      <div className="feed-insert-body">
        <p className="feed-insert-kicker">{kicker}</p>
        <h3 className="feed-insert-title">{deal.title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          {formatStoreName(deal.store)}
          {parseDiscountValue(deal.discount) > 0 ? ` · ${discount}` : ""}
          {deal.price > 0 ? ` · ${formatPrice(deal.price)}` : ""}
        </p>
        <span className="feed-insert-cta">{cta} →</span>
      </div>
    </a>
  );
}
