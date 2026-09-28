from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.950$',r'\g<1>0.9.951',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.950')

# Remove the old experimental graffiti block so two render loops cannot fight each other.
s=re.sub(r'\n?/\* SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC \*/\s*\(\(\) => \{.*?\n\}\)\(\);\s*', '\n', s, count=1, flags=re.S)

MARK='/* SAKALUX_GRAFFITI_COMBINED_V2 */'
if MARK not in s:
    addon=r'''

/* SAKALUX_GRAFFITI_COMBINED_V2 */
(() => {
'use strict';
// SakaLuX integration inspired by Torn Graffiti Helper (Torchin, MIT)
// and Torn Graffiti Helper v1.2.0 (NebiGoktug, MIT). Reimplemented for Suite.
const VERSION='0.9.951';
const ID='graffiti-spray-guide';
const STORE='SakaLuX_GRAFFITI_GUIDE_V2';
const DEFAULT={enabled:true,mode:'BOTH'};
const TIERS=[25,50,100,250,500];
const GATES=[[15,'Ladder'],[25,'Wire Cutters'],[35,'Paint Mask'],[50,'Residential + Red-Light'],[70,'Crew unique'],[95,'Points'],[100,'Final unique']];
const HINT={
 'East Side':{cash:'purple',rep:'red'},
 'West Side':{cash:'green',rep:'blue'},
 'North Side':{cash:'green',rep:'orange'},
 'Residential':{cash:'white',rep:'blue'},
 'Red-Light':{cash:'green',rep:'pink'},
 'Financial':{cash:'black',rep:'red'},
 'City Center':{cash:'green',rep:'blue'}
};
const LOCS=Object.keys(HINT);
const IMG=[[/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],[/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],[/CentreCity|CityCentre|CityCenter/i,'City Center']];
const TITLE=[[/^east side$/i,'East Side'],[/^west side$/i,'West Side'],[/^north side$/i,'North Side'],[/^residential$/i,'Residential'],[/^red[-\s]?light$/i,'Red-Light'],[/^financial$/i,'Financial'],[/^city\s*center$/i,'City Center']];
const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
const text=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const num=v=>{const m=String(v||'').replace(/,/g,'').match(/\d+/);return m?Number(m[0]):null};
function load(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return {...DEFAULT}}}
function save(x){try{localStorage.setItem(STORE,JSON.stringify({...load(),...x}))}catch{}}
function cfg(){return load()}
function onGraffiti(){const t=text(document.body);return LOCS.slice(0,3).every(n=>t.includes(n))&&/Graffiti/i.test(t)}
function locByNode(node){
 const im=node?.querySelector?.('img'); const src=im?.src||im?.getAttribute?.('src')||'';
 for(const [rx,n] of IMG)if(rx.test(src))return n;
 for(const el of $$('*',node||document)){if(el.children.length)continue;const v=text(el);for(const [rx,n] of TITLE)if(rx.test(v))return n;}
 return null;
}
function findLocationLeaf(name){return $$('*').find(e=>e.children.length===0&&text(e)===name)||null}
function cardFor(name){
 const leaf=findLocationLeaf(name); if(!leaf)return null;
 let c=leaf;
 for(let i=0;c&&i<10;i++,c=c.parentElement){
   const loc=locByNode(c);
   if(loc===name && (c.matches?.('[class*="crimeOption"],[class*="crimeWrapper"],[class*="crimePanel"],li,article')||c.querySelector?.('img')))return c;
 }
 return leaf.parentElement;
}
function tagCount(card,name){
 const candidates=$$('[class*="tabletTitleAndTagCount"],[class*="tagCount"],[class*="tagsCount"]',card);
 for(const e of candidates){const n=num(text(e));if(n!=null)return n;}
 const raw=text(card).replace(name,' ');
 let m=raw.match(/(?:tags?|reputation|rep)\D{0,10}(\d{1,4})/i); if(m)return Number(m[1]);
 const leaf=findLocationLeaf(name); if(leaf){const sib=text(leaf.parentElement);m=sib.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*(\\d{1,4})','i'));if(m)return Number(m[1]);}
 return null;
}
function nextTier(v){if(v==null)return null;for(const t of TIERS)if(v<t)return {tier:t,left:t-v};return null}
function pageStat(rx){const m=text(document.body).match(rx);return m?num(m[1]):null}
function crimeSkill(){return pageStat(/(?:crime\s*skill|skill)\D{0,12}(\d{1,3})/i)}
function nerve(){const exact=$$('[aria-label]').map(e=>e.getAttribute('aria-label')).find(v=>/^Nerve\b/i.test(v||''));if(exact){const n=num(exact);if(n!=null)return n}return pageStat(/nerve\D{0,10}(\d{1,3})/i)}
function enhancer(){const t=text(document.body);return /paint\s*mask/i.test(t)?'Paint Mask':(/wire\s*cutters/i.test(t)?'Wire Cutters':(/ladder/i.test(t)?'Ladder':'—'))}
function uniques(){const m=text(document.body).match(/unique(?:\s*outcomes?)?\D{0,12}(\d+)\s*\/\s*(\d+)/i);return m?`${m[1]}/${m[2]}`:'—'}
function goal(cs){if(cs==null)return '—';for(const [gate,label] of GATES)if(cs<gate)return `${label} @ CS${gate}`;return 'All CS gates reached'}
function sprayPercent(card){
 const els=$$('[aria-label],*',card);
 for(const e of els){const v=(e.getAttribute?.('aria-label')||'')+' '+text(e);const m=v.match(/(\d{1,3})%/);if(m){const x=Number(m[1]);if(x<=100)return x}}
 return null;
}
function sprayColour(card){
 const vals=$$('img,[aria-label],[title]',card).map(e=>[(e.alt||''),(e.title||''),(e.getAttribute?.('aria-label')||''),(e.src||'')].join(' ')).join(' ');
 for(const c of ['black','blue','green','orange','pink','purple','red','white'])if(new RegExp(c,'i').test(vals))return c;
 return null;
}
function ownedColours(){
 const out=new Set();
 for(const name of LOCS){const c=cardFor(name);if(!c)continue;const col=sprayColour(c);if(col)out.add(col)}
 const body=$$('img,[aria-label],[title]').map(e=>[(e.alt||''),(e.title||''),(e.getAttribute?.('aria-label')||''),(e.src||'')].join(' ')).join(' ');
 for(const c of ['black','blue','green','orange','pink','purple','red','white'])if(new RegExp(c,'i').test(body))out.add(c);
 return out;
}
function style(){if($('#slx-graffiti-v2-style'))return;const e=document.createElement('style');e.id='slx-graffiti-v2-style';e.textContent=`
#slx-graffiti-summary{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:6px 0;padding:7px 8px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(10,15,21,.92);color:#dbe4ec;font:700 11px/1.25 Arial,sans-serif}#slx-graffiti-summary .slx-g-head{color:#f2bd58;font-weight:900}#slx-graffiti-summary button{border:1px solid rgba(255,255,255,.16);border-radius:5px;background:#192532;color:#dce6ee;padding:3px 6px;font:800 10px Arial}#slx-graffiti-summary button[data-active="1"]{background:#8a6928;color:#fff}.slx-graffiti-v2{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}.slx-graffiti-v2 span{display:inline-flex;align-items:center;border-radius:4px;padding:2px 5px;background:rgba(0,0,0,.42);font:800 10px/1.25 Arial,sans-serif;white-space:nowrap}.slx-g-rep{color:#ffd56b}.slx-g-cash{color:#7ee0aa}.slx-g-progress{color:#b9c8d5}.slx-g-alert{color:#ff8d8d!important}.slx-g-unowned{opacity:.55;text-decoration:line-through}
`; (document.head||document.documentElement).appendChild(e)}
function summaryAnchor(){const first=cardFor('East Side');if(!first)return null;let p=first.parentElement;return p||first}
function renderSummary(){
 let bar=$('#slx-graffiti-summary');const anchor=summaryAnchor();if(!anchor)return;
 if(!bar){bar=document.createElement('div');bar.id='slx-graffiti-summary';anchor.parentElement?.insertBefore(bar,anchor)}
 const c=cfg(),cs=crimeSkill(),nv=nerve();
 bar.innerHTML=`<span class="slx-g-head">🎨 Graffiti Spray Guide</span><button data-mode="BOTH">BOTH</button><button data-mode="REP">REP</button><button data-mode="CASH">CASH</button><span>CS ${cs??'?'}</span><span>Enhancer ${enhancer()}</span><span>Nerve ${nv??'?'}</span><span>Attempts ${nv!=null?Math.floor(nv/3):'?'}</span><span>Uniques ${uniques()}</span><span>Next ${goal(cs)}</span>`;
 bar.querySelectorAll('[data-mode]').forEach(b=>{b.dataset.active=b.dataset.mode===c.mode?'1':'0';b.onclick=()=>{save({mode:b.dataset.mode});render()}})
}
function renderCard(name,owned){
 const card=cardFor(name);if(!card)return;let box=card.querySelector(':scope .slx-graffiti-v2');if(!box){box=document.createElement('div');box.className='slx-graffiti-v2';const leaf=findLocationLeaf(name);(leaf?.parentElement||card).appendChild(box)}
 const c=cfg(),h=HINT[name],rep=tagCount(card,name),nt=nextTier(rep),pct=sprayPercent(card),col=sprayColour(card),parts=[];
 if(nt)parts.push(`<span class="slx-g-progress">+${nt.left} → ${nt.tier}</span>`);else if(rep!=null)parts.push(`<span class="slx-g-progress">REP ${rep}</span>`);
 if(c.mode==='BOTH'||c.mode==='REP')parts.push(`<span class="slx-g-rep ${owned.size&&!owned.has(h.rep)?'slx-g-unowned':''}">⭐ REP ${h.rep.toUpperCase()}</span>`);
 if(c.mode==='BOTH'||c.mode==='CASH')parts.push(`<span class="slx-g-cash ${owned.size&&!owned.has(h.cash)?'slx-g-unowned':''}">💰 CASH ${h.cash.toUpperCase()}</span>`);
 if(pct!=null&&pct<=15)parts.push(`<span class="slx-g-alert">⚠ ${col?col.toUpperCase()+' ':''}${pct}%</span>`);
 box.innerHTML=parts.join('');
}
function cleanup(){ $$('.slx-graffiti-v2').forEach(e=>e.remove()); $('#slx-graffiti-summary')?.remove(); }
function render(){
 style();const c=cfg();if(!c.enabled||!onGraffiti()){cleanup();return}const owned=ownedColours();renderSummary();for(const n of LOCS)renderCard(n,owned)
}
function setEnabled(v){save({enabled:!!v});render()}
window.SakaLuXGraffitiSprayGuide={id:ID,version:VERSION,isEnabled:()=>cfg().enabled,setEnabled,render};
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,120)};
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('hashchange',schedule,{passive:true});window.addEventListener('popstate',schedule,{passive:true});
setInterval(render,1500);setTimeout(render,100);
})();
'''
    s=s.rstrip()+addon+'\n'
