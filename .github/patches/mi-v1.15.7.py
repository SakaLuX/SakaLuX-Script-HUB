from pathlib import Path
import json

R = Path('.')
SRC = R / 'SakaLuX-Market-Intelligence.user.js'
REG = R / 'scripts.json'
INFO = R / 'UPDATE-INFO.md'
GF = R / 'greasyfork/Market-Intelligence.md'
BACKUP = R / 'backups/SakaLuX-Market-Intelligence-v1.15.6.user.js'

s = SRC.read_text(encoding='utf-8')
if '// @version      1.15.6' not in s or "const VERSION = '1.15.6';" not in s:
    raise SystemExit('Expected live v1.15.6 source')

# Exact pre-update backup first: write the untouched live source bytes.
BACKUP.write_text(s, encoding='utf-8')

s = s.replace('// @version      1.15.6', '// @version      1.15.7', 1)
s = s.replace("const VERSION = '1.15.6';", "const VERSION = '1.15.7';", 1)

anchor = "    function ensureBadge(row,cls){let box=row.querySelector(':scope > .'+cls);if(!box){box=document.createElement('div');box.className=cls;row.appendChild(box);}return box;}\n"
helper = anchor + """

    function ensureTravelBadge(row,cls){
        if(!row)return null;
        const host=row.closest?.('tr')||row;
        if(host?.tagName==='TR'){
            const next=host.nextElementSibling;
            if(next?.classList?.contains('sl-mi-pda-badge-row')&&next.dataset.miClass===cls){
                const existing=next.querySelector('.'+cls);if(existing)return existing;
            }
            const tr=document.createElement('tr');
            tr.className='sl-mi-pda-badge-row';
            tr.dataset.miClass=cls;
            const td=document.createElement('td');
            td.colSpan=Math.max(1,host.children?.length||5);
            td.style.cssText='padding:0 6px 6px!important;border:0!important;background:transparent!important;height:auto!important;';
            const box=document.createElement('div');
            box.className=cls+' sl-mi-pda-wide-badge';
            box.style.cssText='display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35!important;margin:0!important;padding:7px 10px!important;';
            td.appendChild(box);tr.appendChild(td);host.insertAdjacentElement('afterend',tr);return box;
        }
        const next=host?.nextElementSibling;
        if(next?.classList?.contains('sl-mi-pda-badge-block')&&next.dataset.miClass===cls){
            const existing=next.querySelector('.'+cls);if(existing)return existing;
        }
        const wrap=document.createElement('div');
        wrap.className='sl-mi-pda-badge-block';wrap.dataset.miClass=cls;
        wrap.style.cssText='display:block!important;width:100%!important;clear:both!important;box-sizing:border-box!important;margin:2px 0 6px!important;';
        const box=document.createElement('div');box.className=cls+' sl-mi-pda-wide-badge';
        box.style.cssText='display:block!important;width:100%!important;max-width:none!important;box-sizing:border-box!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.35!important;padding:7px 10px!important;';
        wrap.appendChild(box);host.insertAdjacentElement('afterend',wrap);return box;
    }
"""
if anchor not in s:
    raise SystemExit('ensureBadge anchor missing')
s = s.replace(anchor, helper, 1)

old_entry = "        for(const img of imgs){const id=itemIdFromImg(img),row=travelRowContainer(img);if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,img,buy,name:img.alt||('Item #'+id),stock:extractTravelStock(row),displayValue:extractTornDisplayedValue(img)});}" 
new_entry = "        for(const img of imgs){const id=itemIdFromImg(img),compact=travelRowContainer(img),row=compact?.closest?.('tr')||compact;if(!id||!row||seen.has(row))continue;const buy=extractFirstPrice(row);if(!(buy>0))continue;seen.add(row);entries.push({id,row,img,buy,name:img.alt||('Item #'+id),stock:extractTravelStock(row),displayValue:extractTornDisplayedValue(img)});}" 
if old_entry not in s:
    raise SystemExit('scanTravel entry anchor missing')
s = s.replace(old_entry, new_entry, 1)

old_badge = "const m=metrics(e.buy,market.price),box=ensureBadge(e.row,'sl-mi-travel');"
new_badge = "const m=metrics(e.buy,market.price),box=ensureTravelBadge(e.row,'sl-mi-travel');"
if old_badge not in s:
    raise SystemExit('travel badge anchor missing')
s = s.replace(old_badge, new_badge, 1)

# Ensure script-owned badge rows are ignored by smart observer cleanup/refresh logic where possible.
obs_anchor = "            if(t?.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-session-summary'))return;"
if obs_anchor in s:
    s = s.replace(obs_anchor, "            if(t?.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-session-summary,.sl-mi-pda-badge-row,.sl-mi-pda-badge-block'))return;", 1)

SRC.write_text(s, encoding='utf-8')

reg = json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts', []):
    if e.get('id') == 'market-intelligence':
        e['version'] = '1.15.7'
        e['description'] = 'Torn PDA-first market/travel intelligence with full-width travel badges, correct compact shop prices, stock parsing and landed Value calculations.'
REG.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

info = INFO.read_text(encoding='utf-8')
info = info.replace('SakaLuX Market Intelligence: **v1.15.6**', 'SakaLuX Market Intelligence: **v1.15.7**', 1)
release = """### SakaLuX Market Intelligence v1.15.7
- Fixed Torn PDA travel-shop layout: Market Intelligence badges no longer render inside the original item table row/first column.
- Each travel result now renders as a dedicated full-width row directly below its Torn item, preserving the original Item / Name / Stock / Cost / Buy columns.
- Long Market / Net / Profit / Stock text can wrap normally instead of being clipped into a narrow cell.
- Keeps the Torn PDA-first landed price/stock fixes from v1.15.6.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.15.6.user.js`.

"""
info = info.replace('## Latest changes\n\n', '## Latest changes\n\n' + release, 1)
INFO.write_text(info, encoding='utf-8')

gf = GF.read_text(encoding='utf-8')
gf = gf.replace('**Current version: v1.15.6**', '**Current version: v1.15.7**', 1)
gf = gf.replace('## v1.15.6', """## v1.15.7 — Torn PDA Travel Badge Layout

- Travel-shop Market Intelligence badges now appear on their own full-width row below each item.
- The native Torn PDA Item / Name / Stock / Cost / Buy columns are no longer squeezed or shifted by the script.
- Market, Net, Profit, ROI and Stock text can wrap cleanly on mobile.

## v1.15.6""", 1)
GF.write_text(gf, encoding='utf-8')
