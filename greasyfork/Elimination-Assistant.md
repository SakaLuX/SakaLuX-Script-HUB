# SakaLuX Elimination Assistant

**Current version:** v1.2.5  
**Greasy Fork:** 594921  
**Category:** Combat / Eliminations

## What it does

SakaLuX Elimination Assistant is a Torn PDA / Tampermonkey helper for the Eliminations event. It does not attack automatically. It combines Torn Eliminations data, optional FFScouter estimates, your own battle stats when available, and your recorded fight outcomes to rank targets more personally.

## Hub ON / OFF control

From v1.2.5, the script can stay installed while being disabled from SakaLuX Script Hub.

- Hub quick action: **⏻ ON / OFF**
- OFF hides the `ELIM ⚔` launcher and closes/removes the assistant panel.
- OFF prevents automatic refresh/scans from starting.
- The disabled state is saved locally and survives page reloads.
- The script API stays available to SakaLuX Script Hub so Hub can turn it back on without reinstalling it.
- Pressing **OPEN** from Hub intentionally re-enables the assistant because opening it means you want to use it again.

This is intended for Eliminations because the event is only used periodically and the assistant does not need to stay active all year.

## API keys

### Torn API key

The assistant needs a **Custom Torn API key** with all of these permissions:

- **User:** `basic`, `battlestats`
- **Torn:** `elimination`, `eliminationteam`

`basic` and `battlestats` are used for your own data and **CALIBRATE ME**. `elimination` and `eliminationteam` are required to load Eliminations teams and targets.

Settings includes **🔑 CREATE REQUIRED TORN KEY**. Pressing it opens Torn's API-key creation page preconfigured with all four required permissions and the key name `SakaLuX_Elimination_Assistant`.

Torn still shows the permissions for confirmation. Create a **new key**, copy it, then paste it back into the Torn API key field in Elimination Assistant.

If you do not want to grant `battlestats`, you can enter your **total battle stats manually** in Settings, but the key still needs the Torn Eliminations permissions for team/target loading.

### FFScouter API key

The FFScouter key is **separate and optional**. It is used for Fair Fight and target battle-stat estimates. It is not the Torn API key.

## v1.2.5

- Added persistent **ON / OFF** control designed for SakaLuX Script Hub.
- Added Hub quick action **⏻ ON / OFF**.
- OFF removes the floating ELIM button and assistant panel without uninstalling the userscript.
- OFF blocks refresh and scanning work until the module is enabled again.
- Disabled state is stored in `slx_elim_enabled` and survives Torn reloads.
- Hub can still detect the installed script while it is OFF and can re-enable it instantly.
- `health()` now reports the module's `enabled` state.

## v1.2.4

- Fixed the one-click Torn key creator after API error 16 / `Access level of this key is not high enough`.
- The generated Custom key now requests **User: `basic,battlestats`** and **Torn: `elimination,eliminationteam`**.
- Settings lists all four required permissions explicitly.
- The key-creation status message tells the user to create a **new** key and copy it back into Settings.
- Access-level errors point to the corrected key creator.

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
- Target signal can show an advantage such as `4.0× edge`.
- Added **Smart Target Score 0–100**, where higher means a more attractive target according to the available signals.
- Smart Score combines risk, FF, BS advantage, activity, availability and learned fight history.
- Added **High / Medium / Low confidence** based on whether FF and BS estimates are available.
- Added **attack-result learning** with manual `WIN` and `LOSS` buttons beside every target.
- Repeated wins lower future risk for that target; repeated losses increase future risk.
- Added per-target learned record such as `3W/1L`.
- Added a `Learned targets` filter.
- Added sort by Smart Score and BS advantage.
- `BEST 10` ranks SAFE/RISKY targets by Smart Score.
- Attack history stores FF, target BS estimate and your calibrated BS at the time of the record.
- Added `CALIBRATE` as a SakaLuX Script Hub quick action.

## How learning works

Opening `ATTACK` stores a local attack-open record. After the fight finishes, return to the assistant and press `WIN` or `LOSS` for that player. The result is stored locally and influences that target's future recommendation.

Learning is target-specific. The assistant does not claim that a win against one player proves another player with similar level or stats is safe.

## Important notes

FFScouter battle stats are estimates. Personal calibration improves the comparison but cannot guarantee a win. Equipment, temporary bonuses, weapon effects, passives and other combat factors can change an actual fight result.

The FFScouter API key remains optional. Without it, the script continues to work with Torn data, but Smart Score confidence will generally be lower.
