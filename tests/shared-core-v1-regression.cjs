'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeElement(id = '') {
  return {
    id,
    attrs: new Map(),
    nodeType: 1,
    parentElement: null,
    getAttribute(name) { return this.attrs.has(name) ? this.attrs.get(name) : null; },
    setAttribute(name, value) { this.attrs.set(name, String(value)); },
    closest(selector) {
      if (!selector) return null;
      if (this.id === 'chat-box' && selector.includes('#chat-box')) return this;
      if (this.id === 'sakalux-standalone-dock' && selector.includes('#sakalux-standalone-dock')) return this;
      return null;
    }
  };
}

function loadCore({ hub = false } = {}) {
  const elements = new Map();
  const html = makeElement('html');
  const body = makeElement('body');
  if (hub) elements.set('sakalux-hub-panel', makeElement('sakalux-hub-panel'));
  const store = new Map();
  const eventHandlers = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    addEventListener(type, fn) {
      const list = eventHandlers.get(type) || [];
      list.push(fn);
      eventHandlers.set(type, list);
    },
    localStorage: {
      getItem: k => store.has(k) ? store.get(k) : null,
      setItem: (k,v) => store.set(k,String(v)),
      removeItem: k => store.delete(k)
    },
    location: { pathname:'/index.php', search:'', hash:'' },
    document: {
      documentElement: html,
      body,
      getElementById: id => elements.get(id) || null
    },
    globalThis: null
  };
  context.globalThis = context;
  vm.createContext(context);
  const code = fs.readFileSync('src/core/sakalux-core.js','utf8');
  vm.runInContext(code, context);
  return { context, core: context.SakaLuXCore, elements, html, body, store, eventHandlers };
}

(async () => {
  const { core, context, elements, html, store, eventHandlers } = loadCore();
  assert.ok(core, 'core exported');
  assert.equal(core.version, '1.0.0-test.4');
  assert.equal(context.SakaLuXPerf, core.perf, 'legacy SakaLuXPerf alias preserved');
  assert.equal(typeof core.ui?.ensureSharedSkin, 'function', 'shared UI skin moved into Core');
  assert.equal(typeof core.api?.requestJson, 'function', 'API Request Broker exported');

  assert.equal(core.hub.installed(), false, 'Hub absent detected');
  elements.set('sakalux-hub-panel', makeElement('sakalux-hub-panel'));
  assert.equal(core.hub.installed(), true, 'Hub panel detected');
  elements.delete('sakalux-hub-panel');
  html.setAttribute('data-sakalux-hub-installed','1');
  assert.equal(core.hub.installed(), true, 'Hub dataset detected');

  assert.equal(core.storage.get('missing', 7), 7);
  assert.equal(core.storage.set('x', {a:1}), true);
  assert.equal(JSON.stringify(core.storage.get('x')), '{"a":1}');
  assert.equal(core.storage.remove('x'), true);
  store.set('bad','{broken');
  assert.equal(core.storage.get('bad','fallback'),'fallback');

  const regs = [
    {id:'stock-manager-advisor',name:'Stock'},
    {id:'market-intelligence',name:'Market old'},
    {id:'market-intelligence',name:'Market latest'},
    {id:'enhancer',name:'Enhancer'},
    {id:'zzz',name:'ZZZ'}
  ];
  const sorted = core.dock.sort(regs);
  assert.equal(JSON.stringify([...sorted].map(x=>x.id)), JSON.stringify(['enhancer','market-intelligence','stock-manager-advisor','zzz']));
  assert.equal(sorted.find(x=>x.id==='market-intelligence').name,'Market latest','latest duplicate wins');

  const events = [];
  core.router.onChange(e => events.push(e));
  assert.equal(core.router.check(), false, 'same route ignored');
  assert.equal(core.router.bind(), true, 'router binds browser route signals once');
  assert.equal(core.router.bind(), false, 'router bind is idempotent');
  assert.equal(eventHandlers.get('hashchange').length, 1);
  assert.equal(eventHandlers.get('popstate').length, 1);
  context.location.search='?sid=travel';
  eventHandlers.get('popstate')[0]();
  assert.equal(events.length,1);
  assert.equal(events[0].current,'/index.php?sid=travel');
  assert.equal(core.router.epoch(),1,'router epoch increments on SPA navigation');

  let calls = 0;
  core.perf.debounce('x', () => calls++, 5);
  core.perf.debounce('x', () => calls++, 5);
  await new Promise(r => setTimeout(r, 150));
  assert.equal(calls,1,'debounce coalesces calls and preserves minimum wait');

  const chat = makeElement('chat-box');
  assert.equal(core.perf.unrelated([{target:chat}]), true, 'chat mutation ignored');
  assert.equal(core.perf.unrelated([{target:makeElement('other')}]), false, 'normal mutation not ignored');

  const secondCode = fs.readFileSync('src/core/sakalux-core.js','utf8');
  vm.runInContext(secondCode, context);
  assert.equal(context.SakaLuXCore, core, 'same Core version does not reinitialize');

  console.log('All Shared Core v1 regression tests passed.');
})().catch(err => { console.error(err.stack || err); process.exit(1); });
