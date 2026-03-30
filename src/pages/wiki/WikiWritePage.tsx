import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import WikiForm from '../../components/wiki/WikiForm';
import type { ApiResponse } from '../../types/common';
import type { WikiCreateResponse } from '../../types/wiki';

export default function WikiWritePage() {
  const navigate = useNavigate();

  async function handleSubmit(data: {
    title: string;
    slug?: string;
    content: string;
    tags: string;
    edit_summary: string;
  }) {
    const tagArray = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    try {
      const res = await api.post<ApiResponse<WikiCreateResponse>>(
        API_ENDPOINTS.WIKI.ROOT,
        {
          title: data.title,
          slug: data.slug,
          content: data.content,
          tags: tagArray,
          edit_summary: data.edit_summary,
        },
      );
      showToast(UI_MESSAGES.WIKI_CREATE_SUCCESS);
      navigate(ROUTES.WIKI_DETAIL(res.data.slug));
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: { code?: string } };
      if (apiErr.status === 400 && apiErr.data?.code === 'SLUG_DUPLICATE' || apiErr.status === 409) {
        showToast(UI_MESSAGES.WIKI_SLUG_DUPLICATE, 'error');
      } else {
        showToast(UI_MESSAGES.WIKI_LOAD_FAIL, 'error');
      }
      throw err; // re-throw so WikiForm can reset isSubmitting
    }
  }

  return (
    <div className="wiki-write-page">
      <h2>새 위키 페이지</h2>
      <WikiForm showSlug onSubmit={handleSubmit} submitLabel="페이지 생성" />
    </div>
  );
}
