import { useState } from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import MarkdownEditor from './MarkdownEditor';

interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSubmit: () => void;
  onCancel?: () => void;
}

export default function CommentForm({ postId, parentId, onSubmit, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.COMMENTS.ROOT(postId), {
        content: content.trim(),
        parent_id: parentId ?? null,
      });
      setContent('');
      onSubmit();
    } catch {
      showToast(UI_MESSAGES.COMMENT_CREATE_FAIL, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="comment-input-wrapper">
      {parentId && onCancel && (
        <div className="reply-indicator">
          답글 작성 중
          <button type="button" className="reply-cancel-btn" onClick={onCancel}>취소</button>
        </div>
      )}
      <MarkdownEditor
        value={content}
        onChange={setContent}
        placeholder="댓글을 입력하세요 (@로 멘션)"
        compact
        rows={3}
      />
      <div className="comment-submit-wrapper">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
    </form>
  );
}
