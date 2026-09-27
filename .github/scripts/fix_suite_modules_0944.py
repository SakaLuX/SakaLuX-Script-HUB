from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.943$',r'\g<1>0.9.944',s,count=1)
if n!=1: raise SystemExit('Suite version marker missing')
s=s.replace("const VERSION='0.9.943';","const VERSION='0.9.944';",1)
MARK='/* SAKALUX_SUITE_0944_AUTHORITATIVE_MODULES */'
if MARK not in s:
    addon=r'''

/* SAKALUX_SUITE_0944_AUTHORITATIVE_MODULES */
(() => {
'use strict';
const MODULES=[
 {id:'enhancer',name:'Enhancer Guard',api:'SakaLuXEnhancerGuard'},
 {id:'bazaar',name:'Bazaar Thanker',api:'SakaLuXBazaarThanker'},
 {id:'bazaar-smart-pricer',name:'Bazaar Smart Pricer',api:'SakaLuXBazaarSmartPricer'},
 {id:'mission-rewards',name:'Mission Rewards',api:'SakaLuXMissionRewards'},
 {id:'market-intelligence',name:'Market Intelligence',api:'SakaLuXMarketIntelligence'},
 {id:'elimination-assistant',name:'Elimination Assistant',api:'SakaLuXEliminationAssistant'},
 {id:'company-intelligence',name:'Company Intelligence',api:'SakaLuXCompanyIntelligence'},
 {id:'chat-intelligence',name:'Chat Intelligence',api:'SakaLuXChatIntelligence'},
 {id:'stock-manager-advisor',name:'Stock Manager & Advisor',api:'SakaLuXStockManagerAdvisor'},
 {id:'account-auditor',name:'Account Auditor',api:'SakaLuXAccountAuditor'}
];
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
function panel(){return qa('div,section,aside').find(x=>/MASTER CONTROL/i.test(text(x))&&/SakaLuX Suite/i.test(text(x))&&x.querySelectorAll('*').length>20)||null;}
function liveState(m){
 const api=window[m.api]; const bridge=document.getElementById('sakalux-module-bridge-'+m.id); const map=window.__SakaLuXDockRuntimeModules; const rt=map instanceof Map?map.get(m.id):null;
 const installed=Boolean(api||bridge||rt); let enabled=null;
 try{if(api&&typeof api.isEnabled==='function') enabled=Boolean(api.isEnabled()); else if(bridge?.dataset?.enabled!=null) enabled=bridge.dataset.enabled==='true'; else if(rt&&typeof rt.enabled==='function') enabled=Boolean(rt.enabled());}catch{enabled=null;}
 return {installed,enabled,api,bridge,rt};
}
async function setModule(m,on){const st=liveState(m);if(!st.installed)return false;try{if(st.api&&typeof st.api.setEnabled==='function'){await st.api.setEnabled(Boolean(on));return true;}if(st.rt&&typeof st.rt.setEnabled==='function'){await st.rt.setEnabled(Boolean(on));return true;}if(st.bridge){st.bridge.dataset.requestedEnabled=String(Boolean(on));st.bridge.dispatchEvent(new CustomEvent('SakaLuX:SetEnabled',{bubbles:true,detail:{id:m.id,enabled:Boolean(on)}}));return true;}}catch{}return false;}
function legacyCard(title,p){
 const nodes=qa('h2,h3,h4,strong,b,span,div',p).filter(x=>x.closest('#slx-suite-authoritative-modules')==null&&text(x)===title);
 for(const node of nodes){let x=node;for(let i=0;i<7&&x&&x!==p;i++,x=x.parentElement){const t=text(x);if(t.length<1400&&(/Requires the standalone SakaLuX script/i.test(t)||x.querySelector('input[type=checkbox],[role=switch]')))return x;}}
 return null;
}
function hideLegacy(p){for(const m of MODULES){const c=legacyCard(m.name,p);if(c)c.style.display='none';}for(const label of ['Stock Manager','Stock Manager & Advisor']){const c=legacyCard(label,p);if(c)c.style.display='none';}}
function style(){if(q('#slx-suite-auth-style'))return;const s=document.createElement('style');s.id='slx-suite-auth-style';s.textContent=`#slx-suite-authoritative-modules{margin:12px 16px 18px}#slx-suite-authoritative-modules .slx-am-title{font-size:13px;letter-spacing:.16em;color:#d6b36a;margin:8px 2px 10px;font-weight:800}#slx-suite-authoritative-modules .slx-am-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;align-items:center;padding:13px 14px;margin:8px 0;border:1px solid rgba(130,160,190,.16);border-radius:14px;background:rgba(17,28,40,.96)}#slx-suite-authoritative-modules .slx-am-name{font-size:16px;color:#edf3f8}#slx-suite-authoritative-modules .slx-am-status{font-size:11px;font-weight:800;letter-spacing:.04em;margin-top:5px}#slx-suite-authoritative-modules .ready{color:#77d9a4}#slx-suite-authoritative-modules .off{color:#e5bd65}#slx-suite-authoritative-modules .missing{color:#f07d91}#slx-suite-authoritative-modules .unknown{color:#b6c2ce}#slx-suite-authoritative-modules .slx-am-switch{width:58px;height:32px;border-radius:18px;border:1px solid #58687b;background:#425064;position:relative;padding:0;min-height:32px}#slx-suite-authoritative-modules .slx-am-switch:after{content:'';position:absolute;top:4px;left:5px;width:22px;height:22px;border-radius:50%;background:#dce5ec;transition:.15s}#slx-suite-authoritative-modules .slx-am-switch.on{background:#8b6d20;border-color:#bc9633}#slx-suite-authoritative-modules .slx-am-switch.on:after{left:29px;background:#ffe06b}#slx-suite-authoritative-modules .slx-am-switch:disabled{opacity:.42}`;(document.head||document.documentElement).appendChild(s);}
function mount(){const p=panel();if(!p)return;style();hideLegacy(p);let root=q('#slx-suite-authoritative-modules',p);if(!root){root=document.createElement('section');root.id='slx-suite-authoritative-modules';root.innerHTML='<div class="slx-am-title">SAKALUX MODULES</div><div class="slx-am-list"></div>';const first=MODULES.map(m=>legacyCard(m.name,p)).find(Boolean);if(first?.parentElement)first.parentElement.insertBefore(root,first);else p.appendChild(root);}render(root);}
function render(root=q('#slx-suite-authoritative-modules')){if(!root)return;const list=q('.slx-am-list',root);for(const m of MODULES){let card=q(`[data-slx-module="${m.id}"]`,list);if(!card){card=document.createElement('div');card.className='slx-am-card';card.dataset.slxModule=m.id;card.innerHTML=`<div><div class="slx-am-name"></div><div class="slx-am-status"></div></div><button class="slx-am-switch" type="button" role="switch"></button>`;q('.slx-am-name',card).textContent=m.name;list.appendChild(card);q('.slx-am-switch',card).onclick=async()=>{const st=liveState(m);if(!st.installed||st.enabled===null)return;await setModule(m,!st.enabled);setTimeout(()=>render(root),80);};}const st=liveState(m),status=q('.slx-am-status',card),sw=q('.slx-am-switch',card);let label,cls;if(!st.installed){label='NOT INSTALLED';cls='missing';}else if(st.enabled===true){label='READY · ON';cls='ready';}else if(st.enabled===false){label='INSTALLED · OFF';cls='off';}else{label='INSTALLED · UNKNOWN';cls='unknown';}status.textContent=label;status.className='slx-am-status '+cls;sw.disabled=!st.installed||st.enabled===null;sw.classList.toggle('on',st.enabled===true);sw.setAttribute('aria-checked',st.enabled===true?'true':'false');sw.title=label;}}
window.SakaLuXSuiteModules={version:'0.9.944',modules:MODULES,state:id=>{const m=MODULES.find(x=>x.id===id);return m?liveState(m):null;},refresh:mount};
window.addEventListener('SakaLuX:ModuleReady',()=>setTimeout(mount,20),{passive:true});window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(mount,20),{passive:true});window.addEventListener('SakaLuX:SetEnabled',()=>setTimeout(mount,50),{passive:true});
new MutationObserver(()=>{clearTimeout(window.__slx944t);window.__slx944t=setTimeout(mount,120)}).observe(document.documentElement,{childList:true,subtree:true});setInterval(mount,1200);setTimeout(mount,50);
})();
'''
    s=s.rstrip()+addon+'\n'
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md');t=d.read_text(encoding='utf-8')
t=t.replace('**v0.9.943**','**v0.9.944**',1).replace('Canonical version: **v0.9.943**','Canonical version: **v0.9.944**',1)
needle='## Release history / Changelog'
note='''**v0.9.944 — Complete SakaLuX Modules registry + authoritative status**\n- Shows all 10 managed standalone modules in canonical order, including Bazaar Smart Pricer.\n- Replaces legacy READY labels with live status from each standalone API/bridge/runtime: NOT INSTALLED, INSTALLED · OFF, READY · ON, or INSTALLED · UNKNOWN.\n- Never treats persistent installed markers or old buttons as proof that a script is installed.\n- Keeps missing-module switches disabled and mirrors live ON/OFF state.\n\n'''
if note not in t:t=t.replace(needle,note+needle,1)
d.write_text(t,encoding='utf-8')

Path('tests/suite-modules-0944-regression.cjs').write_text(r'''const fs=require('node:fs'),a=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');a.match(s,/^\/\/\s*@version\s+0\.9\.944$/m);for(const n of ['Enhancer Guard','Bazaar Thanker','Bazaar Smart Pricer','Mission Rewards','Market Intelligence','Elimination Assistant','Company Intelligence','Chat Intelligence','Stock Manager & Advisor','Account Auditor'])a.ok(s.includes(`name:'${n}'`),n);for(const x of ['NOT INSTALLED','INSTALLED · OFF','READY · ON','INSTALLED · UNKNOWN'])a.ok(s.includes(x),x);a.ok(s.includes('window[m.api]'),'live API authority');a.ok(s.includes("document.getElementById('sakalux-module-bridge-'+m.id)"),'live bridge authority');a.ok(!/data-sakalux-installed/.test(s.slice(s.indexOf('SAKALUX_SUITE_0944_AUTHORITATIVE_MODULES'))),'must not use persistent installed markers');console.log('suite modules 0.9.944 regression: OK');''',encoding='utf-8')
print('Suite 0.9.944 module registry/status patch applied')
