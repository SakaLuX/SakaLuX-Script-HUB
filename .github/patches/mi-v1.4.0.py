from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def rep(text,old,new,label):
    if old not in text:
        raise SystemExit('Missing anchor: '+label)
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=rep(s,'// @version      1.3.0','// @version      1.4.0','meta version')
s=rep(s,"const VERSION = '1.3.0';","const VERSION = '1.4.0';",'runtime version')
s=rep(s,
'// @description  Torn market and travel intelligence with fast Travel tools, arrival-stock prediction, Bazaar/Item Market intelligence, and Museum set vs Points valuation.',
'// @description  Torn market and travel intelligence with fast Travel tools, Bazaar Flip Intelligence, Item Market tools, arrival-stock prediction and Museum set valuation.',
'description')
s=rep(s,
"        museumSets: 0, museumRecommendation: '', museumMissingSets: 0",
"        museumSets: 0, museumRecommendation: '', museumMissingSets: 0,\n        bazaarDeals: 0, bazaarBestProfit: 0, bazaarBestRoi: 0",
'bazaar state')

old_baz=r'''    async function scanBazaar(){
        if(!settings.bazaar)return;const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>1))continue;seen.add(row);entries.push({id,row,buy});}
        const ids=[...new Set(entries.map(e=>e.id))].slice(0,MAX_LIVE_FETCHES),map=new Map();await mapWithLimit(ids,async id=>{const m=await fetchMarket(id);if(m)map.set(id,m);});
        for(const e of entries){const market=map.get(e.id);if(!market)continue;const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-bazaar');box.classList.toggle('good',m.profit>=Number(settings.minProfit||0));box.classList.toggle('bad',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>'+(m.profit>=0?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);state.decorated++;}
    }'''
new_baz=r'''    function paintBazaarBoard(rows){
        document.getElementById('sl-mi-bazaar-board')?.remove();
        state.bazaarDeals=rows.length;
        state.bazaarBestProfit=rows[0]?.profit||0;
        state.bazaarBestRoi=rows.slice().sort((a,b)=>b.roi-a.roi)[0]?.roi||0;
        if(!rows.length)return;
        const top=rows.slice(0,10),best=top[0];
        const bar=document.createElement('div');bar.id='sl-mi-bazaar-board';bar.className='open';
        bar.innerHTML='<div class="sl-mi-baz-head"><div><span class="sl-mi-br-title">💰 BAZAAR FLIP INTELLIGENCE</span><strong>'+esc(best.name)+' · '+money(best.profit)+'</strong></div><div>'+top.length+' deals</div><button type="button">▾</button></div><div class="sl-mi-baz-note">Ranked by estimated net profit after '+esc(settings.marketFeePct)+'% market fee. Tap a row to scroll to that Bazaar listing.</div><div class="sl-mi-baz-body"></div>';
        const body=bar.querySelector('.sl-mi-baz-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-baz-row';row.tabIndex=0;row.setAttribute('role','button');
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>Buy '+money(r.buy)+'</span><span>Market '+money(r.market)+'</span><strong>'+money(r.profit)+'</strong><span>'+pct(r.roi)+'</span>';
            const go=()=>{try{r.row.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row.scrollIntoView();}r.row.classList.add('sl-mi-focus');setTimeout(()=>r.row.classList.remove('sl-mi-focus'),1800);};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        }
        bar.querySelector('.sl-mi-baz-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);
    }

    async function scanBazaar(){
        if(!settings.bazaar)return;
        document.getElementById('sl-mi-bazaar-board')?.remove();
        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;
        const imgs=[...document.querySelectorAll('img[src*="/images/items/"]')],entries=[],seen=new Set();
        for(const img of imgs){
            const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;
            const buy=extractFirstPrice(row);if(!(buy>1))continue;
            seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id)});
        }
        const ids=[...new Set(entries.map(e=>e.id))].slice(0,MAX_LIVE_FETCHES),map=new Map();
        for(const id of ids){const c=cachePeek(id);if(c)map.set(id,c);}
        await mapWithLimit(ids,async id=>{const m=await fetchMarket(id);if(m)map.set(id,m);});
        const deals=[];
        for(const e of entries){
            const market=map.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-bazaar');
            const good=m.profit>=Number(settings.minProfit||0)&&m.profit>0;
            box.classList.toggle('good',good);box.classList.toggle('bad',!good);
            box.innerHTML='<b>'+(good?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);
            if(good)deals.push({id:e.id,row:e.row,name:e.name,buy:e.buy,market:market.price,profit:m.profit,roi:m.roi});
            state.decorated++;
        }
        deals.sort((a,b)=>b.profit-a.profit || b.roi-a.roi);
        paintBazaarBoard(deals);
    }'''
