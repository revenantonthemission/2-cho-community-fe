import { useCallback } from 'react';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { showToast } from '../../utils/toast';
import { UI_MESSAGES } from '../../constants/messages';
import type { DMMessage, Conversation, SentMessageResponse } from '../../types/dm';
import type { ApiResponse } from '../../types/common';

interface UseMessageActionsParams {
  selectedConversationId: number | null;
  userId: number | null;
  userNickname: string | null;
  userProfileImage: string | null;
  onMessagesUpdate: React.Dispatch<React.SetStateAction<DMMessage[]>>;
  onConversationsUpdate: (updater: (convs: Conversation[]) => Conversation[]) => void;
}

export function useMessageActions({
  selectedConversationId,
  userId,
  userNickname,
  userProfileImage,
  onMessagesUpdate,
  onConversationsUpdate,
}: UseMessageActionsParams) {
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedConversationId || !userId) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    const tempId = Date.now();
    const optimistic: DMMessage = {
      id: tempId,
      sender_id: userId,
      sender_nickname: userNickname || '',
      sender_profile_image: userProfileImage || '',
      content: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
      is_deleted: false,
    };
    onMessagesUpdate((prev) => [...prev, optimistic]);

    try {
      const res = await api.post<ApiResponse<SentMessageResponse>>(
        API_ENDPOINTS.DM.SEND(selectedConversationId),
        { content: trimmed },
      );
      const sent = res.data.message;
      onMessagesUpdate((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...optimistic, id: sent.id, created_at: sent.created_at }
            : m,
        ),
      );
      onConversationsUpdate((prev) =>
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
      onMessagesUpdate((prev) => prev.filter((m) => m.id !== tempId));
      const apiErr = err as { status?: number };
      if (apiErr.status === 403) {
        showToast(UI_MESSAGES.DM_BLOCKED, 'error');
      } else {
        showToast(UI_MESSAGES.DM_SEND_FAIL, 'error');
      }
    }
  }, [selectedConversationId, userId, userNickname, userProfileImage, onMessagesUpdate, onConversationsUpdate]);

  const deleteMessage = useCallback(async (messageId: number) => {
    if (!selectedConversationId) return;
    try {
      await api.delete(
        API_ENDPOINTS.DM.DELETE_MESSAGE(selectedConversationId, messageId),
      );
      onMessagesUpdate((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, is_deleted: true, content: null } : m,
        ),
      );
    } catch {
      showToast(UI_MESSAGES.DM_DELETE_FAIL, 'error');
    }
  }, [selectedConversationId, onMessagesUpdate]);

  return { sendMessage, deleteMessage };
}
