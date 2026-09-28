from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.947$',r'\g<1>0.9.948',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.947')

MARK='/* SAKALUX_SUITE_0948_MODULE_CONTROLS_FIX */'
if MARK not in s:
    addon=r'''

/* SAKALUX_SUITE_0948_MODULE_CONTROLS_FIX */
(() => {
'use strict';
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
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const all=(q,r=document)=>[...r.querySelectorAll(q)];
function suiteRoot(){return all('div,section,aside').filter(x=>/SakaLuX Suite/i.test(txt(x))&&/Enable Ready Modules/i.test(txt(x))).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}
function cardFor(root,name){
 const leaves=all('*',root).filter(e=>e.children.length===0&&txt(e)===name);
 for(const leaf of leaves){let c=leaf;for(let i=0;c&&i<8;i++,c=c.parentElement){if(c.querySelector('button')&&c.querySelector('input[type=checkbox],[role=switch]')&&/Settings/i.test(txt(c)))return c;}}
 return null;
}
function nativeState(id,globalName){
 const bridge=document.getElementById('sakalux-module-bridge-'+id);
 const version=String(document.documentElement?.getAttribute('data-sakalux-installed-'+id)||document.body?.getAttribute('data-sakalux-installed-'+id)||bridge?.dataset?.version||'').trim();
 const api=window[globalName];
 const reg=window.__SakaLuXDockRuntimeModules instanceof Map?window.__SakaLuXDockRuntimeModules.get(id):null;
 const installed=Boolean(version||bridge||api||reg);
 let on=null;
 if(bridge?.dataset?.enabled==='true'||bridge?.dataset?.enabled==='false')on=bridge.dataset.enabled==='true';
 else try{if(api&&typeof api.isEnabled==='function')on=Boolean(api.isEnabled());else if(reg&&typeof reg.enabled==='function')on=reg.enabled()!==false;}catch{}
 return {installed,on,bridge,api,reg,version};
}
function bridgeAction(st,action){
 if(st.bridge){st.bridge.dataset.action=action;st.bridge.click();return true;}
 try{
   if(action==='open')for(const k of ['openSettings','open','openSettingsPanel','openApiSettings'])if(typeof st.api?.[k]==='function'){st.api[k]();return true;}
   if((action==='on'||action==='off')&&typeof st.api?.setEnabled==='function'){st.api.setEnabled(action==='on');return true;}
   if((action==='on'||action==='off')&&typeof st.reg?.setEnabled==='function'){st.reg.setEnabled(action==='on');return true;}
 }catch{}
 return false;
}
function titleLeaf(card,name){return all('*',card).filter(e=>e.children.length===0&&txt(e)===name)[0]||null;}
function statusLeaf(card){return all('*',card).filter(e=>e.children.length===0&&/^(?:READY(?:\s*·\s*ON)?|NOT READY|NOT INSTALLED|INSTALLED(?:\s*·\s*(?:OFF|UNKNOWN))?)$/i.test(txt(e)))[0]||null;}
function ensureStatus(card,name){
 let st=statusLeaf(card);if(st)return st;
 const title=titleLeaf(card,name);if(!title)return null;
 st=document.createElement('span');st.dataset.slx0948Status='1';st.style.cssText='display:inline-block;margin-left:8px;border:1px solid currentColor;border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;vertical-align:middle';title.insertAdjacentElement('afterend',st);return st;
}
function warningLeaf(card){return all('*',card).find(e=>e.children.length===0&&/Requires the standalone SakaLuX script/i.test(txt(e)))||null;}
function settingsBtn(card){return all('button',card).find(b=>/^Settings$/i.test(txt(b)))||null;}
function inputSwitch(card){return card.querySelector('input[type=checkbox]');}
function roleSwitch(card){return card.querySelector('[role=switch]');}
function bindCard(card,id,name,globalName){
 const st=nativeState(id,globalName), badge=ensureStatus(card,name), warn=warningLeaf(card), btn=settingsBtn(card), input=inputSwitch(card), role=roleSwitch(card);
 const label=!st.installed?'NOT INSTALLED':st.on===true?'READY · ON':st.on===false?'INSTALLED · OFF':'INSTALLED · UNKNOWN';
 if(badge){badge.textContent=label;badge.style.display='';badge.style.color=!st.installed?'#ef9a62':st.on===true?'#72d6a0':st.on===false?'#e0b56d':'#9fb0c2';}
 all('*',card).filter(e=>e!==badge&&e.children.length===0&&/^NOT READY$/i.test(txt(e))).forEach(e=>e.style.display='none');
 card.querySelectorAll('.slx-hub-not-ready').forEach(e=>e.remove());
 if(warn)warn.style.display=st.installed?'none':'';
 if(btn){
   btn.disabled=!st.installed;
   if(btn.dataset.slx0948Bound!=='1'){
     btn.dataset.slx0948Bound='1';
     btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const cur=nativeState(id,globalName);if(cur.installed)bridgeAction(cur,'open');},true);
   }
 }
 if(input){
   input.disabled=!st.installed; if(st.on!==null)input.checked=st.on===true; else if(!st.installed)input.checked=false;
   if(input.dataset.slx0948Bound!=='1'){
     input.dataset.slx0948Bound='1';
     input.addEventListener('change',e=>{e.stopImmediatePropagation();const cur=nativeState(id,globalName);if(!cur.installed){input.checked=false;return;}bridgeAction(cur,input.checked?'on':'off');setTimeout(refresh,120);},true);
   }
 }
 if(role&&!input){
   role.setAttribute('aria-disabled',st.installed?'false':'true');if(st.on!==null)role.setAttribute('aria-checked',st.on?'true':'false');
   if(role.dataset.slx0948Bound!=='1'){
     role.dataset.slx0948Bound='1';
     role.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const cur=nativeState(id,globalName);if(!cur.installed)return;bridgeAction(cur,cur.on===true?'off':'on');setTimeout(refresh,120);},true);
   }
 }
 if(card.dataset.slx0948CardBound!=='1'){
   card.dataset.slx0948CardBound='1';
   card.addEventListener('click',e=>{if(e.target.closest('button,input,label,[role=switch]'))return;e.stopImmediatePropagation();},true);
 }
}
function refresh(){const root=suiteRoot();if(!root)return;for(const [id,name,g] of MODULES){const card=cardFor(root,name);if(card)bindCard(card,id,name,g);}}
window.addEventListener('SakaLuX:ModuleReady',()=>setTimeout(refresh,30),{passive:true});
window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(refresh,30),{passive:true});
window.addEventListener('storage',()=>setTimeout(refresh,30),{passive:true});
new MutationObserver(()=>{clearTimeout(window.__slx0948t);window.__slx0948t=setTimeout(refresh,80);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['data-enabled','aria-checked']});
setInterval(refresh,750);setTimeout(refresh,50);
})();
'''
    s=s.rstrip()+addon+'\n'

