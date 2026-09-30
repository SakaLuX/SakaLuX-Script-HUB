from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.28',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.28',ID='chat-intelligence'",text,count=1); assert n==1

# --- Robust sender detection for TornPDA message markup ---
who_pat=r"function who\(e\)\{.*?return\{id,name\}\}"
m=re.search(who_pat,text,re.S); assert m,'who() not found'
who_new=r'''function who(e){
 const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';
 if(a){const mm=(a.href||'').match(/[?&]XID=(\d+)/i);if(mm)id=mm[1];name=N(a.textContent)}
 if(!name)name=N(e.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b')?.textContent);
 if(!name){const t=N(e.innerText||e.textContent),mm=t.match(/^([A-Za-z0-9_\-]{2,32})\s*:/);if(mm)name=mm[1]}
 return{id,name}
}'''
text=text[:m.start()]+who_new+text[m.end():]

# --- Fallback message candidates used only for context buttons ---
insert_after="function msgs(r){"
pos=text.find(insert_after); assert pos>=0,'msgs() not found'
# place helper after msgs function via regex
msgs_pat=r"function msgs\(r\)\{.*?\n\}"
mm=re.search(msgs_pat,text,re.S); assert mm,'msgs block not found'
helper=r'''
function contextRows(r){
 const out=[],seen=new Set();
 const add=e=>{if(!e||seen.has(e)||!e.isConnected)return;const p=who(e);if(!p.name&&!p.id)return;const q=e.getBoundingClientRect();if(q.width<70||q.height<18||q.height>220)return;seen.add(e);out.push({e,p})};
 msgs(r).forEach(add);
 for(const e of r.querySelectorAll('div,li,p')){
  if(e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,#sakalux-chat-settings-overlay'))continue;
  const t=N(e.innerText||e.textContent);if(!/^([A-Za-z0-9_\-]{2,32})\s*:/.test(t))continue;
  if([...e.children].some(ch=>/^([A-Za-z0-9_\-]{2,32})\s*:/.test(N(ch.innerText||ch.textContent))))continue;
  add(e)
 }
 return out
}
'''
text=text[:mm.end()]+helper+text[mm.end():]

# --- Replace context-trigger injector with CSS-class based implementation ---
ctx_pat=r"function syncContextTrigger\(r,e,p\)\{.*?\n\}"
cm=re.search(ctx_pat,text,re.S); assert cm,'syncContextTrigger not found'
ctx_new=r'''function syncContextTrigger(r,e,p){
 let z=e.querySelector(':scope > .slx-msg-actions');
 if(!S.quickActions||(!p.id&&!p.name)){z?.remove();return}
 if(z){z._slxPlayer=p;return}
 z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z._slxPlayer=p;
 z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,z._slxPlayer||p)};
 if(getComputedStyle(e).position==='static')e.style.setProperty('position','relative');e.appendChild(z)
}'''
text=text[:cm.start()]+ctx_new+text[cm.end():]

# enhance fallback rows every scan so buttons appear even when Torn class names change
old="function enhance(r){controls(r);mentions(r);const first=!ROOTS.has(r);msgs(r).forEach(e=>decorate(r,e,first));ROOTS.add(r)}"
assert old in text,'enhance marker missing'
new="function enhance(r){controls(r);mentions(r);const first=!ROOTS.has(r);msgs(r).forEach(e=>decorate(r,e,first));contextRows(r).forEach(({e,p})=>syncContextTrigger(r,e,p));ROOTS.add(r)}"
text=text.replace(old,new,1)

