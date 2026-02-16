# MosBot Dashboard

MosBot Dashboard is the **UI/control plane** for **MosBot OS**: tasks, operations visibility, org chart, and workspace browsing.

Docs live in `docs/` (start at `docs/README.md`).

## Architecture

MosBot Dashboard is part of the **MosBot OS** — a layered system that provides a user-friendly interface for OpenClaw agents.

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

1. **OpenClaw is the Source of Truth**
   - All agent definitions, hierarchy, and organizational structure live in `openclaw.json`
   - The dashboard reads and visualizes this data — it never modifies OpenClaw config directly

2. **MosBot API is the Transformation Layer**
   - Reads `openclaw.json` from the OpenClaw workspace
   - Transforms data into formats optimized for the dashboard
   - Provides REST endpoints for agents, org chart, workspaces, and tasks

3. **MosBot Dashboard is the UI Layer**
   - Consumes REST API from MosBot API
   - Provides intuitive visualization of agents, tasks, and workspaces
   - Falls back to local config when API is unavailable

### Data Flow Examples

**Org Chart:**

- OpenClaw stores agent hierarchy in `agents.list[]` with `orgChart` fields
- MosBot API reads `openclaw.json` and transforms it into `{ leadership, departments }`
- Dashboard renders the visual org chart tree

**Workspace Navigation:**

- OpenClaw defines agents with `workspace` paths in `openclaw.json`
- MosBot API filters out human-only entries and serves available workspaces
- Dashboard displays agent cards for navigation

**Runtime Status:**

- OpenClaw runs subagent sessions with labels (e.g., `mosbot-anvil`)
- MosBot API queries active sessions from OpenClaw
- Dashboard overlays live status onto the org chart

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React DnD** - Drag-and-drop functionality
- **Zustand** - Lightweight state management
- **Axios** - HTTP client for API calls
- **Heroicons** - Beautiful icon library

## Getting Started

### Prerequisites

- Node.js **20.x**
- npm
- MosBot API backend running

### Installation

```bash
# Clone the repository
git clone https://github.com/mosufy/mosbot-dashboard.git
cd mosbot-dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update API URL in .env
# VITE_API_URL=http://localhost:3000/api/v1
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# The build output will be in the dist/ folder
```

## Deployment

See:

- `docs/deployment/static-hosting.md`
- `docs/getting-started/configuration.md`
- `docs/operations/cloudflare-access.md`

## Project Structure

```bash
mosbot-dashboard/
├── src/
│   ├── api/           # API client
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── stores/        # Zustand state stores
│   ├── utils/         # Utility functions
│   ├── App.jsx        # Main app component
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── public/            # Static assets
├── .github/
│   └── workflows/     # GitHub Actions workflows
├── docs/              # Documentation
└── vite.config.js     # Vite configuration
```

## Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests once (CI mode)
npm run test:run
```

## Development Guidelines

### Adding New Features

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Run tests: `npm run test:run`
4. Build and verify: `npm run build && npm run preview`
5. Open PR to `develop` branch

### Code Style

- Use functional components with hooks
- Follow Tailwind utility-first approach
- Keep components small and focused
- Add JSDoc comments for complex functions
- Write tests for new features

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request to `develop`

## License

MIT

## Documentation

- Docs index: `docs/README.md`

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ by MosBot
