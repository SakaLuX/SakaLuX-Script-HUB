from pathlib import Path
import re, json

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
REG=ROOT/'scripts.json'
text=CHAT.read_text(encoding='utf-8')

# Version sync
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.35',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.35',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.34'","version:'1.2.35'")

# Reserve the entire native Torn minimize/close zone. v1.2.34 left only ~46px on PDA,
# which let SakaLuX Settings sit directly on top of Torn's native minimize control.
old='body .slx-head-controls[data-sakalux-chat-controls="1"]{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:2px!important;max-width:132px!important;white-space:nowrap!important}'
new='body .slx-head-controls[data-sakalux-chat-controls="1"]{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:2px!important;right:126px!important;max-width:132px!important;white-space:nowrap!important}'
assert old in text, 'v1.2.34 compact control CSS not found'
text=text.replace(old,new,1)
text,n=re.subn(r'(@media\(max-width:420px\)\{body \.slx-head-controls\[data-sakalux-chat-controls="1"\]\{)right:46px!important;',r'\g<1>right:126px!important;',text,count=1)
assert n==1, 'mobile right offset not found'

# Keep all SakaLuX controls together as one strip and prevent native controls from covering them.
# This is intentionally a large reserved area because TornPDA/Android skins vary in native button width.
extra='body .slx-head-controls[data-sakalux-chat-controls="1"]{pointer-events:auto!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{position:relative!important;z-index:2!important}\n'
marker='#slx-color-picker{position:fixed!important;'
assert marker in text, 'CSS marker missing'
text=text.replace(marker,extra+marker,1)

CHAT.write_text(text,encoding='utf-8')

# Changelog / release documentation
if DOC.exists():
    doc=DOC.read_text(encoding='utf-8')
    doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.35**', doc, count=1)
    doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.35**', doc, count=1)
    note='**v1.2.35 — Native minimize/settings collision fix**\n- Reserves a dedicated right-side zone for Torn\'s native Minimize and Close buttons.\n- Moves the SakaLuX Search, Maximize, Export and Settings strip left as a single group on TornPDA.\n- Prevents Settings from sitting on top of the native Minimize control.\n- Keeps the compact mobile layout introduced in v1.2.34.'
    doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
    hist='\n### v1.2.35 — Native minimize/settings collision fix\n- Reserves 126px at the right of the chat header for Torn native controls.\n- Moves the complete SakaLuX header control strip left so Settings no longer overlaps Minimize.\n'
    if hist.strip() not in doc: doc=doc.replace('## Release history / Changelog\n','## Release history / Changelog\n'+hist,1)
    DOC.write_text(doc,encoding='utf-8')

# Registry synchronization
if REG.exists():
    data=json.loads(REG.read_text(encoding='utf-8'))
    for item in data.get('scripts',[]):
        if item.get('id')=='chat-intelligence' or item.get('name')=='Chat Intelligence':
            item['version']='1.2.35'
            rel=item.setdefault('release',{})
            rel['version']='1.2.35'; rel['date']='2026-09-30'
            rel['notes']=[
                'Reserves the native Torn minimize/close area in chat headers.',
                'Moves SakaLuX chat header controls left as one compact group on TornPDA.',
                'Prevents Settings from overlapping Torn native Minimize.'
            ]
            item['detailsRevision']=int(item.get('detailsRevision',0) or 0)+1
            break
    REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

print('patched Chat Intelligence v1.2.35')
