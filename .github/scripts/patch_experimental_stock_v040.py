from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version bump.
s=s.replace('// @version      0.3.0','// @version      0.4.0',1)
s=s.replace("version: '0.3.0'","version: '0.4.0'",1)
s=s.replace('Experimental Torn stock vault manager, benefit-safe withdrawals, portfolio advisor and one-tap Panic vault.','Experimental Torn stock vault manager with ROI advisor, benefit valuation, trade assistant and one-tap Panic vault.',1)

# Storage keys.
old="""    presets: 'SLX_STOCK_PRESETS',
    tx: 'SLX_STOCK_TX_CACHE'
"""
new="""    presets: 'SLX_STOCK_PRESETS',
    tx: 'SLX_STOCK_TX_CACHE',
    benefitValues: 'SLX_STOCK_BENEFIT_VALUES'
"""
if old not in s: raise SystemExit('K marker missing')
s=s.replace(old,new,1)

# Benefit valuation model. Values that are item-based are fetched from Torn; cash defaults are editable.
marker="""  const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null };
"""
insert="""  const BENEFIT_MODELS = {
    MUN:{type:'item',id:818,freq:7,label:'Six-Pack of Energy Drink'},
    ASS:{type:'item',id:817,freq:7,label:'Six-Pack of Alcohol'},
    HRG:{type:'manual',freq:31,label:'Average property value'},
    LSC:{type:'item',id:369,freq:7,label:'Lottery Voucher'},
    LAG:{type:'item',id:368,freq:14,label:'Lawyer Business Card'},
    FHG:{type:'item',id:367,freq:7.75,label:'Feathery Hotel Coupon'},
    PRN:{type:'item',id:366,freq:7,label:'Erotic DVD'},
    SYM:{type:'item',id:370,freq:7,label:'Drug Pack'},
    TCC:{type:'average',ids:[1057,1112,1113,1114,1115,1116,1117],freq:31,label:'Average clothing cache'},
    THS:{type:'item',id:365,freq:7,label:'Box of Medical Supplies'},
    EWM:{type:'item',id:364,freq:7,label:'Box of Grenades'},
    CNC:{type:'cash',value:80000000,freq:31,label:'Cash-equivalent benefit'},
    TSB:{type:'cash',value:50000000,freq:31,label:'Cash dividend'},
    TMI:{type:'cash',value:25000000,freq:31,label:'Cash dividend'},
    IOU:{type:'cash',value:12000000,freq:31,label:'Cash dividend'},
    GRN:{type:'cash',value:4000000,freq:31,label:'Cash dividend'},
    TCT:{type:'cash',value:1000000,freq:31,label:'Cash-equivalent benefit'}
  };

  const S = { stocks:new Map(), portfolio:{}, money:null, panel:null, status:null, benefitPrices:{} };
"""
if marker not in s: raise SystemExit('S marker missing')
s=s.replace(marker,insert,1)

