import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import WikiDiffView from '../../components/wiki/WikiDiffView';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { WikiDiffResponse } from '../../types/wiki';

export default function WikiDiffPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const from = Number(searchParams.get('from'));
  const to = Number(searchParams.get('to'));

  const [diff, setDiff] = useState<WikiDiffResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug || !from || !to) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<WikiDiffResponse>>(
          `${API_ENDPOINTS.WIKI.DIFF(slug)}?from=${from}&to=${to}`,
        );
        setDiff(res.data);
      } catch {
        showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug, from, to]);

  if (isLoading) return <LoadingSpinner />;
  if (!diff) return null;

  return (
    <div className="wiki-diff-page">
      <div className="wiki-diff-page__header">
        <h2>리비전 비교</h2>
        <Link to={ROUTES.WIKI_HISTORY(slug!)} className="btn btn-secondary btn-sm">← 히스토리</Link>
      </div>
      <div className="wiki-diff-page__info">
        <div>리비전 #{diff.from_revision}: {diff.from_title}</div>
        <div>리비전 #{diff.to_revision}: {diff.to_title}</div>
        {diff.from_title !== diff.to_title && (
          <div className="wiki-diff-page__title-change">
            제목 변경: {diff.from_title} → {diff.to_title}
          </div>
        )}
      </div>
      <WikiDiffView changes={diff.changes} />
    </div>
  );
}
