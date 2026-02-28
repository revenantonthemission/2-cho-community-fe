// js/app/find_account.js
// 계정 찾기 페이지 진입점

import FindAccountController from '../controllers/FindAccountController.js';

document.addEventListener('DOMContentLoaded', () => {
    const controller = new FindAccountController();
    controller.init();
});
