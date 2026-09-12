from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
hub=ROOT/'SakaLuX-Script-Hub.user.js'
doc=ROOT/'greasyfork/Script-Hub.md'

s=hub.read_text(encoding='utf-8')
s=s.replace('// @version      1.9.34','// @version      1.9.35',1)
s=s.replace("const VERSION = '1.9.34';","const VERSION = '1.9.35';",1)

anchor="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.35',
            date: '2026-09-13',
            changes: [
                'Installation status now uses live module presence only.',
                'Removed persistent local installation markers from installed/active detection.',
                'Deleted modules can no longer remain as installed ghost entries in Hub.'
            ]
        },
"""
if anchor not in s: raise SystemExit('changelog anchor missing')
s=s.replace(anchor,entry,1)

old="""        try {
            const marker = localStorage.getItem('SakaLuX_Installed_' + script.id)
                || (script.id === 'elimination-assistant' ? localStorage.getItem('SakaLuX_Installed_elimination') : '');
            if (marker) return String(marker);
        } catch {}
        try {
            return document.querySelector(script.buttonSelector) ? '?' : null;
        } catch { return null; }
"""
new="""        return null;
"""
if old not in s: raise SystemExit('legacy marker fallback block not found')
s=s.replace(old,new,1)

# Make the generic health fallback wording truthful.
s=s.replace("data: { detection: 'installation marker' }","data: { detection: 'live runtime' }")

hub.write_text(s,encoding='utf-8')

d=doc.read_text(encoding='utf-8')
d=re.sub(r'(## Current version\s*\n)\*\*v1\.9\.34\*\*',r'\1**v1.9.35**',d,count=1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.35** uses live runtime presence only for installation detection. Persistent `SakaLuX_Installed_*` markers and old launcher-button fallbacks no longer count as proof that an add-on is currently installed, preventing deleted or disabled scripts from remaining as ghost modules.

## Recommended""",d,count=1,flags=re.S)
doc.write_text(d,encoding='utf-8')
print('Hub live-only installation detection applied; v1.9.35')
