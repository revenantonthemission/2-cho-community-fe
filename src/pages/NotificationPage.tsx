import { useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import NotificationItem from '../components/NotificationItem';
import LoadingSpinner from '../components/LoadingSpinner';

export default function NotificationPage() {
  const {
    notifications,
    hasMore,
    isLoading,
    unreadCount,
    fetchNotifications,
    fetchMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotification();

  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 페이지 진입 시 목록 초기화
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 무한 스크롤: Intersection Observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading && !loadingRef.current) {
        loadingRef.current = true;
        fetchMore().finally(() => {
          loadingRef.current = false;
        });
      }
    },
    [hasMore, isLoading, fetchMore],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="notification-page">
      <div className="notification-page__header">
        <h1>알림</h1>
        {unreadCount > 0 && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={markAllAsRead}
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {notifications.length === 0 && !isLoading ? (
        <div className="notification-empty">
          <code>$ cat /var/log/notifications</code>
          <br />
          <code>
            cat: /var/log/notifications: No such file or directory
          </code>
          <p>아직 알림이 없습니다</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <NotificationItem
              key={n.notification_id}
              notification={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))}
        </div>
      )}

      {/* 무한 스크롤 감지 영역 */}
      <div ref={observerRef} className="notification-page__sentinel">
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
