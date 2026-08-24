from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.9','// @version      1.15.10',1).replace("const VERSION = '1.15.9';","const VERSION = '1.15.10';",1)
anchor="""    function ensureTravelBadge(row,cls){
"""
helper="""    function ensureBazaarBadge(row,cls){
        if(!row)return null;
        const host=row.closest?.('li,[role=\"row\"],tr')||row;
        const next=host.nextElementSibling;
        if(next?.classList?.contains('sl-mi-bazaar-badge-wrap')){
            const existing=next.querySelector('.'+cls);if(existing)return existing;
        }
        const wrap=document.createElement(host.tagName==='TR'?'tr':'div');
        wrap.className='sl-mi-bazaar-badge-wrap';
        if(host.tagName==='TR'){
            const td=document.createElement('td');td.colSpan=Math.max(1,host.children?.length||4);wrap.appendChild(td);
            td.style.cssText='padding:0 6px 6px!important;border:0!important;background:transparent!important;';
            const box=document.createElement('div');box.className=cls+' sl-mi-bazaar-wide';td.appendChild(box);host.insertAdjacentElement('afterend',wrap);return box;
        }
        const box=document.createElement('div');box.className=cls+' sl-mi-bazaar-wide';wrap.appendChild(box);host.insertAdjacentElement('afterend',wrap);return box;
    }

"""
if helper.strip() not in s:
    if anchor not in s: raise SystemExit('anchor missing')
    s=s.replace(anchor,helper+anchor,1)
s=s.replace("const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-bazaar');","const m=metrics(e.buy,market.price),box=ensureBazaarBadge(e.row,'sl-mi-bazaar');",1)
# keep board stable while refreshing
s=s.replace("        document.getElementById('sl-mi-bazaar-board')?.remove();\n        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;","        const previousBoard=document.getElementById('sl-mi-bazaar-board');\n        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;",1)
s=s.replace("        paintBazaarBoard(deals);\n    }","        previousBoard?.remove();\n        paintBazaarBoard(deals);\n    }",1)
# don't blank bazaar board on force refresh
s=s.replace("#sl-mi-museum-bar,#sl-mi-bazaar-board,#sl-mi-travel-plan", "#sl-mi-museum-bar,#sl-mi-travel-plan",1)
# mobile bazaar layout polish
css_anchor=".sl-mi-baz-row .name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sl-mi-focus{outline:2px solid #78d98b!important;outline-offset:2px!important}"
css_new=css_anchor+"\n.sl-mi-bazaar-badge-wrap{display:block!important;width:100%!important;clear:both!important;box-sizing:border-box!important;margin:2px 0 7px!important}.sl-mi-bazaar-wide{display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35!important;padding:7px 10px!important;margin:0!important}.sl-mi-baz-head>div:first-child{flex:1;min-width:0}.sl-mi-baz-head>div:nth-child(2){white-space:nowrap}"
if css_anchor not in s: raise SystemExit('css anchor missing')
s=s.replace(css_anchor,css_new,1)
mobile=".sl-mi-baz-row{grid-template-columns:minmax(0,1fr) auto auto;gap:3px 7px}.sl-mi-baz-row .name{grid-column:1/-1}"
mobile_new=mobile+".sl-mi-baz-head{align-items:flex-start;flex-wrap:wrap}.sl-mi-baz-head>div:first-child{width:100%;flex-wrap:wrap}.sl-mi-baz-head>div:nth-child(2){margin-left:auto}.sl-mi-baz-row{grid-template-columns:minmax(0,1fr) auto}.sl-mi-baz-row>span:nth-child(2){grid-column:1/2}.sl-mi-baz-row>span:nth-child(3){grid-column:2/3;text-align:right}.sl-mi-baz-row>strong{grid-column:1/2}.sl-mi-baz-row>span:last-child{grid-column:2/3;text-align:right}"
if mobile not in s: raise SystemExit('mobile anchor missing')
s=s.replace(mobile,mobile_new,1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.10';e['description']='Torn PDA-first market/travel intelligence with clean full-width Bazaar badges, stable Bazaar Flip board, Item Market intelligence and travel/basket tools.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.9**','SakaLuX Market Intelligence: **v1.15.10**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.10\n- Reworked Bazaar badges for Torn PDA so they render full-width below each item instead of overlapping item cards.\n- Improved mobile Bazaar Flip board spacing and wrapping.\n- Bazaar Flip board now remains visible while async price refreshes complete.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.9.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.9**','**Current version: v1.15.10**',1)
gf=gf.replace('## v1.15.9','## v1.15.10 — Torn PDA Bazaar Layout\n\n- Bazaar badges now render as full-width rows below each item instead of overlapping the item card.\n- Bazaar Flip Intelligence has cleaner mobile wrapping and remains visible while market prices refresh.\n\n## v1.15.9',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
