// js/controllers/AdminDashboardController.js
// 관리자 대시보드 페이지 컨트롤러

import AdminModel from '../models/AdminModel.js';
import AdminDashboardView from '../views/AdminDashboardView.js';
import ModalView from '../views/ModalView.js';
import Logger from '../utils/Logger.js';
import { NAV_PATHS, UI_MESSAGES } from '../constants.js';
import { showToast, showToastAndRedirect } from '../views/helpers.js';
import { resolveNavPath } from '../config.js';

const logger = Logger.createLogger('AdminDashboardController');

/**
 * 관리자 대시보드 컨트롤러
 */
class AdminDashboardController {
    constructor() {
        this.userOffset = 0;
        this.USER_LIMIT = 20;
        this.isLoadingUsers = false;
        this.hasMoreUsers = true;
        this.currentSearch = '';
        this.scrollObserver = null;
        this._searchTimer = null;
        this._suspendTargetId = null;
        this._suspendTargetNickname = null;
    }

    /**
     * 컨트롤러 초기화
     * @param {object|null} currentUser - 현재 사용자 정보
     */
    async init(currentUser) {
        // 비관리자 접근 차단
        if (!currentUser || currentUser.role !== 'admin') {
            showToastAndRedirect(UI_MESSAGES.ADMIN_REQUIRED, NAV_PATHS.MAIN);
            return;
        }

        // 뒤로가기
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                location.href = resolveNavPath(NAV_PATHS.MAIN);
            });
        }

        await this._loadDashboard();
        this._setupSearch();
        this._setupInfiniteScroll();
        await this._loadUsers();
    }

    /**
     * 대시보드 통계 로드
     * @private
     */
    async _loadDashboard() {
        try {
            const result = await AdminModel.getDashboard();
            if (!result.ok) throw new Error('대시보드 로드 실패');

            const data = result.data?.data;
            if (data?.summary) {
                AdminDashboardView.renderStatsCards(data.summary);
            }
            if (data?.daily_stats) {
                AdminDashboardView.renderDailyStats(data.daily_stats);
            }
        } catch (error) {
            logger.error('대시보드 로드 실패', error);
            showToast(UI_MESSAGES.UNKNOWN_ERROR);
        }
    }

    /**
     * 사용자 목록 로드
     * @private
     */
    async _loadUsers() {
        if (this.isLoadingUsers || !this.hasMoreUsers) return;

        this.isLoadingUsers = true;
        const listEl = document.getElementById('user-list');
        const sentinel = document.getElementById('user-loading-sentinel');

        AdminDashboardView.toggleLoadingSentinel(sentinel, true);

        try {
            const result = await AdminModel.getUsers(
                this.userOffset, this.USER_LIMIT, this.currentSearch
            );

            if (!result.ok) throw new Error('사용자 목록 로드 실패');

            const users = result.data?.data?.users || [];
            const pagination = result.data?.data?.pagination;

            if (users.length < this.USER_LIMIT ||
                (pagination && !pagination.has_more)) {
                this.hasMoreUsers = false;
                AdminDashboardView.toggleLoadingSentinel(sentinel, false);
            }

            const isAppend = this.userOffset > 0;
            if (this.userOffset === 0 && users.length === 0) {
                AdminDashboardView.renderUserList([], listEl, {}, false);
                this.hasMoreUsers = false;
                AdminDashboardView.toggleLoadingSentinel(sentinel, false);
                return;
            }

            AdminDashboardView.renderUserList(users, listEl, {
                onSuspend: (userId, nickname) => this._openSuspendModal(userId, nickname),
                onUnsuspend: (userId) => this._handleUnsuspend(userId),
            }, isAppend);

            this.userOffset += users.length;

        } catch (error) {
            logger.error('사용자 목록 로드 실패', error);
            showToast(UI_MESSAGES.UNKNOWN_ERROR);
        } finally {
            this.isLoadingUsers = false;
            if (!this.hasMoreUsers) {
                const s = document.getElementById('user-loading-sentinel');
                if (s) AdminDashboardView.toggleLoadingSentinel(s, false);
            }
        }
    }

    /**
     * 검색 입력 이벤트 설정 (300ms 디바운스)
     * @private
     */
    _setupSearch() {
        const searchInput = document.getElementById('user-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', () => {
            if (this._searchTimer) clearTimeout(this._searchTimer);

            this._searchTimer = setTimeout(() => {
                this.currentSearch = searchInput.value.trim();
                this._resetAndReloadUsers();
            }, 300);
        });
    }

    /**
     * 무한 스크롤 설정
     * @private
     */
    _setupInfiniteScroll() {
        const sentinel = document.getElementById('user-loading-sentinel');
        if (!sentinel) return;

        this.scrollObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !this.isLoadingUsers && this.hasMoreUsers) {
                this._loadUsers();
            }
        }, { threshold: 0.1 });

        this.scrollObserver.observe(sentinel);
    }

    /**
     * 사용자 목록 초기화 및 재로드
     * @private
     */
    _resetAndReloadUsers() {
        this.userOffset = 0;
        this.hasMoreUsers = true;
        this.isLoadingUsers = false;
        this._loadUsers();
    }

    /**
     * 정지 모달 열기
     * cloneNode(true) + replaceChild로 이전 리스너 제거
     * @param {string|number} userId - 대상 사용자 ID
     * @param {string} nickname - 대상 사용자 닉네임
     * @private
     */
    _openSuspendModal(userId, nickname) {
        this._suspendTargetId = userId;
        this._suspendTargetNickname = nickname;

        const modal = document.getElementById('suspend-modal');
        const titleEl = document.getElementById('suspend-modal-title');
        const daysInput = document.getElementById('suspend-days');
        const reasonInput = document.getElementById('suspend-reason');

        if (titleEl) titleEl.textContent = `${nickname} 사용자 정지`;
        if (daysInput) daysInput.value = '7';
        if (reasonInput) reasonInput.value = '';

        // 확인 버튼 리스너 교체 (cloneNode로 이전 리스너 제거)
        const confirmBtn = document.getElementById('suspend-confirm-btn');
        if (confirmBtn) {
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            newBtn.addEventListener('click', () => this._executeSuspend());
        }

        // 취소 버튼 리스너 교체
        const cancelBtn = document.getElementById('suspend-cancel-btn');
        if (cancelBtn) {
            const newBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newBtn, cancelBtn);
            newBtn.addEventListener('click', () => {
                ModalView.closeModal('suspend-modal');
            });
        }

        if (modal) {
            document.body.style.overflow = 'hidden';
            modal.classList.remove('hidden');
        }
    }

    /**
     * 정지 실행
     * @private
     */
    async _executeSuspend() {
        if (!this._suspendTargetId) return;

        const daysInput = document.getElementById('suspend-days');
        const reasonInput = document.getElementById('suspend-reason');

        const days = parseInt(daysInput?.value);
        const reason = reasonInput?.value?.trim();

        if (!days || days < 1) {
            showToast('정지 기간을 입력해주세요.');
            return;
        }
        if (!reason) {
            showToast('정지 사유를 입력해주세요.');
            return;
        }

        try {
            const result = await AdminModel.suspendUser(this._suspendTargetId, days, reason);

            ModalView.closeModal('suspend-modal');

            if (result.ok) {
                showToast(UI_MESSAGES.SUSPEND_SUCCESS);
                this._resetAndReloadUsers();
            } else {
                showToast(UI_MESSAGES.SUSPEND_FAIL);
            }
        } catch (error) {
            logger.error('사용자 정지 실패', error);
            ModalView.closeModal('suspend-modal');
            showToast(UI_MESSAGES.SUSPEND_FAIL);
        }

        this._suspendTargetId = null;
        this._suspendTargetNickname = null;
    }

    /**
     * 정지 해제 처리
     * @param {string|number} userId - 대상 사용자 ID
     * @private
     */
    async _handleUnsuspend(userId) {
        if (!confirm('정지를 해제하시겠습니까?')) return;

        try {
            const result = await AdminModel.unsuspendUser(userId);

            if (result.ok) {
                showToast(UI_MESSAGES.UNSUSPEND_SUCCESS);
                this._resetAndReloadUsers();
            } else {
                showToast(UI_MESSAGES.SUSPEND_FAIL);
            }
        } catch (error) {
            logger.error('정지 해제 실패', error);
            showToast(UI_MESSAGES.SUSPEND_FAIL);
        }
    }
}

export default AdminDashboardController;
