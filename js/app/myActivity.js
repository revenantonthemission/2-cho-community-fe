// js/app/myActivity.js
// 내 활동 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import MyActivityController from '../controllers/MyActivityController.js';

document.addEventListener('DOMContentLoaded', async () => {
    const headerController = new HeaderController();
    await headerController.init();

    document.getElementById('back-btn')?.addEventListener('click', () => history.back());

    const controller = new MyActivityController();
    await controller.init();
});
