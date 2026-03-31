import { useRef, useCallback } from 'react';
import { useDM } from '../../hooks/useDM';
import DMConversationCard from './DMConversationCard';

export default function DMSidebar() {
  const {
    filteredConversations,
    hasMoreConversations,
    isLoadingConversations,
    selectedConversationId,
    selectConversation,
    loadMoreConversations,
    searchConversations,
  } = useDM();

  const listRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || isLoadingConversations || !hasMoreConversations) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
      loadMoreConversations();
    }
  }, [isLoadingConversations, hasMoreConversations, loadMoreConversations]);

  return (
    <div className="dm-sidebar">
      <div className="dm-sidebar__search">
        <input
          className="dm-sidebar__search-input"
          type="text"
          placeholder="$ grep nickname..."
          onChange={(e) => searchConversations(e.target.value)}
        />
      </div>
      <div
        ref={listRef}
        className="dm-sidebar__list"
        onScroll={handleScroll}
      >
        {filteredConversations.length === 0 && !isLoadingConversations ? (
          <div className="dm-sidebar__empty"><code>$ mail</code><br />대화가 없습니다</div>
        ) : (
          filteredConversations.map((c) => (
            <DMConversationCard
              key={c.id}
              conversation={c}
              isSelected={selectedConversationId === c.id}
              onClick={selectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
