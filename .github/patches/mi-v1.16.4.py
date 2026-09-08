from pathlib import Path
import json

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text()
s=s.replace('// @version      1.16.3','// @version      1.16.4',1)
s=s.replace("const VERSION = '1.16.3';","const VERSION = '1.16.4';",1)
s=s.replace('const plan=buildTravelBuyPlan(destination,entries,marketMap,availableCash);','const plan=buildTravelBuyPlan(destination,entries,marketMap);',1)
needle='function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){\n        document.getElementById(\'sl-mi-country-best\')?.remove();\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const plan=buildTravelBuyPlan(destination,entries,marketMap);'
repl='function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){\n        document.getElementById(\'sl-mi-country-best\')?.remove();\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const plan=buildTravelBuyPlan(destination,entries,marketMap,availableCash);'
if needle not in s: raise SystemExit('country best anchor not found')
s=s.replace(needle,repl,1)
p.write_text(s)

jp=Path('scripts.json')
data=json.loads(jp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='market-intelligence': x['version']='1.16.4'
jp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

up=Path('UPDATE-INFO.md')
u=up.read_text().replace('SakaLuX Market Intelligence: **v1.16.3**','SakaLuX Market Intelligence: **v1.16.4**',1)
entry="""### SakaLuX Market Intelligence v1.16.4\n- Hotfix: restored BEST ROUTE BASKET to its normal budget logic after v1.16.3 accidentally referenced the in-country live-cash variable there.\n- In-country **BEST BUYS** now correctly passes the automatically fetched Torn on-hand cash into the basket optimizer.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.3.user.js`.\n\n"""
anchor='## Latest changes\n\n'
if entry not in u:u=u.replace(anchor,anchor+entry,1)
up.write_text(u)

mp=Path('greasyfork/Market-Intelligence.md')
m=mp.read_text().replace('**Current version: v1.16.3**','**Current version: v1.16.4**',1)
entry2="""## v1.16.4\n\n- Hotfixes the v1.16.3 live-cash change.\n- **BEST BUYS** now correctly uses the player's automatically fetched Torn on-hand cash as its basket budget.\n- BEST ROUTE BASKET remains independent and keeps its existing Travel budget behavior.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.3.user.js`.\n\n"""
pos=m.find('\n## v1.16.3')
if entry2 not in m:
    if pos!=-1:m=m[:pos+1]+entry2+m[pos+1:]
    else:m += '\n'+entry2
mp.write_text(m)
