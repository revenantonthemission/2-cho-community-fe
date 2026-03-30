import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import MarkdownRenderer from '../../components/MarkdownRenderer';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { WikiRevisionDetailResponse, WikiRollbackResponse } from '../../types/wiki';

export default function WikiRevisionPage() {
  const { slug, n } = useParams<{ slug: string; n: string }>();
  const navigate = useNavigate();
  const [revision, setRevision] = useState<WikiRevisionDetailResponse['revision'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || !n) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<WikiRevisionDetailResponse>>(
          API_ENDPOINTS.WIKI.REVISION(slug, Number(n)),
        );
        setRevision(res.data.revision);
      } catch {
        showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
        navigate(ROUTES.WIKI_HISTORY(slug));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug, n, navigate]);

  async function handleRollback() {
    if (!slug || !n || !confirm('이 리비전으로 롤백하시겠습니까?')) return;
    try {
      await api.post<ApiResponse<WikiRollbackResponse>>(
        API_ENDPOINTS.WIKI.ROLLBACK(slug, Number(n)),
        {},
      );
      showToast(UI_MESSAGES.WIKI_ROLLBACK_SUCCESS);
      navigate(ROUTES.WIKI_DETAIL(slug));
    } catch {
      showToast(UI_MESSAGES.WIKI_ROLLBACK_FAIL, 'error');
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!revision) return null;

  return (
    <div className="wiki-revision">
      {!revision.is_current && (
        <div className="wiki-revision__warning">
          이전 버전을 보고 있습니다 (리비전 #{revision.revision_number})
        </div>
      )}
      <div className="wiki-revision__header">
        <h2>{revision.title}</h2>
        <div className="wiki-revision__meta">
          <span>편집자: {revision.editor.nickname}</span>
          <span>· {revision.edit_summary}</span>
        </div>
        <div className="wiki-revision__actions">
          <Link to={ROUTES.WIKI_HISTORY(slug!)} className="btn btn-secondary btn-sm">← 히스토리</Link>
          {!revision.is_current && (
            <button className="btn btn-primary btn-sm" onClick={handleRollback}>이 버전으로 롤백</button>
          )}
        </div>
      </div>
      <div className="markdown-body">
        <MarkdownRenderer content={revision.content} />
      </div>
    </div>
  );
}
