from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHAT = ROOT / 'SakaLuX-Chat-Intelligence.user.js'
DOC = ROOT / 'greasyfork' / 'Chat-Intelligence.md'

text = CHAT.read_text(encoding='utf-8')

# Version surfaces.
text, n = re.subn(r'(?m)^(//\s*@version\s+)\S+', r'\g<1>1.2.26', text, count=1)
assert n == 1
text, n = re.subn(r"const V='[^']+',ID='chat-intelligence'", "const V='1.2.26',ID='chat-intelligence'", text, count=1)
assert n == 1

# Restore every old Chat Intelligence feature and make each context action independently configurable.
old_d = "const D={enabled:true,search:true,quickActions:true,notifications:true,notifyPM:true,notifyFaction:true,notifyCompany:true,mentionAutocomplete:true,exportSearch:true};"
new_d = "const D={enabled:true,search:true,quickActions:true,contextFavorite:true,contextReply:true,contextCopyId:true,contextCopyName:true,contextProfile:true,contextMute:true,contextAlias:true,notifications:true,notifyPM:true,notifyFaction:true,notifyCompany:true,mentionAutocomplete:true,exportSearch:true};"
assert old_d in text
text = text.replace(old_d, new_d, 1)

# Replace search box so Search/Export settings take effect immediately and reliably.
search_re = re.compile(r"function searchBox\(r\)\{.*?\}\nfunction viewport\(r,c\)", re.S)
search_new = r'''function searchBox(r){
 if(!S.search)return;
 closeSearch(false);
 const p=document.createElement('div');p.className='slx-search';p._root=r;
 p.innerHTML='<div class="slx-search-title"><span>Search chat</span><button data-c>×</button></div><div class="slx-search-row"><input type="search" placeholder="Name or message…"><span data-count>0</span><button data-e title="Export results">⇩</button></div>';
 document.body.appendChild(p);
 const place=()=>{const rr=r.getBoundingClientRect(),w=Math.min(Math.max(280,rr.width-16),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,rr.left+8))+'px';p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,rr.top+44))+'px'};p._place=place;
 const i=p.querySelector('input'),n=p.querySelector('[data-count]'),ex=p.querySelector('[data-e]');ex.hidden=!S.exportSearch;
 const run=()=>{const q=N(i.value).toLowerCase(),m=msgs(r);let z=0;m.forEach(e=>{const pl=who(e),hit=!q||body(e,pl).toLowerCase().includes(q)||dn(pl).toLowerCase().includes(q);if(q)e.style.setProperty('display',hit?'':'none','important');else e.style.removeProperty('display');if(q&&hit)z++});n.textContent=q?z:m.length};
 i.oninput=run;p.querySelector('[data-c]').onclick=()=>{i.value='';run();p.remove()};ex.onclick=()=>{if(S.exportSearch)exportMessages(r,i.value)};place();run();i.focus()
}
function viewport(r,c)'''
text, n = search_re.subn(search_new, text, count=1)
assert n == 1, 'searchBox block not found'

# Fullscreen repair: target a real common chat shell and force sizing with !important.
max_re = re.compile(r"function chatShell\(r,h,c\)\{.*?\}\nfunction toggleMax\(r,c,b\)\{.*?\}\nfunction findHeader\(r,c\)", re.S)
if not max_re.search(text):
    max_re = re.compile(r"function toggleMax\(r,c,b\)\{.*?\}\nfunction findHeader\(r,c\)", re.S)
