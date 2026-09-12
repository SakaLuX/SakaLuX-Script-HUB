from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

versions={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.29','1.3.30','VERSION'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.20','5.3.21','BAZAAR_VERSION'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.17','1.0.18','VERSION'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.17','1.17.18','VERSION'),
 'SakaLuX-Elimination-Assistant.user.js':('1.3.29','1.3.30','VERSION'),
}

LAYER_CSS='''\n/* Keep managed add-on panels above the shared standalone dock. */\n:where(\n  [id^="sl-eg-"][id*="panel" i],\n  [id^="sakalux-bt-"][id*="settings" i],\n  [id^="sl-mr-"][id*="panel" i],\n  [id^="sl-mri-"][id*="panel" i],\n  [id^="sl-mi-"][id*="panel" i],\n  #slx-elim,\n  [id^="slx-elim-"][id*="panel" i]\n){z-index:2147483646!important;}\n#sakalux-standalone-dock{z-index:2147483500!important;}\n'''

for fn,(old,new,const) in versions.items():
    p=ROOT/fn
    s=p.read_text(encoding='utf-8')
    if LAYER_CSS.strip() not in s:
        marker='/* SakaLuX Standalone Dock Bootstrap — END */'
        if marker in s:
            s=s.replace(marker,LAYER_CSS+'\n'+marker,1)
        else:
            # Fallback: inject once before first closing style template used by standalone bootstrap.
            idx=s.find('document.head.appendChild(style)')
            if idx<0: raise SystemExit(f'{fn}: standalone style anchor missing')
            s=s[:idx]+"const sakaluxLayerStyle=document.createElement('style');sakaluxLayerStyle.textContent=`"+LAYER_CSS.replace('`','\\`')+"`;document.head.appendChild(sakaluxLayerStyle);\n  "+s[idx:]
    s=re.sub(r'(^// @version\s+)'+re.escape(old)+r'(\s*$)',r'\g<1>'+new+r'\2',s,count=1,flags=re.M)
    if const=='VERSION':
        s=re.sub(r"const VERSION\s*=\s*['\"]"+re.escape(old)+r"['\"]",f"const VERSION = '{new}'",s,count=1)
    else:
        s=re.sub(r"const BAZAAR_VERSION\s*=\s*['\"]"+re.escape(old)+r"['\"]",f"const BAZAAR_VERSION='{new}'",s,count=1)
    s=s.replace(f"version:'{old}'",f"version:'{new}'")
    p.write_text(s,encoding='utf-8')

# Registry versions
rp=ROOT/'scripts.json'; data=json.loads(rp.read_text(encoding='utf-8'))
mapv={'enhancer':'1.3.30','bazaar':'5.3.21','mission-rewards':'1.0.18','market-intelligence':'1.17.18','elimination-assistant':'1.3.30'}
for item in data['scripts']:
    if item.get('id') in mapv: item['version']=mapv[item['id']]
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback versions + Hub version/release note
hp=ROOT/'SakaLuX-Script-Hub.user.js'; h=hp.read_text(encoding='utf-8')
for sid,v in mapv.items():
    h=re.sub(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>'+v+r'\2',h,count=1)
h=re.sub(r'(^// @version\s+)1\.9\.32(\s*$)',r'\g<1>1.9.33\2',h,count=1,flags=re.M)
h=h.replace("const VERSION = '1.9.32';","const VERSION = '1.9.33';",1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.33',
            date: '2026-09-12',
            changes: [
                'Places every managed add-on panel above the shared standalone dock.',
                'Keeps the standalone SakaLuX Scripts dock below active module panels so it never covers controls or content.',
                'Synchronizes all five managed add-on patch versions after the stacking fix.'
            ]
        },
"""
if "version: '1.9.33'" not in h: h=h.replace(needle,entry,1)
hp.write_text(h,encoding='utf-8')

# Dedicated info docs
info={
 'greasyfork/Enhancer-Guard.md':('1.3.29','1.3.30'),
 'greasyfork/Bazaar-Thanker.md':('5.3.20','5.3.21'),
 'greasyfork/Mission-Rewards.md':('1.0.17','1.0.18'),
 'greasyfork/Market-Intelligence.md':('1.17.17','1.17.18'),
 'greasyfork/Elimination-Assistant.md':('1.3.29','1.3.30'),
}
for fn,(old,new) in info.items():
    p=ROOT/fn; s=p.read_text(encoding='utf-8')
    s=s.replace(f'**v{old}**',f'**v{new}**',1)
    # prepend concise release bullet if release section exists
    rel='## Current release notes\n'
    if rel in s and 'standalone dock' not in s.lower().split(rel,1)[1][:400]:
        s=s.replace(rel,rel+f'- **v{new}:** Keeps this add-on panel above the shared standalone dock so the dock never covers the interface.\n',1)
    p.write_text(s,encoding='utf-8')

# Hub info
p=ROOT/'greasyfork/Script-Hub.md'; s=p.read_text(encoding='utf-8')
s=s.replace('## Current version\n**v1.9.32**','## Current version\n**v1.9.33**',1)
for name,v in [('SakaLuX Enhancer Guard','1.3.30'),('SakaLuX Bazaar Thanker - PDA','5.3.21'),('SakaLuX Mission Rewards','1.0.18'),('SakaLuX Market Intelligence','1.17.18'),('SakaLuX Elimination Assistant','1.3.30')]:
    s=re.sub(r'(- .*'+re.escape(name)+r' \*\*v)[^*]+(\*\*)',r'\g<1>'+v+r'\2',s)
sec='## Current release notes\n'
if sec in s:
    s=re.sub(r'## Current release notes\n[\s\S]*?\n## Recommended',"""## Current release notes
- **v1.9.33:** All five managed add-on panels now sit above the shared standalone dock. The dock remains available, but it can no longer cover an open script panel.

## Recommended""",s,count=1)
p.write_text(s,encoding='utf-8')

# Invariants
for fn,(_,new,const) in versions.items():
    s=(ROOT/fn).read_text(encoding='utf-8')
    if f'@version      {new}' not in s: raise SystemExit(f'{fn}: metadata bump failed')
    if 'z-index:2147483646!important' not in s or '#sakalux-standalone-dock{z-index:2147483500!important;}' not in s:
        raise SystemExit(f'{fn}: layering CSS missing')
print('Standalone layering fixed across all managed scripts')
