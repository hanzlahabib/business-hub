# Development Setup

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) or npm

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd schedule-manager

# Install dependencies
pnpm install
```

## Running the App

You need **three processes** running:

### 1. JSON Server (Data Backend)

```bash
pnpm run db
# Runs on http://localhost:3005
```

This serves `db.json` as a REST API. All CRUD operations are persisted to the file.

### 2. Express API Server

```bash
node server/index.js
# Runs on http://localhost:3002
```

Handles email, file uploads, and other server-side operations.

### 3. Vite Dev Server

```bash
pnpm run dev
# Runs on http://localhost:5175
```

Open [http://localhost:5175](http://localhost:5175) — the app will redirect to `/login`.

**Default credentials:** `admin@example.com` / `admin123`

## Environment

The app uses `import.meta.env.MODE` to determine the environment:

| Mode          | JSON Server        | API Server          |
|---------------|--------------------|---------------------|
| `development` | `localhost:3005`   | `localhost:3002`    |
| `staging`     | staging URLs       | staging URLs        |
| `production`  | production URLs    | production URLs     |

Configuration is in `src/config/api.ts`.

## Building for Production

```bash
pnpm build     # Output to dist/
pnpm preview   # Preview the production build
```

## Troubleshooting

| Issue                       | Solution                                         |
|-----------------------------|--------------------------------------------------|
| Port 3005 in use            | Kill existing JSON Server: `lsof -i :3005`       |
| Port 3002 in use            | Kill existing API server: `lsof -i :3002`        |
| Login not working           | Ensure JSON Server is running on port 3005        |
| Blank page after login      | Check browser console for errors                  |
| Build fails                 | Run `pnpm install` then `pnpm build`              |
