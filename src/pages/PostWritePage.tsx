import { useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type { ApiResponse } from '../types/common';
import type { Post } from '../types/post';

export default function PostWritePage() {
  const navigate = useNavigate();

  async function handleSubmit(data: {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
  }) {
    const res = await api.post<ApiResponse<Post>>(API_ENDPOINTS.POSTS.ROOT, data);
    showToast(UI_MESSAGES.POST_CREATE_SUCCESS);
    const postId = res?.data?.post_id;
    navigate(postId ? ROUTES.POST_DETAIL(postId) : ROUTES.HOME);
  }

  return (
    <div className="write-container">
      <h2 className="page-title">게시글 작성</h2>
      <PostForm onSubmit={handleSubmit} enableDraft />
    </div>
  );
}
