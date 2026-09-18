# Performance audit — 2026-09-18

All 12 root userscripts were audited. Eleven SakaLuX scripts received targeted fixes; the Poker alert script was benchmarked and retained unchanged.

## Synthetic DOM measurements

Node/jsdom; 400 rows; 40 unrelated chat mutations at 20ms intervals; 1000ms startup settle and 450ms drain. Offline API fixtures use no credentials. Counts include pending startup/UI work; wall-clock timing varies. These are workload measurements, not actual TornPDA frame rates.

| Script | Scheduled timers before → after | DOM queries before → after |
|---|---:|---:|
| private-module.user.js | 14 → 14 | 86 → 86 |
| SakaLuX-Account-Auditor.user.js | 41 → 1 | 5 → 5 |
| SakaLuX-Bazaar-Thanker-PDA.user.js | 41 → 1 | 87 → 10 |
| SakaLuX-Chat-Intelligence.user.js | 40 → 7 | 4 → 22 |
| SakaLuX-Company-Intelligence-v1.0.0.user.js | 41 → 1 | 92 → 15 |
| SakaLuX-Elimination-Assistant.user.js | 41 → 1 | 22 → 16 |
| SakaLuX-Enhancer-Guard.user.js | 126 → 2 | 1290 → 11 |
| SakaLuX-Market-Intelligence.user.js | 167 → 2 | 261 → 15 |
| SakaLuX-Mission-Rewards.user.js | 205 → 1 | 417 → 12 |
| SakaLuX-Script-Hub.user.js | 52 → 7 | 355 → 258 |
| SakaLuX-Stock-Manager-Advisor.user.js | 41 → 1 | 128 → 51 |
| SakaLuX-Suite.user.js | 49 → 2 | 37 → 9 |

Suite was also tested with all 14 built-in modules enabled. Its own Recovery Planner SVG replacement loop was removed, country repair stays on relevant views, and scans are coalesced. The raw enabled-module samples are included separately. jsdom reports one unsupported CSS stylesheet in both enabled-module samples; Chromium is used for actual stylesheet/runtime verification.

## Regression coverage

- All 12 source syntax checks and seven registry/version checks.
- All 23 Suite module entries, nine launch bridges, saved settings and missing-script feedback.
- Stocks mounting during continuous page mutations, delayed/hidden/replaced hosts and navigation.
- Hub detailed INFO/NEW, stale offline cache, newer release metadata and safe rendering.
- No legacy footer timers from unrelated chat; nested panel insertion and footer recovery.
- Stable lock-badge DOM when state is unchanged and immediate updates when protection changes.

## Chromium measurements

`browser.json` contains before/after measurements for all 12 scripts plus Suite with all native modules enabled. Chromium uses a 412×915 touch viewport and CPU throttling at 6×, with offline APIs. Script duration, layout duration, long tasks and heap are measured. This simulates limited CPU capacity; it is not a measurement on the user's phone or an authenticated live Torn page. API latency, Torn's own scripts, real account data and sustained memory use require device/live-page verification.


### Measured Chromium workload

| Script / mode | Script execution, ms before → after | Scheduled timers before → after | Long tasks before → after |
|---|---:|---:|---:|
| Apocalypse-Poker-Exit-Alert | 24.14 → 22.82 | 18 → 18 | 0 → 0 |
| SakaLuX-Account-Auditor | 9.87 → 5.6 | 40 → 0 | 0 → 0 |
| SakaLuX-Bazaar-Thanker-PDA | 21.32 → 28.59 | 82 → 23 | 0 → 0 |
| SakaLuX-Chat-Intelligence | 5.55 → 14.8 | 40 → 6 | 0 → 0 |
| SakaLuX-Company-Intelligence-v1.0.0 | 15.62 → 8.87 | 80 → 0 | 0 → 0 |
| SakaLuX-Elimination-Assistant | 6.68 → 3.28 | 40 → 0 | 0 → 0 |
| SakaLuX-Enhancer-Guard | 534.56 → 2.54 | 129 → 0 | 4 → 0 |
| SakaLuX-Market-Intelligence | 106.06 → 3.57 | 164 → 0 | 0 → 0 |
| SakaLuX-Mission-Rewards | 14.98 → 8.56 | 240 → 0 | 0 → 0 |
| SakaLuX-Script-Hub | 14.72 → 11.42 | 51 → 7 | 0 → 0 |
| SakaLuX-Stock-Manager-Advisor | 36.49 → 31.51 | 47 → 5 | 0 → 0 |
| SakaLuX-Suite | 17.26 → 1.05 | 47 → 0 | 0 → 0 |
| SakaLuX-Suite — all native modules enabled | 514.38 → 136.58 | 1384 → 70 | 0 → 0 |
| __combined-SakaLuX__ | 687.73 → 134.34 | 570 → 33 | 6 → 0 |

All 28 browser samples completed without JavaScript errors. In the combined SakaLuX scenario, script execution fell from 687.73ms to 134.34ms, scheduled timers from 570 to 33, and long tasks from six to zero. With all 14 native Suite modules enabled, script execution fell from 514.38ms to 136.58ms and scheduled timers from 1384 to 70. These comparisons apply to this synthetic workload and CPU setting, not to general phone FPS.

The browser report in the published release is the original verified run. The repository also contains corrected relevant-route DOM samples; those are supplementary to the Chromium measurements.
