// js/models/UserModel.js
// 사용자 관련 API 호출 관리

import ApiService from '../services/ApiService.js';
import { API_ENDPOINTS } from '../constants.js';

/**
 * 사용자 관련 Model
 */
class UserModel {
    /**
     * 회원가입
     * @param {FormData} formData - 회원가입 폼 데이터 (email, password, nickname, profile_image)
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async signup(formData) {
        return ApiService.postFormData(API_ENDPOINTS.USERS.ROOT, formData);
    }

    /**
     * 사용자 프로필 수정
     * @param {object} data - 수정할 데이터 (nickname, profileImageUrl 등)
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async updateProfile(data) {
        return ApiService.patch(API_ENDPOINTS.USERS.ME, data);
    }

    /**
     * 비밀번호 변경
     * @param {string} newPassword - 새 비밀번호
     * @param {string} newPasswordConfirm - 새 비밀번호 확인
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async changePassword(newPassword, newPasswordConfirm) {
        return ApiService.put(API_ENDPOINTS.USERS.PASSWORD, {
            new_password: newPassword,
            new_password_confirm: newPasswordConfirm
        });
    }

    /**
     * 회원 탈퇴
     * @param {string} password - 비밀번호 확인
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async withdraw(password) {
        return ApiService.delete(API_ENDPOINTS.USERS.ME, {
            password: password,
            agree: true
        });
    }

    /**
     * 프로필 이미지 업로드 (게시글 이미지 업로드 엔드포인트 사용)
     * @param {File} file - 이미지 파일
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async uploadProfileImage(file) {
        const formData = new FormData();
        formData.append('file', file);
        return ApiService.postFormData(API_ENDPOINTS.USERS.PROFILE_IMAGE, formData);
    }

    /**
     * 닉네임으로 이메일 찾기
     * @param {string} nickname - 닉네임
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async findEmail(nickname) {
        return ApiService.post(API_ENDPOINTS.USERS.FIND_EMAIL, { nickname });
    }

    /**
     * 임시 비밀번호 요청
     * @param {string} email - 이메일 주소
     * @returns {Promise<{ok: boolean, status: number, data: any}>}
     */
    static async resetPassword(email) {
        return ApiService.post(API_ENDPOINTS.USERS.RESET_PASSWORD, { email });
    }
}

export default UserModel;
