# 1단계: 디자인 시스템 정리 — 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 21개 CSS 파일에 하드코딩된 색상·스페이싱·타이포그래피를 CSS Custom Properties로 중앙화하고, 이중 토스트 시스템을 통합한다.

**Architecture:** `variables.css`에 모든 디자인 토큰을 `:root`로 정의 → `style.css`에서 첫 번째 `@import`로 로드 → 기존 CSS 파일에서 `var()` 참조로 치환 → 토스트 시스템 단일화

**Tech Stack:** Vanilla CSS (CSS Custom Properties), 빌드 도구 없음

**설계 문서:** `docs/plans/2026-03-03-design-system-cleanup-design.md`

---

## 프로젝트 구조 참고

```
css/
├── style.css          ← @import 진입점 (여기에 variables.css 추가)
├── variables.css      ← [신규] 디자인 토큰
├── base.css
├── layout.css
├── modules/
│   ├── buttons.css
│   ├── forms.css
│   ├── cards.css
│   ├── modals.css
│   ├── comments.css
│   ├── toast.css
│   ├── animations.css
│   ├── notifications.css  ← HTML <link>로 로드
│   ├── search.css         ← HTML <link>로 로드
│   ├── activity.css       ← HTML <link>로 로드
│   └── user-profile.css   ← HTML <link>로 로드
└── pages/
    ├── detail.css
    ├── write.css     ← 치환 대상 없음 (스킵)
    ├── signup.css
    ├── login.css
    ├── profile.css
    ├── find_account.css
    └── admin.css
```

**CSS 로딩 구조:**
- 모든 HTML은 `<link href="/css/style.css">`를 첫 번째로 로드
- `style.css`는 `@import`로 base → layout → modules 순서로 로드
- 일부 modules(search, activity, notifications, user-profile)와 모든 pages CSS는 HTML `<link>` 태그로 별도 로드
- `:root` CSS Custom Properties는 DOM 레벨에서 해석되므로, `variables.css`가 `style.css` 첫 번째 import이면 모든 CSS에서 `var()` 사용 가능

---

## Task 1: `variables.css` 생성 및 `style.css` 통합

**Files:**
- Create: `css/variables.css`
- Modify: `css/style.css:1` (첫 줄에 import 추가)

**Step 1: `variables.css` 생성**

`css/variables.css` 파일을 생성한다. 설계 문서의 토큰 체계를 그대로 적용:

```css
/* css/variables.css */
/* 디자인 토큰 — 모든 CSS에서 var()로 참조 */

:root {
  /* ============================= */
  /* Colors                        */
  /* ============================= */

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

  /* ============================= */
  /* Spacing (4px 기반)             */
  /* ============================= */
  --spacing-2xs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;
  --spacing-3xl: 32px;
  --spacing-4xl: 40px;

  /* ============================= */
  /* Typography                    */
  /* ============================= */
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

  /* ============================= */
  /* Border Radius                 */
  /* ============================= */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 20px;
  --radius-full: 50%;

  /* ============================= */
  /* Box Shadow                    */
  /* ============================= */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.2);
  --shadow-primary: 0 4px 12px rgba(127, 106, 238, 0.3);
  --shadow-primary-active: 0 2px 4px rgba(127, 106, 238, 0.2);

  /* ============================= */
  /* Z-Index                       */
  /* ============================= */
  --z-header: 1000;
  --z-dropdown: 1001;
  --z-modal: 2000;
  --z-toast: 3000;

  /* ============================= */
  /* Transition                    */
  /* ============================= */
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

**Step 2: `style.css` 첫 줄에 import 추가**

`css/style.css`의 맨 위에 추가:

```css
@import url('variables.css');
```

기존 주석 블록 `/* css/style.css */` 바로 아래, `/* SMACSS 기반 CSS 구조화 */` 위에 삽입.

결과:
```css
/* css/style.css */
@import url('variables.css');
/* SMACSS 기반 CSS 구조화 - 모든 모듈 Import */
...
```

**Step 3: 브라우저에서 로딩 확인**

Run: 프론트엔드 서버 실행 후 브라우저 DevTools → Elements → `<html>` 요소 선택 → Computed 탭에서 `--color-primary` 등 변수 확인

Expected: 모든 변수가 `:root`에 정의되어 있음

**Step 4: 커밋**

```bash
cd 2-cho-community-fe
git add css/variables.css css/style.css
git commit -m "feat: add CSS design tokens (variables.css) and integrate into style.css"
```

---

## Task 2: `base.css` 마이그레이션

**Files:**
- Modify: `css/base.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 기존 값 | 변경 후 |
|------|---------|---------|
| 23 | `font-family: 'Pretendard', 'Noto Sans KR', sans-serif` | `font-family: var(--font-family)` |
| 24 | `background-color: #f4f5f7` | `background-color: var(--color-bg-secondary)` |
| 25 | `line-height: 1.5` | `line-height: var(--line-height-normal)` |
| 26 | `color: #333` | `color: var(--color-text-primary)` |
| 39 | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 67 | `margin-bottom: 30px` | `margin-bottom: 30px` (스케일 밖 — 유지) |
| 95 | `background-color: #ddd` | `background-color: var(--color-border)` |
| 103 | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 104 | `color: #FF3333` | `color: var(--color-error)` |
| 105 | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 115 | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 116 | `color: #FF3333` | `color: var(--color-error)` |
| 117 | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |
| 118 | `margin-top: 8px` | `margin-top: var(--spacing-sm)` |

**Step 2: 브라우저에서 시각적 변화 없음 확인**

아무 페이지나 열어서 body 배경색, 텍스트 색상, 헬퍼 텍스트 에러 색상 확인.

**Step 3: 커밋**

```bash
git add css/base.css
git commit -m "refactor: migrate base.css to CSS custom properties"
```

---

## Task 3: `layout.css` 마이그레이션

**Files:**
- Modify: `css/layout.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 13 | `header` | `z-index: 1000` | `z-index: var(--z-header)` |
| 14 | `header` | `background-color: #f4f5f7` | `background-color: var(--color-bg-secondary)` |
| 45 | `.back-button` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 56 | `.back-button:hover` | `background-color: rgba(0, 0, 0, 0.05)` | `background-color: rgba(0, 0, 0, 0.05)` (유지 — 미세 투명도는 토큰 없음) |
| 74 | `header h2` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 75 | `header h2` | `font-size: 32px` | `font-size: var(--font-size-3xl)` |
| 88 | `.header-auth` | `gap: 10px` | `gap: 10px` (유지 — 10px은 스케일 밖) |
| 94 | `.profile-circle` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 95 | `.profile-circle` | `background-color: #ddd` | `background-color: var(--color-border)` |
| 96 | `.profile-circle` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 107 | `.header-dropdown` | `background-color: #fff` | `background-color: var(--color-bg-primary)` |
| 108 | `.header-dropdown` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 109 | `.header-dropdown` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 110 | `.header-dropdown` | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)` | `box-shadow: var(--shadow-md)` |
| 112 | `.header-dropdown` | `z-index: 1001` | `z-index: var(--z-dropdown)` |
| 124 | `.header-dropdown li` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 125 | `.header-dropdown li` | `color: #333` | `color: var(--color-text-primary)` |
| 127 | `.header-dropdown li` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 142 | `.main-container` | `padding: 0 20px` | `padding: 0 var(--spacing-xl)` |
| 144 | `.main-container` | `padding-bottom: 40px` | `padding-bottom: var(--spacing-4xl)` |
| 149 | `.welcome-section` | `margin-bottom: 24px` | `margin-bottom: var(--spacing-2xl)` |
| 154 | `.welcome-section` | `gap: 12px` | `gap: var(--spacing-md)` |
| 158 | `.welcome-section h3` | `font-size: 24px` | `font-size: var(--font-size-xl)` |
| 159 | `.welcome-section h3` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |

