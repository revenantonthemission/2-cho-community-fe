import { useState } from 'react';
import MarkdownEditor from '../MarkdownEditor';

interface WikiFormData {
  title: string;
  slug?: string;
  content: string;
  tags: string;
  edit_summary: string;
}

interface Props {
  initialData?: {
    title: string;
    content: string;
    tags: string[];
    edit_summary?: string;
  };
  showSlug?: boolean;
  onSubmit: (data: WikiFormData) => Promise<void>;
  submitLabel: string;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function WikiForm({ initialData, showSlug = false, onSubmit, submitLabel }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') ?? '');
  const [editSummary, setEditSummary] = useState(
    initialData?.edit_summary ?? (showSlug ? '초기 작성' : ''),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2 || content.trim().length < 10) return;
    if (showSlug && !SLUG_REGEX.test(slug)) {
      setSlugError('슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: WikiFormData = {
        title: title.trim(),
        content: content.trim(),
        tags: tags.trim(),
        edit_summary: editSummary.trim() || '수정',
      };
      if (showSlug) data.slug = slug.trim();
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="wiki-form">
      <div className="input-group">
        <label htmlFor="wiki-title">제목</label>
        <input id="wiki-title" className="input-field" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="위키 페이지 제목" minLength={2} maxLength={200} required />
      </div>
      {showSlug && (
        <div className="input-group">
          <label htmlFor="wiki-slug">슬러그 (URL)</label>
          <input id="wiki-slug" className="input-field" type="text" value={slug}
            onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugError(''); }}
            placeholder="my-wiki-page" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
          {slugError && <p className="error-msg">{slugError}</p>}
          <p className="input-hint">소문자, 숫자, 하이픈만 사용 가능</p>
        </div>
      )}
      <div className="input-group">
        <label htmlFor="wiki-tags">태그 (콤마로 구분)</label>
        <input id="wiki-tags" className="input-field" type="text" value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="linux, kernel, guide" />
      </div>
      <div className="input-group">
        <label>내용</label>
        <MarkdownEditor value={content} onChange={setContent}
          placeholder="위키 내용을 작성하세요 (마크다운 지원, 최소 10자)" />
      </div>
      <div className="input-group">
        <label htmlFor="wiki-summary">편집 요약</label>
        <input id="wiki-summary" className="input-field" type="text" value={editSummary}
          onChange={(e) => setEditSummary(e.target.value)}
          placeholder="변경 사항을 간략히 설명하세요" maxLength={500} required />
      </div>
      <button type="submit" className="btn btn-primary"
        disabled={isSubmitting || title.trim().length < 2 || content.trim().length < 10}>
        {isSubmitting ? '처리 중...' : submitLabel}
      </button>
    </form>
  );
}
