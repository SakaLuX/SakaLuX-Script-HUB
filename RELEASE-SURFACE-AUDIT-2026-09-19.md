# Release Surface Audit — 2026-09-19

Canonical rule: each userscript `@version` is the source of truth. `scripts.json`, Hub offline INFO/NEW data and maintained release markdowns are synchronized to it.

| Module | Source | Canonical @version | Registry status | Documentation |
|---|---|---:|---|---|
| enhancer | `SakaLuX-Enhancer-Guard.user.js` | 1.3.48 | 1.3.48 / release 1.3.48 | Current version/release 1.3.48 — OK |
| bazaar | `SakaLuX-Bazaar-Thanker-PDA.user.js` | 5.3.42 | 5.3.42 / release 5.3.42 | Current version/release 5.3.42 — OK |
| mission-rewards | `SakaLuX-Mission-Rewards.user.js` | 1.0.43 | 1.0.43 / release 1.0.43 | Current version/release 1.0.43 — OK |
| market-intelligence | `SakaLuX-Market-Intelligence.user.js` | 1.17.41 | 1.17.41 / release 1.17.41 | Current version/release 1.17.41 — OK |
| elimination-assistant | `SakaLuX-Elimination-Assistant.user.js` | 1.3.45 | 1.3.45 / release 1.3.45 | Current version/release 1.3.45 — OK |
| company-intelligence | `SakaLuX-Company-Intelligence-v1.0.0.user.js` | 1.8.39 | 1.8.39 / release 1.8.39 | Current version/release 1.8.39 — OK |
| stock-manager-advisor | `SakaLuX-Stock-Manager-Advisor.user.js` | 0.8.8 | 0.8.8 / release 0.8.8 | Current version/release 0.8.8 — OK |
| chat-intelligence | `SakaLuX-Chat-Intelligence.user.js` | 1.2.20 | standalone / not registered | Current version/release 1.2.20 — OK |
| account-auditor | `SakaLuX-Account-Auditor.user.js` | 1.3.16 | standalone / not registered | Current version/release 1.3.16 — OK |
| suite | `SakaLuX-Suite.user.js` | 0.9.931 | standalone / not registered | Current version/release 0.9.931 — OK |
| script-hub | `SakaLuX-Script-Hub.user.js` | 1.9.82 | core manager / not a module entry | Current version/release 1.9.82 — OK |

## Validation
- `scripts.json` version and `release.version` match each registered userscript metadata version.
- Hub `FALLBACK_REGISTRY` is generated from the same `scripts.json`, so offline INFO/NEW uses identical information and release data.
- `FALLBACK_MODULE_DETAILS` is restored from the fallback registry for INFO/NEW regression compatibility.
- Every maintained Greasy Fork markdown page has the current userscript version and current release block.
- Script Hub metadata, runtime VERSION, changelog and Script-Hub.md are aligned at v1.9.82.
- Fly-out launcher remains a persistent first child of Torn vertical navigation and is not lifecycle-controlled by scroll position.
