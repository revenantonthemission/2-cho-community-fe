# React UI Parity & Design Consistency Spec

> `feat/react-rebuild` 브랜치의 UI를 vanilla JS `main`과 동일하게 맞추고, 디자인 통일감을 확보한다.

## 전략

- **브랜치**: `feat/react-rebuild` 단일 브랜치
- **커밋 단위**: 우선순위 그룹별 논리적 커밋 (8개)
- **원칙**: React에서 개선된 기능(댓글 정렬, WikiTOC, 팔로워 모달, 리뷰 정렬, 평판 요약 등)은 유지

---

## 커밋 0: 디자인 통일감

기존 React 코드의 일관성 문제를 먼저 정리한다. 이후 커밋에서 추가하는 코드도 이 기준을 따른다.

### 0-1. 날짜 포맷 통합

현재 5가지 포맷 혼재. 단일 유틸리티로 통합한다.

| 현재 위치 | 현재 방식 | 변경 |
|---|---|---|
| `PostCard` | `timeAgo()` | 유지 (목록은 상대 시간) |
| `PostDetailPage` | `formatDate()` | 유지 (상세는 절대 시간) |
| `NotificationItem` | 커스텀 `formatNotificationTime()` | `timeAgo()`로 교체 |
| `DMConversationCard` | 커스텀 `formatCardTime()` | `timeAgo()`로 교체 |
| `BadgeCard` | `new Date().toLocaleDateString()` | `formatDate()`로 교체 |
| `AdminDashboardPage` | `new Date().toLocaleDateString()` | `formatDate()`로 교체 |
| `UserProfilePage` | `new Date().toLocaleDateString()` | `formatDate()`로 교체 |

**규칙**: 목록/카드에서는 `timeAgo()`, 상세/관리에서는 `formatDate()`. 커스텀 포맷 함수 삭제.

### 0-2. 폼 입력 스타일 통일

`input-field` 클래스 누락 3곳 수정:
- `ProfilePage.tsx` 삭제 모달 비밀번호 입력
- `CommentList.tsx` 댓글 수정 textarea
- `PackageDetailPage.tsx` 리뷰 제목/내용 입력

`input-label` 클래스 불일치 수정:
- `LoginPage`, `PasswordPage`의 bare `<label>` → `className="input-label"` 추가

검색 입력 클래스 통일:
- `search-bar__input`, `wiki-list-page__search`, `pkg-list-page__search`, `admin-users__search` → 공통 `search-input` 클래스 추가 (기존 BEM 클래스 유지하되 공통 클래스 병기)

### 0-3. 버튼 스타일 통일

- `FindAccountPage`, `SocialSignupPage`, `PasswordPage` 제출 버튼에 `btn-full` 추가
- `UserProfilePage` 팔로우/차단 버튼 → `btn btn-primary btn-sm` / `btn btn-danger btn-sm`로 변경
- `PostDetailPage` 액션 버튼 `action-btn` → `btn btn-secondary btn-sm`로 통일
- `CommentList` 액션 버튼 `comment-action-btn` → 기존 유지 (댓글 인라인 액션은 작은 텍스트 버튼이 적절)

### 0-4. 빈 상태 터미널 스타일 통일

- `PackageDetailPage` 리뷰 빈 상태 → `empty-state` 클래스 + `<code>` 터미널 패턴 적용
- `DMSidebar` → `empty-state` 클래스 추가
- `UserProfilePage` 사용자 미발견 → `empty-state` 클래스 + 터미널 패턴 적용

### 0-5. 제목 태그 통일

- `WikiWritePage`, `WikiEditPage`, `PackageWritePage`, `PackageEditPage` → `<h2>` → `<h1 className="page-title">`
- `LoginPage` → `<h2>` → `<h1>`
- `BadgesPage`, `MyActivityPage`, `NotificationPage`, `AdminDashboardPage`, `AdminReportsPage` → bare `<h1>` → `<h1 className="page-title">`

### 0-6. SuspendModal → 공유 Modal 컴포넌트 사용

