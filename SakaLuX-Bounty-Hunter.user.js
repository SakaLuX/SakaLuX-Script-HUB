// ==UserScript==
// @name         SakaLuX Bounty Hunter
// @namespace    sakalux.bounty.hunter
// @version      0.5.17
// @description  Mobile-first Torn bounty intelligence with full-board API paging, live target enrichment, FF/BS hints, hospital countdowns, alerts, Safe/Profit modes, watchlist and blacklist.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      All Rights Reserved
// @downloadURL  https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.user.js
// @updateURL    https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.meta.js
// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB
// ==/UserScript==
/* SakaLuX Premium Badges v2 — BEGIN */
(()=>{
 'use strict';
 const MATCH=new RegExp("full board|smart sort|lowest ff|lowest bs|live status|beatable only|safe ff|ffscouter",'i');
 const ROOT=new RegExp("slx-bh|bounty",'i');
 const STYLE_ID='slx-premium-badge-style';
 function decorate(){
  if(!document.body)return;
  if(!document.getElementById(STYLE_ID)){
   const style=document.createElement('style');style.id=STYLE_ID;
   style.textContent='.slx-premium-badge{display:inline-flex!important;align-items:center!important;margin-inline-start:5px!important;padding:1px 5px!important;border:1px solid #bd9a4c!important;border-radius:5px!important;background:#372b14!important;color:#f9dc8d!important;font:800 10px/1.5 system-ui,sans-serif!important;letter-spacing:.035em!important;white-space:nowrap!important;vertical-align:middle!important;pointer-events:none!important}';
   (document.head||document.documentElement).appendChild(style);
  }
  const selector='button,[role="button"],[role="tab"],label,select';
  for(const el of document.querySelectorAll(selector)){
   if(el.closest('#sakalux-unified-dialog,#sakalux-hub,#sakalux-script-hub,.slx-dialog-shade'))continue;
   let node=el, inModule=false;
   for(let i=0;node&&i<6;i++,node=node.parentElement){
    const identity=String(node.id||'')+' '+String(typeof node.className==='string'?node.className:'');
    if(ROOT.test(identity)){inModule=true;break}
   }
   if(!inModule)continue;
   if(el.tagName==='SELECT'){
     for(const option of el.options){
      if(option.dataset.slxProOption==='1')continue;
      const title=String(option.textContent||'').trim();
      if(MATCH.test(title)&&!(/(?:✦\\s*)?PRO\\s*$/i).test(title)){
       option.textContent=title+' · ✦ PRO';option.dataset.slxProOption='1';
      }
     }
     continue;
   }
   if(el.querySelector(':scope > .slx-premium-badge'))continue;
   const label=String(el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent||'').trim();
   if(!MATCH.test(label)||/^(?:OPEN PREMIUM|PRO|✦ PRO)$/i.test(label))continue;
   const tag=document.createElement('span');tag.className='slx-premium-badge';tag.textContent='✦ PRO';tag.setAttribute('aria-hidden','true');
   if(el.tagName==='LABEL'&&el.querySelector('button'))continue;
   el.append(tag);
   if(!el.title)el.title='SakaLuX PRO feature';
  }
 }
 let timer=0;
 const schedule=()=>{if(timer)return;timer=setTimeout(()=>{timer=0;decorate()},180)};
 const start=()=>{decorate();new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true})};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
/* SakaLuX Premium Badges v2 — END */


