from pathlib import Path
import json, re

root=Path('.')
registry_path=root/'scripts.json'
registry=json.loads(registry_path.read_text(encoding='utf-8'))
notes=[
  'Adds the complete Elimination-style Stock Manager API Access sheet with live Torn API status, active-source display, standalone fallback key management and access checks.',
  'Automatically uses the shared SakaLuX Hub Torn API key first whenever Hub is installed and active; the local Stock Manager key remains the standalone fallback.',
  'CHECK ACCESS validates User Money, User Stocks and Torn Stocks access, while CLEAR LOCAL TORN KEY leaves an active Hub key untouched.',
  'Synchronizes Stock Manager runtime and registration version surfaces to v0.8.9.'
]
for row in registry.get('scripts',[]):
    if row.get('id')=='stock-manager-advisor':
        row['version']='0.8.9'
        row['release']={'version':'0.8.9','date':'2026-09-19','notes':notes}
        info=str(row.get('info') or '')
        if 'SakaLuX Hub Torn API key' not in info:
            info += '\n\nAPI Access\nUses the shared SakaLuX Hub Torn API key automatically when Hub is installed and active. A local Stock Manager key can still be saved as the standalone fallback. The dedicated API Access sheet checks User Money, User Stocks and Torn Stocks permissions.'
        row['info']=info.strip()
        break
else:
    raise SystemExit('stock-manager-advisor missing from scripts.json')
registry_path.write_text(json.dumps(registry,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Let the permanent normalizer copy registry data into Hub fallback + MD.
print('Prepared Stock Manager v0.8.9 registry release metadata.')

# workflow trigger
