from pathlib import Path
import json,re

hubp=Path('SakaLuX-Script-Hub.user.js')
docp=Path('greasyfork/Script-Hub.md')
reg=json.loads(Path('scripts.json').read_text(encoding='utf-8'))['scripts']
hub=hubp.read_text(encoding='utf-8')

if '// @version      1.9.40' not in hub or "const VERSION = '1.9.40';" not in hub:
    raise SystemExit('Expected Hub v1.9.40 baseline')

# Synchronize every offline fallback-registry entry to scripts.json.
for item in reg:
    sid=re.escape(item['id'])
    expected=str(item['version'])
    pat=rf"(id:\s*['\"]{sid}['\"][\s\S]{{0,500}}?version:\s*['\"])([^'\"]+)(['\"])"
    hub,n=re.subn(pat,lambda m:m.group(1)+expected+m.group(3),hub,count=1)
    if n!=1:
        raise SystemExit(f'Fallback entry not found for {item["id"]}')

hub=hub.replace('// @version      1.9.40','// @version      1.9.41',1)
hub=hub.replace("const VERSION = '1.9.40';","const VERSION = '1.9.41';",1)

# Add release history entry near the newest entries if the changelog array is present.
marker='    const CHANGELOG = ['
if marker in hub and "version: '1.9.41'" not in hub:
    entry="""    const CHANGELOG = [
        {
            version: '1.9.41',
            date: '2026-09-16',
            changes: [
                'Synchronizes every Hub offline fallback add-on version with the canonical scripts.json registry.',
                'Fixes stale Bazaar fallback version detection found by the full repository audit.',
                'Keeps live registry/update behavior unchanged while making offline fallback state consistent.'
            ]
        },
"""
    hub=hub.replace(marker,entry,1)

hubp.write_text(hub,encoding='utf-8')

doc=docp.read_text(encoding='utf-8')
doc=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.9.41**',doc,count=1)
doc=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v1.9.41** synchronizes every offline Hub fallback add-on version with the canonical `scripts.json` registry. This fixes stale fallback version detection found during the full repository audit while keeping live registry/update behavior unchanged.\n''',doc,count=1,flags=re.S)
release='''### v1.9.41 — Fallback registry synchronization\n\n- Synchronizes all Hub offline fallback add-on versions with `scripts.json`.\n- Fixes the stale Bazaar Thanker fallback version that caused CI cross-file synchronization failure.\n- Keeps the registered add-on information list synchronized with the canonical registry.\n\n'''
doc=doc.replace('## Release history\n','## Release history\n'+release,1)
docp.write_text(doc,encoding='utf-8')