**Step 2: 브라우저에서 헤더, 드롭다운, 메인 컨테이너 확인**

**Step 3: 커밋**

```bash
git add css/layout.css
git commit -m "refactor: migrate layout.css to CSS custom properties"
```

---

## Task 4: `modules/buttons.css` 마이그레이션

**Files:**
- Modify: `css/modules/buttons.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 9 | `.write-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 10 | `.write-btn` | `color: white` | `color: var(--color-text-white)` |
| 12 | `.write-btn` | `border-radius: 20px` | `border-radius: var(--radius-pill)` |
| 13 | `.write-btn` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 14 | `.write-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 16 | `.write-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 20 | `.write-btn:hover` | `background-color: #7F6AEE` | `background-color: var(--color-primary-hover)` |
| 28 | `.action-btn` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 29 | `.action-btn` | `background: #fff` | `background: var(--color-bg-primary)` |
| 30 | `.action-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 31 | `.action-btn` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 33 | `.action-btn` | `transition: background 0.2s` | `transition: background var(--transition-fast)` |
| 37 | `.action-btn:hover` | `background: #f0f0f0` | `background: var(--color-bg-tertiary)` |
| 44 | `.small-btn` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 45 | `.small-btn` | `padding: 4px 8px` | `padding: var(--spacing-xs) var(--spacing-sm)` |
| 46 | `.small-btn` | `border: 1px solid #eee` | `border: 1px solid var(--color-border-light)` |
| 47 | `.small-btn` | `background: #fff` | `background: var(--color-bg-primary)` |
| 48 | `.small-btn` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 58 | `.submit-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 59 | `.submit-btn` | `color: white` | `color: var(--color-text-white)` |
| 61 | `.submit-btn` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 62 | `.submit-btn` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 63 | `.submit-btn` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 65 | `.submit-btn` | `transition: background 0.3s` | `transition: background var(--transition-normal)` |
| 69 | `.submit-btn:disabled` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 77 | `.submit-btn.active` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 81 | `.submit-btn.active:hover` | `background-color: #7F6AEE` | `background-color: var(--color-primary-hover)` |
| 91 | `.login-btn, .signup-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 92 | `.login-btn, .signup-btn` | `color: white` | `color: var(--color-text-white)` |
| 94 | `.login-btn, .signup-btn` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 95 | `.login-btn, .signup-btn` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 97 | `.login-btn, .signup-btn` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 98 | `.login-btn, .signup-btn` | `margin-top: 16px` | `margin-top: var(--spacing-lg)` |
| 99 | `.login-btn, .signup-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 104 | `.login-btn:hover, .signup-btn:hover` | `background-color: #7F6AEE` | `background-color: var(--color-primary-hover)` |
| 109 | `.login-btn:disabled, .signup-btn:disabled` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 119 | `.secondary-btn` | `background: #f0f0f0` | `background: var(--color-bg-tertiary)` |
| 120 | `.secondary-btn` | `color: #333` | `color: var(--color-text-primary)` |
| 124 | `.primary-btn` | `background: #ACA0EB` | `background: var(--color-primary)` |
| 125 | `.primary-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 136 | `.report-btn` | `color: #E53935` | `color: var(--color-error-dark)` |
| 149 | `.pin-btn` | `color: #FF6D00` | `color: var(--color-warning)` |
| 163 | `.post-extra-actions` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 164 | `.post-extra-actions` | `margin-top: 12px` | `margin-top: var(--spacing-md)` |
| 174 | `.category-select` | `border: 1px solid #ddd` | `border: 1px solid var(--color-border)` |
| 175 | `.category-select` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 176 | `.category-select` | `background: #fff` | `background: var(--color-bg-primary)` |
| 177 | `.category-select` | `color: #333` | `color: var(--color-text-primary)` |
| 175 | `.category-select` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 181 | `.category-select` | `transition: border-color 0.2s` | `transition: border-color var(--transition-fast)` |
| 186 | `.category-select:focus` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 190 | `.category-select option:disabled` | `color: #ccc` | `color: var(--color-border-dark)` |
| 197 | `.menu-admin` | `color: #E53935` | `color: var(--color-error-dark)` |
| 198 | `.menu-admin` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 209 | `.withdraw-btn` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 210 | `.withdraw-btn` | `color: #666` | `color: var(--color-text-secondary)` |
| 214 | `.withdraw-btn:hover` | `color: #333` | `color: var(--color-text-primary)` |

**Step 2: 브라우저에서 버튼 색상 확인 (게시글 작성, 로그인, 검색 페이지)**

**Step 3: 커밋**

```bash
git add css/modules/buttons.css
git commit -m "refactor: migrate buttons.css to CSS custom properties"
```

---

## Task 5: `modules/forms.css` 마이그레이션

**Files:**
- Modify: `css/modules/forms.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 10 | `.input-group` | `margin-bottom: 16px` | `margin-bottom: var(--spacing-lg)` |
| 14 | `.input-group label` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 15 | `.input-group label` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 16 | `.input-group label` | `color: #333` | `color: var(--color-text-primary)` |
| 17 | `.input-group label` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 24 | `.form-divider` | `background-color: #ddd` | `background-color: var(--color-border)` |
| 25 | `.form-divider` | `margin: 24px 0` | `margin: var(--spacing-2xl) 0` |
| 30 | `.input-group input` | `padding: 12px` | `padding: var(--spacing-md)` |
| 31 | `.input-group input` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 32 | `.input-group input` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 39 | `.input-group input:focus` | `border-color: #ACA0EB` | `border-color: var(--color-primary)` |
| 43 | `.input-group span` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 44 | `.input-group span` | `color: #FF3333` | `color: var(--color-error)` |
| 45 | `.input-group span` | `margin-top: 4px` | `margin-top: var(--spacing-xs)` |
| 53 | `.profile-upload-container` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 65 | `.profile-label (header)` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 67 | `.profile-label (header)` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 68 | `.profile-label (header)` | `color: #333` | `color: var(--color-text-primary)` |
| 72 | `.helper-text` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 73 | `.profile-section-header .helper-text` | `color: #FF3333` | `color: var(--color-error)` |
| 84 | `.profile-preview` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 85 | `.profile-preview` | `background-color: #f0f0f0` | `background-color: var(--color-bg-tertiary)` |
| 110 | `.profile-form-group` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 117 | `.profile-label (form)` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 119 | `.profile-label (form)` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 120 | `.profile-label (form)` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 121 | `.profile-label (form)` | `color: #333` | `color: var(--color-text-primary)` |
| 125 | `.profile-input` | `padding: 12px` | `padding: var(--spacing-md)` |
| 126 | `.profile-input` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 127 | `.profile-input` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 125 | `.profile-input` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 129 | `.profile-input` | `background-color: #f9f9f9` | `background-color: var(--color-bg-input)` |
| 142 | `.image-upload-section` | `margin-top: 20px` | `margin-top: var(--spacing-xl)` |
| 147 | `.image-upload-box` | `border: 1px dashed #ccc` | `border: 1px dashed var(--color-border-dark)` |
| 148 | `.image-upload-box` | `background-color: #f9f9f9` | `background-color: var(--color-bg-input)` |
| 148 | `.image-upload-box` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 149 | `.image-upload-box` | `padding: 20px` | `padding: var(--spacing-xl)` |
| 152 | `.image-upload-box` | `transition: background 0.2s` | `transition: background var(--transition-fast)` |
| 156 | `.image-upload-box:hover` | `background-color: #f0f0f0` | `background-color: var(--color-bg-tertiary)` |
| 163 | `.upload-label` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 165 | `.upload-label` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 166 | `.upload-label` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 167 | `.upload-label` | `color: #333` | `color: var(--color-text-primary)` |
| 174 | `.image-preview` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 202 | `#post-title` | `font-size: 24px` | `font-size: var(--font-size-xl)` |
| 203 | `#post-title` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 219 | `#post-content` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 245 | `.content-textarea` | `padding: 12px` | `padding: var(--spacing-md)` |
| 247 | `.content-textarea` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 247 | `.content-textarea` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 256 | `.content-textarea:focus` | `border-color: #ACA0EB` | `border-color: var(--color-primary)` |
| 268 | `.file-upload-label` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 269 | `.file-upload-label` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 272 | `.file-upload-label` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 278 | `.file-upload-row` | `gap: 12px` | `gap: var(--spacing-md)` |
| 283 | `.file-select-btn` | `padding: 8px 16px` | `padding: var(--spacing-sm) var(--spacing-lg)` |
| 284 | `.file-select-btn` | `background-color: #f0f0f0` | `background-color: var(--color-bg-tertiary)` |
| 285 | `.file-select-btn` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 285 | `.file-select-btn` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 287 | `.file-select-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 289 | `.file-select-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 297 | `.file-name-text` | `color: #666` | `color: var(--color-text-secondary)` |
| 297 | `.file-name-text` | `font-size: 14px` | `font-size: var(--font-size-base)` |

