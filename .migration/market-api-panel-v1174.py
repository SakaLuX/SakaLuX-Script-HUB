from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
MI = ROOT / 'SakaLuX-Market-Intelligence.user.js'
REG = ROOT / 'scripts.json'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
MIDOC = ROOT / 'greasyfork' / 'Market-Intelligence.md'
HUBDOC = ROOT / 'greasyfork' / 'Script-Hub.md'

text = MI.read_text(encoding='utf-8')
old_version = '1.17.3'
new_version = '1.17.4'

text = re.sub(r'(^// @version\s+)'+re.escape(old_version)+r'(\s*$)', r'\g<1>'+new_version+r'\2', text, count=1, flags=re.M)
text = text.replace("const VERSION = '1.17.3';", "const VERSION = '1.17.4';", 1)

old_create = """    function createRequiredApiKey(){
        if(window.SakaLuXScriptHub?.createRequiredTornKey)return window.SakaLuXScriptHub.createRequiredTornKey();
        clearLoadoutCache();state.apiAccessStatus='setup';state.apiAccessMessage='Create the named key in Torn, then return and paste it below.';
        try{sessionStorage.setItem('SakaLuX_MI_KEY_SETUP_PENDING','1');}catch(_){}
        location.href=REQUIRED_API_KEY_URL;
        return true;
    }
"""
new_create = """    function createRequiredApiKey(){
        clearLoadoutCache();state.apiAccessStatus='setup';state.apiAccessMessage='Create the Market Intelligence key in Torn, then return and paste it below.';
        try{sessionStorage.setItem('SakaLuX_MI_KEY_SETUP_PENDING','1');}catch(_){}
        location.href=REQUIRED_API_KEY_URL;
        return true;
    }
"""
if old_create not in text:
    raise SystemExit('createRequiredApiKey block not found')
text = text.replace(old_create, new_create, 1)

