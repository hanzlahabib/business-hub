# Architecture

## Overview

Business Hub is a single-page application (SPA) using a modular architecture. Each major feature is a self-contained module with its own components, hooks, and data layer.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│                     Browser                           │
│  ┌───────────────────────────────────────────────┐   │
│  │ React SPA (Vite)                              │   │
│  │  ┌─────────────────────────────────────────┐  │   │
│  │  │ ErrorBoundary → AuthProvider → Router   │  │   │
│  │  │  ┌───────────────────────────────────┐  │  │   │
│  │  │  │  App Layout (Sidebar + Content)   │  │  │   │
│  │  │  │   ├── ProtectedRoute              │  │  │   │
│  │  │  │   ├── Module Views                │  │  │   │
│  │  │  │   └── Shared Components           │  │  │   │
│  │  │  └───────────────────────────────────┘  │  │   │
│  │  └─────────────────────────────────────────┘  │   │
│  └───────────────────────────────────────────────┘   │
│              │ fetch                │ fetch           │
│              ▼                      ▼                 │
│     JSON Server :3005        Express API :3002        │
│     (db.json data)           (email, uploads)         │
└──────────────────────────────────────────────────────┘
```

## Module Structure

Each module follows this pattern:

```
modules/<name>/
├── components/     # UI components
├── hooks/          # Data & logic hooks
├── data/           # Static data (optional)
└── index.ts        # Public API (re-exports)
```

### Modules

| Module         | Purpose                              |
|----------------|--------------------------------------|
| `contentStudio`| Video content planning & scripts     |
| `jobs`         | Job application tracking             |
| `leads`        | Business lead management (Kanban)    |
| `pipeline`     | Content pipeline with analytics      |
| `skillMastery` | Gamified learning system             |
| `taskboards`   | Flexible task management             |
| `templates`    | Block-based template editor          |

## Data Flow

1. **Hooks** fetch data from JSON Server via `fetch()` or `apiClient`
2. **Components** consume hooks and render UI
3. **Mutations** (create, update, delete) go through hooks → JSON Server REST API
4. **Auth state** managed via `AuthContext` with `localStorage` persistence

## Authentication Flow

```
Login → POST check against /users → Store in AuthContext + localStorage
         │
         ▼
  ProtectedRoute checks AuthContext
         │
    ┌────┴────┐
    │ Logged  │ Not logged in
    │   in    │ → Redirect /login
    │         │
    ▼         
  Render App
```

## Theming

CSS custom properties defined in `index.css` with `:root` (light) and `.dark` (dark) selectors. Theme toggle managed by `useTheme` hook with `localStorage` persistence.

Key CSS variables: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--accent-primary`, `--border`, etc.

## Error Handling

- **ErrorBoundary** — Top-level catch for React rendering errors
- **ModuleErrorBoundary** — Per-module error isolation  
- **apiClient** — Retry logic with exponential backoff
- **errorHandler** — Severity-based logging + user-friendly messages
