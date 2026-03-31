import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { UI_MESSAGES } from '../constants/messages';
import { Post, Poll, Comment, PostDetailResponse } from '../types/post';
import { ApiResponse } from '../types/common';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import MarkdownRenderer from '../components/MarkdownRenderer';
import PostActionBar from '../components/PostActionBar';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import ReportModal from '../components/ReportModal';
import PollView from '../components/PollView';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentSort, setCommentSort] = useState<'oldest' | 'latest' | 'popular'>('oldest');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get<ApiResponse<PostDetailResponse>>(
          `${API_ENDPOINTS.POSTS.ROOT}/${id}`,
        );
        setPost(res.data.post);
        setComments(res.data.comments);
      } catch {
        setError(UI_MESSAGES.POST_DETAIL_FAIL);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPost();
  }, [id]);

  const loadComments = useCallback(async (sort?: 'oldest' | 'latest' | 'popular') => {
    if (!id) return;
    const sortParam = sort ?? commentSort;
    try {
      const url = sortParam === 'oldest'
        ? API_ENDPOINTS.COMMENTS.ROOT(Number(id))
        : `${API_ENDPOINTS.COMMENTS.ROOT(Number(id))}?sort=${sortParam}`;
      const res = await api.get<ApiResponse<Comment[]>>(url);
      setComments(res.data);
    } catch { /* 댓글 로드 실패 시 무시 */ }
  }, [id, commentSort]);

  async function handleLike() {
    if (!post) return;
    try {
      if (post.is_liked) {
        await api.delete(API_ENDPOINTS.LIKES.ROOT(post.post_id));
      } else {
        await api.post(API_ENDPOINTS.LIKES.ROOT(post.post_id), {});
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              likes_count: prev.is_liked
                ? prev.likes_count - 1
                : prev.likes_count + 1,
            }
          : prev,
      );
    } catch {
      showToast(UI_MESSAGES.LIKE_FAIL, 'error');
    }
  }

  async function handleBookmark() {
    if (!post) return;
    try {
      if (post.is_bookmarked) {
        await api.delete(API_ENDPOINTS.BOOKMARKS.ROOT(post.post_id));
      } else {
        await api.post(API_ENDPOINTS.BOOKMARKS.ROOT(post.post_id), {});
      }
      setPost((prev) =>
        prev ? { ...prev, is_bookmarked: !prev.is_bookmarked } : prev,
      );
    } catch {
      showToast(UI_MESSAGES.BOOKMARK_FAIL, 'error');
    }
  }

  async function handleDelete() {
    if (!post) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`${API_ENDPOINTS.POSTS.ROOT}/${post.post_id}`);
      showToast(UI_MESSAGES.POST_DELETE_SUCCESS);
      navigate(ROUTES.HOME);
    } catch {
      showToast('게시글 삭제에 실패했습니다.', 'error');
    }
  }

  function handleShare() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast(UI_MESSAGES.SHARE_COPIED))
      .catch(() => showToast('링크 복사에 실패했습니다.', 'error'));
  }

  function handleReport() {
    if (!user) {
      showToast(UI_MESSAGES.LOGIN_REQUIRED, 'error');
      return;
    }
    setReportOpen(true);
  }

  const isOwner = user?.id === post?.author.user_id;

  if (isLoading) {
    return (
      <main className="main-container post-detail-container">
        <LoadingSpinner />
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="main-container post-detail-container">
        <p className="error-message">{error || UI_MESSAGES.POST_DETAIL_FAIL}</p>
      </main>
    );
  }

  return (
    <main className="main-container post-detail-container">
      <article className="post-content-wrapper">
        {/* 배지 영역 */}
        <div className="post-badges">
          {post.is_pinned && <span className="pin-badge">고정</span>}
          <span className="category-badge">{post.category_name}</span>
        </div>

        {/* 태그 영역 */}
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span className="tag-badge" key={tag.id}>
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 제목 */}
        <h1 className="detail-title">{post.title}</h1>

        {/* 작성자 정보 + 수정/삭제 버튼 */}
        <div className="post-info-row">
          <div className="author-info">
            <div
              className="author-profile-img"
              style={
                post.author.profileImageUrl
                  ? {
                      backgroundImage: `url(${post.author.profileImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            />
            <Link
              to={ROUTES.USER_PROFILE(post.author.user_id)}
              className="author-nickname"
            >
              {post.author.nickname}
            </Link>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>

          {isOwner && (
            <div className="post-actions">
              <Link
                to={ROUTES.POST_EDIT(post.post_id)}
                className="action-btn"
              >
                수정
              </Link>
              <button className="action-btn" onClick={handleDelete}>
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="post-divider" />

        {/* 본문 */}
        <div className="post-body">
          <MarkdownRenderer content={post.content} />
        </div>

        {/* 투표 */}
        {post.poll && (
          <PollView
            postId={post.post_id}
            poll={post.poll}
            onUpdate={(updated: Poll) => setPost((prev) => prev ? { ...prev, poll: updated } : prev)}
          />
        )}

        {/* 통계 (좋아요, 북마크, 조회수, 댓글) */}
        <PostActionBar
          postId={post.post_id}
          likeCount={post.likes_count}
          isLiked={post.is_liked ?? false}
          isBookmarked={post.is_bookmarked ?? false}
          viewCount={post.views_count}
          commentCount={post.comments_count}
          onLike={handleLike}
          onBookmark={handleBookmark}
        />

        {/* 공유/신고 버튼 */}
        <div className="post-extra-actions">
          <button className="action-btn" onClick={handleShare}>
            공유
          </button>
          <button className="action-btn" onClick={handleReport}>
            신고
          </button>
        </div>
      </article>

      {/* 댓글 영역 */}
      <section className="comment-section">
        <CommentForm postId={post.post_id} onSubmit={loadComments} />
        <div className="comment-sort-bar">
          {(['oldest', 'latest', 'popular'] as const).map((s) => (
            <button
              key={s}
              className={`sort-btn${commentSort === s ? ' active' : ''}`}
              onClick={() => { setCommentSort(s); loadComments(s); }}
            >
              {s === 'oldest' ? '오래된순' : s === 'latest' ? '최신순' : '좋아요순'}
            </button>
          ))}
        </div>
        <CommentList postId={post.post_id} comments={comments} onCommentChange={loadComments} />
      </section>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.post_id}
      />
    </main>
  );
}
