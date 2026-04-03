# React UI Parity & Design Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React `feat/react-rebuild` 브랜치의 UI를 vanilla JS `main`과 동일하게 맞추고, 디자인 통일감을 확보한다.

**Architecture:** 기존 React 컴포넌트를 수정하여 main 브랜치의 UI 기능을 복원한다. 새 컴포넌트(HeroSection, BackButton, SkeletonCard)는 최소한으로 생성. CSS는 기존 스타일 파일에 추가.

**Tech Stack:** React 19, TypeScript, React Router v6, lucide-react, DOMPurify, marked, highlight.js

**Spec:** `docs/superpowers/specs/2026-04-03-react-ui-parity-design.md`

**Note:** MarkdownRenderer에서 DOMPurify.sanitize()로 XSS-safe한 HTML만 사용함. 이는 main 브랜치와 동일한 보안 패턴.

---

이 계획은 10개 Task로 구성됩니다. 각 Task의 상세 구현 코드는 스펙 문서와 main 브랜치 코드를 참조하여 작성되었습니다. 전체 코드는 대화에서 이미 공유된 상태이므로, 이 파일에서는 각 Task의 파일 목록과 핵심 변경 사항을 기술합니다.

실제 구현 시에는 이 대화의 전체 컨텍스트(비교 분석, 파일 읽기, 코드 블록)를 참조하세요.

---

## Task 1: 날짜 포맷 통합

**Files:**
- Modify: `src/components/NotificationItem.tsx` — formatNotificationTime 삭제, timeAgo import
- Modify: `src/components/dm/DMConversationCard.tsx` — formatCardTime 삭제, timeAgo import
- Modify: `src/components/BadgeCard.tsx` — toLocaleDateString → formatDate
- Modify: `src/pages/admin/AdminDashboardPage.tsx` — toLocaleDateString → formatDate
- Modify: `src/pages/UserProfilePage.tsx` — toLocaleDateString → formatDate

- [ ] Step 1: NotificationItem — 커스텀 포맷 제거, timeAgo 사용
- [ ] Step 2: DMConversationCard — 커스텀 포맷 제거, timeAgo 사용
- [ ] Step 3: BadgeCard, AdminDashboardPage, UserProfilePage — formatDate 사용
- [ ] Step 4: npm run build
- [ ] Step 5: git commit -m "fix: 날짜 포맷 통합"

---

## Task 2: 폼 입력 스타일 통일

**Files:**
- Modify: `src/pages/ProfilePage.tsx` — 삭제 모달 input-field/input-label
- Modify: `src/components/CommentList.tsx` — 수정 textarea input-field
- Modify: `src/pages/packages/PackageDetailPage.tsx` — 리뷰 폼 input-field/input-label
- Modify: `src/pages/LoginPage.tsx` — label input-label
- Modify: `src/pages/PasswordPage.tsx` — label input-label

- [ ] Step 1-4: 각 파일에 className 추가
- [ ] Step 5: build + commit "fix: 폼 입력 스타일 통일"

---

## Task 3: 버튼/빈 상태/제목/모달/아이콘/인라인 스타일/에러 통일

**Files:** 20+ 파일 (상세는 대화 컨텍스트 참조)

- [ ] Step 1: btn-full 추가 (FindAccountPage, SocialSignupPage, PasswordPage)
- [ ] Step 2: UserProfilePage 팔로우/차단 버튼 → btn 시스템
- [ ] Step 3: PostDetailPage action-btn → btn btn-secondary btn-sm
- [ ] Step 4: 빈 상태 터미널 스타일 (PackageDetailPage, DMSidebar, UserProfilePage)
- [ ] Step 5: 제목 태그 h2→h1, bare h1→page-title (12개 파일)
- [ ] Step 6: SuspendModal → Modal 컴포넌트 사용
- [ ] Step 7: CommentList 이모지 → lucide Heart
- [ ] Step 8: 인라인 스타일 → CSS 클래스 (WikiHistoryPage, PostListPage)
- [ ] Step 9: UserProfilePage 에러 toast → inline
- [ ] Step 10: build + commit "fix: 디자인 통일감"

---

## Task 4: MarkdownRenderer 보안 강화

**Files:**
- Modify: `src/components/MarkdownRenderer.tsx` — DOMPurify 엄격 화이트리스트 + 코드 복사 버튼
- Modify: `src/utils/markdown.ts` — breaks 옵션 + 코드 렌더러 개선
- Modify: `src/styles/modules/code.css` — 복사 버튼/언어 라벨 스타일

- [ ] Step 1: markdown.ts breaks + 코드 복사 버튼 + 언어 라벨 렌더러
- [ ] Step 2: MarkdownRenderer DOMPurify PURIFY_CONFIG + afterSanitizeAttributes 훅
- [ ] Step 3: code.css 스타일
- [ ] Step 4: build + commit "fix(security): DOMPurify 엄격 화이트리스트"

---

## Task 5: MarkdownEditor 서식 툴바 복원

