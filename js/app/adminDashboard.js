// js/app/adminDashboard.js
// 관리자 대시보드 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import AdminDashboardController from '../controllers/AdminDashboardController.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 헤더 초기화
    const headerController = new HeaderController();
    await headerController.init();

    // 관리자 대시보드 초기화 (관리자 권한 검증 포함)
    const dashboardController = new AdminDashboardController();
    await dashboardController.init(headerController.getCurrentUser());
});
