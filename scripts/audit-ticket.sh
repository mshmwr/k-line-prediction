#!/usr/bin/env bash
# audit-ticket.sh — K-Line Prediction portfolio demo script
# Usage: ./scripts/audit-ticket.sh K-XXX
# Exit codes: 0=all pass, 1=warning, 2=critical missing
set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

# ── Colour / NO_COLOR support ─────────────────────────────────────────────────
if [[ -t 1 ]] && [[ -z "${NO_COLOR:-}" ]]; then
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  RED='\033[0;31m'
  GREY='\033[0;90m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  GREEN='' YELLOW='' RED='' GREY='' BOLD='' RESET=''
fi

warn_count=0
fail_count=0

log_ok()   { printf "${GREEN}[OK]${RESET}    %s\n" "$1"; }
log_warn() { printf "${YELLOW}[WARN]${RESET}  %s\n" "$1"; warn_count=$((warn_count + 1)); }
log_fail() { printf "${RED}[FAIL]${RESET}  %s\n" "$1"; fail_count=$((fail_count + 1)); }
log_skip() { printf "${GREY}[SKIP]${RESET}  %s\n" "$1"; }
header()   { printf "\n${BOLD}=== %s ===${RESET}\n" "$1"; }

# ── Helpers ───────────────────────────────────────────────────────────────────
read_frontmatter_field() {
  local file="$1" field="$2"
  grep -E "^${field}:" "$file" | head -1 | sed "s/^${field}:[[:space:]]*//"
}

# Returns 0 (true) if date $1 is strictly less than date $2 (YYYY-MM-DD)
date_lt() { [[ "$1" < "$2" ]]; }

# ── Check A: Ticket file + frontmatter ───────────────────────────────────────
check_a_ticket_file() {
  local ticket_id="$1"
  header "A — Ticket File"

  # Glob expansion for ticket file
  actual_ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && actual_ticket_file="$f" && break
  done

  if [[ -z "$actual_ticket_file" ]]; then
    log_fail "A1: Ticket file docs/tickets/${ticket_id}-*.md not found"
    return 1
  fi
  log_ok "A1: Ticket file found: $actual_ticket_file"

  # Required frontmatter fields
  local required_fields=("id" "title" "status" "type" "priority" "created")
  for fld in "${required_fields[@]}"; do
    local val
    val=$(read_frontmatter_field "$actual_ticket_file" "$fld")
    if [[ -z "$val" ]]; then
      log_fail "A2: frontmatter field '$fld' missing or empty"
    else
      log_ok "A2: frontmatter '$fld' = '$val'"
    fi
  done

  # If status=closed, must have closed date
  local status
  status=$(read_frontmatter_field "$actual_ticket_file" "status")
  if [[ "$status" == "closed" ]]; then
    local closed_date
    closed_date=$(read_frontmatter_field "$actual_ticket_file" "closed")
    if [[ -z "$closed_date" ]]; then
      log_warn "A3: status=closed but 'closed' date field is missing"
    else
      log_ok "A3: closed date = '$closed_date'"
    fi
  else
    log_ok "A3: status='$status' (closed-date check skipped)"
  fi

  return 0
}

