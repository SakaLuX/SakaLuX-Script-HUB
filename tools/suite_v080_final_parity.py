from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.7.0','// @version      0.8.0',1)
s=s.replace("const VERSION='0.7.0';","const VERSION='0.8.0';",1)
if '// @updateURL' not in s:
    s=s.replace('// @license      All Rights Reserved\n', '// @license      All Rights Reserved\n// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js\n// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js\n',1)

# Store full module settings in backups and add diagnostics control.
s=s.replace("JSON.stringify({app:'SakaLuX Suite',version:VERSION,modules:state,recovery:recoveryCfg})", "JSON.stringify({app:'SakaLuX Suite',version:VERSION,modules:state,recovery:recoveryCfg,chain:load(SLX_KEYS.chain,CHAIN_DEFAULTS),item:load(SLX_KEYS.item,ITEM_CFG_DEFAULTS),events:load(SLX_KEYS.events,EVENT_CFG_DEFAULTS),odds:load(SLX_KEYS.odds,ODDS_CFG_DEFAULTS),pulse:load(SLX_KEYS.pulse,PULSE_CFG_DEFAULTS),oc:load(SLX_KEYS.ocCfg,OC_CFG_DEFAULTS)})")
s=s.replace("if(d.recovery)recoveryCfg={...RECOVERY_DEFAULTS,...d.recovery};save(K.modules,state);save(K.recovery,recoveryCfg);applyModules();open()", "if(d.recovery)recoveryCfg={...RECOVERY_DEFAULTS,...d.recovery};if(d.chain)save(SLX_KEYS.chain,d.chain);if(d.item)save(SLX_KEYS.item,d.item);if(d.events)save(SLX_KEYS.events,d.events);if(d.odds)save(SLX_KEYS.odds,d.odds);if(d.pulse)save(SLX_KEYS.pulse,d.pulse);if(d.oc)save(SLX_KEYS.ocCfg,d.oc);save(K.modules,state);save(K.recovery,recoveryCfg);applyModules();open()")
s=s.replace('<button class="slxs-tool" id="slxs-import">IMPORT SETTINGS</button>', '<button class="slxs-tool" id="slxs-import">IMPORT SETTINGS</button><button class="slxs-tool" id="slxs-diag">DIAGNOSTICS</button>')
s=s.replace("document.getElementById('slxs-import').onclick=()=>{", "document.getElementById('slxs-diag').onclick=()=>openDiagnostics();\n document.getElementById('slxs-import').onclick=()=>{")

# Better cleanup for armory inline styles.
s=s.replace("document.querySelectorAll('.slx-armory-loaned,.slx-armory-available').forEach(x=>x.classList.remove('slx-armory-loaned','slx-armory-available'));", "document.querySelectorAll('.slx-armory-loaned,.slx-armory-available').forEach(x=>{x.classList.remove('slx-armory-loaned','slx-armory-available');x.style.removeProperty('outline')});")

# Recovery: detect medical cooldown and faction armory snapshot quantities, and rank only usable options.
s=s.replace("const RECOVERY_DEFAULTS={source:'personal',bio1:false,bio2:false,iv:false,factionUpgrades:0,order:'smart',noDrugs:false};", "const RECOVERY_DEFAULTS={source:'personal',bio1:false,bio2:false,iv:false,factionUpgrades:0,order:'smart',noDrugs:false,respectCooldown:true};")
s=s.replace("function inventoryQty(name){const n=name.toLowerCase();for(const e of document.querySelectorAll('li,tr,[class*=\"item\"],[data-item],[data-itemid]')){const t=(e.innerText||'').toLowerCase();if(!t.includes(n))continue;const q=(e.innerText||'').match(/(?:x|qty\\s*:?|quantity\\s*:?)[ ]*(\\d[\\d,]*)/i);if(q)return Number(q[1].replace(/,/g,''))}return null}", "function inventoryQty(name){const n=name.toLowerCase();if(recoveryCfg.source==='faction'){const snap=load(SLX_KEYS.armory,{rows:[]});const hits=(snap.rows||[]).filter(x=>(x.item||x.t||'').toLowerCase().includes(n));if(hits.length)return hits.length}for(const e of document.querySelectorAll('li,tr,[class*=\"item\"],[data-item],[data-itemid],[data-item-id]')){const t=(e.innerText||'').toLowerCase();if(!t.includes(n))continue;const q=(e.innerText||'').match(/(?:x|qty\\s*:?|quantity\\s*:?)[ ]*(\\d[\\d,]*)/i);if(q)return Number(q[1].replace(/,/g,''));return 1}return null}\nfunction medicalCooldownMinutes(){const t=document.body.innerText||'';const m=t.match(/medical cooldown[^0-9]{0,25}(?:(\\d+)\\s*h)?\\s*(?:(\\d+)\\s*m)?/i);return m?(+m[1]||0)*60+(+m[2]||0):0}")
s=s.replace("function recoveryData(){const hp=visibleLife(),hosp=hospitalMinutes(),bonus=recoveryBonus(),missing=hp?Math.max(0,hp.max-hp.cur):0;", "function recoveryData(){const hp=visibleLife(),hosp=hospitalMinutes(),medCd=medicalCooldownMinutes(),bonus=recoveryBonus(),missing=hp?Math.max(0,hp.max-hp.cur):0;")
s=s.replace("items.sort((a,b)=>score(b)-score(a));return{hp,hosp,bonus,items}}", "items.sort((a,b)=>score(b)-score(a));return{hp,hosp,medCd,bonus,items}}")
s=s.replace("Hospital: <b>${Math.round(d.hosp)} min</b><br>Recovery bonus:", "Hospital: <b>${Math.round(d.hosp)} min</b><br>Medical cooldown: <b>${Math.round(d.medCd)} min</b><br>Recovery bonus:")
s=s.replace("${sw('noDrugs','No Drug Usage (exclude Opium)')}</div>", "${sw('noDrugs','No Drug Usage (exclude Opium)')}${sw('respectCooldown','Respect visible medical cooldown')}</div>")

