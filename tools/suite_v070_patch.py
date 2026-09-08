from pathlib import Path

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.6.0','// @version      0.7.0',1)
s=s.replace("const VERSION='0.6.0';","const VERSION='0.7.0';",1)

# Extra persistent stores and richer settings.
s=s.replace("const SLX_KEYS={chain:'SakaLuX_SUITE_CHAIN_CFG_V2',item:'SakaLuX_SUITE_ITEM_CFG_V2',events:'SakaLuX_SUITE_EVENT_CFG_V2',armory:'SakaLuX_SUITE_ARMORY_SCAN_V2',travel:'SakaLuX_SUITE_TRAVEL_OVERRIDES_V2',ocReq:'SakaLuX_SUITE_OC_REQUIREMENTS_V2',ocCfg:'SakaLuX_SUITE_OC_CFG_V2',war:'SakaLuX_SUITE_WAR_LEDGER_V2',company:'SakaLuX_SUITE_COMPANY_V2',race2:'SakaLuX_SUITE_RACE_LEAGUE_V2'};",
"const SLX_KEYS={chain:'SakaLuX_SUITE_CHAIN_CFG_V3',item:'SakaLuX_SUITE_ITEM_CFG_V3',events:'SakaLuX_SUITE_EVENT_CFG_V3',armory:'SakaLuX_SUITE_ARMORY_SCAN_V3',travel:'SakaLuX_SUITE_TRAVEL_OVERRIDES_V3',ocReq:'SakaLuX_SUITE_OC_REQUIREMENTS_V3',ocCfg:'SakaLuX_SUITE_OC_CFG_V3',war:'SakaLuX_SUITE_WAR_LEDGER_V3',company:'SakaLuX_SUITE_COMPANY_V3',race2:'SakaLuX_SUITE_RACE_LEAGUE_V3',odds:'SakaLuX_SUITE_ODDS_CFG_V3',pulse:'SakaLuX_SUITE_PULSE_CFG_V3'};")
s=s.replace("const EVENT_CFG_DEFAULTS={savedOnly:false};","const EVENT_CFG_DEFAULTS={savedOnly:false};\nconst ODDS_CFG_DEFAULTS={collapsed:false,research:true};\nconst PULSE_CFG_DEFAULTS={sort:'status',compact:false};")

# Independent factual mapping of known OC item IDs; no third-party code copied.
insert_after="const COUNTRY={mexico:'🇲🇽',canada:'🇨🇦',cayman:'🇰🇾',hawaii:'🇺🇸',uk:'🇬🇧','united kingdom':'🇬🇧',argentina:'🇦🇷',switzerland:'🇨🇭',japan:'🇯🇵',china:'🇨🇳',uae:'🇦🇪','united arab emirates':'🇦🇪',southafrica:'🇿🇦','south africa':'🇿🇦'};"
if 'const ITEM_ID_INTEL=' not in s:
    s=s.replace(insert_after, insert_after+"\nconst ITEM_ID_INTEL={1203:{tag:'OC',note:'Lockpicks · OC role item'},1217:{tag:'OC',note:'Shaving Foam · OC role item'},568:{tag:'OC',note:'Jemmy · OC role item'},1362:{tag:'OC',note:'Net · OC role item'},1361:{tag:'OC',note:'Dog Treats · OC role item'},1381:{tag:'OC',note:'ID Badge · OC role item'},1379:{tag:'OC',note:'ATM Key · OC role item'}};")

def replace_func(name,next_name,new):
    global s
    a=s.index('function '+name+'(')
    b=s.index('function '+next_name+'(',a)
    s=s[:a]+new.rstrip()+"\n"+s[b:]