# Replace benefitTier with cumulative active-tier math: base + 2x base + 4x base ...
start=s.find('  function benefitTier(sym, shares) {')
end=s.find('\n  function scanStocks() {',start)
if start<0 or end<0: raise SystemExit('benefitTier block missing')
new_bt="""  function benefitTier(sym, shares) {
    const d=BENEFITS[sym];
    if(!d) return {tier:0,keep:0,next:0,nextBlock:0};
    shares=Math.max(0,Number(shares)||0);
    if(d.type==='P') return shares>=d.base ? {tier:1,keep:d.base,next:0,nextBlock:0} : {tier:0,keep:0,next:d.base,nextBlock:d.base};
    let tier=0;
    while(shares >= d.base*(Math.pow(2,tier+1)-1)) tier++;
    const keep=tier>0 ? d.base*(Math.pow(2,tier)-1) : 0;
    const next=d.base*(Math.pow(2,tier+1)-1);
    const nextBlock=d.base*Math.pow(2,tier);
    return {tier,keep,next,nextBlock};
  }

  function loadBenefitOverrides() {
    try { return JSON.parse(get(K.benefitValues,'{}'))||{}; } catch { return {}; }
  }

  function saveBenefitOverrides(v) { set(K.benefitValues,JSON.stringify(v||{})); }

  function benefitValueInfo(sym) {
    const model=BENEFIT_MODELS[sym];
    if(!model) return {value:0,freq:0,label:'Not modelled',source:'none'};
    const overrides=loadBenefitOverrides();
    const ov=overrides[sym]||{};
    const freq=Number(ov.freq)>0?Number(ov.freq):Number(model.freq||0);
    let value=Number(ov.value)>0?Number(ov.value):0;
    let source=Number(ov.value)>0?'manual':'default';
    if(!value && model.type==='cash') value=Number(model.value||0);
    if(!value && model.type==='item') { value=Number(S.benefitPrices[model.id]||0); source=value?'Torn market':'missing'; }
    if(!value && model.type==='average') {
      const vals=(model.ids||[]).map(id=>Number(S.benefitPrices[id]||0)).filter(v=>v>0);
      if(vals.length){ value=vals.reduce((a,b)=>a+b,0)/vals.length; source='Torn market avg'; }
    }
    if(model.type==='manual' && !value) source='manual required';
    return {value,freq,label:model.label||sym,source};
  }

  function benefitDailyValue(sym) {
    const i=benefitValueInfo(sym);
    return i.value>0 && i.freq>0 ? i.value/i.freq : 0;
  }

  async function fetchBenefitMarketValues() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const ids=[...new Set(Object.values(BENEFIT_MODELS).flatMap(m=>m.id?[m.id]:(m.ids||[])))];
    let ok=0;
    status(`Benefit values: fetching 0/${ids.length}…`,'warn');
    for(let i=0;i<ids.length;i++) {
      const id=ids[i];
      try {
        const r=await fetch(`https://api.torn.com/v2/torn/${id}/items?key=${encodeURIComponent(key)}&ts=${Date.now()}`,{credentials:'omit'});
        const d=await r.json();
        if(d?.error) throw new Error(d.error.error||'API error');
        let price=Number(d?.value?.market_price||d?.items?.[0]?.value?.market_price||d?.items?.[0]?.market_value||d?.market_price||0);
        if(price>0){S.benefitPrices[id]=price;ok++;}
      } catch {}
      status(`Benefit values: fetching ${i+1}/${ids.length}…`,'warn');
      await new Promise(r=>setTimeout(r,80));
    }
    renderBenefitValues(); renderAdvisor(); renderTradeAssistant();
    status(`Benefit values updated: ${ok}/${ids.length} market prices loaded.`,'ok');
    return ok;
  }

  function buildRoiCandidates() {
    scanStocks();
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const rows=[];
    for(const [sym,model] of Object.entries(BENEFIT_MODELS)) {
      const d=BENEFITS[sym], st=S.stocks.get(sym);
      if(!d || !st?.price) continue;
      const daily=benefitDailyValue(sym);
      if(daily<=0) continue;
      const owned=ownedShares(sym);
      const tier=benefitTier(sym,owned);
      if(d.type==='P' && tier.tier>=1) continue;
      const targetShares=d.type==='P'?d.base:tier.next;
      const sharesNeeded=Math.max(0,targetShares-owned);
      if(sharesNeeded<=0) continue;
      const marginalShares=d.type==='P'?d.base:tier.nextBlock;
      const marginalCapital=marginalShares*st.price;
      const cost=sharesNeeded*st.price;
      const annual=daily*365;
      const roi=marginalCapital>0?(annual/marginalCapital)*100:0;
      if(!(roi>0)) continue;
      rows.push({sym,model,tier:tier.tier+1,owned,targetShares,sharesNeeded,price:st.price,cost,marginalCapital,daily,annual,roi,affordable:cash>=cost,cash});
    }
    return rows.sort((a,b)=>b.roi-a.roi || a.cost-b.cost);
  }

  function renderBenefitValues() {
    const box=$('#slx-stock-benefit-values'); if(!box) return;
    const overrides=loadBenefitOverrides();
    const rows=Object.keys(BENEFIT_MODELS).sort().map(sym=>{
      const m=BENEFIT_MODELS[sym], i=benefitValueInfo(sym), ov=overrides[sym]||{};
      return `<div class="benefit-row" data-sym="${sym}"><b>${sym}</b><span>${esc(m.label||'Benefit')}</span><input class="benefit-value" inputmode="numeric" placeholder="${i.value?Math.round(i.value):'value'}" value="${ov.value||''}"><input class="benefit-freq" inputmode="decimal" placeholder="days" value="${ov.freq||m.freq||''}"><small>${i.value?money(i.value):'value missing'} · ${esc(i.source)}</small></div>`;
    }).join('');
    box.innerHTML=rows;
    $$('.benefit-row',box).forEach(row=>{
      const sym=row.dataset.sym;
      const save=()=>{const all=loadBenefitOverrides();const value=parseAmount($('.benefit-value',row).value);const freq=Number($('.benefit-freq',row).value)||0;if(value>0||freq>0) all[sym]={value:value||undefined,freq:freq||undefined}; else delete all[sym];saveBenefitOverrides(all);renderAdvisor();renderTradeAssistant();};
      $('.benefit-value',row).onchange=save; $('.benefit-freq',row).onchange=save;
    });
  }

  function renderTradeAssistant() {
    const box=$('#slx-stock-trade-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and fetch benefit values to generate ROI candidates.</div>';return;}
    const best=rows[0];
    const affordable=rows.find(r=>r.affordable);
    const cards=[['Best ROI',best],['Best affordable',affordable]].filter(x=>x[1]);
    box.innerHTML=cards.map(([title,r])=>`<div class="trade-card"><div><small>${title}</small><b>${r.sym} · Tier ${r.tier}</b><span>${r.roi.toFixed(2)}% est. annual ROI</span></div><div><small>Need</small><b>${r.sharesNeeded.toLocaleString()} shares</b><span>${money(r.cost)}</span></div><div class="trade-actions"><button data-set="${r.sym}">Set target</button><button class="primary" data-buy="${r.sym}" data-shares="${r.sharesNeeded}">Buy gap</button></div></div>`).join('');
    $$('[data-set]',box).forEach(b=>b.onclick=()=>{set(K.target,b.dataset.set);refreshTargetSelect();status(`${b.dataset.set} selected as vault target.`,'ok');});
    $$('[data-buy]',box).forEach(b=>b.onclick=async()=>{const sym=b.dataset.buy;const requested=Number(b.dataset.shares)||0;try{const st=await ensureStock(sym);let cash=Math.max(Number(S.money)||0,currentMoneyFromDom());if(!cash){await apiSync();cash=Number(S.money)||0;}const can=Math.floor(cash/st.price);const shares=Math.min(requested,can);if(shares<=0)throw new Error(`Not enough cash to buy ${sym}.`);if(!confirm(`Buy ${shares.toLocaleString()} ${sym} shares for about ${money(shares*st.price)}?`))return;await postTrade(sym,shares,'buyShares');status(`Trade Assistant bought ${shares.toLocaleString()} ${sym}.`,'ok');await syncAllApi();}catch(e){status(`Trade Assistant: ${e.message}`,'bad');}});
  }
"""
s=s[:start]+new_bt+s[end:]

