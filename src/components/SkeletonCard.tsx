export default function SkeletonCard() {
  return (
    <li className="skeleton-card">
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--long" />
      <div className="skeleton-line skeleton-line--medium" />
    </li>
  );
}
