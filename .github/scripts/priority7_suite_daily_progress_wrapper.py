#!/usr/bin/env python3
from pathlib import Path
import runpy, re

ROOT = Path(__file__).resolve().parents[2]
try:
    runpy.run_path(str(ROOT / '.github/scripts/priority7_suite_daily_progress.py'), run_name='__main__')
except RuntimeError as exc:
    if str(exc) != 'Suite changelog marker missing':
        raise
    # The Suite userscript has already been written. Complete the documentation
    # migration using a line-ending-independent changelog anchor.
    doc_path = ROOT / 'greasyfork/SakaLuX-Suite.md'
    version = '0.9.939'
    doc = doc_path.read_text(encoding='utf-8')
    doc = re.sub(r'(?m)^\*\*v0\.9\.\d+\*\*$', f'**v{version}**', doc, count=1)
    doc = re.sub(r'(?m)^- Canonical version: \*\*v0\.9\.\d+\*\*$', f'- Canonical version: **v{version}**', doc, count=1)
    doc = re.sub(
        r'(?s)## Current release note\s+\*\*.*?\*\*\s+(?:- .*?(?:\n|$))+',
        f'## Current release note\n\n**v{version} — Suite Daily Progress Dashboard**\n'
        '- Adds a persistent daily progress dashboard with objectives, route activity and Suite module status.\n'
        '- Supports custom daily objectives, automatic local-day rollover, reset-today and 30-day bounded history.\n'
        '- Adds a Daily Progress action directly to Suite Master Control and a public bridge/API for reliable opening.\n\n',
        doc,
        count=1,
    )
    entry = f'''### v{version} — Suite Daily Progress Dashboard
- Adds a mobile-first Daily Progress dashboard to Suite Master Control.
- Tracks daily objectives, recent route activity and enabled Suite-module status locally.
- Automatically marks Gym, Crimes, Missions, Faction/OC and Travel checks when those routes are visited; Review daily plan remains manual.
- Supports custom objectives, day rollover, reset-today and a bounded 30-day local history.
- Exposes `SakaLuXSuiteDailyProgress` plus the hidden `sakalux-module-bridge-suite-daily-progress` bridge; no API key or remote sync is required.

'''
    if f'### v{version} ' not in doc:
        match = re.search(r'(?m)^## Release history / Changelog\s*$', doc)
        if not match:
            raise RuntimeError('Suite changelog heading still not found')
        pos = match.end()
        doc = doc[:pos] + '\n\n' + entry + doc[pos:].lstrip('\r\n')
    doc_path.write_text(doc, encoding='utf-8')
    print(f'Priority 7 Suite Daily Progress docs compatibility applied: v{version}')
