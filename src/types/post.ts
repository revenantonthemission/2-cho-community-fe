export interface Tag {
  id: number;
  name: string;
}

export interface PostAuthor {
  user_id: number;
  nickname: string;
  profileImageUrl: string;
  distro: string | null;
}

export interface Post {
  post_id: number;
  title: string;
  content: string;
  image_url: string | null;
  views_count: number;
  created_at: string;
  updated_at: string | null;
  author: PostAuthor;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  category_id: number;
  category_name: string;
  bookmarks_count: number;
  is_solved: boolean;
  tags: Tag[];
  is_read: boolean;
  is_watching: boolean;
  // 상세 페이지 전용 필드
  accepted_answer_id?: number | null;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  is_blocked?: boolean;
  image_urls?: string[];
  poll?: Poll | null;
}

export interface PollOption {
  option_id: number;
  option_text: string;
  sort_order: number;
  vote_count: number;
}

export interface Poll {
  poll_id: number;
  question: string;
  expires_at: string | null;
  is_expired: boolean;
  options: PollOption[];
  total_votes: number;
  my_vote: number | null;
}

export interface PostDetailResponse {
  post: Post;
  comments: Comment[];
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
  category_id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface CategoriesResponse {
  categories: Category[];
}
