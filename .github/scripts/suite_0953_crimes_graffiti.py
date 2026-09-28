from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.952$',r'\g<1>0.9.953',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.952')

# Remove appended experimental Graffiti implementations. v0.9.953 makes it a native Suite module.
mark='/* SAKALUX_GRAFFITI_COMBINED_V2 */'
if mark in s:
    s=s[:s.index(mark)].rstrip()+"\n"

# Move Target Alerts from Lists to the new Crimes category.
s=s.replace('name: "Target Alerts",\n      category: "Lists",','name: "Target Alerts",\n      category: "Crimes",')

# Native module factory based on the working Graffiti Helper DOM contract.
factory=r'''
  function createGraffitiSprayGuideModule(context) {
    const STYLE_ID='sakalux-graffiti-native-style';
    const STORE_KEY='sakalux_graffiti_native_v1';
    const REP_TIERS=[25,50,100,250,500];
    const CS_GATES=[[15,'Ladder'],[25,'Wire Cutters'],[35,'Paint Mask'],[50,'Residential + Red-Light'],[70,'Crew unique'],[95,'Points'],[100,'Final unique']];
    const HINT={
      'East Side':{cash:'purple',rep:'red'},'West Side':{cash:'green',rep:'blue'},'North Side':{cash:'green',rep:'orange'},
      'Residential':{cash:'white',rep:'blue'},'Red-Light':{cash:'green',rep:'pink'},'Financial':{cash:'black',rep:'red'},'City Center':{cash:'green',rep:'blue'}
    };
    const BY_IMAGE=[[/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],[/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],[/CentreCity|CityCentre|CityCenter/i,'City Center']];
    const BY_TITLE=[[/east/i,'East Side'],[/west/i,'West Side'],[/north/i,'North Side'],[/residential/i,'Residential'],[/red[-\s]?light/i,'Red-Light'],[/financial/i,'Financial'],[/city\s*cent/i,'City Center']];
    const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
    const text=e=>e?.textContent?.replace(/\s+/g,' ').trim()||'';
    const int=v=>{const m=String(v??'').replace(/,/g,'').match(/\d+/);return m?+m[0]:null;};
    const onPage=()=>/sid=crimes/i.test(location.href)&&/graffiti/i.test(location.hash||location.href);
    const load=()=>{try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}catch{return {}}};
    const save=d=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(d))}catch{}};
    const getMode=()=>load().mode||'both';
    const setMode=mode=>{const d=load();d.mode=mode;save(d);};
    let observer=null,timer=0,writing=false,active=false;

    function readStats(){
      const d=load(),stats={...(d.stats||{})};let found=false;
      $$('li[class*="statistic" i] button[aria-label]').forEach(btn=>{const label=btn.getAttribute('aria-label')||'';let m;
        if((m=label.match(/^Skill:\s*([\d.]+)/i))){stats.skill=parseFloat(m[1]);found=true;}
        if((m=label.match(/^Enhancer:\s*(.+)/i))){stats.enhancer=m[1].trim();found=true;}
        if((m=label.match(/^Unique outcomes:\s*(\d+)\s*\/\s*(\d+)/i))){stats.uniques=+m[1];stats.uniquesTotal=+m[2];found=true;}
        if((m=label.match(/^Spray Paint\s*:\s*(\w+):\s*(\d+)/i))){stats.cans=stats.cans||{};stats.cans[m[1].toLowerCase()]=+m[2];found=true;}
      });
      if(found){d.stats=stats;save(d);}return stats;
    }
    function readNerve(){for(const el of $$('[class*="nerve" i],[id*="nerve" i]')){const m=text(el).match(/(\d+)\s*\/\s*(\d+)/);if(m)return {current:+m[1],max:+m[2]};}return null;}
    function readCard(card){
      const srcset=$('[class*="crimeOptionImage" i] img',card)?.getAttribute('srcset')||$('[class*="crimeOptionImage" i] img',card)?.src||'';
      const file=(srcset.match(/\/([\w-]+)\.jpg/i)||[])[1]||'';
      let name=BY_IMAGE.find(([re])=>re.test(file))?.[1];
      if(!name){const title=text($('[class*="tabletTitleAndTagCount" i]',card));name=BY_TITLE.find(([re])=>re.test(title))?.[1];}
      if(!name)return null;
      const rep=$('[aria-label*="Reputation" i]',card)?.getAttribute('aria-label')?.match(/Reputation\s+(\d+)\s+out of/i);
      const spray=$('[class*="sprayCanButton" i][aria-label]',card)?.getAttribute('aria-label')?.match(/(\w+)\s+spray selected,\s*(\d+)%\s*left/i);
      return {name,locked:/locked/i.test(card.className),tags:int(text($('[class*="tagsCount" i]',card))?.replace(/\+\d+→\d+|MAX/g,'')),stars:rep?+rep[1]:null,colour:spray?spray[1].toLowerCase():null,paint:spray?+spray[2]:null};
    }
    function tier(tags){if(tags==null)return null;const t=REP_TIERS.find(x=>tags<x);return t?{tier:t,left:t-tags}:null;}
    function ensureStyle(){if(document.getElementById(STYLE_ID))return;const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`.slx-gh-badge{display:inline-block;margin-left:4px;padding:0 3px;border-radius:3px;font:800 9px/13px ui-monospace,monospace;vertical-align:middle;white-space:nowrap;background:rgba(255,255,255,.08)}.slx-gh-rep{color:#ffd56b}.slx-gh-cash{color:#7ee0aa}.slx-gh-progress{color:#b8c6d2}.slx-gh-strip{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:5px 0;padding:6px 7px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(10,15,20,.88);font:700 10px/1.25 Arial;color:#dce5ec}.slx-gh-strip button{padding:2px 5px;border:1px solid #44505b;border-radius:4px;background:#1b2530;color:#e5edf3;font:800 9px Arial}.slx-gh-strip button[data-active="1"]{background:#806326;color:#fff}.slx-gh-alert{color:#ff9090}`;(document.head||document.documentElement).appendChild(st);}
    function setBadge(parent,cls,content){let el=parent.querySelector(`:scope > .${cls.split(' ')[0]}`);if(content==null){el?.remove();return;}if(!el){el=document.createElement('span');parent.appendChild(el);}el.className=cls;if(el.textContent!==content)el.textContent=content;}
    function paintCard(el,mode){const c=readCard(el);if(!c)return;const host=$('[class*="tabletTitleAndTagCount" i]',el)||el;const next=tier(c.tags),hint=HINT[c.name];setBadge(host,'slx-gh-progress slx-gh-badge',next?`+${next.left}→${next.tier}`:(c.tags!=null?'MAX':null));setBadge(host,'slx-gh-rep slx-gh-badge',(mode==='rep'||mode==='both')?`REP ${hint.rep.toUpperCase()}`:null);setBadge(host,'slx-gh-cash slx-gh-badge',(mode==='cash'||mode==='both')?`CASH ${hint.cash.toUpperCase()}`:null);}
    function buildStrip(stats,cards,nerve,mode){const parts=[];const cs=Number.isFinite(stats.skill)?stats.skill:null;parts.push(`<span>CS <b>${cs??'?'}</b></span>`);parts.push(`<span>Enhancer <b>${stats.enhancer||'—'}</b></span>`);parts.push(`<span>Nerve <b>${nerve?nerve.current+'/'+nerve.max:'?'}</b></span>`);if(cs!=null){const gate=CS_GATES.find(([lvl])=>lvl>cs);parts.push(`<span>Next <b>${gate?`CS${gate[0]} ${gate[1]}`:'Complete'}</b></span>`);}if(stats.uniquesTotal!=null)parts.push(`<span>Uniques <b>${stats.uniques||0}/${stats.uniquesTotal}</b></span>`);const alerts=[];cards.filter(c=>!c.locked&&c.paint!=null&&c.paint<=15).forEach(c=>alerts.push(`${c.name.split(' ')[0]} ${c.colour||''} ${c.paint}%${stats.cans?.[c.colour]===0?' no spare':''}`));if(alerts.length)parts.push(`<span class="slx-gh-alert">⚠ ${alerts.join(' · ')}</span>`);return `<button data-gh-mode="both" data-active="${mode==='both'?1:0}">BOTH</button><button data-gh-mode="rep" data-active="${mode==='rep'?1:0}">REP</button><button data-gh-mode="cash" data-active="${mode==='cash'?1:0}">CASH</button>${parts.join('')}`;}
    function cleanup(){document.querySelectorAll('.slx-gh-badge,.slx-gh-strip').forEach(x=>x.remove());}
    function render(){if(!active||!onPage()){cleanup();return;}ensureStyle();const cardEls=$$('[class*="crimeOption___" i],[class*="crimeOption" i]').filter(el=>readCard(el));if(!cardEls.length)return;const stats=readStats(),cards=cardEls.map(readCard).filter(Boolean),nerve=readNerve(),mode=getMode();writing=true;try{cardEls.forEach(el=>paintCard(el,mode));const list=cardEls[0].closest('[class*="virtualItem" i]')?.parentElement||cardEls[0].parentElement;const container=list?.parentElement;if(container){let strip=container.querySelector(':scope > .slx-gh-strip');if(!strip){strip=document.createElement('div');strip.className='slx-gh-strip';container.insertBefore(strip,list);}const html=buildStrip(stats,cards,nerve,mode);if(strip.innerHTML!==html)strip.innerHTML=html;strip.querySelectorAll('[data-gh-mode]').forEach(b=>b.onclick=e=>{e.stopPropagation();setMode(b.dataset.ghMode);queue();});}}finally{writing=false;}}
    function queue(){clearTimeout(timer);timer=setTimeout(render,100);}
    function init(){active=true;ensureStyle();if(!observer){observer=new MutationObserver(records=>{if(writing)return;queue();});observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','class']});}queue();}
    function destroy(){active=false;observer?.disconnect();observer=null;clearTimeout(timer);cleanup();}
    return {init,destroy,onRouteChange:queue};
  }
'''
marker='  function createTargetAlertsModule(context) {'
count=s.count(marker)
if count<1: raise SystemExit('Target Alerts factory marker missing')
s=s.replace(marker,factory+'\n'+marker)

