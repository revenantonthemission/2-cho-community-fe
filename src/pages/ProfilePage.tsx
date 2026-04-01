import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api, ApiError } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import Modal from '../components/Modal';
import type { User } from '../types/auth';
import type { ApiResponse } from '../types/common';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [distro, setDistro] = useState(user?.distro ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profile_image ?? '');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
      const url = res?.data?.url;
      if (url) {
        setProfileImage(url);
        setUser({ ...user, profile_image: url });
        showToast('프로필 이미지가 변경되었습니다.');
      }
    } catch {
      showToast('이미지 업로드에 실패했습니다.', 'error');
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!deletePassword) return;
    setIsDeleting(true);
    try {
      await api.delete(API_ENDPOINTS.USERS.ME, { password: deletePassword });
      await logout();
      showToast('회원 탈퇴가 완료되었습니다.');
      navigate(ROUTES.LOGIN);
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        showToast('비밀번호가 올바르지 않습니다.', 'error');
      } else {
        showToast('탈퇴 처리에 실패했습니다.', 'error');
      }
    } finally {
      setIsDeleting(false);
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
    } catch (err: unknown) {
      const apiErr = err instanceof ApiError ? err : null;
      const msg = (apiErr?.data as { message?: string })?.message ?? '프로필 수정에 실패했습니다.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="profile-edit-section">
      <h1 className="page-title">프로필 편집</h1>
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
              {!profileImage && user.nickname?.charAt(0).toUpperCase()}
              <input
                type="file"
                accept="image/*"
                className="hidden-input"
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
            aria-required="true"
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

      <div className="profile-section-link">
        <Link to={ROUTES.PASSWORD} className="btn btn-secondary">비밀번호 변경</Link>
      </div>

      <div className="profile-danger-zone">
        <h3>계정 삭제</h3>
        <p>계정을 삭제하면 모든 데이터가 영구적으로 제거됩니다.</p>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => setDeleteModalOpen(true)}
        >
          회원 탈퇴
        </button>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeletePassword(''); }}
        title="회원 탈퇴"
      >
        <p>정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        <form onSubmit={handleDeleteAccount}>
          <div className="input-group">
            <label htmlFor="delete-pw">비밀번호 확인</label>
            <input
              id="delete-pw"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              autoComplete="current-password"
              aria-required="true"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => { setDeleteModalOpen(false); setDeletePassword(''); }}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-danger"
              disabled={!deletePassword || isDeleting}
            >
              {isDeleting ? '처리 중...' : '탈퇴'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