**Step 2: 브라우저에서 회원가입, 게시글 작성, 프로필 수정 폼 확인**

**Step 3: 커밋**

```bash
git add css/modules/forms.css
git commit -m "refactor: migrate forms.css to CSS custom properties"
```

---

## Task 6: `modules/cards.css` 마이그레이션

**Files:**
- Modify: `css/modules/cards.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 13 | `#post-list` | `gap: 20px` | `gap: var(--spacing-xl)` |
| 20 | `.post-card` | `background: #fff` | `background: var(--color-bg-primary)` |
| 21 | `.post-card` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 22 | `.post-card` | `padding: 24px` | `padding: var(--spacing-2xl)` |
| 23 | `.post-card` | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)` | `box-shadow: var(--shadow-sm)` |
| 25 | `.post-card` | `transition: transform 0.2s, box-shadow 0.2s` | `transition: transform var(--transition-fast), box-shadow var(--transition-fast)` |
| 26 | `.post-card` | `border: 1px solid #eee` | `border: 1px solid var(--color-border-light)` |
| 33 | `.post-card:hover` | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)` | `box-shadow: var(--shadow-md)` |
| 44 | `.post-title` | `font-size: 20px` | `font-size: var(--font-size-lg)` |
| 45 | `.post-title` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 51 | `.post-title` | `margin-right: 20px` | `margin-right: var(--spacing-xl)` |
| 54 | `.post-date` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 55 | `.post-date` | `color: #888` | `color: var(--color-text-tertiary)` |
| 64 | `.post-stats` | `gap: 16px` | `gap: var(--spacing-lg)` |
| 65 | `.post-stats` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 65 | `.post-stats` | `color: #666` | `color: var(--color-text-secondary)` |
| 72 | `.post-card .post-divider` | `background-color: #000` | `background-color: #000` (유지 — 유일하게 #000 사용) |
| 81 | `.post-author` | `padding-top: 4px` | `padding-top: var(--spacing-xs)` |
| 87 | `.author-profile-img` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 88 | `.author-profile-img` | `background-color: #ddd` | `background-color: var(--color-border)` |
| 90 | `.author-profile-img` | `margin-right: 12px` | `margin-right: var(--spacing-md)` |
| 91 | `.author-profile-img` | `border: 1px solid #eee` | `border: 1px solid var(--color-border-light)` |
| 95 | `.author-nickname` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 96 | `.author-nickname` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 97 | `.author-nickname` | `color: #333` | `color: var(--color-text-primary)` |
| 105 | `.post-badges` | `gap: 6px` | `gap: 6px` (유지 — 6px은 스케일 밖) |
| 106 | `.post-badges` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 112 | `.pin-badge` | `padding: 2px 8px` | `padding: var(--spacing-2xs) var(--spacing-sm)` |
| 113 | `.pin-badge` | `background: #FF6D00` | `background: var(--color-warning)` |
| 114 | `.pin-badge` | `color: white` | `color: var(--color-text-white)` |
| 115 | `.pin-badge` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 116 | `.pin-badge` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 117 | `.pin-badge` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 121 | `.category-badge` | `padding: 2px 8px` | `padding: var(--spacing-2xs) var(--spacing-sm)` |
| 122 | `.category-badge` | `background: #EDE7F6` | `background: var(--color-badge-category-bg)` |
| 123 | `.category-badge` | `color: #5E35B1` | `color: var(--color-badge-category-text)` |
| 124 | `.category-badge` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 125 | `.category-badge` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 126 | `.category-badge` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 131 | `.post-card.pinned` | `border-left: 3px solid #FF6D00` | `border-left: 3px solid var(--color-warning)` |
| 141 | `#loading-sentinel` | `color: #888` | `color: var(--color-text-tertiary)` |
| 142 | `#loading-sentinel` | `font-size: 14px` | `font-size: var(--font-size-base)` |

**Step 2: 브라우저에서 게시글 목록 카드, 배지, 고정 게시글 확인**

**Step 3: 커밋**

```bash
git add css/modules/cards.css
git commit -m "refactor: migrate cards.css to CSS custom properties"
```

---

## Task 7: `modules/modals.css` 마이그레이션

**Files:**
- Modify: `css/modules/modals.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 13 | `.modal` | `background-color: rgba(0, 0, 0, 0.5)` | `background-color: var(--color-overlay)` |
| 17 | `.modal` | `z-index: 2000` | `z-index: var(--z-modal)` |
| 28 | `.modal-content` | `background: #fff` | `background: var(--color-bg-primary)` |
| 29 | `.modal-content` | `padding: 30px` | `padding: 30px` (유지 — 30px은 스케일 밖) |
| 30 | `.modal-content` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 34 | `.modal-content` | `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2)` | `box-shadow: var(--shadow-lg)` |
| 39 | `.modal-content h3` | `font-size: 20px` | `font-size: var(--font-size-lg)` |
| 40 | `.modal-content h3` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 45 | `.modal-content p, .modal-desc` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 46 | `.modal-content p, .modal-desc` | `color: #666` | `color: var(--color-text-secondary)` |
| 47 | `.modal-content p, .modal-desc` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 62 | `.modal-buttons button` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 64 | `.modal-buttons button` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 66 | `.modal-buttons button` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 71 | `.modal-buttons .secondary-btn` | `background-color: #333` | `background-color: var(--color-text-primary)` |
| 72 | `.modal-buttons .secondary-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 81 | `.modal-buttons .primary-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 82 | `.modal-buttons .primary-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 86 | `.modal-buttons .primary-btn:hover` | `background-color: #7F6AEE` | `background-color: var(--color-primary-hover)` |
| 96 | `.modal-input` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 97 | `.modal-input` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |

**`.toast` 관련 코드 (103-123행)는 Task 11에서 삭제 예정 — 이 태스크에서는 건드리지 않음.**

**Step 2: 브라우저에서 모달 (삭제 확인, 신고) 열어서 확인**

**Step 3: 커밋**

```bash
git add css/modules/modals.css
git commit -m "refactor: migrate modals.css to CSS custom properties"
```

---

## Task 8: `modules/comments.css` 마이그레이션

**Files:**
- Modify: `css/modules/comments.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 8 | `.comment-section` | `margin-top: 40px` | `margin-top: var(--spacing-4xl)` |
| 25 | `#comment-input` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 26 | `#comment-input` | `padding: 12px` | `padding: var(--spacing-md)` |
| 34 | `.comment-submit-btn` | `padding: 10px 20px` | `padding: 10px var(--spacing-xl)` |
| 35 | `.comment-submit-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 36 | `.comment-submit-btn` | `color: white` | `color: var(--color-text-white)` |
| 38 | `.comment-submit-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 40 | `.comment-submit-btn` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 41 | `.comment-submit-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 53 | `.comment-list` | `gap: 20px` | `gap: var(--spacing-xl)` |
| 61 | `.comment-item` | `gap: 12px` | `gap: var(--spacing-md)` |
| 62 | `.comment-item` | `padding-bottom: 20px` | `padding-bottom: var(--spacing-xl)` |
| 63 | `.comment-item` | `border-bottom: 1px solid #eee` | `border-bottom: 1px solid var(--color-border-light)` |
| 73 | `.comment-author-img` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 74 | `.comment-author-img` | `background-color: #ddd` | `background-color: var(--color-border)` |
| 89 | `.comment-header` | `margin-bottom: 6px` | `margin-bottom: 6px` (유지) |
| 93 | `.comment-author-name` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 94 | `.comment-author-name` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 98 | `.comment-date` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 99 | `.comment-date` | `color: #888` | `color: var(--color-text-tertiary)` |
| 113 | `.comment-text` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 115 | `.comment-text` | `color: #333` | `color: var(--color-text-primary)` |
| 122 | `.comment-reply` | `margin-left: 40px` | `margin-left: var(--spacing-4xl)` |
| 124 | `.comment-reply` | `padding-left: 16px` | `padding-left: var(--spacing-lg)` |
| 131 | `.comment-deleted` | `padding: 12px 0` | `padding: var(--spacing-md) 0` |
| 135 | `.comment-deleted-text` | `color: #999` | `color: var(--color-text-placeholder)` |
| 136 | `.comment-deleted-text` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 148 | `.reply-indicator` | `padding: 8px 12px` | `padding: var(--spacing-sm) var(--spacing-md)` |
| 149 | `.reply-indicator` | `background: #f3e5f5` | `background: var(--color-reply-indicator-bg)` |
| 150 | `.reply-indicator` | `border-radius: 8px 8px 0 0` | `border-radius: var(--radius-md) var(--radius-md) 0 0` |
| 152 | `.reply-indicator` | `color: #7C4DFF` | `color: var(--color-primary-accent)` |
| 162 | `.reply-cancel-btn` | `color: #999` | `color: var(--color-text-placeholder)` |
| 168 | `.reply-cancel-btn:hover` | `color: #666` | `color: var(--color-text-secondary)` |
| 175 | `.reply-btn` | `color: #7C4DFF` | `color: var(--color-primary-accent)` |

**Step 2: 브라우저에서 게시글 상세 → 댓글 영역 확인 (댓글, 대댓글, 답글 인디케이터)**

**Step 3: 커밋**

```bash
git add css/modules/comments.css
git commit -m "refactor: migrate comments.css to CSS custom properties"
```

---

## Task 9: `modules/animations.css` 마이그레이션

**Files:**
- Modify: `css/modules/animations.css`

**Step 1: 하드코딩 값을 `var()` 참조로 치환**

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 28 | `.skeleton` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 51 | `.error-boundary` | `color: #666` | `color: var(--color-text-secondary)` |
| 57 | `.error-icon` | `margin-bottom: 16px` | `margin-bottom: var(--spacing-lg)` |
| 60 | `.error-message` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 61 | `.error-message` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 78 | `.loading-boundary` | `gap: 16px` | `gap: var(--spacing-lg)` |
| 82 | `.loading-message` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 83 | `.loading-message` | `color: #888` | `color: var(--color-text-tertiary)` |
| 89 | `.skeleton-text` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 103 | `.skeleton-title` | `margin-bottom: 12px` | `margin-bottom: var(--spacing-md)` |
| 109 | `.skeleton-avatar` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 114 | `.skeleton-card` | `background: #fff` | `background: var(--color-bg-primary)` |
| 115 | `.skeleton-card` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 116 | `.skeleton-card` | `margin-bottom: 16px` | `margin-bottom: var(--spacing-lg)` |
| 124 | `.skeleton-post` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 125 | `.skeleton-post` | `background: #fff` | `background: var(--color-bg-primary)` |
| 126 | `.skeleton-post` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 127 | `.skeleton-post` | `margin-bottom: 12px` | `margin-bottom: var(--spacing-md)` |
| 133 | `.skeleton-post-header` | `gap: 12px` | `gap: var(--spacing-md)` |
| 138 | `.skeleton-post-meta` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 155 | `button` | `transition: all 0.2s ease-in-out` | `transition: all var(--transition-fast)` |
| 163 | `button:hover` | `box-shadow: 0 4px 12px rgba(127, 106, 238, 0.3)` | `box-shadow: var(--shadow-primary)` |
| 171 | `button:active` | `box-shadow: 0 2px 4px rgba(127, 106, 238, 0.2)` | `box-shadow: var(--shadow-primary-active)` |
| 187 | `.post-item, .comment-list-item` | `transition: background-color 0.2s ease, transform 0.2s ease` | `transition: background-color var(--transition-fast), transform var(--transition-fast)` |
| 198 | `.modal-overlay` | `transition: opacity 0.2s ease` | `transition: opacity var(--transition-fast)` |
| 207 | `.modal-content` | `transition: transform 0.2s ease, opacity 0.2s ease` | `transition: transform var(--transition-fast), opacity var(--transition-fast)` |
| 238 | `.like-button` | `transition: transform 0.15s ease` | `transition: transform 0.15s ease` (유지 — 0.15s는 별도 값) |
| 269 | `input, textarea, select` | `transition: border-color 0.2s ease, box-shadow 0.2s ease` | `transition: border-color var(--transition-fast), box-shadow var(--transition-fast)` |
| 276 | `input:focus` | `border-color: #7F6AEE` | `border-color: var(--color-primary-hover)` |
| 277 | `input:focus` | `box-shadow: 0 0 0 3px rgba(127, 106, 238, 0.1)` | `box-shadow: 0 0 0 3px rgba(127, 106, 238, 0.1)` (유지 — focus ring 전용) |
| 287 | `.spinner` | `border-top-color: #7F6AEE` | `border-top-color: var(--color-primary-hover)` |
| 288 | `.spinner` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 326 | `.btn-loading::after` | `border-radius: 50%` | `border-radius: var(--radius-full)` |

**Step 2: 브라우저에서 로딩 스켈레톤, 스피너, 에러 화면 확인**

**Step 3: 커밋**

```bash
git add css/modules/animations.css
git commit -m "refactor: migrate animations.css to CSS custom properties"
```

---

## Task 10: `modules/notifications.css`, `search.css`, `activity.css`, `user-profile.css` 마이그레이션

**Files:**
- Modify: `css/modules/notifications.css`
- Modify: `css/modules/search.css`
- Modify: `css/modules/activity.css`
- Modify: `css/modules/user-profile.css`

### Step 1: `notifications.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 8 | `.notification-header` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 12 | `.notification-header h1` | `font-size: 24px` | `font-size: var(--font-size-xl)` |
| 13 | `.notification-header h1` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 17 | `.mark-all-read-btn` | `padding: 8px 16px` | `padding: var(--spacing-sm) var(--spacing-lg)` |
| 18 | `.mark-all-read-btn` | `border: 1px solid #ddd` | `border: 1px solid var(--color-border)` |
| 19 | `.mark-all-read-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 20 | `.mark-all-read-btn` | `background: #fff` | `background: var(--color-bg-primary)` |
| 22 | `.mark-all-read-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 23 | `.mark-all-read-btn` | `color: #666` | `color: var(--color-text-secondary)` |
| 24 | `.mark-all-read-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 28 | `.mark-all-read-btn:hover` | `background: #f5f5f5` | `background: var(--color-bg-tertiary)` |
| 41 | `.notification-item` | `padding: 16px` | `padding: var(--spacing-lg)` |
| 42 | `.notification-item` | `border-bottom: 1px solid #eee` | `border-bottom: 1px solid var(--color-border-light)` |
| 44 | `.notification-item` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 48 | `.notification-item:hover` | `background: #f9f9f9` | `background: var(--color-bg-input)` |
| 52 | `.notification-item.unread` | `background: #f0f7ff` | `background: var(--color-notification-unread)` |
| 56 | `.notification-item.unread:hover` | `background: #e3f0ff` | `background: var(--color-notification-unread-hover)` |
| 67 | `.notification-message` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 68 | `.notification-message` | `color: #333` | `color: var(--color-text-primary)` |
| 72 | `.notification-post-title` | `color: #7C4DFF` | `color: var(--color-primary-accent)` |
| 73 | `.notification-post-title` | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |
| 77 | `.notification-time` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 77 | `.notification-time` | `color: #999` | `color: var(--color-text-placeholder)` |
| 82 | `.notification-delete-btn` | `margin-left: 12px` | `margin-left: var(--spacing-md)` |
| 83 | `.notification-delete-btn` | `padding: 4px 12px` | `padding: var(--spacing-xs) var(--spacing-md)` |
| 84 | `.notification-delete-btn` | `border: 1px solid #ddd` | `border: 1px solid var(--color-border)` |
| 85 | `.notification-delete-btn` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 86 | `.notification-delete-btn` | `background: #fff` | `background: var(--color-bg-primary)` |
| 87 | `.notification-delete-btn` | `color: #999` | `color: var(--color-text-placeholder)` |
| 88 | `.notification-delete-btn` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 91 | `.notification-delete-btn` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 95 | `.notification-delete-btn:hover` | `background: #ff4444` | `background: var(--color-notification-badge)` |
| 96 | `.notification-delete-btn:hover` | `color: #fff` | `color: var(--color-text-white)` |
| 97 | `.notification-delete-btn:hover` | `border-color: #ff4444` | `border-color: var(--color-notification-badge)` |
| 103 | `.notification-empty` | `color: #999` | `color: var(--color-text-placeholder)` |
| 104 | `.notification-empty` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 119 | `.notification-bell` | `font-size: 20px` | `font-size: var(--font-size-lg)` |
| 125 | `.notification-badge` | `background: #ff4444` | `background: var(--color-notification-badge)` |
| 126 | `.notification-badge` | `color: #fff` | `color: var(--color-text-white)` |
| 127 | `.notification-badge` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 128 | `.notification-badge` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |

### Step 2: `search.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 4 | `.category-tabs` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 17 | `.category-tab` | `background: #f5f5f5` | `background: var(--color-bg-tertiary)` |
| 19 | `.category-tab` | `border-radius: 20px` | `border-radius: var(--radius-pill)` |
| 22 | `.category-tab` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 23 | `.category-tab` | `color: #666` | `color: var(--color-text-secondary)` |
| 29 | `.category-tab:hover` | `background: #ede7f6` | `background: var(--color-badge-category-bg)` |
| 30 | `.category-tab:hover` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 34 | `.category-tab.active` | `background: #7C4DFF` | `background: var(--color-primary-accent)` |
| 35 | `.category-tab.active` | `color: white` | `color: var(--color-text-white)` |
| 36 | `.category-tab.active` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 44 | `.search-bar` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 46 | `.search-bar` | `margin-bottom: 12px` | `margin-bottom: var(--spacing-md)` |
| 53 | `.search-bar input` | `border: 1px solid #ddd` | `border: 1px solid var(--color-border)` |
| 55 | `.search-bar input` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 57 | `.search-bar input` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 57 | `.search-bar input` | `transition: border-color 0.2s` | `transition: border-color var(--transition-fast)` |
| 61 | `.search-bar input:focus` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 65 | `.search-btn` | `background: #7C4DFF` | `background: var(--color-primary-accent)` |
| 66 | `.search-btn` | `color: white` | `color: var(--color-text-white)` |
| 68 | `.search-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 69 | `.search-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 80 | `.sort-buttons` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 87 | `.sort-btn` | `background: #f5f5f5` | `background: var(--color-bg-tertiary)` |
| 89 | `.sort-btn` | `border-radius: 20px` | `border-radius: var(--radius-pill)` |
| 92 | `.sort-btn` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 93 | `.sort-btn` | `color: #666` | `color: var(--color-text-secondary)` |
| 97 | `.sort-btn:hover` | `background: #ede7f6` | `background: var(--color-badge-category-bg)` |
| 98 | `.sort-btn:hover` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 102 | `.sort-btn.active` | `background: #7C4DFF` | `background: var(--color-primary-accent)` |
| 103 | `.sort-btn.active` | `color: white` | `color: var(--color-text-white)` |
| 104 | `.sort-btn.active` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |

### Step 3: `activity.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 9 | `.activity-tabs` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 10 | `.activity-tabs` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 16 | `.tab-btn` | `background: #f5f5f5` | `background: var(--color-bg-tertiary)` |
| 18 | `.tab-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 20 | `.tab-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 21 | `.tab-btn` | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |
| 22 | `.tab-btn` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 23 | `.tab-btn` | `color: #666` | `color: var(--color-text-secondary)` |
| 27 | `.tab-btn:hover` | `background: #ede7f6` | `background: var(--color-badge-category-bg)` |
| 28 | `.tab-btn:hover` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 32 | `.tab-btn.active` | `background: #7C4DFF` | `background: var(--color-primary-accent)` |
| 33 | `.tab-btn.active` | `color: #fff` | `color: var(--color-text-white)` |
| 34 | `.tab-btn.active` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 43 | `.activity-list` | `gap: 16px` | `gap: var(--spacing-lg)` |
| 55 | `.activity-empty` | `color: #999` | `color: var(--color-text-placeholder)` |
| 57 | `.activity-empty` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 68 | `.comment-card` | `background: #fff` | `background: var(--color-bg-primary)` |
| 69 | `.comment-card` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 70 | `.comment-card` | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)` | `box-shadow: var(--shadow-sm)` |
| 71 | `.comment-card` | `border: 1px solid #eee` | `border: 1px solid var(--color-border-light)` |
| 72 | `.comment-card` | `transition: transform 0.2s, box-shadow 0.2s` | `transition: transform var(--transition-fast), box-shadow var(--transition-fast)` |
| 77 | `.comment-card:hover` | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)` | `box-shadow: var(--shadow-md)` |
| 82 | `.comment-card-content` | `margin-bottom: 12px` | `margin-bottom: var(--spacing-md)` |
| 88 | `.comment-text` | `color: #333` | `color: var(--color-text-primary)` |
| 97 | `.comment-card-meta` | `color: #888` | `color: var(--color-text-tertiary)` |
| 110 | `.comment-post-title` | `color: #7C4DFF` | `color: var(--color-primary-accent)` |
| 111 | `.comment-post-title` | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |
| 124 | `.comment-post-title.deleted` | `color: #999` | `color: var(--color-text-placeholder)` |

