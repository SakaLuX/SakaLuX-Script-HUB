from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.29',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.29',ID='chat-intelligence'",text,count=1); assert n==1

# Robust message-row discovery for TornPDA / Chat V3. It intentionally does not depend
# on Torn class names: sender nodes are used first, then textual `name:` rows.
pat=r"function msgs\(r\)\{.*?\n?\}"
m=re.search(pat,text,re.S); assert m,'msgs() missing'
new=r'''function msgs(r){
 const out=[],seen=new Set();
 const add=e=>{if(!e||seen.has(e)||!e.isConnected||e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,.slx-toast-host,#sakalux-chat-settings-overlay'))return;const q=e.getBoundingClientRect(),t=N(e.innerText||e.textContent);if(!t||q.width<90||q.height<18||q.height>190)return;if(e.querySelector('textarea,[contenteditable="true"],input[type="search"]'))return;seen.add(e);out.push(e)};
 const named='[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="message-item"],[class*="messageRow"],[class*="message-row"]';
 r.querySelectorAll(named).forEach(add);
 const senders=r.querySelectorAll('a[href*="profiles.php"],a[href*="XID="],[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b');
 for(const s of senders){let best=null;for(let e=s.parentElement,i=0;e&&e!==r&&i<5;i++,e=e.parentElement){const q=e.getBoundingClientRect(),t=N(e.innerText||e.textContent);if(q.width<90||q.height<18||q.height>190||!t)continue;if(e.querySelector('textarea,[contenteditable="true"]'))continue;best=e;if(q.height>=28&&q.width>=Math.min(220,r.getBoundingClientRect().width*.45))break}if(best)add(best)}
 if(!out.length||out.length<3){for(const e of r.querySelectorAll('div,li,p,article,section')){const t=N(e.innerText||e.textContent);if(!t||t.length>700)continue;if(!/^[A-Za-z0-9_\-]{2,32}\s*:/.test(t))continue;const child=[...e.children].some(ch=>/^[A-Za-z0-9_\-]{2,32}\s*:/.test(N(ch.innerText||ch.textContent)));if(!child)add(e)}}
 return out.filter((e,i,a)=>!a.some((o,j)=>j!==i&&e.contains(o)))
}'''
text=text[:m.start()]+new+text[m.end():]

# Improve sender extraction: use the shortest plausible text label, then prefix fallback.
pat=r"function who\(e\)\{.*?return\{id,name\}\}"
m=re.search(pat,text,re.S); assert m,'who() missing'
new=r'''function who(e){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const mm=(a.href||'').match(/[?&]XID=(\d+)/i);if(mm)id=mm[1];const z=N(a.textContent).replace(/:$/,'');if(z&&z.length<=40)name=z}if(!name){for(const s of e.querySelectorAll('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b')){const z=N(s.textContent).replace(/:$/,'');if(z&&z.length>=2&&z.length<=40&&!/^(today|yesterday|mon|tue|wed|thu|fri|sat|sun)$/i.test(z)){name=z;break}}}if(!name){const t=N(e.innerText||e.textContent),mm=t.match(/^([A-Za-z0-9_\-]{2,32})\s*:/);if(mm)name=mm[1]}return{id,name}}'''
text=text[:m.start()]+new+text[m.end():]

# Make context trigger inline beside the sender rather than absolutely positioned inside
# a frequently clipped TornPDA message container.
pat=r"function syncContextTrigger\(r,e,p\)\{.*?\n?\}"
m=re.search(pat,text,re.S); assert m,'syncContextTrigger missing'
new=r'''function syncContextTrigger(r,e,p){let z=e.querySelector('.slx-msg-actions');if(!S.quickActions||(!p.id&&!p.name)){z?.remove();return}if(z){z._slxPlayer=p;return}z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z._slxPlayer=p;z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,z._slxPlayer||p)};const sender=e.querySelector('a[href*="profiles.php"],a[href*="XID="],[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b');if(sender?.parentElement)sender.insertAdjacentElement('afterend',z);else e.insertBefore(z,e.firstChild)}'''
text=text[:m.start()]+new+text[m.end():]

