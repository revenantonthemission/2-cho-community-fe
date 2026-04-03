import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import PackageForm from '../../components/packages/PackageForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { PackageDetail, PackageCategory } from '../../types/package';

export default function PackageEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const pkgId = Number(id);

  const [initialData, setInitialData] = useState<{
    display_name: string;
    description: string;
    homepage_url: string;
    category: PackageCategory;
    package_manager: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.get<ApiResponse<PackageDetail>>(
          API_ENDPOINTS.PACKAGES.DETAIL(pkgId),
        );
        const p = res.data;
        setInitialData({
          display_name: p.display_name,
          description: p.description ?? '',
          homepage_url: p.homepage_url ?? '',
          category: p.category,
          package_manager: p.package_manager ?? '',
        });
      } catch {
        showToast(UI_MESSAGES.PKG_LOAD_FAIL, 'error');
        navigate(ROUTES.PACKAGES);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, pkgId, navigate]);

  async function handleSubmit(data: {
    display_name: string;
    description: string;
    homepage_url: string;
    category: string;
    package_manager: string;
  }) {
    await api.put(API_ENDPOINTS.PACKAGES.DETAIL(pkgId), {
      display_name: data.display_name,
      description: data.description || undefined,
      homepage_url: data.homepage_url || undefined,
      category: data.category,
      package_manager: data.package_manager || undefined,
    });
    showToast(UI_MESSAGES.PKG_UPDATE_SUCCESS);
    navigate(ROUTES.PACKAGE_DETAIL(pkgId));
  }

  if (isLoading) return <LoadingSpinner />;
  if (!initialData) return null;

  return (
    <div className="pkg-edit-page">
      <h1 className="page-title">패키지 수정</h1>
      <PackageForm initialData={initialData} onSubmit={handleSubmit} submitLabel="수정 완료" />
    </div>
  );
}
