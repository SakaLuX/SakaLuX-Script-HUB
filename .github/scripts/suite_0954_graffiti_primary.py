from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.953$',r'\g<1>0.9.954',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.953')

# Target Alerts belongs to Lists, not Crimes.
s,n=re.subn(r'(id:\s*"targetAlerts",\s*\n\s*name:\s*"Target Alerts",\s*\n\s*category:\s*)"Crimes"',r'\1"Lists"',s,count=1)
if n!=1: raise SystemExit('Target Alerts category block not found')

# Keep Graffiti as a native Crimes module, but make its description match the primary helper role.
s=s.replace('description: "Inline Graffiti REP/CASH spray hints, progress and low-stock warnings.",','description: "Shows the best spray paint for reputation and cash beside each Graffiti zone.",',1)

start=s.find('  function createGraffitiSprayGuideModule(context) {')
end=s.find('  function createTargetAlertsModule(context) {', start)
if start<0 or end<0: raise SystemExit('Graffiti module function bounds not found')

new_func=r'''  function createGraffitiSprayGuideModule(context) {
    // Primary behaviour follows Torchin's Torn Graffiti Helper (GreasyFork 593486):
    // show best REP/CASH spray colours next to each zone, compact on desktop + TornPDA.
    // The selected-colour match indicator is inspired by the secondary helper (587425).
    const STYLE_ID='sakalux-graffiti-primary-style';
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
    const BY_IMAGE=[
      [/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],
      [/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],
      [/CentreCity|CityCentre|CityCenter/i,'City Center']
    ];
    const BY_TITLE=[
      [/east/i,'East Side'],[/west/i,'West Side'],[/north/i,'North Side'],[/residential/i,'Residential'],
      [/red[-\s]?light/i,'Red-Light'],[/financial/i,'Financial'],[/city\s*cent/i,'City Center']
    ];
    let observer=null,timer=0,active=false,writing=false;

    function onPage(){return /sid=crimes/i.test(location.href)&&/graffiti/i.test(location.hash||location.href);}
    function ensureStyle(){
      if(document.getElementById(STYLE_ID))return;
      const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`
        .slx-graf-primary{display:flex;flex-wrap:wrap;gap:3px 5px;align-items:center;margin-top:2px;max-width:100%;font:800 9px/12px ui-monospace,Menlo,monospace;pointer-events:none}
        .slx-graf-primary .slx-graf-pill{display:inline-flex;align-items:center;gap:3px;padding:1px 4px;border-radius:4px;background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.13);white-space:nowrap}
        .slx-graf-primary .slx-graf-rep{color:#ffd166}.slx-graf-primary .slx-graf-cash{color:#73d99f}
        .slx-graf-primary .slx-graf-match{color:#8cf5ae;border-color:rgba(105,240,150,.55);background:rgba(30,105,60,.28)}
        .slx-graf-primary .slx-graf-selected{color:#cbd5df;font-weight:700}
        @media(max-width:650px){.slx-graf-primary{font-size:8px;line-height:11px;gap:2px 3px}.slx-graf-primary .slx-graf-pill{padding:1px 3px}}
      `;(document.head||document.documentElement).appendChild(st);
    }
    function zone(card){
      const img=$('[class*="crimeOptionImage" i] img',card)||$('img',card);
      const src=(img?.getAttribute('srcset')||img?.src||'');
      const file=(src.match(/\/([\w-]+)\.(?:jpg|png|webp)/i)||[])[1]||'';
      let name=BY_IMAGE.find(([rx])=>rx.test(file))?.[1];
      if(!name){const title=text($('[class*="tabletTitleAndTagCount" i],[class*="title" i]',card)||card);name=BY_TITLE.find(([rx])=>rx.test(title))?.[1];}
      return name||null;
    }
    function selected(card){
      const el=$('[class*="sprayCanButton" i][aria-label],[aria-label*="spray selected" i]',card);
      const label=el?.getAttribute('aria-label')||'';
      const m=label.match(/([a-z]+)\s+spray selected(?:,\s*(\d+)%\s*left)?/i);
      return m?{colour:m[1].toLowerCase(),percent:m[2]?+m[2]:null}:null;
    }
    function cards(){return $$('[class*="crimeOption___" i],[class*="crimeOption" i]').filter(c=>zone(c));}
    function host(card){
      return $('[class*="tabletTitleAndTagCount" i]',card)||$('[class*="crimeOptionTitle" i],[class*="title" i]',card)||card.firstElementChild||card;
    }
    function clean(){document.querySelectorAll('.slx-graf-primary').forEach(x=>x.remove());}
    function paint(card){
      const name=zone(card),best=BEST[name];if(!name||!best)return;
      const h=host(card);if(!h)return;
      const sel=selected(card);
      let box=$(':scope > .slx-graf-primary',h);
      if(!box){box=document.createElement('span');box.className='slx-graf-primary';h.appendChild(box);}
      const repMatch=sel?.colour===best.rep,cashMatch=sel?.colour===best.cash;
      const selectedHint=sel ? (repMatch&&cashMatch?'✓ REP + CASH':repMatch?'✓ REP':cashMatch?'✓ CASH':`selected ${sel.colour}`) : '';
      const selectedClass=(repMatch||cashMatch)?' slx-graf-match':' slx-graf-selected';
      const html=`<span class="slx-graf-pill slx-graf-rep">REP ${best.rep.toUpperCase()}</span><span class="slx-graf-pill slx-graf-cash">CASH ${best.cash.toUpperCase()}</span>${selectedHint?`<span class="slx-graf-pill${selectedClass}">${selectedHint}${sel?.percent!=null?` · ${sel.percent}%`:''}</span>`:''}`;
      if(box.innerHTML!==html)box.innerHTML=html;
    }
    function render(){
      if(!active||!onPage()){clean();return;}
      ensureStyle();const list=cards();if(!list.length)return;
      writing=true;try{list.forEach(paint);}finally{observer?.takeRecords?.();writing=false;}
    }
    function schedule(){if(writing)return;clearTimeout(timer);timer=setTimeout(render,120);}
    function init(){
      active=true;render();
      if(!observer){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','class']});}
      window.addEventListener('hashchange',schedule,{passive:true});window.addEventListener('popstate',schedule,{passive:true});
    }
    function destroy(){active=false;clearTimeout(timer);observer?.disconnect();observer=null;clean();document.getElementById(STYLE_ID)?.remove();}
    return {init,destroy,onRouteChange:schedule};
  }

'''
s=s[:start]+new_func+s[end:]

