import { useState } from 'react';
import Modal from './Modal';
import { api, ApiError } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { UI_MESSAGES } from '../constants/messages';
import { showToast } from '../utils/toast';

const REPORT_REASONS = [
  { value: 'spam', label: '스팸' },
  { value: 'abuse', label: '욕설/비방' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'other', label: '기타' },
] as const;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'post' | 'comment';
  targetId: number;
}

export default function ReportModal({ isOpen, onClose, targetType, targetId }: Props) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.REPORTS.ROOT, {
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim() || undefined,
      });
      showToast(UI_MESSAGES.REPORT_SUCCESS);
      handleClose();
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 409) {
        showToast('이미 신고한 콘텐츠입니다.', 'error');
      } else if (apiErr?.status === 400) {
        showToast('자신의 콘텐츠는 신고할 수 없습니다.', 'error');
      } else {
        showToast(UI_MESSAGES.REPORT_FAIL, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setReason('');
    setDescription('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="신고하기">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>신고 사유</label>
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className="report-radio">
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                aria-required="true"
              />
              {r.label}
            </label>
          ))}
        </div>
        <div className="input-group">
          <label htmlFor="report-desc">상세 설명 (선택)</label>
          <textarea
            id="report-desc"
            className="input-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="추가 설명이 있다면 입력해주세요"
            rows={3}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            취소
          </button>
          <button
            type="submit"
            className="btn btn-danger"
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '신고'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
