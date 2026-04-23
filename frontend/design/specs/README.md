# frontend/design/specs/ — Pencil frame JSON snapshots (git-tracked SSOT mirror)

## Purpose

`.pen` files are encrypted binary authored via the Pencil MCP editor. This directory holds **decrypted, git-tracked JSON snapshots** of each frame, so that Engineer / Reviewer / QA / PM can read the design source-of-truth without invoking Pencil MCP.

**Authority:** Designer is the only role authorized to write files here; the Designer persona hard-gate requires this directory to be updated every time a `.pen` file is Edited.

## Filename convention

```
<pen-file-basename>.frame-<frame-id>.json
```

- `<pen-file-basename>` — base name (no extension) of the `.pen` file in `frontend/design/` (e.g. `homepage-v2.pen` → `homepage-v2`).
- `<frame-id>` — the Pencil auto-assigned short ID (4–6 chars) of the frame being snapshotted.

Examples:
- `homepage-v2.frame-86psQ.json` — /about footer frame (K-034 Phase 1)
- `homepage-v2.frame-1BGtd.json` — /home footer frame (K-034 Phase 1)
- `homepage-v2.frame-4CsvQ.json` — homepage full frame (K-035 Phase 3 artifact)

## Content schema

Each file is a full `batch_get(nodeIds: ['<frame-id>'])` response captured via Pencil MCP, stored as pretty-printed JSON with `indent=2`. No field filtering — the goal is a byte-complete snapshot so Reviewer can grep any property (fontFamily, fontSize, color, text content, spacing, padding, layout direction, gap, corner radius, stroke, etc.).

```json
{
  "id": "<frame-id>",
  "type": "frame",
  "name": "<human-readable frame name>",
  "children": [ /* ...full node tree with all properties... */ ]
}
```

## Update protocol (Designer persona hard-gate)

Every `batch_design` session that finalizes a `.pen` edit MUST:

1. Run `batch_get({ nodeIds: ['<each-affected-frame-id>'] })`
2. Write / overwrite `frontend/design/specs/<pen>.frame-<id>.json` with the response
3. Commit the JSON in the same commit as the `.pen` binary diff

Failure to update this JSON when `.pen` changes = Bug Found Protocol trigger (per `feedback_pencil_ssot_json_snapshot.md` + `feedback_designer_json_sync_hard_gate.md`).

## Staleness check (PM Phase Gate)

Before releasing Architect for any Pencil-backed ticket, PM runs:

```bash
pen_ts=$(git log -1 --format=%ct -- frontend/design/<file>.pen)
json_ts=$(git log -1 --format=%ct -- frontend/design/specs/<file>.frame-*.json)
[ "$json_ts" -ge "$pen_ts" ] || echo "STALE: regenerate JSON"
```

Newest `.pen` timestamp > newest `specs/*.json` timestamp → block; send back to Designer.
