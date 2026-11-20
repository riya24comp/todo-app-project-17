/* =====================================
   TASKFLOW — ADMIN DASHBOARD
===================================== */

const PRIORITY_PILL = {
    high: "pill-danger",
    medium: "pill-warning",
    low: ""
};

const STATUS_PILL = {
    pending: "pill-warning",
    "in-progress": "pill-info",
    completed: "pill-success"
};

let adminUsers = [];
let adminTasks = [];
let activeTab = "users";
let userQuery = "";
let taskQuery = "";

/* =====================================
   HELPERS
===================================== */

function adminUserId(user) {
    return String(user?._id || user?.id || "");
}

function ownerOf(task) {
    if (task.user_id && typeof task.user_id === "object") {
        return {
            id: adminUserId(task.user_id),
            name: task.user_id.name || "Unknown user",
            email: task.user_id.email || ""
        };
    }

    const match = adminUsers.find(user => adminUserId(user) === String(task.user_id));
    return {
        id: String(task.user_id || ""),
        name: match?.name || "Unknown user",
        email: match?.email || ""
    };
}

function userTaskCount(userId) {
    return adminTasks.filter(task => {
        const ownerId = task.user_id && typeof task.user_id === "object"
            ? adminUserId(task.user_id)
            : String(task.user_id);
        return ownerId === userId;
    }).length;
}

function adminPriorityPill(priority) {
    const value = PRIORITY_LABELS[priority] ? priority : "medium";
    return `<span class="pill ${PRIORITY_PILL[value]}"><span class="dot"></span>${priorityLabel(value)}</span>`;
}

function adminStatusPill(status) {
    return `<span class="pill ${STATUS_PILL[status] || ""}"><span class="dot"></span>${statusLabel(status)}</span>`;
}

function filteredUsers() {
    const query = userQuery.trim().toLowerCase();
    if (!query) return adminUsers;

    return adminUsers.filter(user =>
        [user.name, user.email, user.role].some(value =>
            String(value || "").toLowerCase().includes(query)
        )
    );
}

function filteredAdminTasks() {
    const status = document.getElementById("adminStatusFilter")?.value || "all";
    const query = taskQuery.trim().toLowerCase();

    return adminTasks.filter(task => {
        if (status !== "all" && task.status !== status) return false;
        if (!query) return true;

        const owner = ownerOf(task);
        return [task.title, task.description, owner.name, owner.email, task.status, task.priority]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(query));
    });
}

/* =====================================
   RENDER USERS
===================================== */

