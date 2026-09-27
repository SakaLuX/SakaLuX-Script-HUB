from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
# bump version
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.943$',r'\g<1>0.9.944',s,count=1)
if n!=1: raise SystemExit('version marker missing')
s=s.replace("const VERSION='0.9.943';","const VERSION='0.9.944';",1)
# extend STANDALONE map with canonical metadata + Bazaar Smart Pricer and descriptions
m=re.search(r"const STANDALONE=\[.*?\n\];",s,re.S)
if not m: raise SystemExit('STANDALONE map missing')
new_map="""const STANDALONE=[
 ['enhancer','Enhancer Guard','SakaLuXEnhancerGuard','Advanced Enhancer inventory tracker and protection tools.'],
 ['bazaar','Bazaar Thanker','SakaLuXBazaarThanker','Bazaar buyer grouping, thank-you messages, statistics and history.'],
 ['bazaar-smart-pricer','Bazaar Smart Pricer','SakaLuXBazaarSmartPricer','Quick Bazaar pricing, bulk fill and sale-safety controls.'],
 ['mission-rewards','Mission Rewards','SakaLuXMissionRewards','Mission Shop values, ammo ownership and mod tracking.'],
 ['market-intelligence','Market Intelligence','SakaLuXMarketIntelligence','Market, travel and pricing intelligence.'],
 ['elimination-assistant','Elimination Assistant','SakaLuXEliminationAssistant','Eliminations target advisor and safe-target tools.'],
 ['company-intelligence','Company Intelligence','SakaLuXCompanyIntelligence','Company dashboard, employee analysis and training recommendations.'],
 ['chat-intelligence','Chat Intelligence','SakaLuXChatIntelligence','Chat search, exports, favorites and notification controls.'],
 ['stock-manager-advisor','Stock Manager & Advisor','SakaLuXStockManagerAdvisor','Stocks portfolio, benefits, ROI advice and rebalance tools.'],
 ['account-auditor','Account Auditor','SakaLuXAccountAuditor','Account audit, security and configuration diagnostics.']
];"""
s=s[:m.start()]+new_map+s[m.end():]
# Replace standalone sync block with canonical section renderer.
start=s.find('function standaloneState(')
end=s.find('window.SakaLuXGraffitiSprayGuide',start)
if start<0 or end<0: raise SystemExit('standalone sync block missing')
new_block=r'''function standaloneState(id,apiGlobal){
 const api=window[apiGlobal]; const bridge=document.getElementById('sakalux-module-bridge-'+id); const rootMark=document.documentElement?.getAttribute('data-sakalux-installed-'+id);
 const installed=Boolean(api||bridge||rootMark); let enabled=null;
 try{if(api&&typeof api.isEnabled==='function')enabled=Boolean(api.isEnabled());else if(bridge?.dataset?.enabled!=null)enabled=bridge.dataset.enabled==='true';}catch{enabled=null;}
 return {installed,enabled,api,bridge};
}
function canonicalModulesHost(panel){
 let host=panel.querySelector('#slx-suite-canonical-modules');
 if(host)return host;
 host=document.createElement('section');host.id='slx-suite-canonical-modules';host.style.cssText='margin:10px 16px 14px;padding:0';
 host.innerHTML='<div style="font-size:12px;letter-spacing:.18em;color:#e0b56d;margin:4px 4px 10px;font-weight:800">SAKALUX MODULES</div><div id="slx-suite-canonical-modules-list"></div>';
 const anchor=[...panel.querySelectorAll('button')].find(b=>/Enable Ready Modules/i.test(txt(b)))?.closest('div');
 (anchor?.parentElement||panel).insertBefore(host,anchor?.nextSibling||panel.firstChild);
 return host;
}
function hideLegacyStandaloneCards(panel){
 const names=STANDALONE.map(x=>x[1]);
 const cards=[...panel.querySelectorAll('div,article,section,li')].filter(el=>!el.closest('#slx-suite-canonical-modules')&&names.some(n=>txt(el).includes(n))&&/Requires the standalone SakaLuX script/i.test(txt(el)));
 cards.forEach(card=>{card.style.display='none';card.dataset.slxLegacyStandalone='1';});
}
function statusLabel(st){if(!st.installed)return ['NOT INSTALLED','#ef9a62'];if(st.enabled===false)return ['INSTALLED · OFF','#9fb0c2'];if(st.enabled===true)return ['READY · ON','#72d6a0'];return ['INSTALLED','#72d6a0'];}
function invokeOpen(api){for(const k of ['open','openSettings','openSettingsPanel','openApiSettings']){try{if(typeof api?.[k]==='function'){api[k]();return true;}}catch{}}return false;}
function setStandaloneEnabled(st,want){try{if(st.api&&typeof st.api.setEnabled==='function'){st.api.setEnabled(Boolean(want));return true;}if(st.bridge){const cur=st.bridge.dataset?.enabled==='true';if(cur!==Boolean(want))st.bridge.click();return true;}}catch{}return false;}
function renderCanonicalModules(){
 const panel=masterPanel();if(!panel)return;hideLegacyStandaloneCards(panel);const host=canonicalModulesHost(panel),list=host.querySelector('#slx-suite-canonical-modules-list');if(!list)return;
 const seen=new Map([...list.children].map(x=>[x.dataset.moduleId,x]));
 for(const [id,name,apiGlobal,desc] of STANDALONE){let card=seen.get(id);if(!card){card=document.createElement('div');card.dataset.moduleId=id;card.className='slx-suite-canonical-module';card.style.cssText='background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98));border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 16px;margin:8px 0;color:#eef3f8';list.appendChild(card);}const st=standaloneState(id,apiGlobal);const [label,color]=statusLabel(st);card.innerHTML=`<div style="display:flex;align-items:flex-start;gap:10px"><div style="min-width:0;flex:1"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b style="font-size:17px">${name}</b><span data-status style="border:1px solid ${color};color:${color};border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800">${label}</span></div><div style="margin-top:7px;color:#a9b5c3;font-size:13px;line-height:1.45">${desc}</div>${!st.installed?'<div style="margin-top:7px;color:#ef7892;font-size:12px">⚠ Requires the standalone SakaLuX script.</div>':''}</div><div style="display:flex;align-items:center;gap:8px"><button data-open type="button" style="min-width:88px;border:0;border-radius:12px;padding:11px 12px;background:#2479c8;color:white;font-weight:700" ${st.installed?'':'disabled'}>Settings</button><label style="position:relative;display:inline-flex;align-items:center"><input data-toggle type="checkbox" ${st.enabled===true?'checked':''} ${st.installed?'':'disabled'} style="width:52px;height:28px;accent-color:#d6ae47"></label></div></div>`;
 const open=card.querySelector('[data-open]');open.onclick=()=>{const cur=standaloneState(id,apiGlobal);if(cur.installed&&!invokeOpen(cur.api)&&cur.bridge)cur.bridge.click();};
 const tog=card.querySelector('[data-toggle]');tog.onchange=()=>{const cur=standaloneState(id,apiGlobal);if(!cur.installed){tog.checked=false;return;}if(!setStandaloneEnabled(cur,tog.checked))tog.checked=cur.enabled===true;setTimeout(renderCanonicalModules,80);};
 }
 [...list.children].forEach(x=>{if(!STANDALONE.some(m=>m[0]===x.dataset.moduleId))x.remove();});
}
function syncHubState(){renderCanonicalModules();}
'''
s=s[:start]+new_block+s[end:]
# make sure canonical modules render on every render path
old="function render(){ensureStyle();injectMasterControl();syncHubState();if(!enabled()||!isGraffiti()){removeGraffiti();return;}cards().forEach(decorateCard);ensureStrip();}"
new="function render(){ensureStyle();injectMasterControl();renderCanonicalModules();if(!enabled()||!isGraffiti()){removeGraffiti();return;}cards().forEach(decorateCard);ensureStrip();}"
if old in s:s=s.replace(old,new,1)
# docs
D=Path('greasyfork/SakaLuX-Suite.md');d=D.read_text(encoding='utf-8')
d=d.replace('**v0.9.943**','**v0.9.944**',1).replace('Canonical version: **v0.9.943**','Canonical version: **v0.9.944**',1)
marker='## Release history / Changelog\n'
entry='''\n### v0.9.944 — Canonical SakaLuX Modules + truthful READY state\n- Rebuilds the SakaLuX Modules section from the canonical 10 standalone modules, including Bazaar Smart Pricer.\n- Removes/hides the legacy standalone cards so modules do not disappear or duplicate.\n- Uses each standalone script runtime API/bridge to show `NOT INSTALLED`, `INSTALLED · OFF`, or `READY · ON` truthfully.\n- Disables Settings and ON/OFF controls for missing standalone scripts.\n- Keeps Suite and Hub state synchronized through the standalone `setEnabled()` / `isEnabled()` APIs.\n\n'''
if '### v0.9.944' not in d:d=d.replace(marker,marker+entry,1)
D.write_text(d,encoding='utf-8')
# regression test
T=Path('tests/suite-all-modules-ready-0944-regression.cjs')
T.write_text("""const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\\/\\/\\s*@version\\s+0\\.9\\.944$/m);for(const id of ['enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence','elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'])assert.ok(s.includes(`['${id}'`),id);for(const x of ['NOT INSTALLED','INSTALLED · OFF','READY · ON','renderCanonicalModules','sakalux-module-bridge-'])assert.ok(s.includes(x),x);assert.ok(s.includes('SakaLuXBazaarSmartPricer'),'Bazaar Smart Pricer API');assert.ok(!/function badgeState\(/.test(s),'legacy duplicate badge removed');console.log('suite all modules + truthful status: OK');\n""",encoding='utf-8')
p.write_text(s,encoding='utf-8')
print('Suite 0.9.944 all modules/status patch applied')