# Graffiti is internal: never show a Settings button for it, and no READY badge is already controlled by hideReadyBadge.
# Keep exact compact module UI logic unchanged elsewhere.

p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md')
d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.953**','**v0.9.954**',1).replace('Canonical version: **v0.9.953**','Canonical version: **v0.9.954**',1)
entry='''\n### v0.9.954 — Graffiti primary-helper UI + Target Alerts back to Lists\n- Moves **Target Alerts** back to **Lists**.\n- Keeps **Graffiti Spray Guide** under **Crimes** as a built-in Suite module with ON/OFF only (no Settings, no Ready badge).\n- Rebuilds Graffiti presentation around the primary Torchin helper concept: compact per-zone **REP** and **CASH** best-colour hints instead of the BOTH/REP/CASH mode bar.\n- Adds only the useful secondary-helper cue: the currently selected spray is marked `✓ REP`, `✓ CASH`, or `✓ REP + CASH` when it matches the recommended colour.\n- Removes the large CS/enhancer/nerve/uniques strip and tag-progress overlays that were obscuring zone names on TornPDA.\n- Uses the same seven-zone colour guidance documented by the Torn Graffiti guide.\n'''
if '### v0.9.954' not in d:
    pos=d.find('\n## Release history / Changelog')
    d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0954-regression.cjs').write_text(r'''const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.954$/m);assert.match(s,/id:\s*"targetAlerts"[\s\S]{0,100}category:\s*"Lists"/);assert.match(s,/id:\s*"graffitiSprayGuide"[\s\S]{0,150}category:\s*"Crimes"/);for(const x of ['REP ${best.rep.toUpperCase()}','CASH ${best.cash.toUpperCase()}','✓ REP','✓ CASH','crimeOption___','spray selected'])assert.ok(s.includes(x),x);assert.ok(!s.includes('const getMode=()=>load().mode'));assert.ok(!s.includes('slx-gh-strip'));console.log('suite graffiti 0.9.954 regression: OK');''',encoding='utf-8')
print('Suite v0.9.954 patch prepared')