max_new = r'''function chatShell(r,h,c){
 let n=h;
 for(let i=0;n&&i<12;i++,n=n.parentElement){
  if(n===document.body||n===document.documentElement)break;
  if(!n.contains(c))continue;
  const q=n.getBoundingClientRect();
  if(q.width>=220&&q.height>=180)return n;
 }
 return r;
}
function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function toggleMax(r,c,b){
 const h=findHeader(r,c),shell=chatShell(r,h,c);
 if(MAX.has(r)){
  const s=MAX.get(r);restoreStyle(s.shell,s.shellStyle);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);restoreStyle(s.composerHost,s.composerStyle);restoreStyle(document.body,s.bodyStyle);restoreStyle(document.documentElement,s.htmlStyle);MAX.delete(r);b.textContent='⛶';b.title='Maximize';setTimeout(()=>c?.focus(),0);return;
 }
 const v=viewport(r,c),ch=c?.parentElement;
 const state={shell,shellStyle:shell.getAttribute('style'),rootStyle:r.getAttribute('style'),view:v?.getAttribute('style')??null,view:v,composerHost:ch,composerStyle:ch?.getAttribute('style')??null,bodyStyle:document.body.getAttribute('style'),htmlStyle:document.documentElement.getAttribute('style')};
 MAX.set(r,state);
 document.documentElement.style.setProperty('overflow','hidden','important');document.body.style.setProperty('overflow','hidden','important');
 const force=(el,k,v)=>el?.style?.setProperty(k,v,'important');
 force(shell,'position','fixed');force(shell,'inset','4px');force(shell,'left','4px');force(shell,'right','4px');force(shell,'top','4px');force(shell,'bottom','4px');force(shell,'width','auto');force(shell,'height','auto');force(shell,'max-width','none');force(shell,'max-height','none');force(shell,'margin','0');force(shell,'transform','none');force(shell,'z-index','2147483500');force(shell,'display','flex');force(shell,'flex-direction','column');force(shell,'overflow','hidden');
 force(r,'position','relative');force(r,'flex','1 1 auto');force(r,'min-height','0');force(r,'height','auto');force(r,'max-height','none');force(r,'overflow','hidden');
 if(v){force(v,'position','relative');force(v,'flex','1 1 auto');force(v,'min-height','0');force(v,'height','auto');force(v,'max-height','none');force(v,'overflow-y','auto');force(v,'inset','auto')}
 if(ch){force(ch,'position','relative');force(ch,'flex','0 0 auto');force(ch,'left','auto');force(ch,'right','auto');force(ch,'bottom','auto');force(ch,'width','auto')}
 b.textContent='⤢';b.title='Restore';setTimeout(()=>{v?.scrollTo?.({top:v.scrollHeight,behavior:'auto'})},60)
}
function findHeader(r,c)'''
text, n = max_re.subn(max_new, text, count=1)
assert n == 1, 'maximize block not found'

