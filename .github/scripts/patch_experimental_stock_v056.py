from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

if '// @version      0.5.5' not in s:
    raise SystemExit('expected v0.5.5 source')
s=s.replace('// @version      0.5.5','// @version      0.5.6',1)
s=s.replace("version: '0.5.5'","version: '0.5.6'",1)
s=s.replace('Experimental Torn stock workspace with native per-stock row tools, inline metrics, ROI, Panic v2 and hardened direct trades.','Experimental Torn stock workspace with per-stock quick BUY/SELL presets, benefit progress, inline metrics, ROI, Panic v2 and hardened direct trades.',1)

# Insert benefit progress + quick trade helpers immediately before enhanceStockRows.
anchor='  function enhanceStockRows() {'
if anchor not in s:
    raise SystemExit('enhanceStockRows anchor missing')
helpers=r'''  function stockRowBenefitProgress(sym, owned) {
    const tier=benefitTier(sym,owned);
    if(!tier.next) return {pct:100,label:tier.tier?`Tier ${tier.tier} complete`:'No next tier',tier};
    const start=Math.max(0,Number(tier.keep)||0);
    const span=Math.max(1,Number(tier.next)-start);
    const pct=Math.max(0,Math.min(100,((Number(owned)||0)-start)/span*100));
    return {pct,label:`${pct.toFixed(1)}% to Tier ${tier.tier+1}`,tier};
  }

  function stockRowQuickOptions() {
    const vals=inlinePresetValues().slice(0,6);
    return [...vals,'max'];
  }

  async function stockRowQuickTrade(sym, side, rawAmount) {
    try {
      sym=String(sym||'').toUpperCase();
      const st=await ensureStock(sym);
      scanStocks();
      const owned=ownedShares(sym);
      const isMax=String(rawAmount||'').toLowerCase()==='max';
      const amount=isMax?0:Math.max(0,parseAmount(rawAmount));
      let shares=0;
      let estimate=0;

      if(side==='buy') {
        let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
        if(!cash && get(K.api).trim()) { await apiSync(); cash=Number(S.money)||0; }
        if(!cash) throw new Error('Unable to determine on-hand cash.');
        const keep=Math.max(0,parseAmount(get(K.keep,'0')));
        const spendable=Math.max(0,cash-keep);
        const budget=isMax?spendable:Math.min(amount,spendable);
        shares=Math.floor(budget/st.price);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Not enough spendable cash for ${sym}.`);
        if(!confirm(`Quick BUY ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated spend: ${money(estimate)}\nVault keep preserved: ${money(keep)}\n\nExecute now?`)) return;
        await postTrade(sym,shares,'buyShares');
        inlineStatus(`${bool(K.dryRun,false)?'Dry Run · ':''}Quick BUY ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      } else {
        if(!owned) throw new Error(`No ${sym} shares detected.`);
        const tier=benefitTier(sym,owned);
        const protectedShares=bool(K.benefitLock,true)?tier.keep:0;
        const sellable=Math.max(0,owned-protectedShares);
        if(sellable<=0) throw new Error('Benefit Lock: no sellable shares above the protected floor.');
        const requested=isMax?sellable:Math.ceil(amount/st.price);
        shares=Math.min(sellable,requested);
        estimate=shares*st.price;
        if(shares<=0) throw new Error(`Nothing to sell for ${sym}.`);
        if(!confirm(`Quick SELL ${sym}\n\nPreset: ${isMax?'MAX':String(rawAmount).toUpperCase()}\nShares: ${shares.toLocaleString()}\nEstimated proceeds: ${money(estimate)}\nProtected floor: ${protectedShares.toLocaleString()} shares\n\nExecute now?`)) return;
        await postTrade(sym,shares,'sellShares');
        inlineStatus(`${bool(K.dryRun,false)?'Dry Run · ':''}Quick SELL ${shares.toLocaleString()} ${sym} · ${money(estimate)}.`,'ok');
      }

      if(get(K.api).trim()&&!bool(K.dryRun,false)) await syncAllApi();
      scanStocks(); enhanceStockRows(); refreshInlinePanel();
    } catch(e) { inlineStatus(`Quick ${String(side||'trade').toUpperCase()} ${sym}: ${e.message}`,'bad'); }
  }

'''
s=s.replace(anchor,helpers+anchor,1)

# Replace the row HTML with v0.5.6 progress + quick trade controls.
old=re.compile(r'''      li\.innerHTML=`<div class="slx-row-stock"><b>\$\{esc\(sym\)\}</b><span>\$\{money\(m\.price\)\}</span></div><div class="slx-row-stat"><small>Owned</small><b>\$\{m\.owned\.toLocaleString\(\)\}</b><span>\$\{money\(m\.value\)\}</span></div><div class="slx-row-stat"><small>Avg buy</small><b>\$\{m\.avg\?money\(m\.avg\):'n/a'\}</b><span class="\$\{m\.pl===null\?'muted':m\.pl>=0\?'good':'bad'\}">\$\{plText\}</span></div><div class="slx-row-stat"><small>Benefit</small><b>\$\{tierLabel\}</b><span>\$\{nextText\}</span></div><div class="slx-row-actions"><button type="button" data-row-target="\$\{sym\}">Target</button><button type="button" class="primary" data-row-buy="\$\{sym\}" \$\{m\.nextGap\?'':'disabled'\}>Buy gap</button><button type="button" class="danger" data-row-sell="\$\{sym\}" \$\{m\.freeShares\?'':'disabled'\}>Sell excess</button></div>`;''')
match=old.search(s)
if not match:
    raise SystemExit('v0.5.5 row HTML not found')
