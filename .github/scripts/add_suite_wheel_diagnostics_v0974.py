from pathlib import Path

suite=Path('SakaLuX-Suite.user.js')
test=Path('tests/suite-daily-progress-regression.cjs')
doc=Path('greasyfork/SakaLuX-Suite.md')

s=suite.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.973','// @version      0.9.974',1)
s=s.replace("const VERSION = '0.9.973';\n  const SUITE = Object.freeze","const VERSION = '0.9.974';\n  const SUITE = Object.freeze",1)
s=s.replace("const API_VERSION = '2.1.3';","const API_VERSION = '2.1.4';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.3 — v0.9.973 */','/* SakaLuX Smart Daily Checklist v2.1.4 — v0.9.974 */',1)

old_state="const state = { showCompleted:true, filter:'all', syncing:false, apiError:'', lastApiAt:0, lastData:{}, logTypes:{} };"
new_state="const state = { showCompleted:true, filter:'all', syncing:false, apiError:'', lastApiAt:0, lastData:{}, logTypes:{}, endpointErrors:{} };"
if old_state not in s: raise SystemExit('state anchor missing')
s=s.replace(old_state,new_state,1)

old_results="results.forEach((r,i)=>{ const name=entries[i][0]; if(r.status==='fulfilled'){ok++;state.lastData[name]=r.value;try{interpretV3(name,r.value);}catch(e){if(name!=='logs')err=String(e?.message||e);}} else if(name!=='logs') err=String(r.reason?.message||r.reason||'API error'); });"
new_results="""results.forEach((r,i)=>{ const name=entries[i][0]; if(r.status==='fulfilled'){ok++;state.lastData[name]=r.value;delete state.endpointErrors[name];try{interpretV3(name,r.value);}catch(e){const msg=String(e?.message||e);state.endpointErrors[name]='interpret: '+msg;if(name!=='logs'&&name!=='events'&&name!=='logtypes')err=msg;}} else {const msg=String(r.reason?.message||r.reason||'API error');state.endpointErrors[name]=msg;if(name!=='logs'&&name!=='events'&&name!=='logtypes')err=msg;} });"""
if old_results not in s: raise SystemExit('refresh results anchor missing')
s=s.replace(old_results,new_results,1)

anchor="""  function applyLogCompletion(data){
"""
diag=r'''  function endpointShape(name){
    const d=state.lastData?.[name];
    if(d==null) return null;
    if(Array.isArray(d)) return {type:'array',length:d.length};
    if(typeof d!=='object') return {type:typeof d};
    const out={type:'object',keys:Object.keys(d).slice(0,20)};
    const raw=d?.log ?? d?.logs ?? d?.events ?? d?.logtypes ?? d?.data?.log ?? d?.data?.logs ?? d?.data?.events ?? d?.data?.logtypes;
    if(Array.isArray(raw)) out.rows=raw.length;
    else if(raw&&typeof raw==='object') out.rows=Object.keys(raw).length;
    return out;
  }
  function wheelDiagnostics(){
    const day=get();
    const wheels=['wheel_lame','wheel_mediocrity','wheel_awesome'].map(id=>({id,status:day.tasks?.[id]?.status||'pending',source:day.tasks?.[id]?.source||'',detail:day.tasks?.[id]?.detail||'',updatedAt:day.tasks?.[id]?.updatedAt||0}));
    const rawLogs=state.lastData?.logs?.log ?? state.lastData?.logs?.logs ?? state.lastData?.logs?.data?.log ?? state.lastData?.logs?.data?.logs ?? [];
    const logs=Array.isArray(rawLogs)?rawLogs:(rawLogs&&typeof rawLogs==='object'?Object.values(rawLogs):[]);
    const logCandidates=logs.map(row=>{const id=String(row?.log ?? row?.log_id ?? '');const mapped=state.logTypes[id]||'';return {id,timestamp:Number(row?.timestamp??row?.time??0)||0,mappedTitle:mapped,wheelWord:/wheel|spin|lame|mediocrity|awesome/i.test(mapped+' '+deepText(row))};}).filter(x=>x.wheelWord).slice(0,20);
    const rawEvents=state.lastData?.events?.events ?? state.lastData?.events?.data?.events ?? state.lastData?.events?.data ?? [];
    const events=Array.isArray(rawEvents)?rawEvents:(rawEvents&&typeof rawEvents==='object'?Object.values(rawEvents):[]);
    const eventCandidates=events.map(row=>({timestamp:Number(row?.timestamp??row?.time??0)||0,text:String(row?.event??row?.title??row?.message??'').slice(0,220)})).filter(x=>/wheel|spin|lame|mediocrity|awesome/i.test(x.text)).slice(0,20);
    const endpoints={};
    for(const name of Object.keys(ENDPOINTS)) endpoints[name]={received:Object.prototype.hasOwnProperty.call(state.lastData,name),error:state.endpointErrors[name]||'',shape:endpointShape(name)};
    return {suite:'0.9.974',checklist:API_VERSION,utcDay:dayKey(),href:String(location.href),apiKeyPresent:!!getApiKey(),isWheelPage:isWheelPage(),activeWheel:activeWheelFromDom(),logTypesCount:Object.keys(state.logTypes||{}).length,endpoints,wheels,logCandidates,eventCandidates};
  }
  async function copyWheelDiagnostics(){
    const text=JSON.stringify(wheelDiagnostics(),null,2);
    let copied=false;
    try{if(typeof GM_setClipboard==='function'){GM_setClipboard(text,'text');copied=true;}}catch{}
    if(!copied){try{await navigator.clipboard.writeText(text);copied=true;}catch{}}
    if(!copied){try{window.prompt('COPY DEBUG — select all and copy',text);}catch{}}
    return text;
  }
  function ensureDiagnosticsButton(p){
    if(!p||p.querySelector('#sdp-copy-debug')) return;
    const head=p.querySelector('.sdp-head'); if(!head) return;
    const b=document.createElement('button'); b.type='button'; b.id='sdp-copy-debug'; b.textContent='COPY DEBUG';
    b.style.cssText='margin-left:auto;margin-right:8px;padding:7px 10px;border:1px solid #5d6675;border-radius:7px;background:#202733;color:#fff;font-weight:700;font-size:11px;';
    b.addEventListener('click',async()=>{const old=b.textContent;try{await copyWheelDiagnostics();b.textContent='COPIED';}catch{b.textContent='SHOW DEBUG';}setTimeout(()=>{b.textContent=old;},1800);});
    const close=head.querySelector('.sdp-close'); if(close) head.insertBefore(b,close); else head.appendChild(b);
  }

'''
if 'function wheelDiagnostics(){' not in s:
    if anchor not in s: raise SystemExit('diagnostics insertion anchor missing')
    s=s.replace(anchor,diag+anchor,1)

old_open="function open(){ const p=ensurePanel(); p.classList.add('open'); render(); refreshApi(false); return true; }"
new_open="function open(){ const p=ensurePanel(); ensureDiagnosticsButton(p); p.classList.add('open'); render(); refreshApi(false); return true; }"
if old_open not in s: raise SystemExit('open anchor missing')
s=s.replace(old_open,new_open,1)

old_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey,wheelIdFromText,activeWheelFromDom,scanWheelPage"
new_api="g.SakaLuXSuiteDailyProgress=Object.freeze({version:API_VERSION,storageKey:STORAGE_KEY,dayKey,get,summary,setObjective,addObjective,removeObjective,recordActivity,refreshApi,moduleStatus,open,close,resetToday,routeType,getApiKey,wheelIdFromText,activeWheelFromDom,scanWheelPage,wheelDiagnostics,copyWheelDiagnostics"
if old_api not in s: raise SystemExit('public API anchor missing')
s=s.replace(old_api,new_api,1)

suite.write_text(s,encoding='utf-8')

t=test.read_text(encoding='utf-8')
t=t.replace(r'0\.9\.973',r'0\.9\.974',1).replace("const VERSION = '0.9.973';","const VERSION = '0.9.974';",1).replace("assert.equal(api.version,'2.1.3');","assert.equal(api.version,'2.1.4');",1)
needle="assert.equal(api.summary().objectives.find(x=>x.id==='wheel_awesome').status,'done','Wheel of Awesome completes from Torn events fallback');"
extra=needle+"\nassert.equal(typeof api.wheelDiagnostics,'function','wheel diagnostics API exposed');\nconst dbg=api.wheelDiagnostics(); assert.equal(dbg.suite,'0.9.974'); assert.ok(dbg.endpoints&&dbg.wheels&&Array.isArray(dbg.wheels),'diagnostics contains endpoint and wheel state'); assert.equal(Object.prototype.hasOwnProperty.call(dbg,'apiKey'),false,'diagnostics never expose API key');"
if needle not in t: raise SystemExit('diagnostics test anchor missing')
t=t.replace(needle,extra,1)
test.write_text(t,encoding='utf-8')

m=doc.read_text(encoding='utf-8')
m=m.replace('**v0.9.973**','**v0.9.974**',1).replace('- Canonical version: **v0.9.973**','- Canonical version: **v0.9.974**',1)
start=m.find('## Current release note'); hist=m.find('## Release history / Changelog')
if start<0 or hist<0: raise SystemExit('doc markers missing')
section="## Current release note\n\n**v0.9.974 — Wheel diagnostics**\n- Adds a `COPY DEBUG` button to Smart Daily Checklist so TornPDA users can copy the exact Wheel detection state.\n- Records per-endpoint success/error for `/user/log`, `/user/events`, `/torn/logtypes` and the rest of the checklist API calls.\n- Debug output includes only endpoint shapes, Wheel task state and Wheel-related candidates; the API key is never included.\n- Exposes `wheelDiagnostics()` and `copyWheelDiagnostics()` through `SakaLuXSuiteDailyProgress`.\n\n"
m=m[:start]+section+m[hist:]
entry="\n### v0.9.974 — Wheel diagnostics\n- Adds mobile-friendly COPY DEBUG and per-endpoint diagnostics for Daily Wheels without exposing the API key.\n"
pos=m.find('## Release history / Changelog')+len('## Release history / Changelog')
m=m[:pos]+entry+m[pos:]
doc.write_text(m,encoding='utf-8')
