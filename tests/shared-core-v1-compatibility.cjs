'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { embedSharedCore } = require('../tools/embed-shared-core.cjs');

const CORE_PATH = 'src/core/sakalux-core.js';
const TARGETS = [
  'SakaLuX-Market-Intelligence.user.js',
  'SakaLuX-Stock-Manager-Advisor.user.js'
];
const EXPECTED_ORDER = [
  'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
  'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
];
const HUB_IDS = [
  'sakalux-hub-button','sakalux-hub-top-skull','sakalux-hub-nav-skull','sakalux-hub-panel','sakalux-hub-style'
];
const HUB_ATTRS = ['data-sakalux-hub-installed','data-sakalux-hub-active'];

function element(id='') {
  return {
    id,
    attrs:new Map(),
    nodeType:1,
    parentElement:null,
    getAttribute(k){ return this.attrs.has(k) ? this.attrs.get(k) : null; },
    setAttribute(k,v){ this.attrs.set(k,String(v)); },
    closest(selector){
      if (id === 'chat-box' && selector.includes('#chat-box')) return this;
      if (id === 'sakalux-standalone-dock' && selector.includes('#sakalux-standalone-dock')) return this;
      if (id === 'sakalux-inline-footer-test' && selector.includes('[id^="sakalux-inline-footer-"]')) return this;
      return null;
    }
  };
}

function makeContext(){
  const nodes=new Map();
  const html=element('html');
  const body=element('body');
  const store=new Map();
  const ctx={
    console,
    setTimeout, clearTimeout,
    requestIdleCallback: undefined,
    localStorage:{
      getItem:k=>store.has(k)?store.get(k):null,
      setItem:(k,v)=>store.set(k,String(v)),
      removeItem:k=>store.delete(k)
    },
    location:{pathname:'/index.php',search:'',hash:''},
    document:{documentElement:html,body,getElementById:id=>nodes.get(id)||null},
    globalThis:null
  };
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(CORE_PATH,'utf8'),ctx);
  return {ctx,core:ctx.SakaLuXCore,nodes,html,body};
}

function legacyHubInstalled({ctx,nodes,html,body}){
  return !!(
    ctx.SakaLuXScriptHub ||
    nodes.get('sakalux-hub-button') ||
    nodes.get('sakalux-hub-top-skull') ||
    nodes.get('sakalux-hub-nav-skull') ||
    nodes.get('sakalux-hub-panel') ||
    nodes.get('sakalux-hub-style') ||
    html.getAttribute('data-sakalux-hub-installed')==='1' ||
    body.getAttribute('data-sakalux-hub-installed')==='1' ||
    html.getAttribute('data-sakalux-hub-active')==='1' ||
    body.getAttribute('data-sakalux-hub-active')==='1'
  );
}

function legacySort(registrations){
  const deduped=[...new Map(registrations.filter(Boolean).map(r=>[r.id,r])).values()];
  return deduped.sort((a,b)=>{
    const ai=EXPECTED_ORDER.indexOf(a.id), bi=EXPECTED_ORDER.indexOf(b.id);
    const ar=ai<0?Number.MAX_SAFE_INTEGER:ai;
    const br=bi<0?Number.MAX_SAFE_INTEGER:bi;
    return ar-br || String(a.name||a.id).localeCompare(String(b.name||b.id));
  });
}

