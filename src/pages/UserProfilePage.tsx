import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import type { Post } from '../types/post';
import type { ApiResponse, PaginatedData } from '../types/common';

interface UserProfile {
  id: number;
  nickname: string;
  email: string;
  profile_image: string | null;
  bio: string | null;
  distro: string | null;
  created_at: string;
}

interface Reputation {
  score: number;
  trust_level: number;
  trust_level_name: string;
}

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isSelf = currentUser?.id === Number(id);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, repRes, postsRes] = await Promise.all([
          api.get<ApiResponse<UserProfile>>(`${API_ENDPOINTS.USERS.ROOT}/${id}`),
          api.get<ApiResponse<Reputation>>(API_ENDPOINTS.REPUTATION.USER(Number(id))),
          api.get<ApiResponse<PaginatedData<Post>>>(`${API_ENDPOINTS.POSTS.ROOT}?author_id=${id}`),
        ]);
        setProfile(profileRes.data);
        setReputation(repRes.data);
        setPosts(postsRes.data?.items ?? []);
      } catch {
        /* 조회 실패 시 빈 상태 유지 */
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  async function handleFollow() {
    try {
      await api.post(API_ENDPOINTS.FOLLOW.FOLLOW(Number(id)), {});
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

  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <div>사용자를 찾을 수 없습니다.</div>;

  return (
    <div className="user-profile-container">
      <div className="user-profile-header">
        <div
          className="profile-circle"
          style={
            profile.profile_image
              ? { backgroundImage: `url(${profile.profile_image})`, backgroundSize: 'cover', width: 80, height: 80 }
              : { width: 80, height: 80, fontSize: '2rem' }
          }
        >
          {!profile.profile_image && profile.nickname.charAt(0).toUpperCase()}
        </div>
        <div className="user-profile-info">
          <h2>{profile.nickname}</h2>
          {profile.distro && <span className="distro-badge">{profile.distro}</span>}
          {profile.bio && <p>{profile.bio}</p>}
        </div>
      </div>

      {reputation && (
        <div className="user-profile-stats">
          <div><strong>평판</strong> {reputation.score}</div>
          <div><strong>신뢰 등급</strong> {reputation.trust_level_name}</div>
        </div>
      )}

      {!isSelf && currentUser && (
        <div className="user-profile-actions">
          <button type="button" className="action-btn" onClick={handleFollow}>
            {isFollowing ? '언팔로우' : '팔로우'}
          </button>
          <button type="button" className="action-btn" onClick={handleBlock}>
            {isBlocked ? '차단 해제' : '차단'}
          </button>
        </div>
      )}

      <div className="profile-tabs">
        <button type="button" className="profile-tab active">작성글</button>
      </div>

      <div className="profile-tab-content">
        {posts.length === 0 ? (
          <p>작성한 게시글이 없습니다.</p>
        ) : (
          <ul className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