replacement = r'''    function apiAccessCss(){
        if(document.getElementById('sl-mi-api-access-style'))return;
        const s=document.createElement('style');s.id='sl-mi-api-access-style';s.textContent=`
.sl-mi-head-actions{display:flex;align-items:center;gap:7px}
#sl-mi-api-access,#sl-mi-api-close{width:40px;height:40px;min-width:40px;padding:0!important;display:inline-flex;align-items:center;justify-content:center;border-radius:10px!important}
#sl-mi-api-access{background:linear-gradient(180deg,#322b10,#211c0c)!important;border:1px solid #7c681e!important;color:#f5d85f!important;font-size:18px!important}
#sl-mi-api-access:hover{filter:brightness(1.08)}
.sl-mi-api-panel .sl-mi-head{position:sticky;top:0;z-index:2}
.sl-mi-api-required{margin:10px 0;padding:11px;border:1px solid #66591d;border-radius:10px;background:#211d10;color:#e4c95d;font-size:11px;line-height:1.55}
.sl-mi-api-required b{color:#f5d85f}
.sl-mi-api-create-main{display:block;width:100%;box-sizing:border-box;margin:9px 0 10px!important;min-height:42px;background:linear-gradient(180deg,#322b10,#211c0c)!important;border:1px solid #7c681e!important;color:#f5d85f!important;font-weight:900!important}
.sl-mi-api-card{margin:9px 0;padding:10px;border:1px solid #2f3945;border-radius:10px;background:#121820}
.sl-mi-api-panel .sl-mi-api-status{display:flex;justify-content:space-between;gap:8px;padding:9px;border-radius:8px;background:#181d24;font-size:10px;line-height:1.35}
.sl-mi-api-panel .sl-mi-api-status b{color:#d7b94c}.sl-mi-api-panel .sl-mi-api-status.ok span{color:#78d98b}.sl-mi-api-panel .sl-mi-api-status.error span,.sl-mi-api-panel .sl-mi-api-status.missing span,.sl-mi-api-panel .sl-mi-api-status.missing-equipment span{color:#f08b8b}
.sl-mi-api-source,.sl-mi-api-note{margin:8px 0;color:#9ca3af;font-size:9px;line-height:1.45}.sl-mi-api-source b{color:#e5e7eb}
.sl-mi-api-panel .sl-mi-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sl-mi-api-panel .sl-mi-api-actions button{min-height:38px;border-radius:9px!important;font-weight:900!important}
#sl-mi-api-save-test{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important}#sl-mi-api-check{background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
#sl-mi-api-clear-local{width:100%;margin-top:7px;min-height:36px;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
@media(max-width:520px){#sl-mi-api-access,#sl-mi-api-close{width:38px;height:38px;min-width:38px}.sl-mi-api-panel .sl-mi-api-actions{grid-template-columns:1fr}}
`;(document.head||document.documentElement).appendChild(s);
    }

    function openApiAccess(){
        if(!settings.enabled)setEnabled(true);
        apiAccessCss();
        document.getElementById('sl-mi-overlay')?.remove();
        getApiKey();
        const overlay=document.createElement('div');overlay.id='sl-mi-overlay';
        const source=state.apiMode||'None';
        overlay.innerHTML='<div id="sl-mi-panel" class="sl-mi-api-panel"><div class="sl-mi-head"><div><div class="sl-mi-title">🔑 Market Intelligence API Access</div><div class="sl-mi-sub">SakaLuX Market Intelligence v'+VERSION+' · dedicated read-only access</div></div><div class="sl-mi-head-actions"><button id="sl-mi-api-close" class="sl-mi-secondary">×</button></div></div>'+
            '<div class="sl-mi-api-required"><b>Exact Torn permissions required</b><br>User: Money + Travel + Equipment<br>Torn: Items<br>Market: Item Market<br>No write permission is requested.</div>'+
            '<button type="button" class="sl-mi-api-create-main" id="sl-mi-api-create-main">🔑 CREATE MARKET INTELLIGENCE API KEY</button>'+
            '<div class="sl-mi-api-card"><div class="sl-mi-api-status '+esc(state.apiAccessStatus)+'" id="sl-mi-api-status"><b>TORN API ACCESS</b><span>'+esc(state.apiAccessMessage||'Not checked yet')+'</span></div>'+
            '<div class="sl-mi-api-source">Active source: <b>'+esc(source)+'</b></div>'+
            '<label class="sl-mi-field">Replace / paste standalone Torn API key<input id="sl-mi-api-key-input" type="password" autocomplete="off" placeholder="Paste newly created Market Intelligence key here"></label>'+
            '<div class="sl-mi-api-actions"><button type="button" id="sl-mi-api-save-test">SAVE & TEST</button><button type="button" id="sl-mi-api-check">CHECK ACCESS</button></div>'+
            '<button type="button" id="sl-mi-api-clear-local">CLEAR LOCAL API KEY</button>'+
            '<div class="sl-mi-api-note">The shared SakaLuX Hub key is preferred automatically when available. A local key is kept only as the standalone fallback. Creating a key here always opens the exact Market Intelligence permission set above.</div></div></div>';
        document.body.appendChild(overlay);
        overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
        overlay.querySelector('#sl-mi-api-close').onclick=()=>overlay.remove();
        overlay.querySelector('#sl-mi-api-create-main').onclick=()=>createRequiredApiKey();
        overlay.querySelector('#sl-mi-api-save-test').onclick=async()=>{
            const input=overlay.querySelector('#sl-mi-api-key-input');
            if(!saveReplacementApiKey(input?.value)){input?.focus();return;}
            const b=overlay.querySelector('#sl-mi-api-save-test');b.textContent='CHECKING…';
            const r=await checkRequiredApiAccess(true);
            b.textContent=r.ok?'API KEY OK ✓':'SAVED · CHECK FAILED';
            if(r.ok){input.value='';scheduleScan(false);}
            setTimeout(()=>{if(overlay.isConnected)openApiAccess();},450);
        };
        overlay.querySelector('#sl-mi-api-check').onclick=async()=>{
            const b=overlay.querySelector('#sl-mi-api-check');b.textContent='CHECKING…';
            await checkRequiredApiAccess(true);
            if(overlay.isConnected)openApiAccess();
        };
        overlay.querySelector('#sl-mi-api-clear-local').onclick=()=>{
            try{localStorage.removeItem(STORAGE.apiKey);}catch(_){}
            clearLoadoutCache();
            state.apiMode='';
            const remaining=getApiKey();
            state.apiAccessStatus=remaining?'unknown':'missing';
            state.apiAccessMessage=remaining?('Local key cleared · '+(state.apiMode||'shared key')+' remains active'):'No Torn API key configured';
            state.apiAccessCheckedAt=0;
            openApiAccess();
        };
        return true;
    }

    function openSettings(){
        if(!settings.enabled)setEnabled(true);
        apiAccessCss();
        document.getElementById('sl-mi-overlay')?.remove();const overlay=document.createElement('div');overlay.id='sl-mi-overlay';
        overlay.innerHTML='<div id="sl-mi-panel"><div class="sl-mi-head"><div><div class="sl-mi-title">☠︎ SakaLuX Market Intelligence</div><div class="sl-mi-sub">v'+VERSION+' · '+esc(state.apiMode||'API idle')+' · page: '+esc(state.page||detectPage())+'</div></div><div class="sl-mi-head-actions"><button id="sl-mi-api-access" title="Market Intelligence API Access" aria-label="Market Intelligence API Access">🔑</button><button id="sl-mi-close">×</button></div></div>'+toggle('enabled','Enable Market Intelligence')+toggle('travel','Travel profit intelligence')+toggle('bestRun','Best Travel Run board')+toggle('countryBestBuys','In-country Best Buys board')+toggle('stockEta','Stock + restock ETA')+toggle('arrivalStock','Arrival-stock prediction while flying')+toggle('arrivalBasket','Arrival Basket Planner while flying')+toggle('smartLandedRefresh','Smart refresh after landing')+toggle('sessionSummary','Travel Session Summary + local history')+toggle('bazaar','Bazaar deal detection')+toggle('itemMarket','Item Market + local watchlist')+toggle('loadoutComparator','Loadout Comparator — compare market gear vs equipped')+toggle('priceNetwork','SakaLuX Price Network — anonymous opt-in')+'<label class="sl-mi-field">Price Network HTTPS endpoint<input id="sl-mi-network-endpoint" inputmode="url" placeholder="https://your-worker.workers.dev" value="'+esc(settings.priceNetworkEndpoint||'')+'"></label><div class="sl-mi-network-privacy">When enabled, only item ID, observed Item Market floor price, timestamp and source are shared. Torn ID, username, API key, device ID and cookies are never sent.</div>'+toggle('items','Inventory market estimates')+toggle('museum','Museum intelligence')+toggle('points','Points Market rate capture')+'<label class="sl-mi-field">Travel slots<input id="sl-mi-slots" type="number" min="1" max="100" value="'+esc(settings.travelSlots)+'"></label><label class="sl-mi-field">Travel budget ($)<input id="sl-mi-budget" inputmode="numeric" value="'+esc(settings.travelBudget||0)+'" placeholder="0 = unlimited"></label><label class="sl-mi-field">Fallback flight multiplier<input id="sl-mi-flight" type="number" min="0.1" max="1" step="0.01" value="'+esc(settings.flightMultiplier)+'"></label><label class="sl-mi-field">Market fee %<input id="sl-mi-fee" type="number" min="0" max="100" step="0.1" value="'+esc(settings.marketFeePct)+'"></label><label class="sl-mi-field">Minimum highlighted profit<input id="sl-mi-min-profit" inputmode="numeric" value="'+esc(settings.minProfit)+'"></label><div class="sl-mi-info">Watchlist: <b>'+Object.keys(watchlist).length+'</b> · Cached market: <b>'+Object.keys(marketCache).length+'</b> · Stock histories: <b>'+Object.keys(stockHistory).length+'</b> · Travel sessions: <b>'+((travelSessions.history||[]).length+(travelSessions.current?1:0))+'</b></div><button class="sl-mi-primary" id="sl-mi-save">SAVE VALUES</button><button class="sl-mi-secondary" id="sl-mi-clear-sessions">CLEAR TRAVEL HISTORY</button><button class="sl-mi-secondary" id="sl-mi-refresh">REFRESH PAGE DATA</button><button class="sl-mi-secondary" id="sl-mi-hard">HARD REFRESH MARKET CACHE</button></div>';
        document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
        overlay.querySelector('#sl-mi-close').onclick=()=>overlay.remove();
        overlay.querySelector('#sl-mi-api-access').onclick=()=>openApiAccess();
        overlay.querySelectorAll('input[data-mi-toggle="1"]').forEach(input=>input.addEventListener('change',()=>applyLiveToggle(input.dataset.setting,input.checked)));
        overlay.querySelector('#sl-mi-save').onclick=()=>{settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.travelBudget=Math.max(0,parseMoney(overlay.querySelector('#sl-mi-budget').value)||0);settings.flightMultiplier=Math.max(.1,Number(overlay.querySelector('#sl-mi-flight').value)||1);settings.marketFeePct=Number(overlay.querySelector('#sl-mi-fee').value)||0;settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;settings.priceNetworkEndpoint=normalizeNetworkEndpoint(overlay.querySelector('#sl-mi-network-endpoint')?.value||'');saveJson(STORAGE.settings,settings);if(settings.priceNetwork)schedulePriceNetworkFlush(500);const b=overlay.querySelector('#sl-mi-save');if(b){const t=b.textContent;b.textContent='SAVED ✓';setTimeout(()=>{if(b.isConnected)b.textContent=t;},900);}scheduleScan(false);};
        overlay.querySelector('#sl-mi-clear-sessions').onclick=()=>{travelSessions={current:null,history:[]};saveTravelSessions();overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-refresh').onclick=()=>{overlay.remove();scheduleScan(true);};overlay.querySelector('#sl-mi-hard').onclick=()=>{marketCache={};saveJson(STORAGE.marketCache,marketCache);overlay.remove();scheduleScan(true);};
    }

    function injectCss()'''

