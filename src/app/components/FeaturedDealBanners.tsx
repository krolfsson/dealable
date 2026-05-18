"use client";

export type FeaturedBanner = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  href?: string;
  /** Gradient start → end (theme-aligned) */
  gradientFrom: string;
  gradientTo: string;
};

/** Uppdatera rubrik, underrubrik, emoji och länk när kampanjerna är klara. */
export const FEATURED_BANNERS: FeaturedBanner[] = [
  {
    id: "featured-1",
    emoji: "✨",
    title: "Rubrik kommer snart",
    subtitle: "Underrubrik kommer snart",
    gradientFrom: "#a855f7",
    gradientTo: "#7c3aed",
  },
  {
    id: "featured-2",
    emoji: "🏷️",
    title: "Rubrik kommer snart",
    subtitle: "Underrubrik kommer snart",
    gradientFrom: "#ec4899",
    gradientTo: "#db2777",
  },
  {
    id: "featured-3",
    emoji: "🔥",
    title: "Rubrik kommer snart",
    subtitle: "Underrubrik kommer snart",
    gradientFrom: "#f43f5e",
    gradientTo: "#e11d48",
  },
];

function BannerCard({ banner }: { banner: FeaturedBanner }) {
  const style = {
    background: `linear-gradient(135deg, ${banner.gradientFrom}, ${banner.gradientTo})`,
  } as const;

  const content = (
    <>
      <span className="featured-banner-emoji" aria-hidden>
        {banner.emoji}
      </span>
      <span className="featured-banner-copy">
        <span className="featured-banner-kicker">Begränsad deal</span>
        <span className="featured-banner-title">{banner.title}</span>
        <span className="featured-banner-subtitle">{banner.subtitle}</span>
      </span>
      <span className="featured-banner-chevron" aria-hidden>
        →
      </span>
    </>
  );

  const className = `featured-banner${banner.href ? "" : " featured-banner--placeholder"}`;

  if (banner.href) {
    return (
      <a
        href={banner.href}
        className={className}
        style={style}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

export default function FeaturedDealBanners({
  banners = FEATURED_BANNERS,
}: {
  banners?: FeaturedBanner[];
}) {
  return (
    <section className="featured-banners-section" aria-label="Utvalda kampanjer">
      <div className="featured-banners-grid">
        {banners.map((banner) => (
          <BannerCard key={banner.id} banner={banner} />
        ))}
      </div>
    </section>
  );
}
