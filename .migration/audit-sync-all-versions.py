from pathlib import Path
import json,re,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]

SCRIPT_DOCS={
 'SakaLuX-Script-Hub.user.js':'greasyfork/Script-Hub.md',
 'SakaLuX-Enhancer-Guard.user.js':'greasyfork/Enhancer-Guard.md',
 'SakaLuX-Bazaar-Thanker-PDA.user.js':'greasyfork/Bazaar-Thanker.md',
 'SakaLuX-Mission-Rewards.user.js':'greasyfork/Mission-Rewards.md',
 'SakaLuX-Market-Intelligence.user.js':'greasyfork/Market-Intelligence.md',
 'SakaLuX-Elimination-Assistant.user.js':'greasyfork/Elimination-Assistant.md',
 'SakaLuX-Account-Auditor.user.js':'greasyfork/Account-Auditor.md',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js':'greasyfork/Company-Intelligence.md',
 'SakaLuX-Suite.user.js':'greasyfork/SakaLuX-Suite.md',
}

MANAGED={
 'enhancer':'SakaLuX-Enhancer-Guard.user.js',
 'bazaar':'SakaLuX-Bazaar-Thanker-PDA.user.js',
 'mission-rewards':'SakaLuX-Mission-Rewards.user.js',
 'market-intelligence':'SakaLuX-Market-Intelligence.user.js',
 'elimination-assistant':'SakaLuX-Elimination-Assistant.user.js',
}

NOTE_TEMPLATES={
 'SakaLuX-Script-Hub.user.js': lambda v: f'**v{v}** is the current Script Hub release. It uses fresh registry/update cache keys after the Mission Rewards rollback so stale registry versions such as 1.0.21 cannot remain as PUBLISH PENDING. Managed-module versions are synchronized with scripts.json and the internal fallback registry.',
 'SakaLuX-Mission-Rewards.user.js': lambda v: f'**v{v}** is the restored stable Mission Rewards release. Experimental integrated Mission Hints/TornTools code is not part of this userscript, preserving its proven startup, Hub registration, ON/OFF controls and Mission Shop reward intelligence.',
 'SakaLuX-Enhancer-Guard.user.js': lambda v: f'**v{v}** is the current stable Enhancer Guard release, with the existing enhancer inventory tracking, Hub/standalone integration and TornPDA-compatible interface.',
 'SakaLuX-Bazaar-Thanker-PDA.user.js': lambda v: f'**v{v}** is the current stable Bazaar Thanker release, including buyer grouping, custom/automatic Bazaar naming, statistics/history and Hub/standalone integration.',
 'SakaLuX-Market-Intelligence.user.js': lambda v: f'**v{v}** is the current stable Market Intelligence release, with the existing market/travel intelligence, Loadout Comparator, Price Network, Bazaar Flip and TornPDA-first tools.',
 'SakaLuX-Elimination-Assistant.user.js': lambda v: f'**v{v}** is the current stable Elimination Assistant release, preserving target analysis, rotating batches, SAFE targets, Torn/FFScouter integration and TornPDA support.',
 'SakaLuX-Account-Auditor.user.js': lambda v: f'**v{v}** is the current standalone Account Auditor release. It remains outside Script Hub and keeps its read-only account auditing, snapshot and user-triggered message capture workflow.',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js': lambda v: f'**v{v}** is the current standalone Company Intelligence release, with Employee and Director modes, API-based company intelligence and no automated gameplay actions.',
 'SakaLuX-Suite.user.js': lambda v: f'**v{v}** is the current standalone SakaLuX Suite release. Suite remains separate from Script Hub and retains its own integrated module/runtime set.',
}

def version_of(path):
    text=(ROOT/path).read_text(encoding='utf-8')
    m=re.search(r'^//\s*@version\s+([^\s]+)',text,re.M)
    if not m: raise SystemExit(f'No @version in {path}')
    return m.group(1)

versions={p:version_of(p) for p in SCRIPT_DOCS}
print('REAL VERSIONS:')
for p,v in versions.items(): print(f'  {p}: {v}')

# Update each info page current version + current release note.
for script,doc in SCRIPT_DOCS.items():
    p=ROOT/doc
    s=p.read_text(encoding='utf-8')
    v=versions[script]
    s,n=re.subn(r'(## Current version\s*\n)\*\*v[^*]+\*\*',rf'\1**v{v}**',s,count=1)
    if n!=1: raise SystemExit(f'Current version heading not found in {doc}')
    note=NOTE_TEMPLATES[script](v)
    s,n=re.subn(r'## Current release note\s*\n\n.*?(?=\n\n## )',f'## Current release note\n\n{note}',s,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'Current release note section not found in {doc}')
    p.write_text(s,encoding='utf-8')

# scripts.json is canonical only for the five managed add-ons.
sp=ROOT/'scripts.json'
data=json.loads(sp.read_text(encoding='utf-8'))
rows=data.get('scripts',[])
ids={r.get('id') for r in rows}
if ids != set(MANAGED):
    raise SystemExit(f'scripts.json IDs mismatch: {sorted(ids)}')
for row in rows:
    row['version']=versions[MANAGED[row['id']]]
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Sync Hub fallback versions only; do not bump Hub version here.
hp=ROOT/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
for mid,script in MANAGED.items():
    v=versions[script]
    pat=rf"(id\s*:\s*'{re.escape(mid)}'.*?version\s*:\s*')([^']+)(')"
    h,n=re.subn(pat,rf'\g<1>{v}\3',h,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'Hub fallback row not found for {mid}')
hp.write_text(h,encoding='utf-8')

# Ensure Hub info managed-version mentions are synchronized where present.
hdoc=ROOT/'greasyfork/Script-Hub.md'
hs=hdoc.read_text(encoding='utf-8')
labels={
 'Enhancer Guard':'SakaLuX-Enhancer-Guard.user.js',
 'Bazaar Thanker':'SakaLuX-Bazaar-Thanker-PDA.user.js',
 'Mission Rewards':'SakaLuX-Mission-Rewards.user.js',
 'Market Intelligence':'SakaLuX-Market-Intelligence.user.js',
 'Elimination Assistant':'SakaLuX-Elimination-Assistant.user.js',
}
for label,script in labels.items():
    v=versions[script]
    hs=re.sub(rf'({re.escape(label)}\s+\*\*v)[^*]+(\*\*)',rf'\g<1>{v}\2',hs)
# hard guard: forbidden standalone tools must not appear in Hub info
if re.search(r'Account Auditor|SakaLuX Suite',hs,re.I):
    raise SystemExit('Forbidden standalone tool mention found in Script-Hub.md')
hdoc.write_text(hs,encoding='utf-8')

# Validate docs now expose the exact versions.
for script,doc in SCRIPT_DOCS.items():
    v=versions[script]
    s=(ROOT/doc).read_text(encoding='utf-8')
    if f'**v{v}**' not in s:
        raise SystemExit(f'{doc} missing v{v}')

# JS syntax + JSON validation.
for script in SCRIPT_DOCS:
    subprocess.run(['node','--check',str(ROOT/script)],check=True)
json.loads(sp.read_text(encoding='utf-8'))

print('AUDIT OK')
print(json.dumps({p:v for p,v in versions.items()},indent=2))
