import { useState, useCallback, useRef, useMemo } from 'react';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { showToast } from '../../utils/toast';
import { UI_MESSAGES } from '../../constants/messages';
import type { Conversation, ConversationListResponse, CreateConversationResponse } from '../../types/dm';
import type { ApiResponse } from '../../types/common';

const CONV_LIMIT = 20;

export function useConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const convOffsetRef = useRef(0);

  const fetchConversations = useCallback(async (reset = false) => {
    setIsLoadingConversations(true);
    try {
      if (reset) convOffsetRef.current = 0;
      const res = await api.get<ApiResponse<ConversationListResponse>>(
        `${API_ENDPOINTS.DM.ROOT}?offset=${convOffsetRef.current}&limit=${CONV_LIMIT}`,
      );
      const { conversations: fetched, pagination } = res.data;
      if (reset) {
        setConversations(fetched);
      } else {
        setConversations((prev) => [...prev, ...fetched]);
      }
      convOffsetRef.current += fetched.length;
      setHasMoreConversations(pagination.has_more);
    } catch {
      showToast(UI_MESSAGES.DM_LOAD_FAIL, 'error');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<{ unread_count: number }>>(
        API_ENDPOINTS.DM.UNREAD_COUNT,
      );
      setUnreadCount(res.data.unread_count);
    } catch {
      // 무시
    }
  }, []);

  const loadMore = useCallback(() => fetchConversations(false), [fetchConversations]);

  const search = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((c) =>
      c.other_user.nickname.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  const create = useCallback(async (recipientId: number): Promise<number> => {
    const res = await api.post<ApiResponse<CreateConversationResponse>>(
      API_ENDPOINTS.DM.ROOT,
      { recipient_id: recipientId },
    );
    const conv = res.data.conversation;
    setConversations((prev) => {
      if (prev.some((c) => c.id === conv.id)) return prev;
      return [
        {
          id: conv.id,
          other_user: conv.other_user,
          created_at: conv.created_at,
          last_message_at: null,
          last_message: null,
          unread_count: 0,
        },
        ...prev,
      ];
    });
    return conv.id;
  }, []);

  const remove = useCallback(async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.DM.DELETE_CONVERSATION(id));
      setConversations((prev) => prev.filter((c) => c.id !== id));
      showToast(UI_MESSAGES.DM_DELETED);
    } catch {
      showToast(UI_MESSAGES.DM_DELETE_FAIL, 'error');
    }
  }, []);

  const update = useCallback(
    (updater: (convs: Conversation[]) => Conversation[]) => setConversations(updater),
    [],
  );

  const reset = useCallback(() => {
    setConversations([]);
    setUnreadCount(0);
    setSearchQuery('');
    convOffsetRef.current = 0;
  }, []);

  return {
    conversations,
    filteredConversations,
    hasMoreConversations,
    isLoadingConversations,
    searchQuery,
    unreadCount,
    setUnreadCount,
    fetchConversations,
    fetchUnreadCount,
    loadMore,
    search,
    create,
    remove,
    update,
    reset,
  };
}
