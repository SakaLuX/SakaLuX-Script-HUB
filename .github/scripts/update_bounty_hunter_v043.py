from pathlib import Path
import json

bh=Path('SakaLuX-Bounty-Hunter.user.js')
s=bh.read_text()
s=s.replace('@version      0.4.2','@version      0.4.3',1)
s=s.replace("const VERSION='0.4.2'","const VERSION='0.4.3'",1)

# Make results own the remaining vertical space.
s=s.replace(
"#slx-bh .slx-bh-list{padding:8px 12px 74px!important;display:grid!important;gap:9px!important}",
"#slx-bh .slx-bh-list{padding:8px 12px 12px!important;display:grid!important;gap:9px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}"
,1)

old="@media(max-width:520px){#slx-bh{width:min(96vw,760px)!important;max-height:74vh!important;border-radius:16px!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 68px!important;gap:7px!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}"
new="@media(max-width:520px){#slx-bh{width:auto!important;height:auto!important;max-height:none!important;border-radius:0!important;inset:0!important;align-items:flex-end!important;justify-content:center!important}#slx-bh>section{width:calc(100vw - 8px)!important;max-width:none!important;height:calc(100dvh - 72px)!important;max-height:calc(100dvh - 72px)!important;border-radius:16px 16px 0 0!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 8px!important;gap:7px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important;max-height:54dvh!important;overflow:auto!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}"
if old not in s:
    raise SystemExit('mobile pro skin anchor not found')
s=s.replace(old,new,1)

# Base panel also uses available viewport better.
s=s.replace(
"#slx-bh>section{width:min(760px,100%);max-height:92dvh;display:flex;flex-direction:column;",
"#slx-bh>section{width:min(760px,100%);height:min(92dvh,900px);max-height:92dvh;display:flex;flex-direction:column;"
,1)

bh.write_text(s)

sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.3'
            if isinstance(it.get('release'),dict):
                it['release']['version']='0.4.3'
                it['release']['date']='2026-10-06'
                it['release']['notes']=[
                    'Expands the TornPDA Bounty Hunter panel to nearly the full available phone viewport.',
                    'Keeps the full-screen overlay at full size instead of accidentally constraining it on narrow screens.',
                    'Makes the target list flex and scroll inside the panel while the header, filters, status and donation footer remain accessible.'
                ]
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note="""\n## Bounty Hunter v0.4.3
- TornPDA/mobile panel now uses almost the full available screen: full width minus 8px and viewport height minus the top app area.
- Fixed the mobile media rule that was shrinking the full overlay itself.
- Target results now flex to fill remaining space and scroll independently.
- Footer remains compact at the bottom while results keep maximum usable space.
"""
    if 'Bounty Hunter v0.4.3' not in c:
        cp.write_text(c.rstrip()+note+'\n')
