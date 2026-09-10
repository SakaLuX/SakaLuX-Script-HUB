# SakaLuX Script HUB — Update Information

Last updated: 2026-09-10

## Current versions

- SakaLuX Script Hub: **v1.9.2**
- SakaLuX Enhancer Guard: **v1.3.13**
- SakaLuX Bazaar Thanker - PDA: **v5.3.3**
- SakaLuX Mission Rewards: **v1.0.3**
- SakaLuX Market Intelligence: **v1.17.1** — Greasy Fork **592781**
- SakaLuX Elimination Assistant: **v1.3.7** — Greasy Fork **594921**
- SakaLuX Suite: **v0.9.906** — Bookie Scout value analysis: implied %, no-vig fair %, external %, Edge, EV and BET/SKIP

## Private / standalone tools

- SakaLuX Account Auditor: **v1.2.1** — GitHub source sync; intentionally excluded from `scripts.json` so Script Hub does not show it as required/recommended.

## Documentation / release-note audit — 2026-09-08

All current scripts were checked against the `@version` in their live `.user.js` file after the licensing migration.

- **Script Hub v1.9.2** — removed the Hub search field.
- **Enhancer Guard v1.3.13** — removed the unused lock control beside the Enhancer favorite star.
- **Bazaar Thanker - PDA v5.3.3** — persistent native Hub power API.
- **Mission Rewards v1.0.3** — persistent native Hub power API.
- **Market Intelligence v1.17.1** — no market panel on Items or player profile pages.
- **Elimination Assistant v1.3.7** — unified Torn + FFScouter API Access panel with exact Torn-key creation and validation.
- **SakaLuX Suite v0.9.906** — complete 13-module implementation, established SakaLuX names, improved TornPDA Event Lens readability, persistent controls and legacy-setting migration; All Rights Reserved metadata and source header present.
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

### SakaLuX Script Hub v1.9.1 — synchronized versions
- `scripts.json` is now the canonical minimum version, so **Latest** can never display an older Greasy Fork mirror version.
- Update cache is invalidated immediately when a Registry version changes, even when the installed version is unchanged.
- When Greasy Fork is behind Registry, install/update actions use the current GitHub `.user.js` source and cannot downgrade the module.
- The offline fallback Registry is synchronized with all current module versions.
- GitHub validation now blocks a release when userscript metadata, runtime version, `scripts.json`, Hub fallback or release documentation disagree.

### SakaLuX Elimination Assistant v1.3.7
- Replaced the Settings gear with a gold API key button in the Elimination header.
- Added an Enhancer-style API Access panel with exact Torn key creation for `user/battlestats`, `torn/elimination` and `torn/eliminationteam`.
- Added local Torn-key save, full access validation, active-source display and local-key clearing.
- Added a dedicated FFScouter section directly below the Torn key with save/test, service shortcut and clear controls.
- Kept FFScouter optional and separate from the shared Hub Torn key.
- Preserved manual battle-stats calibration at the bottom of the new API panel.
- Automatically reopens the API panel after returning from Torn's key creator.

### SakaLuX Enhancer Guard v1.3.7
- Added manual protection for any item through the shared Item Protector panel.
- Removed `Owned first` and `Auto refresh`; list order is alphabetic and refresh is manual.

### SakaLuX Enhancer Guard v1.3.6
- Compact single-row statistics for PDA and removed the redundant compact-mode control.
- Item names open the matching Item Market search directly.
- Added a lock button and a protection manager shared with `#1 Item Protector 🔐 MP`.
- Full locks hide protected items from compatible selling screens; long-pressing a lock reserves a partial quantity.

### SakaLuX Enhancer Guard v1.3.5
- Added a gold key button directly in the Enhancer panel header.
- Added a dedicated Market Intelligence-style API Access panel available at any time.
- **CREATE ENHANCER API KEY** opens Torn's key creator with only the required `user/inventory` and `torn/items` permissions.
- Added local key save, exact permission validation, active-source display and local-key clearing.
- Keeps the shared Hub key as first priority, TornPDA injection as second priority and the local key as standalone fallback.
- Automatically reopens the API panel after returning from Torn's key creator.

### SakaLuX Script Hub v1.9.0 + native module power
- Redesigned module cards for TornPDA with only a sliding ON/OFF control and one OPEN or SETTINGS button.
- Removed all repeated quick-action clusters from module cards while keeping module features inside their own panels.
- Added the shared `setEnabled`, `toggleEnabled` and `isEnabled` API to Enhancer Guard v1.3.4, Bazaar Thanker v5.3.3, Mission Rewards v1.0.3 and Market Intelligence v1.17.0.
- Elimination Assistant v1.3.7 implements the same native power API.
- OFF states persist and stop module observers/timers while removing injected UI; ON restores the module without reinstalling it.
- Hub Settings now creates, tests and stores one general Torn API key; managed modules prefer it automatically and retain standalone key creators/fallbacks.
- Bazaar Thanker requires no Torn API key. Elimination Assistant's optional FFScouter key remains separate because it is not a Torn service.

### SakaLuX Elimination Assistant v1.3.6
- Changed Lvl values to high-contrast gold and Last values to high-contrast light cyan.
- Added bold styling with `!important` so Torn themes cannot make these values unreadable.
- ATK links now open in a new tab and preserve the Elimination Assistant page.

