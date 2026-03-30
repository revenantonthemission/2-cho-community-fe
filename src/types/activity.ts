export interface MyPost {
  post_id: number;
  title: string;
  content: string;
  image_url: string | null;
  views_count: number;
  created_at: string;
  updated_at: string | null;
  author: {
    user_id: number;
    nickname: string;
    profile_img: string | null;
    distro: string | null;
  };
  likes_count: number;
  comments_count: number;
}

export interface MyComment {
  comment_id: number;
  content: string;
  created_at: string;
  post_id: number;
  post_title: string;
}

export interface BlockedUser {
  user_id: number;
  nickname: string;
  profile_img: string | null;
  blocked_at: string;
}

export interface FollowUser {
  user_id: number;
  nickname: string;
  profile_img: string | null;
  distro: string | null;
}

export interface MyPostsResponse {
  posts: MyPost[];
  pagination: { total_count: number; has_more: boolean };
}

export interface MyCommentsResponse {
  comments: MyComment[];
  pagination: { total_count: number; has_more: boolean };
}

export interface MyBlocksResponse {
  blocked_users: BlockedUser[];
  pagination: { total_count: number; has_more: boolean };
}

export interface MyFollowResponse {
  users: FollowUser[];
  pagination: { total_count: number; has_more: boolean };
}

export interface BadgeDefinition {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  trigger_type: string;
  trigger_threshold: number;
  points_awarded: number;
  created_at?: string;
}

export interface UserBadge extends BadgeDefinition {
  user_id: number;
  badge_id: number;
  earned_at: string;
}

export interface TrustLevel {
  level: number;
  name: string;
  min_reputation: number;
  description: string;
}

export interface ReputationResponse {
  user_id: number;
  reputation_score: number;
  trust_level: number;
  trust_level_name: string | null;
  trust_level_description: string | null;
  min_reputation: number;
  badge_count: number;
}
