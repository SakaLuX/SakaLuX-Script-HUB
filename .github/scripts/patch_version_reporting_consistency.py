from pathlib import Path
import re, json

# Keep runtime-reported versions in sync with userscript headers.
files = {
    'SakaLuX-Enhancer-Guard.user.js': [('1.3.31','1.3.33', "const VERSION = '1.3.31';", "const VERSION = '1.3.33';")],
    'SakaLuX-Bazaar-Thanker-PDA.user.js': [('5.3.21','5.3.23', "const BAZAAR_VERSION='5.3.21';", "const BAZAAR_VERSION='5.3.23';")],
    'SakaLuX-Mission-Rewards.user.js': [('1.0.18','1.0.20', "const VERSION = '1.0.18';", "const VERSION = '1.0.20';")],
    'SakaLuX-Market-Intelligence.user.js': [('1.17.19','1.17.21', "const VERSION = '1.17.19';", "const VERSION = '1.17.21';")],
}
for fn, reps in files.items():
    p=Path(fn); s=p.read_text(encoding='utf-8')
    for oldv,newv,old,new in reps:
        if old not in s: raise SystemExit(f'{fn}: runtime version marker missing: {old}')
        s=s.replace(old,new,1)
    p.write_text(s,encoding='utf-8')

# Hub: bump version, make installed-version detection robust, and sync fallback registry.
p=Path('SakaLuX-Script-Hub.user.js'); s=p.read_text(encoding='utf-8')
if '// @version      1.9.39' not in s or "const VERSION = '1.9.39';" not in s:
    raise SystemExit('Hub 1.9.39 markers missing')
s=s.replace('// @version      1.9.39','// @version      1.9.40',1)
s=s.replace("const VERSION = '1.9.39';","const VERSION = '1.9.40';",1)

# Add changelog entry before 1.9.39.
needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.40',
            date: '2026-09-15',
            changes: [
                'Fixes installed-version reporting when an add-on header was updated but its runtime bridge constant was still stale.',
                'Installed version detection now compares bridge, API/health and standalone registration signals and uses the newest valid version.',
                'Synchronizes runtime version constants for Enhancer, Bazaar, Missions and Market with their current userscript headers.'
            ]
        },
"""
if needle not in s: raise SystemExit('Hub changelog marker missing')
s=s.replace(needle,entry,1)

# Replace getInstalledVersion with newest-signal logic.
start=s.find('    function getInstalledVersion(script) {')
end=s.find('\n    function recordUsage(id) {', start)
if start<0 or end<0: raise SystemExit('getInstalledVersion block missing')
new_func="""    function getInstalledVersion(script) {
        const versions = [];
        const add = value => {
            const v = String(value || '').trim();
            if (/^\\d+(?:\\.\\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(v)) versions.push(v);
        };
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            add(bridge?.dataset?.version);
        } catch {}
        try {
            const api = script.api();
            add(api?.version);
            add(api?.health?.()?.version);
        } catch {}
        try {
            const standalone = document.querySelector(`[data-slx-standalone-registration="${script.id}"]`);
            add(standalone?.dataset?.version);
        } catch {}
        if (!versions.length) return null;
        return versions.reduce((best, v) => compareVersions(v, best) > 0 ? v : best, versions[0]);
    }
"""
s=s[:start]+new_func+s[end:]

# Sync offline fallback registry versions so fallback mode is not stale.
fallback_versions={
 'enhancer':'1.3.33',
 'bazaar':'5.3.23',
 'mission-rewards':'1.0.20',
 'market-intelligence':'1.17.21',
 'elimination-assistant':'1.3.31',
 'company-intelligence':'1.8.17',
}
for sid,v in fallback_versions.items():
    pattern=rf"(id: '{re.escape(sid)}',[\s\S]{{0,240}}?version: ')[^']+(')"
    s,n=re.subn(pattern,rf"\g<1>{v}\2",s,count=1)
    if n!=1: raise SystemExit(f'fallback registry version not found for {sid}')

p.write_text(s,encoding='utf-8')

# Update Hub info page current version and release note.
md=Path('greasyfork/Script-Hub.md'); m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.9.40**',m,count=1)
marker='## Current release note\n'; st=m.find(marker)
if st>=0:
    st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
    m=m[:st]+"\n**v1.9.40** fixes installed-version detection in the Hub. The Hub now compares all live version signals (module bridge, API/health and standalone registration) and uses the newest valid version, so a stale runtime constant can no longer make an up-to-date script appear outdated. Runtime constants for Enhancer, Bazaar, Missions and Market are synchronized with their userscript headers.\n"+m[en:]
h='## Release history\n'
entry="""### v1.9.40 — Installed version reporting fix

- Uses the newest valid live version signal instead of trusting the first bridge value.
- Synchronizes runtime version constants with userscript headers.
- Updates the Hub offline fallback registry to current add-on versions.

"""
if h in m and '### v1.9.40 — Installed version reporting fix' not in m:
    m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
