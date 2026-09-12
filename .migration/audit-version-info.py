from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[1]

SCRIPT_DOCS={
 'SakaLuX-Account-Auditor.user.js':'greasyfork/Account-Auditor.md',
 'SakaLuX-Bazaar-Thanker-PDA.user.js':'greasyfork/Bazaar-Thanker.md',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js':'greasyfork/Company-Intelligence.md',
 'SakaLuX-Elimination-Assistant.user.js':'greasyfork/Elimination-Assistant.md',
 'SakaLuX-Enhancer-Guard.user.js':'greasyfork/Enhancer-Guard.md',
 'SakaLuX-Market-Intelligence.user.js':'greasyfork/Market-Intelligence.md',
 'SakaLuX-Mission-Rewards.user.js':'greasyfork/Mission-Rewards.md',
 'SakaLuX-Script-Hub.user.js':'greasyfork/Script-Hub.md',
 'SakaLuX-Suite.user.js':'greasyfork/SakaLuX-Suite.md',
}
MANAGED={
 'enhancer':'SakaLuX-Enhancer-Guard.user.js',
 'bazaar':'SakaLuX-Bazaar-Thanker-PDA.user.js',
 'mission-rewards':'SakaLuX-Mission-Rewards.user.js',
 'market-intelligence':'SakaLuX-Market-Intelligence.user.js',
 'elimination-assistant':'SakaLuX-Elimination-Assistant.user.js',
}

def version_of(path):
    text=(ROOT/path).read_text(encoding='utf-8')
    m=re.search(r'^//\s*@version\s+([^\s]+)\s*$',text,re.M)
    if not m: raise SystemExit(f'No @version in {path}')
    return m.group(1).strip()

versions={p:version_of(p) for p in SCRIPT_DOCS}

notes={
 'SakaLuX-Account-Auditor.user.js': lambda v: f'**v{v}** is the current standalone Account Auditor release. It keeps the shared standalone SakaLuX dock/install-reminder behavior while remaining outside the Script Hub registry.',
 'SakaLuX-Bazaar-Thanker-PDA.user.js': lambda v: f'**v{v}** is the current Bazaar Thanker release. Its panel stays above the shared standalone dock, while settings remain accessible through Script Hub or the standalone dock without a separate floating launcher.',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js': lambda v: f'**v{v}** is the current Company Intelligence build. The information page is synchronized to the userscript metadata; Company Intelligence remains a standalone tool and is not registered in the Script Hub module registry.',
 'SakaLuX-Elimination-Assistant.user.js': lambda v: f'**v{v}** is the current Elimination Assistant release. Its panel stays above the shared standalone dock and remains accessible through Script Hub / standalone dock without a separate floating launcher.',
 'SakaLuX-Enhancer-Guard.user.js': lambda v: f'**v{v}** is the current Enhancer Guard release. Its panel stays above the shared standalone dock and remains accessible through Script Hub / standalone dock without a separate floating launcher.',
 'SakaLuX-Market-Intelligence.user.js': lambda v: f'**v{v}** is the current Market Intelligence release. Its panel stays above the shared standalone dock and remains accessible through Script Hub / standalone dock without a separate floating launcher.',
 'SakaLuX-Mission-Rewards.user.js': lambda v: f'**v{v}** is the active stable Mission Rewards release restored from before the experimental Mission Guide integration.',
 'SakaLuX-Script-Hub.user.js': lambda v: f'**v{v}** is the current Script Hub release. Installation detection uses live runtime presence only, preventing persistent installation markers from keeping deleted or disabled add-ons visible as ghost modules.',
 'SakaLuX-Suite.user.js': lambda v: f'**v{v}** is the current experimental Suite build. Suite remains standalone and intentionally outside the Script Hub registry.',
}

for script,doc_rel in SCRIPT_DOCS.items():
    p=ROOT/doc_rel
    d=p.read_text(encoding='utf-8')
    v=versions[script]
    d,n=re.subn(r'(## Current version\s*\n)(?:\s*\n)?(?:\*\*)?v?[^\n*]+(?:\*\*)?',lambda m:m.group(1)+f'**v{v}**',d,count=1)
    if n!=1: raise SystemExit(f'Current version block missing: {doc_rel}')
    replacement=f'## Current release note\n\n{notes[script](v)}\n\n## Recommended'
    d,n=re.subn(r'## Current release notes?\s*\n.*?\n## Recommended',replacement,d,count=1,flags=re.S|re.I)
    if n!=1: raise SystemExit(f'Current release note block missing: {doc_rel}')
    if script in {'SakaLuX-Account-Auditor.user.js','SakaLuX-Company-Intelligence-v1.0.0.user.js','SakaLuX-Suite.user.js'}:
        lines=d.splitlines()
        for i,line in enumerate(lines[:8]):
            if line.startswith('> '):
                if script=='SakaLuX-Suite.user.js': lines[i]='> Standalone experimental SakaLuX toolkit. Not registered in SakaLuX Script Hub.'
                elif script=='SakaLuX-Company-Intelligence-v1.0.0.user.js': lines[i]='> Standalone SakaLuX company-intelligence tool. Not registered in SakaLuX Script Hub.'
                else: lines[i]='> Standalone SakaLuX account-auditing tool. Not registered in SakaLuX Script Hub.'
                d='\n'.join(lines)+('\n' if d.endswith('\n') else '')
                break
    p.write_text(d,encoding='utf-8')

sp=ROOT/'scripts.json'
data=json.loads(sp.read_text(encoding='utf-8'))
seen=set()
for row in data.get('scripts',[]):
    sid=row.get('id')
    if sid in MANAGED:
        row['version']=versions[MANAGED[sid]]
        seen.add(sid)
missing=set(MANAGED)-seen
if missing: raise SystemExit('Managed scripts missing from scripts.json: '+', '.join(sorted(missing)))
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub fallback registry is JavaScript object syntax (single quotes / bare keys).
hp=ROOT/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
for sid,script in MANAGED.items():
    v=versions[script]
    m=re.search(rf"(id\s*:\s*'{re.escape(sid)}'.*?version\s*:\s*')([^']+)(')",h,re.S)
    if not m: raise SystemExit(f'Fallback registry row not found for {sid}')
    h=h[:m.start(2)]+v+h[m.end(2):]
hp.write_text(h,encoding='utf-8')

hdoc=ROOT/'greasyfork/Script-Hub.md'
d=hdoc.read_text(encoding='utf-8')
name_map={r['id']:r['name'] for r in data['scripts'] if r.get('id') in MANAGED}
for sid,script in MANAGED.items():
    v=versions[script]
    name=name_map[sid]
    d=re.sub(rf'({re.escape(name)}\s+\*\*v)[^*]+(\*\*)',rf'\g<1>{v}\2',d)
hdoc.write_text(d,encoding='utf-8')

print('AUTHORITATIVE VERSION MATRIX')
for script in SCRIPT_DOCS:
    print(f'{script}: {versions[script]}')
print('scripts.json managed:', {r['id']:r['version'] for r in data['scripts'] if r.get('id') in MANAGED})
