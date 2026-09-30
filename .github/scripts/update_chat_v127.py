from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.27',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.27',ID='chat-intelligence'",text,count=1); assert n==1

# Replace maximize implementation with a direct-root fullscreen that does not style or move Torn ancestors.
pat=r"function restoreStyle\(el,style\)\{.*?\nfunction findHeader\(r,c\)"
m=re.search(pat,text,re.S); assert m,'maximize block not found'
new=r'''function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function toggleMax(r,c,b){
 if(MAX.has(r)){
  const s=MAX.get(r);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);restoreStyle(s.composerHost,s.composerStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';b.title='Maximize';setTimeout(()=>c?.focus(),0);return;
 }
 const v=viewport(r,c),ch=c?.parentElement,state={rootStyle:r.getAttribute('style'),view:v,viewStyle:v?.getAttribute('style')??null,composerHost:ch,composerStyle:ch?.getAttribute('style')??null};
 MAX.set(r,state);document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');
 const force=(el,k,val)=>el?.style?.setProperty(k,val,'important');
 force(r,'position','fixed');force(r,'top','6px');force(r,'left','6px');force(r,'right','6px');force(r,'bottom','6px');force(r,'width','calc(100vw - 12px)');force(r,'height','calc(100dvh - 12px)');force(r,'min-width','0');force(r,'min-height','0');force(r,'max-width','none');force(r,'max-height','none');force(r,'margin','0');force(r,'transform','none');force(r,'z-index','2147483600');force(r,'display','flex');force(r,'flex-direction','column');force(r,'overflow','hidden');force(r,'visibility','visible');force(r,'opacity','1');
 if(v){force(v,'position','relative');force(v,'flex','1 1 auto');force(v,'min-height','0');force(v,'height','auto');force(v,'max-height','none');force(v,'overflow-y','auto');force(v,'inset','auto')}
 if(ch){force(ch,'position','relative');force(ch,'flex','0 0 auto');force(ch,'left','auto');force(ch,'right','auto');force(ch,'bottom','auto');force(ch,'width','auto')}
 b.textContent='⤢';b.title='Restore';
 requestAnimationFrame(()=>{const q=r.getBoundingClientRect();if(q.width<innerWidth*.65||q.height<innerHeight*.55||q.bottom<40||q.top>innerHeight-40){restoreStyle(r,state.rootStyle);restoreStyle(v,state.viewStyle);restoreStyle(ch,state.composerStyle);MAX.delete(r);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');b.textContent='⛶';b.title='Maximize';}else setTimeout(()=>v?.scrollTo?.({top:v.scrollHeight,behavior:'auto'}),40)})
}
function findHeader(r,c)'''
text=text[:m.start()]+new+text[m.end():]

# Add an always-visible per-message context trigger so the menu is discoverable on mobile.
marker="function showMenu(r,e,p){if(!S.quickActions||(!p.id&&!p.name))return;menu();MD={r,e,p};applyMenuSettings(p);MENU.classList.add('show');const x=e.getBoundingClientRect(),m=MENU.getBoundingClientRect();MENU.style.left=Math.max(8,Math.min(innerWidth-m.width-8,x.right-m.width))+'px';MENU.style.top=Math.max(8,Math.min(innerHeight-m.height-8,x.bottom+4))+'px'}"
assert marker in text,'showMenu marker not found'
addition=marker+"\nfunction syncContextTrigger(r,e,p){let z=e.querySelector(':scope > .slx-msg-actions');if(!S.quickActions||(!p.id&&!p.name)){z?.remove();return}if(z)return;z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,p)};if(getComputedStyle(e).position==='static')e.style.setProperty('position','relative');Object.assign(z.style,{position:'absolute',right:'3px',top:'3px',width:'24px',height:'24px',padding:'0',margin:'0',border:'0',borderRadius:'6px',background:'rgba(0,0,0,.28)',color:'#d9e0e6',fontSize:'18px',lineHeight:'22px',zIndex:'8'});e.appendChild(z)}"
text=text.replace(marker,addition,1)

old="function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b),d=pd(p),sender=e.querySelector('[class*=\"sender\"],[class*=\"author\"],[class*=\"username\"],[class*=\"playerName\"],a[href*=\"profiles.php\"],a[href*=\"XID=\"]');"
assert old in text,'decorate marker not found'
new=old+"syncContextTrigger(r,e,p);"
text=text.replace(old,new,1)

# Make sender/name taps open the same context menu, but preserve ordinary links elsewhere.
old_click="if(!BOUND.has(e)){BOUND.add(e);e.onclick=x=>{if(!x.target.closest('a,button,input,textarea,[contenteditable=\"true\"]'))showMenu(r,e,p)}}"
assert old_click in text,'message click marker not found'
new_click="if(!BOUND.has(e)){BOUND.add(e);e.onclick=x=>{if(x.target.closest('.slx-msg-actions'))return;const senderTap=x.target.closest('[class*=\"sender\"],[class*=\"author\"],[class*=\"username\"],[class*=\"playerName\"]');if(senderTap){x.preventDefault();x.stopPropagation();showMenu(r,e,p);return}if(!x.target.closest('a,button,input,textarea,[contenteditable=\"true\"]'))showMenu(r,e,p)}}"
text=text.replace(old_click,new_click,1)

# Ensure quickActions OFF immediately removes all message triggers; ON re-renders them.
old_side="if(k==='quickActions'&&!x.checked)hideMenu();"
assert old_side in text,'settings side-effect marker not found'
text=text.replace(old_side,"if(k==='quickActions'&&!x.checked){hideMenu();document.querySelectorAll('.slx-msg-actions').forEach(e=>e.remove())}",1)

# Module disable also removes message triggers and any open context menu.
old_disable="document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());document.documentElement.classList.remove('slx-chat-max-active');"
assert old_disable in text,'disable cleanup marker not found'
text=text.replace(old_disable,"document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions,.slx-msg-actions').forEach(e=>e.remove());hideMenu();document.documentElement.classList.remove('slx-chat-max-active');",1)

# Prevent own observer from rescanning on action-button mutations.
text=text.replace('.slx-head-controls,.slx-toast-host,.slx-mentions,#slx-menu,#sakalux-chat-settings-overlay','.slx-head-controls,.slx-toast-host,.slx-mentions,.slx-msg-actions,#slx-menu,#sakalux-chat-settings-overlay')

CHAT.write_text(text,encoding='utf-8')

# Release docs.
doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.27**', doc, count=1)
doc=re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-30**', doc, count=1)
doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.27**', doc, count=1)
note="**v1.2.27 — Visible context actions and safe fullscreen**\n- Adds a visible ⋮ Player actions trigger to every detected chat message so the context menu is discoverable on TornPDA.\n- Sender-name taps also open the context menu.\n- Replaces ancestor-based maximize with direct chat-root fullscreen plus automatic geometry validation/fallback.\n- Context actions are removed immediately when disabled and restored when re-enabled."
doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
hist="\n### v1.2.27 — Visible context actions and safe fullscreen\n- Visible per-message ⋮ context trigger.\n- Sender/name tap opens Player actions.\n- Direct-root fullscreen with geometry validation to prevent off-screen/disappearing chat.\n- Immediate cleanup/re-render for Context actions setting.\n"
if hist.strip() not in doc: doc=doc.replace('## Release history / Changelog\n','## Release history / Changelog\n'+hist,1)
DOC.write_text(doc,encoding='utf-8')
print('Chat Intelligence v1.2.27 patched')
