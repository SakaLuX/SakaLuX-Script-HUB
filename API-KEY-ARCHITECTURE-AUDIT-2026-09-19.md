# API Key Architecture Audit — 2026-09-19

Policy: each Torn-API data module keeps its own create-key flow; Script Hub owns one shared superset key for shared modules; Account Auditor is isolated and must not use or contribute to the Hub shared key. Suite is a manager/orchestration layer and does not own a Torn-data key contract.

## Active top-level userscripts

| Script | Torn-data API | Own create URL | Create control | Reads Hub key | Create delegates to Hub |
|---|---:|---:|---:|---:|---:|
| Apocalypse-Poker-Exit-Alert.user.js | no | no | no | no | no |
| SakaLuX-Account-Auditor.user.js | yes | no | no | no | no |
| SakaLuX-Bazaar-Thanker-PDA.user.js | no | no | no | no | no |
| SakaLuX-Chat-Intelligence.user.js | no | no | no | no | no |
| SakaLuX-Company-Intelligence-v1.0.0.user.js | yes | yes | yes | yes | no |
| SakaLuX-Elimination-Assistant.user.js | yes | yes | yes | yes | no |
| SakaLuX-Enhancer-Guard.user.js | yes | yes | yes | yes | no |
| SakaLuX-Market-Intelligence.user.js | yes | yes | yes | yes | no |
| SakaLuX-Mission-Rewards.user.js | yes | yes | yes | yes | YES |
| SakaLuX-Script-Hub.user.js | yes | yes | yes | yes | no |
| SakaLuX-Stock-Manager-Advisor.user.js | yes | yes | yes | yes | no |
| SakaLuX-Suite.user.js | no | no | no | no | no |

## Discovered create-key permissions

- **SakaLuX-Company-Intelligence-v1.0.0.user.js**: `[{"user": "basic,profile,workstats,job", "company": "profile,employees,stock"}]`
- **SakaLuX-Elimination-Assistant.user.js**: `[{"user": "battlestats", "torn": "elimination,eliminationteam"}]`
- **SakaLuX-Enhancer-Guard.user.js**: `[{"user": "inventory", "torn": "items"}]`
- **SakaLuX-Market-Intelligence.user.js**: `[{"user": "money,travel,equipment", "torn": "items", "market": "itemmarket"}]`
- **SakaLuX-Mission-Rewards.user.js**: `[{"user": "ammo", "torn": "items"}]`
- **SakaLuX-Script-Hub.user.js**: `[{"user": "basic,money,travel,equipment,inventory,battlestats,ammo", "torn": "items,elimination,eliminationteam", "market": "itemmarket"}]`
- **SakaLuX-Stock-Manager-Advisor.user.js**: `[{"user": "money,stocks", "torn": "stocks"}]`

## Hub shared-key coverage

- Union excluding Account Auditor: `{"user": ["ammo", "basic", "battlestats", "equipment", "inventory", "job", "money", "profile", "stocks", "travel", "workstats"], "company": ["employees", "profile", "stock"], "torn": ["elimination", "eliminationteam", "items", "stocks"], "market": ["itemmarket"]}`
- Hub shared URL: `{"user": ["ammo", "basic", "battlestats", "equipment", "inventory", "money", "travel"], "torn": ["elimination", "eliminationteam", "items"], "market": ["itemmarket"]}`
- Missing from Hub shared key: `{"user": ["job", "profile", "stocks", "workstats"], "company": ["employees", "profile", "stock"], "torn": ["stocks"]}`
- Extra in Hub shared key versus discovered module create URLs: `{}`

## Account Auditor isolation

- Reads Hub key markers: **no**
- Own create URL discovered: **no**
- Own create/API control detected: **no**

## Findings

- ❌ Hub shared create URL is missing permissions used by one or more shared modules.
- ❌ Account Auditor uses Torn API data but lacks its own create-key flow.
- ❌ SakaLuX-Mission-Rewards.user.js delegates its module create-key button to Hub instead of creating its own module-specific key.
