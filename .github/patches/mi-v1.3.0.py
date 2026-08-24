from pathlib import Path
import json

ROOT = Path('.')
SRC = ROOT / 'SakaLuX-Market-Intelligence.user.js'
REG = ROOT / 'scripts.json'
INFO = ROOT / 'UPDATE-INFO.md'
GF = ROOT / 'greasyfork/Market-Intelligence.md'


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing replacement anchor: {label}')
    return text.replace(old, new, 1)

s = SRC.read_text(encoding='utf-8')
s = must_replace(s, '// @version      1.2.1', '// @version      1.3.0', 'metadata version')
s = must_replace(
    s,
    '// @description  Torn market and travel intelligence with fast cache-first Best Travel Run, arrival-stock prediction, stock/restock ETA, Bazaar deals, Item Market watchlist, Items, Museum and Points Market support.',
    '// @description  Torn market and travel intelligence with fast Travel tools, arrival-stock prediction, Bazaar/Item Market intelligence, and Museum set vs Points valuation.',
    'metadata description'
)
s = must_replace(s, "const VERSION = '1.2.1';", "const VERSION = '1.3.0';", 'runtime version')
s = must_replace(
    s,
    "        pointsRate: 'SakaLuX_MI_POINTS_RATE_V1',\n        stockHistory: 'SakaLuX_MI_STOCK_HISTORY_V1'",
    "        pointsRate: 'SakaLuX_MI_POINTS_RATE_V1',\n        stockHistory: 'SakaLuX_MI_STOCK_HISTORY_V1',\n        itemCatalog: 'SakaLuX_MI_ITEM_CATALOG_V1'",
    'storage item catalog'
)
s = must_replace(
    s,
    "    const STOCK_HISTORY_MAX_AGE = 30 * 24 * 60 * 60 * 1000;",
    "    const STOCK_HISTORY_MAX_AGE = 30 * 24 * 60 * 60 * 1000;\n    const ITEM_CATALOG_MAX_AGE = 30 * 24 * 60 * 60 * 1000;\n    const POINTS_RATE_MAX_AGE = 24 * 60 * 60 * 1000;",
    'museum cache constants'
)

museum_sets = r'''

    const MUSEUM_SETS = [
        { id:'arrowheads', name:'Arrowhead Set', points:25, members:[
            {name:'Chert Point',qty:1},{name:'Quartzite Point',qty:1},{name:'Basalt Point',qty:1},
            {name:'Obsidian Point',qty:1},{name:'Quartz Point',qty:1},{name:'Chalcedony Point',qty:1}
        ]},
        { id:'medieval-coins', name:'Medieval Coin Set', points:100, members:[
            {name:'Leopard Coin',qty:1},{name:'Florin Coin',qty:1},{name:'Gold Noble Coin',qty:1}
        ]},
        { id:'patagonian-fossil', name:'Patagonian Fossil', points:20, members:[{name:'Patagonian Fossil',qty:1}] },
        { id:'meteorite-fragment', name:'Meteorite Fragment', points:15, members:[{name:'Meteorite Fragment',qty:1}] },
        { id:'vairocana-buddha', name:'Vairocana Buddha', points:100, members:[{name:'Vairocana Buddha Sculpture',qty:1}] },
        { id:'ganesha', name:'Ganesha Sculpture', points:250, members:[{name:'Ganesha Sculpture',qty:1}] },
        { id:'shabti', name:'Shabti Sculpture', points:500, members:[{name:'Shabti Sculpture',qty:1}] },
        { id:'senet', name:'Senet Game Set', points:2000, members:[
            {name:'Senet Board',qty:1},{name:'White Senet Pawn',qty:5},{name:'Black Senet Pawn',qty:5}
        ]},
        { id:'companion-scripts', name:'Companion Script Set', points:1000, members:[
            {name:'Companion Script : Abdullah',qty:1},{name:'Companion Script : Ali',qty:1},{name:'Companion Script : Ubay',qty:1}
        ]},
        { id:'egyptian-amulet', name:'Egyptian Amulet', points:10000, members:[{name:'Egyptian Amulet',qty:1}] }
    ];
'''
s = must_replace(
    s,
    "    const TORN_TRAVEL_LABELS = {",
    museum_sets + "\n    const TORN_TRAVEL_LABELS = {",
    'museum set definitions'
)

s = must_replace(
    s,
    "        travelCacheHits: 0, travelRefreshes: 0, observerSkips: 0, lastObserverScan: 0",
    "        travelCacheHits: 0, travelRefreshes: 0, observerSkips: 0, lastObserverScan: 0,\n        museumSets: 0, museumRecommendation: '', museumMissingSets: 0",
    'museum state'
)

