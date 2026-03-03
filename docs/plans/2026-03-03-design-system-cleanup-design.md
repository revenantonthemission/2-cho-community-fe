# 1단계: 디자인 시스템 정리 — 설계 문서

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 21개 CSS 파일에 하드코딩된 색상·스페이싱·타이포그래피를 CSS Custom Properties로 중앙화하고, 이중 토스트 시스템을 통합한다.

**Architecture:** `variables.css`에 모든 디자인 토큰을 `:root`로 정의 → 기존 CSS 파일에서 `var()` 참조 → 토스트 시스템 단일화

**Tech Stack:** Vanilla CSS (CSS Custom Properties), 빌드 도구 없음

---

## A. 토큰 체계 (`variables.css`)

### 컬러

```css
:root {
  /* Primary */
  --color-primary: #ACA0EB;
  --color-primary-hover: #7F6AEE;
  --color-primary-accent: #7C4DFF;

  /* Semantic */
  --color-error: #FF3333;
  --color-error-dark: #E53935;
  --color-warning: #FF6D00;
  --color-success: #2E7D32;
  --color-info: #4A90D9;
  --color-info-hover: #357ABD;
  --color-bookmark: #F5A623;

  /* Text */
  --color-text-primary: #333;
  --color-text-secondary: #666;
  --color-text-tertiary: #888;
  --color-text-placeholder: #999;
  --color-text-white: #fff;

  /* Background */
  --color-bg-primary: #fff;
  --color-bg-secondary: #f4f5f7;
  --color-bg-tertiary: #f5f5f5;
  --color-bg-input: #f9f9f9;

  /* Border */
  --color-border: #ddd;
  --color-border-light: #eee;
  --color-border-dark: #ccc;

  /* Overlay */
  --color-overlay: rgba(0, 0, 0, 0.5);
  --color-overlay-light: rgba(0, 0, 0, 0.1);

  /* Status badge */
  --color-badge-pending-bg: #FFF3E0;
  --color-badge-pending-text: #E65100;
  --color-badge-resolved-bg: #E8F5E9;
  --color-badge-resolved-text: #2E7D32;
  --color-badge-dismissed-bg: #ECEFF1;
  --color-badge-dismissed-text: #546E7A;
  --color-badge-category-bg: #EDE7F6;
  --color-badge-category-text: #5E35B1;

  /* Notification */
  --color-notification-unread: #f0f7ff;
  --color-notification-unread-hover: #e3f0ff;
  --color-notification-badge: #ff4444;
  --color-reply-indicator-bg: #f3e5f5;
}
```

### 스페이싱 (4px 기반)

```css
:root {
  --spacing-2xs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  --spacing-4xl: 40px;
}
```

### 타이포그래피

```css
:root {
  --font-family: 'Pretendard', 'Noto Sans KR', sans-serif;

  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;
  --font-size-2xl: 28px;
  --font-size-3xl: 32px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.4;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
}
```

### Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 20px;
  --radius-full: 50%;
}
```

### Box Shadow

```css
:root {
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.2);
  --shadow-primary: 0 4px 12px rgba(127, 106, 238, 0.3);
  --shadow-primary-active: 0 2px 4px rgba(127, 106, 238, 0.2);
}
```

### Z-Index

```css
:root {
  --z-header: 1000;
  --z-dropdown: 1001;
  --z-modal: 2000;
  --z-toast: 3000;
}
```

### Transition

```css
:root {
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

---

## B. 마이그레이션 전략

### 치환 원칙

1. **정확히 매칭되는 값만 치환** — `#ACA0EB` → `var(--color-primary)` 등 1:1 대응
2. **근사값 통일** — `#f5f5f5`와 `#f0f0f0` → `var(--color-bg-tertiary)`
3. **일회성 값도 변수화** — semantic name 부여 (예: `#f0f7ff` → `var(--color-notification-unread)`)
4. **HTML 변경 없음** — CSS만 수정
5. **6px, 10px, 14px 등 스케일 밖 값** — 가장 가까운 토큰으로 통일하거나, 해당 컨텍스트에서 의미적으로 맞는 토큰 사용

### 로딩 순서

모든 HTML `<head>`에서 `variables.css`를 최상단에 배치:

```html
<link rel="stylesheet" href="/css/variables.css">  <!-- 첫 번째 -->
<link rel="stylesheet" href="/css/base.css">
<link rel="stylesheet" href="/css/layout.css">
<!-- modules, pages ... -->
```

### 수정 대상 파일 (21개)

**Base/Layout:**
- `base.css`, `layout.css`

**Modules (11개):**
- `buttons.css`, `cards.css`, `comments.css`, `forms.css`, `modals.css`, `search.css`, `notifications.css`, `activity.css`, `animations.css`, `toast.css`, `user-profile.css`

**Pages (6개):**
- `detail.css`, `write.css`, `signup.css`, `login.css`, `profile.css`, `find_account.css`, `admin.css`

---

## C. 토스트 통합

### 현재 상태 (이중 시스템)

| | `modals.css` `.toast` | `toast.css` `#toast` |
|---|---|---|
| 배경색 | `#ACA0EB` (보라) | `#333` (다크) |
| 위치 | `bottom: 40px` | `bottom: 30px` |
| z-index | 3000 | 1000 |
| 애니메이션 | opacity 0.5s | opacity+bottom 0.3s |
| 센터링 | transform | margin |

### 통합안

- 선택자: `.toast` (클래스 기반)
- 배경색: 타입별 분기 — `.toast--success`, `.toast--error`, `.toast--info` (기본: `var(--color-text-primary)`)
- 위치: `bottom: 40px`, `transform: translateX(-50%)`
- z-index: `var(--z-toast)`
- 애니메이션: opacity + translateY `var(--transition-normal)`

### JS 변경

- `modals.css`에서 `.toast` 관련 코드 제거
- `toast.css`를 통합 스타일로 재작성
- JS에서 `#toast` ID 참조 → `.toast` 클래스 기반으로 통일
- 토스트 호출 유틸 함수에 `type` 파라미터 추가 (success/error/info)