# Add native Graffiti module immediately before Target Alerts in every module registry.
entry='''    {\n      id: "graffitiSprayGuide",\n      name: "Graffiti Spray Guide",\n      category: "Crimes",\n      description: "Inline Graffiti REP/CASH spray hints, progress and low-stock warnings.",\n      ready: true,\n      hideReadyBadge: true,\n      requiresReload: false,\n      factory: createGraffitiSprayGuideModule\n    },\n'''
target='''    {\n      id: "targetAlerts",\n      name: "Target Alerts",\n      category: "Crimes",'''
if target not in s: raise SystemExit('Target Alerts module entry missing after category migration')
s=s.replace(target,entry+target)

# Built-in modules should not display Ready/Coming Soon badges when explicitly hidden.
old='''                        <span class="sakalux-badge ${module.ready ? "sakalux-badge-ready" : "sakalux-badge-pending"}">\n                          ${module.ready ? "Ready" : "Coming Soon"}\n                        </span>'''
new='''                        ${module.hideReadyBadge ? "" : `<span class="sakalux-badge ${module.ready ? "sakalux-badge-ready" : "sakalux-badge-pending"}">\n                          ${module.ready ? "Ready" : "Coming Soon"}\n                        </span>`}'''
if old not in s: raise SystemExit('Ready badge template missing')
s=s.replace(old,new)