helpers = r'''

    function museumNameKey(name) {
        return normText(name).toLowerCase().replace(/\s*:\s*/g, ':');
    }

    function museumDomCatalog() {
        const map=new Map();
        document.querySelectorAll('img[src*="/images/items/"]').forEach(img=>{
            const id=itemIdFromImg(img); if(!id)return;
            const row=rowContainer(img);
            const raw=normText(img.getAttribute('alt')||'') || normText((row?.innerText||'').split('\n')[0]);
            if(!raw)return;
            map.set(museumNameKey(raw),{id,name:raw,source:'museum-dom'});
        });
        return map;
    }

    async function loadMuseumCatalog() {
        const merged=museumDomCatalog();
        const cached=loadJson(STORAGE.itemCatalog,null);
        if(cached?.items && cached?.at && Date.now()-cached.at<ITEM_CATALOG_MAX_AGE) {
            for(const item of cached.items){if(item?.id&&item?.name)merged.set(museumNameKey(item.name),item);}
            return merged;
        }
        const key=getApiKey();
        if(!key)return merged;
        try {
            const data=await requestJson('https://api.torn.com/torn/?selections=items&key='+encodeURIComponent(key));
            checkApiError(data);
            const items=[];
            for(const [id,meta] of Object.entries(data?.items||{})){
                const n=Number(id); if(!n||!meta?.name)continue;
                const item={id:n,name:meta.name,type:meta.type||'',source:'torn-catalog'};
                items.push(item); merged.set(museumNameKey(item.name),item);
            }
            if(items.length)saveJson(STORAGE.itemCatalog,{at:Date.now(),items});
        } catch (_) {}
        return merged;
    }

    function freshPointsRate() {
        const row=loadJson(STORAGE.pointsRate,null);
        if(!row?.rate||!row?.at)return null;
        if(Date.now()-Number(row.at)>POINTS_RATE_MAX_AGE)return null;
        return Number(row.rate)||null;
    }
'''
s = must_replace(
    s,
    "    function normalizeDestination(value) {",
    helpers + "\n    function normalizeDestination(value) {",
    'museum helpers'
)

