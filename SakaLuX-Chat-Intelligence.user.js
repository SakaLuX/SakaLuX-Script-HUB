// ==UserScript==
// @name         SakaLuX Chat Intelligence
// @namespace    sakalux.chat.intelligence
// @version      1.0.5
// @description  Torn Chat 3 tools for SakaLuX Hub: stable search, contextual actions, notifications and TornPDA-safe rendering.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// ==/UserScript==
(function(){
'use strict';
const V='1.0.5',ID='chat-intelligence',API='SakaLuXChatIntelligence';
const K='SakaLuX_CHAT_V2',DEF={enabled:true,search:true,quickActions:true,notifications:true};
const load=()=>{try{return{...DEF,...JSON.parse(localStorage.getItem(K)||'{}')}}catch{return{...DEF}}},save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch{}};
let S=load(),obs=null,timer=null,ctx=null,ctxData=null;
const seen=new Set(),rootsSeen=new WeakSet(),bound=new WeakSet();
const norm=v=>String(v??'').replace(/\s+/g,' ').trim();
const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
function isMailPage(){
  const path=(location.pathname||'').toLowerCase(), search=(location.search||'').toLowerCase(), hashPart=(location.hash||'').toLowerCase();
  return path.includes('messages.php') || /[?&]sid=(messages|mail)\b/.test(search) || hashPart.includes('messages');
}
function isChatComposer(input){
  if(!input||!input.isConnected)return false;
  const ph=norm(input.getAttribute?.('placeholder')||'').toLowerCase();
  if(/type your message/.test(ph))return true;
  const own=String(input.className||'').toLowerCase();
  const parent=String(input.closest?.('[class]')?.className||'').toLowerCase();
  return own.includes('chat') || parent.includes('chat');
}
function purgeStrayUi(){
  document.querySelectorAll('.slx-tools').forEach(e=>e.remove());
  document.getElementById('slx-ctx')?.remove();
  document.getElementById('slx-toast')?.remove();
  ctx=null;ctxData=null;
}
function p(el){const a=el.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const m=(a.href||'').match(/[?&]XID=(\d+)/i);if(m)id=m[1];name=norm(a.textContent)}if(!name)name=norm(el.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"]')?.textContent);return{id,name}}
function msg(el){if(!el||!el.isConnected||el.closest('.slx-tools,#slx-ctx,#slx-toast'))return false;if(el.querySelector('textarea,[contenteditable="true"]'))return false;const t=norm(el.innerText);if(!t||t.length>2500)return false;const c=String(el.className||'').toLowerCase(),explicit=el.hasAttribute('data-message-id')||el.hasAttribute('data-message'),cls=c.includes('chatmessage')||c.includes('messageitem')||c.includes('messagerow')||/(^|\s|_|-)message($|\s|_|-)/.test(c),profile=!!el.querySelector('a[href*="profiles.php"],a[href*="XID="]'),sender=!!el.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"]');if(!(explicit||cls||(profile&&sender)))return false;return !el.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"]')}
function msgs(root){const q='[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="message-item"],[class*="messageRow"],[class*="message-row"]';let a=[...root.querySelectorAll(q)].filter(msg);if(!a.length)a=[...root.querySelectorAll('a[href*="profiles.php"],a[href*="XID="]')].map(x=>x.closest('div,section,article')).filter(msg);return a.filter((e,i)=>!a.some((o,j)=>j!==i&&e.contains(o)))}
function roots(){
  if(isMailPage())return[];
  const set=new Set();
  document.querySelectorAll('textarea,[contenteditable="true"]').forEach(input=>{
    if(!isChatComposer(input))return;
    let n=input;
    for(let i=0;n&&i<7;i++,n=n.parentElement){
      if(n===document.body)break;
      const r=n.getBoundingClientRect();
      const sig=n.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"],a[href*="profiles.php"]');
      if(sig&&r.width>=220&&r.height>=180&&r.width<=innerWidth*.98&&r.height<=innerHeight*.95){set.add(n);break}
    }
  });
  return[...set].filter(e=>e.isConnected);
}
function body(el,pl){const c=el.cloneNode(true);c.querySelectorAll('.slx-tools,#slx-ctx').forEach(x=>x.remove());let t=norm(c.innerText);if(pl.name&&t.startsWith(pl.name))t=norm(t.slice(pl.name.length));return t}
function id(root,el,pl,b){return el.dataset.messageId||el.id||hash((pl.id||pl.name)+'|'+b+'|'+String(root.className||''))}
function hideCtx(){ctx?.classList.remove('show');ctxData=null}
function ensureCtx(){if(ctx?.isConnected)return;ctx=document.createElement('div');ctx.id='slx-ctx';ctx.innerHTML='<button data-a="reply">↩</button><button data-a="id">ID</button><button data-a="name">N</button><button data-a="profile">↗</button><button data-a="close">×</button>';ctx.onclick=e=>{const b=e.target.closest('button');if(!b||!ctxData)return;const a=b.dataset.a,{root,pl}=ctxData;if(a==='close')hideCtx();else if(a==='reply'){const c=root.querySelector('textarea,[contenteditable="true"]');if(c&&pl.name){if('value'in c){c.value='@'+pl.name+' '+(c.value||'');c.dispatchEvent(new Event('input',{bubbles:true}))}else document.execCommand?.('insertText',false,'@'+pl.name+' ');c.focus()}hideCtx()}else if(a==='id'&&pl.id)navigator.clipboard?.writeText(pl.id);else if(a==='name'&&pl.name)navigator.clipboard?.writeText(pl.name);else if(a==='profile'&&pl.id)location.href='https://www.torn.com/profiles.php?XID='+pl.id};document.body.appendChild(ctx)}
function showCtx(root,el,pl){if(!S.quickActions||(!pl.id&&!pl.name))return;ensureCtx();ctxData={root,el,pl};ctx.querySelector('[data-a="id"]').disabled=!pl.id;ctx.querySelector('[data-a="profile"]').disabled=!pl.id;ctx.classList.add('show');requestAnimationFrame(()=>{const r=el.getBoundingClientRect(),b=ctx.getBoundingClientRect();ctx.style.left=Math.max(8,Math.min(innerWidth-b.width-8,r.right-b.width))+'px';let t=r.bottom+5;if(t+b.height>innerHeight-8)t=Math.max(8,r.top-b.height-5);ctx.style.top=t+'px'})}
function toast(title,text,key){if(!S.notifications||seen.has(key))return;seen.add(key);let st=document.getElementById('slx-toast');if(!st){st=document.createElement('div');st.id='slx-toast';document.body.appendChild(st)}const e=document.createElement('div');e.className='slx-toast';e.innerHTML='<b>'+title.replace(/[<>]/g,'')+'</b><span>'+text.replace(/[<>]/g,'').slice(0,150)+'</span>';st.appendChild(e);setTimeout(()=>e.remove(),3000)}
function decorate(root,el,suppress){
  const pl=p(el),b=body(el,pl);if(!b&&!pl.name)return;
  const key=id(root,el,pl,b);
  if(!bound.has(el)){
    bound.add(el);
    el.addEventListener('click',e=>{if(!e.target.closest('a,button,input,textarea,[contenteditable="true"]'))showCtx(root,el,pl)});
  }
  if(!suppress&&pl.name)toast(pl.name,b,key);else seen.add(key);
}
function toolbar(root){
  if(!S.search||isMailPage())return;
  const c=[...root.querySelectorAll('textarea,[contenteditable="true"]')].find(isChatComposer);
  if(!c)return;
  const existing=[...document.querySelectorAll('.slx-tools')].filter(t=>t.dataset.composerKey===String(c.dataset.slxComposerKey||''));
  if(c.dataset.slxToolbarBound==='1'){
    if(existing.length>1)existing.slice(1).forEach(e=>e.remove());
    return;
  }
  const key=c.dataset.slxComposerKey||('c'+Math.random().toString(36).slice(2));
  c.dataset.slxComposerKey=key;
  document.querySelectorAll('.slx-tools').forEach(t=>{if(t.dataset.composerKey===key)t.remove()});
  const t=document.createElement('div');
  t.className='slx-tools';
  t.dataset.composerKey=key;
  t.innerHTML='<button>🔎</button><input type="search" placeholder="Search loaded messages…"><span>0</span><button data-x>⛶</button>';
  const host=c.parentElement?.parentElement;
  if(!host)return;
  host.insertBefore(t,c.parentElement);
  c.dataset.slxToolbarBound='1';
  const i=t.querySelector('input'),count=t.querySelector('span');
  const run=()=>{
    const q=norm(i.value).toLowerCase(),ms=msgs(root);let n=0;
    ms.forEach(e=>{
      const pl=p(e),hit=!q||body(e,pl).toLowerCase().includes(q)||pl.name.toLowerCase().includes(q);
      if(q)e.style.setProperty('display',hit?'':'none','important');else e.style.removeProperty('display');
      if(q&&hit)n++;
    });
    count.textContent=q?n:ms.length;
  };
  i.oninput=run;t.firstElementChild.onclick=run;t.querySelector('[data-x]').onclick=()=>root.classList.toggle('slx-expand');
}
function enhance(root){toolbar(root);const first=!rootsSeen.has(root),m=msgs(root);m.forEach(e=>decorate(root,e,first));if(first)rootsSeen.add(root);const c=root.querySelector('.slx-tools span');if(c&&!root.querySelector('.slx-tools input')?.value)c.textContent=m.length}
function own(r){const t=r.target?.nodeType===1?r.target:r.target?.parentElement;if(t?.closest?.('.slx-tools,#slx-ctx,#slx-toast,#sakalux-chat-settings-overlay'))return true;const a=[...(r.addedNodes||[])].filter(n=>n.nodeType===1);return a.length&&a.every(n=>n.matches?.('.slx-tools,#slx-ctx,.slx-toast,#slx-toast,#sakalux-chat-settings-overlay')||n.closest?.('.slx-tools,#slx-ctx,#slx-toast,#sakalux-chat-settings-overlay'))}
function scan(){if(!S.enabled)return;if(isMailPage()){purgeStrayUi();bridge();return}roots().forEach(enhance);bridge()}
function start(){if(obs)return;obs=new MutationObserver(rs=>{for(const r of rs){if(r.type==='childList'&&r.addedNodes.length&&!own(r)){clearTimeout(timer);timer=setTimeout(scan,160);break}}});obs.observe(document.documentElement,{childList:true,subtree:true})}
function bridge(){let b=document.getElementById('sakalux-module-bridge-'+ID);if(!b){b=document.createElement('button');b.id='sakalux-module-bridge-'+ID;b.hidden=true;b.style.display='none';b.onclick=()=>{const a=b.dataset.action;if(a==='open')settings();else if(a==='on')enable(true);else if(a==='off')enable(false);b.dataset.action=''};document.documentElement.appendChild(b)}b.dataset.version=V;b.dataset.enabled=String(S.enabled);b.dataset.ready='true'}
function enable(v){S.enabled=!!v;save();if(S.enabled){start();scan()}else{obs?.disconnect();obs=null;hideCtx();document.querySelectorAll('.slx-tools').forEach(e=>e.remove())}bridge();return S.enabled}
function settings(){if(document.getElementById('sakalux-chat-settings-overlay'))return;const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button>×</button></header><main>'+[['enabled','Module enabled'],['search','Search'],['quickActions','Context actions'],['notifications','Notifications']].map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('')+'</main><footer>SakaLuX [2380374]</footer></section>';document.body.appendChild(o);o.querySelector('header button').onclick=()=>o.remove();o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{S[x.dataset.k]=x.checked;save();if(x.dataset.k==='enabled')enable(x.checked);else scan()})}
function css(){const s=document.createElement('style');s.id='sakalux-chat-style';s.textContent=`
.slx-tools{display:flex!important;gap:5px!important;align-items:center!important;padding:5px!important;border:1px solid #34485e!important;border-radius:9px!important;background:#111a24!important}.slx-tools button{height:32px!important;min-width:38px!important;background:#1a2634!important;color:#fff!important;border:1px solid #3a4c61!important;border-radius:7px!important}.slx-tools input{min-width:0!important;flex:1!important;height:32px!important;background:#101821!important;color:#fff!important;border:1px solid #33465c!important;border-radius:7px!important;padding:0 8px!important}.slx-expand{position:fixed!important;inset:5vh 3vw!important;width:94vw!important;height:90vh!important;z-index:2147483000!important;background:#0d131b!important}
#slx-ctx{position:fixed!important;z-index:2147483646!important;display:flex!important;gap:4px!important;padding:5px!important;background:#101821!important;border:1px solid #3b4d63!important;border-radius:10px!important;box-shadow:0 10px 30px #0009!important;opacity:0!important;visibility:hidden!important}#slx-ctx.show{opacity:1!important;visibility:visible!important}#slx-ctx button{min-width:35px!important;height:31px!important;background:#182432!important;color:#fff!important;border:1px solid #3a4b60!important;border-radius:7px!important}
#slx-toast{position:fixed!important;right:8px!important;top:65px!important;z-index:2147483647!important;width:min(320px,calc(100vw - 16px))!important}.slx-toast{margin-bottom:6px!important;padding:9px!important;background:#111a24!important;color:#fff!important;border:1px solid #3b4d63!important;border-radius:10px!important}.slx-toast b,.slx-toast span{display:block!important}.slx-toast span{font-size:10px!important;color:#a9b8c9!important}
#sakalux-chat-settings-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;background:#000b!important}#sakalux-chat-settings-overlay section{width:100%!important;background:#0f151d!important;color:#fff!important;border-radius:18px 18px 0 0!important}#sakalux-chat-settings-overlay header{display:flex!important;justify-content:space-between!important;padding:13px!important;background:#172331!important}#sakalux-chat-settings-overlay main{padding:10px!important}#sakalux-chat-settings-overlay label{display:flex!important;justify-content:space-between!important;padding:10px!important;margin-bottom:6px!important;background:#151e29!important;border:1px solid #2c3c50!important;border-radius:9px!important}#sakalux-chat-settings-overlay footer{text-align:center!important;padding:8px!important;color:#8fa3ba!important}
`;document.head.appendChild(s)}
window.addEventListener('scroll',hideCtx,true);window.addEventListener('resize',hideCtx);
function init(){purgeStrayUi();if(!document.getElementById('sakalux-chat-style'))css();bridge();window[API]={id:ID,version:V,open:settings,refresh:scan,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,health:()=>({id:ID,version:V,enabled:S.enabled,chatRoots:roots().length,messages:roots().reduce((n,r)=>n+msgs(r).length,0)})};if(S.enabled){start();scan();setTimeout(scan,1200)}window.dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:ID,version:V,apiGlobal:API}}))}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();
})();