from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

# Version sync
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.33',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.33',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.32'","version:'1.2.33'")

# Header visibility helper: Search/Export/Max obey settings immediately, Settings always remains available.
needle='function settings(){'
assert needle in text
helper=r'''function syncHeaderControlVisibility(){
 document.querySelectorAll('.slx-head-controls').forEach(x=>{
  const s=x.querySelector('[data-s]'),m=x.querySelector('[data-m]'),e=x.querySelector('[data-e]'),o=x.querySelector('[data-o]');
  if(s)s.hidden=!S.enabled||!S.search;
  if(m)m.hidden=!S.enabled;
  if(e)e.hidden=!S.enabled||!S.exportSearch;
  if(o)o.hidden=false;
 });
}
'''
if 'function syncHeaderControlVisibility(){' not in text:
 text=text.replace(needle,helper+needle,1)

# Rebuild settings so disabling the module cannot lock the user out.
start=text.find('function settings(){'); assert start>=0
end=text.find('\nfunction css()',start); assert end>start
settings_new=r'''function settings(){
 if(document.getElementById('sakalux-chat-settings-overlay'))return;
 const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';
 const general=[['enabled','Enhancements enabled'],['search','Search button'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete (favorites first + player ID)'],['exportSearch','Export chat/search']];
 const context=[['contextFavorite','★ Favorite'],['contextReply','↩ Reply'],['contextCopyId','ID — Copy player ID'],['contextCopyName','N — Copy name'],['contextProfile','↗ Open profile'],['contextMute','🔇 Local mute'],['contextAlias','✎ Alias + color']];
 const rows=a=>a.map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('');
 o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button type="button">×</button></header><main><p class="slx-settings-note">Settings ⚙ always stays available, even when enhancements are disabled.</p><h3>General</h3>'+rows(general)+'<h3>Context menu</h3>'+rows(context)+'<div class="slx-settings-actions"><button type="button" data-clear-mute>Clear mute list ('+M.size+')</button><button type="button" data-clear-people>Clear aliases/favorites ('+F.size+')</button><button type="button" data-reset>Reset settings</button></div></main><footer>SakaLuX [2380374]</footer></section>';
 document.body.appendChild(o);
 const close=()=>o.remove();o.querySelector('header button').onclick=close;o.addEventListener('click',e=>{if(e.target===o)close()});
 o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{
  const k=x.dataset.k;S[k]=x.checked;save();
  if(k==='search'&&!S.search)closeSearch(true);
  if(k==='quickActions'&&!S.quickActions)hideMenu();
  if(k==='mentionAutocomplete'&&!S.mentionAutocomplete)document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());
  if(k==='enabled')enable(S.enabled); else scan();
  syncHeaderControlVisibility();
 });
 o.querySelector('[data-clear-mute]').onclick=e=>{M.clear();saveP();e.currentTarget.textContent='Clear mute list (0)'};
 o.querySelector('[data-clear-people]').onclick=e=>{P={};F.clear();saveP();e.currentTarget.textContent='Clear aliases/favorites (0)';scan()};
 o.querySelector('[data-reset]').onclick=()=>{S={...D};save();hideMenu();closeSearch(true);document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());enable(true);syncHeaderControlVisibility();close();scan()}
}'''
text=text[:start]+settings_new+text[end:]

# Make scan keep the Settings control alive while disabled.
old_scan="function scan(){if(!S.enabled)return;clean();roots().forEach(r=>{enhance(r);contextRows(r).forEach(({e,p})=>syncContextTrigger(r,e,p))});bridge()}"
new_scan="function scan(){clean();roots().forEach(r=>{controls(r);if(S.enabled){enhance(r);contextRows(r).forEach(({e,p})=>syncContextTrigger(r,e,p))}else{r.querySelectorAll('.slx-msg-actions').forEach(e=>e.remove());r.querySelectorAll('.slx-mentions').forEach(e=>e.remove())}});syncHeaderControlVisibility();bridge()}"
assert old_scan in text, 'scan marker missing'
text=text.replace(old_scan,new_scan,1)

# Replace enable() so OFF stops enhancements but preserves observer + settings button for recovery.
fn_start=text.find('function enable(v){'); assert fn_start>=0
fn_end=text.find('\nfunction ',fn_start+1); assert fn_end>fn_start
old_enable=text[fn_start:fn_end]
new_enable=r'''function enable(v){
 S.enabled=!!v;save();
 if(!O)start();
 if(!S.enabled){clearTimeout(T);T=null;hideMenu();closeSearch(true);document.querySelectorAll('.slx-toast-host,.slx-mentions,.slx-msg-actions').forEach(e=>e.remove())}
 scan();syncHeaderControlVisibility();bridge();return S.enabled
}'''
text=text[:fn_start]+new_enable+text[fn_end:]

# Ensure existing controls resync even if already mounted.
ctrl_end_marker="bindButton(x.querySelector('[data-o]'),()=>settings())}"
if ctrl_end_marker in text:
 text=text.replace(ctrl_end_marker,"bindButton(x.querySelector('[data-o]'),()=>settings());syncHeaderControlVisibility()}",1)

# Minor settings note styling.
css_marker='#sakalux-chat-settings-overlay h3{'
if css_marker in text and '.slx-settings-note{' not in text:
 text=text.replace(css_marker,'.slx-settings-note{margin:4px 0 10px!important;padding:8px!important;border:1px solid #394550!important;border-radius:8px!important;background:#20272e!important;color:#aebdca!important;font-size:11px!important;line-height:1.35!important}'+css_marker,1)

CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
 doc=DOC.read_text(encoding='utf-8')
 doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.33**', doc, count=1)
 doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.33**', doc, count=1)
 note='**v1.2.33 — Settings recovery + immediate toggle sync**\n- Search OFF now immediately hides the Search button and closes any open Search panel.\n- Disabling enhancements no longer removes the Settings gear; Settings remains available so the module can always be re-enabled.\n- Maximize/Export/Search header controls now follow their settings immediately.\n- Reset Settings restores the module and all controls without requiring manual storage edits.'
 doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
 DOC.write_text(doc,encoding='utf-8')
print('patched v1.2.33')
