from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.5','// @version      1.15.6',1).replace("const VERSION = '1.15.5';","const VERSION = '1.15.6';",1)
old="""        for(const img of imgs){const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id),stock:extractStock(row)});}"""
new="""        for(const img of imgs){const id=itemIdFromImg(img),row=travelRowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,img,buy,name:img.alt||('Item #'+id),stock:extractTravelStock(row),displayValue:extractTornDisplayedValue(img)});}"""
if old not in s: raise SystemExit('scanTravel entry anchor missing')
s=s.replace(old,new,1)
old2="""        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const market=await fetchMarket(e.id);if(!market)return;marketMap.set(e.id,market);const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});"""
new2="""        await mapWithLimit(unique,async e=>{if(e.stock!=null)recordStock(destination,e.id,e.stock);const fetched=await fetchMarket(e.id);if(!fetched)return;const market=e.displayValue>0?{...fetched,price:e.displayValue,tornDisplayedValue:e.displayValue}:fetched;marketMap.set(e.id,market);const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;});"""
if old2 not in s: raise SystemExit('scanTravel market anchor missing')
s=s.replace(old2,new2,1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.6';e['description']='Torn PDA-first market/travel intelligence with correct compact shop prices, stock parsing and Torn displayed Value overrides for landed travel calculations.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.5**','SakaLuX Market Intelligence: **v1.15.6**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.6\n- Fixed landed Torn PDA scan to use the compact shop row for buy price and stock.\n- When an expanded Torn item card exposes `Value: $...`, that displayed Torn value now overrides the API listing reference for the local landed profit calculation.\n- This fixes cases like Minigun showing Market $1,499,999 while Torn itself displays Value $1,322,192.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.5.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.5**','**Current version: v1.15.6**',1)
gf=gf.replace('## v1.15.5','## v1.15.6 — Torn PDA Displayed Value Accuracy\n\n- Landed travel calculations now use Torn PDA compact shop rows for buy/stock.\n- If Torn displays an expanded `Value: $...`, that value is used for the local landed market/profit calculation.\n- Fixes mismatches such as Minigun showing $1,499,999 instead of Torn\'s displayed $1,322,192.\n\n## v1.15.5',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
# trigger
