from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')
if '// @version      0.5.4' not in s:
    raise SystemExit('expected v0.5.4 source')

s=s.replace('// @version      0.5.4','// @version      0.5.5',1)
s=s.replace("version: '0.5.4'","version: '0.5.5'",1)
s=s.replace('Experimental Torn stock workspace with native inline metrics, API mode, editable presets, configurable controls, ROI and hardened direct trades.','Experimental Torn stock workspace with native per-stock row tools, inline metrics, ROI, Panic v2 and hardened direct trades.',1)

# Add per-stock tools after averageBuy so it can reuse scan/portfolio helpers.
marker='''  function loadActionLog() {\n'''
if marker not in s:
    raise SystemExit('loadActionLog marker missing')
insert=r'''  function stockRowMetrics(sym) {
    const st=S.stocks.get(sym);
    if(!st) return null;
    const owned=ownedShares(sym);
    const avg=averageBuy(sym);
    const price=Number(st.price)||0;
    const value=owned*price;
    const cost=avg>0?owned*avg:null;
    const pl=cost===null?null:value-cost;
    const plPct=cost>0?(pl/cost)*100:null;
    const tier=benefitTier(sym,owned);
    const nextGap=tier.next&&tier.next>owned?tier.next-owned:0;
    const protectedShares=tier.keep||0;
    const freeShares=Math.max(0,owned-protectedShares);
    return {sym,st,owned,avg,price,value,cost,pl,plPct,tier,nextGap,protectedShares,freeShares};
  }

  async function stockRowBuyGap(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m) throw new Error(`${sym} is not available.`);
      if(!m.nextGap) throw new Error(`${sym} has no detected next benefit gap.`);
      let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      if(bool(K.inlineApiMode,true)&&get(K.api).trim()) {
        try { await apiSync(); cash=Math.max(cash,Number(S.money)||0); } catch {}
      }
      const shares=Math.min(m.nextGap,Math.floor(cash/m.price));
      if(shares<=0) throw new Error(`Not enough cash to buy ${sym}.`);
      const estimate=shares*m.price;
      if(!confirm(`BUY GAP · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nNext benefit gap: ${m.nextGap.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'buyShares');
      inlineStatus(`${bool(K.dryRun,false)?'Dry Run · ':''}BUY GAP ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim()&&!bool(K.dryRun,false)) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row BUY ${sym}: ${e.message}`,'bad'); }
  }

  async function stockRowSellExcess(sym) {
    try {
      scanStocks();
      const m=stockRowMetrics(sym);
      if(!m?.owned) throw new Error(`No ${sym} shares detected.`);
      const shares=m.freeShares;
      if(shares<=0) throw new Error(`${sym} has no shares above the protected benefit floor.`);
      const estimate=shares*m.price;
      if(!confirm(`SELL EXCESS · ${sym}\n\n${shares.toLocaleString()} shares\nEstimated: ${money(estimate)}\nProtected after sale: ${m.protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
      await postTrade(sym,shares,'sellShares');
      inlineStatus(`${bool(K.dryRun,false)?'Dry Run · ':''}SELL EXCESS ${shares.toLocaleString()} ${sym}.`,'ok');
      if(get(K.api).trim()&&!bool(K.dryRun,false)) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Row SELL ${sym}: ${e.message}`,'bad'); }
  }

  function enhanceStockRows() {
    if(!isStocks()) return;
    scanStocks();
    for(const [sym,st] of S.stocks) {
      const row=st?.row;
      if(!row?.isConnected) continue;
      const old=$('.slx-stock-row-tools',row);
      const m=stockRowMetrics(sym);
      if(!m) continue;
      const li=old||document.createElement('li');
      li.className='slx-stock-row-tools';
      li.dataset.sym=sym;
      const tierLabel=m.tier.tier?`Tier ${m.tier.tier}`:'No tier';
      const nextText=m.nextGap?`${m.nextGap.toLocaleString()} to next`:'No next gap';
      const plText=m.pl===null?'P/L n/a':`${m.pl>=0?'+':'-'}${money(Math.abs(m.pl))}${m.plPct===null?'':` (${m.plPct>=0?'+':''}${m.plPct.toFixed(2)}%)`}`;
      li.innerHTML=`<div class="slx-row-stock"><b>${esc(sym)}</b><span>${money(m.price)}</span></div><div class="slx-row-stat"><small>Owned</small><b>${m.owned.toLocaleString()}</b><span>${money(m.value)}</span></div><div class="slx-row-stat"><small>Avg buy</small><b>${m.avg?money(m.avg):'n/a'}</b><span class="${m.pl===null?'muted':m.pl>=0?'good':'bad'}">${plText}</span></div><div class="slx-row-stat"><small>Benefit</small><b>${tierLabel}</b><span>${nextText}</span></div><div class="slx-row-actions"><button type="button" data-row-target="${sym}">Target</button><button type="button" class="primary" data-row-buy="${sym}" ${m.nextGap?'':'disabled'}>Buy gap</button><button type="button" class="danger" data-row-sell="${sym}" ${m.freeShares?'':'disabled'}>Sell excess</button></div>`;
      if(!old) row.appendChild(li);
      $('[data-row-target]',li).onclick=e=>{e.preventDefault();e.stopPropagation();set(K.target,sym);refreshTargetSelect();refreshInlinePanel();enhanceStockRows();inlineStatus(`${sym} selected as target.`,'ok');};
      $('[data-row-buy]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowBuyGap(sym);};
      $('[data-row-sell]',li).onclick=e=>{e.preventDefault();e.stopPropagation();stockRowSellExcess(sym);};
      li.dataset.target=get(K.target).toUpperCase()===sym?'1':'0';
    }
  }

'''
s=s.replace(marker,insert+marker,1)