`admin-modal-overlay` / `admin-modal` 제거, `<Modal>` 컴포넌트로 교체. 포커스 트랩, Escape 닫기, 스크롤 잠금 확보.

### 0-7. 아이콘 통일

- `CommentList` 좋아요: 이모지 (`❤️`/`🤍`) → lucide `Heart` 아이콘 (PostActionBar와 동일)
- `ProfilePage` 프로필 업로드: 이니셜 표시 옆에 `Camera` 아이콘 추가 (SignupPage와 동일)

### 0-8. 인라인 스타일 제거

- `WikiHistoryPage` `style={{ marginBottom }}` → CSS 클래스로 이동
- `PostListPage` Q&A 필터 `style={{ marginBottom }}` → CSS 클래스로 이동

### 0-9. 에러 표시 패턴 정리

**규칙**: 폼 제출 에러 → inline `error-msg`. 비동기 액션(삭제, 좋아요 등) 에러 → toast. 데이터 로드 실패 → inline 에러 상태.
- `PostDetailPage` 로드 실패: 현행 inline 유지 (올바름)
- `UserProfilePage` 로드 실패: `showToast()` → inline `setError()` + 에러 UI로 변경

---

## 커밋 1: 보안

### 1-1. MarkdownRenderer DOMPurify 엄격한 화이트리스트

main의 설정을 그대로 적용:
- `ALLOWED_TAGS`: 명시적 화이트리스트 (p, br, strong, em, code, pre, a, img, ul, ol, li, h1-h6, blockquote, table, thead, tbody, tr, th, td, hr, del, input, span, div, sub, sup)
- `ALLOWED_ATTR`: href, src, alt, title, class, id, target, rel, loading, type, checked, disabled, start, width, height
- `FORBID_TAGS`: script, style, iframe, object, embed, form
- `FORBID_ATTR`: onerror, onload, onclick, onmouseover (이벤트 핸들러 전체)
- `ALLOW_DATA_ATTR: false`

### 1-2. 링크 안전성

DOMPurify afterSanitizeAttributes 훅:
- 외부 링크에 `target="_blank"` + `rel="noopener noreferrer"` 자동 추가

### 1-3. 이미지 지연 로딩

DOMPurify afterSanitizeAttributes 훅:
- `<img>` 태그에 `loading="lazy"` 자동 추가

---

## 커밋 2: MarkdownEditor 서식 툴바 복원

### 2-1. 툴바 버튼 추가

main의 13개 툴바 구성 복원:
- 볼드, 이탤릭, 취소선, 제목(H1-H3), 인용, 구분선, 인라인 코드, 코드 블록, 링크, 이미지, 순서 리스트, 비순서 리스트, 미리보기

각 버튼은 textarea의 선택 영역을 감싸는 방식으로 동작한다 (main과 동일한 `insertFormatting` 로직).

### 2-2. 키보드 단축키

- `Ctrl/Cmd + B`: 볼드
- `Ctrl/Cmd + I`: 이탤릭
- `Tab`: 2칸 들여쓰기
- `Shift + Tab`: 내어쓰기

### 2-3. 이미지 드래그&드롭 + 클립보드 붙여넣기

- textarea에 `onDrop`, `onPaste` 이벤트 핸들러 추가
- 이미지 드롭/붙여넣기 시 `![uploading...]()` 플레이스홀더 삽입
- 업로드 완료 후 실제 URL로 교체
- 업로드 실패 시 플레이스홀더 제거 + toast

### 2-4. 댓글용 컴팩트 모드

`compact` prop 추가:
- `true`: 축소 툴바 (볼드, 이탤릭, 코드, 링크, 미리보기만)
- `false` (기본): 전체 툴바

`CommentForm`에서 `<MarkdownEditor compact />` 사용.

---

## 커밋 3: 이미지 업로드 + 댓글 마크다운

### 3-1. PostForm 이미지 업로드

- 파일 입력 + 다중 이미지 선택
- 이미지 미리보기 그리드
- 개별 이미지 삭제 버튼
- 업로드 진행 상태 표시

