# Release Versioning & CI/CD Design

**Date:** 2026-04-19
**Ticket:** K-019 (to be created)
**Status:** Approved (BQ-1~5 resolved 2026-04-19)

---

## Summary

Each deploy triggers a release publishing flow: auto-generates version doc, git tag, GitHub Release (with Playwright screenshots). Goal is to build a UI "time machine" — flip back to any version to see the screen and changes.

---

## Acceptance Criteria

**AC-K019-1: Local release script execution**
- Given: main has commits (with K-XXX references) and no duplicate tag
- When: run `node scripts/create-release.js`
- Then: `docs/releases/vX.X.X.md` is created with the correct ticket list
- And: `git tag vX.X.X` created
- And: `git push --follow-tags` triggers CI

**AC-K019-2: CI pipeline full execution**
- Given: tag `v*.*.*` pushed to GitHub
- When: GitHub Actions workflow runs
- Then: frontend build + Firebase deploy + Cloud Run deploy all succeed
- And: health check curl passes
- And: Playwright captures 3 screenshots against `PROD_URL` (Home / About / App login)
- And: `gh release create` creates Release with screenshot assets

**AC-K019-3: Release document format**
- Given: release flow completes
- Then: `docs/releases/vX.X.X.md` contains frontmatter (version / date / tickets)
- And: GitHub Release body contains version, date, and ticket list

**AC-K019-4: Deploy failure protection**
- Given: Firebase or Cloud Run deploy fails in CI
- When: workflow reaches that step
- Then: subsequent steps do not execute; GitHub Release is not created

**AC-K019-5: Screenshot failure annotation**
- Given: Playwright screenshot fails (timeout / PROD_URL unreachable)
- When: CI proceeds to gh release create
- Then: Release is still created; body annotated `⚠️ Screenshots unavailable: <reason>`

---

## Versioning Scheme

Semantic versioning: `vMAJOR.MINOR.PATCH`

| Type | Description |
|------|------|
| MAJOR | Major feature launch (architecture or core logic rewrite) |
| MINOR | Batch of tickets deployed (normal release) |
| PATCH | Hotfix (no new features) |

---

## Release Flow

### Local Release Script (anyone can run)

`scripts/create-release.js`, run as:

```bash
node scripts/create-release.js [version]
# Example: node scripts/create-release.js v1.1.0
# Without version arg, script auto-infers from PM-dashboard.md ticket types
```

**Version inference logic (no arg):**
- Contains `feat` type ticket → MINOR increment
- Only `fix/test/docs/refactor` → PATCH increment
- MAJOR must be passed manually (during architecture rewrite)

**Script steps:**
1. From `git log <last-tag>..HEAD` grep `K-\d+` to obtain tickets in this release (use initial commit as base if no last-tag)
2. Create `docs/releases/` directory if not exists
3. Generate `docs/releases/vX.X.X.md` (see format)
4. `git commit -m "release: vX.X.X"`
5. `git tag vX.X.X`
6. `git push origin main --follow-tags`

**Initial version:** v1.0.0 (Phase 1-3 already fully launched)

### GitHub Actions (CI) Responsibilities
Trigger condition: `push` to tag `v*.*.*`

| Step | Tool |
|------|------|
| Checkout | actions/checkout |
| Setup Node + Python | actions/setup-node, setup-python |
| Build frontend | `npm run build` |
| Deploy Firebase Hosting | firebase-tools |
| Deploy Cloud Run backend | gcloud CLI |
| Health check (wait for Cloud Run ready) | curl poll |
| Playwright screenshots | `e2e/screenshot.spec.ts` against `PROD_URL` |
| `gh release create` | GitHub CLI; uploads screenshot assets |

No CI commit-back; no workflow loop risk.

---

## Release Document Format

Path: `docs/releases/vX.X.X.md` (committed to git, locked into tag snapshot)

```markdown
---
version: vX.X.X
date: YYYY-MM-DD
tickets: [K-XXX, K-YYY]
---

## vX.X.X — YYYY-MM-DD

### Changes
- [K-XXX] ticket title
- [K-YYY] ticket title

### Deployment
- Commit: <sha>
- Firebase: https://k-line-xxx.web.app
- Cloud Run: https://api-xxx.run.app
```

---

## Playwright Screenshot Spec

Add `e2e/screenshot.spec.ts` (not in regular test suite; CI only):
- Screens: **Home, About, /app login screen** (no Playwright login)
- `fullPage: true`
- Output to `release-screenshots/` (.gitignore; lives only in CI artifact)
- Uploaded as GitHub Release asset (PNG)

Env var: `PROD_URL` (injected by CI, points to Firebase Hosting URL)

**Screenshot failure handling (BQ-3):**
- On screenshot failure, CI job does not fail-fast
- GitHub Release still created; body annotated: `⚠️ Screenshots unavailable: <reason, e.g. Playwright timeout / PROD_URL unreachable>`
- Deploy failure → fail-fast; no Release created

**Future Enhancement (after /business-logic page implemented):**
`/business-logic` page is not yet implemented (K-017 PM deferred). Once implemented, post-auth `/business-logic` screen must be added to the screenshot spec.
→ Track in the corresponding /business-logic ticket; update `screenshot.spec.ts`.

---

## GitHub Secrets Required

| Secret | Use |
|--------|------|
| `FIREBASE_TOKEN` | Firebase Hosting deploy |
| `GCP_SA_KEY` | Cloud Run deploy (service account JSON) |
| `GITHUB_TOKEN` | `gh release create` (built-in to Actions; no extra setup) |

---

## GitHub Release Body (Markdown)

````markdown
## vX.X.X — YYYY-MM-DD

### Changes
- [K-XXX] ticket title

### Screenshots
(Screenshots attached as assets; see Assets section)

### Deployment
- Commit: <sha>
````

---

## Out of Scope

- Automated changelog website
- Semantic release bot (version determined by Claude Code, not auto-computed)
- Rollback mechanism

---

## Spec Self-Review

- [x] No TBD / unfinished sections
- [x] No internal contradictions (CI does not commit-back; flow is one-way)
- [x] Scope fits a single implementation plan
- [x] No ambiguous requirements
