from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.955$',r'\g<1>0.9.956',s,count=1)
if n!=1: raise SystemExit('Expected Suite 0.9.955')

start=s.find('  function createGraffitiSprayGuideModule(context) {')
end=s.find('  function createTargetAlertsModule(context) {', start)
if start<0 or end<0: raise SystemExit('Graffiti module bounds not found')

new_func=r'''  function createGraffitiSprayGuideModule(context) {
    // v0.9.956: compact TornPDA-first advisor. Recommendations live on the spray control,
    // not the title/stars area. Selected-colour and remaining-paint parsing is defensive.
    const STYLE_ID='sakalux-graffiti-pro-style';
    const $=(q,r=document)=>r.querySelector(q), $$=(q,r=document)=>[...r.querySelectorAll(q)];
    const text=e=>e?.textContent?.replace(/\s+/g,' ').trim()||'';
    const BEST={
      'East Side':{cash:'purple',rep:'red'},'West Side':{cash:'green',rep:'blue'},'North Side':{cash:'green',rep:'orange'},
      'Residential':{cash:'white',rep:'blue'},'Red-Light':{cash:'green',rep:'pink'},'Financial':{cash:'black',rep:'red'},'City Center':{cash:'green',rep:'blue'}
    };
    const COLOURS=['red','blue','orange','white','pink','black','green','purple'];
    const COLOUR={red:'#e34b4b',blue:'#4f86e8',orange:'#e89a3d',white:'#f1f3f5',pink:'#df72b7',black:'#25272a',green:'#58b875',purple:'#9868cf'};
    const BY_IMAGE=[[/EastSide/i,'East Side'],[/WestSide/i,'West Side'],[/NorthSide/i,'North Side'],[/Resident[ai]l/i,'Residential'],[/RedLight|Red-Light/i,'Red-Light'],[/Financial/i,'Financial'],[/CentreCity|CityCentre|CityCenter/i,'City Center']];
    const BY_TITLE=[[/east/i,'East Side'],[/west/i,'West Side'],[/north/i,'North Side'],[/residential/i,'Residential'],[/red[-\s]?light/i,'Red-Light'],[/financial/i,'Financial'],[/city\s*cent/i,'City Center']];
    let observer=null,timer=0,active=false,writing=false;

    function onPage(){return /sid=crimes/i.test(location.href)&&/graffiti/i.test(location.hash||location.href);}
    function ensureStyle(){
      if(document.getElementById(STYLE_ID))return;
      const st=document.createElement('style');st.id=STYLE_ID;st.textContent=`
        .slx-graf-spray-host{position:relative!important}
        .slx-graf-spray-advisor{position:absolute;left:3px;top:3px;display:flex;flex-direction:column;gap:2px;z-index:4;pointer-events:none;font:800 7px/11px ui-monospace,Menlo,monospace;text-shadow:0 1px 1px #000}
        .slx-graf-spray-chip{display:inline-flex;align-items:center;justify-content:center;gap:2px;min-width:27px;height:12px;padding:0 3px;border-radius:3px;border:1px solid rgba(255,255,255,.22);background:rgba(8,10,13,.82);box-sizing:border-box;color:#eef3f7}
        .slx-graf-spray-dot{width:6px;height:6px;border-radius:50%;border:1px solid rgba(255,255,255,.45);box-sizing:border-box;flex:0 0 6px}
        .slx-graf-spray-chip[data-kind="rep"]{color:#f4d371}.slx-graf-spray-chip[data-kind="cash"]{color:#7ae0a6}
        .slx-graf-spray-chip.slx-match{border-color:#55e690;box-shadow:0 0 0 1px rgba(85,230,144,.25),0 0 5px rgba(85,230,144,.35);color:#8ff4b6;background:rgba(20,85,48,.72)}
        .slx-graf-low-pct{color:#ff8e8e!important;text-shadow:0 0 4px rgba(255,40,40,.35)!important;box-shadow:inset 0 0 0 1px rgba(255,85,85,.65)!important;border-radius:4px!important}
        @media(max-width:650px){.slx-graf-spray-advisor{left:2px;top:2px;gap:1px}.slx-graf-spray-chip{min-width:24px;height:11px;padding:0 2px;font-size:6px}.slx-graf-spray-dot{width:5px;height:5px;flex-basis:5px}}
      `;(document.head||document.documentElement).appendChild(st);
    }
    function zone(card){
      const img=$('[class*="crimeOptionImage" i] img',card)||$('img',card);const src=img?.getAttribute('srcset')||img?.src||'';const file=(src.match(/\/([\w-]+)\.(?:jpg|jpeg|png|webp)/i)||[])[1]||'';
      let name=BY_IMAGE.find(([rx])=>rx.test(file))?.[1];if(!name){const title=text($('[class*="tabletTitleAndTagCount" i],[class*="crimeOptionTitle" i],[class*="title" i]',card)||card);name=BY_TITLE.find(([rx])=>rx.test(title))?.[1];}return name||null;
    }
    function sprayHost(card){
      const btn=$('[class*="sprayCanButton" i]',card)||$('[aria-label*="spray" i]',card);if(!btn)return null;
      return btn.closest('[class*="sprayCan" i],[class*="spray" i],button')||btn;
    }
    function selected(card){
      const h=sprayHost(card);if(!h)return null;
      const els=[h,...$$('[aria-label],[title],img',h)];
      const blob=els.map(el=>[el.getAttribute?.('aria-label'),el.getAttribute?.('title'),el.getAttribute?.('alt'),el.getAttribute?.('src'),el.getAttribute?.('srcset'),text(el)].filter(Boolean).join(' ')).join(' ').toLowerCase();
      let colour=COLOURS.find(c=>new RegExp(`\\b${c}\\b`,'i').test(blob))||null;
      let pm=blob.match(/(\d{1,3})\s*%/);let percent=pm?+pm[1]:null;
      if(percent==null){
        const area=h.parentElement||card;for(const el of $$('*',area)){const t=text(el);const m=t.match(/^\s*(\d{1,3})\s*%\s*$/);if(m){percent=+m[1];break;}}
      }
      if(!colour){
        const img=$('img',h);const src=(img?.getAttribute('src')||img?.getAttribute('srcset')||img?.getAttribute('alt')||'').toLowerCase();colour=COLOURS.find(c=>src.includes(c))||null;
      }
      return {colour,percent,host:h};
    }
    function cards(){return $$('[class*="crimeOption___" i],[class*="crimeOption" i]').filter(c=>zone(c));}
    function dot(c){const border=c==='white'?'#8f979e':'rgba(255,255,255,.45)';return `<i class="slx-graf-spray-dot" style="background:${COLOUR[c]};border-color:${border}"></i>`;}
    function chip(kind,c,match){return `<span class="slx-graf-spray-chip${match?' slx-match':''}" data-kind="${kind}" title="${kind==='rep'?'Reputation':'Cash'}: ${c}">${dot(c)}${match?'✓':''}${kind==='rep'?'★':'$'}${c[0].toUpperCase()}</span>`;}
    function clearLow(card){$$('.slx-graf-low-pct',card).forEach(x=>x.classList.remove('slx-graf-low-pct'));}
    function markLow(card,percent,host){
      clearLow(card);if(percent==null||percent>15)return;
      const scope=host?.parentElement||card;const pct=$$('*',scope).find(el=>text(el).match(new RegExp(`^\\s*${percent}\\s*%\\s*$`)));
      (pct||host)?.classList.add('slx-graf-low-pct');
    }
    function clean(){document.querySelectorAll('.slx-graf-spray-advisor').forEach(x=>x.remove());document.querySelectorAll('.slx-graf-spray-host').forEach(x=>x.classList.remove('slx-graf-spray-host'));document.querySelectorAll('.slx-graf-low-pct').forEach(x=>x.classList.remove('slx-graf-low-pct'));}
    function paint(card){
      const name=zone(card),best=BEST[name],sel=selected(card);if(!name||!best||!sel?.host)return;
      const h=sel.host;h.classList.add('slx-graf-spray-host');let box=h.querySelector(':scope > .slx-graf-spray-advisor');if(!box){box=document.createElement('span');box.className='slx-graf-spray-advisor';h.appendChild(box);}
      const repMatch=sel.colour===best.rep,cashMatch=sel.colour===best.cash;const html=chip('rep',best.rep,repMatch)+chip('cash',best.cash,cashMatch);if(box.innerHTML!==html)box.innerHTML=html;markLow(card,sel.percent,h);
    }
    function render(){if(!active||!onPage()){clean();return;}ensureStyle();const list=cards();if(!list.length)return;writing=true;try{list.forEach(paint);}finally{observer?.takeRecords?.();writing=false;}}
    function schedule(){if(writing)return;clearTimeout(timer);timer=setTimeout(render,100);}
    function init(){active=true;render();if(!observer){observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','class','src','srcset']});}window.addEventListener('hashchange',schedule,{passive:true});window.addEventListener('popstate',schedule,{passive:true});}
    function destroy(){active=false;clearTimeout(timer);observer?.disconnect();observer=null;clean();document.getElementById(STYLE_ID)?.remove();}
    return {init,destroy,onRouteChange:schedule};
  }

'''
s=s[:start]+new_func+s[end:]
p.write_text(s,encoding='utf-8')

