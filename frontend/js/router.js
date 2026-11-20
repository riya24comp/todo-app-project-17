/* =====================================
   TASKFLOW — ROUTE PROTECTION
===================================== */

function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = window.location.pathname.includes("/pages/")
        ? "../index.html"
        : "index.html";
}

function protectRoute() {
    const page = document.body.dataset.page;
    if (page !== "user-dashboard" && page !== "admin-dashboard") return null;

    const token = localStorage.getItem("token");
    const storedUser = getStoredUser();

    if (!token || !storedUser) {
        window.location.replace("login.html");
        return null;
    }

    const tokenData = decodeToken(token);

    if (!tokenData || !tokenData.exp || tokenData.exp * 1000 <= Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("login.html");
        return null;
    }

    const user = {
        ...storedUser,
        role: tokenData.role || storedUser.role || "user"
    };

    if (page === "admin-dashboard" && user.role !== "admin") {
        window.location.replace("user-dashboard.html");
        return null;
    }

    if (page === "user-dashboard" && user.role !== "user") {
        window.location.replace("admin-dashboard.html");
        return null;
    }

    localStorage.setItem("user", JSON.stringify(user));
    return user;
}

function renderUserChrome(user) {
    const name = user?.name || "User";
    const email = user?.email || "";
    const initials = getInitials(name);

    const nameElement = document.getElementById("userName");
    const sidebarName = document.getElementById("userNameSidebar");
    const sidebarEmail = document.getElementById("userEmailSidebar");
    const avatar = document.getElementById("userInitials");

    if (nameElement) nameElement.textContent = name.split(" ")[0];
    if (sidebarName) sidebarName.textContent = name;
    if (sidebarEmail) sidebarEmail.textContent = email;
    if (avatar) avatar.textContent = initials;

    const greetingElement = document.getElementById("greeting");
    if (greetingElement) greetingElement.textContent = greeting();

    const today = document.getElementById("todayLabel");
    if (today) today.textContent = formatLongDate(new Date());
}

const currentUser = protectRoute();

if (currentUser) {
    renderUserChrome(currentUser);
}

document.querySelectorAll("[data-logout]").forEach(button => {
    button.addEventListener("click", logoutUser);
});
