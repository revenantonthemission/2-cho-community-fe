import {
  createContext,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { useConversationList } from '../hooks/dm/useConversationList';
import { useMessageList } from '../hooks/dm/useMessageList';
import { useMessageActions } from '../hooks/dm/useMessageActions';
import { useDMWebSocket } from '../hooks/dm/useDMWebSocket';
import { useTypingIndicator } from '../hooks/dm/useTypingIndicator';
import type { Conversation, DMMessage } from '../types/dm';

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
  otherUser: import('../types/dm').DMUser | null;
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
  const { send } = useWebSocket();

  // ── 훅 조합 ──
  const convList = useConversationList();
  const msgList = useMessageList();
  const msgActions = useMessageActions({
    selectedConversationId: msgList.selectedConversationId,
    userId: user?.id ?? null,
    userNickname: user?.nickname ?? null,
    userProfileImage: user?.profile_image ?? null,
    onMessagesUpdate: msgList.setMessages,
    onConversationsUpdate: convList.update,
  });
  const typing = useTypingIndicator({
    selectedConversationId: msgList.selectedConversationId,
    otherUserId: msgList.otherUser?.user_id ?? null,
    wsSend: send,
  });

  // ── 대화 선택 래핑 (unreadCount 감소 연결) ──
  const selectConversation = useCallback(async (id: number) => {
    await msgList.select(id);
    typing.clearTyping();
    // unread_count 감소는 updater 외부에서 수행 (updater 내 side effect 방지)
    const conv = convList.conversations.find((c) => c.id === id);
    if (conv && conv.unread_count > 0) {
      convList.setUnreadCount((u) => Math.max(0, u - 1));
    }
    convList.update((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c)),
    );
  }, [msgList, typing, convList]);

  const deselectConversation = useCallback(() => {
    msgList.deselect();
    typing.clearTyping();
  }, [msgList, typing]);

  // ── 대화 삭제 래핑 (deselect 연결) ──
  const deleteConversation = useCallback(async (id: number) => {
    await convList.remove(id);
    if (msgList.selectedConversationId === id) {
      deselectConversation();
    }
  }, [convList, msgList.selectedConversationId, deselectConversation]);

  // ── WS 콜백 연결 ──
  const handleNewMessage = useCallback((data: {
    conversation_id: number;
    sender_id: number;
    sender_nickname: string;
    content: string;
    created_at: string;
  }) => {
    if (msgList.selectedIdRef.current === data.conversation_id) {
      msgList.setMessages((prev) => [
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
      typing.clearTyping();
    } else {
      convList.setUnreadCount((prev) => prev + 1);
      convList.update((prev) => {
        const updated = prev.map((c) =>
          c.id === data.conversation_id
            ? {
                ...c,
                unread_count: c.unread_count + 1,
                last_message: { content: data.content, is_mine: false, is_deleted: false },
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
  }, [msgList, convList, typing]);

  const handleMessageRead = useCallback((conversationId: number) => {
    if (msgList.selectedIdRef.current === conversationId) {
      msgList.setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    }
  }, [msgList]);

  const handleMessageDeleted = useCallback((conversationId: number, messageId: number) => {
    if (msgList.selectedIdRef.current === conversationId) {
      msgList.setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, content: null } : m)),
      );
    }
  }, [msgList]);

  const handleTypingStart = useCallback((conversationId: number) => {
    if (msgList.selectedIdRef.current === conversationId) {
      typing.setTypingUser((prev) => prev ?? '...');
      if (typing.typingTimerRef.current) clearTimeout(typing.typingTimerRef.current);
      typing.typingTimerRef.current = setTimeout(() => typing.setTypingUser(null), TYPING_DEBOUNCE);
    }
  }, [msgList, typing]);

  const handleTypingStop = useCallback((conversationId: number) => {
    if (msgList.selectedIdRef.current === conversationId) {
      typing.clearTyping();
    }
  }, [msgList, typing]);

  const handleReconnect = useCallback(() => {
    if (msgList.selectedIdRef.current) {
      selectConversation(msgList.selectedIdRef.current);
    }
  }, [msgList, selectConversation]);

  useDMWebSocket({
    isAuthenticated,
    selectedIdRef: msgList.selectedIdRef,
    onNewMessage: handleNewMessage,
    onMessageRead: handleMessageRead,
    onMessageDeleted: handleMessageDeleted,
    onTypingStart: handleTypingStart,
    onTypingStop: handleTypingStop,
    onReconnect: handleReconnect,
  });

  // ── 인증 게이트 ──
  useEffect(() => {
    if (!isAuthenticated) {
      convList.reset();
      msgList.reset();
      typing.clearTyping();
      return;
    }
    convList.fetchConversations(true);
    convList.fetchUnreadCount();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── context value ──
  const value = useMemo(
    () => ({
      conversations: convList.conversations,
      filteredConversations: convList.filteredConversations,
      hasMoreConversations: convList.hasMoreConversations,
      isLoadingConversations: convList.isLoadingConversations,
      selectedConversationId: msgList.selectedConversationId,
      messages: msgList.messages,
      hasMoreMessages: msgList.hasMoreMessages,
      isLoadingMessages: msgList.isLoadingMessages,
      otherUser: msgList.otherUser,
      unreadCount: convList.unreadCount,
      typingUser: typing.typingUser,
      selectConversation,
      deselectConversation,
      sendMessage: msgActions.sendMessage,
      deleteMessage: msgActions.deleteMessage,
      deleteConversation,
      createConversation: convList.create,
      loadMoreConversations: convList.loadMore,
      loadOlderMessages: msgList.loadOlder,
      sendTyping: typing.sendTyping,
      searchConversations: convList.search,
    }),
    [convList, msgList, msgActions, typing, selectConversation, deselectConversation, deleteConversation],
  );

  return <DMContext.Provider value={value}>{children}</DMContext.Provider>;
}
