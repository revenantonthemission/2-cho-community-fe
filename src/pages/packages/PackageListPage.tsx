import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import PackageCard from '../../components/packages/PackageCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import HeroSection from '../../components/HeroSection';
import { PACKAGE_CATEGORIES } from '../../types/package';
import type { ApiResponse } from '../../types/common';
import type { PackageListResponse } from '../../types/package';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'rating', label: '평점순' },
  { value: 'reviews', label: '리뷰순' },
  { value: 'name', label: '이름순' },
];
const PAGE_LIMIT = 10;

export default function PackageListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { isAuthenticated } = useAuth();

  const sort = searchParams.get('sort') ?? 'latest';
  const category = searchParams.get('category') ?? '';
  const search = searchParams.get('search') ?? '';

  const [packages, setPackages] = useState<PackageListResponse['packages']>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const offsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  const fetchPackages = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      if (reset) offsetRef.current = 0;
      const params = new URLSearchParams();
      params.set('offset', String(offsetRef.current));
      params.set('limit', String(PAGE_LIMIT));
      params.set('sort', sort);
      if (category) params.set('category', category);
      if (search) params.set('search', search);

      const res = await api.get<ApiResponse<PackageListResponse>>(
        `${API_ENDPOINTS.PACKAGES.ROOT}?${params}`,
      );
      const { packages: fetched, pagination } = res.data;
      if (reset) {
        setPackages(fetched);
      } else {
        setPackages((prev) => [...prev, ...fetched]);
      }
      offsetRef.current += fetched.length;
      setHasMore(pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.PKG_LOAD_FAIL, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sort, category, search]);

  useEffect(() => { fetchPackages(true); }, [fetchPackages]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchPackages(false);
    },
    [hasMore, isLoading, fetchPackages],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

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

  function handleCategoryChange(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('category', value); else next.delete('category');
    setSearchParams(next);
  }

  return (
    <div className="pkg-list-page">
      <HeroSection
        title="패키지 리뷰"
        subtitle="리눅스 패키지를 평가하고 추천하는 공간"
        actionText="패키지 등록"
        actionLink={ROUTES.PACKAGE_WRITE}
      />

      <div className="pkg-list-page__categories">
        <button
          className={`pkg-category-btn ${!category ? 'active' : ''}`}
          onClick={() => handleCategoryChange('')}
        >
          전체
        </button>
        {PACKAGE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`pkg-category-btn ${category === c.value ? 'active' : ''}`}
            onClick={() => handleCategoryChange(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="pkg-list-page__controls">
        <span className="search-prompt">$</span>
        <input type="text" className="pkg-list-page__search" value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)} placeholder="search packages..." />
        <div className="sort-buttons">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value}
              className={`sort-btn ${sort === opt.value ? 'active' : ''}`}
              onClick={() => handleSortChange(opt.value)}>{opt.label}</button>
          ))}
        </div>
      </div>

      {packages.length === 0 && !isLoading ? (
        <div className="empty-state pkg-empty">
          <code>$ apt search ...</code>
          <code>No packages found</code>
          <p>패키지가 없습니다</p>
        </div>
      ) : (
        <div className="pkg-list">
          {packages.map((pkg) => <PackageCard key={pkg.package_id} pkg={pkg} />)}
        </div>
      )}

      <div ref={observerRef}>{isLoading && <LoadingSpinner />}</div>
    </div>
  );
}
