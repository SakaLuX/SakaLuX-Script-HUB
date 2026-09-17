# 🎯 SakaLuX Mission Rewards

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.0.36**

## What it does
- Enhances Torn's Mission Shop with practical reward information for PDA and Tampermonkey users.
- Shows estimated market value and value per mission credit.
- Shows currently owned special ammo.
- Tracks normal/special weapon-mod credit ranges locally from offers seen on the device.
- Adds information directly to Mission Shop reward cards plus a detailed reward panel.
- Includes refresh controls, local caching and API-key support.
- Exposes `window.SakaLuXMissionRewards` for Hub integration on every Torn page.
- Keeps Mission Shop-specific scanning inactive outside Missions.

## Current release note

**v1.0.36** Copies the complete working Elimination Assistant donation/footer implementation into Mission Rewards, changing only the target panel selector/footer ID. Keeps one native SEND MONEY / SEND ITEMS + Made with ❤️ footer.

**v1.0.35** Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs. Ignores Mission/Hub settings and self-generated reward decorations in the reward observer to avoid redundant scans.

## Recommended
Install **SakaLuX Script Hub** to manage Mission Rewards with the other registered add-ons and use the shared Hub API key when available.

## Privacy
Mission Rewards stores settings, catalogue cache, ammo cache and learned weapon-mod ranges locally. Torn API requests are sent to `api.torn.com` and use only the active key required for module data. No Torn API write permissions are requested.

## Important
- Market values and value-per-credit calculations are estimates.
- Weapon-mod ranges are learned locally from offers seen by the script and are guidance, not guaranteed future Mission Shop prices.
- The experimental v1.2.0 Mission Hints branch was rolled back; the active/canonical release is v1.0.18.

## License
**All Rights Reserved**

## Release history / Changelog

### v1.0.36 — Elimination footer parity
- Copies the complete working Elimination Assistant donation/footer implementation into Mission Rewards, changing only the target panel selector/footer ID. Keeps one native SEND MONEY / SEND ITEMS + Made with ❤️ footer.

### v1.2.0 — Experimental Mission Hints integration (ROLLED BACK)
- Experimented with locally integrated Duke mission Task + Hint guidance.
- Rolled back after it interfered with reliable Mission Rewards startup/detection in TornPDA.
- This version is historical only and is not the active release.

### v1.0.35 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.
- Ignores Mission/Hub settings and self-generated reward decorations in the reward observer to avoid redundant scans.

### v1.0.34 — Remove duplicate API button
- Removes the duplicate lower API ACCESS button. Dedicated API Access remains available through the header key button.

### v1.0.33 — Full-width footer and dedicated API Access
- Pins the 50px donation/author footer across the full panel width while settings scroll independently. Adds dedicated API Access with required Items/Ammo permissions, local-key save/test/clear and active Hub/TornPDA key source.

### v1.0.32 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v1.0.31 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v1.0.30 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v1.0.29 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v1.0.28 — Hub-aware observer shutdown
- Stops the standalone document observer as soon as Script Hub is detected.
- Keeps normal standalone behavior when Hub is absent.
- Reduces unnecessary work during Hub scrolling and button taps.

### v1.0.27 — TornPDA performance
- Removes the recurring standalone render interval.
- Throttles DOM-driven standalone refreshes.
- Avoids repeated work while Script Hub is active.

### v1.0.26 — Standalone panel repair
- Restores Standalone OPEN behavior.
- Removes shared full-sheet dimension forcing from the module panel.
- Keeps native module sizing and TornPDA touch behavior.

### v1.0.25 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling works normally while the translucent blur surface is preserved.

### v1.0.24 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v1.0.23 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.0.22 — PDA top-aligned panel refinement
- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v1.0.21
- Performance/UI optimization: reduces unnecessary repeated DOM work and aligns Mission Rewards controls with the common SakaLuX Hub-style visual foundation.

### v1.0.20 — Shared Standalone ordering fix
- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

### v1.0.18 — Restored stable release
- Restored the proven Mission Rewards code path after the experimental Mission Hints integration was rolled back.
- Preserves reliable Hub detection/power controls and Mission Shop intelligence.

### v1.0.16 — Hub detection fix
- Recognizes current Hub launchers/active marker and suppresses standalone prompts while Hub is installed.

### v1.0.12 — Compact native S standalone launcher
- Added the compact native S/shared standalone dock behavior.

### v1.0.7 — Inline panel signature
- Moved the SakaLuX signature inside the module panel.

### v1.0.6 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v1.0.5 — Unified Control Center visual system
- Adopted the shared SakaLuX panels, cards, buttons, inputs, borders, spacing and switches.

### v1.0.4 — Hub power/API integration
- Added reliable installation detection, `setEnabled`/`toggleEnabled`/`isEnabled`, shared-Hub-key preference and standalone required-key support.
