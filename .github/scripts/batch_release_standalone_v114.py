from pathlib import Path
import json,re,subprocess

ROOT=Path(__file__).resolve().parents[2]
RT=ROOT/'src/core/sakalux-dock-runtime.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
RELEASE=ROOT/'releases'/'standalone-runtime-v1.1.4.md'
OLD_SHA='de208ecbed8ca469afdd719850a19480a6d5782f'

rt=RT.read_text(encoding='utf-8')
old=subprocess.check_output(['git','show',f'{OLD_SHA}:src/core/sakalux-dock-runtime.js'],text=True)
rt=rt.replace("const VERSION = '1.1.3';","const VERSION = '1.1.4';",1)

a_old=old.index("  function findStatusIconList() {")
b_old=old.index("  function ensureDock() {")
legacy=old[a_old:b_old]
a=rt.index("  function findStatusIconList() {")
b=rt.index("  function ensureDock() {")
rt=rt[:a]+legacy+rt[b:]

old_css=re.search(r'#\$\{IDS\.native\} \.slx-s-link\{[^\n]+\}',old)
if not old_css: raise SystemExit('legacy native CSS missing')
rt=re.sub(r'#\$\{IDS\.native\}[^\n]*',old_css.group(0),rt,count=1)

old_head=re.search(r"      const head = d\.createElement\('div'\); head\.className = 'slx-dock-head';.*?      head\.appendChild\(close\); head\.appendChild\(title\); head\.appendChild\(sub\);",old,re.S)
cur_head=re.search(r"      const head = d\.createElement\('div'\); head\.className = 'slx-dock-head';.*?      head\.appendChild\([^;]+; head\.appendChild\(title\); head\.appendChild\(sub\);",rt,re.S)
if not old_head or not cur_head: raise SystemExit('dock header block missing')
header=old_head.group(0).replace("toggleDock(false);","forceCloseDock();")
rt=rt[:cur_head.start()]+header+rt[cur_head.end():]

state_start=rt.index("  let openState = false;")
state_end=rt.index("  function normalize(entry = {}) {")
state="""  let openState = false;
  let autoCloseTimer = 0;
  let userOpened = false;
  function readOpen() { return false; }
  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }
  function forceCloseDock() {
    userOpened = false;
    openState = false;
    clearTimeout(autoCloseTimer);
    const p = doc()?.getElementById(IDS.dock);
    if (p) { p.dataset.open = '0'; p.hidden = true; }
    try { localStorage.removeItem(OPEN_KEY); } catch {}
    return false;
  }
  function armAutoClose() {
    clearTimeout(autoCloseTimer);
    if (!openState) return;
    autoCloseTimer = setTimeout(() => forceCloseDock(), 6000);
  }

"""
rt=rt[:state_start]+state+rt[state_end:]
rt=rt.replace("      panel.dataset.open = readOpen() ? '1' : '0';","      panel.dataset.open = '0';\n      panel.hidden = true;\n      writeOpen(false);",1)

rt=rt.replace("link.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(); });",
"""link.addEventListener?.('click', e => {
          e?.preventDefault?.(); e?.stopPropagation?.();
          const panel=d.getElementById(IDS.dock);
          const isOpen=panel?.dataset.open==='1' && panel.hidden===false;
          if(isOpen) forceCloseDock(); else { userOpened=true; toggleDock(true); }
        });""",1)
rt=rt.replace("button.addEventListener?.('click', () => toggleDock());",
"""button.addEventListener?.('click', e => {
        e?.preventDefault?.(); e?.stopPropagation?.();
        const panel=d.getElementById(IDS.dock);
        const isOpen=panel?.dataset.open==='1' && panel.hidden===false;
        if(isOpen) forceCloseDock(); else { userOpened=true; toggleDock(true); }
      });""",1)

m=re.search(r"  function toggleDock\(force\) \{.*?\n  \}\n\n  function render",rt,re.S)
if not m: raise SystemExit('toggle block missing')
toggle="""  function toggleDock(force) {
    if (hubInstalled()) { removeUi(); return false; }
    render();
    const panel = doc()?.getElementById(IDS.dock);
    if (!panel) return false;
    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if (next) {
      userOpened = true;
      openState = true;
      panel.dataset.open = '1';
      panel.hidden = false;
      writeOpen(true);
      armAutoClose();
    } else forceCloseDock();
    return next;
  }

  function render"""
rt=rt[:m.start()]+toggle+rt[m.end():]
rt=rt.replace("    panel.hidden = panel.dataset.open !== '1';",
              "    if (!userOpened) { panel.dataset.open='0'; panel.hidden=true; } else panel.hidden = panel.dataset.open !== '1';",1)

