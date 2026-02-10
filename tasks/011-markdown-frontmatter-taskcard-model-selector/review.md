# Code Review: Markdown Frontmatter + TaskCard AI Model Selector

**Summary**:
- Adds `remark-frontmatter` to strip YAML frontmatter from markdown (MarkdownRenderer)
- Adds per-task AI model selector dropdown to TaskCard
- Linting errors and 4 failing tests must be fixed before merge
- Performance: N+1 `/models` API calls when many TaskCards are visible

---

## Review Context

- **Review Target**: staged
- **Scope**: 6 files (~150 LOC changed): package.json, package-lock.json, MarkdownRenderer.jsx, MarkdownRenderer.test.jsx, TaskCard.jsx, TaskCard.test.jsx
- **Risk Level**: Medium
- **Technology Stack**: React 18, Vite, Vitest, Zustand, Axios (from `.cursor/rules/`)
- **SQL Analysis**: Skipped - no database-related changes (pure frontend: components, tests, dependencies)
- **Database Stack**: N/A

---

## Findings

### Automated Checks

- **Linting**: ⚠️ Partial — TaskCard.test.jsx fixed. Remaining: `helpers.js:79,82` (pre-existing), `MarkdownRenderer.test.jsx:216,217` (console warnings)
- **Type Checking**: N/A (JavaScript project)
- **Unit Tests**: ✅ Pass — All 462 tests pass (TaskCard API mock fixed)
- **Integration Tests**: N/A
- **E2E Tests**: N/A
- **SQL Analysis**: Skipped - no database changes
- **Security Scan**: ⚠️ Failed to execute — `npm audit` could not run (EPERM/sandbox). Recommend running `npm audit` locally before merge. New dependency `remark-frontmatter` added; verify no known vulnerabilities.

### Core Code Quality

- **Scope Discipline** — Changes are focused. MarkdownRenderer frontmatter and TaskCard model selector are coherent. No unrelated refactors.
- **Technical Debt Comments** — None added.
- **Type Safety** — PropTypes not added for new TaskCard behavior; acceptable for existing patterns.
- **Validation** — Model selection validated via store; API errors caught.
- **Resilience** — Double-submission guard (`isUpdatingModel`) present. Loading/disabled states on selector.
- **Error handling** — 🟡 **TaskCard.jsx:95** uses `console.error`; project prefers `logger` from `src/utils/logger.js`.
- **Caching** — 🟠 **Performance**: TaskCard fetches `/models` on every card mount. Boards with many cards trigger N+1 API calls. Per `performance-patterns.mdc`, prefer shared store or parent-fetched list.
- **Observability** — Console used instead of logger for errors.
- **Tests** — 🟠 **TaskCard.test.jsx** mocks `global.fetch` but component uses `api.get` (Axios). Mocks never intercept the real request; models stay empty and 4 tests fail.
- **Project Standards** — 🟡 **Quote style**: New TaskCard code uses single quotes; `code-style.mdc` requires double quotes for string literals and API endpoints.

### SQL & Database Quality

N/A — No database changes.

### Deployment Risk Analysis

#### 1. Mutable State & Shared References

🟢 Low risk. Local component state; no shared mutable references.

#### 2. Configuration & Environment Parsing

🟢 No new config parsing.

#### 3. Retry Logic Completeness

🟢 API client has retries. No new retry logic.

#### 4. Infrastructure Coordination

🟢 No infrastructure changes.

#### 5. Performance Impact

🟠 **TaskCard** fetches `/models` on mount per card. A board with 20 visible cards = 20 identical `/models` calls. Increases API load and latency. Recommend fetching models once and passing via prop or shared store.

#### 6. Business Logic Impact

🟢 Model selection correctly updates `preferred_model` via `updateTask`. Toasts follow user-feedback patterns.

#### 7. Operational Readiness

🟡 `console.error` in TaskCard may bypass log aggregation. Prefer structured logging.

### Inline Issues

