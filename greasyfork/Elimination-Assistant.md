# SakaLuX Elimination Assistant

Complementary add-on for SakaLuX Script Hub, built specifically for Torn Eliminations.

## v1.3.6 — Visible Lvl/Last + new-tab attacks

- **Lvl** values now use high-contrast gold text and **Last** values use high-contrast light cyan text.
- Both columns are bold and protected from Torn theme color overrides.
- **ATK** now opens the attack page in a separate tab, keeping Elimination Assistant open in the original tab.

## v1.3.5 — LOAD NEXT batches + stacked actions

- **L** now sits directly under **W**, with **ATK** beside them, so Actions fits better on TornPDA.
- **LOAD NEXT** replaces LOAD and retrieves the next group of up to 500 different team members.
- Only the active group is kept in memory, so moving through a large team does not make the panel progressively heavier.
- The current group is remembered per team; after the last group, the next press returns to targets 1–500.
- FFScouter enrichment and all existing filters continue to work on the currently loaded group.

## v1.3.4 — Target availability + TornPDA export

- Shows each 🟢 **Torn**, ✈️ **Flying**, 🌍 **Abroad**, 🏥 **Hospital**, 🔒 **Jail**, Federal, Fallen or Unknown directly below every target.
- Added **Attackable only**, which keeps only players currently reported in Torn.
- Known unavailable targets remain visible under **All targets**, but their ATK action is replaced by WAIT.
- Added **EXPORT**: copies the current attackable SAFE/RISKY results in TornPDA's real `target_backup` import format.
- Import path after copying: **TornPDA → Chaining → Targets → Import / Export → paste → Add**.
- The exported notes retain the SakaLuX recommendation and Smart Target Score; SAFE entries are green and RISKY entries red.





## v1.3.3 — Compact attack-first TornPDA layout

- Moved the target filter beside Player / ID and moved CALIBRATE into the thin status bar.
- Reduced header/control height to show substantially more targets.
- Signal / Player / Lvl / Last / Actions now use fixed mobile columns on one row.
- Signal is condensed to two lines and actions are compact ATK / W / L controls.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.3.2.user.js`.

## v1.3.2 — LOAD rendering + mobile readability

- Fixed **LOAD** so team rows render immediately even when FFScouter is unreachable.
- FFScouter failures are now non-blocking: the Torn team list remains visible and the status line explains that only FF enrichment failed.
- Increased text size, spacing and contrast for TornPDA/mobile.
- SAFE is brighter green, RISKY amber and SKIP rose/red; headers and action buttons are clearer.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.3.1.user.js`.

## v1.3.1 — Battle Stats API v2 Fix

- Fixed CALIBRATE ME for Torn API v2 battlestats object values and battlestats.total.
- Added exact backup: backups/SakaLuX-Elimination-Assistant-v1.3.0.user.js.

## v1.3.0 — TornPDA JSON Transport Fix

- Fixed `Unexpected end of JSON input` on TornPDA when the PDA bridge returns an empty or differently shaped response object.
- API responses now accept `responseText`, `body`, `data`, `response`, or an already-decoded object.
- If the TornPDA bridge fails or returns an unusable response, the script falls back to `GM_xmlhttpRequest` and then normal `fetch` instead of stopping immediately.
- Empty and malformed responses now show clear errors instead of raw JSON parser messages.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.2.9.user.js`.

## Current version

**v1.3.6**

## What it does

- Loads Eliminations teams and available target data from Torn API v2.
- Loads large teams in rotating groups of up to 500 players with **LOAD NEXT**.
- Ranks targets with **SAFE / RISKY / SKIP** recommendations.
- Calculates a **Smart Target Score** to surface the most attractive targets first.
- Supports optional **FFScouter** data for Fair Fight and estimated target battle stats.
- Compares estimated target battle stats with your own calibrated battle stats when available.
- Includes **CALIBRATE ME** plus a manual total battle-stats fallback.
- Learns per target from manually recorded **WIN / LOSS** results.
- Includes player search, target filters, smart sorting and quick PROFILE / ATTACK actions.
- Shows target location/availability and includes an **Attackable only** filter.
- Exports attackable SAFE/RISKY targets to TornPDA Chain Targets import format.
- Includes **TEST TORN KEY** so API permissions and endpoint availability can be checked separately.
- Includes one-click Torn API-key creation helper and keeps the FFScouter key separate.
- Works with Torn PDA and Tampermonkey.
- Never attacks automatically.

## Script Hub integration

Elimination Assistant is registered as a complementary add-on in SakaLuX Script Hub.

Because Eliminations is only used periodically, the Hub includes a persistent power control:

- **ON** is shown in green and exposes OPEN, REFRESH, FF SCAN, CALIBRATE, TEST KEY, API KEY and ELIMS.
- **OFF** is shown in red and hides every other Elimination action, leaving only the OFF button visible.
- The OFF state survives page reloads without uninstalling the script.
- Turning it back ON restores all actions immediately.

If Script Hub is not installed, Elimination Assistant uses the same shared 24-hour Hub reminder cooldown as the other SakaLuX add-ons.

## API keys

### Torn API key

The Torn key is used for Eliminations data and personal calibration. The script can test these capabilities independently:

- `battlestats`
- `elimination`
- `eliminationteam`

Use **TEST TORN KEY** after pasting a key.

- **API 16** is treated as a permission/access problem.
- **API 32** on `eliminationteam` is treated as the event endpoint being temporarily unavailable, not as proof that your key is bad.

### FFScouter API key

The FFScouter key is separate and optional. It provides Fair Fight and estimated target battle-stat data when available.

## Current release notes

### Hub v1.9.0 integration

- Automatically prefers the shared SakaLuX Hub Torn API key when Hub is installed.
- Keeps its standalone Torn key creator and local fallback key when used without Hub.
- FFScouter remains optional and separate because it is an external service, not part of the Torn API.

### v1.2.9

- Changed project licensing from MIT to **All Rights Reserved** and added explicit author/copyright protection.
- Added `Copyright © 2026 SakaLuX [2380374]` and retained-author requirements.
- Personal use and private modification remain permitted; redistribution/republication require prior written permission.


### v1.2.8
- Added correct handling for Torn API **32** on `eliminationteam`.
- `TEST TORN KEY` now reports `eliminationteam` as unavailable instead of incorrectly marking the API key as rejected.
- Team loading now gives a clear event-endpoint unavailable message for API 32.
- Improved Hub power behavior so **OFF** leaves only the red OFF button visible.
- Turning the module **ON** restores all Elimination quick actions.

### v1.2.7
- Fixed the Torn PDA / Hub lock caused by the previous DOM observer approach.
- Removed the self-triggering Hub `MutationObserver`.
- Kept explicit **ON = green / OFF = red** state.
- Fixed duplicate API-key creation navigation in Torn PDA.
- Added endpoint-specific Torn key diagnostics.

## Important

FFScouter battle stats are estimates and Smart Target Score is advisory only. Equipment, temporary bonuses, weapon effects and other combat factors can affect the actual result of a fight.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
