from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

# Bazaar: create a real new release because 5.3.18 metadata and runtime disagreed.
p=ROOT/'SakaLuX-Bazaar-Thanker-PDA.user.js'
s=p.read_text(encoding='utf-8')
repls=[
    (r'(^// @version\s+)5\.3\.18(\s*$)', r'\g<1>5.3.19\2', re.M, 'bazaar metadata'),
    (r"\{version:'5\.3\.18'\}", "{version:'5.3.19'}", 0, 'bazaar standalone version'),
    (r"const BAZAAR_VERSION='5\.3\.17';", "const BAZAAR_VERSION='5.3.19';", 0, 'bazaar runtime version'),
]
for pat,rep,flags,label in repls:
    s,n=re.subn(pat,rep,s,count=1,flags=flags)
    if n!=1: raise SystemExit(label)
p.write_text(s,encoding='utf-8')

# Registry Bazaar version.
regp=ROOT/'scripts.json'
data=json.loads(regp.read_text(encoding='utf-8'))
found=False
for item in data['scripts']:
    if item['id']=='bazaar':
        if str(item['version'])!='5.3.18': raise SystemExit('unexpected bazaar registry version '+str(item['version']))
        item['version']='5.3.19'; found=True
if not found: raise SystemExit('bazaar registry missing')
regp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub: bump and make live/runtime signals authoritative before localStorage marker.
h=ROOT/'SakaLuX-Script-Hub.user.js'
t=h.read_text(encoding='utf-8')
t,n=re.subn(r'(^// @version\s+)1\.9\.27(\s*$)',r'\g<1>1.9.28\2',t,count=1,flags=re.M)
if n!=1: raise SystemExit('hub metadata')
t,n=re.subn(r"const VERSION\s*=\s*'1\.9\.27';","const VERSION = '1.9.28';",t,count=1)
if n!=1: raise SystemExit('hub runtime')
# Hub fallback registry Bazaar version.
t,n=re.subn(r"(id:\s*['\"]bazaar['\"][\s\S]{0,500}?version:\s*['\"])5\.3\.18(['\"])",r'\g<1>5.3.19\2',t,count=1)
if n!=1: raise SystemExit('hub fallback bazaar')

old='''    function getInstalledVersion(script) {
        try {
            const marker = localStorage.getItem('SakaLuX_Installed_' + script.id)
                || (script.id === 'elimination-assistant' ? localStorage.getItem('SakaLuX_Installed_elimination') : '');
            if (marker) return String(marker);
        } catch {}
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge?.dataset?.version) return String(bridge.dataset.version);
        } catch {}
        try {
            const api = script.api();
            if (api?.version) return String(api.version);
            const health = api?.health?.();
            if (health?.version) return String(health.version);
        } catch {}
        try {
            return document.querySelector(script.buttonSelector) ? '?' : null;
        } catch { return null; }
    }
'''
new='''    function getInstalledVersion(script) {
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge?.dataset?.version) return String(bridge.dataset.version);
        } catch {}
        try {
            const api = script.api();
            if (api?.version) return String(api.version);
            const health = api?.health?.();
            if (health?.version) return String(health.version);
        } catch {}
        try {
            const standalone = document.querySelector(`[data-slx-standalone-registration="${script.id}"]`);
            if (standalone?.dataset?.version) return String(standalone.dataset.version);
        } catch {}
        try {
            const marker = localStorage.getItem('SakaLuX_Installed_' + script.id)
                || (script.id === 'elimination-assistant' ? localStorage.getItem('SakaLuX_Installed_elimination') : '');
            if (marker) return String(marker);
        } catch {}
        try {
            return document.querySelector(script.buttonSelector) ? '?' : null;
        } catch { return null; }
    }
'''
if old not in t: raise SystemExit('getInstalledVersion block')
t=t.replace(old,new,1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.28',
            date: '2026-09-12',
            changes: [
                'Fixes Bazaar Thanker runtime version reporting mismatch that caused a permanent false update badge.',
                'Installed-version detection now prefers live bridge/API/standalone registration data before localStorage markers.',
                'Version synchronization validation now supports the current plain-version documentation format.'
            ]
        },
