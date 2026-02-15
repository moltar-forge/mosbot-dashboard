# MosBot Dashboard

A self-hosted, dark-themed Kanban task management dashboard for autonomous AI agents.

![MosBot Dashboard](https://via.placeholder.com/1200x600/1e293b/60a5fa?text=MosBot+Dashboard)

## Features

- 🎯 **Kanban Board** - Drag-and-drop task management across TO DO, IN PROGRESS, DONE, and ARCHIVE columns
- 🎨 **Dark Theme** - Beautiful, modern UI optimized for extended use
- 🏷️ **Priority System** - Organize tasks with Low, Medium, High, and Urgent priorities
- 📅 **Due Dates** - Track deadlines with intuitive date pickers
- 👤 **Assignees** - Assign tasks to team members
- 📊 **Activity Log** - View all task activity and changes
- 📚 **Documentation** - Built-in docs for quick reference
- 🔒 **Self-Hosted** - Complete data ownership and privacy

## Architecture

MosBot Dashboard is part of the **MosBot OS** — a layered system that provides a user-friendly interface for OpenClaw agents.

```
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

- Node.js 18+
- npm or yarn
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

The dashboard is deployed as a static website on AWS S3 + CloudFront CDN.

### Automated Deployment (GitHub Actions)

Pushes to `develop` or `master` branches automatically trigger deployment via GitHub Actions.

#### Required GitHub Secrets

Configure these secrets in your repository (Settings → Secrets and variables → Actions):

| Secret | Description | Example |
| ------ | ----------- | ------- |
| `AWS_ACCESS_KEY_ID` | AWS access key for deployment | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region for S3 bucket | `us-east-1` |
| `S3_BUCKET_NAME` | S3 bucket name | `mosbot-dashboard` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID | `E1234567890ABC` |
| `VITE_API_URL` | Production API URL | `https://api.yourdomain.com/api/v1` |

#### IAM Policy for Deployment

The AWS user needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::YOUR-ACCOUNT-ID:distribution/YOUR-DISTRIBUTION-ID"
    }
  ]
}
```

#### Deployment Workflow

The GitHub Actions workflow (`.github/workflows/build-deploy.yml`):

1. ✅ Runs tests
2. ✅ Builds the React app with production environment variables
3. ✅ Syncs `dist/` to S3 with optimized caching:
   - Static assets (JS, CSS, images): cached for 1 year
   - `index.html`: no cache (always fresh)
4. ✅ Invalidates CloudFront cache for immediate updates

### Manual Deployment

If you need to deploy manually:

```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync dist/ s3://YOUR-BUCKET-NAME/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://YOUR-BUCKET-NAME/index.html \
  --cache-control "public, max-age=0, must-revalidate"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `VITE_API_URL` | MosBot API backend URL | `http://localhost:3000/api/v1` |
| `VITE_API_TIMEOUT` | API request timeout (ms) | `5000` |
| `VITE_APP_NAME` | Application name | `MosBot` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

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

### Workspace Features

- **[Workspace Documentation Index](./docs/WORKSPACE_README.md)** - Complete workspace file management docs
- **[Quick Reference](./docs/WORKSPACE_QUICK_REFERENCE.md)** - Common tasks and shortcuts
- **[Features Guide](./docs/WORKSPACE_FEATURES_GUIDE.md)** - Visual guide with examples

### Other Features

- [Auto-refresh Feature](./docs/auto-refresh-feature.md)
- [User List Permissions](./docs/user-list-permissions-frontend.md)
- [File Metadata Display](./docs/file-metadata-display.md)
- [Cloudflare Access Setup](./docs/cloudflare-access-setup.md)

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ by MosBot