replace_func('itemSignals','onEventsPage',r'''function itemSignals(){
 document.querySelectorAll('.slx-item-tags').forEach(x=>x.remove());
 if(!state['item-signals'])return;
 const cfg={...ITEM_CFG_DEFAULTS,...load(SLX_KEYS.item,{})},map={OC:'oc',ENERGY:'energy',NERVE:'nerve',HAPPY:'happy',HEAL:'heal',ENH:'enh'};
 const candidates=[...document.querySelectorAll('li,tr,[class*="item"],[data-item],[data-itemid],[data-item-id],a[href*="itemID="]')].filter(el=>!el.closest('#'+IDS.overlay)&&!el.closest('.slx-suite-float'));
 const seen=new WeakSet();
 for(const el of candidates){
  if(seen.has(el))continue;seen.add(el);
  const txt=(el.innerText||el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();
  if(txt.length<1||txt.length>300)continue;
  const idRaw=el.getAttribute('data-itemid')||el.getAttribute('data-item-id')||(el.getAttribute('href')||'').match(/itemID=(\d+)/i)?.[1]||el.querySelector('[data-itemid],[data-item-id],a[href*="itemID="]')?.getAttribute('data-itemid')||el.querySelector('[data-item-id]')?.getAttribute('data-item-id');
  const id=Number(idRaw||0),intel=ITEM_ID_INTEL[id];
  let matches=ITEM_RULES.filter(r=>cfg[map[r.tag]]&&r.names.some(n=>txt.toLowerCase().includes(n.toLowerCase())));
  if(intel&&cfg[map[intel.tag]]&&!matches.some(x=>x.tag===intel.tag))matches=[{tag:intel.tag,note:intel.note,names:[]},...matches];
  if(!matches.length)continue;
  const wrap=document.createElement('div');wrap.className='slx-item-tags';
  for(const r of matches){const b=document.createElement('span');b.className='slx-item-tag';b.textContent=r.tag;b.title=`${r.note}${id?` · Item #${id}`:''}`;wrap.appendChild(b)}
  el.appendChild(wrap);
 }
}
''')

replace_func('factionPulse','armoryRadar',r'''function factionPulse(){
 document.getElementById('slx-faction-pulse')?.remove();if(!state['faction-pulse']||!/faction/i.test(location.href))return;
 const cfg={...PULSE_CFG_DEFAULTS,...load(SLX_KEYS.pulse,{})},r=factionRows(),n=x=>r.filter(y=>y.status===x||y.act===x).length;if(!r.length)return;
 const order={Hospital:0,Travel:1,Jail:2,Okay:3},actOrder={Online:0,Idle:1,Unknown:2,Offline:3};
 const sorted=[...r].sort((a,b)=>cfg.sort==='name'?a.n.localeCompare(b.n):(order[a.status]-order[b.status]||actOrder[a.act]-actOrder[b.act]||a.n.localeCompare(b.n)));
 pagePanel('slx-faction-pulse','📡 Faction Pulse',`Members: <b>${r.length}</b> · online: <b>${n('Online')}</b> · idle: <b>${n('Idle')}</b> · hospital: <b>${n('Hospital')}</b> · traveling: <b>${n('Travel')}</b> · jail: <b>${n('Jail')}</b> · offline: <b>${n('Offline')}</b><br><button id="slx-pulse-sort">SORT ${cfg.sort==='name'?'STATUS':'NAME'}</button> <button id="slx-pulse-copy">COPY WATCHLIST</button>${cfg.compact?'':`<br>${sorted.filter(x=>x.status!=='Okay'||x.act==='Offline').slice(0,12).map(x=>`${esc(x.n)} [${x.status}/${x.act}]`).join(' · ')}`}`);
 document.getElementById('slx-pulse-sort')?.addEventListener('click',()=>{cfg.sort=cfg.sort==='name'?'status':'name';save(SLX_KEYS.pulse,cfg);factionPulse()});
 document.getElementById('slx-pulse-copy')?.addEventListener('click',()=>prompt('Faction Pulse watchlist:',sorted.filter(x=>x.status!=='Okay'||x.act==='Offline').map(x=>`${x.n}: ${x.status}/${x.act}`).join('\n')));
}
''')

