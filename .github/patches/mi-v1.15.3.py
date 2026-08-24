from pathlib import Path
import json
ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def repl(t,a,b,label):
    if a not in t: raise SystemExit('missing '+label)
    return t.replace(a,b,1)

s=SRC.read_text(encoding='utf-8')
s=repl(s,'// @version      1.15.2','// @version      1.15.3','meta')
s=repl(s,"const VERSION = '1.15.2';","const VERSION = '1.15.3';",'runtime')
# Keep the current Arrival panel visible while async refreshes happen. Remove only when flight state is invalid.
s=repl(s,"    async function renderArrivalStock(){\n        document.getElementById('sl-mi-arrival')?.remove();\n        state.arrivalRows=0;state.flightDestination='';state.landingMins=null;",
"    async function renderArrivalStock(){\n        const previousArrival=document.getElementById('sl-mi-arrival');\n        state.arrivalRows=0;state.flightDestination='';state.landingMins=null;",
'arrival start')
s=repl(s,"        if(!settings.arrivalStock||!detectInFlight()) return;",
"        if(!settings.arrivalStock||!detectInFlight()){previousArrival?.remove();return;}",
'arrival invalid')
s=repl(s,"        if(!destination||!Number.isFinite(landingMins)||landingMins<0) return;",
"        if(!destination||!Number.isFinite(landingMins)||landingMins<0){previousArrival?.remove();return;}",
'arrival no destination')
s=repl(s,"        const yata=(await fetchYataAll()).filter(r=>r.destination===destination);if(!yata.length)return;",
"        const yata=(await fetchYataAll()).filter(r=>r.destination===destination);if(!yata.length)return;",
'yata anchor')
# Replace old panel only when a fully built new panel is ready.
s=repl(s,"        const bar=document.createElement('div');bar.id='sl-mi-arrival';bar.className='open';",
"        const bar=document.createElement('div');bar.id='sl-mi-arrival';bar.className='open';",
'bar anchor')
s=repl(s,"        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);\n        paintTravelSessionSummary();",
"        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');\n        previousArrival?.remove();\n        mountTop(bar);\n        paintTravelSessionSummary();",
'swap panel')
# Force scans should not wipe Arrival Basket before renderArrivalStock can refresh it.
s=repl(s,".sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar",
".sl-mi-items,#sl-mi-best-run,#sl-mi-museum-bar",
'force cleanup arrival')
SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.3'
        e['description']='Market/travel intelligence with route and basket optimization, Arrival Basket, in-country Best Buys, smart landing refresh, session history and no-flicker Torn PDA flight updates.'
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.15.2**','SakaLuX Market Intelligence: **v1.15.3**',1)
release='''### SakaLuX Market Intelligence v1.15.3\n- Fixed **Arrival Basket flicker/disappearing on Torn PDA** during periodic flight-page rerenders.\n- The existing Arrival Basket now stays visible while YATA/Torn market data refreshes asynchronously.\n- A refreshed panel replaces the previous one only after the new data is ready.\n- Force refreshes no longer remove the Arrival Basket before the replacement is built.\n- The panel is removed only when the player is no longer in flight or the flight state is invalid.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.2.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.15.2**','**Current version: v1.15.3**',1)
gf=gf.replace('## v1.15.2', '## v1.15.3 — Torn PDA Arrival Basket No-Flicker\n\n- Fixed Arrival Basket disappearing briefly during Torn PDA flight-page rerenders.\n- The current panel remains visible while fresh data is fetched and is swapped only when the replacement is ready.\n- Force refresh no longer clears Arrival Basket before async work completes.\n\n## v1.15.2',1)
GF.write_text(gf,encoding='utf-8')
