from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.954$',r'\g<1>0.9.955',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.954')

start=s.find('  function createGraffitiSprayGuideModule(context) {')
end=s.find('  function createTargetAlertsModule(context) {', start)
if start<0 or end<0: raise SystemExit('Graffiti module bounds not found')

new_func=r'''  function createGraffitiSprayGuideModule(context) {
    // Professional hybrid of the two requested Graffiti helpers:
    // 593486 drives the compact best-spray recommendations; 587425 contributes
    // selected-colour feedback and low-paint awareness. Read-only, no API/autoclick.
    const STYLE_ID='sakalux-graffiti-pro-style';
    const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
    const text=e=>e?.textContent?.replace(/\s+/g,' ').trim()||'';
    const BEST={
      'East Side':{cash:'purple',rep:'red'},
      'West Side':{cash:'green',rep:'blue'},
      'North Side':{cash:'green',rep:'orange'},
      'Residential':{cash:'white',rep:'blue'},
      'Red-Light':{cash:'green',rep:'pink'},
      'Financial':{cash:'black',rep:'red'},
      'City Center':{cash:'green',rep:'blue'}
    };
    const COLOUR={red:'#e34b4b',blue:'#4f86e8',orange:'#e89a3d',white:'#f1f3f5',pink:'#df72b7',black:'#25272a',green:'#58b875',purple:'#9868cf'};
    const BY_IMAGE=[[/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],[/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],[/CentreCity|CityCentre|CityCenter/i,'City Center']];
    const BY_TITLE=[[/east/i,'East Side'],[/west/i,'West Side'],[/north/i,'North Side'],[/residential/i,'Residential'],[/red[-\s]?light/i,'Red-Light'],[/financial/i,'Financial'],[/city\s*cent/i,'City Center']];
    let observer=null,timer=0,active=false,writing=false;

    function onPage(){return /sid=crimes/i.test(location.href)&&/graffiti/i.test(location.hash||location.href);}
    function ensureStyle(){
      if(document.getElementById(STYLE_ID))return;
      const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`
        .slx-graf-pro-host{position:relative!important}
        .slx-graf-pro-advisor{position:absolute;left:36px;bottom:1px;display:flex;align-items:center;gap:3px;max-width:calc(100% - 38px);white-space:nowrap;pointer-events:none;z-index:2;font:800 8px/12px ui-monospace,Menlo,monospace}
        .slx-graf-pro-chip{display:inline-flex;align-items:center;gap:3px;height:14px;padding:0 4px;border:1px solid rgba(255,255,255,.16);border-radius:4px;background:rgba(10,13,17,.78);box-sizing:border-box;color:#cdd5dc;text-shadow:0 1px 1px #000}
        .slx-graf-pro-swatch{width:7px;height:7px;border-radius:50%;box-sizing:border-box;border:1px solid rgba(255,255,255,.35);flex:0 0 7px}
        .slx-graf-pro-chip[data-kind="rep"]{color:#f2cc67}.slx-graf-pro-chip[data-kind="cash"]{color:#76d8a0}
        .slx-graf-pro-chip.slx-match{border-color:rgba(94,218,139,.75);box-shadow:inset 0 0 0 1px rgba(94,218,139,.18);color:#8af0b0}
        .slx-graf-pro-low{display:inline-flex;align-items:center;height:14px;padding:0 4px;border-radius:4px;border:1px solid rgba(255,100,100,.55);background:rgba(120,30,30,.38);color:#ffaaaa}
        [class*="crimeOption" i][class*="locked" i] .slx-graf-pro-advisor{opacity:.48}
        @media(max-width:650px){.slx-graf-pro-advisor{left:32px;gap:2px;font-size:7px;line-height:11px;bottom:1px}.slx-graf-pro-chip,.slx-graf-pro-low{height:13px;padding:0 3px}.slx-graf-pro-swatch{width:6px;height:6px;flex-basis:6px}}
      `;(document.head||document.documentElement).appendChild(st);
    }
    function zone(card){
      const img=$('[class*="crimeOptionImage" i] img',card)||$('img',card);
      const src=img?.getAttribute('srcset')||img?.src||'';
      const file=(src.match(/\/([\w-]+)\.(?:jpg|jpeg|png|webp)/i)||[])[1]||'';
      let name=BY_IMAGE.find(([rx])=>rx.test(file))?.[1];
      if(!name){const title=text($('[class*="tabletTitleAndTagCount" i],[class*="crimeOptionTitle" i],[class*="title" i]',card)||card);name=BY_TITLE.find(([rx])=>rx.test(title))?.[1];}
      return name||null;
    }
    function selected(card){
      const el=$('[class*="sprayCanButton" i][aria-label],[aria-label*="spray selected" i]',card);
      const label=el?.getAttribute('aria-label')||'';
      const m=label.match(/([a-z]+)\s+spray selected(?:,\s*(\d+)%\s*left)?/i);
      return m?{colour:m[1].toLowerCase(),percent:m[2]?+m[2]:null}:null;
    }
    function cards(){return $$('[class*="crimeOption___" i],[class*="crimeOption" i]').filter(c=>zone(c));}
    function host(card){return $('[class*="tabletTitleAndTagCount" i]',card)||$('[class*="crimeOptionTitle" i],[class*="title" i]',card)||null;}
    function clean(){document.querySelectorAll('.slx-graf-pro-advisor').forEach(x=>x.remove());document.querySelectorAll('.slx-graf-pro-host').forEach(x=>x.classList.remove('slx-graf-pro-host'));}
    function swatch(colour){const c=COLOUR[colour]||colour;const border=colour==='white'?'#9da5ad':'rgba(255,255,255,.35)';return `<i class="slx-graf-pro-swatch" style="background:${c};border-color:${border}"></i>`;}
    function chip(kind,colour,match){const icon=kind==='rep'?'★':'$';return `<span class="slx-graf-pro-chip${match?' slx-match':''}" data-kind="${kind}">${swatch(colour)}${match?'✓ ':''}${icon} ${colour.toUpperCase()}</span>`;}
    function paint(card){
      const name=zone(card),best=BEST[name],h=host(card);if(!name||!best||!h)return;
      h.classList.add('slx-graf-pro-host');
      const sel=selected(card),repMatch=sel?.colour===best.rep,cashMatch=sel?.colour===best.cash;
      let box=h.querySelector(':scope > .slx-graf-pro-advisor');if(!box){box=document.createElement('span');box.className='slx-graf-pro-advisor';h.appendChild(box);}
      const low=sel?.percent!=null&&sel.percent<=15?`<span class="slx-graf-pro-low">LOW ${sel.percent}%</span>`:'';
      const html=chip('rep',best.rep,repMatch)+chip('cash',best.cash,cashMatch)+low;
      if(box.innerHTML!==html)box.innerHTML=html;
    }
    function render(){if(!active||!onPage()){clean();return;}ensureStyle();const list=cards();if(!list.length)return;writing=true;try{list.forEach(paint);}finally{observer?.takeRecords?.();writing=false;}}
    function schedule(){if(writing)return;clearTimeout(timer);timer=setTimeout(render,120);}
    function init(){active=true;render();if(!observer){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','class','src','srcset']});}window.addEventListener('hashchange',schedule,{passive:true});window.addEventListener('popstate',schedule,{passive:true});}
    function destroy(){active=false;clearTimeout(timer);observer?.disconnect();observer=null;clean();document.getElementById(STYLE_ID)?.remove();}
    return {init,destroy,onRouteChange:schedule};
  }

'''
s=s[:start]+new_func+s[end:]
p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.954**','**v0.9.955**',1).replace('Canonical version: **v0.9.954**','Canonical version: **v0.9.955**',1)
entry='''\n### v0.9.955 — Professional Graffiti Advisor\n- Reworks Graffiti into a compact, non-overlapping advisor designed for TornPDA.\n- Keeps the primary helper's best REP/CASH colour recommendations for all seven zones.\n- Uses colour swatches plus concise `★ REP` / `$ CASH` chips instead of extra text rows, so Torn's zone names and controls remain visible.\n- Highlights the recommendation when the currently selected spray matches and adds a compact `LOW xx%` warning at 15% or less.\n- Removes the extra selected-colour pill, large summary bars, progress overlays and mode controls.\n- Remains read-only with no API calls or gameplay automation.\n'''
if '### v0.9.955' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0955-regression.cjs').write_text(r'''const fs=require('node:fs'),assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.955$/m);assert.match(s,/id:\s*"targetAlerts"[\s\S]{0,100}category:\s*"Lists"/);assert.match(s,/id:\s*"graffitiSprayGuide"[\s\S]{0,150}category:\s*"Crimes"/);for(const x of ['slx-graf-pro-advisor','slx-graf-pro-chip','slx-graf-pro-swatch','position:absolute','LOW ${sel.percent}%','★','$','spray selected'])assert.ok(s.includes(x),x);for(const c of ['purple','red','green','blue','orange','white','pink','black'])assert.ok(s.includes(`'${c}'`)||s.includes(`:${c}`)||s.includes(`${c}:`),c);assert.ok(!s.includes('slx-graf-primary'));assert.ok(!s.includes('slx-gh-strip'));console.log('suite graffiti 0.9.955 professional regression: OK');''',encoding='utf-8')
print('Suite v0.9.955 professional Graffiti patch prepared')
