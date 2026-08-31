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
s=repl(s,'// @version      1.15.1','// @version      1.15.2','metadata version')
s=repl(s,"const VERSION = '1.15.1';","const VERSION = '1.15.2';",'runtime version')

old_best="""    function paintBestTravelRun(top,phase){
        document.getElementById('sl-mi-best-run')?.remove();state.bestRunRows=top.length;if(!top.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-best-run';const best=top[0];
        bar.innerHTML='<div class=\"sl-mi-br-head\"><span class=\"sl-mi-br-title\">☠︎ BEST ROUTE BASKET</span><strong>'+esc(best.destination)+' · '+best.basket.length+' item types</strong><span>'+money(best.profitHour)+'/hr</span><button type=\"button\">▾</button></div><div class=\"sl-mi-perf-note\">'+esc(phase||'cached')+'</div><div class=\"sl-mi-br-body\"></div>';
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-br-row sl-mi-route';row.dataset.destination=r.destination;row.setAttribute('role','button');row.tabIndex=0;row.title='Select '+r.destination+' in Torn Travel';
            const routeInfo=r.basket.length+' item types · '+r.qty+'/'+r.slots+' slots · flight '+fmtFlightMinutes(r.flightMins)+' '+(r.flightSource==='torn-page'?'actual':'fallback');
            const costLine='cost '+money(r.costRun)+(settings.travelBudget>0?' · budget '+money(settings.travelBudget):'');
            row.innerHTML='<span class=\"name\">'+esc(r.destination)+'</span><span>'+esc(r.basketSummary)+'</span><span>'+routeInfo+'</span><span class=\"eta\">'+costLine+' · '+esc(r.mode)+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            const activate=()=>selectTravelDestination(r.destination);row.addEventListener('click',activate);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }
"""
new_best="""    function paintBestTravelRun(top,phase){
        state.bestRunRows=top.length;if(!top.length)return;
        let bar=document.getElementById('sl-mi-best-run');
        const isNew=!bar,wasOpen=bar?.classList.contains('open');
        if(!bar){bar=document.createElement('div');bar.id='sl-mi-best-run';}
        const best=top[0];
        bar.innerHTML='<div class=\"sl-mi-br-head\"><span class=\"sl-mi-br-title\">☠︎ BEST ROUTE BASKET</span><strong>'+esc(best.destination)+' · '+best.basket.length+' item types</strong><span>'+money(best.profitHour)+'/hr</span><button type=\"button\">▾</button></div><div class=\"sl-mi-perf-note\">'+esc(phase||'cached')+'</div><div class=\"sl-mi-br-body\"></div>';
        if(wasOpen)bar.classList.add('open');else bar.classList.remove('open');
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-br-row sl-mi-route';row.dataset.destination=r.destination;row.setAttribute('role','button');row.tabIndex=0;row.title='Select '+r.destination+' in Torn Travel';
            const routeInfo=r.basket.length+' item types · '+r.qty+'/'+r.slots+' slots · flight '+fmtFlightMinutes(r.flightMins)+' '+(r.flightSource==='torn-page'?'actual':'fallback');
            const costLine='cost '+money(r.costRun)+(settings.travelBudget>0?' · budget '+money(settings.travelBudget):'');
            row.innerHTML='<span class=\"name\">'+esc(r.destination)+'</span><span>'+esc(r.basketSummary)+'</span><span>'+routeInfo+'</span><span class=\"eta\">'+costLine+' · '+esc(r.mode)+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            const activate=()=>selectTravelDestination(r.destination);row.addEventListener('click',activate);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open');
        if(isNew)mountTop(bar);
    }
"""
s=repl(s,old_best,new_best,'stable best route paint')

s=repl(s,
"""    async function renderBestTravelRun(){
        document.getElementById('sl-mi-best-run')?.remove();
        if(!settings.bestRun||detectDestination()||detectInFlight()) return;""",
"""    async function renderBestTravelRun(){
        if(!settings.bestRun||detectDestination()||detectInFlight()) return;""",
'best route render no pre-remove')

old_session="""    function paintTravelSessionSummary(){
        document.getElementById('sl-mi-session')?.remove();
        if(!settings.sessionSummary)return;
        const cur=travelSessions.current,history=(travelSessions.history||[]).slice(0,5);
        if(!cur&&!history.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-session';bar.className='open';
        const active=cur||history[0];
"""
new_session="""    function paintTravelSessionSummary(){
        if(!settings.sessionSummary){document.getElementById('sl-mi-session')?.remove();return;}
        const cur=travelSessions.current,history=(travelSessions.history||[]).slice(0,5);
        if(!cur&&!history.length){document.getElementById('sl-mi-session')?.remove();return;}
        let bar=document.getElementById('sl-mi-session');
        const isNew=!bar,wasOpen=bar?.classList.contains('open') ?? true;
        if(!bar){bar=document.createElement('div');bar.id='sl-mi-session';bar.className='open';}
        const active=cur||history[0];
"""
s=repl(s,old_session,new_session,'stable session paint start')
s=repl(s,
"""        bar.querySelector('.sl-mi-session-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }
""",
"""        if(wasOpen)bar.classList.add('open');else bar.classList.remove('open');
        bar.querySelector('.sl-mi-session-head').onclick=()=>bar.classList.toggle('open');
        if(isNew)mountTop(bar);
    }
""",
'stable session paint end')

s=repl(s,
"""if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session').forEach(n=>n.remove());""",
"""if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove());""",
'force scan preserve stable panels')

s=repl(s,
"""if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items'))return false;""",
"""if(n.closest?.('#sl-mi-best-run,#sl-mi-session,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items'))return false;""",
'observer ignore session panel')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.15.2'
        entry['description']='Market/travel intelligence with route and basket optimization, Arrival Basket, in-country Best Buys, smart landing refresh, local Travel Session Summary/history and flicker-free persistent Travel panels.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.15.1**','SakaLuX Market Intelligence: **v1.15.2**',1)
release='''### SakaLuX Market Intelligence v1.15.2\n- Fixed visible flicker where **BEST ROUTE BASKET** and **TRAVEL SESSION SUMMARY** repeatedly disappeared and reappeared during refreshes.\n- Both panels now stay mounted in the DOM and update their contents in place.\n- Cached Best Route results can now be replaced by live-refreshed results without removing the panel first.\n- Force refresh no longer deletes these two persistent panels before recalculation.\n- The Travel Session panel is now explicitly ignored by the MutationObserver, preventing script-owned UI updates from triggering extra scans.\n- Expanded/collapsed state is preserved while each panel updates.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.1.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.15.1.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.15.1**','**Current version: v1.15.2**',1)
gf_release='''## v1.15.2 — Persistent Travel Panels / Flicker Fix\n\n- Fixed **BEST ROUTE BASKET** and **TRAVEL SESSION SUMMARY** repeatedly disappearing/reappearing during scans.\n- The panels remain mounted and update in place instead of being deleted and recreated.\n- Cached route data can transition to live-refreshed data without a visible panel gap.\n- Force refresh preserves both persistent panels.\n- Travel Session Summary changes are ignored by the MutationObserver so the script does not react to its own UI updates.\n- Expanded/collapsed panel state is preserved during refreshes.\n\n'''
gf=gf.replace('## v1.15.1',gf_release+'## v1.15.1',1)
GF.write_text(gf,encoding='utf-8')
