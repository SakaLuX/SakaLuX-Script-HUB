from pathlib import Path
import re

suite_path=Path('SakaLuX-Suite.user.js')
doc_path=Path('greasyfork/SakaLuX-Suite.md')
test_path=Path('tests/suite-graffiti-hub-sync-regression.cjs')
s=suite_path.read_text(encoding='utf-8')

# Canonical Suite release version.
s,n=re.subn(r'(?m)^(//\s*@version\s+)[^\r\n]+',r'\g<1>0.9.941',s,count=1)
if n!=1: raise SystemExit('Suite @version not found exactly once')

MARK='/* SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC */'
if MARK not in s:
    addon=r'''

/* SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC */
(() => {
'use strict';
const VERSION='0.9.941';
const GID='graffiti-spray-guide';
const ENABLE_KEY='SakaLuX_SUITE_GRAFFITI_ENABLED';
const MODE_KEY='SakaLuX_SUITE_GRAFFITI_MODE';
const TIERS=[25,50,100,250,500];
const HINT={
 'East Side':{cash:'purple',rep:'red'},
 'West Side':{cash:'green',rep:'blue'},
 'North Side':{cash:'green',rep:'orange'},
 'Residential':{cash:'white',rep:'blue'},
 'Red-Light':{cash:'green',rep:'pink'},
 'Financial':{cash:'black',rep:'red'},
 'City Center':{cash:'green',rep:'blue'}
};
const IMG=[[/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],[/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],[/CentreCity|CityCentre|CityCenter/i,'City Center']];
const TITLE=[[/east/i,'East Side'],[/west/i,'West Side'],[/north/i,'North Side'],[/residential/i,'Residential'],[/red[-\s]?light/i,'Red-Light'],[/financial/i,'Financial'],[/city\s*cent/i,'City Center']];
const STANDALONE=[
 ['account-auditor','Account Auditor'],['bazaar-smart-pricer','Bazaar Smart Pricer'],['bazaar-thanker','Bazaar Thanker'],['chat-intelligence','Chat Intelligence'],['company-intelligence','Company Intelligence'],['elimination-assistant','Elimination Assistant'],['enhancer-guard','Enhancer Guard'],['market-intelligence','Market Intelligence'],['mission-rewards','Mission Rewards'],['stock-manager-advisor','Stock Manager']
];
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const enabled=()=>localStorage.getItem(ENABLE_KEY)!=='0';
const mode=()=>['BOTH','REP','CASH'].includes(localStorage.getItem(MODE_KEY))?localStorage.getItem(MODE_KEY):'BOTH';
const setMode=v=>{localStorage.setItem(MODE_KEY,v);render();};
const isGraffiti=()=>/graffiti/i.test(location.href+' '+txt(document.querySelector('h1,h2,[class*=title]')));
function locationName(card){
 const im=card.querySelector('img'); const src=im?.src||im?.getAttribute('src')||'';
 for(const [rx,n] of IMG) if(rx.test(src)) return n;
 const t=txt(card); for(const [rx,n] of TITLE) if(rx.test(t)) return n; return null;
}
function tagCount(card){
 const t=txt(card); const m=t.match(/(?:tags?|reputation|rep)\D{0,12}(\d{1,4})/i)||t.match(/(\d{1,4})\s*(?:tags?)/i); return m?Number(m[1]):null;
}
function nextTier(v){ if(v==null)return null; const t=TIERS.find(x=>v<x); return t?{tier:t,left:t-v}:null; }
function pageNumber(rx){const m=txt(document.body).match(rx);return m?Number(String(m[1]).replace(/,/g,'')):null;}
function colourStock(col){
 const body=txt(document.body); const rx=new RegExp(col+'[^\\n]{0,55}?(\\d{1,3})%','i'); const p=body.match(rx);
 const count=body.match(new RegExp(col+'[^\\n]{0,55}?(?:x|qty|quantity|stock)\\s*[:x]?\\s*(\\d+)','i'));
 return {percent:p?Number(p[1]):null,count:count?Number(count[1]):null};
}
function ensureStyle(){if($('#slx-graffiti-style'))return;const e=document.createElement('style');e.id='slx-graffiti-style';e.textContent=`
.slx-graffiti-strip{display:flex;gap:6px;align-items:center;overflow:auto;white-space:nowrap;margin:4px 0;padding:6px 8px;border:1px solid #39414a;border-radius:7px;background:#151a20;color:#aeb8c3;font:11px/1.3 Arial,sans-serif}.slx-graffiti-strip b{color:#eef3f8}.slx-graffiti-mode{border:1px solid #4b5968;border-radius:5px;background:#202833;color:#e6edf3;padding:2px 6px;font-weight:800}.slx-graffiti-alert{color:#ffb45c!important}.slx-graffiti-badge{display:inline-flex;gap:4px;margin-left:5px;padding:1px 4px;border-radius:4px;background:#19232d;color:#dce7ef;font:10px/1.25 Arial,sans-serif}.slx-graffiti-rep{color:#ffcf66}.slx-graffiti-cash{color:#72d6a0}.slx-hub-not-ready{margin-left:6px;color:#ef9a62;font-size:10px;font-weight:800}`;(document.head||document.documentElement).appendChild(e);}
function cards(){return $$('img').map(i=>i.closest('li,article,[class*=card],[class*=item],div')).filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i&&locationName(v));}
function decorateCard(card){
 const loc=locationName(card); if(!loc)return; let host=card.querySelector('h3,h4,[class*=title],[class*=name]')||card;
 let b=card.querySelector('.slx-graffiti-badge');if(!b){b=document.createElement('span');b.className='slx-graffiti-badge';host.appendChild(b);} const h=HINT[loc],m=mode();
 const nt=nextTier(tagCount(card)); const parts=[]; if(nt)parts.push(`+${nt.left} → ${nt.tier}`);
 if(m==='BOTH'||m==='REP')parts.push(`⭐ REP ${h.rep}`); if(m==='BOTH'||m==='CASH')parts.push(`💰 CASH ${h.cash}`);
 b.innerHTML=parts.map(x=>`<span class="${x.includes('REP')?'slx-graffiti-rep':x.includes('CASH')?'slx-graffiti-cash':''}">${x}</span>`).join(' ');
 b.title='Read-only suggestion; no clicks or automation.';
}
function objective(cs){if(cs==null)return '—';if(cs<70)return `CS70 (${70-cs})`;if(cs<100)return `CS100 (${100-cs})`;return 'unlock / uniques';}
function ensureStrip(){
 let root=cards()[0]?.parentElement;if(!root)return;let bar=$('#slx-graffiti-strip');if(!bar){bar=document.createElement('div');bar.id='slx-graffiti-strip';bar.className='slx-graffiti-strip';root.parentElement?.insertBefore(bar,root);} const cs=pageNumber(/(?:crime\s*skill|skill)\D{0,10}(\d{1,3})/i), nerve=pageNumber(/nerve\D{0,10}(\d{1,3})/i), uniques=txt(document.body).match(/unique(?:\s*outcomes?)?\D{0,10}(\d+)\s*\/\s*(\d+)/i); const mask=/paint\s*mask/i.test(txt(document.body));
 const alerts=[]; Object.values(HINT).flatMap(x=>[x.rep,x.cash]).filter((v,i,a)=>a.indexOf(v)===i).forEach(c=>{const st=colourStock(c);if(st.percent!=null&&st.percent<=15)alerts.push(`${c} ${st.percent}%`);if(st.count===0)alerts.push(`${c}: no spare`);});
 bar.innerHTML=`<b>Graffiti Spray Guide</b><button class="slx-graffiti-mode" data-m="BOTH">BOTH</button><button class="slx-graffiti-mode" data-m="REP">REP</button><button class="slx-graffiti-mode" data-m="CASH">CASH</button><span>CS <b>${cs??'?'}</b></span><span>Mask <b>${mask?'YES':'NO'}</b></span><span>Nerve <b>${nerve??'?'}</b></span><span>Attempts <b>${nerve!=null?Math.floor(nerve/3):'?'}</b></span><span>Unique <b>${uniques?uniques[1]+'/'+uniques[2]:'?'}</b></span><span>Next <b>${objective(cs)}</b></span>${alerts.length?`<span class="slx-graffiti-alert">⚠ ${alerts.join(' · ')}</span>`:''}`;
 bar.querySelectorAll('[data-m]').forEach(x=>{x.disabled=x.dataset.m===mode();x.onclick=()=>setMode(x.dataset.m);});
}
function removeGraffiti(){document.querySelectorAll('.slx-graffiti-badge,#slx-graffiti-strip').forEach(x=>x.remove());}
function render(){ensureStyle();if(!enabled()||!isGraffiti()){removeGraffiti();return;}cards().forEach(decorateCard);ensureStrip();injectMasterControl();syncHubState();}
function injectMasterControl(){
 const all=$$('div,section,aside'); const panel=all.find(x=>/master control/i.test(txt(x))&&/crimes/i.test(txt(x))&&x.querySelectorAll('*').length<1500); if(!panel||panel.querySelector('[data-slx-graffiti-control]'))return;
 const crimes=[...panel.querySelectorAll('*')].find(x=>/^crimes$/i.test(txt(x)));const row=document.createElement('div');row.dataset.slxGraffitiControl='1';row.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 9px;margin:4px 0;border:1px solid rgba(255,255,255,.08);border-radius:7px';row.innerHTML=`<span>🎨 Graffiti Spray Guide</span><label><input type="checkbox" ${enabled()?'checked':''}> ON</label>`;row.querySelector('input').onchange=e=>{localStorage.setItem(ENABLE_KEY,e.target.checked?'1':'0');render();};(crimes?.parentElement||panel).appendChild(row);
}
function masterPanel(){return $$('div,section,aside').find(x=>/master control/i.test(txt(x))&&x.querySelectorAll('*').length<1800)||null;}
function rowFor(panel,name){const candidates=$$('label,li,[class*=row],[class*=module],div',panel);return candidates.find(x=>new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(txt(x))&&x.querySelector('input[type=checkbox],button,[role=switch]'));}
function switchState(row,want){const c=row?.querySelector('input[type=checkbox]');if(c){if(c.checked!==want){c.checked=want;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}return;}const b=row?.querySelector('[role=switch],button');if(!b)return;const on=b.getAttribute('aria-checked')==='true'||/\bon\b/i.test(txt(b));if(on!==want)b.click();}
function badgeState(row,text){let b=row.querySelector('.slx-hub-not-ready');if(!b){b=document.createElement('span');b.className='slx-hub-not-ready';row.appendChild(b);}b.textContent=text||'';b.hidden=!text;}
function syncHubState(){
 const panel=masterPanel();if(!panel)return;const map=window.__SakaLuXDockRuntimeModules instanceof Map?window.__SakaLuXDockRuntimeModules:new Map();
 for(const [id,name] of STANDALONE){const row=rowFor(panel,name);if(!row)continue;const entry=map.get(id);if(!entry){badgeState(row,'NOT READY');switchState(row,false);const c=row.querySelector('input[type=checkbox]');if(c)c.disabled=true;continue;}const c=row.querySelector('input[type=checkbox]');if(c)c.disabled=false;let on=true;try{on=entry.enabled?.()!==false;}catch{on=false;}badgeState(row,'');switchState(row,on);}
}
window.SakaLuXGraffitiSprayGuide={id:GID,version:VERSION,isEnabled:enabled,setEnabled(v){localStorage.setItem(ENABLE_KEY,v?'1':'0');render();},render};
window.addEventListener('SakaLuX:ModuleReady',()=>setTimeout(syncHubState,40),{passive:true});window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(syncHubState,40),{passive:true});window.addEventListener('storage',()=>setTimeout(syncHubState,40),{passive:true});
let q=0;new MutationObserver(()=>{if(q)return;q=setTimeout(()=>{q=0;render();},180)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(syncHubState,1500);setTimeout(render,40);
})();
'''
    s=s.rstrip()+addon+'\n'

