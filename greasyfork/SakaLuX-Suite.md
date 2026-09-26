# 🧰 SakaLuX Suite [EXPERIMENTAL]

> Standalone experimental SakaLuX toolkit. **Not registered in SakaLuX Script Hub.**

## Current version
**v0.9.940**


## Repository synchronization

- Verified: **2026-09-26**
- Canonical version: **v0.9.940**
- License: **All Rights Reserved**
- Canonical GitHub source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js
- GreasyFork description source: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/SakaLuX-Suite.md
- GreasyFork page: Not currently registered with a verified GreasyFork script ID.
- Install/download URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js
- Update metadata URL: https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js

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
- Launch bridges for Enhancer Guard, Bazaar Thanker, Market Intelligence, Mission Rewards, Elimination Assistant, Company Intelligence, Stock Manager & Advisor, Chat Intelligence and Account Auditor.
- Automatic migration of previous Suite module states and shared Torn API key.
- Master Control with sliding ON/OFF switches and module-specific settings.
- Persistent control-window and scroll position while toggling modules.
- Shared Torn API-key storage.
- Settings import/export with the API key excluded.
- `Alt + F` shortcut for the control interface.

## Current release note

**v0.9.940 — Settings Schema v1 and safe automatic migrations**
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

## Release history / Changelog



### v0.9.940 — Settings Schema v1 and safe automatic migrations
- Adds versioned settings schemas for every SakaLuX userscript through Shared Core v1.1.0.
- Automatically advances legacy settings through ordered per-version migrations without downgrading newer data.
- Keeps a last-known-good backup and restores it, or safely falls back to script defaults, when stored JSON is corrupt.

### v0.9.939 — Suite Daily Progress Dashboard
- Adds a mobile-first Daily Progress dashboard to Suite Master Control.
- Tracks daily objectives, recent route activity and enabled Suite-module status locally.
- Automatically marks Gym, Crimes, Missions, Faction/OC and Travel checks when those routes are visited; Review daily plan remains manual.
- Supports custom objectives, day rollover, reset-today and a bounded 30-day local history.
- Exposes `SakaLuXSuiteDailyProgress` plus the hidden `sakalux-module-bridge-suite-daily-progress` bridge; no API key or remote sync is required.

### v0.9.938 — Shared Core v1
- Centralizes shared infrastructure in the embedded SakaLuX Core.
- Adds permanent Shared Core/API broker regression coverage.
- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.


### v0.9.937 — Church prayer streak tracker
- Adds a compact Prayer Streak card on Church / Pray views.
- Tracks one prayer per local calendar day, calculates the active consecutive-day streak and marks whether today is complete.
- Stores only local day stamps in browser/userscript storage; no API key or remote sync is required.
- Tracking begins with the first prayer recorded after this update.

### v0.9.936 — OC scan visual state + API fallback
- Keeps a completed Recruiting/Planning scan marked complete when revisiting the tab instead of resetting it to Scan Required.
- Falls back automatically to the visible-page OC scanner when the faction crimes API request fails.
- Suppresses the transient red `Incorrect ID-entity relation` banner on page entry when Faction API Access is unavailable; the manual DOM scan remains usable.


### v0.9.935 — OC scan state storage fix
- Fixes `ReferenceError: store is not defined` when scanning Recruiting/Planning OC stages.
- Uses the Suite OC module's existing `loadLS` / `saveLS` helpers for scan-state persistence.
- Keeps Recruiting and Planning completion state persistent without depending on an undefined storage object.


### v0.9.934 — OC Recruiting/Planning scan reliability
- Waits briefly for Torn to finish mounting OC role slots before a manual DOM scan.
- Isolates member/menu and required-item tooltip failures per role, so one unreadable slot no longer aborts the whole scan.
- Replaces the generic `Scan failed` message with the concrete runtime cause when an unexpected error remains.


### v0.9.933 — Target Alerts runtime viewport lock
- Forces the Target Alerts Settings dialog geometry with inline `!important` properties when it is created and every time it opens.
- Uses `50vw` centering plus viewport-bounded width/height, so later Suite/Torn CSS cannot shift the dialog off-screen.
- Re-applies the lock after viewport resize/orientation changes.


### v0.9.932 — Target Alerts mobile viewport fix
- Centers the Target Alerts Settings window in the dynamic viewport on TornPDA and desktop.
- Constrains width and height to the visible viewport with safe-area support and internal vertical scrolling.
- Removes stale inline popover coordinates that could leave the settings panel partially outside the screen.



### v0.9.931 — Release documentation synchronized with the current Suite userscript version
- Release documentation synchronized with the current Suite userscript version.

### v0.9.929 — Extended performance validation
- Removes the Member Travel Map tag-edit listener and aborts Target Alerts global listeners when the native modules are disabled.

### v0.9.928 — Performance and TornPDA smoothness

- Stops Recovery Planner from recreating its identical SVG icon on every observer pass.
- Gates Member Travel Map repair to relevant faction/profile views and ignores chat in unrelated modules.
- Coalesces OC, activity and armory scans; Company scanning stays on Company/Jobs pages.
- Preserves all 23 module entries, settings, panel height and switch styling.
- Synthetic DOM and Chromium performance coverage; complete previous-version backup included.


### v0.9.927 — Complete SakaLuX tool bridges

- Adds Company Intelligence, Stock Manager & Advisor, Chat Intelligence and Account Auditor to Master Control.
- All nine complementary SakaLuX tools now have saved bridge switches and Settings buttons.
- Settings opens the installed module through its public API, with its launch button as fallback. Missing standalone scripts produce a clear message.
- New bridges are OFF by default; existing module preferences remain intact. A bridge switch controls Suite access to the standalone tool, not the standalone script runtime.
- Keeps the built-in Company Console separate from standalone Company Intelligence.
- Preserves v0.9.926 switch styling and panel height; includes a complete previous-version backup.
- Validates rendered entries, API/button launching, missing modules and saved preferences with a DOM regression test.

### v0.9.926 — Module switch styling

- Restores 46×25px pill switches with a 17px thumb centered vertically.
- Overrides generic blue button backgrounds, square corners, padding and mobile minimum heights only for Suite module switches.
- Preserves aria-checked, disabled states, keyboard focus and the existing module toggle handlers.
- Uses gray OFF and gold ON states with sliding thumb feedback.
- Preserves the confirmed panel height, content scrolling and footer geometry.
- Includes a complete v0.9.925 script/description backup; JavaScript syntax validated.

### v0.9.925 — Master Control height near chat

- Uses explicit viewport heights for the outer shell and Suite window, with 36px bottom clearance matching Elimination.
- Supports TornPDA touch layouts up to 1100 CSS pixels wide as well as standard mobile layouts.
- Keeps the module list scrollable while the header, actions and 50px donation footer stay outside the list.
- Removes the mobile override that forced the closed panel to remain displayed; visibility follows the existing open class.
- Preserves a complete v0.9.924 script and description backup before the update.
- JavaScript syntax validated locally. Actual TornPDA device confirmation remains pending.



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
