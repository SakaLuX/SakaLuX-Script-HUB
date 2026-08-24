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
s=repl(s,'// @version      1.14.0','// @version      1.15.0','metadata version')
s=repl(s,
'// @description  Torn market and travel intelligence with Best Route Basket, Arrival Basket, in-country Best Buys and smart post-landing refresh that reacts to stock changes without hammering the APIs.',
'// @description  Torn market and travel intelligence with route/basket optimization, in-country Best Buys, smart landing refresh and a local Travel Session Summary with trip history.',
'metadata description')
s=repl(s,"const VERSION = '1.14.0';","const VERSION = '1.15.0';",'runtime version')

s=repl(s,
"        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1',\n        priceHistory: 'SakaLuX_MI_PRICE_HISTORY_V1'",
"        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1',\n        priceHistory: 'SakaLuX_MI_PRICE_HISTORY_V1',\n        travelSessions: 'SakaLuX_MI_TRAVEL_SESSIONS_V1'",
'session storage')

s=repl(s,
"        smartLandedRefresh: true,\n        bazaar: true,",
"        smartLandedRefresh: true,\n        sessionSummary: true,\n        bazaar: true,",
'session setting')

s=repl(s,
"    let priceHistory = loadJson(STORAGE.priceHistory, {});",
"    let priceHistory = loadJson(STORAGE.priceHistory, {});\n    let travelSessions = loadJson(STORAGE.travelSessions, {current:null,history:[]});\n    if(!travelSessions||typeof travelSessions!=='object')travelSessions={current:null,history:[]};\n    if(!Array.isArray(travelSessions.history))travelSessions.history=[];",
'load session data')

s=repl(s,
"        landedRefreshes: 0, landedStockRefreshes: 0, landedMarketRefreshes: 0, landedRefreshSkips: 0, landedLastRefresh: 0, landedLastMarketRefresh: 0, landedSignature: '', landedRefreshTimer: null",
"        landedRefreshes: 0, landedStockRefreshes: 0, landedMarketRefreshes: 0, landedRefreshSkips: 0, landedLastRefresh: 0, landedLastMarketRefresh: 0, landedSignature: '', landedRefreshTimer: null,\n        travelSessionCount: 0, currentSessionDestination: '', currentSessionStatus: '', currentSessionPredictedProfit: 0, currentSessionLandedProfit: 0, currentSessionRecordedProfit: 0, lastSessionProfit: 0",
'session state')

