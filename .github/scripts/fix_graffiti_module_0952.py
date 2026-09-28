from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.951$',r'\g<1>0.9.952',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.951')

# Tighten Graffiti page/card detection to the selectors used by the working helper.
s=s.replace("function onGraffiti(){const t=text(document.body);return LOCS.slice(0,3).every(n=>t.includes(n))&&/Graffiti/i.test(t)}",
"function onGraffiti(){return /sid=crimes/i.test(location.href)&&(/#graffiti/i.test(location.href)||/Graffiti/i.test(text(document.querySelector('h1,h2,[class*=title]')||document.body)))}")

old="""function cardFor(name){
 const leaf=findLocationLeaf(name); if(!leaf)return null;
 let c=leaf;
 for(let i=0;c&&i<10;i++,c=c.parentElement){
   const loc=locByNode(c);
   if(loc===name && (c.matches?.('[class*=\"crimeOption\"],[class*=\"crimeWrapper\"],[class*=\"crimePanel\"],li,article')||c.querySelector?.('img')))return c;
 }
 return leaf.parentElement;
}"""
new="""function cardFor(name){
 const exact=$$('[class*=\"crimeOption___\"],[class*=\"crimeOption\"]');
 for(const c of exact){
   const title=text(c.querySelector('[class*=\"tabletTitleAndTagCount\"]')||c.querySelector('[class*=\"title\"]')||c);
   if(new RegExp('^'+name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&')+'(?:\\\\s|$)','i').test(title)||locByNode(c)===name)return c;
 }
 const leaf=findLocationLeaf(name); if(!leaf)return null;
 let c=leaf;
 for(let i=0;c&&i<10;i++,c=c.parentElement){if(c.matches?.('[class*=\"crimeOption\"],li,article')||c.querySelector?.('[class*=\"sprayCanButton\"],[class*=\"crimeOptionImage\"]'))return c;}
 return leaf.parentElement;
}"""
if old not in s: raise SystemExit('cardFor block not found')
s=s.replace(old,new,1)

# Prefer exact helper selectors for tags and spray state.
s=s.replace("const candidates=$$('[class*=\"tabletTitleAndTagCount\"],[class*=\"tagCount\"],[class*=\"tagsCount\"]',card);",
            "const candidates=$$('[class*=\"tagsCount\"],[class*=\"tagCount\"],[class*=\"tabletTitleAndTagCount\"]',card);")
s=s.replace("const els=$$('[aria-label],*',card);",
            "const els=$$('[class*=\"sprayCanButton\"][aria-label],[aria-label]',card);")

