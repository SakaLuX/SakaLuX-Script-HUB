from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
# bump from rollback base 0.9.943 only
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.943$',r'\g<1>0.9.947',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.943 rollback base')

MARK='/* SAKALUX_SUITE_0947_STABLE_UI_PATCH */'
if MARK not in s:
    addon=r'''

/* SAKALUX_SUITE_0947_STABLE_UI_PATCH */
(() => {
'use strict';
const VERSION='0.9.947';
const MODULES=[
 ['enhancer','Enhancer Guard','SakaLuXEnhancerGuard'],
 ['bazaar','Bazaar Thanker','SakaLuXBazaarThanker'],
 ['bazaar-smart-pricer','Bazaar Smart Pricer','SakaLuXBazaarSmartPricer'],
 ['mission-rewards','Mission Rewards','SakaLuXMissionRewards'],
 ['market-intelligence','Market Intelligence','SakaLuXMarketIntelligence'],
 ['elimination-assistant','Elimination Assistant','SakaLuXEliminationAssistant'],
 ['company-intelligence','Company Intelligence','SakaLuXCompanyIntelligence'],
 ['chat-intelligence','Chat Intelligence','SakaLuXChatIntelligence'],
 ['stock-manager-advisor','Stock Manager & Advisor','SakaLuXStockManagerAdvisor'],
 ['account-auditor','Account Auditor','SakaLuXAccountAuditor']
];
const HINT={
 'East Side':{rep:'red',cash:'purple'},'West Side':{rep:'blue',cash:'green'},'North Side':{rep:'orange',cash:'green'},
 'Residential':{rep:'blue',cash:'white'},'Red-Light':{rep:'pink',cash:'green'},'Financial':{rep:'red',cash:'black'},'City Center':{rep:'blue',cash:'green'}
};
const TIERS=[25,50,100,250,500];
const MODE_KEY='SakaLuX_SUITE_GRAFFITI_MODE';
const ENABLE_KEY='SakaLuX_SUITE_GRAFFITI_ENABLED';
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const all=(q,r=document)=>[...r.querySelectorAll(q)];
function panel(){return all('div,section,aside').filter(x=>/SakaLuX Suite/i.test(txt(x))&&/Enable Ready Modules/i.test(txt(x))).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}
function liveState(id,globalName){
 const api=window[globalName];
 const bridge=document.getElementById('sakalux-module-bridge-'+id);
 const mark=document.documentElement?.getAttribute('data-sakalux-installed-'+id)==='1'||document.body?.getAttribute('data-sakalux-installed-'+id)==='1';
 const reg=window.__SakaLuXDockRuntimeModules instanceof Map?window.__SakaLuXDockRuntimeModules.get(id):null;
 const installed=Boolean(api||bridge||mark||reg);
 let on=null;
 try{if(api&&typeof api.isEnabled==='function')on=Boolean(api.isEnabled());else if(reg&&typeof reg.enabled==='function')on=reg.enabled()!==false;else if(bridge?.dataset?.enabled!=null)on=bridge.dataset.enabled==='true';}catch{on=null;}
 return {installed,on,api,bridge,reg};
}
function setLive(st,want){
 try{if(st.api&&typeof st.api.setEnabled==='function'){st.api.setEnabled(Boolean(want));return true;}if(st.reg&&typeof st.reg.setEnabled==='function'){st.reg.setEnabled(Boolean(want));return true;}if(st.bridge){const cur=st.bridge.dataset?.enabled==='true';if(cur!==Boolean(want))st.bridge.click();return true;}}catch{}
 return false;
}
function openLive(st){
 for(const k of ['openSettings','open','openSettingsPanel','openApiSettings'])try{if(typeof st.api?.[k]==='function'){st.api[k]();return true;}}catch{}
 try{if(st.bridge){st.bridge.click();return true;}}catch{}
 return false;
}
function findCard(root,name){
 const exact=all('*',root).filter(e=>txt(e)===name);
 for(const e of exact){let c=e;for(let i=0;c&&i<7;i++,c=c.parentElement){const t=txt(c);if(/Settings/i.test(t)&&(/Requires the standalone SakaLuX script/i.test(t)||c.querySelector('input[type=checkbox],[role=switch]')))return c;}}
 return null;
}
function templateCard(root){for(const [,name] of MODULES){const c=findCard(root,name);if(c)return c;}return null;}
function titleNode(card){return all('*',card).filter(e=>MODULES.some(m=>txt(e)===m[1])).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}
function warningNode(card){return all('*',card).filter(e=>/Requires the standalone SakaLuX script/i.test(txt(e))&&e.children.length===0)[0]||null;}
function statusNode(card){
 const nodes=all('*',card).filter(e=>e.children.length===0&&/^(READY|NOT READY|NOT INSTALLED|INSTALLED(?:\s*·\s*(?:OFF|UNKNOWN))?|READY\s*·\s*ON)$/i.test(txt(e)));
 return nodes[0]||null;
}
function settingsButton(card){return all('button',card).find(b=>/^Settings$/i.test(txt(b)))||null;}
function switchInput(card){return card.querySelector('input[type=checkbox]');}
function ensureMissingCard(root,mod){
 const [id,name]=mod;let card=findCard(root,name);if(card)return card;
 const tmpl=templateCard(root);if(!tmpl)return null;
 card=tmpl.cloneNode(true);card.dataset.slx0947Module=id;
 const oldTitle=titleNode(card);if(oldTitle)oldTitle.textContent=name;
 const desc=all('*',card).find(e=>e.children.length===0&&/Opens the installed standalone SakaLuX/i.test(txt(e)));if(desc)desc.textContent=`Opens the installed standalone SakaLuX ${name}.`;
 // strip copied status/warning values; refreshCard will restore the correct state.
 root.insertBefore(card,tmpl.nextSibling);return card;
}
function refreshCard(root,mod){
 const [id,name,globalName]=mod;const card=ensureMissingCard(root,mod);if(!card)return null;card.dataset.slx0947Module=id;
 const st=liveState(id,globalName), status=statusNode(card), warn=warningNode(card), btn=settingsButton(card), input=switchInput(card);
 const label=!st.installed?'NOT INSTALLED':st.on===true?'READY · ON':st.on===false?'INSTALLED · OFF':'INSTALLED · UNKNOWN';
 if(status){status.textContent=label;status.style.display='';}
 // Remove duplicate stale NOT READY decorations created by older bridge reconciliation.
 all('*',card).filter(e=>e!==status&&e.children.length===0&&/^NOT READY$/i.test(txt(e))).forEach(e=>e.style.display='none');
 card.querySelectorAll('.slx-hub-not-ready').forEach(e=>e.remove());
 if(warn)warn.style.display=st.installed?'none':'';
 if(btn){const clean=btn.cloneNode(true);btn.replaceWith(clean);clean.disabled=!st.installed;clean.onclick=e=>{e.preventDefault();e.stopPropagation();openLive(liveState(id,globalName));};}
 if(input){const clean=input.cloneNode(true);input.replaceWith(clean);clean.disabled=!st.installed;clean.checked=st.on===true;clean.onchange=e=>{e.stopPropagation();const cur=liveState(id,globalName);if(!cur.installed){clean.checked=false;return;}if(!setLive(cur,clean.checked))clean.checked=cur.on===true;setTimeout(()=>refreshAll(),80);};}
 return card;
}
function refreshAll(){
 const root=panel();if(!root)return;
 const cards=[];for(const mod of MODULES){const c=refreshCard(root,mod);if(c)cards.push(c);}
 // Preserve the original Suite card design; only reorder the existing/cloned cards canonically.
 if(cards.length>1){const parent=cards[0].parentElement;if(parent&&cards.every(c=>c.parentElement===parent)){for(const c of cards)parent.appendChild(c);}}
}
function graffitiPage(){const t=txt(document.body);return /\bGraffiti\b/i.test(t)&&/East Side/i.test(t)&&/West Side/i.test(t)&&/North Side/i.test(t);}
function mode(){const v=localStorage.getItem(MODE_KEY);return ['BOTH','REP','CASH'].includes(v)?v:'BOTH';}
function setMode(v){localStorage.setItem(MODE_KEY,v);renderGraffiti();}
function locationLeaves(){
 const names=Object.keys(HINT);return all('body *').filter(e=>e.children.length===0&&names.includes(txt(e)));
}
function rowForLeaf(el){let c=el;for(let i=0;c&&i<8;i++,c=c.parentElement){const t=txt(c);if(t.length<700&&(c.querySelector('img')||c.querySelector('button'))&&/\d+%/.test(t))return c;}return el.parentElement;}
function tagCount(row,name){const lines=(row?.innerText||row?.textContent||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);const i=lines.findIndex(x=>x===name);if(i>=0){const m=(lines[i+1]||'').match(/^\d+$/);if(m)return Number(m[0]);}const t=txt(row);const m=t.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s+(\\d{1,3})(?:\\s|$)','i'));return m?Number(m[1]):null;}
function nextTier(v){if(v==null)return null;const n=TIERS.find(x=>v<x);return n?{left:n-v,tier:n}:null;}
function ensureGraffitiCss(){if(document.getElementById('slx-graf-947-style'))return;const st=document.createElement('style');st.id='slx-graf-947-style';st.textContent='.slx-graf-947-badge{display:block;margin-top:2px;font:700 10px/1.25 Arial,sans-serif;color:#f0f4f8;white-space:normal}.slx-graf-947-rep{color:#ffd166}.slx-graf-947-cash{color:#79dda6}.slx-graf-947-strip{display:flex;align-items:center;gap:5px;overflow:auto;white-space:nowrap;margin:4px 0 6px;padding:5px 7px;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:rgba(15,20,26,.94);font:700 10px/1.25 Arial,sans-serif;color:#d8e0e8}.slx-graf-947-strip button{min-height:24px!important;padding:2px 6px!important;border-radius:5px!important}.slx-graf-947-strip b{color:#fff}';document.head.appendChild(st);}
function renderGraffiti(){
 document.querySelectorAll('.slx-graf-947-badge,#slx-graf-947-strip').forEach(e=>e.remove());
 if(localStorage.getItem(ENABLE_KEY)==='0'||!graffitiPage())return;ensureGraffitiCss();const m=mode(),seen=new Set(),rows=[];
 for(const leaf of locationLeaves()){const name=txt(leaf);const row=rowForLeaf(leaf);if(!row||seen.has(row))continue;seen.add(row);rows.push(row);const h=HINT[name],nt=nextTier(tagCount(row,name));const b=document.createElement('span');b.className='slx-graf-947-badge';const parts=[];if(m==='BOTH'||m==='REP')parts.push(`<span class="slx-graf-947-rep">⭐ REP ${h.rep}</span>`);if(m==='BOTH'||m==='CASH')parts.push(`<span class="slx-graf-947-cash">💰 CASH ${h.cash}</span>`);if(nt)parts.push(`<span>+${nt.left} → ${nt.tier}</span>`);b.innerHTML=parts.join(' · ');leaf.insertAdjacentElement('afterend',b);}
 if(rows.length){const first=rows[0],host=first.parentElement;if(host){const bar=document.createElement('div');bar.id='slx-graf-947-strip';bar.className='slx-graf-947-strip';bar.innerHTML=`<b>Graffiti Spray Guide</b><button data-m="BOTH">BOTH</button><button data-m="REP">REP</button><button data-m="CASH">CASH</button>`;bar.querySelectorAll('button').forEach(b=>{b.disabled=b.dataset.m===m;b.onclick=()=>setMode(b.dataset.m);});host.insertBefore(bar,first);}}
}
function tick(){refreshAll();renderGraffiti();}
window.addEventListener('SakaLuX:ModuleReady',()=>setTimeout(refreshAll,30),{passive:true});
window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(refreshAll,30),{passive:true});
window.addEventListener('hashchange',()=>setTimeout(renderGraffiti,80),{passive:true});
let q=0;new MutationObserver(()=>{if(q)return;q=setTimeout(()=>{q=0;tick();},260);}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(refreshAll,1500);setTimeout(tick,80);
window.SakaLuXSuiteStableUiPatch={version:VERSION,refresh:tick};
})();
'''
    s=s.rstrip()+addon+'\n'
