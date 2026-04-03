import { useNavigate } from 'react-router-dom';
import PostForm, { type PostFormData } from '../components/PostForm';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type { ApiResponse } from '../types/common';

export default function PostWritePage() {
  const navigate = useNavigate();

  async function handleSubmit(data: PostFormData) {
    const res = await api.post<ApiResponse<{ post_id: number }>>(API_ENDPOINTS.POSTS.ROOT, data);
    showToast(UI_MESSAGES.POST_CREATE_SUCCESS);
    const postId = res?.data?.post_id;
    navigate(postId ? ROUTES.POST_DETAIL(postId) : ROUTES.HOME);
  }

  return (
    <div className="write-container">
      <h1 className="page-title">게시글 작성</h1>
      <PostForm onSubmit={handleSubmit} submitLabel="완료" enableDraft />
    </div>
  );
}
