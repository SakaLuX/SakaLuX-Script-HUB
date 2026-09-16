from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version bump.
s=s.replace('// @version      0.4.1','// @version      0.4.2',1)
s=s.replace("version: '0.4.1'","version: '0.4.2'",1)
s=s.replace('Experimental Torn stock vault manager with hardened trades, ROI advisor, benefit valuation, Trade Assistant and one-tap Panic vault.','Experimental Torn stock vault manager with Panic v2, hardened trades, ROI advisor, benefit valuation and Trade Assistant.',1)

# Panic v2 storage.
old="""    benefitValues: 'SLX_STOCK_BENEFIT_VALUES',
    dryRun: 'SLX_STOCK_DRY_RUN',
    actionLog: 'SLX_STOCK_ACTION_LOG'
"""
new="""    benefitValues: 'SLX_STOCK_BENEFIT_VALUES',
    dryRun: 'SLX_STOCK_DRY_RUN',
    actionLog: 'SLX_STOCK_ACTION_LOG',
    panicFallback: 'SLX_STOCK_PANIC_FALLBACK',
    panicKeep: 'SLX_STOCK_PANIC_KEEP_CASH',
    panicMax: 'SLX_STOCK_PANIC_MAX_SPEND',
    panicUseAll: 'SLX_STOCK_PANIC_USE_ALL'
"""
if old not in s: raise SystemExit('storage marker missing')
s=s.replace(old,new,1)

# Replace panic functions with Panic v2 preview/execute flow.
start=s.find('  function panicButton() {')
end=s.find('\n  function style() {',start)
if start<0 or end<0: raise SystemExit('panic block not found')
new_panic=r'''  function panicButton() {
    if($('#slx-stock-panic')) return;
    const b=document.createElement('button');
    b.id='slx-stock-panic'; b.type='button'; b.textContent='PANIC'; b.title='Panic v2 · preview and vault on-hand cash into the configured stock target';
    b.addEventListener('click', panic);
    (document.body||document.documentElement).appendChild(b);
  }

  async function resolvePanicPreview() {
    const primary=get(K.target).toUpperCase();
    const fallback=get(K.panicFallback).toUpperCase();
    const candidates=[primary,fallback].filter((v,i,a)=>v && a.indexOf(v)===i);
    if(!candidates.length) throw new Error('Choose a Panic primary target first.');

    let cash=currentMoneyFromDom();
    if(get(K.api).trim()) {
      try { await apiSync(); cash=Number(S.money)||cash; } catch(e) { if(!cash) throw e; }
    }
    if(!cash) throw new Error('Unable to determine on-hand cash. Add/test the API key first.');

    const useAll=bool(K.panicUseAll,false);
    const keep=useAll ? 0 : parseAmount(get(K.panicKeep,get(K.keep,'0')));
    const maxSpend=useAll ? 0 : parseAmount(get(K.panicMax,'0'));
    const available=Math.max(0,cash-keep);
    const allowed=maxSpend>0?Math.min(available,maxSpend):available;
    if(allowed<=0) throw new Error(`No Panic cash available after keeping ${money(keep)}.`);

    let lastError=null;
    for(let i=0;i<candidates.length;i++) {
      const sym=candidates[i];
      try {
        const stock=await ensureStock(sym);
        const shares=Math.floor(allowed/stock.price);
        if(shares<=0){lastError=new Error(`${sym} is too expensive for the configured Panic spend.`);continue;}
        const estimate=shares*stock.price;
        return {sym,stock,cash,keep,maxSpend,available,allowed,shares,estimate,leftover:Math.max(0,cash-estimate),fallbackUsed:i>0,useAll};
      } catch(e) { lastError=e; }
    }
    throw lastError||new Error('No Panic target could be resolved.');
  }

  function panicPreviewText(x) {
    return `${x.fallbackUsed?'Fallback ':''}${x.sym} · ${x.shares.toLocaleString()} shares · about ${money(x.estimate)} · cash ${money(x.cash)} → ${money(x.leftover)} remaining${x.useAll?' · 100% mode':''}`;
  }

  async function previewPanic() {
    try {
      status('PANIC preview: calculating exact order…','warn');
      const x=await resolvePanicPreview();
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='ok';box.textContent=panicPreviewText(x);}
      status(`PANIC preview · ${panicPreviewText(x)}`,'ok');
      return x;
    } catch(e) {
      const box=$('#slx-panic-preview');
      if(box){box.dataset.kind='bad';box.textContent=e.message;}
      status(`PANIC preview failed: ${e.message}`,'bad');
      throw e;
    }
  }

  async function panic() {
    try {
      set(K.panicPending,'0');
      const x=await previewPanic();
      if(bool(K.panicConfirm,false)) {
        const ok=confirm(`PANIC v2\n\nTarget: ${x.sym}${x.fallbackUsed?' (fallback)':''}\nShares: ${x.shares.toLocaleString()}\nEstimated spend: ${money(x.estimate)}\nCash before: ${money(x.cash)}\nEstimated cash after: ${money(x.leftover)}\n\nExecute now?`);
        if(!ok){status('PANIC cancelled.','warn');return;}
      }
      status(`PANIC: buying ${x.shares.toLocaleString()} ${x.sym}…`,'warn');
      await postTrade(x.sym,x.shares,'buyShares');
      status(`PANIC complete · ${panicPreviewText(x)}`,'ok');
      if(get(K.api).trim() && !bool(K.dryRun,false)) syncAllApi().catch(()=>{});
    } catch(e) {
      set(K.panicPending,'0');
      status(`PANIC failed: ${e.message}`,'bad');
      openPanel();
    }
  }
'''
s=s[:start]+new_panic+s[end:]

