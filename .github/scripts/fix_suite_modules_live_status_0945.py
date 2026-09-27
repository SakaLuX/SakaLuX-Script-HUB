from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.944$',r'\g<1>0.9.945',s,count=1)
if n!=1: raise SystemExit('Suite @version 0.9.944 not found')
s=s.replace("const VERSION='0.9.944';","const VERSION='0.9.945';",1)
old="""function standaloneState(id,apiGlobal){\n const api=window[apiGlobal]; const bridge=document.getElementById('sakalux-module-bridge-'+id); const rootMark=document.documentElement?.getAttribute('data-sakalux-installed-'+id);\n const installed=Boolean(api||bridge||rootMark); let enabled=null;\n try{if(api&&typeof api.isEnabled==='function')enabled=Boolean(api.isEnabled());else if(bridge?.dataset?.enabled!=null)enabled=bridge.dataset.enabled==='true';}catch{enabled=null;}\n return {installed,enabled,api,bridge};\n}"""
new="""function standaloneState(id,apiGlobal){\n const api=window[apiGlobal]; const bridge=document.getElementById('sakalux-module-bridge-'+id); const runtimeMap=window.__SakaLuXDockRuntimeModules; const runtime=runtimeMap instanceof Map?runtimeMap.get(id):null;\n const installed=Boolean(api||bridge||runtime); let enabled=null;\n try{if(api&&typeof api.isEnabled==='function')enabled=Boolean(api.isEnabled());else if(bridge?.dataset?.enabled!=null)enabled=bridge.dataset.enabled==='true';else if(runtime&&typeof runtime.enabled==='function')enabled=Boolean(runtime.enabled());}catch{enabled=null;}\n return {installed,enabled,api,bridge,runtime};\n}"""
if old not in s: raise SystemExit('standaloneState block not found')
s=s.replace(old,new,1)
s=s.replace("function statusLabel(st){if(!st.installed)return ['NOT INSTALLED','#ef9a62'];if(st.enabled===false)return ['INSTALLED · OFF','#9fb0c2'];if(st.enabled===true)return ['READY · ON','#72d6a0'];return ['INSTALLED','#72d6a0'];}","function statusLabel(st){if(!st.installed)return ['NOT INSTALLED','#ef9a62'];if(st.enabled===false)return ['INSTALLED · OFF','#e5bd65'];if(st.enabled===true)return ['READY · ON','#72d6a0'];return ['INSTALLED · UNKNOWN','#9fb0c2'];}",1)
s=s.replace("function setStandaloneEnabled(st,want){try{if(st.api&&typeof st.api.setEnabled==='function'){st.api.setEnabled(Boolean(want));return true;}if(st.bridge){const cur=st.bridge.dataset?.enabled==='true';if(cur!==Boolean(want))st.bridge.click();return true;}}catch{}return false;}","function setStandaloneEnabled(st,want){try{if(st.api&&typeof st.api.setEnabled==='function'){st.api.setEnabled(Boolean(want));return true;}if(st.runtime&&typeof st.runtime.setEnabled==='function'){st.runtime.setEnabled(Boolean(want));return true;}if(st.bridge){const cur=st.bridge.dataset?.enabled==='true';if(cur!==Boolean(want))st.bridge.click();return true;}}catch{}return false;}",1)
# Make sure canonical list really contains all ten managed standalone modules in the intended order.
expected=[
"['enhancer','Enhancer Guard','SakaLuXEnhancerGuard'",
"['bazaar','Bazaar Thanker','SakaLuXBazaarThanker'",
"['bazaar-smart-pricer','Bazaar Smart Pricer','SakaLuXBazaarSmartPricer'",
"['mission-rewards','Mission Rewards','SakaLuXMissionRewards'",
"['market-intelligence','Market Intelligence','SakaLuXMarketIntelligence'",
"['elimination-assistant','Elimination Assistant','SakaLuXEliminationAssistant'",
"['company-intelligence','Company Intelligence','SakaLuXCompanyIntelligence'",
"['chat-intelligence','Chat Intelligence','SakaLuXChatIntelligence'",
"['stock-manager-advisor','Stock Manager & Advisor','SakaLuXStockManagerAdvisor'",
"['account-auditor','Account Auditor','SakaLuXAccountAuditor'",
]
pos=[s.find(x) for x in expected]
if any(x<0 for x in pos): raise SystemExit('one or more canonical modules missing')
if pos!=sorted(pos): raise SystemExit('canonical module order is wrong')
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md');t=d.read_text(encoding='utf-8')
t=t.replace('**v0.9.944**','**v0.9.945**',1).replace('Canonical version: **v0.9.944**','Canonical version: **v0.9.945**',1)
note='''**v0.9.945 — Complete module list + truthful live status**\n- Keeps all 10 managed SakaLuX standalone modules visible together at the top of SakaLuX Modules in canonical order.\n- Installation status now uses only live API, live bridge, or live runtime registration; old `data-sakalux-installed-*` markers no longer count as installed.\n- Status meanings are strict: `NOT INSTALLED`, `INSTALLED · OFF`, `READY · ON`, or `INSTALLED · UNKNOWN`.\n- Missing or unknown modules cannot be falsely shown as READY.\n\n'''
if note not in t:t=t.replace('## Release history / Changelog',note+'## Release history / Changelog',1)
d.write_text(t,encoding='utf-8')

Path('tests/suite-modules-live-status-0945-regression.cjs').write_text(r'''const fs=require('node:fs'),a=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');a.match(s,/^\/\/\s*@version\s+0\.9\.945$/m);const names=['Enhancer Guard','Bazaar Thanker','Bazaar Smart Pricer','Mission Rewards','Market Intelligence','Elimination Assistant','Company Intelligence','Chat Intelligence','Stock Manager & Advisor','Account Auditor'];let last=-1;for(const n of names){const i=s.indexOf(n,s.indexOf('const STANDALONE=['));a.ok(i>last,n+' canonical order');last=i;}for(const x of ['NOT INSTALLED','INSTALLED · OFF','READY · ON','INSTALLED · UNKNOWN'])a.ok(s.includes(x),x);const block=s.slice(s.indexOf('function standaloneState'),s.indexOf('function canonicalModulesHost'));a.ok(!block.includes('data-sakalux-installed'),'persistent marker must not determine install status');a.ok(block.includes('__SakaLuXDockRuntimeModules'),'live runtime fallback');a.ok(block.includes('window[apiGlobal]'),'live API authority');a.ok(block.includes("sakalux-module-bridge-"),'live bridge authority');console.log('suite modules 0.9.945 live-status regression: OK');''',encoding='utf-8')
print('Suite 0.9.945 live module status patch applied')
