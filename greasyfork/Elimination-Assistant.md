# SakaLuX Elimination Assistant

**Current version:** v1.2.4  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically. It combines Torn Eliminations data, optional FFScouter estimates, your own battle stats when available, and your recorded fight outcomes to rank targets more personally.

## API keys

### Torn API key

The assistant needs a **Custom Torn API key** with all of these permissions:

- **User:** `basic`, `battlestats`
- **Torn:** `elimination`, `eliminationteam`

`basic` and `battlestats` are used for your own data and **CALIBRATE ME**. `elimination` and `eliminationteam` are required to load Eliminations teams and targets.

From v1.2.4, Settings includes **🔑 CREATE REQUIRED TORN KEY**. Pressing it opens Torn's official API-key creation page preconfigured with all four required permissions and the key name `SakaLuX_Elimination_Assistant`.

Torn still shows the permissions for confirmation. Create a **new key**, copy it, then paste it back into the Torn API key field in Elimination Assistant.

If you do not want to grant `battlestats`, you can enter your **total battle stats manually** in Settings, but the key still needs the Torn Eliminations permissions for team/target loading.

### FFScouter API key

The FFScouter key is **separate and optional**. It is used for Fair Fight and target battle-stat estimates. It is not the Torn API key.

## v1.2.4

- Fixed the one-click Torn key creator after API error 16 / `Access level of this key is not high enough`.
- The generated Custom key now requests **User: `basic,battlestats`** and **Torn: `elimination,eliminationteam`**.
- Settings now lists all four required permissions explicitly.
- The key-creation status message now tells the user to create a **new** key and copy it back into Settings.
- Access-level errors now point to the corrected key creator.
- Registry / SakaLuX Hub version updated to v1.2.4.

## v1.2.3

- Added **🔑 CREATE REQUIRED TORN KEY** directly in Settings.
- Added `API KEY` as a SakaLuX Script Hub quick action.
- Calibration errors point directly to the key-creation button.
- Keeps the manual battle-stats fallback and the separate optional FFScouter key.

## v1.2.2

- Settings clearly states that automatic calibration needs a **Custom Torn API key with `battlestats` enabled**.
- Added an API-key help box directly in the Settings panel.
- Clearly separates the Torn API key from the optional FFScouter API key.
- `CALIBRATE ME` gives a specific error when the Torn key does not have sufficient access.
- Torn API error codes are preserved internally so access error 16 can be explained correctly.
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