# Add Panic v2 styling.
css_marker='#slx-stock-panel .safety-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}'
css_add=css_marker+'#slx-stock-panel .panic-preview{margin-top:8px;padding:8px;border:1px solid #2b3f53;border-radius:8px;background:#0d1721;color:#8fa2b6;font-size:10px;line-height:1.4}#slx-stock-panel .panic-preview[data-kind="ok"]{border-color:#267c52;color:#63df9a}#slx-stock-panel .panic-preview[data-kind="bad"]{border-color:#8c3140;color:#ff7a86}'
if css_marker not in s: raise SystemExit('css safety marker missing')
s=s.replace(css_marker,css_add,1)

# Upgrade Vault & Panic section fields/actions.
old_section='''      <div class="section"><div class="title">Vault & Panic</div><div class="grid">
        <label>Vault target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>
        <label>Keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
      </div><div class="actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault (Keep)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>
      <div class="actions"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label></div></div>'''
new_section='''      <div class="section"><div class="title">Vault & Panic v2</div><div class="grid">
        <label>Primary target <select id="slx-stock-target"><option value="">Sync API or open Stocks to detect symbols</option></select></label>
        <label>Fallback target <select id="slx-panic-fallback"><option value="">None</option></select></label>
        <label>Vault keep cash <input id="slx-stock-keep" value="${esc(get(K.keep,'0'))}" placeholder="e.g. 250k"></label>
        <label>Withdraw amount <input id="slx-stock-withdraw" value="${esc(get(K.withdraw,'1m'))}" placeholder="e.g. 1m"></label>
        <label>PANIC keep cash <input id="slx-panic-keep" value="${esc(get(K.panicKeep,get(K.keep,'0')))}" placeholder="e.g. 100k"></label>
        <label>PANIC max spend <input id="slx-panic-max" value="${esc(get(K.panicMax,'0'))}" placeholder="0 = unlimited"></label>
      </div><div class="actions"><button id="slx-vault-max" class="primary">Vault Max</button><button id="slx-vault-keep">Vault (Keep)</button><button id="slx-withdraw">Withdraw</button><button id="slx-withdraw-all">Withdraw All</button></div>
      <div class="actions"><label><input id="slx-benefit-lock" type="checkbox"> Lock Benefits</label><label><input id="slx-panic-confirm" type="checkbox"> Confirm Panic</label><label><input id="slx-panic-use-all" type="checkbox"> PANIC uses 100% cash</label><button id="slx-panic-preview-btn" type="button">Preview PANIC</button></div>
      <div id="slx-panic-preview" class="panic-preview">Preview shows target, exact shares, estimated spend and cash remaining before any order is sent.</div></div>'''
if old_section not in s: raise SystemExit('Vault & Panic section marker missing')
s=s.replace(old_section,new_section,1)

