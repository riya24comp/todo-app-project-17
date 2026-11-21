/* =====================================
   TASKFLOW — USER DASHBOARD
===================================== */

const TASK_STATUSES = ["pending", "in-progress", "completed"];

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

const STATUS_ICON = {
    pending: "clock",
    "in-progress": "play",
    completed: "check"
};

let allTasks = [];
let currentFilter = "all";
let currentView = localStorage.getItem("taskflow_view") || "board";
let searchQuery = "";
let taskLoadError = "";

/* =====================================
   HELPERS
===================================== */

function taskId(task) {
    return String(task._id || task.id);
}

function normalizeTasks(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.tasks)) return response.tasks;
    if (Array.isArray(response?.data)) return response.data;
    throw new Error("The tasks API returned an unexpected response.");
}

function priorityPill(priority) {
    const value = PRIORITY_LABELS[priority] ? priority : "medium";
    return `<span class="pill ${PRIORITY_PILL[value]}"><span class="dot"></span>${priorityLabel(value)}</span>`;
}

function statusPill(status) {
    return `<span class="pill ${STATUS_PILL[status] || ""}"><span class="dot"></span>${statusLabel(status)}</span>`;
}

function dueChip(task) {
    const due = dueInfo(task.due_date);
    const state = due.overdue ? "is-overdue" : due.today ? "is-today" : "";
    return `<span class="due-chip ${state}">${icon("calendar")}${escapeHTML(due.label)}</span>`;
}

function taskMenu(task) {
    const moves = TASK_STATUSES
        .filter(status => status !== task.status)
        .map(status => `
            <button class="menu-item" data-action="status" data-status="${status}" role="menuitem">
                ${icon(STATUS_ICON[status])} Move to ${statusLabel(status)}
            </button>
        `)
        .join("");

    return `
        <div class="menu-wrap">
            <button class="card-menu-btn" data-menu-trigger aria-label="Task actions" aria-haspopup="true" aria-expanded="false">
                ${icon("more-vertical")}
            </button>
            <div class="menu" role="menu">
                <button class="menu-item" data-action="edit" role="menuitem">${icon("pencil")} Edit task</button>
                ${moves}
                <div class="menu-sep"></div>
                <button class="menu-item is-danger" data-action="delete" role="menuitem">${icon("trash")} Delete task</button>
            </div>
        </div>
    `;
}

/* =====================================
   RENDER
===================================== */

function filteredTasks() {
    const query = searchQuery.trim().toLowerCase();

    return allTasks.filter(task => {
        const matchesFilter = currentFilter === "all" || task.status === currentFilter;
        if (!matchesFilter) return false;
        if (!query) return true;

        return [task.title, task.description, task.priority, task.status]
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(query));
    });
}

function renderBoard(tasks) {
    const columns = TASK_STATUSES.map(status => {
        const items = tasks.filter(task => (task.status || "pending") === status);

        return `
            <section class="board-column" data-status="${status}" aria-label="${statusLabel(status)} tasks">
                <div class="board-column-head">
                    <span class="status-dot dot-${status === "in-progress" ? "progress" : status === "completed" ? "completed" : "pending"}"></span>
                    <h3>${statusLabel(status)}</h3>
                    <span class="col-count">${items.length}</span>
                </div>
                <div class="board-cards" data-status="${status}">
                    ${items.length ? items.map(taskCard).join("") : `<p class="column-empty">${searchQuery ? "No matches" : "Drop tasks here"}</p>`}
                </div>
            </section>
        `;
    }).join("");

    return columns;
}

function taskCard(task) {
    const due = dueInfo(task.due_date);

    return `
        <article class="task-card" draggable="true" data-id="${escapeHTML(taskId(task))}">
            <div class="task-card-top">
                <h4>${escapeHTML(task.title)}</h4>
                ${taskMenu(task)}
            </div>
            <p>${escapeHTML(task.description || "No description added.")}</p>
            <div class="task-card-meta">
                ${priorityPill(task.priority)}
                <span class="due-chip ${due.overdue ? "is-overdue" : due.today ? "is-today" : ""}">${icon("calendar")}${escapeHTML(due.label)}</span>
            </div>
        </article>
    `;
}

