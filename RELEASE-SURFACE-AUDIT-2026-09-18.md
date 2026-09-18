# Release Surface Audit — 2026-09-18

Canonical rule: the userscript `@version` is the source of truth. `scripts.json` version/release surfaces and Greasy Fork Current version/Current release note labels must match it.

| Module | Source | Canonical @version | Registry before | Release before | Result |
|---|---|---:|---:|---:|---|
| enhancer | SakaLuX-Enhancer-Guard.user.js | 1.3.46 | 1.3.46 | 1.3.46 | OK; doc 1.3.46 / release 1.3.46 |
| bazaar | SakaLuX-Bazaar-Thanker-PDA.user.js | 5.3.39 | 5.3.39 | 5.3.39 | OK; doc 5.3.39 / release 5.3.39 |
| mission-rewards | SakaLuX-Mission-Rewards.user.js | 1.0.41 | 1.0.41 | 1.0.41 | OK; doc 1.0.41 / release 1.0.41 |
| market-intelligence | SakaLuX-Market-Intelligence.user.js | 1.17.38 | 1.17.38 | 1.17.36 | SYNCED; doc 1.17.38 / release 1.17.38 |
| elimination-assistant | SakaLuX-Elimination-Assistant.user.js | 1.3.42 | 1.3.42 | 1.3.42 | OK; doc 1.3.42 / release 1.3.42 |
| company-intelligence | SakaLuX-Company-Intelligence-v1.0.0.user.js | 1.8.37 | 1.8.37 | 1.8.37 | OK; doc 1.8.37 / release 1.8.37 |
| stock-manager-advisor | SakaLuX-Stock-Manager-Advisor.user.js | 0.8.4 | 0.8.4 | 0.8.4 | SYNCED; doc 0.8.2 / release 0.8.1 |
| script-hub | SakaLuX-Script-Hub.user.js | 1.9.70 | n/a | n/a | OK; doc 1.9.70 / release 1.9.70 |
| suite | SakaLuX-Suite.user.js | 0.9.926 | n/a | n/a | OK; doc 0.9.926 / release 0.9.926 |

## Validation
- Active `scripts.json` entries are checked against their source userscript metadata.
- Greasy Fork `Current version` and `Current release note` version labels are synchronized without rewriting human-authored feature notes.
- Script Hub is checked separately because it is the manager, not a registry add-on.
- Suite is synchronized only when a readable userscript metadata header is present.
