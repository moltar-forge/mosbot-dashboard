# AGENTS.md — working in this repository

This file is the **universal entrypoint for AI agents** operating in this repo.

## What this repo is

- **MosBot Dashboard**: React 18 + Vite SPA for task management, org chart, and workspace visualization.
- **Docs**: Human-oriented docs live in `docs/` (some are also agent-friendly).

## Where to read first

- **Docs index**: `docs/README.md`
- **MosBot OS overview**: `docs/mosbot-os/overview.md`
- **Local development**: `docs/getting-started/local-development.md`
- **Configuration**: `docs/getting-started/configuration.md`
- **API integration**: `docs/integrations/mosbot-api.md`
- **OpenClaw integration**: `docs/integrations/openclaw.md`
- **Permissions (UX)**: `docs/security/permissions.md`
- **Cursor rules (agent behavior + patterns)**: `.cursor/rules/overview.mdc` (and other `.cursor/rules/*.mdc`)

## Common commands

```bash
# install
npm install

# dev server (default: http://localhost:5173)
npm run dev

# production build
npm run build

# preview production build
npm run preview

# tests / lint
npm run test
npm run test:run
npm run lint
```

## Repo shape (high level)

- `src/` — React app, components, pages, stores, API client
- `src/components/` — Reusable React components
- `src/pages/` — Page-level components
- `src/stores/` — Zustand state management
- `src/api/` — Axios client and API calls
- `src/utils/` — Utility functions
- `docs/` — canonical documentation
- `.cursor/rules/` — Cursor rules for code patterns and conventions

## Tech Stack

- **React 18** with hooks (functional components)
- **Vite** for build and dev server
- **Tailwind CSS** for styling (utility-first)
- **Zustand** for state management
- **Axios** for HTTP client
- **React DnD** for drag-and-drop
- **Heroicons** for icons
- **Vitest** for testing

## Architecture Context

MosBot Dashboard is the **UI layer** of **MosBot OS**:

```bash
┌─────────────────────────────────────────────┐
│         MosBot Dashboard (UI Layer)         │
│  React SPA - User-friendly interface for    │
│  task management, org chart, and workspace  │
│  visualization                              │
└─────────────────┬───────────────────────────┘
                  │ REST API
                  │
┌─────────────────▼───────────────────────────┐
│        MosBot API (Backend Proxy)           │
│  Node.js/Express - Transforms and serves    │
│  OpenClaw data via REST endpoints           │
└─────────────────┬───────────────────────────┘
                  │ File/HTTP API
                  │
┌─────────────────▼───────────────────────────┐
│      OpenClaw (Source of Truth)             │
│  AI Agent Runtime - Manages agents,          │
│  workspaces, and configuration in            │
│  openclaw.json                              │
└─────────────────────────────────────────────┘
```

### Key Principles

1. **OpenClaw is the Source of Truth** — All agent definitions and org structure live in `openclaw.json`.
2. **MosBot API is the Transformation Layer** — Reads OpenClaw data and provides REST endpoints.
3. **MosBot Dashboard is the UI Layer** — Consumes REST API and provides visualization.

## Documentation conventions

- Prefer updating canonical docs in `docs/` rather than adding new root-level markdown files.
- If replacing an older doc, keep it as a short pointer page and preserve original content under `docs/archive/` when useful.
- Engineering patterns and code conventions live in `.cursor/rules/`, not in `docs/`.
