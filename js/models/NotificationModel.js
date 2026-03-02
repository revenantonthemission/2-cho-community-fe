// js/models/NotificationModel.js
// 알림 관련 API 호출 관리

import ApiService from '../services/ApiService.js';
import { API_ENDPOINTS } from '../constants.js';

/**
 * 알림 관련 Model
 */
class NotificationModel {
    /**
     * 알림 목록 조회
     * @param {number} [offset=0] - 시작 위치
     * @param {number} [limit=20] - 조회 개수
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async getNotifications(offset = 0, limit = 20) {
        return ApiService.get(
            `${API_ENDPOINTS.NOTIFICATIONS.ROOT}?offset=${offset}&limit=${limit}`
        );
    }

    /**
     * 읽지 않은 알림 수 조회
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async getUnreadCount() {
        return ApiService.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
    }

    /**
     * 알림 읽음 처리
     * @param {number} id - 알림 ID
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async markAsRead(id) {
        return ApiService.patch(API_ENDPOINTS.NOTIFICATIONS.READ(id));
    }

    /**
     * 모든 알림 읽음 처리
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async markAllAsRead() {
        return ApiService.patch(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
    }

    /**
     * 알림 삭제
     * @param {number} id - 알림 ID
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async deleteNotification(id) {
        return ApiService.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    }
}

export default NotificationModel;