doc=Path('greasyfork/SakaLuX-Suite.md');d=doc.read_text(encoding='utf-8')
d=d.replace('**v0.9.955**','**v0.9.956**',1).replace('Canonical version: **v0.9.955**','Canonical version: **v0.9.956**',1)
entry='''\n### v0.9.956 — Graffiti selected-spray + low-percent reliability\n- Moves Graffiti recommendations onto the spray control itself so Torn's reputation stars remain fully visible.\n- Makes selected spray detection tolerant of TornPDA label/text/image variants instead of relying on one exact aria-label sentence.\n- Correctly marks the matching REP/CASH recommendation with a green check.\n- Detects the visible remaining percentage as a fallback and highlights Torn's own percentage display at 15% or below instead of adding another overlapping warning row.\n- Keeps the advisor compact and read-only.\n'''
if '### v0.9.956' not in d:
    pos=d.find('\n## Release history / Changelog');d=d[:pos]+entry+d[pos:] if pos>=0 else d+entry
doc.write_text(d,encoding='utf-8')

Path('tests/suite-graffiti-0956-regression.cjs').write_text(r'''const fs=require('node:fs'),assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\/\/\s*@version\s+0\.9\.956$/m);for(const x of ['slx-graf-spray-advisor','slx-graf-spray-host','slx-graf-low-pct','COLOURS.find','aria-label','srcset','percent>15','✓','sprayHost(card)'])assert.ok(s.includes(x),x);assert.ok(!s.includes('slx-graf-pro-advisor'));console.log('suite graffiti 0.9.956 regression: OK');''',encoding='utf-8')
print('Suite v0.9.956 patch prepared')
