import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import WikiTOC from '../../components/wiki/WikiTOC';
import LoadingSpinner from '../../components/LoadingSpinner';
import { timeAgo } from '../../utils/formatters';
import type { ApiResponse } from '../../types/common';
import type { WikiDetailResponse } from '../../types/wiki';

// TOC 앵커 링크를 위한 heading ID + 문법 강조 포함 Marked 인스턴스
const wikiMarked = new Marked({
  renderer: {
    heading({ text, depth }: { text: string; depth: number }) {
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang && hljs.getLanguage(lang) ? lang : undefined;
      const highlighted = language
        ? hljs.highlight(text, { language }).value
        : hljs.highlightAuto(text).value;
      return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>`;
    },
  },
});

export default function WikiDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [page, setPage] = useState<WikiDetailResponse['wiki_page'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get<ApiResponse<WikiDetailResponse>>(
          API_ENDPOINTS.WIKI.DETAIL(slug),
        );
        setPage(res.data.wiki_page);
      } catch {
        setError('위키 페이지를 찾을 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug]);

  // DOMPurify에 id 속성 허용 — TOC 앵커 링크 동작에 필요
  const htmlWithIds = useMemo(() => {
    if (!page) return '';
    const raw = wikiMarked.parse(page.content, { async: false }) as string;
    return DOMPurify.sanitize(raw, { ADD_ATTR: ['id'] });
  }, [page]);

  async function handleDelete() {
    if (!slug || !confirm('위키 페이지를 삭제하시겠습니까?')) return;
    try {
      await api.delete(API_ENDPOINTS.WIKI.DETAIL(slug));
      showToast(UI_MESSAGES.WIKI_DELETE_SUCCESS);
      navigate(ROUTES.WIKI);
    } catch {
      showToast(UI_MESSAGES.WIKI_DELETE_FAIL, 'error');
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (error || !page) {
    return (
      <div className="wiki-not-found">
        <p>{error || '페이지를 찾을 수 없습니다.'}</p>
        <Link to={ROUTES.WIKI}>위키 목록으로</Link>
      </div>
    );
  }

  const canDelete = user && (user.id === page.author_id || user.role === 'admin');

  return (
    <div className="wiki-detail">
      <div className="wiki-detail__header">
        <h1>{page.title}</h1>
        <div className="wiki-detail__meta">
          <span>작성: {page.author.nickname}</span>
          {page.author.distro && <span className="distro-badge">{page.author.distro}</span>}
          <span>· {timeAgo(page.created_at)}</span>
          {page.editor_nickname && (
            <span>· 최종 편집: {page.editor_nickname} ({timeAgo(page.updated_at ?? page.created_at)})</span>
          )}
          <span>· 👁 {page.views_count}</span>
        </div>
        {page.tags.length > 0 && (
          <div className="wiki-detail__tags">
            {page.tags.map((tag) => (
              <Link key={tag.id} to={`${ROUTES.WIKI}?tag=${tag.name}`} className="tag-badge">
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
        <div className="wiki-detail__actions">
          <Link to={ROUTES.WIKI_HISTORY(page.slug)} className="btn btn-secondary btn-sm">편집 기록</Link>
          <Link to={ROUTES.WIKI_EDIT(page.slug)} className="btn btn-secondary btn-sm">페이지 수정</Link>
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>페이지 삭제</button>
          )}
        </div>
      </div>

      <div className="wiki-detail__body">
        <WikiTOC html={htmlWithIds} />
        {/* DOMPurify.sanitize()로 정제된 HTML — XSS 안전 */}
        <div
          className="markdown-body wiki-detail__content"
          dangerouslySetInnerHTML={{ __html: htmlWithIds }}
        />
      </div>
    </div>
  );
}
