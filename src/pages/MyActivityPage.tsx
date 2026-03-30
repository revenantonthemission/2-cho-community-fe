import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { UI_MESSAGES } from '../constants/messages';
import { showToast } from '../utils/toast';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import type { ApiResponse } from '../types/common';
import type {
  MyPost, MyComment, BlockedUser,
  MyPostsResponse, MyCommentsResponse, MyBlocksResponse,
} from '../types/activity';

type TabType = 'posts' | 'comments' | 'likes' | 'bookmarks' | 'blocks';

const TABS: { value: TabType; label: string }[] = [
  { value: 'posts', label: '내 글' },
  { value: 'comments', label: '내 댓글' },
  { value: 'likes', label: '좋아요' },
  { value: 'bookmarks', label: '북마크' },
  { value: 'blocks', label: '차단 목록' },
];

const TAB_ENDPOINTS: Record<TabType, string> = {
  posts: API_ENDPOINTS.ACTIVITY.MY_POSTS,
  comments: API_ENDPOINTS.ACTIVITY.MY_COMMENTS,
  likes: API_ENDPOINTS.ACTIVITY.MY_LIKES,
  bookmarks: API_ENDPOINTS.ACTIVITY.MY_BOOKMARKS,
  blocks: API_ENDPOINTS.ACTIVITY.MY_BLOCKS,
};

export default function MyActivityPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>('posts');
  const [items, setItems] = useState<unknown[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const offsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      if (reset) offsetRef.current = 0;
      const res = await api.get<ApiResponse<unknown>>(
        `${TAB_ENDPOINTS[tab]}?offset=${offsetRef.current}&limit=10`,
      );
      const data = res.data as Record<string, unknown>;

      let fetched: unknown[] = [];
      let pagination = { has_more: false, total_count: 0 };

      if (tab === 'comments') {
        const d = data as unknown as MyCommentsResponse;
        fetched = d.comments;
        pagination = d.pagination;
      } else if (tab === 'blocks') {
        const d = data as unknown as MyBlocksResponse;
        fetched = d.blocked_users;
        pagination = d.pagination;
      } else {
        const d = data as unknown as MyPostsResponse;
        fetched = d.posts;
        pagination = d.pagination;
      }

      if (reset) setItems(fetched); else setItems((prev) => [...prev, ...fetched]);
      offsetRef.current += fetched.length;
      setHasMore(pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.ACTIVITY_LOAD_FAIL, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchItems(true); }, [fetchItems]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchItems(false);
    },
    [hasMore, isLoading, fetchItems],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  function renderItem(item: unknown, index: number) {
    if (tab === 'comments') {
      const c = item as MyComment;
      return (
        <div key={c.comment_id} className="activity-card">
          <Link to={ROUTES.POST_DETAIL(c.post_id)} className="activity-card__link">
            <span className="activity-card__post-title">{c.post_title}</span>
          </Link>
          <p className="activity-card__content">{c.content}</p>
          <span className="activity-card__date">{timeAgo(c.created_at)}</span>
        </div>
      );
    }
    if (tab === 'blocks') {
      const b = item as BlockedUser;
      return (
        <div key={b.user_id} className="activity-card">
          <span className="activity-card__nickname">{b.nickname}</span>
          <span className="activity-card__date">{timeAgo(b.blocked_at)}</span>
        </div>
      );
    }
    // posts, likes, bookmarks
    const p = item as MyPost;
    return (
      <Link key={p.post_id} to={ROUTES.POST_DETAIL(p.post_id)} className="activity-post-card">
        <h4 className="activity-post-card__title">{p.title}</h4>
        <div className="activity-post-card__meta">
          <span><Heart size={14} /> {p.likes_count}</span>
          <span><MessageCircle size={14} /> {p.comments_count}</span>
          <span><Eye size={14} /> {p.views_count}</span>
          <span>{timeAgo(p.created_at)}</span>
        </div>
      </Link>
    );
  }

  // user 변수는 향후 사용자 정보 표시를 위해 참조됨
  void user;

  return (
    <div className="my-activity-page">
      <h1>내 활동</h1>

      <div className="activity-tabs">
        {TABS.map((t) => (
          <button key={t.value}
            className={`activity-tab ${tab === t.value ? 'active' : ''}`}
            onClick={() => setTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 && !isLoading ? (
        <div className="activity-empty">
          <code>$ history</code>
          <p>활동 내역이 없습니다</p>
        </div>
      ) : (
        <div className="activity-list">
          {items.map((item, i) => renderItem(item, i))}
        </div>
      )}

      <div ref={observerRef}>
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
