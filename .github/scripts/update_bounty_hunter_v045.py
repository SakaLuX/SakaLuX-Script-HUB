from pathlib import Path
import json,re

CORE_PATH=Path('src/core/sakalux-core.js')
BH_PATH=Path('SakaLuX-Bounty-Hunter.user.js')
core=CORE_PATH.read_text()
bh=BH_PATH.read_text()

# Shared Core workspace geometry: align with Hub mobile workspace.
core=core.replace("const CORE_VERSION = '1.2.0';","const CORE_VERSION = '1.2.1';",1)
core=core.replace("const top = Math.max(0, Number(options.top ?? 8));","const top = Math.max(0, Number(options.top ?? 0));",1)
core=core.replace("const bottom = Math.max(0, Number(options.bottom ?? 92));","const bottom = Math.max(0, Number(options.bottom ?? 36));",1)

# Bounty version.
bh=bh.replace('@version      0.4.4','@version      0.4.5',1)
bh=bh.replace("const VERSION='0.4.4'","const VERSION='0.4.5'",1)

# Use the exact Hub-like mobile geometry: top of usable viewport, stop 36px above bottom.
bh=bh.replace(
"CORE?.ui?.applyWorkspaceLayout?.(o,panel,{top:8,bottom:92,side:4,maxWidth:760})",
"CORE?.ui?.applyWorkspaceLayout?.(o,panel,{top:0,bottom:36,side:4,maxWidth:760})",
1
)

# Remove dim/blur treatment from overlay and footer.
bh=bh.replace(
"#slx-bh{position:fixed;inset:0;z-index:2147483600;background:#000b;display:flex;align-items:flex-end;justify-content:center}",
"#slx-bh{position:fixed;inset:0;z-index:2147483600;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;display:flex;align-items:flex-end;justify-content:center}",
1
)
bh=bh.replace(
"#slx-bh .foot,#slx-bh [class*=\"foot\"]{backdrop-filter:blur(12px)!important;background:rgba(10,17,24,.94)!important;",
"#slx-bh .foot,#slx-bh [class*=\"foot\"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(10,17,24,.98)!important;",
1
)

# Strong active/inactive state distinction: ON = orange, OFF = dark.
old=".slx-bh-chip{padding:5px 8px!important;min-height:30px!important}.slx-bh-chip.on{border-color:#59d98a!important;color:#7ee5a5!important}"
new=".slx-bh-chip{padding:5px 8px!important;min-height:30px!important;background:linear-gradient(180deg,#172331,#111b25)!important;border-color:#38506b!important;color:#9fb0c2!important;box-shadow:none!important}.slx-bh-chip.on{background:linear-gradient(180deg,#6a3f08,#3a2104)!important;border-color:#f2a54a!important;color:#ffd29a!important;box-shadow:inset 0 0 0 1px rgba(242,165,74,.16),0 0 12px rgba(242,165,74,.10)!important}"
if old not in bh:
    raise SystemExit('chip style anchor not found')
bh=bh.replace(old,new,1)

# Ensure toggle chip semantic state is exposed.
oldfn="function chip(label,on,fn){const b=document.createElement('button');b.className='slx-bh-chip'+(on?' on':'');b.textContent=label;b.onclick=fn;return b}"
newfn="function chip(label,on,fn){const b=document.createElement('button');b.className='slx-bh-chip'+(on?' on':'');b.textContent=label;b.setAttribute('aria-pressed',on?'true':'false');b.dataset.state=on?'on':'off';b.onclick=fn;return b}"
if oldfn not in bh:
    raise SystemExit('chip function anchor not found')
bh=bh.replace(oldfn,newfn,1)

# Re-embed updated Shared Core into Bounty Hunter manually using repo embedder in workflow.
CORE_PATH.write_text(core)
BH_PATH.write_text(bh)

# Registry.
sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.5'
            if isinstance(it.get('release'),dict):
                it['release']['version']='0.4.5'
                it['release']['date']='2026-10-06'
                it['release']['notes']=[
                    'Matches Script Hub mobile workspace geometry: top aligned and extended down to 36px above the bottom chat/navigation bar.',
                    'Removes overlay/footer blur and dimming for a clean non-blurred TornPDA view.',
                    'Active filter/toggle buttons are now orange; inactive buttons remain dark for immediate state recognition.',
                    'Shared Core workspace defaults updated to v1.2.1 so future modules can reuse the same Hub geometry.'
                ]
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

# Changelog.
cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note="""\n## Bounty Hunter v0.4.5
- Aligns the mobile workspace with Script Hub: top 0, side 4px and bottom reserve 36px so the panel reaches down to just above the TornPDA chat/navigation area.
- Removes overlay and footer blur/dim effects.
- Active filter/toggle chips now use a clear orange ON state; inactive controls stay dark.
- Adds aria-pressed/data-state to filter chips for reliable visual/semantic state.
- Shared Core updated to v1.2.1 with Hub-aligned workspace defaults for reuse by other modules.
"""
    if 'Bounty Hunter v0.4.5' not in c:
        cp.write_text(c.rstrip()+note+'\n')
