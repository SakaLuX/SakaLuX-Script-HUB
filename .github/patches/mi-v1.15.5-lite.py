from pathlib import Path
import json,re
r=Path('.')
s=(r/'SakaLuX-Market-Intelligence.user.js').read_text()
s=s.replace('// @version      1.15.4','// @version      1.15.5',1).replace("const VERSION = '1.15.4';","const VERSION = '1.15.5';",1)
old='''    function rowContainer(img) { return img.closest('tr')||img.closest('li')||img.closest('[class*="row"]')||img.closest('[class*="Row"]')||img.closest('[class*="item"]')||img.parentElement?.parentElement||img.parentElement; }'''
new=old+'''\n    function travelRowContainer(img) {\n        if(!img)return null;\n        let el=img;\n        for(let i=0;i<7&&el;i++,el=el.parentElement){\n            const txt=normText(el.innerText||el.textContent||'');\n            if(!txt)continue;\n            if(/\\$\\s*[\\d,.]+\\s*[KMB]?/i.test(txt)&&!/\\b(?:Value|Circ|Damage|Accuracy|Rate of Fire|Ammo):/i.test(txt)&&txt.length<=180)return el;\n        }\n        return rowContainer(img);\n    }\n    function extractTravelStock(node) {\n        const txt=normText(node?.innerText||node?.textContent||'');\n        if(!txt)return null;\n        const clean=txt.replace(/\\$\\s*[\\d,.]+\\s*[KMB]?/ig,' ');\n        const nums=[...clean.matchAll(/(?:^|\\s)(\\d{1,6})(?=\\s|$)/g)].map(m=>Number(m[1])).filter(n=>Number.isFinite(n)&&n>=0&&n<=MAX_REASONABLE_TRAVEL_STOCK);\n        return nums.length?nums[0]:null;\n    }\n    function extractTornDisplayedValue(img) {\n        let el=img;\n        for(let i=0;i<8&&el;i++,el=el.parentElement){\n            const m=normText(el.innerText||el.textContent||'').match(/\\bValue:\\s*\\$\\s*([\\d,.]+)\\s*([KMB])?/i);\n            if(m){const v=parseMoney(m[1]+(m[2]||''));if(v>0)return v;}\n        }\n        return null;\n    }'''
if old not in s: raise SystemExit('row anchor missing')
s=s.replace(old,new,1)
s=s.replace('const row=rowContainer(img);if(!id||!row||seen.has(row))return;','const row=travelRowContainer(img);if(!id||!row||seen.has(row))return;')
s=s.replace('const buy=extractFirstPrice(row),stock=extractStock(row);','const buy=extractFirstPrice(row),stock=extractTravelStock(row);')
# Override cached market value from the visible expanded PDA card when available.
s=s.replace('const m=await fetchMarket(id);if(m)marketMap.set(id,m);','const m=await fetchMarket(id);if(m){const img=[...document.querySelectorAll(\'img[src*="/images/items/"]\')].find(x=>itemIdFromImg(x)===id);const v=extractTornDisplayedValue(img);marketMap.set(id,v?{...m,price:v,displayedValue:v}:m);}')
s=s.replace('const m=cachePeek(id);if(m)marketMap.set(id,m);','const m=cachePeek(id);if(m){const img=[...document.querySelectorAll(\'img[src*="/images/items/"]\')].find(x=>itemIdFromImg(x)===id);const v=extractTornDisplayedValue(img);marketMap.set(id,v?{...m,price:v,displayedValue:v}:m);}')
(r/'SakaLuX-Market-Intelligence.user.js').write_text(s)
reg=json.loads((r/'scripts.json').read_text())
for e in reg['scripts']:
    if e.get('id')=='market-intelligence': e['version']='1.15.5'; e['description']='Torn PDA-first market/travel intelligence with corrected compact travel stock parsing and visible Torn Value overrides.'
(r/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n')
info=(r/'UPDATE-INFO.md').read_text().replace('SakaLuX Market Intelligence: **v1.15.4**','SakaLuX Market Intelligence: **v1.15.5**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.5\n- Fixed Torn PDA stock parsing so expanded stats such as `Circ: 106,303` are not treated as shop stock.\n- Uses the smallest compact travel row for stock/buy detection.\n- Uses Torn PDA\'s visible `Value: $...` for the expanded item when available, so profit matches Torn\'s displayed value more closely.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.4.user.js`.\n\n',1)
(r/'UPDATE-INFO.md').write_text(info)
gf=(r/'greasyfork/Market-Intelligence.md').read_text().replace('**Current version: v1.15.4**','**Current version: v1.15.5**',1)
gf=gf.replace('## v1.15.4','## v1.15.5 — Torn PDA Travel Row Accuracy\n\n- Fixed expanded item stats being mistaken for travel stock.\n- Uses compact PDA shop rows and Torn\'s visible item `Value` when available.\n\n## v1.15.4',1)
(r/'greasyfork/Market-Intelligence.md').write_text(gf)
