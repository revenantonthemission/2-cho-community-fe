import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import ReportCard from '../../components/admin/ReportCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { Report, ReportListResponse, ReportStatus } from '../../types/admin';

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: '대기중' },
  { value: 'resolved', label: '처리됨' },
  { value: 'dismissed', label: '기각됨' },
];

export default function AdminReportsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<ReportStatus>('pending');
  const [reports, setReports] = useState<Report[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const offsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate(ROUTES.HOME);
  }, [user, navigate]);

  const fetchReports = useCallback(async (reset = false) => {
    setIsLoading(true);
    try {
      if (reset) offsetRef.current = 0;
      const params = new URLSearchParams();
      params.set('offset', String(offsetRef.current));
      params.set('limit', '20');
      params.set('status', status);

      const res = await api.get<ApiResponse<ReportListResponse>>(
        `${API_ENDPOINTS.ADMIN.REPORTS}?${params}`,
      );
      const { reports: fetched, pagination } = res.data;
      if (reset) setReports(fetched); else setReports((prev) => [...prev, ...fetched]);
      offsetRef.current += fetched.length;
      setHasMore(pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.ADMIN_LOAD_FAIL, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => { fetchReports(true); }, [fetchReports]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isLoading) fetchReports(false);
    },
    [hasMore, isLoading, fetchReports],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  async function handleResolve(reportId: number, suspendDays?: number) {
    if (!confirm('신고를 처리하시겠습니까? (대상 콘텐츠가 삭제됩니다)')) return;
    try {
      const body: { status: string; suspend_days?: number } = { status: 'resolved' };
      if (suspendDays) body.suspend_days = suspendDays;
      await api.patch(API_ENDPOINTS.ADMIN.REPORT_RESOLVE(reportId), body);
      showToast(UI_MESSAGES.REPORT_RESOLVE_SUCCESS);
      fetchReports(true);
    } catch {
      showToast(UI_MESSAGES.REPORT_FAIL, 'error');
    }
  }

  async function handleDismiss(reportId: number) {
    if (!confirm('신고를 기각하시겠습니까?')) return;
    try {
      await api.patch(API_ENDPOINTS.ADMIN.REPORT_RESOLVE(reportId), { status: 'dismissed' });
      showToast(UI_MESSAGES.REPORT_RESOLVE_SUCCESS);
      fetchReports(true);
    } catch {
      showToast(UI_MESSAGES.REPORT_FAIL, 'error');
    }
  }

  async function handleReopen(reportId: number) {
    try {
      await api.patch(API_ENDPOINTS.ADMIN.REPORT_REOPEN(reportId));
      showToast(UI_MESSAGES.REPORT_REOPEN_SUCCESS);
      fetchReports(true);
    } catch {
      showToast(UI_MESSAGES.REPORT_FAIL, 'error');
    }
  }

  return (
    <div className="admin-reports">
      <h1>신고 관리</h1>

      <div className="admin-reports__tabs">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value}
            className={`admin-tab ${status === tab.value ? 'active' : ''}`}
            onClick={() => setStatus(tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      {reports.length === 0 && !isLoading ? (
        <p className="admin-reports__empty">신고가 없습니다.</p>
      ) : (
        reports.map((r) => (
          <ReportCard key={r.report_id} report={r}
            onResolve={handleResolve} onDismiss={handleDismiss} onReopen={handleReopen} />
        ))
      )}

      <div ref={observerRef}>
        {isLoading && <LoadingSpinner />}
      </div>
    </div>
  );
}
