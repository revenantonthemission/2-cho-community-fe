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
} as const;
