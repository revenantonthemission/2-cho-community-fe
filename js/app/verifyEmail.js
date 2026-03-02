// js/app/verifyEmail.js
// 이메일 인증 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import VerifyEmailController from '../controllers/VerifyEmailController.js';

document.addEventListener('DOMContentLoaded', async () => {
    const headerController = new HeaderController();
    await headerController.init();

    document.getElementById('back-btn')?.addEventListener('click', () => history.back());

    const controller = new VerifyEmailController();
    await controller.init();
});
