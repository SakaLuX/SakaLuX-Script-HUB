'use strict';

const assert = require('node:assert/strict');
const { STATES, netSellProceeds, sanitizePlan, executeRebalance } = require('./stock-rebalance-state-machine-core.cjs');

function ioFactory(cfg = {}) {
  const calls = [];
  let snapshots = Array.isArray(cfg.snapshots) ? [...cfg.snapshots] : [];
  return {
    calls,
    sell: async (sym, shares) => { calls.push(['sell', sym, shares]); return cfg.sellResult?.[sym] ?? { success: true }; },
    buy: async (sym, shares) => { calls.push(['buy', sym, shares]); return cfg.buyResult ?? { success: true }; },
    wait: async ms => { calls.push(['wait', ms]); },
    sync: async () => { calls.push(['sync']); },
    snapshot: async () => {
      calls.push(['snapshot']);
      if (!snapshots.length) throw new Error('No snapshot configured.');
      return snapshots.shift();
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

  await test('happy path follows the full state machine in order', async () => {
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
    assert.deepEqual(ctx.history, [
      STATES.PLANNING, STATES.SELLING, STATES.WAITING_SYNC,
      STATES.VERIFYING_CASH, STATES.BUYING, STATES.VERIFYING_POSITION,
      STATES.COMPLETE
    ]);
    assert.deepEqual(io.calls.filter(x => x[0] === 'buy')[0], ['buy', 'TCB', 1000]);
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

  await test('SELL must be explicitly confirmed', async () => {
    const io = ioFactory({ sellResult: { SYM: { success: false } }, snapshots: [] });
    const ctx = await executeRebalance({
      cash: 0,
      reserve: 0,
      target: { sym: 'TCB', sharesNeeded: 10, price: 1000 },
      sources: [{ sym: 'SYM', shares: 10, price: 1000 }]
    }, io, { syncDelayMs: 0 });
    assert.equal(ctx.phase, STATES.ERROR);
    assert.match(ctx.error, /SELL not confirmed/);
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