# Replace old advisor builder/renderer with ROI-aware version.
start=s.find('  function buildAdvisorRows() {')
end=s.find('\n  function renderPortfolio()',start)
if start<0 or end<0:
    # renderPortfolio may be before advisor in some versions; find panicButton as fallback and replace only build/render advisor block.
    end=s.find('\n  function panicButton() {',start)
if start<0 or end<0: raise SystemExit('advisor block missing')
old_block=s[start:end]
# Preserve renderPortfolio if it was captured.
portfolio_pos=old_block.find('  function renderPortfolio()')
preserve=''
if portfolio_pos>=0:
    preserve=old_block[portfolio_pos:]
new_adv="""  function renderAdvisor() {
    const box=$('#slx-stock-advisor-body'); if(!box) return;
    const rows=buildRoiCandidates();
    if(!rows.length){box.innerHTML='<div class="muted">Sync API and load benefit values. Only benefits with a known cash-equivalent value are ranked.</div>';return;}
    box.innerHTML=rows.slice(0,10).map((r,index)=>`<div class="roi-row"><b>#${index+1} ${r.sym}</b><span>Tier ${r.tier}</span><span>${r.roi.toFixed(2)}% APR</span><span>${money(r.cost)} gap</span><span>${money(r.daily)}/day est.</span><span class="${r.affordable?'good':'muted'}">${r.affordable?'Affordable':'Missing '+money(Math.max(0,r.cost-r.cash))}</span></div>`).join('');
  }

"""
s=s[:start]+new_adv+preserve+s[end:]

