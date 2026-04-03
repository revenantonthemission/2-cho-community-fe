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
import PostCard from '../components/PostCard';
import BackButton from '../components/BackButton';
import Modal from '../components/Modal';

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
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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

    // 연관 게시글 로드
    api.get<ApiResponse<{ posts: Post[] }>>(API_ENDPOINTS.POSTS.RELATED(Number(id)))
      .then((res) => setRelatedPosts(res.data?.posts ?? []))
      .catch(() => {}); /* 연관 게시글 로드 실패 무시 — 보조 UI */
  }, [id]);

  const loadComments = useCallback(async (sort?: 'oldest' | 'latest' | 'popular') => {
    if (!id) return;
    const sortParam = sort ?? commentSort;
    try {
      const url = sortParam === 'oldest'
        ? `${API_ENDPOINTS.POSTS.ROOT}/${id}`
        : `${API_ENDPOINTS.POSTS.ROOT}/${id}?comment_sort=${sortParam}`;
      const res = await api.get<ApiResponse<PostDetailResponse>>(url);
      setComments(res.data.comments);
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
              likes_count: prev.is_liked ? prev.likes_count - 1 : prev.likes_count + 1,
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
    try {
      await api.delete(`${API_ENDPOINTS.POSTS.ROOT}/${post.post_id}`);
      showToast(UI_MESSAGES.POST_DELETE_SUCCESS);
      navigate(ROUTES.HOME);
    } catch {
      showToast('게시글 삭제에 실패했습니다.', 'error');
    }
  }

  // 구독 토글: normal → watching → muted → normal
  async function handleSubscription() {
    if (!post) return;
    try {
      if (!post.is_watching) {
        await api.put(API_ENDPOINTS.POSTS.SUBSCRIPTION(post.post_id), { status: 'watching' });
        setPost((prev) => prev ? { ...prev, is_watching: true } : prev);
        showToast('게시글 알림을 받습니다.');
      } else {
        await api.delete(API_ENDPOINTS.POSTS.SUBSCRIPTION(post.post_id));
        setPost((prev) => prev ? { ...prev, is_watching: false } : prev);
        showToast('구독이 해제되었습니다.');
      }
    } catch {
      showToast('구독 처리에 실패했습니다.', 'error');
    }
  }

  // 관리자 핀 토글
  async function handlePin() {
    if (!post) return;
    try {
      if (post.is_pinned) {
        await api.delete(API_ENDPOINTS.POSTS.PIN(post.post_id));
      } else {
        await api.patch(API_ENDPOINTS.POSTS.PIN(post.post_id), {});
      }
      setPost((prev) => prev ? { ...prev, is_pinned: !prev.is_pinned } : prev);
      showToast(post.is_pinned ? '고정이 해제되었습니다.' : '게시글이 고정되었습니다.');
    } catch {
      showToast('고정 처리에 실패했습니다.', 'error');
    }
  }

  // 사용자 차단
  async function handleBlock() {
    if (!post) return;
    try {
      if (post.is_blocked) {
        await api.delete(API_ENDPOINTS.BLOCKS.BLOCK(post.author.user_id));
      } else {
        await api.post(API_ENDPOINTS.BLOCKS.BLOCK(post.author.user_id), {});
      }
      setPost((prev) => prev ? { ...prev, is_blocked: !prev.is_blocked } : prev);
      showToast(post.is_blocked ? '차단이 해제되었습니다.' : '사용자를 차단했습니다.');
    } catch {
      showToast('차단 처리에 실패했습니다.', 'error');
    }
  }

  // Q&A 답변 채택
  async function handleAcceptAnswer(commentId: number) {
    if (!post) return;
    try {
      if (post.accepted_answer_id === commentId) {
        await api.delete(API_ENDPOINTS.POSTS.ACCEPTED_ANSWER(post.post_id));
        setPost((prev) => prev ? { ...prev, accepted_answer_id: null } : prev);
        showToast('채택이 해제되었습니다.');
      } else {
        await api.patch(API_ENDPOINTS.POSTS.ACCEPTED_ANSWER(post.post_id), { comment_id: commentId });
        setPost((prev) => prev ? { ...prev, accepted_answer_id: commentId } : prev);
        showToast('답변이 채택되었습니다.');
      }
    } catch {
      showToast('채택 처리에 실패했습니다.', 'error');
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
  const isAdmin = user?.role === 'admin';

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
        <p className="error-msg">{error || UI_MESSAGES.POST_DETAIL_FAIL}</p>
      </main>
    );
  }

  return (
    <main className="main-container post-detail-container">
      <BackButton />
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

          {(isOwner || isAdmin) && (
            <div className="post-actions">
              {isOwner && <Link to={ROUTES.POST_EDIT(post.post_id)} className="btn btn-secondary btn-sm">수정</Link>}
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)}>삭제</button>
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

        {/* 액션 버튼 */}
        <div className="post-extra-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleShare}>공유</button>
          {user && (
            <button className="btn btn-secondary btn-sm" onClick={handleSubscription}>
              {post.is_watching ? '구독 해제' : '구독'}
            </button>
          )}
          {user && !isOwner && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleReport}>신고</button>
              <button className="btn btn-secondary btn-sm" onClick={handleBlock}>
                {post.is_blocked ? '차단 해제' : '차단'}
              </button>
            </>
          )}
          {isAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={handlePin}>
              {post.is_pinned ? '고정 해제' : '고정'}
            </button>
          )}
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
        <CommentList
          postId={post.post_id}
          comments={comments}
          onCommentChange={loadComments}
          acceptedAnswerId={post.accepted_answer_id ?? null}
          isPostOwner={isOwner}
          onAcceptAnswer={isOwner ? handleAcceptAnswer : undefined}
        />
      </section>

      {/* 연관 게시글 */}
      {relatedPosts.length > 0 && (
        <section className="related-posts">
          <h3>연관 게시글</h3>
          <ul className="post-list">
            {relatedPosts.slice(0, 5).map((rp) => (
              <PostCard key={rp.post_id} post={rp} />
            ))}
          </ul>
        </section>
      )}

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="post"
        targetId={post.post_id}
      />

      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="게시글 삭제">
        <p>정말 삭제하시겠습니까?</p>
        <div className="modal-actions">
          <button className="btn btn-danger btn-sm" onClick={() => { handleDelete(); setDeleteConfirm(false); }}>삭제</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setDeleteConfirm(false)}>취소</button>
        </div>
      </Modal>
    </main>
  );
}
