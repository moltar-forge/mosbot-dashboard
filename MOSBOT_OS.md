# MosBot OS

MosBot OS is a **self-hosted operating system for agent work**, operated primarily through the **MosBot OS Dashboard**.

It’s built for two audiences:

- **Humans/operators**: a clear UI to plan, execute, and review work.
- **Agents**: a stable, legible operational environment where work is captured as tasks, decisions are written down, and artifacts live in shared workspaces.

---

## The MosBot OS mental model

### Tasks are the unit of work

Everything important in MosBot OS should map to a **task**.

- Tasks are durable and reviewable (not ephemeral chat).
- Tasks have a status pipeline, and status is the primary “truth” of what’s happening.
- Tasks are collaborative: humans and agents leave **Comments** and the system keeps **History**.

### The dashboard is the control plane

If you’re operating MosBot OS, you’ll spend nearly all your time in:

- **Kanban** (work state and prioritization)
- **Task Manager** (runtime visibility: sessions/metrics + cron jobs)
- **Org Chart** (system structure and capability map)
- **Workspaces + Docs** (shared artifacts and durable knowledge)
- **Activity Log** (narrative timeline across the system)

---

## Navigation map (key pages)

MosBot OS is organized into these main pages in the sidebar:

- **Task Manager** (Overview)
- **Kanban**
- **Org Chart**
- **Workspaces**
- **Docs**
- **Activity Log**
- **Settings**
- **Archived**

---

## Kanban (day-to-day task operations)

The **Kanban Board** is the primary place to run work.

### Status pipeline

Tasks flow through these columns:

- `PLANNING`
- `TO DO`
- `IN PROGRESS`
- `DONE`

Archived work (`ARCHIVE`) is intentionally handled on a separate page (see **Archived**).

### What Kanban is optimized for

- **Drag-and-drop workflow control**: moving a card changes task status.
- **Fast scanning + search**: filter to find the current “needle.”
- **Quick task creation**: create tasks as soon as work exists (even before details are perfect).

### Opening a task

Clicking a task opens the **Task Detail Modal**, which is the “control panel” for that task (fields, comments, history, activity, relationships).

---

## Task Detail Modal (the task control panel)

The task modal is where tasks become operationally useful: it consolidates state, discussion, audit history, and supporting context.

### Core task fields

Tasks commonly include:

- **Title** (short, scannable)
- **Description** (Markdown-friendly; should contain enough context to execute)
- **Status**, **Type**, **Priority**
  - Types include: `task`, `bug`, `feature`, `improvement`, `research`, `epic`
- **Assignee** (selected from active users)
- **Due date**
- **Tags** (normalized: trimmed, lowercased, deduped)
- **Epic/parent task** (for organizing subtasks under an epic)
- **Preferred model** (optional): choose the AI model used when the system executes the task; leave unset to use the system default.

### Tabs (default-first, lazy loaded)

The modal is organized into tabs that load on demand:

- **Comments**: the primary collaboration surface (decisions, progress notes, outcomes).
- **History**: audit trail of changes (“what changed and when”).
- **Activity**: system activity entries associated with this task (timeline-style operational events).

### Shareable deep links

Tasks can be opened directly via a URL (useful for handing off a task to a human/operator or another agent without losing context).

---

## Task Manager (overview / operations dashboard)

The **Task Manager Overview** is the runtime operations view of MosBot OS.

### Purpose

- Real-time monitoring of **agent sessions** and **task metrics**
- Quick health check: “is anything running, stuck, or idle?”

### What you’ll see

- Session KPIs: **Running / Active / Idle / Total**
- Usage metrics: **Tokens Used** and **Total Cost** (derived from session data)
- Session lists:
  - **Active Sessions** (running + active)
  - **Idle Sessions**
- **Cron Jobs**: scheduled automation configuration and visibility

### Update behavior

- Auto-refresh runs periodically
- Refresh is triggered when the browser tab becomes visible again

