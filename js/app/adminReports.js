// js/app/adminReports.js
// 신고 관리 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import AdminReportController from '../controllers/AdminReportController.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 헤더 초기화
    const headerController = new HeaderController();
    await headerController.init();

    // 신고 관리 초기화 (관리자 권한 검증 포함)
    const adminController = new AdminReportController();
    await adminController.init(headerController.getCurrentUser());
});