p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.947**','**v0.9.948**',1).replace('Canonical version: **v0.9.947**','Canonical version: **v0.9.948**',1)
entry='''\n### v0.9.948 — Native bridge module controls\n- Uses each standalone module hidden `sakalux-module-bridge-*` as the authoritative control/status channel.\n- Installed detection now reads the canonical installed-version attribute value instead of incorrectly expecting `1`.\n- Settings sends the bridge `open` action; ON/OFF sends explicit `on` / `off` actions, so controls no longer only change Suite-local state.\n- Module cards no longer toggle when tapping the title/description/background.\n- Status badges now reflect the live bridge state: `NOT INSTALLED`, `INSTALLED · OFF`, `READY · ON`, or `INSTALLED · UNKNOWN`.\n- Suppresses stale legacy `READY` / `NOT READY` decorations without changing the compact Suite card layout.\n'''
if '### v0.9.948' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

t=Path('tests/suite-0948-module-controls-regression.cjs')
t.write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.948$/m);assert.ok(s.includes('SAKALUX_SUITE_0948_MODULE_CONTROLS_FIX'));assert.ok(s.includes("document.getElementById('sakalux-module-bridge-'+id)"));assert.ok(s.includes("bridge.dataset.action=action;bridge.click()"));assert.ok(s.includes("input.checked?'on':'off'"));assert.ok(s.includes("action==='open'"));assert.ok(s.includes("String(document.documentElement?.getAttribute('data-sakalux-installed-'+id)"));for(const x of ['NOT INSTALLED','INSTALLED · OFF','READY · ON','INSTALLED · UNKNOWN'])assert.ok(s.includes(x),x);assert.ok(s.includes("if(e.target.closest('button,input,label,[role=switch]'))return;e.stopImmediatePropagation()"));console.log('suite 0.9.948 module controls regression: OK');''',encoding='utf-8')
print('patched Suite to 0.9.948')
