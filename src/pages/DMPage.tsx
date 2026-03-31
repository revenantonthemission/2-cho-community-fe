import { useDM } from '../hooks/useDM';
import DMSidebar from '../components/dm/DMSidebar';
import DMChatPanel from '../components/dm/DMChatPanel';

export default function DMPage() {
  const { selectedConversationId, deselectConversation } = useDM();

  return (
    <div className="dm-page">
      <div className={`dm-page__sidebar ${selectedConversationId !== null ? 'dm-page__sidebar--hidden-mobile' : ''}`}>
        <DMSidebar />
      </div>

      <div className={`dm-page__chat ${selectedConversationId === null ? 'dm-page__chat--hidden-mobile' : ''}`}>
        {selectedConversationId !== null ? (
          <DMChatPanel onBack={deselectConversation} />
        ) : (
          <div className="empty-state dm-empty-state">
            <code>$ mail</code>
            <code>No mail for user</code>
            <p>대화를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