pattern = re.compile(r"    function openSettings\(\)\{[\s\S]*?\n    \}\n\n    function injectCss\(\)")
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'openSettings block replacement count={count}')

# Expose the dedicated API panel without changing the existing Hub open/settings action.
text = text.replace("open(){openSettings();return true;}", "open(){openSettings();return true;},openApiAccess(){return openApiAccess();}", 1) if "open(){openSettings();return true;}" in text else text

MI.write_text(text, encoding='utf-8')

reg = json.loads(REG.read_text(encoding='utf-8'))
found=False
for item in reg.get('scripts',[]):
    if item.get('id')=='market-intelligence':
        item['version']=new_version;found=True
if not found: raise SystemExit('market-intelligence missing from scripts.json')
REG.write_text(json.dumps(reg, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')

hub = HUB.read_text(encoding='utf-8')
hub, n = re.subn(r"(id:\s*['\"]market-intelligence['\"][\s\S]{0,500}?version:\s*['\"])1\.17\.3(['\"])", r"\g<1>1.17.4\2", hub, count=1)
if n != 1: raise SystemExit('Hub fallback Market Intelligence version not updated')
HUB.write_text(hub, encoding='utf-8')

midoc = MIDOC.read_text(encoding='utf-8')
midoc = midoc.replace('**v1.17.3**','**v1.17.4**',1)
marker='## Current release notes\n\n'
release="""### v1.17.4 — Dedicated API Access panel

- Moved Torn API controls out of the main Market Intelligence settings list.
- Added a dedicated gold key button next to the close button in the Market Intelligence header.
- Added an Elimination-style API Access panel customized for Market Intelligence permissions, source/status diagnostics, key creation, Save & Test, Check Access and local-key clearing.
- Removed the old inline API ACCESS block and bottom CREATE REQUIRED API KEY button from Settings.
- The dedicated key creator now always requests the exact Market Intelligence read-only permission set.

"""
if marker not in midoc: raise SystemExit('Market Intelligence release notes marker missing')
midoc = midoc.replace(marker, marker+release,1)
MIDOC.write_text(midoc,encoding='utf-8')

hubdoc = HUBDOC.read_text(encoding='utf-8')
hubdoc, n = re.subn(r'(- .*SakaLuX Market Intelligence \*\*v)1\.17\.3(\*\*)', r'\g<1>1.17.4\2', hubdoc, count=1)
if n != 1: raise SystemExit('Script-Hub doc Market Intelligence version not updated')
HUBDOC.write_text(hubdoc,encoding='utf-8')

print('Market Intelligence v1.17.4 dedicated API panel migration applied')