/* SakaLuX Freemium Control — BEGIN */
(()=>{
 'use strict';
 const ENT='bounty_hunter_pro', MATCH=/full.board|scan full|smart sort|lowest ff|lowest bs|ffscouter/i, ROOT=/slx-bh|bounty/i;
 let verifiedUntil=0,verifiedKey='',pending=null;
 let verificationState='checking';
 const key=()=>{try{return String(globalThis.SakaLuXScriptHub?.getApiKey?.()||localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim()}catch{return ''}};
 const accepts=(data,k)=>{
   const expiry=Date.parse(String(data?.expires_at||'').replace(' ','T')+'Z');
   return !!(data?.premium_active===true&&data?.entitlements?.includes(ENT)&&Number.isFinite(expiry)&&expiry>Date.now()&&k===key());
 };
 async function isPro(){
   const k=key();if(!/^[A-Za-z0-9]{16}$/.test(k)){verificationState='unavailable';return false;}
   if(k===verifiedKey&&verifiedUntil>Date.now()){verificationState='pro';return true;}
   const hub=globalThis.__SakaLuXPremiumVerified;
   if(hub?.key===k&&Date.now()-hub.at<300000&&accepts(hub.data,k)){verifiedKey=k;verifiedUntil=Math.min(Date.now()+300000,Date.parse(String(hub.data.expires_at).replace(' ','T')+'Z'));verificationState='pro';return true}
   // Prefer the Hub's shared broker: one in-flight request for all modules.
   // A server outage is unknown, never proof that the account is FREE.
   const broker=globalThis.SakaLuXLicenseBroker;
   if(broker?.check){
     try{
       const d=await broker.check(k);
       const ok=d?.status==='ok'&&accepts(d,k);
       if(ok){verifiedKey=k;verifiedUntil=Math.min(Date.now()+300000,Date.parse(String(d.expires_at).replace(' ','T')+'Z'));}
       else {verifiedKey='';verifiedUntil=0;}
       verificationState=ok?'pro':(d?.status==='ok'?'free':'unavailable');
       return ok;
     }catch{verificationState='unavailable';return false;}
   }
   if(pending)return pending;
   if(typeof GM_xmlhttpRequest!=='function'){verificationState='unavailable';return false;}
   pending=new Promise(resolve=>{
    GM_xmlhttpRequest({method:'POST',url:'https://sakalux.ro/api/hub-premium-check.php',headers:{'Content-Type':'application/json','Accept':'application/json'},data:JSON.stringify({api_key:k}),timeout:12000,
     onload:r=>{try{const d=JSON.parse(r.responseText||'{}');const ok=r.status===200&&d.status==='ok'&&accepts(d,k);verificationState=r.status===200&&d.status==='ok'?(ok?'pro':'free'):'unavailable';if(ok){verifiedKey=k;verifiedUntil=Math.min(Date.now()+300000,Date.parse(String(d.expires_at).replace(' ','T')+'Z'))}resolve(ok)}catch{verificationState='unavailable';resolve(false)}},
     onerror:()=>{verificationState='unavailable';resolve(false)},ontimeout:()=>{verificationState='unavailable';resolve(false)}
    })
   });try{return await pending}finally{pending=null}
 }
 function locked(){
   if(verificationState==='unavailable'||verificationState==='checking'){
     globalThis.SakaLuXDialog?.notice?.('PRO verification temporarily unavailable. Please retry shortly.','warning');
     return;
   }
   if(globalThis.SakaLuXDialog?.show)globalThis.SakaLuXDialog.show({title:'SakaLuX PRO',type:'pro',message:'This advanced feature requires active SakaLuX PRO. Basic features remain FREE. 1 Xanax = 7 days PRO.',actions:[{label:'CLOSE'},{label:'OPEN PREMIUM',primary:true,onClick:()=>location.assign('https://sakalux.ro/premium.html')}]});
   else globalThis.SakaLuXDialog?.notice?.('This feature requires SakaLuX PRO.','pro');
 }

 window.addEventListener('SakaLuX:PremiumStatus',event=>{
   const data=event.detail||{};
   const expiry=Date.parse(String(data.expires_at||'').replace(' ','T')+'Z');
   const active=data.premium_active===true&&Array.isArray(data.entitlements)&&data.entitlements.includes(ENT)&&Number.isFinite(expiry)&&expiry>Date.now();
   verifiedKey=active?key():'';
   verifiedUntil=active?Math.min(Date.now()+5*60*1000,expiry):0;
   verificationState=active?'pro':(data.verification_state==='unavailable'?'unavailable':'free');
 });
 globalThis.SakaLuXFreemium=globalThis.SakaLuXFreemium||{};
 globalThis.SakaLuXFreemium['bounty-hunter']={isPro,locked,isActive:()=>verifiedKey===key()&&verifiedUntil>Date.now()};
 const bypass=new WeakSet();
 document.addEventListener('click',async e=>{
   const button=e.target?.closest?.('button,[role="button"],a');if(!button||bypass.has(button))return;
   const owner=button.closest?.('[id],[class]');const scope=(button.closest?.('[id*="slx"],[id*="sakalux"],[id*="qp"],[id*="mission"],[class*="slx"],[class*="sakalux"]')?.id||button.closest?.('[id*="slx"],[id*="sakalux"],[id*="qp"],[id*="mission"]')?.className||'');
   if(!ROOT.test(String(scope))&&!ROOT.test(String(owner?.id||'')))return;
   const label=String(button.textContent||button.title||button.getAttribute('aria-label')||'').trim();
   if(!MATCH.test(label))return;
   e.preventDefault();e.stopImmediatePropagation();
   if(await isPro()){bypass.add(button);try{button.click()}finally{bypass.delete(button)}}else locked();
 },true);
})();
/* SakaLuX Freemium Control — END */

/* SakaLuX Unified Dialogs v1.0 — BEGIN */
(() => {
  'use strict';
  if (globalThis.SakaLuXDialog?.version === '1.0') return;
  const STYLE='sakalux-unified-dialog-style';
  const esc=v=>String(v??'');
  function ensure(){
    if(!document.getElementById(STYLE)){
      const style=document.createElement('style');style.id=STYLE;
      style.textContent=`.slx-dialog-shade{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(2,8,19,.78)!important;backdrop-filter:blur(5px)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important;box-sizing:border-box!important}.slx-dialog-panel{box-sizing:border-box!important;width:min(100%,420px)!important;max-height:90dvh!important;overflow:auto!important;background:linear-gradient(155deg,#172638,#0b1421)!important;border:1px solid #405874!important;border-radius:20px!important;color:#edf4ff!important;box-shadow:0 24px 65px #000a!important;font:14px/1.55 system-ui,Arial,sans-serif!important}.slx-dialog-head{display:flex!important;align-items:center!important;gap:12px!important;padding:20px 20px 6px!important}.slx-dialog-icon{display:grid!important;place-items:center!important;flex:none!important;width:43px!important;height:43px!important;background:#26394e!important;color:#e8c577!important;border:1px solid #56617a!important;border-radius:13px!important;font-size:21px!important}.slx-dialog-title{font-size:20px!important;font-weight:800!important;line-height:1.2!important}.slx-dialog-tag{font-size:10px!important;font-weight:800!important;letter-spacing:.1em!important;color:#e9c779!important}.slx-dialog-x{margin-left:auto!important;border:0!important;border-radius:10px!important;background:#233348!important;color:#fff!important;padding:7px 12px!important;font-size:16px!important}.slx-dialog-message{white-space:pre-wrap!important;overflow-wrap:anywhere!important;color:#d8e5f7!important;padding:14px 20px 4px!important;font-size:15px!important}.slx-dialog-actions{display:flex!important;gap:10px!important;padding:18px 20px 20px!important}.slx-dialog-btn{min-height:43px!important;flex:1!important;border:1px solid #536a84!important;border-radius:12px!important;color:white!important;background:#26394e!important;font-weight:800!important}.slx-dialog-btn.primary{background:linear-gradient(#3d93e9,#2769b5)!important;border-color:#60a6ef!important}`;
      (document.head||document.documentElement).appendChild(style);
    }
  }
  function show({title='SakaLuX',message='',type='info',actions}={}){
    ensure();const old=document.getElementById('sakalux-unified-dialog');old?.remove();
    const shade=document.createElement('div');shade.id='sakalux-unified-dialog';shade.className='slx-dialog-shade';
    const panel=document.createElement('section');panel.className='slx-dialog-panel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    const head=document.createElement('div');head.className='slx-dialog-head';
    const icon=document.createElement('div');icon.className='slx-dialog-icon';icon.textContent=type==='error'?'!':type==='success'?'✓':type==='pro'?'✦':type==='update'?'↻':'i';
    const group=document.createElement('div'),heading=document.createElement('div'),tag=document.createElement('div');
    heading.className='slx-dialog-title';heading.textContent=title;tag.className='slx-dialog-tag';tag.textContent=type.toUpperCase();group.append(heading,tag);
    const x=document.createElement('button');x.type='button';x.className='slx-dialog-x';x.textContent='×';x.setAttribute('aria-label','Close');x.onclick=()=>shade.remove();head.append(icon,group,x);
    const body=document.createElement('div');body.className='slx-dialog-message';body.textContent=esc(message);
    const foot=document.createElement('div');foot.className='slx-dialog-actions';
    for(const action of actions||[{label:'CLOSE',primary:true}]){const b=document.createElement('button');b.type='button';b.className='slx-dialog-btn'+(action.primary?' primary':'');b.textContent=action.label||'OK';b.onclick=()=>{shade.remove();action.onClick?.()};foot.append(b)}
    panel.append(head,body,foot);shade.append(panel);(document.body||document.documentElement).append(shade);
    shade.addEventListener('click',e=>{if(e.target===shade)shade.remove()});return shade;
  }
  function notice(message,type){const m=esc(message);return show({title:/error|failed|unavailable/i.test(m)?'Action failed':/pro|premium|license/i.test(m)?'SakaLuX PRO':'SakaLuX',message:m,type:type||(/error|failed|unavailable/i.test(m)?'error':/pro|premium|license/i.test(m)?'pro':'info')})}
  function confirmAsync(message){return new Promise(resolve=>show({title:'Please confirm',message,type:'info',actions:[{label:'CANCEL',onClick:()=>resolve(false)},{label:'CONFIRM',primary:true,onClick:()=>resolve(true)}]}))}
  globalThis.SakaLuXDialog={version:'1.0',show,notice,confirmAsync};
})();
/* SakaLuX Unified Dialogs v1.0 — END */


/* SakaLuX Shared Core — BEGIN */
/* SakaLuX Shared Core v1 - test foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded into standalone userscripts at build/release time.
 */
(() => {
  'use strict';

  const g = globalThis;
  const CORE_VERSION = '1.2.1';
  const NS = 'SakaLuXCore';

  const SETTINGS_CATALOG = Object.freeze([
    { match: /Account Auditor/i, id: 'account-auditor', version: 1, keys: ['SakaLuX_AUDITOR_SETTINGS_V3'] },
    { match: /Bazaar Smart Pricer/i, id: 'bazaar-smart-pricer', version: 1, keys: ['SakaLuX_BAZAAR_SMART_PRICER_SETTINGS'] },
    { match: /Bazaar Thanker/i, id: 'bazaar', version: 1, keys: ['sakalux_bazaar_thanker_v5'] },
    { match: /Bounty Hunter/i, id: 'bounty-hunter', version: 1, keys: ['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1','SLX_BOUNTY_FF_CACHE_V1','SLX_BOUNTY_SCAN_STATE_V1'] },
    { match: /Chat Intelligence/i, id: 'chat-intelligence', version: 1, keys: ['SLX_CHAT_CFG4'] },
    { match: /Company Intelligence/i, id: 'company-intelligence', version: 1, keys: ['sak_ci:mode', 'sak_ci:tab', 'sak_ci:compact', 'sak_ci:enabled'] },
    { match: /Elimination Assistant/i, id: 'elimination-assistant', version: 1, keys: ['slx_elim_ui_v1'] },
    { match: /Enhancer Guard/i, id: 'enhancer', version: 1, keys: ['SakaLuX_EG_FAVORITES'] },
    { match: /Market Intelligence/i, id: 'market-intelligence', version: 1, keys: ['SakaLuX_MI_SETTINGS_V2'] },
    { match: /Mission Rewards/i, id: 'mission-rewards', version: 1, keys: ['SakaLuX_MR_SETTINGS_V1'] },
    { match: /Script Hub/i, id: 'script-hub', version: 1, keys: ['SakaLuX_HUB_SETTINGS_V16'] },
    { match: /Stock Manager/i, id: 'stock-manager-advisor', version: 1, keys: ['SLX_STOCK_PRESETS', 'SLX_STOCK_BENEFIT_VALUES'] },
    { match: /SakaLuX Suite/i, id: 'suite', version: 1, keys: ['sakalux_master_suite_settings_v1'] }
  ]);

  function currentScriptSettingsDefinition() {
    let name = '';
    try { name = String(g.GM_info?.script?.name || ''); } catch {}
    return SETTINGS_CATALOG.find(entry => entry.match.test(name)) || null;
  }

  function currentTransportEnvironment() {
    let gm = null;
    try { if (typeof GM_xmlhttpRequest === 'function') gm = GM_xmlhttpRequest; } catch {}
    return {
      pda: typeof g.PDA_httpGet === 'function' ? g.PDA_httpGet.bind(g) : null,
      gm,
      fetch: typeof g.fetch === 'function' ? g.fetch.bind(g) : null
    };
  }

  if (g[NS]?.version === CORE_VERSION) {
    g[NS].api?.registerEnvironment?.(currentTransportEnvironment());
    g[NS].settings?.autoGuardCurrentScript?.();
    if (!g.SakaLuXPerf && g[NS].perf) g.SakaLuXPerf = g[NS].perf;
    return;
  }

  const timers = new Map();
  const listeners = new Set();
  let routeKey = '';
  let routeEpoch = 0;
  let routerBound = false;
  let routeAbortHook = null;

  const perf = {
    debounce(key, fn, wait = 220) {
      const old = timers.get(key);
      if (old) clearTimeout(old);
      const id = setTimeout(() => {
        timers.delete(key);
        fn();
      }, Math.max(120, Number(wait) || 220));
      timers.set(key, id);
      return id;
    },
    idle(fn, timeout = 700) {
      if (typeof requestIdleCallback === 'function') return requestIdleCallback(fn, { timeout });
      return setTimeout(fn, 32);
    },
    unrelated(records) {
      return Array.isArray(records) && records.length > 0 && records.every(record => {
        const node = record?.target;
        const target = node?.nodeType === 1 ? node : node?.parentElement;
        return !!target?.closest?.('#chat-box,[id^="chat-box"],[class*="chat-box"],[class*="chatBox"],#sakalux-standalone-dock,[id^="sakalux-inline-footer-"]');
      });
    }
  };

  const hub = {
    installed() {
      if (typeof document === 'undefined') return false;
      const html = document.documentElement;
      const body = document.body;
      return !!(
        g.SakaLuXScriptHub ||
        document.getElementById('sakalux-hub-button') ||
        document.getElementById('sakalux-hub-top-skull') ||
        document.getElementById('sakalux-hub-nav-skull') ||
        document.getElementById('sakalux-hub-panel') ||
        document.getElementById('sakalux-hub-style') ||
        html?.getAttribute('data-sakalux-hub-installed') === '1' ||
        body?.getAttribute('data-sakalux-hub-installed') === '1' ||
        html?.getAttribute('data-sakalux-hub-active') === '1' ||
        body?.getAttribute('data-sakalux-hub-active') === '1'
      );
    }
  };

  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch { return false; }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch { return false; }
    }
  };

  const settings = (() => {
    const statuses = new Map();
    const prefix = 'SakaLuX_SettingsSchema::';
    const backupPrefix = 'SakaLuX_SettingsBackup::';

    function normalizeDefinition(definition = {}) {
      const id = String(definition.id || '').trim();
      const version = Math.max(1, Math.floor(Number(definition.version) || 1));
      const keys = [...new Set((definition.keys || []).map(String).filter(Boolean))];
      if (!id) throw new Error('Settings schema id is required');
      if (!keys.length) throw new Error(`Settings schema ${id} has no storage keys`);
      return { ...definition, id, version, keys };
    }

    function readJson(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    }

    function writeJson(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch { return false; }
    }

    function snapshot(keys) {
      const values = {};
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw != null) values[key] = raw;
        } catch {}
      }
      return values;
    }

    function validateAndRecover(def, backup) {
      const recovered = [];
      const reset = [];
      const valid = [];
      for (const key of def.keys) {
        let raw = null;
        try { raw = localStorage.getItem(key); } catch {}
        if (raw == null) continue;
        try { JSON.parse(raw); valid.push(key); continue; } catch {}
        const previous = backup?.values?.[key];
        if (typeof previous === 'string') {
          try { JSON.parse(previous); localStorage.setItem(key, previous); recovered.push(key); continue; } catch {}
        }
        try { localStorage.removeItem(key); } catch {}
        reset.push(key);
      }
      return { recovered, reset, valid };
    }

    function register(definition = {}) {
      const def = normalizeDefinition(definition);
      const metaKey = prefix + def.id;
      const backupKey = backupPrefix + def.id;
      const previousMeta = readJson(metaKey, {}) || {};
      const previousVersion = Math.max(0, Math.floor(Number(previousMeta.version) || 0));
      const existingBackup = readJson(backupKey, null);
      const before = snapshot(def.keys);
      if (Object.keys(before).length) writeJson(backupKey, { version: previousVersion, at: Date.now(), values: before });
      const recovery = validateAndRecover(def, existingBackup);
      let migrated = false;
      let fallback = recovery.reset.length > 0;
      let error = '';

      if (previousVersion < def.version) {
        try {
          for (let target = previousVersion + 1; target <= def.version; target++) {
            const migrate = def.migrations?.[target];
            if (typeof migrate !== 'function') continue;
            for (const key of def.keys) {
              let raw = null;
              try { raw = localStorage.getItem(key); } catch {}
              if (raw == null) continue;
              const current = JSON.parse(raw);
              const next = migrate(current, { id: def.id, key, from: target - 1, to: target });
              if (next !== undefined) localStorage.setItem(key, JSON.stringify(next));
            }
          }
          migrated = previousVersion > 0 || Object.keys(before).length > 0;
        } catch (err) {
          error = String(err?.message || err);
          fallback = true;
          for (const key of def.keys) {
            const raw = before[key];
            try { if (raw == null) localStorage.removeItem(key); else localStorage.setItem(key, raw); } catch {}
          }
        }
      }

      const nextMeta = {
        schema: 'sakalux-settings-schema-v1', id: def.id, version: error ? previousVersion : Math.max(previousVersion, def.version),
        updatedAt: Date.now(), migrated, fallback, recovered: recovery.recovered, reset: recovery.reset,
        error: error || null
      };
      writeJson(metaKey, nextMeta);
      statuses.set(def.id, Object.freeze({ ...nextMeta }));
      return statuses.get(def.id);
    }

    function status(id) { return statuses.get(String(id)) || readJson(prefix + String(id), null); }
    function diagnostics() { return Object.freeze(Object.fromEntries([...statuses.entries()])); }
    function autoGuardCurrentScript() {
      const def = currentScriptSettingsDefinition();
      if (!def) return null;
      try { return register(def); }
      catch (err) {
        const failed = Object.freeze({ schema: 'sakalux-settings-schema-v1', id: def.id, version: 0, fallback: true, error: String(err?.message || err) });
        statuses.set(def.id, failed);
        return failed;
      }
    }

    return Object.freeze({ register, status, diagnostics, autoGuardCurrentScript, catalog: SETTINGS_CATALOG });
  })();

  const router = {
    key(loc = g.location) {
      if (!loc) return '';
      return `${loc.pathname || ''}${loc.search || ''}${loc.hash || ''}`;
    },
    epoch() { return routeEpoch; },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    check(loc = g.location) {
      const next = this.key(loc);
      if (next === routeKey) return false;
      const prev = routeKey;
      routeKey = next;
      routeEpoch++;
      try { routeAbortHook?.({ previous: prev, current: next, epoch: routeEpoch }); } catch (err) { console.error('[SakaLuXCore router abort]', err); }
      for (const fn of [...listeners]) {
        try { fn({ previous: prev, current: next, epoch: routeEpoch }); } catch (err) { console.error('[SakaLuXCore router]', err); }
      }
      return true;
    },
    bind() {
      if (routerBound || typeof g.addEventListener !== 'function') return false;
      const signal = () => this.check();
      g.addEventListener('hashchange', signal, { passive: true });
      g.addEventListener('popstate', signal, { passive: true });
      routerBound = true;
      return true;
    }
  };

  const dock = {
    ORDER: Object.freeze([
      'enhancer','bazaar','bazaar-smart-pricer','bounty-hunter','mission-rewards','market-intelligence',
      'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
    ]),
    dedupe(registrations = []) {
      return [...new Map(registrations.filter(Boolean).map(r => [r.id, r])).values()];
    },
    sort(registrations = []) {
      const order = this.ORDER;
      return this.dedupe(registrations).sort((a, b) => {
        const ai = order.indexOf(a.id), bi = order.indexOf(b.id);
        const ar = ai < 0 ? Number.MAX_SAFE_INTEGER : ai;
        const br = bi < 0 ? Number.MAX_SAFE_INTEGER : bi;
        return ar - br || String(a.name || a.id).localeCompare(String(b.name || b.id));
      });
    }
  };

  const api = (() => {
    const inflight = new Map();
    const responseCache = new Map();
    const queue = [];
    const routeControllers = new Set();
    const env = { pda: null, gm: null, fetch: null };
    const stats = {
      requests: 0,
      networkRequests: 0,
      cacheHits: 0,
      deduped: 0,
      retries: 0,
      failures: 0,
      aborted: 0,
      timeouts: 0,
      rateLimited: 0
    };
    let active = 0;
    let maxConcurrent = 4;
    let sequence = 0;

    function registerEnvironment(next = {}) {
      if (typeof next.pda === 'function') env.pda = next.pda;
      if (typeof next.gm === 'function') env.gm = next.gm;
      if (typeof next.fetch === 'function') env.fetch = next.fetch;
      if (typeof g.PDA_httpGet === 'function') env.pda = g.PDA_httpGet.bind(g);
      if (!env.fetch && typeof g.fetch === 'function') env.fetch = g.fetch.bind(g);
      return { pda: !!env.pda, gm: !!env.gm, fetch: !!env.fetch };
    }

    function makeError(message, code, extra = {}) {
      const err = new Error(message);
      err.code = code;
      Object.assign(err, extra);
      return err;
    }

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, Math.max(0, ms))); }

    function canonicalUrl(value) {
      const raw = String(value || '');
      try {
        const u = new URL(raw, g.location?.origin || 'https://www.torn.com');
        for (const key of ['ts', '_', 'cacheBust', 'cache_bust']) u.searchParams.delete(key);
        u.searchParams.sort();
        return u.toString();
      } catch { return raw; }
    }

    function requestKey(opts) {
      if (opts.key) return String(opts.key);
      return `${opts.method}|${canonicalUrl(opts.url)}|${opts.parse || 'text'}|${opts.credentials || ''}`;
    }

    function cacheRead(key) {
      const row = responseCache.get(key);
      if (!row) return null;
      if (row.expiresAt <= Date.now()) { responseCache.delete(key); return null; }
      return row.value;
    }

    function cacheWrite(key, value, ttl) {
      const ms = Math.max(0, Number(ttl) || 0);
      if (ms > 0) responseCache.set(key, { value, expiresAt: Date.now() + ms });
    }

    function enqueue(run, priority = 0) {
      return new Promise((resolve, reject) => {
        queue.push({ run, priority: Number(priority) || 0, sequence: sequence++, resolve, reject });
        queue.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
        pump();
      });
    }

    function pump() {
      while (active < maxConcurrent && queue.length) {
        const job = queue.shift();
        active++;
        Promise.resolve().then(job.run).then(job.resolve, job.reject).finally(() => { active--; pump(); });
      }
    }

    function normalizePdaResponse(raw) {
      if (typeof raw === 'string') return { status: 200, text: raw };
      const status = Number(raw?.status || raw?.statusCode || 200) || 200;
      const value = raw?.responseText ?? raw?.body ?? raw?.data ?? raw;
      return { status, text: typeof value === 'string' ? value : JSON.stringify(value ?? null) };
    }

    function requestViaPda(opts) {
      return Promise.resolve(env.pda(opts.url, opts.headers || {})).then(normalizePdaResponse);
    }

    function requestViaGm(opts, controller) {
      return new Promise((resolve, reject) => {
        let settled = false;
        let handle = null;
        const finish = fn => value => { if (settled) return; settled = true; fn(value); };
        const onResolve = finish(resolve);
        const onReject = finish(reject);
        try {
          handle = env.gm({
            method: opts.method,
            url: opts.url,
            headers: opts.headers || {},
            data: opts.body == null ? undefined : opts.body,
            timeout: opts.timeout,
            onload: r => onResolve({ status: Number(r?.status || 200) || 200, text: String(r?.responseText ?? '') }),
            onerror: () => onReject(makeError('Network error', 'NETWORK')),
            ontimeout: () => onReject(makeError('Request timeout', 'TIMEOUT')),
            onabort: () => onReject(makeError('Request aborted', 'ABORTED'))
          });
        } catch (err) { onReject(err); return; }
        if (controller?.signal) {
          const abort = () => { try { handle?.abort?.(); } catch {} onReject(makeError('Request aborted', 'ABORTED')); };
          if (controller.signal.aborted) abort(); else controller.signal.addEventListener('abort', abort, { once: true });
        }
      });
    }

    async function requestViaFetch(opts, controller) {
      if (!env.fetch) throw makeError('No HTTP transport available', 'NO_TRANSPORT');
      let timeoutId = null;
      let timeoutController = controller;
      if (!timeoutController && typeof AbortController === 'function') timeoutController = new AbortController();
      if (opts.timeout > 0 && timeoutController) timeoutId = setTimeout(() => timeoutController.abort('timeout'), opts.timeout);
      try {
        const res = await env.fetch(opts.url, {
          method: opts.method,
          headers: opts.headers || {},
          body: opts.body == null ? undefined : opts.body,
          credentials: opts.credentials || 'omit',
          cache: opts.cacheMode || 'no-store',
          signal: timeoutController?.signal
        });
        return { status: Number(res?.status || 0), text: await res.text() };
      } catch (err) {
        if (timeoutController?.signal?.aborted) {
          const timedOut = timeoutController.signal.reason === 'timeout';
          throw makeError(timedOut ? 'Request timeout' : 'Request aborted', timedOut ? 'TIMEOUT' : 'ABORTED');
        }
        throw makeError(err?.message || 'Network error', 'NETWORK', { cause: err });
      } finally { if (timeoutId) clearTimeout(timeoutId); }
    }

    async function transport(opts, controller) {
      registerEnvironment(currentTransportEnvironment());
      if (opts.method === 'GET' && env.pda) return requestViaPda(opts);
      if (env.gm) return requestViaGm(opts, controller);
      return requestViaFetch(opts, controller);
    }

    function retryableStatus(status) { return status === 429 || status === 408 || status >= 500; }
    function retryableError(err) { return ['NETWORK', 'TIMEOUT'].includes(err?.code); }

    function tornError(data) {
      const raw = data?.error;
      if (!raw) return null;
      const message = String(raw?.error ?? raw?.message ?? raw ?? 'Torn API error');
      const apiCode = Number(raw?.code);
      const lower = message.toLowerCase();
      const isRateLimit = apiCode === 5 || /too many|rate.?limit|requests per/i.test(lower);
      const isInvalidKey = [2, 12, 13, 16].includes(apiCode) || /invalid.*key|key.*invalid|incorrect.*key/i.test(lower);
      return { message, apiCode: Number.isFinite(apiCode) ? apiCode : null, isRateLimit, isInvalidKey };
    }

    async function networkRequest(opts, startEpoch) {
      let attempt = 0;
      const retries = Math.max(0, Number(opts.retries) || 0);
      while (true) {
        if (opts.routeScoped && router.epoch() !== startEpoch) throw makeError('Stale route request', 'STALE_ROUTE');
        const controller = opts.routeScoped && typeof AbortController === 'function' ? new AbortController() : null;
        if (controller) routeControllers.add(controller);
        try {
          stats.networkRequests++;
          const result = await transport(opts, controller);
          if (opts.routeScoped && router.epoch() !== startEpoch) throw makeError('Stale route request', 'STALE_ROUTE');
          const status = Number(result?.status || 0);
          if (status >= 200 && status < 300) return String(result?.text ?? '');
          if (status === 429) stats.rateLimited++;
          if (attempt < retries && retryableStatus(status)) {
            stats.retries++;
            await sleep((Number(opts.retryBase) || 400) * (2 ** attempt));
            attempt++;
            continue;
          }
          throw makeError(`HTTP ${status || 0}`, 'HTTP', { status, retryable: retryableStatus(status) });
        } catch (err) {
          if (err?.code === 'ABORTED' || err?.code === 'STALE_ROUTE') { stats.aborted++; throw err; }
          if (err?.code === 'TIMEOUT') stats.timeouts++;
          if (attempt < retries && retryableError(err)) {
            stats.retries++;
            await sleep((Number(opts.retryBase) || 400) * (2 ** attempt));
            attempt++;
            continue;
          }
          throw err;
        } finally { if (controller) routeControllers.delete(controller); }
      }
    }

    function requestText(input = {}) {
      const opts = typeof input === 'string' ? { url: input } : { ...input };
      opts.url = String(opts.url || '');
      opts.method = String(opts.method || 'GET').toUpperCase();
      opts.timeout = Math.max(0, Number(opts.timeout ?? 15000));
      opts.retries = Math.max(0, Number(opts.retries ?? 2));
      opts.retryBase = Math.max(0, Number(opts.retryBase ?? 400));
      opts.parse = 'text';
      if (!opts.url) return Promise.reject(makeError('Request URL is required', 'INVALID_REQUEST'));

      stats.requests++;
      const key = requestKey(opts);
      const cacheable = opts.method === 'GET' && opts.body == null;
      if (cacheable && !opts.force) {
        const cached = cacheRead(key);
        if (cached != null) { stats.cacheHits++; return Promise.resolve(cached); }
      }
      if (cacheable && inflight.has(key)) { stats.deduped++; return inflight.get(key); }

      const startEpoch = router.epoch();
      const promise = enqueue(() => networkRequest(opts, startEpoch), opts.priority)
        .then(text => { if (cacheable) cacheWrite(key, text, opts.ttl); return text; })
        .catch(err => { stats.failures++; throw err; })
        .finally(() => { if (inflight.get(key) === promise) inflight.delete(key); });
      if (cacheable) inflight.set(key, promise);
      return promise;
    }

    async function requestJson(urlOrOptions, options = {}) {
      const opts = typeof urlOrOptions === 'string' ? { ...options, url: urlOrOptions } : { ...(urlOrOptions || {}) };
      const text = await requestText(opts);
      let data;
      try { data = text ? JSON.parse(text) : null; }
      catch (err) { throw makeError('Invalid JSON response', 'INVALID_JSON', { cause: err }); }
      if (opts.throwApiError) {
        const info = tornError(data);
        if (info) {
          if (info.isRateLimit) stats.rateLimited++;
          throw makeError(info.message, 'TORN_API_ERROR', info);
        }
      }
      return data;
    }

    function clearCache(match = null) {
      if (match == null) { const size = responseCache.size; responseCache.clear(); return size; }
      const needle = String(match);
      let removed = 0;
      for (const key of [...responseCache.keys()]) if (key.includes(needle)) { responseCache.delete(key); removed++; }
      return removed;
    }

    function cancelRouteScoped() {
      let count = 0;
      for (const controller of [...routeControllers]) { try { controller.abort('route-change'); count++; } catch {} }
      return count;
    }

    function configure(options = {}) {
      if (Number.isFinite(Number(options.maxConcurrent))) maxConcurrent = Math.max(1, Math.min(12, Math.floor(Number(options.maxConcurrent))));
      pump();
      return diagnostics();
    }

    function diagnostics() {
      return Object.freeze({
        ...stats,
        active,
        queued: queue.length,
        inflight: inflight.size,
        cacheEntries: responseCache.size,
        maxConcurrent,
        transports: { pda: !!env.pda, gm: !!env.gm, fetch: !!env.fetch }
      });
    }

    routeAbortHook = cancelRouteScoped;
    registerEnvironment(currentTransportEnvironment());
    return Object.freeze({ request: requestText, requestText, requestJson, clearCache, cancelRouteScoped, configure, diagnostics, registerEnvironment });
  })();

  const ui = {
    applyWorkspaceLayout(overlay, panel, options = {}) {
      if (!overlay || !panel || typeof window === 'undefined') return null;
      const top = Math.max(0, Number(options.top ?? 0));
      const bottom = Math.max(0, Number(options.bottom ?? 36));
      const side = Math.max(0, Number(options.side ?? 4));
      const maxWidth = Math.max(240, Number(options.maxWidth ?? 760));
      const apply = () => {
        const vv = window.visualViewport;
        const width = Math.max(0, Number(vv?.width || window.innerWidth || 0));
        const height = Math.max(0, Number(vv?.height || window.innerHeight || 0));
        const offsetTop = Math.max(0, Number(vv?.offsetTop || 0));
        const offsetLeft = Math.max(0, Number(vv?.offsetLeft || 0));
        Object.assign(overlay.style, {
          position: 'fixed',
          inset: '0px',
          width: 'auto',
          height: 'auto',
          maxHeight: 'none',
          display: 'block'
        });
        const usable = Math.max(240, height - top - bottom);
        const panelWidth = Math.min(maxWidth, Math.max(240, width - side * 2));
        Object.assign(panel.style, {
          position: 'fixed',
          top: (offsetTop + top) + 'px',
          bottom: 'auto',
          left: (offsetLeft + Math.max(side, (width - panelWidth) / 2)) + 'px',
          width: panelWidth + 'px',
          height: usable + 'px',
          maxHeight: usable + 'px',
          margin: '0',
          boxSizing: 'border-box'
        });
      };
      apply();
      const vv = window.visualViewport;
      vv?.addEventListener?.('resize', apply);
      vv?.addEventListener?.('scroll', apply);
      window.addEventListener?.('resize', apply);
      return () => {
        vv?.removeEventListener?.('resize', apply);
        vv?.removeEventListener?.('scroll', apply);
        window.removeEventListener?.('resize', apply);
      };
    },
    ensureSharedSkin() {
      if (typeof document === 'undefined' || typeof document.createElement !== 'function' || document.getElementById('sakalux-shared-hub-skin')) return;
      const st = document.createElement('style');
      st.id = 'sakalux-shared-hub-skin';
      st.textContent = `
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="panel"],body [id*="sakalux"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *))[id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .header,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) input,body [id^="sakalux-"]:where(:not(#sakalux-hub-overlay, #sakalux-hub-panel, #sakalux-hub-overlay *, #sakalux-hub-panel *)) select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head || document.documentElement).appendChild(st);
    }
  };

  const logger = {
    debug(...args) { if (storage.get('SakaLuX_DEBUG', false)) console.debug('[SakaLuX]', ...args); },
    warn(...args) { console.warn('[SakaLuX]', ...args); },
    error(...args) { console.error('[SakaLuX]', ...args); }
  };

  const core = Object.freeze({ version: CORE_VERSION, perf, hub, storage, settings, router, dock, api, ui, logger });

  g[NS] = core;
  g.SakaLuXPerf = perf;
  settings.autoGuardCurrentScript();
  routeKey = router.key();
  ui.ensureSharedSkin();
})();
/* SakaLuX Shared Core — END */

/* SakaLuX Canonical Installed Version — BEGIN */
(() => {
  'use strict';
  let v = '0.5.17';
  try {
    const meta = globalThis.GM_info && globalThis.GM_info.script && globalThis.GM_info.script.version;
    if (meta) v = String(meta);
  } catch {}
  const g = globalThis;
  g.__SakaLuXInstalledVersions = g.__SakaLuXInstalledVersions || Object.create(null);
  g.__SakaLuXInstalledVersions['bounty-hunter'] = v;
  try {
    document.documentElement?.setAttribute('data-sakalux-installed-bounty-hunter', v);
  } catch {}
})();
/* SakaLuX Canonical Installed Version — END */

/* SakaLuX Shared Dock Runtime — BEGIN */
/* SakaLuX Shared Dock Runtime v1 - Priority 6 foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded with Shared Core into standalone userscripts.
 */
(() => {
  'use strict';

  const g = globalThis;
  const NS = 'SakaLuXDockRuntime';
  const VERSION = '1.1.10';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const OPEN_KEY = 'SakaLuX_STANDALONE_DOCK_OPEN';
  const PROMPT_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const PROMPT_INTERVAL = 12 * 60 * 60 * 1000;
  const IDS = Object.freeze({
    dock: 'sakalux-standalone-dock',
    prompt: 'sakalux-hub-install-prompt',
    native: 'sakalux-standalone-native-s',
    fallback: 'sakalux-standalone-fallback-s',
    style: 'sakalux-standalone-dock-runtime-style'
  });

  function versionParts(v){return String(v||'0').match(/\d+/g)?.map(Number)||[0]}
  function compareVersion(a,b){const x=versionParts(a),y=versionParts(b);for(let i=0;i<Math.max(x.length,y.length);i++){const d=(x[i]||0)-(y[i]||0);if(d)return d>0?1:-1}return 0}
  const currentRuntime=g.__SakaLuXDockRuntimeCurrent||g[NS];
  if(currentRuntime?.version&&compareVersion(currentRuntime.version,VERSION)>=0)return;
  try { currentRuntime?.removeUi?.(); } catch {}

  const modules = g.__SakaLuXDockRuntimeModules instanceof Map
    ? g.__SakaLuXDockRuntimeModules
    : new Map();
  g.__SakaLuXDockRuntimeModules = modules;
  let observer = null;
  let observerQueued = false;
  let runtimeSignalsBound = false;
  let promptScheduled = false;

  function core() { return g.SakaLuXCore || null; }
  function doc() { return typeof document === 'undefined' ? null : document; }
  function hubInstalled() { return Boolean(core()?.hub?.installed?.()); }
  let openState = false;
  let autoCloseTimer = 0;
  let userOpened = false;
  function readOpen() { return false; }
  function writeOpen(value) { openState = Boolean(value); try { localStorage.removeItem(OPEN_KEY); } catch {} }
  function forceCloseDock() {
    userOpened = false;
    openState = false;
    clearTimeout(autoCloseTimer);
    const p = doc()?.getElementById(IDS.dock);
    if (p) { p.dataset.open = '0'; p.hidden = true; }
    try { localStorage.removeItem(OPEN_KEY); } catch {}
    return false;
  }
  function armAutoClose() {
    clearTimeout(autoCloseTimer);
    if (!openState) return;
    autoCloseTimer = setTimeout(() => forceCloseDock(), 6000);
  }

  function normalize(entry = {}) {
    const id = String(entry.id || '').trim();
    if (!id) throw new Error('Dock module id is required');
    return Object.freeze({
      id,
      name: String(entry.name || id),
      icon: String(entry.icon || '🧩'),
      version: String(entry.version || ''),
      open: typeof entry.open === 'function' ? entry.open : null,
      enabled: typeof entry.enabled === 'function' ? entry.enabled : () => true
    });
  }

  function sorted() {
    const values = [...modules.values()];
    const sorter = core()?.dock?.sort;
    return typeof sorter === 'function' ? sorter.call(core().dock, values) : values;
  }

  function removeNode(id) { try { doc()?.getElementById(id)?.remove(); } catch {} }

  function removeUi() {
    removeNode(IDS.dock);
    removeNode(IDS.prompt);
    removeNode(IDS.native);
    removeNode(IDS.fallback);
  }

  function addStyle() {
    const d = doc();
    if (!d || d.getElementById(IDS.style)) return;
    const style = d.createElement('style');
    style.id = IDS.style;
    style.textContent = `
#${IDS.dock}{position:fixed;right:10px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:2147483000;width:min(220px,calc(100vw - 20px));max-height:calc(100dvh - 190px);overflow:hidden;padding:10px;background:linear-gradient(180deg,rgba(10,14,20,.992),rgba(7,10,15,.992));border:1px solid rgba(255,255,255,.09);border-radius:18px;box-shadow:0 16px 40px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;display:none;flex-direction:column;box-sizing:border-box}
#${IDS.dock}[data-open="1"]{display:flex}
#${IDS.dock} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:4px 6px 10px;margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.055)}
#${IDS.dock} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;padding:0;margin:0;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#${IDS.dock} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}
#${IDS.dock} .slx-dock-items{overflow:auto;min-height:0}
#${IDS.dock} .sl-dock-row{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;margin:0 0 6px;padding:7px 9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#111b26;color:#eaf0f6;text-align:left;font:700 11px/1.2 Arial,sans-serif}
#${IDS.dock} .sl-dock-row:last-child{margin-bottom:0}#${IDS.dock} .sl-dock-row[disabled]{opacity:.45}
#${IDS.dock} .slx-dock-install{display:block;margin-top:8px;padding-top:7px;border-top:1px solid rgba(255,255,255,.08);color:#d8a45c;text-align:center;text-decoration:none;font-size:10px;font-weight:800}
#${IDS.fallback}{position:fixed;right:10px;bottom:calc(44px + env(safe-area-inset-bottom,0px));z-index:2147482900;width:38px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:#0b1118;color:#e9a84d;font:800 15px/1 Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
#${IDS.native}{all:unset!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;vertical-align:middle!important;box-sizing:border-box!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:24px!important;min-height:24px!important;max-height:24px!important;margin:0 3px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;list-style:none!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:none!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;overflow:visible!important}#${IDS.native}::before,#${IDS.native}::after,#${IDS.native} .slx-s-link::before,#${IDS.native} .slx-s-link::after{content:none!important;display:none!important;background:none!important;background-image:none!important}#${IDS.native} .slx-s-link{all:unset!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:translateY(2px)!important;color:#dfbd61!important;font:900 17px/24px Arial,sans-serif!important;line-height:24px!important;text-align:center!important;text-decoration:none!important;text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 4px rgba(223,189,97,.2)!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}#${IDS.native} .slx-s-link:active{transform:translateY(2px) scale(.92)!important}

#${IDS.prompt}{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:2147483600;width:min(360px,calc(100vw - 20px));padding:10px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0b1118;color:#eef3f8;font:600 11px/1.35 Arial,sans-serif;box-shadow:0 16px 42px rgba(0,0,0,.45)}
#${IDS.prompt} .slx-prompt-actions{display:flex;gap:7px;margin-top:8px}#${IDS.prompt} button{flex:1;min-height:30px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#17212d;color:#eef3f8;font-weight:800}
`;
    (d.head || d.documentElement).appendChild(style);
  }

  function findStatusIconList() {
    const d=doc(); if(!d)return null;
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...d.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }
  function ensureLauncher(){
    const d=doc();
    if(!d||hubInstalled()){removeNode(IDS.native);removeNode(IDS.fallback);return null;}
    const list=findStatusIconList();
    let item=d.getElementById(IDS.native);
    if(!list){item?.remove();return null;}
    if(!item){
      item=d.createElement('li');
      item.id=IDS.native;
    }
    item.className='slx-standalone-native';
    item.removeAttribute?.('style');
    let link=item.querySelector('a.slx-s-link');
    if(!link){
      item.replaceChildren();
      link=d.createElement('a');
      link.href='#';link.className='slx-s-link';link.textContent='S';
      link.title='SakaLuX Scripts';link.setAttribute('aria-label','SakaLuX Scripts');
      item.appendChild(link);
    }else{
      link.textContent='S';link.href='#';link.className='slx-s-link';
    }
    link.onclick=e=>{
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
      const p=d.getElementById(IDS.dock);
      const open=p?.dataset.open==='1'&&!p.hidden;
      if(open)forceCloseDock();else{userOpened=true;toggleDock(true);}
    };
    const first=[...list.children].find(x=>x!==item)||null;
    if(first){
      if(list.firstElementChild!==item) list.insertBefore(item,first);
    }else if(item.parentElement!==list){
      list.appendChild(item);
    }
    removeNode(IDS.fallback);
    return item;
  }

  function ensureDock() {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return null; }
    let panel = d.getElementById(IDS.dock);
    if (!panel) {
      panel = d.createElement('div');
      panel.id = IDS.dock;
      panel.dataset.open = '0';
      panel.hidden = true;
      writeOpen(false);
      const head = d.createElement('div'); head.className = 'slx-dock-head';
      const close = d.createElement('button'); close.type = 'button'; close.className = 'slx-dock-mark'; close.textContent = 'S'; close.title = 'Close SakaLuX Scripts';
      close.addEventListener?.('click', e => { e?.preventDefault?.(); e?.stopPropagation?.(); forceCloseDock(); });
      const title = d.createElement('div'); title.className = 'slx-dock-title'; title.textContent = 'SakaLuX Scripts';
      const sub = d.createElement('div'); sub.className = 'slx-dock-sub'; sub.textContent = 'Standalone';
      head.appendChild(close); head.appendChild(title); head.appendChild(sub);
      const items = d.createElement('div'); items.className = 'slx-dock-items';
      const install = d.createElement('a'); install.className = 'slx-dock-install'; install.href = HUB_URL; install.textContent = 'Install SakaLuX Hub';
      panel.appendChild(head); panel.appendChild(items); panel.appendChild(install);
      (d.body || d.documentElement).appendChild(panel);
    }
    return panel;
  }

  function toggleDock(force) {
    if (hubInstalled()) { removeUi(); return false; }
    render();
    const panel = doc()?.getElementById(IDS.dock);
    if (!panel) return false;
    const next = typeof force === 'boolean' ? force : panel.dataset.open !== '1';
    if (next) {
      userOpened = true;
      openState = true;
      panel.dataset.open = '1';
      panel.hidden = false;
      writeOpen(true);
      armAutoClose();
    } else forceCloseDock();
    return next;
  }

  function render() {
    const d = doc();
    if (!d) return null;
    if (hubInstalled()) {
      try { d.documentElement?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      try { d.body?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      removeUi();
      return null;
    }
    try { d.body?.removeAttribute('data-sakalux-hub-active'); } catch {}
    addStyle();
    ensureLauncher();
    const panel = ensureDock();
    if (!panel) return null;
    const box = typeof panel.querySelector === 'function' ? panel.querySelector('.slx-dock-items') : panel.children?.[1];
    if (!box) return panel;
    box.replaceChildren?.();
    for (const entry of sorted()) {
      const button = d.createElement('button');
      button.type = 'button';
      button.className = 'sl-dock-row';
      button.dataset.moduleId = entry.id;
      button.textContent = `${entry.icon} ${entry.name}`;
      let enabled = true;
      try { enabled = entry.enabled() !== false; } catch { enabled = false; }
      button.disabled = !enabled || !entry.open;
      button.addEventListener?.('click', () => {
        try { entry.open?.(); } finally { toggleDock(false); }
      });
      box.appendChild(button);
    }
    if(!userOpened) forceCloseDock(); else panel.hidden = panel.dataset.open !== '1';
    return panel;
  }

  function maybePrompt() {
    const d = doc();
    if (!d || hubInstalled() || !d.body) return false;
    let last = 0;
    try { last = Number(localStorage.getItem(PROMPT_KEY) || 0); } catch {}
    if (Date.now() - last < PROMPT_INTERVAL || d.getElementById(IDS.prompt)) return false;
    try { localStorage.setItem(PROMPT_KEY, String(Date.now())); } catch {}
    const prompt = d.createElement('div'); prompt.id = IDS.prompt;
    const text = d.createElement('div'); text.textContent = 'Install SakaLuX Script Hub for one control center, health checks and module management.';
    const actions = d.createElement('div'); actions.className = 'slx-prompt-actions';
    const later = d.createElement('button'); later.type = 'button'; later.textContent = 'LATER'; later.addEventListener?.('click', () => prompt.remove());
    const install = d.createElement('button'); install.type = 'button'; install.textContent = 'INSTALL HUB'; install.addEventListener?.('click', () => { location.href = HUB_URL; });
    actions.appendChild(later); actions.appendChild(install); prompt.appendChild(text); prompt.appendChild(actions); d.body.appendChild(prompt);
    return true;
  }

  function scheduleRefresh(delay = 180) {
    if (observerQueued) return;
    observerQueued = true;
    const run = () => { observerQueued = false; render(); };
    const perf = core()?.perf;
    if (typeof perf?.debounce === 'function') perf.debounce('shared-dock-runtime', run, delay); else setTimeout(run, delay);
  }

  function bindRuntimeSignals() {
    if (runtimeSignalsBound) return;
    runtimeSignalsBound = true;
    try {
      core()?.router?.onChange?.(() => { forceCloseDock(); scheduleRefresh(180); });
      core()?.router?.bind?.();
    } catch {}
    try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}
    try {
      const outside = e => {
        const panel = doc()?.getElementById(IDS.dock);
        if (!panel || panel.dataset.open !== '1' || panel.hidden) return;
        const t=e?.target;
        if (t?.closest?.('#'+IDS.dock) || t?.closest?.('#'+IDS.native) || t?.closest?.('#'+IDS.fallback)) return;
        forceCloseDock();
      };
      for (const ev of ['pointerdown','touchstart','mousedown','click']) doc()?.addEventListener?.(ev,outside,true);
    } catch {}
    try { g.addEventListener?.('keydown', e => { if(e?.key==='Escape') forceCloseDock(); }, {passive:true}); } catch {}
    try {
      if (!observer && typeof MutationObserver === 'function' && doc()?.body) {
        observer = new MutationObserver(records => {
          if (core()?.perf?.unrelated?.(records)) return;
          scheduleRefresh(240);
        });
        observer.observe(doc().body, { childList:true, subtree:true });
      }
    } catch {}
  }

  function register(entry) {
    const normalized = normalize(entry);
    modules.set(normalized.id, normalized); // latest registration wins
    render();
    bindRuntimeSignals();
    if (!promptScheduled) {
      promptScheduled = true;
      Promise.resolve().then(() => maybePrompt());
    }
    return normalized;
  }

  function unregister(id) {
    const removed = modules.delete(String(id || ''));
    render();
    return removed;
  }

  function list() { return Object.freeze(sorted().map(item => Object.freeze({ ...item }))); }

  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled, maybePrompt });
  g.__SakaLuXDockRuntimeCurrent = api;
  try {
    const desc=Object.getOwnPropertyDescriptor(g,NS);
    if(!desc||desc.configurable){
      Object.defineProperty(g,NS,{configurable:true,enumerable:true,get(){return g.__SakaLuXDockRuntimeCurrent},set(v){if(v?.version&&compareVersion(v.version,g.__SakaLuXDockRuntimeCurrent?.version)>=0)g.__SakaLuXDockRuntimeCurrent=v}});
    } else g[NS]=api;
  } catch { try { g[NS]=api; } catch {} }
})();
/* SakaLuX Shared Dock Runtime — END */

/* SakaLuX Shared Dock Registration — BEGIN */
(() => {
  'use strict';
  const SELF=Object.freeze({id:'bounty-hunter',name:'Bounty Hunter',icon:'🎯',version:'0.5.3',fallback:'https://www.torn.com/bounties.php'});
  function openSelf(){try{const api=window.SakaLuXBountyHunter;if(api&&typeof api.open==='function'){api.open();return}}catch{}const bridge=document.getElementById('sakalux-module-bridge-'+SELF.id);if(bridge){bridge.dataset.action = 'open';bridge.click();return}if(SELF.fallback)location.href=SELF.fallback}
  function register(){const dock=globalThis.SakaLuXDockRuntime;if(!dock||typeof dock.register!=='function')throw new Error('SakaLuX Shared Dock Runtime is unavailable');dock.register({...SELF,open:openSelf})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',register,{once:true});else register();
})();
/* SakaLuX Shared Dock Registration — END */

(()=>{'use strict';
const VERSION='0.5.17',ID='bounty-hunter',API='SakaLuXBountyHunter';
const GREASYFORK_ID='598988',GREASYFORK_URL='https://greasyfork.org/scripts/598988',HUB_SHARED_KEY_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks,bounties&market=itemmarket';
const CORE=globalThis.SakaLuXCore||null;
try{CORE?.ui?.ensureSharedSkin?.();CORE?.settings?.register?.({id:ID,version:1,keys:['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1','SLX_BOUNTY_FF_CACHE_V1','SLX_BOUNTY_SCAN_STATE_V1']});CORE?.api?.configure?.({maxConcurrent:4});}catch{}
const PERF=globalThis.SakaLuXPerf||CORE?.perf||null;
const KS='SLX_BOUNTY_SETTINGS_V3',KW='SLX_BOUNTY_WATCH_V1',KB='SLX_BOUNTY_BLACK_V1',KK='SakaLuX_BOUNTY_API_KEY',KF='SakaLuX_BOUNTY_FFSCOUTER_KEY',KC='SLX_BOUNTY_CACHE_V2',KU='SLX_BOUNTY_USER_CACHE_V1',KFC='SLX_BOUNTY_FF_CACHE_V1',KSCAN='SLX_BOUNTY_SCAN_STATE_V1';
const D={enabled:true,mode:'safe',source:'auto',sort:'smart',query:'',minReward:500000,maxLevel:100,okay:true,hospital:true,hideUnknown:true,watchOnly:false,autoRefresh:true,refreshSec:60,compact:true,fullBoard:true,maxPages:60,liveEnrich:true,enrichCount:12,notifyTargets:true,notifyMinReward:500000,notifyWatch:true,minFF:1,maxFF:3,maxBS:0,hospitalWindowMin:5,onlyBeatable:true,includeUnknownFF:false,chatButton:true,settingsOpen:false};
const J=(k,d)=>{try{return CORE?.storage?.get?CORE.storage.get(k,d):(JSON.parse(localStorage.getItem(k)||'null')??d)}catch{return d}},W=(k,v)=>{try{if(CORE?.storage?.set)return CORE.storage.set(k,v);localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}},N=v=>String(v??'').replace(/\s+/g,' ').trim(),num=v=>{const n=Number(v);return Number.isFinite(n)?n:0},esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S={...D,...J(KS,{})},WATCH=J(KW,{}),BLACK=J(KB,{}),CACHE=J(KC,{rows:[],at:0}),UCACHE=J(KU,{}),FFCACHE=J(KFC,{}),SCAN=J(KSCAN,{nextOffset:0,records:0,at:0,delay:950}),PROG={stage:'idle',current:0,total:0,text:''},timer=0,tickTimer=0,lastRows=[],busy=false,lastError='',lastSource='DOM',lastBountyRecords=0,notified=new Map(),apiAccessStatus='unknown',apiAccessMessage='Not checked yet',apiAccessCheckedAt=0;
try{const mk='SLX_BOUNTY_MIGRATED_033';if(!localStorage.getItem(mk)){if(num(S.maxPages)<=20)S.maxPages=60;S.settingsOpen=false;localStorage.setItem(mk,'1');W(KS,S)}}catch{}
try{const mk='SLX_BOUNTY_MIGRATED_032';if(!localStorage.getItem(mk)){if(num(S.minFF)===1&&num(S.maxFF)===1)S.maxFF=3;if(num(S.maxFF)<num(S.minFF))S.maxFF=Math.max(3,num(S.minFF));localStorage.setItem(mk,'1');W(KS,S)}}catch{}
try{const mk='SLX_BOUNTY_MIGRATED_031';if(!localStorage.getItem(mk)){if(num(S.minReward)===50000)S.minReward=500000;if(num(S.notifyMinReward)===25000||num(S.notifyMinReward)===250000)S.notifyMinReward=500000;if(num(S.refreshSec)===20)S.refreshSec=60;if(num(S.maxPages)===8)S.maxPages=20;if(num(S.hospitalWindowMin)===0)S.hospitalWindowMin=5;if(num(S.minFF)<=0)S.minFF=1;if(num(S.maxFF)<=0)S.maxFF=3;localStorage.setItem(mk,'1');W(KS,S)}}catch{}
const save=()=>W(KS,S),saveLists=()=>{W(KW,WATCH);W(KB,BLACK)},saveCache=()=>W(KC,CACHE),saveUsers=()=>W(KU,UCACHE),saveFF=()=>W(KFC,FFCACHE),saveScan=()=>W(KSCAN,SCAN);
function fmt(n){n=num(n);if(n>=1e9)return'$'+(n/1e9).toFixed(n>=1e10?1:2)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(n>=1e7?1:2)+'M';if(n>=1e3)return'$'+Math.round(n/1e3)+'K';return'$'+Math.round(n).toLocaleString()}
function setProgress(stage,current=0,total=0,text=''){PROG={stage,current:num(current),total:num(total),text:String(text||'')};const o=document.getElementById('slx-bh');if(!o)return;const p=o.querySelector('[data-progress]'),bar=o.querySelector('[data-progress-bar]');if(!p||!bar)return;const pct=PROG.total>0?Math.max(0,Math.min(100,Math.round(PROG.current/PROG.total*100))):0;p.hidden=stage==='idle';bar.style.width=pct+'%';const label=PROG.text||({board:'Scanning board',ff:'FFScouter',status:'Checking status',cooldown:'API cooldown'}[stage]||stage);p.querySelector('span').textContent=label+(PROG.total>0?' · '+PROG.current+'/'+PROG.total:'')}
function adaptiveDelay(latency=0,rateLimited=false){let d=Math.max(800,Math.min(2200,num(SCAN.delay)||950));if(rateLimited)d=Math.min(2200,d+450);else if(latency>1200)d=Math.min(1800,d+150);else if(latency<550)d=Math.max(800,d-40);SCAN.delay=Math.round(d);saveScan();return SCAN.delay}

function money(t){const a=[...String(t||'').matchAll(/\$\s*([\d,.]+)\s*([kmbt])?/ig)];let best=0;for(const m of a){let n=Number(m[1].replace(/,/g,''));const u=(m[2]||'').toLowerCase();if(u==='k')n*=1e3;if(u==='m')n*=1e6;if(u==='b')n*=1e9;if(u==='t')n*=1e12;if(Number.isFinite(n))best=Math.max(best,n)}return best}
function onBounties(){return /\/bounties\.php/i.test(location.pathname)||/bount/i.test(document.title)}
function getHubKey(){try{for(const hub of [window.SakaLuXHub,window.SakaLuXScriptHub,window.SakaLuX?.hub]){const k=typeof hub?.getApiKey==='function'?hub.getApiKey():'';if(k)return String(k).trim()}}catch{}try{return String(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim()}catch{return''}}
function getLocalKey(){try{return String(localStorage.getItem(KK)||'').trim()}catch{return''}}
function getKey(){return getHubKey()||getLocalKey()}
function keySource(){return getHubKey()?'Hub':getLocalKey()?'Local':'None'}
function setLocalKey(v){try{localStorage.setItem(KK,String(v||'').trim())}catch{}}
function getFFKey(){try{return String(localStorage.getItem(KF)||localStorage.getItem('bh_ffscouterKey')||getKey()||'').trim()}catch{return getKey()||''}}
function setFFKey(v){try{localStorage.setItem(KF,String(v||'').trim())}catch{}}
async function externalJson(url){const core=window.SakaLuXCore?.api;if(core?.requestJson){try{return await core.requestJson({url,ttl:30000,retries:1,timeout:15000,throwApiError:false})}catch{}}const r=await fetch(url,{credentials:'omit'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}
async function enrichFF(rows){if(!(await globalThis.SakaLuXFreemium['bounty-hunter'].isPro()))return rows;const key=getFFKey();if(!key||!rows.length)return rows;const out=new Map(rows.map(x=>[String(x.id),x])),ttl=12*60*60*1000,now=Date.now(),need=[];for(const [id,x] of out){const c=FFCACHE[id];if(c&&now-num(c.at)<ttl){if(c.ff!=null)x.ff=num(c.ff);if(c.bs!=null)x.bs=num(c.bs);x.ffSource='FFScouter cache'}else need.push(id)}let done=0;setProgress('ff',0,need.length,need.length?'FFScouter':'FF cache');for(let i=0;i<need.length;i+=205){const batch=need.slice(i,i+205),data=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+batch.join(','));if(data?.code)throw new Error('FFScouter: '+(data.error||('code '+data.code)));for(const f of (Array.isArray(data)?data:[])){const id=String(f.player_id),x=out.get(id);if(!x)continue;const ff=Number.isFinite(Number(f.fair_fight))?Number(f.fair_fight):null,bs=Number.isFinite(Number(f.bs_estimate))?Number(f.bs_estimate):null;if(ff!=null)x.ff=ff;if(bs!=null)x.bs=bs;x.ffSource='FFScouter';FFCACHE[id]={at:Date.now(),ff,bs}}done+=batch.length;setProgress('ff',Math.min(done,need.length),need.length,'FFScouter');if(i+205<need.length)await new Promise(r=>setTimeout(r,180))}if(need.length)saveFF();return rows}
function idFrom(a){const s=(a?.href||'')+' '+(a?.getAttribute?.('href')||'');return (s.match(/[?&](?:XID|userID|user2ID)=(\d+)/i)||[])[1]||''}
function parseLevel(t){const m=String(t).match(/(?:level|lvl)\s*[:#-]?\s*(\d{1,3})/i);return m?Number(m[1]):null}
function parseFF(t){const m=String(t).match(/(?:FF|fair\s*fight|FFS)\s*[:#-]?\s*(\d+(?:\.\d+)?)/i);return m?Number(m[1]):null}
function parseBS(t){const m=String(t).match(/(?:BS|battle\s*score|battle\s*stats?)\s*[:#-]?\s*([\d,.]+)\s*([kmbt])?/i);if(!m)return null;let n=Number(m[1].replace(/,/g,''));const u=(m[2]||'').toLowerCase();if(u==='k')n*=1e3;if(u==='m')n*=1e6;if(u==='b')n*=1e9;if(u==='t')n*=1e12;return Number.isFinite(n)?n:null}
function statusOf(t){t=N(t);if(/hospital/i.test(t))return'Hospital';if(/okay|healthy|available/i.test(t))return'Okay';if(/jail/i.test(t))return'Jail';if(/travel|abroad|flying/i.test(t))return'Abroad';if(/federal/i.test(t))return'Federal';return'Unknown'}
function hospitalUntilFromText(t){const now=Math.floor(Date.now()/1000),s=String(t||'');let m=s.match(/(?:hospital|hosp).*?(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?/i);if(m)return now+Number(m[1])*3600+Number(m[2]||0)*60;m=s.match(/(?:hospital|hosp).*?(\d+)\s*m(?:in(?:ute)?s?)?/i);if(m)return now+Number(m[1])*60;return 0}
function rowFor(a){let n=a;for(let i=0;i<8&&n?.parentElement;i++,n=n.parentElement){const q=n.getBoundingClientRect?.(),txt=N(n.innerText);if(q&&q.width>180&&q.height>28&&q.height<320&&/\$/.test(txt))return n}return a.parentElement}
function scanDom(){if(!onBounties())return[];const map=new Map();for(const a of document.querySelectorAll('a[href*="profiles.php"],a[href*="XID="],a[href*="userID="],a[href*="user2ID="]')){const id=idFrom(a);if(!id)continue;const row=rowFor(a);if(!row)continue;const text=N(row.innerText),reward=money(text);if(!reward)continue;const name=N(a.textContent).replace(/\[\d+\]$/,'').trim()||('Player '+id),level=parseLevel(text),status=statusOf(text),ff=parseFF(text),bs=parseBS(text),hospitalUntil=hospitalUntilFromText(text),atk=row.querySelector('a[href*="loader.php"][href*="attack"],a[href*="sid=attack"]');const old=map.get(id)||{id,name,level,status,reward:0,count:0,row,ff,bs,hospitalUntil,attack:atk?.href||('https://www.torn.com/loader.php?sid=attack&user2ID='+id),profile:'https://www.torn.com/profiles.php?XID='+id,source:'DOM'};old.reward+=reward;old.count++;if(old.status==='Unknown'&&status!=='Unknown')old.status=status;if(old.level==null&&level!=null)old.level=level;if(old.ff==null&&ff!=null)old.ff=ff;if(old.bs==null&&bs!=null)old.bs=bs;if(!old.hospitalUntil&&hospitalUntil)old.hospitalUntil=hospitalUntil;map.set(id,old)}return[...map.values()]}
function pick(obj,...keys){for(const k of keys){if(obj&&obj[k]!=null)return obj[k]}return null}
function normalizeApiBounty(b){const target=pick(b,'target','player','user')||{},id=String(pick(b,'target_id','targetID','user_id','userID','player_id','playerID')??pick(target,'id','user_id','player_id')??'');if(!id)return null;const reward=num(pick(b,'reward','amount','money','bounty')??0),name=String(pick(b,'target_name','name')??pick(target,'name')??('Player '+id));const levelRaw=pick(b,'level')??pick(target,'level'),level=levelRaw==null?null:num(levelRaw);const statusObj=pick(b,'status')??pick(target,'status'),statusText=typeof statusObj==='object'?String(pick(statusObj,'state','description','details')||''):String(statusObj||'');const status=statusOf(statusText);let hospitalUntil=num(pick(b,'hospital_until','hospitalUntil','until')??(typeof statusObj==='object'?pick(statusObj,'until','timestamp'):0));if(hospitalUntil>1e12)hospitalUntil=Math.floor(hospitalUntil/1000);return{id,name,level,status,reward,count:1,row:null,ff:null,bs:null,hospitalUntil,attack:'https://www.torn.com/loader.php?sid=attack&user2ID='+id,profile:'https://www.torn.com/profiles.php?XID='+id,source:'API'}}
function apiList(data){if(Array.isArray(data))return data;if(Array.isArray(data?.bounties))return data.bounties;if(data?.bounties&&typeof data.bounties==='object')return Object.values(data.bounties);if(Array.isArray(data?.data))return data.data;return[]}
const BH_RATE_KEY='slx_bh_rate_until_v1';
function isRateLimitError(e){const m=String(e?.message||e||'').toLowerCase();return m.includes('too many requests')||m.includes('rate limit')||m.includes('http 429')||m.includes('code 5')}
function getRateUntil(){try{return Number(localStorage.getItem(BH_RATE_KEY)||0)||0}catch{return 0}}
function setRateCooldown(ms=65000){const until=Date.now()+Math.max(15000,Number(ms)||65000);try{localStorage.setItem(BH_RATE_KEY,String(until))}catch{}return until}
function rateWaitText(){const left=Math.max(0,getRateUntil()-Date.now());return left?Math.ceil(left/1000)+'s':''}
function transientApiIssue(message){return /rate limit|too many requests|cooldown|using cached board|api partial/i.test(String(message||''))}
function fatalHealthError(){const m=String(lastError||'').trim();return m&&!transientApiIssue(m)?m:''}
function healthWarning(){const m=String(lastError||'').trim();return m&&transientApiIssue(m)?m:''}
function pruneCaches(){const now=Date.now();let changedFF=false,changedU=false;for(const [id,c] of Object.entries(FFCACHE||{})){if(!c||now-num(c.at)>24*60*60*1000){delete FFCACHE[id];changedFF=true}}for(const [id,c] of Object.entries(UCACHE||{})){if(!c||now-num(c.at)>10*60*1000){delete UCACHE[id];changedU=true}}const ffids=Object.keys(FFCACHE);if(ffids.length>5000){ffids.sort((a,b)=>num(FFCACHE[b]?.at)-num(FFCACHE[a]?.at)).slice(5000).forEach(id=>delete FFCACHE[id]);changedFF=true}const uids=Object.keys(UCACHE);if(uids.length>1200){uids.sort((a,b)=>num(UCACHE[b]?.at)-num(UCACHE[a]?.at)).slice(1200).forEach(id=>delete UCACHE[id]);changedU=true}if(changedFF)saveFF();if(changedU)saveUsers()}
async function testTornAccess(showToast=true){const key=getKey();apiAccessCheckedAt=Date.now();if(!key){apiAccessStatus='missing';apiAccessMessage='No Torn API key available';if(showToast)toast(apiAccessMessage);return false}try{const d=await reqJson('https://api.torn.com/v2/torn/bounties?limit=1&key='+encodeURIComponent(key),60000);if(d?.error)throw new Error(d.error.error||d.error.message||'Torn rejected Bounties access');apiAccessStatus='ok';apiAccessMessage='Bounties access OK · '+keySource()+' key';if(showToast)toast(apiAccessMessage);return true}catch(e){const m=String(e?.message||e);if(isRateLimitError(m)){apiAccessStatus='warning';apiAccessMessage='Rate limited · retry later';if(showToast)toast(apiAccessMessage);return false}apiAccessStatus='error';apiAccessMessage=/access|permission|privilege|selection/i.test(m)?'Missing Torn: Bounties access · replace the shared Hub key':m;if(showToast)toast('Torn API: '+apiAccessMessage);return false}}
function createRequiredTornKey(){try{sessionStorage.setItem('SakaLuX_HUB_API_SETUP_PENDING','1')}catch{}location.href=HUB_SHARED_KEY_URL;return true}


async function reqJson(url,ttl=8000){const until=getRateUntil();if(until>Date.now())throw new Error('Rate limit cooldown · retry in '+rateWaitText());const core=window.SakaLuXCore?.api;let coreErr='';if(core?.requestJson){try{const j=await core.requestJson({url,ttl,retries:0,timeout:12000,throwApiError:true});if(j?.error)throw new Error(j.error.error||j.error.message||'Torn API error');return j}catch(e){coreErr=e?.message||String(e);if(isRateLimitError(e)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}}}try{const r=await fetch(url,{credentials:'omit',headers:{Accept:'application/json'}});if(r.status===429){const ra=Number(r.headers?.get?.('retry-after')||0);setRateCooldown(ra>0?ra*1000:65000);throw new Error('HTTP 429 · cooldown '+rateWaitText())}if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();if(j?.error){const msg=j.error.error||j.error.message||'Torn API error';if(isRateLimitError(msg)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}throw new Error(msg)}return j}catch(e){if(isRateLimitError(e)){setRateCooldown();throw new Error('Too many requests · cooldown '+rateWaitText())}throw new Error('Torn API failed'+(coreErr?' · broker: '+coreErr:'')+' · direct: '+(e?.message||e))}}
async function fetchPage(offset,key){const q='limit=100&offset='+offset+'&key='+encodeURIComponent(key);try{return await reqJson('https://api.torn.com/v2/torn/bounties?'+q,120000)}catch(e1){if(isRateLimitError(e1))throw e1;try{return await reqJson('https://api.torn.com/v2/torn?selections=bounties&'+q,120000)}catch(e2){throw new Error((e1?.message||e1)+' · fallback: '+(e2?.message||e2))}}}
async function fetchFullBoard(force=false){if(!(await globalThis.SakaLuXFreemium['bounty-hunter'].isPro())){globalThis.SakaLuXFreemium['bounty-hunter'].locked();return scanDom();}const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');const age=Date.now()-num(CACHE.at),rateUntil=getRateUntil();if(CACHE.rows?.length&&((!force&&age<120000)||rateUntil>Date.now())){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);if(rateUntil>Date.now()){lastError='Rate limited · using cached board · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText())}return CACHE.rows}const resumeFresh=num(SCAN.nextOffset)>0&&Date.now()-num(SCAN.at)<10*60*1000&&CACHE.rows?.length, map=new Map((resumeFresh?CACHE.rows:[]).map(x=>[String(x.id),{...x}])),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=resumeFresh?num(SCAN.records):0,nextOffset=resumeFresh?num(SCAN.nextOffset):0,partialError='',donePages=0;setProgress('board',records,Math.max(records+100,(pages*100)),'Scanning board'+(resumeFresh?' · resumed':''));for(let p=0;p<pages;p++){let data=null,err=null;const started=performance.now();try{data=await fetchPage(nextOffset,key);adaptiveDelay(performance.now()-started,false)}catch(e){err=e;if(isRateLimitError(e)){setRateCooldown();adaptiveDelay(0,true);partialError='Rate limited · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText());break}for(let attempt=0;attempt<2&&!data;attempt++){await new Promise(r=>setTimeout(r,1400*(attempt+1)));try{const rs=performance.now();data=await fetchPage(nextOffset,key);adaptiveDelay(performance.now()-rs,false);err=null}catch(ex){err=ex;if(isRateLimitError(ex)){setRateCooldown();adaptiveDelay(0,true);partialError='Rate limited · retry in '+rateWaitText();setProgress('cooldown',0,0,'API cooldown '+rateWaitText());break}}}}if(!data){if(!partialError)partialError=err?.message||String(err||'API page failed');break}apiAccessStatus='ok';apiAccessMessage='Bounties access OK · '+keySource()+' key';apiAccessCheckedAt=Date.now();const list=apiList(data);records+=list.length;donePages++;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}const next=data?._metadata?.links?.next||data?.metadata?.links?.next||'';let nextCandidate=nextOffset+list.length;try{if(next){const u=new URL(next,'https://api.torn.com'),o=Number(u.searchParams.get('offset'));if(Number.isFinite(o)&&o>nextOffset)nextCandidate=o}}catch{}nextOffset=nextCandidate;SCAN={...SCAN,nextOffset,records,at:Date.now()};saveScan();const partial=[...map.values()];CACHE={rows:partial,records,at:Date.now(),partial:true};saveCache();setProgress('board',records,Math.max(records+100,pages*100),'Scanning board');if(!next||list.length===0||list.length<100){SCAN={nextOffset:0,records:0,at:Date.now(),delay:SCAN.delay};saveScan();CACHE={rows:partial,records,at:Date.now(),partial:false};saveCache();lastBountyRecords=records;setProgress('board',records,records,'Board complete');return partial}if(p<pages-1)await new Promise(r=>setTimeout(r,adaptiveDelay()))}const rows=[...map.values()];if(rows.length){lastBountyRecords=records;CACHE={rows,records,at:Date.now(),partial:true};saveCache()}if(partialError)lastError=(records?'API partial after '+records+' bounties · ':'')+partialError;return rows.length?rows:(CACHE.rows||[])}
function mergeDomHints(apiRows){const dom=new Map(scanDom().map(x=>[x.id,x]));return apiRows.map(x=>{const d=dom.get(x.id);if(!d)return x;return{...x,name:d.name||x.name,level:d.level??x.level,status:d.status!=='Unknown'?d.status:x.status,ff:d.ff??x.ff,bs:d.bs??x.bs,hospitalUntil:d.hospitalUntil||x.hospitalUntil,attack:d.attack||x.attack,row:d.row||x.row}})}
function normalizeUserBasic(j,id){const u=j?.user||j?.profile||j||{},st=u.status||{},tr=u.travel||u.travel_info||u.traveling||{},loc=u.location||{};let until=num(st?.until||st?.timestamp||0);if(until>1e12)until=Math.floor(until/1000);const statusBits=[typeof st==='object'?[st.state,st.description,st.details].filter(Boolean).join(' '):String(st||''),typeof tr==='object'?[tr.state,tr.status,tr.destination,tr.destination_name,tr.country,tr.description].filter(Boolean).join(' '):String(tr||''),typeof loc==='object'?[loc.name,loc.country,loc.description].filter(Boolean).join(' '):String(loc||'')].filter(Boolean).join(' ');let status=statusOf(statusBits);if(status==='Unknown'&&tr&&typeof tr==='object'&&Object.keys(tr).length)status='Abroad';return{id:String(id),name:String(u.name||u.player_name||u.playername||''),level:u.level==null?null:num(u.level),status,hospitalUntil:until,lastAction:String(u.last_action?.relative||u.last_action?.status||''),travelText:typeof tr==='object'?String(tr.destination_name||tr.destination||tr.country||tr.status||tr.state||''):String(tr||'')}}
async function enrichOne(x,key,force=false){const c=UCACHE[x.id];if(!force&&c&&Date.now()-num(c.at)<30000)return{...x,...c.data,ff:x.ff,bs:x.bs};let d=null,last='';const tries=[
 'https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'/basic?striptags=true&key='+encodeURIComponent(key),
 'https://api.torn.com/v2/user/'+encodeURIComponent(x.id)+'?selections=basic&striptags=true&key='+encodeURIComponent(key),
 'https://api.torn.com/user/'+encodeURIComponent(x.id)+'?selections=basic&key='+encodeURIComponent(key),
 'https://api.torn.com/user/'+encodeURIComponent(x.id)+'?selections=profile&key='+encodeURIComponent(key)
];for(const url of tries){try{const j=await reqJson(url,12000);const z=normalizeUserBasic(j,x.id);if(!d||z.status!=='Unknown')d=z;if(z.status!=='Unknown')break}catch(e){last=e?.message||String(e)}}if(!d){return{...x,statusCheckError:last||'No status response'}}UCACHE[x.id]={at:Date.now(),data:d};saveUsers();return{...x,name:d.name||x.name,level:d.level??x.level,status:d.status!=='Unknown'?d.status:x.status,hospitalUntil:d.hospitalUntil||x.hospitalUntil,lastAction:d.lastAction||x.lastAction,travelText:d.travelText||x.travelText||'',statusVerified:d.status!=='Unknown',statusCheckError:d.status==='Unknown'?(last||'Status unavailable'):''}}
async function enrichRows(rows,force=false){if(!(await globalThis.SakaLuXFreemium['bounty-hunter'].isPro()))return rows;const key=getKey();if((!S.liveEnrich&&!S.onlyBeatable)||!key||!rows.length)return rows;const candidate=rows.filter(x=>!BLACK[x.id]&&x.reward>=num(S.minReward)&&(x.level==null||x.level<=num(S.maxLevel||100))&&(!S.onlyBeatable||x.ff==null||(x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)))&&(!S.maxBS||x.bs==null||x.bs<=num(S.maxBS))).sort((a,b)=>b.reward-a.reward),maxCheck=Math.max(24,Math.min(80,Math.max(num(S.enrichCount)||12,20)*3)),top=(candidate.length?candidate:rows).slice(0,maxCheck),map=new Map(rows.map(x=>[x.id,x]));let ready=0,checked=0;setProgress('status',0,top.length,'Checking status');for(let i=0;i<top.length;i+=4){const chunk=top.slice(i,i+4),got=await Promise.all(chunk.map(x=>enrichOne(x,key,force)));checked+=chunk.length;setProgress('status',checked,top.length,'Checking status');for(const x of got){map.set(x.id,x);const left=num(x.hospitalUntil)-Math.floor(Date.now()/1000),ok=x.status==='Okay'||(x.status==='Hospital'&&num(S.hospitalWindowMin)>=0&&num(x.hospitalUntil)>0&&left>0&&(num(S.hospitalWindowMin)===0||left<=num(S.hospitalWindowMin)*60));if(ok)ready++}if(ready>=20)break}return rows.map(x=>map.get(x.id)||x)}
function hospLeft(x){const sec=num(x.hospitalUntil)-Math.floor(Date.now()/1000);return sec>0?sec:0}
function hospText(x){const s=hospLeft(x);if(!s)return'';const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),z=s%60;return(h?h+'h ':'')+(m?m+'m ':'')+z+'s'}
function textMatch(x){const q=N(S.query).toLowerCase();return!q||String(x.id).includes(q)||String(x.name||'').toLowerCase().includes(q)}
function bountyProEffective(){return globalThis.SakaLuXFreemium?.['bounty-hunter']?.isActive?.()===true}
function allowed(x){if(BLACK[x.id]||!textMatch(x))return false;if(S.watchOnly&&!WATCH[x.id])return false;if(x.reward<num(S.minReward))return false;if(x.level!=null&&x.level>num(S.maxLevel||100))return false;if(S.onlyBeatable&&bountyProEffective()){if(x.ff==null&&!S.includeUnknownFF)return false;if(x.ff!=null&&(x.ff<num(S.minFF||1)||x.ff>num(S.maxFF||3)))return false;if(x.status==='Unknown')return false;}else if(bountyProEffective()&&S.maxFF>0&&x.ff!=null&&x.ff>S.maxFF)return false;if(bountyProEffective()&&S.maxBS>0&&x.bs!=null&&x.bs>S.maxBS)return false;if(S.hideUnknown&&x.status==='Unknown')return false;if(x.status==='Okay'&&!S.okay)return false;if(x.status==='Hospital'&&!S.hospital)return false;if(['Jail','Abroad','Federal'].includes(x.status))return false;if(x.status==='Hospital'&&num(S.hospitalWindowMin)>0){const left=hospLeft(x);if(!num(x.hospitalUntil)||left<=0||left>num(S.hospitalWindowMin)*60)return false;}if(S.mode==='safe'&&!['Okay','Hospital'].includes(x.status))return false;return true}
function score(x){let risk=1;if(x.status==='Okay')risk=1.25;else if(x.status==='Hospital')risk=hospLeft(x)<=300?1.1:.85;else risk=.45;if(x.ff!=null)risk*=Math.max(.35,Math.min(1.2,2.2/(1+x.ff)));if(x.bs!=null&&S.maxBS>0)risk*=Math.max(.4,1-x.bs/(S.maxBS*1.5));return S.mode==='profit'?x.reward*risk:(x.status==='Okay'?1e15:x.status==='Hospital'?5e14:0)+x.reward*risk}
function sortRows(a,b){const sorting=bountyProEffective()?S.sort:'reward';if(sorting==='reward')return b.reward-a.reward;if(sorting==='hospital')return(a.status==='Hospital'?hospLeft(a):1e15)-(b.status==='Hospital'?hospLeft(b):1e15)||b.reward-a.reward;if(sorting==='ff')return(a.ff??1e9)-(b.ff??1e9)||b.reward-a.reward;if(sorting==='bs')return(a.bs??1e30)-(b.bs??1e30)||b.reward-a.reward;return score(b)-score(a)||b.reward-a.reward}
async function collect(force=false){lastError='';let rows=[];const key=getKey(),wantApi=bountyProEffective()&&S.fullBoard&&S.source!=='dom'&&!!key;try{if(wantApi){rows=mergeDomHints(await fetchFullBoard(force));lastSource='API'}else{rows=scanDom();lastSource=S.source==='api'?'DOM fallback':'DOM'}try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(e){lastError=(lastError?lastError+' · ':'')+(e.message||String(e))}rows=await enrichRows(rows,force&&S.liveEnrich)}catch(e){lastError=e.message||String(e);if(wantApi&&CACHE.rows?.length){rows=mergeDomHints(CACHE.rows);lastBountyRecords=num(CACHE.records)||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);lastSource='API cache';try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(ff){lastError+=' · '+(ff.message||String(ff))}try{rows=await enrichRows(rows,false)}catch{}}else{rows=scanDom();lastSource='DOM fallback';try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(ff){lastError+=' · '+(ff.message||String(ff))}try{rows=await enrichRows(rows,false)}catch{}}}lastRows=rows;lastBountyRecords=lastSource.startsWith('API')?(lastBountyRecords||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0)):rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return rows}
function scheduleBountyRender(fn,wait=180){if(PERF?.debounce)return PERF.debounce('bounty-hunter-render',fn,wait);return setTimeout(fn,wait)}
window.addEventListener('SakaLuX:PremiumStatus',()=>{if(document.getElementById('slx-bh'))void render(false);});
function bestRows(){return lastRows.filter(allowed).sort(sortRows)}

function ensureBountyProSkin(){try{CORE?.ui?.ensureSharedSkin?.()}catch{}if(document.getElementById('slx-bh-pro-skin'))return;const st=document.createElement('style');st.id='slx-bh-pro-skin';st.textContent=`
#slx-bh>section{--bh-bg:var(--slx-bg,#0b1118);--bh-card:var(--slx-card,#111a24);--bh-card2:var(--slx-card2,#172331);--bh-border:var(--slx-border,#34465b);--bh-text:var(--slx-text,#edf3fa);--bh-muted:var(--slx-muted,#93a4b7);--bh-blue:var(--slx-blue,#4f8fe8);--bh-gold:var(--slx-gold,#dfbd61);--bh-green:var(--slx-green,#45d483);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;background:linear-gradient(180deg,rgba(17,26,36,.985),rgba(8,14,21,.985))!important;border:1px solid color-mix(in srgb,var(--bh-border) 82%,transparent)!important;border-radius:18px!important;box-shadow:0 22px 70px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.035)!important;overflow:hidden!important;color:var(--bh-text)!important;}
#slx-bh .head{min-height:58px!important;padding:10px 12px!important;background:linear-gradient(180deg,rgba(28,43,59,.96),rgba(18,29,40,.96))!important;border-bottom:1px solid rgba(255,255,255,.08)!important;display:flex!important;align-items:center!important;gap:8px!important;}
#slx-bh .head b,#slx-bh .head strong{font-size:15px!important;letter-spacing:.1px!important;}
#slx-bh button,#slx-bh input,#slx-bh select{font:inherit!important;border-radius:11px!important;border:1px solid color-mix(in srgb,var(--bh-border) 88%,transparent)!important;background:linear-gradient(180deg,rgba(25,39,54,.98),rgba(16,27,38,.98))!important;color:var(--bh-text)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;transition:border-color .16s ease,background .16s ease,transform .12s ease,box-shadow .16s ease!important;}
#slx-bh button:active{transform:scale(.975)!important}#slx-bh button:hover{border-color:var(--bh-blue)!important}
#slx-bh input:focus,#slx-bh select:focus{outline:none!important;border-color:var(--bh-blue)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--bh-blue) 22%,transparent)!important;}
#slx-bh .slx-bh-settings{margin:8px 12px 10px!important;padding:10px!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:14px!important;background:rgba(7,13,19,.38)!important;}
#slx-bh .bar{gap:8px!important;padding:6px 12px!important}#slx-bh .bar label{font-size:11px!important;color:var(--bh-muted)!important;letter-spacing:.2px!important}
#slx-bh .slx-bh-tog{padding:4px 0 2px!important;display:flex!important;gap:7px!important;flex-wrap:wrap!important}#slx-bh .slx-bh-tog button{min-height:34px!important;padding:6px 10px!important;font-size:12px!important}
#slx-bh .slx-bh-list{padding:8px 12px 12px!important;display:grid!important;gap:9px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}#slx-bh .slx-bh-list>div{background:linear-gradient(180deg,rgba(20,31,43,.96),rgba(14,23,32,.96))!important;border:1px solid rgba(86,111,139,.48)!important;border-radius:14px!important;box-shadow:0 8px 22px rgba(0,0,0,.16)!important;padding:11px 12px!important}
#slx-bh .slx-bh-list>div b,#slx-bh .slx-bh-list>div strong{color:var(--bh-text)!important}#slx-bh .slx-bh-list>div [style*="color"]{text-shadow:none!important}
#slx-bh .slx-bh-empty{color:var(--bh-muted)!important;text-align:center!important;padding:24px 14px!important}
#slx-bh [data-filters]{margin:8px 12px!important;width:calc(100% - 24px)!important;min-height:38px!important;font-weight:700!important;background:linear-gradient(180deg,rgba(31,48,66,.98),rgba(20,33,46,.98))!important}
#slx-bh .slx-bh-api{margin:8px 12px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:14px!important;background:rgba(9,16,23,.96)!important;padding:12px!important}
#slx-bh .foot,#slx-bh [class*="foot"]{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(10,17,24,.98)!important;border-top:1px solid rgba(255,255,255,.08)!important;color:var(--bh-muted)!important}
.slx-bh-chat-btn{border-radius:10px!important;background:linear-gradient(180deg,var(--slx-card2,#172331),var(--slx-card,#111a24))!important;border:1px solid var(--slx-border,#34465b)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important}
@media(max-width:520px){#slx-bh>section{border-radius:16px!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 8px!important;gap:7px!important;flex:1 1 auto!important;min-height:0!important;overflow:auto!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important;max-height:54dvh!important;overflow:auto!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}

#slx-bh-donation-footer{width:100%!important;box-sizing:border-box!important;flex:0 0 auto!important;border-top:1px solid rgba(255,255,255,.08)!important;background:linear-gradient(180deg,rgba(13,22,31,.98),rgba(9,15,22,.99))!important;padding:6px 10px 7px!important;box-shadow:0 -8px 22px rgba(0,0,0,.14)!important;z-index:8!important}
#slx-bh-donation-footer .slx-bh-donate-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-bottom:4px!important}
#slx-bh-donation-footer .slx-bh-donate-actions button{height:28px!important;min-height:28px!important;padding:0 10px!important;border-radius:9px!important;font-size:11px!important;font-weight:800!important;letter-spacing:.2px!important;background:linear-gradient(180deg,rgba(36,53,71,.98),rgba(22,35,48,.98))!important;border:1px solid rgba(87,115,145,.62)!important;color:var(--bh-text,#edf3fa)!important}
#slx-bh-donation-footer .slx-bh-made{text-align:center!important;font-size:11px!important;line-height:14px!important;color:#f2a54a!important;font-weight:700!important}
#slx-bh-donation-footer .slx-bh-made a{color:#f2a54a!important;text-decoration:none!important;font-weight:800!important}
@media(max-width:520px){#slx-bh-donation-footer{padding:5px 8px 6px!important}#slx-bh-donation-footer .slx-bh-donate-actions{gap:6px!important;margin-bottom:3px!important}#slx-bh-donation-footer .slx-bh-donate-actions button{height:24px!important;min-height:24px!important;font-size:10px!important}#slx-bh-donation-footer .slx-bh-made{font-size:10px!important;line-height:13px!important}}
`;document.head?.appendChild(st)}


const SAKALUX_PROFILE_URL='https://www.torn.com/profiles.php?XID=2380374';
function ensureBountyFooter(){
 const overlay=document.getElementById('slx-bh');
 const panel=overlay?.querySelector(':scope > section');
 if(!panel)return;
 const existing=overlay.querySelector('#slx-bh-donation-footer');
 if(existing){
   if(existing.parentElement!==panel)panel.appendChild(existing);
   return;
 }
 const f=document.createElement('div');
 f.id='slx-bh-donation-footer';
 f.innerHTML='<div class="slx-bh-donate-actions"><button type="button" data-bh-donate="money">💸 SEND MONEY</button><button type="button" data-bh-donate="items">🎁 SEND ITEMS</button></div><div class="slx-bh-made">Made with ❤️ by <a href="'+SAKALUX_PROFILE_URL+'">SakaLuX [2380374]</a></div>';
 f.addEventListener('click',e=>{const b=e.target.closest('[data-bh-donate]');if(b){e.preventDefault();location.href=SAKALUX_PROFILE_URL;return}const a=e.target.closest('a');if(a){e.preventDefault();location.href=SAKALUX_PROFILE_URL}});
 panel.appendChild(f);
}

function toast(msg){let h=document.getElementById('slx-bh-toast');if(!h){h=document.createElement('div');h.id='slx-bh-toast';document.body.appendChild(h)}const d=document.createElement('div');d.textContent=msg;h.appendChild(d);setTimeout(()=>d.remove(),5500)}
function maybeNotify(rows){if(!S.notifyTargets)return;const now=Date.now();for(const x of rows.slice(0,10)){if(x.reward<num(S.notifyMinReward)&&!(S.notifyWatch&&WATCH[x.id]))continue;if(x.status!=='Okay'&&!(x.status==='Hospital'&&hospLeft(x)<=300))continue;const key=x.id+':'+x.status+':'+Math.floor(x.reward/50000),last=notified.get(key)||0;if(now-last<10*60*1000)continue;notified.set(key,now);const text=(WATCH[x.id]?'★ ':'')+x.name+' '+fmt(x.reward)+' · '+x.status+(x.status==='Hospital'?' '+hospText(x):'');toast('🎯 '+text);if('Notification'in window&&Notification.permission==='granted'){try{new Notification('SakaLuX Bounty Hunter',{body:text})}catch{}}}}
function ensureCss(){if(document.getElementById('slx-bh-css'))return;const s=document.createElement('style');s.id='slx-bh-css';s.textContent=`#slx-bh-btn{position:fixed;right:12px;bottom:92px;z-index:2147482000;width:48px;height:48px;border:1px solid #56677b;border-radius:14px;background:#172331;color:#fff;font-size:24px;box-shadow:0 8px 26px #0009}#slx-bh{position:fixed;inset:0;z-index:2147483600;background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;display:flex;align-items:flex-end;justify-content:center}#slx-bh>section{width:min(760px,100%);height:min(92dvh,900px);max-height:92dvh;display:flex;flex-direction:column;background:#101820;color:#edf3fa;border:1px solid #394c61;border-radius:16px 16px 0 0;overflow:hidden}#slx-bh header{display:flex;align-items:center;gap:7px;padding:9px;background:#182431}#slx-bh header b{flex:1}#slx-bh button,#slx-bh input,#slx-bh select{min-height:34px;border:1px solid #3d5066;border-radius:8px;background:#172331;color:#edf3fa}#slx-bh header button{width:38px}#slx-bh .bar{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px}#slx-bh .bar label{font-size:10px;color:#9fb0c2}#slx-bh .bar input,#slx-bh .bar select{width:100%;box-sizing:border-box;padding:5px}.slx-bh-search{display:flex;gap:6px;padding:0 8px 8px}.slx-bh-search input{flex:1;min-width:0;padding:6px 8px}.slx-bh-tog{display:flex;gap:6px;padding:0 8px 8px;flex-wrap:wrap}#slx-bh .slx-bh-chip{padding:5px 8px!important;min-height:30px!important;background:linear-gradient(180deg,#172331,#111b25)!important;border-color:#38506b!important;color:#b4c1cf!important;box-shadow:none!important;pointer-events:auto!important;touch-action:manipulation!important}#slx-bh .slx-bh-chip.on,#slx-bh .slx-bh-chip[aria-pressed="true"],#slx-bh .slx-bh-chip[data-state="on"]{background:linear-gradient(180deg,#8a4d05,#4a2700)!important;border-color:#ff9f1a!important;color:#fff0cf!important;box-shadow:inset 0 0 0 1px rgba(255,159,26,.28),0 0 14px rgba(255,159,26,.18)!important}.slx-bh-list{overflow:auto;padding:8px;display:flex;flex-direction:column;gap:7px}.slx-bh-row{display:grid;grid-template-columns:1fr auto;gap:8px;padding:9px;border:1px solid #34465b;border-radius:10px;background:#15202b}.slx-bh-row .name{font-weight:800}.slx-bh-row .meta{font-size:11px;color:#9fb0c2;margin-top:3px}.slx-bh-row .money{font-weight:900;color:#78df9d}.slx-bh-row.watch{border-color:#d9ba59}.slx-bh-actions{display:flex;gap:5px;align-items:center}.slx-bh-actions button,.slx-bh-actions a{display:grid;place-items:center;min-width:36px;height:34px;border:1px solid #3d5066;border-radius:8px;background:#1b2b3a;color:#fff;text-decoration:none}.slx-bh-empty{padding:20px;text-align:center;color:#9fb0c2}.slx-bh-progress{margin:6px 12px 2px;color:#9fb0c2;font-size:11px}.slx-bh-progress i{display:block;height:5px;margin-top:4px;border-radius:99px;background:#172331;overflow:hidden}.slx-bh-progress b{display:block;width:0;height:100%;background:linear-gradient(90deg,#4f8fe8,#ff9f1a);transition:width .18s ease}.slx-bh-foot{display:flex;justify-content:space-between;gap:8px;padding:8px;border-top:1px solid #2f4052;font-size:11px;color:#9fb0c2}#slx-bh-toast{position:fixed;top:76px;right:8px;z-index:2147483646;display:flex;flex-direction:column;gap:6px;max-width:min(360px,92vw)}#slx-bh-toast>div{padding:9px 11px;border:1px solid #4c6178;border-radius:10px;background:#13202cf2;color:#fff;box-shadow:0 8px 24px #0009}.slx-bh-api{padding:9px;border-top:1px solid #2f4052;background:#111b25;font-size:11px}.slx-bh-api input{width:100%;box-sizing:border-box;padding:6px}.slx-bh-api .row{display:flex;gap:6px;margin-top:6px}.slx-bh-api .row button{flex:1}.slx-bh-chat-btn{flex:0 0 34px!important;width:34px!important;height:34px!important;min-height:34px!important;border:1px solid #3d5066!important;border-radius:8px!important;background:#172331!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:18px!important;margin:0 4px!important;padding:0!important;z-index:4!important}@media(max-width:520px){#slx-bh .bar{grid-template-columns:1fr 1fr}.slx-bh-row{grid-template-columns:1fr}.slx-bh-actions{justify-content:flex-end}}`;document.head.appendChild(s)}
function removeLegacyLaunchers(){document.getElementById('slx-bh-btn')?.remove();document.querySelectorAll('.slx-bh-chat-btn').forEach(x=>x.remove())}
function button(){removeLegacyLaunchers()}
function paintChip(b,on){
 on=!!on;
 b.classList.toggle('on',on);
 b.setAttribute('aria-pressed',on?'true':'false');
 b.dataset.state=on?'on':'off';
 b.style.setProperty('pointer-events','auto','important');
 b.style.setProperty('touch-action','manipulation','important');
 b.style.setProperty('background',on?'linear-gradient(180deg,#8a4d05,#4a2700)':'linear-gradient(180deg,#172331,#111b25)','important');
 b.style.setProperty('border-color',on?'#ff9f1a':'#38506b','important');
 b.style.setProperty('color',on?'#fff0cf':'#b4c1cf','important');
 b.style.setProperty('box-shadow',on?'inset 0 0 0 1px rgba(255,159,26,.28),0 0 14px rgba(255,159,26,.18)':'none','important');
}
function chip(label,on,fn){const b=document.createElement('button');b.className='slx-bh-chip';b.textContent=label;paintChip(b,on);b.onclick=(e)=>{e.preventDefault();e.stopPropagation();fn?.(e)};return b}
function updateCountdowns(){document.querySelectorAll('[data-hosp-until]').forEach(e=>{const x={hospitalUntil:num(e.dataset.hospUntil)},t=hospText(x);e.textContent=t?'⏱ '+t:'Hospital'})}
async function render(force=false){const o=document.getElementById('slx-bh');if(!o||busy)return;busy=true;const list=o.querySelector('.slx-bh-list');list.innerHTML='<div class="slx-bh-empty">Scanning bounty board…</div>';try{await collect(force);const rows=bestRows();list.innerHTML='';if(!rows.length){const known=lastRows.filter(x=>x.ff!=null).length,beat=lastRows.filter(x=>x.ff!=null&&x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)).length;list.innerHTML='<div class="slx-bh-empty">No matching targets.<br>Board: '+lastRows.length+' · FF known: '+known+' · FF in range: '+beat+(lastError?'<br>'+esc(lastError):'')+'</div>';}for(const x of rows.slice(0,200)){const r=document.createElement('div');r.className='slx-bh-row'+(WATCH[x.id]?' watch':'');const hosp=x.status==='Hospital'&&hospLeft(x)?'<span data-hosp-until="'+num(x.hospitalUntil)+'">⏱ '+hospText(x)+'</span>':'';const tags=[x.status==='Unknown'?'Status ?':x.status,x.level!=null?'L'+x.level:'',x.ff!=null?'FF '+x.ff:'',x.bs!=null?'BS '+fmt(x.bs).replace('$',''):'',x.count+' bounty'+(x.count===1?'':'ies'),x.lastAction||''].filter(Boolean);const left=document.createElement('div');left.innerHTML='<div class="name">'+esc(x.name)+' <small>['+esc(x.id)+']</small></div><div class="meta" title="Status ? means Torn did not provide a current status; enable Live status to enrich it.">'+tags.map(esc).join(' · ')+(hosp?' · '+hosp:'')+'</div><div class="money">'+fmt(x.reward)+'</div>';const a=document.createElement('div');a.className='slx-bh-actions';const atk=document.createElement('a');atk.href=x.attack;atk.textContent='⚔';atk.title='Attack';const prof=document.createElement('a');prof.href=x.profile;prof.target='_blank';prof.rel='noopener noreferrer';prof.textContent='👤';prof.title='Profile (new tab)';const w=document.createElement('button');w.textContent=WATCH[x.id]?'★':'☆';w.title='Watch';w.onclick=()=>{if(WATCH[x.id])delete WATCH[x.id];else WATCH[x.id]={name:x.name,addedAt:Date.now()};saveLists();render(false)};const bl=document.createElement('button');bl.textContent='🚫';bl.title='Blacklist';bl.onclick=()=>{BLACK[x.id]={name:x.name,addedAt:Date.now()};saveLists();render(false)};a.append(atk,prof,w,bl);r.append(left,a);list.appendChild(r)}const ffKnown=lastRows.filter(x=>x.ff!=null).length,ffBeatable=lastRows.filter(x=>x.ff!=null&&x.ff>=num(S.minFF||1)&&x.ff<=num(S.maxFF||3)).length;o.querySelector('[data-count]').textContent=rows.length+' beatable · '+lastRows.length+' targets · '+lastBountyRecords+' bounties · FF '+ffKnown+' known / '+ffBeatable+' in range';o.querySelector('[data-source]').textContent=lastSource+' · Torn '+keySource()+(getFFKey()?' · FFScouter ✓':' · FFScouter ✕');maybeNotify(rows);updateCountdowns();setProgress('idle')}finally{busy=false}}
function apiPanel(o){const p=document.createElement('div');p.className='slx-bh-api';p.innerHTML='<b>API Access</b><div>Torn: '+keySource()+'. Full-board requires Torn: Bounties. Live target checks use User: Basic/Profile. FFScouter is optional.</div><div class="row"><button data-torntest>Test Torn access</button><button data-createhub>Replace shared Hub key</button></div><input data-torn type="password" placeholder="Optional local Torn API key"><div class="row"><button data-save>Save Torn key</button><button data-clear>Clear Torn key</button></div><input data-ffkey type="password" placeholder="FFScouter key (16 chars)" style="margin-top:7px"><div class="row"><button data-ffsave>Save FF key</button><button data-ffclear>Clear FF key</button><button data-fftest>Test FFScouter</button><button data-notify>Notifications</button></div><div style="margin-top:8px;font-size:11px;color:#9fb0c2">Distribution: <a data-gf href="'+GREASYFORK_URL+'" target="_blank" rel="noopener noreferrer">GreasyFork #'+GREASYFORK_ID+'</a></div>';const i=p.querySelector('[data-torn]'),fi=p.querySelector('[data-ffkey]');p.querySelector('[data-torntest]').onclick=()=>testTornAccess(true);p.querySelector('[data-createhub]').onclick=()=>createRequiredTornKey();p.querySelector('[data-save]').onclick=()=>{setLocalKey(i.value);i.value='';apiAccessStatus='unknown';toast('Torn API key saved');render(true)};p.querySelector('[data-clear]').onclick=()=>{setLocalKey('');apiAccessStatus='unknown';toast('Torn API key cleared');render(false)};p.querySelector('[data-ffsave]').onclick=()=>{setFFKey(fi.value);fi.value='';toast('FFScouter key saved');render(true)};p.querySelector('[data-ffclear]').onclick=()=>{setFFKey('');toast('FFScouter key cleared');render(false)};p.querySelector('[data-fftest]').onclick=async()=>{const id=lastRows[0]?.id;if(!id)return toast('Refresh the bounty board first');try{const d=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(getFFKey())+'&targets='+encodeURIComponent(id));if(Array.isArray(d))toast('FFScouter OK · '+d.length+' result');else toast('FFScouter error · '+(d?.error||d?.code||'invalid response'))}catch(e){toast('FFScouter error · '+(e.message||e))}};p.querySelector('[data-notify]').onclick=async()=>{if(!('Notification'in window))return toast('System notifications unavailable');try{toast('Notifications: '+await Notification.requestPermission())}catch{}};o.querySelector('header').insertAdjacentElement('afterend',p)}
function open(){ensureBountyProSkin();setTimeout(ensureBountyFooter,0);ensureCss();document.getElementById('slx-bh')?.remove();const o=document.createElement('div');o.id='slx-bh';o.innerHTML='<section><header><b>🎯 SakaLuX Bounty Hunter v'+VERSION+'</b><button data-api title="API">🔑</button><button data-r title="Refresh">↻</button><button data-x>×</button></header><div class="slx-bh-search"><input data-q placeholder="Search player / ID"><select data-sort><option value="smart">Smart sort ✦ PRO</option><option value="reward">Reward</option><option value="hospital">Hospital soon</option><option value="ff">Lowest FF ✦ PRO</option><option value="bs">Lowest BS ✦ PRO</option></select></div><button data-filters style="margin:8px 12px 4px;width:calc(100% - 24px);min-height:34px">⚙ Filters</button><div class="slx-bh-progress" data-progress hidden><div><span>Scanning…</span></div><i><b data-progress-bar></b></i></div><div class="slx-bh-settings"><div class="bar"><label>Mode<select data-mode><option value="safe">Safe</option><option value="profit">Profit</option></select></label><label>Source<select data-source-mode><option value="auto">Auto</option><option value="api">API</option><option value="dom">DOM</option></select></label><label>Min reward<input data-min type="number" step="10000"></label><label>Max level<input data-level type="number" min="1" max="100"></label><label>Hosp window min<input data-hosp type="number" min="0" max="240"></label><label>Min FF<input data-minff type="number" min="1" step="0.1"></label><label>Max FF<input data-ff type="number" min="1" step="0.1"></label><label>Max BS (0 off)<input data-bs type="number" min="0" step="1000"></label><label>Alert reward<input data-alert type="number" min="0" step="10000"></label><label>Max API pages<input data-pages type="number" min="1" max="100"></label><label>Live enrich count<input data-enrich-count type="number" min="1" max="25"></label></div><div class="slx-bh-tog"></div></div><div class="slx-bh-list"></div><div class="slx-bh-foot"><span data-count></span><span data-source></span></div></section>';document.body.appendChild(o);try{const panel=o.querySelector(':scope > section');o._slxWorkspaceCleanup=CORE?.ui?.applyWorkspaceLayout?.(o,panel,{top:0,bottom:36,side:4,maxWidth:760})||null}catch{};o.querySelector('[data-x]').onclick=()=>{try{o._slxWorkspaceCleanup?.()}catch{}o.remove()};o.addEventListener('click',e=>{if(e.target===o){try{o._slxWorkspaceCleanup?.()}catch{}o.remove()}});const bindNum=(sel,key,min,max)=>{const e=o.querySelector(sel);e.value=S[key];e.onchange=()=>{S[key]=Math.max(min,Math.min(max,num(e.value)));save();if(typeof syncFilters==='function')syncFilters();render(false)}};const mode=o.querySelector('[data-mode]'),src=o.querySelector('[data-source-mode]'),sort=o.querySelector('[data-sort]'),q=o.querySelector('[data-q]');const settings=o.querySelector('.slx-bh-settings'),filterBtn=o.querySelector('[data-filters]');const syncFilters=()=>{if(!settings||!filterBtn)return;settings.style.display=S.settingsOpen?'block':'none';filterBtn.textContent=(S.settingsOpen?'▴ Hide filters':'⚙ Filters')+' · FF '+num(S.minFF)+'–'+num(S.maxFF)+' · ≥'+fmt(S.minReward)};filterBtn.onclick=()=>{S.settingsOpen=!S.settingsOpen;save();syncFilters()};syncFilters();mode.value=S.mode;src.value=S.source;sort.value=bountyProEffective()?S.sort:'reward';q.value=S.query;mode.onchange=()=>{S.mode=mode.value;save();render(false)};src.onchange=()=>{S.source=src.value;save();render(true)};sort.onchange=async()=>{
  const wanted=sort.value;
  if(['smart','ff','bs'].includes(wanted)){
    sort.value=bountyProEffective()?S.sort:'reward';
    const guard=globalThis.SakaLuXFreemium?.['bounty-hunter'];
    let allowed=false;try{allowed=Boolean(await guard?.isPro?.())}catch(_){}
    if(!allowed){guard?.locked?.();return;}
  }
  S.sort=wanted;save();render(false);
};let qt=0;q.oninput=()=>{clearTimeout(qt);qt=setTimeout(()=>{S.query=q.value;save();render(false)},180)};bindNum('[data-min]','minReward',0,1e12);bindNum('[data-level]','maxLevel',1,100);bindNum('[data-hosp]','hospitalWindowMin',0,240);bindNum('[data-minff]','minFF',1,99);bindNum('[data-ff]','maxFF',1,99);bindNum('[data-bs]','maxBS',0,1e15);bindNum('[data-alert]','notifyMinReward',0,1e12);bindNum('[data-pages]','maxPages',1,100);bindNum('[data-enrich-count]','enrichCount',1,25);const tg=o.querySelector('.slx-bh-tog');const rebuild=()=>{tg.innerHTML='';tg.append(chip('Okay',S.okay,()=>{S.okay=!S.okay;save();rebuild();render(false)}),chip('Hospital',S.hospital,()=>{S.hospital=!S.hospital;save();rebuild();render(false)}),chip('Full board API ✦ PRO',S.fullBoard&&bountyProEffective(),()=>{if(!bountyProEffective()){globalThis.SakaLuXFreemium?.['bounty-hunter']?.locked?.();return;}S.fullBoard=!S.fullBoard;save();rebuild();render(true)}),chip('Beatable only ✦ PRO',S.onlyBeatable&&bountyProEffective(),()=>{if(!bountyProEffective()){globalThis.SakaLuXFreemium?.['bounty-hunter']?.locked?.();return;}S.onlyBeatable=!S.onlyBeatable;save();rebuild();render(false)}),chip('Safe FF 1–3',num(S.minFF)===1&&num(S.maxFF)===3,()=>{S.minFF=1;S.maxFF=3;S.onlyBeatable=true;S.includeUnknownFF=false;save();rebuild();render(false)}),chip('Unknown FF',S.includeUnknownFF,()=>{S.includeUnknownFF=!S.includeUnknownFF;save();rebuild();render(false)}),chip('Live status ✦ PRO',S.liveEnrich&&bountyProEffective(),()=>{if(!bountyProEffective()){globalThis.SakaLuXFreemium?.['bounty-hunter']?.locked?.();return;}S.liveEnrich=!S.liveEnrich;save();rebuild();render(true)}),chip('Watch only',S.watchOnly,()=>{S.watchOnly=!S.watchOnly;save();rebuild();render(false)}),chip('Target alerts',S.notifyTargets,()=>{S.notifyTargets=!S.notifyTargets;save();rebuild()}),chip('Hide unknown',S.hideUnknown,()=>{S.hideUnknown=!S.hideUnknown;save();rebuild();render(false)}),chip('Auto '+S.refreshSec+'s',S.autoRefresh,()=>{S.autoRefresh=!S.autoRefresh;save();schedule();rebuild()}),chip('Clear blacklist ('+Object.keys(BLACK).length+')',false,()=>{BLACK={};saveLists();rebuild();render(false)}))};rebuild();o.querySelector('[data-r]').onclick=()=>render(true);o.querySelector('[data-api]').onclick=()=>{const p=o.querySelector('.slx-bh-api');if(p)p.remove();else apiPanel(o)};clearInterval(tickTimer);tickTimer=setInterval(()=>{if(!document.getElementById('slx-bh'))return clearInterval(tickTimer);updateCountdowns()},1000);render(false)}
async function backgroundRefresh(){if(!S.enabled||busy)return;busy=true;try{await collect(false);maybeNotify(bestRows())}catch{}finally{busy=false}if(document.getElementById('slx-bh'))render(false)}
function schedule(){clearInterval(timer);timer=0;if(S.enabled&&S.autoRefresh)timer=setInterval(backgroundRefresh,Math.max(10,num(S.refreshSec)||20)*1000)}
function enable(v){S.enabled=!!v;save();button();schedule();bridge();return S.enabled}
function bridge(){let b=document.getElementById('sakalux-module-bridge-'+ID);if(!b){b=document.createElement('button');b.id='sakalux-module-bridge-'+ID;b.hidden=true;b.style.display='none';b.onclick=()=>{const a=b.dataset.action;if(a==='open')open();else if(a==='on')enable(true);else if(a==='off')enable(false);else if(a==='toggle')enable(!S.enabled);else if(a==='refresh')backgroundRefresh();b.dataset.action=''};document.documentElement.appendChild(b)}b.dataset.version=VERSION;b.dataset.enabled=String(S.enabled);b.dataset.ready='true'}
function go(){location.href='https://www.torn.com/bounties.php'}
function init(){ensureCss();removeLegacyLaunchers();bridge();schedule();pruneCaches();window[API]={id:ID,version:VERSION,open,refresh:()=>render(true),refreshBackground:backgroundRefresh,goToBounties:go,testTornAccess,createRequiredTornKey,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,getApiKeySource:keySource,health:()=>({version:VERSION,onBounties:onBounties(),loaded:lastRows.length,bounties:lastBountyRecords,watch:Object.keys(WATCH).length,blacklist:Object.keys(BLACK).length,source:lastSource,error:fatalHealthError(),warning:healthWarning(),apiAccessStatus,apiAccessMessage,apiAccessCheckedAt,fullBoard:S.fullBoard,liveEnrich:S.liveEnrich,keySource:keySource(),progress:PROG,scanResumeOffset:num(SCAN.nextOffset),scanDelay:num(SCAN.delay)||950,boardCacheAge:Date.now()-num(CACHE.at),ffCache:Object.keys(FFCACHE).length,userCache:Object.keys(UCACHE).length,rateCooldown:Math.max(0,getRateUntil()-Date.now()),distribution:'GreasyFork',greasyForkId:GREASYFORK_ID})};dispatchEvent(new CustomEvent('SakaLuX:ModuleReady',{detail:{id:ID,version:VERSION,apiGlobal:API}}));if(getKey())setTimeout(backgroundRefresh,800)}
document.readyState==='loading'?addEventListener('DOMContentLoaded',init,{once:true}):init();
})();