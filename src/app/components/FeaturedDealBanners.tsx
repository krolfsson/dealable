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

export const FEATURED_BANNERS: FeaturedBanner[] = [
  {
    id: "featured-1",
    emoji: "🛋️",
    title: "Uteveckor hos Jotex",
    subtitle: "Upp till 30% rabatt!",
    href: "https://www.awin1.com/cread.php?awinmid=9961&awinaffid=2845402&campaign=&ued=https%3A%2F%2Fwww.jotex.se%2F",
    gradientFrom: "#ea580c",
    gradientTo: "#c2410c",
  },
  {
    id: "featured-2",
    emoji: "⛰️",
    title: "Outdoor weeks hos Outnorth",
    subtitle: "Upp till 25%!",
    href: "https://www.awin1.com/cread.php?awinmid=18619&awinaffid=2845402&campaign=&ued=https%3A%2F%2Fwww.outnorth.com%2Fse%2Fkampanjer%2Foutdoor-weeks",
    gradientFrom: "#059669",
    gradientTo: "#047857",
  },
  {
    id: "featured-3",
    emoji: "📱",
    title: "20% på Samsung Galaxy",
    subtitle: "Kod ENTERTHEGALAXY · gäller t.o.m. söndag!",
    href: "https://www.awin1.com/cread.php?awinmid=21710&awinaffid=2845402&campaign=&ued=https%3A%2F%2Fwww.samsung.com%2Fse%2F",
    gradientFrom: "#1428a0",
    gradientTo: "#0a1628",
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
