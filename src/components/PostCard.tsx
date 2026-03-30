import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { Post } from '../types/post';
import { ROUTES } from '../constants/routes';
import { timeAgo, formatCount } from '../utils/formatters';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(ROUTES.POST_DETAIL(post.post_id));
  }

  const cardClass = ['post-card', post.is_pinned ? 'pinned' : ''].filter(Boolean).join(' ');

  return (
    <li className={cardClass} onClick={handleClick} style={{ cursor: 'pointer' }}>
      <div className="post-card__meta">
        <div
          className="post-card__avatar"
          style={
            post.author.profileImageUrl
              ? { backgroundImage: `url(${post.author.profileImageUrl})` }
              : undefined
          }
        />
        <div className="post-card__meta-text">
          <span className="post-card__author">{post.author.nickname}</span>
          <span className="post-card__date">{timeAgo(post.created_at)}</span>
        </div>
      </div>

      <div className="post-card__body">
        <div className="post-badges">
          <span className="category-badge">{post.category_name}</span>
          {post.is_pinned && <span className="pin-badge">고정</span>}
        </div>
        <h3 className="post-title">{post.title}</h3>
        {post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map((tag) => (
              <span key={tag.id} className="tag-badge">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="post-card__footer">
        <div className="post-stats">
          <span><Heart size={14} /> {formatCount(post.likes_count)}</span>
          <span><MessageCircle size={14} /> {formatCount(post.comments_count)}</span>
          <span><Eye size={14} /> {formatCount(post.views_count)}</span>
        </div>
      </div>
    </li>
  );
}
