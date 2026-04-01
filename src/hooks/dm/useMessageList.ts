import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { showToast } from '../../utils/toast';
import { UI_MESSAGES } from '../../constants/messages';
import type { DMMessage, DMUser, MessageListResponse } from '../../types/dm';
import type { ApiResponse } from '../../types/common';

const MSG_LIMIT = 50;

export function useMessageList() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherUser, setOtherUser] = useState<DMUser | null>(null);

  const msgOffsetRef = useRef(0);
  const selectedIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const select = useCallback(async (id: number) => {
    setSelectedConversationId(id);
    setMessages([]);
    setIsLoadingMessages(true);
    msgOffsetRef.current = 0;

    try {
      const res = await api.get<ApiResponse<MessageListResponse>>(
        `${API_ENDPOINTS.DM.MESSAGES(id)}?offset=0&limit=${MSG_LIMIT}`,
      );
      setMessages(res.data.messages);
      setOtherUser(res.data.other_user);
      setHasMoreMessages(res.data.pagination.has_more);
      msgOffsetRef.current = res.data.messages.length;
    } catch {
      showToast(UI_MESSAGES.DM_MESSAGES_FAIL, 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const deselect = useCallback(() => {
    setSelectedConversationId(null);
    setMessages([]);
    setOtherUser(null);
  }, []);

  const loadOlder = useCallback(async () => {
    if (!selectedConversationId || isLoadingMessages) return;
    setIsLoadingMessages(true);
    try {
      const res = await api.get<ApiResponse<MessageListResponse>>(
        `${API_ENDPOINTS.DM.MESSAGES(selectedConversationId)}?offset=${msgOffsetRef.current}&limit=${MSG_LIMIT}`,
      );
      const older = res.data.messages;
      setMessages((prev) => [...older, ...prev]);
      msgOffsetRef.current += older.length;
      setHasMoreMessages(res.data.pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.DM_MESSAGES_FAIL, 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversationId, isLoadingMessages]);

  const reset = useCallback(() => {
    setSelectedConversationId(null);
    setMessages([]);
    setOtherUser(null);
    msgOffsetRef.current = 0;
  }, []);

  return {
    selectedConversationId,
    selectedIdRef,
    messages,
    hasMoreMessages,
    isLoadingMessages,
    otherUser,
    select,
    deselect,
    loadOlder,
    setMessages,
    reset,
  };
}
