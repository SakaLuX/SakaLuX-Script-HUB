#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Stock-Manager-Advisor.user.js'
REG=ROOT/'scripts.json'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
DOC=ROOT/'greasyfork'/'Stock-Manager-Advisor.md'
old='0.8.12'; new='0.8.13'
s=SRC.read_text(encoding='utf-8')
if f'// @version      {old}' not in s: raise SystemExit('unexpected Stock version')
s=s.replace(f'// @version      {old}',f'// @version      {new}',1)
s=s.replace("let v = '"+old+"';","let v = '"+new+"';",1)
s=s.replace("{version:'"+old+"'}","{version:'"+new+"'}",1)

start=s.index('  function buildRebalancePreview() {')
end=s.index('\n  function renderRebalancePreview()',start)
new_preview=r'''  function buildRebalancePreview() {
    const held=buildOptimizerRows();
    const candidates=buildRoiCandidates().filter(r=>Number.isFinite(Number(r.cost))&&Number(r.cost)>0&&Number.isFinite(Number(r.sharesNeeded))&&Number(r.sharesNeeded)>0);
    const reserve=Math.max(0,parseAmount(get(K.rebalanceReserve,'0')));
    const cash=Math.max(Number(S.money)||0,currentMoneyFromDom());
    const sellNetFactor=0.999; // Torn takes a 0.1% stock selling fee.
    const validSource=r=>Number.isFinite(Number(r?.price))&&Number(r.price)>0&&Number.isFinite(Number(r?.freeShares))&&Number(r.freeShares)>0&&Number.isFinite(Number(r?.freeValue))&&Number(r.freeValue)>0;
    const freeRows=held.filter(validSource).sort((a,b)=>Number(b.freeValue)-Number(a.freeValue));
    const weakRows=held.filter(r=>r.signal==='weak'&&validSource(r)).sort((a,b)=>Number(a.currentApr||0)-Number(b.currentApr||0));
    const allSources=[...freeRows,...weakRows.filter(w=>!freeRows.some(f=>f.sym===w.sym))];
    const netSourceValue=r=>Math.max(0,Math.floor(Number(r.freeShares)||0))*Math.max(0,Number(r.price)||0)*sellNetFactor;
    const deployableFor=target=>Math.max(0,cash+allSources.filter(r=>String(r.sym)!==String(target?.sym)).reduce((n,r)=>n+netSourceValue(r),0)-reserve);
    const target=candidates.find(r=>Number(r.cost)<=deployableFor(r)) || candidates[0] || null;
    if(!target) return {cash,reserve,sourceCapital:0,deployable:Math.max(0,cash-reserve),sources:[],target:null,sells:[],shortfall:0};
    // Never sell the same stock that this rebalance is trying to buy.
    const sources=allSources.filter(r=>String(r.sym)!==String(target.sym));
    const sourceCapital=sources.reduce((n,r)=>n+netSourceValue(r),0);
    const deployable=Math.max(0,cash+sourceCapital-reserve);
    const required=Math.max(0,Number(target.cost)-cash+reserve);
    let need=required;
    const sells=[];
    for(const r of sources) {
      if(need<=0) break;
      const price=Number(r.price), freeShares=Math.floor(Number(r.freeShares));
      if(!Number.isFinite(price)||price<=0||!Number.isFinite(freeShares)||freeShares<=0) continue;
      const perShareNet=price*sellNetFactor;
      const shares=Math.min(freeShares,Math.ceil(need/perShareNet));
      if(!Number.isFinite(shares)||shares<=0) continue;
      const gross=shares*price;
      const proceeds=gross*sellNetFactor;
      if(!Number.isFinite(proceeds)||proceeds<=0) continue;
      sells.push({sym:r.sym,shares,proceeds,gross,currentApr:Number(r.currentApr)||0,price,sellFee:gross-proceeds});
      need=Math.max(0,need-proceeds);
    }
    const funded=Math.max(0,Number(target.cost)-Math.max(0,need));
    return {cash,reserve,sourceCapital,deployable,sources,target,required,sells,shortfall:Math.max(0,need),funded,sellNetFactor};
  }'''
s=s[:start]+new_preview+s[end:]

