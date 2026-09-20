from pathlib import Path
import json
import re
import shutil

OLD = '1.1.13'
NEW = '1.1.14'
DATE = '2026-09-20'
ROOT = Path('.')
SCRIPT = ROOT / 'SakaLuX-Bazaar-Smart-Pricer.user.js'
REGISTRY = ROOT / 'scripts.json'
CHANGELOG = ROOT / 'CHANGELOG-Bazaar-Smart-Pricer.md'
README = ROOT / 'README-Bazaar-Smart-Pricer.md'
GF = ROOT / 'greasyfork' / 'Bazaar-Smart-Pricer.md'
RELEASE = ROOT / 'releases' / f'bazaar-smart-pricer-v{NEW}.md'
BACKUP = ROOT / 'backups' / f'bazaar-smart-pricer-v{OLD}-{DATE}'

BACKUP.mkdir(parents=True, exist_ok=True)

# --- Main userscript ---
s = SCRIPT.read_text(encoding='utf-8')
if f'// @version      {NEW}' not in s:
    if f'// @version      {OLD}' not in s:
        raise SystemExit(f'Unexpected userscript version; expected {OLD}.')

    shutil.copy2(SCRIPT, BACKUP / f'SakaLuX-Bazaar-Smart-Pricer-v{OLD}.user.js')
    s = s.replace(f'// @version      {OLD}', f'// @version      {NEW}', 1)
    s = s.replace(f"|| '{OLD}';", f"|| '{NEW}';", 1)

    start = s.index('    async function updateAllManagePrices() {')
    end = s.index('\n    // =====================================================================\n    // FLOATING DRAG CHIP', start)
    block = s[start:end]

    if 'setTimeout(r,2000)' not in block:
        marker = '            await new Promise(r=>setTimeout(r,100));'
        pos = block.rfind(marker)
        if pos < 0:
            raise SystemExit('Could not find final per-item settle marker in Update All.')
        insert_at = pos + len(marker)
        pacing = """
            // Slow the batch down deliberately on TornPDA: Torn/React can rerender
            // a Manage row after each edit, so wait two full seconds before touching
            // the next item instead of immediately moving on.
            if(done < work.length){
                if(updateButton) updateButton.textContent=`Waiting 2s · ${done}/${work.length}`;
                await new Promise(r=>setTimeout(r,2000));
            }"""
        block = block[:insert_at] + pacing + block[insert_at:]
        s = s[:start] + block + s[end:]

    SCRIPT.write_text(s, encoding='utf-8')

# --- scripts.json registry ---
data = json.loads(REGISTRY.read_text(encoding='utf-8'))
registry_changed = False

def walk(node):
    global registry_changed
    if isinstance(node, dict):
        url = str(node.get('downloadUrl', ''))
        name = str(node.get('name', ''))
        if url.endswith('/SakaLuX-Bazaar-Smart-Pricer.user.js') or name in {'SakaLuX Bazaar Smart Pricer', 'Bazaar Smart Pricer'}:
            if node.get('version') != NEW:
                node['version'] = NEW
                registry_changed = True
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for value in node:
            walk(value)

walk(data)
if registry_changed:
    REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# --- Documentation surfaces ---
for path in (README, GF):
    if not path.exists():
        continue
    t = path.read_text(encoding='utf-8')
    t = re.sub(r'Current version:\s*\*\*v[0-9.]+\*\*', f'Current version: **v{NEW}**', t, count=1)
    t = re.sub(r'(## Current version\s*\n)\*\*v[0-9.]+\*\*', rf'\g<1>**v{NEW}**', t, count=1)
    path.write_text(t, encoding='utf-8')

entry = f"""## v{NEW} — {DATE}
- Added a **2-second delay between every item** during Manage Bazaar **Update All**.
- During the pause the chip shows **Waiting 2s · X/N**.
- Existing pricing calculations and protection rules are unchanged.
- The slower pacing is intended to reduce TornPDA/React rerender collisions that can leave a batch apparently stuck near the end.

"""
if CHANGELOG.exists():
    t = CHANGELOG.read_text(encoding='utf-8')
    if f'## v{NEW} —' not in t:
        first_nl = t.find('\n')
        t = t[:first_nl + 1] + '\n' + entry + t[first_nl + 1:]
        CHANGELOG.write_text(t, encoding='utf-8')

RELEASE.parent.mkdir(parents=True, exist_ok=True)
RELEASE.write_text(f"""# SakaLuX Bazaar Smart Pricer v{NEW}

Release date: **{DATE}**

## 2-second per-item pacing
Manage Bazaar **Update All** now deliberately waits **2000 ms between items**. The existing short DOM-settle waits are preserved, and the new pause happens only between one completed item and the next.

This makes large runs slower by design but gives Torn's React UI and TornPDA more time to finish row rerenders. It targets stalls like the screenshot where a run remains on `Pricing 29/33`.

## Progress indicator
During each pause the chip displays `Waiting 2s · X/N`, then changes back to `Pricing X/N` when the next item begins.

## Unchanged
- Price calculation / discount / markup logic
- Market reference data logic
- RW and bonus-item protection
- $1 listing protection
- Per-item manual pricing

## Validation
- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`
- `python3 -m json.tool scripts.json`
- version and 2000 ms pacing assertions
""", encoding='utf-8')

(BACKUP / 'README.md').write_text(
    f'# Bazaar Smart Pricer v{OLD} backup\n\nCreated before the v{NEW} two-second per-item pacing update on {DATE}.\n',
    encoding='utf-8'
)

print(f'Prepared Bazaar Smart Pricer v{NEW} with 2-second per-item pacing.')
