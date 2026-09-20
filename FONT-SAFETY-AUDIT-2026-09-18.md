# Native Points / Merits font safety audit

Date: 2026-09-18

Scanned 13 active top-level userscripts.

Result: **PASS** — no current SakaLuX userscript directly changes the font size of Torn native Points or Merits counters. Script-owned widgets such as `#sl-mi-points-bar` are separate UI and do not target Torn native counters.

Hub fallback behavior: **PASS** — the floating launcher now depends on whether the native Hub launcher is mounted in the DOM, not whether scrolling moved it outside the viewport.

Scanned files:
- `private-module.user.js`
- `SakaLuX-Account-Auditor.user.js`
- `SakaLuX-Bazaar-Smart-Pricer.user.js`
- `SakaLuX-Bazaar-Thanker-PDA.user.js`
- `SakaLuX-Chat-Intelligence.user.js`
- `SakaLuX-Company-Intelligence-v1.0.0.user.js`
- `SakaLuX-Elimination-Assistant.user.js`
- `SakaLuX-Enhancer-Guard.user.js`
- `SakaLuX-Market-Intelligence.user.js`
- `SakaLuX-Mission-Rewards.user.js`
- `SakaLuX-Script-Hub.user.js`
- `SakaLuX-Stock-Manager-Advisor.user.js`
- `SakaLuX-Suite.user.js`
