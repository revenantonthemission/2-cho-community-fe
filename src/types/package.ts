export interface PackageCreator {
  user_id: number;
  nickname: string;
  profileImageUrl: string;
  distro: string | null;
}

export type PackageCategory =
  | 'editor' | 'terminal' | 'devtool' | 'system'
  | 'desktop' | 'utility' | 'multimedia' | 'security';

export const PACKAGE_CATEGORIES: { value: PackageCategory; label: string }[] = [
  { value: 'editor', label: '에디터' },
  { value: 'terminal', label: '터미널' },
  { value: 'devtool', label: '개발 도구' },
  { value: 'system', label: '시스템' },
  { value: 'desktop', label: '데스크톱' },
  { value: 'utility', label: '유틸리티' },
  { value: 'multimedia', label: '멀티미디어' },
  { value: 'security', label: '보안' },
];

export interface PackageSummary {
  package_id: number;
  name: string;
  display_name: string;
  description: string | null;
  homepage_url: string | null;
  category: PackageCategory;
  package_manager: string | null;
  created_at: string;
  creator: PackageCreator;
  avg_rating: number;
  reviews_count: number;
}

export interface PackageDetail {
  package_id: number;
  name: string;
  display_name: string;
  description: string | null;
  homepage_url: string | null;
  category: PackageCategory;
  package_manager: string | null;
  created_by: number;
  created_at: string;
  updated_at: string | null;
  reviews_count: number;
}

export interface PackageReview {
  review_id: number;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  author: PackageCreator;
}

export interface PackageListResponse {
  packages: PackageSummary[];
  pagination: { offset: number; limit: number; total_count: number; has_more: boolean };
}

export interface ReviewListResponse {
  reviews: PackageReview[];
  pagination: { offset: number; limit: number; total_count: number; has_more: boolean };
}