replace_func('armoryRadar','travelMap',r'''function armoryRadar(){
 document.getElementById('slx-armory-radar')?.remove();document.querySelectorAll('[data-slx-loan]').forEach(x=>x.remove());document.querySelectorAll('.slx-armory-loaned,.slx-armory-available').forEach(x=>x.classList.remove('slx-armory-loaned','slx-armory-available'));
 if(!state['armory-loan-radar']||!/(armory|armoury|faction|profiles\.php)/i.test(location.href))return;
 const onArmory=/(armory|armoury)/i.test(location.href)||/\barmou?ry\b/i.test(document.body.innerText||'');
 if(onArmory){const rows=[];for(const e of document.querySelectorAll('li,tr,[class*="item"],[class*="weapon"],[class*="armor"]')){const t=(e.innerText||'').replace(/\s+/g,' ').trim();if(t.length>800||!/loaned|borrowed|available|returned|holder/i.test(t))continue;const h=(t.match(/(?:loaned to|borrowed by|holder)\s*:?\s*([A-Za-z0-9_\-\[\] ]{2,35})/i)||[])[1]?.trim()||'';const item=(e.querySelector('[class*="name"],a')?.textContent||t.split(/loaned|borrowed|available/i)[0]).trim().slice(0,90);rows.push({item,t,h});e.classList.add(h?'slx-armory-loaned':'slx-armory-available');e.style.outline=h?'1px solid #b44':'1px solid #285';if(h){const b=document.createElement('button');b.dataset.slxLoan='1';b.className='slx-badge-mini';b.textContent='LOAN';b.onclick=()=>alert(`${item}\nHolder: ${h}\n\n${t}`);e.appendChild(b)}}if(rows.length){save(SLX_KEYS.armory,{at:Date.now(),url:location.href,rows});pagePanel('slx-armory-radar','🎒 Armory Loan Radar',`Scanned: <b>${rows.length}</b> · loaned: <b>${rows.filter(x=>x.h).length}</b> · available: <b>${rows.filter(x=>!x.h).length}</b> · snapshot saved. <button id="slx-armory-rescan">SCAN</button>`);document.getElementById('slx-armory-rescan')?.addEventListener('click',armoryRadar)}}
 const snap=load(SLX_KEYS.armory,null);if(!snap?.rows?.length)return;
 for(const r of factionRows()){const mine=snap.rows.filter(x=>x.h&&x.h.toLowerCase().includes(r.n.toLowerCase()));if(!mine.length)continue;const b=document.createElement('button');b.dataset.slxLoan='1';b.className='slx-badge-mini';b.textContent=`🎒 ${mine.length}`;b.title='Armory loans';b.onclick=e=>{e.preventDefault();e.stopPropagation();alert(`${r.n} — loaned items\n\n`+mine.map(x=>x.item).join('\n'))};r.a.after(b)}
}
''')

replace_func('travelMap','ocRoleMatch',r'''function travelMap(){
 document.querySelectorAll('.slx-country-tag').forEach(x=>x.remove());document.getElementById('slx-travel-summary')?.remove();if(!state['member-travel-map']||!/faction|profiles\.php/i.test(location.href))return;
 const ov=load(SLX_KEYS.travel,{}),rows=factionRows(),counts={};
 for(const r of rows){const id=(r.a.href.match(/XID=(\d+)/)||[])[1]||r.n;let c=ov[id]||Object.keys(COUNTRY).find(x=>r.t.toLowerCase().includes(x));if(!c)continue;counts[c]=(counts[c]||0)+1;const tag=document.createElement('span');tag.className='slx-country-tag';tag.textContent=' '+(COUNTRY[c]||'🌐');tag.title='Country: '+c+' — tap to edit';tag.dataset.country=c;tag.onclick=e=>{e.preventDefault();e.stopPropagation();const v=prompt('Country override (blank = automatic):',c);if(v===null)return;if(v.trim())ov[id]=v.trim().toLowerCase();else delete ov[id];save(SLX_KEYS.travel,ov);travelMap()};r.a.after(tag)}
 if(Object.keys(counts).length){pagePanel('slx-travel-summary','🌍 Member Travel Map',Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`<button data-country="${esc(c)}">${COUNTRY[c]||'🌐'} ${esc(c)} <b>${n}</b></button>`).join(' ')+'<br><button id="slx-travel-all">SHOW ALL</button> <button id="slx-travel-wipe">WIPE OVERRIDES</button>');const panel=document.getElementById('slx-travel-summary');panel?.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{const c=b.dataset.country;rows.forEach(r=>{const tag=r.a.parentElement?.querySelector(`.slx-country-tag[data-country="${CSS.escape(c)}"]`);r.e.style.display=tag?'':'none'})});document.getElementById('slx-travel-all')?.addEventListener('click',()=>rows.forEach(r=>r.e.style.display=''));document.getElementById('slx-travel-wipe')?.addEventListener('click',()=>{if(confirm('Clear all country overrides?')){localStorage.removeItem(SLX_KEYS.travel);travelMap()}})}
}
''')

