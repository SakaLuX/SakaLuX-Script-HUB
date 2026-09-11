# 🧰 SakaLuX Suite [EXPERIMENTAL]

Standalone experimental SakaLuX toolkit for Torn PDA and desktop userscript managers. It is intentionally not registered as a SakaLuX Script Hub add-on.

## Current version

**v0.9.908**

## What it does

SakaLuX Suite combines multiple Torn helper modules into one userscript installation.

### Included modules

- Daily Prayer Bell
- Recovery Planner
- Item Signal
- Event Lens
- Faction Pulse
- Member Travel Map
- Armory Loan Radar
- War Performance
- OC Role Match + Readiness
- Company Console
- Race League Board
- Odds Scout
- Target Alerts

### Additional SakaLuX tools

- Chain Alarm with persistent thresholds and panel position.
- Launch bridges for Enhancer Guard, Bazaar Thanker, Market Intelligence, Mission Rewards and Elimination Assistant.
- Automatic migration of previous SakaLuX Suite module states and its shared Torn API key.
- Master Control with sliding ON/OFF switches and module-specific settings where supported.
- Persistent control-window and scroll position while toggling modules.
- Shared Torn API-key storage.
- Settings import/export with the API key excluded.
- `Alt + F` shortcut for opening the control interface.

## Current release notes

### v0.9.908 — Persistent SakaLuX signature

- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.
- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.

### v0.9.907

- Adopted the unified **SakaLuX Control Center** visual system used by Script Hub.
- Standardized panels, cards, buttons, inputs, borders, spacing and compatible settings toggles for a more consistent TornPDA/desktop experience.
- UI-only release: existing features, APIs and saved data remain unchanged.

### v0.9.905

- Restored the established SakaLuX name for every visible module and panel.
- Removed the external base name from script metadata, documentation and validation messages.
- Kept one TornPDA-compatible GM request grant instead of advertising both API variants.
- Retained every Item Signal rule and the working Event Lens TornPDA compatibility fix.
- Increased TornPDA Event Lens text sizes and changed event names/links to high-contrast gold.
- Restored clickable Trade continuation links inside expanded Event Lens cards.
- Preserved the standalone SakaLuX launch bridges and Chain Alarm.
- Added automated checks for all 13 principal module/factory pairs.

## Recommended

Use SakaLuX Suite if you prefer a single experimental all-in-one userscript instead of managing several independent helper scripts.

For the stable modular ecosystem, use **SakaLuX Script Hub** with its registered complementary add-ons. Suite remains separate and should not appear in the Hub registry unless that product decision is intentionally changed later.

## Privacy

- The shared Torn API key used by Suite is stored locally.
- Exported Suite settings intentionally exclude the API key.
- Module preferences and local runtime state are stored in the userscript/browser environment.
- Individual modules can access Torn data required for their functions; users should review enabled modules and API permissions before use.

## Important

SakaLuX Suite is marked **EXPERIMENTAL**. Its modules share one large userscript runtime, so a regression in one area can potentially affect other Suite modules more broadly than with standalone add-ons.

The Suite does **not** automate attacks, crimes, bets, item consumption or race entry. Recommendations, alerts and analysis remain advisory or user-triggered.

SakaLuX Suite is intentionally **not registered in `scripts.json`** and therefore must not appear as a required/recommended module inside Script Hub.

## License

**All Rights Reserved — Copyright © 2026 SakaLuX [2380374].** Personal use and private modification are permitted. Public redistribution, republication, rebranding, or publication of modified versions requires prior written permission.
