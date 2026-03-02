// js/controllers/UserProfileController.js
// 타 사용자 프로필 페이지 컨트롤러

import UserModel from '../models/UserModel.js';
import PostModel from '../models/PostModel.js';
import UserProfileView from '../views/UserProfileView.js';
import PostListView from '../views/PostListView.js';
import { showToast } from '../views/helpers.js';
import { resolveNavPath } from '../config.js';
import { NAV_PATHS } from '../constants.js';
import Logger from '../utils/Logger.js';

const logger = Logger.createLogger('UserProfileController');

/**
 * 타 사용자 프로필 페이지 컨트롤러
 * 프로필 정보와 작성한 게시글 목록을 무한 스크롤로 표시한다.
 */
class UserProfileController {
    constructor() {
        this.userId = null;
        this.currentOffset = 0;
        this.LIMIT = 10;
        this.isLoading = false;
        this.hasMore = true;
        this._scrollHandler = null;
    }

    /**
     * 컨트롤러 초기화
     * @param {object|null} currentUser - 현재 로그인한 사용자 정보
     */
    async init(currentUser) {
        const params = new URLSearchParams(location.search);
        this.userId = parseInt(params.get('id'));

        if (!this.userId || isNaN(this.userId)) {
            showToast('잘못된 접근입니다.');
            return;
        }

        // 자기 프로필이면 edit-profile로 리다이렉트
        if (currentUser && (currentUser.user_id === this.userId || currentUser.id === this.userId)) {
            location.href = resolveNavPath(NAV_PATHS.EDIT_PROFILE);
            return;
        }

        this.listEl = document.getElementById('user-posts-list');
        this.emptyEl = document.getElementById('user-posts-empty');

        await this._loadProfile();
        this._setupInfiniteScroll();
        await this._loadPosts();
    }

    /**
     * 사용자 프로필 정보 로드
     * @private
     */
    async _loadProfile() {
        try {
            const result = await UserModel.getUserById(this.userId);

            if (!result.ok) {
                showToast('프로필을 불러오지 못했습니다.');
                return;
            }

            const user = result.data?.data;
            if (user) {
                UserProfileView.renderProfile(user);
            }
        } catch (error) {
            logger.error('프로필 로드 실패', error);
            showToast('프로필을 불러오지 못했습니다.');
        }
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
                this._loadPosts();
            }
        };
        window.addEventListener('scroll', this._scrollHandler);
    }

    /**
     * 사용자 게시글 목록 로드
     * @private
     */
    async _loadPosts() {
        if (this.isLoading || !this.hasMore) return;
        this.isLoading = true;

        try {
            const result = await PostModel.getPosts(
                this.currentOffset, this.LIMIT, null, 'latest', this.userId
            );

            if (!result.ok) {
                showToast('게시글 목록을 불러오지 못했습니다.');
                this.isLoading = false;
                return;
            }

            const responseData = result.data?.data;
            const posts = responseData?.posts || [];
            const pagination = responseData?.pagination;

            // 첫 페이지인데 항목이 없으면 빈 상태 표시
            if (posts.length === 0 && this.currentOffset === 0) {
                UserProfileView.showEmptyPosts(this.emptyEl);
            }

            // 게시글 클릭 핸들러
            const onPostClick = (postId) => {
                location.href = resolveNavPath(NAV_PATHS.DETAIL(postId));
            };

            // 게시글 렌더링
            if (posts.length > 0) {
                UserProfileView.hideEmptyPosts(this.emptyEl);
                PostListView.renderPosts(this.listEl, posts, onPostClick);
            }

            // 페이지네이션 상태 업데이트
            this.hasMore = pagination?.has_more || false;
            this.currentOffset += posts.length;
        } catch (error) {
            logger.error('게시글 목록 로드 실패', error);
            showToast('게시글 목록을 불러오지 못했습니다.');
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

export default UserProfileController;