replace_func('ocReadiness','warPerformance',r'''function ocReadiness(){
 document.getElementById('slx-oc-ready')?.remove();document.querySelectorAll('.slx-oc-loan-role').forEach(x=>x.remove());if(!state['oc-readiness']||!/(organizedcrimes|crime|faction)/i.test(location.href))return;
 const cfg={...OC_CFG_DEFAULTS,...load(SLX_KEYS.ocCfg,{})},t=document.body.innerText||'',no=/not (?:currently )?in an organized crime|not in an oc|join an organized crime/i.test(t),matches=[...t.matchAll(/(?:missing|required item|vacant role|not ready)[^\n]{0,140}/gi)].map(x=>x[0].trim()),req=[...t.matchAll(/(?:requires?|required)\s*:?\s*([A-Za-z0-9 '&\-]{3,55})/gi)].map(x=>x[1].trim());
 if(req.length)save(SLX_KEYS.ocReq,{at:Date.now(),url:location.href,requirements:[...new Set(req)].slice(0,150)});
 const scan=load(SLX_KEYS.ocReq,{requirements:[]}),loan=load(SLX_KEYS.armory,{rows:[]});let loanHits=0;
 for(const e of document.querySelectorAll('li,tr,[class*="crime"],[class*="role"]')){const txt=(e.innerText||'').replace(/\s+/g,' ');if(txt.length>1200)continue;const role=(txt.match(/role\s*:?\s*([A-Za-z][A-Za-z \-]{2,35})/i)||[])[1];const mem=(txt.match(/([A-Za-z0-9_\-]{2,30})\s*\[\d+\]/)||[])[1];if(!role||!mem)continue;const held=(loan.rows||[]).filter(x=>x.h&&x.h.toLowerCase().includes(mem.toLowerCase()));if(held.length){const b=document.createElement('span');b.className='slx-oc-loan-role slx-badge-mini';b.textContent=`🎒 ${held.length} loan`;b.title=held.map(x=>x.item||x.t).join('\n');e.appendChild(b);loanHits++}}
 if(no||matches.length||req.length||scan.requirements?.length)pagePanel('slx-oc-ready','✅ OC Readiness',`${no?'⚠ <b>Not in an active OC.</b><br>':''}${matches.length?`Warnings: <b>${matches.length}</b><br>${matches.slice(0,cfg.scope==='all'?12:6).map(esc).join('<br>')}`:'No visible missing-role/item warning.'}${scan.requirements?.length?`<br>Captured requirements: ${scan.requirements.slice(0,10).map(esc).join(' · ')}`:''}<br>Loan-role matches: <b>${loanHits}</b> · scope: <b>${cfg.scope}</b>`)
}
''')

