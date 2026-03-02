// js/views/FindAccountView.js
// 계정 찾기 페이지 View — DOM 조작 담당

import { showError, hideError, showToast, updateButtonState } from './helpers.js';

/**
 * 계정 찾기 페이지 View 클래스
 * 이메일 찾기 / 비밀번호 찾기 두 탭의 DOM 조작을 담당합니다.
 */
class FindAccountView {
    constructor() {
        // 탭 버튼
        this.tabFindEmail = null;
        this.tabResetPassword = null;
        // 이메일 찾기 패널
        this.findEmailForm = null;
        this.nicknameInput = null;
        this.nicknameHelper = null;
        this.findEmailBtn = null;
        this.findEmailResult = null;
        this.maskedEmailDisplay = null;
        // 비밀번호 찾기 패널
        this.resetPasswordForm = null;
        this.resetEmailInput = null;
        this.resetEmailHelper = null;
        this.resetPasswordBtn = null;
    }

    /**
     * DOM 요소 초기화
     * @returns {boolean} 초기화 성공 여부
     */
    initialize() {
        this.tabFindEmail = document.getElementById('tab-find-email');
        this.tabResetPassword = document.getElementById('tab-reset-password');
        this.findEmailForm = document.getElementById('find-email-form');
        this.nicknameInput = document.getElementById('nickname');
        this.nicknameHelper = document.getElementById('nickname-helper');
        this.findEmailBtn = document.getElementById('find-email-btn');
        this.findEmailResult = document.getElementById('find-email-result');
        this.maskedEmailDisplay = document.getElementById('masked-email-display');
        this.resetPasswordForm = document.getElementById('reset-password-form');
        this.resetEmailInput = document.getElementById('reset-email');
        this.resetEmailHelper = document.getElementById('reset-email-helper');
        this.resetPasswordBtn = document.getElementById('reset-password-btn');

        return !!(this.findEmailForm && this.resetPasswordForm);
    }

    /** @returns {string} 닉네임 입력값 (trim 적용) */
    getNickname() { return this.nicknameInput?.value.trim() || ''; }

    /** @returns {string} 이메일 입력값 (trim 적용) */
    getResetEmail() { return this.resetEmailInput?.value.trim() || ''; }

    /** @param {string} message - 에러 메시지 */
    showNicknameError(message) { showError(this.nicknameHelper, message); }

    hideNicknameError() { hideError(this.nicknameHelper); }

    /** @param {string} message - 에러 메시지 */
    showResetEmailError(message) { showError(this.resetEmailHelper, message); }

    hideResetEmailError() { hideError(this.resetEmailHelper); }

    /** @param {boolean} isValid - 버튼 활성화 여부 */
    updateFindEmailBtn(isValid) { updateButtonState(this.findEmailBtn, isValid); }

    /** @param {boolean} isValid - 버튼 활성화 여부 */
    updateResetPasswordBtn(isValid) { updateButtonState(this.resetPasswordBtn, isValid); }

    /**
     * 이메일 찾기 결과 표시
     * XSS 방지: textContent 사용
     * @param {string} maskedEmail - 마스킹된 이메일
     */
    showEmailResult(maskedEmail) {
        if (this.maskedEmailDisplay) {
            this.maskedEmailDisplay.textContent = maskedEmail;
        }
        if (this.findEmailResult) {
            this.findEmailResult.hidden = false;
        }
    }

    /** 이메일 찾기 결과 숨기기 */
    hideEmailResult() {
        if (this.findEmailResult) this.findEmailResult.hidden = true;
    }

    /**
     * 비밀번호 재설정 성공 토스트
     */
    showResetSuccess() {
        showToast('임시 비밀번호가 이메일로 발송되었습니다. 이메일을 확인해주세요.');
    }

    /**
     * 일반 토스트 메시지
     * @param {string} message - 표시할 메시지
     */
    showToastMessage(message) { showToast(message); }

    /**
     * 탭 전환
     * @param {'find-email' | 'reset-password'} activeTab - 활성화할 탭
     */
    switchTab(activeTab) {
        const panels = {
            'find-email': document.getElementById('panel-find-email'),
            'reset-password': document.getElementById('panel-reset-password'),
        };
        const tabs = {
            'find-email': this.tabFindEmail,
            'reset-password': this.tabResetPassword,
        };

        Object.entries(panels).forEach(([key, panel]) => {
            if (panel) panel.hidden = (key !== activeTab);
        });
        Object.entries(tabs).forEach(([key, tab]) => {
            if (tab) {
                tab.classList.toggle('active', key === activeTab);
                tab.setAttribute('aria-selected', key === activeTab ? 'true' : 'false');
            }
        });
    }

    /**
     * 이벤트 리스너 바인딩
     * @param {object} handlers - 이벤트 핸들러 객체
     */
    bindEvents(handlers) {
        if (this.tabFindEmail) {
            this.tabFindEmail.addEventListener('click', handlers.onTabFindEmail);
        }
        if (this.tabResetPassword) {
            this.tabResetPassword.addEventListener('click', handlers.onTabResetPassword);
        }
        if (this.nicknameInput) {
            this.nicknameInput.addEventListener('input', handlers.onNicknameInput);
        }
        if (this.resetEmailInput) {
            this.resetEmailInput.addEventListener('input', handlers.onResetEmailInput);
        }
        if (this.findEmailForm) {
            this.findEmailForm.addEventListener('submit', handlers.onFindEmailSubmit);
        }
        if (this.resetPasswordForm) {
            this.resetPasswordForm.addEventListener('submit', handlers.onResetPasswordSubmit);
        }
    }
}

export default FindAccountView;
