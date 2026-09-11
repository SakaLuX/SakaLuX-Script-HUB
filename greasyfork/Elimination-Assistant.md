# ⚔️ SakaLuX Elimination Assistant

Complementary add-on for SakaLuX Script Hub.

## Current version

**v1.3.14**

## What it does

- Loads Eliminations teams and available target data from Torn API v2.
- Loads large teams in rotating groups of up to 500 players with **LOAD NEXT**.
- Ranks targets with **SAFE / RISKY / SKIP** recommendations.
- Calculates a **Smart Target Score** to surface attractive targets first.
- Supports optional **FFScouter** data for Fair Fight and estimated target battle stats.
- Compares estimated target battle stats with your own calibrated battle stats when available.
- Includes **CALIBRATE ME** plus a manual total battle-stats fallback.
- Learns per target from manually recorded **WIN / LOSS** results.
- Includes player search, target filters, smart sorting and quick PROFILE / ATTACK actions.
- Shows target location/availability and includes an **Attackable only** filter.
- Exports attackable SAFE/RISKY targets to TornPDA Chain Targets import format.
- Includes dedicated Torn API and optional FFScouter API access controls.
- Supports persistent ON/OFF control from SakaLuX Script Hub.
- Works with Torn PDA and Tampermonkey.
- Never attacks automatically.

## Current release notes

### v1.3.14 — Compact TARGETS menu

- Replaced the wide inline filter chips with one compact **TARGETS** button beside the player search field.
- TARGETS opens a dropdown panel with **ATTACKABLE**, **SAFE**, **RISKY** and **UNOPENED** checkboxes.
- Multiple filters can be combined; a badge on TARGETS shows how many are active.
- Added **CLEAR** to reset all target filters.
- Removed **SKIP** from the selectable target menu because it represents targets to avoid rather than preferred targets.

### v1.3.13 — Multi-filter targets

- Replaced the single **All targets** dropdown with combinable checkbox filters: **ATTACKABLE**, **SAFE**, **RISKY**, **SKIP** and **UNOPENED**.
- No selected filters means all targets are shown.
- SAFE / RISKY / SKIP combine as OR filters; ATTACKABLE and UNOPENED narrow the result further.
- **UNOPENED** means the target has not yet been opened through the assistant's ATK button on this device.

### v1.3.12 — Inline panel signature

- Removed the floating author badge from the Torn page.
- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.

### v1.3.11 — Persistent SakaLuX signature

- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.
- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.

### v1.3.10

- Removes the foreign **Touching Grass Targets** widget if another userscript injects it inside the SakaLuX Elimination Assistant panel.
- Adds a lightweight mutation guard so the foreign Apply / Target list / Show all card cannot reappear inside the assistant after panel updates.
- No targeting, API, FFScouter or attack logic was changed.

### v1.3.9

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v1.3.8 — PC Hub detection

- Added a persistent installation marker for reliable Script Hub detection on PC/Tampermonkey.

### v1.3.7 — Unified Torn + FFScouter API Access

- Replaced the Settings gear with a gold key button in the Elimination header.
- Added an Enhancer-style API Access panel with exact Torn permission creation and validation.
- Torn API access requests only Battlestats, Elimination and Elimination Team data, with no write permission.
- Added save/test, active key source and clear-local-key controls.
- Added FFScouter below the Torn key with separate save/test, service shortcut and clear controls.
- Preserved the optional manual total battle-stats fallback.
- Automatically returns to the API panel after Torn key creation.

## Recommended

Install **SakaLuX Script Hub** to manage Elimination Assistant together with the rest of the SakaLuX add-ons and to use the shared Hub Torn API key when available.

## Privacy

Elimination Assistant stores its enabled state, selected team, local learning/history, cached FFScouter results, calibration data and standalone API keys locally in browser/TornPDA storage. Torn requests are sent to `api.torn.com`. When FFScouter is enabled, target IDs and the FFScouter API key are sent to `ffscouter.com` to request Fair Fight / battle-stat estimates. FFScouter is optional and separate from the Torn API.

## Important

FFScouter battle stats and Smart Target Score are estimates and advisory only. Equipment, temporary bonuses, weapon effects, merits and other combat factors can change the actual result of a fight. **SAFE** is not a guarantee of victory.

The script never attacks automatically; ATTACK only opens the Torn attack page and the player remains in control of the fight.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
