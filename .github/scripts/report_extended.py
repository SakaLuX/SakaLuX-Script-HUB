"""Render the measured audit, grouping endurance samples by their own context."""
import json
from pathlib import Path

root = Path('reports/extended-performance-2026-09-18')
def read(name):
    return json.loads((root / (name + '.json')).read_text())
def short(file):
    return file.removeprefix('SakaLuX-').removesuffix('.user.js')
def table(headers, rows):
    return '\n'.join(['| ' + ' | '.join(headers) + ' |',
                      '|' + '|'.join(['---'] * len(headers)) + '|'] +
                     ['| ' + ' | '.join(map(str, row)) + ' |' for row in rows]) + '\n'

data = read('results')
interactive = read('interactive')
network = read('network-browser')
previous_network = read('network-browser-before')
suite = read('suite-stability')
previous_suite = read('suite-stability-before')
rate = read('auditor-rate')
cpu = read('browser-current')
focused = read('browser-focused')
stocks_routes = read('stocks-route-verification')
reports = [data, interactive, network, suite, cpu, focused]
failures = [x['label'] for report in reports for x in report['assertions'] if not x['passed']]
assert failures in ([], ['Stocks remounts once on each of 100 return routes']), failures
assert stocks_routes['assertions'] and all(x['passed'] for x in stocks_routes['assertions'])
text = '# Extended performance audit — 2026-09-18\n\n'
text += ('Offline synthetic Chromium; 412 × 915 touch viewport. No real API keys, accounts, '
         'trades or external snapshot writes. All focused final-source regressions pass. '
         'The archived before-fix Suite report intentionally records the reproduced listener failure.\n\n')
text += '## Route and large-DOM stress\n\n'
text += ('All 12 userscripts: 100 route-return cycles each, 10,000 inserted/removed DOM rows, '
         'visibility transitions and bounded observer/interval/DOM checks. '
         'The original 65ms Stocks samples found 97/100 mounted panels; this timing finding is preserved, '
         'and the independently timed final-source verification resolves it below. Large generic rows exercise DOM load; '
         'they do not represent every live Torn selector.\n\n')
text += table(['Script', 'Tested version', 'Routes', 'Observers before/after', 'Intervals before/after', 'JS errors'],
              [[short(r['file']), r['version'], r['routes'],
                f"{r['before']['observers']}/{r['after']['observers']}",
                f"{r['before']['intervals']}/{r['after']['intervals']}", len(r['errors'])]
               for r in data['results']])
route_cycles = stocks_routes['results'][0]['cycles']
text += (f"\nStocks timed retest: {sum(x['mounted'] and not x['deadline'] for x in route_cycles)}/"
         f"{len(route_cycles)} returns mounted exactly once within the explicit 500ms eventual deadline; "
         f"{sum(x['within65ms'] for x in route_cycles)}/100 early checks passed. "
         f"Maximum observed sample latency including browser transport: {max(x['elapsedMs'] for x in route_cycles)}ms. "
         'The production mount is scheduled after 40ms; a 65ms single observation provides little '
         'headroom for DOM construction and runner scheduling. No production delay was increased. '
         'Original findings remain unchanged in results.json; all timed retest assertions pass.\n')
text += '\n## Thirty-minute endurance\n\n'
text += ('Two separate contexts ran concurrently for 30 real wall-clock minutes. '
         'Post-GC heap is compared within each context; minute 5 is the warm-up reference. '
         'Combined loads 11 SakaLuX scripts on stocks; native Suite enables all 14 embedded modules '
         'on the synthetic faction page. Page-specific features may remain dormant without real account data. '
         'Each context retains at most 40 live synthetic chat messages.\n\n')
rows = []
for file in dict.fromkeys(x['file'] for x in data['soak']):
    samples = [x for x in data['soak'] if x['file'] == file]
    warm, last = samples[5], samples[-1]
    assert last['elapsedSeconds'] >= 1800
    rows.append([file, last['elapsedSeconds'],
                 f"{warm['heapMB']:.2f} → {last['heapMB']:.2f}",
                 f"{last['heapMB'] - warm['heapMB']:+.2f}",
                 f"{warm['nodes']}/{last['nodes']}",
                 f"{warm['observers']}/{last['observers']}",
                 f"{warm['intervals']}/{last['intervals']}", len(last['errors'])])
text += table(['Context', 'Elapsed seconds', 'Heap MB minute 5/final', 'Heap growth MB',
               'DOM minute 5/final', 'Observers minute 5/final', 'Intervals minute 5/final', 'JS errors'], rows)
text += ('\nThe long run tested the source versions listed above. Later request-sharing and disable-cleanup '
         'changes are verified by focused browser and production-function regressions; '
         'they were not retroactively part of this 30-minute run.\n')
text += '\n## Repeated controls and browser suspension\n\n'
text += ('11 SakaLuX scripts: 30 public panel-open attempts; 20 disable/enable cycles where supported. '
         'Suite: 23 actual switches, 20 click actions each (460 actions). Chat: actual search, maximize '
         'and restored mention controls. All contexts received actual Chromium freeze/resume via CDP. '
         'Frame-inclusive timings include requestAnimationFrame and are not phone FPS.\n\n')
text += table(['Script', 'Panel-open attempts', 'Disable/enable cycles', 'Heap MB before/after GC', 'JS errors'],
              [[short(r['file']), r['opens'], r['toggles'],
                f"{r['heapBeforeMB']:.2f}/{r['heapAfterMB']:.2f}", len(r['errors'])]
               for r in interactive['results']])
