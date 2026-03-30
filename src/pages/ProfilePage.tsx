import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import type { User } from '../types/auth';
import type { ApiResponse } from '../types/common';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [distro, setDistro] = useState(user?.distro ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_image ?? '');

  if (!user) return null;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.postFormData<ApiResponse<{ url: string }>>(
        API_ENDPOINTS.USERS.PROFILE_IMAGE,
        formData,
      );
      const url = res?.data?.url ?? (res as any)?.url;
      if (url) {
        setProfileImage(url);
        setUser({ ...user, profile_image: url });
        showToast('프로필 이미지가 변경되었습니다.');
      }
    } catch {
      showToast('이미지 업로드에 실패했습니다.', 'error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.patch<ApiResponse<User>>(API_ENDPOINTS.USERS.ME, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        distro: distro.trim() || null,
      });
      const updated = res.data;
      if (updated) setUser(updated);
      showToast('프로필이 수정되었습니다.');
    } catch (err: any) {
      showToast(err?.data?.message ?? '프로필 수정에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="profile-edit-section">
      <h2 className="page-title">프로필 편집</h2>
      <form onSubmit={handleSubmit}>
        <div className="profile-section">
          <label className="input-label">프로필 사진</label>
          <div className="profile-upload-area">
            <label
              className="profile-circle"
              style={
                profileImage
                  ? { backgroundImage: `url(${profileImage})`, backgroundSize: 'cover', cursor: 'pointer' }
                  : { cursor: 'pointer' }
              }
            >
              {!profileImage && user.nickname.charAt(0).toUpperCase()}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="nickname">닉네임</label>
          <input
            id="nickname"
            className="input-field"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="bio">자기소개</label>
          <textarea
            id="bio"
            className="input-field"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="distro">배포판</label>
          <input
            id="distro"
            className="input-field"
            type="text"
            value={distro}
            onChange={(e) => setDistro(e.target.value)}
            placeholder="예: Ubuntu 24.04, Arch Linux, Fedora 41"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}
