#!/usr/bin/env python3
from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
SUITE=ROOT/'SakaLuX-Suite.user.js'
REG=ROOT/'scripts.json'
text=SUITE.read_text(encoding='utf-8')

# Idempotent helper: Event Lens must read only Torn's event text, never UI injected by Bazaar Thanker.
helper='''\n      function cleanEventMessageNode(node) {\n          if (!node) return '';\n          const clone = node.cloneNode(true);\n          clone.querySelectorAll(\n              '.sakalux-bt-ui, .sakalux-thanks-button, .sakalux-bt-details-button, .sakalux-bt-info, .ax-bazaar-suite-toolbar'\n          ).forEach(el => el.remove());\n          return cleanText(clone.textContent || '');\n      }\n'''
needle="  function createEventsDashboardModule(context) {\n  'use strict';"
if 'function cleanEventMessageNode(node)' not in text:
    if needle not in text:
        raise SystemExit('Event Lens factory marker not found')
    text=text.replace(needle,needle+helper,1)

# Replace the concrete message reads used by Event Lens lookup/parsing. These replacements are intentionally narrow.
patterns=[
    (r"cleanText\(\s*msgEl\.textContent\s*\)","cleanEventMessageNode(msgEl)"),
    (r"cleanText\(\s*messageEl\.textContent\s*\)","cleanEventMessageNode(messageEl)"),
    (r"cleanText\(\s*messageNode\.textContent\s*\)","cleanEventMessageNode(messageNode)"),
]
for pat,repl in patterns:
    text=re.sub(pat,repl,text)

# Also protect common multiline fallback reads, while keeping unrelated cleanText calls untouched.
text=re.sub(r"cleanText\(\s*msgEl\.innerText\s*\|\|\s*msgEl\.textContent\s*\|\|\s*''\s*\)","cleanEventMessageNode(msgEl)",text)
text=re.sub(r"cleanText\(\s*messageEl\.innerText\s*\|\|\s*messageEl\.textContent\s*\|\|\s*''\s*\)","cleanEventMessageNode(messageEl)",text)

# Bump Suite once for this fix.
m=re.search(r'(?m)^//\s*@version\s+(\d+\.\d+\.\d+)',text)
if not m: raise SystemExit('Suite @version missing')
old=m.group(1)
if old=='0.9.930':
    new='0.9.931'
    text=re.sub(r'(?m)^(//\s*@version\s+)0\.9\.930',r'\g<1>'+new,text,count=1)
    text=re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])0\.9\.930(['\"]\s*;)",r'\g<1>'+new+r'\2',text,count=1)
else:
    new=old

SUITE.write_text(text,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for row in reg.get('scripts',[]):
    src=row.get('sourceUrl','')
    if src.endswith('/SakaLuX-Suite.user.js') or row.get('id') in {'suite','sakalux-suite'}:
        row['version']=new
        rel=row.setdefault('release',{})
        rel['version']=new
        notes=rel.get('notes') if isinstance(rel.get('notes'),list) else []
        note='Event Lens now strips Bazaar Thanker helper controls and purchase-summary UI from ORIGINAL EVENT text, preventing THANKED/DETAILS/purchase totals from being concatenated into Torn event messages.'
        if note not in notes: notes.insert(0,note)
        rel['notes']=notes
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(f'Suite Bazaar event-text cleanup applied; version {new}')
