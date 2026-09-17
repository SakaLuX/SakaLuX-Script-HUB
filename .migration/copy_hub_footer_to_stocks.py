from pathlib import Path
import re, json

stock = Path('SakaLuX-Stock-Manager-Advisor.user.js')
text = stock.read_text(encoding='utf-8')
text = text.replace('// @version      0.7.9','// @version      0.7.10',1)
text = text.replace("version: '0.7.9'","version: '0.7.10'",1)

# Remove prior single-line footer if present.
text = re.sub(r"\n\s*<div[^>]+class=['\"]slx-stock-footer['\"][\s\S]*?</div>\s*", "\n", text, count=1)

# Add Hub-parity donation/footer CSS near existing stock style block.
css_anchor = "#slx-stock-inline"
if css_anchor not in text:
    raise SystemExit('stock CSS anchor missing')
extra_css = r'''
#slx-stock-donation-wrap{flex:0 0 auto;background:#0b1118;border-top:1px solid #243447;padding:8px 10px 0}
#slx-stock-donation-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#slx-stock-donation-row button{height:40px;min-height:40px;border:1px solid #34465b;border-radius:10px;background:#111a24;color:#edf3fa;font-weight:700;font-size:12px;letter-spacing:.02em}
#slx-stock-author-footer{height:34px;display:flex;align-items:center;justify-content:center;border-top:1px solid #243447;background:#0b1118;color:#93a4b7;font-size:12px;flex:0 0 auto}
#slx-stock-author-footer a{color:#4f8fe8;text-decoration:none;font-weight:700}
@media(max-width:700px){#slx-stock-donation-wrap{padding:8px 10px 0}#slx-stock-donation-row{gap:8px}#slx-stock-donation-row button{height:38px;min-height:38px;font-size:11px}#slx-stock-author-footer{height:32px;font-size:11px}}
'''
# append to first style template before closing backtick marker if identifiable
style_pos = text.find('</style>')
if style_pos != -1:
    text = text[:style_pos] + extra_css + text[style_pos:]
else:
    # fallback: inject a dedicated style element before main UI mount
    marker = "document.body.appendChild"
    idx = text.find(marker)
    if idx == -1:
        raise SystemExit('cannot find UI mount marker')
    style_js = "\nconst slxStockFooterStyle=document.createElement('style'); slxStockFooterStyle.textContent=`"+extra_css.replace('`','\\`')+"`; document.head.appendChild(slxStockFooterStyle);\n"
    text = text[:idx] + style_js + text[idx:]

# Find panel/card container creation and append donation/footer before final close. We use a resilient insertion near known Made with footer or panel innerHTML end.
donation_html = r'''
<div id="slx-stock-donation-wrap">
  <div id="slx-stock-donation-row">
    <button type="button" id="slx-stock-send-money">💸 SEND MONEY</button>
    <button type="button" id="slx-stock-send-items">🎁 SEND ITEMS</button>
  </div>
</div>
<div id="slx-stock-author-footer">Made with ❤️ by&nbsp;<a href="https://www.torn.com/profiles.php?XID=2380374" target="_blank" rel="noopener noreferrer">SakaLuX [2380374]</a></div>
'''
# Prefer replacing existing author attribution text if present.
patterns = [
    r"<div[^>]*>\s*Made with ❤️ by[\s\S]*?</div>",
    r"<div[^>]*>\s*Made with ❤ by[\s\S]*?</div>"
]
replaced=False
for pat in patterns:
    new_text,n=re.subn(pat,donation_html,text,count=1,flags=re.I)
    if n:
        text=new_text; replaced=True; break
if not replaced:
    # insert before main panel template closing marker around stock inline UI
    anchor = '</div>`;'
    idx = text.find(anchor)
    if idx == -1:
        raise SystemExit('stock panel template closing anchor missing')
    text = text[:idx] + donation_html + text[idx:]

# Wire donation buttons to Torn pages.
handler_anchor = "document.getElementById('slx-stock"
insert_js = r'''
  document.getElementById('slx-stock-send-money')?.addEventListener('click',()=>{ location.href='https://www.torn.com/sendcash.php#/XID=2380374'; });
  document.getElementById('slx-stock-send-items')?.addEventListener('click',()=>{ location.href='https://www.torn.com/item.php#giveItems'; });
'''
# Put handlers near end of render/open routine before next function declaration if possible.
func_anchor = '\n  function '
first_after = text.find(func_anchor, text.find('slx-stock-send-money'))
if first_after != -1:
    text = text[:first_after] + insert_js + text[first_after:]
else:
    text += insert_js

stock.write_text(text,encoding='utf-8')

# sync scripts.json
p=Path('scripts.json'); data=json.loads(p.read_text(encoding='utf-8'))
for row in data['scripts']:
    if row.get('id')=='stock-manager-advisor':
        row['version']='0.7.10'
        if isinstance(row.get('release'),dict):
            row['release']['version']='0.7.10'
            row['release']['date']='2026-09-17'
            row['release']['notes']=['Matches Script Hub bottom donation panel with SEND MONEY and SEND ITEMS controls.','Keeps the SakaLuX author footer as a separate stable bottom row.']
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding='utf-8')

# sync stock md
md=Path('greasyfork/Stock-Manager-Advisor.md'); m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n\s*\*\*v)0\.7\.9(\*\*)',r'\g<1>0.7.10\2',m,count=1)
m=re.sub(r'(## Current release note\s*\n+\*\*v)0\.7\.9(\*\*)',r'\g<1>0.7.10\2',m,count=1)
anchor='## Release history / Changelog\n\n'
entry='### v0.7.10 — Hub-style donation/footer panel\n- Adds the same SEND MONEY and SEND ITEMS bottom controls used by Script Hub.\n- Keeps Made with ❤️ by SakaLuX [2380374] as a separate stable footer row.\n\n'
if anchor in m and '### v0.7.10' not in m: m=m.replace(anchor,anchor+entry,1)
md.write_text(m,encoding='utf-8')
print('Stocks footer parity patch ready')