### SakaLuX Elimination Assistant v1.3.5
- Moved L directly under W beside the ATK action for a narrower TornPDA layout.
- Replaced LOAD with **LOAD NEXT**, cycling through separate groups of up to 500 team members.
- Keeps only one group in memory and remembers the current group independently for each team.
- Automatically wraps back to the first group after reaching the end.

### SakaLuX Elimination Assistant v1.3.4
- Added Torn/Flying/Abroad/Hospital/Jail/Federal/Fallen/Unknown status badges to each target.
- Added **Attackable only** and stopped hiding unavailable players from the All targets view.
- Added TornPDA-compatible EXPORT for the current attackable SAFE/RISKY results.
- Known unavailable targets show WAIT instead of an attack shortcut.

### SakaLuX Elimination Assistant v1.3.3
- Compact attack-first TornPDA layout with filter/search row, status-bar calibration, fixed target columns and ATK/W/L actions.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.3.2.user.js`.


### SakaLuX Elimination Assistant v1.3.2
- LOAD now renders team members before FFScouter enrichment, so an FFScouter network failure no longer leaves the table apparently empty.
- Improved TornPDA font sizing, spacing and SAFE/RISKY/SKIP contrast.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.3.1.user.js`.


### SakaLuX Elimination Assistant v1.3.1
- Fixed current Torn API v2 battlestats parsing for CALIBRATE ME.


### SakaLuX Elimination Assistant v1.3.0
- Fixed TornPDA `Unexpected end of JSON input` by hardening API response decoding and adding transport fallback from PDA bridge to GM request/fetch.
- Added exact backup: `backups/SakaLuX-Elimination-Assistant-v1.2.9.user.js`.


### SakaLuX Market Intelligence v1.16.9
- Added live `user/equipment` API permission diagnostics and a clear `API KEY MISSING EQUIPMENT ACCESS` state.
- Added named-key setup handoff, always-visible replacement key field, SAVE NEW API KEY and CHECK API ACCESS controls.
- Returning from Torn API setup now reopens Settings for immediate paste/verification; stale loadout cache is cleared on key replacement.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.8.user.js`.


### SakaLuX Market Intelligence v1.16.8
- Fixed Loadout Comparator / Item Market Intelligence disappearing on TornPDA when the selected item ID is not kept in the URL hash.
- Added URL, DOM-link/data-attribute and visible-item-image fallbacks plus a short DOM rebuild retry that keeps the existing panel visible.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.7.user.js`.


### SakaLuX Market Intelligence v1.16.7
- Settings toggles are now sliding switches and apply instantly without resetting caches/history or closing the panel.
- Added a **CREATE REQUIRED API KEY** button that opens Torn's official custom-key generator with the key title `SakaLuX Market Intelligence` and the script's required selections.
- Numeric/text fields use **SAVE VALUES** without closing Settings.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.6.user.js`.


### SakaLuX Market Intelligence v1.16.6 — Loadout Comparator
- Added Item Market weapon/armor comparison against the player's currently equipped gear via Torn API v2 `user/equipment`.
- Shows UPGRADE / SIDEGRADE / DOWNGRADE with combat-stat deltas, price, quality and listed bonuses.
- Uses a short loadout cache and exposes comparator diagnostics/API helpers.

### SakaLuX Suite v0.9.906 — TornPDA readability
- Increased Event Lens title, subtitle, detail, original-message and timestamp sizes for mobile.
- Changed event names and restored links to high-contrast gold.

### SakaLuX Suite v0.9.904 — SakaLuX naming cleanup
- Restored the established SakaLuX names for every visible module and panel.
- Removed the external base name from code metadata, documentation and validation messages.
- Kept only the TornPDA-compatible GM request grant in userscript metadata.
- Retained all 13 complete implementations, the Event Lens compatibility adapter, Chain Alarm and the five standalone bridges.
- Trade events now keep the native continuation link so pending trades can be accepted from Event Lens.

### SakaLuX Suite v0.9.903 — complete module rebuild
- Rebuilt the Suite core and all 13 principal modules from the complete reference implementation.
- Added the TornPDA Events route/native-row adapter verified by the Event Lens fix.
- Preserved the Master Control window and scroll position when toggling modules.
- Added sliding ON/OFF controls throughout the Suite.
- Migrates earlier SakaLuX Suite module states and the shared Torn API key.
- Retains Chain Alarm plus the five requested standalone SakaLuX launch bridges.

### Licensing protection update — 2026-09-08
- Public SakaLuX userscripts now use **All Rights Reserved** instead of MIT.
- Added `Copyright © 2026 SakaLuX [2380374]` to userscript metadata and source headers.
- Personal use and private modification remain permitted.
- Redistribution, republication, rebranding, commercial redistribution, and publication of modified versions require prior written permission.
- Patch releases: Hub v1.8.6, Enhancer Guard v1.3.3, Bazaar Thanker v5.3.2, Mission Rewards v1.0.2, Market Intelligence v1.16.5, Elimination Assistant v1.2.9, SakaLuX Suite v0.9.902.
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