### Step 4: `user-profile.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 12 | `.user-profile-header` | `gap: 16px` | `gap: var(--spacing-lg)` |
| 18 | `.profile-img-wrapper` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 28 | `.profile-img-large` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 32 | `#profile-nickname` | `font-size: 24px` | `font-size: var(--font-size-xl)` |
| 33 | `#profile-nickname` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 34 | `#profile-nickname` | `color: #333` | `color: var(--color-text-primary)` |
| 48 | `.user-profile-posts h2` | `font-size: 18px` | `font-size: 18px` (유지 — 스케일 밖) |
| 49 | `.user-profile-posts h2` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 49 | `.user-profile-posts h2` | `color: #333` | `color: var(--color-text-primary)` |
| 51 | `.user-profile-posts h2` | `margin: 0 0 16px` | `margin: 0 0 var(--spacing-lg)` |
| 52 | `.user-profile-posts h2` | `padding-bottom: 12px` | `padding-bottom: var(--spacing-md)` |
| 53 | `.user-profile-posts h2` | `border-bottom: 1px solid #eee` | `border-bottom: 1px solid var(--color-border-light)` |
| 71 | `.clickable-nickname` | `color: #7C4DFF` | `color: var(--color-primary-accent)` |
| 83 | `.block-btn` | `background-color: #888` | `background-color: var(--color-text-tertiary)` |
| 84 | `.block-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 85 | `.block-btn` | `padding: 8px 20px` | `padding: var(--spacing-sm) var(--spacing-xl)` |
| 87 | `.block-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 89 | `.block-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 90 | `.block-btn` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 91 | `.block-btn` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 94 | `.block-btn:hover` | `background-color: #666` | `background-color: var(--color-text-secondary)` |

