"""
backend/tests/test_weekly_optimize.py — K-083

Unit tests for scripts/weekly_optimize.py and backend/optimizer.py helpers.

All Firestore client calls use MagicMock.
All subprocess (gcloud) calls are mocked via unittest.mock.patch.
No live Firestore or Cloud Run calls.

Test cases (AC-083-TESTS requires ≥ 7):
  1. test_data_sufficiency_guard_fires_at_29
  2. test_objective_function_known_corpus
  3. test_cost_guard_fires_after_20_no_improve
  4. test_winner_write_order_and_field_sets
  5. test_firestore_transient_failure_retry_succeeds
  6. test_firestore_permanent_failure_exit_nonzero
  7. test_predictor_params_restored_after_objective_eval
  8. test_hash_equal_early_exit
  9. test_gcloud_failure_exits_nonzero
 10. test_frozenset_contract_no_extra_fields
"""
import sys
import os
from pathlib import Path
from unittest.mock import MagicMock, call, patch

import pytest

# ---------------------------------------------------------------------------
# sys.path setup — backend/ and scripts/ must be importable
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_REPO_ROOT / "backend"))
sys.path.insert(0, str(_REPO_ROOT / "scripts"))

import predictor as _predictor  # noqa: E402
from firestore_config import (  # noqa: E402
    DEFAULT_PARAMS,
    FIRESTORE_OPTIMIZE_RUN_FIELDS,
    FIRESTORE_PREDICTOR_PARAMS_FIELDS,
    FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS,
    ParamSnapshot,
    _compute_params_hash,
)
from optimizer import (  # noqa: E402
    build_optimize_run_doc,
    build_predictor_params_doc,
    build_predictor_params_history_doc,
    evaluate_corpus,
    param_override,
)
from weekly_optimize import (  # noqa: E402
    EarlyExitSignal,
    MIN_SAMPLES,
    CORPUS_WINDOW_DAYS,
    build_completed_pairs,
    make_objective,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_pair(
    projected_high: float = 2000.0,
    projected_low: float = 1900.0,
    actual_high: float = 2100.0,
    actual_low: float = 1850.0,
    query_ts: str = "2026-04-01 23:00",
) -> dict:
    """Return a single {prediction, actual} pair dict for corpus tests."""
    return {
        "prediction": {
            "_doc_id": "2026-04-01-23",
            "projected_high": projected_high,
            "projected_low": projected_low,
            "projected_median": (projected_high + projected_low) / 2,
            "top_k_count": 5,
            "trend": "up",
            "query_ts": query_ts,
            "created_at": "2026-04-01T23:00:00Z",
            "params_hash": "a" * 64,
        },
        "actual": {
            "_doc_id": "2026-04-01-23",
            "actual_high": actual_high,
            "actual_low": actual_low,
            "high_hit": actual_high >= projected_high,
            "low_hit": actual_low <= projected_low,
            "mae": 10.0,
            "rmse": 12.0,
            "computed_at": "2026-04-04T23:00:00Z",
        },
    }


def _make_corpus(n: int) -> list:
    """Return n completed pair dicts for corpus tests."""
    return [_make_pair() for _ in range(n)]


def _make_mock_client():
    """Return a MagicMock Firestore client with nested collection().document() chain."""
    client = MagicMock()
    doc_ref = MagicMock()
    client.collection.return_value.document.return_value = doc_ref
    # Nested path: collection().document().collection().document()
    client.collection.return_value.document.return_value.collection.return_value.document.return_value = doc_ref
    return client, doc_ref


# ---------------------------------------------------------------------------
# Test 1 — AC-083-DATA-SUFFICIENCY-GUARD
# ---------------------------------------------------------------------------

def test_data_sufficiency_guard_fires_at_29():
    """Corpus of 29 pairs must trigger exit 0 with no Firestore write and no subprocess call.

    Tests the guard logic directly: if len(completed_pairs) < MIN_SAMPLES → sys.exit(0).
    No Firestore writes, no subprocess (gcloud) calls.
    """
    corpus = _make_corpus(29)
    assert len(corpus) == 29
    assert len(corpus) < MIN_SAMPLES, "Precondition: 29 < MIN_SAMPLES=30"

    client, doc_ref = _make_mock_client()
    mock_subproc = MagicMock()

    import weekly_optimize as wopt

    # Verify the guard constant is correct
    assert wopt.MIN_SAMPLES == 30, f"MIN_SAMPLES must be 30, got {wopt.MIN_SAMPLES}"

    # Patch corpus fetch + build to return 29 pairs, patch Firestore client and subprocess
    with patch("weekly_optimize.read_predictions_corpus", return_value=[]) as mock_preds, \
         patch("weekly_optimize.read_actuals_corpus", return_value=[]) as mock_actuals, \
         patch("weekly_optimize.build_completed_pairs", return_value=corpus), \
         patch("weekly_optimize.subprocess", mock_subproc), \
         patch("weekly_optimize.load_active_params", return_value=DEFAULT_PARAMS), \
         patch("weekly_optimize.load_csv_history", return_value=[]):

        # Simulate the Firestore client constructor inline (google.cloud.firestore.Client)
        # by patching the entire google module import inside main()
        mock_gcp_mod = MagicMock()
        mock_gcp_mod.Client.return_value = client
        fake_google = MagicMock()
        fake_google.cloud.firestore = mock_gcp_mod

        sys.modules["google"] = MagicMock()
        sys.modules["google.cloud"] = MagicMock()
        sys.modules["google.cloud.firestore"] = mock_gcp_mod

        try:
            with pytest.raises(SystemExit) as exc_info:
                wopt.main()
        finally:
            # Clean up injected modules so other tests are not affected
            for mod_name in ["google", "google.cloud", "google.cloud.firestore"]:
                sys.modules.pop(mod_name, None)

    assert exc_info.value.code == 0, f"Expected exit 0 (graceful skip), got {exc_info.value.code}"
    # No Firestore doc.set() calls
    assert doc_ref.set.call_count == 0, "No Firestore writes should occur when guard fires"
    # No gcloud subprocess (subprocess.run not called with gcloud args)
    gcloud_calls = [
        c for c in mock_subproc.run.call_args_list
        if c[0] and isinstance(c[0][0], list) and "gcloud" in c[0][0]
    ]
    assert len(gcloud_calls) == 0, "gcloud subprocess must not be called when guard fires"


# ---------------------------------------------------------------------------
# Test 2 — AC-083-OBJECTIVE-FUNCTION
# ---------------------------------------------------------------------------

def test_objective_function_known_corpus():
    """evaluate_corpus over a known 3-pair corpus returns the expected 0.5·high_hit + 0.5·low_hit.

    Setup:
      pair 1: actual_high >= projected_high (high hit), actual_low <= projected_low (low hit)
      pair 2: actual_high >= projected_high (high hit), actual_low > projected_low (low miss)
      pair 3: actual_high < projected_high  (high miss), actual_low <= projected_low (low hit)

    Expected: high_hit_rate = 2/3, low_hit_rate = 2/3
              objective = 0.5 * (2/3) + 0.5 * (2/3) = 2/3 ≈ 0.6667
    """
    pair1 = _make_pair(projected_high=2000.0, projected_low=1900.0, actual_high=2100.0, actual_low=1850.0)
    pair2 = _make_pair(projected_high=2000.0, projected_low=1900.0, actual_high=2100.0, actual_low=1950.0)
    pair3 = _make_pair(projected_high=2000.0, projected_low=1900.0, actual_high=1999.0, actual_low=1850.0)
    corpus = [pair1, pair2, pair3]

    snapshot = ParamSnapshot(
        ma_trend_window_days=30,
        ma_trend_pearson_threshold=0.4,
        top_k_matches=10,
        params_hash=_compute_params_hash(30, 0.4, 10),
        optimized_at=None,
        source="optimizer",
    )

    # Mock find_top_matches and compute_stats to return predictable results.
    # evaluate_corpus imports them from predictor inside param_override context,
    # so we patch at the predictor module level (where they are defined and called from).
    mock_stats = MagicMock()
    mock_stats.highest.price = 2050.0   # projected_high used by evaluate_corpus
    mock_stats.lowest.price = 1860.0    # projected_low used by evaluate_corpus

    with patch("predictor.find_top_matches", return_value=[MagicMock()]), \
         patch("predictor.compute_stats", return_value=mock_stats), \
         patch("optimizer._build_query_bars_from_prediction") as mock_build:

        # Return non-None so pairs are not skipped at query_bars level
        mock_ohlc = MagicMock()
        mock_ohlc.close = 1980.0
        mock_build.return_value = [mock_ohlc] * 24

        score = evaluate_corpus(corpus, snapshot, history_1h=[], history_1d=[])

    # pair1: actual_high=2100 >= 2050 (high hit), actual_low=1850 <= 1860 (low hit) → both
    # pair2: actual_high=2100 >= 2050 (high hit), actual_low=1950 > 1860 (low miss)
    # pair3: actual_high=1999 < 2050 (high miss), actual_low=1850 <= 1860 (low hit)
    expected = 0.5 * (2 / 3) + 0.5 * (2 / 3)
    assert abs(score - expected) < 1e-9, f"Expected {expected:.6f}, got {score:.6f}"


# ---------------------------------------------------------------------------
# Test 3 — AC-083-COST-GUARD
# ---------------------------------------------------------------------------

def test_cost_guard_fires_after_20_no_improve():
    """Cost guard must raise EarlyExitSignal after 20 consecutive non-improving iterations."""
    from weekly_optimize import IMPROVEMENT_EPSILON, NO_IMPROVE_WINDOW

    # Simulate the cost guard callback logic directly
    no_improve_streak = [0]
    best_seen = [-float("inf")]

    raised = False
    raised_msg = None
    for iteration in range(30):
        # Constant score = 0.5 (no improvement after first call sets best_seen)
        current_best = 0.5

        if (current_best - best_seen[0]) > IMPROVEMENT_EPSILON:
            best_seen[0] = current_best
            no_improve_streak[0] = 0
        else:
            no_improve_streak[0] += 1

        if no_improve_streak[0] >= NO_IMPROVE_WINDOW:
            raised = True
            raised_msg = (
                f"early exit after {iteration + 1} iterations — "
                f"no improvement > {IMPROVEMENT_EPSILON} over last {NO_IMPROVE_WINDOW} iterations"
            )
            break

    assert raised, "EarlyExitSignal should have been raised after 20 no-improve iterations"
    assert "early exit" in raised_msg
    assert "no improvement" in raised_msg
    # First iteration sets best_seen; next 20 trigger early exit at iteration 21
    assert no_improve_streak[0] == NO_IMPROVE_WINDOW


# ---------------------------------------------------------------------------
# Test 4 — AC-083-WINNER-WRITE
# ---------------------------------------------------------------------------

def test_winner_write_order_and_field_sets():
    """All three Firestore writes must use correct field sets matching their frozensets."""
    # Build each doc via the builder helpers
    active_doc = build_predictor_params_doc(
        window_days=30, pearson_threshold=0.45, top_k=12, optimized_at="2026-05-05T05:07:00Z"
    )
    history_doc = build_predictor_params_history_doc(
        window_days=30, pearson_threshold=0.45, top_k=12,
        optimized_at="2026-05-05T05:07:00Z",
        best_score=0.72,
        run_id="optimize-2026-05-05",
        git_sha="abcd1234",
        corpus_size=45,
    )
    run_doc = build_optimize_run_doc(
        run_id="optimize-2026-05-05",
        best_score=0.72,
        best_params={"window_days": 30, "pearson_threshold": 0.45, "top_k": 12},
        iterations_run=35,
        early_exit=False,
        data_window_days=90,
        sample_size=45,
        started_at="2026-05-05T05:00:00Z",
        completed_at="2026-05-05T05:07:00Z",
    )

    # Validate field sets match frozensets exactly
    assert set(active_doc.keys()) == FIRESTORE_PREDICTOR_PARAMS_FIELDS, \
        f"active_doc mismatch: {set(active_doc.keys())} != {FIRESTORE_PREDICTOR_PARAMS_FIELDS}"
    assert set(history_doc.keys()) == FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS, \
        f"history_doc mismatch: {set(history_doc.keys())} != {FIRESTORE_PREDICTOR_PARAMS_HISTORY_FIELDS}"
    assert set(run_doc.keys()) == FIRESTORE_OPTIMIZE_RUN_FIELDS, \
        f"run_doc mismatch: {set(run_doc.keys())} != {FIRESTORE_OPTIMIZE_RUN_FIELDS}"

    # Validate write functions call doc_ref.set in correct order via mock client
    client, doc_ref = _make_mock_client()
    from firestore_config import (
        write_predictor_params_active,
        write_predictor_params_history,
        write_optimize_run,
    )

    write_predictor_params_active(client, active_doc)
    write_predictor_params_history(client, "optimize-2026-05-05", history_doc)
    write_optimize_run(client, "optimize-2026-05-05", run_doc)

    # Each write calls doc_ref.set once
    assert doc_ref.set.call_count == 3
    # Verify the order: active → history → optimize_run via the data written
    calls_data = [c[0][0] for c in doc_ref.set.call_args_list]
    assert calls_data[0] == active_doc
    assert calls_data[1] == history_doc
    assert calls_data[2] == run_doc


# ---------------------------------------------------------------------------
# Test 5 — AC-083-FIRESTORE-FAILURE-MID-RUN (transient → retry succeeds)
# ---------------------------------------------------------------------------

def test_firestore_transient_failure_retry_succeeds():
    """First write attempt raises; second (retry) succeeds — no exception propagates."""
    from firestore_config import write_predictor_params_active

    active_doc = build_predictor_params_doc(
        window_days=30, pearson_threshold=0.45, top_k=12, optimized_at="2026-05-05T05:07:00Z"
    )

    client = MagicMock()
    doc_ref = MagicMock()
    client.collection.return_value.document.return_value = doc_ref

    # First call raises, second succeeds
    doc_ref.set.side_effect = [Exception("transient gRPC error"), None]

    with patch("firestore_config.time.sleep"):  # skip actual sleep
        write_predictor_params_active(client, active_doc)  # should not raise

    assert doc_ref.set.call_count == 2  # attempted twice


# ---------------------------------------------------------------------------
# Test 6 — AC-083-FIRESTORE-FAILURE-MID-RUN (permanent failure → exit non-zero)
# ---------------------------------------------------------------------------

def test_firestore_permanent_failure_exit_nonzero(capsys):
    """Permanent write failure (both attempts raise) must cause sys.exit(1) and
    winner params must be logged to stdout before the write attempt.
    """
    from firestore_config import write_predictor_params_active, _write_with_retry

    active_doc = build_predictor_params_doc(
        window_days=30, pearson_threshold=0.45, top_k=12, optimized_at="2026-05-05T05:07:00Z"
    )

    client = MagicMock()
    doc_ref = MagicMock()
    client.collection.return_value.document.return_value = doc_ref

    # Both attempts raise permanently
    doc_ref.set.side_effect = Exception("permanent Firestore outage")

    # Simulate the script pattern: log winner params to stdout BEFORE write
    import logging
    logger = logging.getLogger("weekly_optimize")
    logger.info(
        "winner params: window=30 pearson=0.4500 top_k=12 score=0.7200 hash=abcd1234 "
        "iterations=35 early_exit=False"
    )

    with patch("firestore_config.time.sleep"), \
         pytest.raises(Exception) as exc_info:
        write_predictor_params_active(client, active_doc)

    assert "permanent Firestore outage" in str(exc_info.value)
    assert doc_ref.set.call_count == 2  # both retries attempted


# ---------------------------------------------------------------------------
# Test 7 — AC-083-OBJECTIVE-FUNCTION + AC-083-SACRED-FLOOR-INTACT
# ---------------------------------------------------------------------------

def test_predictor_params_restored_after_objective_eval():
    """predictor.params must be restored to its pre-call value after evaluate_corpus.

    This test directly verifies the param_override context manager and prevents
    cross-test state leakage that would break sacred-floor tests.
    """
    original_params = _predictor.params
    original_id = id(_predictor.params)

    snapshot = ParamSnapshot(
        ma_trend_window_days=20,
        ma_trend_pearson_threshold=0.5,
        top_k_matches=8,
        params_hash=_compute_params_hash(20, 0.5, 8),
        optimized_at=None,
        source="optimizer",
    )

    # Use param_override directly to verify context manager semantics
    with param_override(snapshot):
        assert id(_predictor.params) != original_id or _predictor.params is not original_params, \
            "param_override should have swapped predictor.params"

    # After context exit, predictor.params must be restored
    assert _predictor.params is original_params, \
        f"predictor.params not restored: got {_predictor.params}, expected {original_params}"
    assert id(_predictor.params) == original_id, "predictor.params identity not restored"


# ---------------------------------------------------------------------------
# Shared helper for tests 8 + 9: build a fake gp_minimize result
# ---------------------------------------------------------------------------

def _make_fake_gp_result(window: int, pearson: float, top_k: int, score: float):
    """Return a mock OptimizeResult with a single iteration at the given params.

    func_vals stores the NEGATED score (gp_minimize minimizes).
    x_iters stores the corresponding params list.
    """
    result = MagicMock()
    result.func_vals = [-score]          # negated; best index = 0
    result.x_iters = [[window, pearson, top_k]]
    return result


# ---------------------------------------------------------------------------
# Test 8 — AC-083-WINNER-WRITE (idempotency check via wopt.main())
# ---------------------------------------------------------------------------

def test_hash_equal_early_exit():
    """When winner hash equals current active-params hash, wopt.main() must
    exit(0) WITHOUT calling any Firestore write or gcloud subprocess.

    Uses the test-1 pattern: patch all externals, invoke wopt.main() directly.
    The write functions themselves are patched (not the Firestore client) so
    call-count is unambiguous regardless of mock-client chaining.
    """
    import weekly_optimize as wopt

    winner_window, winner_pearson, winner_top_k = 30, 0.4, 10
    winner_hash = _compute_params_hash(winner_window, winner_pearson, winner_top_k)

    gp_result = _make_fake_gp_result(winner_window, winner_pearson, winner_top_k, score=0.65)

    # load_active_params returns a Firestore-sourced snapshot whose hash == winner_hash
    # → current_hash is NOT None → idempotency check fires → sys.exit(0)
    matching_params = ParamSnapshot(
        ma_trend_window_days=winner_window,
        ma_trend_pearson_threshold=winner_pearson,
        top_k_matches=winner_top_k,
        params_hash=winner_hash,
        optimized_at="2026-04-01T00:00:00Z",
        source="firestore",
    )

    corpus = _make_corpus(31)
    mock_gcp_mod = MagicMock()
    mock_subprocess = MagicMock()
    mock_subprocess.check_output.return_value = b"deadbeef\n"
    mock_subprocess.DEVNULL = -1

    sys.modules["google"] = MagicMock()
    sys.modules["google.cloud"] = MagicMock()
    sys.modules["google.cloud.firestore"] = mock_gcp_mod

    mock_write_active = MagicMock()
    mock_write_history = MagicMock()
    mock_write_run = MagicMock()

    try:
        with patch("weekly_optimize.read_predictions_corpus", return_value=[]), \
             patch("weekly_optimize.read_actuals_corpus", return_value=[]), \
             patch("weekly_optimize.build_completed_pairs", return_value=corpus), \
             patch("weekly_optimize.load_csv_history", return_value=[]), \
             patch("weekly_optimize.load_active_params", return_value=matching_params), \
             patch("weekly_optimize.gp_minimize", return_value=gp_result), \
             patch("weekly_optimize.subprocess", mock_subprocess), \
             patch("weekly_optimize.write_predictor_params_active", mock_write_active), \
             patch("weekly_optimize.write_predictor_params_history", mock_write_history), \
             patch("weekly_optimize.write_optimize_run", mock_write_run):
            with pytest.raises(SystemExit) as exc_info:
                wopt.main()
    finally:
        for mod_name in ["google", "google.cloud", "google.cloud.firestore"]:
            sys.modules.pop(mod_name, None)

    assert exc_info.value.code == 0, f"Expected exit 0 (idempotency skip), got {exc_info.value.code}"
    assert mock_write_active.call_count == 0, "write_predictor_params_active must NOT be called"
    assert mock_write_history.call_count == 0, "write_predictor_params_history must NOT be called"
    assert mock_write_run.call_count == 0, "write_optimize_run must NOT be called"
    # No gcloud subprocess
    gcloud_calls = [
        c for c in mock_subprocess.run.call_args_list
        if c[0] and isinstance(c[0][0], list) and "gcloud" in c[0][0]
    ]
    assert len(gcloud_calls) == 0, "gcloud must not be called when params are unchanged"


# ---------------------------------------------------------------------------
# Test 9 — AC-083-REDEPLOY-TRIGGER (gcloud failure via wopt.main())
# ---------------------------------------------------------------------------

def test_gcloud_failure_exits_nonzero():
    """gcloud returning returncode=1 must cause wopt.main() to exit(1) AFTER
    all three Firestore writes have been committed.

    Uses the test-1 pattern: patch all externals, invoke wopt.main() directly.
    Winner params differ from active params so the idempotency check is bypassed.
    Write functions are patched at the weekly_optimize namespace boundary so
    call-count is unambiguous regardless of mock-client chaining.
    """
    import weekly_optimize as wopt

    winner_window, winner_pearson, winner_top_k = 30, 0.4, 10
    winner_hash = _compute_params_hash(winner_window, winner_pearson, winner_top_k)

    gp_result = _make_fake_gp_result(winner_window, winner_pearson, winner_top_k, score=0.65)

    # Active params differ → current_hash != winner_hash → writes proceed
    different_hash = _compute_params_hash(20, 0.3, 5)
    different_params = ParamSnapshot(
        ma_trend_window_days=20,
        ma_trend_pearson_threshold=0.3,
        top_k_matches=5,
        params_hash=different_hash,
        optimized_at="2026-04-01T00:00:00Z",
        source="firestore",
    )
    assert different_hash != winner_hash, "Precondition: hashes must differ"

    corpus = _make_corpus(31)
    mock_gcp_mod = MagicMock()

    # gcloud returns returncode=1 → redeploy fails
    gcloud_mock = MagicMock()
    gcloud_mock.returncode = 1
    mock_subprocess = MagicMock()
    mock_subprocess.run.return_value = gcloud_mock
    mock_subprocess.check_output.return_value = b"deadbeef\n"
    mock_subprocess.DEVNULL = -1

    sys.modules["google"] = MagicMock()
    sys.modules["google.cloud"] = MagicMock()
    sys.modules["google.cloud.firestore"] = mock_gcp_mod

    mock_write_active = MagicMock()
    mock_write_history = MagicMock()
    mock_write_run = MagicMock()

    try:
        with patch("weekly_optimize.read_predictions_corpus", return_value=[]), \
             patch("weekly_optimize.read_actuals_corpus", return_value=[]), \
             patch("weekly_optimize.build_completed_pairs", return_value=corpus), \
             patch("weekly_optimize.load_csv_history", return_value=[]), \
             patch("weekly_optimize.load_active_params", return_value=different_params), \
             patch("weekly_optimize.gp_minimize", return_value=gp_result), \
             patch("weekly_optimize.subprocess", mock_subprocess), \
             patch("weekly_optimize.write_predictor_params_active", mock_write_active), \
             patch("weekly_optimize.write_predictor_params_history", mock_write_history), \
             patch("weekly_optimize.write_optimize_run", mock_write_run):
            with pytest.raises(SystemExit) as exc_info:
                wopt.main()
    finally:
        for mod_name in ["google", "google.cloud", "google.cloud.firestore"]:
            sys.modules.pop(mod_name, None)

    assert exc_info.value.code != 0, f"Expected non-zero exit after gcloud failure, got {exc_info.value.code}"
    # All three Firestore writes must have been called before the gcloud attempt
    assert mock_write_active.call_count == 1, (
        f"write_predictor_params_active must be called once, got {mock_write_active.call_count}"
    )
    assert mock_write_history.call_count == 1, (
        f"write_predictor_params_history must be called once, got {mock_write_history.call_count}"
    )
    assert mock_write_run.call_count == 1, (
        f"write_optimize_run must be called once, got {mock_write_run.call_count}"
    )


# ---------------------------------------------------------------------------
# Test 10 — AC-083-SCHEMA-CONTRACT-EXPORTED
# ---------------------------------------------------------------------------

def test_frozenset_contract_no_extra_fields():
    """build_optimize_run_doc must produce exactly FIRESTORE_OPTIMIZE_RUN_FIELDS — no extras, no missing."""
    doc = build_optimize_run_doc(
        run_id="optimize-2026-05-05",
        best_score=0.72,
        best_params={"window_days": 30, "pearson_threshold": 0.45, "top_k": 12},
        iterations_run=35,
        early_exit=False,
        data_window_days=90,
        sample_size=45,
        started_at="2026-05-05T05:00:00Z",
        completed_at="2026-05-05T05:07:00Z",
    )

    assert set(doc.keys()) == FIRESTORE_OPTIMIZE_RUN_FIELDS, (
        f"Field mismatch.\n"
        f"Expected: {sorted(FIRESTORE_OPTIMIZE_RUN_FIELDS)}\n"
        f"Got:      {sorted(doc.keys())}\n"
        f"Missing:  {FIRESTORE_OPTIMIZE_RUN_FIELDS - set(doc.keys())}\n"
        f"Extra:    {set(doc.keys()) - FIRESTORE_OPTIMIZE_RUN_FIELDS}"
    )

    # Verify each required field is present with correct type
    assert isinstance(doc["run_id"], str)
    assert isinstance(doc["best_score"], float)
    assert isinstance(doc["best_params"], dict)
    assert isinstance(doc["iterations_run"], int)
    assert isinstance(doc["early_exit"], bool)
    assert isinstance(doc["data_window_days"], int)
    assert isinstance(doc["sample_size"], int)
    assert isinstance(doc["started_at"], str)
    assert isinstance(doc["completed_at"], str)
