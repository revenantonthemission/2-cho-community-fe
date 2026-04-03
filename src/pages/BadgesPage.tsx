import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { API_ENDPOINTS } from '../constants/endpoints';
import { UI_MESSAGES } from '../constants/messages';
import { showToast } from '../utils/toast';
import { useAuth } from '../hooks/useAuth';
import BadgeCard from '../components/BadgeCard';
import LoadingSpinner from '../components/LoadingSpinner';
import HeroSection from '../components/HeroSection';
import type { ApiResponse } from '../types/common';
import type {
  BadgeDefinition, UserBadge, ReputationResponse,
} from '../types/activity';

export default function BadgesPage() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState<BadgeDefinition[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [reputation, setReputation] = useState<ReputationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const badgesRes = await api.get<ApiResponse<{ badges: BadgeDefinition[] }>>(
          API_ENDPOINTS.BADGES.ALL,
        );
        setAllBadges(badgesRes.data.badges);

        if (user) {
          const [earnedRes, repRes] = await Promise.all([
            api.get<ApiResponse<{ badges: UserBadge[] }>>(
              API_ENDPOINTS.REPUTATION.USER_BADGES(user.id),
            ),
            api.get<ApiResponse<ReputationResponse>>(
              API_ENDPOINTS.REPUTATION.USER(user.id),
            ),
          ]);
          setEarnedBadges(earnedRes.data.badges);
          setReputation(repRes.data);
        }
      } catch {
        showToast(UI_MESSAGES.BADGES_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  if (isLoading) return <LoadingSpinner />;

  // 카테고리별 뱃지 그룹화
  const categories = [...new Set(allBadges.map((b) => b.category))];
  const earnedMap = new Map(earnedBadges.map((b) => [b.badge_id, b]));

  return (
    <div className="badges-page">
      <HeroSection title="배지" subtitle="커뮤니티 활동으로 획득하는 배지 컬렉션" />

      {reputation && (
        <div className="badges-page__reputation">
          <span className="badges-page__score">평판: {reputation.reputation_score}</span>
          {reputation.trust_level_name && (
            <span className="badges-page__trust">신뢰 등급: {reputation.trust_level_name}</span>
          )}
          <span className="badges-page__count">획득 뱃지: {earnedBadges.length}/{allBadges.length}</span>
        </div>
      )}

      {categories.map((category) => (
        <div key={category} className="badges-category">
          <h2 className="badges-category__title">{category}</h2>
          <div className="badges-grid">
            {allBadges
              .filter((b) => b.category === category)
              .map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedMap.get(badge.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