inventory = next(r['inventoryLoad'] for r in interactive['results'] if 'inventoryLoad' in r)
text += (f"\nEnhancer dedicated fixture: {inventory['badges']}/{inventory['rows']} real thumbnail rows protected; "
         f"{inventory['scriptMs']:.2f} ms accumulated JavaScript time in this sample.\n")
text += '\n## Request bursts and network recovery\n\n'
text += ('Eight API-bearing scripts use synthetic credentials and real public methods. Modes: slow, '
         'offline, HTTP 429, malformed JSON, then success. Controlled rejections or partial snapshots '
         'are expected outcomes; no uncaught JavaScript errors or fixture deadlines remain. '
         'The slow-mode burst invokes the method 20 times concurrently.\n\n')
old_by_file = {r['file']: r for r in previous_network['results']}
rows = []
for r in network['results']:
    old = next(x for x in old_by_file[r['file']]['samples'] if x['mode'] == 'slow')
    new = next(x for x in r['samples'] if x['mode'] == 'slow')
    rows.append([short(r['file']), new['method'], old['requests'], new['requests'],
                 f"{100 * (1 - new['requests'] / old['requests']):.1f}%" if old['requests'] else 'n/a'])
text += table(['Script', 'Method', 'Requests before', 'Requests after', 'Reduction'], rows)
text += ('\nAuditor snapshot performs 92 distinct endpoint reads; coalescing retains those reads '
         'while sharing a collection between overlapping callers. Its browser fixture scales rate/retry '
         'delays in the test copy only. Production spacing remains 1,100 ms and retries remain '
         '3/6/12 seconds. The unmodified production permit regression is recorded in auditor-rate.json:\n\n')
text += '```json\n' + json.dumps(rate, indent=2) + '\n```\n'
text += '\n## Retained-resource and deduplication fixes\n\n'
before_cycles = previous_suite['results'][0]['cycles']
after_cycles = suite['results'][0]['cycles']
text += (f"Suite 20 complete on/off cycles (920 switch actions): retained additional global listeners "
         f"before {before_cycles[0]['activeGlobalListeners']} → {before_cycles[-1]['activeGlobalListeners']}; "
         f"after {after_cycles[0]['activeGlobalListeners']} → {after_cycles[-1]['activeGlobalListeners']}. "
         f"After 60 seconds, pending callbacks: {suite['soak'][-1]['timeouts']}. "
         'Listener tracking honors AbortSignal cleanup and excludes DOM-local listeners.\n\n')
text += ('Chat: 100,000-message production-function regression; recent-ID cache capped at 4,096; '
         'retained-message deduplication, new/reused-node notifications and mention reattachment checked. '
         'Elimination: discarded panel observers and document-click handlers explicitly cleaned. '
         'Request-sharing regressions also check key/item independence and recovery after failure.\n')
text += '\n## Final-source CPU workload\n\n'
text += ('28 before/after Chromium samples repeat the established 400-row and 40-chat-mutation workload '
         'at six-times CPU throttling, with actual 412px layout and recognizable chat message nodes. '
         'Before uses the seven pre-audit backups; unchanged scripts use the identical current source. '
         'These single samples measure this workload, not statistical device benchmarks or phone FPS. '
         'CPU variations and individual long tasks are recorded rather than hidden.\n\n')
old_cpu = {(r['file'], r['mode']): r for r in cpu['results'] if r['variant'] == 'before'}
text += table(['Script / mode', 'After version', 'Script ms before/after', 'Layout ms before/after',
               'Long tasks before/after', 'After JS errors'],
              [[short(r['file']) + ' / ' + r['mode'], r['version'],
                f"{old_cpu[(r['file'],r['mode'])]['scriptMs']:.2f}/{r['scriptMs']:.2f}",
                f"{old_cpu[(r['file'],r['mode'])]['layoutMs']:.2f}/{r['layoutMs']:.2f}",
                f"{old_cpu[(r['file'],r['mode'])]['longTasks']}/{r['longTasks']}", len(r['errors'])]
               for r in cpu['results'] if r['variant'] == 'after'])
text += ('\nChat, Suite and combined cases receive five independent repetitions in fresh Chromium '
         'processes. Median and full ranges are reported below; no assertion equates a timing fluctuation '
         'with a real-phone improvement. Full 40 samples are in browser-focused.json and the five raw files.\n\n')
text += table(['Script / mode', 'Median script ms before/after', 'Before range ms', 'After range ms',
               'Total long tasks before/after'],
              [[short(r['file']) + ' / ' + r['mode'],
                f"{r['before']['medianScriptMs']:.2f}/{r['after']['medianScriptMs']:.2f}",
                f"{r['before']['minScriptMs']:.2f}–{r['before']['maxScriptMs']:.2f}",
                f"{r['after']['minScriptMs']:.2f}–{r['after']['maxScriptMs']:.2f}",
                f"{r['before']['longTasks']}/{r['after']['longTasks']}"] for r in focused['summary']])
text += '\n## Limits and delivery\n\n'
text += ('These tests cover offline fixtures. Actual Android battery consumption, authenticated Torn data, '
         'TornPDA device FPS and Android suspension require a real phone/session and were not measured. '
         'Existing six-times-CPU-throttled browser measurements remain in reports/performance-2026-09-18. '
         'No device-wide smoothness guarantee follows from synthetic timings.\n\n'
         'Delivery: all 12 complete current scripts; seven updated versioned releases; synchronized '
         'registry/INFO/NEW documentation; complete previous versions; JSON evidence; SHA-256 checksums.\n')
(root / 'README.md').write_text(text)
print('Rendered grouped measured audit:', root / 'README.md')
