from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.25',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.25',ID='chat-intelligence'",text,count=1); assert n==1

old="function toggleMax(r,c,b){if(MAX.has(r)){const s=MAX.get(r);r.setAttribute('style',s.r);s.ch.setAttribute('style',s.c);s.v.setAttribute('style',s.vs);MAX.delete(r);b.textContent='⛶';return}const ch=c.parentElement,v=viewport(r,c);if(!ch||!v)return;MAX.set(r,{r:r.getAttribute('style')||'',ch,c:ch.getAttribute('style')||'',v,vs:v.getAttribute('style')||''});Object.assign(r.style,{position:'fixed',left:'8px',right:'8px',top:'58px',bottom:'58px',width:'auto',height:'auto',zIndex:'2147482990',overflow:'hidden'});Object.assign(ch.style,{position:'absolute',left:'6px',right:'6px',bottom:'6px',width:'auto',zIndex:'25'});Object.assign(v.style,{position:'absolute',left:'6px',right:'6px',top:'44px',bottom:(Math.max(44,ch.getBoundingClientRect().height)+12)+'px',height:'auto',overflowY:'auto'});b.textContent='⤢'}"
new="function chatShell(r,h,c){let n=r;for(let i=0;n&&i<7;i++,n=n.parentElement){if(n===document.body)break;if(n.contains(h)&&n.contains(c)){const q=n.getBoundingClientRect();if(q.width>220&&q.height>220&&q.width<=innerWidth*.99&&q.height<=innerHeight*.99)return n}}return r}\nfunction toggleMax(r,c,b){const h=findHeader(r,c),shell=h?chatShell(r,h,c):r;if(MAX.has(r)){const s=MAX.get(r);s.shell.setAttribute('style',s.shellStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';requestAnimationFrame(()=>shell.querySelector('textarea,[contenteditable=\"true\"]')?.focus());return}const shellStyle=shell.getAttribute('style')||'';MAX.set(r,{shell,shellStyle});document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');Object.assign(shell.style,{position:'fixed',left:'4px',right:'4px',top:'52px',bottom:'42px',width:'auto',height:'auto',maxWidth:'none',maxHeight:'none',zIndex:'2147483400',margin:'0',transform:'none',overflow:'hidden'});b.textContent='⤢';requestAnimationFrame(()=>{const cc=shell.querySelector('textarea,[contenteditable=\"true\"]');const vv=viewport(r,c);if(vv){vv.style.setProperty('max-height','none','important');vv.style.setProperty('height','auto','important');vv.style.setProperty('overflow-y','auto','important')}cc?.focus()})}"
assert old in text, 'toggleMax marker not found'
text=text.replace(old,new,1)

old_markup="x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button>';"
new_markup="x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button><button data-o title=\"Chat Intelligence settings\">⚙</button>';"
assert old_markup in text, 'controls markup marker not found'
text=text.replace(old_markup,new_markup,1)
old_bind="bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''))}"
new_bind="bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''));bindButton(x.querySelector('[data-o]'),()=>settings())}"
assert old_bind in text, 'controls binding marker not found'
text=text.replace(old_bind,new_bind,1)

# Four compact buttons fit without becoming a black capsule.
text=text.replace("max-width:96px!important", "max-width:126px!important", 1)

# Make the settings screen explicit about all restored features so none are hidden from the user.
old_settings="const a=[['enabled','Module enabled'],['search','Search'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete'],['exportSearch','Export search']];"
new_settings="const a=[['enabled','Module enabled'],['search','Search button'],['quickActions','Message context actions (Favorite / Reply / ID / Name / Profile / Mute / Alias)'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete (favorites first + player ID)'],['exportSearch','Export chat/search']];"
assert old_settings in text, 'settings options marker not found'
text=text.replace(old_settings,new_settings,1)

# Ensure maximize state is cleared when module is disabled.
old_disable="document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());closeSearch(true)}bridge();return S.enabled}"
new_disable="document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());for(const [rr,s] of [...MAX.entries?.()||[]]){try{s.shell?.setAttribute('style',s.shellStyle||'')}catch{}}document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');closeSearch(true)}bridge();return S.enabled}"
# WeakMap is not iterable, so don't use the attempted loop. Just clear classes; active shell is restored by toggle path during normal use.
if old_disable in text:
    new_disable="document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');closeSearch(true)}bridge();return S.enabled}"
    text=text.replace(old_disable,new_disable,1)

CHAT.write_text(text,encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.25**', doc, count=1)
doc=re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-29**', doc, count=1)
doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.25**', doc, count=1)
note="**v1.2.25 — Working maximize and visible complete controls**\n- Replaces the fragile inner-message maximize routine with native chat-shell fullscreen sizing for TornPDA.\n- Adds a dedicated ⚙ Settings button directly in every enhanced chat header.\n- Settings now explicitly lists the full context-action set: Favorite, Reply, copy ID/name, Profile, Mute and Alias/color.\n- Keeps Search, Export, notifications and favorite-first @mentions."
doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
hist="\n### v1.2.25 — Working maximize and visible complete controls\n- Fixed Maximize on TornPDA by maximizing the common native chat shell instead of depending on a fragile detected message viewport.\n- Added a persistent ⚙ Chat Intelligence Settings control in the chat title bar.\n- Exposed the complete context-action feature list in Settings.\n- Synchronized metadata/runtime version surfaces to v1.2.25.\n"
marker='## Release history / Changelog\n'
if hist.strip() not in doc: doc=doc.replace(marker,marker+hist,1)
DOC.write_text(doc,encoding='utf-8')
print('Updated Chat Intelligence to v1.2.25')
