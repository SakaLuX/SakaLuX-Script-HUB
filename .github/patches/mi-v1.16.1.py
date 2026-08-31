from pathlib import Path
import json, subprocess

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'
BASE_COMMIT='8b1509cd26ab87712529771d839fb0260a440083'


def repl(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

# Recover the exact known-good v1.16.0 source even if the live file is currently damaged.
s=subprocess.check_output(['git','show',f'{BASE_COMMIT}:SakaLuX-Market-Intelligence.user.js'],text=True)

s=repl(s,'// @version      1.16.0','// @version      1.16.1','metadata version')
s=repl(s,
'// @description  Torn PDA-first market/travel intelligence with anonymous opt-in SakaLuX Price Network consensus, Item Market signals, Bazaar Flip and travel basket tools.',
'// @description  Torn PDA-first market/travel intelligence with stable non-flickering Best Route Basket and Travel Session panels, Price Network, Bazaar Flip and travel basket tools.',
'metadata description')
s=repl(s,"const VERSION = '1.16.0';","const VERSION = '1.16.1';",'runtime version')

old_session=r'''    function paintTravelSessionSummary(){
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
new_session=r'''    function paintTravelSessionSummary(){
        const existing=document.getElementById('sl-mi-session');
        if(!settings.sessionSummary){existing?.remove();return;}
        const cur=travelSessions.current,history=(travelSessions.history||[]).slice(0,5);
        if(!cur&&!history.length){existing?.remove();return;}
        const wasOpen=existing?existing.classList.contains('open'):true;
        const bar=existing||document.createElement('div');bar.id='sl-mi-session';bar.classList.toggle('open',wasOpen);
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
        bar.querySelector('.sl-mi-session-head').onclick=()=>bar.classList.toggle('open');
        if(!existing)mountTop(bar);
    }
'''
s=repl(s,old_session,new_session,'stable session panel')

old_best=r'''    function paintBestTravelRun(top,phase){
        document.getElementById('sl-mi-best-run')?.remove();state.bestRunRows=top.length;if(!top.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-best-run';const best=top[0];
        bar.innerHTML='<div class="sl-mi-br-head"><span class="sl-mi-br-title">☠︎ BEST ROUTE BASKET</span><strong>'+esc(best.destination)+' · '+best.basket.length+' item types</strong><span>'+money(best.profitHour)+'/hr</span><button type="button">▾</button></div><div class="sl-mi-perf-note">'+esc(phase||'cached')+'</div><div class="sl-mi-br-body"></div>';
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-br-row sl-mi-route';row.dataset.destination=r.destination;row.setAttribute('role','button');row.tabIndex=0;row.title='Select '+r.destination+' in Torn Travel';
            const routeInfo=r.basket.length+' item types · '+r.qty+'/'+r.slots+' slots · flight '+fmtFlightMinutes(r.flightMins)+' '+(r.flightSource==='torn-page'?'actual':'fallback');
            const costLine='cost '+money(r.costRun)+(settings.travelBudget>0?' · budget '+money(settings.travelBudget):'');
            row.innerHTML='<span class="name">'+esc(r.destination)+'</span><span>'+esc(r.basketSummary)+'</span><span>'+routeInfo+'</span><span class="eta">'+costLine+' · '+esc(r.mode)+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            const activate=()=>selectTravelDestination(r.destination);row.addEventListener('click',activate);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }
'''
new_best=r'''    function paintBestTravelRun(top,phase){
        state.bestRunRows=top.length;if(!top.length)return;
        const existing=document.getElementById('sl-mi-best-run');
        const wasOpen=existing?existing.classList.contains('open'):false;
        const bar=existing||document.createElement('div');bar.id='sl-mi-best-run';bar.classList.toggle('open',wasOpen);const best=top[0];
        bar.innerHTML='<div class="sl-mi-br-head"><span class="sl-mi-br-title">☠︎ BEST ROUTE BASKET</span><strong>'+esc(best.destination)+' · '+best.basket.length+' item types</strong><span>'+money(best.profitHour)+'/hr</span><button type="button">▾</button></div><div class="sl-mi-perf-note">'+esc(phase||'cached')+'</div><div class="sl-mi-br-body"></div>';
        const body=bar.querySelector('.sl-mi-br-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-br-row sl-mi-route';row.dataset.destination=r.destination;row.setAttribute('role','button');row.tabIndex=0;row.title='Select '+r.destination+' in Torn Travel';
            const routeInfo=r.basket.length+' item types · '+r.qty+'/'+r.slots+' slots · flight '+fmtFlightMinutes(r.flightMins)+' '+(r.flightSource==='torn-page'?'actual':'fallback');
            const costLine='cost '+money(r.costRun)+(settings.travelBudget>0?' · budget '+money(settings.travelBudget):'');
            row.innerHTML='<span class="name">'+esc(r.destination)+'</span><span>'+esc(r.basketSummary)+'</span><span>'+routeInfo+'</span><span class="eta">'+costLine+' · '+esc(r.mode)+'</span><span>'+money(r.profitRun)+'/run</span><strong>'+money(r.profitHour)+'/hr</strong>';
            const activate=()=>selectTravelDestination(r.destination);row.addEventListener('click',activate);row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});body.appendChild(row);
        }
        bar.querySelector('.sl-mi-br-head').onclick=()=>bar.classList.toggle('open');
        if(!existing)mountTop(bar);
    }
