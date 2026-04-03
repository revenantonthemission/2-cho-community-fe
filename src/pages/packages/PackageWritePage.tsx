import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import PackageForm from '../../components/packages/PackageForm';
import type { ApiResponse } from '../../types/common';

export default function PackageWritePage() {
  const navigate = useNavigate();

  async function handleSubmit(data: {
    name?: string;
    display_name: string;
    description: string;
    homepage_url: string;
    category: string;
    package_manager: string;
  }) {
    try {
      const res = await api.post<ApiResponse<{ package_id: number }>>(
        API_ENDPOINTS.PACKAGES.ROOT,
        {
          name: data.name,
          display_name: data.display_name,
          description: data.description || undefined,
          homepage_url: data.homepage_url || undefined,
          category: data.category,
          package_manager: data.package_manager || undefined,
        },
      );
      showToast(UI_MESSAGES.PKG_CREATE_SUCCESS);
      navigate(ROUTES.PACKAGE_DETAIL(res.data.package_id));
    } catch (err: unknown) {
      const apiErr = err as { status?: number; data?: { code?: string } };
      if (apiErr.data?.code === 'PACKAGE_NAME_DUPLICATE') {
        showToast(UI_MESSAGES.PKG_NAME_DUPLICATE, 'error');
      } else {
        showToast(UI_MESSAGES.PKG_LOAD_FAIL, 'error');
      }
      throw err;
    }
  }

  return (
    <div className="pkg-write-page">
      <h1 className="page-title">패키지 등록</h1>
      <PackageForm showName onSubmit={handleSubmit} submitLabel="패키지 등록" />
    </div>
  );
}
