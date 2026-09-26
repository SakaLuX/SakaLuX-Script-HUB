'use strict';

const TRAVEL_STATES = Object.freeze({
  TORN_TRAVEL_AGENCY: 'TORN_TRAVEL_AGENCY',
  IN_FLIGHT: 'IN_FLIGHT',
  LANDED_ABROAD: 'LANDED_ABROAD',
  OTHER: 'OTHER'
});

const DESTINATIONS = [
  'Mexico','Cayman Islands','Canada','Hawaii','United Kingdom','Argentina',
  'Switzerland','Japan','China','UAE','South Africa'
];

function normalizeText(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
function normalizeDestination(v){
  const s = normalizeText(v).toLowerCase();
  if (!s) return null;
  const found = DESTINATIONS.find(x => x.toLowerCase() === s || (x === 'Hawaii' && s === 'honolulu'));
  return found || null;
}

function detectTravelState(input = {}) {
  const href = String(input.href || '');
  const body = normalizeText(input.body || '');
  const pathname = String(input.pathname || '');

  if (/Remaining Flight Time/i.test(body) || /Traveling from .* to /i.test(body)) {
    return { state: TRAVEL_STATES.IN_FLIGHT, destination: null };
  }

  const abroadMatch = body.match(/You are in ([A-Z][A-Za-z ]+?) and have/i);
  const detectedDestination = normalizeDestination(input.destination || (abroadMatch && abroadMatch[1]));
  if (detectedDestination || /abroad\.php/i.test(href) || /\/abroad(?:\.php)?/i.test(pathname)) {
    return { state: TRAVEL_STATES.LANDED_ABROAD, destination: detectedDestination };
  }

  const travelAgency = /travelagency\.php/i.test(href) || /sid=travel/i.test(href) || /Travel Agency/i.test(body);
  if (travelAgency) return { state: TRAVEL_STATES.TORN_TRAVEL_AGENCY, destination: null };

  return { state: TRAVEL_STATES.OTHER, destination: null };
}

function panelPolicy(state) {
  return {
    bestRoute: state === TRAVEL_STATES.TORN_TRAVEL_AGENCY,
    arrivalBasket: state === TRAVEL_STATES.IN_FLIGHT,
    sessionSummary: state === TRAVEL_STATES.TORN_TRAVEL_AGENCY || state === TRAVEL_STATES.IN_FLIGHT || state === TRAVEL_STATES.LANDED_ABROAD,
    landedBestBuys: state === TRAVEL_STATES.LANDED_ABROAD
  };
}

function reconcilePanels(currentIds, state) {
  const policy = panelPolicy(state);
  const shouldExist = new Set();
  if (policy.bestRoute) shouldExist.add('sl-mi-best-run');
  if (policy.arrivalBasket) shouldExist.add('sl-mi-arrival-basket');
  if (policy.sessionSummary) shouldExist.add('sl-mi-session');
  if (policy.landedBestBuys) shouldExist.add('sl-mi-landed-best-buys');
  const existing = new Set(currentIds || []);
  return {
    mount: [...shouldExist].filter(id => !existing.has(id)),
    keep: [...shouldExist].filter(id => existing.has(id)),
    remove: [...existing].filter(id => !shouldExist.has(id))
  };
}

module.exports = { TRAVEL_STATES, DESTINATIONS, normalizeDestination, detectTravelState, panelPolicy, reconcilePanels };
