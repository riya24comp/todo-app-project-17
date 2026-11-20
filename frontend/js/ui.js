/* =====================================
   TASKFLOW — UI BEHAVIOUR
===================================== */

/* Toasts */
function showToast(message, type = "success") {
    const region = document.getElementById("toastRegion");
    if (!region) return;

    const iconName = type === "error"
        ? "alert-circle"
        : type === "info"
            ? "clock"
            : "check-circle";

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `${icon(iconName)}<div>${escapeHTML(message)}</div>`;
    region.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("is-leaving");
        setTimeout(() => toast.remove(), 200);
    }, 3400);
}

/* Dropdown menus */
function closeMenus(except) {
    document.querySelectorAll(".menu.is-open").forEach(menu => {
        if (menu === except) return;
        menu.classList.remove("is-open");
        const trigger = menu.parentElement?.querySelector("[data-menu-trigger]");
        trigger?.setAttribute("aria-expanded", "false");
    });
}

document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-menu-trigger]");

    if (trigger) {
        event.preventDefault();
        const menu = trigger.parentElement?.querySelector(".menu");
        const isOpen = menu?.classList.contains("is-open");
        closeMenus(menu);
        menu?.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
        return;
    }

    if (!event.target.closest(".menu")) closeMenus();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeMenus();
});

/* Password visibility */
document.querySelectorAll("[data-password-toggle]").forEach(button => {
    button.addEventListener("click", () => {
        const input = button.parentElement?.querySelector("input");
        if (!input) return;

        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        button.classList.toggle("is-visible", !showing);
        button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
});

/* Demo account fill */
document.querySelectorAll("[data-demo-email]").forEach(button => {
    button.addEventListener("click", () => {
        const email = document.getElementById("loginEmail");
        const password = document.getElementById("loginPassword");
        if (!email || !password) return;

        email.value = button.dataset.demoEmail;
        password.value = button.dataset.demoPassword;
        email.dispatchEvent(new Event("input", { bubbles: true }));
        document.getElementById("loginForm")?.requestSubmit();
    });
});

/* Reset demo data */
const resetDemoButton = document.getElementById("resetDemo");
if (resetDemoButton && APP_CONFIG.DEMO_MODE) {
    resetDemoButton.addEventListener("click", () => {
        DemoDB.reset();
        showToast("Demo data has been reset.", "info");
    });
}

/* Confirm dialog */
function confirmAction({ title = "Are you sure?", message = "", confirmLabel = "Delete", danger = true } = {}) {
    const dialog = document.getElementById("confirmDialog");

    if (!dialog) {
        return Promise.resolve(window.confirm(message || title));
    }

    return new Promise(resolve => {
        const titleElement = document.getElementById("confirmTitle");
        const textElement = document.getElementById("confirmText");
        const accept = document.getElementById("confirmAccept");
        const cancel = document.getElementById("confirmCancel");

        if (titleElement) titleElement.textContent = title;
        if (textElement) textElement.textContent = message;
        if (accept) {
            accept.textContent = confirmLabel;
            accept.className = danger ? "btn btn-danger" : "btn btn-primary";
        }

        let settled = false;
        const finish = value => {
            if (settled) return;
            settled = true;
            dialog.close();
            dialog.removeEventListener("cancel", onCancel);
            resolve(value);
        };
        const onCancel = event => {
            event.preventDefault();
            finish(false);
        };

        accept.onclick = () => finish(true);
        cancel.onclick = () => finish(false);
        dialog.addEventListener("cancel", onCancel);
        dialog.showModal();
    });
}

/* Landing mobile navigation */
const navToggle = document.getElementById("navToggle");
const siteNav = document.getElementById("siteNav");

if (navToggle && siteNav) {
    const setSiteNavOpen = open => {
        siteNav.classList.toggle("is-open", open);
        navToggle.setAttribute("aria-expanded", String(open));
        navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };

    navToggle.addEventListener("click", () => {
        setSiteNavOpen(!siteNav.classList.contains("is-open"));
    });

    siteNav.addEventListener("click", event => {
        if (!event.target.closest("a")) return;
        setSiteNavOpen(false);
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".site-header")) setSiteNavOpen(false);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") setSiteNavOpen(false);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) setSiteNavOpen(false);
    });
}

/* App sidebar drawer */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarClose = document.getElementById("sidebarClose");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add("is-open");
    if (sidebarOverlay) sidebarOverlay.hidden = false;
    sidebarToggle?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("is-open");
    if (sidebarOverlay) sidebarOverlay.hidden = true;
    sidebarToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
}

sidebarToggle?.addEventListener("click", openSidebar);
sidebarClose?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

window.addEventListener("resize", () => {
    if (window.innerWidth > 960) closeSidebar();
});

/* Scroll reveal */
const revealItems = document.querySelectorAll(".reveal");

if (revealItems.length) {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
        revealItems.forEach(item => item.classList.add("is-visible"));
    } else {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

        revealItems.forEach(item => observer.observe(item));
    }
}

/* Footer year */
const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
