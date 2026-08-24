# SakaLuX Script HUB — Update Information

Last updated: 2026-08-24

## Current versions

- SakaLuX Script Hub: **v1.8.4**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**
- SakaLuX Market Intelligence: **v1.1.0** — Greasy Fork **592781**

## Latest changes

### SakaLuX Market Intelligence v1.1.0
- Added **Best Travel Run** on the Torn Travel home screen.
- Uses current YATA abroad stock/buy-price data plus live Torn Item Market prices to rank travel opportunities.
- Shows recommended item, destination, current stock, estimated profit per run and estimated profit per hour.
- Added configurable **travel slots** and **flight multiplier** in Market Intelligence settings.
- Added local stock-history learning per destination/item.
- When a real stock increase is observed, it is saved as a restock event.
- After enough local restock observations are collected, the script estimates the next stock refill using the median learned interval.
- Until enough history exists, sold-out items show a clearly labelled next-possible quarter-hour restock estimate instead of pretending to know an exact refill time.
- Landed Travel item overlays now show current stock plus stock/restock ETA information.
- Added **BEST RUN** quick action to SakaLuX Script Hub.
- Added `@connect yata.yt` for the public travel export used by Best Travel Run.
- Changed userscript update/download metadata to the official Greasy Fork **592781** URLs.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.0.0.user.js`.

### SakaLuX Market Intelligence v1.0.0
- Added a new local-first market intelligence add-on written for the SakaLuX suite.
- Added Travel profit overlays using current Torn Item Market prices, net sell after configurable market fee, absolute profit and ROI.
- Added Bazaar deal detection with profitable/non-profitable flip verdicts.
- Added Item Market floor/effective-price panel and a local per-item watchlist.
- Added Items-page estimated net market value and total stack value.
- Added Points Market rate capture and the initial Museum intelligence surface.
- Added bounded market requests, 10-minute local market cache and limited concurrency for PDA friendliness.
- Added Torn PDA API-key support plus manual API-key fallback.
- Added `window.SakaLuXMarketIntelligence` with Hub actions.
- Published on Greasy Fork as script **592781**.

### SakaLuX Script Hub v1.8.4
- Rebuilt the mobile **HUB** entry using Torn's real mobile navigation structure.
- The HUB item is mounted as its own navigation entry immediately before **Messages**.
- The skull icon reuses native Torn SVG sizing/theme and blinks without moving the navigation item.
- The floating circular Hub button remains only as fallback.

### SakaLuX Mission Rewards v1.0.1
- Changed `@match` to all Torn pages so the Hub can detect it globally.
- Improved mobile/PDA reward badges and added the shared Hub install prompt.

### SakaLuX Enhancer Guard v1.3.2
- Added a SakaLuX Script Hub install prompt with 24-hour NOT NOW cooldown.

### SakaLuX Bazaar Thanker - PDA v5.3.1
- Added the same optional SakaLuX Script Hub install prompt and cooldown.

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

- `backups/SakaLuX-Market-Intelligence-v1.0.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.3.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.2.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.1.user.js`
- `backups/SakaLuX-Script-Hub-v1.8.0.user.js`
- `backups/SakaLuX-Script-Hub-v1.7.0.user.js`
- `backups/SakaLuX-Enhancer-Guard-v1.3.1.user.js`
- `backups/SakaLuX-Bazaar-Thanker-PDA-v5.3.0.user.js`
- `backups/SakaLuX-Mission-Rewards-v1.0.0.user.js`
