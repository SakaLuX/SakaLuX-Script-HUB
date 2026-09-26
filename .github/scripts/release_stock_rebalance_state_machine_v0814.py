#!/usr/bin/env python3
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[2]
SRC=ROOT/'SakaLuX-Stock-Manager-Advisor.user.js'
REG=ROOT/'scripts.json'
text=SRC.read_text(encoding='utf-8')
old='0.8.13'; new='0.8.14'
if f'// @version      {old}' not in text:
    raise SystemExit('Unexpected Stock version')
text=text.replace(f'// @version      {old}',f'// @version      {new}',1)
text=text.replace("let v = '0.8.13';","let v = '0.8.14';",1)
text=text.replace("{version:'0.8.13'}","{version:'0.8.14'}",1)
pat=re.compile(r'\n  async function executeGuidedRebalance\(\) \{.*?\n  function stockViewScore\(sym, mode\) \{',re.S)
if not pat.search(text):
    raise SystemExit('executeGuidedRebalance block not found')
block=r'''

  const STOCK_REBALANCE_STATES=Object.freeze({PLANNING:'PLANNING',SELLING:'SELLING',VERIFYING_SELL:'VERIFYING_SELL',WAITING_SYNC:'WAITING_SYNC',VERIFYING_CASH:'VERIFYING_CASH',BUYING:'BUYING',VERIFYING_POSITION:'VERIFYING_POSITION',COMPLETE:'COMPLETE',STOPPED:'STOPPED',ERROR:'ERROR'});
  const STOCK_REBALANCE_CHECKPOINT='SLX_STOCK_REBALANCE_CHECKPOINT_V1';
  function stockRebalanceCheckpointRead(){try{return JSON.parse(localStorage.getItem(STOCK_REBALANCE_CHECKPOINT)||'null')}catch{return null}}
  function stockRebalanceCheckpointWrite(state){try{localStorage.setItem(STOCK_REBALANCE_CHECKPOINT,JSON.stringify(state))}catch{}}
  function stockRebalanceCheckpointClear(){try{localStorage.removeItem(STOCK_REBALANCE_CHECKPOINT)}catch{}}
  function stockRebalanceNormalizeResume(resume){
    if(!resume||typeof resume!=='object')return {sold:[],bought:null};
    const sold=Array.isArray(resume.sold)?resume.sold.map(x=>({sym:String(x.sym||'').toUpperCase(),shares:Math.floor(Number(x.shares)||0)})).filter(x=>x.sym&&x.shares>0):[];
    const bought=resume.bought&&Number(resume.bought.shares)>0?{sym:String(resume.bought.sym||'').toUpperCase(),shares:Math.floor(Number(resume.bought.shares)||0),price:Number(resume.bought.price)||0}:null;
    return {sold,bought};
  }
  function stockRebalanceSanitizePlan(plan){
    if(!plan||!plan.target)throw new Error('Missing rebalance target.');
    const targetSym=String(plan.target.sym||'').toUpperCase(),targetShares=Math.floor(Number(plan.target.sharesNeeded)||0);
    if(!targetSym||targetShares<=0)throw new Error('Invalid rebalance target.');
    const sources=(plan.sources||[]).map(s=>({sym:String(s.sym||'').toUpperCase(),shares:Math.floor(Number(s.shares)||0),price:Number(s.price)||0})).filter(s=>s.sym&&s.sym!==targetSym&&s.shares>0&&s.price>0);
    return {target:{sym:targetSym,sharesNeeded:targetShares,tier:plan.target.tier??null,price:Number(plan.target.price)||0,cost:Number(plan.target.cost)||0},sources,reserve:Math.max(0,Number(plan.reserve)||0),startingCash:Math.max(0,Number(plan.cash)||0)};
  }
  function stockRebalanceAlreadySold(ctx,src){return ctx.sold.some(x=>x.sym===src.sym&&Number(x.shares)>=src.shares)}
  async function stockRebalanceExecute(plan,io,opts={}){
    const resume=stockRebalanceNormalizeResume(opts.resumeState),ctx={phase:STOCK_REBALANCE_STATES.PLANNING,plan:stockRebalanceSanitizePlan(plan),sold:resume.sold.map(x=>({...x,recovered:true})),bought:resume.bought,cashBeforeBuy:0,targetPriceBeforeBuy:0,verified:false,error:null,resumed:resume.sold.length>0||!!resume.bought,history:[STOCK_REBALANCE_STATES.PLANNING]};
    const transition=n=>{ctx.phase=n;ctx.history.push(n)};
    const checkpoint=async()=>{const state={target:ctx.plan.target.sym,phase:ctx.phase,sold:ctx.sold.map(x=>({sym:x.sym,shares:x.shares})),bought:ctx.bought?{...ctx.bought}:null};stockRebalanceCheckpointWrite(state);if(typeof io.checkpoint==='function')await io.checkpoint(state)};
    const syncDelayMs=Number.isFinite(opts.syncDelayMs)?opts.syncDelayMs:2600,maxRetries=Math.max(0,Math.floor(Number(opts.maxSellRetries)||1));
    try{
      if(ctx.bought){transition(STOCK_REBALANCE_STATES.VERIFYING_POSITION);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();const s=await io.snapshot();if(Math.max(0,Math.floor(Number(s.targetShares)||0))<ctx.bought.shares)throw new Error('Recovered BUY checkpoint could not be verified.');ctx.verified=true;transition(STOCK_REBALANCE_STATES.COMPLETE);stockRebalanceCheckpointClear();return ctx}
      transition(STOCK_REBALANCE_STATES.SELLING);
      for(const src of ctx.plan.sources){
        if(stockRebalanceAlreadySold(ctx,src))continue;
        let ok=false,lastError=null,recovered=false;
        for(let attempt=0;attempt<=maxRetries&&!ok;attempt++){
          let result=null;
          try{result=await io.sell(src.sym,src.shares);transition(STOCK_REBALANCE_STATES.VERIFYING_SELL);ok=await io.verifySell(src.sym,src.shares,result);if(!ok)lastError=new Error(`SELL verification failed for ${src.sym}.`);else recovered=result?.success!==true}
          catch(e){lastError=e instanceof Error?e:new Error(String(e));transition(STOCK_REBALANCE_STATES.VERIFYING_SELL);ok=await io.verifySell(src.sym,src.shares,result);recovered=ok}
          if(!ok&&attempt<maxRetries){await io.wait(1800);transition(STOCK_REBALANCE_STATES.SELLING)}
        }
        if(!ok)throw lastError||new Error(`SELL failed for ${src.sym}.`);
        ctx.sold.push({...src,recovered});await checkpoint();if(ctx.phase!==STOCK_REBALANCE_STATES.SELLING)transition(STOCK_REBALANCE_STATES.SELLING);
      }
      transition(STOCK_REBALANCE_STATES.WAITING_SYNC);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();transition(STOCK_REBALANCE_STATES.VERIFYING_CASH);
      const before=await io.snapshot(),cash=Math.max(0,Number(before.cash)||0),targetPrice=Math.max(0,Number(before.targetPrice)||0);if(!(targetPrice>0))throw new Error('Target price unavailable after SELL sync.');ctx.cashBeforeBuy=cash;ctx.targetPriceBeforeBuy=targetPrice;
      const buyShares=Math.min(ctx.plan.target.sharesNeeded,Math.floor(Math.max(0,cash-ctx.plan.reserve)/targetPrice));if(buyShares<=0){transition(STOCK_REBALANCE_STATES.STOPPED);ctx.error='Insufficient verified cash for BUY.';await checkpoint();return ctx}
      transition(STOCK_REBALANCE_STATES.BUYING);const buyResult=await io.buy(ctx.plan.target.sym,buyShares);if(!buyResult||buyResult.success!==true)throw new Error(`BUY not confirmed for ${ctx.plan.target.sym}.`);ctx.bought={sym:ctx.plan.target.sym,shares:buyShares,price:targetPrice};await checkpoint();
      transition(STOCK_REBALANCE_STATES.VERIFYING_POSITION);if(syncDelayMs>0)await io.wait(syncDelayMs);await io.sync();const after=await io.snapshot();const held=Math.max(0,Math.floor(Number(after.targetShares)||0)),heldBefore=Math.max(0,Math.floor(Number(before.targetShares)||0));if(held-heldBefore<buyShares)throw new Error('BUY verification failed: target position did not increase enough.');ctx.verified=true;transition(STOCK_REBALANCE_STATES.COMPLETE);stockRebalanceCheckpointClear();return ctx;
    }catch(e){ctx.error=e?.message||String(e);transition(STOCK_REBALANCE_STATES.ERROR);await checkpoint();return ctx}
  }

  async function executeGuidedRebalance() {
    const rawPlan=buildExecutableRebalancePlan(); if(!rawPlan) throw new Error('No ROI rebalance candidate available.');
    if(rawPlan.shortfall>0) throw new Error(`Rebalance still needs ${money(rawPlan.shortfall)} after all valid free/excess shares.`);
    if(!confirm(rebalanceConfirmText(rawPlan))) return;
    const plan={cash:rawPlan.cash,reserve:rawPlan.reserve,target:{sym:rawPlan.target.sym,sharesNeeded:rawPlan.target.sharesNeeded,price:rawPlan.target.price||0,cost:rawPlan.target.cost||0,tier:rawPlan.target.tier},sources:rawPlan.sources};
    const oldCheckpoint=stockRebalanceCheckpointRead();
    const resumeState=oldCheckpoint&&String(oldCheckpoint.target||'').toUpperCase()===String(plan.target.sym).toUpperCase()&&oldCheckpoint.phase!==STOCK_REBALANCE_STATES.COMPLETE?oldCheckpoint:null;
    const preSellOwned=new Map();
    const io={
      sell:async(sym,shares)=>{await ensureStock(sym);preSellOwned.set(sym,ownedShares(sym));return postTrade(sym,shares,'sellShares')},
      verifySell:async(sym,shares)=>{if(isDryRun())return true;await new Promise(r=>setTimeout(r,1800));if(getStockApiKey())await apiSync();else scanStocks();const before=Number(preSellOwned.get(sym));const now=Number(ownedShares(sym)||0);return Number.isFinite(before)?now<=Math.max(0,before-shares):true},
      buy:async(sym,shares)=>postTrade(sym,shares,'buyShares'),
      wait:ms=>new Promise(r=>setTimeout(r,ms)),
      sync:async()=>{if(getStockApiKey())await apiSync();else{scanStocks();await new Promise(r=>setTimeout(r,350));scanStocks()}},
      snapshot:async()=>{await ensureStock(plan.target.sym);const m=stockRowMetrics(plan.target.sym);return {cash:Math.max(Number(S.money)||0,currentMoneyFromDom()),targetPrice:Number(m?.price)||0,targetShares:Number(ownedShares(plan.target.sym)||0)}},
      checkpoint:async state=>inlineStatus(`Rebalance · ${state.phase}`,'warn')
    };
    const ctx=await stockRebalanceExecute(plan,io,{syncDelayMs:isDryRun()?0:2600,maxSellRetries:isDryRun()?0:1,resumeState});
    refreshInlinePanel();renderTransactionHistory();
    if(ctx.phase===STOCK_REBALANCE_STATES.COMPLETE){inlineStatus(`Guided rebalance verified and complete for ${plan.target.sym}.`,'ok');return}
    if(ctx.phase===STOCK_REBALANCE_STATES.STOPPED){inlineStatus(ctx.error||'Rebalance stopped safely before BUY.','warn');return}
    throw new Error(ctx.error||`Rebalance failed in ${ctx.phase}.`);
  }

  function stockViewScore(sym, mode) {'''
