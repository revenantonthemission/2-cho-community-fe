export interface DashboardSummary {
  total_users: number;
  total_posts: number;
  total_comments: number;
  today_signups: number;
}

export interface DailyStat {
  date: string;
  signups: number;
  posts: number;
  comments: number;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  daily_stats: DailyStat[];
}

export interface AdminUser {
  user_id: number;
  email: string;
  nickname: string;
  profile_img: string;
  role: 'user' | 'admin';
  suspended_until: string | null;
  suspended_reason: string | null;
  created_at: string;
  email_verified: boolean;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  pagination: { total_count: number; has_more: boolean };
}

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  report_id: number;
  reporter_id: number;
  target_type: 'post' | 'comment';
  target_id: number;
  reason: 'spam' | 'abuse' | 'inappropriate' | 'other';
  description: string | null;
  status: ReportStatus;
  resolved_by: number | null;
  resolved_at: string | null;
  created_at: string;
  reporter_nickname: string;
}

export interface ReportListResponse {
  reports: Report[];
  pagination: { offset: number; limit: number; total_count: number; has_more: boolean };
}
