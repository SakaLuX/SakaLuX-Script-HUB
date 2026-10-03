from pathlib import Path

suite_path=Path('SakaLuX-Suite.user.js')
test_path=Path('tests/suite-daily-progress-regression.cjs')
md_path=Path('greasyfork/SakaLuX-Suite.md')

suite=suite_path.read_text(encoding='utf-8')
suite=suite.replace('// @version      0.9.970','// @version      0.9.971',1)
suite=suite.replace("const VERSION = '0.9.970';\n  const SUITE = Object.freeze","const VERSION = '0.9.971';\n  const SUITE = Object.freeze",1)
suite=suite.replace("const API_VERSION = '2.1.0';","const API_VERSION = '2.1.1';",1)
suite=suite.replace('/* SakaLuX Smart Daily Checklist v2.1.0 — v0.9.970 */','/* SakaLuX Smart Daily Checklist v2.1.1 — v0.9.971 */',1)

old_logs="""      if(/wheel of lame/.test(text)) hit('wheel_lame');
      if(/wheel of mediocrity/.test(text)) hit('wheel_mediocrity');
      if(/wheel of awesome/.test(text)) hit('wheel_awesome');"""
new_logs="""      const wheelish=/wheel|spin|casino/.test(text);
      if(/wheel of lame|wheel[_ -]?lame|(?:wheel|type|name)[^a-z0-9]{0,8}lame|lame[^a-z0-9]{0,8}(?:wheel|spin)/.test(text) || (wheelish && /[\"']lame[\"']/.test(text))) hit('wheel_lame');
      if(/wheel of mediocrity|wheel[_ -]?mediocrity|(?:wheel|type|name)[^a-z0-9]{0,8}mediocrity|mediocrity[^a-z0-9]{0,8}(?:wheel|spin)/.test(text) || (wheelish && /[\"']mediocrity[\"']/.test(text))) hit('wheel_mediocrity');
      if(/wheel of awesome|wheel[_ -]?awesome|(?:wheel|type|name)[^a-z0-9]{0,8}awesome|awesome[^a-z0-9]{0,8}(?:wheel|spin)/.test(text) || (wheelish && /[\"']awesome[\"']/.test(text))) hit('wheel_awesome');"""
if old_logs in suite:
    suite=suite.replace(old_logs,new_logs,1)
elif 'wheel[_ -]?lame' not in suite:
    raise SystemExit('wheel log matcher not found')

anchor="""  function getApiKey(){
"""
helpers=r'''  function wheelIdFromText(value){
    const text=String(value||'').toLowerCase();
    if(/wheel of lame|\blame\b/.test(text)) return 'wheel_lame';
    if(/wheel of mediocrity|\bmediocrity\b/.test(text)) return 'wheel_mediocrity';
    if(/wheel of awesome|\bawesome\b/.test(text)) return 'wheel_awesome';
    return '';
  }
  function isWheelPage(){ return /(?:loader\.php.*sid=spinthewheel|sid=spinthewheel|spin.?the.?wheel)/i.test(String(location.href)); }
  function activeWheelFromDom(startEl=null){
    const fromUrl=wheelIdFromText(location.href); if(fromUrl) return fromUrl;
    let el=startEl;
    for(let i=0;el&&i<6;i++,el=el.parentElement){ const id=wheelIdFromText(el.textContent); if(id && String(el.textContent||'').length<2500) return id; }
    const active=[...document.querySelectorAll('[aria-selected="true"],.active,.selected,[data-active="true"]')];
    for(const node of active){ const id=wheelIdFromText(node.textContent); if(id) return id; }
    const headings=[...document.querySelectorAll('h1,h2,h3,h4,[role="tab"],button')];
    const visible=headings.filter(x=>{ try{const s=getComputedStyle(x);return s.display!=='none'&&s.visibility!=='hidden';}catch{return true;} });
    const ids=[...new Set(visible.map(x=>wheelIdFromText(x.textContent)).filter(Boolean))];
    return ids.length===1?ids[0]:'';
  }
  function markWheelDone(id,detail='Detected on Spin The Wheel page'){
    if(!/^wheel_(?:lame|mediocrity|awesome)$/.test(String(id))) return false;
    setTask(id,{status:'done',source:'wheel-page',detail}); return true;
  }
  function scanWheelPage(){
    if(!isWheelPage()) return false;
    let changed=false;
    const names={wheel_lame:/wheel of lame|\blame\b/i,wheel_mediocrity:/wheel of mediocrity|\bmediocrity\b/i,wheel_awesome:/wheel of awesome|\bawesome\b/i};
    const stateRx=/already (?:spun|used|played)|spun (?:it )?today|come back (?:again )?tomorrow|available (?:again )?(?:in|tomorrow)|next spin|try again tomorrow|used today|played today/i;
    const nodes=[...document.querySelectorAll('section,article,div,li,tr')];
    for(const [id,nameRx] of Object.entries(names)){
      let best=null;
      for(const node of nodes){ const txt=String(node.textContent||'').trim(); if(txt.length<20||txt.length>2200||!nameRx.test(txt)||!stateRx.test(txt)) continue; if(!best||txt.length<String(best.textContent||'').length) best=node; }
      if(best){ markWheelDone(id,'Wheel already spun today'); changed=true; }
    }
    const current=activeWheelFromDom();
    if(current){
      const buttons=[...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"]')];
      const spin=buttons.find(b=>/\bspin\b/i.test(String(b.textContent||b.value||'')));
      if(spin && (spin.disabled || spin.getAttribute('aria-disabled')==='true')){ markWheelDone(current,'Spin unavailable — already used today'); changed=true; }
    }
    return changed;
  }
  function bindWheelDetection(){
    if(g.__sakaluxSuiteWheelDetectionBound) return;
    g.__sakaluxSuiteWheelDetectionBound=true;
    document.addEventListener('click',e=>{
      if(!isWheelPage()) return;
      const btn=e.target?.closest?.('button,[role="button"],input[type="button"],input[type="submit"],a'); if(!btn) return;
      const label=String(btn.textContent||btn.value||'').trim();
      if(!/^spin\b/i.test(label)) return;
      const id=activeWheelFromDom(btn); if(id) markWheelDone(id,'SPIN action detected on Torn');
      setTimeout(scanWheelPage,800); setTimeout(scanWheelPage,3500);
    },true);
    const run=()=>{ if(isWheelPage()) scanWheelPage(); };
    run();
    try{ new MutationObserver(()=>{ if(isWheelPage()) { clearTimeout(g.__sakaluxWheelScanTimer); g.__sakaluxWheelScanTimer=setTimeout(scanWheelPage,200); } }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','aria-disabled','class']}); }catch{}
  }

'''
if 'function wheelIdFromText(' not in suite:
    if anchor not in suite: raise SystemExit('getApiKey anchor not found')
    suite=suite.replace(anchor,helpers+anchor,1)

