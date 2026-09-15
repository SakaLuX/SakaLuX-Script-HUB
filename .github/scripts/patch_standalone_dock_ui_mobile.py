from pathlib import Path
import json,re

modern = {
 'SakaLuX-Enhancer-Guard.user.js': ('1.3.31','1.3.32','enhancer'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js': ('5.3.21','5.3.22','bazaar'),
 'SakaLuX-Mission-Rewards.user.js': ('1.0.18','1.0.19','mission-rewards'),
 'SakaLuX-Market-Intelligence.user.js': ('1.17.19','1.17.20','market-intelligence'),
}

new_base = '#${DOCK_ID}{position:fixed;right:10px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(220px,calc(100vw - 20px));max-height:calc(100dvh - 190px);overflow:hidden;padding:10px;background:linear-gradient(180deg,rgba(10,14,20,.992),rgba(7,10,15,.992));border:1px solid rgba(255,255,255,.09);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(12px);font-family:Inter,Arial,sans-serif;display:none;flex-direction:column;box-sizing:border-box}'
new_open = '#${DOCK_ID}[data-open="1"]{display:flex}'
new_items = '#${DOCK_ID} .slx-dock-items{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;gap:7px;overflow-y:auto;overflow-x:hidden;padding:2px 2px 4px;overscroll-behavior:contain;scrollbar-width:thin}'
new_row = '#${DOCK_ID} .slx-dock-row{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:44px!important;flex:0 0 auto!important;margin:0!important;padding:0 12px!important;box-sizing:border-box!important;inset:auto!important;border:1px solid rgba(255,255,255,.09)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(13,20,29,.98))!important;color:#f5f7fa!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 4px 10px rgba(0,0,0,.14)!important;overflow:hidden!important;transform:none!important}'
new_install = '#${DOCK_ID} .slx-dock-install{display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:100%!important;min-height:42px!important;box-sizing:border-box!important;margin-top:9px!important;padding:9px 12px!important;border-radius:13px!important;background:linear-gradient(180deg,#9a741f,#6d5015)!important;border:1px solid rgba(240,196,78,.72)!important;color:#fff7d6!important;text-align:center!important;text-decoration:none!important;font:900 11px/1.2 Arial,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 4px 12px rgba(0,0,0,.22)!important;white-space:nowrap!important;overflow:visible!important}'

for fn,(oldv,newv,sid) in modern.items():
 p=Path(fn); s=p.read_text(encoding='utf-8')
 s=s.replace(f'// @version      {oldv}',f'// @version      {newv}',1)
 s=s.replace(f"version:'{oldv}'",f"version:'{newv}'",1)
 s=s.replace("const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant'];","const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant','company-intelligence'];",1)
 s=re.sub(r'^#\$\{DOCK_ID\}\{position:fixed;right:10px;bottom:74px;.*?display:none\}$',new_base,s,count=1,flags=re.M)
 s=s.replace('#${DOCK_ID}[data-open="1"]{display:block}',new_open,1)
 s=re.sub(r'^#\$\{DOCK_ID\} \.slx-dock-items\{.*?\}$',new_items,s,count=1,flags=re.M)
 s=re.sub(r'^#\$\{DOCK_ID\} \.slx-dock-row\{.*?\}$',new_row,s,count=1,flags=re.M)
 s=re.sub(r'^#\$\{DOCK_ID\} \.slx-dock-install\{.*?\}$',new_install,s,count=1,flags=re.M)
 if new_base not in s or new_install not in s or new_items not in s:
  raise SystemExit(f'UI patch failed for {fn}')
 p.write_text(s,encoding='utf-8')

# Account Auditor can win the shared STYLE_ID race, so make its older dock safe and readable too.
p=Path('SakaLuX-Account-Auditor.user.js'); s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.3.2','// @version      1.3.3',1)
s=re.sub(r'^#\$\{DOCK_ID\}\{position:fixed;right:10px;bottom:72px;.*?font:12px Arial,sans-serif\}$',
 '#${DOCK_ID}{position:fixed;right:10px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000;display:flex;flex-direction:column;gap:7px;width:min(220px,calc(100vw - 20px));max-height:calc(100dvh - 190px);overflow:hidden;padding:10px;background:rgba(13,17,23,.985);border:1px solid #465365;border-radius:16px;box-shadow:0 12px 34px rgba(0,0,0,.5);font:12px Arial,sans-serif;box-sizing:border-box}',s,count=1,flags=re.M)
s=s.replace('#${DOCK_ID} .slx-dock-install{background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-decoration:none!important;text-align:center!important;display:block!important}',
 '#${DOCK_ID} .slx-dock-install{background:linear-gradient(180deg,#9a741f,#6d5015)!important;border:1px solid #f0c44e!important;color:#fff7d6!important;text-decoration:none!important;text-align:center!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-height:42px!important;font-weight:900!important}',1)
s=s.replace('#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:5px}', '#${DOCK_ID} .slx-dock-items{display:flex;flex:1 1 auto;min-height:0;overflow-y:auto;flex-direction:column;gap:7px}',1)
p.write_text(s,encoding='utf-8')

sp=Path('scripts.json'); data=json.loads(sp.read_text(encoding='utf-8'))
versions={'enhancer':'1.3.32','bazaar':'5.3.22','mission-rewards':'1.0.19','market-intelligence':'1.17.20'}
for x in data.get('scripts',[]):
 if x.get('id') in versions: x['version']=versions[x['id']]
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
