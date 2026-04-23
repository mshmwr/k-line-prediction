# frontend/design/screenshots/ — Designer-captured PNGs (git-tracked)

## Purpose

Pencil frame screenshots saved as git-tracked PNGs so Reviewer / QA / PM can verify visual intent offline without invoking Pencil MCP.

**Authority:** Designer runs `get_screenshot` after each `batch_design` finalization and writes PNGs here.

## Filename conventions

Two PNG variants per frame:

### 1. Pencil frame screenshot (source-of-truth reference)

```
<pen-file-basename>-<frame-id>.png
```

- Example: `homepage-v2-86psQ.png` — the /about footer as Pencil renders it.
- Captured via `get_screenshot({ nodeId: '<frame-id>' })` (node-scoped, not full document).

### 2. Side-by-side comparison (Designer acceptance deliverable)

```
<pen-file-basename>-<frame-id>-side-by-side.png
```

Composed image: left half = Pencil screenshot, right half = dev-server screenshot of the implemented route at same viewport width. Annotated with frame ID + route + git SHA in a footer caption.

- Example: `homepage-v2-86psQ-side-by-side.png` — /about footer Pencil vs production.

## When to update

Per Designer persona hard gate (Q5b + Q5c), every `batch_design` session producing a visually-observable change must:

1. Capture new `<pen>-<id>.png` at freeze time.
2. Capture new `<pen>-<id>-side-by-side.png` once Engineer's implementation lands (acceptance phase).
3. Commit PNGs alongside the `.pen` / JSON updates.

## Consumption

- PM visual acceptance (Phase end): open side-by-side PNG, judge directly (Q5c).
- QA regression: cross-check Pencil-PNG vs dev-server PNG for shared components per Q5a mixed strategy.
- Reviewer Pencil-parity Step 2: compare implementation output against Pencil-PNG, flag deviation as Critical.
