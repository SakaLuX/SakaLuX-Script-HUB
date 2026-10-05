from pathlib import Path
import json,re
p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

s=s.replace('@version      0.4.0','@version      0.4.1',1)
s=s.replace("let v = '0.4.0';","let v = '0.4.1';",1)
s=s.replace("const VERSION='0.4.0'","const VERSION='0.4.1'",1)

footer_js=r'''
const SAKALUX_PROFILE_URL='https://www.torn.com/profiles.php?XID=2380374';
function ensureBountyFooter(){
 const panel=document.getElementById('slx-bh');
 if(!panel||panel.querySelector('#slx-bh-donation-footer'))return;
 const f=document.createElement('div');
 f.id='slx-bh-donation-footer';
 f.innerHTML='<div class="slx-bh-donate-actions"><button type="button" data-bh-donate="money">💸 SEND MONEY</button><button type="button" data-bh-donate="items">🎁 SEND ITEMS</button></div><div class="slx-bh-made">Made with ❤️ by <a href="'+SAKALUX_PROFILE_URL+'">SakaLuX [2380374]</a></div>';
 f.addEventListener('click',e=>{const b=e.target.closest('[data-bh-donate]');if(b){e.preventDefault();location.href=SAKALUX_PROFILE_URL;return}const a=e.target.closest('a');if(a){e.preventDefault();location.href=SAKALUX_PROFILE_URL}});
 panel.appendChild(f);
}
'''
if 'function ensureBountyFooter()' not in s:
    marker='function toast(msg)'
    if marker not in s: raise SystemExit('toast anchor missing')
    s=s.replace(marker,footer_js+'\n'+marker,1)

# Extend the professional skin with the same compact donation/author footer pattern used across SakaLuX modules.
css=r'''
#slx-bh-donation-footer{flex:0 0 auto!important;border-top:1px solid rgba(255,255,255,.08)!important;background:linear-gradient(180deg,rgba(13,22,31,.98),rgba(9,15,22,.99))!important;padding:6px 10px 7px!important;box-shadow:0 -8px 22px rgba(0,0,0,.14)!important;z-index:8!important}
#slx-bh-donation-footer .slx-bh-donate-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-bottom:4px!important}
#slx-bh-donation-footer .slx-bh-donate-actions button{height:28px!important;min-height:28px!important;padding:0 10px!important;border-radius:9px!important;font-size:11px!important;font-weight:800!important;letter-spacing:.2px!important;background:linear-gradient(180deg,rgba(36,53,71,.98),rgba(22,35,48,.98))!important;border:1px solid rgba(87,115,145,.62)!important;color:var(--bh-text,#edf3fa)!important}
#slx-bh-donation-footer .slx-bh-made{text-align:center!important;font-size:11px!important;line-height:14px!important;color:#f2a54a!important;font-weight:700!important}
#slx-bh-donation-footer .slx-bh-made a{color:#f2a54a!important;text-decoration:none!important;font-weight:800!important}
@media(max-width:520px){#slx-bh-donation-footer{padding:5px 8px 6px!important}#slx-bh-donation-footer .slx-bh-donate-actions{gap:6px!important;margin-bottom:3px!important}#slx-bh-donation-footer .slx-bh-donate-actions button{height:24px!important;min-height:24px!important;font-size:10px!important}#slx-bh-donation-footer .slx-bh-made{font-size:10px!important;line-height:13px!important}}
'''
needle='`;document.head?.appendChild(st)}'
if css.strip() not in s:
    idx=s.find(needle)
    # target the Bounty pro skin block (first one after ensureBountyProSkin)
    start=s.find('function ensureBountyProSkin()')
    idx=s.find(needle,start)
    if idx<0: raise SystemExit('pro skin closing anchor missing')
    s=s[:idx]+css+s[idx:]

# Make sure footer mounts after the panel is created/opened and survives re-open.
s=s.replace('function open(){ensureBountyProSkin();','function open(){ensureBountyProSkin();setTimeout(ensureBountyFooter,0);',1)

p.write_text(s)

sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.1'
            rel=it.get('release') if isinstance(it.get('release'),dict) else {}
            rel['version']='0.4.1'
            rel['date']='2026-10-05'
            rel['notes']=['Adds the compact SakaLuX donation/footer block with SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].','Keeps the footer inside the Bounty Hunter panel and matches the Shared Core / Script Hub visual language on TornPDA.']
            it['release']=rel
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note='''\n## Bounty Hunter v0.4.1\n- Adds the compact SakaLuX footer used by the other modules: SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].\n- Donation buttons and author link open the SakaLuX Torn profile, matching Script Hub behavior.\n- Footer styling follows Shared Core / Hub tokens and remains compact on TornPDA.\n'''
    if 'Bounty Hunter v0.4.1' not in c: cp.write_text(c.rstrip()+"\n"+note)