# --- Replace maximize with centered, bounded floating panel based on common ancestor of header+composer ---
max_pat=r"function restoreStyle\(el,style\)\{.*?\nfunction findHeader\(r,c\)"
mx=re.search(max_pat,text,re.S); assert mx,'maximize block not found'
max_new=r'''function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function commonChatPanel(r,c){
 const h=findHeader(r,c);if(!h)return r;let n=h;
 for(let i=0;n&&i<10;i++,n=n.parentElement){if(n===document.body||n===document.documentElement)break;if(n.contains(c)){const q=n.getBoundingClientRect();if(q.width>=220&&q.height>=220&&q.width<=innerWidth*.98)return n}}
 return r
}
function toggleMax(r,c,b){
 if(MAX.has(r)){
  const s=MAX.get(r);restoreStyle(s.panel,s.panelStyle);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';b.title='Maximize';setTimeout(()=>c?.focus(),0);return
 }
 const panel=commonChatPanel(r,c),v=viewport(r,c),state={panel,panelStyle:panel.getAttribute('style'),rootStyle:r.getAttribute('style'),view:v,viewStyle:v?.getAttribute('style')??null};MAX.set(r,state);
 document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');
 const f=(el,k,val)=>el?.style?.setProperty(k,val,'important');
 f(panel,'position','fixed');f(panel,'left','4vw');f(panel,'right','4vw');f(panel,'top','7dvh');f(panel,'bottom','8dvh');f(panel,'width','auto');f(panel,'height','auto');f(panel,'min-width','0');f(panel,'min-height','320px');f(panel,'max-width','92vw');f(panel,'max-height','85dvh');f(panel,'margin','0 auto');f(panel,'transform','none');f(panel,'z-index','2147483600');f(panel,'overflow','hidden');f(panel,'visibility','visible');f(panel,'opacity','1');
 if(panel!==r){f(r,'width','100%');f(r,'height','100%');f(r,'max-width','none');f(r,'max-height','none');f(r,'min-height','0')}
 if(v){f(v,'max-height','none');f(v,'overflow-y','auto')}
 b.textContent='⤢';b.title='Restore';
 requestAnimationFrame(()=>{const q=panel.getBoundingClientRect();if(q.width<innerWidth*.70||q.height<innerHeight*.55||q.left<0||q.top<0||q.right>innerWidth+2||q.bottom>innerHeight+2){restoreStyle(panel,state.panelStyle);restoreStyle(r,state.rootStyle);restoreStyle(v,state.viewStyle);MAX.delete(r);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');b.textContent='⛶';b.title='Maximize';}else setTimeout(()=>v?.scrollTo?.({top:v.scrollHeight,behavior:'auto'}),40)})
}
function findHeader(r,c)'''
text=text[:mx.start()]+max_new+text[mx.end():]

# --- CSS for visible message context button + safe max overlay ---
css_marker=".slx-toast-host{position:absolute!important;"
idx=text.find(css_marker); assert idx>=0,'css marker missing'
css_add=".slx-msg-actions{position:absolute!important;right:2px!important;top:2px!important;width:22px!important;height:22px!important;min-width:22px!important;padding:0!important;margin:0!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:50%!important;background:#2a323a!important;color:#e8edf2!important;font-size:16px!important;line-height:20px!important;text-align:center!important;z-index:50!important;opacity:.92!important;box-shadow:0 1px 3px #0008!important}.slx-msg-actions:active{background:#3b4650!important}.slx-chat-max-active{overflow:hidden!important}\n"
text=text[:idx]+css_add+text[idx:]

CHAT.write_text(text,encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.28**', doc, count=1)
doc=re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-30**', doc, count=1)
doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.28**', doc, count=1)
note="**v1.2.28 — Bounded maximize + robust context buttons**\n- Maximize now targets the actual chat panel common to the title bar and composer, and opens it as a centered bounded overlay instead of stretching the message root over the page.\n- Adds fallback message-row detection for TornPDA markup changes, including visible username:text rows.\n- Context ⋮ buttons are now styled by dedicated CSS and reattached on every scan when missing.\n- Sender extraction now falls back to strong/bold labels and Name: message prefixes."
doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
hist="\n### v1.2.28 — Bounded maximize + robust context buttons\n- Centered bounded chat maximize based on common header/composer panel.\n- TornPDA fallback message detection and sender parsing.\n- Always-visible ⋮ context buttons with dedicated styling.\n"
if hist.strip() not in doc: doc=doc.replace('## Release history / Changelog\n','## Release history / Changelog\n'+hist,1)
DOC.write_text(doc,encoding='utf-8')
print('Chat Intelligence v1.2.28 patched')