# CSS additions before mobile media rule.
css_marker="#slx-stock-panel .portfolio-list{display:grid;gap:6px}#slx-stock-panel .portfolio-row{display:grid;grid-template-columns:1.05fr 1.1fr 1.15fr 1.15fr;gap:7px;align-items:center;padding:8px;border:1px solid #1f3040;border-radius:9px;background:#0d1620;font-size:10px}#slx-stock-panel .portfolio-row>div{display:grid;gap:3px}.portfolio-sym b{font-size:12px;color:#dcecff}\n"
css_add=css_marker+"#slx-stock-panel .benefit-list{display:grid;gap:6px;max-height:280px;overflow:auto}#slx-stock-panel .benefit-row{display:grid;grid-template-columns:42px 1.4fr 95px 62px 1fr;gap:6px;align-items:center;padding:7px;border:1px solid #203142;border-radius:8px;background:#0d1620;font-size:9px}#slx-stock-panel .benefit-row input{min-width:0;padding:6px}#slx-stock-panel .benefit-row small{color:#7f91a5}\n#slx-stock-panel .roi-row{display:grid;grid-template-columns:78px 65px 78px 1fr 1fr 1fr;gap:6px;padding:7px 0;border-bottom:1px solid #1c2a38;font-size:10px;align-items:center}#slx-stock-panel .trade-list{display:grid;gap:7px}#slx-stock-panel .trade-card{display:grid;grid-template-columns:1.4fr 1fr auto;gap:8px;padding:9px;border:1px solid #27415a;border-radius:10px;background:#0e1823;align-items:center}.trade-card>div{display:grid;gap:3px}.trade-card small{font-size:9px;color:#8296aa}.trade-card span{font-size:9px;color:#a7b8c9}.trade-actions{display:flex!important;gap:5px}.trade-actions button{padding:7px!important}\n"
if css_marker not in s: raise SystemExit('css portfolio marker missing')
s=s.replace(css_marker,css_add,1)
s=s.replace("@media(max-width:600px){#slx-stock-panel .grid{grid-template-columns:1fr}","@media(max-width:600px){#slx-stock-panel .grid{grid-template-columns:1fr}#slx-stock-panel .benefit-row{grid-template-columns:42px 1fr 85px 58px}.benefit-row small{grid-column:2/5}#slx-stock-panel .roi-row{grid-template-columns:65px 55px 70px}.roi-row span:nth-child(n+4){grid-column:2/4}#slx-stock-panel .trade-card{grid-template-columns:1fr 1fr}.trade-actions{grid-column:1/3}",1)

# Panel: add Benefit Values and Trade Assistant around Advisor.
panel_marker="""      <div class=\"section\"><div class=\"title\">Portfolio</div><div id=\"slx-stock-portfolio-body\" class=\"muted\">Waiting for portfolio data…</div></div>
      <div class=\"section\"><div class=\"title\">Advisor</div><div id=\"slx-stock-advisor-body\" class=\"muted\">Waiting for stock data…</div></div>
"""
panel_new="""      <div class=\"section\"><div class=\"title\">Portfolio</div><div id=\"slx-stock-portfolio-body\" class=\"muted\">Waiting for portfolio data…</div></div>
      <div class=\"section\"><div class=\"title\">Benefit Values</div><div class=\"actions\"><button id=\"slx-benefit-fetch\" class=\"primary\" type=\"button\">Fetch Market Values</button><button id=\"slx-benefit-reset\" type=\"button\">Reset Manual Values</button></div><div id=\"slx-stock-benefit-values\" class=\"benefit-list\"></div></div>
      <div class=\"section\"><div class=\"title\">Benefit ROI Advisor</div><div id=\"slx-stock-advisor-body\" class=\"muted\">Waiting for stock data…</div></div>
      <div class=\"section\"><div class=\"title\">Trade Assistant</div><div id=\"slx-stock-trade-body\" class=\"trade-list muted\">Waiting for ROI data…</div></div>
"""
if panel_marker not in s: raise SystemExit('panel section marker missing')
s=s.replace(panel_marker,panel_new,1)

