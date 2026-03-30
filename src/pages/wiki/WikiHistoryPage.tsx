import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import { timeAgo } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { WikiHistoryResponse, WikiRevision } from '../../types/wiki';

export default function WikiHistoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState<WikiRevision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fromRev, setFromRev] = useState<number | null>(null);
  const [toRev, setToRev] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<WikiHistoryResponse>>(
          `${API_ENDPOINTS.WIKI.HISTORY(slug)}?offset=0&limit=50`,
        );
        setRevisions(res.data.revisions);
        if (res.data.revisions.length >= 2) {
          setToRev(res.data.revisions[0].revision_number);
          setFromRev(res.data.revisions[1].revision_number);
        }
      } catch {
        showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug]);

  function handleCompare() {
    if (!slug || fromRev === null || toRev === null) return;
    const from = Math.min(fromRev, toRev);
    const to = Math.max(fromRev, toRev);
    navigate(`${ROUTES.WIKI_DIFF(slug)}?from=${from}&to=${to}`);
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="wiki-history">
      <div className="wiki-history__header">
        <h2>편집 기록: {slug}</h2>
        <Link to={ROUTES.WIKI_DETAIL(slug!)} className="btn btn-secondary btn-sm">
          ← 페이지로 돌아가기
        </Link>
      </div>

      {revisions.length >= 2 && (
        <button
          className="btn btn-primary btn-sm"
          onClick={handleCompare}
          disabled={fromRev === null || toRev === null || fromRev === toRev}
          style={{ marginBottom: '16px' }}
        >
          선택한 리비전 비교
        </button>
      )}

      <table className="wiki-history__table">
        <thead>
          <tr>
            <th>From</th>
            <th>To</th>
            <th>#</th>
            <th>편집자</th>
            <th>편집 요약</th>
            <th>날짜</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {revisions.map((rev) => (
            <tr key={rev.revision_number}>
              <td><input type="radio" name="from" checked={fromRev === rev.revision_number} onChange={() => setFromRev(rev.revision_number)} /></td>
              <td><input type="radio" name="to" checked={toRev === rev.revision_number} onChange={() => setToRev(rev.revision_number)} /></td>
              <td>{rev.revision_number}</td>
              <td>{rev.editor.nickname}{rev.editor.distro && <span className="distro-badge">{rev.editor.distro}</span>}</td>
              <td>{rev.edit_summary}</td>
              <td>{timeAgo(rev.created_at)}</td>
              <td><Link to={ROUTES.WIKI_REVISION(slug!, rev.revision_number)} className="btn btn-secondary btn-sm">보기</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
