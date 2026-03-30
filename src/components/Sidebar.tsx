import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import type { Category, CategoriesResponse } from '../types/post';
import type { ApiResponse } from '../types/common';

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get('category_id');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<CategoriesResponse>>(API_ENDPOINTS.CATEGORIES.ROOT);
        setCategories(res.data?.categories ?? []);
      } catch {
        // 카테고리 로드 실패 시 빈 목록
      }
    })();
  }, []);

  function handleCategoryClick(categoryId: number | null) {
    const params = new URLSearchParams(searchParams);
    if (categoryId === null) {
      params.delete('category_id');
    } else {
      params.set('category_id', String(categoryId));
    }
    params.set('page', '1');
    setSearchParams(params);
  }

  return (
    <nav className="sidebar" id="app-sidebar">
      <div className="sidebar__section">
        <h4>카테고리</h4>
        <ul>
          <li>
            <button
              className={currentCategory === null ? 'active' : ''}
              onClick={() => handleCategoryClick(null)}
            >
              전체
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.category_id}>
              <button
                className={currentCategory === String(cat.category_id) ? 'active' : ''}
                onClick={() => handleCategoryClick(cat.category_id)}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