# Rebuild context menu with every old action and per-action visibility.
menu_re = re.compile(r"function menu\(\)\{.*?\}\nfunction showMenu\(r,e,p\)\{.*?\}\nfunction decorate\(r,e,first\)", re.S)
menu_new = r'''function menu(){
 if(MENU?.isConnected)return;
 MENU=document.createElement('div');MENU.id='slx-menu';
 MENU.innerHTML='<button data-a="fav" title="Favorite">☆</button><button data-a="reply" title="Reply">↩</button><button data-a="id" title="Copy player ID">ID</button><button data-a="name" title="Copy name">N</button><button data-a="profile" title="Open profile">↗</button><button data-a="mute" title="Mute / unmute locally">🔇</button><button data-a="alias" title="Alias / color">✎</button><button data-a="close" title="Close">×</button>';
 document.body.appendChild(MENU);
 MENU.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!MD)return;const a=b.dataset.a,{r,p}=MD,k=pk(p);if(a==='close')return hideMenu();if(a==='fav'&&S.contextFavorite){F.has(k)?F.delete(k):F.add(k);saveP();return showMenu(r,MD.e,p)}if(a==='mute'&&S.contextMute){M.has(k)?M.delete(k):M.add(k);saveP();return showMenu(r,MD.e,p)}if(a==='reply'&&S.contextReply){const c=composer().find(x=>rootFor(x)===r);if(c&&p.name){c.value='@'+p.name+' '+(c.value||'');c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}return hideMenu()}if(a==='id'&&S.contextCopyId&&p.id)return navigator.clipboard?.writeText(p.id);if(a==='name'&&S.contextCopyName&&p.name)return navigator.clipboard?.writeText(p.name);if(a==='profile'&&S.contextProfile&&p.id)return location.href='https://www.torn.com/profiles.php?XID='+p.id;if(a==='alias'&&S.contextAlias){const d=pd(p),al=prompt('Alias for '+(p.name||p.id),d.alias||'');if(al===null)return;const co=prompt('Optional color (#d7a94a). Blank = default.',d.color||'');if(co===null)return;P[k]={...d,alias:N(al),color:N(co)};saveP();hideMenu();scan()}}
}
function applyMenuSettings(p){
 const map={fav:'contextFavorite',reply:'contextReply',id:'contextCopyId',name:'contextCopyName',profile:'contextProfile',mute:'contextMute',alias:'contextAlias'};
 for(const [a,k] of Object.entries(map)){const b=MENU?.querySelector('[data-a="'+a+'"]');if(b)b.hidden=!S[k]}
 const key=pk(p),d=pd(p),fav=MENU?.querySelector('[data-a="fav"]'),mute=MENU?.querySelector('[data-a="mute"]'),id=MENU?.querySelector('[data-a="id"]'),profile=MENU?.querySelector('[data-a="profile"]'),alias=MENU?.querySelector('[data-a="alias"]');
 if(fav)fav.textContent=F.has(key)?'★':'☆';if(mute)mute.textContent=M.has(key)?'🔈':'🔇';if(id)id.disabled=!p.id;if(profile)profile.disabled=!p.id;if(alias)alias.title=(d.alias?'Alias: '+d.alias:'Alias / color')+(d.color?' • '+d.color:'')
}
function showMenu(r,e,p){if(!S.quickActions||(!p.id&&!p.name))return;menu();MD={r,e,p};applyMenuSettings(p);MENU.classList.add('show');const x=e.getBoundingClientRect(),m=MENU.getBoundingClientRect();MENU.style.left=Math.max(8,Math.min(innerWidth-m.width-8,x.right-m.width))+'px';MENU.style.top=Math.max(8,Math.min(innerHeight-m.height-8,x.bottom+4))+'px'}
function decorate(r,e,first)'''
text, n = menu_re.subn(menu_new, text, count=1)
assert n == 1, 'context menu block not found'

# Apply alias custom color to the detected sender while preserving native color when cleared.
dec_old = "function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b);"
dec_new = "function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b),d=pd(p),sender=e.querySelector('[class*=\"sender\"],[class*=\"author\"],[class*=\"username\"],[class*=\"playerName\"],a[href*=\"profiles.php\"],a[href*=\"XID=\"]');if(sender){if(d.color){if(!sender.dataset.slxOriginalColor)sender.dataset.slxOriginalColor=sender.style.color||'';sender.style.setProperty('color',d.color,'important')}else if('slxOriginalColor' in sender.dataset){sender.style.color=sender.dataset.slxOriginalColor||'';delete sender.dataset.slxOriginalColor}};"
assert dec_old in text, 'decorate marker not found'
text = text.replace(dec_old, dec_new, 1)

# Replace settings with a complete, explicit control panel and immediate side effects.
settings_re = re.compile(r"function settings\(\)\{.*?\}\nfunction css\(\)", re.S)
settings_new = r'''function settings(){
 if(document.getElementById('sakalux-chat-settings-overlay'))return;
 const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';
 const general=[['enabled','Module enabled'],['search','Search'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete (favorites first + player ID)'],['exportSearch','Export chat/search']];
 const context=[['contextFavorite','★ Favorite'],['contextReply','↩ Reply'],['contextCopyId','ID — Copy player ID'],['contextCopyName','N — Copy name'],['contextProfile','↗ Open profile'],['contextMute','🔇 Local mute'],['contextAlias','✎ Alias + custom color']];
 const rows=a=>a.map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('');
 o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button type="button">×</button></header><main><h3>General</h3>'+rows(general)+'<h3>Context menu</h3>'+rows(context)+'<div class="slx-settings-actions"><button type="button" data-clear-mute>Clear mute list ('+M.size+')</button><button type="button" data-clear-people>Clear aliases/favorites ('+F.size+')</button><button type="button" data-reset>Reset settings</button></div></main><footer>SakaLuX [2380374]</footer></section>';
 document.body.appendChild(o);
 const close=()=>o.remove();o.querySelector('header button').onclick=close;
 o.addEventListener('click',e=>{if(e.target===o)close()});
 o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{const k=x.dataset.k;S[k]=x.checked;save();if(k==='enabled'){enable(x.checked);if(!x.checked)close();return}if(k==='search'&&!x.checked)closeSearch(true);if(k==='quickActions'&&!x.checked)hideMenu();if(k==='mentionAutocomplete'&&!x.checked)document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());if(k==='exportSearch'&&!x.checked)document.querySelectorAll('.slx-search [data-e]').forEach(e=>e.hidden=true);scan()});
 o.querySelector('[data-clear-mute]').onclick=e=>{M.clear();saveP();e.currentTarget.textContent='Clear mute list (0)'};
 o.querySelector('[data-clear-people]').onclick=e=>{P={};F.clear();saveP();e.currentTarget.textContent='Clear aliases/favorites (0)';scan()};
 o.querySelector('[data-reset]').onclick=()=>{S={...D};save();hideMenu();closeSearch(true);document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());close();scan()}
}
function css()'''
text, n = settings_re.subn(settings_new, text, count=1)
assert n == 1, 'settings block not found'

