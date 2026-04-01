import { useEffect, useRef } from 'react';
import { useWebSocket } from '../useWebSocket';

interface UseDMWebSocketParams {
  isAuthenticated: boolean;
  selectedIdRef: React.RefObject<number | null>;
  onNewMessage: (data: {
    conversation_id: number;
    sender_id: number;
    sender_nickname: string;
    content: string;
    created_at: string;
  }) => void;
  onMessageRead: (conversationId: number) => void;
  onMessageDeleted: (conversationId: number, messageId: number) => void;
  onTypingStart: (conversationId: number) => void;
  onTypingStop: (conversationId: number) => void;
  onReconnect: () => void;
}

export function useDMWebSocket({
  isAuthenticated,
  selectedIdRef,
  onNewMessage,
  onMessageRead,
  onMessageDeleted,
  onTypingStart,
  onTypingStop,
  onReconnect,
}: UseDMWebSocketParams) {
  const { subscribe, isConnected } = useWebSocket();
  const prevConnectedRef = useRef(false);

  // WS 이벤트 구독
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubDm = subscribe('dm', (raw) => {
      const data = raw as {
        conversation_id: number;
        sender_id: number;
        sender_nickname: string;
        content: string;
        created_at: string;
      };
      onNewMessage(data);
    });

    const unsubRead = subscribe('message_read', (raw) => {
      const data = raw as { conversation_id: number };
      onMessageRead(data.conversation_id);
    });

    const unsubDeleted = subscribe('message_deleted', (raw) => {
      const data = raw as { conversation_id: number; message_id: number };
      onMessageDeleted(data.conversation_id, data.message_id);
    });

    const unsubTypingStart = subscribe('typing_start', (raw) => {
      const data = raw as { conversation_id: number; sender_id: number };
      onTypingStart(data.conversation_id);
    });

    const unsubTypingStop = subscribe('typing_stop', (raw) => {
      const data = raw as { conversation_id: number };
      onTypingStop(data.conversation_id);
    });

    return () => {
      unsubDm();
      unsubRead();
      unsubDeleted();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [isAuthenticated, subscribe, onNewMessage, onMessageRead, onMessageDeleted, onTypingStart, onTypingStop]);

  // WS 재연결 감지
  useEffect(() => {
    if (isConnected && !prevConnectedRef.current && selectedIdRef.current) {
      onReconnect();
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, selectedIdRef, onReconnect]);
}
