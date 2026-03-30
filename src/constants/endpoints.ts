export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/session',
    LOGOUT: '/v1/auth/session',
    REFRESH: '/v1/auth/token/refresh',
    ME: '/v1/auth/me',
  },
  USERS: {
    ROOT: '/v1/users',
    ME: '/v1/users/me',
    PASSWORD: '/v1/users/me/password',
    PROFILE_IMAGE: '/v1/users/profile/image',
  },
  POSTS: {
    ROOT: '/v1/posts',
    IMAGE: '/v1/posts/image',
  },
  CATEGORIES: {
    ROOT: '/v1/categories',
  },
  LIKES: {
    ROOT: (postId: number) => `/v1/posts/${postId}/likes`,
  },
  BOOKMARKS: {
    ROOT: (postId: number) => `/v1/posts/${postId}/bookmark`,
  },
  COMMENTS: {
    ROOT: (postId: number) => `/v1/posts/${postId}/comments`,
    DETAIL: (postId: number, commentId: number) =>
      `/v1/posts/${postId}/comments/${commentId}`,
  },
  COMMENT_LIKES: {
    ROOT: (postId: number, commentId: number) =>
      `/v1/posts/${postId}/comments/${commentId}/like`,
  },
  REPORTS: {
    ROOT: '/v1/reports',
  },
  FOLLOW: {
    FOLLOW: (userId: number) => `/v1/users/${userId}/follow`,
  },
  BLOCKS: {
    BLOCK: (userId: number) => `/v1/users/${userId}/block`,
  },
  REPUTATION: {
    USER: (userId: number) => `/v1/users/${userId}/reputation`,
    USER_BADGES: (userId: number) => `/v1/users/${userId}/badges`,
  },
  NOTIFICATIONS: {
    ROOT: '/v1/notifications',
    UNREAD_COUNT: '/v1/notifications/unread-count',
    READ: (id: number) => `/v1/notifications/${id}/read`,
    READ_ALL: '/v1/notifications/read-all',
    DELETE: (id: number) => `/v1/notifications/${id}`,
  },
  DM: {
    ROOT: '/v1/dms',
    MESSAGES: (id: number) => `/v1/dms/${id}`,
    SEND: (id: number) => `/v1/dms/${id}/messages`,
    READ: (id: number) => `/v1/dms/${id}/read`,
    DELETE_CONVERSATION: (id: number) => `/v1/dms/${id}`,
    DELETE_MESSAGE: (convId: number, msgId: number) => `/v1/dms/${convId}/messages/${msgId}`,
    UNREAD_COUNT: '/v1/dms/unread-count',
  },
  WIKI: {
    ROOT: '/v1/wiki',
    DETAIL: (slug: string) => `/v1/wiki/${slug}`,
    TAGS_POPULAR: '/v1/wiki/tags/popular',
    HISTORY: (slug: string) => `/v1/wiki/${slug}/history`,
    REVISION: (slug: string, n: number) => `/v1/wiki/${slug}/revisions/${n}`,
    DIFF: (slug: string) => `/v1/wiki/${slug}/diff`,
    ROLLBACK: (slug: string, n: number) => `/v1/wiki/${slug}/rollback/${n}`,
  },
  PACKAGES: {
    ROOT: '/v1/packages',
    DETAIL: (id: number) => `/v1/packages/${id}`,
    REVIEWS: (id: number) => `/v1/packages/${id}/reviews`,
    REVIEW_DETAIL: (pkgId: number, reviewId: number) => `/v1/packages/${pkgId}/reviews/${reviewId}`,
  },
} as const;

const IS_LOCAL =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

function deriveWsUrl(): string {
  const host = window.location.hostname;
  if (host === 'my-community.shop') return 'wss://api.my-community.shop/ws';
  const parts = host.split('.');
  return `wss://api-${parts[0]}.${parts.slice(1).join('.')}/ws`;
}

export const WS_URL = import.meta.env.DEV
  ? 'ws://127.0.0.1:8000/ws'
  : IS_LOCAL
    ? `ws://${window.location.host}/ws`
    : deriveWsUrl();
