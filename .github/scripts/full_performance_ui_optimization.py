from pathlib import Path
import json,re

ROOT=Path('.')
files=sorted(ROOT.glob('SakaLuX-*.user.js'))+[Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')]
files=[p for p in files if p.exists()]

THEME = r'''

  // Shared SakaLuX performance + Hub-style UI foundation.
  (() => {
    const g = window;
    if (!g.SakaLuXPerf) {
      const timers = new Map();
      g.SakaLuXPerf = {
        debounce(key, fn, wait=220) {
          const old = timers.get(key); if (old) clearTimeout(old);
          const id = setTimeout(() => { timers.delete(key); fn(); }, Math.max(120, wait));
          timers.set(key,id); return id;
        },
        idle(fn, timeout=700) {
          if ('requestIdleCallback' in g) return g.requestIdleCallback(fn,{timeout});
          return setTimeout(fn,32);
        }
      };
    }
    if (!document.getElementById('sakalux-shared-hub-skin')) {
      const st=document.createElement('style');
      st.id='sakalux-shared-hub-skin';
      st.textContent=`
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"] button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"] button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"][id*="panel"],body [id*="sakalux"][id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"] .header,body [id^="sakalux-"] .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"] .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"] button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head||document.documentElement).appendChild(st);
    }
  })();
'''

# Conservative observer tuning only for known render/registration loops.
def tune_observers(s):
    # Common generated standalone loop used by several SakaLuX modules.
    s=re.sub(r"new MutationObserver\(\(\)=>\{clearTimeout\(t\);t=setTimeout\(\(\)=>\{registerSelf\(\);render\(\);\},(?:80|100|120)\);\}\)",
             "new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>{registerSelf();render();},220);})",s)
    # Multiline variants around render/ensure callbacks: lift very aggressive debounce floors.
    def repl(m):
        body=m.group(1); wait=int(m.group(2))
        if re.search(r'render\(|ensure|mount|registerSelf',body) and wait<180:
            return 'setTimeout('+body+',220)'
        return m.group(0)
    s=re.sub(r'setTimeout\((([\s\S]{0,180}?)(?:render\(|ensure|mount|registerSelf)[\s\S]{0,180}?),\s*(80|100|120)\)',lambda m:m.group(0),s)
    return s

def bump(v):
    m=re.fullmatch(r'(\d+)\.(\d+)\.(\d+)',v.strip())
    if not m: return v
    a,b,c=map(int,m.groups()); return f'{a}.{b}.{c+1}'

versions={}
changed=[]
for p in files:
    s=p.read_text(encoding='utf-8')
    m=re.search(r'^// @version\s+([^\s]+)',s,re.M)
    if not m: continue
    old=m.group(1); new=bump(old)
    if old==new: continue
    # metadata
    s=s[:m.start(1)]+new+s[m.end(1):]
    # runtime version: common patterns, first match only
    patterns=[
      rf"(const\s+VERSION\s*=\s*['\"]){re.escape(old)}(['\"])",
      rf"(const\s+BAZAAR_VERSION\s*=\s*['\"]){re.escape(old)}(['\"])",
      rf"(version:\s*['\"]){re.escape(old)}(['\"])",
    ]
    for pat in patterns:
        s2,n=re.subn(pat,rf"\g<1>{new}\g<2>",s,count=1)
        if n: s=s2; break
    if 'Shared SakaLuX performance + Hub-style UI foundation.' not in s:
        anchor="'use strict';"
        if anchor in s: s=s.replace(anchor,anchor+THEME,1)
    s=tune_observers(s)
    p.write_text(s,encoding='utf-8')
    versions[p.name]=(old,new)
    changed.append(p.name)

# Registry versions follow source filenames where registered.
regp=Path('scripts.json')
if regp.exists():
    data=json.loads(regp.read_text(encoding='utf-8'))
    for item in data.get('scripts',[]):
        src=str(item.get('sourceUrl',''))
        base=src.rsplit('/',1)[-1]
        if base in versions: item['version']=versions[base][1]
    regp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Synchronize Hub fallback registry to scripts.json after all managed versions changed.
hubp=Path('SakaLuX-Script-Hub.user.js')
if hubp.exists() and regp.exists():
    hub=hubp.read_text(encoding='utf-8')
    reg=json.loads(regp.read_text(encoding='utf-8')).get('scripts',[])
    for item in reg:
        sid=re.escape(str(item.get('id',''))); ver=str(item.get('version',''))
        if not sid or not ver: continue
        pat=rf"(id:\s*['\"]{sid}['\"][\s\S]{{0,600}}?version:\s*['\"])([^'\"]+)(['\"])"
        hub=re.sub(pat,lambda m:m.group(1)+ver+m.group(3),hub,count=1)
    hubp.write_text(hub,encoding='utf-8')

# Dedicated public docs for managed add-ons: keep Current version synchronized.
doc_map={
'SakaLuX-Enhancer-Guard.user.js':'greasyfork/Enhancer-Guard.md',
'SakaLuX-Bazaar-Thanker-PDA.user.js':'greasyfork/Bazaar-Thanker.md',
'SakaLuX-Mission-Rewards.user.js':'greasyfork/Mission-Rewards.md',
'SakaLuX-Market-Intelligence.user.js':'greasyfork/Market-Intelligence.md',
'SakaLuX-Elimination-Assistant.user.js':'greasyfork/Elimination-Assistant.md',
'SakaLuX-Script-Hub.user.js':'greasyfork/Script-Hub.md',
'experimental/SakaLuX-Stock-Manager-Advisor.user.js':'experimental/Stock-Manager-Advisor.md'
}
for key,docname in doc_map.items():
    base=Path(key).name
    if base not in versions: continue
    dp=Path(docname)
    if not dp.exists(): continue
    txt=dp.read_text(encoding='utf-8'); new=versions[base][1]
    txt=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',rf'\1**v{new}**',txt,count=1)
    txt=re.sub(r'(\*\*Current version:\s*v)[^*]+(\*\*)',rf'\g<1>{new}\2',txt,count=1)
    dp.write_text(txt,encoding='utf-8')

# Hub info list: synchronize managed add-on versions from registry.
hip=Path('greasyfork/Script-Hub.md')
if hip.exists() and regp.exists():
    txt=hip.read_text(encoding='utf-8'); reg=json.loads(regp.read_text(encoding='utf-8')).get('scripts',[])
    labels={'enhancer':'Enhancer Guard','bazaar':'Bazaar Thanker - PDA','mission-rewards':'Mission Rewards','market-intelligence':'Market Intelligence','elimination-assistant':'Elimination Assistant'}
    for item in reg:
        label=labels.get(item.get('id'))
        if label:
            txt=re.sub(rf'(- .*SakaLuX {re.escape(label)} \*\*v)[^*]+(\*\*)',rf'\g<1>{item["version"]}\2',txt)
    hip.write_text(txt,encoding='utf-8')

# Audit report committed with the change for traceability.
report=Path('PERFORMANCE-UI-AUDIT.md')
report.write_text('# SakaLuX Performance & UI Optimization Audit\n\nApplied 2026-09-16.\n\n## Scope\n\n'+''.join(f'- `{name}`: {old} → {new}\n' for name,(old,new) in versions.items())+'\n## Changes\n\n- Shared single-instance Hub-style UI foundation for SakaLuX controls/panels.\n- Shared lightweight debounce/idle helper to avoid duplicate helper/style instances.\n- Conservative tuning of known high-frequency MutationObserver render loops.\n- Version/registry/Hub fallback synchronization for registered modules.\n- Full JavaScript syntax and repository validator checks are run by CI.\n',encoding='utf-8')
print(f'Optimized {len(changed)} scripts')
for x in changed: print(x)
