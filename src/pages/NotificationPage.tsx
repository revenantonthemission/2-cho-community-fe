import { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import NotificationItem from '../components/NotificationItem';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { showToast } from '../utils/toast';

interface NotificationSettings {
  post_reply: boolean;
  comment_reply: boolean;
  mention: boolean;
  follow: boolean;
  like: boolean;
  system: boolean;
  email_digest: 'daily' | 'weekly' | 'off';
}

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // 페이지 진입 시 목록 초기화
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // 알림 설정 로드
  async function loadSettings() {
    if (settings) { setSettingsOpen(true); return; }
    try {
      const res = await api.get<{ data: NotificationSettings }>('/v1/notifications/settings');
      setSettings(res.data);
      setSettingsOpen(true);
    } catch {
      showToast('알림 설정을 불러오지 못했습니다.', 'error');
    }
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await api.patch('/v1/notifications/settings', settings);
      showToast('알림 설정이 저장되었습니다.');
      setSettingsOpen(false);
    } catch {
      showToast('알림 설정 저장에 실패했습니다.', 'error');
    } finally {
      setSavingSettings(false);
    }
  }

  function toggleSetting(key: keyof Omit<NotificationSettings, 'email_digest'>) {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  }

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
        <div className="notification-page__actions">
          {unreadCount > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={markAllAsRead}
            >
              모두 읽음 처리
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadSettings}
          >
            {settingsOpen ? '설정 닫기' : '알림 설정'}
          </button>
        </div>
      </div>

      {settingsOpen && settings && (
        <div className="notification-settings">
          <h3>알림 설정</h3>
          <div className="notification-settings__list">
            {([
              ['post_reply', '내 게시글에 댓글'],
              ['comment_reply', '내 댓글에 답글'],
              ['mention', '멘션 (@)'],
              ['follow', '새 팔로워'],
              ['like', '좋아요'],
              ['system', '시스템 알림'],
            ] as const).map(([key, label]) => (
              <label key={key} className="notification-settings__item">
                <input
                  type="checkbox"
                  checked={settings[key]}
                  onChange={() => toggleSetting(key)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="notification-settings__digest">
            <label>이메일 다이제스트</label>
            <select
              value={settings.email_digest}
              onChange={(e) => setSettings({ ...settings, email_digest: e.target.value as NotificationSettings['email_digest'] })}
            >
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="off">받지 않음</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={saveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? '저장 중...' : '설정 저장'}
          </button>
        </div>
      )}

      {notifications.length === 0 && !isLoading ? (
        <div className="empty-state notification-empty">
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
