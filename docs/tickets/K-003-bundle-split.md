---
id: K-003
title: Frontend bundle split — fix chunk > 500kB warning
status: closed
type: chore
priority: low
created: 2026-04-16
closed: 2026-04-17
---

## Background

`npm run build` emits a Vite chunk > 500kB warning. All dependencies are currently bundled into a single chunk, which hurts initial load time and Lighthouse score.

## Scope

**In scope:**
- Analyze bundle composition (`vite-bundle-visualizer` or `rollup-plugin-visualizer`)
- Use `manualChunks` or dynamic `import()` to split large dependencies (candidates: `lightweight-charts`, `recharts`, `react-markdown`)
- Confirm no chunk > 500kB warning after build

**Out of scope:**
- SSR / route-based code splitting (not needed for current SPA architecture)
- Compression tweaks (Vite defaults are already enabled)

## Acceptance Criteria

### AC-BUNDLE-1: build emits no chunk > 500kB warning

**Given** `npm run build` is executed
**When** the build completes
**Then** the terminal shows no `chunk xxx.js larger than 500 kB` warning

### AC-BUNDLE-2: existing E2E tests all pass

**Given** the bundle has been split
**When** `/playwright` is executed
**Then** all E2E tests pass with no regression

## Related links

- [PRD.md — Tech debt](../../PRD.md#5-tech-debt)
- [PM-dashboard.md](../../../PM-dashboard.md)

## Acceptance result (2026-04-17)

**PM final acceptance: PASS — Ticket closed**

| AC | Result | Detail |
|----|--------|--------|
| AC-BUNDLE-1 | PASS | Largest chunk 179 kB; no chunk > 500 kB warning |
| AC-BUNDLE-2 | PASS | 22 Playwright tests all pass; no regression |

QA conclusion: GO. Bundle split implementation meets all acceptance criteria. Tech debt TD-001 (CI npm install verification) is logged and deferred until CI is established.

---

## Tech debt log

| # | Description | Priority | Decision rationale |
|---|-------------|----------|---------------------|
| TD-001 | After removing recharts, need to confirm `npm install` runs to keep package-lock.json and node_modules in sync; CI environment is required to truly validate sync | Low | Build already passes and there is no local issue; standing up the full CI pipeline is a larger infrastructure task and should not be triggered by a single npm install verification. To be handled together when CI is established |
