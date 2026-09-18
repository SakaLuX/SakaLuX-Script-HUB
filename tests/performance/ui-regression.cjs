const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('jsdom');
const sleep = ms => new Promise(r=>setTimeout(r,ms));
function block(source,tag) {const first=source.indexOf('/* '+tag+' */');assert(first>=0);const last=source.indexOf('\n})();',first);assert(last>first);return source.slice(first,last+7);}
(async()=>{
 for(const [file,tag,panelId,footerId] of [
  ['SakaLuX-Market-Intelligence.user.js','SAKALUX_FORCE_FOOTER_V5_MARKET','sl-mi-panel','sakalux-inline-footer-market-intelligence'],
  ['SakaLuX-Mission-Rewards.user.js','SAKALUX_FORCE_FOOTER_V5_MISSION','sl-mr-settings-panel','sakalux-inline-footer-mission-rewards'],
  ['SakaLuX-Mission-Rewards.user.js','SAKALUX_MISSION_REAL_FOOTER_V1038','sl-mr-settings','sakalux-inline-footer-mission-rewards']
 ]) {
  const dom=new JSDOM('<!doctype html><body><aside id="chat-box"></aside></body>',{url:'https://www.torn.com/index.php',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,source=fs.readFileSync(file,'utf8');
  const first=source.indexOf('    // Ignore chat and our own dock/footer mutations');
  const last=source.indexOf("    if (!document.getElementById('sakalux-shared-hub-skin'))",first);
  w.eval('const g=window;g.SakaLuXPerf={};'+source.slice(first,last));
  let timers=0;const timeout=w.setTimeout.bind(w);w.setTimeout=(...args)=>{timers++;return timeout(...args)};
  w.eval(block(source,tag));await sleep(160);const initial=timers;
  for(let i=0;i<40;i++){w.document.getElementById('chat-box').appendChild(w.document.createElement('span'));await sleep(2)}
  await sleep(160);assert.equal(timers,initial,'Unrelated chat scheduled footer timers');
  const wrapper=w.document.createElement('div');wrapper.innerHTML=`<section id="${panelId}"><header>Settings</header></section>`;w.document.body.appendChild(wrapper);
  await sleep(180);const footer=w.document.getElementById(footerId);assert(footer,'Footer missing after nested panel insertion');assert.equal(footer.querySelectorAll('button').length,2);
  footer.remove();await sleep(180);assert(w.document.getElementById(footerId),'Footer did not recover after removal');
  wrapper.remove();const replacement=wrapper.cloneNode(false);replacement.innerHTML=`<section id="${panelId}"></section>`;w.document.body.appendChild(replacement);await sleep(180);
  assert.equal(w.document.querySelectorAll('#'+footerId).length,1);
  dom.window.close();
 }
 const source=fs.readFileSync('SakaLuX-Enhancer-Guard.user.js','utf8');
 const marker='    function renderProtectionBadge(item) {';
 assert(source.includes(marker));
 const instrumented=source.replace(marker,'    window.__inventory={inventoryBadgeMarkup,installInventoryProtection}; return;\n'+marker);
 const dom=new JSDOM('<!doctype html><body><div class="thumbnail-wrap" data-item-name="Ecstasy"></div></body>',{url:'https://www.torn.com/item.php',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.eval(instrumented);const target=w.document.querySelector('.thumbnail-wrap');
 w.__inventory.inventoryBadgeMarkup(target,'Ecstasy');const badge=target.firstChild,child=badge.firstChild;
 for(let i=0;i<30;i++)w.__inventory.inventoryBadgeMarkup(target,'Ecstasy');
 assert.equal(target.firstChild,badge);assert.equal(badge.firstChild,child,'Unchanged lock markup was replaced');
 w.mmpStorageGetFullLocks=()=>({'stack_ecstasy':true});w.__inventory.inventoryBadgeMarkup(target,'Ecstasy');assert.equal(badge.textContent,'🔒');
 assert.equal(badge.title,'Unlock item');
 w.__inventory.inventoryBadgeMarkup(target,'Ecstasy');const locked=badge.firstChild;w.__inventory.inventoryBadgeMarkup(target,'Ecstasy');assert.equal(badge.firstChild,locked);
 dom.window.close();
 console.log('Performance UI: no footer timers from chat; nested panel mounting, footer recovery and stable/changing lock badges passed.');
})();
