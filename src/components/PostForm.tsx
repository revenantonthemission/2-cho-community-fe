import { useState, useEffect, useRef, useCallback } from 'react';
import MarkdownEditor from './MarkdownEditor';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import type { Category, CategoriesResponse } from '../types/post';
import type { ApiResponse } from '../types/common';

const DRAFT_KEY = 'camp_linux_draft';
const DRAFT_SAVE_INTERVAL = 30000;

interface DraftData {
  title: string;
  content: string;
  category_id: number;
  tags: string[];
  updated_at: string;
}

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
  };
  onSubmit: (data: {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
  }) => Promise<void>;
  submitLabel?: string;
  enableDraft?: boolean;
}

export default function PostForm({ initialData, onSubmit, submitLabel = '게시', enableDraft = false }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? 0);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(!enableDraft);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<CategoriesResponse>>(API_ENDPOINTS.CATEGORIES.ROOT);
        setCategories(res.data?.categories ?? []);
      } catch { /* ignore */ }
    })();
  }, []);

  // 임시저장 로드 (새 글 작성 시만)
  useEffect(() => {
    if (!enableDraft || initialData) { setDraftLoaded(true); return; }
    (async () => {
      let draft: DraftData | null = null;
      try {
        const res = await api.get<ApiResponse<{ draft: DraftData | null }>>(API_ENDPOINTS.DRAFTS.ROOT);
        if (res.data?.draft) draft = res.data.draft;
      } catch { /* 서버 실패 시 localStorage 폴백 */ }

      if (!draft) {
        try {
          const local = localStorage.getItem(DRAFT_KEY);
          if (local) draft = JSON.parse(local) as DraftData;
        } catch { /* ignore */ }
      }

      if (draft && (draft.title || draft.content)) {
        if (window.confirm('이전에 작성 중이던 내용이 있습니다. 복원하시겠습니까?')) {
          setTitle(draft.title ?? '');
          setContent(draft.content ?? '');
          if (draft.category_id) setCategoryId(draft.category_id);
          if (draft.tags) setTags(draft.tags);
        }
      }
      setDraftLoaded(true);
    })();
  }, [enableDraft, initialData]);

  // ref로 최신 폼 데이터를 추적 — saveDraft의 의존성을 제거하여 타이머 리셋 방지
  const draftDataRef = useRef({ title, content, categoryId, tags });
  useEffect(() => {
    draftDataRef.current = { title, content, categoryId, tags };
  }, [title, content, categoryId, tags]);

  // 임시저장 함수 — ref에서 최신 데이터를 읽으므로 의존성이 안정적
  const saveDraft = useCallback(async () => {
    if (!enableDraft) return;
    const { title: t, content: c, categoryId: cat, tags: tg } = draftDataRef.current;
    const data: DraftData = {
      title: t, content: c, category_id: cat, tags: tg,
      updated_at: new Date().toISOString(),
    };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* ignore */ }
    try {
      await api.put(API_ENDPOINTS.DRAFTS.ROOT, {
        title: t || null, content: c || null, category_id: cat || null,
      });
    } catch { /* 서버 실패 시 무시 — localStorage에 이미 저장됨 */ }
  }, [enableDraft]);

  // 30초 간격 자동 저장 — draftLoaded 후 한 번만 설정
  useEffect(() => {
    if (!enableDraft || !draftLoaded) return;
    const interval = setInterval(saveDraft, DRAFT_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [enableDraft, draftLoaded, saveDraft]);

  // 임시저장 삭제
  const clearDraft = useCallback(async () => {
    if (!enableDraft) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    try { await api.delete(API_ENDPOINTS.DRAFTS.ROOT); } catch { /* ignore */ }
  }, [enableDraft]);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) return;
    setIsSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), content, category_id: categoryId, tags });
      await clearDraft();
    } catch {
      // 에러 처리는 호출자에서 수행
    } finally {
      setIsSubmitting(false);
    }
  }

  const isValid = title.trim() && content.trim() && categoryId > 0;

  return (
    <form onSubmit={handleSubmit} className="write-form">
      <div className="input-group">
        <label htmlFor="category-select">카테고리</label>
        <select
          id="category-select"
          className="category-select"
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          required
        >
          <option value={0} disabled>카테고리를 선택하세요</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="input-group">
        <label htmlFor="post-title">제목</label>
        <input
          id="post-title"
          type="text"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          required
        />
      </div>

      <div className="input-group">
        <label>태그</label>
        <div className="tag-input-container">
          <div className="tag-chips">
            {tags.map((tag) => (
              <span key={tag} className="tag-badge">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그 입력 후 Enter"
          />
        </div>
      </div>

      <div className="input-group">
        <label>내용</label>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      <div className="write-form__actions">
        {enableDraft && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => { saveDraft(); showToast('임시저장되었습니다.'); }}
          >
            임시저장
          </button>
        )}
        <button
          type="submit"
          className="write-submit-btn"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? '처리 중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
