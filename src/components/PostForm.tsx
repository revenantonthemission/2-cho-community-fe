import { useState, useEffect } from 'react';
import MarkdownEditor from './MarkdownEditor';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { Category } from '../types/post';
import type { ApiResponse } from '../types/common';

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
}

export default function PostForm({ initialData, onSubmit, submitLabel = '게시' }: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? 0);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<Category[]>>(API_ENDPOINTS.CATEGORIES.ROOT);
        setCategories(res.data ?? []);
      } catch { /* ignore */ }
    })();
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
    try {
      await onSubmit({ title: title.trim(), content, category_id: categoryId, tags });
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
            <option key={cat.id} value={cat.id}>{cat.name}</option>
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

      <button
        type="submit"
        className="write-submit-btn"
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? '처리 중...' : submitLabel}
      </button>
    </form>
  );
}
