// js/controllers/MyActivityController.js
// 내 활동 페이지 컨트롤러

import ActivityModel from '../models/ActivityModel.js';
import UserModel from '../models/UserModel.js';
import ActivityView from '../views/ActivityView.js';
import { showToast } from '../views/helpers.js';
import { resolveNavPath } from '../config.js';
import { NAV_PATHS, UI_MESSAGES } from '../constants.js';
import Logger from '../utils/Logger.js';

const logger = Logger.createLogger('MyActivityController');

/**
 * 내 활동 페이지 컨트롤러
 * 탭 전환과 무한 스크롤로 활동 목록을 관리한다.
 */
class MyActivityController {
    constructor() {
        this.currentTab = 'posts';
        this.currentOffset = 0;
        this.LIMIT = 10;
        this.isLoading = false;
        this.hasMore = true;
        this._scrollHandler = null;
    }

    /**
     * 컨트롤러 초기화
     */
    async init() {
        this.listEl = document.getElementById('activity-list');
        this.emptyEl = document.getElementById('activity-empty');

        this._setupTabs();
        this._setupInfiniteScroll();
        await this._loadData();
    }

    /**
     * 탭 이벤트 설정 (이벤트 위임)
     * @private
     */
    _setupTabs() {
        const tabsContainer = document.querySelector('.activity-tabs');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('click', (e) => {
            const tabBtn = e.target.closest('.tab-btn');
            if (!tabBtn) return;

            const tab = tabBtn.dataset.tab;
            if (tab === this.currentTab) return;

            // 활성 탭 UI 업데이트
            tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            tabBtn.classList.add('active');

            this.currentTab = tab;
            this._resetAndReload();
        });
    }

    /**
     * 무한 스크롤 설정
     * @private
     */
    _setupInfiniteScroll() {
        this._scrollHandler = () => {
            if (this.isLoading || !this.hasMore) return;
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                this._loadData();
            }
        };
        window.addEventListener('scroll', this._scrollHandler);
    }

    /**
     * 상태 초기화 후 데이터 재로드
     * @private
     */
    async _resetAndReload() {
        this.currentOffset = 0;
        this.hasMore = true;
        this.isLoading = false;

        if (this.listEl) {
            this.listEl.textContent = '';
        }
        ActivityView.hideEmptyState(this.emptyEl);

        await this._loadData();
    }

    /**
     * 현재 탭에 맞는 데이터 로드
     * @private
     */
    async _loadData() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        try {
            // 현재 탭에 따라 적절한 Model 메서드 호출
            let result;
            if (this.currentTab === 'posts') {
                result = await ActivityModel.getMyPosts(this.currentOffset, this.LIMIT);
            } else if (this.currentTab === 'comments') {
                result = await ActivityModel.getMyComments(this.currentOffset, this.LIMIT);
            } else if (this.currentTab === 'bookmarks') {
                result = await ActivityModel.getMyBookmarks(this.currentOffset, this.LIMIT);
            } else if (this.currentTab === 'blocks') {
                result = await ActivityModel.getMyBlocks(this.currentOffset, this.LIMIT);
            } else {
                result = await ActivityModel.getMyLikes(this.currentOffset, this.LIMIT);
            }

            if (!result.ok) {
                showToast('활동 내역을 불러오지 못했습니다.');
                this.isLoading = false;
                return;
            }

            // 응답에서 항목과 페이지네이션 추출
            const responseData = result.data?.data;
            let dataKey;
            if (this.currentTab === 'comments') dataKey = 'comments';
            else if (this.currentTab === 'blocks') dataKey = 'blocks';
            else dataKey = 'posts';
            const items = responseData?.[dataKey] || [];
            const pagination = responseData?.pagination;

            // 첫 페이지인데 항목이 없으면 빈 상태 표시
            if (items.length === 0 && this.currentOffset === 0) {
                ActivityView.showEmptyState(this.emptyEl);
            }

            // 게시글 클릭 핸들러
            const onPostClick = (postId) => {
                location.href = resolveNavPath(NAV_PATHS.DETAIL(postId));
            };

            // 차단 해제 핸들러
            const onUnblock = async (userId, cardEl) => {
                try {
                    const res = await UserModel.unblockUser(userId);
                    if (res.ok) {
                        cardEl.remove();
                        showToast(UI_MESSAGES.UNBLOCK_SUCCESS);
                        // 목록이 비었으면 빈 상태 표시
                        if (this.listEl && !this.listEl.children.length) {
                            ActivityView.showEmptyState(this.emptyEl);
                        }
                    } else {
                        showToast(UI_MESSAGES.BLOCK_FAIL);
                    }
                } catch {
                    showToast(UI_MESSAGES.BLOCK_FAIL);
                }
            };

            // 항목 렌더링
            if (items.length > 0) {
                ActivityView.renderActivities(this.listEl, items, this.currentTab, onPostClick, onUnblock);
            }

            // 페이지네이션 상태 업데이트
            this.hasMore = pagination?.has_more || false;
            this.currentOffset += items.length;
        } catch (error) {
            logger.error('활동 내역 로드 실패', error);
            showToast('활동 내역을 불러오지 못했습니다.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 컨트롤러 정리 (메모리 누수 방지)
     */
    destroy() {
        if (this._scrollHandler) {
            window.removeEventListener('scroll', this._scrollHandler);
            this._scrollHandler = null;
        }
    }
}

export default MyActivityController;