function renderUsers() {
    const tableBody = document.getElementById("usersTableBody");
    if (!tableBody) return;

    const users = filteredUsers();

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="4" class="empty-cell">${userQuery ? "No users match your search." : "No users found."}</td></tr>
        `;
    } else {
        tableBody.innerHTML = users.map(user => {
            const id = adminUserId(user);
            const role = user.role === "admin" ? "admin" : "user";

            return `
                <tr>
                    <td class="cell-user" data-label="User">
                        <div class="table-user">
                            <span class="avatar avatar-sm">${escapeHTML(getInitials(user.name))}</span>
                            <div>
                                <strong>${escapeHTML(user.name || "Unnamed user")}</strong>
                                <span>${escapeHTML(user.email || "")}</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="Role">
                        <span class="role-pill ${role === "admin" ? "is-admin" : ""}">
                            ${icon(role === "admin" ? "shield" : "user")} ${role}
                        </span>
                    </td>
                    <td data-label="Tasks">${userTaskCount(id)}</td>
                    <td data-label="Joined">${escapeHTML(formatDateTime(user.created_at))}</td>
                </tr>
            `;
        }).join("");
    }

    const summary = document.getElementById("usersSummary");
    if (summary) {
        summary.textContent = `${users.length} of ${adminUsers.length} users`;
    }
}

/* =====================================
   RENDER TASKS
===================================== */

function renderTasks() {
    const tableBody = document.getElementById("adminTasksTableBody");
    if (!tableBody) return;

    const tasks = filteredAdminTasks();

    if (tasks.length === 0) {
        tableBody.innerHTML = `
            <tr><td colspan="6" class="empty-cell">${taskQuery ? "No tasks match your search." : "No tasks found."}</td></tr>
        `;
    } else {
        tableBody.innerHTML = tasks.map(task => {
            const owner = ownerOf(task);
            const due = dueInfo(task.due_date);

            return `
                <tr>
                    <td class="cell-task" data-label="Task">
                        <strong>${escapeHTML(task.title)}</strong>
                        <span>${escapeHTML(task.description || "No description")}</span>
                    </td>
                    <td class="cell-owner" data-label="Owner">
                        <div class="owner-cell">
                            <span class="avatar">${escapeHTML(getInitials(owner.name))}</span>
                            <span>${escapeHTML(owner.name)}</span>
                        </div>
                    </td>
                    <td data-label="Priority">${adminPriorityPill(task.priority)}</td>
                    <td data-label="Status">${adminStatusPill(task.status)}</td>
                    <td data-label="Due date">${escapeHTML(due.label)}</td>
                    <td data-label="Created">${escapeHTML(formatDateTime(task.created_at))}</td>
                </tr>
            `;
        }).join("");
    }

    const summary = document.getElementById("tasksSummary");
    if (summary) {
        summary.textContent = `${tasks.length} of ${adminTasks.length} tasks`;
    }
}

/* =====================================
   STATISTICS
===================================== */

function updateStatistics() {
    const totalUsers = adminUsers.length;
    const totalTasks = adminTasks.length;
    const pending = adminTasks.filter(task => task.status === "pending").length;
    const inProgress = adminTasks.filter(task => task.status === "in-progress").length;
    const completed = adminTasks.filter(task => task.status === "completed").length;
    const percent = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    };

    setText("adminTotalUsers", totalUsers);
    setText("adminTotalTasks", totalTasks);
    setText("adminPendingTasks", pending);
    setText("adminCompletedTasks", completed);

    setText("sideUserCount", totalUsers);
    setText("sideTaskCount", totalTasks);

    const ring = document.getElementById("adminRing");
    if (ring) ring.style.setProperty("--value", String(percent));
    setText("adminRingText", `${percent}%`);
    setText("adminRingValue", `${percent}%`);
    setText("adminRingTextInline", `${percent}%`);
    setText("adminCompletion", `${completed} of ${totalTasks} tasks completed`);
    setText("adminCompletionNote", totalTasks ? `${completed} completed tasks` : "No tasks yet");

    const bar = (id, count) => {
        const element = document.getElementById(id);
        if (element) element.style.width = `${totalTasks ? Math.round((count / totalTasks) * 100) : 0}%`;
    };

    const completionBar = document.getElementById("adminCompletionBar");
    if (completionBar) completionBar.style.width = `${percent}%`;

    bar("chartPendingBar", pending);
    bar("chartProgressBar", inProgress);
    bar("chartCompletedBar", completed);

    setText("chartPendingCount", pending);
    setText("chartProgressCount", inProgress);
    setText("chartCompletedCount", completed);
}

/* =====================================
   LOAD
===================================== */

function usersSkeleton() {
    return Array.from({ length: 4 }).map(() => `
        <tr class="skeleton-row">
            <td><div class="skeleton skeleton-bar" style="width:160px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:64px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:30px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:82px"></div></td>
        </tr>
    `).join("");
}

function tasksSkeleton() {
    return Array.from({ length: 6 }).map(() => `
        <tr class="skeleton-row">
            <td><div class="skeleton skeleton-bar" style="width:190px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:110px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:56px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:70px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:64px"></div></td>
            <td><div class="skeleton skeleton-bar" style="width:72px"></div></td>
        </tr>
    `).join("");
}

async function loadUsers(showSkeleton = true) {
    const tableBody = document.getElementById("usersTableBody");
    if (!tableBody) return;

    if (showSkeleton) tableBody.innerHTML = usersSkeleton();
    showMessage("usersMessage", "");

    try {
        const response = await apiGet("/admin/users");
        adminUsers = Array.isArray(response) ? response : response?.users || [];
        renderUsers();
        updateStatistics();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="4" class="empty-cell">Unable to load users.</td></tr>`;
        showMessage("usersMessage", error.message || "Unable to load users.");
    }
}