replace_func('warPerformance','companyConsole',r'''function warPerformance(){
 document.getElementById('slx-war-performance')?.remove();if(!state['war-performance']||!/faction/i.test(location.href))return;
 const fr=factionRows(),rows=fr.map(x=>{const q=x.t.match(/respect[^0-9]{0,14}([\d,.]+)/i),h=x.t.match(/hits?[^0-9]{0,14}(\d+)/i),a=x.t.match(/attacks?[^0-9]{0,14}(\d+)/i),ret=x.t.match(/retaliations?[^0-9]{0,14}(\d+)/i),assist=x.t.match(/assists?[^0-9]{0,14}(\d+)/i);return{n:x.n,res:q?+q[1].replace(/,/g,''):0,h:h?+h[1]:0,a:a?+a[1]:0,ret:ret?+ret[1]:0,assist:assist?+assist[1]:0,risk:x.status!=='Okay'||x.act==='Offline',status:x.status,act:x.act}}).filter(x=>x.res||x.h||x.a||x.ret||x.assist),d=load(SLX_KEYS.war,{reports:[],hidden:[],search:'',sort:'score'});if(!rows.length)return;
 const score=x=>x.res*10+x.h*2+x.a+x.ret*3+x.assist;const ranked=[...rows].sort((a,b)=>d.sort==='name'?a.n.localeCompare(b.n):d.sort==='risk'?(Number(b.risk)-Number(a.risk)||score(b)-score(a)):score(b)-score(a));const sig=rows.map(x=>`${x.n}:${x.res}:${x.h}:${x.a}:${x.ret}:${x.assist}`).join('|');if(d.reports[0]?.sig!==sig)d.reports=[{sig,at:Date.now(),url:location.href,rows},...(d.reports||[])].slice(0,100);save(SLX_KEYS.war,d);
 const visible=ranked.filter(x=>!d.hidden.includes(x.n)&&(!d.search||x.n.toLowerCase().includes(d.search.toLowerCase())));pagePanel('slx-war-performance','⚔️ War Performance',`<button id="slx-war-wide">WIDE</button> <button id="slx-war-risk">RISK</button> <button id="slx-war-search">SEARCH</button> <button id="slx-war-aar">AAR</button> <button id="slx-war-backup">BACKUP</button><br>Tracked: <b>${rows.length}</b> · MVP: <b>${esc(ranked[0].n)}</b> · risk flags: <b>${rows.filter(x=>x.risk).length}</b> · reports: <b>${d.reports.length}</b><br>${visible.slice(0,30).map((x,i)=>`${i+1}. <button data-war-member="${esc(encodeURIComponent(x.n))}">${esc(x.n)}</button> — ${x.res}R / ${x.h}H / ${x.a}A / ${x.ret}Ret / ${x.assist}Asst${x.risk?' ⚠':''}`).join('<br>')}`);
 const panel=document.getElementById('slx-war-performance');document.getElementById('slx-war-wide')?.addEventListener('click',()=>panel?.classList.toggle('slx-war-wide'));document.getElementById('slx-war-risk')?.addEventListener('click',()=>{d.sort=d.sort==='risk'?'score':'risk';save(SLX_KEYS.war,d);warPerformance()});document.getElementById('slx-war-search')?.addEventListener('click',()=>{d.search=prompt('Member search:',d.search||'')||'';save(SLX_KEYS.war,d);warPerformance()});document.getElementById('slx-war-aar')?.addEventListener('click',()=>{const top=ranked.slice(0,5);prompt('After Action Report',`War report ${new Date().toLocaleString()}\nMembers: ${rows.length}\nRisk flags: ${rows.filter(x=>x.risk).length}\nTop: ${top.map(x=>x.n+' '+x.res+'R/'+x.h+'H').join(', ')}`)});document.getElementById('slx-war-backup')?.addEventListener('click',()=>prompt('War Ledger backup:',JSON.stringify(d)));panel?.querySelectorAll('[data-war-member]').forEach(b=>b.onclick=()=>{const n=decodeURIComponent(b.dataset.warMember),x=rows.find(y=>y.n===n);if(confirm(`${n}\n${x.res} respect · ${x.h} hits · ${x.a} attacks\n${x.status}/${x.act}\n\nHide this member from ledger?`)){if(!d.hidden.includes(n))d.hidden.push(n);save(SLX_KEYS.war,d);warPerformance()}})
}
''')

