export type NotificationType =
  | 'comment'
  | 'like'
  | 'mention'
  | 'follow'
  | 'bookmark'
  | 'reply'
  | 'badge_earned'
  | 'level_up';

export interface NotificationActor {
  user_id: number;
  nickname: string;
  profileImageUrl: string;
  distro: string | null;
}

export interface Notification {
  notification_id: number;
  type: NotificationType;
  post_id: number | null;
  comment_id: number | null;
  is_read: boolean;
  created_at: string;
  actor: NotificationActor;
  post_title: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  pagination: {
    total_count: number;
    has_more: boolean;
  };
}

export interface UnreadCountResponse {
  unread_count: number;
  latest: {
    notification_id: number;
    type: NotificationType;
    post_id: number | null;
    comment_id: number | null;
    created_at: string;
    actor_nickname: string;
    post_title: string;
  } | null;
}