# Search/export/reset now operate on the same robust rows used by context actions.
text=text.replace("function exportMessages(r,q=''){const s=N(q).toLowerCase(),rows=msgs(r).filter", "function exportMessages(r,q=''){const s=N(q).toLowerCase(),rows=msgs(r).filter",1)
text=text.replace("function closeSearch(reset=true){document.querySelectorAll('.slx-search').forEach(p=>{if(reset&&p._root)msgs(p._root).forEach(e=>e.style.removeProperty('display'));p.remove()})}","function closeSearch(reset=true){document.querySelectorAll('.slx-search').forEach(p=>{if(reset&&p._root)msgs(p._root).forEach(e=>e.style.removeProperty('display'));p.remove()})}",1)

# Replace searchBox with a version that rescans rows on every keystroke and reports diagnostics.
pat=r"function searchBox\(r\)\{.*?\n\}"
m=re.search(pat,text,re.S); assert m,'searchBox missing'
new=r'''function searchBox(r){
 if(!S.search)return;closeSearch(false);
 const p=document.createElement('div');p.className='slx-search';p._root=r;
 p.innerHTML='<div class="slx-search-title"><span>Search chat</span><button data-c>×</button></div><div class="slx-search-row"><input type="search" placeholder="Name or message…"><span data-count>0</span><button data-e title="Export results">⇩</button></div>';
 document.body.appendChild(p);
 const place=()=>{const rr=r.getBoundingClientRect(),w=Math.min(Math.max(280,rr.width-16),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,rr.left+8))+'px';p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,rr.top+44))+'px'};p._place=place;
 const i=p.querySelector('input'),n=p.querySelector('[data-count]'),ex=p.querySelector('[data-e]');ex.hidden=!S.exportSearch;
 const run=()=>{const q=N(i.value).toLowerCase(),m=msgs(r);let z=0;m.forEach(e=>{const pl=who(e),txt=N(e.innerText||e.textContent).toLowerCase(),hit=!q||txt.includes(q)||dn(pl).toLowerCase().includes(q);e.style.setProperty('display',hit?'':'none','important');if(hit)z++});n.textContent=z+'/'+m.length;n.title=m.length?'Detected message rows':'No message rows detected'};
 i.addEventListener('input',run);i.addEventListener('search',run);p.querySelector('[data-c]').onclick=()=>{i.value='';run();closeSearch(true)};ex.onclick=()=>{if(S.exportSearch)exportMessages(r,i.value)};place();run();setTimeout(()=>i.focus(),0)
}'''
text=text[:m.start()]+new+text[m.end():]

# contextRows should simply mirror msgs(); keeping one detector prevents search/actions divergence.
pat=r"function contextRows\(r\)\{.*?\n?\}"
m=re.search(pat,text,re.S); assert m,'contextRows missing'
new="function contextRows(r){return msgs(r).map(e=>({e,p:who(e)})).filter(x=>x.p.name||x.p.id)}"
text=text[:m.start()]+new+text[m.end():]

# Replace absolute context CSS with visible inline pill.
text=re.sub(r"\.slx-msg-actions\{.*?\}(?=\.slx-chat-max-active)", ".slx-msg-actions{position:relative!important;display:inline-flex!important;vertical-align:middle!important;align-items:center!important;justify-content:center!important;width:24px!important;height:24px!important;min-width:24px!important;margin:0 0 0 5px!important;padding:0!important;border:1px solid rgba(255,255,255,.20)!important;border-radius:6px!important;background:#313a43!important;color:#fff!important;font-size:17px!important;line-height:1!important;z-index:2147483000!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;box-shadow:0 1px 3px #0008!important}", text, count=1, flags=re.S)

# Standalone registration version should match canonical script version.
text=text.replace("version:'1.2.22'","version:'1.2.29'")
CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
 doc=DOC.read_text(encoding='utf-8')
 doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.29**', doc, count=1)
 doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.29**', doc, count=1)
 note='**v1.2.29 — TornPDA message-row/search repair**\n- Replaced class-name-only message detection with sender/text-based row discovery.\n- Search now rescans actual detected rows on every input and shows matched/total counts.\n- Context ⋮ is inserted inline next to the detected sender so TornPDA overflow clipping cannot hide it.\n- Search, export and context actions now share the same row detector.'
 doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
 DOC.write_text(doc,encoding='utf-8')
print('patched v1.2.29')
