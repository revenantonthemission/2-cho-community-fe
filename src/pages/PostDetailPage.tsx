import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { UI_MESSAGES } from '../constants/messages';
import { Post, Comment } from '../types/post';
import { ApiResponse } from '../types/common';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import MarkdownRenderer from '../components/MarkdownRenderer';
import PostActionBar from '../components/PostActionBar';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!id) return;

    async function fetchPost() {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get<ApiResponse<Post>>(
          `${API_ENDPOINTS.POSTS.ROOT}/${id}`,
        );
        setPost(res.data);
      } catch {
        setError(UI_MESSAGES.POST_DETAIL_FAIL);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPost();
  }, [id]);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<ApiResponse<Comment[]>>(
        API_ENDPOINTS.COMMENTS.ROOT(Number(id)),
      );
      setComments(res.data);
    } catch { /* 댓글 로드 실패 시 무시 */ }
  }, [id]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  async function handleLike() {
    if (!post) return;
    try {
      if (post.is_liked) {
        await api.delete(API_ENDPOINTS.LIKES.ROOT(post.id));
      } else {
        await api.post(API_ENDPOINTS.LIKES.ROOT(post.id), {});
      }
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              like_count: prev.is_liked
                ? prev.like_count - 1
                : prev.like_count + 1,
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
        await api.delete(API_ENDPOINTS.BOOKMARKS.ROOT(post.id));
      } else {
        await api.post(API_ENDPOINTS.BOOKMARKS.ROOT(post.id), {});
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
      await api.delete(`${API_ENDPOINTS.POSTS.ROOT}/${post.id}`);
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
    // TODO: 신고 모달 구현 (Task 18 이후)
    showToast(UI_MESSAGES.REPORT_SUCCESS);
  }

  const isOwner = user?.id === post?.author_id;

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
              <span className="tag-badge" key={tag}>
                #{tag}
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
                post.author_profile_image
                  ? {
                      backgroundImage: `url(${post.author_profile_image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            />
            <Link
              to={ROUTES.USER_PROFILE(post.author_id)}
              className="author-nickname"
            >
              {post.author_nickname}
            </Link>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>

          {isOwner && (
            <div className="post-actions">
              <Link
                to={ROUTES.POST_EDIT(post.id)}
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

        {/* 통계 (좋아요, 북마크, 조회수, 댓글) */}
        <PostActionBar
          postId={post.id}
          likeCount={post.like_count}
          isLiked={post.is_liked ?? false}
          isBookmarked={post.is_bookmarked ?? false}
          viewCount={post.view_count}
          commentCount={post.comment_count}
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
        <CommentForm postId={post.id} onSubmit={loadComments} />
        <CommentList postId={post.id} comments={comments} onCommentChange={loadComments} />
      </section>
    </main>
  );
}