# ── Check B: AC section + PRD reference ──────────────────────────────────────
check_b_ac() {
  local ticket_id="$1"
  header "B — Acceptance Criteria"

  # Find ticket file again
  local ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && ticket_file="$f" && break
  done

  # B1: ## 驗收條件 section in ticket (or AC-XXX sections directly in ticket)
  if grep -qE "^## 驗收條件|^### AC-" "$ticket_file" 2>/dev/null; then
    log_ok "B1: AC section exists in ticket (## 驗收條件 or ### AC-* headings)"
  else
    log_fail "B1: No AC section found in ticket (expected '## 驗收條件' or '### AC-*' headings)"
  fi

  if [[ -f "PRD.md" ]]; then
    # PRD uses AC-NNN-* format (e.g. AC-002-ICON) or AC-K-NNN-* format (e.g. AC-K-017-HEADER)
    local ticket_num="${ticket_id#K-}"
    if grep -qE "AC-(K-)?${ticket_num}-" PRD.md 2>/dev/null; then
      log_ok "B2: PRD.md references AC-${ticket_num}-* criteria"
    else
      # Also check if AC is embedded in the ticket itself (older tickets before PRD consolidation)
      local ac_in_ticket=false
      if grep -qE "^### AC-" "$ticket_file" 2>/dev/null; then
        ac_in_ticket=true
      fi
      if $ac_in_ticket; then
        log_ok "B2: AC criteria are embedded in ticket (pre-PRD-consolidation format)"
      else
        log_warn "B2: PRD.md has no 'AC-${ticket_num}-' or 'AC-K-${ticket_num}-' reference"
      fi
    fi
  else
    log_warn "B2: PRD.md not found"
  fi
}

# ── Check C: Architecture ─────────────────────────────────────────────────────
check_c_architecture() {
  local ticket_id="$1"
  header "C — Architecture"

  # Find ticket file
  local ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && ticket_file="$f" && break
  done

  # Check if ticket declares "no architecture needed" or architecture is embedded in the ticket itself
  local no_arch_declared=false
  if grep -qiE "無需.*[Aa]rchitecture|no.*[Aa]rchitecture.*needed|不需要.*設計|明確聲明.*(不需|無需)|無需 Architecture|放行 Engineer" "$ticket_file" 2>/dev/null; then
    no_arch_declared=true
  fi
  # If ticket has an Architect retrospective section, treat as Architect covered
  local has_architect_retro=false
  if grep -qiE "### Architect 反省|### Architect Retrospective" "$ticket_file" 2>/dev/null; then
    has_architect_retro=true
  fi
  # If ticket itself contains an Architecture section (inline design)
  local has_inline_arch=false
  if grep -qE "^## Architecture" "$ticket_file" 2>/dev/null; then
    has_inline_arch=true
  fi

  # Find design files
  local design_found=false
  for f in docs/designs/"${ticket_id}"-*.md; do
    if [[ -f "$f" ]]; then
      design_found=true
      log_ok "C1: Design file found: $f"
      # Check for ## Retrospective section
      if grep -q "## Retrospective" "$f" 2>/dev/null; then
        log_ok "C2: Design file has '## Retrospective' section"
      else
        log_warn "C2: Design file missing '## Retrospective' section: $f"
      fi
    fi
  done

  if ! $design_found; then
    if $no_arch_declared; then
      log_ok "C1: No design file (ticket declares no architecture needed)"
      log_skip "C2: Design ## Retrospective check (no design file)"
    elif $has_inline_arch; then
      log_ok "C1: Architecture is embedded in ticket (## Architecture section found)"
      log_skip "C2: Design ## Retrospective check (inline arch in ticket)"
    elif $has_architect_retro; then
      log_ok "C1: No design file but ticket contains Architect retrospective (Architect reviewed)"
      log_skip "C2: Design ## Retrospective check (no design file)"
    else
      log_fail "C1: No design file found at docs/designs/${ticket_id}-*.md and no evidence of Architect review in ticket"
    fi
  fi
}

# ── Check D: Commit trail ─────────────────────────────────────────────────────
check_d_commit_trail() {
  local ticket_id="$1"
  header "D — Commit Trail"

  # Get all commits referencing this ticket
  local all_commits
  all_commits=$(git log --all --grep="${ticket_id}" --oneline 2>/dev/null)

  if [[ -z "$all_commits" ]]; then
    log_fail "D1: No commits found with '${ticket_id}' in message"
    return
  fi

  local total_count
  total_count=$(echo "$all_commits" | wc -l | tr -d ' ')
  log_ok "D1: ${total_count} commit(s) reference ${ticket_id}"

  # Check for vague messages (lines where ALL non-hash words are vague terms)
  # A commit is vague if its message (minus ticket ID) only contains: wip, fix, fixup, update, temp, tmp, test, chore, misc
  local vague_pattern="^[a-f0-9]+ (wip|fix|fixup|update|temp|tmp|test|chore|misc|WIP|FIX|FIXUP|UPDATE|TEMP|TMP|TEST|CHORE|MISC)[[:space:]]*$"
  local vague_commits
  vague_commits=$(echo "$all_commits" | grep -E "$vague_pattern" || true)

  if [[ -n "$vague_commits" ]]; then
    log_warn "D2: Vague commit message(s) detected (excluded from meaningful trail):"
    echo "$vague_commits" | while read -r line; do
      printf "       %s\n" "$line"
    done
  else
    log_ok "D2: All commits have meaningful messages (no pure vague-msg commits)"
  fi
}

