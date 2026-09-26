from pathlib import Path
import json, re

hub_path = Path('SakaLuX-Script-Hub.user.js')
registry = json.loads(Path('scripts.json').read_text(encoding='utf-8'))
text = hub_path.read_text(encoding='utf-8')
start_token = '    const FALLBACK_REGISTRY = '
end_token = '\n\n    let registry = '
start = text.find(start_token)
end = text.find(end_token, start)
if start < 0 or end < 0:
    raise SystemExit('Hub FALLBACK_REGISTRY boundaries not found')
payload = json.dumps(registry, indent=4, ensure_ascii=False)
replacement = start_token + payload.replace('\n', '\n    ')
text = text[:start] + replacement + text[end:]
details_pat = re.compile(r'\n\n    const FALLBACK_MODULE_DETAILS = Object\.fromEntries\(\n.*?\n    \);', re.S)
details = "\n\n    const FALLBACK_MODULE_DETAILS = Object.fromEntries(\n        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])\n    );"
if details_pat.search(text):
    text = details_pat.sub(details, text, count=1)
else:
    pos = text.find(end_token, start)
    if pos < 0: raise SystemExit('Hub registry insertion marker missing')
    text = text[:pos] + details + text[pos:]
hub_path.write_text(text, encoding='utf-8')
print('Priority 5 Hub fallback registry synchronized.')