- `src/components/TaskCard.jsx:92` — 🟠 **HIGH**: Fetching `/models` per card causes N+1 API calls. Move to shared store or parent.
- `src/components/TaskCard.jsx:95` — 🟡 **MEDIUM**: Use `logger.error` instead of `console.error`.
- `src/components/TaskCard.jsx:209` — 🟡 **MEDIUM**: Single quotes; use double quotes per `code-style.mdc`.
- `src/components/TaskCard.test.jsx:391-411` — 🟠 **HIGH**: Mocks `global.fetch` but component uses `api.get`. Replace with `vi.mock('../api/client', () => ({ api: { get: vi.fn() } }))` and `api.get.mockResolvedValue({ data: { data: { models: [...], defaultModel } } })`.
- `src/components/TaskCard.test.jsx:409` — 🟠 **HIGH**: `afterEach` not imported from vitest; causes lint error.

---

## Risk Severity Breakdown

- **🔴 Critical Risks**: 0
- **🟠 High Risks**: 3 (wrong API mock, N+1 fetches, afterEach undefined)
- **🟡 Medium Risks**: 3 (console vs logger, quote style, operational logging)
- **🟢 Low Risks**: 2 (MarkdownRenderer changes, model selection UX)

**Overall Risk Assessment**: Medium

---

## Deployment Impact

### Breaking Changes

- **API Changes**: No
- **Schema Changes**: No
- **Configuration Changes**: No
- **Dependency Changes**: Yes — `remark-frontmatter` added

### Performance Impact

- **Response Time**: Slight increase when many TaskCards visible (N+1 `/models` calls)
- **Memory Usage**: Neutral
- **CPU Impact**: Neutral
- **Database Load**: N/A

### Database Migration Impact

N/A

### Rollback Complexity

- **Strategy**: Simple revert; no migrations
- **Estimated Time**: < 5 minutes

---

## Recommendations

### Pre-Deployment

1. Fix TaskCard.test.jsx: mock `api.get` instead of `global.fetch` and import `afterEach` from vitest
2. Replace `console.error` with `logger.error` in TaskCard.jsx
3. Normalize quote style to double quotes per `code-style.mdc`
4. Consider moving models fetch to a shared store or parent component to avoid N+1 calls

### Post-Deployment Monitoring

1. Watch `/models` request volume when boards have many visible cards
2. Confirm no increase in error rates from `remark-frontmatter` parsing

### Contingency Plans

1. If N+1 calls cause load issues, add models store and fetch once per board

---

## Testing & Validation

### Required Testing Commands

```bash
# Lint
npm run lint

# Unit Tests
npm run test:run

# Dependency audit (run locally)
npm audit
```

### Test Reports

- **MarkdownRenderer**: 22 tests pass
- **TaskCard**: 29 pass, 4 fail (AI Model Selector block)
- **Lint**: 3 errors, 2 warnings

---

## Task List

- [x] 1.0 🟠 Fix TaskCard.test.jsx — mock `api.get` instead of `global.fetch` (DONE)
- [x] 2.0 🟠 Replace `console.error` with `logger.error` in TaskCard.jsx (line 95)
- [x] 3.0 🟡 Use double quotes in TaskCard.jsx for new string literals (lines 209+)
- [x] 4.0 🟡 Fix MarkdownRenderer.test.jsx console warnings (lines 216-217) if in staged scope
- [x] 5.0 Re-run tests to confirm fixes (DONE — all 462 tests pass)
- [x] 6.0 (Optional) Refactor models fetch to shared store or parent to avoid N+1 calls — deferred: documented in Recommendations § Contingency Plans

---

## Discovered Issues

None outside the current scope that warrant separate tickets.

---

## Summary of Changes

Post-review fixes for Markdown Frontmatter + TaskCard AI Model Selector.

### Key Improvements

- Replaced `console.error` with `logger.error` in TaskCard.jsx for structured logging and log aggregation compatibility.
- Normalized quote style to double quotes for new string literals in the model selector block (api.get, showToast, logger.error) per `code-style.mdc`.
- Removed debug `console.log` statements from MarkdownRenderer.test.jsx (lines 216–217) to eliminate test output noise.
- Documented N+1 models fetch as deferred follow-up in Recommendations § Contingency Plans.

### File Changes

- **Modified**: `src/components/TaskCard.jsx` — Added logger import, replaced console.error with logger.error, used double quotes for new string literals.
- **Modified**: `src/components/MarkdownRenderer.test.jsx` — Removed debug console.log statements from test.
- **Modified**: `tasks/011-markdown-frontmatter-taskcard-model-selector/review.md` — Marked tasks 2.0–4.0 and 6.0 complete, added Summary of Changes.

---
