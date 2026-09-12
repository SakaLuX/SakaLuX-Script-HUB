from pathlib import Path
import re, json, subprocess
ROOT=Path(__file__).resolve().parents[1]
BASE='ad61fc552f8477ca091a825ac47154b803e7c88d'
MISSION='SakaLuX-Mission-Rewards.user.js'
RAW='https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js'

def git_show(ref,path):
    return subprocess.check_output(['git','show',f'{ref}:{path}'],text=True)

# Restore the exact known-good Mission Rewards v1.0.18 file.
mission=git_show(BASE,MISSION)
# Keep update distribution on GitHub stabilization line so Hub does not follow broken 1.1.x Greasy Fork metadata.
mission=re.sub(r'^// @downloadURL .*$',f'// @downloadURL {RAW}',mission,flags=re.M)
mission=re.sub(r'^// @updateURL .*$',f'// @updateURL {RAW}',mission,flags=re.M)
(ROOT/MISSION).write_text(mission,encoding='utf-8')

# Registry -> v1.0.18 and GitHub metadata/download source.
p=ROOT/'scripts.json'; data=json.loads(p.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='mission-rewards':
        item['version']='1.0.18'
        item['metaUrl']=RAW
        item['downloadUrl']=RAW
        item['sourceUrl']=RAW
        item['description']='Mission Shop reward value, ammo ownership and weapon mod intelligence.'
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub -> v1.9.44 and Mission Rewards fallback v1.0.18.
hp=ROOT/'SakaLuX-Script-Hub.user.js'; hs=hp.read_text(encoding='utf-8')
hs=re.sub(r'(^// @version\s+)1\.9\.43(\s*$)',r'\g<1>1.9.44\2',hs,count=1,flags=re.M)
hs=hs.replace("const VERSION = '1.9.43';","const VERSION = '1.9.44';",1)
hs=re.sub(r"(id:\s*'mission-rewards',[\s\S]*?version:\s*')1\.0\.19(')",r'\g<1>1.0.18\2',hs,count=1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.44',
            date: '2026-09-13',
            changes: [
                'Mission Rewards rolled back completely to the confirmed-working v1.0.18 runtime.',
                'Removed the experimental Mission Guide integration and all later Mission Rewards changes from the active release.',
                'Registry, Hub fallback and update metadata are pinned to v1.0.18 so Hub no longer requests the broken 1.1.x line.'
            ]
        },
"""
if "version: '1.9.44'" not in hs: hs=hs.replace(needle,entry,1)
hp.write_text(hs,encoding='utf-8')

# Mission Rewards docs.
md=ROOT/'greasyfork/Mission-Rewards.md'
if md.exists():
    s=md.read_text(encoding='utf-8')
    s=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\g<1>**v1.0.18**',s,count=1)
    # remove guide-specific bullets if present
    s=re.sub(r'- Adds a \*\*Duke Mission Guide\*\*[^\n]*\n','',s)
    s=re.sub(r'- Recognizes the standard Duke mission catalogue[^\n]*\n','',s)
    s=re.sub(r'## Current release note\n[\s\S]*?(?=\n## Recommended)',"""## Current release note

**v1.0.18** is restored as the active stable release. This is the confirmed-working Mission Rewards build from before the experimental TornTools-inspired Mission Guide integration.

## Recommended""",s,count=1)
    while '## Recommended\n## Recommended\n' in s:
        s=s.replace('## Recommended\n## Recommended\n','## Recommended\n')
    md.write_text(s,encoding='utf-8')

# Hub docs.
hd=ROOT/'greasyfork/Script-Hub.md'
if hd.exists():
    s=hd.read_text(encoding='utf-8')
    s=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\g<1>**v1.9.44**',s,count=1)
    s=re.sub(r'(SakaLuX Mission Rewards \*\*v)[^*]+(\*\*)',r'\g<1>1.0.18\2',s)
    s=re.sub(r'## Current release note\n[\s\S]*?(?=\n## Recommended)',"""## Current release note

**v1.9.44** rolls Mission Rewards back completely to the confirmed-working **v1.0.18** release and pins Hub update metadata to that stable version. The experimental Mission Guide / 1.1.x line is no longer treated as the desired Mission Rewards release.

## Recommended""",s,count=1)
    while '## Recommended\n## Recommended\n' in s:
        s=s.replace('## Recommended\n## Recommended\n','## Recommended\n')
    hd.write_text(s,encoding='utf-8')

print('Rollback complete: Mission Rewards v1.0.18, Hub v1.9.44')
