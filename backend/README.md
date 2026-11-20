# TaskFlow backend

The Express API serves the frontend and persists users and tasks in MongoDB.

## Run locally

1. Install the project dependencies from the project root with `npm install`.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and a private `JWT_SECRET` of at least 32 characters.
3. Start MongoDB, then run `npm run seed` from the project root to add the sample accounts and tasks.
4. Run `npm start` from the project root and open <http://localhost:5000>.

The seeded accounts are `john@test.com` and `admin@test.com`, both with password `password123`. Change these credentials before using seeded data outside local development.

## API

- `POST /api/auth/register` — create a user; returns `{ message, user }`.
- `POST /api/auth/login` — authenticate; returns `{ token, user }`.
- `GET /api/tasks` — list the authenticated user's tasks as `{ tasks }`.
- `POST /api/tasks` — create a task; returns `{ message, task }`.
- `PUT /api/tasks/:id` — update task fields; returns `{ message, task }`.
- `DELETE /api/tasks/:id` — delete an owned task; returns `{ message }`.
- `GET /api/admin/users` and `GET /api/admin/tasks` — admin-only workspace data.
- `GET /api/health` — API and database connection status.

Task fields use `title`, `description`, `status`, `priority`, and `due_date`. Status values are `pending`, `in-progress`, and `completed`; priority values are `low`, `medium`, and `high`. Authenticated requests use `Authorization: Bearer <token>`.
