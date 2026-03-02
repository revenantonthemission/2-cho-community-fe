// js/app/write.js
// 게시글 작성 페이지 진입점

import HeaderController from '../controllers/HeaderController.js';
import WriteController from '../controllers/WriteController.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 헤더 초기화
    const headerController = new HeaderController();
    await headerController.init();

    // 작성 페이지 초기화 (카테고리 로드를 위해 사용자 정보 전달)
    const writeController = new WriteController();
    await writeController.init(headerController.getCurrentUser());
});
