// signup.js: 회원가입 기능을 담당하는 파일
const signupForm = document.getElementById("signup-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("password-confirm");
const nicknameInput = document.getElementById("nickname");
const profileInput = document.getElementById('profile-upload');
const previewImg = document.getElementById('preview-img');
const placeholder = document.getElementById('preview-placeholder');
const signupBtn = document.querySelector(".login-btn");

// Helper elements
const profileHelper = document.getElementById("profile-helper");
const emailHelper = document.getElementById("email-helper");
const passwordHelper = document.getElementById("password-helper");
const passwordConfirmHelper = document.getElementById("password-confirm-helper");
const nicknameHelper = document.getElementById("nickname-helper");

// Validation patterns
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;

// Validation state
const state = {
    profile: { valid: false, touched: false },
    email: { valid: false, touched: false },
    password: { valid: false, touched: false },
    passwordConfirm: { valid: false, touched: false },
    nickname: { valid: false, touched: false }
};

// Helper functions
function showError(helperEl, message) {
    if (helperEl) {
        helperEl.textContent = message;
        helperEl.style.display = "block";
        helperEl.style.color = "#FF3333";
    }
}

function hideError(helperEl) {
    if (helperEl) {
        helperEl.textContent = "";
        helperEl.style.display = "none";
    }
}

// Validate profile image
function validateProfile() {
    if (!profileInput.files[0]) {
        showError(profileHelper, "* 프로필 사진을 추가해주세요");
        state.profile.valid = false;
    } else {
        hideError(profileHelper);
        state.profile.valid = true;
    }
}

// Validate email
function validateEmail() {
    const value = emailInput.value.trim();

    if (!value) {
        showError(emailHelper, "* 이메일을 입력해주세요");
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
    const confirmValue = passwordConfirmInput.value;

    if (!value) {
        showError(passwordHelper, "* 비밀번호를 입력해주세요");
        state.password.valid = false;
    } else if (!passwordRegex.test(value)) {
        showError(passwordHelper, "* 비밀번호는 8자 이상 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다");
        state.password.valid = false;
    } else if (confirmValue && value !== confirmValue) {
        showError(passwordHelper, "* 비밀번호가 다릅니다");
        state.password.valid = false;
    } else {
        hideError(passwordHelper);
        state.password.valid = true;
    }

    // Re-validate confirm if touched
    if (state.passwordConfirm.touched) {
        validatePasswordConfirm();
    }
}

// Validate password confirm
function validatePasswordConfirm() {
    const passwordValue = passwordInput.value;
    const confirmValue = passwordConfirmInput.value;

    if (!confirmValue) {
        showError(passwordConfirmHelper, "* 비밀번호를 한번 더 입력해주세요");
        state.passwordConfirm.valid = false;
    } else if (passwordValue !== confirmValue) {
        showError(passwordConfirmHelper, "* 비밀번호가 다릅니다");
        state.passwordConfirm.valid = false;
    } else {
        hideError(passwordConfirmHelper);
        state.passwordConfirm.valid = true;
    }
}

// Validate nickname
function validateNickname() {
    const value = nicknameInput.value;

    if (!value.trim()) {
        showError(nicknameHelper, "* 닉네임을 입력해주세요");
        state.nickname.valid = false;
    } else if (value.includes(" ")) {
        showError(nicknameHelper, "* 띄어쓰기를 없애주세요");
        state.nickname.valid = false;
    } else if (value.length > 10) {
        showError(nicknameHelper, "* 닉네임은 최대 10자까지 작성 가능합니다.");
        state.nickname.valid = false;
    } else {
        hideError(nicknameHelper);
        state.nickname.valid = true;
    }
}

// Update button state
function updateButtonState() {
    const isValid = state.profile.valid &&
        state.email.valid &&
        state.password.valid &&
        state.passwordConfirm.valid &&
        state.nickname.valid;

    if (isValid) {
        signupBtn.disabled = false;
        signupBtn.style.backgroundColor = "#7F6AEE";
    } else {
        signupBtn.disabled = true;
        signupBtn.style.backgroundColor = "#ACA0EB";
    }
}

// Profile image upload preview
profileInput.addEventListener("change", (event) => {
    state.profile.touched = true;
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove("hidden");
            placeholder.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    } else {
        previewImg.src = "";
        previewImg.classList.add("hidden");
        placeholder.classList.remove("hidden");
    }
    validateProfile();
    updateButtonState();
});

// Input event listeners
emailInput.addEventListener("input", () => {
    state.email.touched = true;
    validateEmail();
    updateButtonState();
});

passwordInput.addEventListener("input", () => {
    state.password.touched = true;
    validatePassword();
    updateButtonState();
});

passwordConfirmInput.addEventListener("input", () => {
    state.passwordConfirm.touched = true;
    validatePasswordConfirm();
    updateButtonState();
});

nicknameInput.addEventListener("input", () => {
    state.nickname.touched = true;
    validateNickname();
    updateButtonState();
});

// Initialize button state
signupBtn.disabled = true;
signupBtn.style.backgroundColor = "#ACA0EB";

// Form submission
signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Validate all fields
    state.profile.touched = true;
    state.email.touched = true;
    state.password.touched = true;
    state.passwordConfirm.touched = true;
    state.nickname.touched = true;

    validateProfile();
    validateEmail();
    validatePassword();
    validatePasswordConfirm();
    validateNickname();
    updateButtonState();

    if (!state.profile.valid || !state.email.valid || !state.password.valid ||
        !state.passwordConfirm.valid || !state.nickname.valid) {
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("email", emailInput.value.trim());
    formData.append("password", passwordInput.value);
    formData.append("nickname", nicknameInput.value.trim());

    if (profileInput.files[0]) {
        formData.append("profile_image", profileInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/v1/users`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (response.ok) {
            alert("회원가입이 완료되었습니다!");
            window.location.href = "login.html";
        } else {
            const errorData = await response.json();

            // Handle specific errors
            if (errorData.detail) {
                if (errorData.detail.includes("email") || errorData.detail.includes("이메일")) {
                    showError(emailHelper, "* 중복된 이메일입니다");
                } else if (errorData.detail.includes("nickname") || errorData.detail.includes("닉네임")) {
                    showError(nicknameHelper, "* 중복된 닉네임입니다");
                } else {
                    alert(`회원가입 실패: ${errorData.detail}`);
                }
            } else {
                alert(`회원가입 실패: ${errorData.message || "알 수 없는 오류"}`);
            }
        }
    } catch (error) {
        console.error("회원가입 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
});

// 뒤로 가기 버튼
const backBtn = document.getElementById("back-btn");
if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.history.back();
        if (document.referrer === "") {
            window.location.href = "login.html";
        }
    });
}