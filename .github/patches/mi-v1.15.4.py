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
s=repl(s,'// @version      1.15.3','// @version      1.15.4','meta')
s=repl(s,"const VERSION = '1.15.3';","const VERSION = '1.15.4';",'runtime')
s=repl(s,"    const LANDED_SIGNATURE_DEBOUNCE_MS = 1200;","    const LANDED_SIGNATURE_DEBOUNCE_MS = 1200;\n    const MAX_REASONABLE_TRAVEL_STOCK = 100000;\n    const MIN_LEARNED_RESTOCK_GAP_MIN = 10;",'stock safety constants')
s=repl(s,"    function parseMoney(text) { const s=String(text||'').replace(/[^0-9]/g,''); return s?Number(s):NaN; }","    function parseMoney(text) {\n        const raw=String(text||'').trim().replace(/[$,\\s]/g,'');\n        const m=raw.match(/^([0-9]*\\.?[0-9]+)([kmb])?$/i);\n        if(m){const mult=!m[2]?1:(m[2].toLowerCase()==='k'?1e3:m[2].toLowerCase()==='m'?1e6:1e9);return Number(m[1])*mult;}\n        const digits=raw.replace(/[^0-9]/g,''); return digits?Number(digits):NaN;\n    }",'compact money parser')
s=repl(s,"    function extractFirstPrice(node) { const txt=(node?.innerText||node?.textContent||'').replace(/\\s+/g,' '); const m=txt.match(/\\$\\s*([\\d,.]+)/); return m?parseMoney(m[1]):NaN; }","    function extractFirstPrice(node) { const txt=(node?.innerText||node?.textContent||'').replace(/\\s+/g,' '); const m=txt.match(/\\$\\s*([\\d,.]+)\\s*([KMB])?/i); return m?parseMoney(m[1]+(m[2]||'')):NaN; }",'compact row price')
old="""        const listings=Array.isArray(data?.itemmarket?.listings)?data.itemmarket.listings:(Array.isArray(data?.itemmarket)?data.itemmarket:[]);\n        const norm=listings.map(l=>({price:Number(l.price??l.cost??0),qty:Number(l.amount??l.quantity??1)})).filter(l=>l.price>0).sort((a,b)=>a.price-b.price);\n        if(!norm.length) return null;\n        const effective=norm.find(l=>l.qty>=2)||norm[0];\n        const row={price:effective.price,minPrice:norm[0].price,qty:effective.qty,count:norm.length}; cachePut(itemId,row); return row;"""
new="""        const listings=Array.isArray(data?.itemmarket?.listings)?data.itemmarket.listings:(Array.isArray(data?.itemmarket)?data.itemmarket:[]);\n        const norm=listings.map(l=>({price:Number(l.price??l.cost??0),qty:Number(l.amount??l.quantity??1)})).filter(l=>l.price>0).sort((a,b)=>a.price-b.price);\n        const average=Number(data?.itemmarket?.average_price??data?.itemmarket?.market_value??0);\n        if(!norm.length && !(average>0)) return null;\n        const effective=norm.length?(norm.find(l=>l.qty>=2)||norm[0]):null;\n        const floor=norm[0]?.price||average;\n        const marketValue=average>0?average:(effective?.price||floor);\n        const row={price:marketValue,averagePrice:average>0?average:null,minPrice:floor,listingPrice:effective?.price||floor,qty:effective?.qty||0,count:norm.length}; cachePut(itemId,row); return row;"""
s=repl(s,old,new,'average market value')
old="""    function recordStock(destination,itemId,stock,now=Date.now()) {\n        if(!destination||!Number.isFinite(Number(stock))) return;\n        const key=stockKey(destination,itemId), qty=Number(stock);\n        let h=stockHistory[key]||{last:null,restocks:[],restockQty:[]};\n        if(!Array.isArray(h.restocks)) h.restocks=[];\n        if(!Array.isArray(h.restockQty)) h.restockQty=[];\n        if(h.last&&Number.isFinite(h.last.qty)&&qty>h.last.qty){\n            const delta=qty-h.last.qty;\n            h.restocks=h.restocks.filter(t=>now-t<STOCK_HISTORY_MAX_AGE); h.restocks.push(now); h.restocks=h.restocks.slice(-MAX_HISTORY_EVENTS);\n            h.restockQty.push(delta); h.restockQty=h.restockQty.filter(v=>Number.isFinite(v)&&v>0).slice(-MAX_HISTORY_EVENTS);\n        }\n        h.last={qty,at:now}; stockHistory[key]=h;\n    }"""
new="""    function recordStock(destination,itemId,stock,now=Date.now()) {\n        if(!destination||!Number.isFinite(Number(stock))) return;\n        const key=stockKey(destination,itemId), qty=Number(stock);\n        if(qty<0||qty>MAX_REASONABLE_TRAVEL_STOCK)return;\n        let h=stockHistory[key]||{last:null,restocks:[],restockQty:[]};\n        if(!Array.isArray(h.restocks)) h.restocks=[];\n        if(!Array.isArray(h.restockQty)) h.restockQty=[];\n        if(h.last&&(!Number.isFinite(Number(h.last.qty))||Number(h.last.qty)<0||Number(h.last.qty)>MAX_REASONABLE_TRAVEL_STOCK))h.last=null;\n        if(h.last&&Number.isFinite(h.last.qty)&&qty>h.last.qty){\n            const delta=qty-h.last.qty;\n            if(delta>0&&delta<=MAX_REASONABLE_TRAVEL_STOCK){\n                h.restocks=h.restocks.filter(t=>now-t<STOCK_HISTORY_MAX_AGE); h.restocks.push(now); h.restocks=h.restocks.slice(-MAX_HISTORY_EVENTS);\n                h.restockQty.push(delta); h.restockQty=h.restockQty.filter(v=>Number.isFinite(v)&&v>0&&v<=MAX_REASONABLE_TRAVEL_STOCK).slice(-MAX_HISTORY_EVENTS);\n            }\n        }\n        h.last={qty,at:now}; stockHistory[key]=h;\n    }"""
s=repl(s,old,new,'record stock guard')
s=repl(s,"        for(let i=1;i<events.length;i++){const g=(events[i]-events[i-1])/60000;if(g>0&&g<24*60)gaps.push(g);}\n        const medGap=median(gaps);\n        const medQty=median((h?.restockQty||[]).map(Number).filter(v=>v>0));","        for(let i=1;i<events.length;i++){const g=(events[i]-events[i-1])/60000;if(g>=MIN_LEARNED_RESTOCK_GAP_MIN&&g<24*60)gaps.push(g);}\n        const medGap=median(gaps);\n        const medQty=median((h?.restockQty||[]).map(Number).filter(v=>v>0&&v<=MAX_REASONABLE_TRAVEL_STOCK));",'restock stats guards')
s=repl(s,"            if(projected!=null&&e.qty&&expectedRestocks>0) projected+=e.qty*expectedRestocks;","            if(projected!=null&&e.qty&&expectedRestocks>0) projected=Math.min(MAX_REASONABLE_TRAVEL_STOCK,projected+e.qty*expectedRestocks);",'projected stock clamp')
s=repl(s,"        return {current:projected==null?null:stock,projected,expectedRestocks,confidence,eta:e};","        if(projected!=null)projected=Math.max(0,Math.min(MAX_REASONABLE_TRAVEL_STOCK,projected));\n        return {current:projected==null?null:stock,projected,expectedRestocks,confidence,eta:e};",'final stock clamp')
SRC.write_text(s,encoding='utf-8')
reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.4'
        e['description']='Market/travel intelligence with corrected Torn PDA compact-price parsing, Torn market average values, safer restock learning and route/basket tools.'
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.15.3**','SakaLuX Market Intelligence: **v1.15.4**',1)
release='''### SakaLuX Market Intelligence v1.15.4\n- Fixed Torn PDA compact travel prices such as **$3M**, which were previously parsed as `$3` and caused absurd ROI/profit values.\n- Market calculations now prefer Torn API v2 `itemmarket.average_price` (the market value style number shown by Torn/Torn PDA) while retaining the lowest listing separately in cache.\n- Fixed corrupted Arrival stock learning: impossible stock/restock deltas above 100,000 are ignored, learned gaps below 10 minutes are rejected, and projected stock is clamped to a sane range.\n- Existing corrupted local restock samples are filtered automatically, so users do not need to clear storage manually.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.3.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
INFO.write_text(info,encoding='utf-8')
gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.15.3**','**Current version: v1.15.4**',1)
gf=gf.replace('## v1.15.3', '## v1.15.4 — Torn PDA Price + Restock Accuracy\n\n- Fixed compact travel prices such as `$3M` being interpreted as `$3`.\n- Profit calculations now use Torn item-market `average_price` when available, matching the market-value style figure shown by Torn/Torn PDA more closely; the live floor listing remains cached separately.\n- Added guards against corrupted restock history and impossible multi-million arrival-stock projections.\n- Very short false restock intervals are ignored and projected stock is clamped to a sane travel-stock range.\n\n## v1.15.3',1)
GF.write_text(gf,encoding='utf-8')
# trigger
