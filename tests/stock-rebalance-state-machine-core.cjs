'use strict';

const STATES = Object.freeze({
  PLANNING: 'PLANNING',
  SELLING: 'SELLING',
  WAITING_SYNC: 'WAITING_SYNC',
  VERIFYING_CASH: 'VERIFYING_CASH',
  BUYING: 'BUYING',
  VERIFYING_POSITION: 'VERIFYING_POSITION',
  COMPLETE: 'COMPLETE',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR'
});

function netSellProceeds(gross, feeRate = 0.001) {
  gross = Number(gross) || 0;
  return Math.max(0, Math.floor(gross * (1 - feeRate)));
}

function sanitizePlan(plan) {
  if (!plan || !plan.target) throw new Error('Missing rebalance target.');
  const targetSym = String(plan.target.sym || '').toUpperCase();
  const targetShares = Math.floor(Number(plan.target.sharesNeeded) || 0);
  if (!targetSym || targetShares <= 0) throw new Error('Invalid rebalance target.');

  const sources = (plan.sources || [])
    .map(s => ({
      sym: String(s.sym || '').toUpperCase(),
      shares: Math.floor(Number(s.shares) || 0),
      price: Number(s.price) || 0
    }))
    .filter(s => s.sym && s.sym !== targetSym && s.shares > 0 && s.price > 0);

  return {
    target: {
      sym: targetSym,
      sharesNeeded: targetShares,
      tier: plan.target.tier ?? null,
      price: Number(plan.target.price || 0),
      cost: Number(plan.target.cost || 0)
    },
    sources,
    reserve: Math.max(0, Number(plan.reserve) || 0),
    startingCash: Math.max(0, Number(plan.cash) || 0)
  };
}

function makeInitialState(plan) {
  return {
    phase: STATES.PLANNING,
    plan: sanitizePlan(plan),
    sold: [],
    bought: null,
    cashBeforeBuy: 0,
    targetPriceBeforeBuy: 0,
    verified: false,
    error: null,
    history: [STATES.PLANNING]
  };
}

function transition(ctx, next) {
  ctx.phase = next;
  ctx.history.push(next);
}

async function executeRebalance(plan, io, opts = {}) {
  const ctx = makeInitialState(plan);
  const feeRate = Number.isFinite(opts.feeRate) ? opts.feeRate : 0.001;
  const syncDelayMs = Number.isFinite(opts.syncDelayMs) ? opts.syncDelayMs : 2200;

  try {
    transition(ctx, STATES.SELLING);
    for (const src of ctx.plan.sources) {
      const result = await io.sell(src.sym, src.shares);
      if (!result || result.success !== true) throw new Error(`SELL not confirmed for ${src.sym}.`);
      ctx.sold.push({
        ...src,
        gross: src.shares * src.price,
        expectedNet: netSellProceeds(src.shares * src.price, feeRate)
      });
    }

    transition(ctx, STATES.WAITING_SYNC);
    if (syncDelayMs > 0) await io.wait(syncDelayMs);
    await io.sync();

    transition(ctx, STATES.VERIFYING_CASH);
    const snapshot = await io.snapshot();
    const cash = Math.max(0, Number(snapshot.cash) || 0);
    const targetPrice = Math.max(0, Number(snapshot.targetPrice) || 0);
    if (!(targetPrice > 0)) throw new Error('Target price unavailable after SELL sync.');
    ctx.cashBeforeBuy = cash;
    ctx.targetPriceBeforeBuy = targetPrice;

    const spendable = Math.max(0, cash - ctx.plan.reserve);
    const buyShares = Math.min(ctx.plan.target.sharesNeeded, Math.floor(spendable / targetPrice));
    if (buyShares <= 0) {
      transition(ctx, STATES.STOPPED);
      ctx.error = 'Insufficient verified cash for BUY.';
      return ctx;
    }

    transition(ctx, STATES.BUYING);
    const buyResult = await io.buy(ctx.plan.target.sym, buyShares);
    if (!buyResult || buyResult.success !== true) throw new Error(`BUY not confirmed for ${ctx.plan.target.sym}.`);
    ctx.bought = { sym: ctx.plan.target.sym, shares: buyShares, price: targetPrice };

    transition(ctx, STATES.VERIFYING_POSITION);
    if (syncDelayMs > 0) await io.wait(syncDelayMs);
    await io.sync();
    const after = await io.snapshot();
    const held = Math.max(0, Math.floor(Number(after.targetShares) || 0));
    const before = Math.max(0, Math.floor(Number(snapshot.targetShares) || 0));
    if (held - before < buyShares) throw new Error('BUY verification failed: target position did not increase enough.');

    ctx.verified = true;
    transition(ctx, STATES.COMPLETE);
    return ctx;
  } catch (err) {
    ctx.error = err && err.message ? err.message : String(err);
    transition(ctx, STATES.ERROR);
    return ctx;
  }
}

module.exports = { STATES, netSellProceeds, sanitizePlan, makeInitialState, executeRebalance };
