/* =====================================
   TASKFLOW — SHARED UTILITIES
===================================== */

const ICON_SPRITE = window.location.pathname.replace(/\\/g, "/").includes("/pages/")
    ? "../assets/icons.svg"
    : "assets/icons.svg";

const STATUS_LABELS = {
    pending: "Pending",
    "in-progress": "In progress",
    completed: "Completed"
};

const PRIORITY_LABELS = {
    low: "Low",
    medium: "Medium",
    high: "High"
};

function icon(name, extraClass = "") {
    return `<svg class="icon ${extraClass}" aria-hidden="true" focusable="false"><use href="${ICON_SPRITE}#i-${name}"></use></svg>`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
    })[char]);
}

function decodeToken(token) {
    try {
        const payload = token.split(".")[1];
        const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(base64);
        const bytes = Uint8Array.from(decoded, char => char.charCodeAt(0));
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
        return null;
    }
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
        return null;
    }
}

function getInitials(name) {
    const parts = String(name || "User").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    const initials = parts.length === 1
        ? parts[0].slice(0, 2)
        : parts[0][0] + parts[parts.length - 1][0];
    return initials.toUpperCase();
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function todayISO(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfDay(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function dueInfo(value) {
    if (!value) {
        return { label: "No due date", overdue: false, today: false };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return { label: "No due date", overdue: false, today: false };
    }

    const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);
    let label;

    if (days === 0) label = "Today";
    else if (days === 1) label = "Tomorrow";
    else if (days === -1) label = "Yesterday";
    else {
        label = date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric"
        });
    }

    return { label, overdue: days < 0, today: days === 0 };
}

function formatLongDate(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function statusLabel(status) {
    return STATUS_LABELS[status] || "Pending";
}

function priorityLabel(priority) {
    return PRIORITY_LABELS[priority] || "Medium";
}

function debounce(fn, wait = 160) {
    let timer;
    return function debounced(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

function setLoading(button, loading) {
    if (!button) return;
    button.classList.toggle("is-loading", Boolean(loading));
    button.disabled = Boolean(loading);
    button.setAttribute("aria-busy", String(Boolean(loading)));
}

function showMessage(target, message, type = "error") {
    const element = typeof target === "string" ? document.getElementById(target) : target;
    if (!element) return;
    element.textContent = message || "";
    element.className = `form-message ${message ? type : ""}`;
}

function greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function sortByDueDate(tasks) {
    return [...tasks].sort((a, b) => {
        const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
        if (aTime !== bTime) return aTime - bTime;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}