async function loadTasks(showSkeleton = true) {
    const tableBody = document.getElementById("adminTasksTableBody");
    if (!tableBody) return;

    if (showSkeleton) tableBody.innerHTML = tasksSkeleton();
    showMessage("adminTasksMessage", "");

    try {
        const response = await apiGet("/admin/tasks");
        adminTasks = Array.isArray(response) ? response : response?.tasks || [];
        renderTasks();
        renderUsers();
        updateStatistics();
    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Unable to load tasks.</td></tr>`;
        showMessage("adminTasksMessage", error.message || "Unable to load tasks.");
    }
}

async function loadAdminData() {
    await Promise.all([loadUsers(), loadTasks()]);
}

/* =====================================
   TABS
===================================== */

function setTab(tab, updateHash = true) {
    activeTab = tab === "tasks" ? "tasks" : "users";

    document.querySelectorAll("[data-tab]").forEach(button => {
        const active = button.dataset.tab === activeTab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
    });

    const usersPanel = document.getElementById("usersPanel");
    const tasksPanel = document.getElementById("tasksPanel");

    if (usersPanel) usersPanel.hidden = activeTab !== "users";
    if (tasksPanel) tasksPanel.hidden = activeTab !== "tasks";

    const current = document.getElementById("breadcrumbCurrent");
    if (current) current.textContent = activeTab === "users" ? "Users" : "All tasks";

    if (updateHash) {
        history.replaceState(null, "", `#${activeTab}`);
    }
}

document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
        setTab(button.dataset.tab);
        closeSidebar();
    });
});

/* =====================================
   TOOLBAR
===================================== */

const userSearch = document.getElementById("userSearch");
if (userSearch) {
    userSearch.addEventListener("input", debounce(() => {
        userQuery = userSearch.value;
        renderUsers();
    }, 140));
}

const taskSearch = document.getElementById("taskSearchAdmin");
if (taskSearch) {
    taskSearch.addEventListener("input", debounce(() => {
        taskQuery = taskSearch.value;
        renderTasks();
    }, 140));
}

document.getElementById("adminStatusFilter")?.addEventListener("change", renderTasks);

document.getElementById("refreshUsersBtn")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    setLoading(button, true);
    await loadUsers();
    setLoading(button, false);
    showToast("User list refreshed.", "info");
});

document.getElementById("refreshTasksBtn")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    setLoading(button, true);
    await loadTasks();
    setLoading(button, false);
    showToast("Task list refreshed.", "info");
});

document.getElementById("exportTasksBtn")?.addEventListener("click", () => {
    const tasks = filteredAdminTasks();

    if (tasks.length === 0) {
        showToast("There are no tasks to export.", "error");
        return;
    }

    const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
        ["Title", "Description", "Owner", "Owner email", "Priority", "Status", "Due date", "Created at"],
        ...tasks.map(task => {
            const owner = ownerOf(task);
            return [
                task.title,
                task.description,
                owner.name,
                owner.email,
                priorityLabel(task.priority),
                statusLabel(task.status),
                task.due_date ? toDateInput(task.due_date) : "",
                task.created_at ? toDateInput(task.created_at) : ""
            ];
        })
    ];

    const csv = rows.map(row => row.map(quote).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `taskflow-tasks-${todayISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(`Exported ${tasks.length} tasks.`);
});

/* =====================================
   DEMO CHIP
===================================== */

const dataModeChip = document.getElementById("dataModeChip");
if (dataModeChip) {
    const label = dataModeChip.querySelector(".data-mode-label");
    if (label) label.textContent = APP_CONFIG.DEMO_MODE ? "Demo data" : "Live data";
}

/* =====================================
   INIT
===================================== */

const initialTab = window.location.hash.replace("#", "");
setTab(initialTab === "tasks" ? "tasks" : "users", false);
loadAdminData();
