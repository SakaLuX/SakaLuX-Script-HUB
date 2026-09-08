# SakaLuX Elimination Assistant

**Current version:** v1.2.2  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically. It combines Torn Eliminations data, optional FFScouter estimates, your own battle stats when available, and your recorded fight outcomes to rank targets more personally.

## API keys

### Torn API key

For normal team loading, the script uses Torn API data. For **CALIBRATE ME**, create a **Custom Torn API key** and enable the **`battlestats`** permission.

A Public-only Torn key cannot expose your private battle stats. If the key does not have enough access, Torn can return API error 16 (access level not high enough).

If you do not want to grant `battlestats`, you can enter your **total battle stats manually** in Settings and the Smart Target Score can still use that value.

### FFScouter API key

The FFScouter key is **separate and optional**. It is used for Fair Fight and target battle-stat estimates. It is not the Torn API key.

## v1.2.2

- Settings now clearly states that automatic calibration needs a **Custom Torn API key with `battlestats` enabled**.
- Added an API-key help box directly in the Settings panel.
- Clearly separates the Torn API key from the optional FFScouter API key.
- `CALIBRATE ME` now gives a specific error when the Torn key does not have sufficient access.
- Error message tells the user to either replace the Torn key with a `battlestats` Custom key or enter total battle stats manually.
- Torn API error codes are now preserved internally so access error 16 can be explained correctly.
- Keeps the shared once-per-24h SakaLuX Hub install reminder.

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