### Step 5: 브라우저에서 알림, 검색, 내 활동, 사용자 프로필 확인

### Step 6: 커밋

```bash
git add css/modules/notifications.css css/modules/search.css css/modules/activity.css css/modules/user-profile.css
git commit -m "refactor: migrate notifications, search, activity, user-profile CSS to custom properties"
```

---

## Task 11: 페이지 CSS 마이그레이션 — `pages/login.css`, `pages/signup.css`, `pages/find_account.css`

**Files:**
- Modify: `css/pages/login.css`
- Modify: `css/pages/signup.css`
- Modify: `css/pages/find_account.css`

### Step 1: `login.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 8 | `.login-container` | `padding: 20px` | `padding: var(--spacing-xl)` |
| 9 | `.login-container` | `border-radius: 16px` | `border-radius: var(--radius-xl)` |
| 16 | `.login-container h2` | `margin-bottom: 24px` | `margin-bottom: var(--spacing-2xl)` |
| 24 | `.links` | `margin-top: 20px` | `margin-top: var(--spacing-xl)` |
| 27 | `.links a` | `color: #666` | `color: var(--color-text-secondary)` |
| 30 | `.links a` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 34 | `.links a:hover` | `color: #ACA0EB` | `color: var(--color-primary)` |

### Step 2: `signup.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 9 | `.signup-container` | `padding: 20px` | `padding: var(--spacing-xl)` |
| 13 | `.signup-container` | `border-radius: 16px` | `border-radius: var(--radius-xl)` |
| 17 | `.signup-title` | `font-size: 24px` | `font-size: var(--font-size-xl)` |
| 18 | `.signup-title` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 20 | `.signup-title` | `margin-bottom: 30px` | `margin-bottom: 30px` (유지) |
| 30 | `.profile-section` | `margin-bottom: 24px` | `margin-bottom: var(--spacing-2xl)` |
| 38 | `.profile-label` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 39 | `.profile-label` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 45 | `.helper-text` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 47 | `.helper-text` | `color: #FF3333` | `color: var(--color-error)` |
| 61 | `.signup-profile-circle` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 89 | `.input-group` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 92 | `.input-label` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 93 | `.input-label` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 95 | `.input-label` | `margin-bottom: 8px` | `margin-bottom: var(--spacing-sm)` |
| 101 | `.input-field` | `padding: 12px` | `padding: var(--spacing-md)` |
| 102 | `.input-field` | `border: 1px solid #ccc` | `border: 1px solid var(--color-border-dark)` |
| 104 | `.input-field` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 106 | `.input-field` | `background-color: #f5f5f5` | `background-color: var(--color-bg-tertiary)` |
| 110 | `.input-field::placeholder` | `color: #999` | `color: var(--color-text-placeholder)` |
| 114 | `.error-msg` | `color: #FF3333` | `color: var(--color-error)` |
| 115 | `.error-msg` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 116 | `.error-msg` | `margin-top: 4px` | `margin-top: var(--spacing-xs)` |
| 125 | `.signup-btn` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 126 | `.signup-btn` | `color: white` | `color: var(--color-text-white)` |
| 128 | `.signup-btn` | `font-size: 16px` | `font-size: var(--font-size-md)` |
| 129 | `.signup-btn` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 148 | `.login-link` | `color: #333` | `color: var(--color-text-primary)` |
| 148 | `.login-link` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 150 | `.login-link` | `font-weight: 400` | `font-weight: var(--font-weight-normal)` |

