---
id: TD-004
title: Designer — create Pencil spec for RolePipelineSection footnote/annotation style
status: open
type: TD
priority: low
source: K-096 PM retrospective — footnote style implemented without Designer spec; user had to correct bullet+bold format
created: 2026-05-06
related-to: [K-096]
---

## 1. Context

K-096 added two footnote annotations (CAG, QA Early Consultation) below the "Automatic handoffs…" paragraph in `RolePipelineSection`. The style was implemented directly by Engineer without a Designer spec — formatting decisions (bullet vs italic, bold vs plain term labels) were made ad hoc and required user correction.

**Root cause:** K-096 had `content-delta: yes` but `visual-delta: none`. The footnote block is a new UI pattern (annotation list below a prose paragraph) with no Pencil frame. PM should have set `visual-delta: yes` and triggered Designer before Engineer.

## 2. Work Required

Designer to create a Pencil frame for the footnote annotation list:
- Term label style (bold weight, color token)
- Body text style (size, opacity, font)
- Bullet marker style (color, size)
- Spacing tokens (gap between items, margin below block)

Output: `specs/role-pipeline-footnotes.json` + `screenshots/role-pipeline-footnotes.png`

Engineer to audit current implementation against spec once available.

## 3. Scope

Single component: `frontend/src/components/about/RolePipelineSection.tsx` — the `<ul>` annotation block only.

## 4. AC

- [ ] Pencil frame exists with annotation list design
- [ ] `specs/role-pipeline-footnotes.json` committed
- [ ] Engineer confirms current implementation matches spec, or opens follow-up fix ticket