s=rep(s,old_baz,new_baz,'bazaar module')
s=rep(s,
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar').forEach(n=>n.remove())",
"document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-museum-bar,#sl-mi-bazaar-board').forEach(n=>n.remove())",
'force cleanup')
s=rep(s,
"museumRecommendation:state.museumRecommendation",
"museumRecommendation:state.museumRecommendation,bazaarDeals:state.bazaarDeals,bazaarBestProfit:state.bazaarBestProfit,bazaarBestRoi:state.bazaarBestRoi",
'health fields')

css_anchor='.sl-mi-watch-row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}'
css=r'''.sl-mi-baz-head{display:flex;align-items:center;justify-content:space-between;gap:8px;cursor:pointer}.sl-mi-baz-head>div:first-child{display:flex;gap:8px;align-items:center;min-width:0}.sl-mi-baz-head strong{color:#78d98b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-baz-head button{border:0;background:transparent;color:#d7b94c;font-size:14px}.sl-mi-baz-note{margin-top:5px;color:#8f98a5;font-weight:600;font-size:9px}.sl-mi-baz-body{display:none;margin-top:7px;gap:4px}#sl-mi-bazaar-board.open .sl-mi-baz-body{display:flex;flex-direction:column}.sl-mi-baz-row{display:grid;grid-template-columns:minmax(0,1.4fr) auto auto auto auto;gap:8px;align-items:center;padding:6px;border:1px solid #292f38;border-radius:5px;font-size:10px;cursor:pointer}.sl-mi-baz-row:hover,.sl-mi-baz-row:focus{background:#1a231c;border-color:#4d6957;outline:none}.sl-mi-baz-row .name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-focus{outline:2px solid #78d98b!important;outline-offset:2px!important}
'''
s=rep(s,css_anchor,css+css_anchor,'bazaar css')
s=rep(s,
"@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}",
"@media(max-width:700px){.sl-mi-br-row,.sl-mi-arrival-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-museum-row{grid-template-columns:minmax(0,1fr) auto;gap:3px 7px}.sl-mi-museum-row .name{grid-column:1/-1}.sl-mi-baz-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-baz-row .name{grid-column:1/-1}",
'mobile bazaar css')
SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.4.0'
        e['description']='Fast Travel and market intelligence with Bazaar Flip Intelligence, ranked profitable deals, Item Market tools, arrival-stock prediction and Museum set valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.3.0**','SakaLuX Market Intelligence: **v1.4.0**',1)
release='''### SakaLuX Market Intelligence v1.4.0\n- Added **Bazaar Flip Intelligence** with a dedicated ranked deal board.\n- Scans Bazaar listings, compares buy price with current/cached Torn Item Market price, applies the configured market fee and ranks profitable flips by estimated net profit.\n- Shows item, buy price, market price, profit and ROI for the top 10 deals.\n- Tapping a deal scrolls directly to the matching Bazaar listing and highlights it temporarily.\n- Keeps the existing per-item **DEAL / NO FLIP** overlays.\n- Uses cache-first market data and refreshes through the existing bounded request system.\n- Added Bazaar deal count, best profit and best ROI to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.3.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
if '- `backups/SakaLuX-Market-Intelligence-v1.3.0.user.js`' not in info:
    info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.3.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.3.0**','**Current version: v1.4.0**',1)
gfrelease='''## v1.4.0 — Bazaar Flip Intelligence\n\n- Added a dedicated **Bazaar Flip Intelligence** board.\n- Profitable Bazaar listings are ranked by estimated net profit after the configured market fee.\n- The board shows buy price, Item Market price, net profit and ROI for the top 10 opportunities.\n- Tapping a board row jumps to the matching Bazaar listing and highlights it.\n- Existing per-item DEAL / NO FLIP labels remain available.\n- Uses the existing cache-first market layer and bounded requests to avoid unnecessary API load.\n- `health()` now exposes Bazaar deal count, best profit and best ROI.\n\n'''
gf=gf.replace('## v1.3.0 — Museum Set Intelligence\n',gfrelease+'## v1.3.0 — Museum Set Intelligence\n',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.3.0.','No observations are uploaded to a SakaLuX server in v1.4.0.',1)
GF.write_text(gf,encoding='utf-8')