# ── Check E: Code Review in ticket Retrospective ──────────────────────────────
check_e_code_review() {
  local ticket_id="$1"
  header "E — Code Review"

  # Find ticket file
  local ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && ticket_file="$f" && break
  done

  # Look for Reviewer reflection specifically in or after ## Retrospective section
  local retro_section
  retro_section=$(awk '/^## Retrospective/,0' "$ticket_file" 2>/dev/null)
  if [[ -n "$retro_section" ]]; then
    # Match any common Reviewer section heading variants:
    # "### Code Reviewer", "### Reviewer", "### Retrospective（Reviewer）", "Reviewer 反省", "Code Reviewer 反省"
    if echo "$retro_section" | grep -qiE "(### (Code )?Reviewer|Retrospective.*Reviewer|Reviewer.*反省|Code Reviewer 反省)"; then
      log_ok "E1: Ticket ## Retrospective contains Reviewer reflection"
    else
      log_warn "E1: Ticket ## Retrospective found but no Reviewer reflection section detected"
    fi
  else
    log_warn "E1: No '## Retrospective' section found in ticket"
  fi
}

# ── Check F: Per-role retrospectives (K-008+ only) ────────────────────────────
check_f_retrospectives() {
  local ticket_id="$1"
  header "F — Per-role Retrospectives"

  # Find ticket file
  local ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && ticket_file="$f" && break
  done

  # Check 5 roles in ticket ## Retrospective
  # Ticket formats vary: "### Engineer（2026-04-18）", "### Reviewer 反省", "### Retrospective（Reviewer）", etc.
  local roles=("PM" "Architect" "Engineer" "Reviewer" "QA")
  local retro_text
  retro_text=$(awk '/^## Retrospective/,0' "$ticket_file" 2>/dev/null)
  for role in "${roles[@]}"; do
    if echo "$retro_text" | grep -qiE "(### (Code )?${role}|${role} 反省|Retrospective.*${role}|${role}.*Retrospective)"; then
      log_ok "F1: Ticket has ${role} retrospective section"
    else
      log_warn "F1: Ticket missing ${role} retrospective section"
    fi
  done

  # Check per-role log files
  local role_files=("pm" "architect" "engineer" "reviewer" "qa")
  for rf in "${role_files[@]}"; do
    local log_file="docs/retrospectives/${rf}.md"
    if [[ -f "$log_file" ]]; then
      if grep -q "## .*${ticket_id}" "$log_file" 2>/dev/null; then
        log_ok "F2: docs/retrospectives/${rf}.md has entry for ${ticket_id}"
      else
        log_warn "F2: docs/retrospectives/${rf}.md has no '## YYYY-MM-DD — ${ticket_id}' entry"
      fi
    else
      log_warn "F2: docs/retrospectives/${rf}.md not found"
    fi
  done
}

