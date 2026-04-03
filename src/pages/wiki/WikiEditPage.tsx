import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import WikiForm from '../../components/wiki/WikiForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { WikiDetailResponse } from '../../types/wiki';

export default function WikiEditPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<{
    title: string;
    content: string;
    tags: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<WikiDetailResponse>>(
          API_ENDPOINTS.WIKI.DETAIL(slug),
        );
        const p = res.data.wiki_page;
        setInitialData({
          title: p.title,
          content: p.content,
          tags: p.tags.map((t) => t.name),
        });
      } catch {
        showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
        navigate(ROUTES.WIKI);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [slug, navigate]);

  async function handleSubmit(data: {
    title: string;
    content: string;
    tags: string;
    edit_summary: string;
  }) {
    if (!slug) return;
    const tagArray = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    await api.put(API_ENDPOINTS.WIKI.DETAIL(slug), {
      title: data.title,
      content: data.content,
      tags: tagArray,
      edit_summary: data.edit_summary,
    });
    showToast(UI_MESSAGES.WIKI_UPDATE_SUCCESS);
    navigate(ROUTES.WIKI_DETAIL(slug));
  }

  if (isLoading) return <LoadingSpinner />;
  if (!initialData) return null;

  return (
    <div className="wiki-edit-page">
      <h1 className="page-title">위키 페이지 수정</h1>
      <WikiForm initialData={initialData} onSubmit={handleSubmit} submitLabel="수정 완료" />
    </div>
  );
}
