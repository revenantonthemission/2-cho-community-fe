import type { Conversation } from '../../types/dm';

interface Props {
  conversation: Conversation;
  isSelected: boolean;
  onClick: (id: number) => void;
}

function formatCardTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

function getPreviewText(conversation: Conversation): string {
  const lm = conversation.last_message;
  if (!lm) return '';
  if (lm.is_deleted) return '[deleted]';
  return lm.content ?? '';
}

export default function DMConversationCard({
  conversation: c,
  isSelected,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={`dm-conv-card ${isSelected ? 'dm-conv-card--selected' : ''} ${c.unread_count > 0 ? 'dm-conv-card--unread' : ''}`}
      onClick={() => onClick(c.id)}
    >
      <div className="dm-conv-card__top">
        <span className="dm-conv-card__nickname">{c.other_user.nickname}</span>
        <div className="dm-conv-card__meta">
          {c.unread_count > 0 && (
            <span className="dm-conv-card__badge">
              {c.unread_count > 99 ? '99+' : c.unread_count}
            </span>
          )}
          <span className="dm-conv-card__time">
            {formatCardTime(c.last_message_at ?? c.created_at)}
          </span>
        </div>
      </div>
      <div className="dm-conv-card__preview">{getPreviewText(c)}</div>
    </button>
  );
}