function taskRow(task) {
    const due = dueInfo(task.due_date);
    const completed = task.status === "completed";

    return `
        <div class="task-row ${completed ? "is-completed" : ""}" data-id="${escapeHTML(taskId(task))}">
            <button class="row-check ${completed ? "is-done" : ""}" data-action="toggle"
                aria-label="${completed ? "Mark as pending" : "Mark as completed"}"
                aria-pressed="${completed}">
                ${icon("check")}
            </button>
            <div class="row-main">
                <strong>${escapeHTML(task.title)}</strong>
                <span>${escapeHTML(task.description || "No description added.")}</span>
            </div>
            <div class="row-priority">${priorityPill(task.priority)}</div>
            <div class="row-status">${statusPill(task.status)}</div>
            <div class="row-due ${due.overdue ? "is-overdue" : ""}">${escapeHTML(due.label)}</div>
            <div class="row-actions">${taskMenu(task)}</div>
        </div>
    `;
}

function renderList(tasks) {
    if (tasks.length === 0) {
        return `
            <div class="empty-state">
                <span class="empty-icon">${icon("search")}</span>
                <h3>${searchQuery ? "No matching tasks" : "Nothing here yet"}</h3>
                <p>${searchQuery ? "Try a different search term or clear the filters." : "Create your first task to get started."}</p>
            </div>
        `;
    }

    return `
        <div class="task-list-view">
            <div class="list-head">
                <span></span>
                <span>Task</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Due</span>
                <span></span>
            </div>
            ${tasks.map(taskRow).join("")}
        </div>
    `;
}

function renderTasks() {
    const taskList = document.getElementById("taskList");
    if (!taskList) return;

    const tasks = sortByDueDate(filteredTasks());
    const ordered = currentView === "list"
        ? [
            ...tasks.filter(task => task.status !== "completed"),
            ...tasks.filter(task => task.status === "completed")
        ]
        : tasks;

    taskList.dataset.view = currentView;
    taskList.classList.toggle("is-list", currentView === "list");
    taskList.classList.toggle("is-empty", allTasks.length === 0);

    if (taskLoadError) {
        taskList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">${icon("alert-circle")}</span>
                <h3>Unable to load tasks</h3>
                <p>${escapeHTML(taskLoadError)}</p>
                <button class="btn btn-secondary btn-sm" data-action="retry">Try again</button>
            </div>
        `;
        return;
    }

    if (allTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">${icon("inbox")}</span>
                <h3>No tasks yet</h3>
                <p>Your board is ready. Create your first task to start tracking progress.</p>
                <button class="btn btn-primary btn-sm" data-action="new">
                    ${icon("plus")} Create a task
                </button>
            </div>
        `;
        return;
    }

    taskList.innerHTML = currentView === "board"
        ? renderBoard(ordered)
        : renderList(ordered);

    updateFilterUI();
}

function renderSkeleton() {
    const taskList = document.getElementById("taskList");
    if (!taskList) return;

    taskList.classList.remove("is-list");
    taskList.classList.remove("is-empty");
    taskList.dataset.view = "board";

    const card = `
        <div class="task-card" style="cursor:default">
            <div class="skeleton" style="height:12px;width:72%;margin-bottom:9px"></div>
            <div class="skeleton" style="height:9px;width:94%;margin-bottom:6px"></div>
            <div class="skeleton" style="height:9px;width:58%;margin-bottom:10px"></div>
            <div style="display:flex;gap:6px">
                <div class="skeleton" style="height:20px;width:62px;border-radius:999px"></div>
                <div class="skeleton" style="height:20px;width:74px;border-radius:999px"></div>
            </div>
        </div>
    `;

    taskList.innerHTML = TASK_STATUSES.map(status => `
        <section class="board-column">
            <div class="board-column-head">
                <span class="status-dot dot-${status === "in-progress" ? "progress" : status === "completed" ? "completed" : "pending"}"></span>
                <h3>${statusLabel(status)}</h3>
            </div>
            <div class="board-cards">${card}${card}</div>
        </section>
    `).join("");
}

/* =====================================
   STATS & FILTERS
===================================== */

function updateStatistics() {
    const counts = {
        all: allTasks.length,
        pending: allTasks.filter(task => task.status === "pending").length,
        "in-progress": allTasks.filter(task => task.status === "in-progress").length,
        completed: allTasks.filter(task => task.status === "completed").length
    };

    const total = document.getElementById("totalTasks");
    const pending = document.getElementById("pendingTasks");
    const progress = document.getElementById("inProgressTasks");
    const completed = document.getElementById("completedTasks");

    if (total) total.textContent = String(counts.all);
    if (pending) pending.textContent = String(counts.pending);
    if (progress) progress.textContent = String(counts["in-progress"]);
    if (completed) completed.textContent = String(counts.completed);

    document.querySelectorAll("[data-count]").forEach(element => {
        const key = element.dataset.count;
        element.textContent = String(counts[key] ?? 0);
    });

    const percent = counts.all ? Math.round((counts.completed / counts.all) * 100) : 0;

    const progressText = document.getElementById("sidebarProgressText");
    const progressBar = document.getElementById("sidebarProgressBar");
    const completedCount = document.getElementById("completedCount");
    const totalCount = document.getElementById("totalCount");

    if (progressText) progressText.textContent = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (completedCount) completedCount.textContent = String(counts.completed);
    if (totalCount) totalCount.textContent = String(counts.all);
}

