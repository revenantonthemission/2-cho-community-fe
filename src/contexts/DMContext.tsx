import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { showToast } from '../utils/toast';
import { UI_MESSAGES } from '../constants/messages';
import type {
  Conversation,
  DMMessage,
  DMUser,
  ConversationListResponse,
  MessageListResponse,
  SentMessageResponse,
  CreateConversationResponse,
} from '../types/dm';
import type { ApiResponse } from '../types/common';

const CONV_LIMIT = 20;
const MSG_LIMIT = 50;
const TYPING_DEBOUNCE = 3000;

export interface DMContextType {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  hasMoreConversations: boolean;
  isLoadingConversations: boolean;
  selectedConversationId: number | null;
  messages: DMMessage[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  otherUser: DMUser | null;
  unreadCount: number;
  typingUser: string | null;
  selectConversation: (id: number) => Promise<void>;
  deselectConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  createConversation: (recipientId: number) => Promise<number>;
  loadMoreConversations: () => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  sendTyping: () => void;
  searchConversations: (query: string) => void;
}

export const DMContext = createContext<DMContextType | null>(null);

export function DMProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { subscribe, send, isConnected } = useWebSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [otherUser, setOtherUser] = useState<DMUser | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const convOffsetRef = useRef(0);
  const msgOffsetRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingCooldownRef = useRef(false);
  const selectedIdRef = useRef<number | null>(null);

  useEffect(() => {
    selectedIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // ── 초기 로딩 ──

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

  useEffect(() => {
    if (!isAuthenticated) {
      setConversations([]);
      setMessages([]);
      setSelectedConversationId(null);
      setOtherUser(null);
      setUnreadCount(0);
      setSearchQuery('');
      return;
    }
    fetchConversations(true);
    fetchUnreadCount();
  }, [isAuthenticated, fetchConversations, fetchUnreadCount]);

  // ── 대화 선택 ──

  const selectConversation = useCallback(async (id: number) => {
    setSelectedConversationId(id);
    setMessages([]);
    setIsLoadingMessages(true);
    msgOffsetRef.current = 0;
    setTypingUser(null);

    try {
      const res = await api.get<ApiResponse<MessageListResponse>>(
        `${API_ENDPOINTS.DM.MESSAGES(id)}?offset=0&limit=${MSG_LIMIT}`,
      );
      setMessages(res.data.messages);
      setOtherUser(res.data.other_user);
      setHasMoreMessages(res.data.pagination.has_more);
      msgOffsetRef.current = res.data.messages.length;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === id && c.unread_count > 0) {
            setUnreadCount((u) => Math.max(0, u - 1));
            return { ...c, unread_count: 0 };
          }
          return c;
        }),
      );
    } catch {
      showToast(UI_MESSAGES.DM_MESSAGES_FAIL, 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const deselectConversation = useCallback(() => {
    setSelectedConversationId(null);
    setMessages([]);
    setOtherUser(null);
    setTypingUser(null);
  }, []);

  // ── 이전 메시지 로딩 ──

  const loadOlderMessages = useCallback(async () => {
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

  // ── 메시지 전송 ──

  const sendMessage = useCallback(async (content: string) => {
    if (!selectedConversationId || !user) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    const tempId = Date.now();
    const optimistic: DMMessage = {
      id: tempId,
      sender_id: user.id,
      sender_nickname: user.nickname,
      sender_profile_image: user.profile_image || '',
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await api.post<ApiResponse<SentMessageResponse>>(
        API_ENDPOINTS.DM.SEND(selectedConversationId),
        { content: trimmed },
      );
      const sent = res.data.message;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...optimistic, id: sent.id, created_at: sent.created_at }
            : m,
        ),
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversationId
            ? {
                ...c,
                last_message: { content: trimmed, is_mine: true, is_deleted: false },
                last_message_at: sent.created_at,
              }
            : c,
        ),
      );
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const apiErr = err as { status?: number };
      if (apiErr.status === 403) {
        showToast(UI_MESSAGES.DM_BLOCKED, 'error');
      } else {
        showToast(UI_MESSAGES.DM_SEND_FAIL, 'error');
      }
    }
  }, [selectedConversationId, user]);

