import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import CommentForm from './CommentForm';
import ReportModal from './ReportModal';
import MarkdownRenderer from './MarkdownRenderer';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import { timeAgo } from '../utils/formatters';
import type { Comment } from '../types/post';

interface CommentListProps {
  postId: number;
  comments: Comment[];
  onCommentChange: () => void;
  acceptedAnswerId?: number | null;
  isPostOwner?: boolean;
  onAcceptAnswer?: (commentId: number) => void;
}

function CommentItem({
  comment,
  postId,
  onCommentChange,
  isReply = false,
  isAccepted = false,
  isPostOwner = false,
  onAcceptAnswer,
}: {
  comment: Comment;
  postId: number;
  onCommentChange: () => void;
  isReply?: boolean;
  isAccepted?: boolean;
  isPostOwner?: boolean;
  onAcceptAnswer?: (commentId: number) => void;
}) {
  const { user } = useAuth();
  const [replyOpen, setReplyOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [isLiked, setIsLiked] = useState(comment.is_liked ?? false);

  const isOwner = user?.id === comment.author_id;

  async function handleLike() {
    try {
      if (isLiked) {
        await api.delete(API_ENDPOINTS.COMMENT_LIKES.ROOT(postId, comment.id));
      } else {
        await api.post(API_ENDPOINTS.COMMENT_LIKES.ROOT(postId, comment.id), {});
      }
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch {
      showToast('좋아요 처리에 실패했습니다.', 'error');
    }
  }

  async function handleEdit() {
    try {
      await api.patch(API_ENDPOINTS.COMMENTS.DETAIL(postId, comment.id), {
        content: editContent.trim(),
      });
      setEditing(false);
      onCommentChange();
    } catch {
      showToast(UI_MESSAGES.COMMENT_UPDATE_FAIL, 'error');
    }
  }

  async function handleDelete() {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(API_ENDPOINTS.COMMENTS.DETAIL(postId, comment.id));
      showToast(UI_MESSAGES.DELETE_SUCCESS);
      onCommentChange();
    } catch {
      showToast('댓글 삭제에 실패했습니다.', 'error');
    }
  }

  return (
    <li className={`comment-item${isReply ? ' reply' : ''}${isAccepted ? ' comment-item--accepted' : ''}`}>
      <div className="comment-header">
        <Link to={ROUTES.USER_PROFILE(comment.author_id)} className="comment-author">
          {comment.author_nickname}
        </Link>
        <span className="comment-date">{timeAgo(comment.created_at)}</span>
        {isAccepted && <span className="accepted-badge">채택된 답변</span>}
      </div>

      {editing ? (
        <div className="comment-edit">
          <textarea
            className="input-field"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
          <div>
            <button type="button" className="comment-action-btn" onClick={handleEdit}>저장</button>
            <button type="button" className="comment-action-btn" onClick={() => { setEditContent(comment.content); setEditing(false); }}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-body"><MarkdownRenderer content={comment.content} /></div>
      )}

      <div className="comment-actions">
        <button type="button" className="comment-action-btn" onClick={handleLike}>
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} /> {likeCount}
        </button>
        {!isReply && (
          <button type="button" className="comment-action-btn" onClick={() => setReplyOpen(!replyOpen)}>
            답글
          </button>
        )}
        {isOwner && !editing && (
          <button type="button" className="comment-action-btn" onClick={() => setEditing(true)}>수정</button>
        )}
        {(isOwner || user?.role === 'admin') && !editing && (
          <button type="button" className="comment-action-btn" onClick={handleDelete}>삭제</button>
        )}
        {isPostOwner && !isReply && onAcceptAnswer && (
          <button type="button" className="comment-action-btn" onClick={() => onAcceptAnswer(comment.id)}>
            {isAccepted ? '채택 해제' : '채택'}
          </button>
        )}
        {user && !isOwner && (
          <button type="button" className="comment-action-btn" onClick={() => setReportOpen(true)}>신고</button>
        )}
      </div>

      {replyOpen && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          onSubmit={() => { setReplyOpen(false); onCommentChange(); }}
          onCancel={() => setReplyOpen(false)}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <ul className="comment-list">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onCommentChange={onCommentChange}
              isReply
            />
          ))}
        </ul>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="comment"
        targetId={comment.id}
      />
    </li>
  );
}

export default function CommentList({ postId, comments, onCommentChange, acceptedAnswerId, isPostOwner, onAcceptAnswer }: CommentListProps) {
  return (
    <ul className="comment-list">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          onCommentChange={onCommentChange}
          isAccepted={acceptedAnswerId === comment.id}
          isPostOwner={isPostOwner}
          onAcceptAnswer={onAcceptAnswer}
        />
      ))}
    </ul>
  );
}
