from pathlib import Path
import json
import re
import shutil

OLD = "1.1.13"
NEW = "1.1.14"
DATE = "2026-09-20"
ROOT = Path('.')
SCRIPT = ROOT / 'SakaLuX-Bazaar-Smart-Pricer.user.js'
CHANGELOG = ROOT / 'CHANGELOG-Bazaar-Smart-Pricer.md'
README = ROOT / 'README-Bazaar-Smart-Pricer.md'
GF = ROOT / 'greasyfork' / 'Bazaar-Smart-Pricer.md'
REGISTRY = ROOT / 'scripts.json'
RELEASE = ROOT / 'releases' / f'bazaar-smart-pricer-v{NEW}.md'
BACKUP = ROOT / 'backups' / f'bazaar-smart-pricer-v{OLD}-{DATE}'

s = SCRIPT.read_text(encoding='utf-8')
if f'// @version      {NEW}' in s:
    print('Main script already updated; continuing release-surface sync.')
else:
    if f'// @version      {OLD}' not in s:
        raise SystemExit(f'Expected source version {OLD}, found another version.')

    BACKUP.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SCRIPT, BACKUP / f'SakaLuX-Bazaar-Smart-Pricer-v{OLD}.user.js')

    s = s.replace(f'// @version      {OLD}', f'// @version      {NEW}', 1)
    s = s.replace(f"|| '{OLD}';", f"|| '{NEW}';", 1)

    anchor = """            await new Promise(r=>setTimeout(r,100));\n        }"""
    replacement = """            await new Promise(r=>setTimeout(r,100));\n            // TornPDA/React can rerender Manage rows after each price update.\n            // Give the page a full 2 seconds to settle before touching the next item.\n            if(done < work.length){\n                if(updateButton) updateButton.textContent=`Waiting 2s · ${done}/${work.length}`;\n                await new Promise(r=>setTimeout(r,2000));\n            }\n        }"""
    if anchor not in s:
        raise SystemExit('Could not find the per-item batch delay anchor.')
    s = s.replace(anchor, replacement, 1)
    SCRIPT.write_text(s, encoding='utf-8')

# Registry version sync.
data = json.loads(REGISTRY.read_text(encoding='utf-8'))
changed = False

def walk(node):
    global changed
    if isinstance(node, dict):
        url = str(node.get('downloadUrl', ''))
        name = str(node.get('name', ''))
        if url.endswith('/SakaLuX-Bazaar-Smart-Pricer.user.js') or name == 'SakaLuX Bazaar Smart Pricer':
            if node.get('version') != NEW:
                node['version'] = NEW
                changed = True
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node:
            walk(v)

walk(data)
if changed:
    REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Documentation/version surfaces.
for path in (README, GF):
    if not path.exists():
        continue
    t = path.read_text(encoding='utf-8')
    t = re.sub(r'Current version:\s*\*\*v[0-9.]+\*\*', f'Current version: **v{NEW}**', t, count=1)
    t = re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*', rf'\1**v{NEW}**', t, count=1)
    path.write_text(t, encoding='utf-8')

entry = f"""## v{NEW} — {DATE}\n- Added a **2-second settle delay between every item** during Manage Bazaar **Update All**.\n- Progress now briefly shows **Waiting 2s · X/N** so it is clear the batch is intentionally pacing itself.\n- Existing per-item pricing logic, market-value calculation, RW/bonus protection, and price writes are unchanged.\n- The extra pause is specifically to reduce TornPDA/React row-rerender collisions that can leave the batch apparently stuck near the end.\n\n"""
if CHANGELOG.exists():
    t = CHANGELOG.read_text(encoding='utf-8')
    if f'## v{NEW} —' not in t:
        pos = t.find('\n', t.find('# ')) + 1
        t = t[:pos] + '\n' + entry + t[pos:]
        CHANGELOG.write_text(t, encoding='utf-8')

RELEASE.parent.mkdir(parents=True, exist_ok=True)
RELEASE.write_text(f"""# SakaLuX Bazaar Smart Pricer v{NEW}\n\nRelease date: **{DATE}**\n\n## TornPDA stability pacing\nThe Manage Bazaar **Update All** batch now waits **2 full seconds between items**. The existing short DOM-settle waits are kept, then a dedicated 2000 ms inter-item pause runs before the next row is processed.\n\nThis intentionally makes a 33-item run slower, but gives Torn's React UI time to finish row rerenders and should reduce the end-of-batch stalls such as remaining on `Pricing 29/33`.\n\n## UI\nWhile the pause is active, the floating action shows `Waiting 2s · X/N`, then returns to `Pricing X/N` for the next item.\n\n## Unchanged\n- Price calculation and discount/markup logic\n- Item Market / market-value data logic\n- RW weapon and bonus-item protection\n- $1 item protection\n- Per-item manual pricing\n\n## Validation\n- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`\n- `python3 -m json.tool scripts.json`\n- version assertions for v{NEW}\n""", encoding='utf-8')

(BACKUP / 'README.md').write_text(
    f'# Bazaar Smart Pricer v{OLD} backup\n\nBackup created before v{NEW} 2-second per-item pacing update on {DATE}.\n',
    encoding='utf-8'
)

print(f'Prepared Bazaar Smart Pricer v{NEW}.')
