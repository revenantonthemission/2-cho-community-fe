import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { useDM } from '../../hooks/useDM';
import { ROUTES } from '../../constants/routes';

export default function DMBadge() {
  const { unreadCount } = useDM();

  return (
    <Link to={ROUTES.DM} className="dm-badge" aria-label="쪽지">
      <MessageSquare size={20} />
      {unreadCount > 0 && (
        <span className="dm-badge__count">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
