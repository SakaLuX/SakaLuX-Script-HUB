# Extended performance audit — 2026-09-18

Offline synthetic Chromium; 412 × 915 touch viewport. No real API keys, accounts, trades or external snapshot writes. All focused final-source regressions pass. The archived before-fix Suite report intentionally records the reproduced listener failure.

## Route and large-DOM stress

All 12 userscripts: 100 route-return cycles each, 10,000 inserted/removed DOM rows, visibility transitions and bounded observer/interval/DOM checks. The original 65ms Stocks samples found 97/100 mounted panels; this timing finding is preserved, and the independently timed final-source verification resolves it below. Large generic rows exercise DOM load; they do not represent every live Torn selector.

| Script | Tested version | Routes | Observers before/after | Intervals before/after | JS errors |
|---|---|---|---|---|---|
| Apocalypse-Poker-Exit-Alert | 0.7.2 | 100 | 1/1 | 1/1 | 0 |
| Account-Auditor | 1.3.15 | 100 | 2/2 | 1/1 | 0 |
| Bazaar-Thanker-PDA | 5.3.40 | 100 | 3/3 | 0/0 | 0 |
| Chat-Intelligence | 1.2.20 | 100 | 2/2 | 0/0 | 0 |
| Company-Intelligence-v1.0.0 | 1.8.38 | 100 | 3/3 | 2/2 | 0 |
| Elimination-Assistant | 1.3.44 | 100 | 5/5 | 2/2 | 0 |
| Enhancer-Guard | 1.3.47 | 100 | 4/4 | 0/0 | 0 |
| Market-Intelligence | 1.17.39 | 100 | 4/4 | 0/0 | 0 |
| Mission-Rewards | 1.0.42 | 100 | 5/5 | 0/0 | 0 |
| Script-Hub | 1.9.73 | 100 | 1/1 | 1/1 | 0 |
| Stock-Manager-Advisor | 0.8.7 | 100 | 2/2 | 2/1 | 0 |
| Suite | 0.9.928 | 100 | 2/2 | 3/3 | 0 |

Stocks timed retest: 100/100 returns mounted exactly once within the explicit 500ms eventual deadline; 99/100 early checks passed. Maximum observed sample latency including browser transport: 98ms. The production mount is scheduled after 40ms; a 65ms single observation provides little headroom for DOM construction and runner scheduling. No production delay was increased. Original findings remain unchanged in results.json; all timed retest assertions pass.

## Thirty-minute endurance

Two separate contexts ran concurrently for 30 real wall-clock minutes. Post-GC heap is compared within each context; minute 5 is the warm-up reference. Combined loads 11 SakaLuX scripts on stocks; native Suite enables all 14 embedded modules on the synthetic faction page. Page-specific features may remain dormant without real account data. Each context retains at most 40 live synthetic chat messages.

| Context | Elapsed seconds | Heap MB minute 5/final | Heap growth MB | DOM minute 5/final | Observers minute 5/final | Intervals minute 5/final | JS errors |
|---|---|---|---|---|---|---|---|
| combined | 1800 | 8.30 → 8.55 | +0.25 | 449/449 | 23/23 | 8/8 | 0 |
| SakaLuX-Suite.user.js | 1800 | 6.24 → 5.73 | -0.51 | 403/403 | 16/16 | 13/13 | 0 |

The long run tested the source versions listed above. Later request-sharing and disable-cleanup changes are verified by focused browser and production-function regressions; they were not retroactively part of this 30-minute run.

## Repeated controls and browser suspension

11 SakaLuX scripts: 30 public panel-open attempts; 20 disable/enable cycles where supported. Suite: 23 actual switches, 20 click actions each (460 actions). Chat: actual search, maximize and restored mention controls. All contexts received actual Chromium freeze/resume via CDP. Frame-inclusive timings include requestAnimationFrame and are not phone FPS.

| Script | Panel-open attempts | Disable/enable cycles | Heap MB before/after GC | JS errors |
|---|---|---|---|---|
| Account-Auditor | 30 | 0 | 0.90/0.91 | 0 |
| Bazaar-Thanker-PDA | 30 | 20 | 0.98/1.00 | 0 |
| Chat-Intelligence | 30 | 20 | 0.87/0.94 | 0 |
| Company-Intelligence-v1.0.0 | 30 | 20 | 1.07/1.22 | 0 |
| Elimination-Assistant | 30 | 20 | 1.06/1.11 | 0 |
| Enhancer-Guard | 30 | 20 | 1.01/1.84 | 0 |
| Market-Intelligence | 30 | 20 | 1.22/1.31 | 0 |
| Mission-Rewards | 30 | 20 | 0.99/1.05 | 0 |
| Script-Hub | 30 | 0 | 1.44/1.57 | 0 |
| Stock-Manager-Advisor | 30 | 20 | 1.35/1.75 | 0 |
| Suite | 30 | 0 | 4.48/6.47 | 0 |

Enhancer dedicated fixture: 5000/5000 real thumbnail rows protected; 283.81 ms accumulated JavaScript time in this sample.

## Request bursts and network recovery

Eight API-bearing scripts use synthetic credentials and real public methods. Modes: slow, offline, HTTP 429, malformed JSON, then success. Controlled rejections or partial snapshots are expected outcomes; no uncaught JavaScript errors or fixture deadlines remain. The slow-mode burst invokes the method 20 times concurrently.