  // ── 삭제 ──

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!selectedConversationId) return;
    try {
      await api.delete(
        API_ENDPOINTS.DM.DELETE_MESSAGE(selectedConversationId, messageId),
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: null } : m,
        ),
      );
    } catch {
      showToast(UI_MESSAGES.DM_DELETE_FAIL, 'error');
    }
  }, [selectedConversationId]);

  const deleteConversation = useCallback(async (id: number) => {
    try {
      await api.delete(API_ENDPOINTS.DM.DELETE_CONVERSATION(id));
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        deselectConversation();
      }
      showToast(UI_MESSAGES.DM_DELETED);
    } catch {
      showToast(UI_MESSAGES.DM_DELETE_FAIL, 'error');
    }
  }, [selectedConversationId, deselectConversation]);

  // ── 대화 생성 ──

  const createConversation = useCallback(async (recipientId: number): Promise<number> => {
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

  // ── 검색 ──

  const searchConversations = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((c) =>
      c.other_user.nickname.toLowerCase().includes(q),
    );
  }, [conversations, searchQuery]);

  // ── 타이핑 전송 ──

  const sendTyping = useCallback(() => {
    if (!selectedConversationId || !otherUser || typingCooldownRef.current) return;
    send({
      type: 'typing_start',
      conversation_id: selectedConversationId,
      recipient_id: otherUser.user_id,
    });
    typingCooldownRef.current = true;
    setTimeout(() => {
      typingCooldownRef.current = false;
    }, TYPING_DEBOUNCE);
  }, [selectedConversationId, otherUser, send]);

  // ── WS 이벤트 구독 ──

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

      if (selectedIdRef.current === data.conversation_id) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender_id: data.sender_id,
            sender_nickname: data.sender_nickname,
            sender_profile_image: '',
            content: data.content,
            is_read: true,
            created_at: data.created_at,
            is_deleted: false,
          },
        ]);
        api.patch(API_ENDPOINTS.DM.READ(data.conversation_id)).catch(() => {});
        setTypingUser(null);
      } else {
        setUnreadCount((prev) => prev + 1);
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === data.conversation_id
              ? {
                  ...c,
                  unread_count: c.unread_count + 1,
                  last_message: {
                    content: data.content,
                    is_mine: false,
                    is_deleted: false,
                  },
                  last_message_at: data.created_at,
                }
              : c,
          );
          const target = updated.find((c) => c.id === data.conversation_id);
          if (target) {
            return [target, ...updated.filter((c) => c.id !== data.conversation_id)];
          }
          return updated;
        });
      }
    });

    const unsubRead = subscribe('message_read', (raw) => {
      const data = raw as { conversation_id: number };
      if (selectedIdRef.current === data.conversation_id) {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, is_read: true })),
        );
      }
    });

    const unsubDeleted = subscribe('message_deleted', (raw) => {
      const data = raw as { conversation_id: number; message_id: number };
      if (selectedIdRef.current === data.conversation_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === data.message_id
              ? { ...m, is_deleted: true, content: null }
              : m,
          ),
        );
      }
    });

    const unsubTypingStart = subscribe('typing_start', (raw) => {
      const data = raw as { conversation_id: number; sender_id: number };
      if (selectedIdRef.current === data.conversation_id) {
        setTypingUser((prev) => prev ?? '...');
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingUser(null), TYPING_DEBOUNCE);
      }
    });

    const unsubTypingStop = subscribe('typing_stop', (raw) => {
      const data = raw as { conversation_id: number };
      if (selectedIdRef.current === data.conversation_id) {
        setTypingUser(null);
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = null;
        }
      }
    });

    return () => {
      unsubDm();
      unsubRead();
      unsubDeleted();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [isAuthenticated, subscribe]);

  // WS 재연결 시 현재 대화 re-fetch
  useEffect(() => {
    if (isConnected && selectedConversationId) {
      selectConversation(selectedConversationId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  const loadMoreConversations = useCallback(
    () => fetchConversations(false),
    [fetchConversations],
  );

  const value = useMemo(
    () => ({
      conversations,
      filteredConversations,
      hasMoreConversations,
      isLoadingConversations,
      selectedConversationId,
      messages,
      hasMoreMessages,
      isLoadingMessages,
      otherUser,
      unreadCount,
      typingUser,
      selectConversation,
      deselectConversation,
      sendMessage,
      deleteMessage,
      deleteConversation,
      createConversation,
      loadMoreConversations,
      loadOlderMessages,
      sendTyping,
      searchConversations,
    }),
    [
      conversations,
      filteredConversations,
      hasMoreConversations,
      isLoadingConversations,
      selectedConversationId,
      messages,
      hasMoreMessages,
      isLoadingMessages,
      otherUser,
      unreadCount,
      typingUser,
      selectConversation,
      deselectConversation,
      sendMessage,
      deleteMessage,
      deleteConversation,
      createConversation,
      loadMoreConversations,
      loadOlderMessages,
      sendTyping,
      searchConversations,
    ],
  );

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
}
