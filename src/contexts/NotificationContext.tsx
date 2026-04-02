import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { api, getAccessToken, API_BASE_URL } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification';
import type { ApiResponse } from '../types/common';

const POLL_ACTIVE = 10_000;
const POLL_INACTIVE = 60_000;
const PAGE_LIMIT = 20;

export interface NotificationContextType {
  unreadCount: number;
  recentNotifications: Notification[];
  notifications: Notification[];
  hasMore: boolean;
  isLoading: boolean;
  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

export const NotificationContext =
  createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const etagRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef(false);
  const offsetRef = useRef(0);

  // ── ETag 기반 unread count 폴링 (fetch 직접 사용) ──

  const pollUnreadCount = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const token = getAccessToken();
      if (!token) return;

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };
      if (etagRef.current) {
        headers['If-None-Match'] = etagRef.current;
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT}/`;
      const res = await fetch(url, { headers, credentials: 'include' });

      if (res.status === 304) return;
      if (!res.ok) return;

      const etag = res.headers.get('ETag');
      if (etag) etagRef.current = etag;

      const json = (await res.json()) as ApiResponse<UnreadCountResponse>;
      setUnreadCount(json.data.unread_count);
    } catch {
      // 폴링 실패 무시
    } finally {
      pollingRef.current = false;
    }
  }, []);

  // ── 가변 주기 폴링 관리 ──

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setPollingRate = useCallback(
    (mode: 'active' | 'inactive' | 'hidden') => {
      clearPolling();
      if (mode === 'hidden') return;
      const ms = mode === 'active' ? POLL_ACTIVE : POLL_INACTIVE;
      intervalRef.current = setInterval(pollUnreadCount, ms);
    },
    [pollUnreadCount, clearPolling],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      clearPolling();
      setUnreadCount(0);
      setRecentNotifications([]);
      setNotifications([]);
      setHasMore(false);
      etagRef.current = null;
      return;
    }

    pollUnreadCount();
    setPollingRate(document.hidden ? 'hidden' : 'active');

    const onVisibility = () => {
      if (document.hidden) {
        setPollingRate('hidden');
      } else {
        pollUnreadCount();
        setPollingRate('active');
      }
    };
    const onFocus = () => {
      pollUnreadCount();
      setPollingRate('active');
    };
    const onBlur = () => setPollingRate('inactive');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);

    return () => {
      clearPolling();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, [isAuthenticated, pollUnreadCount, setPollingRate, clearPolling]);

  // ── WebSocket 실시간 알림 수신 ──

  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = subscribe('notification', () => {
      setUnreadCount((prev) => prev + 1);
      pollUnreadCount();
    });
    return unsub;
  }, [isAuthenticated, subscribe, pollUnreadCount]);

  // ── 알림 목록 조회 ──

  const fetchNotifications = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        if (reset) offsetRef.current = 0;
        const res = await api.get<ApiResponse<NotificationListResponse>>(
          `${API_ENDPOINTS.NOTIFICATIONS.ROOT}?offset=${offsetRef.current}&limit=${PAGE_LIMIT}`,
        );
        const { notifications: fetched, pagination } = res.data;
        if (reset) {
          setNotifications(fetched);
          setRecentNotifications(fetched.slice(0, 5));
        } else {
          setNotifications((prev) => [...prev, ...fetched]);
        }
        offsetRef.current += fetched.length;
        setHasMore(pagination.has_more);
      } catch {
        showToast(UI_MESSAGES.NOTIFICATION_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const fetchMore = useCallback(() => fetchNotifications(false), [fetchNotifications]);

  // ── 읽음 처리 (optimistic) ──

  const markAsRead = useCallback(async (id: number) => {
    // 이미 읽은 알림은 unreadCount 감소 대상에서 제외
    const target = notifications.find((n) => n.notification_id === id);
    const wasUnread = target && !target.is_read;

    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === id ? { ...n, is_read: true } : n,
      ),
    );
    setRecentNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === id ? { ...n, is_read: true } : n,
      ),
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ(id));
    } catch {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: false } : n,
        ),
      );
      setRecentNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === id ? { ...n, is_read: false } : n,
        ),
      );
      if (wasUnread) {
        setUnreadCount((prev) => prev + 1);
      }
      showToast(UI_MESSAGES.NOTIFICATION_READ_FAIL, 'error');
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const prevNotifications = [...notifications];
    const prevRecent = [...recentNotifications];
    const prevCount = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setRecentNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await api.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
      showToast(UI_MESSAGES.NOTIFICATION_ALL_READ);
    } catch {
      setNotifications(prevNotifications);
      setRecentNotifications(prevRecent);
      setUnreadCount(prevCount);
      showToast(UI_MESSAGES.NOTIFICATION_READ_FAIL, 'error');
    }
  }, [notifications, recentNotifications, unreadCount]);

  // ── 삭제 (optimistic) ──

  const deleteNotification = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.notification_id === id);
      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== id),
      );
      setRecentNotifications((prev) =>
        prev.filter((n) => n.notification_id !== id),
      );
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
      } catch {
        setNotifications((prev) => {
          const restored = [...prev];
          if (target) restored.unshift(target);
          return restored;
        });
        setRecentNotifications((prev) => {
          const restored = [...prev];
          if (target && prev.length < 5) restored.unshift(target);
          return restored;
        });
        if (target && !target.is_read) {
          setUnreadCount((prev) => prev + 1);
        }
        showToast(UI_MESSAGES.NOTIFICATION_DELETE_FAIL, 'error');
      }
    },
    [notifications],
  );

  const refreshUnreadCount = pollUnreadCount;

  const value = useMemo(
    () => ({
      unreadCount,
      recentNotifications,
      notifications,
      hasMore,
      isLoading,
      fetchNotifications,
      fetchMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshUnreadCount,
    }),
    [
      unreadCount,
      recentNotifications,
      notifications,
      hasMore,
      isLoading,
      fetchNotifications,
      fetchMore,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshUnreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
