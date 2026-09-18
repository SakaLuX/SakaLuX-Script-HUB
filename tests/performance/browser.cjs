// Chromium measurements under synthetic DOM load; not a TornPDA FPS claim.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const files = fs.readdirSync('.').filter(x => x.endsWith('.user.js')).sort();
const registry = JSON.parse(fs.readFileSync('scripts.json','utf8'));
const nativeIds = ['prayerReminder','medAdvisor','itemIntel','eventsDashboard','activityIntelligence','factionMemberView','armoryLoanScanner','warLedger','ocOperations','companyManagement','racingChampionship','casinoEdgeScanner','targetAlerts','chainAlarm'];
const paths = { Enhancer:'item.php', Bazaar:'page.php?sid=events', Market:'imarket.php', Mission:'loader.php?sid=missions', Elimination:'competition.php', Company:'joblist.php', Stock:'page.php?sid=stocks', Poker:'loader.php?sid=poker', Chat:'index.php' };
const html = '<!doctype html><html><head><style>body{margin:0;background:#222;color:white}#chat-box{position:fixed;right:0;bottom:36px;width:310px;height:280px;overflow:hidden;background:#133}.chat-messages{height:200px;overflow:auto}textarea{width:280px}main{max-width:600px}li{height:28px}</style></head><body><header id="topHeader"><ul class="status-icons"></ul></header><main id="content"><div id="mainContainer"><ul id="stock-market-list">'+Array.from({length:400},(_,i)=>`<li class="item-row" data-item-name="Item ${i}"><div class="thumbnail-wrap"><img alt="Item ${i}"></div><a href="profiles.php?XID=${i+1000}">Player ${i}</a><span>${i}</span></li>`).join('')+'</ul></div></main><aside id="chat-box"><header>Global</header><div class="chat-messages"></div><textarea placeholder="Type your message"></textarea></aside></body></html>';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results=[];
 try {
  for(const file of files) for(const variant of ['before','after']) {
   const source=fs.readFileSync(path.join(variant==='before'?'backups/performance-audit-2026-09-18':'.',file),'utf8');
   const modes=file.includes('Suite')?['normal','all-native-enabled']:['normal'];
   for(const mode of modes) {
    const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>route.request().isNavigationRequest()?route.fulfill({status:200,contentType:'text/html',body:html}):route.abort());
    const key=Object.keys(paths).find(x=>file.includes(x));
    await page.goto('https://www.torn.com/'+(mode==='all-native-enabled'?'factions.php?step=your':paths[key]||'index.php'));
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
    await cdp.send('Performance.enable');
    await page.evaluate(({registry,nativeIds,mode})=>{
     window.fetch=async url=>{if(String(url).includes('scripts.json'))return {ok:true,json:async()=>registry};throw Error('Offline fixture')};
     window.GM_xmlhttpRequest=opts=>{setTimeout(()=>opts.onerror?.({status:0}),0);return {abort(){}}};
     window.GM_getValue=(key,value)=>value;window.GM_setValue=()=>{};
     window.GM={getValue:async(k,v)=>v,setValue:async()=>{},xmlHttpRequest:window.GM_xmlhttpRequest};
     window.alert=()=>{};window.confirm=()=>false;window.prompt=()=>null;
     localStorage.setItem('SakaLuX_HUB_INSTALL_PROMPT_LAST',String(Date.now()));
     if(mode==='all-native-enabled')localStorage.setItem('sakalux_master_suite_settings_v1',JSON.stringify({modules:Object.fromEntries(nativeIds.map(id=>[id,true]))}));
     window.__perf={enabled:false,queries:0,timersScheduled:0,longTasks:[],observerCalls:0};
     for(const proto of [Document.prototype,Element.prototype])for(const method of ['querySelector','querySelectorAll']){const original=proto[method];proto[method]=function(...args){if(__perf.enabled)__perf.queries++;return original.apply(this,args)}}
     const timeout=window.setTimeout;window.setTimeout=(fn,ms,...args)=>{if(__perf.enabled)__perf.timersScheduled++;return timeout(fn,ms,...args)};
     const observer=window.MutationObserver;window.MutationObserver=class extends observer{constructor(fn){super((records,o)=>{if(__perf.enabled)__perf.observerCalls++;fn(records,o)})}};
     new PerformanceObserver(list=>{if(__perf.enabled)__perf.longTasks.push(...list.getEntries().map(x=>x.duration))}).observe({entryTypes:['longtask']});
    },{registry,nativeIds,mode});
    await page.evaluate(source);
    await page.waitForTimeout(1400);
    const first=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
    await page.evaluate(()=>{__perf.enabled=true});
    await page.evaluate(async()=>{const chat=document.querySelector('.chat-messages');for(let i=0;i<40;i++){const row=document.createElement('div');row.textContent='message '+i;chat.appendChild(row);if(chat.children.length>8)chat.firstChild.remove();await new Promise(r=>setTimeout(r,20))}await new Promise(r=>setTimeout(r,450));__perf.enabled=false});
    const last=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x=>[x.name,x.value]));
    const counts=await page.evaluate(()=>({queries:__perf.queries,timersScheduled:__perf.timersScheduled-41,observerCalls:__perf.observerCalls,longTasks:__perf.longTasks.length,maxLongTaskMs:Math.max(0,...__perf.longTasks)}));
    const result={file,variant,mode,...counts,scriptMs:+((last.ScriptDuration-first.ScriptDuration)*1000).toFixed(2),layoutMs:+((last.LayoutDuration-first.LayoutDuration)*1000).toFixed(2),heapMB:+(last.JSHeapUsedSize/1024/1024).toFixed(2),errors:[...new Set(errors)]};
    results.push(result);console.log('BROWSER_RESULT '+JSON.stringify(result));
    await context.close();
   }
  }
 } finally {await browser.close()}
 const report={fixture:'Chromium; 412x915 touch viewport; CPU throttling 6x; 400 rows; 40 unrelated chat mutations at 20ms; 1400ms startup settle and 450ms drain; offline APIs. Counts include pending startup/UI work. Not actual phone FPS.',results};
 fs.writeFileSync(process.argv[2]||'/tmp/browser-performance.json',JSON.stringify(report,null,2));
 for(const row of results.filter(x=>x.variant==='after'))assert.equal(row.errors.length,0,`${row.file} ${row.mode}: ${row.errors.join('; ')}`);
})();