# Defensive second gate: executable sell list must never contain the BUY target.
needle="    const sources=(x.sells||[]).filter(r=>Number.isFinite(Number(r.shares))&&Number(r.shares)>0&&Number.isFinite(Number(r.proceeds))&&Number(r.proceeds)>0)\n      .map(r=>({sym:String(r.sym||'').toUpperCase(),shares:Math.floor(Number(r.shares)),value:Number(r.proceeds),price:Number(r.price)||0}));"
repl="    const targetSym=String(x.target.sym||'').toUpperCase();\n    const sources=(x.sells||[]).filter(r=>String(r.sym||'').toUpperCase()!==targetSym&&Number.isFinite(Number(r.shares))&&Number(r.shares)>0&&Number.isFinite(Number(r.proceeds))&&Number(r.proceeds)>0)\n      .map(r=>({sym:String(r.sym||'').toUpperCase(),shares:Math.floor(Number(r.shares)),value:Number(r.proceeds),price:Number(r.price)||0}));"
if needle not in s: raise SystemExit('executable source block not found')
s=s.replace(needle,repl,1)

# Torn success must be explicit; HTML / non-JSON PDA responses are no longer treated as successful trades.
old_resp="""      const text=await res.text();
      let data=null; try{data=JSON.parse(text);}catch{}
      if(!res.ok) throw new Error(`Torn returned HTTP ${res.status}.`);
      const serverMessage=String(data?.text||data?.message||data?.error?.error||'').trim();
      if(data?.success===false || data?.error) throw new Error(serverMessage||'Torn rejected the stock transaction.');
      if(!data && /(?:error|invalid|failed|denied|insufficient)/i.test(text.slice(0,600))) throw new Error('Torn returned an unexpected trade error response.');
      S.lastTradeAt=Date.now();"""
new_resp="""      const text=await res.text();
      let data=null; try{data=JSON.parse(text);}catch{}
      if(!res.ok) throw new Error(`Torn returned HTTP ${res.status}.`);
      const serverMessage=String(data?.text||data?.message||data?.error?.error||data?.error||'').trim();
      if(!data || data?.success!==true){
        const snippet=String(text||'').replace(/\\s+/g,' ').trim().slice(0,180);
        throw new Error(serverMessage||snippet||'Torn did not confirm the stock transaction.');
      }
      S.lastTradeAt=Date.now();"""
if old_resp not in s: raise SystemExit('postTrade response block not found')
s=s.replace(old_resp,new_resp,1)

old_exec="""    if(getStockApiKey()&&!isDryRun()) await apiSync();
    const buyShares=Math.floor(Number(plan.target.sharesNeeded)||0);
    if(!Number.isFinite(buyShares)||buyShares<=0) throw new Error('Invalid BUY share amount; rebalance stopped before BUY.');
    if(!confirm(`SELL phase complete${isDryRun()?' (Dry Run)':''}.\\n\\nProceed with BUY ${buyShares.toLocaleString()} ${plan.target.sym} toward Tier ${plan.target.tier} for about ${money(plan.target.cost)}?`)){inlineStatus('Rebalance stopped before BUY phase.','warn');return;}
    if(!isDryRun() && tradeCooldownRemaining()>0) await new Promise(r=>setTimeout(r,Math.max(1650,tradeCooldownRemaining()+100)));
    await postTrade(plan.target.sym,buyShares,'buyShares'); if(getStockApiKey()&&!isDryRun()) await apiSync(); refreshInlinePanel(); renderTransactionHistory(); inlineStatus(`Guided rebalance finished for ${plan.target.sym}.`,'ok');"""
