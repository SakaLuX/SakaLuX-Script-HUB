from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      0.9.978','// @version      0.9.979',1)
s=s.replace("const VERSION = '0.9.978';","const VERSION = '0.9.979';",1)
s=s.replace("const API_VERSION = '2.1.8';","const API_VERSION = '2.1.9';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.8 — v0.9.978 */','/* SakaLuX Smart Daily Checklist v2.1.9 — v0.9.979 */',1)
anchor="  async function copyWheelDiagnostics(){"
inline=r'''  function showDebugInline(panel,text){
    if(!panel) return false;
    try{panel.querySelector('#sdp-debug-inline')?.remove();}catch{}
    const wrap=document.createElement('div');wrap.id='sdp-debug-inline';
    wrap.style.cssText='margin:10px;padding:10px;border:1px solid #596579;border-radius:9px;background:#0f141d;position:relative;z-index:2147483647;';
    const h=document.createElement('div');h.textContent='COPY DEBUG — selecteaza textul de mai jos';h.style.cssText='font-weight:800;color:#fff;margin-bottom:8px;font-size:13px;';
    const ta=document.createElement('textarea');ta.value=String(text||'');ta.readOnly=true;
    ta.style.cssText='display:block;width:100%;height:48vh;min-height:260px;box-sizing:border-box;background:#080c12;color:#dbe5f3;border:1px solid #3b4656;border-radius:7px;padding:9px;font:12px monospace;';
    const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;justify-content:flex-end;margin-top:8px;';
    const select=document.createElement('button');select.type='button';select.textContent='SELECT ALL';
    const close=document.createElement('button');close.type='button';close.textContent='CLOSE';
    for(const b of [select,close]) b.style.cssText='padding:8px 12px;border:1px solid #5d6675;border-radius:7px;background:#202733;color:#fff;font-weight:700;';
    select.onclick=()=>{ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);};
    close.onclick=()=>wrap.remove();
    row.append(select,close);wrap.append(h,ta,row);
    const head=panel.querySelector('.sdp-head'); if(head?.nextSibling) panel.insertBefore(wrap,head.nextSibling); else panel.appendChild(wrap);
    ta.focus();ta.select();ta.setSelectionRange(0,ta.value.length);
    try{wrap.scrollIntoView({block:'nearest'});}catch{}
    return true;
  }
'''
if 'function showDebugInline(panel,text)' not in s:
    if anchor not in s: raise SystemExit('copyWheelDiagnostics anchor missing')
    s=s.replace(anchor,inline+anchor,1)
old="b.addEventListener('click',async()=>{const old=b.textContent;try{const r=await copyWheelDiagnostics();b.textContent=r?.copied?'COPIED':'SHOW DEBUG';if(!r?.copied)showDebugOverlay(r?.text||'','COPY DEBUG — copy manually');}catch(e){b.textContent='SHOW DEBUG';showDebugOverlay(JSON.stringify({suite:VERSION,checklist:API_VERSION,error:String(e?.message||e)},null,2),'COPY DEBUG ERROR');}setTimeout(()=>{b.textContent=old;},1800);});"
new="b.addEventListener('click',async()=>{const old=b.textContent;try{const r=await copyWheelDiagnostics();b.textContent=r?.copied?'COPIED':'SHOW DEBUG';if(!r?.copied)showDebugInline(p,r?.text||'');}catch(e){b.textContent='SHOW DEBUG';showDebugInline(p,JSON.stringify({suite:VERSION,checklist:API_VERSION,error:String(e?.message||e)},null,2));}setTimeout(()=>{b.textContent=old;},1800);});"
if old not in s: raise SystemExit('button handler anchor missing')
s=s.replace(old,new,1)
old_api='wheelDiagnostics,copyWheelDiagnostics,showDebugOverlay,applyApiSnapshot:interpretV3'
new_api='wheelDiagnostics,copyWheelDiagnostics,showDebugOverlay,showDebugInline,applyApiSnapshot:interpretV3'
if old_api in s: s=s.replace(old_api,new_api,1)
p.write_text(s,encoding='utf-8')
