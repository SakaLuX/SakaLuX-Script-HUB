#!/usr/bin/env python3
from pathlib import Path
import json, re
from datetime import date

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = ROOT / 'scripts.json'
BEGIN = '/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
END = '/* SakaLuX Standalone Dock Bootstrap — END */'
CANON_END = '/* SakaLuX Canonical Installed Version — END */'
SMART = ROOT / 'SakaLuX-Bazaar-Smart-Pricer.user.js'
SOURCE = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
NEW_VERSION = '1.1.8'

registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
active = [row for row in registry.get('scripts', []) if row.get('active', True)]
paths = {row['id']: ROOT / Path(row['sourceUrl']).name for row in active}
expected = {
    'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
    'elimination-assistant','company-intelligence','stock-manager-advisor'
}
ids = set(paths)
if ids != expected:
    raise SystemExit(f'Unexpected active Hub module set: {sorted(ids)}')

source_text = SOURCE.read_text(encoding='utf-8')
if BEGIN not in source_text or END not in source_text:
    raise SystemExit('Canonical Company standalone bootstrap not found')
start = source_text.index(BEGIN)
end = source_text.index(END, start) + len(END)
block = source_text[start:end]

# Convert the canonical Company bootstrap into the Smart Pricer registration.
self_pat = re.compile(r"const SELF=Object\.assign\(\{.*?\},\{version:'[^']+'\}\);", re.S)
replacement = "const SELF=Object.assign({\"id\":\"bazaar-smart-pricer\",\"name\":\"Bazaar Smart Pricer\",\"icon\":\"💰\",\"selector\":\".qp-chip\",\"fallback\":\"https://www.torn.com/bazaar.php\"},{version:'1.1.8'});"
block, n = self_pat.subn(replacement, block, count=1)
if n != 1:
    raise SystemExit('Could not rewrite standalone SELF registration')
block = block.replace("'enhancer','bazaar','mission-rewards'", "'enhancer','bazaar','bazaar-smart-pricer','mission-rewards'")

text = SMART.read_text(encoding='utf-8')
if BEGIN not in text:
    if CANON_END not in text:
        raise SystemExit('Smart Pricer canonical marker end missing')
    text = text.replace(CANON_END, CANON_END + '\n\n' + block, 1)
else:
    s = text.index(BEGIN)
    e = text.index(END, s) + len(END)
    text = text[:s] + block + text[e:]

# Bump Smart Pricer and keep every obvious runtime version surface synchronized.
text = re.sub(r'(?m)^(//\s*@version\s+)\S+', r'\g<1>'+NEW_VERSION, text, count=1)
text = re.sub(r"let v = '[^']+';", f"let v = '{NEW_VERSION}';", text, count=1)
text = re.sub(r"(const VERSION = .*?\|\|\s*)'[^']+'", r"\1'"+NEW_VERSION+"'", text, count=1)
text = text.replace("{version:'1.1.7'}", "{version:'1.1.8'}", 1)
SMART.write_text(text, encoding='utf-8')

# Every managed module must know Smart Pricer's shared-dock order entry.
for sid, path in paths.items():
    t = path.read_text(encoding='utf-8')
    if sid != 'bazaar-smart-pricer' and BEGIN not in t:
        raise SystemExit(f'{sid}: missing standalone dock bootstrap')
    if BEGIN in t and "'bazaar-smart-pricer'" not in t[t.index(BEGIN):t.index(END, t.index(BEGIN))+len(END)]:
        t = t.replace("'enhancer','bazaar','mission-rewards'", "'enhancer','bazaar','bazaar-smart-pricer','mission-rewards'", 1)
        path.write_text(t, encoding='utf-8')

# Update canonical registry release metadata; normalization will propagate it to Hub/docs.
for row in active:
    if row['id'] == 'bazaar-smart-pricer':
        row['version'] = NEW_VERSION
        row['detailsRevision'] = int(row.get('detailsRevision') or 0) + 1
        row['release'] = {
            'version': NEW_VERSION,
            'date': date.today().isoformat(),
            'notes': [
                'Adds the same shared SakaLuX Standalone Dock bootstrap used by the other managed Hub modules.',
                'Registers Bazaar Smart Pricer in the standalone dock when Script Hub is absent, while suppressing the dock when Hub is active.',
                'Synchronizes the shared standalone module order across all eight active Hub modules so Bazaar Smart Pricer appears beside the other managed tools.'
            ]
        }
        break
else:
    raise SystemExit('bazaar-smart-pricer registry row missing')
REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Final audit: all eight active managed modules must have the shared bootstrap and Smart order entry.
for sid, path in paths.items():
    t = path.read_text(encoding='utf-8')
    if BEGIN not in t or END not in t:
        raise SystemExit(f'{sid}: standalone bootstrap audit failed')
    segment = t[t.index(BEGIN):t.index(END, t.index(BEGIN))+len(END)]
    if "'bazaar-smart-pricer'" not in segment:
        raise SystemExit(f'{sid}: standalone order missing bazaar-smart-pricer')
print('Standalone dock audit passed for all 8 active Hub modules; Smart Pricer updated to v1.1.8.')
