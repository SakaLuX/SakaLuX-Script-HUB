from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
DOC = ROOT / 'greasyfork/Company-Intelligence.md'
VERSION = '1.8.43'

doc = DOC.read_text(encoding='utf-8')
new_section = '''## Current release note

**v1.8.43 — Generic company position requirements and manual editor**
- Detects Primary and Secondary requirements from Company Positions for arbitrary company types instead of only Pub roles.
- Adds **EDIT POSITIONS** in the Position tab so missing requirements can be entered and saved manually for the current company.
- Prioritizes Torn API requirements, then Company Positions, then manual values, and uses coworker medians only as the final estimated fallback.
- Clears saved position requirements automatically when the player changes company and labels coworker-only results as **ESTIMATED MATCH**.
'''
pat = re.compile(r'## Current release note\n.*?(?=\n## Release history / Changelog)', re.S)
if not pat.search(doc):
    raise SystemExit('Current release note section not found')
doc = pat.sub(new_section.rstrip() + '\n', doc, count=1)
DOC.write_text(doc, encoding='utf-8')
