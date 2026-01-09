### Team Task Manager (React + Express + MongoDB)

A role-based, team-based task management system.

### Prerequisites

- Node.js 18+ (recommended)
- MongoDB Atlas (or any MongoDB URI)

---

### Setup

#### 1) Backend environment

Create `backend/.env` (not committed) with:

```env
PORT=4000

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/<dbName>?retryWrites=true&w=majority
JWT_SECRET=replace_me_with_a_long_random_secret
JWT_EXPIRES_IN=7d

```

#### 2) Install dependencies

```bash
cd backend
npm install
```

```bash
cd ../frontend
npm install
```


#### 3) Run the apps

Backend:

```bash
cd backend
npm run dev
```

Frontend:

#### frontend environment

```env
VITE_API_URL = https://alobha-tech-task.onrender.com/api
```

```bash
cd frontend
npm run dev
```

Open the UI: `http://localhost:5173`

---

### Default demo login

- **Email**: `admin@demo.com`
- **Password**: `Admin@12345`

---

### Roles & access model (important)

- **Super Admin (global role)**:
  - Creates teams
  - Manages users
  - Has access to everything
- **Team Admin (global role)**:
  - Can manage team members and tasks only for teams they belong to
- **Team Member**:
  - Can access tasks only inside assigned teams
  - Can update tasks they created or are assigned to

Team permissions are determined by **team membership**:
- A user must be in `Team.members[]` to access that team.
- Within a team, `teamRole` is either `ADMIN` or `MEMBER`.

Task rules enforced:
- Each task belongs to exactly one team (`task.teamId`)
- Users can access tasks only for teams they are assigned to
- A task can be assigned only to a user in the same team
- Deletion is **soft delete** (`deletedAt`)

---

### API overview

Base URL: `http://localhost:4000/api`

Auth: send `Authorization: Bearer <token>` for protected routes.

#### Auth

- `POST /auth/login`
- `GET /auth/me`

#### Users (Super Admin only)

- `GET /users`
- `POST /users`
- `PATCH /users/:userId`

#### Teams

- `GET /teams`
- `POST /teams` (Super Admin only)
- `GET /teams/:teamId`
- `GET /teams/:teamId/user-candidates` (team admin only)
- `POST /teams/:teamId/members` (team admin only)
- `PATCH /teams/:teamId/members/:userId` (team admin only)
- `DELETE /teams/:teamId/members/:userId` (team admin only)

#### Tasks

- `GET /tasks?teamId=...&q=...&status=...&assigneeId=...&sort=...&page=...&pageSize=...`
- `POST /tasks`
- `GET /tasks/:taskId`
- `PATCH /tasks/:taskId`
- `DELETE /tasks/:taskId` (soft delete; team admin only)

#### Dashboard

- `GET /dashboard/teams/:teamId/summary`

---

### Postman

Import these files:
- `postman/Alobha-Team-Task-Manager.postman_collection.json`
- `postman/Local.postman_environment.json`

Login request stores the token automatically.

---

### Folder structure

#### Backend

```
backend/
  package.json
  src/
    app.js
    server.js
    config/
      db.js
      env.js
    controllers/
      auth.controller.js
      users.controller.js
      teams.controller.js
      tasks.controller.js
      dashboard.controller.js
    middleware/
      requireAuth.js
      requireRole.js
      teamAccess.js
    models/
      User.js
      Team.js
      Task.js
    routes/
      auth.routes.js
      users.routes.js
      teams.routes.js
      tasks.routes.js
      dashboard.routes.js
    scripts/
      seed-super-admin.js
    services/
      auth.service.js
      users.service.js
      teams.service.js
      tasks.service.js
      dashboard.service.js
    utils/
      auth.js
```

#### Frontend

```
frontend/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    router.jsx
    styles.css
    lib/
      api.js
    state/
      auth.jsx
    components/
      Badges.jsx
      Modal.jsx
    views/
      Login.jsx
      RequireAuth.jsx
      Teams.jsx
      Team.jsx
      Users.jsx
      layout/
        AppShell.jsx
      team/
        Tasks.jsx
        TaskEditor.jsx
        Members.jsx
```


