# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.8.4**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**
- SakaLuX Market Intelligence: **v1.0.0** — Greasy Fork **592781**

## Latest changes

### SakaLuX Market Intelligence v1.0.0
- Added a new local-first market intelligence add-on written for the SakaLuX suite.
- Added Travel profit overlays using current Torn Item Market prices, net sell after configurable market fee, absolute profit and ROI.
- Added Bazaar deal detection with profitable/non-profitable flip verdicts.
- Added Item Market floor/effective-price panel and a local per-item watchlist.
- Added Items-page estimated net market value and total stack value.
- Added Points Market rate capture and the initial Museum intelligence surface.
- Added bounded market requests, 10-minute local market cache and limited concurrency for PDA friendliness.
- Added Torn PDA API-key support plus manual API-key fallback.
- Added `window.SakaLuXMarketIntelligence` with OPEN, REFRESH, HARD REFRESH, TRAVEL and MARKET Hub actions.
- Added the shared optional Script Hub install prompt with the common 24-hour NOT NOW cooldown.
- Published on Greasy Fork as script **592781**.
- Updated `scripts.json` to use the official Greasy Fork install and metadata URLs.
- Added `greasyfork/Market-Intelligence.md` for Additional Info synchronization.

### SakaLuX Script Hub v1.8.4
- Rebuilt the mobile **HUB** entry using Torn's real mobile navigation structure: `mobileLink`, area row and swiper slide classes.
- The HUB item is now mounted as its own navigation/swiper entry immediately before **Messages**, instead of being inserted inside the Messages slot.
- This fixes the previous layout where HUB appeared above Messages and pushed Messages onto a second row.
- The skull icon now reuses the native Torn SVG element, dimensions, theme color and surrounding icon wrappers; only the skull artwork itself is custom.
- Removed custom width/height/font layout rules that made the launcher look like a separate image rather than a Torn button.
- The **HUB** label inherits Torn's own label class and typography.
- The blink animation affects only the skull icon opacity, so the item stays aligned with the surrounding Torn controls.
- The floating circular Hub button remains only as a fallback when Torn's native mobile navigation cannot be detected.
- Added exact source backup: `backups/SakaLuX-Script-Hub-v1.8.3.user.js`.

### SakaLuX Script Hub v1.8.3
- Rebuilt the Hub launcher as a native Torn navigation item inserted immediately before **Messages**.
- Replaced the emoji-style top launcher with a monochrome skull and **HUB** label.
- The floating circular Hub button automatically hides whenever the native launcher is available.

### SakaLuX Script Hub v1.8.2
- Added the first animated SakaLuX launcher experiment before **Messages**.
- Added repeated blink/pulse animation and update/issue status badge.
- Added Mission Rewards v1.0.1 to the Hub's offline fallback registry.

### SakaLuX Mission Rewards v1.0.1
- Changed `@match` to all Torn pages so `window.SakaLuXMissionRewards` is available everywhere and Script Hub no longer reports the add-on as missing outside Missions.
- Mission-specific scanning, API loading, floating button and reward processing remain restricted to `sid=missions`.
- Improved mobile/PDA reward badges and added the shared optional Script Hub install prompt.

### SakaLuX Script Hub v1.8.1
- Fixed **WHAT'S NEW** so the button is visible and usable on mobile/PDA.
- Cleaned `scripts.json` so it is used only as the add-on registry.
- Kept automatic add-on discovery, **UPDATE ALL**, **SYSTEM CHECK**, registry refresh and the global `window.SakaLuXScriptHub` API.

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt when the Hub is not detected.
- Choosing **NOT NOW** postpones the prompt for 24 hours.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and shared 24-hour **NOT NOW** cooldown.

## Central registry policy

`scripts.json` is only the registry of complementary SakaLuX add-ons that the Hub should discover and manage.

Every new complementary SakaLuX script must be added to `scripts.json` in the same release cycle.

The registry stores only information needed to identify, install, detect, update and launch add-ons. Hub metadata and Hub release notes do not belong in `scripts.json`.

## Update workflow

For every future script update:
1. Save the currently published source directly in `backups/`.
2. Include the old version number in the backup filename.
3. Do not create date subfolders.
4. Update the live source file on `main`.
5. If the updated script is an add-on, update its entry/version in `scripts.json`.
6. If a new add-on is created, add it to `scripts.json` immediately.
7. Update this `UPDATE-INFO.md` file with the new version and change summary.
8. Update the corresponding `greasyfork/*.md` additional-info file.
9. Keep Greasy Fork source synchronization pointed only at the live source files in the repository root.

## Backups available

- `backups/SakaLuX-Script-Hub-v1.8.3.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.2.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.1.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.7.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
- `backups/SakaLuX-Mission-Rewards-v1.0.0.user.js`