text=pat.sub(block,text,count=1)
SRC.write_text(text,encoding='utf-8')
reg=json.loads(REG.read_text(encoding='utf-8'))
row=next(x for x in reg['scripts'] if x.get('id')=='stock-manager-advisor')
row['version']=new
row['detailsRevision']=int(row.get('detailsRevision',0))+1
row['release']={'version':new,'date':'2026-09-26','notes':[
'Introduces a verified Stock Rebalance state machine: PLANNING → SELLING → VERIFYING_SELL → WAITING_SYNC → VERIFYING_CASH → BUYING → VERIFYING_POSITION → COMPLETE.',
'Verifies each SELL before another transaction, preventing duplicate sales after TornPDA/network uncertainty and supporting safe retry only when a sale did not land.',
'Persists recovery checkpoints so interrupted rebalances can resume without repeating completed SELL or BUY actions.',
'Re-syncs cash, target price and held shares before BUY, recalculates affordable quantity, preserves reserve cash and verifies the final position.',
'Keeps the BUY target excluded from SELL sources and retains the 0.1% sell-fee-aware planning introduced in v0.8.13.',
'Adds permanent regression coverage for multiple SELLs, interruption/recovery, retry safety, TornPDA transitions, large amounts and post-BUY verification.'
]}
REG.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Stock v0.8.14 state machine integrated and registry updated')
