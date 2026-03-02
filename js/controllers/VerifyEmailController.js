// js/controllers/VerifyEmailController.js
// 이메일 인증 처리 컨트롤러

import ApiService from '../services/ApiService.js';
import { API_ENDPOINTS } from '../constants.js';
import { resolveNavPath } from '../config.js';
import Logger from '../utils/Logger.js';

const logger = Logger.createLogger('VerifyEmailController');

/**
 * 이메일 인증 컨트롤러
 * URL의 token 파라미터를 추출하여 인증 API를 호출하고 결과를 표시한다.
 */
class VerifyEmailController {
    async init() {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const resultEl = document.getElementById('verify-result');

        if (!token) {
            resultEl.textContent = '유효하지 않은 인증 링크입니다.';
            return;
        }

        try {
            const result = await ApiService.post(API_ENDPOINTS.VERIFICATION.VERIFY, { token });

            if (result.ok) {
                resultEl.textContent = '이메일 인증이 완료되었습니다! 로그인 페이지로 이동합니다.';
                setTimeout(() => {
                    location.href = resolveNavPath('/login');
                }, 2000);
            } else {
                resultEl.textContent = '유효하지 않거나 만료된 인증 링크입니다.';
            }
        } catch (error) {
            logger.error('이메일 인증 처리 실패', error);
            resultEl.textContent = '인증 처리 중 오류가 발생했습니다.';
        }
    }
}

export default VerifyEmailController;
