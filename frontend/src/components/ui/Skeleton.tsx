interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({
  className = "",
  width,
  height,
  borderRadius,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton className="skeleton-image" />
      <div className="skeleton-body">
        <Skeleton height="1.2rem" width="70%" borderRadius="4px" />
        <Skeleton height="0.9rem" width="50%" borderRadius="4px" />
        <Skeleton height="0.9rem" width="40%" borderRadius="4px" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton width="48px" height="48px" borderRadius="50%" />
          <div className="skeleton-list-text">
            <Skeleton height="1rem" width="60%" borderRadius="4px" />
            <Skeleton height="0.8rem" width="40%" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
