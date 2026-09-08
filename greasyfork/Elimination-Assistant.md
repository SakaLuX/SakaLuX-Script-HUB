# SakaLuX Elimination Assistant

Complementary add-on for SakaLuX Script Hub, built specifically for Torn Eliminations.

## Current version

**v1.2.8**

## What it does

- Loads Eliminations teams and available target data from Torn API v2.
- Ranks targets with **SAFE / RISKY / SKIP** recommendations.
- Calculates a **Smart Target Score** to surface the most attractive targets first.
- Supports optional **FFScouter** data for Fair Fight and estimated target battle stats.
- Compares estimated target battle stats with your own calibrated battle stats when available.
- Includes **CALIBRATE ME** plus a manual total battle-stats fallback.
- Learns per target from manually recorded **WIN / LOSS** results.
- Includes player search, target filters, smart sorting and quick PROFILE / ATTACK actions.
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