### 3-2. 댓글 마크다운 렌더링

`CommentList.tsx`에서 `comment.content`를 `<MarkdownRenderer content={comment.content} />` 으로 교체.

### 3-3. 코드 블록 복사 버튼

`MarkdownRenderer`에서 렌더링 후 `<pre><code>` 블록에 "복사" 버튼 주입.
- 클릭 시 `navigator.clipboard.writeText()` → 버튼 텍스트 "복사됨"으로 2초간 변경

### 3-4. 멘션 하이라이팅

`MarkdownRenderer`에서 렌더링 후 `@닉네임` 패턴을 `<a class="mention" href="/user-profile/...">` 링크로 변환.

---

## 커밋 4: 모바일 사이드바 + 관리자 권한

### 4-1. 모바일 사이드바 토글

- Header에 햄버거 메뉴 아이콘 (lucide `Menu`) 추가 (모바일만 표시)
- 사이드바 열림 시 오버레이 + 슬라이드 인 애니메이션
- 닫기 버튼 (lucide `X`) + 오버레이 클릭 + Escape 키로 닫기
- 사이드바 내 링크 클릭 시 자동 닫힘

### 4-2. 관리자 타인 게시글/댓글 삭제

- `PostDetailPage`: `isOwner` 외에 `isAdmin` 조건 추가 → 삭제 버튼 표시 (수정은 작성자만)
- `CommentList`: `isAdmin` prop 추가 → 관리자 삭제 버튼 표시

---

## 커밋 5: 히어로 섹션 + PostCard 보강

### 5-1. 히어로 섹션 추가

4개 페이지에 환영 히어로 추가 (main과 동일한 스타일):
- `PostListPage`: "Camp Linux에 오신 것을 환영합니다" + 부제 + "게시글 작성" 버튼
- `WikiListPage`: "위키" + 부제 + "페이지 작성" 버튼
- `PackageListPage`: "패키지 리뷰" + 부제 + "패키지 등록" 버튼
- `BadgesPage`: "배지" + 부제 (제목 맞춤법 "뱃지" → "배지" 수정)

공통 `HeroSection` 컴포넌트로 추출: `title`, `subtitle`, `actionText`, `actionLink` props.

### 5-2. PostCard 보강

- 배포판 뱃지: 작성자 닉네임 옆 `<span className="distro-badge">`
- 읽음 상태: `post.is_read` 시 `post-card--read` 클래스 (opacity 감소)
- 구독 표시: `post.is_watching` 시 lucide `Bell` 아이콘
- 태그 링크: `<span>` → `<Link to={/tags/${tag.name}}>` 변경 + `title={tag.description}` 툴팁
- 작성자 클릭: 닉네임에 `<Link to={/user-profile/${author.id}}>` + `onClick stopPropagation`
- Q&A 뱃지: Q&A 카테고리 게시글에 "해결됨"/"미해결" 뱃지

### 5-3. 스켈레톤 로딩

`SkeletonCard` 컴포넌트 생성:
- PostCard 형태의 회색 플레이스홀더 (pulse 애니메이션)
- PostListPage 초기 로딩 시 `<LoadingSpinner>` 대신 `<SkeletonCard>` × 5 표시

---

## 커밋 6: 상세 페이지 보강

### 6-1. 뒤로가기 버튼

공통 `BackButton` 컴포넌트: lucide `ArrowLeft` + `router.back()`.
적용 페이지: PostDetailPage, WikiDetailPage, PackageDetailPage, AdminDashboardPage.

### 6-2. 댓글 보강

- 작성자 아바타: `<div className="comment-avatar">` (프로필 이미지 또는 이니셜)
- 배포판 뱃지: 작성자 닉네임 옆
- "(수정됨)" 표시: `comment.updated_at !== comment.created_at` 시 `<span className="edited-badge">` + `title={formatDate(comment.updated_at)}`
- 삭제 댓글 플레이스홀더: `comment.deleted_at` 시 "삭제된 댓글입니다" 회색 텍스트 (스레드 구조 유지)
- Q&A 채택 답변: `comment.is_accepted` 시 상단 고정 + 초록 배경
- 삭제 확인: `window.confirm()` → `<Modal>` 컴포넌트로 교체

