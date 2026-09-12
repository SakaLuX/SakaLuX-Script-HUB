from pathlib import Path
import json,re

FILES={
'enhancer':('SakaLuX-Enhancer-Guard.user.js','VERSION','greasyfork/Enhancer-Guard.md'),
'bazaar':('SakaLuX-Bazaar-Thanker-PDA.user.js','BAZAAR_VERSION','greasyfork/Bazaar-Thanker.md'),
'mission-rewards':('SakaLuX-Mission-Rewards.user.js','VERSION','greasyfork/Mission-Rewards.md'),
'market-intelligence':('SakaLuX-Market-Intelligence.user.js','VERSION','greasyfork/Market-Intelligence.md'),
'elimination-assistant':('SakaLuX-Elimination-Assistant.user.js','VERSION','greasyfork/Elimination-Assistant.md'),
}

def bump(v):
    p=v.split('.'); p[-1]=str(int(p[-1])+1); return '.'.join(p)

registry=json.loads(Path('scripts.json').read_text())
versions={}
for item in registry['scripts']:
    if item['id'] in FILES:
        item['version']=bump(str(item['version']))
        versions[item['id']]=item['version']
Path('scripts.json').write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n')

release_note='Made the S badge inside the standalone dock a real close control. Tapping the header S now closes the panel immediately while the native Torn S launcher continues to toggle the dock. Added button semantics, touch feedback and accessibility labels without changing the ultra-professional dock layout.'

for sid,(fn,runtime,md) in FILES.items():
    p=Path(fn); t=p.read_text(); v=versions[sid]
    t=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+v,t,count=1,flags=re.M)
    t=re.sub(r"const "+runtime+r"\s*=\s*['\"][^'\"]+['\"]",lambda m: re.sub(r"['\"][^'\"]+['\"]$","'"+v+"'",m.group(0)),t,count=1)
    t=re.sub(r"version:'[^']+'", "version:'"+v+"'", t, count=1)

    # Turn the decorative S into a real accessible close button.
    t=t.replace(
        '#${DOCK_ID} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2)}',
        '#${DOCK_ID} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;padding:0;margin:0;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}#${DOCK_ID} .slx-dock-mark:active{transform:scale(.92);background:linear-gradient(180deg,#344256,#202b39)}'
    )
    t=t.replace(
        '<span class=\"slx-dock-mark\">S</span>',
        '<button type=\"button\" class=\"slx-dock-mark\" aria-label=\"Close SakaLuX Scripts\" title=\"Close SakaLuX Scripts\">S</button>'
    )
    old="(document.body||document.documentElement).appendChild(d); return d;"
    new="(document.body||document.documentElement).appendChild(d); const close=d.querySelector('.slx-dock-mark'); if(close) close.onclick=e=>{e.preventDefault();e.stopPropagation();toggleDock(false);}; return d;"
    if old not in t:
        raise SystemExit(f'ensureDock append marker missing in {fn}')
    t=t.replace(old,new,1)
    p.write_text(t)

    dp=Path(md)
    if dp.exists():
        x=dp.read_text()
        x=re.sub(r'(## Current version\s*\n\s*`?v?)[0-9.]+(`?)',lambda m:m.group(1)+v+m.group(2),x,count=1)
        # Replace current release note body up to next heading.
        x=re.sub(r'(## Current release note\s*\n)([\s\S]*?)(?=\n## )',lambda m:m.group(1)+'\n'+release_note+'\n',x,count=1)
        dp.write_text(x)

# Bump Hub and synchronize fallback managed versions.
hp=Path('SakaLuX-Script-Hub.user.js'); h=hp.read_text()
m=re.search(r'^// @version\s+([^\s]+)',h,re.M); hv=bump(m.group(1))
h=re.sub(r'(^// @version\s+)[^\s]+',r'\g<1>'+hv,h,count=1,flags=re.M)
h=re.sub(r"const VERSION\s*=\s*'[^']+'", "const VERSION = '"+hv+"'", h, count=1)
for sid,v in versions.items():
    name={'enhancer':'Enhancer Guard','bazaar':'Bazaar Thanker','mission-rewards':'Mission Rewards','market-intelligence':'Market Intelligence','elimination-assistant':'Elimination Assistant'}[sid]
    h=re.sub(r"(name:\s*'"+re.escape(name)+r"'[\s\S]{0,180}?version:\s*')[^']+(')",r'\g<1>'+v+r'\2',h,count=1)
entry="""        {\n            version: '%s',\n            date: '2026-09-12',\n            changes: [\n                'The S badge inside the standalone dock now closes the dock when tapped.',\n                'Kept the native Torn S status launcher as the primary open/close toggle.',\n                'Added accessible button semantics and touch feedback without changing the final dock layout.'\n            ]\n        },\n"""%hv
h=h.replace('    const HUB_CHANGELOG = [\n','    const HUB_CHANGELOG = [\n'+entry,1)
hp.write_text(h)

# Hub documentation
hubmd=Path('greasyfork/Script-Hub.md')
if hubmd.exists():
    x=hubmd.read_text()
    x=re.sub(r'(## Current version\s*\n\s*`?v?)[0-9.]+(`?)',lambda m:m.group(1)+hv+m.group(2),x,count=1)
    x=re.sub(r'(## Current release note\s*\n)([\s\S]*?)(?=\n## )',lambda m:m.group(1)+'\n'+release_note+'\n',x,count=1)
    for sid,v in versions.items():
        names={'enhancer':'Enhancer Guard','bazaar':'Bazaar Thanker','mission-rewards':'Mission Rewards','market-intelligence':'Market Intelligence','elimination-assistant':'Elimination Assistant'}
        x=re.sub(r'('+re.escape(names[sid])+r'[^\n]*?v)[0-9.]+',r'\g<1>'+v,x)
    hubmd.write_text(x)

print('published',versions,'hub',hv)