### Step 3: `find_account.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 10 | `.tab-nav` | `margin-bottom: 24px` | `margin-bottom: var(--spacing-2xl)` |
| 16 | `.tab-btn` | `padding: 12px 0` | `padding: var(--spacing-md) 0` |
| 19 | `.tab-btn` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 20 | `.tab-btn` | `color: #999` | `color: var(--color-text-placeholder)` |
| 20 | `.tab-btn` | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |
| 25 | `.tab-btn` | `transition: color 0.2s, border-color 0.2s` | `transition: color var(--transition-fast), border-color var(--transition-fast)` |
| 29 | `.tab-btn:hover` | `color: #666` | `color: var(--color-text-secondary)` |
| 33 | `.tab-btn.active` | `color: #7F6AEE` | `color: var(--color-primary-hover)` |
| 34 | `.tab-btn.active` | `border-bottom-color: #7F6AEE` | `border-bottom-color: var(--color-primary-hover)` |
| 35 | `.tab-btn.active` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 42 | `.result-box` | `margin-top: 16px` | `margin-top: var(--spacing-lg)` |
| 43 | `.result-box` | `padding: 16px` | `padding: var(--spacing-lg)` |
| 45 | `.result-box` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 52 | `.result-box p` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 52 | `.result-box p` | `color: #333` | `color: var(--color-text-primary)` |
| 57 | `.result-box strong` | `color: #7F6AEE` | `color: var(--color-primary-hover)` |
| 65 | `.login-container .links` | `margin-top: 24px` | `margin-top: var(--spacing-2xl)` |