(async()=>{
  const coreSource=fs.readFileSync(CORE_PATH,'utf8');
  const env=makeContext();
  const {core,ctx,nodes,html,body}=env;

  // Static compatibility contracts from the current production bootstraps.
  for(const target of TARGETS){
    const source=fs.readFileSync(target,'utf8');
    for(const id of HUB_IDS) assert.ok(source.includes(id), `${target}: Hub detector keeps ${id}`);
    for(const attr of HUB_ATTRS) assert.ok(source.includes(attr), `${target}: Hub detector keeps ${attr}`);
    for(const id of EXPECTED_ORDER) assert.ok(source.includes(`'${id}'`) || source.includes(`\"${id}\"`), `${target}: dock order keeps ${id}`);
    assert.ok(source.includes('g.SakaLuXPerf'), `${target}: legacy SakaLuXPerf contract exists`);
    assert.ok(source.includes('Math.max(120'), `${target}: legacy debounce minimum exists`);
    assert.ok(source.includes('#chat-box'), `${target}: chat mutation exclusion exists`);
    assert.ok(source.includes('#sakalux-standalone-dock'), `${target}: dock mutation exclusion exists`);

    const built=embedSharedCore(source,coreSource);
    assert.ok(built.includes('SakaLuXCore'), `${target}: Core embedded`);
    assert.equal((built.match(/\/\* SakaLuX Shared Core — BEGIN \*\//g)||[]).length,1,`${target}: one Core block`);
    // Core installs the legacy alias before each existing bootstrap executes. Existing bootstraps use if (!g.SakaLuXPerf), so no behavior fork is created.
    assert.ok(built.indexOf('/* SakaLuX Shared Core — BEGIN */') < built.indexOf('g.SakaLuXPerf'), `${target}: Core alias available before legacy perf bootstrap`);
  }

  assert.deepEqual(Array.from(core.dock.ORDER),EXPECTED_ORDER,'Core dock order equals current production order');

  // Hub detection parity for every production signal.
  assert.equal(core.hub.installed(),legacyHubInstalled(env),'Hub absent parity');
  for(const id of HUB_IDS){
    nodes.set(id,element(id));
    assert.equal(core.hub.installed(),legacyHubInstalled(env),`Hub id parity: ${id}`);
    nodes.delete(id);
  }
  ctx.SakaLuXScriptHub={};
  assert.equal(core.hub.installed(),legacyHubInstalled(env),'Hub global parity');
  delete ctx.SakaLuXScriptHub;
  for(const host of [html,body]){
    for(const attr of HUB_ATTRS){
      host.setAttribute(attr,'1');
      assert.equal(core.hub.installed(),legacyHubInstalled(env),`Hub attr parity: ${attr}`);
      host.setAttribute(attr,'0');
    }
  }

  // Dock dedupe/order parity, including late re-registration and unknown modules.
  const regs=[
    {id:'stock-manager-advisor',name:'Stock'},
    {id:'market-intelligence',name:'Market old'},
    {id:'zzz',name:'ZZZ'},
    {id:'enhancer',name:'Enhancer'},
    {id:'market-intelligence',name:'Market latest'},
    {id:'aaa',name:'AAA'}
  ];
  const expected=legacySort(regs).map(x=>`${x.id}:${x.name}`);
  const actual=core.dock.sort(regs).map(x=>`${x.id}:${x.name}`);
  assert.deepEqual(Array.from(actual),Array.from(expected),'Core dock sort/dedupe equals legacy contract');

  // Performance contract parity.
  assert.equal(ctx.SakaLuXPerf,core.perf,'Core exposes legacy SakaLuXPerf alias');
  assert.equal(core.perf.unrelated([{target:element('chat-box')}]),true,'chat mutations ignored');
  assert.equal(core.perf.unrelated([{target:element('sakalux-standalone-dock')}]),true,'dock mutations ignored');
  assert.equal(core.perf.unrelated([{target:element('sakalux-inline-footer-test')}]),true,'footer mutations ignored');
  assert.equal(core.perf.unrelated([{target:element('normal')}]),false,'normal mutations retained');
  let fired=0;
  const start=Date.now();
  core.perf.debounce('compat',()=>fired++,1);
  core.perf.debounce('compat',()=>fired++,1);
  await new Promise(r=>setTimeout(r,145));
  assert.equal(fired,1,'debounce coalesces duplicate calls');
  assert.ok(Date.now()-start>=110,'debounce preserves production minimum delay');

  // SPA route contract: path/search/hash changes trigger once, unchanged route does not.
  const changes=[];
  core.router.onChange(e=>changes.push(`${e.previous}>${e.current}`));
  assert.equal(core.router.check(),false,'unchanged initial route ignored');
  ctx.location.search='?sid=travel';
  assert.equal(core.router.check(),true,'query SPA navigation detected');
  assert.equal(core.router.check(),false,'same query route ignored');
  ctx.location.hash='#items';
  assert.equal(core.router.check(),true,'hash navigation detected');
  ctx.location.pathname='/bazaar.php'; ctx.location.search=''; ctx.location.hash='';
  assert.equal(core.router.check(),true,'pathname navigation detected');
  assert.equal(changes.length,3,'exactly one callback per route transition');

  console.log('All Shared Core v1 production compatibility tests passed for Market + Stocks.');
})().catch(err=>{console.error(err.stack||err);process.exit(1);});
