# Release Surface Audit — 2026-09-18

Canonical rule: the userscript `@version` is the source of truth. `scripts.json` version/release surfaces and Greasy Fork Current version/Current release note labels must match it where a registry entry exists. Standalone-only scripts are audited directly against their documentation.

| Module | Source | Canonical @version | Registry before | Release before | Result |
|---|---|---:|---:|---:|---|
| enhancer | SakaLuX-Enhancer-Guard.user.js | 1.3.46 | 1.3.46 | 1.3.46 | OK; doc 1.3.46 / release 1.3.46 |
| bazaar | SakaLuX-Bazaar-Thanker-PDA.user.js | 5.3.39 | 5.3.39 | 5.3.39 | OK; doc 5.3.39 / release 5.3.39 |
| mission-rewards | SakaLuX-Mission-Rewards.user.js | 1.0.41 | 1.0.41 | 1.0.41 | OK; doc 1.0.41 / release 1.0.41 |
| market-intelligence | SakaLuX-Market-Intelligence.user.js | 1.17.38 | 1.17.38 | 1.17.36 | SYNCED; registry release and docs now 1.17.38 |
| elimination-assistant | SakaLuX-Elimination-Assistant.user.js | 1.3.42 | 1.3.42 | 1.3.42 | OK; doc 1.3.42 / release 1.3.42 |
| company-intelligence | SakaLuX-Company-Intelligence-v1.0.0.user.js | 1.8.37 | 1.8.37 | 1.8.37 | OK; doc 1.8.37 / release 1.8.37 |
| chat-intelligence | SakaLuX-Chat-Intelligence.user.js | 1.2.18 | standalone | standalone | SYNCED; doc/release 1.2.18 with standalone-registration release note |
| stock-manager-advisor | SakaLuX-Stock-Manager-Advisor.user.js | 0.8.4 | 0.8.4 | 0.8.4 | SYNCED; doc 0.8.2 / release 0.8.1 → 0.8.4 |
| account-auditor | SakaLuX-Account-Auditor.user.js | 1.3.14 | intentionally excluded | intentionally excluded | SYNCED; doc/release 1.3.14 with standalone-registration release note |
| script-hub | SakaLuX-Script-Hub.user.js | 1.9.70 | n/a | n/a | OK; doc 1.9.70 / release 1.9.70 |
| suite | SakaLuX-Suite.user.js | 0.9.926 | n/a | n/a | OK; doc 0.9.926 / release 0.9.926 |

## Validation
- Active `scripts.json` entries are checked against their source userscript metadata.
- Greasy Fork `Current version` and `Current release note` version labels are synchronized with current userscript metadata.
- Market Intelligence release metadata is aligned from 1.17.36 to 1.17.38 without changing the userscript version.
- Stock Manager & Advisor documentation is aligned from stale 0.8.2 / 0.8.1 labels to 0.8.4.
- Account Auditor and Chat Intelligence documentation now matches their standalone runtime releases, v1.3.14 and v1.2.18.
- Script Hub and Suite are audited separately because they are not ordinary registry add-ons.
- No unrelated userscript version bump was performed by this synchronization pass.
