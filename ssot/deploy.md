---
title: K-Line Prediction — Deploy Checklist
type: ruleset
tags: [K-Line-Prediction, Deploy, Firebase, CloudRun]
updated: 2026-04-27
---

## Summary

Firebase Hosting + Cloud Run deploy checklist. Run before every deploy.

---

## Deploy Checklist (Firebase Hosting + Cloud Run)

Must run before deploy:

0. **Local docker dry-run for deploy-affecting PRs** (pre-merge gate, runs before `gh pr create`, NOT at deploy time) — any PR touching `Dockerfile`, `frontend/scripts/*.mjs`, `package.json`, `package-lock.json`, `.gcloudignore`, or `.dockerignore` must reproduce Cloud Build locally before push:
   ```bash
   docker build -f Dockerfile .
   ```
   Run from the K-Line-Prediction repo root (same context Cloud Build uses, post-`.gcloudignore` filter). Build green locally is the merge gate; build red → fix and re-dry-run, do NOT push for Cloud Build to discover the bug. PR description must include `✅ local docker build dry-run pass` line; Reviewer Step 2 blocks the PR if the line is missing. Fallback if local Docker daemon unavailable: tag PR `no-docker` and Reviewer escalates to manual Cloud Build watcher.

   **Why:** K-049 Phase 2b shipped a 5-PR fix-forward chain (#1 → #2 validate-env loader → #3 lockfile v3 → #4 .gcloudignore → #5 sitemap git-fallback) because each Cloud Build error exposed the next blocker. Every blocker reproduced in `docker build .` locally — `node:20-alpine` ships without `git`, `.gcloudignore` stripped `.env.production`, lockfile v2 mismatched npm 10's v3 generation. Cloud Build round-trip ≈ 6+ min per attempt; one local `docker build` cycle (~8 min) catches all four. PR #5 was the first to actually run the dry-run pre-push and was the last fix-forward needed — direct correlation. See memory `feedback_local_docker_dry_run_before_deploy_pr.md`.

1. **Verify main is synced with all ticket branches** — main must contain every deployed-but-unmerged ticket before any new deploy:
   ```bash
   git branch --no-merged main | grep -E "^\s*K-[0-9]+" || echo "OK: all ticket branches merged"
   ```
   Any K-XXX branch listed → rebase onto main then FF-merge into main first:
   ```bash
   git checkout <K-XXX-branch> && git rebase main
   git checkout main && git merge --ff-only <K-XXX-branch>
   ```
   Plain `git merge --ff-only` without the rebase step fails when main has advanced since the branch point (multi-ticket interleave is the common case). Deploy from main without this gate can overwrite a previously-deployed ticket's bundle (incident: K-041 self-overwrite 2026-04-24).

2. **Scan all relative API paths** — confirm all HTTP clients (`fetch`, `axios`, etc.) use `API_BASE` prefix:
   ```bash
   grep -r "'/api/" src/
   grep -r '"/api/' src/
   ```
   Any bare relative path → fix before build

3. **build** — `npm run build` (in `frontend/` directory)

4. **deploy** — `firebase deploy --only hosting` (in project root)