p.write_text(s,encoding='utf-8')

# docs only; do not touch layout/source elsewhere
D=Path('greasyfork/SakaLuX-Suite.md');d=D.read_text(encoding='utf-8')
d=re.sub(r'(?m)^\*\*v0\.9\.943\*\*$', '**v0.9.947**', d, count=1)
d=re.sub(r'Canonical version: \*\*v0\.9\.943\*\*', 'Canonical version: **v0.9.947**', d, count=1)
entry='''\n### v0.9.947 — Stable UI: complete modules + truthful status + Graffiti\n- Keeps the original compact Suite card design from v0.9.943; no replacement card theme or oversized module layout.\n- Shows all 10 managed SakaLuX standalone modules, adding any missing card by cloning the native Suite card structure.\n- Live status is truthful: `NOT INSTALLED`, `INSTALLED · OFF`, `READY · ON`, or `INSTALLED · UNKNOWN`; duplicate stale `NOT READY` labels are suppressed.\n- Settings and switches are rebound to each standalone public API/bridge so Hub/Suite state follows the actual script state.\n- Replaces the broken Graffiti DOM detection with visible-zone detection for TornPDA and shows REP/CASH recommendations plus next reputation tier without changing the Torn card layout.\n'''
if '### v0.9.947' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
D.write_text(d,encoding='utf-8')

T=Path('tests/suite-0947-stable-ui-regression.cjs')
T.write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.947$/m);assert.ok(s.includes('SAKALUX_SUITE_0947_STABLE_UI_PATCH'));for(const id of ['enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence','elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'])assert.ok(s.includes(`['${id}'`),id);for(const x of ['NOT INSTALLED','INSTALLED · OFF','READY · ON','INSTALLED · UNKNOWN'])assert.ok(s.includes(x),x);assert.ok(s.includes('cloneNode(true)'),'native card clone required');assert.ok(!s.includes('slx-suite-canonical-module'),'oversized replacement card UI must not return');for(const n of ['East Side','West Side','North Side','Residential','Red-Light','Financial','City Center'])assert.ok(s.includes(`'${n}'`),n);assert.ok(s.includes('slx-graf-947-badge'));console.log('suite 0.9.947 stable UI regression: OK');''',encoding='utf-8')
print('Prepared Suite v0.9.947 stable UI patch')
