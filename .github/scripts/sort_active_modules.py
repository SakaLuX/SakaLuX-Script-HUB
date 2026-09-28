from pathlib import Path
import re

ROOT=Path('.')
MODULE_NAMES=['Account Auditor','Bazaar Smart Pricer','Bazaar Thanker','Chat Intelligence','Company Intelligence','Elimination Assistant','Enhancer Guard','Market Intelligence','Mission Rewards','Stock Manager & Advisor']

SORT_JS=r'''
/* SAKALUX_ACTIVE_FIRST_ALPHA_SORT */
(() => {
'use strict';
const NAMES=%NAMES%;
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const all=(q,r=document)=>[...r.querySelectorAll(q)];
function leafFor(root,name){return all('*',root).find(e=>e.children.length===0&&txt(e)===name)||null;}
function cardFor(root,name){
 const leaf=leafFor(root,name); if(!leaf)return null;
 let c=leaf;
 for(let i=0;c&&i<9;i++,c=c.parentElement){
   if(c.querySelector?.('input[type=checkbox],[role=switch]')&&c.querySelector?.('button'))return c;
 }
 return null;
}
function active(card){
 const input=card.querySelector('input[type=checkbox]');
 if(input)return !input.disabled&&input.checked;
 const sw=card.querySelector('[role=switch]');
 if(sw){if(sw.getAttribute('aria-disabled')==='true')return false;return sw.getAttribute('aria-checked')==='true';}
 const t=txt(card);
 if(/NOT INSTALLED|INSTALLED\s*·\s*OFF|DISABLED|NOT READY/i.test(t))return false;
 if(/READY\s*·\s*ON|ACTIVE|ENABLED/i.test(t))return true;
 return false;
}
function reorder(root){
 const rows=NAMES.map(name=>({name,card:cardFor(root,name)})).filter(x=>x.card);
 if(rows.length<2)return;
 const groups=new Map();
 for(const row of rows){const p=row.card.parentElement;if(!p)continue;if(!groups.has(p))groups.set(p,[]);groups.get(p).push(row);}
 for(const [parent,list] of groups){
   const sorted=[...list].sort((a,b)=>Number(active(b.card))-Number(active(a.card))||a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));
   const current=list.map(x=>x.card);
   if(sorted.every((x,i)=>x.card===current[i]))continue;
   for(const x of sorted)parent.appendChild(x.card);
 }
}
function run(){
 const roots=[];
 const hub=document.getElementById('sakalux-hub-panel'); if(hub)roots.push(hub);
 for(const x of all('div,section,aside')){const t=txt(x);if(/SakaLuX Suite/i.test(t)&&/Enable Ready Modules/i.test(t))roots.push(x);}
 const uniq=[...new Set(roots)].sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length);
 for(const r of uniq)reorder(r);
}
let q=0;const schedule=()=>{if(q)return;q=setTimeout(()=>{q=0;run();},40)};
document.addEventListener('change',schedule,true);document.addEventListener('click',schedule,true);
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['checked','disabled','aria-checked','aria-disabled','class']});
window.addEventListener('SakaLuX:ModuleReady',schedule,{passive:true});window.addEventListener('SakaLuX:ScriptHubReady',schedule,{passive:true});
setInterval(run,1000);setTimeout(run,60);
})();
'''.replace('%NAMES%',repr(MODULE_NAMES).replace("'",'"'))

def bump(path, old, new):
    s=path.read_text(encoding='utf-8')
    s,n=re.subn(r'(?m)^(//\s*@version\s+)'+re.escape(old)+r'$',r'\g<1>'+new,s,count=1)
    if n!=1: raise SystemExit(f'{path}: expected version {old}')
    if 'SAKALUX_ACTIVE_FIRST_ALPHA_SORT' not in s:s=s.rstrip()+"\n\n"+SORT_JS+"\n"
    path.write_text(s,encoding='utf-8')

bump(ROOT/'SakaLuX-Script-Hub.user.js','1.9.89','1.9.90')
bump(ROOT/'SakaLuX-Suite.user.js','0.9.949','0.9.950')

# Remove the fixed canonical reorder from 0.9.949 so it cannot fight the dynamic active-first sorter.
p=ROOT/'SakaLuX-Suite.user.js';s=p.read_text(encoding='utf-8')
s=s.replace(" // Canonical order, all 10 cards always present.\n for(const [,name] of MODULES){const c=findCard(r,name);if(c&&c.parentElement===parent)parent.appendChild(c);}"," // Ordering is handled by SAKALUX_ACTIVE_FIRST_ALPHA_SORT.",1)
p.write_text(s,encoding='utf-8')

for file,old,new,title in [
 ('greasyfork/Script-Hub.md','1.9.89','1.9.90','### v1.9.90 — Alphabetical active-first module order'),
 ('greasyfork/SakaLuX-Suite.md','0.9.949','0.9.950','### v0.9.950 — Alphabetical active-first module order')]:
    p=ROOT/file;d=p.read_text(encoding='utf-8')
    d=d.replace(f'**v{old}**',f'**v{new}**',1).replace(f'Canonical version: **v{old}**',f'Canonical version: **v{new}**',1)
    entry=f"\n{title}\n- Enabled/ON modules are shown first and sorted A–Z.\n- Disabled/OFF modules automatically move to the bottom and are sorted A–Z there.\n- The order refreshes immediately after ON/OFF changes and remains consistent between Hub and Suite/standalone module control.\n"
    if title not in d:
        pos=d.find('\n## Release history / Changelog')
        d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
    p.write_text(d,encoding='utf-8')

Path('tests/module-active-alpha-sort-regression.cjs').write_text(r'''const fs=require('node:fs');const a=fs.readFileSync('SakaLuX-Script-Hub.user.js','utf8'),b=fs.readFileSync('SakaLuX-Suite.user.js','utf8');for(const [s,v] of [[a,'1.9.90'],[b,'0.9.950']]){if(!new RegExp('^//\\s*@version\\s+'+v.replace(/\./g,'\\.')+'$','m').test(s))throw Error(v);if(!s.includes('SAKALUX_ACTIVE_FIRST_ALPHA_SORT'))throw Error('sort marker');if(!s.includes('Number(active(b.card))-Number(active(a.card))'))throw Error('active first');if(!s.includes('localeCompare'))throw Error('alpha');}if(b.includes('// Canonical order, all 10 cards always present.'))throw Error('fixed order still active');console.log('module active-first alphabetical sort regression: OK');''',encoding='utf-8')
print('patched Hub 1.9.90 and Suite 0.9.950')
