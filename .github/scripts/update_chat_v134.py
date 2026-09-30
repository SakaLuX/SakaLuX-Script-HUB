from pathlib import Path
import re, json

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
REG=ROOT/'scripts.json'
text=CHAT.read_text(encoding='utf-8')

# Version sync
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.34',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.34',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.33'","version:'1.2.34'")

# Never attach per-message context actions to the native conversation header/title area.
pat=r"function syncContextTrigger\(r,e,p\)\{.*?(?=\nfunction decorate\(r,e,first\))"
m=re.search(pat,text,re.S); assert m,'syncContextTrigger block missing'
new=r'''function isChatHeaderCandidate(r,e){
 if(!e)return true;
 if(e.closest('.slx-head-controls,#sakalux-chat-settings-overlay,#slx-menu,.slx-search'))return true;
 const c=composer().find(x=>rootFor(x)===r),h=c?findHeader(r,c):null;
 if(h&&(e===h||e.contains(h)||h.contains(e)))return true;
 const cls=String(e.className||'');
 if(/(?:chat.?header|title.?bar|conversation.?header|chat.?title)/i.test(cls))return true;
 return false
}
function syncContextTrigger(r,e,p){
 let z=e.querySelector(':scope > .slx-msg-actions,.slx-msg-actions');
 if(!S.enabled||!S.quickActions||(!p.id&&!p.name)||isChatHeaderCandidate(r,e)){z?.remove();return}
 if(z){z._slxPlayer=p;return}
 z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z._slxPlayer=p;
 z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,z._slxPlayer||p)};
 const sender=e.querySelector('a[href*="profiles.php"],a[href*="XID="],[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b');
 if(sender&&sender!==e){sender.insertAdjacentElement('afterend',z)}else e.appendChild(z)
}
'''
text=text[:m.start()]+new+text[m.end():]

# Compact the header control group on TornPDA; no control may cover the chat title.
css_add=r'''body .slx-head-controls[data-sakalux-chat-controls="1"]{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:2px!important;max-width:132px!important;white-space:nowrap!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{width:28px!important;height:34px!important;min-width:28px!important;max-width:28px!important;flex:0 0 28px!important;font-size:17px!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button[hidden]{display:none!important}@media(max-width:420px){body .slx-head-controls[data-sakalux-chat-controls="1"]{right:46px!important;gap:0!important;max-width:116px!important}body .slx-head-controls[data-sakalux-chat-controls="1"] button{width:27px!important;min-width:27px!important;max-width:27px!important;flex-basis:27px!important}.slx-msg-actions{width:24px!important;height:24px!important;min-width:24px!important;margin-left:4px!important}}
'''
marker='#slx-color-picker{position:fixed!important;'
assert marker in text,'CSS insertion marker missing'
text=text.replace(marker,css_add+marker,1)

# Remove any context button that accidentally survived inside a native chat header during rescans.
old_scan=re.search(r"function scan\(\)\{.*?\}\nfunction start\(\)",text,re.S); assert old_scan,'scan block missing'
scan_code=old_scan.group(0)
if "document.querySelectorAll('.slx-msg-actions')" not in scan_code:
    scan_code=scan_code.replace("function scan(){", "function scan(){document.querySelectorAll('.slx-head-controls .slx-msg-actions').forEach(e=>e.remove());")
text=text[:old_scan.start()]+scan_code+text[old_scan.end():]

CHAT.write_text(text,encoding='utf-8')

# Changelog / release documentation
if DOC.exists():
    doc=DOC.read_text(encoding='utf-8')
    doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.34**', doc, count=1)
    doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.34**', doc, count=1)
    note='**v1.2.34 — Chat header overlap fix**\n- Prevents the per-message ⋮ context button from ever attaching to the native conversation header/title area.\n- Cleans stray context buttons from the header during rescans.\n- Compacts Search, Maximize, Export and Settings controls on TornPDA so they stay to the right without covering the chat title.\n- Keeps per-message context actions available beside real sender rows only.'
    doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
    hist='\n### v1.2.34 — Chat header overlap fix\n- Context ⋮ is restricted to real message rows and excluded from the native chat header.\n- Header controls use a compact TornPDA layout to prevent overlap with avatar/name/title controls.\n'
    if hist.strip() not in doc: doc=doc.replace('## Release history / Changelog\n','## Release history / Changelog\n'+hist,1)
    DOC.write_text(doc,encoding='utf-8')

# Registry synchronization
if REG.exists():
    data=json.loads(REG.read_text(encoding='utf-8'))
    for item in data.get('scripts',[]):
        if item.get('id')=='chat-intelligence' or item.get('name')=='Chat Intelligence':
            item['version']='1.2.34'
            rel=item.setdefault('release',{})
            rel['version']='1.2.34'; rel['date']='2026-09-30'
            rel['notes']=[
                'Prevents the per-message context button from attaching to the native conversation header.',
                'Compacts Chat Intelligence header controls on TornPDA to prevent overlap with chat title controls.',
                'Keeps context actions attached only to real message sender rows.'
            ]
            item['detailsRevision']=int(item.get('detailsRevision',0) or 0)+1
            break
    REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

print('patched Chat Intelligence v1.2.34')
