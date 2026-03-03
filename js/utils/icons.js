// js/utils/icons.js
// 플랫 SVG 아이콘 팩토리 (Feather/Lucide 스타일)
// innerHTML 미사용 — createElementNS로 XSS-safe 생성

const NS = 'http://www.w3.org/2000/svg';

/** 기본 SVG 컨테이너 생성 */
function svg(size, children) {
    const el = document.createElementNS(NS, 'svg');
    el.setAttribute('width', String(size));
    el.setAttribute('height', String(size));
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '2');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    children.forEach(child => el.appendChild(child));
    return el;
}

function path(d) {
    const el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d);
    return el;
}

function circle(cx, cy, r) {
    const el = document.createElementNS(NS, 'circle');
    el.setAttribute('cx', String(cx));
    el.setAttribute('cy', String(cy));
    el.setAttribute('r', String(r));
    return el;
}

function line(x1, y1, x2, y2) {
    const el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', String(x1));
    el.setAttribute('y1', String(y1));
    el.setAttribute('x2', String(x2));
    el.setAttribute('y2', String(y2));
    return el;
}

/**
 * SVG 아이콘 모음
 * 모든 아이콘은 stroke 기반, currentColor 사용
 */
export const Icons = {
    /** 해 (다크 모드에서 표시 — 라이트로 전환) */
    sun(size = 20) {
        return svg(size, [
            circle(12, 12, 5),
            line(12, 1, 12, 3),
            line(12, 21, 12, 23),
            line(4.22, 4.22, 5.64, 5.64),
            line(18.36, 18.36, 19.78, 19.78),
            line(1, 12, 3, 12),
            line(21, 12, 23, 12),
            line(4.22, 19.78, 5.64, 18.36),
            line(18.36, 5.64, 19.78, 4.22),
        ]);
    },

    /** 달 (라이트 모드에서 표시 — 다크로 전환) */
    moon(size = 20) {
        return svg(size, [
            path('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'),
        ]);
    },

    /** 알림 벨 */
    bell(size = 20) {
        return svg(size, [
            path('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'),
            path('M13.73 21a2 2 0 0 1-3.46 0'),
        ]);
    },

    /** 뒤로가기 (chevron left) */
    chevronLeft(size = 24) {
        return svg(size, [
            path('M15 19L8 12L15 5'),
        ]);
    },
};