helpers=r'''

    function saveTravelSessions(){
        travelSessions.history=(travelSessions.history||[]).slice(0,20);
        saveJson(STORAGE.travelSessions,travelSessions);
        state.travelSessionCount=(travelSessions.history||[]).length+(travelSessions.current?1:0);
        state.currentSessionDestination=travelSessions.current?.destination||'';
        state.currentSessionStatus=travelSessions.current?.status||'';
        state.currentSessionPredictedProfit=Number(travelSessions.current?.predicted?.profit)||0;
        state.currentSessionLandedProfit=Number(travelSessions.current?.landed?.profit)||0;
        state.currentSessionRecordedProfit=Number(travelSessions.current?.recorded?.profit)||0;
        state.lastSessionProfit=Number((travelSessions.history||[])[0]?.recorded?.profit||(travelSessions.history||[])[0]?.landed?.profit)||0;
    }

    function sessionPlanSnapshot(plan){
        if(!plan)return null;
        return {
            at:Date.now(),
            cost:Number(plan.totalCost)||0,
            profit:Number(plan.totalProfit)||0,
            slots:Number(plan.used)||0,
            mode:plan.mode||'',
            items:(plan.rows||[]).map(r=>({id:Number(r.id)||0,name:r.name||'',qty:Number(r.qty)||0,buy:Number(r.buy)||0,profit:Number(r.profit)||0})).filter(r=>r.qty>0)
        };
    }

    function archiveCurrentSession(){
        const cur=travelSessions.current;if(!cur)return;
        cur.endedAt=cur.endedAt||Date.now();
        const history=(travelSessions.history||[]).filter(x=>x?.id!==cur.id);
        history.unshift(cur);travelSessions.history=history.slice(0,20);travelSessions.current=null;saveTravelSessions();
    }

    function ensureTravelSession(destination,phase='FLYING'){
        if(!destination)return null;
        let cur=travelSessions.current;
        if(!cur||cur.destination!==destination){
            if(cur)archiveCurrentSession();
            cur={id:destination+'-'+Date.now(),destination,startedAt:Date.now(),status:phase,predicted:null,landed:null,recorded:null};
            travelSessions.current=cur;
        }
        cur.status=phase||cur.status;saveTravelSessions();return cur;
    }

    function updatePredictedSession(destination,plan,landingMins){
        if(!destination||!plan)return;
        const cur=ensureTravelSession(destination,'FLYING');
        cur.predicted=sessionPlanSnapshot(plan);cur.landingMins=Number(landingMins)||0;cur.lastSeenAt=Date.now();saveTravelSessions();
    }

    function updateLandedSession(destination,plan){
        if(!destination||!plan)return;
        const cur=ensureTravelSession(destination,'LANDED');
        cur.status=cur.recorded?'PURCHASED':'LANDED';cur.landedAt=cur.landedAt||Date.now();cur.landed=sessionPlanSnapshot(plan);cur.lastSeenAt=Date.now();saveTravelSessions();
    }

    function markCurrentPlanBought(){
        const cur=travelSessions.current;if(!cur?.landed)return false;
        cur.recorded={...cur.landed,at:Date.now(),confirmed:true};cur.status='PURCHASED';saveTravelSessions();paintTravelSessionSummary();return true;
    }

    function fmtSessionTime(ts){
        if(!ts)return '—';
        try{return new Date(ts).toLocaleString([], {month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(_){return '—';}
    }

    function paintTravelSessionSummary(){
        document.getElementById('sl-mi-session')?.remove();
        if(!settings.sessionSummary)return;
        const cur=travelSessions.current,history=(travelSessions.history||[]).slice(0,5);
        if(!cur&&!history.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-session';bar.className='open';
        const active=cur||history[0];
        const predicted=Number(active?.predicted?.profit)||0,landed=Number(active?.landed?.profit)||0,recorded=Number(active?.recorded?.profit)||0;
        const displayProfit=recorded||landed||predicted;
        bar.innerHTML='<div class="sl-mi-session-head"><div><span class="sl-mi-br-title">📒 TRAVEL SESSION SUMMARY</span><strong>'+esc(active?.destination||'History')+'</strong></div><div>'+esc(active?.status||'ARCHIVED')+' · '+money(displayProfit)+' est. profit</div><button type="button">▾</button></div><div class="sl-mi-session-note">Trip values are estimates from the script\'s market/basket calculations. “MARK PLAN BOUGHT” records your confirmation; it does not verify later Item Market sale proceeds.</div><div class="sl-mi-session-body"></div>';
        const body=bar.querySelector('.sl-mi-session-body');
        if(cur){
            const delta=cur.predicted&&cur.landed?(Number(cur.landed.profit||0)-Number(cur.predicted.profit||0)):null;
            const card=document.createElement('div');card.className='sl-mi-session-current';
            card.innerHTML='<div><b>'+esc(cur.destination)+'</b><span>'+esc(cur.status||'')+' · started '+fmtSessionTime(cur.startedAt)+'</span></div><div><small>BEFORE LANDING</small><strong>'+money(cur.predicted?.profit||0)+'</strong></div><div><small>AT LANDING</small><strong>'+money(cur.landed?.profit||0)+'</strong></div><div><small>RECORDED PLAN</small><strong>'+money(cur.recorded?.profit||0)+'</strong></div>'+(delta==null?'':'<div><small>LANDING Δ</small><strong class="'+(delta>=0?'pos':'neg')+'">'+(delta>=0?'+':'')+money(delta)+'</strong></div>');
            body.appendChild(card);
        }
        if(history.length){
            const title=document.createElement('div');title.className='sl-mi-session-history-title';title.textContent='RECENT TRIPS';body.appendChild(title);
            history.forEach(h=>{
                const p=Number(h.recorded?.profit||h.landed?.profit||h.predicted?.profit)||0;
                const row=document.createElement('div');row.className='sl-mi-session-row';
                row.innerHTML='<span class="name">'+esc(h.destination||'?')+'</span><span>'+esc(h.status||'ARCHIVED')+'</span><span>'+fmtSessionTime(h.startedAt)+'</span><strong>'+money(p)+'</strong>';
                body.appendChild(row);
            });
        }
        bar.querySelector('.sl-mi-session-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }
'''
s=repl(s,
"    function museumNameKey(name) {",
helpers+"\n    function museumNameKey(name) {",
'session helpers')