### Step 4: 브라우저에서 로그인, 회원가입, 계정 찾기 페이지 확인

### Step 5: 커밋

```bash
git add css/pages/login.css css/pages/signup.css css/pages/find_account.css
git commit -m "refactor: migrate login, signup, find_account CSS to custom properties"
```

---

## Task 12: 페이지 CSS 마이그레이션 — `pages/detail.css`, `pages/profile.css`, `pages/admin.css`

**Files:**
- Modify: `css/pages/detail.css`
- Modify: `css/pages/profile.css`
- Modify: `css/pages/admin.css`

### Step 1: `detail.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 12 | `.detail-title` | `font-size: 28px` | `font-size: var(--font-size-2xl)` |
| 13 | `.detail-title` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 55 | `.post-image` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 57 | `.post-image` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 65 | `.post-stats-box` | `gap: 12px` | `gap: var(--spacing-md)` |
| 74 | `.stat-box` | `padding: 12px 24px` | `padding: var(--spacing-md) var(--spacing-2xl)` |
| 75 | `.stat-box` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 89 | `#like-box` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 98 | `#like-box.active` | `background-color: #ACA0EB` | `background-color: var(--color-primary)` |
| 100 | `#like-box.active` | `color: #fff` | `color: var(--color-text-white)` |
| 104 | `.stat-value` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 105 | `.stat-value` | `font-size: 20px` | `font-size: var(--font-size-lg)` |
| 109 | `.stat-label` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 113 | `.stat-label` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 120 | `#bookmark-box` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 128 | `#bookmark-box.active` | `background-color: #F5A623` | `background-color: var(--color-bookmark)` |
| 130 | `#bookmark-box.active` | `color: #fff` | `color: var(--color-text-white)` |
| 138 | `.post-extra-actions` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 145 | `.share-btn` | `background-color: #4A90D9` | `background-color: var(--color-info)` |
| 146 | `.share-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 149 | `.share-btn:hover` | `background-color: #357ABD` | `background-color: var(--color-info-hover)` |
| 153 | `.block-btn` | `background-color: #888` | `background-color: var(--color-text-tertiary)` |
| 154 | `.block-btn` | `color: #fff` | `color: var(--color-text-white)` |
| 157 | `.block-btn:hover` | `background-color: #666` | `background-color: var(--color-text-secondary)` |
| 167 | `.image-gallery` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 168 | `.image-gallery` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 172 | `.image-gallery img` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 175 | `.image-gallery img` | `transition: opacity 0.2s` | `transition: opacity var(--transition-fast)` |
| 200 | `.comment-like-btn` | `font-size: 13px` | `font-size: 13px` (유지 — 13px은 스케일 밖) |
| 203 | `.comment-like-btn` | `color: #888` | `color: var(--color-text-tertiary)` |
| 205 | `.comment-like-btn` | `border-radius: 4px` | `border-radius: var(--radius-sm)` |
| 206 | `.comment-like-btn` | `transition: color 0.2s` | `transition: color var(--transition-fast)` |

### Step 2: `profile.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 29 | `.profile-img-wrapper` | `border-radius: 50%` | `border-radius: var(--radius-full)` |
| 33 | `.profile-img-wrapper` | `background-color: #ddd` | `background-color: var(--color-border)` |
| 43 | `.profile-img-overlay` | `border-radius: 999px` | `border-radius: 999px` (유지 — 특수 pill 값) |
| 55 | `.profile-img-overlay` | `transition: background-color 0.2s` | `transition: background-color var(--transition-fast)` |
| 61 | `.change-btn-text` | `color: #fff` | `color: var(--color-text-white)` |
| 63 | `.change-btn-text` | `font-weight: 500` | `font-weight: var(--font-weight-medium)` |

### Step 3: `admin.css` 치환

| 라인 | 선택자 | 기존 값 | 변경 후 |
|------|--------|---------|---------|
| 11 | `.admin-page-title` | `font-size: 22px` | `font-size: 22px` (유지 — 스케일 밖) |
| 12 | `.admin-page-title` | `font-weight: 700` | `font-weight: var(--font-weight-bold)` |
| 9 | `.admin-page-title` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 18 | `.report-filter-tabs` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 19 | `.report-filter-tabs` | `margin-bottom: 20px` | `margin-bottom: var(--spacing-xl)` |
| 26 | `.report-filter-tab` | `background: #f5f5f5` | `background: var(--color-bg-tertiary)` |
| 28 | `.report-filter-tab` | `border-radius: 20px` | `border-radius: var(--radius-pill)` |
| 31 | `.report-filter-tab` | `transition: all 0.2s` | `transition: all var(--transition-fast)` |
| 32 | `.report-filter-tab` | `color: #666` | `color: var(--color-text-secondary)` |
| 36 | `.report-filter-tab:hover` | `background: #ede7f6` | `background: var(--color-badge-category-bg)` |
| 37 | `.report-filter-tab:hover` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 41 | `.report-filter-tab.active` | `background: #7C4DFF` | `background: var(--color-primary-accent)` |
| 42 | `.report-filter-tab.active` | `color: white` | `color: var(--color-text-white)` |
| 43 | `.report-filter-tab.active` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |
| 51 | `.report-list` | `gap: 16px` | `gap: var(--spacing-lg)` |
| 60 | `.report-card` | `background: #fff` | `background: var(--color-bg-primary)` |
| 61 | `.report-card` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 62 | `.report-card` | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05)` | `box-shadow: var(--shadow-sm)` |
| 63 | `.report-card` | `border: 1px solid #eee` | `border: 1px solid var(--color-border-light)` |
| 83 | `.report-target-type` | `color: #333` | `color: var(--color-text-primary)` |
| 82 | `.report-target-type` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 88 | `.report-date` | `font-size: 12px` | `font-size: var(--font-size-sm)` |
| 88 | `.report-date` | `color: #888` | `color: var(--color-text-tertiary)` |
| 97 | `.report-status-badge` | `border-radius: 12px` | `border-radius: var(--radius-lg)` |
| 98 | `.report-status-badge` | `font-size: 11px` | `font-size: var(--font-size-xs)` |
| 99 | `.report-status-badge` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 103 | `.status-pending` | `background: #FFF3E0` | `background: var(--color-badge-pending-bg)` |
| 104 | `.status-pending` | `color: #E65100` | `color: var(--color-badge-pending-text)` |
| 108 | `.status-resolved` | `background: #E8F5E9` | `background: var(--color-badge-resolved-bg)` |
| 109 | `.status-resolved` | `color: #2E7D32` | `color: var(--color-badge-resolved-text)` |
| 113 | `.status-dismissed` | `background: #ECEFF1` | `background: var(--color-badge-dismissed-bg)` |
| 114 | `.status-dismissed` | `color: #546E7A` | `color: var(--color-badge-dismissed-text)` |
| 134 | `.report-label` | `color: #888` | `color: var(--color-text-tertiary)` |
| 148 | `.report-card-actions` | `border-top: 1px solid #eee` | `border-top: 1px solid var(--color-border-light)` |
| 144 | `.report-card-actions` | `gap: 8px` | `gap: var(--spacing-sm)` |
| 153 | `.report-action-btn` | `padding: 8px 16px` | `padding: var(--spacing-sm) var(--spacing-lg)` |
| 155 | `.report-action-btn` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 156 | `.report-action-btn` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 159 | `.report-action-btn` | `transition: background 0.2s` | `transition: background var(--transition-fast)` |
| 163 | `.resolve-btn` | `color: white` | `color: var(--color-text-white)` |
| 172 | `.dismiss-btn` | `color: #333` | `color: var(--color-text-primary)` |
| 192 | `.report-form label` | `font-weight: 600` | `font-weight: var(--font-weight-semibold)` |
| 193 | `.report-form label` | `color: #333` | `color: var(--color-text-primary)` |
| 199 | `.report-form textarea` | `border: 1px solid #ddd` | `border: 1px solid var(--color-border)` |
| 200 | `.report-form textarea` | `font-size: 14px` | `font-size: var(--font-size-base)` |
| 201 | `.report-form textarea` | `border-radius: 8px` | `border-radius: var(--radius-md)` |
| 207 | `.report-form textarea:focus` | `border-color: #7C4DFF` | `border-color: var(--color-primary-accent)` |

