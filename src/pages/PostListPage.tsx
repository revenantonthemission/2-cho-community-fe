import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
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

  const page = Number(searchParams.get('page') ?? '1');
  const sort = searchParams.get('sort') ?? 'latest';
  const categoryId = searchParams.get('category_id') ?? '';
  const search = searchParams.get('search') ?? '';

  const [posts, setPosts] = useState<Post[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
  }, [page, sort, categoryId, search]);

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

  return (
    <div className="post-list-page">
      <div className="search-sort-section">
        <div className="sort-tabs">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={['sort-tab', sort === option.value ? 'active' : ''].filter(Boolean).join(' ')}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn--primary"
          onClick={() => navigate(ROUTES.POST_WRITE)}
        >
          글쓰기
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && error && (
        <p className="error-message">{error}</p>
      )}

      {!isLoading && !error && (
        <>
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>

          {posts.length === 0 && (
            <p className="empty-message">게시글이 없습니다.</p>
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
