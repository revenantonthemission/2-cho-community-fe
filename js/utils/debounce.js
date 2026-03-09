// @ts-check
/**
 * 디바운스 유틸리티
 * @param {(...args: any[]) => void} func - 실행할 함수
 * @param {number} wait - 지연 시간 (ms)
 * @returns {(...args: any[]) => void} 디바운스된 함수 (this 컨텍스트 보존)
 */
export function debounce(func, wait) {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timeout;
    return function (/** @type {any} */ ...args) {
        clearTimeout(timeout);
        // @ts-ignore -- this 컨텍스트 포워딩 (일반 함수 호출자용)
        const context = this;
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
