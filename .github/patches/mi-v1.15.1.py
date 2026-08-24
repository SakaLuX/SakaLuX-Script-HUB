from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def repl(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=repl(s,'// @version      1.15.0','// @version      1.15.1','metadata version')
s=repl(s,"const VERSION = '1.15.0';","const VERSION = '1.15.1';",'runtime version')

s=repl(s,
"            const entries=routeBasketEntries(rows);\n            const plan=buildTravelBuyPlan(destination,entries,marketMap);\n        updateLandedSession(destination,plan);\n            if(!plan?.rows?.length||!(plan.totalProfit>0)){blocked++;continue;}",
"            const entries=routeBasketEntries(rows);\n            const plan=buildTravelBuyPlan(destination,entries,marketMap);\n            if(!plan?.rows?.length||!(plan.totalProfit>0)){blocked++;continue;}",
'remove incorrect home-session capture')

s=repl(s,
"    function paintCountryBestBuys(destination,entries,marketMap){\n        document.getElementById('sl-mi-country-best')?.remove();\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const plan=buildTravelBuyPlan(destination,entries,marketMap);",
"    function paintCountryBestBuys(destination,entries,marketMap){\n        document.getElementById('sl-mi-country-best')?.remove();\n        const slots=Math.max(1,Number(settings.travelSlots)||29);\n        const plan=buildTravelBuyPlan(destination,entries,marketMap);\n        updateLandedSession(destination,plan);",
'capture session only after real landing')

s=repl(s,
"        if(!cur||cur.destination!==destination){\n            if(cur)archiveCurrentSession();",
"        const startNew=!cur||cur.destination!==destination||(phase==='FLYING'&&['LANDED','PURCHASED'].includes(cur.status));\n        if(startNew){\n            if(cur)archiveCurrentSession();",
'new repeated-destination session')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.15.1'
        entry['description']='Market/travel intelligence with route and basket optimization, Arrival Basket, in-country Best Buys, smart landing refresh and corrected local Travel Session Summary/history tracking.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.15.0**','SakaLuX Market Intelligence: **v1.15.1**',1)
release='''### SakaLuX Market Intelligence v1.15.1\n- Hotfix for **Travel Session Summary** session lifecycle.\n- Best Route Basket calculations on the home Travel screen no longer create false landed sessions for every compared country.\n- Landed session snapshots are now captured only from the real in-country **BEST BUYS** board.\n- Starting a new outbound trip to the same country correctly archives the previous landed/purchased session and creates a fresh session.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.15.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.15.0**','**Current version: v1.15.1**',1)
gf_release='''## v1.15.1 — Travel Session Tracking Hotfix\n\n- Fixed false session creation while the home Travel screen evaluates Best Route Baskets.\n- Landed-session data is now recorded only from the actual foreign-country **BEST BUYS** view.\n- Repeating a trip to the same destination now archives the previous session and starts a new one correctly.\n\n'''
gf=gf.replace('## v1.15.0',gf_release+'## v1.15.0',1)
GF.write_text(gf,encoding='utf-8')
