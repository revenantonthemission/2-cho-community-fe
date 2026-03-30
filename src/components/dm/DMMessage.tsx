import type { DMMessage as DMMessageType } from '../../types/dm';

interface Props {
  message: DMMessageType;
  isMine: boolean;
  onDelete?: (id: number) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function DMMessage({ message: m, isMine, onDelete }: Props) {
  function handleContextMenu(e: React.MouseEvent) {
    if (!isMine || m.is_deleted) return;
    e.preventDefault();
    if (confirm('메시지를 삭제하시겠습니까?')) {
      onDelete?.(m.id);
    }
  }

  if (m.is_deleted) {
    return (
      <div className="dm-msg dm-msg--deleted">
        <span className="dm-msg__time">[{formatTime(m.created_at)}]</span>{' '}
        <span className="dm-msg__nickname">{m.sender_nickname}</span>
        <span className="dm-msg__prompt"> &gt; </span>
        <span className="dm-msg__content--deleted">[deleted]</span>
      </div>
    );
  }

  return (
    <div
      className={`dm-msg ${isMine ? 'dm-msg--mine' : 'dm-msg--other'}`}
      onContextMenu={handleContextMenu}
    >
      <span className="dm-msg__time">[{formatTime(m.created_at)}]</span>{' '}
      <span className={`dm-msg__nickname ${isMine ? 'dm-msg__nickname--mine' : ''}`}>
        {isMine ? '나' : m.sender_nickname}
      </span>
      <span className="dm-msg__prompt"> &gt; </span>
      <span className="dm-msg__content">{m.content}</span>
      {isMine && (
        <span className={`dm-msg__read ${m.is_read ? 'dm-msg__read--read' : ''}`}>
          {m.is_read ? '✓✓' : '✓'}
        </span>
      )}
    </div>
  );
}
