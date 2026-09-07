# SakaLuX Script HUB — Update Information

Last updated: 2026-09-07

## Current versions

- SakaLuX Script Hub: **v1.8.5**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**
- SakaLuX Market Intelligence: **v1.16.2** — Greasy Fork **592781**

## Private / manual tools

- SakaLuX Account Auditor: **v1.1.1** — manual/private use only; intentionally excluded from `scripts.json` so Script Hub does not show it as a required or recommended install.

## Latest changes

### SakaLuX Account Auditor v1.1.1
- Fixed the three avoidable v2 errors from v1.1.0 instead of calling parameterized endpoints without their required categories.
- `personalstats` is now requested with `cat=all`.
- Friends / Enemies / Targets are now collected separately through `user/list?cat=...`.
- Inventory is now collected category-by-category using Torn's official v2 inventory categories.
- Added more official read-only self endpoints including battlestats, bounties, calendar, casino, competition, cooldowns, Discord, education, enlisted cars, equipment, faction, forum activity, gym, honors and icons.
- Added `key/info` capability reporting so the snapshot can show what the current Torn API key can actually access without exposing the API key itself.
- `user/log` is now treated as an explicit unavailable capability when Torn returns access error 16; Torn officially requires a **Full access** key for account logs.
- Message collection keeps sender, topic, timestamps and read/seen state. The snapshot now explicitly records that the official Torn API `UserMessage` schema does **not** expose message body/content.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.0.user.js`.
- Auditor remains read-only and intentionally excluded from `scripts.json` / Script Hub install prompts.

### SakaLuX Account Auditor v1.1.0
- Expanded the private Auditor to broad **read-only Torn API v1 + v2 coverage**.
- Added official API reads for attacks, ammo, inventory, item market listings, item mods, job details, medals, missions, perks, organized crimes, properties, races, reports, revives, trades, virus, stocks, money, stats and other self-account endpoints.
- Added private-data collection for **messages, new messages, events, new events and account logs**.
- Private endpoints follow Torn pagination links with a configurable maximum-page cap.
- Upgraded snapshot format to `sakalux-torn-account-snapshot-v2` with `data.v1`, `data.v2` and `data.private` sections.
- GitHub token storage now prefers userscript storage (`GM_getValue` / `GM_setValue`) rather than Torn-origin localStorage.
- Remains strictly read-only: no message sending, trades, purchases, attacks, account-setting changes or session automation.
- Password, Torn session, cookies, Torn API key and GitHub token are never written to the snapshot.
- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.0.0.user.js`.
- Auditor remains intentionally excluded from `scripts.json` / Script Hub install prompts.

### SakaLuX Account Auditor v1.0.0
- Initial Torn PDA / Tampermonkey account snapshot tool.
- Collected 23 legacy user selections independently and synced a credential-scrubbed JSON snapshot to a private GitHub repository.
- Added configurable GitHub repository, branch and snapshot path, **SYNC NOW**, and optional auto-sync while Torn is open.

### SakaLuX Market Intelligence v1.16.2
- Fixed **BAZAAR FLIP INTELLIGENCE** flicker during rescans.
- Bazaar Flip now keeps the same outer DOM panel and updates only its contents.
- The open/collapsed state is preserved during Bazaar refreshes.
- Removed the extra pre-paint delete from `scanBazaar()`.
- MutationObserver now ignores changes made inside the Bazaar Flip board, preventing self-triggered refresh loops.
- The board is removed only when there are genuinely no profitable deals or the page context changes.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.1.user.js`.

### SakaLuX Market Intelligence v1.16.1
- Fixed the visible flicker where **BEST ROUTE BASKET** and **TRAVEL SESSION SUMMARY** repeatedly disappeared and reappeared during scans.
- Both panels now keep the same outer DOM node and update their content in place.
- Cached and live Best Route results replace only the panel contents instead of removing the whole panel between phases.
- Forced refreshes no longer delete the two persistent Travel panels before recalculation.
- MutationObserver now ignores changes inside Travel Session Summary so the script does not trigger scans from its own session UI updates.
- The open/collapsed state of both panels is preserved across data refreshes.
- Panels are still removed when the page context genuinely changes (for example leaving the home Travel screen or disabling the feature).
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.0.user.js`.
