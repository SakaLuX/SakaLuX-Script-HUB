'use strict';

const assert = require('node:assert/strict');
const { STATES, netSellProceeds, sanitizePlan, executeRebalance } = require('./stock-rebalance-state-machine-core.cjs');

function ioFactory(cfg = {}) {
  const calls = [];
  const checkpoints = [];
  let snapshots = Array.isArray(cfg.snapshots) ? [...cfg.snapshots] : [];
  const sellAttempts = new Map();
  return {
    calls,
    checkpoints,
    sell: async (sym, shares) => {
      const n = (sellAttempts.get(sym) || 0) + 1;
      sellAttempts.set(sym, n);
      calls.push(['sell', sym, shares, n]);
      const scripted = cfg.sellScript?.[sym];
      if (Array.isArray(scripted) && scripted.length) {
        const step = scripted[Math.min(n - 1, scripted.length - 1)];
        if (step instanceof Error) throw step;
        return step;
      }
      return cfg.sellResult?.[sym] ?? { success: true };
    },
    verifySell: async (sym, shares) => {
      calls.push(['verifySell', sym, shares]);
      const scripted = cfg.verifySell?.[sym];
      if (Array.isArray(scripted) && scripted.length) return scripted.shift();
      if (typeof scripted === 'boolean') return scripted;
      return true;
    },
    buy: async (sym, shares) => {
      calls.push(['buy', sym, shares]);
      if (cfg.buyError) throw cfg.buyError;
      return cfg.buyResult ?? { success: true };
    },
    wait: async ms => { calls.push(['wait', ms]); },
    sync: async () => { calls.push(['sync']); if (cfg.syncError) throw cfg.syncError; },
    snapshot: async () => {
      calls.push(['snapshot']);
      if (!snapshots.length) throw new Error('No snapshot configured.');
      const next = snapshots.shift();
      if (next instanceof Error) throw next;
      return next;
    },
    checkpoint: async state => {
      checkpoints.push(JSON.parse(JSON.stringify(state)));
      calls.push(['checkpoint', state.phase]);
      if (typeof cfg.onCheckpoint === 'function') await cfg.onCheckpoint(state, checkpoints.length);
    }
  };
}

async function test(name, fn) {
  try { await fn(); console.log('✓', name); }
  catch (e) { console.error('✗', name); throw e; }
}

