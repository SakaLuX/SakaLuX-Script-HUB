from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

# Version sync.
text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.32',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.32',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.31'","version:'1.2.32'")
text=text.replace("version:'1.2.30'","version:'1.2.32'")

# Replace destructive live-DOM filtering with an isolated result list.
pat=re.compile(r"function closeSearch\(reset=true\)\{.*?\nfunction viewport\(r,c\)",re.S)
m=pat.search(text); assert m,'search block not found'
new=r'''function closeSearch(reset=true){
 document.querySelectorAll('.slx-search').forEach(p=>{
  // Cleanup any stale display:none left by older builds.
  if(p._root)msgs(p._root).forEach(e=>e.style.removeProperty('display'));
  p.remove()
 })
}
function searchBox(r){
 if(!S.search)return;closeSearch(true);
 const p=document.createElement('div');p.className='slx-search';p._root=r;
 p.innerHTML='<div class="slx-search-title"><span>Search chat</span><button data-c>×</button></div><div class="slx-search-row"><input type="search" placeholder="Name or message…"><span data-count>0/0</span><button data-e title="Export results">⇩</button></div><div class="slx-search-results"></div>';
 document.body.appendChild(p);
 const place=()=>{const rr=r.getBoundingClientRect(),w=Math.min(Math.max(290,rr.width-16),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,rr.left+8))+'px';p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,rr.top+44))+'px'};p._place=place;
 const i=p.querySelector('input'),n=p.querySelector('[data-count]'),ex=p.querySelector('[data-e]'),box=p.querySelector('.slx-search-results');ex.hidden=!S.exportSearch;
 const render=()=>{
  const q=N(i.value).toLowerCase(),all=msgs(r),hits=all.filter(e=>{const pl=who(e),txt=N(e.innerText||e.textContent).toLowerCase();return !q||txt.includes(q)||dn(pl).toLowerCase().includes(q)});
  n.textContent=hits.length+'/'+all.length;box.textContent='';
  if(!q){const hint=document.createElement('div');hint.className='slx-search-empty';hint.textContent='Type to search loaded chat messages.';box.appendChild(hint);place();return}
  if(!hits.length){const z=document.createElement('div');z.className='slx-search-empty';z.textContent='No matching messages.';box.appendChild(z);place();return}
  hits.slice(0,80).forEach(e=>{
   const pl=who(e),row=document.createElement('button');row.type='button';row.className='slx-search-result';
   const name=document.createElement('b');name.textContent=dn(pl)||pl.name||'Message';
   const body=document.createElement('span');let raw=N(e.innerText||e.textContent);if(pl.name&&raw.toLowerCase().startsWith(pl.name.toLowerCase()))raw=raw.slice(pl.name.length).replace(/^\s*:\s*/,'');body.textContent=raw;
   row.append(name,body);row.onclick=()=>{closeSearch(true);try{e.scrollIntoView({behavior:'smooth',block:'center'});e.animate?.([{outline:'2px solid #4aa3ff'},{outline:'0 solid transparent'}],{duration:1200})}catch{}};box.appendChild(row)
  });
  if(hits.length>80){const more=document.createElement('div');more.className='slx-search-empty';more.textContent='Showing first 80 of '+hits.length+' results.';box.appendChild(more)}
  place()
 };
 i.addEventListener('input',render);i.addEventListener('search',render);p.querySelector('[data-c]').onclick=()=>closeSearch(true);ex.onclick=()=>{if(S.exportSearch)exportMessages(r,i.value)};render();place();setTimeout(()=>i.focus(),0)
}
function viewport(r,c)'''
text=text[:m.start()]+new+text[m.end():]

# Add isolated search-results styling. These cards live inside the search panel only;
# they never reuse/reposition native Torn message nodes.
css=r'''.slx-search-results{display:flex!important;flex-direction:column!important;gap:6px!important;max-height:min(48dvh,420px)!important;overflow-y:auto!important;padding:8px!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#151b20!important}.slx-search-result{display:flex!important;flex-direction:column!important;align-items:flex-start!important;width:100%!important;min-height:0!important;padding:8px 10px!important;border:1px solid #394652!important;border-radius:8px!important;background:#202830!important;color:#e9eef3!important;text-align:left!important;box-sizing:border-box!important;white-space:normal!important}.slx-search-result b{font-size:13px!important;line-height:1.25!important;color:#fff!important}.slx-search-result span{display:block!important;margin-top:2px!important;font-size:12px!important;line-height:1.3!important;color:#c5ced7!important;overflow-wrap:anywhere!important}.slx-search-result:active{background:#2a3540!important}.slx-search-empty{padding:12px 8px!important;color:#9aa5b1!important;font-size:12px!important;text-align:center!important}
'''
marker='#slx-menu{position:fixed!important;'
assert marker in text,'menu CSS marker missing'
text=text.replace(marker,css+marker,1)

CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
 doc=DOC.read_text(encoding='utf-8')
 doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.32**', doc, count=1)
 doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.32**', doc, count=1)
 note='**v1.2.32 — Isolated Search results overlay**\n- Search no longer hides/reflows native Torn chat message nodes.\n- Matching messages render as lightweight result cards inside the Search panel.\n- Tapping a result closes Search and scrolls to the original message.\n- Cleans stale display:none styles left by older Search builds.'
 doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda mm:mm.group(1)+note+mm.group(2),doc,count=1)
 DOC.write_text(doc,encoding='utf-8')

print('patched v1.2.32')
