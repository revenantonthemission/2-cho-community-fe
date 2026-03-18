// @ts-check
// js/views/PackageFormView.js
// 패키지 등록 폼 렌더링

import { createElement, createFormGroup } from '../utils/dom.js';
import { PACKAGE_CATEGORY_LABELS, PACKAGE_MANAGER_LABELS } from '../constants.js';

class PackageFormView {
    /**
     * 패키지 등록 폼 렌더링
     * @param {HTMLElement} container
     * @param {Function} onSubmit - (data) => void
     */
    static renderPackageForm(container, onSubmit) {
        if (!container) return;
        container.textContent = '';

        // 패키지 이름
        const nameInput = createElement('input', {
            type: 'text',
            id: 'package-name',
            className: 'form-input',
            placeholder: '패키지 이름 (예: neovim)',
            maxlength: '100',
        });

        // 표시 이름
        const displayNameInput = createElement('input', {
            type: 'text',
            id: 'package-display-name',
            className: 'form-input',
            placeholder: '표시 이름 (예: Neovim)',
            maxlength: '200',
        });

        // 설명
        const descriptionInput = createElement('textarea', {
            id: 'package-description',
            className: 'form-textarea',
            placeholder: '패키지 설명을 입력해주세요.',
            rows: '4',
        });

        // 홈페이지 URL
        const homepageInput = createElement('input', {
            type: 'url',
            id: 'package-homepage',
            className: 'form-input',
            placeholder: 'https://example.com (선택)',
        });

        // 카테고리 선택
        const categorySelect = createElement('select', {
            id: 'package-category',
            className: 'form-select',
        });
        categorySelect.appendChild(createElement('option', { value: '' }, ['카테고리 선택 *']));
        Object.entries(PACKAGE_CATEGORY_LABELS).forEach(([key, label]) => {
            categorySelect.appendChild(createElement('option', { value: key }, [label]));
        });

        // 패키지 매니저 선택
        const managerSelect = createElement('select', {
            id: 'package-manager',
            className: 'form-select',
        });
        managerSelect.appendChild(createElement('option', { value: '' }, ['패키지 매니저 선택']));
        Object.entries(PACKAGE_MANAGER_LABELS).forEach(([key, label]) => {
            managerSelect.appendChild(createElement('option', { value: key }, [label]));
        });

        // 제출 버튼
        const submitBtn = createElement('button', {
            type: 'button',
            className: 'submit-btn',
            textContent: '패키지 등록',
            onClick: () => {
                const data = {
                    name: /** @type {HTMLInputElement} */ (nameInput).value.trim(),
                    display_name: /** @type {HTMLInputElement} */ (displayNameInput).value.trim(),
                    description: /** @type {HTMLTextAreaElement} */ (descriptionInput).value.trim(),
                    homepage_url: /** @type {HTMLInputElement} */ (homepageInput).value.trim() || null,
                    category: /** @type {HTMLSelectElement} */ (categorySelect).value || null,
                    package_manager: /** @type {HTMLSelectElement} */ (managerSelect).value || null,
                };
                onSubmit(data);
            },
        });

        const form = createElement('div', { className: 'package-form' }, [
            createFormGroup('패키지 이름 *', nameInput),
            createFormGroup('표시 이름 *', displayNameInput),
            createFormGroup('설명', descriptionInput),
            createFormGroup('홈페이지 URL', homepageInput),
            createFormGroup('카테고리 *', categorySelect),
            createFormGroup('패키지 매니저', managerSelect),
            createElement('div', { className: 'submit-section' }, [submitBtn]),
        ]);

        container.appendChild(form);
    }
}

export default PackageFormView;
