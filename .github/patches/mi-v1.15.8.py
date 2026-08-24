from pathlib import Path
import json
R=Path('.')
P=R/'SakaLuX-Market-Intelligence.user.js'
s=P.read_text(encoding='utf-8')
s=s.replace('// @version      1.15.7','// @version      1.15.8',1).replace("const VERSION = '1.15.7';","const VERSION = '1.15.8';",1)
anchor="""    function ensureBadge(row,cls){let box=row.querySelector(':scope > .'+cls);if(!box){box=document.createElement('div');box.className=cls;row.appendChild(box);}return box;}\n"""
helper="""
    function extractAdjacentTornDisplayedValue(row){
        if(!row)return null;
        let node=row.nextElementSibling,steps=0;
        while(node&&steps<4){
            if(node.matches?.('tr')&&node.querySelector?.('img[src*="/images/items/"]'))break;
            const text=normText(node.innerText||node.textContent||'');
            const m=text.match(/\bValue\s*:\s*\$\s*([0-9][0-9,]*(?:\.\d+)?(?:\s*[KMB])?)/i);
            if(m){const v=parseMoney(m[1]);if(Number.isFinite(v)&&v>0)return v;}
            node=node.nextElementSibling;steps++;
        }
        return null;
    }
"""
if helper.strip() not in s:
    if anchor not in s: raise SystemExit('ensureBadge anchor missing')
    s=s.replace(anchor,anchor+helper,1)
old="displayValue:extractTornDisplayedValue(img)"
if old not in s: raise SystemExit('display value anchor missing')
s=s.replace(old,"displayValue:extractAdjacentTornDisplayedValue(row)",1)
P.write_text(s,encoding='utf-8')
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.15.8';e['description']='Torn PDA-first market/travel intelligence with item-specific Torn Value matching, full-width travel badges and correct compact shop stock/prices.'
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
info=(R/'UPDATE-INFO.md').read_text(encoding='utf-8').replace('SakaLuX Market Intelligence: **v1.15.7**','SakaLuX Market Intelligence: **v1.15.8**',1)
info=info.replace('## Latest changes\n\n','## Latest changes\n\n### SakaLuX Market Intelligence v1.15.8\n- Fixed Torn PDA expanded `Value:` association so one opened item can no longer overwrite the market value shown for every other travel item.\n- Torn displayed Value is now used only when it belongs to that item row before the next shop item.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.7.user.js`.\n\n',1)
(R/'UPDATE-INFO.md').write_text(info,encoding='utf-8')
gf=(R/'greasyfork/Market-Intelligence.md').read_text(encoding='utf-8').replace('**Current version: v1.15.7**','**Current version: v1.15.8**',1)
gf=gf.replace('## v1.15.7','## v1.15.8 — Item-specific Torn Value Fix\n\n- Fixes the Torn PDA bug where opening one item detail card could make its `Value:` appear as the market value for every item in the travel shop.\n- The displayed Torn Value is now associated only with the matching item row.\n\n## v1.15.7',1)
(R/'greasyfork/Market-Intelligence.md').write_text(gf,encoding='utf-8')
