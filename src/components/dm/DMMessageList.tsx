import { useEffect, useRef, useCallback } from 'react';
import type { DMMessage as DMMessageType } from '../../types/dm';
import DMMessage from './DMMessage';
import DMTypingIndicator from './DMTypingIndicator';
import LoadingSpinner from '../LoadingSpinner';

interface Props {
  messages: DMMessageType[];
  currentUserId: number;
  typingUser: string | null;
  hasMore: boolean;
  isLoading: boolean;
  onLoadOlder: () => Promise<void>;
  onDeleteMessage: (id: number) => void;
}

function formatDateDivider(dateStr: string): string {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function DMMessageList({
  messages,
  currentUserId,
  typingUser,
  hasMore,
  isLoading,
  onLoadOlder,
  onDeleteMessage,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef(0);
  const isInitialRef = useRef(true);

  // 최초 로드 시 맨 아래로 스크롤
  useEffect(() => {
    if (isInitialRef.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
      isInitialRef.current = false;
    }
  }, [messages.length]);

  // 새 메시지 수신 시: 하단 근처이거나 내 메시지면 자동 스크롤
  useEffect(() => {
    const container = containerRef.current;
    if (!container || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (lastMsg.sender_id === currentUserId || isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, currentUserId]);

  // 위로 스크롤 시 이전 메시지 로드
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isLoading || !hasMore) return;
    if (container.scrollTop < 50) {
      prevHeightRef.current = container.scrollHeight;
      onLoadOlder().then(() => {
        requestAnimationFrame(() => {
          if (container) {
            container.scrollTop = container.scrollHeight - prevHeightRef.current;
          }
        });
      });
    }
  }, [isLoading, hasMore, onLoadOlder]);

  // 날짜 구분선용 추적 변수
  let lastDate = '';

  return (
    <div
      ref={containerRef}
      className="dm-message-list"
      onScroll={handleScroll}
    >
      {isLoading && hasMore && (
        <div className="dm-message-list__loader">
          <LoadingSpinner />
        </div>
      )}
      {messages.map((m) => {
        const msgDate = formatDateDivider(m.created_at);
        const showDivider = msgDate !== lastDate;
        lastDate = msgDate;

        return (
          <div key={m.id}>
            {showDivider && (
              <div className="dm-date-divider">
                # ─── {msgDate} ───
              </div>
            )}
            <DMMessage
              message={m}
              isMine={m.sender_id === currentUserId}
              onDelete={onDeleteMessage}
            />
          </div>
        );
      })}
      {typingUser && <DMTypingIndicator nickname={typingUser} />}
      <div ref={bottomRef} />
    </div>
  );
}
