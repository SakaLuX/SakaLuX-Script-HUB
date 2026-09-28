from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.948$',r'\g<1>0.9.949',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.948')

MARK='/* SAKALUX_SUITE_0949_ALL_MODULES_GUARANTEE */'
if MARK not in s:
    addon=r'''

/* SAKALUX_SUITE_0949_ALL_MODULES_GUARANTEE */
(() => {
'use strict';
const MODULES=[
 ['enhancer','Enhancer Guard'],
 ['bazaar','Bazaar Thanker'],
 ['bazaar-smart-pricer','Bazaar Smart Pricer'],
 ['mission-rewards','Mission Rewards'],
 ['market-intelligence','Market Intelligence'],
 ['elimination-assistant','Elimination Assistant'],
 ['company-intelligence','Company Intelligence'],
 ['chat-intelligence','Chat Intelligence'],
 ['stock-manager-advisor','Stock Manager & Advisor'],
 ['account-auditor','Account Auditor']
];
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const all=(q,r=document)=>[...r.querySelectorAll(q)];
function root(){return all('div,section,aside').filter(x=>/SakaLuX Suite/i.test(txt(x))&&/Enable Ready Modules/i.test(txt(x))).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}
function findCard(r,name){
 const leaves=all('*',r).filter(e=>e.children.length===0&&txt(e)===name);
 for(const leaf of leaves){let c=leaf;for(let i=0;c&&i<8;i++,c=c.parentElement){if(c.querySelector('button')&&c.querySelector('input[type=checkbox],[role=switch]')&&/Settings/i.test(txt(c)))return c;}}
 return null;
}
function findTemplate(r){for(const [,name] of MODULES){const c=findCard(r,name);if(c)return c;}return null;}
function titleLeaf(card){return all('*',card).find(e=>e.children.length===0&&MODULES.some(m=>txt(e)===m[1]))||all('*',card).find(e=>e.children.length===0&&/Guard|Thanker|Pricer|Rewards|Intelligence|Assistant|Auditor|Advisor/i.test(txt(e)))||null;}
function descLeaf(card){return all('*',card).find(e=>e.children.length===0&&/Opens the installed standalone SakaLuX/i.test(txt(e)))||null;}
function ensureAll(){
 const r=root(); if(!r)return;
 let tmpl=findTemplate(r); if(!tmpl)return;
 const parent=tmpl.parentElement; if(!parent)return;
 for(const [id,name] of MODULES){
   let card=findCard(r,name);
   if(!card){
     card=tmpl.cloneNode(true);
     card.dataset.slx0949Module=id;
     const t=titleLeaf(card); if(t)t.textContent=name;
     const d=descLeaf(card); if(d)d.textContent=`Opens the installed standalone SakaLuX ${name}.`;
     card.querySelectorAll('[data-slx0948-bound],[data-slx0947-module],[data-slx0948-card-bound]').forEach(e=>{delete e.dataset.slx0948Bound;delete e.dataset.slx0947Module;delete e.dataset.slx0948CardBound;});
     const b=card.querySelector('[data-slx0948-status]'); if(b)b.remove();
     parent.appendChild(card);
   }
 }
 // Canonical order, all 10 cards always present.
 for(const [,name] of MODULES){const c=findCard(r,name);if(c&&c.parentElement===parent)parent.appendChild(c);}
}
window.addEventListener('SakaLuX:ModuleReady',()=>setTimeout(ensureAll,20),{passive:true});
window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(ensureAll,20),{passive:true});
new MutationObserver(()=>{clearTimeout(window.__slx0949t);window.__slx0949t=setTimeout(ensureAll,60);}).observe(document.documentElement,{childList:true,subtree:true});
setInterval(ensureAll,1000);setTimeout(ensureAll,40);
})();
'''
    s=s.rstrip()+addon+'\n'
p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.948**','**v0.9.949**',1).replace('Canonical version: **v0.9.948**','Canonical version: **v0.9.949**',1)
entry='''\n### v0.9.949 — Complete managed module list\n- Guarantees all 10 managed standalone cards are present in Master Control on every render.\n- Restores missing Bazaar Smart Pricer by cloning the native compact Suite card structure instead of introducing a new layout.\n- Keeps canonical order: Enhancer Guard, Bazaar Thanker, Bazaar Smart Pricer, Mission Rewards, Market Intelligence, Elimination Assistant, Company Intelligence, Chat Intelligence, Stock Manager & Advisor, Account Auditor.\n- Leaves v0.9.948 live status, Settings and ON/OFF bridge handling in control of each card after creation.\n'''
if '### v0.9.949' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

t=Path('tests/suite-0949-all-modules-regression.cjs')
t.write_text("const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\\/\\/\\s*@version\\s+0\\.9\\.949$/m);assert.ok(s.includes('SAKALUX_SUITE_0949_ALL_MODULES_GUARANTEE'));for(const n of ['Enhancer Guard','Bazaar Thanker','Bazaar Smart Pricer','Mission Rewards','Market Intelligence','Elimination Assistant','Company Intelligence','Chat Intelligence','Stock Manager & Advisor','Account Auditor'])assert.ok(s.includes(`'${n}'`),n);assert.ok(s.includes('cloneNode(true)'));assert.ok(s.includes('parent.appendChild(card)'));console.log('suite 0.9.949 all modules regression: OK');",encoding='utf-8')
print('patched Suite to 0.9.949')