old_museum = "    function scanMuseum(){if(!settings.museum)return;document.getElementById('sl-mi-museum-bar')?.remove();const rate=loadJson(STORAGE.pointsRate,null),bar=document.createElement('div');bar.id='sl-mi-museum-bar';bar.innerHTML='<b>☠︎ Museum Intelligence</b> · Points rate: <strong>'+(rate?.rate?money(rate.rate)+'/pt':'not captured yet')+'</strong><span class=\"muted\"> · Full set valuation is the next module.</span>';mountTop(bar);}"
new_museum = r'''    async function scanMuseum(){
        if(!settings.museum)return;
        document.getElementById('sl-mi-museum-bar')?.remove();
        state.museumSets=0;state.museumRecommendation='';state.museumMissingSets=0;

        const pointsRate=freshPointsRate();
        const catalog=await loadMuseumCatalog();
        const resolved=[];
        const itemIds=new Set();

        for(const set of MUSEUM_SETS){
            const members=[];const missing=[];
            for(const member of set.members){
                const item=catalog.get(museumNameKey(member.name));
                if(!item?.id){missing.push(member.name);continue;}
                members.push({id:Number(item.id),name:item.name||member.name,qty:Number(member.qty)||1});
                itemIds.add(Number(item.id));
            }
            resolved.push({set,members,missing});
        }

        const marketMap=new Map();
        for(const id of itemIds){const c=cachePeek(id);if(c)marketMap.set(id,c);}
        await mapWithLimit([...itemIds].slice(0,MAX_LIVE_FETCHES),async id=>{
            const m=await fetchMarket(id);if(m)marketMap.set(id,m);return m;
        });

        const rows=[];
        const fee=Math.max(0,Number(settings.marketFeePct)||0)/100;
        for(const entry of resolved){
            let gross=0;const unpriced=[];
            for(const member of entry.members){
                const market=marketMap.get(member.id);
                if(!market?.price){unpriced.push(member.name);continue;}
                gross+=Number(market.price)*member.qty;
            }
            const complete=entry.missing.length===0&&unpriced.length===0&&entry.members.length===entry.set.members.length;
            const sellNet=complete?gross*(1-fee):null;
            const pointsCash=complete&&pointsRate?entry.set.points*pointsRate:null;
            let recommendation='WAITING FOR DATA',difference=null,edgePct=null;
            if(complete&&!pointsRate)recommendation='CAPTURE POINTS RATE';
            if(complete&&pointsRate){
                difference=pointsCash-sellNet;
                recommendation=difference>=0?'TURN IN SET':'SELL ITEMS';
                const winner=Math.max(pointsCash,sellNet),loser=Math.max(1,Math.min(pointsCash,sellNet));
                edgePct=(winner-loser)/loser*100;
            }
            rows.push({set:entry.set,complete,missing:[...entry.missing,...unpriced],gross,sellNet,pointsCash,recommendation,difference,edgePct});
        }

        const ready=rows.filter(r=>r.complete);
        state.museumSets=ready.length;
        state.museumMissingSets=rows.length-ready.length;
        const actionable=ready.filter(r=>r.pointsCash!=null).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference));
        state.museumRecommendation=actionable[0]?.recommendation||'';

        const bar=document.createElement('div');bar.id='sl-mi-museum-bar';bar.className='open';
        const rateText=pointsRate?money(pointsRate)+'/pt':'not captured / stale';
        bar.innerHTML='<div class="sl-mi-museum-head"><div><span class="sl-mi-br-title">🏛 MUSEUM INTELLIGENCE</span><strong>'+esc(rateText)+'</strong></div><button type="button">▾</button></div>'+
            '<div class="sl-mi-museum-note">Compares net Item Market sale value after '+esc(settings.marketFeePct)+'% fee with the cash-equivalent value of the Museum points reward.</div><div class="sl-mi-museum-body"></div>';
        const body=bar.querySelector('.sl-mi-museum-body');

        rows.sort((a,b)=>{
            if(a.complete!==b.complete)return a.complete?-1:1;
            return Math.abs(b.difference||0)-Math.abs(a.difference||0);
        });
        for(const r of rows){
            const row=document.createElement('div');row.className='sl-mi-museum-row';
            if(!r.complete){
                row.classList.add('missing');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span class="muted">missing price/data: '+esc(r.missing.slice(0,2).join(', '))+(r.missing.length>2?' +'+(r.missing.length-2):'')+'</span>';
            } else if(!pointsRate){
                row.classList.add('missing');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span>Sell net '+money(r.sellNet)+'</span><strong>CAPTURE POINTS RATE</strong>';
            } else {
                const turn=r.recommendation==='TURN IN SET';row.classList.add(turn?'turn':'sell');
                row.innerHTML='<span class="name">'+esc(r.set.name)+'</span><span>'+r.set.points.toLocaleString('en-US')+' pts</span><span>Sell net '+money(r.sellNet)+'</span><span>Points '+money(r.pointsCash)+'</span><strong>'+esc(r.recommendation)+'</strong><span class="edge">+'+money(Math.abs(r.difference))+' · '+pct(r.edgePct)+'</span>';
            }
            body.appendChild(row);
        }
        if(!pointsRate){
            const hint=document.createElement('button');hint.type='button';hint.className='sl-mi-points-link';hint.textContent='OPEN POINTS MARKET';hint.onclick=()=>{location.href='https://www.torn.com/pmarket.php';};body.prepend(hint);
        }
        bar.querySelector('.sl-mi-museum-head').onclick=()=>bar.classList.toggle('open');
        mountTop(bar);
    }'''
s = must_replace(s, old_museum, new_museum, 'replace museum module')

s = must_replace(
    s,
    "case'museum':scanMuseum();break;",
    "case'museum':await scanMuseum();break;",
    'await museum scan'
)
s = must_replace(
    s,
    "document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival').forEach(n=>n.remove())",
    "document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar').forEach(n=>n.remove())",
    'museum force cleanup'
)

s = must_replace(
    s,
    "cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits,travelRefreshes:state.travelRefreshes,observerSkips:state.observerSkips",
    "cachedMarketItems:Object.keys(marketCache).length,travelCacheHits:state.travelCacheHits,travelRefreshes:state.travelRefreshes,observerSkips:state.observerSkips,museumSets:state.museumSets,museumMissingSets:state.museumMissingSets,museumRecommendation:state.museumRecommendation",
    'museum health'
)
s = must_replace(
    s,
    "        goToBazaar(){location.href='https://www.torn.com/bazaar.php';return true;}",
    "        goToBazaar(){location.href='https://www.torn.com/bazaar.php';return true;},\n        goToMuseum(){location.href='https://www.torn.com/museum.php';return true;},\n        async museumIntelligence(){if(detectPage()!=='museum')return false;await scanMuseum();return true;}",
    'museum public api'
)