| Script | Method | Requests before | Requests after | Reduction |
|---|---|---|---|---|
| Account-Auditor | snapshot | 1840 | 92 | 95.0% |
| Company-Intelligence-v1.0.0 | refresh | 5 | 5 | 0.0% |
| Elimination-Assistant | testTornKey | 2 | 2 | 0.0% |
| Enhancer-Guard | hardRefresh | 2 | 2 | 0.0% |
| Market-Intelligence | loadoutComparator | 40 | 2 | 95.0% |
| Mission-Rewards | hardRefresh | 2 | 2 | 0.0% |
| Script-Hub | refresh | 27 | 8 | 70.4% |
| Stock-Manager-Advisor | refresh | 60 | 3 | 95.0% |

Auditor snapshot performs 92 distinct endpoint reads; coalescing retains those reads while sharing a collection between overlapping callers. Its browser fixture scales rate/retry delays in the test copy only. Production spacing remains 1,100 ms and retries remain 3/6/12 seconds. The unmodified production permit regression is recorded in auditor-rate.json:

```json
{
  "before": {
    "label": "before",
    "requests": 20,
    "testGapMs": 20,
    "minGapMs": 0,
    "maxGapMs": 20
  },
  "after": {
    "label": "after",
    "requests": 20,
    "testGapMs": 20,
    "minGapMs": 19,
    "maxGapMs": 21
  },
  "production": {
    "label": "production-gap",
    "requests": 4,
    "testGapMs": 1100,
    "minGapMs": 1101,
    "maxGapMs": 1102
  }
}
```

## Retained-resource and deduplication fixes

Suite 20 complete on/off cycles (920 switch actions): retained additional global listeners before 5 → 100; after 0 → 0. After 60 seconds, pending callbacks: 0. Listener tracking honors AbortSignal cleanup and excludes DOM-local listeners.

Chat: 100,000-message production-function regression; recent-ID cache capped at 4,096; retained-message deduplication, new/reused-node notifications and mention reattachment checked. Elimination: discarded panel observers and document-click handlers explicitly cleaned. Request-sharing regressions also check key/item independence and recovery after failure.

## Final-source CPU workload

28 before/after Chromium samples repeat the established 400-row and 40-chat-mutation workload at six-times CPU throttling, with actual 412px layout and recognizable chat message nodes. Before uses the seven pre-audit backups; unchanged scripts use the identical current source. These single samples measure this workload, not statistical device benchmarks or phone FPS. CPU variations and individual long tasks are recorded rather than hidden.

| Script / mode | After version | Script ms before/after | Layout ms before/after | Long tasks before/after | After JS errors |
|---|---|---|---|---|---|
| Apocalypse-Poker-Exit-Alert / normal | 0.7.2 | 29.41/34.74 | 6.82/10.64 | 0/0 | 0 |
| Account-Auditor / normal | 1.3.16 | 4.34/6.67 | 8.34/10.04 | 0/0 | 0 |
| Bazaar-Thanker-PDA / normal | 5.3.40 | 29.90/31.21 | 10.51/19.45 | 0/0 | 0 |
| Chat-Intelligence / normal | 1.2.20 | 49.26/58.27 | 20.60/32.95 | 0/0 | 0 |
| Company-Intelligence-v1.0.0 / normal | 1.8.38 | 13.03/17.03 | 10.04/8.30 | 0/0 | 0 |
| Elimination-Assistant / normal | 1.3.44 | 16.78/12.52 | 18.72/11.80 | 0/0 | 0 |
| Enhancer-Guard / normal | 1.3.47 | 14.23/14.72 | 19.60/24.59 | 0/0 | 0 |
| Market-Intelligence / normal | 1.17.40 | 24.47/26.36 | 8.06/13.51 | 0/0 | 0 |
| Mission-Rewards / normal | 1.0.42 | 9.33/9.61 | 16.00/7.12 | 0/0 | 0 |
| Script-Hub / normal | 1.9.73 | 12.20/16.22 | 10.35/10.55 | 0/0 | 0 |
| Stock-Manager-Advisor / normal | 0.8.7 | 46.64/44.74 | 18.30/17.40 | 0/0 | 0 |
| Suite / normal | 0.9.929 | 2.73/2.74 | 10.65/9.20 | 0/0 | 0 |
| Suite / all-native-enabled | 0.9.929 | 196.88/150.08 | 11.47/8.93 | 0/0 | 0 |
| __combined-SakaLuX__ / normal | combined | 354.81/202.05 | 54.11/50.02 | 1/0 | 0 |

Chat, Suite and combined cases receive five independent repetitions in fresh Chromium processes. Median and full ranges are reported below; no assertion equates a timing fluctuation with a real-phone improvement. Full 40 samples are in browser-focused.json and the five raw files.

| Script / mode | Median script ms before/after | Before range ms | After range ms | Total long tasks before/after |
|---|---|---|---|---|
| Chat-Intelligence / normal | 63.52/62.75 | 55.17–68.21 | 53.30–64.02 | 0/0 |
| Suite / normal | 3.92/4.31 | 2.96–6.09 | 2.74–5.62 | 0/0 |
| Suite / all-native-enabled | 191.63/201.72 | 179.87–200.90 | 188.87–208.57 | 0/0 |
| __combined-SakaLuX__ / normal | 358.13/345.21 | 347.95–370.30 | 323.09–364.34 | 0/0 |

## Limits and delivery

These tests cover offline fixtures. Actual Android battery consumption, authenticated Torn data, TornPDA device FPS and Android suspension require a real phone/session and were not measured. Existing six-times-CPU-throttled browser measurements remain in reports/performance-2026-09-18. No device-wide smoothness guarantee follows from synthetic timings.

Delivery: all 12 complete current scripts; seven updated versioned releases; synchronized registry/INFO/NEW documentation; complete previous versions; JSON evidence; SHA-256 checksums.