p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md');d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.952**','**v0.9.953**',1).replace('Canonical version: **v0.9.952**','Canonical version: **v0.9.953**',1)
entrydoc='''\n### v0.9.953 — Native Crimes tab + Graffiti module\n- Adds a dedicated **Crimes** tab in Master Control.\n- Moves Target Alerts from Lists to Crimes.\n- Makes Graffiti Spray Guide a native Suite module in Crimes with only an ON/OFF switch: no Settings button and no Ready badge.\n- Replaces the appended Graffiti experiment with the working helper DOM contract: crimeOption/card image, tagsCount, Reputation aria-label and sprayCanButton aria-label.\n- Keeps BOTH / REP / CASH hints, reputation tier progress, CS/enhancer/nerve/unique summary and <=15% / no-spare warnings.\n'''
if '### v0.9.953' not in d:
    pos=d.find('\n## Release history / Changelog');d=d[:pos]+entrydoc+d[pos:] if pos>=0 else d+entrydoc
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0953-regression.cjs').write_text(r'''const fs=require('node:fs'),assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.953$/m);for(const x of ['id: "graffitiSprayGuide"','name: "Graffiti Spray Guide"','category: "Crimes"','hideReadyBadge: true','createGraffitiSprayGuideModule','crimeOption___','crimeOptionImage','tagsCount','Reputation','sprayCanButton','BOTH','REP','CASH'])assert.ok(s.includes(x),x);assert.ok(!s.includes('SAKALUX_GRAFFITI_COMBINED_V2'));assert.ok(!s.includes('SAKALUX_GRAFFITI_MASTER_CONTROL_0952'));assert.ok(s.includes('name: "Target Alerts",\n      category: "Crimes"'));assert.ok(!/graffitiSprayGuide[^}]+Settings/s.test(s));console.log('suite 0.9.953 Crimes/Graffiti regression: OK');''',encoding='utf-8')
print('Suite 0.9.953 patch applied', 'targetFactories=',count)
