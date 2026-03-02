// js/views/NotificationView.js
// 알림 DOM 렌더링 (View 전용)

import { createElement } from '../utils/dom.js';

/**
 * 알림 관련 View
 */
class NotificationView {
    /**
     * 단일 알림 항목 DOM 생성
     * @param {object} notification - 알림 데이터
     * @returns {HTMLElement} - 알림 li 요소
     */
    static createNotificationItem(notification) {
        const li = createElement('li', {
            className: `notification-item ${notification.is_read ? '' : 'unread'}`,
            dataset: { id: notification.notification_id },
        });

        const content = createElement('div', { className: 'notification-content' });

        const actorName = notification.actor?.nickname || '탈퇴한 사용자';
        const typeText = notification.type === 'comment' ? '댓글을 남겼습니다' : '좋아요를 눌렀습니다';

        const message = createElement('p', { className: 'notification-message' });
        const actorSpan = createElement('strong', { textContent: actorName });
        message.appendChild(actorSpan);
        message.appendChild(document.createTextNode('님이 '));

        const titleSpan = createElement('span', {
            className: 'notification-post-title',
            textContent: notification.post_title,
        });
        message.appendChild(titleSpan);
        message.appendChild(document.createTextNode(`에 ${typeText}.`));

        const time = createElement('span', {
            className: 'notification-time',
            textContent: notification.created_at,
        });

        content.appendChild(message);
        content.appendChild(time);

        const deleteBtn = createElement('button', {
            className: 'notification-delete-btn',
            textContent: '삭제',
        });

        li.appendChild(content);
        li.appendChild(deleteBtn);

        return li;
    }

    /**
     * 알림 목록 렌더링
     * @param {HTMLElement} container - 렌더링할 컨테이너
     * @param {Array} notifications - 알림 데이터 배열
     */
    static renderNotifications(container, notifications) {
        notifications.forEach(notification => {
            container.appendChild(NotificationView.createNotificationItem(notification));
        });
    }

    /**
     * 알림 목록 초기화
     * @param {HTMLElement} container - 비울 컨테이너
     */
    static clearList(container) {
        container.textContent = '';
    }
}

export default NotificationView;
