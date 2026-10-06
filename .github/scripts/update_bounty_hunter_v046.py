from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bounty-Hunter.user.js'
DOC=ROOT/'greasyfork/Bounty-Hunter.md'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
s=P.read_text(encoding='utf-8')

s=s.replace('@version      0.4.5','@version      0.4.6',1)
s=s.replace("const VERSION='0.4.5'","const VERSION='0.4.6'",1)

old="function chip(label,on,fn){const b=document.createElement('button');b.className='slx-bh-chip'+(on?' on':'');b.textContent=label;b.setAttribute('aria-pressed',on?'true':'false');b.dataset.state=on?'on':'off';b.onclick=fn;return b}"
new="""function paintChip(b,on){
 on=!!on;
 b.classList.toggle('on',on);
 b.setAttribute('aria-pressed',on?'true':'false');
 b.dataset.state=on?'on':'off';
 b.style.setProperty('pointer-events','auto','important');
 b.style.setProperty('touch-action','manipulation','important');
 b.style.setProperty('background',on?'linear-gradient(180deg,#8a4d05,#4a2700)':'linear-gradient(180deg,#172331,#111b25)','important');
 b.style.setProperty('border-color',on?'#ff9f1a':'#38506b','important');
 b.style.setProperty('color',on?'#fff0cf':'#b4c1cf','important');
 b.style.setProperty('box-shadow',on?'inset 0 0 0 1px rgba(255,159,26,.28),0 0 14px rgba(255,159,26,.18)':'none','important');
}
function chip(label,on,fn){const b=document.createElement('button');b.className='slx-bh-chip';b.textContent=label;paintChip(b,on);b.onclick=(e)=>{e.preventDefault();e.stopPropagation();fn?.(e)};return b}"""
if old not in s:
    raise SystemExit('chip function anchor missing')
s=s.replace(old,new,1)

# Strong selector as CSS fallback in addition to inline important state paint.
anchor=".slx-bh-chip{padding:5px 8px!important;min-height:30px!important;background:linear-gradient(180deg,#172331,#111b25)!important;border-color:#38506b!important;color:#9fb0c2!important;box-shadow:none!important}.slx-bh-chip.on{background:linear-gradient(180deg,#6a3f08,#3a2104)!important;border-color:#f2a54a!important;color:#ffd29a!important;box-shadow:inset 0 0 0 1px rgba(242,165,74,.16),0 0 12px rgba(242,165,74,.10)!important}"
replace="#slx-bh .slx-bh-chip{padding:5px 8px!important;min-height:30px!important;background:linear-gradient(180deg,#172331,#111b25)!important;border-color:#38506b!important;color:#b4c1cf!important;box-shadow:none!important;pointer-events:auto!important;touch-action:manipulation!important}#slx-bh .slx-bh-chip.on,#slx-bh .slx-bh-chip[aria-pressed=\"true\"],#slx-bh .slx-bh-chip[data-state=\"on\"]{background:linear-gradient(180deg,#8a4d05,#4a2700)!important;border-color:#ff9f1a!important;color:#fff0cf!important;box-shadow:inset 0 0 0 1px rgba(255,159,26,.28),0 0 14px rgba(255,159,26,.18)!important}"
if anchor in s:
    s=s.replace(anchor,replace,1)
else:
    # append a guaranteed late override near end of userscript CSS
    s=s.replace("</style>",replace+"</style>",1) if "</style>" in s else s

P.write_text(s,encoding='utf-8')

if REG.exists():
    d=json.loads(REG.read_text(encoding='utf-8'))
    seq=d if isinstance(d,list) else d.get('scripts',[])
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.6'
            if isinstance(it.get('release'),dict):
                it['release']['version']='0.4.6'
                it['release']['date']='2026-10-06'
                it['release']['notes']=[
                    'Fixes Bounty Hunter toggle buttons so ON/OFF state is immediately visible on TornPDA.',
                    'Active controls are painted orange with inline !important styles to override generic Shared Core/Hub button rules.',
                    'Adds stronger active-state selectors, pointer-events and touch-action safeguards for mobile taps.'
                ]
    REG.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.4.6
- Fixed filter/toggle controls that visually remained dark even when enabled.
- Active controls now render orange through both high-specificity CSS and inline important state painting.
- Added mobile pointer/touch safeguards so taps reliably execute on TornPDA.
"""
    if 'Bounty Hunter v0.4.6' not in c:
        CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.4.6**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.4.6 — Reliable orange ON/OFF controls**
- Fixes filter/toggle buttons that stayed visually dark even when their setting was enabled.
- Active controls are now force-painted orange on TornPDA, while inactive controls remain dark.
- Adds stronger state selectors plus pointer/touch safeguards so mobile taps reliably execute.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    else:
        pos=d.find('\n## Changelog')
        d=d[:pos+1]+current+'\n\n'+d[pos+1:] if pos>=0 else d+'\n\n'+current
    entry="""### v0.4.6 — Reliable orange ON/OFF controls
- Fixes filter/toggle controls that visually stayed dark because generic button styles could override the active-state class.
- Active controls now use inline important painting plus high-specificity CSS for a clearly orange ON state.
- Inactive controls remain dark.
- Adds pointer-events and touch-action safeguards for TornPDA/mobile taps.

"""
    if '### v0.4.6' not in d:
        marker='## Changelog\n'
        d=d.replace(marker,marker+entry,1)
    DOC.write_text(d,encoding='utf-8')
