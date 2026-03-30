export const ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  HOME: '/',
  POST_DETAIL: (id: number | string) => `/detail/${id}`,
  POST_WRITE: '/write',
  POST_EDIT: (id: number | string) => `/edit/${id}`,
  PROFILE: '/edit-profile',
  USER_PROFILE: (id: number | string) => `/user-profile/${id}`,
  NOTIFICATIONS: '/notifications',
} as const;
