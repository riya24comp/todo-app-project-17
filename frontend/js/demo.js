/* =====================================
   TASKFLOW — DEMO BACKEND
   Mirrors the planned REST API using localStorage.
===================================== */

const DemoDB = (() => {
    const STORAGE_KEY = "taskflow_demo_db_v1";
    const DEMO_PASSWORD = "password123";

    let memory = null;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const makeId = prefix => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

    const at = (offsetDays, hour = 9) => {
        const date = new Date();
        date.setDate(date.getDate() + offsetDays);
        date.setHours(hour, 0, 0, 0);
        return date.toISOString();
    };

    const fail = (message, status = 400) => {
        const error = new Error(message);
        error.status = status;
        return error;
    };

    function seed() {
        const users = [
            { id: "u_admin", name: "Admin User", email: "admin@test.com", password: DEMO_PASSWORD, role: "admin", created_at: at(-46) },
            { id: "u_john", name: "John Doe", email: "john@test.com", password: DEMO_PASSWORD, role: "user", created_at: at(-38) },
            { id: "u_maya", name: "Maya Patel", email: "maya@test.com", password: DEMO_PASSWORD, role: "user", created_at: at(-24) },
            { id: "u_arjun", name: "Arjun Singh", email: "arjun@test.com", password: DEMO_PASSWORD, role: "user", created_at: at(-11) }
        ];

        const tasks = [
            { id: "t_01", user_id: "u_john", title: "Finalize Q4 product roadmap", description: "Align the roadmap with the design and engineering leads before Friday.", status: "in-progress", priority: "high", due_date: at(2), created_at: at(-8) },
            { id: "t_02", user_id: "u_john", title: "Fix login redirect on expired session", description: "Expired tokens should return the user to the login page without losing the current route.", status: "pending", priority: "high", due_date: at(-1), created_at: at(-6) },
            { id: "t_03", user_id: "u_john", title: "Write onboarding documentation", description: "Cover account setup, creating a task and moving it across the board.", status: "pending", priority: "medium", due_date: at(5), created_at: at(-5) },
            { id: "t_04", user_id: "u_john", title: "Design empty states for the task board", description: "Add helpful illustrations and a clear next action for every column.", status: "in-progress", priority: "medium", due_date: at(1), created_at: at(-4) },
            { id: "t_05", user_id: "u_john", title: "Review pull request #42", description: "Check the API contract, error handling and test coverage.", status: "completed", priority: "low", due_date: at(-3), created_at: at(-9) },
            { id: "t_06", user_id: "u_john", title: "Prepare sprint demo slides", description: "Summarize shipped work and the next sprint focus.", status: "completed", priority: "high", due_date: at(0), created_at: at(-3) },
            { id: "t_07", user_id: "u_john", title: "Update dependency lockfile", description: "Patch minor versions and verify the build still passes.", status: "pending", priority: "low", due_date: at(7), created_at: at(-2) },
            { id: "t_08", user_id: "u_john", title: "Draft internship progress report", description: "Include the frontend redesign and the demo-mode architecture.", status: "completed", priority: "medium", due_date: at(-5), created_at: at(-12) },
            { id: "t_09", user_id: "u_maya", title: "Audit admin table accessibility", description: "Verify focus order, labels and contrast on every table action.", status: "in-progress", priority: "high", due_date: at(3), created_at: at(-7) },
            { id: "t_10", user_id: "u_maya", title: "Refresh dashboard metrics", description: "Replace placeholder numbers with live counts from the API.", status: "pending", priority: "medium", due_date: at(4), created_at: at(-4) },
            { id: "t_11", user_id: "u_maya", title: "Clean up analytics events", description: "Remove duplicate events and document the remaining schema.", status: "completed", priority: "low", due_date: at(-6), created_at: at(-14) },
            { id: "t_12", user_id: "u_arjun", title: "Migrate user avatars to initials", description: "Remove the external avatar service and generate initials locally.", status: "pending", priority: "low", due_date: at(6), created_at: at(-3) },
            { id: "t_13", user_id: "u_arjun", title: "Add CSV export for tasks", description: "Export the filtered admin task list with owner and status columns.", status: "completed", priority: "medium", due_date: at(-2), created_at: at(-10) },
            { id: "t_14", user_id: "u_admin", title: "Review workspace permissions", description: "Confirm admins are read-only and users can only manage their own tasks.", status: "pending", priority: "high", due_date: at(2), created_at: at(-1) }
        ];

        return { users, tasks };
    }

    function persist() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
        } catch (error) {
            // Storage may be unavailable in private browsing; memory still works.
        }
    }

    function read() {
        if (memory) return memory;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed?.users) && Array.isArray(parsed?.tasks)) {
                    memory = parsed;
                    return memory;
                }
            }
        } catch (error) {
            memory = null;
        }

        memory = seed();
        persist();
        return memory;
    }

    function reset() {
        memory = seed();
        persist();
        return memory;
    }

    function safeUser(user) {
        if (!user) return null;
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        };
    }

    function base64Url(value) {
        return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    function createToken(user) {
        const header = base64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
        const payload = base64Url(JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
        }));
        return `${header}.${payload}.demo`;
    }

    function currentUser(db) {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const payload = decodeToken(token);
        if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) return null;

        return db.users.find(user => user.id === payload.id) || null;
    }

    function taskForUser(userId) {
        return db => db.tasks.filter(task => task.user_id === userId);
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    async function request(method, endpoint, body = null) {
        await wait(APP_CONFIG.DEMO_LATENCY);

        const db = read();
        const path = endpoint.split("?")[0];
        const parts = path.split("/").filter(Boolean);
        const verb = method.toUpperCase();

        /* Auth */
        if (verb === "POST" && path === "/auth/login") {
            const email = String(body?.email || "").trim().toLowerCase();
            const password = String(body?.password || "");
            const user = db.users.find(item => item.email.toLowerCase() === email);

            if (!user || user.password !== password) {
                throw fail("Incorrect email or password. Please try again.", 401);
            }

            return { token: createToken(user), user: safeUser(user) };
        }

        if (verb === "POST" && path === "/auth/register") {
            const name = String(body?.name || "").trim();
            const email = String(body?.email || "").trim().toLowerCase();
            const password = String(body?.password || "");

            if (!name || !email || !password) throw fail("Name, email and password are required.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail("Please enter a valid email address.");
            if (password.length < 6) throw fail("Password must be at least 6 characters.");
            if (db.users.some(item => item.email.toLowerCase() === email)) {
                throw fail("An account with this email already exists.", 409);
            }

            const user = {
                id: makeId("u"),
                name,
                email,
                password,
                role: "user",
                created_at: new Date().toISOString()
            };

            db.users.push(user);
            persist();

            return { message: "Account created.", user: safeUser(user) };
        }

        /* Authenticated routes */
        const user = currentUser(db);
        if (!user) throw fail("Session expired. Please login again.", 401);

        if (verb === "GET" && path === "/tasks") {
            return { tasks: sortByDueDate(clone(db.tasks.filter(task => task.user_id === user.id))) };
        }

        if (verb === "POST" && path === "/tasks") {
            const title = String(body?.title || "").trim();
            if (!title) throw fail("Task title is required.");

            const task = {
                id: makeId("t"),
                user_id: user.id,
                title,
                description: String(body?.description || "").trim(),
                status: ["pending", "in-progress", "completed"].includes(body?.status) ? body.status : "pending",
                priority: ["low", "medium", "high"].includes(body?.priority) ? body.priority : "medium",
                due_date: body?.due_date ? new Date(body.due_date).toISOString() : null,
                created_at: new Date().toISOString()
            };

            db.tasks.push(task);
            persist();
            return { message: "Task created.", task: clone(task) };
        }

        if (parts[0] === "tasks" && parts[1]) {
            const task = db.tasks.find(item => item.id === parts[1] && item.user_id === user.id);
            if (!task) throw fail("Task not found.", 404);

            if (verb === "PUT") {
                if (body?.title !== undefined) {
                    const title = String(body.title).trim();
                    if (!title) throw fail("Task title is required.");
                    task.title = title;
                }
                if (body?.description !== undefined) task.description = String(body.description).trim();
                if (body?.status !== undefined) {
                    if (!["pending", "in-progress", "completed"].includes(body.status)) throw fail("Invalid status.");
                    task.status = body.status;
                }
                if (body?.priority !== undefined) {
                    if (!["low", "medium", "high"].includes(body.priority)) throw fail("Invalid priority.");
                    task.priority = body.priority;
                }
                if (body?.due_date !== undefined) {
                    task.due_date = body.due_date ? new Date(body.due_date).toISOString() : null;
                }

                persist();
                return { message: "Task updated.", task: clone(task) };
            }

            if (verb === "DELETE") {
                db.tasks = db.tasks.filter(item => item.id !== parts[1]);
                persist();
                return { message: "Task deleted." };
            }
        }

        /* Admin routes */
        if (parts[0] === "admin") {
            if (user.role !== "admin") throw fail("You are not authorized to perform this action.", 403);

            if (verb === "GET" && parts[1] === "users") {
                return { users: db.users.map(safeUser) };
            }

            if (verb === "GET" && parts[1] === "tasks") {
                const tasks = db.tasks.map(task => {
                    const owner = db.users.find(item => item.id === task.user_id);
                    return {
                        ...clone(task),
                        user_id: owner
                            ? { id: owner.id, name: owner.name, email: owner.email }
                            : null
                    };
                });

                return { tasks: tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) };
            }
        }

        throw fail("Endpoint not found.", 404);
    }

    return {
        request,
        reset,
        credentials: {
            admin: { email: "admin@test.com", password: DEMO_PASSWORD },
            user: { email: "john@test.com", password: DEMO_PASSWORD }
        }
    };
})();
