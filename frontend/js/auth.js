/* =====================================
   TASKFLOW — AUTHENTICATION
===================================== */

function saveLoginData(data) {
    const token = data?.token || data?.accessToken;
    if (!token) throw new Error("Login response does not contain a token.");

    const tokenData = decodeToken(token);
    if (!tokenData) throw new Error("Unable to read the login token.");

    const user = data.user || {
        id: tokenData.id || tokenData.userId || tokenData._id || tokenData.sub,
        name: tokenData.name || "User",
        email: tokenData.email || "",
        role: tokenData.role || "user"
    };

    const role = user.role || tokenData.role || "user";
    if (role !== "user" && role !== "admin") throw new Error("Invalid user role.");

    user.role = role;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
}

function redirectByRole(user) {
    window.location.href = user.role === "admin"
        ? "admin-dashboard.html"
        : "user-dashboard.html";
}

function clearAuthMessageOnInput(formId, messageId) {
    const form = document.getElementById(formId);
    const message = document.getElementById(messageId);
    if (!form || !message) return;

    form.addEventListener("input", () => {
        if (message.textContent) showMessage(message, "");
    });
}

/* Demo helpers */
if (APP_CONFIG.DEMO_MODE) {
    document.querySelectorAll("[data-demo-only]").forEach(element => {
        element.hidden = false;
    });
}

/* =====================================
   LOGIN
===================================== */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const rememberedEmail = sessionStorage.getItem("taskflow_email");
    if (rememberedEmail) {
        const emailInput = document.getElementById("loginEmail");
        if (emailInput) emailInput.value = rememberedEmail;
        sessionStorage.removeItem("taskflow_email");
    }

    clearAuthMessageOnInput("loginForm", "loginMessage");

    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const button = loginForm.querySelector('button[type="submit"]');

        if (!email || !password) {
            showMessage("loginMessage", "Enter your email and password to continue.");
            return;
        }

        try {
            setLoading(button, true);
            showMessage("loginMessage", "Signing you in...", "info");

            const response = await apiPost("/auth/login", { email, password });
            const user = saveLoginData(response);

            showMessage("loginMessage", `Welcome back, ${user.name}.`, "success");
            setTimeout(() => redirectByRole(user), 350);
        } catch (error) {
            showMessage("loginMessage", error.message || "Unable to sign in.");
        } finally {
            setLoading(button, false);
        }
    });
}

/* =====================================
   REGISTER
===================================== */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    const passwordInput = document.getElementById("registerPassword");
    const confirmInput = document.getElementById("confirmPassword");
    const strength = document.getElementById("passwordStrength");
    const strengthLabel = document.getElementById("strengthLabel");
    const matchHint = document.getElementById("passwordMatch");

    const scorePassword = value => {
        let score = 0;
        if (value.length >= 8) score += 1;
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
        if (/\d/.test(value)) score += 1;
        if (/[^A-Za-z0-9]/.test(value)) score += 1;
        return Math.min(score, 4);
    };

    const updateStrength = () => {
        if (!strength || !passwordInput) return;
        const value = passwordInput.value;
        const score = scorePassword(value);

        if (!value) {
            strength.removeAttribute("data-strength");
            if (strengthLabel) strengthLabel.textContent = "Use 8+ characters with a mix of letters, numbers and symbols.";
            return;
        }

        strength.dataset.strength = String(Math.max(score, 1));
        const labels = {
            1: "Weak password.",
            2: "Fair password — add more variety.",
            3: "Good password.",
            4: "Strong password."
        };
        if (strengthLabel) strengthLabel.textContent = labels[Math.max(score, 1)];
    };

    const updateMatch = () => {
        if (!matchHint || !confirmInput) return;
        const value = confirmInput.value;

        if (!value) {
            matchHint.textContent = "Re-enter your password.";
            matchHint.className = "match-hint";
            return;
        }

        const matches = value === passwordInput?.value;
        matchHint.textContent = matches ? "Passwords match." : "Passwords do not match.";
        matchHint.className = `match-hint ${matches ? "is-match" : "is-mismatch"}`;
    };

    passwordInput?.addEventListener("input", () => {
        updateStrength();
        if (confirmInput?.value) updateMatch();
    });
    confirmInput?.addEventListener("input", updateMatch);

    clearAuthMessageOnInput("registerForm", "registerMessage");

    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const button = registerForm.querySelector('button[type="submit"]');

        if (!name || !email || !password || !confirmPassword) {
            showMessage("registerMessage", "Please complete every field.");
            return;
        }

        if (password.length < 6) {
            showMessage("registerMessage", "Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            showMessage("registerMessage", "Passwords do not match.");
            return;
        }

        try {
            setLoading(button, true);
            showMessage("registerMessage", "Creating your account...", "info");

            await apiPost("/auth/register", { name, email, password });

            sessionStorage.setItem("taskflow_email", email);
            showMessage("registerMessage", "Account created. Redirecting to login...", "success");

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1100);
        } catch (error) {
            showMessage("registerMessage", error.message || "Unable to create your account.");
        } finally {
            setLoading(button, false);
        }
    });
}
