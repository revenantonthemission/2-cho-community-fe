import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PostForm from '../components/PostForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { ROUTES } from '../constants/routes';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type { ApiResponse } from '../types/common';
import type { Post } from '../types/post';

export default function PostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ApiResponse<Post>>(`${API_ENDPOINTS.POSTS.ROOT}/${id}`);
        setPost(res.data);
      } catch {
        navigate(ROUTES.HOME);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate]);

  async function handleSubmit(data: {
    title: string;
    content: string;
    category_id: number;
    tags: string[];
  }) {
    await api.patch<ApiResponse<Post>>(`${API_ENDPOINTS.POSTS.ROOT}/${id}`, data);
    showToast(UI_MESSAGES.POST_UPDATE_SUCCESS);
    navigate(ROUTES.POST_DETAIL(id!));
  }

  if (isLoading) return <LoadingSpinner />;
  if (!post) return null;

  return (
    <div className="write-container">
      <h2 className="page-title">게시글 수정</h2>
      <PostForm
        initialData={{
          title: post.title,
          content: post.content,
          category_id: post.category_id,
          tags: post.tags.map((t) => t.name),
        }}
        onSubmit={handleSubmit}
        submitLabel="수정"
      />
    </div>
  );
}
