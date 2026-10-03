from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=re.sub(r'// @version      0\.9\.977','// @version      0.9.978',s,count=1)
s=s.replace("const VERSION = '0.9.977';","const VERSION = '0.9.978';",1)
s=s.replace("const API_VERSION = '2.1.7';","const API_VERSION = '2.1.8';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.7 — v0.9.977 */','/* SakaLuX Smart Daily Checklist v2.1.8 — v0.9.978 */',1)
old="""  async function copyWheelDiagnostics(){
    const text=JSON.stringify(wheelDiagnostics(),null,2);
    let copied=false;
    try{if(typeof GM_setClipboard==='function'){GM_setClipboard(text,'text');copied=true;}}catch{}
    if(!copied){try{await navigator.clipboard.writeText(text);copied=true;}catch{}}
    if(!copied){try{window.prompt('COPY DEBUG — select all and copy',text);}catch{}}
    return text;
  }"""
new="""  function showDebugOverlay(text,title='COPY DEBUG'){
    try{document.getElementById('sdp-debug-overlay')?.remove();}catch{}
    const o=document.createElement('div');o.id='sdp-debug-overlay';o.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:14px;';
    const box=document.createElement('div');box.style.cssText='width:min(94vw,760px);max-height:88vh;background:#111722;border:1px solid #586273;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;';
    const h=document.createElement('div');h.textContent=title;h.style.cssText='font-weight:800;color:#fff;font-size:14px;';
    const ta=document.createElement('textarea');ta.value=text;ta.readOnly=true;ta.style.cssText='width:100%;height:62vh;resize:none;background:#0b0f16;color:#dbe5f3;border:1px solid #3b4656;border-radius:7px;padding:9px;font:12px monospace;box-sizing:border-box;';
    const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;justify-content:flex-end;';
    const copy=document.createElement('button');copy.textContent='COPY';copy.type='button';
    const close=document.createElement('button');close.textContent='CLOSE';close.type='button';
    for(const b of [copy,close]) b.style.cssText='padding:8px 12px;border:1px solid #5d6675;border-radius:7px;background:#202733;color:#fff;font-weight:700;';
    copy.onclick=()=>{ta.focus();ta.select();let ok=false;try{ok=document.execCommand('copy');}catch{} if(ok)copy.textContent='COPIED';};
    close.onclick=()=>o.remove();
    row.append(copy,close);box.append(h,ta,row);o.append(box);document.body.append(o);ta.focus();ta.select();return o;
  }
  async function copyWheelDiagnostics(){
    let text='';
    try{text=JSON.stringify(wheelDiagnostics(),null,2);}catch(e){text=JSON.stringify({suite:VERSION,checklist:API_VERSION,error:'wheelDiagnostics failed: '+String(e?.message||e)},null,2);}
    let copied=false;
    try{if(typeof GM_setClipboard==='function'){GM_setClipboard(text,'text');copied=true;}}catch{}
    if(!copied){try{if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;}}catch{}}
    if(!copied){try{const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px;top:-9999px;';document.body.appendChild(ta);ta.focus();ta.select();copied=!!document.execCommand('copy');ta.remove();}catch{}}
    if(!copied) showDebugOverlay(text,'COPY DEBUG — copy manually');
    return {text,copied};
  }"""
if old not in s: raise SystemExit('copyWheelDiagnostics anchor missing')
s=s.replace(old,new,1)
oldh="b.addEventListener('click',async()=>{const old=b.textContent;try{await copyWheelDiagnostics();b.textContent='COPIED';}catch{b.textContent='SHOW DEBUG';}setTimeout(()=>{b.textContent=old;},1800);});"
newh="b.addEventListener('click',async()=>{const old=b.textContent;try{const r=await copyWheelDiagnostics();b.textContent=r?.copied?'COPIED':'SHOW DEBUG';if(!r?.copied)showDebugOverlay(r?.text||'','COPY DEBUG — copy manually');}catch(e){b.textContent='SHOW DEBUG';showDebugOverlay(JSON.stringify({suite:VERSION,checklist:API_VERSION,error:String(e?.message||e)},null,2),'COPY DEBUG ERROR');}setTimeout(()=>{b.textContent=old;},1800);});"
if oldh not in s: raise SystemExit('button handler anchor missing')
s=s.replace(oldh,newh,1)
# expose overlay helper too for diagnostics
s=s.replace('wheelDiagnostics,copyWheelDiagnostics','wheelDiagnostics,copyWheelDiagnostics,showDebugOverlay',1)
p.write_text(s,encoding='utf-8')
print('patched',VERSION if False else '0.9.978')