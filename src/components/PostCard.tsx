import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Bell } from 'lucide-react';
import { Post } from '../types/post';
import { ROUTES } from '../constants/routes';
import { timeAgo, formatCount } from '../utils/formatters';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const cardClass = [
    'post-card',
    post.is_pinned ? 'pinned' : '',
    post.is_read ? 'post-card--read' : '',
  ].filter(Boolean).join(' ');

  const isAbsoluteUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://');
  const hasValidImage = post.author.profileImageUrl && isAbsoluteUrl(post.author.profileImageUrl);
  const avatarInitial = post.author.nickname.charAt(0).toUpperCase();

  return (
    <li className={cardClass}>
      <Link to={ROUTES.POST_DETAIL(post.post_id)} className="post-card__link">
        <div className="post-card__meta">
          {hasValidImage ? (
            <div
              className="post-card__avatar"
              style={{ backgroundImage: `url(${post.author.profileImageUrl})` }}
            />
          ) : (
            <div className="post-card__avatar post-card__avatar--initials">
              {avatarInitial}
            </div>
          )}
          <div className="post-card__meta-text">
            <Link
              to={ROUTES.USER_PROFILE(post.author.user_id)}
              className="post-card__author"
              onClick={(e) => e.stopPropagation()}
            >
              {post.author.nickname}
            </Link>
            {post.author.distro && <span className="distro-badge">{post.author.distro}</span>}
            {post.is_watching && <Bell size={12} className="post-card__watching" />}
            <span className="post-card__date">{timeAgo(post.created_at)}</span>
          </div>
        </div>

        <div className="post-card__body">
          <div className="post-badges">
            <span className="category-badge">{post.category_name}</span>
            {post.is_pinned && <span className="pin-badge">고정</span>}
            {post.category_name === 'Q&A' && (
              <span className={`qa-badge qa-badge--${post.is_solved ? 'solved' : 'unsolved'}`}>
                {post.is_solved ? '해결됨' : '미해결'}
              </span>
            )}
          </div>
          <h3 className="post-title">{post.title}</h3>
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <Link
                  key={tag.id}
                  to={ROUTES.TAG_DETAIL(tag.name)}
                  className="tag-badge"
                  onClick={(e) => e.stopPropagation()}
                >
                  #{tag.name}
                </Link>
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
      </Link>
    </li>
  );
}
