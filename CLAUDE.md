# Frontend — CLAUDE.md

Camp Linux 프론트엔드. Vanilla JavaScript MPA, 프레임워크 없이 MVC 패턴으로 구축.

## Commands

```bash
# 개발 서버
npm run dev                    # Vite dev server (:8080)

# 빌드 + 린팅
npm run build                  # 프로덕션 빌드
npm run lint                   # ESLint + TypeScript 타입 체크
bash scripts/lint.sh           # 통합 품질 검사 (ESLint + tsc + build)

# E2E 테스트
npx playwright install         # 브라우저 설치 (최초 1회)
npx playwright test            # 전체 E2E 테스트
```

## MVC 아키텍처

```
html/*.html (31개 페이지)
  ↓ 1:1 매핑
js/app/*.js (31개 진입점)
  ↓
js/controllers/ (36개) — 비즈니스 로직, 상태 관리
  ↓
js/views/ (35개) — DOM 렌더링 (createElement + textContent)
  ↓
js/models/ (14개) — API 통신 (ApiService 래퍼)
  ↓
js/services/ — WebSocket, Draft, Theme 등 공통 서비스
```

### 패턴 규칙

- **모든 클래스는 정적 메서드(static methods)만 사용** — 인스턴스 생성 없음
- **진입점 1:1**: `html/write.html` → `js/app/write.js` → `WriteController`
- **XSS 방지**: `createElement()` + `textContent` 필수. `innerHTML` 금지 (마크다운은 DOMPurify)

## ApiService 사용법

```javascript
import { ApiService } from '../services/ApiService.js';

const result = await ApiService.get('/v1/posts/');
const result = await ApiService.post('/v1/posts/', { title, content });
const result = await ApiService.put('/v1/posts/1/', { title });
const result = await ApiService.delete('/v1/posts/1/');
```

- `.post()`는 빈 body도 `{}` 필수 (2번째 인자)
- `.request()` 없음 — `.get()`, `.post()`, `.put()`, `.delete()`만 사용
- `result.status` (HTTP 상태), `result.data.code` (앱 상태), `result.data.data` (페이로드, `unknown` 타입)

## 스타일

- **CSS**: `css/modules/` (22개) + `css/pages/` (12개). 순수 CSS, CSS Custom Properties (60+ tokens)
- **디자인 시스템**: Terminal Editorial (Light/Dark), IBM Plex 3종 폰트
- **스페이싱**: 4px 기반 스케일

## 주요 Gotchas

- **포트 고정**: `config.js`에 `127.0.0.1:8000` (BE), dev server는 `:8080`. `localhost` 사용 금지 (쿠키 도메인 불일치)
- **Vite strictPort**: 8080 점유 시 `npx vite --port 5173`으로 실행. BE `.env` `ALLOWED_ORIGINS`에 5173 추가 필요
- **양쪽 서버 동시 실행 필수**: FE가 BE API를 직접 호출
- **ESLint flat config**: `eslint.config.js` (`.eslintrc` 아님). `"type": "module"` 설정
- **`// @ts-check` per-file**: Wiki/Package JS 파일에 개별 `// @ts-check`가 있어 `tsconfig.json`의 `checkJs: false`를 오버라이드
- **Google Fonts 분리 로딩**: Sans KR(본문)은 render-blocking, Serif/Mono는 비동기 로딩
- **Pre-commit**: `husky` + `lint-staged` (ESLint)
- **새 HTML 페이지 추가 시 동기화**: `html/*.html` → `vite.config.js` input + rewrites → `constants.js` NAV_PATHS + HTML_PATHS → `nginx.k8s.conf` location 블록
- **DM UI**: 채팅 버블 대신 `[HH:MM] nickname >` 형식의 터미널 로그 스타일
