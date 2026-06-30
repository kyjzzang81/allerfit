type LoadingSkeletonVariant = "cards" | "grid" | "detail" | "feed";

interface LoadingSkeletonProps {
  variant?: LoadingSkeletonVariant;
  count?: number;
}

export function LoadingSkeleton({
  variant = "cards",
  count = variant === "grid" ? 6 : 3,
}: LoadingSkeletonProps) {
  return (
    <div
      className={`skeleton skeleton--${variant}`}
      aria-label="데이터를 불러오는 중"
      role="status"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton__item" key={index}>
          <span className="skeleton__media" />
          <span className="skeleton__body">
            <span className="skeleton__line skeleton__line--strong" />
            <span className="skeleton__line" />
          </span>
        </div>
      ))}
    </div>
  );
}