s=repl(s,
"            state.arrivalBasketMode=plan?.mode||'';",
"            state.arrivalBasketMode=plan?.mode||'';\n            if(plan?.rows?.length)updatePredictedSession(destination,plan,landingMins);",
'predicted session capture')

s=repl(s,
"        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);",
"        bar.querySelector('.sl-mi-arrival-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);\n        paintTravelSessionSummary();",
'arrival summary paint')

s=repl(s,
"        const plan=buildTravelBuyPlan(destination,entries,marketMap);",
"        const plan=buildTravelBuyPlan(destination,entries,marketMap);\n        updateLandedSession(destination,plan);",
'landed session capture')

s=repl(s,
"            '<div class=\"sl-mi-country-summary\"><span>Spend <strong>'+money(plan?.totalCost||0)+'</strong></span><span>Expected net profit <strong>'+money(plan?.totalProfit||0)+'</strong></span><span>Mode <strong>'+esc(plan?.mode||'GREEDY')+'</strong></span>'+(plan?.unusedBudget!=null?'<span>Budget left <strong>'+money(plan.unusedBudget)+'</strong></span>':'')+'</div><div class=\"sl-mi-country-body\"></div>';",
"            '<div class=\"sl-mi-country-summary\"><span>Spend <strong>'+money(plan?.totalCost||0)+'</strong></span><span>Expected net profit <strong>'+money(plan?.totalProfit||0)+'</strong></span><span>Mode <strong>'+esc(plan?.mode||'GREEDY')+'</strong></span>'+(plan?.unusedBudget!=null?'<span>Budget left <strong>'+money(plan.unusedBudget)+'</strong></span>':'')+'<button type=\"button\" id=\"sl-mi-mark-bought\">'+(travelSessions.current?.recorded?'PLAN RECORDED ✓':'MARK PLAN BOUGHT')+'</button></div><div class=\"sl-mi-country-body\"></div>';",
'mark bought button')

s=repl(s,
"        bar.querySelector('.sl-mi-country-head').onclick=()=>bar.classList.toggle('open');\n        mountTop(bar);",
"        bar.querySelector('.sl-mi-country-head').onclick=()=>bar.classList.toggle('open');\n        const mark=bar.querySelector('#sl-mi-mark-bought');if(mark)mark.onclick=e=>{e.stopPropagation();if(markCurrentPlanBought()){mark.textContent='PLAN RECORDED ✓';mark.disabled=true;}};\n        mountTop(bar);\n        paintTravelSessionSummary();",
'mark bought handler')

s=repl(s,
"        if(!detectDestination()){await renderBestTravelRun();return;}",
"        if(!detectDestination()){await renderBestTravelRun();paintTravelSessionSummary();return;}",
'home summary')

s=repl(s,
"        state.landedLastRefresh=Date.now();",
"        state.landedLastRefresh=Date.now();\n        paintTravelSessionSummary();",
'landed summary')

s=repl(s,
"#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan,#sl-mi-country-best{",
"#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session{",
'session common css')

