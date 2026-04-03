import { formatDate } from '../utils/formatters';
import type { BadgeDefinition, UserBadge } from '../types/activity';

interface Props {
  badge: BadgeDefinition;
  earned?: UserBadge;
}

export default function BadgeCard({ badge, earned }: Props) {
  return (
    <div className={`badge-card ${earned ? 'badge-card--earned' : 'badge-card--locked'}`}>
      <span className="badge-card__icon">{badge.icon}</span>
      <div className="badge-card__info">
        <h4 className="badge-card__name">{badge.name}</h4>
        <p className="badge-card__desc">{badge.description}</p>
        {earned ? (
          <span className="badge-card__date">
            획득: {formatDate(earned.earned_at)}
          </span>
        ) : (
          <span className="badge-card__threshold">
            조건: {badge.trigger_threshold}
          </span>
        )}
      </div>
    </div>
  );
}
