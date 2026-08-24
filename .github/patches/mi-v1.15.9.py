from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.8','// @version      1.15.9',1).replace("const VERSION = '1.15.8';","const VERSION = '1.15.9';",1)
old="""    async function scanItemMarket(){
        if(!settings.itemMarket)return;
        const id=selectedMarketItemId();document.getElementById('sl-mi-market-bar')?.remove();if(!id)return;
        const market=await fetchMarket(id,true);if(!market)return;
"""
new="""    async function scanItemMarket(){
        if(!settings.itemMarket)return;
        const previous=document.getElementById('sl-mi-market-bar');
        const id=selectedMarketItemId();if(!id){previous?.remove();return;}
        const market=await fetchMarket(id,true);if(!market)return;
"""
if old not in s: raise SystemExit('scanItemMarket start anchor missing')
s=s.replace(old,new,1)
old2="""        mountTop(bar);
        bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
"""
new2="""        previous?.remove();
        mountTop(bar);
        bar.querySelector('#sl-mi-watch-save').onclick=()=>{const n=parseMoney(bar.querySelector('#sl-mi-watch-price').value);if(!(n>0))return;watchlist[String(id)]={itemId:id,maxPrice:n,updatedAt:Date.now()};saveJson(STORAGE.watchlist,watchlist);scanItemMarket();};
"""
if old2 not in s: raise SystemExit('scanItemMarket mount anchor missing')
s=s.replace(old2,new2,1)
s=s.replace("#sl-mi-bazaar-board,#sl-mi-market-bar,#sl-mi-travel-plan", "#sl-mi-bazaar-board,#sl-mi-travel-plan",1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.9'
        e['description']='Torn PDA-first market/travel intelligence with stable Item Market Intelligence rendering, item-specific Torn Value matching and travel/basket tools.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.8**','SakaLuX Market Intelligence: **v1.15.9**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.9\n- Fixed Item Market Intelligence flicker/disappearing on Torn PDA.\n- The existing panel now stays visible while fresh market data loads and is replaced only when the new panel is ready.\n- Force scans no longer delete the Item Market panel before its async refresh completes.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.8.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.8**','**Current version: v1.15.9**',1)
gf=gf.replace('## v1.15.8','## v1.15.9 — Stable Item Market Panel\n\n- Fixes the Item Market Intelligence panel appearing and disappearing on Torn PDA.\n- Keeps the current panel on screen while new API data loads, then swaps it atomically.\n- Force refreshes no longer blank the panel during async requests.\n\n## v1.15.8',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
# trigger