old_init="const init=()=>{ensureBridge();bindToolbarAction();observeRoutes();setTimeout(()=>refreshApi(false),2500);};"
new_init="const init=()=>{ensureBridge();bindToolbarAction();bindWheelDetection();observeRoutes();setTimeout(()=>refreshApi(false),2500);setTimeout(scanWheelPage,900);};"
if old_init in suite:
    suite=suite.replace(old_init,new_init,1)
elif 'bindWheelDetection();observeRoutes()' not in suite:
    raise SystemExit('init hook not found')

old_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey"
new_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey,wheelIdFromText,activeWheelFromDom,scanWheelPage"
if old_api in suite:
    suite=suite.replace(old_api,new_api,1)
elif 'scanWheelPage' not in suite.split('g.SakaLuXSuiteDailyProgress=Object.freeze(',1)[-1].split('});',1)[0]:
    raise SystemExit('public API hook not found')

suite_path.write_text(suite,encoding='utf-8')

test=test_path.read_text(encoding='utf-8')
test=test.replace(r'0\.9\.970',r'0\.9\.971',1)
test=test.replace("const VERSION = '0.9.970';","const VERSION = '0.9.971';",1)
test=test.replace("assert.equal(api.version,'2.1.0');","assert.equal(api.version,'2.1.1');",1)
needle="api.applyApiSnapshot('casino',{casino:{tokens:0,streak:4}});\nassert.equal(api.summary().objectives.find(x=>x.id==='casino').status,'done','zero remaining casino tokens auto-completes');"
extra=needle+"\napi.applyApiSnapshot('logs',{log:[{details:{title:'Casino spin'},data:{wheel:'lame'}}]}); assert.equal(api.summary().objectives.find(x=>x.id==='wheel_lame').status,'done','Wheel of Lame completes from structured spin log');\nwindow.history.pushState({},'', '/loader.php?sid=spinTheWheel'); window.document.body.insertAdjacentHTML('beforeend','<div class=\"wheel-card selected\"><h2>Wheel of Awesome</h2><button id=\"spin-awesome\">SPIN</button></div>'); window.document.getElementById('spin-awesome').click(); assert.equal(api.summary().objectives.find(x=>x.id==='wheel_awesome').status,'done','Wheel of Awesome completes from real SPIN click without Full Access logs');"
if needle in test and 'Wheel of Awesome completes from real SPIN click' not in test:
    test=test.replace(needle,extra,1)
test_path.write_text(test,encoding='utf-8')

md=md_path.read_text(encoding='utf-8')
md=md.replace('**v0.9.970**','**v0.9.971**',1)
md=md.replace('- Canonical version: **v0.9.970**','- Canonical version: **v0.9.971**',1)
start='**v0.9.970 — Smart Daily Checklist 28/28 auto-detection accuracy pass**'
if start in md:
    a=md.index(start); b=md.find('\n## Release history / Changelog',a)
    if b!=-1:
        md=md[:a]+"""**v0.9.971 — Daily Wheels auto-detection hotfix**
- Fixes Wheel of Lame / Mediocrity / Awesome remaining at SYNC when Torn log access is unavailable or the log payload uses structured wheel names.
- Detects actual SPIN clicks on the Torn Spin The Wheel page and marks only the selected wheel as DONE.
- Also detects already-spun / next-spin / disabled states directly from the wheel page, without requiring Full Access API logs.
- Expands wheel log matching for structured `wheel: lame|mediocrity|awesome` payloads while avoiding false completion from merely opening the casino page.
"""+md[b:]
hist='## Release history / Changelog\n'
entry="""
### v0.9.971 — Daily Wheels auto-detection hotfix
- Adds DOM-level wheel state detection and real SPIN-action tracking for all three Leslie wheels.
- Keeps API-log detection as an additional source, with broader matching for structured log payloads.

"""
if entry.strip() not in md: md=md.replace(hist,hist+'\n'+entry,1)
md_path.write_text(md,encoding='utf-8')
