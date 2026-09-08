# SakaLuX Script HUB — Update Information

Last updated: 2026-09-08

## Current versions

- SakaLuX Script Hub: **v1.8.6**
- SakaLuX Enhancer Guard: **v1.3.3**
- SakaLuX Bazaar Thanker - PDA: **v5.3.2**
- SakaLuX Mission Rewards: **v1.0.2**
- SakaLuX Market Intelligence: **v1.16.5** — Greasy Fork **592781**
- SakaLuX Elimination Assistant: **v1.2.9** — Greasy Fork **594921**
- SakaLuX Suite: **v0.4.1** — experimental / GitHub test build

## Private / standalone tools

- SakaLuX Account Auditor: **v1.2.1** — GitHub source sync; intentionally excluded from `scripts.json` so Script Hub does not show it as required/recommended.

## Documentation / release-note audit — 2026-09-08

All current scripts were checked against the `@version` in their live `.user.js` file after the licensing migration.

- **Script Hub v1.8.6** — info/release notes current; All Rights Reserved metadata and source header present.
- **Enhancer Guard v1.3.3** — info/release notes current; All Rights Reserved metadata and source header present.
- **Bazaar Thanker - PDA v5.3.2** — info/release notes current; All Rights Reserved metadata and source header present.
- **Mission Rewards v1.0.2** — info/release notes current; All Rights Reserved metadata and source header present.
- **Market Intelligence v1.16.5** — info/release notes current; All Rights Reserved metadata and source header present.
- **Elimination Assistant v1.2.9** — info/release notes current; All Rights Reserved metadata and source header present.
- **SakaLuX Suite v0.4.1** — experimental info/release notes current; All Rights Reserved metadata and source header present.
- **Account Auditor v1.2.1** — intentionally left outside this public-script licensing migration.

Dedicated information files:

- `greasyfork/Script-Hub.md`
- `greasyfork/Enhancer-Guard.md`
- `greasyfork/Bazaar-Thanker.md`
- `greasyfork/Mission-Rewards.md`
- `greasyfork/Market-Intelligence.md`
- `greasyfork/Elimination-Assistant.md`
- `greasyfork/SakaLuX-Suite.md`
- `greasyfork/Account-Auditor.md`

## Latest changes

### Licensing protection update — 2026-09-08
- Public SakaLuX userscripts now use **All Rights Reserved** instead of MIT.
- Added `Copyright © 2026 SakaLuX [2380374]` to userscript metadata and source headers.
- Personal use and private modification remain permitted.
- Redistribution, republication, rebranding, commercial redistribution, and publication of modified versions require prior written permission.
- Patch releases: Hub v1.8.6, Enhancer Guard v1.3.3, Bazaar Thanker v5.3.2, Mission Rewards v1.0.2, Market Intelligence v1.16.5, Elimination Assistant v1.2.9, SakaLuX Suite v0.4.1.
- Account Auditor and historical backup snapshots were intentionally left untouched by this public-script migration.

### SakaLuX Script Hub v1.8.5 — documentation refresh
- Updated the suite list to the current live registry versions.
- Added Elimination Assistant **v1.2.8** to the documented suite.
- Documented Elimination's persistent Hub power control: **ON = green**, **OFF = red**.
- Documented that OFF hides all other Elimination quick actions until the module is turned back ON.
- Updated the standalone Account Auditor reference to **v1.2.1**.

### SakaLuX Elimination Assistant v1.2.8
- Added clear **What it does**, Hub integration and API-key information to its dedicated info page.
- Torn API **32** on `eliminationteam` is treated as a temporarily unavailable event endpoint instead of a bad API key.
- `TEST TORN KEY` reports `battlestats`, `elimination` and `eliminationteam` separately.
- Persistent Hub power control uses **ON = green** and **OFF = red**.
- When OFF, every other Elimination action is hidden and only the OFF button remains.
- Turning it ON restores OPEN, REFRESH, FF SCAN, CALIBRATE, TEST KEY, API KEY and ELIMS.
- API-key creation uses a single navigation in Torn PDA to avoid duplicate creation attempts.