'''
s=repl(s,old_best,new_best,'stable best route panel')

s=repl(s,
"    async function renderBestTravelRun(){\n        document.getElementById('sl-mi-best-run')?.remove();\n        if(!settings.bestRun||detectDestination()||detectInFlight()) return;",
"    async function renderBestTravelRun(){\n        const existing=document.getElementById('sl-mi-best-run');\n        if(!settings.bestRun||detectDestination()||detectInFlight()){existing?.remove();return;}",
'best route no eager remove')

s=repl(s,
"        try{if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-museum-bar,#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session').forEach(n=>n.remove());switch(state.page)",
"        try{if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-museum-bar,#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove());switch(state.page)",
'force refresh stable panels')

s=repl(s,
"if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items'))return false;",
"if(n.closest?.('#sl-mi-best-run,#sl-mi-session,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items'))return false;",
'observer ignores session panel')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.16.1'
        entry['description']='Torn PDA-first market/travel intelligence with stable non-flickering Best Route Basket and Travel Session panels, anonymous opt-in Price Network, Bazaar Flip and travel/basket tools.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.16.0**','SakaLuX Market Intelligence: **v1.16.1**',1)
release='''### SakaLuX Market Intelligence v1.16.1\n- Fixed the visible flicker where **BEST ROUTE BASKET** and **TRAVEL SESSION SUMMARY** repeatedly disappeared and reappeared during scans.\n- Both panels now keep the same outer DOM node and update their content in place.\n- Cached and live Best Route results replace only the panel contents instead of removing the whole panel between phases.\n- Forced refreshes no longer delete the two persistent Travel panels before recalculation.\n- MutationObserver now ignores changes inside Travel Session Summary so the script does not trigger scans from its own session UI updates.\n- The open/collapsed state of both panels is preserved across data refreshes.\n- Panels are still removed when the page context genuinely changes (for example leaving the home Travel screen or disabling the feature).\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.16.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.16.0**','**Current version: v1.16.1**',1)
gf_release='''## v1.16.1 — Stable Travel Panels\n\n- Fixed BEST ROUTE BASKET and TRAVEL SESSION SUMMARY blinking/disappearing during automatic refreshes.\n- The panels stay mounted and update their contents in place.\n- Cached → live Best Route updates no longer replace the entire panel node.\n- Forced refresh no longer deletes these persistent panels first.\n- Travel Session Summary UI mutations are ignored by the observer to prevent self-triggered rescans.\n- Expanded/collapsed state is preserved while data refreshes.\n\n'''
gf=gf.replace('## v1.16.0',gf_release+'## v1.16.0',1)
GF.write_text(gf,encoding='utf-8')