# Bind Panic v2 controls.
old_checks="""    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-dry-run',p).checked=bool(K.dryRun,true);
"""
new_checks="""    $('#slx-benefit-lock',p).checked=bool(K.benefitLock,true);
    $('#slx-panic-confirm',p).checked=bool(K.panicConfirm,false);
    $('#slx-panic-use-all',p).checked=bool(K.panicUseAll,false);
    $('#slx-dry-run',p).checked=bool(K.dryRun,true);
"""
if old_checks not in s: raise SystemExit('checkbox marker missing')
s=s.replace(old_checks,new_checks,1)

old_changes="""    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-dry-run',p).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');status(`Dry Run ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
"""
new_changes="""    $('#slx-stock-keep',p).onchange=e=>set(K.keep,e.target.value);
    $('#slx-stock-withdraw',p).onchange=e=>set(K.withdraw,e.target.value);
    $('#slx-panic-keep',p).onchange=e=>set(K.panicKeep,e.target.value);
    $('#slx-panic-max',p).onchange=e=>set(K.panicMax,e.target.value);
    $('#slx-benefit-lock',p).onchange=e=>set(K.benefitLock,e.target.checked?'1':'0');
    $('#slx-panic-confirm',p).onchange=e=>set(K.panicConfirm,e.target.checked?'1':'0');
    $('#slx-panic-use-all',p).onchange=e=>{set(K.panicUseAll,e.target.checked?'1':'0');status(`PANIC 100% cash mode ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
    $('#slx-panic-fallback',p).onchange=e=>set(K.panicFallback,e.target.value);
    $('#slx-panic-preview-btn',p).onclick=()=>previewPanic().catch(()=>{});
    $('#slx-dry-run',p).onchange=e=>{set(K.dryRun,e.target.checked?'1':'0');status(`Dry Run ${e.target.checked?'enabled':'disabled'}.`,e.target.checked?'warn':'ok');};
"""
if old_changes not in s: raise SystemExit('change handlers marker missing')
s=s.replace(old_changes,new_changes,1)

# Populate fallback target alongside primary target.
start=s.find('  function refreshTargetSelect() {')
end=s.find('\n  function openPanel()',start)
if start<0 or end<0: raise SystemExit('refreshTargetSelect bounds missing')
new_refresh=r'''  function refreshTargetSelect() {
    if(!S.panel?.isConnected) return;
    scanStocks();
    const primary=$('#slx-stock-target',S.panel), fallback=$('#slx-panic-fallback',S.panel);
    const current=get(K.target).toUpperCase(), currentFallback=get(K.panicFallback).toUpperCase();
    const list=[...S.stocks.keys()].sort();
    if(primary) primary.innerHTML='<option value="">Select stock…</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===current?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
    if(fallback) fallback.innerHTML='<option value="">None</option>'+list.map(sym=>`<option value="${esc(sym)}" ${sym===currentFallback?'selected':''}>${esc(sym)} · ${money(S.stocks.get(sym).price)}</option>`).join('');
  }
'''
s=s[:start]+new_refresh+s[end:]

# Clear preview when target changes and re-render advisor.
old="$('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);renderPortfolio();renderAdvisor();};"
new="$('#slx-stock-target',p).onchange=e=>{set(K.target,e.target.value);const v=$('#slx-panic-preview',p);if(v){v.dataset.kind='';v.textContent='Target changed · run Preview PANIC again.';}renderPortfolio();renderAdvisor();};"
if old not in s: raise SystemExit('primary target onchange marker missing')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

# Changelog update.
md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.4.2**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.4.2** introduces Panic v2: separate primary/fallback targets, Panic-only keep-cash, optional maximum spend, 100% cash mode and an exact pre-trade preview showing target, shares, estimated spend and cash remaining.\n''',m,count=1,flags=re.S)
h='## Changelog\n'
entry='''### v0.4.2 — Panic v2\n\n- Added separate **primary** and **fallback** Panic stock targets.\n- Fallback is used if the primary target cannot be resolved or cannot buy at least one share with the configured spend.\n- Added Panic-only **Keep cash** independent from normal Vault Keep.\n- Added **Maximum Panic spend**; `0` means unlimited.\n- Added optional **PANIC uses 100% cash** mode, which ignores Panic keep/max limits.\n- Added **Preview PANIC** with exact stock, share count, estimated spend, cash before and estimated cash remaining.\n- Confirm Panic now uses the calculated preview values instead of a generic confirmation.\n- Panic continues to buy directly from the current Torn page and remains protected by v0.4.1 trade locking/cooldown/Dry Run.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.4.2 — Panic v2' not in m: m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')
