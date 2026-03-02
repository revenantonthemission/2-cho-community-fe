// js/views/ActivityView.js
// 내 활동 페이지 DOM 렌더링 (View 전용)

import { createElement } from '../utils/dom.js';
import { formatDate, truncateTitle } from '../utils/formatters.js';
import { resolveNavPath } from '../config.js';
import { NAV_PATHS } from '../constants.js';
import PostListView from './PostListView.js';

/**
 * 내 활동 View 클래스
 */
class ActivityView {
    /**
     * 댓글 카드 DOM 생성
     * @param {object} comment - 댓글 데이터
     * @param {Function} onPostClick - 게시글 클릭 핸들러
     * @returns {HTMLElement} - 댓글 카드 요소
     */
    static createCommentCard(comment, onPostClick) {
        const dateStr = formatDate(new Date(comment.created_at));
        const contentText = truncateTitle(comment.content, 80);
        const isPostDeleted = comment.post_title === '삭제된 게시글';

        // 게시글 링크 또는 삭제 표시
        let postLink;
        if (isPostDeleted) {
            postLink = createElement('span', {
                className: 'comment-post-title deleted',
            }, ['삭제된 게시글']);
        } else {
            postLink = createElement('a', {
                className: 'comment-post-title',
                href: resolveNavPath(NAV_PATHS.DETAIL(comment.post_id)),
                onClick: (e) => {
                    e.stopPropagation();
                    if (onPostClick) {
                        e.preventDefault();
                        onPostClick(comment.post_id);
                    }
                },
            }, [truncateTitle(comment.post_title, 30)]);
        }

        const card = createElement('div', { className: 'comment-card' }, [
            createElement('div', { className: 'comment-card-content' }, [
                createElement('p', { className: 'comment-text' }, [contentText]),
            ]),
            createElement('div', { className: 'comment-card-meta' }, [
                createElement('span', { className: 'comment-card-post' }, [
                    createElement('span', {}, ['게시글: ']),
                    postLink,
                ]),
                createElement('span', { className: 'comment-card-date' }, [dateStr]),
            ]),
        ]);

        return card;
    }

    /**
     * 활동 목록 렌더링
     * @param {HTMLElement} container - 렌더링할 컨테이너
     * @param {Array} items - 활동 데이터 배열
     * @param {string} type - 활동 유형 ('posts', 'comments', 'likes')
     * @param {Function} onPostClick - 게시글 클릭 핸들러
     */
    static renderActivities(container, items, type, onPostClick) {
        const fragment = document.createDocumentFragment();

        if (type === 'comments') {
            items.forEach(comment => {
                fragment.appendChild(ActivityView.createCommentCard(comment, onPostClick));
            });
        } else {
            // posts, likes 탭은 PostListView의 게시글 카드 재사용
            items.forEach(post => {
                fragment.appendChild(PostListView.createPostCard(post, onPostClick));
            });
        }

        container.appendChild(fragment);
    }

    /**
     * 빈 상태 표시
     * @param {HTMLElement} emptyEl - 빈 상태 요소
     */
    static showEmptyState(emptyEl) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
        }
    }

    /**
     * 빈 상태 숨기기
     * @param {HTMLElement} emptyEl - 빈 상태 요소
     */
    static hideEmptyState(emptyEl) {
        if (emptyEl) {
            emptyEl.classList.add('hidden');
        }
    }
}

export default ActivityView;
