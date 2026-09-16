from pathlib import Path
import re

p=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version bump.
for old,new in [
    ('// @version      0.1.0','// @version      0.2.0'),
    ("version: '0.1.0'","version: '0.2.0'"),
]:
    if old not in s:
        raise SystemExit(f'Missing version marker: {old}')
    s=s.replace(old,new,1)

# Add direct panic option key while keeping the experimental script isolated.
old="""    panicPending: 'SLX_STOCK_PANIC_PENDING',
    panicConfirm: 'SLX_STOCK_PANIC_CONFIRM',
    presets: 'SLX_STOCK_PRESETS',
"""
new="""    panicPending: 'SLX_STOCK_PANIC_PENDING',
    panicConfirm: 'SLX_STOCK_PANIC_CONFIRM',
    panicDirect: 'SLX_STOCK_PANIC_DIRECT',
    presets: 'SLX_STOCK_PRESETS',
"""
if old not in s: raise SystemExit('panic key block missing')
s=s.replace(old,new,1)

# Insert public stock-catalog sync after apiSync(). This works from any Torn page and supplies id + current price.
needle="""  function benefitTier(sym, shares) {
"""
insert="""  async function syncStockCatalog() {
    const key=get(K.api).trim();
    if(!key) throw new Error('Add an API key first.');
    const url=`https://api.torn.com/torn/?selections=stocks&key=${encodeURIComponent(key)}&ts=${Date.now()}`;
    const res=await fetch(url, {credentials:'omit'});
    const data=await res.json();
    if(data?.error) throw new Error(data.error.error || 'Torn stocks API error');
    const stocks=data?.stocks;
    if(!stocks || typeof stocks!=='object') throw new Error('Torn stock catalog unavailable.');
    const next=new Map(S.stocks);
    for(const [id,raw] of Object.entries(stocks)) {
      const sym=String(raw?.acronym||'').toUpperCase();
      const price=Number(raw?.current_price||raw?.price||0);
      if(!sym || !Number.isFinite(price) || price<=0) continue;
      const prev=next.get(sym)||{};
      next.set(sym,{...prev,sym,id:String(id),price,source:'api'});
    }
    if(next.size) S.stocks=next;
    return S.stocks;
  }

  async function ensureStock(sym) {
    sym=String(sym||'').toUpperCase();
    scanStocks();
    let stock=S.stocks.get(sym);
    if(stock?.id && stock?.price) return stock;
    await syncStockCatalog();
    stock=S.stocks.get(sym);
    if(!stock?.id || !stock?.price) throw new Error(`Unable to resolve ${sym} stock ID/price.`);
    return stock;
  }

"""+needle
if needle not in s: raise SystemExit('benefitTier marker missing')
s=s.replace(needle,insert,1)

# Replace vault so it can resolve target from API without visiting Stocks.
start=s.find('  async function vault({keep=0, panic=false}={}) {')
end=s.find('\n  async function withdrawCash(amount) {',start)
if start<0 or end<0: raise SystemExit('vault block missing')
new_vault="""  async function vault({keep=0, panic=false, direct=false}={}) {
    const sym=get(K.target).toUpperCase();
    if(!sym) throw new Error('Choose a vault target first.');
    const stock=await ensureStock(sym);
    let cash=currentMoneyFromDom();
    if(!cash || panic || direct) {
      try { await apiSync(); cash=S.money||cash; } catch(e) { if(!cash) throw e; }
    }
    const available=Math.max(0,cash-(Number(keep)||0));
    const shares=Math.floor(available/stock.price);
    if(shares<=0) throw new Error(`Not enough cash after keeping ${money(keep)}.`);
    status(`${panic?'PANIC':'Vault'}: buying ${shares.toLocaleString()} ${sym}…`,'warn');
    await postTrade(sym,shares,'buyShares');
    status(`${panic?'PANIC complete':'Vaulted'}: ${shares.toLocaleString()} ${sym} ≈ ${money(shares*stock.price)}`,'ok');
    return shares;
  }
"""
s=s[:start]+new_vault+s[end:]

# Replace panic: never navigate to stocks. Resolve through API and submit direct POST from current page.
start=s.find('  async function panic() {')
end=s.find('\n  function style() {',start)
if start<0 or end<0: raise SystemExit('panic block missing')
new_panic="""  async function panic() {
    const target=get(K.target).toUpperCase();
    if(!target){ openPanel(); status('Choose a Panic target first.','bad'); return; }
    if(bool(K.panicConfirm,false) && !confirm(`PANIC: vault available cash into ${target}?`)) return;
    try {
      set(K.panicPending,'0');
      status(`PANIC: resolving ${target} and available cash…`,'warn');
      await vault({keep:parseAmount(get(K.keep,'0')),panic:true,direct:true});
    } catch(e) {
      set(K.panicPending,'0');
      status(`PANIC failed: ${e.message}`,'bad');
      openPanel();
    }
  }
"""
s=s[:start]+new_panic+s[end:]

# Remove startup pending redirect execution if present: direct mode no longer needs page navigation.
s=s.replace("""    if(isStocks() && get(K.panicPending)==='1') setTimeout(()=>panic(),900);
""","""    if(get(K.panicPending)==='1') set(K.panicPending,'0');
""",1)

p.write_text(s,encoding='utf-8')

# Update experimental changelog only; do not touch scripts.json / Hub / standalone.
md=Path('experimental/Stock-Manager-Advisor.md')
m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v0.2.0**',m,count=1)
marker='## Current release note\n'
st=m.find(marker)
if st>=0:
    st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
    note='\n**v0.2.0** adds Direct Panic Buy. PANIC can now resolve the configured stock ID and current price through the Torn stocks API and submit the buy request from the current Torn page, without navigating to Stocks. Failures stay on the current page and are shown in the panel.\n'
    m=m[:st]+note+m[en:]
h='## Changelog\n'
entry='### v0.2.0 — Direct Panic Buy\n\n- PANIC no longer redirects to the Stocks page.\n- Resolves stock ID and current price from the Torn stocks API when DOM stock data is unavailable.\n- Uses on-hand cash from the user API and submits the buy request directly from the current Torn page.\n- Keeps confirmation and keep-cash safeguards.\n- A failed direct trade stays on the current page and reports the error instead of redirecting.\n- Remains experimental and is not registered in Hub, Standalone, or `scripts.json`.\n\n'
if h in m and '### v0.2.0 — Direct Panic Buy' not in m:
    m=m.replace(h,h+entry,1)
elif '### v0.2.0 — Direct Panic Buy' not in m:
    m+='\n## Changelog\n\n'+entry
md.write_text(m,encoding='utf-8')