### Step 4: 브라우저에서 게시글 상세, 프로필 수정, 관리자 신고 관리 확인

### Step 5: 커밋

```bash
git add css/pages/detail.css css/pages/profile.css css/pages/admin.css
git commit -m "refactor: migrate detail, profile, admin CSS to custom properties"
```

---

## Task 13: JS 헬퍼 하드코딩 색상 마이그레이션

**Files:**
- Modify: `js/views/helpers.js`

**Step 1: `showError` 함수 — 하드코딩 색상 제거**

`helpers.js:55` 변경:
```js
// 변경 전
helperEl.style.color = '#FF3333';

// 변경 후 — CSS 클래스가 이미 색상을 처리하므로 인라인 스타일 불필요
// .helper-text, .validation-helper에 이미 color: var(--color-error) 적용됨
// 하지만 showError는 임의의 요소에도 사용될 수 있으므로 CSS 변수로 치환
helperEl.style.color = 'var(--color-error)';
```

**Step 2: `updateButtonState` 함수 — 기본 인자 색상 치환**

`helpers.js:144` 변경:
```js
// 변경 전
export function updateButtonState(button, isValid, activeColor = '#7F6AEE', inactiveColor = '#ACA0EB') {

// 변경 후
export function updateButtonState(button, isValid, activeColor = 'var(--color-primary-hover)', inactiveColor = 'var(--color-primary)') {
```

**주의:** `var()` 문자열을 `style.backgroundColor`에 할당하면 브라우저가 CSS 변수로 해석한다. 이는 표준 동작이므로 정상 작동한다.

**Step 3: 브라우저에서 버튼 상태 변경 확인 (로그인 폼에서 입력 → 버튼 활성화)**

**Step 4: 커밋**

```bash
git add js/views/helpers.js
git commit -m "refactor: replace hardcoded colors in JS helpers with CSS custom properties"
```

---

## Task 14: 토스트 시스템 통합

**Files:**
- Modify: `css/modules/toast.css` (전면 재작성)
- Modify: `css/modules/modals.css:103-123` (`.toast` 코드 삭제)

### Step 1: `modals.css`에서 `.toast` 관련 코드 삭제

`modals.css`의 100-123행 삭제 (주석 블록 + `.toast` + `.toast.show`):
```css
/* ============================= */
/* 토스트 알림 (Toast Notification) */
/* ============================= */
.toast {
    ...
}

.toast.show {
    ...
}
```

### Step 2: `toast.css` 전면 재작성

기존 `#toast` 선택자를 유지하되, 디자인 토큰을 사용하고 z-index를 통합:

```css
/* css/modules/toast.css */
/* 통합 토스트 알림 */
#toast {
    visibility: hidden;
    min-width: 250px;
    position: fixed;
    left: 50%;
    bottom: 40px;
    transform: translateX(-50%);
    background-color: var(--color-text-primary);
    color: var(--color-text-white);
    text-align: center;
    border-radius: var(--radius-md);
    padding: var(--spacing-md) var(--spacing-2xl);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-md);
    z-index: var(--z-toast);
    opacity: 0;
    transition: opacity var(--transition-normal), transform var(--transition-normal), visibility var(--transition-normal);
}

#toast.show {
    visibility: visible;
    opacity: 1;
}

/* 타입별 변형 (향후 사용) */
#toast.toast--success {
    background-color: var(--color-success);
}

#toast.toast--error {
    background-color: var(--color-error-dark);
}

#toast.toast--info {
    background-color: var(--color-info);
}
```

**변경 요약:**
- 센터링: `margin-left: -125px` → `transform: translateX(-50%)` (너비 무관)
- z-index: `1000` → `var(--z-toast)` (3000)
- 배경: `#333` → `var(--color-text-primary)` (동일 색상, 변수화)
- bottom: `30px` → `40px` (설계 문서 기준)
- 애니메이션: `bottom 0.3s` 제거 (translateY 미사용 — 단순 fade로 유지)
- `margin-left: -125px` 삭제 (transform으로 대체)

### Step 3: 브라우저에서 토스트 동작 확인

아무 페이지에서 액션 수행 (로그인, 댓글 작성, 좋아요 등) → 토스트가 화면 하단 중앙에 표시되는지 확인

### Step 4: 커밋

```bash
git add css/modules/toast.css css/modules/modals.css
git commit -m "refactor: unify toast system — single #toast with design tokens, remove duplicate .toast from modals"
```

---

## Task 15: 최종 검증

**Step 1: 전체 페이지 시각적 검증 체크리스트**

브라우저에서 각 페이지를 순회하며 시각적 변화가 없는지 확인:

- [ ] 로그인 페이지 (`/login`)
- [ ] 회원가입 페이지 (`/signup`)
- [ ] 계정 찾기 페이지 (`/find-account`)
- [ ] 게시글 목록 (`/`)
- [ ] 게시글 상세 (아무 게시글)
- [ ] 게시글 작성 (`/write`)
- [ ] 게시글 수정
- [ ] 프로필 수정 (`/edit`)
- [ ] 비밀번호 변경
- [ ] 사용자 프로필 (타인)
- [ ] 알림 페이지
- [ ] 내 활동 페이지
- [ ] 관리자 신고 관리

**Step 2: DevTools로 CSS 변수 확인**

Elements → `<html>` → Computed → Filter "var" → 모든 `--color-*`, `--spacing-*` 등 변수가 정의되어 있는지 확인

**Step 3: 남은 하드코딩 값 검증**

```bash
cd 2-cho-community-fe
# 아직 남은 hex 색상 검색 (의도적 유지 항목 제외)
grep -rn '#[0-9a-fA-F]\{3,6\}' css/ --include="*.css" | grep -v 'variables.css' | grep -v '000' | grep -v 'dccaff' | grep -v '9286d8' | grep -v 'E74C3C' | grep -v 'FFCDD2' | grep -v 'FFEBEE' | grep -v 'FFE0B2' | grep -v 'D32F2F' | grep -v 'FF5252' | grep -v 'BDBDBD' | grep -v 'E0E0E0' | grep -v '651FFF' | grep -v 'E9E9E9' | grep -v 'D9D9D9' | grep -v 'CCCCCC'
```

의도적으로 유지한 값:
- `#000` — 카드 구분선 (유일 사용처)
- `#9286d8` — primary-btn hover (유사값이지만 별도 의도)
- `#dccaff` — signup disabled 버튼 (별도 상태)
- `#E74C3C` — comment like active (별도 빨간색)
- 기타 context-specific 한 값들

**Step 4: 최종 커밋 (필요시)**

```bash
git add -A
git commit -m "refactor: complete design system cleanup — all CSS files migrated to custom properties"
```
