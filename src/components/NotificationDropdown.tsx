import { useEffect, useState, useRef, useCallback } from 'react';
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

  const [activeIndex, setActiveIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  // 드롭다운 열릴 때 최근 알림 갱신
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 열릴 때 첫 항목에 포커스
  useEffect(() => {
    if (recentNotifications.length > 0) {
      setActiveIndex(0);
    }
  }, [recentNotifications]);

  // activeIndex 변경 시 해당 요소에 포커스
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
      items[activeIndex]?.focus();
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = recentNotifications.length;
      if (count === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % count);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + count) % count);
          break;
        case 'Enter': {
          e.preventDefault();
          if (activeIndex >= 0 && listRef.current) {
            const items = listRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]');
            // NotificationItem 내부의 button을 클릭
            const btn = items[activeIndex]?.querySelector<HTMLElement>('button');
            btn?.click();
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [recentNotifications.length, activeIndex, onClose],
  );

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

      <div
        ref={listRef}
        className="notification-dropdown__list"
        role="menu"
        aria-label="알림 목록"
        onKeyDown={handleKeyDown}
      >
        {recentNotifications.length === 0 ? (
          <div className="notification-dropdown__empty"><code>$ notify --list</code><br />알림이 없습니다</div>
        ) : (
          recentNotifications.map((n, i) => (
            <div
              key={n.notification_id}
              role="menuitem"
              tabIndex={i === activeIndex ? 0 : -1}
            >
              <NotificationItem
                notification={n}
                onRead={markAsRead}
                compact
              />
            </div>
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