new=r'''      const progress=stockRowBenefitProgress(sym,m.owned);
      const quickOptions=stockRowQuickOptions().map(v=>`<option value="${esc(v)}">${esc(String(v).toUpperCase())}</option>`).join('');
      li.innerHTML=`<div class="slx-row-stock"><b>${esc(sym)}</b><span>${money(m.price)}</span></div><div class="slx-row-stat"><small>Owned</small><b>${m.owned.toLocaleString()}</b><span>${money(m.value)}</span></div><div class="slx-row-stat"><small>Avg buy</small><b>${m.avg?money(m.avg):'n/a'}</b><span class="${m.pl===null?'muted':m.pl>=0?'good':'bad'}">${plText}</span></div><div class="slx-row-stat"><small>Benefit</small><b>${tierLabel}</b><span>${nextText}</span><div class="slx-row-progress"><i style="width:${progress.pct.toFixed(2)}%"></i></div><small class="slx-row-progress-label">${esc(progress.label)}</small></div><div class="slx-row-actions"><button type="button" data-row-target="${sym}">Target</button><button type="button" class="primary" data-row-buy="${sym}" ${m.nextGap?'':'disabled'}>Buy gap</button><button type="button" class="danger" data-row-sell="${sym}" ${m.freeShares?'':'disabled'}>Sell excess</button></div><div class="slx-row-quick"><select data-row-quick-amount="${sym}" title="Quick trade amount">${quickOptions}</select><button type="button" class="primary" data-row-quick-buy="${sym}">BUY</button><button type="button" class="danger" data-row-quick-sell="${sym}" ${m.owned?'':'disabled'}>SELL</button></div>`;'''
s=s[:match.start()]+new+s[match.end():]

# Bind quick BUY/SELL after existing row action bindings, before the next loop/function close.
bind_anchor="""      const sell=$('[data-row-sell]',li); if(sell) sell.onclick=()=>stockRowSellExcess(sym);
"""
if bind_anchor not in s:
    raise SystemExit('row action bind anchor missing')
bind_new=bind_anchor+"""      const qbuy=$('[data-row-quick-buy]',li); if(qbuy) qbuy.onclick=()=>stockRowQuickTrade(sym,'buy',$('[data-row-quick-amount]',li)?.value||'max');
      const qsell=$('[data-row-quick-sell]',li); if(qsell) qsell.onclick=()=>stockRowQuickTrade(sym,'sell',$('[data-row-quick-amount]',li)?.value||'max');
"""
s=s.replace(bind_anchor,bind_new,1)

# CSS: add progress and quick row; expand grid to allow a second full-width row.
css_anchor=".slx-stock-row-tools button:disabled{opacity:.38}"
if css_anchor not in s:
    raise SystemExit('row css anchor missing')
css_add=css_anchor+".slx-stock-row-tools .slx-row-progress{height:4px;border-radius:999px;background:#202d3a;overflow:hidden;margin-top:2px}.slx-stock-row-tools .slx-row-progress i{display:block;height:100%;background:linear-gradient(90deg,#2c8b52,#6bdc97);border-radius:999px}.slx-stock-row-tools .slx-row-progress-label{font-size:7px!important}.slx-stock-row-tools .slx-row-quick{grid-column:1/-1;display:grid;grid-template-columns:minmax(76px,120px) 72px 72px;gap:5px;justify-content:end;border-top:1px dashed #243548;padding-top:6px}.slx-stock-row-tools .slx-row-quick select{border:1px solid #415369;border-radius:7px;background:#17212c;color:#ecf4ff;padding:6px;font:800 9px Arial}"
s=s.replace(css_anchor,css_add,1)
# Mobile quick controls span all columns and stay thumb-friendly.
mobile_anchor=".slx-stock-row-tools button{padding:7px 4px!important}"
if mobile_anchor not in s:
    raise SystemExit('mobile row css anchor missing')
s=s.replace(mobile_anchor,mobile_anchor+".slx-stock-row-tools .slx-row-quick{grid-column:1/4;grid-template-columns:1fr 1fr 1fr;justify-content:stretch}.slx-stock-row-tools .slx-row-quick select{width:100%;padding:7px 4px}",1)

p.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.5.6**',m,count=1)
m=re.sub(r'(## Current release note\s*\n\n).*?(?=\n## )',r'''\1**v0.5.6** adds quick BUY/SELL presets and a live benefit-tier progress bar directly to every enhanced Torn stock row. Quick MAX respects the configured cash reserve on BUY and Benefit Lock on SELL.
''',m,count=1,flags=re.S)
change='''### v0.5.6 — Quick Row Trades & Benefit Progress

- Added a compact quick-trade selector to every enhanced stock row using the editable inline preset values plus **MAX**.
- Added direct **BUY** and **SELL** buttons beside the quick amount selector.
- Quick BUY converts the selected cash preset into shares using the live stock price.
- Quick BUY **MAX** spends only cash above the configured Vault Keep reserve.
- Quick SELL converts the selected cash preset into shares and never exceeds the available position.
- Quick SELL **MAX** sells only the sellable portion when Benefit Lock is enabled; protected benefit-floor shares are preserved.
- Every quick trade shows an exact confirmation with shares and estimated value before sending the order.
- Quick trades continue to use Dry Run, trade serialization/cooldown and the Action Log through the existing hardened trade path.
- Added a live progress bar for each stock showing percentage progress from the current benefit floor to the next detected tier.
- Added a progress label such as `63.2% to Tier 3` directly below the benefit status.
- Mobile/TornPDA layout keeps the amount selector and BUY/SELL controls on a dedicated full-width row.
- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.

'''
m=m.replace('## Changelog\n','## Changelog\n'+change,1)
md.write_text(m,encoding='utf-8')