m=re.search(r"  function bindRuntimeSignals\(\) \{.*?\n  \}\n\n  function register",rt,re.S)
if not m: raise SystemExit('signal block missing')
signals="""  function bindRuntimeSignals() {
    if (runtimeSignalsBound) return;
    runtimeSignalsBound = true;
    try {
      core()?.router?.onChange?.(() => { forceCloseDock(); scheduleRefresh(180); });
      core()?.router?.bind?.();
    } catch {}
    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}
    try {
      const outside = e => {
        const panel = doc()?.getElementById(IDS.dock);
        if (!panel || panel.dataset.open !== '1' || panel.hidden) return;
        const t=e?.target;
        if (t?.closest?.('#'+IDS.dock) || t?.closest?.('#'+IDS.native) || t?.closest?.('#'+IDS.fallback)) return;
        forceCloseDock();
      };
      for (const ev of ['pointerdown','touchstart','mousedown','click']) doc()?.addEventListener?.(ev,outside,true);
    } catch {}
    try { g.addEventListener?.('keydown', e => { if(e?.key==='Escape') forceCloseDock(); }, {passive:true}); } catch {}
    try {
      if (!observer && typeof MutationObserver === 'function' && doc()?.body) {
        observer = new MutationObserver(records => {
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });
        observer.observe(doc().body, { childList:true, subtree:true });
      }
    } catch {}
  }

  function register"""
rt=rt[:m.start()]+signals+rt[m.end():]
rt=rt.replace("    forceCloseDock();\n    render();\n    forceCloseDock();\n    bindRuntimeSignals();",
              "    render();\n    bindRuntimeSignals();",1)
RT.write_text(rt,encoding='utf-8')

items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56','1.3.56.1','greasyfork/Enhancer-Guard.md'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27','1.3.27.1',None),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49','1.0.49.1','greasyfork/Mission-Rewards.md'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47','5.3.47.1','greasyfork/Bazaar-Thanker.md'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16','1.1.16.1','greasyfork/Bazaar-Smart-Pricer.md'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50','1.3.50.1','greasyfork/Elimination-Assistant.md'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60','1.17.60.1','greasyfork/Market-Intelligence.md'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18','0.8.18.1','greasyfork/Stock-Manager-Advisor.md'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56','1.8.56.1','greasyfork/Company-Intelligence.md'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6','0.5.6.1','greasyfork/Bounty-Hunter.md')
]
notes=[
'Maintenance-only release: embeds Shared Standalone Dock Runtime v1.1.4.',
'Restores the exact previously working native S launcher code and appearance.',
'Keeps singleton/open-close fixes only; no module feature changes.'
]
for filename,sid,oldv,newv,docpath in items:
    p=ROOT/filename
    s=p.read_text(encoding='utf-8')
    if f'// @version      {oldv}' not in s: raise SystemExit(f'{filename}: expected {oldv}')
    s=s.replace(oldv,newv)
    p.write_text(s,encoding='utf-8')
    if docpath:
        dp=ROOT/docpath
        if dp.exists():
            d=dp.read_text(encoding='utf-8')
            d=re.sub(r'^\*\*v[^*]+\*\*',f'**v{newv}**',d,count=1,flags=re.M)
            current=f"""## Current release note

**v{newv} — Standalone Dock Runtime v1.1.4 legacy-launcher restore**
- Maintenance-only release.
- Restores the exact old/native Standalone S launcher implementation that previously worked correctly in TornPDA.
- Keeps singleton and close-state fixes without redesigning the Torn status bar.
- No module feature changes.
"""
            if '## Current release note' in d:
                d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
            entry=f"""### v{newv} — Standalone Dock Runtime v1.1.4 legacy-launcher restore
- Runtime-only maintenance update.
- Restores the previously working native S launcher.
- Keeps singleton/open-close fixes only.

"""
            if f'### v{newv}' not in d:
                if '## Changelog\n' in d:d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
                elif '## Release history / Changelog\n' in d:d.replace('## Release history / Changelog\n','## Release history / Changelog\n'+entry,1)
            dp.write_text(d,encoding='utf-8')

data=json.loads(REG.read_text(encoding='utf-8'))
for filename,sid,oldv,newv,docpath in items:
    if not sid: continue
    row=next(x for x in data['scripts'] if x.get('id')==sid)
    if row.get('version')!=oldv: raise SystemExit(f'{sid}: registry expected {oldv}, got {row.get("version")}')
    row['version']=newv
    row['release']={'version':newv,'date':'2026-10-06','notes':notes}
    row['detailsRevision']=int(row.get('detailsRevision',0))+1
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    block="""\n## Standalone Runtime v1.1.4 — legacy launcher restore
- Restores the exact native S launcher implementation from the previously working runtime.
- No status-bar redesign/repositioning.
- Keeps singleton/version arbitration and deterministic close lifecycle.
- Maintenance releases use a fourth numeric component .1 as requested.
- Enhancer 1.3.56.1, Auditor 1.3.27.1, Missions 1.0.49.1, Bazaar Thanker 5.3.47.1, Smart Pricer 1.1.16.1, Elimination 1.3.50.1, Market 1.17.60.1, Stocks 0.8.18.1, Company 1.8.56.1, Bounty 0.5.6.1.
- Script Hub is intentionally unchanged.
"""
    if 'Standalone Runtime v1.1.4 — legacy launcher restore' not in c:
        CHANGE.write_text(c.rstrip()+block+'\n',encoding='utf-8')

RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text("""# Shared Standalone Dock Runtime v1.1.4 — legacy launcher restore

Restores the exact launcher implementation from the previously working runtime while retaining only singleton and close-state fixes.

All affected module maintenance releases use a fourth numeric component .1. Script Hub is not changed.
""",encoding='utf-8')
