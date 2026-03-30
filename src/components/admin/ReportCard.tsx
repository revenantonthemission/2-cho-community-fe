import { timeAgo } from '../../utils/formatters';
import type { Report } from '../../types/admin';

interface Props {
  report: Report;
  onResolve: (id: number, suspendDays?: number) => void;
  onDismiss: (id: number) => void;
  onReopen: (id: number) => void;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: '대기중', className: 'admin-badge--pending' },
  resolved: { label: '처리됨', className: 'admin-badge--resolved' },
  dismissed: { label: '기각됨', className: 'admin-badge--dismissed' },
};

const REASON_LABELS: Record<string, string> = {
  spam: '스팸',
  abuse: '욕설/비하',
  inappropriate: '부적절한 내용',
  other: '기타',
};

export default function ReportCard({ report: r, onResolve, onDismiss, onReopen }: Props) {
  const status = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;

  return (
    <div className="report-card">
      <div className="report-card__header">
        <span className="report-card__target">
          [{r.target_type === 'post' ? '게시글' : '댓글'} #{r.target_id}]
        </span>
        <span className={`admin-badge ${status.className}`}>{status.label}</span>
      </div>
      <div className="report-card__body">
        <div className="report-card__info">
          <span>신고자: {r.reporter_nickname}</span>
          <span>· 사유: {REASON_LABELS[r.reason] ?? r.reason}</span>
          <span>· {timeAgo(r.created_at)}</span>
        </div>
        {r.description && <p className="report-card__desc">{r.description}</p>}
      </div>
      <div className="report-card__actions">
        {r.status === 'pending' && (
          <>
            <button className="btn btn-danger btn-sm" onClick={() => onResolve(r.report_id)}>
              해결 (콘텐츠 삭제)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onDismiss(r.report_id)}>
              기각
            </button>
          </>
        )}
        {(r.status === 'resolved' || r.status === 'dismissed') && (
          <button className="btn btn-secondary btn-sm" onClick={() => onReopen(r.report_id)}>
            재오픈
          </button>
        )}
      </div>
    </div>
  );
}
