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

interface PollInput {
  question: string;
  options: string[];
  expires_at: string | null;
}

export interface PostFormData {
  title: string;
  content: string;
  category_id: number;
  tags: string[];
  poll?: PollInput;
}

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
  };
  onSubmit: (data: PostFormData) => Promise<void>;
  submitLabel?: string;
  enableDraft?: boolean;
  isEdit?: boolean;
}

export default function PostForm({ initialData, onSubmit, submitLabel = '게시', enableDraft = false, isEdit = false }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? 0);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  // 투표 상태
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiresAt, setPollExpiresAt] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(!enableDraft);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<CategoriesResponse>>(API_ENDPOINTS.CATEGORIES.ROOT);
        setCategories(res.data?.categories ?? []);
      } catch { /* 카테고리 로드 실패 무시 — 폼 보조 데이터 */ }
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
      } catch { /* 서버 임시저장 로드 실패 — localStorage 폴백 */ }

      if (!draft) {
        try {
          const local = localStorage.getItem(DRAFT_KEY);
          if (local) draft = JSON.parse(local) as DraftData;
        } catch { /* localStorage 파싱 실패 무시 — 브라우저 제한 또는 손상된 데이터 */ }
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
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* localStorage 저장 실패 무시 — 용량 초과 또는 브라우저 제한 */ }
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
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* localStorage 삭제 실패 무시 — 브라우저 제한 */ }
    try { await api.delete(API_ENDPOINTS.DRAFTS.ROOT); } catch { /* 서버 임시저장 삭제 실패 무시 — 비핵심 정리 작업 */ }
  }, [enableDraft]);

  function fetchTagSuggestions(query: string) {
    if (tagTimerRef.current) clearTimeout(tagTimerRef.current);
    if (query.length < 1) { setTagSuggestions([]); setShowTagSuggestions(false); return; }
    tagTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get<{ data: { tags: { name: string }[] } }>(
          `${API_ENDPOINTS.TAGS.SEARCH}?search=${encodeURIComponent(query)}`,
        );
        const names = (res.data?.tags ?? []).map((t) => t.name).filter((n) => !tags.includes(n));
        setTagSuggestions(names.slice(0, 5));
        setShowTagSuggestions(names.length > 0);
      } catch { setTagSuggestions([]); /* 태그 자동완성 실패 무시 — 보조 기능 */ }
    }, 200);
  }

  function selectTagSuggestion(name: string) {
    if (!tags.includes(name)) setTags([...tags, name]);
    setTagInput('');
    setShowTagSuggestions(false);
  }

  // 태그 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node)) setShowTagSuggestions(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => { document.removeEventListener('mousedown', handleClick); if (tagTimerRef.current) clearTimeout(tagTimerRef.current); };
  }, []);

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
    const payload: PostFormData = { title: title.trim(), content, category_id: categoryId, tags };
    if (pollEnabled && pollQuestion.trim()) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length >= 2) {
        payload.poll = {
          question: pollQuestion.trim(),
          options: validOptions,
          expires_at: pollExpiresAt || null,
        };
      }
    }
    try {
      await onSubmit(payload);
      await clearDraft();
    } catch {
      showToast('게시글 저장에 실패했습니다.', 'error');
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
          maxLength={26}
          required
        />
      </div>

      <div className="input-group">
        <label>태그</label>
        <div className="tag-input-container" ref={tagContainerRef}>
          <div className="tag-chips">
            {tags.map((tag) => (
              <span key={tag} className="tag-badge">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label="태그 삭제">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => { setTagInput(e.target.value); fetchTagSuggestions(e.target.value); }}
            onKeyDown={handleTagKeyDown}
            placeholder="태그 입력 후 Enter"
          />
          {showTagSuggestions && tagSuggestions.length > 0 && (
            <ul className="search-suggestions">
              {tagSuggestions.map((name) => (
                <li
                  key={name}
                  className="search-suggestion-item"
                  onMouseDown={() => selectTagSuggestion(name)}
                >
                  <span className="suggestion-title">#{name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 투표 섹션 — 새 글 작성 시에만 표시 */}
      {!isEdit && (
        <div className="poll-form-section">
          <label className="poll-toggle">
            <input
              type="checkbox"
              checked={pollEnabled}
              onChange={(e) => setPollEnabled(e.target.checked)}
            />
            투표 추가
          </label>

          {pollEnabled && (
            <div className="poll-form-body">
              <div className="input-group">
                <label htmlFor="poll-question">투표 질문</label>
                <input
                  id="poll-question"
                  type="text"
                  className="input-field"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="질문을 입력하세요"
                  maxLength={200}
                />
              </div>

              <div className="input-group">
                <label>선택지 (2~10개)</label>
                <div className="poll-options-container">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="poll-option-input">
                      <input
                        type="text"
                        className="input-field"
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                        placeholder={`선택지 ${i + 1}`}
                        maxLength={100}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          className="poll-option-remove-btn"
                          onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))}
                          aria-label="선택지 삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {pollOptions.length < 10 && (
                  <button
                    type="button"
                    className="poll-add-option-btn"
                    onClick={() => setPollOptions([...pollOptions, ''])}
                  >
                    + 선택지 추가
                  </button>
                )}
              </div>

              <div className="input-group">
                <label htmlFor="poll-expires">만료 시간 (선택)</label>
                <input
                  id="poll-expires"
                  type="datetime-local"
                  className="input-field"
                  value={pollExpiresAt}
                  onChange={(e) => setPollExpiresAt(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="input-group">
        <label>내용</label>
        <MarkdownEditor value={content} onChange={setContent} />
      </div>

      {(!title.trim() || !content.trim()) && (
        <p className="form-helper">*제목, 내용을 모두 작성해주세요.</p>
      )}

      <div className="write-form__actions">
        {enableDraft && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => { await saveDraft(); showToast('임시저장되었습니다.'); }}
          >
            임시저장
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? '처리 중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
