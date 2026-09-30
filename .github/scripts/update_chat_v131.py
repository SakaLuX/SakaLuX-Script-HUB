from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
CHAT=ROOT/'SakaLuX-Chat-Intelligence.user.js'
DOC=ROOT/'greasyfork'/'Chat-Intelligence.md'
text=CHAT.read_text(encoding='utf-8')

text,n=re.subn(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>1.2.31',text,count=1); assert n==1
text,n=re.subn(r"const V='[^']+',ID='chat-intelligence'","const V='1.2.31',ID='chat-intelligence'",text,count=1); assert n==1
text=text.replace("version:'1.2.30'","version:'1.2.31'")

pat=r"function restoreStyle\(el,style\)\{.*?\nfunction findHeader\(r,c\)"
m=re.search(pat,text,re.S); assert m,'maximize block not found'
new=r'''function restoreStyle(el,style){if(!el)return;if(style===null||style===undefined||style==='')el.removeAttribute('style');else el.setAttribute('style',style)}
function commonChatPanel(r,c){
 const h=findHeader(r,c);if(!h)return r;
 let n=h,best=null;
 const vw=window.visualViewport?.width||innerWidth,vh=window.visualViewport?.height||innerHeight;
 for(let i=0;n&&i<12;i++,n=n.parentElement){
  if(n===document.body||n===document.documentElement)break;
  if(!n.contains(r)||!n.contains(c))continue;
  const q=n.getBoundingClientRect();
  if(q.width<220||q.height<220)continue;
  if(q.width>vw*.94||q.height>vh*.94)break;
  best=n;
 }
 return best||r
}
function toggleMax(r,c,b){
 if(MAX.has(r)){
  const s=MAX.get(r);restoreStyle(s.panel,s.panelStyle);restoreStyle(r,s.rootStyle);restoreStyle(s.view,s.viewStyle);restoreStyle(s.composerHost,s.composerStyle);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');MAX.delete(r);b.textContent='⛶';b.title='Maximize';setTimeout(()=>c?.focus(),0);return
 }
 const panel=commonChatPanel(r,c),v=viewport(r,c),ch=c?.parentElement;
 const state={panel,panelStyle:panel.getAttribute('style'),rootStyle:r.getAttribute('style'),view:v,viewStyle:v?.getAttribute('style')??null,composerHost:ch,composerStyle:ch?.getAttribute('style')??null};MAX.set(r,state);
 document.documentElement.classList.add('slx-chat-max-active');document.body.classList.add('slx-chat-max-active');
 const f=(el,k,val)=>el?.style?.setProperty(k,val,'important');
 const vv=window.visualViewport,top=Math.max(6,Math.round(vv?.offsetTop||0)+6),left=Math.max(6,Math.round(vv?.offsetLeft||0)+6),vw=Math.round(vv?.width||innerWidth),vh=Math.round(vv?.height||innerHeight);
 f(panel,'position','fixed');f(panel,'left',left+'px');f(panel,'top',top+'px');f(panel,'right','auto');f(panel,'bottom','auto');f(panel,'width',Math.max(280,vw-12)+'px');f(panel,'height',Math.max(360,vh-12)+'px');f(panel,'max-width','none');f(panel,'max-height','none');f(panel,'min-width','0');f(panel,'min-height','0');f(panel,'margin','0');f(panel,'transform','none');f(panel,'z-index','2147483600');f(panel,'overflow','hidden');f(panel,'display','flex');f(panel,'flex-direction','column');f(panel,'box-sizing','border-box');
 if(panel!==r){f(r,'position','relative');f(r,'display','flex');f(r,'flex-direction','column');f(r,'flex','1 1 auto');f(r,'width','100%');f(r,'height','auto');f(r,'min-height','0');f(r,'max-width','none');f(r,'max-height','none');f(r,'overflow','hidden')}
 if(v){f(v,'position','relative');f(v,'flex','1 1 auto');f(v,'height','auto');f(v,'min-height','0');f(v,'max-height','none');f(v,'overflow-y','auto');f(v,'overscroll-behavior','contain')}
 if(ch){f(ch,'position','relative');f(ch,'flex','0 0 auto');f(ch,'left','auto');f(ch,'right','auto');f(ch,'bottom','auto');f(ch,'width','100%');f(ch,'margin-top','auto')}
 b.textContent='⤢';b.title='Restore';
 requestAnimationFrame(()=>{const q=panel.getBoundingClientRect(),ok=q.width>=vw*.88&&q.height>=vh*.80&&q.left>=-2&&q.top>=-2&&q.right<=left+vw+4&&q.bottom<=top+vh+4;if(!ok){restoreStyle(panel,state.panelStyle);restoreStyle(r,state.rootStyle);restoreStyle(v,state.viewStyle);restoreStyle(ch,state.composerStyle);MAX.delete(r);document.documentElement.classList.remove('slx-chat-max-active');document.body.classList.remove('slx-chat-max-active');b.textContent='⛶';b.title='Maximize';return}setTimeout(()=>{try{v?.scrollTo?.({top:v.scrollHeight,behavior:'auto'})}catch{};c?.focus?.()},40)})
}
function findHeader(r,c)'''
text=text[:m.start()]+new+text[m.end():]

CHAT.write_text(text,encoding='utf-8')

if DOC.exists():
 doc=DOC.read_text(encoding='utf-8')
 doc=re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.31**', doc, count=1)
 doc=re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.31**', doc, count=1)
 note='**v1.2.31 — TornPDA full chat maximize repair**\n- Maximize now selects the outer chat panel that contains the title bar, message root and composer, instead of stopping at the first inner message container.\n- Uses visualViewport dimensions so the maximized panel stays inside the actual TornPDA WebView.\n- The whole chat becomes a fixed flex panel, with the message viewport taking the available space and the composer pinned inside the same panel.\n- Restore returns every touched inline style to its original value.'
 doc=re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)',lambda m:m.group(1)+note+m.group(2),doc,count=1)
 DOC.write_text(doc,encoding='utf-8')

print('patched v1.2.31')
