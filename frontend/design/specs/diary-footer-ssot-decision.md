# /diary Footer SSOT Decision — BQ-034-P3-02

**Ticket:** K-034 Phase 3 (absorbs ex-K-038)
**Decision date:** 2026-04-23
**Decision:** **Option B — homepage-v2.pen Footer subtree is canonical SSOT for /diary**
**New .pen artifact required:** NO

## Canonical SSOT Source

`/diary` Footer inherits its Pencil provenance from the **existing** sitewide inline one-liner footer artifact in `frontend/design/homepage-v2.pen`, specifically both byte-identical frames:

| Frame ID | Frame name | Pen file | Spec JSON | Screenshot PNG |
|----------|-----------|----------|-----------|----------------|
| `86psQ` | `abFooterBar` (ex-/about variant label) | `homepage-v2.pen` | `frontend/design/specs/homepage-v2.frame-86psQ.json` | `frontend/design/screenshots/homepage-v2-86psQ.png` |
| `1BGtd` | `hpFooterBar` (ex-/home variant label) | `homepage-v2.pen` | `frontend/design/specs/homepage-v2.frame-1BGtd.json` | `frontend/design/screenshots/homepage-v2-1BGtd.png` |

Both frames carry the identical spec (verified live via Pencil MCP `batch_get` 2026-04-23, mirrors on-disk JSON exported 2026-04-23):

```
content:    "yichen.lee.20@gmail.com · github.com/mshmwr · LinkedIn"
fontFamily: Geist Mono
fontSize:   11
fontWeight: normal
fill:       #6B5F4E
letterSpacing: 1
padding:    [20, 72]
stroke:     top 1px #1A1814, align inside
alignItems: center
justifyContent: space_between
width:      fill_container
```

## Why Option B (not Option A)

1. **Pencil SSOT is already singular.** K-035 α-premise correction (2026-04-22) established that the two Footer frames are byte-identical, not two variants. Creating a `diary-v2.pen` frame would clone the exact same spec under a third ID — zero design-intent delta, pure provenance-duplication drift risk.
2. **No /diary-specific design intent exists.** Designer retro log contains zero entries proposing a distinct `/diary` Footer layout. Ex-K-038 `docs/retrospectives/qa.md` + `docs/retrospectives/pm.md` 2026-04-23 entries describe `/diary` as a **consumer-list reassignment**, not a new visual surface.
3. **Consistent with PM ruling BQ-034-P3-01.** Phase 3 is explicitly not gated on Designer producing a new `.pen` artifact; inventory.md footnote referencing `86psQ + 1BGtd` is sufficient provenance record.
4. **Avoids design-exemptions proliferation.** Every new `.pen` frame adds a JSON+PNG artifact pair to the export gate. One shared Pencil SSOT → one artifact pair; three frames → three pairs without visual delta.

## Downstream Consumers (post-Phase 3)

| Route | React Footer instance | Pencil SSOT |
|-------|----------------------|-------------|
| `/` | `<Footer />` | `86psQ` / `1BGtd` (byte-identical) |
| `/about` | `<Footer />` | `86psQ` / `1BGtd` (byte-identical) |
| `/business-logic` | `<Footer />` | `86psQ` / `1BGtd` (byte-identical) |
| `/diary` **(NEW)** | `<Footer />` | `86psQ` / `1BGtd` (byte-identical; no dedicated frame) |
| `/app` | (none — isolation preserved per K-030) | N/A |

## Artifact Gate Status

- No Pencil MCP `batch_design` operation executed this session (read-only `batch_get` verification only).
- No new JSON in `frontend/design/specs/*.json` (per `feedback_designer_json_sync_hard_gate.md` — only touched frames get re-exported; this session touched zero frames).
- No new PNG in `frontend/design/screenshots/` for same reason.
- Existing `homepage-v2.frame-86psQ.json` + `homepage-v2.frame-1BGtd.json` remain valid SSOT; mtime confirmed 2026-04-21 matches current `.pen` state.

## References

- Ticket: `docs/tickets/K-034-about-spec-audit-and-workflow-codification.md` §Phase 3, §4.3 BQ-034-P3-01 + BQ-034-P3-02
- Architect design doc (next step): `docs/designs/K-034-phase3-diary-footer-adoption.md`
- Inventory update target: `docs/designs/shared-components-inventory.md` Footer row (Engineer responsibility per AC-034-P3-INVENTORY-UPDATED)
- Superseded invariants: K-017 AC-017-FOOTER `/diary` negative, K-024 `/diary` no-footer, K-034 Phase 1 T4 AC-034-P1-NO-FOOTER-ROUTES `/diary` row (all RETIRED per BQ-034-P3-03)
- Preserved invariant: K-030 `/app` isolation (distinct rationale)
