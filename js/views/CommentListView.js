// js/views/CommentListView.js
// 댓글 목록 렌더링 관련 로직 (트리 구조 지원)

import { formatDate, escapeCssUrl } from '../utils/formatters.js';
import { getImageUrl } from './helpers.js';
import { createElement } from '../utils/dom.js';

/**
 * 댓글 목록 View 클래스
 */
class CommentListView {
    /**
     * 댓글 요소 생성
     * @param {object} comment - 댓글 데이터
     * @param {string|number|null} currentUserId - 현재 로그인한 사용자 ID
     * @param {object} handlers - 이벤트 핸들러 객체
     * @param {boolean} isReply - 대댓글 여부
     * @returns {HTMLElement} - 댓글 요소
     */
    static createCommentElement(comment, currentUserId, handlers, isReply = false) {
        const isOwner = currentUserId && !comment.is_deleted &&
            comment.author && currentUserId === comment.author.user_id;

        // 삭제된 댓글 플레이스홀더
        if (comment.is_deleted) {
            return createElement('li', {
                className: `comment-item ${isReply ? 'comment-reply' : ''}`
            }, [
                createElement('div', { className: 'comment-deleted' }, [
                    createElement('p', { className: 'comment-deleted-text' }, ['삭제된 댓글입니다.'])
                ])
            ]);
        }

        const profileImgUrl = getImageUrl(comment.author.profileImageUrl);
        const nickname = comment.author.nickname;
        const content = comment.content;
        const dateStr = formatDate(new Date(comment.created_at));

        const actionButtons = [];

        // 답글 버튼 (루트 댓글에만, 로그인 시에만)
        if (!isReply && currentUserId) {
            actionButtons.push(
                createElement('button', {
                    className: 'small-btn reply-btn',
                    onClick: () => handlers.onReply(comment),
                }, ['답글'])
            );
        }

        // 수정/삭제 (본인만)
        if (isOwner) {
            actionButtons.push(
                createElement('button', {
                    className: 'small-btn edit-cmt-btn',
                    onClick: () => handlers.onEdit(comment),
                }, ['수정']),
                createElement('button', {
                    className: 'small-btn delete-cmt-btn',
                    onClick: () => handlers.onDelete(comment.comment_id),
                }, ['삭제'])
            );
        }

        const children = [
            createElement('div', {
                className: 'comment-author-img',
                style: {
                    backgroundImage: `url('${escapeCssUrl(profileImgUrl)}')`,
                    backgroundSize: 'cover',
                },
            }),
            createElement('div', { className: 'comment-content-wrapper' }, [
                createElement('div', { className: 'comment-header' }, [
                    createElement('span', { className: 'comment-author-name' }, [nickname]),
                    createElement('span', { className: 'comment-date' }, [dateStr]),
                    ...(actionButtons.length > 0 ? [
                        createElement('div', { className: 'comment-actions' }, actionButtons)
                    ] : []),
                ]),
                createElement('p', { className: 'comment-text' }, [content]),
            ]),
        ];

        return createElement('li', {
            className: `comment-item ${isReply ? 'comment-reply' : ''}`
        }, children);
    }

    /**
     * 댓글 목록을 트리 구조로 렌더링
     * @param {HTMLElement} container - 목록 컨테이너
     * @param {Array} comments - 트리 구조 댓글 배열 (각 항목에 replies 포함)
     * @param {string|number|null} currentUserId - 현재 로그인한 사용자 ID
     * @param {object} handlers - 이벤트 핸들러 객체
     */
    static renderComments(container, comments, currentUserId, handlers) {
        container.textContent = '';

        const fragment = document.createDocumentFragment();
        comments.forEach(comment => {
            // 루트 댓글
            const element = CommentListView.createCommentElement(
                comment, currentUserId, handlers, false
            );
            fragment.appendChild(element);

            // 대댓글
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach(reply => {
                    const replyEl = CommentListView.createCommentElement(
                        reply, currentUserId, handlers, true
                    );
                    fragment.appendChild(replyEl);
                });
            }
        });

        container.appendChild(fragment);
    }
}

export default CommentListView;
