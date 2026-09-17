# 🎯 SakaLuX Mission Rewards

> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.

## Current version
**v1.0.23**

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

**v1.0.23** PDA/mobile top-aligned sheet and compact Hub integration refinement.

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

## Release history
### v1.0.23 — Mobile top alignment
- Opens the script panel from the top of the TornPDA viewport.
- Uses the shared SakaLuX top-alignment contract.

### v1.0.22 — PDA top-aligned panel refinement

- Opens the SakaLuX panel from the top of the available Torn viewport.
- Improves compact Hub integration and mobile visibility.

### v1.0.20 — Shared Standalone ordering fix

- Uses the canonical SakaLuX standalone order including Company Intelligence.
- Unknown/new modules sort after known modules instead of before them.
- Keeps the mobile dock layout and Install SakaLuX Hub button readable.

### v1.0.18 — Restored stable release
- Restored the proven Mission Rewards code path after the experimental Mission Hints integration was rolled back.
- Preserves reliable Hub detection/power controls and Mission Shop intelligence.

### v1.2.0 — Experimental Mission Hints integration (ROLLED BACK)
- Experimented with locally integrated Duke mission Task + Hint guidance.
- Rolled back after it interfered with reliable Mission Rewards startup/detection in TornPDA.
- This version is historical only and is not the active release.

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

## Changelog

### v1.0.21

- Performance/UI optimization: reduces unnecessary repeated DOM work and aligns Mission Rewards controls with the common SakaLuX Hub-style visual foundation.

