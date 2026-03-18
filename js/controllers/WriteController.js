// js/controllers/WriteController.js
// 게시글 작성 페이지 컨트롤러 - 비즈니스 로직 및 이벤트 처리 담당

import PostModel from '../models/PostModel.js';
import WriteView from '../views/WriteView.js';
import { extractUploadedImageUrl, showToastAndRedirect } from '../views/helpers.js';
import DraftService from '../services/DraftService.js';
import PostFormView from '../views/PostFormView.js';
import { NAV_PATHS, UI_MESSAGES } from '../constants.js';
import BasePostController from './BasePostController.js';

/**
 * 게시글 작성 페이지 컨트롤러
 * Model과 View를 연결하고 비즈니스 로직을 처리
 */
class WriteController extends BasePostController {
    constructor() {
        super('WriteController');
        this._view = new WriteView();
        this.selectedFile = null;
        this.selectedFiles = [];
    }

    get view() { return this._view; }

    // -- BasePostController 훅 구현 --

    _onInputChange() {
        this._validateForm();
    }

    _getDraftKey() {
        return 'draft:write';
    }

    _getFiles() {
        return this.selectedFiles;
    }

    _setFiles(files) {
        this.selectedFiles = files;
        this.selectedFile = files[0] || null;
    }

    _saveDraft(data) {
        super._saveDraft(data);
        DraftService.saveToServer(data);
    }

    /**
     * 컨트롤러 초기화
     * @param {object|null} [currentUser=null] - 현재 사용자 정보
     */
    async init(currentUser = null) {
        this.currentUser = currentUser;

        // View 초기화
        if (!this.view.initialize({
            onImageUpload: async (file) => {
                const response = await PostModel.uploadImage(file);
                return response.data?.data?.url;
            },
        })) return;

        await this._loadCategories();
        this.view.initializeTags();

        // 투표 섹션 삽입 (파일 업로드 섹션 앞에)
        const fileSection = document.querySelector('.file-upload-section');
        if (fileSection) {
            PostFormView.createPollSection(fileSection.previousElementSibling || fileSection);
        }

        this._restoreDraft();
        this._setupEventListeners();
    }

    /**
     * 이벤트 리스너 설정
     * @private
     */
    _setupEventListeners() {
        this.view.bindEvents({
            onTitleInput: () => this._handleTitleInput(),
            onContentInput: () => this._handleContentInput(),
            onFileChange: (e) => this._handleFileChange(e),
            onSubmit: (e) => this._handleSubmit(e),
        });

        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', () => this._scheduleDraftSave());
        }

        this._setupBackButton();
        this._setupCommonEvents();
    }

    /**
     * 폼 유효성 검사
     * @private
     */
    _validateForm() {
        const title = this.view.getTitle();
        const content = this.view.getContent();

        const isValid = title.length > 0 && content.length > 0;

        this.view.updateButtonState(isValid);
        this.view.toggleValidationHelper(!isValid);
    }

    /**
     * 폼 제출 처리
     * @private
     */
    async _handleSubmit(event) {
        event.preventDefault();

        const title = this.view.getTitle();
        const content = this.view.getContent();

        if (!title || !content) return;

        try {
            const imageUrls = [];

            // 다중 이미지 업로드
            if (this.selectedFiles.length > 0) {
                for (const file of this.selectedFiles) {
                    const uploadResult = await PostModel.uploadImage(file);
                    const url = extractUploadedImageUrl(uploadResult);
                    if (!url) {
                        this.view.showToast(UI_MESSAGES.IMAGE_UPLOAD_FAIL);
                        return;
                    }
                    imageUrls.push(url);
                }
            }

            // 게시글 작성
            const categorySelect = document.getElementById('category-select');
            const categoryId = categorySelect ? Number(categorySelect.value) : 1;

            const postPayload = {
                title: title,
                content: content,
                category_id: categoryId,
                tags: this.view.getTags(),
            };

            // 이미지가 있으면 image_urls 배열로 전송
            if (imageUrls.length > 0) {
                postPayload.image_urls = imageUrls;
            }

            // 투표 데이터 포함
            const pollData = PostFormView.getPollData(document.getElementById('poll-section'));
            if (pollData) {
                postPayload.poll = pollData;
            }

            const result = await PostModel.createPost(postPayload);

            if (result.ok) {
                DraftService.clear(this._getDraftKey());
                DraftService.clearFromServer();
                showToastAndRedirect(UI_MESSAGES.POST_CREATE_SUCCESS, NAV_PATHS.MAIN);
            } else {
                this.view.showToast(UI_MESSAGES.POST_CREATE_FAIL);
            }

        } catch (error) {
            this._logger.error('게시글 작성 실패', error);
            this.view.showToast(UI_MESSAGES.UNKNOWN_ERROR);
        }
    }

    /**
     * 임시 저장된 초안 복원
     * @private
     */
    async _restoreDraft() {
        // 서버 임시저장 우선, 없으면 localStorage 폴백
        let draft = await DraftService.loadFromServer();
        let source = 'server';
        if (!draft) {
            draft = DraftService.load(this._getDraftKey());
            source = 'local';
        }
        if (!draft) return;

        const timeStr = DraftService.formatSavedAt(draft.savedAt);
        const restore = confirm(`임시 저장된 글이 있습니다 (${timeStr}). 불러올까요?`);

        if (restore) {
            this.view.setTitle(draft.title || '');
            this.view.setContent(draft.content || '');
            const categorySelect = document.getElementById('category-select');
            if (categorySelect && draft.categoryId) {
                categorySelect.value = draft.categoryId;
            }
            this._validateForm();
        } else {
            DraftService.clear(this._getDraftKey());
            if (source === 'server') DraftService.clearFromServer();
        }
    }
}

export default WriteController;