# ── Check G: QA / Playwright ─────────────────────────────────────────────────
check_g_qa_playwright() {
  local ticket_id="$1"
  header "G — QA / Playwright"

  # Check Playwright e2e files reference ticket (spec files + visual-report.ts)
  local spec_match
  spec_match=$(grep -rl "${ticket_id}" frontend/e2e/ 2>/dev/null || true)
  if [[ -n "$spec_match" ]]; then
    log_ok "G1: Playwright e2e file references ${ticket_id}: $(echo "$spec_match" | tr '\n' ' ')"
  else
    log_warn "G1: No Playwright e2e file references ${ticket_id} in frontend/e2e/"
  fi

  # Check visual report HTML exists
  local report_found=false
  for f in docs/reports/"${ticket_id}"-*.html; do
    if [[ -f "$f" ]]; then
      report_found=true
      log_ok "G2: Visual report found: $f"
    fi
  done

  if ! $report_found; then
    log_warn "G2: No visual report found at docs/reports/${ticket_id}-*.html"
  fi
}

# ── Help ──────────────────────────────────────────────────────────────────────
show_help() {
  cat <<'EOF'
audit-ticket.sh — K-Line Prediction portfolio demo script

USAGE:
  ./scripts/audit-ticket.sh K-XXX    Audit a specific ticket
  ./scripts/audit-ticket.sh --help   Show this help

CHECKS:
  A  Ticket file + frontmatter (id/title/status/type/priority/created)
  B  Acceptance Criteria section + PRD.md reference
  C  Architecture design file + ## Retrospective section
  D  Commit trail (>= 1 commit; vague-only messages flagged as WARN)
  E  Code Review reflection in ticket ## Retrospective
  F  Per-role retrospective sections (ticket + per-role log files) — K-008+ only
  G  Playwright spec reference + visual report HTML — K-008+ only

  F and G are SKIPPED for tickets with created < 2026-04-18.

EXIT CODES:
  0  All checks pass
  1  At least one WARN, no FAIL
  2  At least one FAIL (critical missing)
EOF
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
    show_help
    exit 0
  fi

  if [[ $# -eq 0 ]]; then
    printf "${RED}Error:${RESET} No ticket ID provided.\n"
    show_help
    exit 2
  fi

  local ticket_id="$1"

  # Validate ticket ID format
  if ! echo "$ticket_id" | grep -qE "^K-[0-9]+$"; then
    printf "${RED}Error:${RESET} Invalid ticket ID format '%s'. Expected K-NNN (e.g. K-002).\n" "$ticket_id"
    exit 2
  fi

  printf "${BOLD}Auditing ticket: %s${RESET}\n" "$ticket_id"

  # A is hard prerequisite — if fails, exit 2 immediately
  if ! check_a_ticket_file "$ticket_id"; then
    printf "\n${RED}[FAIL]${RESET} Check A failed; cannot continue (ticket file not found).\n"
    exit 2
  fi

  check_b_ac "$ticket_id"
  check_c_architecture "$ticket_id"
  check_d_commit_trail "$ticket_id"
  check_e_code_review "$ticket_id"

  # F/G skip logic: strictly less than 2026-04-18
  local created=""
  local actual_ticket_file=""
  for f in docs/tickets/"${ticket_id}"-*.md; do
    [[ -f "$f" ]] && actual_ticket_file="$f" && break
  done
  created=$(read_frontmatter_field "$actual_ticket_file" "created")

  if date_lt "$created" "2026-04-18"; then
    header "F — Per-role Retrospectives"
    log_skip "F: created=$created < 2026-04-18 (per-role retro mechanism pre-dates this ticket)"
    header "G — QA / Playwright"
    log_skip "G: created=$created < 2026-04-18 (same reason as F)"
  else
    check_f_retrospectives "$ticket_id"
    check_g_qa_playwright "$ticket_id"
  fi

  # Summary
  printf "\n${BOLD}=== Summary ===${RESET}\n"
  if (( fail_count > 0 )); then
    printf "${RED}Result: FAIL${RESET} (%d critical, %d warning)\n" "$fail_count" "$warn_count"
    exit 2
  fi
  if (( warn_count > 0 )); then
    printf "${YELLOW}Result: WARN${RESET} (%d warning(s))\n" "$warn_count"
    exit 1
  fi
  printf "${GREEN}Result: PASS${RESET} — all checks passed\n"
  exit 0
}

main "$@"
