from pathlib import Path
import re, json

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
REG=ROOT/'scripts.json'
text=CHAT.read_text(encoding='utf-8')

# Version sync
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.36',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.36',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.35'","version:'1.2.36'")

# Mount SakaLuX controls immediately BEFORE Torn's native minimize/close group instead of
# absolutely offsetting them from the right edge. This lets the native flex layout reserve
# real width and prevents collisions with both the title/avatar and Torn controls.
old="if(!x||x.parentElement!==h){x?.remove();x=document.createElement('div');x.className='slx-head-controls';x.dataset.sakaluxChatControls='1';x._root=r;x.dataset.root=r.dataset.slxRootId;x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button><button data-o title=\"Chat Intelligence settings\">⚙</button>';h.appendChild(x);bindButton(x.querySelector('[data-s]'),()=>searchBox(r));bindButton(x.querySelector('[data-m]'),b=>toggleMax(r,c,b));bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''));bindButton(x.querySelector('[data-o]'),()=>settings());syncHeaderControlVisibility()}"
new="if(!x||x.parentElement!==h){x?.remove();x=document.createElement('div');x.className='slx-head-controls';x.dataset.sakaluxChatControls='1';x._root=r;x.dataset.root=r.dataset.slxRootId;x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button><button data-o title=\"Chat Intelligence settings\">⚙</button>';const native=[...h.querySelectorAll('button,[role=\"button\"],a,span,div')].find(el=>/^(?:—|−|-|_)$/.test(N(el.textContent))&&!el.closest('.slx-head-controls'));const anchor=native?.closest('button,[role=\"button\"],a')||native;if(anchor&&anchor.parentElement===h)h.insertBefore(x,anchor);else h.appendChild(x);bindButton(x.querySelector('[data-s]'),()=>searchBox(r));bindButton(x.querySelector('[data-m]'),b=>toggleMax(r,c,b));bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''));bindButton(x.querySelector('[data-o]'),()=>settings());syncHeaderControlVisibility()}"
assert old in text, 'controls mount block not found'
text=text.replace(old,new,1)

# Remove the v1.2.35 absolute-position overrides and make the strip participate in the
# header's own layout. Keep it compact on phones.
patterns=[
 r'body \.slx-head-controls\[data-sakalux-chat-controls="1"\]\{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:2px!important;right:126px!important;max-width:132px!important;white-space:nowrap!important\}body \.slx-head-controls\[data-sakalux-chat-controls="1"\] button\{width:28px!important;height:34px!important;min-width:28px!important;max-width:28px!important;flex:0 0 28px!important;font-size:17px!important\}body \.slx-head-controls\[data-sakalux-chat-controls="1"\] button\[hidden\]\{display:none!important\}@media\(max-width:420px\)\{body \.slx-head-controls\[data-sakalux-chat-controls="1"\]\{right:126px!important;gap:0!important;max-width:116px!important\}body \.slx-head-controls\[data-sakalux-chat-controls="1"\] button\{width:27px!important;min-width:27px!important;max-width:27px!important;flex-basis:27px!important\}\.slx-msg-actions\{width:24px!important;height:24px!important;min-width:24px!important;margin-left:4px!important\}\}',
 r'body \.slx-head-controls\[data-sakalux-chat-controls="1"\]\{pointer-events:auto!important\}body \.slx-head-controls\[data-sakalux-chat-controls="1"\] button\{position:relative!important;z-index:2!important\}'
]
for p in patterns:
    text,n=re.subn(p,'',text,count=1); assert n==1, 'v1.2.35 override not found'

css_new='''body .slx-head-controls[data-sakalux-chat-controls="1"]{position:relative!important;right:auto!important;left:auto!important;top:auto!important;bottom:auto!important;transform:none!important;display:flex!important;align-items:stretch!important;justify-content:flex-end!important;gap:0!important;flex:0 0 auto!important;width:auto!important;max-width:none!important;height:100%!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;overflow:visible!important;white-space:nowrap!important;z-index:20!important;pointer-events:auto!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{position:relative!important;z-index:2!important;width:30px!important;min-width:30px!important;max-width:30px!important;flex:0 0 30px!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;font-size:16px!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button[hidden]{display:none!important}@media(max-width:520px){body .slx-head-controls[data-sakalux-chat-controls="1"] button{width:27px!important;min-width:27px!important;max-width:27px!important;flex-basis:27px!important;font-size:15px!important}.slx-msg-actions{width:24px!important;height:24px!important;min-width:24px!important;margin-left:4px!important}}\n'''
marker='#slx-color-picker{position:fixed!important;'
assert marker in text, 'CSS marker missing'
text=text.replace(marker,css_new+marker,1)

CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
    doc=DOC.read_text(encoding='utf-8')
    doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.36**', doc, count=1)
    doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.36**', doc, count=1)
    note='**v1.2.36 — Native-flow chat header controls**\n- Removes the fixed right-offset workaround from v1.2.35.\n- Inserts the SakaLuX control strip before Torn\'s native Minimize/Close controls when detectable.\n- Lets the chat header reserve real flex width so controls no longer overlap the avatar/name or native buttons.\n- Keeps compact mobile button widths for TornPDA.'
    doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
    hist='\n### v1.2.36 — Native-flow chat header controls\n- Replaced absolute right offsets with native header flow placement before Minimize/Close.\n- Fixes the v1.2.35 regression where controls shifted over the chat title/name.\n'
    if hist.strip() not in doc: doc=doc.replace('## Release history / Changelog\n','## Release history / Changelog\n'+hist,1)
    DOC.write_text(doc,encoding='utf-8')

if REG.exists():
    data=json.loads(REG.read_text(encoding='utf-8'))
    for item in data.get('scripts',[]):
        if item.get('id')=='chat-intelligence' or item.get('name')=='Chat Intelligence':
            item['version']='1.2.36'
            rel=item.setdefault('release',{})
            rel['version']='1.2.36'; rel['date']='2026-09-30'
            rel['notes']=[
                'Places SakaLuX chat controls in the native header flow before Torn minimize/close.',
                'Removes the v1.2.35 fixed right offset that could overlap the chat title.',
                'Keeps compact TornPDA mobile controls without collisions.'
            ]
            item['detailsRevision']=int(item.get('detailsRevision',0) or 0)+1
            break
    REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

print('patched Chat Intelligence v1.2.36')
