interface Props {
  lines?: number;
  type?: 'card' | 'text';
}

export default function SkeletonLoader({ lines = 3, type = 'card' }: Props) {
  return (
    <div className="skeleton-loader">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-loader__item skeleton-loader__item--${type}`}>
          {type === 'card' && (
            <>
              <div className="skeleton-loader__line skeleton-loader__line--short" />
              <div className="skeleton-loader__line skeleton-loader__line--long" />
              <div className="skeleton-loader__line skeleton-loader__line--medium" />
            </>
          )}
          {type === 'text' && (
            <div className="skeleton-loader__line skeleton-loader__line--full" />
          )}
        </div>
      ))}
    </div>
  );
}
