import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Post } from '../types/post';
import type { ApiResponse, PostListResponse } from '../types/common';

interface TagInfo {
  name: string;
  description: string | null;
  post_count: number;
}

type Tab = 'posts' | 'wiki';

export default function TagDetailPage() {
  const { name } = useParams<{ name: string }>();
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [wikiPages, setWikiPages] = useState<{ slug: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  // 태그 메타 로드
  useEffect(() => {
    if (!name) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<TagInfo>>(API_ENDPOINTS.TAGS.DETAIL(name));
        setTag(res.data);
      } catch { /* 태그 정보 로드 실패 무시 — 헤더 보조 데이터 */ }
    })();
  }, [name]);

  // 탭 변경 시 목록 초기화 + 로드
  const fetchList = useCallback(async (reset = false) => {
    if (!name) return;
    if (reset) { offsetRef.current = 0; }
    setIsLoading(true);
    try {
      if (tab === 'posts') {
        const res = await api.get<ApiResponse<PostListResponse>>(
          `${API_ENDPOINTS.POSTS.ROOT}?tag=${encodeURIComponent(name)}&offset=${offsetRef.current}&limit=10`,
        );
        const fetched = res.data?.posts ?? [];
        if (reset) setPosts(fetched); else setPosts((prev) => [...prev, ...fetched]);
        offsetRef.current += fetched.length;
        setHasMore(res.data?.pagination?.has_more ?? false);
      } else {
        const res = await api.get<ApiResponse<{ wiki_pages: { slug: string; title: string }[] }>>(
          `${API_ENDPOINTS.WIKI.ROOT}?tag=${encodeURIComponent(name)}&offset=${offsetRef.current}&limit=10`,
        );
        const fetched = res.data?.wiki_pages ?? [];
        if (reset) setWikiPages(fetched); else setWikiPages((prev) => [...prev, ...fetched]);
        offsetRef.current += fetched.length;
        setHasMore(fetched.length >= 10);
      }
    } catch {
      showToast('목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally { setIsLoading(false); }
  }, [name, tab]);

  useEffect(() => { fetchList(true); }, [fetchList]);

  // 무한 스크롤
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) fetchList(false);
  }, [hasMore, isLoading, fetchList]);

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    obs.observe(node);
    return () => obs.disconnect();
  }, [handleObserver]);

  return (
    <div className="tag-detail-container">
      <h1 className="tag-detail-name">#{name}</h1>
      {tag?.description && <p className="tag-detail-description">{tag.description}</p>}

      <div className="tag-detail-tabs">
        <button className={`tag-tab-btn${tab === 'posts' ? ' active' : ''}`} onClick={() => setTab('posts')}>
          게시글
        </button>
        <button className={`tag-tab-btn${tab === 'wiki' ? ' active' : ''}`} onClick={() => setTab('wiki')}>
          위키
        </button>
      </div>

      {tab === 'posts' && (
        <ul className="tag-detail-list">
          {posts.map((p) => <PostCard key={p.post_id} post={p} />)}
        </ul>
      )}

      {tab === 'wiki' && (
        <ul className="tag-detail-list">
          {wikiPages.map((w) => (
            <li key={w.slug} className="post-card">
              <Link to={ROUTES.WIKI_DETAIL(w.slug)} className="post-card__link">
                <h3 className="post-title">{w.title}</h3>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && ((tab === 'posts' && posts.length === 0) || (tab === 'wiki' && wikiPages.length === 0)) && (
        <div className="empty-state">
          <code>$ find /{tab} -tag &quot;{name}&quot;</code>
          <p>결과가 없습니다.</p>
        </div>
      )}

      <div ref={observerRef}>
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
