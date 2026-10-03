from pathlib import Path
import re

p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')

# Version sources + diagnostics must report the actual runtime version.
s=re.sub(r'// @version      0\.9\.97[46]', '// @version      0.9.977', s, count=1)
s=re.sub(r"const VERSION = '0\.9\.97[46]';", "const VERSION = '0.9.977';", s, count=1)
s=s.replace("const API_VERSION = '2.1.6';","const API_VERSION = '2.1.7';",1)
s=s.replace('/* SakaLuX Smart Daily Checklist v2.1.6 — v0.9.976 */','/* SakaLuX Smart Daily Checklist v2.1.7 — v0.9.977 */',1)
s=s.replace("suite:'0.9.974',checklist:API_VERSION", "suite:VERSION,checklist:API_VERSION")

# API v2 /torn/logtypes is a list of objects. Preserve the complete row text so schema field names cannot break lookup.
old=re.compile(r"  function applyLogTypes\(data\)\{.*?\n  \}\n  function applyEventCompletion", re.S)
new="""  function applyLogTypes(data){
    const raw=data?.logtypes ?? data?.data?.logtypes ?? data?.data ?? [];
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.entries(raw).map(([id,v])=>({id,...(typeof v==='object'?v:{value:v})})):[]);
    const map={...state.logTypes};
    for(const row of rows){
      const id=String(row?.id ?? row?.log ?? row?.log_id ?? row?.logtype_id ?? row?.type_id ?? '');
      const text=deepText(row);
      if(id && text) map[id]=text;
    }
    state.logTypes=map;
  }
  function applyEventCompletion"""
s,n=old.subn(new,s,count=1)
if n!=1: raise SystemExit('applyLogTypes block not found')

old2=re.compile(r"  function resolveWheelLogIds\(\)\{.*?\n  \}\n  async function refreshWheelLogsDirect", re.S)
new2="""  function resolveWheelLogIds(){
    const out={wheel_lame:[],wheel_mediocrity:[],wheel_awesome:[]};
    const add=(id,textRaw)=>{
      const idStr=String(id??'');
      const text=String(textRaw??'').toLowerCase();
      if(!idStr) return;
      const wheelish=/wheel|spin|leslie/.test(text);
      if(/wheel of lame/.test(text)||(wheelish&&/\\blame\\b/.test(text))) out.wheel_lame.push(idStr);
      if(/wheel of mediocrity/.test(text)||(wheelish&&/\\bmediocrity\\b/.test(text))) out.wheel_mediocrity.push(idStr);
      if(/wheel of awesome/.test(text)||(wheelish&&/\\bawesome\\b/.test(text))) out.wheel_awesome.push(idStr);
    };
    // Normalized map built by applyLogTypes.
    for(const [id,text] of Object.entries(state.logTypes||{})) add(id,text);
    // Also inspect the raw API rows directly so future schema field-name changes do not break detection.
    const raw=state.lastData?.logtypes?.logtypes ?? state.lastData?.logtypes?.data?.logtypes ?? state.lastData?.logtypes?.data ?? [];
    const rows=Array.isArray(raw)?raw:(raw&&typeof raw==='object'?Object.entries(raw).map(([id,v])=>({id,...(typeof v==='object'?v:{value:v})})):[]);
    for(const row of rows){
      const id=row?.id ?? row?.log ?? row?.log_id ?? row?.logtype_id ?? row?.type_id;
      add(id,deepText(row));
    }
    for(const k of Object.keys(out)) out[k]=[...new Set(out[k])];
    return out;
  }
  async function refreshWheelLogsDirect"""
s,n=old2.subn(new2,s,count=1)
if n!=1: raise SystemExit('resolveWheelLogIds block not found')

p.write_text(s,encoding='utf-8')

# Docs version only; don't depend on a specific older current note.
d=Path('greasyfork/SakaLuX-Suite.md')
m=d.read_text(encoding='utf-8')
m=re.sub(r'\*\*v0\.9\.97[46]\*\*','**v0.9.977**',m,count=1)
m=re.sub(r'- Canonical version: \*\*v0\.9\.97[46]\*\*','- Canonical version: **v0.9.977**',m,count=1)
d.write_text(m,encoding='utf-8')