# Prayer: stronger success detection and church click observer.
s=s.replace("function observePrayerSuccess(){const t=(document.body.innerText||'').toLowerCase();if(state['daily-prayer']&&/you (?:have )?prayed|prayer (?:was )?successful|already prayed today/.test(t))markPrayed()}", "function observePrayerSuccess(){if(!state['daily-prayer'])return;const t=(document.body.innerText||'').toLowerCase();if(/you (?:have )?prayed|prayer (?:was )?successful|already prayed today|you pray|you prayed/.test(t))markPrayed()}\ndocument.addEventListener('click',e=>{if(!state['daily-prayer'])return;const b=e.target.closest?.('button,a');if(!b)return;const t=((b.textContent||'')+' '+(b.getAttribute('title')||'')).toLowerCase();if(/\\bpray\\b/.test(t))setTimeout(observePrayerSuccess,900)},true);")

# Item intel: avoid ancestor duplicates by preferring leaf-like candidates.
s=s.replace("const seen=new WeakSet();\n for(const el of candidates){", "const seen=new WeakSet();\n for(const el of candidates){if(el.querySelector('.slx-item-tags'))continue;if([...el.children].some(c=>c.matches?.('li,tr,[class*=\"item\"],[data-item],[data-itemid],[data-item-id]')))continue;")

# OC suitability: actually use configured threshold in UI.
s=s.replace("pred.textContent=`EST ${avg.toFixed(0)}% ${status}`;", "pred.textContent=`EST ${avg.toFixed(0)}% ${avg>=cfg.threshold?'✓':'⚠'} ${status}`;")

# War W/L history capture from visible ranked-war text.
needle="const score=x=>x.res*10+x.h*2+x.a+x.ret*3+x.assist;"
rep="const resultText=(document.body.innerText||'').match(/ranked war[\\s\\S]{0,250}?(victory|won|defeat|lost)/i);d.history??=[];if(resultText){const outcome=/victory|won/i.test(resultText[1])?'W':'L',key=location.pathname+location.search+location.hash+'|'+outcome;if(!d.history.some(x=>x.key===key))d.history.unshift({key,outcome,at:Date.now()});d.history=d.history.slice(0,200)}\n const score=x=>x.res*10+x.h*2+x.a+x.ret*3+x.assist;"
s=s.replace(needle,rep,1)
s=s.replace("risk flags: <b>${rows.filter(x=>x.risk).length}</b> · reports: <b>${d.reports.length}</b>", "risk flags: <b>${rows.filter(x=>x.risk).length}</b> · reports: <b>${d.reports.length}</b> · W/L: <b>${(d.history||[]).filter(x=>x.outcome==='W').length}/${(d.history||[]).filter(x=>x.outcome==='L').length}</b>")

# Company: employee-local notes/wages table summary.
s=s.replace("const t=document.body.innerText||'',emps=[...document.querySelectorAll('tr,li,[class*=\"employee\"]')].filter(e=>/wage|position|employee|train|effectiveness/i.test(e.innerText||'')),", "const t=document.body.innerText||'',emps=[...document.querySelectorAll('tr,li,[class*=\"employee\"]')].filter(e=>/wage|position|employee|train|effectiveness/i.test(e.innerText||'')),employeeRows=emps.map(e=>{const tx=(e.innerText||'').replace(/\\s+/g,' '),a=e.querySelector('a[href*=\"profiles.php\"],a[href*=\"XID=\"]');return{name:(a?.textContent||tx.split(' ')[0]||'Employee').trim(),wage:+((tx.match(/(?:wage|salary)[^$]{0,12}\\$([\\d,]+)/i)||[])[1]||'0').replace(/,/g,''),text:tx}}),")
s=s.replace("<button id=\"slx-co-history\">HISTORY</button> <button id=\"slx-co-backup\">BACKUP</button>", "<button id=\"slx-co-history\">HISTORY</button> <button id=\"slx-co-emps\">EMPLOYEES</button> <button id=\"slx-co-backup\">BACKUP</button>")
s=s.replace("document.getElementById('slx-co-history')?.addEventListener('click',()=>alert(`Snapshots:", "document.getElementById('slx-co-emps')?.addEventListener('click',()=>prompt('Visible employees:',employeeRows.slice(0,50).map(x=>`${x.name} — $${x.wage.toLocaleString()}`).join('\\n')));document.getElementById('slx-co-history')?.addEventListener('click',()=>alert(`Snapshots:")

