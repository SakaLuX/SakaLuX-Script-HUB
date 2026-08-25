from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.10','// @version      1.15.11',1).replace("const VERSION = '1.15.10';","const VERSION = '1.15.11';",1)
anchor="""    function ensureBazaarBadge(row,cls){
        if(!row)return null;
        const host=row.closest?.('li,[role=\"row\"],tr')||row;
"""
replacement="""    function bazaarItemHost(img,row){
        let el=row||img;
        for(let depth=0;depth<8&&el?.parentElement;depth++){
            const parent=el.parentElement;
            const itemChildren=[...parent.children].filter(child=>child.querySelector?.('img[src*=\"/images/items/\"]'));
            if(itemChildren.length>=2)return el;
            el=parent;
        }
        return row||img;
    }

    function ensureBazaarBadge(row,cls){
        if(!row)return null;
        const host=row;
"""
if anchor not in s: raise SystemExit('ensureBazaarBadge anchor missing')
s=s.replace(anchor,replacement,1)
old="""        const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
        for(const img of imgs){
            const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row||seen.has(row))continue;
            const buy=extractFirstPrice(row);if(!(buy>1))continue;
            seen.add(row);entries.push({id,row,buy,name:img.alt||('Item #'+id)});
        }
"""
new="""        document.querySelectorAll('.sl-mi-bazaar-badge-wrap').forEach(n=>n.remove());
        const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
        for(const img of imgs){
            const id=itemIdFromImg(img),row=rowContainer(img);if(!id||!row)continue;
            const host=bazaarItemHost(img,row);if(!host||seen.has(host))continue;
            const buy=extractFirstPrice(host);if(!(buy>1))continue;
            seen.add(host);entries.push({id,row:host,buy,name:img.alt||('Item #'+id)});
        }
"""
if old not in s: raise SystemExit('scanBazaar entries anchor missing')
s=s.replace(old,new,1)
s=s.replace("#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items", "#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items",1)
css_old=""".sl-mi-bazaar-badge-wrap{display:block!important;width:100%!important;clear:both!important;margin:2px 0 6px!important;box-sizing:border-box!important}.sl-mi-bazaar-badge-wrap>td{padding:0 6px 6px!important;border:0!important;background:transparent!important}.sl-mi-bazaar-wide{display:block!important;position:static!important;inset:auto!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35!important;margin:0!important;padding:7px 10px!important;float:none!important;transform:none!important;z-index:auto!important}
"""
css_new=""".sl-mi-bazaar-badge-wrap{display:block!important;position:relative!important;width:100%!important;max-width:100%!important;clear:both!important;margin:3px 0 8px!important;box-sizing:border-box!important;float:none!important;transform:none!important;z-index:auto!important}.sl-mi-bazaar-badge-wrap>td{padding:0 6px 6px!important;border:0!important;background:transparent!important}.sl-mi-bazaar-wide{display:block!important;position:static!important;inset:auto!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35!important;margin:0!important;padding:7px 10px!important;float:none!important;transform:none!important;z-index:auto!important}
"""
if css_old in s:s=s.replace(css_old,css_new,1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.11'
        e['description']='Torn PDA-first market/travel intelligence with Bazaar badges mounted outside item cards, stable Flip board, Item Market intelligence and travel/basket tools.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.10**','SakaLuX Market Intelligence: **v1.15.11**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.11\n- Fixed Bazaar PDA item-card overlap that remained in v1.15.10.\n- Bazaar badges now identify the full Torn PDA item card and mount as a sibling below it instead of inside its image/name area.\n- Existing misplaced badge wrappers are removed before each Bazaar repaint.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.10.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.10**','**Current version: v1.15.11**',1)
gf=gf.replace('## v1.15.10','## v1.15.11 — Bazaar PDA Card Separation\n\n- Fixes per-item Bazaar badges still overlapping item cards on Torn PDA.\n- Detects the full item-card host and mounts the MI result below the card as a separate full-width block.\n- Cleans obsolete/misplaced badge wrappers before repainting.\n\n## v1.15.10',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
