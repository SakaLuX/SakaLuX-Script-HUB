// ==UserScript==
// @name         SakaLuX Chat Intelligence
// @namespace    sakalux.chat.intelligence
// @version      1.2.1
// @description  Native-style Torn chat controls: integrated search/maximize/export, favorites, local mute, aliases, mentions and notifications.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// ==/UserScript==
(()=>{'use strict';
const V='1.2.1',ID='chat-intelligence',API='SakaLuXChatIntelligence',
K='SLX_CHAT_CFG4',KP='SLX_CHAT_PEOPLE4',KF='SLX_CHAT_FAV4',KM='SLX_CHAT_MUTE4',
D={enabled:true,search:true,quickActions:true,notifications:true,notifyPM:true,notifyFaction:true,notifyCompany:true,mentionAutocomplete:true,exportSearch:true},
J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},
N=v=>String(v??'').replace(/\s+/g,' ').trim(),H=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
let S={...D,...J(K,{})},P=J(KP,{}),F=new Set(J(KF,[])),M=new Set(J(KM,[])),O,T,MENU,MD;
const SEEN=new Set(),ROOTS=new WeakSet(),BOUND=new WeakSet(),MENT=new WeakSet(),EXPAND_STATE=new WeakMap();
const save=()=>W(K,S),saveP=()=>{W(KP,P);W(KF,[...F]);W(KM,[...M])},pk=p=>p.id?'id:'+p.id:p.name?'name:'+p.name.toLowerCase():'',pd=p=>P[pk(p)]||{},dn=p=>pd(p).alias||p.name||(p.id?'Player '+p.id:'Unknown');

function who(e){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const m=(a.href||'').match(/[?&]XID=(\d+)/i);if(m)id=m[1];name=N(a.textContent)}if(!name)name=N(e.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"]')?.textContent);return{id,name}}
function comp(x){if(!x?.isConnected||!/type your message/i.test(N(x.getAttribute?.('placeholder'))))return false;let n=x;for(let i=0;n&&i<8;i++,n=n.parentElement){if(n===document.body)break;const r=n.getBoundingClientRect(),t=N(n.innerText).toLowerCase(),c=String(n.className||'').toLowerCase(),head=['faction','company','global','trade','new players','chat'].some(w=>t.includes(w))||c.includes('chat'),area=!!n.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"],a[href*="profiles.php"]');if(head&&area&&r.width>=220&&r.height>=160&&r.width<=innerWidth*.98&&r.height<=innerHeight*.96)return true}return false}
function roots(){const s=new Set;document.querySelectorAll('textarea,[contenteditable="true"]').forEach(x=>{if(!comp(x))return;let n=x;for(let i=0;n&&i<7;i++,n=n.parentElement){if(n===document.body)break;const r=n.getBoundingClientRect(),q=n.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"],a[href*="profiles.php"]');if(q&&r.width>=220&&r.height>=180){s.add(n);break}}});return[...s].filter(x=>x.isConnected)}
function okMsg(e){if(!e?.isConnected||e.closest('.slx-controls,.slx-search,.slx-mentions,#slx-menu,#slx-toast'))return false;if(e.querySelector('textarea,[contenteditable="true"]'))return false;const t=N(e.innerText);if(!t||t.length>2500)return false;const c=String(e.className||'').toLowerCase(),ok=e.hasAttribute('data-message-id')||e.hasAttribute('data-message')||c.includes('chatmessage')||c.includes('messageitem')||c.includes('messagerow')||!!e.querySelector('a[href*="profiles.php"],a[href*="XID="]');if(!ok)return false;return !e.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"]')}
function msgs(r){const q='[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="message-item"],[class*="messageRow"],[class*="message-row"]';let a=[...r.querySelectorAll(q)].filter(okMsg);if(!a.length)a=[...r.querySelectorAll('a[href*="profiles.php"],a[href*="XID="]')].map(x=>x.closest('div,section,article')).filter(okMsg);return a.filter((e,i)=>!a.some((o,j)=>j!==i&&e.contains(o)))}
function body(e,p){let t=N(e.innerText);if(p.name&&t.startsWith(p.name))t=N(t.slice(p.name.length));return t}
function chan(r){const t=N(r.innerText).toLowerCase();return t.includes('faction')?'faction':t.includes('company')?'company':'pm'}
function allow(r){const c=chan(r);return c==='faction'?S.notifyFaction:c==='company'?S.notifyCompany:S.notifyPM}
function toast(t,b,k){if(!S.notifications||SEEN.has(k))return;SEEN.add(k);let s=document.getElementById('slx-toast');if(!s){s=document.createElement('div');s.id='slx-toast';document.body.appendChild(s)}const e=document.createElement('div');e.className='slx-toast';e.innerHTML='<b>'+t.replace(/[<>]/g,'')+'</b><span>'+b.replace(/[<>]/g,'').slice(0,150)+'</span>';s.appendChild(e);setTimeout(()=>e.remove(),2800)}
function hideMenu(){MENU?.classList.remove('show');MD=null}
function menu(){if(MENU?.isConnected)return;MENU=document.createElement('div');MENU.id='slx-menu';MENU.innerHTML='<button data-a="fav">☆</button><button data-a="reply">↩</button><button data-a="id">ID</button><button data-a="name">N</button><button data-a="profile">↗</button><button data-a="mute">🔇</button><button data-a="alias">✎</button><button data-a="close">×</button>';MENU.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!MD)return;const a=b.dataset.a,{r,e:el,p}=MD,k=pk(p);if(a==='close')return hideMenu();if(a==='fav'){F.has(k)?F.delete(k):F.add(k);saveP();return showMenu(r,el,p)}if(a==='mute'){M.has(k)?M.delete(k):M.add(k);saveP();return showMenu(r,el,p)}if(a==='reply'){const c=[...r.querySelectorAll('textarea,[contenteditable="true"]')].find(comp);if(c&&p.name){c.value='@'+p.name+' '+(c.value||'');c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}return hideMenu()}if(a==='id'&&p.id)return navigator.clipboard?.writeText(p.id);if(a==='name'&&p.name)return navigator.clipboard?.writeText(p.name);if(a==='profile'&&p.id)return location.href='https://www.torn.com/profiles.php?XID='+p.id;if(a==='alias'){const d=pd(p),al=prompt('Alias',d.alias||'');if(al===null)return;P[k]={...d,alias:N(al)};saveP();hideMenu()}};document.body.appendChild(MENU)}
function showMenu(r,e,p){if(!S.quickActions||(!p.id&&!p.name))return;menu();MD={r,e,p};const k=pk(p);MENU.querySelector('[data-a="fav"]').textContent=F.has(k)?'★':'☆';MENU.querySelector('[data-a="mute"]').textContent=M.has(k)?'🔈':'🔇';MENU.querySelector('[data-a="id"]').disabled=!p.id;MENU.querySelector('[data-a="profile"]').disabled=!p.id;MENU.classList.add('show');requestAnimationFrame(()=>{const x=e.getBoundingClientRect(),m=MENU.getBoundingClientRect();MENU.style.left=Math.max(8,Math.min(innerWidth-m.width-8,x.right-m.width))+'px';let y=x.bottom+4;if(y+m.height>innerHeight-8)y=Math.max(8,x.top-m.height-4);MENU.style.top=y+'px'})}
function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b);if(!b&&!p.name)return;if(!BOUND.has(e)){BOUND.add(e);e.addEventListener('click',x=>{if(!x.target.closest('a,button,input,textarea,[contenteditable="true"]'))showMenu(r,e,p)})}if(first||!p.name||!allow(r)||M.has(pk(p))){SEEN.add(k);return}toast((F.has(pk(p))?'★ ':'')+dn(p),b,k)}
function closeSearch(reset=true){document.querySelectorAll('.slx-search').forEach(p=>{if(reset){const r=p._root,q=p.querySelector('input');if(r&&q){q.value='';msgs(r).forEach(e=>e.style.removeProperty('display'))}}p.remove()})}
function searchBox(r,c){closeSearch(false);const p=document.createElement('div');p.className='slx-search';p._root=r;p.innerHTML='<input placeholder="Search messages…"><span>0</span><button data-e>⇩</button><button data-c>×</button>';document.body.appendChild(p);const cr=c.getBoundingClientRect(),w=Math.min(Math.max(260,cr.width),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,cr.left))+'px';p.style.top=Math.max(8,cr.top-40)+'px';const i=p.querySelector('input'),n=p.querySelector('span'),run=()=>{const q=N(i.value).toLowerCase(),m=msgs(r);let z=0;m.forEach(e=>{const pl=who(e),hit=!q||body(e,pl).toLowerCase().includes(q)||dn(pl).toLowerCase().includes(q);if(q)e.style.setProperty('display',hit?'':'none','important');else e.style.removeProperty('display');if(q&&hit)z++});n.textContent=q?z:m.length};i.oninput=run;p.querySelector('[data-c]').onclick=()=>closeSearch(true);const ex=p.querySelector('[data-e]');ex.hidden=!S.exportSearch;ex.onclick=()=>{const q=N(i.value).toLowerCase(),rows=msgs(r).filter(e=>{const pl=who(e);return!q||body(e,pl).toLowerCase().includes(q)||dn(pl).toLowerCase().includes(q)}).map(e=>{const pl=who(e);return dn(pl)+(pl.id?' ['+pl.id+']':'')+': '+body(e,pl)}),blob=new Blob([rows.join('\n')],{type:'text/plain'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='SakaLuX-chat-'+Date.now()+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),500)};run();i.focus()}

function findMessageViewport(r,c){
  const ms=msgs(r);
  if(!ms.length)return null;
  let best=null,bestScore=-1;
  const first=ms[0];

  let n=first.parentElement;
  while(n&&n!==r){
    const rr=n.getBoundingClientRect();
    const cs=getComputedStyle(n);
    const scrollish=(n.scrollHeight>n.clientHeight+8)||['auto','scroll'].includes(cs.overflowY);
    const containsComposer=n.contains(c);
    const score=(scrollish?1000:0)+rr.width*rr.height-(containsComposer?1e8:0);
    if(rr.width>180&&rr.height>80&&score>bestScore){
      best=n;bestScore=score;
    }
    n=n.parentElement;
  }

  if(best)return best;

  const candidates=[...r.querySelectorAll('div,section')].filter(x=>{
    if(x.contains(c))return false;
    const rr=x.getBoundingClientRect();
    return rr.width>180&&rr.height>80&&ms.some(m=>x.contains(m));
  });
  candidates.sort((a,b)=>{
    const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    return (br.width*br.height)-(ar.width*ar.height);
  });
  return candidates[0]||null;
}

function restoreStyle(el,snapshot){
  if(!el||!snapshot)return;
  el.setAttribute('style',snapshot.style||'');
  if(!snapshot.style)el.removeAttribute('style');
}

function toggleMaximize(r,c,btn){
  if(!r||!c)return;

  if(EXPAND_STATE.has(r)){
    const st=EXPAND_STATE.get(r);
    restoreStyle(r,st.root);
    restoreStyle(st.composerHost,st.composer);
    restoreStyle(st.viewport,st.viewportStyle);
    r.classList.remove('slx-maximized');
    EXPAND_STATE.delete(r);
    btn.textContent='⛶';
    closeSearch(false);
    return;
  }

  const composerHost=c.parentElement;
  const viewport=findMessageViewport(r,c);
  if(!composerHost||!viewport)return;

  EXPAND_STATE.set(r,{
    root:{style:r.getAttribute('style')||''},
    composerHost,
    composer:{style:composerHost.getAttribute('style')||''},
    viewport,
    viewportStyle:{style:viewport.getAttribute('style')||''}
  });

  const rr=r.getBoundingClientRect();
  const vr=viewport.getBoundingClientRect();
  const topOffset=Math.max(42,vr.top-rr.top);

  Object.assign(r.style,{
    position:'fixed',
    left:'8px',
    right:'8px',
    top:'58px',
    bottom:'58px',
    width:'auto',
    height:'auto',
    maxWidth:'none',
    maxHeight:'none',
    zIndex:'2147482990',
    overflow:'hidden',
    background:'#101820'
  });

  Object.assign(composerHost.style,{
    position:'absolute',
    left:'6px',
    right:'6px',
    bottom:'6px',
    width:'auto',
    zIndex:'25'
  });

  const composerHeight=Math.max(44,composerHost.getBoundingClientRect().height);

  Object.assign(viewport.style,{
    position:'absolute',
    left:'6px',
    right:'6px',
    top:topOffset+'px',
    bottom:(composerHeight+12)+'px',
    width:'auto',
    height:'auto',
    maxHeight:'none',
    overflowY:'auto'
  });

  r.classList.add('slx-maximized');
  btn.textContent='⤢';
  closeSearch(false);
}


function controls(r){
  const c=[...r.querySelectorAll('textarea,[contenteditable="true"]')].find(comp);
  if(!c)return;

  const h=c.parentElement;
  if(!h)return;

  if(getComputedStyle(h).position==='static')h.style.position='relative';

  let x=h.querySelector(':scope>.slx-controls');
  if(!x){
    x=document.createElement('div');
    x.className='slx-controls';
    x.innerHTML='<button data-s title="Search">🔎</button><button data-m title="Maximize">⛶</button><button data-e title="Export">⇩</button>';
    h.appendChild(x);

    const currentTop=parseFloat(getComputedStyle(c).paddingTop)||0;
    if(!c.dataset.slxOrigPaddingTop)c.dataset.slxOrigPaddingTop=String(currentTop);
    c.style.paddingTop=Math.max(currentTop,34)+'px';

    x.querySelector('[data-s]').onclick=e=>{
      e.preventDefault();e.stopPropagation();
      searchBox(r,c);
    };

    x.querySelector('[data-m]').onclick=e=>{
      e.preventDefault();e.stopPropagation();
      toggleMaximize(r,c,e.currentTarget);
    };

    x.querySelector('[data-e]').hidden=!S.exportSearch;
    x.querySelector('[data-e]').onclick=e=>{
      e.preventDefault();e.stopPropagation();
      searchBox(r,c);
      setTimeout(()=>document.querySelector('.slx-search [data-e]')?.click(),0);
    };
  }else{
    x.querySelector('[data-e]').hidden=!S.exportSearch;
    x.querySelector('[data-m]').textContent=EXPAND_STATE.has(r)?'⤢':'⛶';
  }
}
function mentions(r){if(!S.mentionAutocomplete)return;const c=[...r.querySelectorAll('textarea,[contenteditable="true"]')].find(comp);if(!c||MENT.has(c))return;MENT.add(c);const b=document.createElement('div');b.className='slx-mentions';b.hidden=true;(c.parentElement||r).appendChild(b);c.addEventListener('input',()=>{const v=c.value??'',m=v.match(/(^|\s)@([\w .'-]*)$/);if(!m){b.hidden=true;return}const q=m[2].toLowerCase(),map=new Map;msgs(r).forEach(e=>{const p=who(e),k=pk(p);if(p.name&&!map.has(k))map.set(k,p)});const a=[...map.values()].filter(p=>!q||p.name.toLowerCase().includes(q)||dn(p).toLowerCase().includes(q)).slice(0,6);b.innerHTML='';a.forEach(p=>{const x=document.createElement('button');x.textContent=dn(p);x.onmousedown=e=>{e.preventDefault();const now=c.value??'',mm=now.match(/(^|\s)@([\w .'-]*)$/);if(mm){c.value=now.slice(0,now.length-mm[2].length)+p.name+' ';c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}b.hidden=true};b.appendChild(x)});b.hidden=!a.length})}
function enhance(r){controls(r);mentions(r);const first=!ROOTS.has(r),m=msgs(r);m.forEach(e=>decorate(r,e,first));if(first)ROOTS.add(r)}
function clean(){
  document.querySelectorAll('.slx-controls').forEach(x=>{
    const h=x.parentElement;
    const c=h?.querySelector('textarea,[contenteditable="true"]');
    if(!c||!comp(c)){
      if(c&&c.dataset.slxOrigPaddingTop!==undefined){
        c.style.paddingTop=c.dataset.slxOrigPaddingTop+'px';
        delete c.dataset.slxOrigPaddingTop;
      }
      x.remove();
    }
  });
  if(!roots().length)closeSearch(false);
}
function own(m){const t=m.target?.nodeType===1?m.target:m.target?.parentElement;return!!t?.closest?.('.slx-controls,.slx-search,.slx-mentions,#slx-menu,#slx-toast,#sakalux-chat-settings-overlay')}
function scan(){if(!S.enabled)return;clean();roots().forEach(enhance);bridge()}
function start(){if(O)return;O=new MutationObserver(a=>{if(a.some(m=>m.type==='childList'&&m.addedNodes.length&&!own(m))){clearTimeout(T);T=setTimeout(scan,180)}});O.observe(document.documentElement,{childList:true,subtree:true})}
function bridge(){let b=document.getElementById('sakalux-module-bridge-'+ID);if(!b){b=document.createElement('button');b.id='sakalux-module-bridge-'+ID;b.hidden=true;b.style.display='none';b.onclick=()=>{const a=b.dataset.action;if(a==='open')settings();else if(a==='on')enable(true);else if(a==='off')enable(false);else if(a==='toggle')enable(!S.enabled);b.dataset.action=''};document.documentElement.appendChild(b)}b.dataset.version=V;b.dataset.enabled=String(S.enabled);b.dataset.ready='true'}
function enable(v){
  S.enabled=!!v;save();
  if(S.enabled){
    start();scan();
  }else{
    O?.disconnect();O=null;hideMenu();closeSearch(true);
    roots().forEach(r=>{
      if(EXPAND_STATE.has(r)){
        const c=[...r.querySelectorAll('textarea,[contenteditable="true"]')].find(comp);
        const btn=r.querySelector('.slx-controls [data-m]')||document.querySelector('.slx-controls [data-m]');
        if(c)toggleMaximize(r,c,btn||{textContent:''});
      }
    });
    document.querySelectorAll('.slx-controls').forEach(x=>{
      const c=x.parentElement?.querySelector('textarea,[contenteditable="true"]');
      if(c&&c.dataset.slxOrigPaddingTop!==undefined){
        c.style.paddingTop=c.dataset.slxOrigPaddingTop+'px';
        delete c.dataset.slxOrigPaddingTop;
      }
      x.remove();
    });
    document.querySelectorAll('.slx-mentions').forEach(e=>e.remove());
  }
  bridge();return S.enabled;
}
function settings(){if(document.getElementById('sakalux-chat-settings-overlay'))return;const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';const a=[['enabled','Module enabled'],['search','Search'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete'],['exportSearch','Export search']];o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button>×</button></header><main>'+a.map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('')+'</main></section>';document.body.appendChild(o);o.querySelector('header button').onclick=()=>o.remove();o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{S[x.dataset.k]=x.checked;save();if(x.dataset.k==='enabled')enable(x.checked);else scan()})}
function css(){const s=document.createElement('style');s.textContent=`
.slx-controls{position:absolute!important;left:6px!important;right:40px!important;top:4px!important;height:26px!important;z-index:40!important;display:flex!important;justify-content:flex-end!important;align-items:center!important;gap:3px!important;pointer-events:none!important}
.slx-controls button{pointer-events:auto!important;width:25px!important;min-width:25px!important;height:24px!important;padding:0!important;border:1px solid #4a5662!important;border-radius:4px!important;background:rgba(37,43,49,.94)!important;color:#ddd!important;font-size:10px!important;line-height:22px!important}
.slx-search{position:fixed!important;z-index:2147483300!important;box-sizing:border-box!important;display:flex!important;gap:3px!important;align-items:center!important;padding:4px!important;border:1px solid #465462!important;border-radius:6px!important;background:#20262c!important;box-shadow:0 7px 20px #0009!important}
.slx-search input{flex:1!important;min-width:0!important;height:30px!important;padding:0 7px!important;border:1px solid #45515d!important;border-radius:4px!important;background:#171d22!important;color:#eee!important;font-size:11px!important}
.slx-search span{min-width:22px!important;text-align:center!important;color:#aaa!important;font-size:10px!important}.slx-search button{width:28px!important;min-width:28px!important;height:28px!important;border:1px solid #4a5662!important;border-radius:4px!important;background:#303840!important;color:#eee!important}
.slx-maximized{border:1px solid #465462!important;border-radius:8px!important;box-shadow:0 14px 40px #000c!important}
#slx-menu{position:fixed!important;z-index:2147483646!important;display:flex!important;gap:3px!important;padding:4px!important;border:1px solid #485563!important;border-radius:6px!important;background:#20262c!important;box-shadow:0 5px 16px #0009!important;opacity:0!important;visibility:hidden!important;max-width:calc(100vw - 16px)!important;overflow-x:auto!important}#slx-menu.show{opacity:1!important;visibility:visible!important}#slx-menu button{flex:0 0 auto!important;min-width:31px!important;height:28px!important;border:1px solid #4a5662!important;border-radius:4px!important;background:#303840!important;color:#eee!important}
.slx-mentions{position:absolute!important;left:4px!important;right:4px!important;bottom:42px!important;z-index:2147483200!important;max-height:160px!important;overflow:auto!important;padding:4px!important;border:1px solid #465462!important;border-radius:6px!important;background:#20262c!important}.slx-mentions button{display:block!important;width:100%!important;padding:6px!important;border:0!important;border-bottom:1px solid #39434d!important;background:transparent!important;color:#eee!important;text-align:left!important}
#slx-toast{position:fixed!important;right:8px!important;top:65px!important;z-index:2147483647!important;width:min(300px,calc(100vw - 16px))!important}.slx-toast{margin-bottom:5px!important;padding:8px!important;border:1px solid #465462!important;border-radius:6px!important;background:#20262c!important;color:#eee!important}.slx-toast b,.slx-toast span{display:block!important}.slx-toast span{font-size:10px!important;color:#aaa!important}
#sakalux-chat-settings-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;background:#000b!important}#sakalux-chat-settings-overlay section{width:100%!important;background:#171c21!important;color:#eee!important;border-radius:14px 14px 0 0!important}#sakalux-chat-settings-overlay header{display:flex!important;justify-content:space-between!important;padding:11px!important;background:#242b32!important}#sakalux-chat-settings-overlay main{padding:8px!important}#sakalux-chat-settings-overlay label{display:flex!important;justify-content:space-between!important;padding:8px!important;margin-bottom:5px!important;border:1px solid #39434d!important;border-radius:6px!important;background:#20262c!important}
`;document.head.appendChild(s)}
addEventListener('scroll',()=>{hideMenu();closeSearch(false);clean()},true);addEventListener('resize',()=>{hideMenu();closeSearch(false);clean()});
function init(){css();bridge();window[API]={id:ID,version:V,open:settings,refresh:scan,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,health:()=>({version:V,roots:roots().length,favorites:F.size,muted:M.size})};if(S.enabled){start();scan();setTimeout(scan,900)}dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:ID,version:V,apiGlobal:API}}))}
document.readyState==='loading'?addEventListener('DOMContentLoaded',init,{once:true}):init();
})();