css_anchor = ".sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}"
css_museum = r'''.sl-mi-museum-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-museum-head>div{display:flex;align-items:center;gap:8px;min-width:0}.sl-mi-museum-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-museum-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-museum-body{display:none;margin-top:7px;gap:4px}#sl-mi-museum-bar.open .sl-mi-museum-body{display:flex;flex-direction:column}.sl-mi-museum-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto auto;gap:8px;align-items:center;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px}.sl-mi-museum-row .name{font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sl-mi-museum-row.turn{border-left:3px solid #78d98b;background:#142019}.sl-mi-museum-row.sell{border-left:3px solid #d7b94c;background:#201d13}.sl-mi-museum-row.missing{border-left:3px solid #5c6570}.sl-mi-museum-row .edge{color:#9da6b3}.sl-mi-points-link{border:1px solid #66591d;background:#2a2512;color:#e4c95d;border-radius:6px;padding:7px 9px;font-weight:900;font-size:10px;align-self:flex-start}
'''
s = must_replace(s, css_anchor, css_museum + css_anchor, 'museum css')
s = must_replace(
    s,
    "@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}",
    "@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}",
    'museum mobile css'
)

SRC.write_text(s, encoding='utf-8')

reg = json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts', []):
    if entry.get('id') == 'market-intelligence':
        entry['version'] = '1.3.0'
        entry['description'] = 'Fast market/travel intelligence plus Museum set valuation that compares net Item Market sale value against Museum points cash value and recommends TURN IN SET or SELL ITEMS.'
        actions = entry.setdefault('quickActions', [])
        if not any(a.get('id') == 'museum' for a in actions):
            actions.append({'id':'museum','label':'MUSEUM','icon':'🏛️','method':'goToMuseum','fallbackUrl':'https://www.torn.com/museum.php'})
        break
REG.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

info = INFO.read_text(encoding='utf-8')
info = info.replace('SakaLuX Market Intelligence: **v1.2.1**', 'SakaLuX Market Intelligence: **v1.3.0**', 1)
release = '''### SakaLuX Market Intelligence v1.3.0\n- Added **Museum Set Intelligence**.\n- Values the known Museum sets using current Torn Item Market prices and the configured market fee.\n- Compares **net Item Market sale value** against the cash-equivalent value of the set's Museum Points reward.\n- Gives a direct **TURN IN SET** or **SELL ITEMS** recommendation with the dollar advantage and percentage edge.\n- Supports Arrowhead, Medieval Coin, Patagonian Fossil, Meteorite Fragment, Vairocana Buddha, Ganesha, Shabti, Senet, Companion Script and Egyptian Amulet rewards.\n- Uses the Points Market rate captured by Market Intelligence; a missing/stale rate is clearly shown and links to Points Market.\n- Added a 30-day local Torn item-catalog cache so set member IDs do not need to be rediscovered on every Museum visit.\n- Added Museum set/recommendation fields to `health()` and `museumIntelligence()` / `goToMuseum()` to the public API.\n- Added a **MUSEUM** quick action to Script Hub through `scripts.json`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.2.1.user.js`.\n\n'''
info = info.replace('## Latest changes\n\n', '## Latest changes\n\n' + release, 1)
info = info.replace('## Backups available\n\n', '## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.2.1.user.js`\n', 1)
INFO.write_text(info, encoding='utf-8')

gf = GF.read_text(encoding='utf-8')
gf = gf.replace('**Current version: v1.2.1**', '**Current version: v1.3.0**', 1)
gf_release = '''## v1.3.0 — Museum Set Intelligence\n\n- Added full **Museum Set Intelligence**.\n- Calculates each supported set's current Item Market value and estimated net proceeds after the configured market fee.\n- Converts the Museum Points reward into a cash value using the Points Market rate captured by the script.\n- Shows a direct **TURN IN SET** or **SELL ITEMS** recommendation.\n- Shows the absolute dollar advantage and percentage edge of the better option.\n- Supports Arrowhead, Medieval Coin, Patagonian Fossil, Meteorite Fragment, Vairocana Buddha, Ganesha, Shabti, Senet, Companion Script and Egyptian Amulet rewards.\n- Missing market data is labelled instead of producing a false recommendation.\n- A missing/stale Points Market rate is clearly indicated with a button to open Points Market.\n- Added a 30-day local Torn item-catalog cache for Museum member resolution.\n- Added `museumIntelligence()` and `goToMuseum()` to `window.SakaLuXMarketIntelligence`.\n- Added Museum status fields to `health()` and a **MUSEUM** Hub quick action.\n\n'''
gf = gf.replace('## v1.2.1 — Travel Performance Update\n', gf_release + '## v1.2.1 — Travel Performance Update\n', 1)
gf = gf.replace('No observations are uploaded to a SakaLuX server in v1.2.1.', 'No observations are uploaded to a SakaLuX server in v1.3.0.', 1)
gf = gf.replace('- Museum set / Points value calculations.\n', '', 1)
GF.write_text(gf, encoding='utf-8')
