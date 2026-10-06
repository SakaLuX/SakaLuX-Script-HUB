from pathlib import Path
import json,re

bh=Path('SakaLuX-Bounty-Hunter.user.js')
s=bh.read_text()

s=s.replace('@version      0.4.1','@version      0.4.2',1)
s=s.replace("let v = '0.4.1';","let v = '0.4.2';",1)
s=s.replace("const VERSION='0.4.1'","const VERSION='0.4.2'",1)

# The professional skin belongs on the actual panel section, not the full-screen overlay.
s=s.replace("#slx-bh{--bh-bg:", "#slx-bh>section{--bh-bg:", 1)

old="""function ensureBountyFooter(){
 const panel=document.getElementById('slx-bh');
 if(!panel||panel.querySelector('#slx-bh-donation-footer'))return;
 const f=document.createElement('div');
 f.id='slx-bh-donation-footer';
 f.innerHTML='<div class="slx-bh-donate-actions"><button type="button" data-bh-donate="money">💸 SEND MONEY</button><button type="button" data-bh-donate="items">🎁 SEND ITEMS</button></div><div class="slx-bh-made">Made with ❤️ by <a href="'+SAKALUX_PROFILE_URL+'">SakaLuX [2380374]</a></div>';
 f.addEventListener('click',e=>{const b=e.target.closest('[data-bh-donate]');if(b){e.preventDefault();location.href=SAKALUX_PROFILE_URL;return}const a=e.target.closest('a');if(a){e.preventDefault();location.href=SAKALUX_PROFILE_URL}});
 panel.appendChild(f);
}"""
new="""function ensureBountyFooter(){
 const overlay=document.getElementById('slx-bh');
 const panel=overlay?.querySelector(':scope > section');
 if(!panel)return;
 const existing=overlay.querySelector('#slx-bh-donation-footer');
 if(existing){
   if(existing.parentElement!==panel)panel.appendChild(existing);
   return;
 }
 const f=document.createElement('div');
 f.id='slx-bh-donation-footer';
 f.innerHTML='<div class="slx-bh-donate-actions"><button type="button" data-bh-donate="money">💸 SEND MONEY</button><button type="button" data-bh-donate="items">🎁 SEND ITEMS</button></div><div class="slx-bh-made">Made with ❤️ by <a href="'+SAKALUX_PROFILE_URL+'">SakaLuX [2380374]</a></div>';
 f.addEventListener('click',e=>{const b=e.target.closest('[data-bh-donate]');if(b){e.preventDefault();location.href=SAKALUX_PROFILE_URL;return}const a=e.target.closest('a');if(a){e.preventDefault();location.href=SAKALUX_PROFILE_URL}});
 panel.appendChild(f);
}"""
if old not in s:
    raise SystemExit('footer function anchor not found')
s=s.replace(old,new,1)

# Make footer compact and ensure it never competes with content width.
s=s.replace("#slx-bh-donation-footer{flex:0 0 auto!important;", "#slx-bh-donation-footer{width:100%!important;box-sizing:border-box!important;flex:0 0 auto!important;",1)

bh.write_text(s)

sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.2'
            if isinstance(it.get('release'),dict):
                it['release']['version']='0.4.2'
                it['release']['date']='2026-10-06'
                it['release']['notes']=[
                    'Fixes the v0.4.1 mobile layout regression caused by the donation footer being inserted beside the panel instead of inside it.',
                    'Moves the professional Shared Core skin from the full-screen overlay to the actual Bounty Hunter panel section.',
                    'Keeps SEND MONEY, SEND ITEMS and the Made with love footer full-width at the bottom without shrinking the target list.'
                ]
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note="""\n## Bounty Hunter v0.4.2
- Fixed the v0.4.1 TornPDA layout regression where the donation footer became a sibling of the panel and squeezed the Bounty Hunter UI into a narrow left column.
- Donation footer now lives inside the panel section and spans its full width.
- Hub/Shared Core professional skin now applies to the actual panel section instead of styling the full-screen overlay.
- Preserves SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].
"""
    if 'Bounty Hunter v0.4.2' not in c:
        cp.write_text(c.rstrip()+note+'\n')
