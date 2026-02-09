# Business Hub — Schedule Manager

A comprehensive content management and scheduling platform built with React, TypeScript, and Vite. Manage videos, templates, jobs, leads, skill mastery, and more from a single dashboard.

## Features

- **Content Scheduling** — Calendar & list views with drag-and-drop
- **Template System** — Block-based editor with versioning, comments, and folders
- **Skill Mastery** — Gamified learning paths with lessons, practice, and quizzes
- **Job Tracker** — Track applications with pipeline stages
- **Lead Management** — Kanban board for business leads
- **Content Studio** — Video planning and script management
- **Task Boards** — Flexible task management boards
- **Authentication** — Login/register with route protection

## Quick Start

```bash
# Install dependencies
pnpm install

# Start JSON Server (data backend on port 3005)
pnpm run db

# Start API server (port 3002)
node server/index.js

# Start dev server (port 5175)
pnpm run dev
```

Open [http://localhost:5175](http://localhost:5175) in your browser.

**Default login:** `admin@example.com` / `admin123`

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | React 18 + TypeScript               |
| Build       | Vite 7                              |
| Routing     | React Router v7                     |
| Styling     | CSS custom properties (dark/light)  |
| Animations  | Framer Motion                       |
| Data        | JSON Server (REST API)              |
| Charts      | Recharts                            |
| Icons       | Lucide React                        |

## Project Structure

```
src/
├── components/       # Shared UI components
│   ├── Auth/         # Login, Register, ProtectedRoute
│   ├── Calendar/     # Week view, filters
│   ├── ErrorBoundary/# Error handling components
│   ├── Forms/        # Add/edit content modals
│   └── ui/           # Button, Dialog, etc.
├── config/           # API urls, constants
├── contexts/         # AuthContext
├── hooks/            # Global hooks (useSchedule, useAuth, etc.)
├── modules/          # Feature modules
│   ├── contentStudio/
│   ├── jobs/
│   ├── leads/
│   ├── pipeline/
│   ├── skillMastery/
│   ├── taskboards/
│   └── templates/
├── shared/           # Shared components & hooks
├── utils/            # apiClient, errorHandler
├── routes.tsx        # Route definitions
└── main.tsx          # Entry point
server/
├── index.js          # Express API server
└── routes/           # API route handlers
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture, [docs/API.md](docs/API.md) for API reference, and [docs/SETUP.md](docs/SETUP.md) for development setup.

## Scripts

| Command          | Description                    |
|------------------|--------------------------------|
| `pnpm dev`       | Start Vite dev server          |
| `pnpm build`     | Production build               |
| `pnpm preview`   | Preview production build       |
| `pnpm lint`      | Run ESLint                     |
| `pnpm run db`    | Start JSON Server on port 3005 |

## License

Private project — all rights reserved.
