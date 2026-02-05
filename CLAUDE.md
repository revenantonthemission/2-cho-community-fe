# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vanilla JavaScript 프론트엔드 for AWS AI School 2기 커뮤니티 포럼 "아무 말 대잔치". FastAPI로 정적 파일을 서빙하며, 별도의 FastAPI 백엔드(Port 8000)와 통신합니다.

## Commands

```bash
# 개발 서버 실행 (Port 8080)
source .venv/bin/activate
uvicorn main:app --reload --port 8080

# Playwright 설치 (최초 1회)
npm install
npx playwright install chromium

# E2E 테스트 (백엔드 + 프론트엔드 실행 상태에서)
npx playwright test

# 단일 E2E 테스트 파일 실행
npx playwright test tests/e2e/full_flow.spec.js
```

## Architecture

### MVC 패턴 (엄격히 준수)

```text
js/
├── app/           # 진입점 - HTML별 초기화 (예: main.js → post_list.html)
├── controllers/   # 비즈니스 로직, Model과 View 조율
├── models/        # API 호출 담당 (ApiService 사용)
├── views/         # DOM 조작 및 렌더링
├── services/      # ApiService (HTTP 클라이언트)
├── utils/         # formatters, validators, Logger, dom 헬퍼
├── config.js      # API_BASE_URL 설정
└── constants.js   # API_ENDPOINTS, UI_MESSAGES, NAV_PATHS
```

### 데이터 흐름

1. `js/app/*.js` - DOMContentLoaded에서 Controller 초기화
2. Controller가 Model 호출 → Model이 ApiService로 API 요청
3. Controller가 결과를 View에 전달 → View가 DOM 업데이트

### 주요 컴포넌트

- **ApiService** (`js/services/ApiService.js`): 모든 HTTP 요청 처리. 401 에러 시 `auth:session-expired` 이벤트 발생
- **createElement** (`js/utils/dom.js`): XSS 방지를 위한 안전한 DOM 생성 (textContent 사용)
- **Logger** (`js/utils/Logger.js`): `console.log` 대신 사용
- **ErrorBoundary** (`js/utils/ErrorBoundary.js`): 5xx/429 에러 시 지수 백오프 재시도
- **ModalView** (`js/views/ModalView.js`): 삭제 확인 등 모달 다이얼로그
- **debounce** (`js/utils/debounce.js`): 입력 디바운싱

### 파일 네이밍

- JS 파일/클래스: `PascalCase` (예: `LoginController.js`, `ApiService.js`)
- HTML: `snake_case` (예: `post_list.html`, `user_login.html`)

## Key Files

- `js/config.js`: 백엔드 API URL 설정 (`API_BASE_URL`)
- `js/constants.js`: API 엔드포인트, UI 메시지 상수
- `main.py`: FastAPI 라우팅 (HTML 파일 서빙)
- `playwright.config.js`: E2E 테스트 설정 (baseURL: `http://127.0.0.1:8080`)

## Development Notes

- 모든 Model/View/Controller 메서드는 `static`으로 구현
- 무한 스크롤: `IntersectionObserver` 사용 (MainController)
- 사용자 입력 렌더링 시 반드시 `createElement` 또는 `textContent` 사용 (innerHTML 금지)

## Gotchas

- **양쪽 서버 필수**: E2E 테스트 및 실제 동작 시 백엔드(`localhost:8000`)와 프론트엔드(`localhost:8080`) 모두 실행 중이어야 함
- **API URL 하드코딩**: `js/config.js`의 `API_BASE_URL`이 `http://127.0.0.1:8000`으로 고정. 백엔드 포트 변경 시 이 파일 수정 필요
- **문자열 상수 관리**: UI 메시지와 API 엔드포인트는 반드시 `js/constants.js`에 정의 — 컨트롤러/뷰에 하드코딩 금지
- **`fetch()` 직접 사용 금지**: 모든 API 호출은 `ApiService`를 통해야 함 (401 처리, 재시도, 쿠키 자동 포함)
- **`app/` 진입점**: 각 HTML에 1:1로 매핑된 `js/app/*.js`만 `<script>` 태그로 로드. 다른 JS 파일은 직접 HTML에서 로드하지 않음