css=r'''
.sl-mi-session-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-session-head>div:first-child{display:flex;align-items:center;gap:8px;min-width:0}.sl-mi-session-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-session-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-session-body{display:none;margin-top:7px;gap:5px}#sl-mi-session.open .sl-mi-session-body{display:flex;flex-direction:column}.sl-mi-session-current{display:grid;grid-template-columns:minmax(0,1.5fr) repeat(4,auto);gap:8px;align-items:center;padding:7px;border:1px solid #29323a;border-radius:6px;background:#121820}.sl-mi-session-current>div:first-child{display:flex;flex-direction:column}.sl-mi-session-current small{display:block;color:#7f8996;font-size:8px}.sl-mi-session-current strong{color:#78d98b}.sl-mi-session-current .neg{color:#e06c6c}.sl-mi-session-history-title{color:#d7b94c;font-size:9px;font-weight:900;margin-top:3px}.sl-mi-session-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto auto;gap:8px;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px}.sl-mi-session-row .name{font-weight:900}.sl-mi-country-summary button{border:1px solid #42664b;background:#16351f;color:#78d98b;border-radius:6px;padding:6px 8px;font-weight:900;font-size:9px}.sl-mi-country-summary button:disabled{opacity:.7}
'''
s=repl(s,
".sl-mi-plan-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}",
css+".sl-mi-plan-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}",
'session css block')

s=repl(s,
"@media(max-width:700px){.sl-mi-country-row",
"@media(max-width:700px){.sl-mi-session-current{grid-template-columns:repeat(2,minmax(0,1fr))}.sl-mi-session-current>div:first-child{grid-column:1/-1}.sl-mi-session-row{grid-template-columns:minmax(0,1fr) auto}.sl-mi-session-row>span:nth-child(3){grid-column:1/-1}.sl-mi-country-row",
'session mobile css')

s=repl(s,
"#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove())",
"#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session').forEach(n=>n.remove())",
'force cleanup session')

s=repl(s,
"+toggle('smartLandedRefresh','Smart refresh after landing')+toggle('bazaar','Bazaar deal detection')",
"+toggle('smartLandedRefresh','Smart refresh after landing')+toggle('sessionSummary','Travel Session Summary + local history')+toggle('bazaar','Bazaar deal detection')",
'settings session toggle')

s=repl(s,
"for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','smartLandedRefresh','bazaar','itemMarket','items','museum','points'])settings[k]",
"for(const k of['enabled','travel','bestRun','countryBestBuys','stockEta','arrivalStock','arrivalBasket','smartLandedRefresh','sessionSummary','bazaar','itemMarket','items','museum','points'])settings[k]",
'settings save session')

s=repl(s,
"+'<div class=\"sl-mi-info\">Watchlist: <b>'+Object.keys(watchlist).length+'</b> · Cached market: <b>'+Object.keys(marketCache).length+'</b> · Stock histories: <b>'+Object.keys(stockHistory).length+'</b> · Arrival rows: <b>'+state.arrivalRows+'</b></div><button class=\"sl-mi-primary\" id=\"sl-mi-save\">SAVE</button>",
"+'<div class=\"sl-mi-info\">Watchlist: <b>'+Object.keys(watchlist).length+'</b> · Cached market: <b>'+Object.keys(marketCache).length+'</b> · Stock histories: <b>'+Object.keys(stockHistory).length+'</b> · Travel sessions: <b>'+((travelSessions.history||[]).length+(travelSessions.current?1:0))+'</b></div><button class=\"sl-mi-primary\" id=\"sl-mi-save\">SAVE</button><button class=\"sl-mi-secondary\" id=\"sl-mi-clear-sessions\">CLEAR TRAVEL HISTORY</button>",
'settings session info')

s=repl(s,
"        overlay.querySelector('#sl-mi-refresh').onclick=()=>{overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-hard').onclick=()=>{marketCache={};saveJson(STORAGE.marketCache,marketCache);overlay.remove();scheduleScan(true);};",
"        overlay.querySelector('#sl-mi-clear-sessions').onclick=()=>{travelSessions={current:null,history:[]};saveTravelSessions();overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-refresh').onclick=()=>{overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-hard').onclick=()=>{marketCache={};saveJson(STORAGE.marketCache,marketCache);overlay.remove();scheduleScan(true);};",
'clear sessions handler')

