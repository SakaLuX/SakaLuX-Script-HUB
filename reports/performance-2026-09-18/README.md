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
