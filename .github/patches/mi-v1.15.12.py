from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.11','// @version      1.15.12',1).replace("const VERSION = '1.15.11';","const VERSION = '1.15.12';",1)
old="""        document.querySelectorAll('.sl-mi-bazaar-badge-wrap').forEach(n=>n.remove());
"""
new="""        document.querySelectorAll('.sl-mi-bazaar-badge-wrap,.sl-mi-bazaar').forEach(n=>n.remove());
"""
if old not in s: raise SystemExit('bazaar cleanup anchor missing')
s=s.replace(old,new,1)
old2="""            const market=map.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price),box=ensureBazaarBadge(e.row,'sl-mi-bazaar');
            const good=m.profit>=Number(settings.minProfit||0)&&m.profit>0;
            box.classList.toggle('good',good);box.classList.toggle('bad',!good);
            box.innerHTML='<b>'+(good?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);
            if(good)deals.push({id:e.id,row:e.row,name:e.name,buy:e.buy,market:market.price,profit:m.profit,roi:m.roi});
            state.decorated++;
"""
new2="""            const market=map.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price);
            const good=m.profit>=Number(settings.minProfit||0)&&m.profit>0;
            const compactPda=window.matchMedia?.('(max-width: 900px)')?.matches;
            if(!compactPda){
                const box=ensureBazaarBadge(e.row,'sl-mi-bazaar');
                if(box){box.classList.toggle('good',good);box.classList.toggle('bad',!good);box.innerHTML='<b>'+(good?'▲ DEAL':'▼ NO FLIP')+'</b> · Market '+money(market.price)+' · '+money(m.profit)+' · '+pct(m.roi);}
            }
            if(good)deals.push({id:e.id,row:e.row,name:e.name,buy:e.buy,market:market.price,profit:m.profit,roi:m.roi});
            state.decorated++;
"""
if old2 not in s: raise SystemExit('bazaar badge anchor missing')
s=s.replace(old2,new2,1)
marker=""".sl-mi-bazaar-badge-wrap{display:block!important;position:relative!important;width:100%!important;max-width:100%!important;clear:both!important;margin:3px 0 8px!important;box-sizing:border-box!important;float:none!important;transform:none!important;z-index:auto!important}"""
if marker in s:
    s=s.replace(marker,marker+"\n@media(max-width:900px){.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap{display:none!important}}",1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.12'
        e['description']='Torn PDA-first market/travel intelligence with a clean Bazaar Flip board on mobile, Item Market intelligence and travel/basket tools.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.11**','SakaLuX Market Intelligence: **v1.15.12**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.12\n- Disabled per-item Bazaar DEAL / NO FLIP badges on Torn PDA/mobile because they distort and overlap Torn item cards.\n- Mobile Bazaar now keeps only the clean Bazaar Flip Intelligence board.\n- Stale Bazaar badge elements are forcibly removed before repainting.\n- Desktop keeps per-item badges.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.11.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.11**','**Current version: v1.15.12**',1)
gf=gf.replace('## v1.15.11','## v1.15.12 — Clean PDA Bazaar\n\n- Removes per-item DEAL / NO FLIP badges from Torn PDA/mobile where they were overlapping item cards.\n- Keeps the Bazaar Flip Intelligence summary board with ranked profitable deals.\n- Cleans stale Bazaar badge nodes before each scan.\n- Desktop behavior remains unchanged.\n\n## v1.15.11',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
# trigger after exact backup