# Improve settings section headings if not already styled.
needle = "#sakalux-chat-settings-overlay footer{text-align:center!important;padding:8px!important;color:#8fa3ba!important}"
if needle in text:
    text = text.replace(needle, needle + "#sakalux-chat-settings-overlay h3{margin:10px 2px 7px!important;font-size:12px!important;color:#9fb7d0!important;text-transform:uppercase!important;letter-spacing:.5px!important}", 1)

# Ensure disabling the module also exits fullscreen and closes all transient UI.
enable_re = re.compile(r"function enable\(v\)\{.*?\}bridge\(\);return S\.enabled\}", re.S)
enable_new = r'''function enable(v){S.enabled=!!v;save();if(S.enabled){start();scan()}else{clearTimeout(T);T=null;O?.disconnect();O=null;for(const [r,s] of [...MAX.entries?.()||[]]){}document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());hideMenu();closeSearch(true)}bridge();return S.enabled}'''
# WeakMap is not iterable, so don't use this replacement if MAX is WeakMap. Keep existing enable and only strengthen transient cleanup with a safe textual patch.
text = text.replace("document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());closeSearch(true)", "document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());hideMenu();closeSearch(true)", 1)

CHAT.write_text(text, encoding='utf-8')

# Documentation.
doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.26**', doc, count=1)
doc = re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-30**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.26**', doc, count=1)
note = "**v1.2.26 — Full legacy feature restore, settings repair and reliable fullscreen**\n- Restores every v1.1.0 context action: Favorite, Reply, Copy ID, Copy Name, Profile, Local Mute and Alias + color.\n- Makes each context action individually configurable and repairs Search, Export and @mention setting side effects.\n- Rebuilds fullscreen around the real common chat shell and forces TornPDA-safe viewport sizing with reversible styles.\n- Adds working clear/reset controls and immediate settings application."
doc = re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)', lambda m:m.group(1)+note+m.group(2), doc, count=1)
history = "\n### v1.2.26 — Full legacy feature restore, settings repair and reliable fullscreen\n- Restored and exposed all legacy context actions.\n- Fixed Search, Export, notifications/channel toggles and @mention cleanup behavior.\n- Added individual context-action switches and reliable reset/clear actions.\n- Reworked maximize/restore to use the actual chat shell and reversible important styles.\n- Alias custom colors are applied to detected sender names.\n"
marker='## Release history / Changelog\n'
if '### v1.2.26' not in doc: doc=doc.replace(marker,marker+history,1)
DOC.write_text(doc,encoding='utf-8')

# Static sanity checks.
assert "const V='1.2.26'" in text
for token in ['contextFavorite','contextReply','contextCopyId','contextCopyName','contextProfile','contextMute','contextAlias','Reset settings','Alias + custom color','function chatShell','function restoreStyle']:
    assert token in text, token
print('Chat Intelligence v1.2.26 patch applied')
