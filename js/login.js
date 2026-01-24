// login.js: 로그인 기능을 담당하는 핵심 파일.
const loginForm = document.getElementById("login-form");
const loginBtn = document.querySelector(".login-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailHelper = document.getElementById("email-helper");
const passwordHelper = document.getElementById("password-helper");

// Validation regex patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

// Validation state
const state = {
    email: { valid: false, touched: false },
    password: { valid: false, touched: false }
};

// Helper functions
const showError = (helperEl, message) => {
    helperEl.textContent = message;
    helperEl.style.display = "block";
    helperEl.style.color = "#FF3333";
};

const hideError = (helperEl) => {
    helperEl.textContent = "";
    helperEl.style.display = "none";
};

// Validate email
function validateEmail() {
    const value = emailInput.value.trim();

    if (!value) {
        showError(emailHelper, "* 이메일을 입력해주세요.");
        state.email.valid = false;
    } else if (!emailRegex.test(value)) {
        showError(emailHelper, "* 올바른 이메일 주소 형식을 입력해주세요. (예: example@adapterz.kr)");
        state.email.valid = false;
    } else {
        hideError(emailHelper);
        state.email.valid = true;
    }
}

// Validate password
function validatePassword() {
    const value = passwordInput.value;

    if (!value) {
        showError(passwordHelper, "* 비밀번호를 입력해주세요");
        state.password.valid = false;
    } else if (!passwordRegex.test(value)) {
        showError(passwordHelper, "* 비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다");
        state.password.valid = false;
    } else {
        hideError(passwordHelper);
        state.password.valid = true;
    }
}

// Update button state
function updateButtonState() {
    const isValid = state.email.valid && state.password.valid;

    if (isValid) {
        loginBtn.disabled = false;
        loginBtn.style.backgroundColor = "#7F6AEE";
    } else {
        loginBtn.disabled = true;
        loginBtn.style.backgroundColor = "#ACA0EB";
    }
}

// Input event handlers
emailInput.addEventListener("input", () => {
    state.email.touched = true;
    validateEmail();
    updateButtonState();
});

emailInput.addEventListener("blur", () => {
    state.email.touched = true;
    validateEmail();
    updateButtonState();
});

passwordInput.addEventListener("input", () => {
    state.password.touched = true;
    validatePassword();
    updateButtonState();
});

passwordInput.addEventListener("blur", () => {
    state.password.touched = true;
    validatePassword();
    updateButtonState();
});

// Initialize button state
loginBtn.disabled = true;
loginBtn.style.backgroundColor = "#ACA0EB";

// Form submission
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Validate all fields
    validateEmail();
    validatePassword();

    if (!state.email.valid || !state.password.valid) {
        return;
    }

    const emailStr = emailInput.value.trim();
    const passwordStr = passwordInput.value;

    loginBtn.disabled = true;
    loginBtn.textContent = "로그인 중...";

    try {
        const response = await fetch(`${API_BASE_URL}/v1/auth/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: emailStr, password: passwordStr }),
            credentials: "include",
        });

        if (response.ok) {
            window.location.href = "/index.html";
        } else {
            showError(passwordHelper, "* 아이디 또는 비밀번호를 확인해주세요");
            loginBtn.disabled = false;
            loginBtn.textContent = "로그인";
            loginBtn.style.backgroundColor = "#7F6AEE";
        }
    } catch (error) {
        console.error("로그인 에러: ", error);
        showError(passwordHelper, "* 서버와 통신할 수 없습니다.");
        loginBtn.disabled = false;
        loginBtn.textContent = "로그인";
    }
});