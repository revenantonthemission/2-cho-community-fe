import { useState, useRef } from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import { useMention } from '../hooks/useMention';
import MentionDropdown from './MentionDropdown';

interface CommentFormProps {
  postId: number;
  parentId?: number | null;
  onSubmit: () => void;
  onCancel?: () => void;
}

export default function CommentForm({ postId, parentId, onSubmit, onCancel }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mentionUsers, showMention, selectedIndex, handleInput, handleKeyDown, handleBlur, closeMention } = useMention();

  function handleChange(value: string) {
    setContent(value);
    const ta = textareaRef.current;
    if (ta) handleInput(value, ta.selectionStart);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = textareaRef.current;
    if (!ta) return;
    const result = handleKeyDown(e, content, ta.selectionStart);
    if (result !== null) {
      setContent(result);
      // 커서 위치 설정은 다음 렌더 후
      const cursorPos = result.indexOf(' ', result.lastIndexOf('@')) + 1;
      requestAnimationFrame(() => {
        ta.selectionStart = cursorPos;
        ta.selectionEnd = cursorPos;
      });
    }
  }

  function handleMentionSelect(user: { user_id: number; nickname: string; profileImageUrl: string | null }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const beforeCursor = content.slice(0, ta.selectionStart);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;
    const before = content.slice(0, atIndex);
    const after = content.slice(ta.selectionStart);
    const insert = `@${user.nickname} `;
    const newValue = before + insert + after;
    setContent(newValue);
    closeMention();
    const cursorPos = before.length + insert.length;
    requestAnimationFrame(() => {
      ta.selectionStart = cursorPos;
      ta.selectionEnd = cursorPos;
      ta.focus();
    });
  }

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
      <div className="relative">
        <textarea
          ref={textareaRef}
          className="input-field"
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKey}
          onBlur={handleBlur}
          placeholder="댓글을 입력하세요 (@로 멘션)"
          rows={3}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showMention}
          aria-controls={showMention ? 'mention-listbox' : undefined}
          aria-activedescendant={
            showMention && selectedIndex >= 0 && mentionUsers[selectedIndex]
              ? `mention-option-${mentionUsers[selectedIndex].user_id}`
              : undefined
          }
        />
        {showMention && (
          <MentionDropdown
            users={mentionUsers}
            selectedIndex={selectedIndex}
            onSelect={handleMentionSelect}
          />
        )}
      </div>
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
