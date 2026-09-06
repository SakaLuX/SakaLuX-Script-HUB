# SakaLuX Script HUB — Update Information

Last updated: 2026-09-06

## Current versions

- SakaLuX Script Hub: **v1.8.5**
- SakaLuX Enhancer Guard: **v1.3.2**
- SakaLuX Bazaar Thanker - PDA: **v5.3.1**
- SakaLuX Mission Rewards: **v1.0.1**
- SakaLuX Market Intelligence: **v1.16.2** — Greasy Fork **592781**
- SakaLuX Account Auditor: **v1.0.0** — GitHub direct install

## Latest changes

### SakaLuX Account Auditor v1.0.0
- New Torn PDA / Tampermonkey account snapshot add-on.
- Collects available account data selection-by-selection so one unavailable Torn API selection does not cancel the whole snapshot.
- Current snapshot coverage requests: profile, bars, cooldowns, travel, education, jobpoints, merits, refills, notifications, money, stocks, properties, Discord data, personal stats, weapon experience, work stats, skills, battle stats, net worth, inventory, display, icons and criminal record.
- Produces `SakaLuX-Account-Snapshot.json` with successful data plus a separate errors section for unavailable/permission-limited selections.
- Torn API key, GitHub token, cookies, browser session and passwords are explicitly stripped and are never written to the snapshot.
- Added configurable GitHub repository, branch and snapshot path.
- Added **SYNC NOW** button plus optional auto-sync while Torn is open.
- GitHub fine-grained token is stored only in the browser/PDA local storage and must have Contents read/write access only to the chosen snapshot repository.
- Intended snapshot repository should be **private**, because the JSON can contain detailed Torn account information.
- Public API: `window.SakaLuXAccountAuditor.open()`, `.sync()`, `.snapshot()` and `.status()`.
- Registered in `scripts.json`.

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
