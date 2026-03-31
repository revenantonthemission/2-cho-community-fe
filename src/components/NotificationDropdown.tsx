import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { ROUTES } from '../constants/routes';
import NotificationItem from './NotificationItem';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const {
    recentNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  // 드롭다운 열릴 때 최근 알림 갱신
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  async function handleMarkAllRead() {
    await markAllAsRead();
  }

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown__header">
        <span className="notification-dropdown__title">알림</span>
        {unreadCount > 0 && (
          <button
            className="notification-dropdown__mark-all"
            onClick={handleMarkAllRead}
          >
            모두 읽음
          </button>
        )}
      </div>

      <div className="notification-dropdown__list">
        {recentNotifications.length === 0 ? (
          <div className="notification-dropdown__empty"><code>$ notify --list</code><br />알림이 없습니다</div>
        ) : (
          recentNotifications.map((n) => (
            <NotificationItem
              key={n.notification_id}
              notification={n}
              onRead={markAsRead}
              compact
            />
          ))
        )}
      </div>

      <Link
        to={ROUTES.NOTIFICATIONS}
        className="notification-dropdown__footer"
        onClick={onClose}
      >
        전체 알림 보기 →
      </Link>
    </div>
  );
}
