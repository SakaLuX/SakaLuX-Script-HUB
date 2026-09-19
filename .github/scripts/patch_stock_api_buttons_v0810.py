from pathlib import Path
import json

p=Path('SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

s=s.replace('// @version      0.8.9','// @version      0.8.10',1)
s=s.replace("let v = '0.8.9';","let v = '0.8.10';",1)
s=s.replace("version: '0.8.9',","version: '0.8.10',",1)
s=s.replace("version:'0.8.9'});","version:'0.8.10'});",2)

marker="#slx-stock-api-sheet .slx-stock-api-status.error span,#slx-stock-api-sheet .slx-stock-api-status.missing span{color:#f08b8b!important}"
if marker not in s:
    raise SystemExit('API status CSS marker not found')
extra=marker+"\n#slx-stock-api-sheet .slx-api-sheet-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%!important;margin:2px 0 0!important}\n#slx-stock-api-sheet .slx-api-sheet-actions>button{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 8px!important;display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important;white-space:normal!important;line-height:1.15!important}\n#slx-stock-api-sheet #slx-stock-api-clear{box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;min-width:0!important;max-width:none!important;height:42px!important;min-height:42px!important;margin:0!important;padding:0 8px!important;text-align:center!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}\n#slx-stock-api-sheet #slx-stock-api-create{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:42px!important;min-height:42px!important;margin:0!important;text-align:center!important}\n#slx-stock-api-sheet .slx-api-sheet-result{width:100%!important;box-sizing:border-box!important;padding:7px 8px!important;border:1px solid rgba(255,255,255,.06)!important;border-radius:8px!important;background:#0d141d!important;line-height:1.35!important}\n@media(max-width:420px){#slx-stock-api-sheet .slx-api-sheet-actions{grid-template-columns:1fr 1fr!important;gap:6px!important}#slx-stock-api-sheet .slx-api-sheet-actions>button,#slx-stock-api-sheet #slx-stock-api-clear,#slx-stock-api-sheet #slx-stock-api-create{font-size:10px!important;height:40px!important;min-height:40px!important;padding:0 5px!important}}"
s=s.replace(marker,extra,1)

p.write_text(s,encoding='utf-8')

reg=Path('scripts.json')
data=json.loads(reg.read_text(encoding='utf-8'))
notes=[
  'Rearranges the lower API Access controls into a clean two-column SAVE & TEST / CHECK ACCESS row with a full-width CLEAR LOCAL TORN KEY button below.',
  'Normalizes button height, width, alignment and mobile spacing so the API controls no longer wrap or sit unevenly.',
  'Keeps Hub-first API key detection and the local standalone fallback introduced in v0.8.9.'
]
for row in data.get('scripts',[]):
    if row.get('id')=='stock-manager-advisor':
        row['version']='0.8.10'
        row['release']={'version':'0.8.10','date':'2026-09-19','notes':notes}
        break
else:
    raise SystemExit('stock-manager-advisor missing from scripts.json')
reg.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Stock Manager v0.8.10 API buttons layout patched')
