import { useDM } from '../../hooks/useDM';
import { useAuth } from '../../hooks/useAuth';
import DMMessageList from './DMMessageList';
import DMInput from './DMInput';

interface Props {
  onBack?: () => void;
}

export default function DMChatPanel({ onBack }: Props) {
  const {
    messages,
    otherUser,
    typingUser,
    hasMoreMessages,
    isLoadingMessages,
    selectedConversationId,
    sendMessage,
    deleteMessage,
    deleteConversation,
    loadOlderMessages,
    sendTyping,
  } = useDM();
  const { user } = useAuth();

  if (!selectedConversationId || !user) return null;

  async function handleDelete() {
    if (!selectedConversationId) return;
    if (confirm('대화를 삭제하시겠습니까?')) {
      await deleteConversation(selectedConversationId);
    }
  }

  return (
    <div className="dm-chat-panel">
      <div className="dm-chat-panel__header">
        <div className="dm-chat-panel__header-left">
          {onBack && (
            <button className="dm-chat-panel__back" onClick={onBack}>
              ←
            </button>
          )}
          <span className="dm-chat-panel__nickname">
            {otherUser?.nickname ?? '...'}
          </span>
        </div>
        <button
          className="dm-chat-panel__delete"
          onClick={handleDelete}
          aria-label="대화 삭제"
        >
          ×
        </button>
      </div>

      <DMMessageList
        messages={messages}
        currentUserId={user.id}
        typingUser={typingUser ? (otherUser?.nickname ?? '...') : null}
        hasMore={hasMoreMessages}
        isLoading={isLoadingMessages}
        onLoadOlder={loadOlderMessages}
        onDeleteMessage={deleteMessage}
      />

      <DMInput
        onSend={sendMessage}
        onTyping={sendTyping}
      />
    </div>
  );
}
