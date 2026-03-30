export interface ApiResponse<T = unknown> {
  code: string;
  message: string;
  data: T;
}

export interface Pagination {
  offset: number;
  limit: number;
  total_count: number;
  has_more: boolean;
}

export interface PostListResponse {
  posts: import('./post').Post[];
  pagination: Pagination;
}

export type { PostDetailResponse } from './post';
