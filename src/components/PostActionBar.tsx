import { formatCount } from '../utils/formatters';

interface PostActionBarProps {
  postId: number;
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  viewCount: number;
  commentCount: number;
  onLike: () => void;
  onBookmark: () => void;
}

export default function PostActionBar({
  likeCount,
  isLiked,
  isBookmarked,
  viewCount,
  commentCount,
  onLike,
  onBookmark,
}: PostActionBarProps) {
  return (
    <div className="post-stats-box">
      <button type="button" className="stat-box" onClick={onLike} aria-label="좋아요">
        <div className="stat-value">{formatCount(likeCount)}</div>
        <div className="stat-label">{isLiked ? '❤️ 좋아요' : '🤍 좋아요'}</div>
      </button>

      <button type="button" className="stat-box" onClick={onBookmark} aria-label="북마크">
        <div className="stat-value">{isBookmarked ? '🔖' : '📑'}</div>
        <div className="stat-label">북마크</div>
      </button>

      <div className="stat-box">
        <div className="stat-value">{formatCount(viewCount)}</div>
        <div className="stat-label">조회수</div>
      </div>

      <div className="stat-box">
        <div className="stat-value">{formatCount(commentCount)}</div>
        <div className="stat-label">댓글</div>
      </div>
    </div>
  );
}