replace_func('companyConsole','oddsScout',r'''function companyConsole(){
 document.getElementById('slx-company-console')?.remove();if(!state['company-console']||!/company/i.test(location.href))return;
 const t=document.body.innerText||'',emps=[...document.querySelectorAll('tr,li,[class*="employee"]')].filter(e=>/wage|position|employee|train|effectiveness/i.test(e.innerText||'')),wages=[...t.matchAll(/(?:wage|salary)[^$]{0,20}\$([\d,]+)/gi)].map(m=>+m[1].replace(/,/g,'')),income=(t.match(/(?:income|revenue|profit)[^$]{0,30}\$([\d,]+)/i)||[])[1],stock=(t.match(/stock[^0-9$]{0,20}([\d,]+)/i)||[])[1],tr=(t.match(/trains?[^0-9]{0,20}(\d+)/i)||[])[1],tax=(t.match(/tax[^$]{0,25}\$([\d,]+)/i)||[])[1],d=load(SLX_KEYS.company,{snapshots:[],training:[],tax:[],prices:[]}),snap={at:Date.now(),employees:emps.length,wages:wages.reduce((a,b)=>a+b,0),income:income?+income.replace(/,/g,''):null,stock:stock?+stock.replace(/,/g,''):null,trains:+tr||null,tax:tax?+tax.replace(/,/g,''):null};if(!d.snapshots[0]||Date.now()-d.snapshots[0].at>300000)d.snapshots=[snap,...d.snapshots].slice(0,250);save(SLX_KEYS.company,d);
 pagePanel('slx-company-console','🏢 Company Console',`Employees: <b>${emps.length}</b> · wages: <b>$${snap.wages.toLocaleString()}</b> · income: <b>${snap.income!=null?'$'+snap.income.toLocaleString():'—'}</b> · stock: <b>${snap.stock??'—'}</b> · trains: <b>${snap.trains??'—'}</b> · tax: <b>${snap.tax!=null?'$'+snap.tax.toLocaleString():'—'}</b><br><button id="slx-co-price">PRICE</button> <button id="slx-co-train">TRAIN</button> <button id="slx-co-tax">TAX</button> <button id="slx-co-history">HISTORY</button> <button id="slx-co-backup">BACKUP</button> · snapshots ${d.snapshots.length}`);
 document.getElementById('slx-co-price')?.addEventListener('click',()=>{const c=+prompt('Cost per item')||0,m=+prompt('Markup %','10')||0,v=Math.round(c*(1+m/100));if(v){d.prices.unshift({at:Date.now(),cost:c,markup:m,price:v});d.prices=d.prices.slice(0,200);save(SLX_KEYS.company,d)}alert('Suggested price: $'+v.toLocaleString())});document.getElementById('slx-co-train')?.addEventListener('click',()=>{const n=prompt('Training note / employee:');if(n){d.training.unshift({at:Date.now(),note:n});d.training=d.training.slice(0,500);save(SLX_KEYS.company,d)}});document.getElementById('slx-co-tax')?.addEventListener('click',()=>{const v=+prompt('Tax amount')||0;if(v){d.tax.unshift({at:Date.now(),amount:v});d.tax=d.tax.slice(0,500);save(SLX_KEYS.company,d)}});document.getElementById('slx-co-history')?.addEventListener('click',()=>alert(`Snapshots: ${d.snapshots.length}\nTraining logs: ${d.training.length}\nTax logs: ${d.tax.length}\nPrice records: ${d.prices.length}`));document.getElementById('slx-co-backup')?.addEventListener('click',()=>prompt('Company Console backup:',JSON.stringify(d)))
}
''')

replace_func('oddsScout','raceLeague',r'''function oddsScout(){
 document.querySelectorAll('.slx-odds-hint').forEach(x=>x.remove());document.getElementById('slx-odds-summary')?.remove();if(!state['odds-scout']||!/(casino|bookie|sports)/i.test(location.href))return;
 const cfg={...ODDS_CFG_DEFAULTS,...load(SLX_KEYS.odds,{})},markets=[],seen=new Set();for(const e of document.querySelectorAll('tr,li,[class*="bet"],[class*="market"],[class*="event"],[class*="sport"]')){const t=(e.innerText||'').trim().replace(/\s+/g,' ');if(t.length>1200||t.length<8)continue;const key=t.slice(0,180);if(seen.has(key))continue;seen.add(key);const o=[...t.matchAll(/(?:^|\s)([1-9]\d*(?:\.\d{1,3})?)(?=\s|$)/g)].map(m=>+m[1]).filter(x=>x>=1.01&&x<=1000);if(o.length<2||o.length>8)continue;const sum=o.reduce((a,x)=>a+100/x,0),margin=sum-100;if(e.querySelector('.slx-odds-hint'))continue;const tag=document.createElement('span');tag.className='slx-odds-hint slx-badge-mini';tag.textContent=`M ${margin.toFixed(1)}%`;tag.title='Implied: '+o.map(x=>(100/x).toFixed(1)+'%').join(' / ');e.appendChild(tag);markets.push({t,o,margin})}
 if(markets.length){const best=[...markets].sort((a,b)=>a.margin-b.margin)[0],sport=/football|soccer/i.test(best.t)?'football':/basketball|nba/i.test(best.t)?'basketball':/tennis/i.test(best.t)?'tennis':/baseball|mlb/i.test(best.t)?'baseball':'sports';pagePanel('slx-odds-summary','🎲 Odds Scout',`<button id="slx-odds-collapse">${cfg.collapsed?'EXPAND':'HIDE'}</button> ${cfg.collapsed?'':`Markets: <b>${markets.length}</b> · lowest margin: <b>${best.margin.toFixed(1)}%</b> · sport: <b>${sport}</b><br>${markets.sort((a,b)=>a.margin-b.margin).slice(0,8).map(x=>`${x.margin.toFixed(1)}% — ${esc(x.t.slice(0,90))}`).join('<br>')}<br><button id="slx-odds-research">RESEARCH EVENT</button>`}`);document.getElementById('slx-odds-collapse')?.addEventListener('click',()=>{cfg.collapsed=!cfg.collapsed;save(SLX_KEYS.odds,cfg);oddsScout()});document.getElementById('slx-odds-research')?.addEventListener('click',()=>{const q=encodeURIComponent(`${sport} ${best.t.slice(0,120)}`);window.open('https://www.google.com/search?q='+q,'_blank')})}
}
''')

