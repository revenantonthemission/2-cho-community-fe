import { useState, useEffect, useCallback, useRef } from 'react';
import { formatDate } from '../../utils/formatters';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import SuspendModal from '../../components/admin/SuspendModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';
import type { ApiResponse } from '../../types/common';
import type { DashboardResponse, AdminUser, AdminUserListResponse } from '../../types/admin';

export default function AdminDashboardPage() {

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  const userOffsetRef = useRef(0);
  const observerRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 대시보드 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<DashboardResponse>>(API_ENDPOINTS.ADMIN.DASHBOARD);
        setDashboard(res.data);
      } catch {
        showToast(UI_MESSAGES.ADMIN_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // 사용자 목록 로드
  const fetchUsers = useCallback(async (reset = false) => {
    try {
      if (reset) userOffsetRef.current = 0;
      const params = new URLSearchParams();
      params.set('offset', String(userOffsetRef.current));
      params.set('limit', '20');
      if (search) params.set('search', search);

      const res = await api.get<ApiResponse<AdminUserListResponse>>(
        `${API_ENDPOINTS.ADMIN.USERS}?${params}`,
      );
      const { users: fetched, pagination } = res.data;
      if (reset) setUsers(fetched); else setUsers((prev) => [...prev, ...fetched]);
      userOffsetRef.current += fetched.length;
      setHasMoreUsers(pagination.has_more);
    } catch {
      showToast('사용자 목록을 불러오지 못했습니다.', 'error');
    }
  }, [search]);

  useEffect(() => { fetchUsers(true); }, [fetchUsers]);

  // 무한 스크롤
  const loadingRef = useRef(false);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMoreUsers && !loadingRef.current) {
        loadingRef.current = true;
        fetchUsers(false).finally(() => { loadingRef.current = false; });
      }
    },
    [hasMoreUsers, fetchUsers],
  );

  useEffect(() => {
    const node = observerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleObserver]);

  // 검색 디바운스
  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(value), 300);
  }

  // 정지/해제
  async function handleSuspend(days: number, reason: string) {
    if (!suspendTarget) return;
    try {
      await api.post(API_ENDPOINTS.ADMIN.SUSPEND(suspendTarget.user_id), {
        duration_days: days,
        reason,
      });
      showToast(UI_MESSAGES.ADMIN_SUSPEND_SUCCESS);
      setSuspendTarget(null);
      fetchUsers(true);
    } catch {
      showToast(UI_MESSAGES.ADMIN_SUSPEND_FAIL, 'error');
    }
  }

  async function handleUnsuspend(userId: number) {
    if (!confirm('정지를 해제하시겠습니까?')) return;
    try {
      await api.delete(API_ENDPOINTS.ADMIN.SUSPEND(userId));
      showToast(UI_MESSAGES.ADMIN_UNSUSPEND_SUCCESS);
      fetchUsers(true);
    } catch {
      showToast(UI_MESSAGES.ADMIN_SUSPEND_FAIL, 'error');
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (!dashboard) return null;

  const { summary, daily_stats } = dashboard;

  return (
    <div className="admin-dashboard">
      <BackButton />
      <h1 className="page-title">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{summary.total_users}</span>
          <span className="admin-stat-card__label">총 사용자</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{summary.total_posts}</span>
          <span className="admin-stat-card__label">총 게시글</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{summary.total_comments}</span>
          <span className="admin-stat-card__label">총 댓글</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-card__value">{summary.today_signups}</span>
          <span className="admin-stat-card__label">오늘 가입</span>
        </div>
      </div>

      {/* 일별 통계 */}
      <h2>일별 통계</h2>
      <table className="admin-daily-table">
        <thead>
          <tr><th>날짜</th><th>가입</th><th>게시글</th><th>댓글</th></tr>
        </thead>
        <tbody>
          {daily_stats.slice(0, 7).map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td><td>{d.signups}</td><td>{d.posts}</td><td>{d.comments}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 사용자 관리 */}
      <div className="admin-users">
        <div className="admin-users__header">
          <h2>사용자 관리</h2>
          <input type="text" value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="닉네임 또는 이메일 검색..." className="admin-users__search" />
        </div>
        <div className="admin-user-list">
          {users.map((u) => (
            <div key={u.user_id} className="admin-user-card">
              <div className="admin-user-card__info">
                <span className="admin-user-card__nickname">{u.nickname}</span>
                <span className="admin-user-card__email">{u.email}</span>
                {u.role === 'admin' && <span className="admin-badge admin-badge--admin">관리자</span>}
                {u.suspended_until && (
                  <span className="admin-badge admin-badge--suspended">
                    정지 (~{formatDate(u.suspended_until)})
                  </span>
                )}
              </div>
              <div className="admin-user-card__actions">
                {u.role !== 'admin' && (
                  u.suspended_until ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleUnsuspend(u.user_id)}>
                      정지 해제
                    </button>
                  ) : (
                    <button className="btn btn-danger btn-sm" onClick={() => setSuspendTarget(u)}>
                      정지
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
        <div ref={observerRef} />
      </div>

      {suspendTarget && (
        <SuspendModal
          nickname={suspendTarget.nickname}
          onConfirm={handleSuspend}
          onClose={() => setSuspendTarget(null)}
        />
      )}
    </div>
  );
}
