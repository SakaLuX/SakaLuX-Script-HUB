# SakaLuX Elimination Assistant

**Current version:** v1.2.0  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically. It combines Torn Eliminations data, optional FFScouter estimates, your own battle stats when available, and your recorded fight outcomes to rank targets more personally.

## v1.2.0

- Added **Personal Risk Calibration** using your own total battle stats.
- `CALIBRATE ME` attempts to read your battle stats from the Torn API and caches the result.
- Added a manual total battle-stats fallback in Settings when the current API key cannot expose battlestats.
- Added direct comparison between your BS and FFScouter target BS estimate.
- Target signal can now show an advantage such as `4.0× edge`.
- Added **Smart Target Score 0–100**, where higher means a more attractive target according to the available signals.
- Smart Score combines risk, FF, BS advantage, activity, availability and learned fight history.
- Added **High / Medium / Low confidence** based on whether FF and BS estimates are actually available.
- Added **attack-result learning** with manual `WIN` and `LOSS` buttons beside every target.
- Repeated wins lower future risk for that target; repeated losses increase future risk.
- Added per-target learned record such as `3W/1L`.
- Added a `Learned targets` filter.
- Added sort by Smart Score and BS advantage.
- `BEST 10` now ranks SAFE/RISKY targets by Smart Score rather than generic risk alone.
- Attack history stores FF, target BS estimate and your calibrated BS at the time of the record.
- Added `CALIBRATE` as a SakaLuX Script Hub quick action.
- Preserves FFScouter caching, Torn-only fallback, PDA support, MIT license and Greasy Fork auto-update metadata.

## How learning works

Opening `ATTACK` stores a local attack-open record. After the fight finishes, return to the assistant and press `WIN` or `LOSS` for that player. The result is stored locally and influences that target's future recommendation.

Learning is target-specific. The assistant does not claim that a win against one player proves another player with similar level or stats is safe.

## Important notes

FFScouter battle stats are estimates. Personal calibration improves the comparison but cannot guarantee a win. Equipment, temporary bonuses, weapon effects, passives and other combat factors can change an actual fight result.

The FFScouter API key remains optional. Without it, the script continues to work with Torn data, but Smart Score confidence will generally be lower.
