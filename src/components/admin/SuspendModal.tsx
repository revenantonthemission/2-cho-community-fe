import { useState } from 'react';

interface Props {
  nickname: string;
  onConfirm: (durationDays: number, reason: string) => Promise<void>;
  onClose: () => void;
}

export default function SuspendModal({ nickname, onConfirm, onClose }: Props) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(days, reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>사용자 정지: {nickname}</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="suspend-days">정지 기간 (일)</label>
            <input id="suspend-days" className="input-field" type="number" min={1} max={365} value={days}
              onChange={(e) => setDays(Number(e.target.value))} required aria-required="true" />
          </div>
          <div className="input-group">
            <label htmlFor="suspend-reason">정지 사유</label>
            <textarea id="suspend-reason" className="input-field" value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="정지 사유를 입력하세요" maxLength={500} rows={3} required aria-required="true" />
          </div>
          <div className="admin-modal__actions">
            <button type="submit" className="btn btn-danger btn-sm"
              disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? '처리 중...' : '정지'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
