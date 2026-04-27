# MA99 30-Day Trend Filter Decision

## Status

Decision recorded on 2026-04-09.
This document captures the agreed direction only. No backend behavior is changed by this note yet.

## Background

Current K-Line-Prediction behavior determines the query MA trend from the input-aligned MA series and uses the first/last MA value delta to classify `up`, `down`, or `flat`.

For `timeframe = 1H`, the system first aggregates the input into `1D`, then evaluates MA trend on the aggregated daily MA series.

This has two problems:

1. The trend window is effectively tied to the current input length, so a short input such as 24h ends up using only a very short MA context.
2. Trend direction and MA similarity are mixed conceptually. The current direction check is a simple endpoint delta, while MA similarity already uses Pearson.

## Decision

We should change the MA trend filter to use a fixed 30-day MA99 trend window.

### Query-side trend window

- Use the input end time as the anchor.
- Build a window that includes the input end time and goes backward for a total of 30 days.
- Compute the MA99 series on that 30-day window.
- Use this 30-day MA99 series as the source for trend classification.

For `timeframe = 1H`:

- First aggregate bars to `1D`.
- Then select the last 30 daily bars ending at the input end date.
- Compute MA99 for those 30 daily bars using historical prefix bars when available.

### Candidate-side trend window

Each historical candidate must use the same rule:

- Anchor at the candidate window end time.
- Build a 30-day window ending at that date.
- Compute that candidate's MA99 series.
- Classify its trend with the same rule as the query.

This keeps the trend filter symmetric between query and candidate.

## Trend Classification Rule

Trend direction should be classified by Pearson correlation against a linear reference line, not by simple first/last delta.

Recommended approach:

1. For a 30-point MA99 series, create a reference line `[0, 1, 2, ..., 29]`.
2. Compute Pearson correlation `r` between the MA99 series and the reference line.
3. Map `r` to direction:
   - `r >= threshold` => `up`
   - `r <= -threshold` => `down`
   - otherwise => `flat`

Recommended initial threshold: `0.4`

Reason:

- It is conservative enough to avoid classifying tiny oscillations as a meaningful trend.
- It still allows gently sloped but visually coherent MA sequences to be recognized as directional.

## Why This Is Recommended

This design separates two different concepts cleanly:

1. Trend filter:
   "Is this 30-day MA99 trajectory broadly upward, downward, or flat?"

2. MA similarity score:
   "How similar is the candidate MA99 shape to the query MA99 shape?"

The first question should use Pearson against a standard linear reference.
The second question should continue using Pearson between query and candidate MA series.

Using query-vs-candidate Pearson directly to define trend is not recommended, because that answers "similar or not" rather than "up/down/flat".

## 24h Input Example

If the user provides 24 hours of `1H` data:

1. Aggregate that 24h input into `1D`.
2. Use the input end date as the anchor.
3. Pull the previous daily bars from history so the total daily context is 30 days including the input end date.
4. Compute the 30-day daily MA99 series.
5. Classify the query trend by Pearson against the linear reference line.
6. Compare only against candidates whose own 30-day MA99 trend classification matches.

So under the new rule, 24h input no longer derives its trend from just one aggregated day or from a short aligned segment. It always asks: "What is the MA99 direction over the last 30 days ending here?"

## Scoring Recommendation

After candidate filtering:

- Keep the current candle similarity scoring path.
- Keep MA similarity as Pearson between the query 30-day MA99 series and the candidate 30-day MA99 series.
- Keep the weighted combination structure unless product requirements change separately.

In other words:

- trend classification uses Pearson vs linear reference
- MA similarity uses Pearson query vs candidate

These should remain two separate steps.

## Implementation Notes

Suggested backend changes when we implement this:

1. Add a helper that fetches a fixed-length window ending at a specific timestamp.
2. Add a helper that classifies MA trend from Pearson against a linear reference.
3. Update query MA trend extraction to always produce a 30-day MA99 trend series.
4. Update candidate MA trend extraction to use each candidate's own trailing 30-day window.
5. Keep `ma99_trend_override` behavior as a manual override for the target direction.

## Open Choices For Implementation

These are still implementation details, not product decisions:

- Whether the threshold should be a constant in `predictor.py` or a config value.
- Whether override mode should bypass only query trend extraction or also skip candidate trend recomputation.
- Whether we want debug logging or response metadata to expose the computed 30-day trend classification.

## Recommendation Summary

Recommended final rule:

- Use a fixed trailing 30-day MA99 window for both query and candidate.
- Classify `up/down/flat` by Pearson correlation against a linear reference line.
- Start with threshold `0.4`.
- Continue using query-vs-candidate Pearson only for MA similarity scoring, not for trend labeling.
