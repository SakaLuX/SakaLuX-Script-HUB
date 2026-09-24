# ⚔️ SakaLuX Elimination Assistant

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.3.46**


## Repository synchronization

- Verified: **2026-09-20**
- Canonical version: **v1.3.45**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Elimination-Assistant.md
- GreasyFork page: https://greasyfork.org/scripts/594921
- Install/download URL: https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js
- Update metadata URL: https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js

## What it does
- Loads Eliminations teams and available target data from Torn API v2.
- Loads large teams in rotating groups of up to 500 players with LOAD NEXT.
- Ranks targets with SAFE / RISKY / SKIP recommendations and Smart Target Score.
- Supports optional FFScouter Fair Fight / battle-stat estimates.
- Compares estimated target battle stats with your own calibrated/manual battle stats.
- Learns per target from manually recorded WIN / LOSS results.
- Includes player search, filters, sorting, PROFILE / ATTACK actions and attackable-state checks.
- Exports SAFE/RISKY attackable targets to TornPDA Chain Targets format.
- Remembers SAFE targets across batches/sessions and supports copy/export/remove/clear actions.
- Includes dedicated Torn API and optional FFScouter access controls.
- Supports persistent ON/OFF control from Script Hub.
- Never attacks automatically.

## Current release note

**v1.3.46 — Release metadata synchronization**
- Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.
- Deduplicates standalone registrations by module id before rendering.
- Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page.

## Recommended
Install **SakaLuX Script Hub** to manage Elimination Assistant with the other registered add-ons and use the shared Hub Torn API key when compatible.

## Privacy
Elimination Assistant stores enabled state, selected team, remembered SAFE targets, learning/history, cached FFScouter results, calibration data and standalone API keys locally. Torn requests go to `api.torn.com`. When FFScouter is enabled, target IDs and the FFScouter API key are sent to `ffscouter.com` for estimates.

## Important
- FFScouter battle stats and Smart Target Score are estimates only.
- Equipment, temporary bonuses, weapon effects, merits and other combat factors can change the actual result.
- SAFE is not a guarantee of victory.
- ATTACK only opens Torn's attack page; the player remains in control of every fight.

## License
**All Rights Reserved**

## Release history / Changelog



### v1.3.46 — Release metadata synchronization
- Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.
- Deduplicates standalone registrations by module id before rendering.
- Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page.

### v1.3.45 — Release metadata synchronization
- Uses the userscript metadata version as the canonical installed-version signal for Script Hub, preventing false UPDATE AVAILABLE states.
- Disconnects the panel-specific observer when the module is disabled.
- Removes the document click handler associated with the discarded panel.
- Prevents observer and detached-panel accumulation across disable/re-enable cycles; target preferences remain saved.

### v1.3.44 — Lifecycle cleanup
- Prevents observer and detached-panel accumulation during disable/re-enable cycles.

### v1.3.43 — Performance and TornPDA smoothness

- Uses constant-time Hub detection in standalone maintenance.
- Batches standalone refreshes and ignores chat/dock/footer mutations.
- Preserves target settings, learning records and attack links.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v1.3.42 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.
- Limits SAFE/persistence installation observers to top-level panel lifecycle changes.
- Skips rebuilding the standalone dock when its module entries have not changed.

### v1.3.41 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.3.40 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.3.39 — Mobile UI refinement
- Refines TARGETS switches with consistent sizing and alignment.
- Extends the mobile panel closer to the chat controls while keeping the target list independently scrollable.
- Fits the opaque SAFE sheet inside the panel with a visible title, aligned buttons and a scrollable saved-target list.
- Fits Torn/FFScouter API-key and manual battle-stat inputs within the panel; keeps SAVE MANUAL BS fully visible and reachable by scrolling.
- UI-only release: preserves target calculations, API behavior, saved data and manual attack controls.

### v1.3.38 — Hub isolation
- Excludes Script Hub and its subtree from shared styling/fullscreen rules.
- Restricts the author footer to the native Elimination panel.

### v1.3.37 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v1.3.36 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling works normally while the translucent blur surface is preserved.

### v1.3.35 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.3.34 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.3.33 — PDA top-aligned panel refinement
- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v1.3.32
- Performance/UI optimization: reduces duplicate observer-driven work and aligns assistant controls with the shared SakaLuX Hub-style UI foundation while preserving attack safety behavior.

### v1.3.31 — Desktop ATTACK route fix
- Uses Torn's current `/page.php?sid=attack&user2ID=...` route.
- Preserves TornPDA compatibility and manual player control.

### v1.3.28 — Hub detection fix
- Recognizes current Hub launchers/active marker and suppresses standalone prompts while Hub is installed.

### v1.3.24 — Compact native S standalone launcher
- Added the compact native S/shared standalone dock behavior.

### v1.3.20 — Team dropdown recovery
- Added nested/keyed response support, valid-team caching and saved-team validation.

### v1.3.19 — Persistent target controls
- Persists target filters, player search and panel-open state.

### v1.3.18 — Persistent SAFE Targets
- Added persistent SAFE collection with copy/export/remove/clear actions.

### v1.3.17 — Violentmonkey Hub bridge
- Added canonical installation marker and isolated-context OPEN/ON/OFF bridge.

### v1.3.16 — Refined professional target switches
- Reworked target toggles into compact switches with restrained visual accents.

### v1.3.15 — Compact sliding target switches
- Replaced oversized checkboxes with compact sliding target switches.

### v1.3.14 — Compact TARGETS menu
- Moved attackable/SAFE/RISKY/unopened filters into one compact menu.

### v1.3.13 — Multi-filter targets
- Added combinable target filters and unopened-target state.

### v1.3.12 — Inline panel signature
- Moved the SakaLuX signature inside the module panel.

### v1.3.11 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v1.3.10 — Foreign-widget isolation
- Prevented external Touching Grass Targets UI from being injected inside the SakaLuX panel.

### v1.3.9 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style.

### v1.3.8 — PC Hub detection
- Added reliable PC/Tampermonkey installation detection.

### v1.3.7 — Unified Torn + FFScouter API Access
- Added the dedicated Torn/FFScouter API Access panel, exact Torn read-only permissions and calibration fallback.