s=repl(s,
"countryBestBuysDestination:state.countryBestBuysDestination,landedRefreshes:state.landedRefreshes",
"countryBestBuysDestination:state.countryBestBuysDestination,travelSessionCount:state.travelSessionCount,currentSessionDestination:state.currentSessionDestination,currentSessionStatus:state.currentSessionStatus,currentSessionPredictedProfit:state.currentSessionPredictedProfit,currentSessionLandedProfit:state.currentSessionLandedProfit,currentSessionRecordedProfit:state.currentSessionRecordedProfit,lastSessionProfit:state.lastSessionProfit,landedRefreshes:state.landedRefreshes",
'health session fields')

s=repl(s,
"        smartLandedRefresh(){if(detectPage()!=='travel'||detectInFlight()||!detectDestination())return false;scheduleLandedSmartRefresh('api');return true;},",
"        smartLandedRefresh(){if(detectPage()!=='travel'||detectInFlight()||!detectDestination())return false;scheduleLandedSmartRefresh('api');return true;},\n        travelSessionSummary(){paintTravelSessionSummary();return {current:travelSessions.current,history:(travelSessions.history||[]).slice(0,20)};},",
'public session api')

s=repl(s,
"    function init(){injectCss();createButton();startObserver();maybePromptHub();scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}",
"    function init(){injectCss();createButton();startObserver();maybePromptHub();saveTravelSessions();scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}",
'initialize session state')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.15.0'
        entry['description']='Market/travel intelligence with route and basket optimization, Arrival Basket, Valigia-style in-country Best Buys, smart landing refresh and a local Travel Session Summary/history.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.14.0**','SakaLuX Market Intelligence: **v1.15.0**',1)
release='''### SakaLuX Market Intelligence v1.15.0\n- Added **Travel Session Summary**, the final planned development module before full testing.\n- Travel sessions are stored locally and keep up to 20 recent trips.\n- While flying, the session records the Arrival Basket estimate before landing.\n- After landing, the session records the current BEST BUYS basket so the pre-landing estimate can be compared with the landed opportunity.\n- Shows predicted profit, landed profit and the landing delta.\n- Added **MARK PLAN BOUGHT** in the in-country Best Buys panel; this records the user's confirmation of the displayed basket and its estimated cost/profit without claiming to verify later sale proceeds.\n- Session Summary displays the current trip plus the five most recent archived trips.\n- Added a Settings toggle plus **CLEAR TRAVEL HISTORY**.\n- Added session fields to `health()` and `travelSessionSummary()` to the public API.\n- All session data remains local to the device/browser.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.14.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.14.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.14.0**','**Current version: v1.15.0**',1)
gf_release='''## v1.15.0 — Travel Session Summary\n\n- Added a local **Travel Session Summary** with up to 20 recent trips.\n- Captures the Arrival Basket estimate while flying and the live BEST BUYS basket after landing.\n- Shows estimated profit before landing, at landing and the resulting delta.\n- Added **MARK PLAN BOUGHT** so the user can explicitly record the displayed basket as the plan they purchased. This is a local confirmation only; the script does not claim to verify later market sales or realized profit.\n- The summary shows the active trip and five recent archived trips.\n- Added a Settings toggle and **CLEAR TRAVEL HISTORY** control.\n- Added session status/profit fields to `health()` and `travelSessionSummary()` to the public API.\n- Session data stays local and is never uploaded to a SakaLuX server.\n\n'''
gf=gf.replace('## v1.14.0',gf_release+'## v1.14.0',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.14.0.','No observations or travel-session history are uploaded to a SakaLuX server in v1.15.0.',1)
GF.write_text(gf,encoding='utf-8')
