import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';
import { Post } from '../types/post';
import { ApiResponse, PostListResponse } from '../types/common';
import PostCard from '../components/PostCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'likes', label: '인기순' },
  { value: 'views', label: '조회순' },
  { value: 'comments', label: '댓글순' },
  { value: 'hot', label: '핫' },
];

export default function PostListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const page = Number(searchParams.get('page') ?? '1');
  const sort = searchParams.get('sort') ?? 'latest';
  const categoryId = searchParams.get('category_id') ?? '';
  const search = searchParams.get('search') ?? '';
  const following = searchParams.get('following') === 'true';
  const solved = searchParams.get('solved');

  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState(search);
  const [suggestions, setSuggestions] = useState<{ post_id: number; title: string; author_nickname: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // URL search 파라미터 변경 시 입력값 동기화
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // 검색 자동완성 — 2글자 이상 입력 시 300ms 디바운스
  const fetchSuggestions = useCallback((query: string) => {
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    if (query.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get<ApiResponse<PostListResponse>>(
          `${API_ENDPOINTS.POSTS.ROOT}?search=${encodeURIComponent(query)}&limit=5`,
        );
        setSuggestions((res.data?.posts ?? []).map((p) => ({
          post_id: p.post_id,
          title: p.title,
          author_nickname: p.author.nickname,
        })));
        setShowSuggestions(true);
      } catch { setSuggestions([]); /* 검색 자동완성 실패 무시 — 보조 기능 */ }
    }, 300);
  }, []);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current); };
  }, []);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      setError('');

      // 쿼리 파라미터 조합 (offset/limit 기반 페이지네이션)
      const LIMIT = 10;
      const params = new URLSearchParams();
      params.set('offset', String((page - 1) * LIMIT));
      params.set('limit', String(LIMIT));
      params.set('sort', sort);
      if (categoryId) params.set('category_id', categoryId);
      if (search) params.set('search', search);
      if (following) params.set('following', 'true');
      if (solved !== null) params.set('solved', solved);

      const endpoint = `${API_ENDPOINTS.POSTS.ROOT}?${params.toString()}`;

      try {
        const res = await api.get<ApiResponse<PostListResponse>>(endpoint);
        setPosts(res.data.posts);
        setTotalPages(Math.ceil((res.data.pagination?.total_count ?? 0) / 10));
      } catch {
        setError('게시글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchPosts();
  }, [page, sort, categoryId, search, following, solved]);

  function handleSortChange(value: string) {
    const next = new URLSearchParams(searchParams);
    next.set('sort', value);
    next.set('page', '1');
    setSearchParams(next);
  }

  function handlePageChange(newPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(newPage));
    setSearchParams(next);
  }

  function handleSearch(query: string) {
    const next = new URLSearchParams(searchParams);
    if (query.trim()) {
      next.set('search', query.trim());
    } else {
      next.delete('search');
    }
    next.set('page', '1');
    setSearchParams(next);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch(searchInput);
  }

  function handleClearSearch() {
    setSearchInput('');
    handleSearch('');
  }

  return (
    <div className="post-list-page">
      {/* 검색 */}
      <div className="search-bar" ref={searchBarRef}>
        <input
          type="text"
          className="search-bar__input"
          placeholder="게시글 검색..."
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); fetchSuggestions(e.target.value); }}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        />
        {search && (
          <button className="search-bar__clear" onClick={handleClearSearch} aria-label="검색 초기화">
            ×
          </button>
        )}
        <button className="search-bar__btn" onClick={() => { handleSearch(searchInput); setShowSuggestions(false); }}>
          검색
        </button>
        {showSuggestions && suggestions.length > 0 && (
          <ul className="search-suggestions">
            {suggestions.map((s) => (
              <li
                key={s.post_id}
                className="search-suggestion-item"
                onMouseDown={() => { setShowSuggestions(false); navigate(ROUTES.POST_DETAIL(s.post_id)); }}
              >
                <span className="suggestion-title">{s.title}</span>
                <span className="suggestion-author">{s.author_nickname}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {search && (
        <p className="search-result-info">
          &quot;{search}&quot; 검색 결과
        </p>
      )}

      <div className="search-sort-section">
        <div className="sort-buttons">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`sort-btn${sort === option.value && !following ? ' active' : ''}`}
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.set('sort', option.value);
                next.set('page', '1');
                next.delete('following');
                setSearchParams(next);
              }}
            >
              {option.label}
            </button>
          ))}
          {isAuthenticated && (
            <>
              <span className="filter-divider" />
              <button
                className={`sort-btn${sort === 'for_you' ? ' active' : ''}`}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('sort', 'for_you');
                  next.set('page', '1');
                  next.delete('following');
                  setSearchParams(next);
                }}
              >
                추천
              </button>
              <button
                className={`sort-btn${following ? ' active' : ''}`}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (following) {
                    next.delete('following');
                  } else {
                    next.set('following', 'true');
                    next.set('page', '1');
                  }
                  setSearchParams(next);
                }}
              >
                팔로잉
              </button>
            </>
          )}
        </div>

        <Link to={ROUTES.POST_WRITE} className="btn btn-primary">
          글쓰기
        </Link>
      </div>

      {/* Q&A 해결/미해결 필터 — categoryId가 있을 때만 표시 */}
      {categoryId && (
        <div className="sort-buttons" style={{ marginBottom: 'var(--spacing-md)' }}>
          <button
            className={`sort-btn${solved === null ? ' active' : ''}`}
            onClick={() => { const n = new URLSearchParams(searchParams); n.delete('solved'); n.set('page', '1'); setSearchParams(n); }}
          >
            전체
          </button>
          <button
            className={`sort-btn${solved === 'true' ? ' active' : ''}`}
            onClick={() => { const n = new URLSearchParams(searchParams); n.set('solved', 'true'); n.set('page', '1'); setSearchParams(n); }}
          >
            해결됨
          </button>
          <button
            className={`sort-btn${solved === 'false' ? ' active' : ''}`}
            onClick={() => { const n = new URLSearchParams(searchParams); n.set('solved', 'false'); n.set('page', '1'); setSearchParams(n); }}
          >
            미해결
          </button>
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && error && (
        <p className="error-msg">{error}</p>
      )}

      {!isLoading && !error && (
        <>
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </ul>

          {posts.length === 0 && (
            <div className="empty-state">
              <code>$ cat /var/log/posts</code>
              <p>게시글이 없습니다.</p>
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
