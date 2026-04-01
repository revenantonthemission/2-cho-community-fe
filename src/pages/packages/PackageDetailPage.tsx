import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/endpoints';
import { ROUTES } from '../../constants/routes';
import { UI_MESSAGES } from '../../constants/messages';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import { timeAgo } from '../../utils/formatters';
import StarRating from '../../components/packages/StarRating';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { ApiResponse } from '../../types/common';
import type { PackageDetail, PackageReview, ReviewListResponse } from '../../types/package';

const REVIEW_SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '오래된순' },
  { value: 'highest', label: '높은 평점' },
  { value: 'lowest', label: '낮은 평점' },
];

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [reviews, setReviews] = useState<PackageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewSort, setReviewSort] = useState('latest');

  // 리뷰 폼 상태
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<PackageReview | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const pkgId = Number(id);

  // 패키지 상세 로드
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIsLoading(true);
      try {
        const res = await api.get<ApiResponse<PackageDetail>>(
          API_ENDPOINTS.PACKAGES.DETAIL(pkgId),
        );
        setPkg(res.data);
      } catch {
        showToast(UI_MESSAGES.PKG_LOAD_FAIL, 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, pkgId]);

  // 리뷰 목록 로드
  const loadReviews = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get<ApiResponse<ReviewListResponse>>(
        `${API_ENDPOINTS.PACKAGES.REVIEWS(pkgId)}?offset=0&limit=50&sort=${reviewSort}`,
      );
      setReviews(res.data.reviews);
    } catch {
      showToast('리뷰를 불러오지 못했습니다.', 'error');
    }
  }, [id, pkgId, reviewSort]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // 이미 리뷰 작성했는지 확인
  const myReview = user ? reviews.find((r) => r.author.user_id === user.id) : null;
  const canEdit = user && pkg && (user.id === pkg.created_by || user.role === 'admin');

  // 리뷰 작성/수정
  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewRating || !reviewContent.trim()) return;
    setIsSubmittingReview(true);
    try {
      if (editingReview) {
        // 수정
        await api.put(
          API_ENDPOINTS.PACKAGES.REVIEW_DETAIL(pkgId, editingReview.review_id),
          { rating: reviewRating, title: reviewTitle.trim(), content: reviewContent.trim() },
        );
        showToast(UI_MESSAGES.REVIEW_UPDATE_SUCCESS);
      } else {
        // 작성
        await api.post(API_ENDPOINTS.PACKAGES.REVIEWS(pkgId), {
          rating: reviewRating,
          title: reviewTitle.trim(),
          content: reviewContent.trim(),
        });
        showToast(UI_MESSAGES.REVIEW_CREATE_SUCCESS);
      }
      resetReviewForm();
      loadReviews();
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 409) {
        showToast(UI_MESSAGES.REVIEW_DUPLICATE, 'error');
      } else {
        showToast(UI_MESSAGES.REVIEW_FAIL, 'error');
      }
    } finally {
      setIsSubmittingReview(false);
    }
  }

  function startEditReview(review: PackageReview) {
    setEditingReview(review);
    setReviewRating(review.rating);
    setReviewTitle(review.title);
    setReviewContent(review.content);
    setShowReviewForm(true);
  }

  async function handleDeleteReview(reviewId: number) {
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    try {
      await api.delete(API_ENDPOINTS.PACKAGES.REVIEW_DETAIL(pkgId, reviewId));
      showToast(UI_MESSAGES.REVIEW_DELETE_SUCCESS);
      loadReviews();
    } catch {
      showToast(UI_MESSAGES.REVIEW_FAIL, 'error');
    }
  }

  function resetReviewForm() {
    setShowReviewForm(false);
    setEditingReview(null);
    setReviewRating(0);
    setReviewTitle('');
    setReviewContent('');
  }

  if (isLoading) return <LoadingSpinner />;
  if (!pkg) {
    return (
      <div className="pkg-not-found">
        <p>패키지를 찾을 수 없습니다.</p>
        <Link to={ROUTES.PACKAGES}>패키지 목록으로</Link>
      </div>
    );
  }

  return (
    <div className="pkg-detail">
      {/* 패키지 정보 */}
      <div className="pkg-detail__header">
        <h1>{pkg.display_name}</h1>
        <span className="pkg-detail__name">{pkg.name}</span>
        <div className="pkg-detail__badges">
          <span className="pkg-detail__category">{pkg.category}</span>
          {pkg.package_manager && <span className="pkg-detail__manager">{pkg.package_manager}</span>}
        </div>
        {pkg.description && <p className="pkg-detail__desc">{pkg.description}</p>}
        {pkg.homepage_url && (
          <a href={pkg.homepage_url} target="_blank" rel="noopener noreferrer" className="pkg-detail__link">
            {pkg.homepage_url}
          </a>
        )}
        <div className="pkg-detail__meta">
          <span>리뷰 {pkg.reviews_count}개</span>
          <span>· {timeAgo(pkg.created_at)}</span>
        </div>
        {canEdit && (
          <Link to={ROUTES.PACKAGE_EDIT(pkg.package_id)} className="btn btn-secondary btn-sm">
            패키지 수정
          </Link>
        )}
      </div>

      {/* 리뷰 섹션 */}
      <div className="pkg-reviews">
        <div className="pkg-reviews__header">
          <h2>리뷰</h2>
          <div className="sort-buttons">
            {REVIEW_SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`sort-btn ${reviewSort === opt.value ? 'active' : ''}`}
                onClick={() => setReviewSort(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 리뷰 작성 버튼 / 폼 */}
        {user && !myReview && !showReviewForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowReviewForm(true)}>
            리뷰 작성
          </button>
        )}

        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="pkg-review-form">
            <div className="pkg-review-form__rating">
              <label>별점</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="input-group">
              <label htmlFor="review-title">제목</label>
              <input
                id="review-title"
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="리뷰 제목"
                maxLength={200}
              />
            </div>
            <div className="input-group">
              <label htmlFor="review-content">내용</label>
              <textarea
                id="review-content"
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="리뷰 내용 (최소 10자)"
                minLength={10}
                maxLength={5000}
                rows={4}
                required
              />
            </div>
            <div className="pkg-review-form__actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={isSubmittingReview || !reviewRating || reviewContent.trim().length < 10}
              >
                {isSubmittingReview ? '처리 중...' : editingReview ? '수정' : '작성'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={resetReviewForm}>
                취소
              </button>
            </div>
          </form>
        )}

        {/* 리뷰 목록 */}
        {reviews.length === 0 ? (
          <p className="pkg-reviews__empty">아직 리뷰가 없습니다.</p>
        ) : (
          <div className="pkg-review-list">
            {reviews.map((review) => (
              <div key={review.review_id} className="pkg-review-card">
                <div className="pkg-review-card__header">
                  <StarRating value={review.rating} readonly size="sm" />
                  <span className="pkg-review-card__author">
                    {review.author.nickname}
                    {review.author.distro && (
                      <span className="distro-badge">{review.author.distro}</span>
                    )}
                  </span>
                  <span className="pkg-review-card__date">{timeAgo(review.created_at)}</span>
                </div>
                {review.title && <h4 className="pkg-review-card__title">{review.title}</h4>}
                <p className="pkg-review-card__content">{review.content}</p>
                {user && review.author.user_id === user.id && (
                  <div className="pkg-review-card__actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => startEditReview(review)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteReview(review.review_id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
