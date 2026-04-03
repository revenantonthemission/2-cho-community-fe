import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import WikiCard from '../../components/wiki/WikiCard';
import WikiTagFilter from '../../components/wiki/WikiTagFilter';
import LoadingSpinner from '../../components/LoadingSpinner';
import HeroSection from '../../components/HeroSection';
import type { ApiResponse } from '../../types/common';
import type { WikiListResponse, WikiTag } from '../../types/wiki';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'views', label: '조회순' },
  { value: 'updated', label: '편집순' },
];
const PAGE_LIMIT = 10;

export default function WikiListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sort = searchParams.get('sort') ?? 'latest';
  const search = searchParams.get('search') ?? '';
  const tag = searchParams.get('tag') ?? '';

  const [pages, setPages] = useState<WikiListResponse['wiki_pages']>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [popularTags, setPopularTags] = useState<WikiTag[]>([]);

  const offsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  // 인기 태그 최초 1회 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<{ tags: WikiTag[] }>>(
          `${API_ENDPOINTS.WIKI.TAGS_POPULAR}?limit=10`,
        );
        setPopularTags(res.data.tags);
      } catch { /* 태그 로드 실패는 무시 */ }
    })();
  }, []);

  // 위키 페이지 목록 조회
  const fetchPages = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      if (reset) offsetRef.current = 0;
      const params = new URLSearchParams();
      params.set('offset', String(offsetRef.current));
      params.set('limit', String(PAGE_LIMIT));
      params.set('sort', sort);
      if (search) params.set('search', search);
      if (tag) params.set('tag', tag);

      const res = await api.get<ApiResponse<WikiListResponse>>(
        `${API_ENDPOINTS.WIKI.ROOT}?${params}`,
      );
      const { wiki_pages, pagination } = res.data;
      if (reset) {
        setPages(wiki_pages);
      } else {
        setPages((prev) => [...prev, ...wiki_pages]);
      }
      offsetRef.current += wiki_pages.length;
      setHasMore(pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sort, search, tag]);

  useEffect(() => { fetchPages(true); }, [fetchPages]);

  // 무한 스크롤 IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchPages(false);
    },
    [hasMore, isLoading, fetchPages],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  // 검색 300ms 디바운스
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set('search', value); else next.delete('search');
      setSearchParams(next);
    }, 300);
  }

  function handleSortChange(value: string) {
    const next = new URLSearchParams(searchParams);
    next.set('sort', value);
    setSearchParams(next);
  }

  function handleTagSelect(tagName: string) {
    const next = new URLSearchParams(searchParams);
    if (tagName) next.set('tag', tagName); else next.delete('tag');
    setSearchParams(next);
  }

  return (
    <div className="wiki-list-page">
      <HeroSection
        title="위키"
        subtitle="리눅스 지식을 공유하고 함께 만들어가는 백과사전"
        actionText="페이지 작성"
        actionLink={ROUTES.WIKI_WRITE}
      />

      <div className="wiki-list-page__controls">
        <span className="search-prompt">$</span>
        <input
          type="text"
          className="wiki-list-page__search"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="위키 검색..."
        />
        <div className="sort-buttons">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`sort-btn ${sort === opt.value ? 'active' : ''}`}
              onClick={() => handleSortChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {popularTags.length > 0 && (
        <WikiTagFilter tags={popularTags} selectedTag={tag} onSelect={handleTagSelect} />
      )}

      {pages.length === 0 && !isLoading ? (
        <div className="empty-state wiki-empty">
          <code>$ man wiki</code>
          <code>No manual entry for wiki</code>
          <p>위키 페이지가 없습니다</p>
        </div>
      ) : (
        <div className="wiki-list">
          {pages.map((p) => <WikiCard key={p.wiki_page_id} page={p} />)}
        </div>
      )}

      <div ref={observerRef}>{isLoading && <LoadingSpinner />}</div>
    </div>
  );
}
