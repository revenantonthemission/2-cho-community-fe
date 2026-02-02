// js/views/HeaderView.js
// 헤더 UI 렌더링 관련 로직

/**
 * 헤더 View 클래스
 */
import { getImageUrl } from './helpers.js';

/**
 * 헤더 View 클래스
 */
class HeaderView {
    /**
     * 프로필 요소 생성
     * @param {object} user - 사용자 정보
     * @returns {HTMLElement} - 생성된 프로필 요소
     */
    static createProfileElement(user) {
        const profileCircle = document.createElement('div');
        profileCircle.className = 'profile-circle';
        profileCircle.id = 'header-profile';

        if (user && user.profileImageUrl) {
            const fullUrl = getImageUrl(user.profileImageUrl);
            profileCircle.style.backgroundImage = `url(${fullUrl})`;
        } else {
            profileCircle.style.backgroundColor = '#555';
        }

        return profileCircle;
    }

    /**
     * 드롭다운 메뉴 생성
     * @param {HTMLElement} profileBtn - 프로필 버튼 요소
     * @param {object} handlers - 이벤트 핸들러 객체
     * @param {Function} handlers.onEditInfo - 회원정보 수정 클릭 핸들러
     * @param {Function} handlers.onChangePassword - 비밀번호 수정 클릭 핸들러
     * @param {Function} handlers.onLogout - 로그아웃 클릭 핸들러
     * @returns {HTMLElement} - 드롭다운 요소
     */
    static createDropdown(profileBtn, handlers) {
        let dropdown = document.getElementById('header-dropdown');

        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'header-dropdown';
            dropdown.className = 'header-dropdown hidden';

            dropdown.innerHTML = `
                <ul>
                    <li id="menu-edit-info">회원정보수정</li>
                    <li id="menu-change-pw">비밀번호수정</li>
                    <li id="menu-logout">로그아웃</li>
                </ul>
            `;

            const headerAuth = document.querySelector('.header-auth');
            if (headerAuth) {
                headerAuth.appendChild(dropdown);
            } else {
                document.body.appendChild(dropdown);
            }
        }

        // 이벤트 바인딩
        HeaderView._bindDropdownEvents(profileBtn, dropdown, handlers);

        return dropdown;
    }

    /**
     * 드롭다운 이벤트 바인딩
     * @private
     */
    static _bindDropdownEvents(profileBtn, dropdown, handlers) {
        // 토글 로직
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // 외부 클릭 시 닫기 (기존 리스너 제거 후 재등록)
        if (HeaderView._documentClickListener) {
            document.removeEventListener('click', HeaderView._documentClickListener);
        }

        HeaderView._documentClickListener = (e) => {
            if (profileBtn && !profileBtn.contains(e.target) && dropdown && !dropdown.contains(e.target)) {
                dropdown.classList.add('hidden');
            }
        };
        document.addEventListener('click', HeaderView._documentClickListener);

        // 메뉴 액션 (드롭다운이 새로 생성되었을 때만 바인딩됨)
        // 주의: 드롭다운이 기존에 존재했다면 이 부분이 중복 바인딩 될 수 있음.
        // 하지만 createDropdown에서 dropdown이 없으면 생성하고, 있으면 재사용함.
        // dropdown이 재사용될 때 핸들러가 바뀌었다면?
        // 안전하게 cloneNode로 리스너 초기화 혹은 핸들러 업데이트 방식이 필요하나,
        // 현재 구조상 dropdown이 DOM에서 제거되었다가 다시 생성되는 구조일 가능성이 높으므로 일단 단순화.
        
        const bindMenuBtn = (id, handler) => {
            const btn = document.getElementById(id);
            if (btn && handler) {
                // 기존 리스너 제거를 위해 cloneNode 사용
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                newBtn.addEventListener('click', handler);
            }
        };

        bindMenuBtn('menu-edit-info', handlers.onEditInfo);
        bindMenuBtn('menu-change-pw', handlers.onChangePassword);
        bindMenuBtn('menu-logout', handlers.onLogout);
    }

    /**
     * 드롭다운 숨기기
     */
    static hideDropdown() {
        const dropdown = document.getElementById('header-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
    }
}

export default HeaderView;