# Event handlers for benefit values.
event_marker="""    $('#slx-api-clear',p).onclick=clearApiKey;
"""
event_new=event_marker+"""    $('#slx-benefit-fetch',p).onclick=()=>fetchBenefitMarketValues().catch(e=>status(e.message,'bad'));
    $('#slx-benefit-reset',p).onclick=()=>{if(confirm('Reset all manual benefit values/frequencies?')){del(K.benefitValues);renderBenefitValues();renderAdvisor();renderTradeAssistant();status('Manual benefit values reset.','ok');}};
"""
if event_marker not in s: raise SystemExit('event marker missing')
s=s.replace(event_marker,event_new,1)

# Ensure sync and panel opens render the new sections.
s=s.replace("renderPortfolio();\n    renderAdvisor();\n    status(`API connected", "renderPortfolio();\n    renderBenefitValues();\n    renderAdvisor();\n    renderTradeAssistant();\n    status(`API connected",1)
s=s.replace("function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderAdvisor(); S.panel.dataset.open='1'; }","function openPanel() { style(); panel(); refreshTargetSelect(); renderPortfolio(); renderBenefitValues(); renderAdvisor(); renderTradeAssistant(); S.panel.dataset.open='1'; }",1)

p.write_text(s,encoding='utf-8')

# Changelog.
md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.4.0**',m,count=1)
marker='## Current release note\n'; st=m.find(marker)
if st>=0:
    st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
    note='\n**v0.4.0** adds a benefit-value engine, marginal annual ROI ranking and the first SakaLuX Trade Assistant. Item-based benefits can load current Torn market values, cash benefits have editable defaults, manual overrides are supported, active benefit tiers use cumulative block math, and Buy Gap performs a user-confirmed direct purchase without automatically selling lower-ROI holdings.\n'
    m=m[:st]+note+m[en:]
h='## Changelog\n'
entry='''### v0.4.0 — Benefit ROI & Trade Assistant\n\n- Added benefit value models for item, cash, average-cache and manual-value stock benefits.\n- Added Fetch Market Values for supported item benefits through Torn API item values.\n- Added editable benefit value and payout-frequency overrides stored locally.\n- Corrected active benefit-tier math to cumulative blocks: base + 2×base + 4×base, matching marginal-tier ROI calculations.\n- Added Benefit ROI Advisor ranking next benefit tiers by estimated annual marginal ROI.\n- Added affordability and missing-cash calculations.\n- Added Trade Assistant cards for Best ROI and Best Affordable candidates.\n- Added Set Target and user-confirmed Buy Gap actions. Buy Gap never auto-sells holdings.\n- Kept PANIC direct-buy behavior and Benefit Lock protection.\n- Remains experimental and outside Hub, Standalone, `scripts.json` and GreasyFork.\n\n'''
if h in m and '### v0.4.0 — Benefit ROI & Trade Assistant' not in m: m=m.replace(h,h+entry,1)
# Update roadmap/status wording.
m=m.replace('- **v0.3.x:** benefit-value database, true ROI ranking, configurable withdrawal presets and transaction history.\n- **v0.4.x:** Trade Assistant with buy/sell suggestions and liquidity-gap calculations.','- **v0.4.x:** refine benefit values, transaction history, withdrawal presets and Trade Assistant liquidity planning.\n- **v0.5.x:** bank comparison, daily income / cost model and benefit-aware portfolio optimizer.',1)
md.write_text(m,encoding='utf-8')
