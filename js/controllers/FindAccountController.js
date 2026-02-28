// js/controllers/FindAccountController.js
// 계정 찾기 페이지 컨트롤러 (이메일 찾기 + 비밀번호 찾기)

import UserModel from '../models/UserModel.js';
import FindAccountView from '../views/FindAccountView.js';
import FormValidator from '../views/FormValidator.js';
import Logger from '../utils/Logger.js';

const logger = Logger.createLogger('FindAccountController');

/**
 * 계정 찾기 컨트롤러
 * 이메일 찾기 (닉네임 → 마스킹 이메일)와
 * 비밀번호 찾기 (이메일 → 임시 비밀번호 발송) 두 기능을 관리합니다.
 */
class FindAccountController {
    constructor() {
        this.view = new FindAccountView();
        this.state = {
            nickname: { valid: false, touched: false },
            resetEmail: { valid: false, touched: false },
            activeTab: 'find-email',
        };
    }

    /**
     * 컨트롤러 초기화
     */
    init() {
        if (!this.view.initialize()) {
            logger.error('DOM 초기화 실패');
            return;
        }
        this._setupEventListeners();
    }

    /**
     * 이벤트 리스너 등록
     */
    _setupEventListeners() {
        this.view.bindEvents({
            onTabFindEmail: () => this._switchTab('find-email'),
            onTabResetPassword: () => this._switchTab('reset-password'),
            onNicknameInput: () => this._handleNicknameInput(),
            onResetEmailInput: () => this._handleResetEmailInput(),
            onFindEmailSubmit: (e) => this._handleFindEmailSubmit(e),
            onResetPasswordSubmit: (e) => this._handleResetPasswordSubmit(e),
        });
    }

    /**
     * 탭 전환
     * @param {'find-email' | 'reset-password'} tab
     */
    _switchTab(tab) {
        this.state.activeTab = tab;
        this.view.switchTab(tab);
        if (tab === 'find-email') {
            this.view.hideEmailResult();
        }
    }

    /**
     * 닉네임 입력 핸들러
     */
    _handleNicknameInput() {
        this.state.nickname.touched = true;
        const nickname = this.view.getNickname();
        if (!nickname) {
            this.view.showNicknameError('* 닉네임을 입력해주세요.');
            this.state.nickname.valid = false;
        } else {
            this.view.hideNicknameError();
            this.state.nickname.valid = true;
        }
        this.view.updateFindEmailBtn(this.state.nickname.valid);
    }

    /**
     * 비밀번호 찾기 이메일 입력 핸들러
     */
    _handleResetEmailInput() {
        this.state.resetEmail.touched = true;
        const email = this.view.getResetEmail();
        this.state.resetEmail.valid = FormValidator.validateEmail(
            email,
            this.view.resetEmailHelper
        );
        this.view.updateResetPasswordBtn(this.state.resetEmail.valid);
    }

    /**
     * 이메일 찾기 제출 핸들러
     * @param {Event} event
     */
    async _handleFindEmailSubmit(event) {
        event.preventDefault();
        const nickname = this.view.getNickname();
        if (!nickname) {
            this.view.showNicknameError('* 닉네임을 입력해주세요.');
            return;
        }

        this.view.updateFindEmailBtn(false);
        this.view.hideEmailResult();

        try {
            const result = await UserModel.findEmail(nickname);
            if (result.ok) {
                const maskedEmail = result.data?.data?.masked_email || '';
                this.view.showEmailResult(maskedEmail);
            } else if (result.status === 429) {
                this.view.showToastMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            } else {
                this.view.showNicknameError('* 이메일 조회에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            logger.error('이메일 찾기 오류', error);
            this.view.showNicknameError('* 서버와 통신할 수 없습니다.');
        } finally {
            this.view.updateFindEmailBtn(this.state.nickname.valid);
        }
    }

    /**
     * 비밀번호 재설정 제출 핸들러
     * @param {Event} event
     */
    async _handleResetPasswordSubmit(event) {
        event.preventDefault();
        const email = this.view.getResetEmail();
        if (!this.state.resetEmail.valid) {
            this.view.showResetEmailError('* 올바른 이메일 주소를 입력해주세요.');
            return;
        }

        this.view.updateResetPasswordBtn(false);

        try {
            const result = await UserModel.resetPassword(email);
            if (result.status === 429) {
                this.view.showToastMessage('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            } else if (!result.ok) {
                this.view.showToastMessage('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else {
                // 서버는 이메일 존재 여부와 무관하게 항상 성공 응답 반환
                this.view.showResetSuccess();
            }
        } catch (error) {
            logger.error('비밀번호 재설정 오류', error);
            this.view.showToastMessage('오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.view.updateResetPasswordBtn(this.state.resetEmail.valid);
        }
    }
}

export default FindAccountController;
