from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'greasyfork' / 'Market-Intelligence.md'

d = DOC.read_text(encoding='utf-8')
d = re.sub(r'- Verified: \*\*\d{4}-\d{2}-\d{2}\*\*', '- Verified: **2026-09-30**', d, count=1)
d = re.sub(r'- Canonical version: \*\*v[^*]+\*\*', '- Canonical version: **v1.17.57**', d, count=1)

current = '''## Current release note

**v1.17.57 — Automatic cash + selectable Best Buys**
- Best Buys detects the live Torn cash balance automatically, with the visible foreign-travel page balance preferred and Torn API used as fallback.
- Every Best Buys candidate can be selected as the active plan instead of forcing the first recommendation.
- The selected candidate persists per destination and quantity is recalculated from live cash, travel slots and current foreign stock.
- MARK PLAN BOUGHT records the selected candidate and calculated quantity in the Travel Session.

'''
d = re.sub(r'## Current release note\n.*?(?=## Release history / Changelog\n)', current, d, count=1, flags=re.S)

entry = '''### v1.17.57 — Automatic cash + selectable Best Buys
- Best Buys detects the live Torn cash balance automatically, with the visible foreign-travel page balance preferred and Torn API used as fallback.
- Every Best Buys candidate can be selected as the active plan instead of forcing the first recommendation.
- The selected candidate persists per destination and quantity is recalculated from live cash, travel slots and current foreign stock.
- MARK PLAN BOUGHT records the selected candidate and calculated quantity in the Travel Session.

'''
# Remove any older/duplicate v1.17.57 history entry, then put the release at the top of history.
d = re.sub(r'\n*### v1\.17\.57\b.*?(?=\n### |\Z)', '\n', d, flags=re.S)
marker = '## Release history / Changelog\n'
if marker not in d:
    raise SystemExit('Release history marker missing')
d = d.replace(marker, marker + '\n' + entry, 1)

DOC.write_text(d.rstrip() + '\n', encoding='utf-8')