# Odds: only tag lowest relevant container and retain collapsed panels.
s=s.replace("if(e.querySelector('.slx-odds-hint'))continue;", "if(e.querySelector('.slx-odds-hint')||e.parentElement?.closest('.slx-odds-hint'))continue;")

# Racing: include race signature with URL and normalized names to improve duplicate protection.
s=s.replace("const key=rows.map(x=>x.p+':'+x.n).join('|');", "const key=(location.pathname+location.search+location.hash)+'|'+rows.map(x=>x.p+':'+x.n.toLowerCase()).join('|');")

# Diagnostics and route-aware application. Avoid repeated expensive whole-page scans when route/text hasn't changed.
insert="""
function openDiagnostics(){
 const checks=[];
 const add=(name,ok,detail='')=>checks.push({name,ok,detail});
 add('Suite launcher',!!(document.getElementById(IDS.native)||document.getElementById(IDS.fallback)));
 add('Reminder dock',!!document.getElementById(IDS.dock));
 add('Shared API key',!!apiKey,'optional');
 add('Prayer detection',typeof observePrayerSuccess==='function');
 add('Recovery life parser',!!visibleLife()||true,visibleLife()?'Life detected':'Life not visible on this page');
 add('Chain parser',!!chainText()||true,chainText()?'Chain detected':'Chain not visible on this page');
 add('Faction rows',factionRows().length>0||!/faction/i.test(location.href),`${factionRows().length} rows`);
 add('Module settings',MODULES.filter(m=>m.kind==='internal').every(m=>m.settings));
 const html=checks.map(x=>`${x.ok?'✅':'❌'} <b>${esc(x.name)}</b>${x.detail?' — '+esc(x.detail):''}`).join('<br>');
 toggleFloat('slx-suite-diagnostics','Suite Diagnostics',html);
}
let lastRoute='';let lastHeavy=0;
function applyModules(force=false){
 const route=location.pathname+location.search+location.hash,routeChanged=route!==lastRoute;lastRoute=route;
 syncReminderIcons();chainAlarm();observePrayerSuccess();
 const now=Date.now();if(!force&&!routeChanged&&now-lastHeavy<1200)return;lastHeavy=now;
 itemSignals();eventLens();factionPulse();armoryRadar();travelMap();ocRoleMatch();ocReadiness();warPerformance();companyConsole();oddsScout();raceLeague();
}
"""
a=s.index('function applyModules(){')
b=s.index('function health(){',a)
s=s[:a]+insert+s[b:]
s=s.replace("function scheduleScan(){clearTimeout(scanTimer);scanTimer=setTimeout(applyModules,450)}", "function scheduleScan(){clearTimeout(scanTimer);scanTimer=setTimeout(()=>applyModules(false),500)}")
s=s.replace("setTimeout(()=>{nativeLauncher();applyModules()},300)", "setTimeout(()=>{nativeLauncher();applyModules(true)},300)")
s=s.replace("setTimeout(applyModules,300)", "setTimeout(()=>applyModules(true),300)")

# Docs update.
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md')
t=d.read_text(encoding='utf-8')
t=t.replace('**v0.7.0**','**v0.8.0**',1)
notes='''\n### v0.8.0 — final documented-parity hardening\n- Added `@updateURL` and `@downloadURL` for direct raw-GitHub update support in compatible userscript managers.\n- Added Suite Diagnostics and route-aware scan throttling for Torn PDA/mobile performance.\n- Prayer completion detection hardened so the reminder hides only after success text is detected.\n- Recovery Planner now reads visible medical cooldown and can use the saved faction-armory snapshot as an item source.\n- Item Signals avoids nested ancestor duplication and keeps item-ID + name-based detection.\n- Armory Loan Radar now fully cleans its styling when rescanned/disabled.\n- OC Role Match visibly applies the configured suitability threshold.\n- War Performance now keeps a local visible ranked-war W/L history in addition to reports/AAR/risk view.\n- Company Console adds a visible employee/wage report alongside stock, pricing, training and tax history.\n- Odds Scout nested-market duplicate protection and Race League duplicate signatures were hardened.\n- Export/import now includes all internal module settings while still excluding the Torn API key.\n'''
marker='## Current release notes\n'
if notes.strip() not in t:t=t.replace(marker,marker+notes+'\n',1)
d.write_text(t,encoding='utf-8')
