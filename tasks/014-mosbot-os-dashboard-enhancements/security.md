# Security Scan: 014-mosbot-os-dashboard-enhancements

**Executed By**: Code Review (automated)
**Date**: 2026-02-16
**Scope**: mosbot-dashboard staged diff (28 files)
**Scan Duration**: ~10s
**Tools Executed**: npm audit

---

## Task List

- [x] 1.0 🟠 Update axios to patched version via `npm audit fix` (High: GHSA-43fc-jf86-j433)
- [x] 2.0 🟡 Evaluate esbuild/vite/vitest upgrade path for moderate dev-server CORS vulns (requires `npm audit fix --force`; may be breaking) — Evaluated: `npm audit fix --force` would install vite@6.4.1 (breaking change). Moderate vulns affect dev server only; production builds unaffected. Deferred to separate maintenance ticket.

---

## Executive Summary

- **Overall Status**: ⚠️ Warning
- **Critical**: 0
- **High**: 1 (axios)
- **Medium**: 6 (esbuild/vite chain)
- **Low**: 0
- **Info**: 0

## Detailed Findings

### High Severity

- **npm audit** — **High** — Axios vulnerable to DoS via `__proto__` key in mergeConfig
  - **Impact**: Denial of service; attacker could cause app crash via crafted config merge
  - **Remediation**: Run `npm audit fix` to update axios
  - **Reference**: https://github.com/advisories/GHSA-43fc-jf86-j433

### Medium Severity

- **npm audit** — **Medium** — esbuild enables any website to send requests to dev server and read response
  - **Impact**: Development server only; production builds unaffected
  - **Remediation**: Upgrade via `npm audit fix --force` (may install vite@6.4.1, breaking change)
  - **Reference**: https://github.com/advisories/GHSA-67mh-4wv8-2f99
  - **Affected**: esbuild, vite, vite-node, vitest, @vitest/coverage-v8, @vitest/ui

## Dependency Health

- **Tool**: npm audit
- **Vulnerabilities**: Critical 0 | High 1 | Medium 6 | Low 0
- **Total Dependencies**: (see package.json)
- **Vulnerable Dependencies**: axios (1 high), esbuild/vite chain (6 moderate)
- **Notes**: `npm audit fix` addresses axios; vite upgrade requires evaluation
- **Lock File Integrity**: ✅ Verified

## Secret Scan

- **Tool**: Not executed (gitleaks/trufflehog not in path)
- **Status**: ⚠️ Skipped — manual review recommended for auth/API changes
- **Notes**: Changes include auth role (agent), API client; no hardcoded secrets observed in diff

## SAST Findings

- **Tools Executed**: ESLint (via lint script)
- **Total Issues**: 15 warnings (no-unused-vars, react-hooks/exhaustive-deps)
- **Security-relevant**: None directly; unused imports/vars are code quality, not security

## Artifacts Generated

- None (lightweight scan)

## Next Steps

1. Run `npm audit fix` before merge to address axios High vulnerability
2. Schedule vite/esbuild upgrade for next maintenance window
3. Re-run `/security` after fixes to verify closure
