import type { Tag } from './post';

export interface WikiAuthor {
  user_id: number;
  nickname: string;
  profileImageUrl: string;
  distro: string | null;
}

export interface WikiPage {
  wiki_page_id: number;
  title: string;
  slug: string;
  content: string;
  author_id: number;
  last_edited_by: number | null;
  views_count: number;
  created_at: string;
  updated_at: string | null;
  author: WikiAuthor;
  editor_nickname: string | null;
  tags: Tag[];
}

export interface WikiPageSummary {
  wiki_page_id: number;
  title: string;
  slug: string;
  views_count: number;
  created_at: string;
  updated_at: string | null;
  author: WikiAuthor;
  tags: Tag[];
}

export interface WikiRevision {
  revision_number: number;
  editor: { user_id: number; nickname: string; distro: string | null };
  edit_summary: string;
  created_at: string;
  title?: string;
  content?: string;
  is_current?: boolean;
}

export interface DiffChange {
  type: 'equal' | 'delete' | 'insert';
  content: string;
  old_line?: number;
  new_line?: number;
}

export interface WikiTag {
  id: number;
  name: string;
  description: string | null;
  page_count: number;
}

export interface WikiListResponse {
  wiki_pages: WikiPageSummary[];
  pagination: { offset: number; limit: number; total_count: number; has_more: boolean };
}

export interface WikiDetailResponse {
  wiki_page: WikiPage;
}

export interface WikiHistoryResponse {
  revisions: WikiRevision[];
  total: number;
  offset: number;
  limit: number;
}

export interface WikiRevisionDetailResponse {
  revision: WikiRevision & { title: string; content: string; is_current: boolean };
}

export interface WikiDiffResponse {
  from_revision: number;
  to_revision: number;
  from_title: string;
  to_title: string;
  changes: DiffChange[];
}

export interface WikiCreateResponse {
  wiki_page_id: number;
  slug: string;
}

export interface WikiRollbackResponse {
  new_revision_number: number;
}
