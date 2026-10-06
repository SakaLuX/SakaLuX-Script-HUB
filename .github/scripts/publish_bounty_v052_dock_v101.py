from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2]
rp=ROOT/'src/core/sakalux-dock-runtime.js'
bp=ROOT/'SakaLuX-Bounty-Hunter.user.js'
regp=ROOT/'scripts.json'
chg=ROOT/'CHANGELOG.md'
mdp=ROOT/'greasyfork/Bounty-Hunter.md'
tp=ROOT/'tests/priority6-shared-dock-migration-regression.cjs'

r=rp.read_text()
r=r.replace("const VERSION = '1.0.0-test.3';","const VERSION = '1.0.1';",1)
r=r.replace("  if (g[NS]?.version === VERSION) return;\n","  if (g[NS]?.version === VERSION) return;\n  try { if (g[NS] && g[NS].version !== VERSION) g[NS].removeUi?.(); } catch {}\n",1)
r=r.replace("  function readOpen() { try { return localStorage.getItem(OPEN_KEY) === '1'; } catch { return false; } }\n  function writeOpen(value) { try { localStorage.setItem(OPEN_KEY, value ? '1' : '0'); } catch {} }",
"""  let openState = false;
  let autoCloseTimer = 0;
  function readOpen() { return openState; }
  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }
  function armAutoClose() { clearTimeout(autoCloseTimer); if (!openState) return; autoCloseTimer = setTimeout(() => toggleDock(false), 8000); }""",1)
native='#'+'$'+'{IDS.native}'
old=native+' .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;font-weight:900!important;color:#e9a84d!important;text-decoration:none!important}'
new=native+'{display:flex!important;align-items:center!important;justify-content:center!important}'+native+' .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;font:900 14px/28px Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}'
if old not in r: raise SystemExit('native S css anchor missing')
r=r.replace(old,new,1)
old="""      if (!item) {
        item = d.createElement('li');
        item.id = IDS.native;
        const link = d.createElement('a');
        link.href = '#';
        link.className = 'slx-s-link';
        link.textContent = 'S';
        link.title = 'SakaLuX Scripts';
        link.setAttribute?.('aria-label', 'SakaLuX Scripts');
        link.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(); });
        item.appendChild(link);
      }
      copyNativeCell(item, list);"""
new="""      if (!item) { item = d.createElement('li'); item.id = IDS.native; item.appendChild(d.createElement('a')); }
      const link = item.querySelector('a') || item.appendChild(d.createElement('a'));
      link.href = '#'; link.className = 'slx-s-link'; link.textContent = 'S'; link.title = 'SakaLuX Scripts';
      link.setAttribute?.('aria-label', 'SakaLuX Scripts');
      link.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(); };
      copyNativeCell(item, list);"""
if old not in r: raise SystemExit('launcher anchor missing')
r=r.replace(old,new,1)
r=r.replace("      panel.dataset.open = readOpen() ? '1' : '0';","      panel.dataset.open = '0';",1)
r=r.replace("      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); });","      close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };",1)
r=r.replace("    return panel;\n  }\n\n  function toggleDock(force) {","    const close = panel.querySelector('.slx-dock-mark'); if (close) close.onclick = e => { e?.preventDefault?.(); e?.stopPropagation?.(); toggleDock(false); };\n    return panel;\n  }\n\n  function toggleDock(force) {",1)
r=r.replace("    writeOpen(next);\n    return next;","    writeOpen(next);\n    if (next) armAutoClose(); else clearTimeout(autoCloseTimer);\n    return next;",1)
r=r.replace("      core()?.router?.onChange?.(() => scheduleRefresh(180));","      core()?.router?.onChange?.(() => { toggleDock(false); scheduleRefresh(180); });",1)
a="    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}\n"
r=r.replace(a,a+"    try { doc()?.addEventListener?.('pointerdown', e => { if (!openState) return; const t=e?.target; if (t?.closest?.('#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback)) return; toggleDock(false); }, true); } catch {}\n",1)
rp.write_text(r)

b=bp.read_text()
b=b.replace('@version      0.5.1','@version      0.5.2',1).replace("let v = '0.5.1';","let v = '0.5.2';",1).replace("const VERSION='0.5.1'","const VERSION='0.5.2'",1)
m=re.search(r"function mountChatButtons\(\).*?\nfunction paintChip",b,re.S)
if not m: raise SystemExit('bounty launcher anchor missing')
b=b[:m.start()]+"""function mountChatButtons(){document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove());return 0}
function button(){document.getElementById('slx-bh-btn')?.remove();document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove())}
function paintChip"""+b[m.end():]
b=b.replace("setInterval(()=>{button();mountChatButtons()},1800);","",1).replace("addEventListener('hashchange',()=>setTimeout(button,300));","",1)
bp.write_text(b)

d=json.loads(regp.read_text())
x=next(x for x in d['scripts'] if x.get('id')=='bounty-hunter')
x['version']='0.5.2'; x['detailsRevision']=int(x.get('detailsRevision',0))+1
x['release']={'version':'0.5.2','date':'2026-10-06','notes':['Moves Bounty Hunter into the shared Standalone Dock.','Removes its chat and floating Bounties-page launchers.','Fixes Standalone Dock close/auto-close behavior and restores the native S launcher.']}
regp.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

c=chg.read_text()
if 'Bounty Hunter v0.5.2 + Shared Standalone Dock v1.0.1' not in c:
    chg.write_text(c.rstrip()+"\n\n## Bounty Hunter v0.5.2 + Shared Standalone Dock v1.0.1\n- Adds Bounty Hunter to the common Standalone Dock.\n- Removes Bounty Hunter chat/floating launchers.\n- Dock no longer persists open state; closes on S, module selection, route change, outside tap, or after 8 seconds.\n- Restores and rebinds the compact native S launcher.\n")

d=mdp.read_text()
d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.2**',d,count=1,flags=re.M)
cur="""## Current release note

**v0.5.2 — Shared Standalone Dock integration**
- Bounty Hunter is now in the common Standalone Dock.
- Removes the separate chat and floating Bounty Hunter buttons.
- Dock v1.0.1 fixes close/toggle behavior, auto-closes, and restores the compact native S launcher.
"""
if '## Current release note' in d:
    d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',cur.rstrip()+'\n',d,count=1,flags=re.S)
if '### v0.5.2' not in d:
    d=d.replace('## Changelog\n','## Changelog\n### v0.5.2 — Shared Standalone Dock integration\n- Adds Bounty Hunter to shared Standalone Dock and removes dedicated launch buttons.\n- Fixes Dock close/auto-close/native S behavior.\n\n',1)
mdp.write_text(d)

t=tp.read_text()
if "'SakaLuX-Bounty-Hunter.user.js'," not in t:
    t=t.replace("const targets=[\n","const targets=[\n  'SakaLuX-Bounty-Hunter.user.js',\n",1)
tp.write_text(t)