"""
if needle not in t: raise SystemExit('hub changelog anchor')
t=t.replace(needle,entry,1)
h.write_text(t,encoding='utf-8')

# Docs.
bd=ROOT/'greasyfork/Bazaar-Thanker.md'
d=bd.read_text(encoding='utf-8')
d=d.replace('## Current version\n5.3.18','## Current version\n5.3.19',1)
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

**v5.3.19** fixes the internal version-reporting mismatch from v5.3.18. The userscript metadata, standalone registration, Hub bridge, health API and installed-version marker now all report the same version, preventing Script Hub from repeatedly showing a false Bazaar update.

## Recommended""",d,count=1,flags=re.S)
if '### v5.3.19 — Runtime version synchronization' not in d:
    d=d.replace('## Release history\n','## Release history\n### v5.3.19 — Runtime version synchronization\n\n- Synchronized `@version`, `BAZAAR_VERSION`, standalone registration and Hub bridge version.\n- Fixes the persistent false `UPDATE AVAILABLE` state caused by v5.3.18 reporting itself internally as v5.3.17.\n\n',1)
bd.write_text(d,encoding='utf-8')

hd=ROOT/'greasyfork/Script-Hub.md'
d=hd.read_text(encoding='utf-8')
d=d.replace('## Current version\n1.9.27','## Current version\n1.9.28',1)
d=d.replace('- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.18**','- 💬 SakaLuX Bazaar Thanker - PDA **v5.3.19**')
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

Hub v1.9.28 fixes installed-version detection and the Bazaar false-update loop. Live module bridge/API/standalone version data is now preferred over stale localStorage markers, and Bazaar Thanker v5.3.19 synchronizes its metadata and runtime version reporting.

## Recommended""",d,count=1,flags=re.S)
if '### v1.9.28 — Installed version authority fix' not in d:
    d=d.replace('## Release history\n','## Release history\n### v1.9.28 — Installed version authority fix\n\n- Prefers live bridge/API/standalone module versions before persistent installation markers.\n- Synchronizes Bazaar Thanker to v5.3.19 after discovering the v5.3.18 runtime constant was still v5.3.17.\n\n',1)
hd.write_text(d,encoding='utf-8')

# Stable validator: accept current plain version format in docs while retaining cross-file checks.
v=ROOT/'.github/workflows/validate-userscripts.yml'
y=v.read_text(encoding='utf-8')
y=y.replace("""              if not current:
                  current = re.search(r'\\*\\*Current version:\\s*v([^*]+)\\*\\*', info_text)
              if not current or current.group(1).strip() != expected:
""","""              if not current:
                  current = re.search(r'\\*\\*Current version:\\s*v([^*]+)\\*\\*', info_text)
              if not current:
                  current = re.search(r'## Current version\\s+([0-9]+(?:\\.[0-9]+)+)', info_text)
              if not current or current.group(1).strip() != expected:
""",1)
y=y.replace("""          hub_current = re.search(r'## Current version\\s+\\*\\*v([^*]+)\\*\\*', hub_info)
          if not hub_meta or not hub_runtime or not hub_current or len({hub_meta.group(1), hub_runtime.group(1), hub_current.group(1).strip()}) != 1:
""","""          hub_current = re.search(r'## Current version\\s+\\*\\*v([^*]+)\\*\\*', hub_info)
          if not hub_current:
              hub_current = re.search(r'## Current version\\s+([0-9]+(?:\\.[0-9]+)+)', hub_info)
          if not hub_meta or not hub_runtime or not hub_current or len({hub_meta.group(1), hub_runtime.group(1), hub_current.group(1).strip()}) != 1:
""",1)
v.write_text(y,encoding='utf-8')

print('Bazaar/Hub version synchronization fix applied')
