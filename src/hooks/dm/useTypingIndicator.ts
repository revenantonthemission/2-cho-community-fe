import { useState, useCallback, useRef, useEffect } from 'react';

const TYPING_DEBOUNCE = 3000;

interface UseTypingIndicatorParams {
  selectedConversationId: number | null;
  otherUserId: number | null;
  wsSend: (data: Record<string, unknown>) => void;
}

export function useTypingIndicator({
  selectedConversationId,
  otherUserId,
  wsSend,
}: UseTypingIndicatorParams) {
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingCooldownRef = useRef(false);
  const typingCooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 언마운트 또는 인증 해제 시 모든 타이머 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (typingCooldownTimerRef.current) clearTimeout(typingCooldownTimerRef.current);
      typingCooldownRef.current = false;
    };
  }, []);

  const sendTyping = useCallback(() => {
    if (!selectedConversationId || !otherUserId || typingCooldownRef.current) return;
    wsSend({
      type: 'typing_start',
      conversation_id: selectedConversationId,
      recipient_id: otherUserId,
    });
    typingCooldownRef.current = true;
    if (typingCooldownTimerRef.current) clearTimeout(typingCooldownTimerRef.current);
    typingCooldownTimerRef.current = setTimeout(() => {
      typingCooldownRef.current = false;
    }, TYPING_DEBOUNCE);
  }, [selectedConversationId, otherUserId, wsSend]);

  const clearTyping = useCallback(() => {
    setTypingUser(null);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
  }, []);

  return { typingUser, setTypingUser, sendTyping, typingTimerRef, clearTyping };
}
