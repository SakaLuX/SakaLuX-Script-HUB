'use strict';

const assert = require('node:assert/strict');
const { TRAVEL_STATES, detectTravelState, panelPolicy, reconcilePanels } = require('./market-travel-state-machine-core.cjs');

async function test(name, fn){
  try { await fn(); console.log('✓', name); }
  catch (e) { console.error('✗', name); throw e; }
}

(async () => {
  await test('Torn Travel Agency is detected explicitly', async () => {
    const x = detectTravelState({ href:'https://www.torn.com/travelagency.php', body:'Travel Agency' });
    assert.equal(x.state, TRAVEL_STATES.TORN_TRAVEL_AGENCY);
  });

  await test('sid=travel is detected as Torn Travel Agency', async () => {
    const x = detectTravelState({ href:'https://www.torn.com/page.php?sid=travel', body:'Choose your destination' });
    assert.equal(x.state, TRAVEL_STATES.TORN_TRAVEL_AGENCY);
  });

  await test('in-flight state wins over generic travel page signals', async () => {
    const x = detectTravelState({ href:'https://www.torn.com/page.php?sid=travel', body:'Remaining Flight Time 12:34 Traveling from Torn to Hawaii' });
    assert.equal(x.state, TRAVEL_STATES.IN_FLIGHT);
  });

  await test('Hawaii landed page is LANDED_ABROAD, not Travel Agency', async () => {
    const x = detectTravelState({ href:'https://www.torn.com/abroad.php', body:'You are in Hawaii and have $1,373,262. You have purchased 0 / 28 items so far.' });
    assert.equal(x.state, TRAVEL_STATES.LANDED_ABROAD);
    assert.equal(x.destination, 'Hawaii');
  });

  await test('foreign destinations are normalized from landed text', async () => {
    for (const destination of ['Mexico','Canada','Japan','China','South Africa']) {
      const x = detectTravelState({ href:'https://www.torn.com/abroad.php', body:`You are in ${destination} and have $1,000.` });
      assert.equal(x.state, TRAVEL_STATES.LANDED_ABROAD);
      assert.equal(x.destination, destination);
    }
  });

  await test('Messages and unrelated pages are OTHER even after travel history', async () => {
    const x = detectTravelState({ href:'https://www.torn.com/messages.php', body:'Messages Inbox' });
    assert.equal(x.state, TRAVEL_STATES.OTHER);
  });

  await test('Best Route is ONLY allowed on Torn Travel Agency', async () => {
    assert.equal(panelPolicy(TRAVEL_STATES.TORN_TRAVEL_AGENCY).bestRoute, true);
    assert.equal(panelPolicy(TRAVEL_STATES.IN_FLIGHT).bestRoute, false);
    assert.equal(panelPolicy(TRAVEL_STATES.LANDED_ABROAD).bestRoute, false);
    assert.equal(panelPolicy(TRAVEL_STATES.OTHER).bestRoute, false);
  });

  await test('Arrival Basket is ONLY allowed while in flight', async () => {
    assert.equal(panelPolicy(TRAVEL_STATES.IN_FLIGHT).arrivalBasket, true);
    assert.equal(panelPolicy(TRAVEL_STATES.TORN_TRAVEL_AGENCY).arrivalBasket, false);
    assert.equal(panelPolicy(TRAVEL_STATES.LANDED_ABROAD).arrivalBasket, false);
    assert.equal(panelPolicy(TRAVEL_STATES.OTHER).arrivalBasket, false);
  });

  await test('Travel Session Summary stays within travel lifecycle only', async () => {
    assert.equal(panelPolicy(TRAVEL_STATES.TORN_TRAVEL_AGENCY).sessionSummary, true);
    assert.equal(panelPolicy(TRAVEL_STATES.IN_FLIGHT).sessionSummary, true);
    assert.equal(panelPolicy(TRAVEL_STATES.LANDED_ABROAD).sessionSummary, true);
    assert.equal(panelPolicy(TRAVEL_STATES.OTHER).sessionSummary, false);
  });

  await test('landed Best Buys only exists abroad', async () => {
    assert.equal(panelPolicy(TRAVEL_STATES.LANDED_ABROAD).landedBestBuys, true);
    assert.equal(panelPolicy(TRAVEL_STATES.TORN_TRAVEL_AGENCY).landedBestBuys, false);
    assert.equal(panelPolicy(TRAVEL_STATES.IN_FLIGHT).landedBestBuys, false);
  });

  await test('navigation Travel Agency → flight removes Best Route and mounts Arrival Basket', async () => {
    const r = reconcilePanels(['sl-mi-best-run','sl-mi-session'], TRAVEL_STATES.IN_FLIGHT);
    assert.deepEqual(r.remove.sort(), ['sl-mi-best-run']);
    assert.equal(r.mount.includes('sl-mi-arrival-basket'), true);
    assert.equal(r.keep.includes('sl-mi-session'), true);
  });

  await test('navigation flight → Hawaii removes Arrival Basket and never mounts Best Route', async () => {
    const r = reconcilePanels(['sl-mi-arrival-basket','sl-mi-session'], TRAVEL_STATES.LANDED_ABROAD);
    assert.equal(r.remove.includes('sl-mi-arrival-basket'), true);
    assert.equal(r.mount.includes('sl-mi-best-run'), false);
    assert.equal(r.mount.includes('sl-mi-landed-best-buys'), true);
  });

  await test('navigation Hawaii → Messages removes every travel panel immediately', async () => {
    const r = reconcilePanels(['sl-mi-session','sl-mi-arrival-basket','sl-mi-best-run','sl-mi-landed-best-buys'], TRAVEL_STATES.OTHER);
    assert.deepEqual(r.mount, []);
    assert.equal(r.remove.length, 4);
  });

  await test('returning from Hawaii to Torn Travel Agency mounts Best Route again', async () => {
    const r = reconcilePanels(['sl-mi-session','sl-mi-landed-best-buys'], TRAVEL_STATES.TORN_TRAVEL_AGENCY);
    assert.equal(r.mount.includes('sl-mi-best-run'), true);
    assert.equal(r.remove.includes('sl-mi-landed-best-buys'), true);
  });

  await test('stale Best Route left on Hawaii is forcibly removed', async () => {
    const r = reconcilePanels(['sl-mi-best-run','sl-mi-session'], TRAVEL_STATES.LANDED_ABROAD);
    assert.equal(r.remove.includes('sl-mi-best-run'), true);
  });

  console.log('\nAll Market travel state-machine regression tests passed.');
})().catch(err => { console.error(err.stack || err); process.exit(1); });
