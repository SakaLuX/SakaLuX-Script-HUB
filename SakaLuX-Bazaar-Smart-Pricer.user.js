// ==UserScript==
// @name         SakaLuX Bazaar Smart Pricer
// @namespace    sakalux.bazaar.smart.pricer
// @version      1.0.4
// @description  Smart Bazaar pricing for Torn: market value, lowest market listing, undercut rules, add-items and manage-bazaar quick pricing.
// @author       SakaLuX [2380374]
// @license      MIT
// @match        https://www.torn.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js
// @run-at       document-end
// ==/UserScript==

/*
  SakaLuX Bazaar Smart Pricer
  Rebuilt from the behavior of the MIT-licensed "Torn Bazaar Quick Pricer + Smart Bazaar Pricing Panel"
  by R4G3RUNN3R [3877028], based on Zedtrooper [3028329] + community extensions.
*/

(() => {
  'use strict';

  const NAME='SakaLuX Bazaar Smart Pricer';
  const VERSION='1.0.4';
  const PREFIX='sl-bsp';
  const K='SakaLuX_BAZAAR_SMART_PRICER_';
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  const get=(k,d)=>{ try { const v=GM_getValue(K+k,d); return v===undefined?d:v; } catch { return d; } };
  const set=(k,v)=>{ try { GM_setValue(K+k,v); } catch {} };

  const settings={
    enabled:get('enabled',true),
    apiKey:get('apiKey',''),
    pricingMode:get('pricingMode','market'),
    marketDiscount:Number(get('marketDiscount',0))||0,
    undercutType:get('undercutType','flat'),
    undercutValue:Number(get('undercutValue',1))||1,
    ignoreLow:get('ignoreLow',true),
    ignoreBelow:Number(get('ignoreBelow',1))||1,
    warnNpc:get('warnNpc',true),
    autoDecorate:get('autoDecorate',true),
    skipRwWeapons:get('skipRwWeapons',true),
    skipBonusItems:get('skipBonusItems',true),
    cacheMinutes:Number(get('cacheMinutes',5))||5
  };

  const save=()=>Object.entries(settings).forEach(([k,v])=>set(k,v));
  const state={busy:false,lastScan:0,priced:0,skipped:0,errors:0};
  const itemCache=new Map();
  const marketCache=new Map();
  const inFlight=new Map();

  function onBazaar(){ return /\/bazaar\.php/i.test(location.pathname+location.search+location.hash); }
  function money(n){ return '$'+Math.max(0,Math.round(Number(n)||0)).toLocaleString('en-US'); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function norm(s){ return String(s||'').replace(/\s+/g,' ').trim(); }

  function toast(text,type='info'){
    let t=qs('#'+PREFIX+'-toast');
    if(!t){t=document.createElement('div');t.id=PREFIX+'-toast';document.documentElement.appendChild(t);}
    t.dataset.type=type;t.textContent=text;t.classList.add('show');
    clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),3200);
  }

  function injectStyle(){
    if(qs('#'+PREFIX+'-style'))return;
    const s=document.createElement('style');s.id=PREFIX+'-style';
    s.textContent=`
#${PREFIX}-launcher{position:fixed;right:10px;bottom:104px;z-index:2147482500;width:52px;height:52px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.2);background:#7a6bd6;color:#fff;border-radius:50%;padding:0;font:900 30px/1 Arial,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.35);cursor:pointer;overflow:hidden}
#${PREFIX}-launcher:active{transform:scale(.96)}
#${PREFIX}-panel{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.64);display:none;align-items:flex-start;justify-content:center;padding:8px;box-sizing:border-box}
#${PREFIX}-panel.open{display:flex}
#${PREFIX}-card{width:min(520px,100%);max-height:calc(100dvh - 16px);overflow:auto;background:#0e151e;color:#edf3fa;border:1px solid #34465b;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);font:13px/1.4 Arial,sans-serif}
#${PREFIX}-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:#141e29;border-bottom:1px solid #34465b}
#${PREFIX}-head strong{font-size:15px}.sl-bsp-x{border:0;background:#253243;color:#fff;border-radius:9px;width:34px;height:34px;font-size:20px}
.sl-bsp-body{padding:12px}.sl-bsp-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}.sl-bsp-row.one{grid-template-columns:1fr}
.sl-bsp-field{display:flex;flex-direction:column;gap:4px}.sl-bsp-field label{color:#9eb0c3;font-size:11px;font-weight:700}.sl-bsp-field input,.sl-bsp-field select{width:100%;box-sizing:border-box;background:#172331;color:#fff;border:1px solid #3a4d63;border-radius:9px;padding:9px}
.sl-bsp-check{display:flex;align-items:center;gap:8px;padding:7px 0}.sl-bsp-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.sl-bsp-actions button,.sl-bsp-btn{border:1px solid #42566e;background:#1b2a3a;color:#fff;border-radius:10px;padding:9px 10px;font-weight:800}
.sl-bsp-primary{background:#244a73!important;border-color:#4f8fe8!important}.sl-bsp-danger{background:#4a2025!important;border-color:#8b3d46!important}
.${PREFIX}-addbar{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;margin:6px 0 10px;padding:8px;background:#101923;border:1px solid #34465b;border-radius:10px}
.${PREFIX}-quickfill{width:min(100%,360px);min-height:38px;border:1px solid #4f8fe8;background:#244a73;color:#fff;border-radius:9px;padding:8px 12px;font:900 12px/1.1 Arial,sans-serif;letter-spacing:.02em;cursor:pointer}
.${PREFIX}-quickfill:disabled{opacity:.6;cursor:wait}
#${PREFIX}-status{margin-top:10px;padding:9px;border-radius:9px;background:#0a1118;color:#9fb1c3;font-size:11px}
.${PREFIX}-rowbtn-wrap{display:flex;align-items:center;justify-content:center;flex:0 0 34px;width:34px;min-width:34px;margin:0 5px 0 3px;box-sizing:border-box;z-index:12}
.${PREFIX}-rowbtn{width:30px;height:30px;min-width:30px;display:inline-flex;align-items:center;justify-content:center;border:0;background:#7a6bd6;color:#fff;border-radius:9px;padding:0;font:900 22px/1 Arial,sans-serif;box-shadow:0 2px 7px rgba(0,0,0,.25);cursor:pointer}
.${PREFIX}-rowbtn:disabled{opacity:.32;cursor:not-allowed;box-shadow:none}
#${PREFIX}-toast{position:fixed;left:50%;bottom:90px;transform:translate(-50%,12px);opacity:0;pointer-events:none;z-index:2147483647;max-width:min(420px,92vw);background:#111b27;color:#fff;border:1px solid #3c526c;border-radius:10px;padding:9px 12px;font:700 12px Arial;transition:.18s}
#${PREFIX}-toast.show{opacity:1;transform:translate(-50%,0)}#${PREFIX}-toast[data-type="error"]{border-color:#b34d57}#${PREFIX}-toast[data-type="ok"]{border-color:#438a63}
@media(max-width:700px){#${PREFIX}-launcher{right:8px;bottom:92px;width:48px;height:48px;font-size:28px}.sl-bsp-row{grid-template-columns:1fr}.sl-bsp-actions{grid-template-columns:1fr}}
`;
    document.documentElement.appendChild(s);
  }

  function itemIdFromImg(img){
    const src=img?.src||img?.getAttribute?.('src')||'';
    const tries=[/\/images\/items\/(\d+)/i,/\/items\/(\d+)\//i,/\/(\d+)\/(?:medium|large|small|original)/i,/item(?:s)?\/(\d+)/i];
    for(const re of tries){const m=src.match(re);if(m)return Number(m[1]);}
    const d=img?.dataset||{};for(const k of ['item','itemId','id'])if(/^\d+$/.test(String(d[k]||'')))return Number(d[k]);
    return null;
  }

  function setNativeValue(input,value){
    const proto=input instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;
    const desc=Object.getOwnPropertyDescriptor(proto,'value');
    if(desc?.set)desc.set.call(input,String(value));else input.value=String(value);
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    input.dispatchEvent(new Event('blur',{bubbles:true}));
  }

  function rowFor(img){
    let el=img;
    for(let i=0;i<8&&el;i++,el=el.parentElement){
      if(!el.querySelectorAll)continue;
      const inputs=qsa('input',el).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio');
      if(inputs.length>=1&&norm(el.innerText||'').length<1500)return el;
    }
    return img.closest('tr,li,[class*="row"],[class*="item"]')||img.parentElement;
  }

  function pickPriceInput(row){
    const inputs=qsa('input',row).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio'&&!x.disabled);
    if(!inputs.length)return null;
    const score=i=>{
      const meta=(i.name+' '+i.id+' '+i.placeholder+' '+i.className+' '+(i.getAttribute('aria-label')||'')).toLowerCase();
      let s=0;if(/price|ppu|p\/u|each|unit/.test(meta))s+=10;if(/qty|quantity|amount|stock/.test(meta))s-=10;
      if(i.type==='text'||i.type==='number'||i.inputMode==='numeric')s+=2;
      const v=Number(String(i.value||'').replace(/[,\s$]/g,''));if(v>100)s+=1;return s;
    };
    return inputs.slice().sort((a,b)=>score(b)-score(a))[0]||null;
  }

  function bonusInfo(row){
    const icons=qsa('ul.bonuses-wrap li.bonus i[class*="bonus-attachment-"], i[class*="bonus-attachment-"]',row)
      .filter(i=>!String(i.className||'').includes('blank-bonus'));
    const names=icons.map(i=>{const m=String(i.className||'').match(/bonus-attachment-([a-z0-9-]+)/i);return m?.[1]||'bonus';});
    const rarity=!!row.querySelector('div.image-wrap[class*="glow-"], [class*="glow-yellow"], [class*="glow-orange"], [class*="glow-red"]');
    const bonusWrap=!!row.querySelector('ul.bonuses-wrap li.bonus:not(.blank-bonus), [class*="bonuses"] [class*="bonus"]');
    return {hasBonus:icons.length>0||bonusWrap,isRw:icons.length>0||rarity,names};
  }

  function skipReason(entry){
    const info=bonusInfo(entry.row);
    if(settings.skipRwWeapons&&info.isRw)return 'RW weapon';
    if(settings.skipBonusItems&&info.hasBonus)return info.names.length?`bonus item (${info.names.join(', ')})`:'bonus item';
    return '';
  }

  function pickQuantityControl(row){
    const choice=row.querySelector('div.choice-container, [class*="choiceContainer___"]');
    const checkbox=choice?.querySelector('input[type="checkbox"]')||null;
    if(checkbox)return{type:'checkbox',input:checkbox};
    const inputs=qsa('input',row).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio'&&!x.disabled);
    const scored=inputs.map(i=>{
      const meta=(i.name+' '+i.id+' '+i.placeholder+' '+i.className+' '+(i.getAttribute('aria-label')||'')).toLowerCase();
      let score=0;if(/qty|quantity|amount|stock/.test(meta))score+=12;if(/price|ppu|each|unit/.test(meta))score-=12;return{i,score};
    }).sort((a,b)=>b.score-a.score);
    const input=scored[0]?.score>0?scored[0].i:(inputs.length>=2?inputs[0]:null);
    return input?{type:'input',input}:null;
  }

  function quantityFromRow(row){
    const title=norm(row.querySelector('[class*="name___"], .title-wrap')?.textContent||'');
    const m=title.match(/\bx(\d+)\s*$/i);
    if(m)return Math.max(1,Number(m[1])||1);
    const text=norm(row.innerText||'');
    const n=text.match(/\bx(\d+)\b/i);
    return n?Math.max(1,Number(n[1])||1):1;
  }

  function fillQuantity(entry){
    const q=entry.qty||pickQuantityControl(entry.row);if(!q)return false;
    if(q.type==='checkbox'){
      if(!q.input.checked)q.input.click();
      return true;
    }
    const amount=quantityFromRow(entry.row);
    setNativeValue(q.input,amount);
    q.input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'0'}));
    return true;
  }

  function request(url){
    return new Promise((resolve,reject)=>{
      if(!settings.apiKey)return reject(new Error('API key missing'));
      GM_xmlhttpRequest({method:'GET',url,timeout:12000,
        onload:r=>{try{const d=JSON.parse(r.responseText);if(d?.error)reject(new Error(d.error.error||d.error.message||'API error'));else resolve(d);}catch(e){reject(e);}},
        onerror:()=>reject(new Error('Network error')),ontimeout:()=>reject(new Error('Timeout'))});
    });
  }

  function extractItemObject(data,id){return data?.items?.[id]||data?.items?.[String(id)]||data?.item||data?.[id]||null;}

  async function fetchItem(id){
    const c=itemCache.get(id);if(c&&Date.now()-c.ts<settings.cacheMinutes*60000)return c;
    const key='item:'+id;if(inFlight.has(key))return inFlight.get(key);
    const p=(async()=>{const d=await request(`https://api.torn.com/torn/${id}?selections=items&key=${encodeURIComponent(settings.apiKey)}`);const it=extractItemObject(d,id);if(!it)throw new Error('Item data unavailable');const out={marketValue:Number(it.market_value||it.marketValue||0),sellPrice:Number(it.sell_price||it.sellPrice||0),name:it.name||('Item #'+id),ts:Date.now()};itemCache.set(id,out);return out;})().finally(()=>inFlight.delete(key));
    inFlight.set(key,p);return p;
  }

  function collectListingPrices(data){
    const raw=data?.itemmarket||data?.itemMarket||data?.listings||data?.market?.listings||[];
    const arr=Array.isArray(raw)?raw:Object.values(raw||{});
    return arr.map(x=>Number(x?.price??x?.cost??x)).filter(x=>Number.isFinite(x)&&x>0);
  }

  async function fetchLowest(id){
    const c=marketCache.get(id);if(c&&Date.now()-c.ts<Math.min(settings.cacheMinutes,2)*60000)return c.price;
    const key='market:'+id;if(inFlight.has(key))return inFlight.get(key);
    const p=(async()=>{let err=null;const urls=[`https://api.torn.com/market/${id}?selections=itemmarket&key=${encodeURIComponent(settings.apiKey)}`,`https://api.torn.com/v2/market/${id}/itemmarket?key=${encodeURIComponent(settings.apiKey)}`];for(const u of urls){try{const data=await request(u);const prices=collectListingPrices(data);if(prices.length){let list=prices;if(settings.ignoreLow)list=list.filter(x=>x>settings.ignoreBelow);const lowest=list.length?Math.min(...list):0;marketCache.set(id,{price:lowest,ts:Date.now()});return lowest;}}catch(e){err=e;}}if(err)throw err;return 0;})().finally(()=>inFlight.delete(key));
    inFlight.set(key,p);return p;
  }

  async function computePrice(id){
    const item=await fetchItem(id);let lowest=0;if(settings.pricingMode!=='market')lowest=await fetchLowest(id);let price=0;
    if(settings.pricingMode==='market')price=Math.round(item.marketValue*(1-settings.marketDiscount/100));
    else if(settings.pricingMode==='lowest')price=Math.round(lowest);
    else if(settings.pricingMode==='undercut'){if(!(lowest>0))throw new Error('No valid market listing');price=settings.undercutType==='percent'?Math.round(lowest*(1-settings.undercutValue/100)):Math.round(lowest-settings.undercutValue);}
    if(!(price>0))throw new Error('No valid price');return{price:Math.max(1,price),item,lowest};
  }

  function findRows(){
    const out=[],seen=new Set();
    for(const img of qsa('img')){const id=itemIdFromImg(img);if(!id)continue;const row=rowFor(img);if(!row||seen.has(row))continue;const input=pickPriceInput(row);if(!input)continue;const qty=pickQuantityControl(row);seen.add(row);out.push({id,img,row,input,qty});}
    return out;
  }

  function isAddItemsPage(){
    if(!onBazaar())return false;
    const route=(location.search+' '+location.hash).toLowerCase();
    if(/add[-_ ]?items?|additem/.test(route))return true;
    const text=norm(document.body?.innerText||'');
    if(/\badd items?\b/i.test(text)&&findRows().length)return true;
    return findRows().some(e=>{
      const inputs=qsa('input',e.row).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio'&&!x.disabled);
      if(inputs.length<2)return false;
      const meta=inputs.map(i=>(i.name+' '+i.id+' '+i.placeholder+' '+i.className+' '+(i.getAttribute('aria-label')||''))).join(' ').toLowerCase();
      return /qty|quantity|amount/.test(meta)&&/price|ppu|each|unit/.test(meta);
    });
  }

  function addItemsInsertionPoint(){
    const rows=findRows();
    const first=rows[0]?.row;
    if(first?.parentElement)return {parent:first.parentElement,before:first};
    const host=qs('#mainContainer .content-wrapper')||qs('.content-wrapper')||qs('#mainContainer')||document.body;
    return {parent:host,before:host.firstChild};
  }

  function injectAddItemsQuickFill(){
    const old=qs('#'+PREFIX+'-addbar');
    if(!isAddItemsPage()){old?.remove();return;}
    if(old)return;
    const point=addItemsInsertionPoint();if(!point?.parent)return;
    const bar=document.createElement('div');bar.id=PREFIX+'-addbar';bar.className=PREFIX+'-addbar';
    const b=document.createElement('button');b.type='button';b.className=PREFIX+'-quickfill';b.innerHTML='<b>S</b> QUICK FILL';b.title='Fill quantity and price for all visible Bazaar add-item rows';
    b.onclick=async ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}
      if(state.busy)return;
      b.disabled=true;const oldText=b.innerHTML;b.textContent='PRICING…';
      try{await priceAll();}finally{b.disabled=false;b.innerHTML=oldText;}
    };
    bar.appendChild(b);
    point.parent.insertBefore(bar,point.before||null);
  }

  async function priceEntry(entry,{silent=false}={}){
    try{const reason=skipReason(entry);if(reason){state.skipped++;entry.row.dataset.slBspSkip=reason;if(!silent)toast(`Skipped item #${entry.id}: ${reason}`,'error');return false;}const r=await computePrice(entry.id);setNativeValue(entry.input,r.price);entry.input.dataset.slBspPriced=String(r.price);fillQuantity(entry);state.priced++;if(settings.warnNpc&&r.item.sellPrice>0&&r.price<r.item.sellPrice&&!silent)toast(`${r.item.name}: ${money(r.price)} is below NPC ${money(r.item.sellPrice)}`,'error');return true;}
    catch(e){state.skipped++;if(!silent)toast(`Skipped item #${entry.id}: ${e.message}`,'error');return false;}
  }

  async function priceAll(){
    if(state.busy)return;if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}
    const rows=findRows();if(!rows.length){toast('No Bazaar price fields detected.','error');return;}
    state.busy=true;state.priced=0;state.skipped=0;launcherText(`Pricing 0/${rows.length}`);
    for(let i=0;i<rows.length;i++){await priceEntry(rows[i],{silent:true});launcherText(`Pricing ${i+1}/${rows.length}`);await sleep(120);}
    state.busy=false;launcherText();toast(`Priced ${state.priced}; skipped ${state.skipped}.`,'ok');refreshStatus();
  }

  function decorateRows(){
    if(!settings.autoDecorate||!onBazaar())return;
    for(const e of findRows()){
      let old=qs('.'+PREFIX+'-rowbtn-wrap',e.row)||qs('.'+PREFIX+'-rowbtn',e.row);
      if(old&&old.dataset?.placement==='before-qty')continue;
      if(old){const target=old.classList?.contains(PREFIX+'-rowbtn-wrap')?old:old.parentElement?.classList?.contains(PREFIX+'-rowbtn-wrap')?old.parentElement:old;target?.remove();}

      const qtyEl=e.qty?.input||null;
      let amountWrap=qtyEl?.closest?.('div[class*="amount___"], .amount-main-wrap, [class*="amount"], [class*="quantity"], [class*="qty"]')||null;
      if(!amountWrap&&qtyEl)amountWrap=qtyEl.parentElement;
      const priceWrap=e.input?.closest?.('div[class*="price___"], div.price, [class*="price"]')||e.input?.parentElement||null;
      const parent=amountWrap?.parentElement||priceWrap?.parentElement||e.row;
      const before=amountWrap&&amountWrap.parentElement===parent?amountWrap:(priceWrap&&priceWrap.parentElement===parent?priceWrap:null);
      if(!parent)continue;

      const wrap=document.createElement('div');wrap.className=PREFIX+'-rowbtn-wrap';wrap.dataset.placement='before-qty';
      const b=document.createElement('button');b.type='button';b.className=PREFIX+'-rowbtn';b.textContent='+';b.dataset.placement='before-qty';
      const reason=skipReason(e);
      if(reason){b.disabled=true;b.title=`Skipped automatically: ${reason}`;b.setAttribute('aria-label',b.title);}else{
        b.title='Fill full quantity and smart price';b.setAttribute('aria-label',b.title);
        b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}b.disabled=true;try{await priceEntry(e);}finally{b.disabled=false;}};
      }
      wrap.appendChild(b);parent.insertBefore(wrap,before);
    }
  }

  function launcherText(temp=''){const b=qs('#'+PREFIX+'-launcher');if(!b)return;b.textContent=temp?temp.replace(/^Pricing\s*/i,''):'+';b.style.fontSize=temp?'11px':'';}

  function injectLauncher(){
    if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();return;}if(qs('#'+PREFIX+'-launcher'))return;
    const b=document.createElement('button');b.id=PREFIX+'-launcher';b.type='button';b.textContent='+';b.title='SakaLuX Bazaar Smart Pricer';b.setAttribute('aria-label',b.title);b.onclick=openPanel;document.documentElement.appendChild(b);
  }

  function panelHtml(){
    return `<div id="${PREFIX}-card"><div id="${PREFIX}-head"><div><strong>SakaLuX Bazaar Smart Pricer</strong><div style="color:#91a3b7;font-size:10px">v${VERSION}</div></div><button class="sl-bsp-x" type="button">×</button></div><div class="sl-bsp-body">
      <div class="sl-bsp-row one"><div class="sl-bsp-field"><label>Torn API key</label><input id="${PREFIX}-api" type="password" autocomplete="off" value="${esc(settings.apiKey)}" placeholder="Public/read-only Torn API key"></div></div>
      <div class="sl-bsp-row"><div class="sl-bsp-field"><label>Pricing mode</label><select id="${PREFIX}-mode"><option value="market">Torn market value</option><option value="lowest">Lowest item-market listing</option><option value="undercut">Undercut lowest listing</option></select></div><div class="sl-bsp-field"><label>Market discount %</label><input id="${PREFIX}-discount" type="number" min="0" max="99" step="0.1" value="${settings.marketDiscount}"></div></div>
      <div class="sl-bsp-row"><div class="sl-bsp-field"><label>Undercut type</label><select id="${PREFIX}-utype"><option value="flat">Flat $</option><option value="percent">Percent %</option></select></div><div class="sl-bsp-field"><label>Undercut value</label><input id="${PREFIX}-uvalue" type="number" min="0" step="0.1" value="${settings.undercutValue}"></div></div>
      <div class="sl-bsp-row"><div class="sl-bsp-field"><label>Ignore listings ≤ $</label><input id="${PREFIX}-ignorebelow" type="number" min="0" value="${settings.ignoreBelow}"></div><div class="sl-bsp-field"><label>Cache minutes</label><input id="${PREFIX}-cache" type="number" min="1" max="60" value="${settings.cacheMinutes}"></div></div>
      <label class="sl-bsp-check"><input id="${PREFIX}-ignore" type="checkbox"> Ignore ultra-low / storage listings</label>
      <label class="sl-bsp-check"><input id="${PREFIX}-npc" type="checkbox"> Warn when calculated price is below NPC sell price</label>
      <label class="sl-bsp-check"><input id="${PREFIX}-decor" type="checkbox"> Add + button before Qty (fills full quantity + price)</label>
      <label class="sl-bsp-check"><input id="${PREFIX}-skiprw" type="checkbox"> Skip Ranked War (RW) weapons</label>
      <label class="sl-bsp-check"><input id="${PREFIX}-skipbonus" type="checkbox"> Skip items / weapons with bonus icons</label>
      <div class="sl-bsp-actions"><button id="${PREFIX}-save" class="sl-bsp-primary" type="button">SAVE SETTINGS</button><button id="${PREFIX}-priceall" type="button">PRICE ALL VISIBLE</button><button id="${PREFIX}-test" type="button">TEST API</button><button id="${PREFIX}-clear" class="sl-bsp-danger" type="button">CLEAR CACHE</button></div><div id="${PREFIX}-status"></div></div></div>`;
  }

  function ensurePanel(){
    if(qs('#'+PREFIX+'-panel'))return;
    const p=document.createElement('div');p.id=PREFIX+'-panel';p.innerHTML=panelHtml();document.documentElement.appendChild(p);
    qs('.sl-bsp-x',p).onclick=()=>p.classList.remove('open');p.addEventListener('click',e=>{if(e.target===p)p.classList.remove('open');});
    qs('#'+PREFIX+'-mode',p).value=settings.pricingMode;qs('#'+PREFIX+'-utype',p).value=settings.undercutType;qs('#'+PREFIX+'-ignore',p).checked=settings.ignoreLow;qs('#'+PREFIX+'-npc',p).checked=settings.warnNpc;qs('#'+PREFIX+'-decor',p).checked=settings.autoDecorate;qs('#'+PREFIX+'-skiprw',p).checked=settings.skipRwWeapons;qs('#'+PREFIX+'-skipbonus',p).checked=settings.skipBonusItems;
    qs('#'+PREFIX+'-save',p).onclick=()=>{settings.apiKey=qs('#'+PREFIX+'-api',p).value.trim();settings.pricingMode=qs('#'+PREFIX+'-mode',p).value;settings.marketDiscount=Math.max(0,Number(qs('#'+PREFIX+'-discount',p).value)||0);settings.undercutType=qs('#'+PREFIX+'-utype',p).value;settings.undercutValue=Math.max(0,Number(qs('#'+PREFIX+'-uvalue',p).value)||0);settings.ignoreBelow=Math.max(0,Number(qs('#'+PREFIX+'-ignorebelow',p).value)||0);settings.cacheMinutes=Math.max(1,Number(qs('#'+PREFIX+'-cache',p).value)||5);settings.ignoreLow=qs('#'+PREFIX+'-ignore',p).checked;settings.warnNpc=qs('#'+PREFIX+'-npc',p).checked;settings.autoDecorate=qs('#'+PREFIX+'-decor',p).checked;settings.skipRwWeapons=qs('#'+PREFIX+'-skiprw',p).checked;settings.skipBonusItems=qs('#'+PREFIX+'-skipbonus',p).checked;save();itemCache.clear();marketCache.clear();toast('Settings saved.','ok');scan(true);};
    qs('#'+PREFIX+'-priceall',p).onclick=priceAll;qs('#'+PREFIX+'-clear',p).onclick=()=>{itemCache.clear();marketCache.clear();toast('Runtime cache cleared.','ok');refreshStatus();};
    qs('#'+PREFIX+'-test',p).onclick=async()=>{settings.apiKey=qs('#'+PREFIX+'-api',p).value.trim();if(!settings.apiKey)return toast('Enter an API key.','error');try{await request(`https://api.torn.com/user/?selections=basic&key=${encodeURIComponent(settings.apiKey)}`);toast('API key works.','ok');}catch(e){toast('API test failed: '+e.message,'error');}};
    refreshStatus();
  }

  function refreshStatus(){const s=qs('#'+PREFIX+'-status');if(!s)return;const rows=onBazaar()?findRows().length:0;s.innerHTML=`Page: <b>${onBazaar()?'Bazaar':'outside Bazaar'}</b> · detected price fields: <b>${rows}</b><br>Mode: <b>${esc(settings.pricingMode)}</b> · API: <b>${settings.apiKey?'saved':'missing'}</b> · RW skip: <b>${settings.skipRwWeapons?'ON':'OFF'}</b> · Bonus skip: <b>${settings.skipBonusItems?'ON':'OFF'}</b> · last priced: <b>${state.priced}</b> · skipped: <b>${state.skipped}</b>`;}
  function openPanel(){ensurePanel();qs('#'+PREFIX+'-panel').classList.add('open');refreshStatus();}
  function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();qs('#'+PREFIX+'-addbar')?.remove();qsa('.'+PREFIX+'-rowbtn-wrap, .'+PREFIX+'-rowbtn').forEach(x=>x.remove());return;}injectLauncher();injectAddItemsQuickFill();if(settings.autoDecorate)decorateRows();else qsa('.'+PREFIX+'-rowbtn-wrap, .'+PREFIX+'-rowbtn').forEach(x=>x.remove());state.lastScan=Date.now();if(force)refreshStatus();}

  let timer=null;const schedule=()=>{clearTimeout(timer);timer=setTimeout(()=>scan(),300);};
  injectStyle();scan(true);
  const mo=new MutationObserver(records=>{if(records.every(r=>r.target?.closest?.('#'+PREFIX+'-panel, #'+PREFIX+'-launcher')))return;schedule();});
  mo.observe(document.documentElement,{subtree:true,childList:true});
  window.addEventListener('hashchange',()=>setTimeout(()=>scan(true),80),{passive:true});window.addEventListener('popstate',()=>setTimeout(()=>scan(true),80),{passive:true});

  window.SakaLuXBazaarSmartPricer={version:VERSION,open:openPanel,refresh:()=>scan(true),priceAll,quickFill:priceAll,isEnabled:()=>!!settings.enabled,setEnabled:v=>{settings.enabled=!!v;save();scan(true);return settings.enabled;}};
  console.info(`[${NAME}] loaded v${VERSION}`);
})();