# Add a real Master Control row for this built-in module.
MARK='/* SAKALUX_GRAFFITI_MASTER_CONTROL_0952 */'
if MARK not in s:
    addon=r'''

/* SAKALUX_GRAFFITI_MASTER_CONTROL_0952 */
(() => {
'use strict';
const NAME='Graffiti Spray Guide';
const API='SakaLuXGraffitiSprayGuide';
const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const all=(q,r=document)=>[...r.querySelectorAll(q)];
function root(){return all('div,section,aside').filter(x=>/SakaLuX Suite/i.test(text(x))&&/Enable Ready Modules/i.test(text(x))).sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}
function cardByName(r,name){const leaf=all('*',r).find(e=>e.children.length===0&&text(e)===name);if(!leaf)return null;let c=leaf;for(let i=0;c&&i<8;i++,c=c.parentElement){if(c.querySelector('input[type=checkbox],[role=switch]')&&/Settings/i.test(text(c)))return c;}return null;}
function template(r){for(const name of ['Mission Rewards','Market Intelligence','Enhancer Guard','Bazaar Thanker']){const c=cardByName(r,name);if(c)return c;}return null;}
function status(card,on){let b=card.querySelector('[data-slx-graffiti-status]');if(!b){b=document.createElement('span');b.dataset.slxGraffitiStatus='1';b.style.cssText='margin-left:8px;font-size:11px;font-weight:800;border:1px solid currentColor;border-radius:999px;padding:2px 7px;';const title=all('*',card).find(e=>e.children.length===0&&text(e)===NAME);title?.parentElement?.appendChild(b);}if(b){b.textContent=on?'READY · ON':'INSTALLED · OFF';b.style.color=on?'#72d6a0':'#e9bd63';}}
function ensure(){
 const r=root();if(!r)return;let card=cardByName(r,NAME);if(!card){const t=template(r);if(!t)return;card=t.cloneNode(true);card.dataset.slxGraffitiModule='1';const title=all('*',card).find(e=>e.children.length===0&&/Mission Rewards|Market Intelligence|Enhancer Guard|Bazaar Thanker/.test(text(e)));if(title)title.textContent=NAME;const desc=all('*',card).find(e=>e.children.length===0&&/Opens the installed standalone SakaLuX/i.test(text(e)));if(desc)desc.textContent='Built-in Graffiti spray recommendations, progress and warnings.';card.querySelectorAll('[data-slx0948-status],[data-slx0948-bound],[data-slx0947-module],[data-slx0948-card-bound]').forEach(e=>{if(e.dataset.slx0948Status)e.remove();delete e.dataset.slx0948Bound;delete e.dataset.slx0947Module;delete e.dataset.slx0948CardBound;});t.parentElement.appendChild(card);}
 const api=window[API];const on=api?.isEnabled?.()!==false;status(card,on);
 const sw=card.querySelector('input[type=checkbox],[role=switch]');if(sw){if(sw.tagName==='INPUT'){sw.disabled=false;sw.checked=on;sw.onchange=e=>{api?.setEnabled?.(!!e.target.checked);setTimeout(ensure,20);};}else{sw.setAttribute('aria-checked',String(on));sw.onclick=e=>{e.preventDefault();e.stopPropagation();api?.setEnabled?.(!api?.isEnabled?.());setTimeout(ensure,20);};}}
 const settings=all('button',card).find(b=>/Settings/i.test(text(b)));if(settings){settings.disabled=false;settings.onclick=e=>{e.preventDefault();e.stopPropagation();api?.setEnabled?.(true);location.href='/loader.php?sid=crimes#/graffiti';};}
}
window.addEventListener('SakaLuX:ScriptHubReady',()=>setTimeout(ensure,40),{passive:true});new MutationObserver(()=>{clearTimeout(window.__slxGraffitiMC);window.__slxGraffitiMC=setTimeout(ensure,80);}).observe(document.documentElement,{childList:true,subtree:true});setInterval(ensure,1200);setTimeout(ensure,100);
})();
'''
    s=s.rstrip()+addon+'\n'

p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.951**','**v0.9.952**',1).replace('Canonical version: **v0.9.951**','Canonical version: **v0.9.952**',1)
entry='''\n### v0.9.952 — Graffiti module activation + exact Torn selectors\n- Adds Graffiti Spray Guide as a real built-in Master Control module with ON/OFF state.\n- Uses the working helper's Crimes 2.0 selectors (`crimeOption___`, `tabletTitleAndTagCount`, `tagsCount`, `sprayCanButton[aria-label]`) before fallbacks.\n- Keeps the module enabled by default, so no separate activation is required after updating.\n- Settings enables the module and opens Crimes → Graffiti.\n- Keeps the existing compact Suite card style and the combined REP/CASH/progress/warning logic from v0.9.951.\n'''
if '### v0.9.952' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0952-regression.cjs').write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.952$/m);for(const x of ['SAKALUX_GRAFFITI_MASTER_CONTROL_0952','crimeOption___','tabletTitleAndTagCount','tagsCount','sprayCanButton','Graffiti Spray Guide','INSTALLED · OFF','READY · ON'])assert.ok(s.includes(x),x);assert.ok(s.includes("api?.setEnabled?.(!!e.target.checked)"));assert.ok(s.includes("/loader.php?sid=crimes#/graffiti"));console.log('suite graffiti 0.9.952 regression: OK');''',encoding='utf-8')
print('Suite v0.9.952 Graffiti module fixed')
