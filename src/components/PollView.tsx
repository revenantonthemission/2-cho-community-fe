import { useState } from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { showToast } from '../utils/toast';
import { useAuth } from '../hooks/useAuth';
import type { Poll } from '../types/post';

interface Props {
  postId: number;
  poll: Poll;
  onUpdate: (poll: Poll) => void;
}

export default function PollView({ postId, poll, onUpdate }: Props) {
  const { isAuthenticated } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(poll.my_vote);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasVoted = poll.my_vote !== null;
  const showResults = hasVoted || poll.is_expired;

  async function handleVote() {
    if (!selectedOption || isSubmitting) return;
    if (hasVoted && selectedOption === poll.my_vote) return;
    setIsSubmitting(true);
    try {
      if (hasVoted) {
        await api.put(API_ENDPOINTS.POLL.VOTE(postId), { option_id: selectedOption });
        showToast('투표가 변경되었습니다.');
      } else {
        await api.post(API_ENDPOINTS.POLL.VOTE(postId), { option_id: selectedOption });
        showToast('투표가 완료되었습니다.');
      }
      // 낙관적 업데이트
      const updated = { ...poll };
      if (hasVoted && poll.my_vote !== selectedOption) {
        updated.options = updated.options.map((o) => ({
          ...o,
          vote_count: o.option_id === poll.my_vote
            ? o.vote_count - 1
            : o.option_id === selectedOption
              ? o.vote_count + 1
              : o.vote_count,
        }));
      } else if (!hasVoted) {
        updated.options = updated.options.map((o) => ({
          ...o,
          vote_count: o.option_id === selectedOption ? o.vote_count + 1 : o.vote_count,
        }));
        updated.total_votes += 1;
      }
      updated.my_vote = selectedOption;
      onUpdate(updated);
    } catch {
      showToast('투표에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.delete(API_ENDPOINTS.POLL.VOTE(postId));
      showToast('투표가 취소되었습니다.');
      const updated = { ...poll };
      updated.options = updated.options.map((o) => ({
        ...o,
        vote_count: o.option_id === poll.my_vote ? o.vote_count - 1 : o.vote_count,
      }));
      updated.total_votes -= 1;
      updated.my_vote = null;
      setSelectedOption(null);
      onUpdate(updated);
    } catch {
      showToast('투표 취소에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="poll-view">
      <h4 className="poll-view__question">{poll.question}</h4>

      {poll.is_expired && (
        <span className="poll-view__expired">투표 종료</span>
      )}

      <div className="poll-view__options">
        {poll.options.map((opt) => {
          const pct = poll.total_votes > 0
            ? Math.round((opt.vote_count / poll.total_votes) * 100)
            : 0;
          const isMyVote = poll.my_vote === opt.option_id;

          return showResults ? (
            <div key={opt.option_id} className={`poll-result${isMyVote ? ' poll-result--mine' : ''}`}>
              <div className="poll-result__bar" style={{ width: `${pct}%` }} />
              <span className="poll-result__text">{opt.option_text}</span>
              <span className="poll-result__pct">{pct}%</span>
            </div>
          ) : (
            <label key={opt.option_id} className="poll-option">
              <input
                type="radio"
                name="poll-vote"
                value={opt.option_id}
                checked={selectedOption === opt.option_id}
                onChange={() => setSelectedOption(opt.option_id)}
                disabled={!isAuthenticated || poll.is_expired}
              />
              {opt.option_text}
            </label>
          );
        })}
      </div>

      <div className="poll-view__footer">
        <span className="poll-view__count">{poll.total_votes}명 참여</span>

        {isAuthenticated && !poll.is_expired && (
          <div className="poll-view__actions">
            {!showResults && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleVote}
                disabled={!selectedOption || isSubmitting}
              >
                투표
              </button>
            )}
            {hasVoted && !poll.is_expired && (
              <>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setSelectedOption(poll.my_vote); onUpdate({ ...poll }); }}
                >
                  변경
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  취소
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
