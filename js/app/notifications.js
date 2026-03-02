// js/app/notifications.js
// 알림 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import NotificationController from '../controllers/NotificationController.js';

document.addEventListener('DOMContentLoaded', async () => {
    const headerController = new HeaderController();
    await headerController.init();

    document.getElementById('back-btn')?.addEventListener('click', () => history.back());

    const controller = new NotificationController();
    await controller.init();
});
