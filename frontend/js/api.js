/* =====================================
   TASKFLOW — API CLIENT
===================================== */

function handleSessionExpired(status) {
    if (status !== 401) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = window.location.pathname.includes("/pages/")
            ? "login.html"
            : "pages/login.html";
    }
}

async function apiRequest(endpoint, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const token = localStorage.getItem("token");
    const body = typeof options.body === "string"
        ? JSON.parse(options.body)
        : options.body;

    /* Demo backend */
    if (APP_CONFIG.DEMO_MODE && typeof DemoDB !== "undefined") {
        try {
            return await DemoDB.request(method, endpoint, body);
        } catch (error) {
            handleSessionExpired(error.status);
            console.error("API Error:", error);
            throw error;
        }
    }

    /* Real backend */
    const headers = { ...options.headers };

    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && typeof options.body === "string") {
        headers["Content-Type"] = "application/json";
    }

    try {
        const response = await fetch(`${APP_CONFIG.API_BASE_URL}${endpoint}`, {
            ...options,
            method,
            headers
        });

        const contentType = response.headers.get("content-type");
        let data = null;

        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text ? { message: text } : null;
        }

        if (response.status === 401) {
            handleSessionExpired(401);
            throw new Error(data?.message || "Session expired. Please login again.");
        }

        if (response.status === 403) {
            throw new Error(data?.message || "You are not authorized to perform this action.");
        }

        if (!response.ok) {
            throw new Error(data?.message || "Something went wrong. Please try again.");
        }

        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

function apiGet(endpoint) {
    return apiRequest(endpoint, { method: "GET" });
}

function apiPost(endpoint, body) {
    return apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
    });
}

function apiPut(endpoint, body) {
    return apiRequest(endpoint, {
        method: "PUT",
        body: JSON.stringify(body)
    });
}

function apiDelete(endpoint) {
    return apiRequest(endpoint, { method: "DELETE" });
}
