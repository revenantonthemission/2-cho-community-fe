import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { timeAgo } from '../utils/formatters';
import type { Notification, NotificationType } from '../types/notification';

const TYPE_CONFIG: Record<
  NotificationType,
  { label: string; color: string }
> = {
  comment: { label: '댓글', color: 'var(--color-primary)' },
  like: { label: '좋아요', color: 'var(--color-error)' },
  mention: { label: '멘션', color: 'var(--color-warning)' },
  follow: { label: '팔로우', color: 'var(--color-success)' },
  bookmark: { label: '북마크', color: 'var(--color-info)' },
  reply: { label: '답글', color: 'var(--color-primary-accent)' },
  badge_earned: { label: '뱃지', color: 'var(--color-warning)' },
  level_up: { label: '레벨업', color: 'var(--color-warning)' },
};

const MESSAGE_MAP: Record<NotificationType, string> = {
  comment: '님이 게시글에 댓글을 달았습니다',
  like: '님이 게시글을 좋아합니다',
  mention: '님이 댓글에서 언급했습니다',
  follow: '님이 팔로우합니다',
  bookmark: '님이 게시글을 북마크했습니다',
  reply: '님이 답글을 달았습니다',
  badge_earned: '새 뱃지를 획득했습니다',
  level_up: '레벨이 올랐습니다',
};

interface Props {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete?: (id: number) => void;
  compact?: boolean; // 드롭다운에서는 true (삭제 버튼 숨김)
}


export default function NotificationItem({
  notification: n,
  onRead,
  onDelete,
  compact = false,
}: Props) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[n.type];

  function handleClick() {
    if (!n.is_read) onRead(n.notification_id);

    if (n.post_id) {
      navigate(ROUTES.POST_DETAIL(n.post_id));
    } else if (n.type === 'follow') {
      navigate(ROUTES.USER_PROFILE(n.actor.user_id));
    }
    // badge_earned, level_up: 읽음 처리만
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(n.notification_id);
  }

  const showPostTitle = n.post_id !== null;

  return (
    <button
      type="button"
      className={`notification-item ${n.is_read ? 'notification-item--read' : 'notification-item--unread'}`}
      onClick={handleClick}
    >
      <div className="notification-item__body">
        <div className="notification-item__meta">
          <span className="notification-item__time">
            [{timeAgo(n.created_at)}]
          </span>
          <span
            className="notification-item__tag"
            style={{ backgroundColor: config.color }}
          >
            {config.label}
          </span>
        </div>
        <div className="notification-item__message">
          <span className="notification-item__actor">{n.actor.nickname}</span>
          {' > '}
          {MESSAGE_MAP[n.type]}
        </div>
        {showPostTitle && (
          <div className="notification-item__post-title">→ {n.post_title}</div>
        )}
      </div>
      {!compact && onDelete && (
        <button
          className="notification-item__delete"
          onClick={handleDelete}
          aria-label="알림 삭제"
        >
          ×
        </button>
      )}
    </button>
  );
}