function updateFilterUI() {
    document.querySelectorAll("[data-filter]").forEach(button => {
        const active = button.dataset.filter === currentFilter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
    });

    document.querySelectorAll("[data-view]").forEach(button => {
        if (!button.classList.contains("view-btn")) return;
        const active = button.dataset.view === currentView;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
    });
}

function setFilter(filter, scroll = false) {
    currentFilter = filter;
    updateFilterUI();
    renderTasks();

    if (scroll) {
        document.getElementById("tasksPanel")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

/* =====================================
   LOAD
===================================== */

async function loadTasks(showSkeleton = true) {
    if (showSkeleton) renderSkeleton();

    try {
        const response = await apiGet("/tasks");
        allTasks = normalizeTasks(response);
        taskLoadError = "";
        updateStatistics();
        renderTasks();
    } catch (error) {
        taskLoadError = error.message || "Unable to load tasks.";
        renderTasks();
        updateStatistics();
        showToast(taskLoadError, "error");
    }
}

/* =====================================
   TASK DRAWER
===================================== */

const taskDrawer = document.getElementById("taskDrawer");
const taskForm = document.getElementById("taskForm");
let editingTaskId = null;

function openDrawer(task = null) {
    if (!taskDrawer || !taskForm) return;

    taskForm.reset();
    showMessage("taskFormMessage", "");
    taskForm.classList.toggle("is-editing", Boolean(task));

    const statusField = document.getElementById("statusField");
    const drawerTitle = document.getElementById("taskDrawerTitle");
    const drawerKicker = document.getElementById("taskDrawerKicker");
    const saveLabel = document.querySelector("#saveTask .btn-label");

    if (task) {
        editingTaskId = taskId(task);
        document.getElementById("taskId").value = editingTaskId;
        document.getElementById("taskTitle").value = task.title || "";
        document.getElementById("taskDescription").value = task.description || "";
        document.getElementById("taskPriority").value = task.priority || "medium";
        document.getElementById("taskStatus").value = task.status || "pending";
        document.getElementById("taskDueDate").value = toDateInput(task.due_date);
        if (statusField) statusField.hidden = false;
        if (drawerTitle) drawerTitle.textContent = "Edit task";
        if (drawerKicker) drawerKicker.textContent = "Update";
        if (saveLabel) saveLabel.textContent = "Save changes";
    } else {
        editingTaskId = null;
        document.getElementById("taskId").value = "";
        document.getElementById("taskPriority").value = "medium";
        document.getElementById("taskDueDate").value = "";
        if (statusField) statusField.hidden = true;
        if (drawerTitle) drawerTitle.textContent = "Create a task";
        if (drawerKicker) drawerKicker.textContent = "New task";
        if (saveLabel) saveLabel.textContent = "Create task";
    }

    taskDrawer.showModal();
    setTimeout(() => document.getElementById("taskTitle")?.focus(), 80);
}

function closeDrawer() {
    taskDrawer?.close();
}

document.getElementById("openTaskDrawer")?.addEventListener("click", () => openDrawer());
document.getElementById("closeTaskDrawer")?.addEventListener("click", closeDrawer);
document.getElementById("cancelTask")?.addEventListener("click", closeDrawer);

taskDrawer?.addEventListener("click", event => {
    if (event.target === taskDrawer) closeDrawer();
});

taskForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const priority = document.getElementById("taskPriority").value;
    const dueDate = document.getElementById("taskDueDate").value || null;
    const status = document.getElementById("taskStatus").value;
    const button = document.getElementById("saveTask");

    if (!title) {
        showMessage("taskFormMessage", "Please enter a task title.");
        document.getElementById("taskTitle").focus();
        return;
    }

    const payload = { title, description, priority, due_date: dueDate };
    if (editingTaskId) payload.status = status;

    try {
        setLoading(button, true);
        showMessage("taskFormMessage", "");

        if (editingTaskId) {
            await apiPut(`/tasks/${encodeURIComponent(editingTaskId)}`, payload);
            showToast("Task updated.");
        } else {
            await apiPost("/tasks", payload);
            showToast("Task created.");
        }

        closeDrawer();
        await loadTasks(false);
    } catch (error) {
        showMessage("taskFormMessage", error.message || "Unable to save the task.");
        showToast(error.message || "Unable to save the task.", "error");
    } finally {
        setLoading(button, false);
    }
});