# Replace race function with logs/stats/delete championship/import backup.
a=s.index('function raceLeague(){');b=s.index('function openModuleSettings',a)
race=r'''function raceLeague(){
 document.getElementById('slx-race-league')?.remove();if(!state['race-league-board']||!/race/i.test(location.href))return;
 const rows=[],seen=new Set();for(const e of document.querySelectorAll('tr,li,[class*="result"]')){const t=(e.innerText||'').trim().replace(/\s+/g,' '),m=t.match(/(?:^|\s)(\d{1,2})(?:st|nd|rd|th)?[.)\s-]+([A-Za-z0-9_\-\[\] ]{2,40})/i);if(m&&+m[1]<=30&&!seen.has(m[1]+'|'+m[2])){seen.add(m[1]+'|'+m[2]);rows.push({p:+m[1],n:m[2].trim()})}}
 const d=load(SLX_KEYS.race2,{active:'Default',champs:{Default:{races:[],drivers:{}}}});d.champs??={Default:{races:[],drivers:{}}};d.active=d.active&&d.champs[d.active]?d.active:Object.keys(d.champs)[0]||'Default';d.champs[d.active]??={races:[],drivers:{}};const c=d.champs[d.active];if(rows.length>=2){const pts=[25,18,15,12,10,8,6,4,2,1],key=rows.map(x=>x.p+':'+x.n).join('|');if(!c.races.some(x=>x.key===key)){c.races.unshift({key,at:Date.now(),url:location.href,rows});for(const x of rows){c.drivers[x.n]??={pts:0,w:0,podiums:0,r:0,best:99};c.drivers[x.n].pts+=pts[x.p-1]||0;c.drivers[x.n].r++;c.drivers[x.n].best=Math.min(c.drivers[x.n].best,x.p);if(x.p===1)c.drivers[x.n].w++;if(x.p<=3)c.drivers[x.n].podiums++}c.races=c.races.slice(0,500);save(SLX_KEYS.race2,d)}}
 const z=Object.entries(c.drivers).sort((a,b)=>b[1].pts-a[1].pts).slice(0,25);if(!z.length&&!rows.length)return;pagePanel('slx-race-league','🏁 Race League Board',`Championship: <b>${esc(d.active)}</b> · races: <b>${c.races.length}</b><br><button id="slx-race-new">NEW</button> <button id="slx-race-switch">SWITCH</button> <button id="slx-race-log">RACE LOG</button> <button id="slx-race-stats">STATS</button> <button id="slx-race-backup">BACKUP/IMPORT</button> <button id="slx-race-del">DELETE</button><br>${z.map(([n,v],i)=>`${i+1}. <button data-driver="${esc(encodeURIComponent(n))}">${esc(n)}</button> <b>${v.pts} pts</b> · ${v.w}W · ${v.podiums}P · best P${v.best<99?v.best:'—'} · ${v.r} races`).join('<br>')}`);
 document.getElementById('slx-race-new')?.addEventListener('click',()=>{const n=prompt('New championship name:');if(n?.trim()){d.champs[n.trim()]={races:[],drivers:{}};d.active=n.trim();save(SLX_KEYS.race2,d);raceLeague()}});document.getElementById('slx-race-switch')?.addEventListener('click',()=>{const n=prompt('Championship:\n'+Object.keys(d.champs).join('\n'),d.active);if(n&&d.champs[n]){d.active=n;save(SLX_KEYS.race2,d);raceLeague()}});document.getElementById('slx-race-log')?.addEventListener('click',()=>alert(c.races.slice(0,20).map((r,i)=>`${i+1}. ${new Date(r.at).toLocaleString()} — ${r.rows.slice(0,3).map(x=>'P'+x.p+' '+x.n).join(', ')}`).join('\n\n')||'No races saved.'));document.getElementById('slx-race-stats')?.addEventListener('click',()=>alert(`Drivers: ${Object.keys(c.drivers).length}\nRaces: ${c.races.length}\nWins recorded: ${Object.values(c.drivers).reduce((a,x)=>a+x.w,0)}\nPodiums: ${Object.values(c.drivers).reduce((a,x)=>a+x.podiums,0)}`));document.getElementById('slx-race-backup')?.addEventListener('click',()=>{const raw=prompt('Backup JSON. Paste replacement JSON to import:',JSON.stringify(d));if(raw&&raw!==JSON.stringify(d)){try{const x=JSON.parse(raw);if(!x.champs)throw 0;save(SLX_KEYS.race2,x);raceLeague()}catch{alert('Invalid race backup.')}}});document.getElementById('slx-race-del')?.addEventListener('click',()=>{if(Object.keys(d.champs).length<=1)return alert('Keep at least one championship.');if(confirm('Delete championship '+d.active+'?')){delete d.champs[d.active];d.active=Object.keys(d.champs)[0];save(SLX_KEYS.race2,d);raceLeague()}});document.querySelectorAll('[data-driver]').forEach(btn=>btn.onclick=()=>{const n=decodeURIComponent(btn.dataset.driver),v=c.drivers[n],races=c.races.filter(r=>r.rows.some(x=>x.n===n)).slice(0,10);alert(`${n}\nPoints: ${v.pts}\nWins: ${v.w}\nPodiums: ${v.podiums}\nBest: P${v.best<99?v.best:'—'}\nRaces: ${v.r}\n\nRecent:\n${races.map(r=>new Date(r.at).toLocaleDateString()+' P'+r.rows.find(x=>x.n===n).p).join('\n')}`)})
}

'''
s=s[:a]+race+s[b:]