new_exec="""    const hasApi=!!getStockApiKey();
    if(hasApi&&!isDryRun()) await apiSync();
    let buyShares=Math.floor(Number(plan.target.sharesNeeded)||0);
    if(!Number.isFinite(buyShares)||buyShares<=0) throw new Error('Invalid BUY share amount; rebalance stopped before BUY.');
    // After SELLs, use fresh cash/price when API data is available. This prevents a large rebalance from failing
    // because the old plan ignored the 0.1% sell fee or the price changed between phases.
    if(hasApi&&!isDryRun()){
      const live=S.stocks.get(String(plan.target.sym||'').toUpperCase());
      const livePrice=Number(live?.price)||Number(plan.target.price)||(Number(plan.target.cost)/Math.max(1,Number(plan.target.sharesNeeded)||1));
      const liveCash=Math.max(Number(S.money)||0,currentMoneyFromDom());
      const spendable=Math.max(0,liveCash-Number(plan.reserve||0));
      if(Number.isFinite(livePrice)&&livePrice>0){
        const affordable=Math.max(0,Math.floor(spendable/livePrice));
        buyShares=Math.min(buyShares,affordable);
      }
    }
    if(!Number.isFinite(buyShares)||buyShares<=0) throw new Error('SELL phase completed, but current cash is not enough for a safe BUY after fees/price refresh.');
    const liveTarget=S.stocks.get(String(plan.target.sym||'').toUpperCase());
    const buyPrice=Number(liveTarget?.price)||Number(plan.target.price)||(Number(plan.target.cost)/Math.max(1,Number(plan.target.sharesNeeded)||1));
    const buyEstimate=buyShares*Math.max(0,buyPrice||0);
    if(!confirm(`SELL phase complete${isDryRun()?' (Dry Run)':''}.\\n\\nProceed with BUY ${buyShares.toLocaleString()} ${plan.target.sym} toward Tier ${plan.target.tier} for about ${money(buyEstimate||plan.target.cost)}?`)){inlineStatus('Rebalance stopped before BUY phase.','warn');return;}
    if(!isDryRun()) await new Promise(r=>setTimeout(r,Math.max(2200,tradeCooldownRemaining()+250)));
    await postTrade(plan.target.sym,buyShares,'buyShares'); if(hasApi&&!isDryRun()) await apiSync(); refreshInlinePanel(); renderTransactionHistory(); inlineStatus(`Guided rebalance finished for ${plan.target.sym}.`,'ok');"""
if old_exec not in s: raise SystemExit('guided rebalance BUY phase block not found')
s=s.replace(old_exec,new_exec,1)
SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
entry=next(x for x in reg['scripts'] if x.get('id')=='stock-manager-advisor')
entry['version']=new
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={'version':new,'date':'2026-09-26','notes':[
 'Fixes Guided Rebalance selling the same stock selected as the BUY target.',
 'Accounts for Torn stock selling fee (0.1%) when calculating rebalance funding and SELL proceeds.',
 'Refreshes cash and target price between SELL and BUY phases and caps BUY shares to the amount safely affordable after fees.',
 'Adds a longer SELL-to-BUY settle window for TornPDA and requires an explicit success response from Torn instead of treating HTML/non-JSON responses as accepted trades.'
]}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

h=HUB.read_text(encoding='utf-8')
a=h.find('    const FALLBACK_REGISTRY = '); b=h.find('\n\n    let registry = ',a)
if a<0 or b<0: raise SystemExit('Hub registry boundaries not found')
payload=json.dumps(reg,indent=4,ensure_ascii=False).replace('\n','\n    ')
h=h[:a]+'    const FALLBACK_REGISTRY = '+payload+h[b:]
HUB.write_text(h,encoding='utf-8')

if DOC.exists():
 d=DOC.read_text(encoding='utf-8')
 d=re.sub(r'(?is)(## Current version\s*\n\*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\2',d,count=1)
 d=re.sub(r'(- Canonical version: \*\*v)[^*]+(\*\*)',r'\g<1>'+new+r'\2',d,count=1)
 current='''## Current release note\n\n**v0.8.13 — Guided Rebalance SELL → BUY reliability**\n- Never sells the same stock selected as the rebalance BUY target.\n- Calculates SELL proceeds after Torn's 0.1% selling fee.\n- Refreshes cash/price before BUY and reduces the BUY share count when needed so large rebalances remain affordable.\n- Adds a TornPDA settle window between phases and requires explicit Torn trade success.\n'''
 if re.search(r'(?is)## Current release note\b.*?(?=\n## |\Z)',d):
  d=re.sub(r'(?is)## Current release note\b.*?(?=\n## |\Z)',current.rstrip()+'\n',d,count=1)
 marker='## Release history / Changelog\n'
 hist='''\n### v0.8.13 — Guided Rebalance SELL → BUY reliability\n- Excludes the BUY target symbol from all rebalance SELL sources.\n- Applies the 0.1% Torn stock sell fee to funding calculations instead of using gross proceeds.\n- Rechecks live cash and price after SELLs before submitting BUY on TornPDA.\n- Refuses ambiguous/non-JSON trade responses instead of logging them as successful.\n'''
 if marker in d and '### v0.8.13' not in d: d=d.replace(marker,marker+hist,1)
 DOC.write_text(d,encoding='utf-8')
print('Stock Manager v0.8.13 rebalance fix applied')
