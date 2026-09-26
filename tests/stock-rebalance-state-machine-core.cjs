'use strict';

const STATES = Object.freeze({
  PLANNING: 'PLANNING',
  SELLING: 'SELLING',
  VERIFYING_SELL: 'VERIFYING_SELL',
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

function normalizeResumeState(resume) {
  if (!resume || typeof resume !== 'object') return { sold: [], bought: null };
  const sold = Array.isArray(resume.sold) ? resume.sold
    .map(x => ({ sym: String(x.sym || '').toUpperCase(), shares: Math.floor(Number(x.shares) || 0) }))
    .filter(x => x.sym && x.shares > 0) : [];
  const bought = resume.bought && Number(resume.bought.shares) > 0 ? {
    sym: String(resume.bought.sym || '').toUpperCase(),
    shares: Math.floor(Number(resume.bought.shares) || 0),
    price: Number(resume.bought.price) || 0
  } : null;
  return { sold, bought };
}

function makeInitialState(plan, resumeState) {
  const resume = normalizeResumeState(resumeState);
  return {
    phase: STATES.PLANNING,
    plan: sanitizePlan(plan),
    sold: resume.sold.map(x => ({ ...x, recovered: true })),
    bought: resume.bought,
    cashBeforeBuy: 0,
    targetPriceBeforeBuy: 0,
    verified: false,
    error: null,
    resumed: resume.sold.length > 0 || !!resume.bought,
    history: [STATES.PLANNING]
  };
}

function transition(ctx, next) {
  ctx.phase = next;
  ctx.history.push(next);
}

function alreadySold(ctx, src) {
  return ctx.sold.some(x => x.sym === src.sym && Number(x.shares) >= src.shares);
}

async function checkpoint(io, ctx) {
  if (typeof io.checkpoint === 'function') {
    await io.checkpoint({
      phase: ctx.phase,
      sold: ctx.sold.map(x => ({ sym: x.sym, shares: x.shares })),
      bought: ctx.bought ? { ...ctx.bought } : null
    });
  }
}

async function verifySell(io, src, attemptResult) {
  if (typeof io.verifySell !== 'function') return attemptResult?.success === true;
  return (await io.verifySell(src.sym, src.shares)) === true;
}

async function safeSell(src, io, ctx, opts) {
  const maxRetries = Math.max(0, Math.floor(Number(opts.maxSellRetries) || 0));
  const retryDelayMs = Math.max(0, Number(opts.retryDelayMs) || 0);
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let result = null;
    try {
      result = await io.sell(src.sym, src.shares);
      if (result?.success === true) {
        transition(ctx, STATES.VERIFYING_SELL);
        if (await verifySell(io, src, result)) return result;
        lastError = new Error(`SELL verification failed for ${src.sym}.`);
      } else {
        lastError = new Error(`SELL not confirmed for ${src.sym}.`);
        transition(ctx, STATES.VERIFYING_SELL);
        if (await verifySell(io, src, result)) return { success: true, recovered: true };
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      transition(ctx, STATES.VERIFYING_SELL);
      // Critical idempotency rule: before retrying an uncertain request, verify
      // whether Torn already applied it. If yes, never submit the SELL again.
      if (await verifySell(io, src, result)) return { success: true, recovered: true };
    }

    if (attempt < maxRetries) {
      if (retryDelayMs > 0 && typeof io.wait === 'function') await io.wait(retryDelayMs);
      transition(ctx, STATES.SELLING);
    }
  }
  throw lastError || new Error(`SELL failed for ${src.sym}.`);
}

async function executeRebalance(plan, io, opts = {}) {
  const ctx = makeInitialState(plan, opts.resumeState);
  const feeRate = Number.isFinite(opts.feeRate) ? opts.feeRate : 0.001;
  const syncDelayMs = Number.isFinite(opts.syncDelayMs) ? opts.syncDelayMs : 2200;

  try {
    if (ctx.bought) {
      transition(ctx, STATES.VERIFYING_POSITION);
      if (syncDelayMs > 0) await io.wait(syncDelayMs);
      await io.sync();
      const afterResumeBuy = await io.snapshot();
      const held = Math.max(0, Math.floor(Number(afterResumeBuy.targetShares) || 0));
      if (held < ctx.bought.shares) throw new Error('Recovered BUY checkpoint could not be verified.');
      ctx.verified = true;
      transition(ctx, STATES.COMPLETE);
      return ctx;
    }

    transition(ctx, STATES.SELLING);
    for (const src of ctx.plan.sources) {
      if (alreadySold(ctx, src)) continue;
      const result = await safeSell(src, io, ctx, opts);
      ctx.sold.push({
        ...src,
        gross: src.shares * src.price,
        expectedNet: netSellProceeds(src.shares * src.price, feeRate),
        recovered: result?.recovered === true
      });
      await checkpoint(io, ctx);
      if (ctx.phase !== STATES.SELLING) transition(ctx, STATES.SELLING);
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
      await checkpoint(io, ctx);
      return ctx;
    }

    transition(ctx, STATES.BUYING);
    const buyResult = await io.buy(ctx.plan.target.sym, buyShares);
    if (!buyResult || buyResult.success !== true) throw new Error(`BUY not confirmed for ${ctx.plan.target.sym}.`);
    ctx.bought = { sym: ctx.plan.target.sym, shares: buyShares, price: targetPrice };
    await checkpoint(io, ctx);

    transition(ctx, STATES.VERIFYING_POSITION);
    if (syncDelayMs > 0) await io.wait(syncDelayMs);
    await io.sync();
    const after = await io.snapshot();
    const held = Math.max(0, Math.floor(Number(after.targetShares) || 0));
    const before = Math.max(0, Math.floor(Number(snapshot.targetShares) || 0));
    if (held - before < buyShares) throw new Error('BUY verification failed: target position did not increase enough.');

    ctx.verified = true;
    transition(ctx, STATES.COMPLETE);
    await checkpoint(io, ctx);
    return ctx;
  } catch (err) {
    ctx.error = err && err.message ? err.message : String(err);
    transition(ctx, STATES.ERROR);
    await checkpoint(io, ctx);
    return ctx;
  }
}

module.exports = {
  STATES,
  netSellProceeds,
  sanitizePlan,
  normalizeResumeState,
  makeInitialState,
  executeRebalance
};