(async () => {
  await test('0.1% sell fee math stays correct for large values', async () => {
    assert.equal(netSellProceeds(1_000_000_000), 999_000_000);
    assert.equal(netSellProceeds(987_654_321_000), 986_666_666_679);
  });

  await test('target stock is never included in SELL sources', async () => {
    const p = sanitizePlan({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 1000, price: 100 },
      sources: [
        { sym: 'TCB', shares: 500, price: 100 },
        { sym: 'SYM', shares: 100, price: 1000 }
      ]
    });
    assert.deepEqual(p.sources.map(x => x.sym), ['SYM']);
  });

  await test('happy path follows state machine and verifies SELL before BUY', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 120000, targetPrice: 100, targetShares: 100 },
      { cash: 20000, targetPrice: 100, targetShares: 1100 }
    ]});
    const ctx = await executeRebalance({
      cash: 10000,
      reserve: 20000,
      target: { sym: 'TCB', sharesNeeded: 1000, price: 100, tier: 2 },
      sources: [{ sym: 'SYM', shares: 120, price: 1000 }]
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(ctx.verified, true);
    assert.equal(io.calls.some(x => x[0] === 'verifySell' && x[1] === 'SYM'), true);
    assert.deepEqual(io.calls.filter(x => x[0] === 'buy')[0].slice(0,3), ['buy', 'TCB', 1000]);
  });

  await test('multiple SELL sources execute once each and all are checkpointed', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 300000, targetPrice: 1000, targetShares: 0 },
      { cash: 0, targetPrice: 1000, targetShares: 300 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 300, price: 1000 },
      sources: [
        { sym: 'SYM', shares: 100, price: 1000 },
        { sym: 'WLT', shares: 100, price: 1000 },
        { sym: 'FHG', shares: 100, price: 1000 }
      ]
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.deepEqual(io.calls.filter(x => x[0] === 'sell').map(x => x[1]), ['SYM','WLT','FHG']);
    assert.equal(io.checkpoints.filter(x => Array.isArray(x.sold) && x.sold.length > 0).length >= 3, true);
  });

  await test('resume after interruption does not sell an already completed source twice', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 200000, targetPrice: 1000, targetShares: 0 },
      { cash: 0, targetPrice: 1000, targetShares: 200 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 200, price: 1000 },
      sources: [
        { sym: 'SYM', shares: 100, price: 1000 },
        { sym: 'WLT', shares: 100, price: 1000 }
      ]
    }, io, {
      syncDelayMs: 0,
      resumeState: { sold: [{ sym: 'SYM', shares: 100 }] }
    });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(io.calls.some(x => x[0] === 'sell' && x[1] === 'SYM'), false);
    assert.equal(io.calls.filter(x => x[0] === 'sell' && x[1] === 'WLT').length, 1);
  });

  await test('uncertain SELL response is verified before retry so duplicate sale is prevented', async () => {
    const io = ioFactory({
      sellScript: { SYM: [new Error('TornPDA network detached')] },
      verifySell: { SYM: [true] },
      snapshots: [
        { cash: 100000, targetPrice: 1000, targetShares: 0 },
        { cash: 0, targetPrice: 1000, targetShares: 100 }
      ]
    });
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: [{ sym: 'SYM', shares: 100, price: 1000 }]
    }, io, { syncDelayMs: 0, maxSellRetries: 2, retryDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(io.calls.filter(x => x[0] === 'sell' && x[1] === 'SYM').length, 1);
    assert.equal(ctx.sold[0].recovered, true);
  });

  await test('safe retry occurs only after verification proves first SELL did not land', async () => {
    const io = ioFactory({
      sellScript: { SYM: [new Error('timeout'), { success: true }] },
      verifySell: { SYM: [false, true] },
      snapshots: [
        { cash: 100000, targetPrice: 1000, targetShares: 0 },
        { cash: 0, targetPrice: 1000, targetShares: 100 }
      ]
    });
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: [{ sym: 'SYM', shares: 100, price: 1000 }]
    }, io, { syncDelayMs: 0, maxSellRetries: 1, retryDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(io.calls.filter(x => x[0] === 'sell' && x[1] === 'SYM').length, 2);
  });

  await test('failed SELL after retries stops entire rebalance before BUY', async () => {
    const io = ioFactory({
      sellScript: { SYM: [{ success: false }, { success: false }] },
      verifySell: { SYM: [false, false] },
      snapshots: []
    });
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: [{ sym: 'SYM', shares: 100, price: 1000 }]
    }, io, { syncDelayMs: 0, maxSellRetries: 1, retryDelayMs: 0 });
    assert.equal(ctx.phase, STATES.ERROR);
    assert.equal(io.calls.some(x => x[0] === 'buy'), false);
  });

  await test('TornPDA-style SELL to BUY transition waits, syncs, snapshots, then buys', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 100000, targetPrice: 1000, targetShares: 0 },
      { cash: 0, targetPrice: 1000, targetShares: 100 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: [{ sym: 'SYM', shares: 101, price: 1000 }]
    }, io, { syncDelayMs: 2500 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    const names = io.calls.map(x => x[0]);
    const sellIdx = names.indexOf('sell');
    const waitIdx = names.indexOf('wait', sellIdx + 1);
    const syncIdx = names.indexOf('sync', waitIdx + 1);
    const snapIdx = names.indexOf('snapshot', syncIdx + 1);
    const buyIdx = names.indexOf('buy', snapIdx + 1);
    assert.equal(sellIdx >= 0 && waitIdx > sellIdx && syncIdx > waitIdx && snapIdx > syncIdx && buyIdx > snapIdx, true);
  });

  await test('BUY amount is recalculated from verified cash after SELL', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 50500, targetPrice: 100, targetShares: 0 },
      { cash: 500, targetPrice: 100, targetShares: 500 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 500,
      target: { sym: 'TCB', sharesNeeded: 1000, price: 90 },
      sources: [{ sym: 'SYM', shares: 100, price: 1000 }]
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(ctx.bought.shares, 500);
  });

  await test('large rebalance cannot overspend when target price rises', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 999_000_000, targetPrice: 1_250_000, targetShares: 10 },
      { cash: 250_000, targetPrice: 1_250_000, targetShares: 809 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 1000, price: 1_000_000 },
      sources: [{ sym: 'SYM', shares: 1_000_000, price: 1000 }]
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(ctx.bought.shares, 799);
  });

  await test('insufficient verified cash stops before BUY', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 999, targetPrice: 1000, targetShares: 0 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 10, price: 1000 },
      sources: []
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.STOPPED);
    assert.equal(io.calls.some(x => x[0] === 'buy'), false);
  });

  await test('BUY must be explicitly confirmed', async () => {
    const io = ioFactory({ buyResult: { success: false }, snapshots: [
      { cash: 10000, targetPrice: 1000, targetShares: 0 }
    ]});
    const ctx = await executeRebalance({
      cash: 10000,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 10, price: 1000 },
      sources: []
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.ERROR);
    assert.match(ctx.error, /BUY not confirmed/);
  });

  await test('post-BUY position verification catches false success', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 10000, targetPrice: 1000, targetShares: 100 },
      { cash: 0, targetPrice: 1000, targetShares: 105 }
    ]});
    const ctx = await executeRebalance({
      cash: 10000,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 10, price: 1000 },
      sources: []
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.ERROR);
    assert.match(ctx.error, /verification failed/i);
  });

  await test('resume after BUY checkpoint verifies position without buying twice', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 0, targetPrice: 1000, targetShares: 100 }
    ]});
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: []
    }, io, {
      syncDelayMs: 0,
      resumeState: { bought: { sym: 'TCB', shares: 100, price: 1000 } }
    });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(io.calls.some(x => x[0] === 'buy'), false);
  });

  await test('reserve cash is never consumed by BUY', async () => {
    const io = ioFactory({ snapshots: [
      { cash: 100000, targetPrice: 1000, targetShares: 0 },
      { cash: 20000, targetPrice: 1000, targetShares: 80 }
    ]});
    const ctx = await executeRebalance({
      cash: 100000,
      reserve: 20000,
      target: { sym: 'TCB', sharesNeeded: 100, price: 1000 },
      sources: []
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.COMPLETE);
    assert.equal(ctx.bought.shares, 80);
  });

  console.log('\nAll Stock rebalance state-machine regression tests passed.');
})().catch(err => { console.error(err.stack || err); process.exit(1); });
