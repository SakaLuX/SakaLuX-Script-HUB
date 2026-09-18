# Release Surface Audit — 2026-09-18

> Historical snapshot. Current release/version status is in `RELEASE-SURFACE-AUDIT-2026-09-19.md`.

Canonical rule: each userscript `@version` is the source of truth. Registered `scripts.json` version/release surfaces and each documentation `Current version` / `Current release note` label are synchronized to that source. Standalone/core scripts are checked directly against their documentation.

| Module | Source | Canonical @version | Registry status | Documentation |
|---|---|---:|---|---|
| enhancer | `SakaLuX-Enhancer-Guard.user.js` | 1.3.47 | 1.3.47 / release 1.3.47 | Current version/release 1.3.47 — OK |
| bazaar | `SakaLuX-Bazaar-Thanker-PDA.user.js` | 5.3.40 | 5.3.40 / release 5.3.40 | Current version/release 5.3.40 — OK |
| mission-rewards | `SakaLuX-Mission-Rewards.user.js` | 1.0.42 | 1.0.42 / release 1.0.42 | Current version/release 1.0.42 — OK |
| market-intelligence | `SakaLuX-Market-Intelligence.user.js` | 1.17.40 | 1.17.40 / release 1.17.40 | Current version/release 1.17.40 — OK |
| elimination-assistant | `SakaLuX-Elimination-Assistant.user.js` | 1.3.44 | 1.3.44 / release 1.3.44 | Current version/release 1.3.44 — OK |
| company-intelligence | `SakaLuX-Company-Intelligence-v1.0.0.user.js` | 1.8.38 | 1.8.38 / release 1.8.38 | Current version/release 1.8.38 — OK |
| stock-manager-advisor | `SakaLuX-Stock-Manager-Advisor.user.js` | 0.8.7 | 0.8.7 / release 0.8.7 | Current version/release 0.8.7 — OK |
| chat-intelligence | `SakaLuX-Chat-Intelligence.user.js` | 1.2.20 | intentionally standalone / not registered | Current version/release 1.2.20 — OK |
| account-auditor | `SakaLuX-Account-Auditor.user.js` | 1.3.16 | intentionally standalone / not registered | Current version/release 1.3.16 — OK |
| script-hub | `SakaLuX-Script-Hub.user.js` | 1.9.73 | core manager / not a module entry | Current version/release 1.9.73 — OK |
| suite | `SakaLuX-Suite.user.js` | 0.9.929 | intentionally standalone / not registered | Current version/release 0.9.929 — OK |

## Validation
- All userscript headers were read directly from the current main-branch files.
- Every active registered module in `scripts.json` is synchronized to its userscript `@version`, including `release.version`.
- Every maintained Greasy Fork information page has matching `Current version` and `Current release note` labels.
- Script Hub registered-module version list is synchronized with the seven actual registry modules.
- Mission and Company stale prose references to older “current” versions were corrected.
- Chat Intelligence, Account Auditor and SakaLuX Suite remain intentionally outside the Hub registry.
- Extended performance follow-up: Chat bounds its recent-message cache, Stocks coalesces overlapping API syncs and Hub synchronizes the updated Stocks notes.
