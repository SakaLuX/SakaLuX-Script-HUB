from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.9\.17(\s*$)',r'\g<1>1.9.18\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version')
text,n=re.subn(r"const VERSION = '1\.9\.17';","const VERSION = '1.9.18';",text,count=1)
if n!=1: raise SystemExit('runtime version')

needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.18',
            date: '2026-09-12',
            changes: [
                'Fixed the floating skull fallback so it is hidden whenever the native S status-bar launcher is mounted.',
                'The floating skull now appears only when neither the S status-bar launcher nor the Fly-out HUB skull is available.',
                'Keeps the Fly-out HUB skull before Messages when that navigation bar is present.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor')
text=text.replace(needle,entry,1)

old="""    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const flyoutReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.navSkull));
        button.style.setProperty('display', flyoutReady ? 'none' : 'flex', 'important');
    }
"""
new="""    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const statusReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.topSkull));
        const flyoutReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.navSkull));
        const nativeReady = statusReady || flyoutReady;
        button.style.setProperty('display', nativeReady ? 'none' : 'flex', 'important');
    }
"""
if old not in text: raise SystemExit('syncFloatingButtonVisibility block')
text=text.replace(old,new,1)

# Update health wording if present.
text=text.replace("floatingFallback: !Boolean(document.getElementById(IDS.navSkull))",
                  "floatingFallback: !Boolean(document.getElementById(IDS.topSkull)) && !Boolean(document.getElementById(IDS.navSkull))",1)

p.write_text(text,encoding='utf-8')

mp=ROOT/'greasyfork/Script-Hub.md'
doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.9\.17(\*\*)',r'\g<1>1.9.18\2',doc,count=1)
if n!=1: raise SystemExit('doc version')
if '### v1.9.18' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.9.18 — Floating fallback fix\n\n- Hides the floating skull whenever the native **S** launcher is present in Torn `statusIcons`.\n- Keeps the Fly-out **HUB** skull before Messages when that navigation bar is available.\n- Uses the floating skull only when neither native launcher can be mounted.\n',1)
mp.write_text(doc,encoding='utf-8')
print('Hub v1.9.18 fallback fix applied')