p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.950**','**v0.9.951**',1).replace('Canonical version: **v0.9.950**','Canonical version: **v0.9.951**',1)
entry='''\n### v0.9.951 — Rebuilt Graffiti Spray Guide\n- Rebuilds Graffiti integration from the two requested MIT helpers instead of extending the broken experimental DOM layer.\n- Uses the mobile/TornPDA-first inline recommendation presentation as the primary behavior and adds advanced REP tier progress, CS gates, enhancer, nerve/attempts, unique outcomes, stock percentage warnings and BOTH/REP/CASH modes.\n- Detects all seven Graffiti locations by visible title and image fallback, avoiding dependence on Torn's generated CSS class names.\n- Removes the previous v0.9.941 Graffiti renderer to prevent duplicate observers and conflicting UI.\n- Remains read-only: no API requests and no gameplay automation.\n'''
if '### v0.9.951' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-v2-regression.cjs').write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.951$/m);assert.ok(s.includes('SAKALUX_GRAFFITI_COMBINED_V2'));assert.ok(!s.includes('SAKALUX_SUITE_0941_GRAFFITI_HUB_SYNC'));for(const n of ['East Side','West Side','North Side','Residential','Red-Light','Financial','City Center'])assert.ok(s.includes(`'${n}'`),n);for(const x of ['BOTH','REP','CASH','TIERS=[25,50,100,250,500]','crimeOption','tabletTitleAndTagCount','Paint Mask','Crew unique'])assert.ok(s.includes(x),x);const block=s.split('SAKALUX_GRAFFITI_COMBINED_V2')[1];assert.ok(!/GM_xmlhttpRequest|fetch\s*\(/.test(block),'Graffiti must stay API-free');console.log('suite graffiti v2 regression: OK');''',encoding='utf-8')
print('Suite v0.9.951 Graffiti integration rebuilt')
