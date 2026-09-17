# 🧰 SakaLuX Suite [EXPERIMENTAL]

> Standalone experimental SakaLuX toolkit. **Not registered in SakaLuX Script Hub.**

## Current version
**v0.9.922**

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
- Automatic migration of previous Suite module states and shared Torn API key.
- Master Control with sliding ON/OFF switches and module-specific settings.
- Persistent control-window and scroll position while toggling modules.
- Shared Torn API-key storage.
- Settings import/export with the API key excluded.
- `Alt + F` shortcut for the control interface.

## Current release note

**v0.9.922** Fixes Master Control scrolling by bounding the flex content area on desktop and TornPDA; keeps header/toolbar and footer outside the scrolling module list. Renders the 20px SEND MONEY / SEND ITEMS controls and orange Made with ❤️ author line directly inside every panel render, with rounded lower corners. Preserves module switches and scroll position, and removes the separate document-wide footer repair observer.

## Recommended
Use SakaLuX Suite if you prefer one experimental all-in-one userscript. For the stable modular ecosystem, use **SakaLuX Script Hub** with its registered complementary add-ons.

## Privacy
- The shared Torn API key used by Suite is stored locally.
- Exported Suite settings intentionally exclude the API key.
- Module preferences and local runtime state are stored in the userscript/browser environment.
- Individual modules can access Torn data required for their functions; review enabled modules and API permissions before use.

## Important
- SakaLuX Suite is **EXPERIMENTAL**. Its modules share one large runtime, so a regression in one area can affect other Suite modules more broadly than standalone add-ons.
- Suite does not automate attacks, crimes, bets, item consumption or race entry. Recommendations, alerts and analysis remain advisory/user-triggered.
- Suite is intentionally **not registered in `scripts.json`** and must not appear as a required Hub module unless that product decision changes intentionally.

## License
**All Rights Reserved**

## Release history / Changelog


### v0.9.922 — Master Control scroll and native footer

- Fixes Master Control scrolling by bounding the flex content area on desktop and TornPDA; keeps header/toolbar and footer outside the scrolling module list.
- Renders the 20px SEND MONEY / SEND ITEMS controls and orange Made with ❤️ author line directly inside every panel render, with rounded lower corners.
- Preserves module switches and scroll position, and removes the separate document-wide footer repair observer.
### v0.9.920 — Performance and release metadata audit
- Restricts donation-footer updates to the native module root; unrelated Torn and other-module DOM changes no longer schedule footer repairs.

### v0.9.919 — Elimination panel layout and 20px donation buttons
- Uses Elimination mobile panel sizing: top aligned, 4px side gaps, 36px bottom clearance for chat and 14px rounded corners. SEND MONEY / SEND ITEMS buttons are 20px high; the donation/author footer totals 50px.

### v0.9.918 — Compact Hub footer
- Uses the same compact footer as Script Hub: SEND MONEY, SEND ITEMS and Made with ❤️, with 40px donation buttons. Removes the legacy signature footer and reserves space for module dialogs where needed.

### v0.9.917 — Hub isolation
- Excludes Script Hub and its subtree from shared module styling/fullscreen rules; restricts footer routines to native module roots.

### v0.9.916 — Full-screen performance
- Mobile SakaLuX panels use the full available viewport.
- Removes backdrop blur and heavy mobile visual effects.
- Disables the legacy document-scanning Mobile Surface observer where present.
- Reduces mobile animation/transition cost for faster input and scrolling.

### v0.9.915 — TornPDA host-scroll contract
- Replaces physical 100dvh forcing with host-container sizing so TornPDA vertical scrolling and mobile interaction remain stable while blur is preserved.

### v0.9.914 — Mobile full-height + blur contract
- Opens the active mobile sheet from top to bottom of the available viewport.
- Adds the shared translucent SakaLuX blur treatment.

### v0.9.913
- Performance/UI optimization: introduces the shared SakaLuX performance/UI foundation, reduces duplicate high-frequency rendering work and aligns Suite surfaces with the Hub visual language.

### v0.9.912 — Current experimental build
- Maintains the current experimental all-in-one Suite architecture and standalone status.
- Remains intentionally outside the Script Hub registry.

### v0.9.910 — Suite panel layout repair
- Restored the complete Suite module interface on TornPDA and desktop.
- Moved the author signature inside the Suite window.
- Restored the full-screen overlay as a backdrop while limiting panel styling to the actual Suite window.
- Preserved module settings and saved states during the UI repair.

### v0.9.909 — Inline panel signature
- Moved the SakaLuX author signature inside the Suite panel.

### v0.9.908 — Persistent SakaLuX signature
- Added the persistent linked author footer.

### v0.9.907 — Unified Control Center visual system
- Adopted the shared SakaLuX interface style without changing module logic/saved data.

### v0.9.905 — SakaLuX naming and module compatibility baseline
- Restored established SakaLuX names for visible modules/panels.
- Preserved Item Signal rules and working Event Lens TornPDA compatibility.
- Improved Event Lens readability and trade continuation links.
- Preserved standalone launch bridges and Chain Alarm.
- Added automated checks for the principal module/factory pairs.


## Current release notes

**v0.9.922** aligns Master Control with the Elimination mobile panel geometry: 4px side gaps, 36px bottom chat clearance, 14px rounded shell, compact fixed header/actions, scroll-only middle content and the existing 50px donation footer.
