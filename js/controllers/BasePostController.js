// js/controllers/BasePostController.js
// 게시글 작성/수정 컨트롤러 공통 로직

import CategoryModel from '../models/CategoryModel.js';
import { readFileAsDataURL } from '../views/helpers.js';
import Logger from '../utils/Logger.js';
import DraftService from '../services/DraftService.js';
import { NOTICE_CATEGORY_SLUG } from '../constants.js';

const DRAFT_SAVE_DELAY = 5000;

/**
 * 게시글 작성/수정 컨트롤러 Base 클래스
 * WriteController, EditController가 상속
 */
class BasePostController {
    /**
     * @param {string} loggerName - Logger 이름
     */
    constructor(loggerName) {
        this.currentUser = null;
        this._draftTimer = null;
        this._logger = Logger.createLogger(loggerName);
    }

    // -- 서브클래스가 반드시 구현해야 하는 메서드 --

    /** @returns {import('../views/PostFormView.js').default} */
    get view() { throw new Error('서브클래스에서 view를 구현해야 합니다'); }

    /** 입력 변경 시 호출 (Write: validateForm, Edit: checkChanges) */
    _onInputChange() { throw new Error('서브클래스에서 _onInputChange를 구현해야 합니다'); }

    /** @returns {string} 드래프트 저장 키 */
    _getDraftKey() { throw new Error('서브클래스에서 _getDraftKey를 구현해야 합니다'); }

    /** @returns {File[]} 현재 선택된 파일 목록 */
    _getFiles() { return []; }

    /** @param {File[]} files */
    _setFiles(_files) { /* 서브클래스 구현 */ }

    // -- 공통 로직 --

    /**
     * 카테고리 목록 로드
     * @protected
     */
    async _loadCategories() {
        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) return;

        try {
            const result = await CategoryModel.getCategories();
            if (!result.ok) return;

            const categories = result.data?.data?.categories || [];
            const isAdmin = this.currentUser?.role === 'admin';

            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.category_id;
                option.textContent = cat.name;
                if (cat.slug === NOTICE_CATEGORY_SLUG && !isAdmin) {
                    option.disabled = true;
                }
                categorySelect.appendChild(option);
            });
        } catch (error) {
            this._logger.error('카테고리 로드 실패', error);
        }
    }

    /**
     * 파일 변경 처리 (다중 이미지 지원)
     * @param {Event} event
     * @protected
     */
    _handleFileChange(event) {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            const selected = files.slice(0, 5);
            this._setFiles(selected);
            this.view.setFileName(
                selected.length === 1
                    ? selected[0].name
                    : `${selected.length}개 파일 선택됨`
            );
            readFileAsDataURL(selected[0], (dataUrl) => {
                this.view.showImagePreview(dataUrl);
            });
        } else {
            this._setFiles([]);
            this.view.setFileName('파일을 선택해주세요.');
            this.view.hideImagePreview();
        }
    }

    /**
     * 디바운스된 임시 저장 예약
     * @protected
     */
    _scheduleDraftSave() {
        clearTimeout(this._draftTimer);
        this._draftTimer = setTimeout(() => {
            const title = this.view.getTitle();
            const content = this.view.getContent();
            if (!title && !content) return;

            const categorySelect = document.getElementById('category-select');
            const categoryId = categorySelect ? Number(categorySelect.value) : null;
            this._saveDraft({ title, content, categoryId });
        }, DRAFT_SAVE_DELAY);
    }

    /**
     * 드래프트 저장 -- 서브클래스에서 오버라이드 가능 (서버 저장 등)
     * @param {object} data
     * @protected
     */
    _saveDraft(data) {
        DraftService.save(this._getDraftKey(), data);
    }

    /**
     * 뒤로가기 버튼 설정
     * @protected
     */
    _setupBackButton() {
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => history.back());
        }
    }

    /**
     * 공통 이벤트 설정 (pagehide 정리)
     * @protected
     */
    _setupCommonEvents() {
        window.addEventListener('pagehide', () => this.view.destroy());
    }

    /**
     * 제목 입력 처리
     * @protected
     */
    _handleTitleInput() {
        this.view.enforceTitleMaxLength(26);
        this._onInputChange();
        this._scheduleDraftSave();
    }

    /**
     * 본문 입력 처리
     * @protected
     */
    _handleContentInput() {
        this._onInputChange();
        this._scheduleDraftSave();
    }
}

export default BasePostController;
export { DRAFT_SAVE_DELAY };