# CSS for full-screen command view and loan states.
s=s.replace("@media(min-width:700px){#${IDS.overlay}",".slx-war-wide{position:fixed!important;inset:8px!important;z-index:2147483646!important;overflow:auto!important;margin:0!important}.slx-armory-loaned{outline:1px solid #b44!important}.slx-armory-available{outline:1px solid #285!important}\n@media(min-width:700px){#${IDS.overlay}")

# Settings improvements.
s=s.replace("if(id==='odds-scout'){alert('Odds Scout is advisory only. It never places bets. It calculates implied probabilities and visible market margin.');return}","if(id==='odds-scout'){const c={...ODDS_CFG_DEFAULTS,...load(SLX_KEYS.odds,{})};c.research=confirm('Enable research links?');save(SLX_KEYS.odds,c);oddsScout();return}")
s=s.replace("if(id==='faction-pulse'){alert('Faction Pulse scans visible member rows for online/idle/offline, hospital, travel, abroad and jail signals.');return}","if(id==='faction-pulse'){const c={...PULSE_CFG_DEFAULTS,...load(SLX_KEYS.pulse,{})};c.compact=confirm('Compact summary only?');save(SLX_KEYS.pulse,c);factionPulse();return}")

# Update GreasyFork info.
g=Path('greasyfork/SakaLuX-Suite.md')
if g.exists():
    md=g.read_text(encoding='utf-8')
    md=md.replace('**v0.6.0**','**v0.7.0**',1)
    md += "\n\n### v0.7.0 — parity hardening\n- Item Signals now prefers stable item IDs when available and keeps text fallback.\n- Armory Loan Radar adds member/profile loan buttons from the saved armory snapshot.\n- Member Travel Map adds country filtering, show-all and wipe controls.\n- OC Readiness cross-references stored armory loans and captured OC requirements.\n- War Performance adds wide command view, search, risk sort, member hiding, AAR summary and backup.\n- Company Console adds stock signal, history, pricing records and larger training/tax logs.\n- Odds Scout adds collapsed state, market de-duplication and sport-aware research.\n- Race League Board adds race logs, stats, driver recent history, delete championship and backup/import.\n- Faction Pulse adds sorting and watchlist export.\n"
    g.write_text(md,encoding='utf-8')

p.write_text(s,encoding='utf-8')
