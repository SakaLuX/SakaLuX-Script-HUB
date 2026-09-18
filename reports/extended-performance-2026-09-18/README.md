## Extended performance findings

12 scripts; 100 return routes per script; 10,000-row DOM; 20 off/on cycles where public APIs support them; slow/offline/429/malformed/recovery modes with exercised request counts; simulated visibility transitions; 30 actual minutes of combined chat churn. Offline fixtures, no actual TornPDA battery/FPS or authenticated-account test.

| Script | Observers before/after | Intervals before/after | JS errors |
|---|---|---|---|
| Apocalypse-Poker-Exit-Alert.user.js | 1/1 | 1/1 | 0 |
| SakaLuX-Account-Auditor.user.js | 2/2 | 1/1 | 0 |
| SakaLuX-Bazaar-Thanker-PDA.user.js | 3/3 | 0/0 | 0 |
| SakaLuX-Chat-Intelligence.user.js | 2/2 | 0/0 | 0 |
| SakaLuX-Company-Intelligence-v1.0.0.user.js | 3/3 | 2/2 | 0 |
| SakaLuX-Elimination-Assistant.user.js | 5/5 | 2/2 | 0 |
| SakaLuX-Enhancer-Guard.user.js | 4/4 | 0/0 | 0 |
| SakaLuX-Market-Intelligence.user.js | 4/4 | 0/0 | 0 |
| SakaLuX-Mission-Rewards.user.js | 5/5 | 0/0 | 0 |
| SakaLuX-Script-Hub.user.js | 1/1 | 1/1 | 0 |
| SakaLuX-Stock-Manager-Advisor.user.js | 2/2 | 2/1 | 0 |
| SakaLuX-Suite.user.js | 2/2 | 3/3 | 0 |

Soak elapsed: 1800 seconds. Post-GC heap 7.87 → 5.73 MB. DOM 352 → 403. Observers 23 → 16.

Failed checks: Stocks remounts once on each of 100 return routes.

Chat v1.2.20 bounds recent message IDs at 4,096 and uses weak per-node message tracking to preserve notification deduplication after eviction. Regression: 100,000 messages, retained nodes, new messages and reused nodes.
