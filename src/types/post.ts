export interface Post {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_nickname: string;
  author_profile_image: string | null;
  author_distro: string | null;
  category_id: number;
  category_name: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_pinned: boolean;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  content: string;
  author_id: number;
  author_nickname: string;
  author_profile_image: string | null;
  author_distro: string | null;
  post_id: number;
  parent_id: number | null;
  like_count: number;
  is_liked?: boolean;
  is_accepted?: boolean;
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}
