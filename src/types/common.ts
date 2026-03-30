export interface ApiResponse<T = unknown> {
  code: string;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}