**Files:**
- Modify: `src/components/MarkdownEditor.tsx` — 전체 교체 (13개 툴바, 단축키, D&D, compact)
- Modify: `src/components/CommentForm.tsx` — MarkdownEditor compact 사용
- Modify: `src/styles/modules/markdown.css` — 툴바 CSS

- [ ] Step 1: MarkdownEditor 전체 교체
- [ ] Step 2: CommentForm → MarkdownEditor compact
- [ ] Step 3: 툴바 CSS
- [ ] Step 4: build + commit "feat: MarkdownEditor 서식 툴바 복원"

---

## Task 6: 댓글 마크다운 렌더링

**Files:**
- Modify: `src/components/CommentList.tsx` — comment.content → MarkdownRenderer

- [ ] Step 1: import MarkdownRenderer, 댓글 본문 교체
- [ ] Step 2: build + commit "feat: 댓글 마크다운 렌더링"

---

## Task 7: 모바일 사이드바 토글 + 관리자 권한

**Files:**
- Modify: `src/components/Sidebar.tsx` — isOpen/onClose props + 오버레이
- Modify: `src/components/Header.tsx` — 햄버거 메뉴
- Modify: `src/styles/modules/sidebar.css` — 모바일 드로어 + display:none 제거
- Modify: `src/pages/PostDetailPage.tsx` — isAdmin 삭제 권한
- Modify: `src/components/CommentList.tsx` — 관리자 삭제

- [ ] Step 1: Sidebar open/close + 오버레이
- [ ] Step 2: Header 햄버거 메뉴
- [ ] Step 3: sidebar.css 모바일 드로어
- [ ] Step 4: 관리자 삭제 권한
- [ ] Step 5: build + commit "feat: 모바일 사이드바 + 관리자 삭제"

---

## Task 8: HeroSection + PostCard 보강 + SkeletonCard

**Files:**
- Create: `src/components/HeroSection.tsx`
- Create: `src/components/SkeletonCard.tsx`
- Create: `src/styles/modules/hero.css` + `skeleton.css`
- Modify: `src/components/PostCard.tsx` — 배포판/읽음/구독/태그링크/Q&A
- Modify: 4개 페이지에 HeroSection 추가
- Modify: `src/styles/modules/cards.css`

- [ ] Step 1: HeroSection + CSS
- [ ] Step 2: 4개 페이지에 HeroSection
- [ ] Step 3: PostCard 보강
- [ ] Step 4: PostCard CSS
- [ ] Step 5: SkeletonCard + CSS
- [ ] Step 6: build + commit "feat: HeroSection + PostCard + SkeletonCard"

---

## Task 9: BackButton + 댓글 보강 + Header 메뉴 + 검색바

**Files:**
- Create: `src/components/BackButton.tsx`
- Modify: 4개 상세 페이지에 BackButton
- Modify: `src/components/CommentList.tsx` — 아바타/배포판/수정됨/삭제모달
- Modify: `src/components/Header.tsx` — 7개 메뉴 항목
- Modify: 3개 리스트 페이지 검색바 터미널 스타일

- [ ] Step 1: BackButton 컴포넌트 + 상세 페이지 적용
- [ ] Step 2: 댓글 보강
- [ ] Step 3: Header 드롭다운 7개 메뉴
- [ ] Step 4: 검색바 터미널 스타일
- [ ] Step 5: build + commit "feat: BackButton + 댓글 보강 + Header + 검색바"

---

## Task 10: 폼 유효성 + 레이블 통일 + 세부 기능

**Files:**
- Modify: `src/pages/LoginPage.tsx` — GitHub 로그인 레이블
- Modify: `src/pages/UserProfilePage.tsx` — 팔로잉/메시지 보내기 레이블
- Modify: `src/pages/packages/PackageListPage.tsx` — 평점순
- Modify: `src/pages/PostWritePage.tsx` — 완료 + maxLength + 유효성 도움말
- Modify: `src/pages/ProfilePage.tsx` — maxLength + 이메일 + 탈퇴 문구
- Modify: `src/pages/MyActivityPage.tsx` — 차단 해제 버튼

- [ ] Step 1: 레이블 통일
- [ ] Step 2: PostWritePage 유효성
- [ ] Step 3: ProfilePage 보강
- [ ] Step 4: MyActivityPage 차단 해제
- [ ] Step 5: build + lint + commit "feat: 폼 유효성 + 레이블 + 세부 조정"

---

## 후속 작업 (이 계획 범위 밖)

- PostDetailPage: 구독 3단계(muted), Q&A 해결 배너, 이미지 갤러리, Web Share API
- SignupPage: 실시간 검증, GitHub 소셜 가입, 약관 링크
- NotificationPage: 북마크 알림 설정
- UserProfilePage: 배지 쇼케이스
- ProfilePage: 배포판 드롭다운 전환
- PostListPage: 카테고리 탭 UI, 상황별 빈 상태 분기
