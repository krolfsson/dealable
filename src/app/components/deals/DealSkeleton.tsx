export default function DealSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-shimmer" style={{ width: "42%", minWidth: 120 }} />
          <div style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton-shimmer" style={{ height: 10, width: "40%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 14, width: "90%", borderRadius: 6 }} />
            <div className="skeleton-shimmer" style={{ height: 20, width: "50%", borderRadius: 6, marginTop: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