/* =====================================
   TASK ACTIONS
===================================== */

const taskListElement = document.getElementById("taskList");

taskListElement?.addEventListener("click", async event => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;

    if (actionElement.dataset.action === "new") {
        openDrawer();
        return;
    }

    if (actionElement.dataset.action === "retry") {
        await loadTasks();
        return;
    }

    const holder = actionElement.closest("[data-id]");
    const id = holder?.dataset.id;
    const task = allTasks.find(item => taskId(item) === String(id));
    if (!task) return;

    const action = actionElement.dataset.action;
    closeMenus();

    if (action === "edit") {
        openDrawer(task);
        return;
    }

    if (action === "delete") {
        const confirmed = await confirmAction({
            title: "Delete this task?",
            message: `"${task.title}" will be removed permanently.`,
            confirmLabel: "Delete task"
        });

        if (!confirmed) return;

        try {
            await apiDelete(`/tasks/${encodeURIComponent(id)}`);
            showToast("Task deleted.");
            await loadTasks(false);
        } catch (error) {
            showToast(error.message || "Unable to delete the task.", "error");
        }
        return;
    }

    if (action === "status") {
        const status = actionElement.dataset.status;
        if (!status || status === task.status) return;

        try {
            await apiPut(`/tasks/${encodeURIComponent(id)}`, { status });
            showToast(`Moved to ${statusLabel(status)}.`);
            await loadTasks(false);
        } catch (error) {
            showToast(error.message || "Unable to update the task.", "error");
        }
        return;
    }

    if (action === "toggle") {
        const status = task.status === "completed" ? "pending" : "completed";

        try {
            await apiPut(`/tasks/${encodeURIComponent(id)}`, { status });
            showToast(status === "completed" ? "Task completed." : "Task reopened.");
            await loadTasks(false);
        } catch (error) {
            showToast(error.message || "Unable to update the task.", "error");
        }
    }
});

/* =====================================
   DRAG & DROP
===================================== */

taskListElement?.addEventListener("dragstart", event => {
    const card = event.target.closest(".task-card");
    if (!card) return;

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.id);
    card.classList.add("is-dragging");
});

taskListElement?.addEventListener("dragend", event => {
    event.target.closest(".task-card")?.classList.remove("is-dragging");
    document.querySelectorAll(".board-column.is-over").forEach(column => column.classList.remove("is-over"));
});

taskListElement?.addEventListener("dragover", event => {
    const column = event.target.closest(".board-column");
    if (!column) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    column.classList.add("is-over");
});

taskListElement?.addEventListener("dragleave", event => {
    const column = event.target.closest(".board-column");
    if (!column || column.contains(event.relatedTarget)) return;
    column.classList.remove("is-over");
});

taskListElement?.addEventListener("drop", async event => {
    const column = event.target.closest(".board-column");
    if (!column) return;

    event.preventDefault();
    column.classList.remove("is-over");

    const id = event.dataTransfer.getData("text/plain");
    const status = column.dataset.status;
    const task = allTasks.find(item => taskId(item) === String(id));

    if (!task || !status || task.status === status) return;

    try {
        await apiPut(`/tasks/${encodeURIComponent(id)}`, { status });
        showToast(`Moved to ${statusLabel(status)}.`);
        await loadTasks(false);
    } catch (error) {
        showToast(error.message || "Unable to move the task.", "error");
    }
});

/* =====================================
   FILTER / SEARCH / VIEW
===================================== */

document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
        const fromSidebar = button.classList.contains("side-filter");
        setFilter(button.dataset.filter || "all", fromSidebar);
        if (fromSidebar) closeSidebar();
    });
});

document.querySelectorAll(".view-btn[data-view]").forEach(button => {
    button.addEventListener("click", () => {
        currentView = button.dataset.view === "list" ? "list" : "board";
        localStorage.setItem("taskflow_view", currentView);
        updateFilterUI();
        renderTasks();
    });
});

const searchInput = document.getElementById("taskSearch");
if (searchInput) {
    searchInput.addEventListener("input", debounce(() => {
        searchQuery = searchInput.value;
        renderTasks();
    }, 140));
}

/* =====================================
   INIT
===================================== */

updateFilterUI();
loadTasks();
