document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');
    const toast = document.getElementById('toast');

    const newPasswordHelper = document.getElementById('new-password-helper');
    const confirmPasswordHelper = document.getElementById('confirm-password-helper');

    // Validation State
    const state = {
        newPassword: { valid: false, touched: false },
        confirmPassword: { valid: false, touched: false }
    };

    // Password validation regex: 8-20 chars, uppercase, lowercase, number, special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

    // Helper Functions
    function showHelper(element, message) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.color = '#FF3333';
    }

    function hideHelper(element) {
        element.textContent = '';
        element.style.display = 'none';
    }

    function validateNewPassword() {
        const value = newPasswordInput.value;

        if (!value) {
            showHelper(newPasswordHelper, '* 비밀번호를 입력해주세요');
            state.newPassword.valid = false;
        } else if (!passwordRegex.test(value)) {
            showHelper(newPasswordHelper, '* 비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다');
            state.newPassword.valid = false;
        } else {
            hideHelper(newPasswordHelper);
            state.newPassword.valid = true;
        }

        // Re-validate confirm password if new password changes
        if (state.confirmPassword.touched) validateConfirmPassword();
    }

    function validateConfirmPassword() {
        const newPass = newPasswordInput.value;
        const confirmPass = confirmPasswordInput.value;

        if (!confirmPass) {
            showHelper(confirmPasswordHelper, '* 비밀번호를 한번 더 입력해주세요');
            state.confirmPassword.valid = false;
        } else if (newPass !== confirmPass) {
            showHelper(confirmPasswordHelper, '* 비밀번호가 다릅니다');
            state.confirmPassword.valid = false;
            // Also show on password field
            showHelper(newPasswordHelper, '* 비밀번호가 다릅니다');
        } else {
            hideHelper(confirmPasswordHelper);
            state.confirmPassword.valid = true;
        }
    }

    function updateButtonState() {
        const isValid = state.newPassword.valid && state.confirmPassword.valid;

        submitBtn.disabled = !isValid;
        if (isValid) {
            submitBtn.style.backgroundColor = '#7F6AEE';
            submitBtn.classList.add('active');
        } else {
            submitBtn.style.backgroundColor = '#ACA0EB';
            submitBtn.classList.remove('active');
        }
    }

    function handleInput(e, validator, fieldName) {
        state[fieldName].touched = true;
        validator();
        updateButtonState();
    }

    // Event Listeners
    newPasswordInput.addEventListener('input', (e) => handleInput(e, validateNewPassword, 'newPassword'));
    confirmPasswordInput.addEventListener('input', (e) => handleInput(e, validateConfirmPassword, 'confirmPassword'));

    // Submit Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (submitBtn.disabled) return;

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (newPassword !== confirmPassword) {
            showHelper(confirmPasswordHelper, '* 비밀번호가 다릅니다');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/v1/users/me/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "new_password": newPassword,
                    "new_password_confirm": confirmPassword
                }),
                credentials: 'include'
            });

            if (response.ok) {
                showToast();
            } else {
                const data = await response.json();
                showHelper(newPasswordHelper, data.message || '* 비밀번호 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error:', error);
            showHelper(newPasswordHelper, '* 서버 통신 중 오류가 발생했습니다.');
        }
    });

    function showToast() {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
