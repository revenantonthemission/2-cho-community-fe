import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { timeAgo } from '../../utils/formatters';
import StarRating from './StarRating';
import type { PackageSummary } from '../../types/package';

interface Props {
  pkg: PackageSummary;
}

export default function PackageCard({ pkg }: Props) {
  return (
    <Link to={ROUTES.PACKAGE_DETAIL(pkg.package_id)} className="pkg-card">
      <div className="pkg-card__header">
        <h3 className="pkg-card__name">{pkg.display_name}</h3>
        <span className="pkg-card__tech-name">{pkg.name}</span>
      </div>
      <div className="pkg-card__badges">
        <span className="pkg-card__category">{pkg.category}</span>
        {pkg.package_manager && (
          <span className="pkg-card__manager">{pkg.package_manager}</span>
        )}
      </div>
      {pkg.description && (
        <p className="pkg-card__desc">{pkg.description}</p>
      )}
      <div className="pkg-card__footer">
        <div className="pkg-card__rating">
          <StarRating value={Math.round(pkg.avg_rating)} readonly size="sm" />
          <span className="pkg-card__rating-text">
            {pkg.avg_rating.toFixed(1)} ({pkg.reviews_count})
          </span>
        </div>
        <span className="pkg-card__meta">
          {pkg.creator.nickname} · {timeAgo(pkg.created_at)}
        </span>
      </div>
    </Link>
  );
}
