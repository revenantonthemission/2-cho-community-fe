import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDM } from '../hooks/useDM';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import SuspendModal from '../components/admin/SuspendModal';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type { Post } from '../types/post';
import type { ApiResponse, PostListResponse } from '../types/common';

interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  profile_image: string | null;
  bio: string | null;
  distro: string | null;
  created_at: string;
  is_following?: boolean;
  is_blocked?: boolean;
  followers_count?: number;
  following_count?: number;
  suspended_until?: string | null;
}

interface FollowUser {
  user_id: number;
  nickname: string;
  profile_image: string | null;
}

interface Reputation {
  score: number;
  trust_level: number;
  trust_level_name: string;
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { createConversation, selectConversation } = useDM();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<FollowUser[]>([]);
  const [followListLoading, setFollowListLoading] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);

  const isSelf = currentUser?.id === Number(id);

  // 자기 프로필 접근 시 편집 페이지로 리다이렉트
  useEffect(() => {
    if (isSelf) navigate(ROUTES.PROFILE, { replace: true });
  }, [isSelf, navigate]);

  useEffect(() => {
    if (isSelf) return;
    (async () => {
      try {
        const [profileRes, repRes, postsRes] = await Promise.all([
          api.get<ApiResponse<UserProfile>>(`${API_ENDPOINTS.USERS.ROOT}/${id}`),
          api.get<ApiResponse<Reputation>>(API_ENDPOINTS.REPUTATION.USER(Number(id))),
          api.get<ApiResponse<PostListResponse>>(`${API_ENDPOINTS.POSTS.ROOT}?author_id=${id}`),
        ]);
        setProfile(profileRes.data);
        setReputation(repRes.data);
        setPosts(postsRes.data?.posts ?? []);
        // BE가 로그인 사용자 기준 팔로우/차단 상태를 반환
        setIsFollowing(!!profileRes.data?.is_following);
        setIsBlocked(!!profileRes.data?.is_blocked);
      } catch {
        /* 조회 실패 시 빈 상태 유지 */
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  async function handleFollow() {
    try {
      if (isFollowing) {
        await api.delete(API_ENDPOINTS.FOLLOW.FOLLOW(Number(id)));
      } else {
        await api.post(API_ENDPOINTS.FOLLOW.FOLLOW(Number(id)), {});
      }
      setIsFollowing(!isFollowing);
      showToast(isFollowing ? '팔로우를 취소했습니다.' : '팔로우했습니다.');
    } catch {
      showToast('팔로우 처리에 실패했습니다.', 'error');
    }
  }

  async function handleBlock() {
    try {
      if (isBlocked) {
        await api.delete(API_ENDPOINTS.BLOCKS.BLOCK(Number(id)));
      } else {
        await api.post(API_ENDPOINTS.BLOCKS.BLOCK(Number(id)), {});
      }
      setIsBlocked(!isBlocked);
      showToast(isBlocked ? '차단이 해제되었습니다.' : '사용자를 차단했습니다.');
    } catch {
      showToast('차단 처리에 실패했습니다.', 'error');
    }
  }

  async function openFollowModal(type: 'followers' | 'following') {
    setFollowModalType(type);
    setFollowList([]);
    setFollowListLoading(true);
    try {
      const endpoint = type === 'followers'
        ? `${API_ENDPOINTS.USERS.ROOT}/${id}/followers`
        : `${API_ENDPOINTS.USERS.ROOT}/${id}/following`;
      const res = await api.get<ApiResponse<{ users: FollowUser[] }>>(endpoint);
      setFollowList(res.data?.users ?? []);
    } catch { /* ignore */ }
    finally { setFollowListLoading(false); }
  }

  async function handleSuspend(days: number, reason: string) {
    try {
      await api.post(API_ENDPOINTS.ADMIN.SUSPEND(Number(id)), {
        duration_days: days,
        reason,
      });
      showToast(UI_MESSAGES.ADMIN_SUSPEND_SUCCESS);
      setSuspendModalOpen(false);
    } catch {
      showToast(UI_MESSAGES.ADMIN_SUSPEND_FAIL, 'error');
    }
  }

  async function handleUnsuspend() {
    if (!window.confirm('정지를 해제하시겠습니까?')) return;
    try {
      await api.delete(API_ENDPOINTS.ADMIN.SUSPEND(Number(id)));
      showToast(UI_MESSAGES.ADMIN_UNSUSPEND_SUCCESS);
      setProfile((prev) => prev ? { ...prev, suspended_until: null } : prev);
    } catch {
      showToast(UI_MESSAGES.ADMIN_SUSPEND_FAIL, 'error');
    }
  }

  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <div>사용자를 찾을 수 없습니다.</div>;

  return (
    <div className="main-container">
      <div className="user-profile-header">
        <div className="profile-img-wrapper">
          <div
            className="profile-img-large"
            style={
              profile.profile_image
                ? { backgroundImage: `url(${profile.profile_image})`, backgroundSize: 'cover' }
                : undefined
            }
          >
            {!profile.profile_image && profile.nickname?.charAt(0).toUpperCase()}
          </div>
        </div>
        <div>
          <h2 id="profile-nickname">{profile.nickname}</h2>
          {profile.distro && <span className="distro-badge">{profile.distro}</span>}
          {profile.bio && <p id="profile-bio">{profile.bio}</p>}
        </div>

        {!isSelf && currentUser && (
          <>
            <button
              type="button"
              className={['follow-btn', isFollowing ? 'following' : ''].filter(Boolean).join(' ')}
              onClick={handleFollow}
            >
              {isFollowing ? '언팔로우' : '팔로우'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  const convId = await createConversation(Number(id));
                  await selectConversation(convId);
                  navigate(ROUTES.DM);
                } catch {
                  showToast('쪽지 보내기에 실패했습니다.', 'error');
                }
              }}
            >
              쪽지 보내기
            </button>
            <button type="button" className="block-btn" onClick={handleBlock}>
              {isBlocked ? '차단 해제' : '차단'}
            </button>
          </>
        )}
      </div>

      <div className="profile-stats">
        {reputation && (
          <>
            <div className="profile-stat-item"><strong>평판</strong> {reputation.score}</div>
            <div className="profile-stat-item"><strong>신뢰 등급</strong> {reputation.trust_level_name}</div>
          </>
        )}
        <button type="button" className="profile-stat-item profile-stat-clickable" onClick={() => openFollowModal('followers')}>
          <strong>팔로워</strong> {profile.followers_count ?? 0}
        </button>
        <button type="button" className="profile-stat-item profile-stat-clickable" onClick={() => openFollowModal('following')}>
          <strong>팔로잉</strong> {profile.following_count ?? 0}
        </button>
      </div>

      {/* 관리자: 정지/해제 */}
      {isAdmin && !isSelf && (
        <div className="admin-profile-actions">
          {profile.suspended_until ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleUnsuspend}>
              정지 해제 (~{new Date(profile.suspended_until).toLocaleDateString()})
            </button>
          ) : (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => setSuspendModalOpen(true)}>
              사용자 정지
            </button>
          )}
        </div>
      )}

      <div className="profile-content-tabs">
        <button type="button" className="content-tab active">작성글</button>
      </div>

      <div>
        {posts.length === 0 ? (
          <div className="empty-state">
            <code>$ ls ~/posts</code>
            <p>작성한 게시글이 없습니다.</p>
          </div>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.post_id} post={post} />
            ))}
          </ul>
        )}
      </div>

      {/* 팔로워/팔로잉 모달 */}
      <Modal
        isOpen={followModalType !== null}
        onClose={() => setFollowModalType(null)}
        title={followModalType === 'followers' ? '팔로워' : '팔로잉'}
      >
        {followListLoading ? (
          <LoadingSpinner />
        ) : followList.length === 0 ? (
          <div className="empty-state">
            <code>$ who {followModalType === 'followers' ? '--followers' : '--following'}</code>
            <p>{followModalType === 'followers' ? '팔로워가 없습니다.' : '팔로잉이 없습니다.'}</p>
          </div>
        ) : (
          <ul className="follow-modal-list">
            {followList.map((u) => (
              <li key={u.user_id} className="follow-modal-item" onClick={() => { setFollowModalType(null); navigate(ROUTES.USER_PROFILE(u.user_id)); }}>
                <div
                  className="follow-modal-avatar"
                  style={u.profile_image ? { backgroundImage: `url(${u.profile_image})`, backgroundSize: 'cover' } : undefined}
                >
                  {!u.profile_image && u.nickname?.charAt(0).toUpperCase()}
                </div>
                <span>{u.nickname}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* 관리자 정지 모달 */}
      {suspendModalOpen && (
        <SuspendModal
          nickname={profile.nickname}
          onConfirm={handleSuspend}
          onClose={() => setSuspendModalOpen(false)}
        />
      )}
    </div>
  );
}
