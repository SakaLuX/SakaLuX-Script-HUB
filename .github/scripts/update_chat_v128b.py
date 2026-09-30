from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'; DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.28',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.28',ID='chat-intelligence'",text,count=1); assert n==1

m=re.search(r"function who\(e\)\{.*?return\{id,name\}\}",text,re.S); assert m
who=r'''function who(e){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const mm=(a.href||'').match(/[?&]XID=(\d+)/i);if(mm)id=mm[1];name=N(a.textContent)}if(!name)name=N(e.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"],strong,b')?.textContent);if(!name){const t=N(e.innerText||e.textContent),mm=t.match(/^([A-Za-z0-9_\-]{2,32})\s*:/);if(mm)name=mm[1]}return{id,name}}'''
text=text[:m.start()]+who+text[m.end():]

m=re.search(r"function syncContextTrigger\(r,e,p\)\{.*?(?=\nfunction decorate\(r,e,first\))",text,re.S); assert m
ctx=r'''function syncContextTrigger(r,e,p){let z=e.querySelector(':scope > .slx-msg-actions');if(!S.quickActions||(!p.id&&!p.name)){z?.remove();return}if(z){z._slxPlayer=p;return}z=document.createElement('button');z.type='button';z.className='slx-msg-actions';z.textContent='⋮';z.title='Player actions';z.setAttribute('aria-label','Player actions');z._slxPlayer=p;z.onclick=x=>{x.preventDefault();x.stopPropagation();showMenu(r,e,z._slxPlayer||p)};if(getComputedStyle(e).position==='static')e.style.setProperty('position','relative');e.appendChild(z)}'''
text=text[:m.start()]+ctx+text[m.end():]

needle='function enhance(r)'; idx=text.find(needle); assert idx>=0
helper=r'''function contextRows(r){const out=[],seen=new Set(),add=e=>{if(!e||seen.has(e)||!e.isConnected)return;const p=who(e);if(!p.name&&!p.id)return;const q=e.getBoundingClientRect();if(q.width<70||q.height<18||q.height>220)return;seen.add(e);out.push({e,p})};msgs(r).forEach(add);for(const e of r.querySelectorAll('div,li,p')){if(e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,#sakalux-chat-settings-overlay'))continue;const t=N(e.innerText||e.textContent);if(!/^([A-Za-z0-9_\-]{2,32})\s*:/.test(t))continue;if([...e.children].some(ch=>/^([A-Za-z0-9_\-]{2,32})\s*:/.test(N(ch.innerText||ch.textContent))))continue;add(e)}return out}
'''
text=text[:idx]+helper+text[idx:]
old='function scan(){if(!S.enabled)return;clean();roots().forEach(enhance);bridge()}'
assert old in text
text=text.replace(old,'function scan(){if(!S.enabled)return;clean();roots().forEach(r=>{enhance(r);contextRows(r).forEach(({e,p})=>syncContextTrigger(r,e,p))});bridge()}',1)

m=re.search(r"function restoreStyle\(el,style\)\{.*?\nfunction findHeader\(r,c\)",text,re.S); assert m
maxcode=r'''function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function commonChatPanel(r,c){const h=findHeader(r,c);if(!h)return r;let n=h;for(let i=0;n&&i<10;i++,n=n.parentElement){if(n===document.body||n===document.documentElement)break;if(n.contains(c)){const q=n.getBoundingClientRect();if(q.width>=220&&q.height>=220&&q.width<=innerWidth*.98)return n}}return r}
function toggleMax(r,c,b){if(MAX.has(r)){const s=MAX.get(r);restoreStyle(s.panel,s.panelStyle);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';b.title='Maximize';return}const panel=commonChatPanel(r,c),v=viewport(r,c),state={panel,panelStyle:panel.getAttribute('style'),rootStyle:r.getAttribute('style'),view:v,viewStyle:v?.getAttribute('style')??null};MAX.set(r,state);document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');const f=(el,k,val)=>el?.style?.setProperty(k,val,'important');f(panel,'position','fixed');f(panel,'left','4vw');f(panel,'right','4vw');f(panel,'top','8dvh');f(panel,'bottom','10dvh');f(panel,'width','auto');f(panel,'height','auto');f(panel,'max-width','92vw');f(panel,'max-height','82dvh');f(panel,'margin','0 auto');f(panel,'transform','none');f(panel,'z-index','2147483600');f(panel,'overflow','hidden');f(panel,'visibility','visible');f(panel,'opacity','1');if(panel!==r){f(r,'width','100%');f(r,'height','100%');f(r,'max-width','none');f(r,'max-height','none')}if(v){f(v,'max-height','none');f(v,'overflow-y','auto')}b.textContent='⤢';b.title='Restore';requestAnimationFrame(()=>{const q=panel.getBoundingClientRect();if(q.width<innerWidth*.65||q.height<innerHeight*.5||q.left<0||q.top<0||q.right>innerWidth+2||q.bottom>innerHeight+2){restoreStyle(panel,state.panelStyle);restoreStyle(r,state.rootStyle);restoreStyle(v,state.viewStyle);MAX.delete(r);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');b.textContent='⛶';b.title='Maximize'}})}
function findHeader(r,c)'''
text=text[:m.start()]+maxcode+text[m.end():]

marker='.slx-toast-host{position:absolute!important;'; idx=text.find(marker); assert idx>=0
css='.slx-msg-actions{position:absolute!important;right:2px!important;top:2px!important;width:22px!important;height:22px!important;min-width:22px!important;padding:0!important;margin:0!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:50%!important;background:#313a43!important;color:#fff!important;font-size:16px!important;line-height:20px!important;text-align:center!important;z-index:80!important;opacity:.96!important;box-shadow:0 1px 3px #0008!important}.slx-chat-max-active{overflow:hidden!important}\n'
text=text[:idx]+css+text[idx:]
CHAT.write_text(text,encoding='utf-8')

doc=DOC.read_text(encoding='utf-8')
doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.28**', doc, count=1)
doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.28**', doc, count=1)
doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+'**v1.2.28 — TornPDA maximize/context fix**\n- Bounded centered maximize using the common chat header/composer panel.\n- Fallback sender/message detection and visible ⋮ context buttons on TornPDA.'+m.group(2),doc,count=1)
DOC.write_text(doc,encoding='utf-8')
print('patched 1.2.28')
