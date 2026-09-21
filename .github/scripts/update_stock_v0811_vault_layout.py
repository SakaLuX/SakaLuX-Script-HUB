#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Stock-Manager-Advisor.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Stock-Manager-Advisor.md'
DOC=ROOT/'greasyfork'/'Stock-Manager-Advisor.md'
REL=ROOT/'releases'/'stock-manager-advisor-v0.8.11.md'
s=P.read_text()

s=s.replace('// @version      0.8.10','// @version      0.8.11',1)
s=s.replace("let v = '0.8.10';","let v = '0.8.11';",1)
s=s.replace("{version:'0.8.8'}","{version:'0.8.11'}",1)

pat=re.compile(r'''      <div class="section"><div class="title">Vault & Panic v2</div><div class="grid">\n        <label>Primary target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>\n        <label>Fallback target <select id="slx-panic-fallback"><option value="">None</option></select></label>\n        <label>Vault keep cash <input id="slx-stock-keep" value="\$\{esc\(get\(K\.keep,'0'\)\)\}" placeholder="e\.g\. 250k"></label>\n        <label>Withdraw amount <input id="slx-stock-withdraw" value="\$\{esc\(get\(K\.withdraw,'1m'\)\)\}" placeholder="e\.g\. 1m"></label>\n        <label>PANIC keep cash <input id="slx-panic-keep" value="\$\{esc\(get\(K\.panicKeep,get\(K\.keep,'0'\)\)\)\}" placeholder="e\.g\. 100k"></label>\n        <label>PANIC max spend <input id="slx-panic-max" value="\$\{esc\(get\(K\.panicMax,'0'\)\)\}" placeholder="0 = unlimited"></label>\n      </div><div class="actions slx-vault-actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault \(Keep\)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>''')
new='''      <div class="section"><div class="title">Vault & Panic v2</div><div class="grid slx-vault-grid">\n        <label>Primary target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>\n        <label>Fallback target <select id="slx-panic-fallback"><option value="">None</option></select></label>\n        <button id="slx-vault-keep" type="button">Vault (Keep)</button>\n        <label>Vault keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>\n        <button id="slx-withdraw" type="button">Withdraw</button>\n        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>\n        <button id="slx-vault-max" class="primary" type="button">Vault Max</button>\n        <button id="slx-withdraw-all" class="danger" type="button">Withdraw All</button>\n      </div>\n      <input id="slx-panic-keep" type="hidden" value="${esc(get(K.panicKeep,get(K.keep,'0')))}">\n      <input id="slx-panic-max" type="hidden" value="${esc(get(K.panicMax,'0'))}">'''
if not pat.search(s):
    raise SystemExit('Vault & Panic layout block not found')
s=pat.sub(new,s,1)

css_anchor='#slx-stock-panel .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} #slx-stock-panel label{display:grid;gap:5px;font-size:10px;color:#9aabba}'
css_new='#slx-stock-panel .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} #slx-stock-panel label{display:grid;gap:5px;font-size:10px;color:#9aabba} #slx-stock-panel .slx-vault-grid>button{align-self:end;min-height:46px;width:100%;font-weight:900} #slx-stock-panel #slx-withdraw-all.danger{background:linear-gradient(180deg,#7a2630,#561820)!important;border-color:#b54552!important;color:#fff!important}'
if css_anchor not in s:
    raise SystemExit('grid CSS anchor not found')
s=s.replace(css_anchor,css_new,1)

P.write_text(s)

data=json.loads(REG.read_text())
for e in data.get('scripts',[]):
    if e.get('id')=='stock-manager-advisor':
        e['version']='0.8.11'
        e['detailsRevision']=int(e.get('detailsRevision',1))+1
        e['release']={
          'version':'0.8.11','date':'2026-09-21','notes':[
            'Rearranges Vault & Panic controls into a clearer two-column workflow.',
            'Vault (Keep) now sits beside Vault keep cash.',
            'Withdraw now sits beside Withdraw amount.',
            'Vault Max moves to the old Withdraw position and Withdraw All is styled red.',
            'PANIC keep/max values stay preserved internally so PANIC behavior is not broken by the layout cleanup.'
          ]
        }
        break
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGE.exists():
    t=CHANGE.read_text()
    block='''## v0.8.11 — 2026-09-21\n- Rearranged **Vault & Panic v2** controls for the requested mobile flow.\n- Row 1 after targets: **Vault (Keep)** | **Vault keep cash**.\n- Next row: **Withdraw** | **Withdraw amount**.\n- Bottom row: **Vault Max** | **Withdraw All**.\n- **Withdraw All** is now red.\n- Existing PANIC keep/max values remain stored internally to preserve PANIC behavior.\n\n'''
    if '## v0.8.11 — 2026-09-21' not in t:
        if t.startswith('#'):
            pos=t.find('\n\n')+2
            t=t[:pos]+block+t[pos:]
        else:
            t=block+t
    CHANGE.write_text(t)

if DOC.exists():
    t=DOC.read_text()
    if '### v0.8.11 — Vault control layout' not in t:
        t+='''\n\n### v0.8.11 — Vault control layout\nThe Vault & Panic card now groups controls by action: Vault (Keep) beside Vault keep cash, Withdraw beside Withdraw amount, and Vault Max beside the red Withdraw All action. PANIC keep/max values remain preserved internally.\n'''
    DOC.write_text(t)

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Stock Manager & Advisor v0.8.11\n\nRelease date: **2026-09-21**\n\n## Vault & Panic layout\n- **Vault (Keep)** is paired with **Vault keep cash**.\n- **Withdraw** is paired with **Withdraw amount**.\n- **Vault Max** occupies the former Withdraw position.\n- **Withdraw All** is visually red for the destructive/full-exit action.\n- PANIC keep/max configuration is retained internally so existing PANIC behavior remains compatible.\n''')
print('Stock Manager v0.8.11 vault layout applied')