suite_path.write_text(s,encoding='utf-8')

doc=doc_path.read_text(encoding='utf-8')
doc=re.sub(r'(?m)^\*\*v0\.9\.940\*\*$', '**v0.9.941**', doc)
doc=re.sub(r'(?m)^- Canonical version: \*\*v0\.9\.940\*\*$', '- Canonical version: **v0.9.941**', doc)
release='''\n### v0.9.941 — Graffiti Spray Guide + Hub state authority\n- Adds **Graffiti Spray Guide** under `Master Control → Crimes`, using the TornPDA/mobile-friendly helper behaviour as the primary presentation and adding progress, goals, stock and warning intelligence from the advanced helper.\n- Shows REP and CASH spray suggestions together by default, with persistent BOTH / REP / CASH modes and all seven graffiti zones.\n- Adds next reputation tier progress (25/50/100/250/500), Crime Skill, Paint Mask, nerve/attempt estimate, unique outcomes, next CS objective, stock checks, <=15% spray warnings and no-spare warnings.\n- Remains read-only: no Torn API calls and no gameplay autoclicks.\n- Makes Script Hub the authority for Suite-backed standalone modules: Hub OFF forces Suite OFF; missing standalones are shown as **NOT READY** in Master Control.\n- Listens for `SakaLuX:ModuleReady` / Hub-ready signals and continuously reconciles module health without page reloads.\n'''
if '### v0.9.941' not in doc:
    pos=doc.find('\n## ')
    doc=(doc[:pos]+release+doc[pos:]) if pos>0 else doc+release
doc_path.write_text(doc,encoding='utf-8')

test_path.write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.941$/m);assert.match(s,/SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC/);for(const n of ['East Side','West Side','North Side','Residential','Red-Light','Financial','City Center'])assert.ok(s.includes(`'${n}'`),n);for(const x of ['BOTH','REP','CASH','NOT READY','SakaLuX:ModuleReady','__SakaLuXDockRuntimeModules'])assert.ok(s.includes(x),x);assert.match(s,/TIERS=\[25,50,100,250,500\]/);assert.ok(!/SakaLuXGraffitiSprayGuide[\s\S]{0,5000}(?:fetch\(|GM_xmlhttpRequest|\.click\(\))/m.test(s),'graffiti module must not automate gameplay');console.log('suite graffiti + hub sync regression: OK');''',encoding='utf-8')
print('Suite v0.9.941 patch applied')