### SakaLuX Account Auditor v1.2.1
- Added the standard SakaLuX Script Hub installation prompt.
- Uses the shared `SakaLuX_HUB_INSTALL_PROMPT_LAST` cooldown used by the other suite add-ons.
- The reminder is suppressed for 24 hours after LATER and is skipped when the Hub is already detected.

### SakaLuX Market Intelligence v1.16.4
- Hotfix: restored BEST ROUTE BASKET to its normal budget logic after v1.16.3 accidentally referenced the in-country live-cash variable there.
- In-country **BEST BUYS** correctly passes the automatically fetched Torn on-hand cash into the basket optimizer.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.3.user.js`.

### SakaLuX Market Intelligence v1.16.3
- In-country **BEST BUYS** reads the player's current Torn on-hand cash automatically through the existing API key.
- The manual Travel budget setting is ignored for the in-country Best Buys calculation.
- Added a 30-second cash cache and exposes `availableCash` / `availableCashAt` in `health()`.
- Best Buys labels the live cash used for the recommendation and falls back gracefully if cash cannot be read.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.2.user.js`.

### SakaLuX Account Auditor v1.2.0
- Added split GitHub snapshots: `summary.json`, `finance.json`, `combat.json`, `crimes.json`, `messages.json`, `events.json`, and `logs.json`.
- Keeps `SakaLuX-Account-Snapshot.json` as the complete audit file while the smaller files make targeted reading much easier.
- Added user-triggered **CAPTURE CURRENT MESSAGE** for message body text already visible in Torn.
- Captured messages are deduplicated, stored in userscript storage, and can be included in `messages.json`.
- The script never opens private conversations automatically. If the visible Torn message cannot be detected, the user can select its text and press capture again.
- Official API message metadata remains automatic; body text is only added after explicit user capture.
- Added **CLEAR CAPTURED MESSAGES** and a setting to include/exclude captured bodies from `messages.json`.
- Increased central Torn API pacing to about 1.1 seconds minimum between requests while retaining retry/backoff for code 5 / Too many requests.
- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v3`.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.2.user.js`.

### SakaLuX Account Auditor v1.1.2
- Added a central Torn API rate gate with a minimum ~900 ms gap between requests.
- Added automatic retry/backoff for Torn error code 5 (`Too many requests`) using 2.5s, 5s and 10s waits.
- Private/high-value data is collected first: messages, new messages, events, new events and logs now run before the broad account audit.
- Reduced default private pagination cap from 20 pages to 5 to avoid exhausting the API allowance during routine syncs.
- Removed redundant fixed sleeps; pacing is handled centrally by the rate gate.
- Inventory/contact/personal-stat requests use the same retry-aware scheduler.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.1.user.js`.

### SakaLuX Account Auditor v1.1.1
- Fixed v2 category handling for personal stats, lists and inventory.
- Added broader read-only account coverage and `key/info` capability reporting.
- `user/log` access error 16 is treated as an unavailable capability.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.0.user.js`.

### SakaLuX Account Auditor v1.1.0
- Expanded to broad Torn API v1 + v2 read-only coverage.
- Added messages, new messages, events, new events and logs through the official API where available.
- Added private endpoint pagination and userscript-storage preference for secrets.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.0.0.user.js`.

### SakaLuX Account Auditor v1.0.0
- Initial Torn PDA / Tampermonkey account snapshot tool.

### SakaLuX Market Intelligence v1.16.2
- Fixed **BAZAAR FLIP INTELLIGENCE** flicker during rescans.
- Bazaar Flip keeps the same outer DOM panel and updates only its contents.
- The open/collapsed state is preserved during Bazaar refreshes.
- MutationObserver ignores changes made inside the Bazaar Flip board, preventing self-triggered refresh loops.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.1.user.js`.

### SakaLuX Market Intelligence v1.16.1
- Fixed the visible flicker where **BEST ROUTE BASKET** and **TRAVEL SESSION SUMMARY** repeatedly disappeared and reappeared during scans.
- Both panels keep the same outer DOM node and update their content in place.
- Cached and live Best Route results replace only the panel contents instead of removing the whole panel between phases.
- Forced refreshes no longer delete the two persistent Travel panels before recalculation.
- MutationObserver ignores changes inside Travel Session Summary so the script does not trigger scans from its own session UI updates.
- The open/collapsed state of both panels is preserved across data refreshes.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.0.user.js`.