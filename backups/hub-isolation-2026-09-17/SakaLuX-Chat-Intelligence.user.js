// ==UserScript==
// @name         SakaLuX Chat Intelligence
// @namespace    sakalux.chat.intelligence
// @version      1.2.13
// @description  Torn chat intelligence with controls visually integrated into the native Chat V3 title bar.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Chat-Intelligence.user.js
// ==/UserScript==
(()=>{'use strict';
  // SakaLuX shared mobile top-alignment contract.
  (() => {
    const id='sakalux-global-top-align-v3';
    if(document.getElementById(id)) return;
    const st=document.createElement('style');
    st.id=id;
    st.textContent=`@media(max-width:700px){
body [id^="sakalux-"][id*="overlay"],body [id^="sakalux-"][id*="modal"],
body [id^="slx-"][id*="overlay"],body [id^="slx-"][id*="modal"],
body [id^="sl-"][id*="overlay"],body [id^="sl-"][id*="modal"],
#sl-eg-overlay,#sl-mr-settings-overlay,#sl-mi-overlay,#ci-root{
 align-items:flex-start!important;justify-content:center!important;padding-top:0!important;margin-top:0!important;
}
body [id^="sakalux-"][id*="panel"],body [id^="slx-"][id*="panel"],body [id^="sl-"][id*="panel"],
#sl-eg-panel,#sl-mr-settings-panel,#sl-mi-panel,#ci-root .ci-shell{
 margin-top:0!important;align-self:flex-start!important;
}
}`;
    (document.head||document.documentElement).appendChild(st);
  })();


  // Shared SakaLuX performance + Hub-style UI foundation.
  (() => {
    const g = window;
    if (!g.SakaLuXPerf) {
      const timers = new Map();
      g.SakaLuXPerf = {
        debounce(key, fn, wait=220) {
          const old = timers.get(key); if (old) clearTimeout(old);
          const id = setTimeout(() => { timers.delete(key); fn(); }, Math.max(120, wait));
          timers.set(key,id); return id;
        },
        idle(fn, timeout=700) {
          if ('requestIdleCallback' in g) return g.requestIdleCallback(fn,{timeout});
          return setTimeout(fn,32);
        }
      };
    }
    if (!document.getElementById('sakalux-shared-hub-skin')) {
      const st=document.createElement('style');
      st.id='sakalux-shared-hub-skin';
      st.textContent=`
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"] button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"] button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"][id*="panel"],body [id*="sakalux"][id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"] .header,body [id^="sakalux-"] .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"] .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"] button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head||document.documentElement).appendChild(st);
    }
  })();

const V='1.2.13',ID='chat-intelligence',API='SakaLuXChatIntelligence';
const K='SLX_CHAT_CFG4',KP='SLX_CHAT_PEOPLE4',KF='SLX_CHAT_FAV4',KM='SLX_CHAT_MUTE4';
const D={enabled:true,search:true,quickActions:true,notifications:true,notifyPM:true,notifyFaction:true,notifyCompany:true,mentionAutocomplete:true,exportSearch:true};
const J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},N=v=>String(v??'').replace(/\s+/g,' ').trim(),H=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(36)};
let S={...D,...J(K,{})},P=J(KP,{}),F=new Set(J(KF,[])),M=new Set(J(KM,[])),O,T,MENU,MD;
const ROOTS=new WeakSet(),BOUND=new WeakSet(),MENT=new WeakSet(),SEEN=new Set(),MAX=new WeakMap(),HEADER_STYLE=new WeakMap();
const save=()=>W(K,S),saveP=()=>{W(KP,P);W(KF,[...F]);W(KM,[...M])},pk=p=>p.id?'id:'+p.id:p.name?'name:'+p.name.toLowerCase():'',pd=p=>P[pk(p)]||{},dn=p=>pd(p).alias||p.name||(p.id?'Player '+p.id:'Unknown');
function composer(){return[...document.querySelectorAll('textarea,[contenteditable="true"]')].filter(x=>/type your message/i.test(N(x.getAttribute?.('placeholder'))))}
function rootFor(c){for(let n=c.parentElement,i=0;n&&i<10;i++,n=n.parentElement){if(n===document.body)break;const r=n.getBoundingClientRect(),hasMsg=!!n.querySelector('[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="messageRow"],a[href*="profiles.php"],a[href*="XID="]');if(hasMsg&&r.width>=220&&r.height>=180&&r.width<=innerWidth*.99&&r.height<=innerHeight*.98)return n}return null}
function roots(){const a=[];composer().forEach(c=>{const r=rootFor(c);if(r&&!a.includes(r))a.push(r)});return a}
function who(e){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');let id='',name='';if(a){const m=(a.href||'').match(/[?&]XID=(\d+)/i);if(m)id=m[1];name=N(a.textContent)}if(!name)name=N(e.querySelector('[class*="sender"],[class*="author"],[class*="username"],[class*="playerName"]')?.textContent);return{id,name}}
function okMsg(e){if(!e?.isConnected||e.closest('.slx-head-controls,.slx-search,.slx-mentions,#slx-menu,.slx-toast-host'))return false;if(e.querySelector('textarea,[contenteditable="true"]'))return false;const t=N(e.innerText);if(!t||t.length>2500)return false;const c=String(e.className||'').toLowerCase();return e.hasAttribute('data-message-id')||e.hasAttribute('data-message')||c.includes('chatmessage')||c.includes('messageitem')||c.includes('messagerow')||!!e.querySelector('a[href*="profiles.php"],a[href*="XID="]')}
function msgs(r){const q='[data-message-id],[data-message],[class*="chatMessage"],[class*="messageItem"],[class*="message-item"],[class*="messageRow"],[class*="message-row"]';let a=[...r.querySelectorAll(q)].filter(okMsg);if(!a.length)a=[...r.querySelectorAll('a[href*="profiles.php"],a[href*="XID="]')].map(x=>x.closest('div,section,article')).filter(okMsg);return a.filter((e,i)=>!a.some((o,j)=>j!==i&&e.contains(o)))}
function body(e,p){let t=N(e.innerText);if(p.name&&t.startsWith(p.name))t=N(t.slice(p.name.length));return t}
function chan(r){const t=N(r.innerText).toLowerCase();return t.includes('faction')?'faction':t.includes('company')?'company':'pm'}
function allow(r){const c=chan(r);return c==='faction'?S.notifyFaction:c==='company'?S.notifyCompany:S.notifyPM}
function toast(r,t,b,k){if(!S.notifications||SEEN.has(k))return;SEEN.add(k);let h=r.querySelector(':scope>.slx-toast-host');if(!h){h=document.createElement('div');h.className='slx-toast-host';r.appendChild(h)}const e=document.createElement('div');e.className='slx-toast';e.innerHTML='<b>'+t.replace(/[<>]/g,'')+'</b><span>'+b.replace(/[<>]/g,'').slice(0,150)+'</span>';h.appendChild(e);setTimeout(()=>{e.remove();if(!h.childElementCount)h.remove()},2800)}
function exportMessages(r,q=''){const s=N(q).toLowerCase(),rows=msgs(r).filter(e=>{const p=who(e);return !s||body(e,p).toLowerCase().includes(s)||dn(p).toLowerCase().includes(s)}).map(e=>{const p=who(e);return dn(p)+(p.id?' ['+p.id+']':'')+': '+body(e,p)}),blob=new Blob([rows.join('\n')],{type:'text/plain;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='SakaLuX-chat-'+Date.now()+'.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),500)}
function closeSearch(reset=true){document.querySelectorAll('.slx-search').forEach(p=>{if(reset&&p._root)msgs(p._root).forEach(e=>e.style.removeProperty('display'));p.remove()})}
function searchBox(r){closeSearch(false);const p=document.createElement('div');p.className='slx-search';p._root=r;p.innerHTML='<div class="slx-search-title"><span>Search chat</span><button data-c>×</button></div><div class="slx-search-row"><input type="search" placeholder="Name or message…"><span data-count>0</span><button data-e>⇩</button></div>';document.body.appendChild(p);const place=()=>{const rr=r.getBoundingClientRect(),w=Math.min(Math.max(280,rr.width-16),innerWidth-16);p.style.width=w+'px';p.style.left=Math.max(8,Math.min(innerWidth-w-8,rr.left+8))+'px';p.style.top=Math.max(8,Math.min(innerHeight-p.offsetHeight-8,rr.top+44))+'px'};p._place=place;const i=p.querySelector('input'),n=p.querySelector('[data-count]');const run=()=>{const q=N(i.value).toLowerCase(),m=msgs(r);let z=0;m.forEach(e=>{const pl=who(e),hit=!q||body(e,pl).toLowerCase().includes(q)||dn(pl).toLowerCase().includes(q);if(q)e.style.setProperty('display',hit?'':'none','important');else e.style.removeProperty('display');if(q&&hit)z++});n.textContent=q?z:m.length};i.oninput=run;p.querySelector('[data-c]').onclick=()=>{i.value='';run();p.remove()};p.querySelector('[data-e]').onclick=()=>exportMessages(r,i.value);place();run();i.focus()}
function viewport(r,c){const m=msgs(r);if(!m.length)return null;let best=null,bestScore=-1;for(let n=m[0].parentElement;n&&n!==r;n=n.parentElement){const rr=n.getBoundingClientRect(),cs=getComputedStyle(n),scroll=n.scrollHeight>n.clientHeight+8||['auto','scroll'].includes(cs.overflowY),score=(scroll?1000:0)+rr.width*rr.height-(n.contains(c)?1e8:0);if(rr.width>180&&rr.height>80&&score>bestScore){best=n;bestScore=score}}return best}
function toggleMax(r,c,b){if(MAX.has(r)){const s=MAX.get(r);r.setAttribute('style',s.r);s.ch.setAttribute('style',s.c);s.v.setAttribute('style',s.vs);MAX.delete(r);b.textContent='⛶';return}const ch=c.parentElement,v=viewport(r,c);if(!ch||!v)return;MAX.set(r,{r:r.getAttribute('style')||'',ch,c:ch.getAttribute('style')||'',v,vs:v.getAttribute('style')||''});Object.assign(r.style,{position:'fixed',left:'8px',right:'8px',top:'58px',bottom:'58px',width:'auto',height:'auto',zIndex:'2147482990',overflow:'hidden'});Object.assign(ch.style,{position:'absolute',left:'6px',right:'6px',bottom:'6px',width:'auto',zIndex:'25'});Object.assign(v.style,{position:'absolute',left:'6px',right:'6px',top:'44px',bottom:(Math.max(44,ch.getBoundingClientRect().height)+12)+'px',height:'auto',overflowY:'auto'});b.textContent='⤢'}
function findHeader(r,c){const rr=r.getBoundingClientRect(),cr=c.getBoundingClientRect();let scope=r;for(let i=0;i<4&&scope.parentElement&&scope.parentElement!==document.body;i++)scope=scope.parentElement;let best=null,bestScore=-1;for(const e of scope.querySelectorAll('header,div,section')){if(e===r||e.closest('.slx-head-controls'))continue;const er=e.getBoundingClientRect();if(er.width<rr.width*.72||er.width>rr.width*1.2||er.height<36||er.height>78)continue;if(er.bottom>cr.top-24)continue;if(er.top<rr.top-120||er.top>rr.top+28)continue;if(Math.abs(er.left-rr.left)>48)continue;if(e.querySelector('textarea,[contenteditable="true"]'))continue;const t=N(e.innerText);if(!t||t.length>140)continue;let s=0;s+=Math.max(0,100-Math.abs(er.width-rr.width));s+=Math.max(0,80-Math.min(Math.abs(er.top-rr.top),Math.abs(er.bottom-rr.top)));s+=Math.max(0,50-Math.abs(er.left-rr.left));if([...e.querySelectorAll('button,[role="button"],a,span,div')].some(x=>/^(—|−|-|_)$/.test(N(x.textContent))))s+=90;if(/touching grass|faction|company|chat|trade|global/i.test(t))s+=30;if(s>bestScore){best=e;bestScore=s}}
return bestScore>=80?best:null}
function bindButton(b,fn){b.onclick=e=>{e.preventDefault();e.stopPropagation();fn(e.currentTarget)};b.addEventListener('pointerdown',e=>e.stopPropagation(),{passive:true});b.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true})}
function controls(r){const c=composer().find(x=>rootFor(x)===r);if(!c)return;const h=findHeader(r,c);let x=document.querySelector('.slx-head-controls[data-root="'+(r.dataset.slxRootId||'')+'"]');if(!r.dataset.slxRootId)r.dataset.slxRootId='slx'+Math.random().toString(36).slice(2,8);if(!x)x=[...document.querySelectorAll('.slx-head-controls')].find(z=>z._root===r);if(!h){x?.remove();return}if(getComputedStyle(h).position==='static'){if(!HEADER_STYLE.has(h))HEADER_STYLE.set(h,h.getAttribute('style')||'');h.style.position='relative'}if(!x||x.parentElement!==h){x?.remove();x=document.createElement('div');x.className='slx-head-controls';x._root=r;x.dataset.root=r.dataset.slxRootId;x.innerHTML='<button data-s title="Search">🔎</button><button data-m title="Maximize">⛶</button><button data-e title="Export">⇩</button>';h.appendChild(x);bindButton(x.querySelector('[data-s]'),()=>searchBox(r));bindButton(x.querySelector('[data-m]'),b=>toggleMax(r,c,b));bindButton(x.querySelector('[data-e]'),()=>exportMessages(r,''))}x.querySelector('[data-e]').hidden=!S.exportSearch;const mb=x.querySelector('[data-m]');if(mb)mb.textContent=MAX.has(r)?'⤢':'⛶'}
function hideMenu(){MENU?.classList.remove('show');MD=null}
function menu(){if(MENU?.isConnected)return;MENU=document.createElement('div');MENU.id='slx-menu';MENU.innerHTML='<button data-a="fav">☆</button><button data-a="reply">↩</button><button data-a="id">ID</button><button data-a="name">N</button><button data-a="profile">↗</button><button data-a="mute">🔇</button><button data-a="alias">✎</button><button data-a="close">×</button>';document.body.appendChild(MENU);MENU.onclick=e=>{const b=e.target.closest('button[data-a]');if(!b||!MD)return;const a=b.dataset.a,{r,p}=MD,k=pk(p);if(a==='close')return hideMenu();if(a==='fav'){F.has(k)?F.delete(k):F.add(k);saveP();return}if(a==='mute'){M.has(k)?M.delete(k):M.add(k);saveP();return}if(a==='reply'){const c=composer().find(x=>rootFor(x)===r);if(c&&p.name){c.value='@'+p.name+' '+(c.value||'');c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}return hideMenu()}if(a==='id'&&p.id)return navigator.clipboard?.writeText(p.id);if(a==='name'&&p.name)return navigator.clipboard?.writeText(p.name);if(a==='profile'&&p.id)return location.href='https://www.torn.com/profiles.php?XID='+p.id;if(a==='alias'){const d=pd(p),al=prompt('Alias',d.alias||'');if(al!==null){P[k]={...d,alias:N(al)};saveP()}hideMenu()}}}
function showMenu(r,e,p){if(!S.quickActions||(!p.id&&!p.name))return;menu();MD={r,e,p};const k=pk(p);MENU.querySelector('[data-a="fav"]').textContent=F.has(k)?'★':'☆';MENU.querySelector('[data-a="mute"]').textContent=M.has(k)?'🔈':'🔇';MENU.classList.add('show');const x=e.getBoundingClientRect(),m=MENU.getBoundingClientRect();MENU.style.left=Math.max(8,Math.min(innerWidth-m.width-8,x.right-m.width))+'px';MENU.style.top=Math.max(8,Math.min(innerHeight-m.height-8,x.bottom+4))+'px'}
function decorate(r,e,first){const p=who(e),b=body(e,p),k=e.dataset.messageId||e.id||H((p.id||p.name)+'|'+b);if(!BOUND.has(e)){BOUND.add(e);e.onclick=x=>{if(!x.target.closest('a,button,input,textarea,[contenteditable="true"]'))showMenu(r,e,p)}}if(first||!p.name||!allow(r)||M.has(pk(p))){SEEN.add(k);return}toast(r,(F.has(pk(p))?'★ ':'')+dn(p),b,k)}
function mentions(r){if(!S.mentionAutocomplete)return;const c=composer().find(x=>rootFor(x)===r);if(!c||MENT.has(c))return;MENT.add(c);const b=document.createElement('div');b.className='slx-mentions';b.hidden=true;(c.parentElement||r).appendChild(b);c.addEventListener('input',()=>{const v=c.value??'',m=v.match(/(^|\s)@([\w .'-]*)$/);if(!m){b.hidden=true;return}const q=m[2].toLowerCase(),map=new Map;msgs(r).forEach(e=>{const p=who(e),k=pk(p);if(p.name&&!map.has(k))map.set(k,p)});const a=[...map.values()].filter(p=>!q||p.name.toLowerCase().includes(q)||dn(p).toLowerCase().includes(q)).slice(0,6);b.innerHTML='';a.forEach(p=>{const z=document.createElement('button');z.textContent=dn(p);z.onmousedown=e=>{e.preventDefault();const now=c.value??'',mm=now.match(/(^|\s)@([\w .'-]*)$/);if(mm){c.value=now.slice(0,now.length-mm[2].length)+p.name+' ';c.dispatchEvent(new Event('input',{bubbles:true}));c.focus()}b.hidden=true};b.appendChild(z)});b.hidden=!a.length})}
function enhance(r){controls(r);mentions(r);const first=!ROOTS.has(r);msgs(r).forEach(e=>decorate(r,e,first));ROOTS.add(r)}
function clean(){document.querySelectorAll('.slx-head-controls').forEach(x=>{if(!x._root?.isConnected)x.remove()})}
function scan(){if(!S.enabled)return;clean();roots().forEach(enhance);bridge()}
function start(){if(O)return;O=new MutationObserver(a=>{if(a.some(m=>m.addedNodes?.length)){clearTimeout(T);T=setTimeout(scan,120)}});O.observe(document.documentElement,{childList:true,subtree:true})}
function bridge(){let b=document.getElementById('sakalux-module-bridge-'+ID);if(!b){b=document.createElement('button');b.id='sakalux-module-bridge-'+ID;b.hidden=true;b.style.display='none';b.onclick=()=>{const a=b.dataset.action;if(a==='open')settings();else if(a==='on')enable(true);else if(a==='off')enable(false);else if(a==='toggle')enable(!S.enabled);b.dataset.action=''};document.documentElement.appendChild(b)}b.dataset.version=V;b.dataset.enabled=String(S.enabled);b.dataset.ready='true'}
function enable(v){S.enabled=!!v;save();if(S.enabled){start();scan()}else{O?.disconnect();O=null;document.querySelectorAll('.slx-head-controls,.slx-toast-host,.slx-mentions').forEach(e=>e.remove());closeSearch(true)}bridge();return S.enabled}
function settings(){if(document.getElementById('sakalux-chat-settings-overlay'))return;const o=document.createElement('div');o.id='sakalux-chat-settings-overlay';const a=[['enabled','Module enabled'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete'],['exportSearch','Export search']];o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button>×</button></header><main>'+a.map(([k,l])=>'<label>'+l+'<input type="checkbox" data-k="'+k+'" '+(S[k]?'checked':'')+'></label>').join('')+'</main></section>';document.body.appendChild(o);o.querySelector('header button').onclick=()=>o.remove();o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{S[x.dataset.k]=x.checked;save();if(x.dataset.k==='enabled')enable(x.checked);else scan()})}
function css(){const s=document.createElement('style');s.textContent=`
.slx-head-controls{position:absolute!important;right:52px!important;top:0!important;bottom:0!important;height:auto!important;display:flex!important;align-items:stretch!important;z-index:20!important;pointer-events:auto!important;margin:0!important;padding:0!important}.slx-head-controls button{all:unset!important;box-sizing:border-box!important;width:32px!important;min-width:32px!important;height:100%!important;display:grid!important;place-items:center!important;font-size:15px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border-left:1px solid rgba(255,255,255,.08)!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.slx-head-controls button:active{background:rgba(255,255,255,.12)!important}.slx-head-controls button[hidden]{display:none!important}
.slx-search{position:fixed!important;z-index:2147483300!important;padding:7px!important;border:1px solid #465462!important;border-radius:8px!important;background:#20262c!important;box-shadow:0 10px 28px #0009!important}.slx-search-title{display:flex!important;justify-content:space-between!important;color:#eee!important;margin-bottom:6px!important}.slx-search-row{display:flex!important;gap:5px!important}.slx-search-row input{flex:1!important;min-width:0!important;height:32px!important;background:#171d22!important;color:#eee!important;border:1px solid #46535f!important;border-radius:6px!important;padding:0 8px!important}.slx-search-row button,.slx-search-title button{width:30px!important;border:0!important;background:#303840!important;color:#eee!important;border-radius:5px!important}
.slx-toast-host{position:absolute!important;top:44px!important;right:8px!important;z-index:65!important;width:min(300px,calc(100% - 16px))!important;pointer-events:none!important}.slx-toast{margin-bottom:5px!important;padding:8px!important;border:1px solid #465462!important;border-radius:6px!important;background:#20262cf2!important;color:#eee!important}.slx-toast b,.slx-toast span{display:block!important}.slx-toast span{font-size:10px!important;color:#aaa!important}
#slx-menu{position:fixed!important;z-index:2147483646!important;display:flex!important;gap:3px!important;padding:4px!important;border:1px solid #485563!important;border-radius:6px!important;background:#20262c!important;opacity:0!important;visibility:hidden!important}#slx-menu.show{opacity:1!important;visibility:visible!important}#slx-menu button{min-width:31px!important;height:28px!important;border:1px solid #4a5662!important;border-radius:4px!important;background:#303840!important;color:#eee!important}.slx-mentions{position:absolute!important;left:4px!important;right:4px!important;bottom:42px!important;z-index:2147483200!important;max-height:160px!important;overflow:auto!important;padding:4px!important;background:#20262c!important}.slx-mentions button{display:block!important;width:100%!important;padding:6px!important;border:0!important;background:transparent!important;color:#eee!important;text-align:left!important}
#sakalux-chat-settings-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;background:#000b!important}#sakalux-chat-settings-overlay section{width:100%!important;background:#171c21!important;color:#eee!important}#sakalux-chat-settings-overlay header{display:flex!important;justify-content:space-between!important;padding:11px!important;background:#242b32!important}#sakalux-chat-settings-overlay main{padding:8px!important}#sakalux-chat-settings-overlay label{display:flex!important;justify-content:space-between!important;padding:8px!important;margin-bottom:5px!important;border:1px solid #39434d!important}
`;document.head.appendChild(s)}
addEventListener('scroll',()=>{hideMenu();document.querySelectorAll('.slx-search').forEach(p=>p._place?.())},true);addEventListener('resize',()=>document.querySelectorAll('.slx-search').forEach(p=>p._place?.()));
function init(){css();bridge();window[API]={id:ID,version:V,open:settings,refresh:scan,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,health:()=>({version:V,roots:roots().length,favorites:F.size,muted:M.size})};if(S.enabled){start();scan();setTimeout(scan,700)}dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:ID,version:V,apiGlobal:API}}))}
document.readyState==='loading'?addEventListener('DOMContentLoaded',init,{once:true}):init();
})();


/* SakaLuX Mobile Surface Contract v2 — full-height + blur */
(()=>{
  'use strict';
  return; // legacy Mobile Surface observer disabled for performance
  window.__SakaLuXMobileSurfaceV2=1;
  const MOBILE=()=>matchMedia('(max-width: 820px)').matches;
  const TITLES=['Script Hub','Enhancer Guard','Bazaar Thanker','Mission Rewards','Market Intelligence','Elimination Assistant','Company Intelligence','Account Auditor','SakaLuX Suite','Chat Intelligence'];
  const style=document.createElement('style');
  style.id='sakalux-mobile-surface-v2';
  style.textContent=`@media(max-width:820px){
    [data-slx-fullsheet-v2="1"]{width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;border-radius:0!important;box-sizing:border-box!important;z-index:2147483200!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}
    [data-slx-backdrop-v2="1"]{background:rgba(3,7,12,.48)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
    [data-slx-fullsheet-v2="1"] input,[data-slx-fullsheet-v2="1"] textarea,[data-slx-fullsheet-v2="1"] select{scroll-margin-bottom:38vh}
  }`;
  (document.head||document.documentElement).appendChild(style);
  const visible=e=>{if(!e||!e.isConnected)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>240&&r.height>180};
  const findSheet=title=>{
    const candidates=[];
    for(const e of document.querySelectorAll('div,section,main,aside')){
      if(!visible(e))continue;
      const txt=e.innerText||''; if(!txt.includes(title))continue;
      if(title!=='Script Hub'&&e.closest('#sakalux-hub-panel'))continue;
      const s=getComputedStyle(e); if(!['fixed','absolute'].includes(s.position))continue;
      const r=e.getBoundingClientRect(); candidates.push([r.width*r.height,e]);
    }
    candidates.sort((a,b)=>a[0]-b[0]); return candidates[0]?.[1]||null;
  };
  const apply=()=>{
    if(!MOBILE())return;
    for(const t of TITLES){
      const p=findSheet(t); if(!p)continue;
      p.dataset.slxFullsheetV2='1';
      let a=p.parentElement;
      for(let i=0;a&&i<3;i++,a=a.parentElement){
        const s=getComputedStyle(a),r=a.getBoundingClientRect();
        if(['fixed','absolute'].includes(s.position)&&r.width>=innerWidth*.9&&r.height>=innerHeight*.7){a.dataset.slxBackdropV2='1';break}
      }
    }
  };
  new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  addEventListener('resize',apply,{passive:true});setTimeout(apply,0);setTimeout(apply,350);setTimeout(apply,1200);
})();


/* slx-host-scroll-contract-v3 */
(()=>{if(document.getElementById('slx-host-scroll-contract-v3'))return;const s=document.createElement('style');s.id='slx-host-scroll-contract-v3';s.textContent=`@media(max-width:820px){
[data-slx-fullsheet-v2="1"]{position:relative!important;inset:auto!important;width:100%!important;max-width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;margin:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important;background:rgba(9,15,22,.94)!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;}
}`;(document.head||document.documentElement).appendChild(s)})();


/* SakaLuX Mobile Full-Screen Performance Contract */
(()=>{
  if(document.getElementById('sakalux-fullscreen-performance-contract')) return;
  const s=document.createElement('style');
  s.id='sakalux-fullscreen-performance-contract';
  s.textContent=`@media(max-width:820px){
    [id^="sakalux-"][id*="overlay"],
    [id^="slx-"][id*="overlay"],
    [id^="sl-"][id*="overlay"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;border-radius:0!important;overflow:hidden!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#0b1118!important;box-shadow:none!important
    }
    [data-slx-fullsheet-v2="1"],
    [id^="sakalux-"][id*="panel"],[id^="slx-"][id*="panel"],[id^="sl-"][id*="panel"],
    [id^="sakalux-"][id*="modal"],[id^="slx-"][id*="modal"],[id^="sl-"][id*="modal"]{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      width:100vw!important;height:100dvh!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;
      margin:0!important;border-radius:0!important;box-sizing:border-box!important;overflow:auto!important;
      touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;
      -webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    [id^="sakalux-"] *,[id^="slx-"] *,[id^="sl-"] *{ -webkit-backdrop-filter:none!important;backdrop-filter:none!important }
    [id^="sakalux-"][id*="panel"] *,[id^="slx-"][id*="panel"] *,[id^="sl-"][id*="panel"] *,
    [id^="sakalux-"][id*="modal"] *,[id^="slx-"][id*="modal"] *,[id^="sl-"][id*="modal"] *{
      animation:none!important;transition:none!important
    }
  }`;
  (document.head||document.documentElement).appendChild(s);
})();