### 6-3. Header 드롭다운 메뉴 항목 추가

현재 2개 → 7개:
1. 회원정보수정 (`/edit-profile`)
2. 비밀번호 변경 (`/password`)
3. 내 활동 (`/my-activity`)
4. 배지 (`/badges`)
5. 관리자 대시보드 (`/admin`) — 관리자만
6. 신고 관리 (`/admin/reports`) — 관리자만
7. 로그아웃

### 6-4. 검색바 터미널 스타일 통일

PostListPage, WikiListPage, PackageListPage 검색바에:
- 터미널 `$` 프롬프트 접두사 추가
- 실행 버튼 레이블: "검색" → "실행"

### 6-5. PostDetailPage 추가 수정

- 이미지 갤러리 렌더링 (게시글에 포함된 이미지 표시)
- 구독 3단계: normal → watching → muted 순환
- Q&A 해결 배너: 초록 배너 + "채택된 답변 보기" 링크
- "(수정됨)" 뱃지: 수정된 게시글에 표시
- 배포판 뱃지: 작성자 닉네임 옆
- 북마크 카운트 표시
- 삭제 확인: `window.confirm()` → `<Modal>` 컴포넌트
- Web Share API + 클립보드 폴백

---

## 커밋 7: 폼 유효성 + 세부 조정

### 7-1. 필드별 유효성 검사

- `LoginPage`: 각 필드 아래 개별 에러 텍스트
- `SignupPage`: 이메일/닉네임 디바운스 중복 확인 + 필드별 도움말
- `ProfilePage`: 닉네임 `maxlength="10"` + 유효성 도움말 + 이메일 표시
- `PostWritePage`: 제목 `maxlength="26"` + 유효성 도움말 "*제목, 내용을 모두 작성해주세요."
- `LoginPage`: 정지 계정 상세 (날짜 + 사유) 표시

### 7-2. 레이블 통일

| 현재 (React) | 변경 (main 기준) |
|---|---|
| "GitHub로 로그인" | "GitHub 로그인" |
| "언팔로우" | "팔로잉" |
| "별점순" | "평점순" |
| "뱃지" | "배지" |
| "쪽지 보내기" | "메시지 보내기" |
| "게시" (글쓰기 제출) | "완료" |

### 7-3. 추가 기능

- `SignupPage`: GitHub 소셜 가입 버튼 + "또는" 구분선
- `SignupPage`: 약관 링크 추가
- `NotificationPage`: 북마크 알림 설정 체크박스 추가
- `UserProfilePage`: 배지 쇼케이스 섹션 추가
- `MyActivityPage`: 차단 목록에서 해제 버튼 추가
- `ProfilePage`: 배포판 입력을 자유 텍스트 → 드롭다운 `<select>` 변경
- `ProfilePage`: 탈퇴 경고 문구 통일 ("작성된 게시글과 댓글은 삭제됩니다")
- `PostListPage`: 빈 상태 상황별 분기 (검색/팔로잉/추천/기본)
- `PostListPage`: Q&A 해결 필터 트리거를 Q&A 카테고리로 제한
- `PostListPage`: 카테고리 탭 UI 추가

---

## 변경하지 않는 항목 (React 개선 유지)

- 댓글 정렬 (오래된순/최신순/좋아요순) — main에 없던 기능
- WikiTOC — main에 없던 기능
- 팔로워/팔로잉 모달 — main에 없던 기능
- 리뷰 정렬 — main에 없던 기능
- 평판 요약 (배지 페이지) — main에 없던 기능
- 리뷰 제목 필드 — main에 없던 기능
- 페이지네이션 (무한 스크롤 대신) — 의도적 변경
- DM 모바일 CSS 토글 — main의 페이지 리다이렉트보다 나은 방식
- DM 검색 터미널 스타일 — 이미 통일됨
- 알림 설정 세분화 — main보다 더 세밀한 제어