---

## Org Chart (system structure and capability map)

The **Organization Chart** is the “map” of your multi-agent system.

### What the Org Chart shows

- Understand the hierarchy (leadership + departments)
- See capability ownership (which agent/domain handles what)
- Overlay live status to answer: “who is active right now?”

### Status semantics (badges)

Nodes may appear with:

- **Active**: live-running
- **Scaffolded**: planned/placeholder capability
- **Deprecated**: intentionally retired
- **You**: used for human/operator nodes (when configured)

### Configuration behavior

The dashboard attempts to load org chart configuration dynamically and will fall back to a built-in default structure if it can’t.

---

## Workspaces (shared filesystem view)

Workspaces are the shared artifact layer of MosBot OS: files, notes, specs, and operational outputs.

### What Workspaces provide

- Browse and preview files for a selected agent/workspace root.
- Navigate via **breadcrumbs** and **deep links** (URL reflects selection).

### Key UX concepts

- **Agent selector**: switch between workspace roots.
- **Tree view**: expand folders on demand (one level at a time).
- **Flat view**: list the current directory as a simple list.
- **Filter**: narrow within the current directory.
- **Preview pane**: shows selected file content when permitted.

### Permissions (role-based behavior)

MosBot OS separates “see structure” from “read/modify contents”:

- **All authenticated users** can browse workspace structure and file metadata.
- **Only elevated roles** can modify workspace content (create file/folder, rename, delete, move).
- If you lack permission to view a file’s contents, the UI shows an access-restricted view instead of displaying content.

---

## Docs (shared documentation space)

Docs is a dedicated workspace for durable system knowledge.

- **Root path**: `/workspace/docs`
- **Purpose**:
  - Runbooks, specs, policies, and decision records
  - Shared context for humans and agents (what to read before acting)
- **Behavior**:
  - The dashboard ensures the docs directory exists when possible, then opens it with the same workspace explorer UX.

Recommended: if something should still be true next month, put it in Docs.

---

## Activity Log (narrative timeline)

The **Activity Log** is the chronological narrative of MosBot OS.

- Grouped by day (newest first)
- Entries can link directly to tasks for context

Use it to answer “what happened?” without opening every task.

---

## Archived (long-term completed work)

The **Archived Tasks** page is where completed work goes when it is no longer active.

- View tasks in `ARCHIVE`
- Restore tasks back into active flow by updating status from within the task modal
- UX note: the UI indicates tasks done for **7+ days** will appear here

---

## Settings (users and roles)

Settings is the operator surface for user management and access control.

- **All authenticated users** can view the user list (view-only mode).
- **Only admins/owners** can modify users (create, edit, delete).

Roles used by MosBot OS:

- **owner**: highest privilege
- **admin**: administrative privilege
- **agent**: privileged operational role (often treated as elevated)
- **user**: standard least-privilege role

---

## Collaboration norms (humans + agents)

### For humans/operators

- **Operate by Kanban status**: status is the primary truth of work state.
- **Use Comments for narrative**: decisions, progress, blockers, outcomes.
- **Use History for audit**: resolve “what changed and when.”
- **Use Docs for durable truth**: if it matters later, document it.

### For agents

Keep MosBot OS legible for humans:

- Write scannable titles and complete descriptions.
- Use tags to route and cluster work.
- Leave a comment when a key decision is made or a task is completed.
- Set **Preferred model** only when it materially affects outcome or cost; otherwise leave it unset.

---

## Glossary

- **Task**: the durable unit of work in MosBot OS.
- **Kanban**: the status pipeline view of tasks.
- **Task Manager**: runtime/operations view (sessions + metrics + cron jobs).
- **Org Chart**: system structure and capability map.
- **Workspace**: browsable shared filesystem view, permissioned by role.
- **Docs**: shared documentation workspace at `/workspace/docs`.
- **Activity Log**: chronological narrative stream of actions/events.
