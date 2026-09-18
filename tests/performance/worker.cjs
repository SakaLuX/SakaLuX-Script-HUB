const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { JSDOM, VirtualConsole } = require('jsdom');
const filename = process.argv[2], mode = process.argv[3] || 'standalone';
const source = fs.readFileSync(path.join(process.env.PERF_SOURCE_ROOT || '.', filename), 'utf8');
const specialized = mode === 'relevant';
const paths = { 'Enhancer': 'item.php', 'Bazaar': 'events.php', 'Market': 'imarket.php', 'Mission': 'loader.php?sid=missions', 'Elimination': 'competition.php', 'Company': 'joblist.php', 'Stock': 'page.php?sid=stocks', 'Poker': 'loader.php?sid=poker', 'Chat': 'index.php' };
const match = Object.keys(paths).find(x => filename.includes(x));
const page = mode === 'suite-enabled' ? 'factions.php?step=your' : specialized ? paths[match] || 'index.php' : 'profiles.php?XID=2380374';
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', e => { if (!/navigation|HTMLCanvasElement/.test(e.message)) errors.push(e.message); });
const rows = Array.from({ length: 400 }, (_, i) => `<li class="item-row"><div class="thumbnail-wrap"><span class="name">Item ${i}</span></div><a href="profiles.php?XID=${i+1000}">Player ${i}</a><span>${i}</span></li>`).join('');
const dom = new JSDOM(`<!doctype html><html><head></head><body><header id="topHeader"><ul class="status-icons"></ul></header><main id="content"><div id="mainContainer"><ul id="stock-market-list">${rows}</ul></div></main><aside id="chat-box"><div class="chat-messages"></div><textarea placeholder="Type your message"></textarea></aside></body></html>`, { url: 'https://www.torn.com/'+page, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole });
const w = dom.window;
Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; }, set(x) { this.textContent = x; } });
w.alert = () => {}; w.confirm = () => false; w.prompt = () => null;
w.fetch = async () => { throw new Error('Offline performance fixture'); };
w.GM_xmlhttpRequest = opts => { w.setTimeout(() => opts.onerror?.({ status: 0 }), 0); return { abort() {} }; };
w.GM_getValue = (key, fallback) => fallback; w.GM_setValue = () => {}; w.GM_addStyle = css => { const s = w.document.createElement('style'); s.textContent = css; w.document.head.appendChild(s); };
w.GM = { getValue: async (key, value) => value, setValue: async () => {}, xmlHttpRequest: w.GM_xmlhttpRequest };
w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
if (mode === 'hub') w.SakaLuXScriptHub = { getApiKey: () => '', getLanguage: () => 'en' };
// Avoid prompts affecting unrelated DOM workload measurements.
for (const key of ['SakaLuX_HUB_PROMPT_LAST','sakalux-hub-prompt-last','sakalux_standalone_hub_prompt_last_v1']) w.localStorage.setItem(key, String(Date.now()));
if (mode === 'suite-enabled') w.localStorage.setItem('sakalux_master_suite_settings_v1', JSON.stringify({ modules: Object.fromEntries(['prayerReminder','medAdvisor','itemIntel','eventsDashboard','activityIntelligence','factionMemberView','armoryLoanScanner','warLedger','ocOperations','companyManagement','racingChampionship','casinoEdgeScanner','targetAlerts','chainAlarm'].map(id=>[id,true])) }));
let measure = false;
const timeoutSources = {};
const stats = { queries: 0, queryMs: 0, observerCalls: 0, observerMs: 0, observerMaxMs: 0, timeoutsScheduled: 0, timeoutsRun: 0, intervalsRun: 0, rafScheduled: 0 };
for (const proto of [w.Document.prototype, w.Element.prototype]) for (const method of ['querySelector', 'querySelectorAll']) {
  const original = proto[method];
  proto[method] = function(...args) { const start = performance.now(); try { return original.apply(this, args); } finally { if (measure) { stats.queries++; stats.queryMs += performance.now()-start; } } };
}
const NativeObserver = w.MutationObserver;
const observers = [];
const observerStats = [];
w.MutationObserver = class extends NativeObserver {
  constructor(callback) { const detail = { source: new Error().stack.split('\n')[2].trim(), calls: 0, ms: 0 }; observerStats.push(detail); super((records, observer) => { const start = performance.now(); try { callback(records, observer); } catch(e) { errors.push(e.message); } finally { if (measure) { const elapsed = performance.now()-start; detail.calls++; detail.ms += elapsed; stats.observerCalls++; stats.observerMs += elapsed; stats.observerMaxMs = Math.max(stats.observerMaxMs, elapsed); } } }); observers.push(this); }
};
const originalTimeout = w.setTimeout.bind(w), originalInterval = w.setInterval.bind(w), originalRaf = w.requestAnimationFrame.bind(w);
w.setTimeout = (fn, delay, ...args) => { if (measure) { stats.timeoutsScheduled++; const caller = new Error().stack.split("\n")[2].trim(); timeoutSources[caller] = (timeoutSources[caller] || 0) + 1; } return originalTimeout(() => { if (measure) stats.timeoutsRun++; fn(...args); }, delay); };
w.setInterval = (fn, delay, ...args) => originalInterval(() => { if (measure) stats.intervalsRun++; fn(...args); }, delay);
w.requestAnimationFrame = fn => { if (measure) stats.rafScheduled++; return originalRaf(fn); };
process.on('unhandledRejection', e => errors.push(String(e.message || e)));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const started = performance.now();
  try { w.eval(source); } catch(e) { errors.push(e.message); }
  const evalMs = performance.now()-started;
  await sleep(1000);
  measure = true;
  const chat = w.document.querySelector('.chat-messages');
  // 40 continuous unrelated changes at 20ms intervals, then let queued work drain.
  for (let i=0; i<40; i++) { const row = w.document.createElement('div'); row.textContent = 'message '+i; chat.appendChild(row); if (chat.children.length>8) chat.firstChild.remove(); await sleep(20); }
  await sleep(450);
  measure = false;
  for (const observer of observers) observer.disconnect();
  dom.window.close();
  for (const k of Object.keys(stats)) if (k.endsWith('Ms')) stats[k] = +stats[k].toFixed(2);
  console.log(JSON.stringify({ file: filename, mode, page, evalMs: +evalMs.toFixed(2), observers: observers.length, ...stats, timeoutSources, observerStats: observerStats.map(x=>({...x,ms:+x.ms.toFixed(2)})), errors: [...new Set(errors)] }));
})();