# Refresh row tools from inline refresh path.
needle="""    renderInlineWorkspace(get(K.inlineTab,''));
  }

  function style() {
"""
replace="""    renderInlineWorkspace(get(K.inlineTab,''));
    enhanceStockRows();
  }

  function style() {
"""
if needle not in s:
    raise SystemExit('refreshInlinePanel tail missing')
s=s.replace(needle,replace,1)

# Add CSS before media query.
css_marker='''@media(max-width:600px){'''
if css_marker not in s:
    raise SystemExit('media marker missing')
css=r'''#slx-stock-inline~ul .slx-stock-row-tools,.slx-stock-row-tools{list-style:none!important;display:grid;grid-template-columns:90px 1fr 1.15fr 1fr auto;gap:7px;align-items:center;width:100%;margin:7px 0 0!important;padding:8px!important;border-top:1px solid #2a3b4d;background:linear-gradient(180deg,#101923,#0c141c);color:#dce9f7;font-family:Arial,sans-serif;box-sizing:border-box}.slx-stock-row-tools *{box-sizing:border-box}.slx-stock-row-tools[data-target="1"]{box-shadow:inset 3px 0 #4da3ff}.slx-stock-row-tools .slx-row-stock,.slx-stock-row-tools .slx-row-stat{display:grid;gap:2px;min-width:0}.slx-stock-row-tools b{font-size:10px}.slx-stock-row-tools span,.slx-stock-row-tools small{font-size:8px;color:#8fa0b2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slx-stock-row-tools .good{color:#61e291}.slx-stock-row-tools .bad{color:#ff7a86}.slx-stock-row-tools .slx-row-actions{display:flex;gap:4px;justify-content:flex-end}.slx-stock-row-tools button{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px 7px;font:800 9px Arial}.slx-stock-row-tools button.primary{border-color:#2c8b52;color:#7ee09f;background:#102a1d}.slx-stock-row-tools button.danger{border-color:#8c3140;color:#ff7a86;background:#2b1016}.slx-stock-row-tools button:disabled{opacity:.38}
'''
s=s.replace(css_marker,css+css_marker,1)
# Add mobile rules inside existing media start.
s=s.replace('@media(max-width:600px){', '@media(max-width:600px){.slx-stock-row-tools{grid-template-columns:58px 1fr 1fr!important;gap:5px!important;padding:7px!important}.slx-stock-row-tools .slx-row-stat:nth-child(4){grid-column:1/3}.slx-stock-row-tools .slx-row-actions{grid-column:1/4;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))}.slx-stock-row-tools button{padding:7px 4px!important}',1)

# Ensure row tools are scheduled with SPA mounts.
s=s.replace("inlineMountTimer=setTimeout(()=>{if(isStocks()) mountInlinePanel(); else $('#slx-stock-inline')?.remove();},120);", "inlineMountTimer=setTimeout(()=>{if(isStocks()){mountInlinePanel();enhanceStockRows();} else {$('#slx-stock-inline')?.remove();$$('.slx-stock-row-tools').forEach(x=>x.remove());}},120);",1)
s=s.replace("style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(mountInlinePanel,250);", "style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(()=>{mountInlinePanel();enhanceStockRows();},250);",1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.5**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.5** enhances the original Torn stock rows themselves with live SakaLuX metrics and safe quick actions: Owned, market value, average buy, unrealized P/L, benefit tier, next-tier gap, Target, Buy Gap and Sell Excess.\n''',m,count=1,flags=re.S)
entry='''### v0.5.5 — Native Per-Stock Row Tools\n\n- Added a SakaLuX metrics/action strip directly inside every detected Torn stock row.\n- Shows symbol, live price, Owned shares, position value, Average Buy, unrealized P/L and P/L %.\n- Shows current benefit tier and the number of shares needed for the next detected tier.\n- Added per-stock **Target** button to change the active vault/PANIC target instantly.\n- Added per-stock **Buy gap** with exact confirmation and the hardened BUY path.\n- Added per-stock **Sell excess** that only sells shares above the currently protected benefit floor.\n- Row BUY/SELL respects Dry Run, trade locking and existing API refresh behavior.\n- Selected target is highlighted directly in the stock list.\n- Row tools remount after Torn SPA redraws and use a compact TornPDA/mobile layout.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
m=m.replace('## Changelog\n','## Changelog\n'+entry,1)
md.write_text(m,encoding='utf-8')
