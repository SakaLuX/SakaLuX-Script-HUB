from pathlib import Path
import re

p=Path('SakaLuX-Stock-Manager-Advisor.user.js')
s=p.read_text(encoding='utf-8')

# Version surfaces inside the userscript runtime.
s=s.replace('// @version      0.8.8','// @version      0.8.9',1)
s=s.replace("let v = '0.8.8';","let v = '0.8.9';",1)
s=s.replace("version: '0.8.7',","version: '0.8.9',",1)
s=s.replace("version:'0.8.7'});","version:'0.8.9'});",2)

needle="  const rfc = () => (document.cookie.match(/(?:^|;\\s*)rfc_v=([^;]+)/)||[])[1] || '';\n"
if needle not in s:
    raise SystemExit('rfc helper marker not found')
insert=needle+"""

  function stockHubActive() {
    try {
      const installed=Boolean(window.SakaLuXScriptHub || document.documentElement?.getAttribute('data-sakalux-hub-installed')==='1' || document.body?.getAttribute('data-sakalux-hub-installed')==='1');
      const activeAttr=document.documentElement?.getAttribute('data-sakalux-hub-active') ?? document.body?.getAttribute('data-sakalux-hub-active');
      return installed && activeAttr!=='0';
    } catch { return false; }
  }

  function stockApiAccess() {
    try {
      if(stockHubActive()) {
        const api=window.SakaLuXScriptHub;
        const direct=String(api?.getApiKey?.()||'').trim();
        if(direct) return {key:direct,source:'SakaLuX Hub',shared:true};
        const stored=String(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim();
        if(stored) return {key:stored,source:'SakaLuX Hub',shared:true};
      }
    } catch {}
    const local=String(get(K.api,'')||'').trim();
    if(local) return {key:local,source:'Local standalone',shared:false};
    return {key:'',source:'None',shared:false};
  }

  const getStockApiKey = () => stockApiAccess().key;
"""
s=s.replace(needle,insert,1)

# API calls use Hub key first, local key as fallback.
s=s.replace('  async function apiSync() {\n    const key=get(K.api).trim();',"  async function apiSync(keyOverride='') {\n    const key=String(keyOverride||getStockApiKey()).trim();",1)
s=s.replace('  function syncAllApi() {',"  function syncAllApi(keyOverride='') {",1)
s=s.replace('    const user=await apiSync();\n    await syncStockCatalog();','    const user=await apiSync(keyOverride);\n    await syncStockCatalog(keyOverride);',1)
s=s.replace('  async function syncStockCatalog() {\n    const key=get(K.api).trim();',"  async function syncStockCatalog(keyOverride='') {\n    const key=String(keyOverride||getStockApiKey()).trim();",1)
s=s.replace('    const key=get(K.api).trim();\n    if(!key) throw new Error(\'Add an API key first.\');\n    const ids=[...new Set(Object.values(BENEFIT_MODELS)',"    const key=getStockApiKey();\n    if(!key) throw new Error('Add an API key first.');\n    const ids=[...new Set(Object.values(BENEFIT_MODELS)",1)

# All runtime availability checks should see the active Hub key too.
s=s.replace('get(K.api).trim()', 'getStockApiKey()')

start=s.find('  function openStockApiSheet() {')
end=s.find('\n  function openPanel() {',start)
if start<0 or end<0:
    raise SystemExit('openStockApiSheet block not found')
new_block=r'''  function openStockApiSheet() {
    normalizeStockPanelChrome();
    const p=S.panel||$('#slx-stock-panel'); const card=p?.querySelector('.card'); if(!card) return;
    card.querySelector('#slx-stock-api-sheet')?.remove();
    const sheet=document.createElement('div'); sheet.id='slx-stock-api-sheet';
    const local=String(get(K.api,'')||'');
    const initial=stockApiAccess();
    sheet.innerHTML=`<div class="slx-api-sheet-head"><div><div class="slx-api-sheet-title">🔑 Stock Manager API Access</div><div class="slx-api-sheet-sub">SakaLuX Stock Manager & Advisor v${APP.version}</div></div><button type="button" class="slx-api-sheet-close">×</button></div>
      <div class="slx-api-sheet-body">
        <div class="slx-api-box slx-stock-api-required"><b>Exact Torn permissions required</b><br>User: Money, Stocks<br>Torn: Stocks<br>No write permission is requested.</div>
        <button type="button" class="slx-api-primary" id="slx-stock-api-create">🔑 CREATE STOCK API KEY</button>
        <div class="slx-api-box">
          <div class="slx-stock-api-status" id="slx-stock-api-status"><b>TORN API ACCESS</b><span>${initial.key?'READY':'NOT CHECKED'}</span></div>
          <div id="slx-stock-api-source" class="slx-api-source">Active source: <b>${esc(initial.source)}</b></div>
          <div class="slx-api-note">The SakaLuX Hub general key is used automatically first when Hub is installed and active. The local key below remains the standalone fallback.</div>
          <label>Replace / paste standalone Torn API key</label>
          <input id="slx-stock-api-sheet-input" type="password" autocomplete="off" placeholder="Paste Torn API key here" value="${esc(local)}">
          <div class="slx-api-sheet-actions"><button type="button" class="slx-api-primary" id="slx-stock-api-save">SAVE & TEST</button><button type="button" id="slx-stock-api-check">CHECK ACCESS</button></div>
          <button type="button" id="slx-stock-api-clear">CLEAR LOCAL TORN KEY</button>
          <div class="slx-api-sheet-result" id="slx-stock-api-result" role="status" aria-live="polite">${initial.shared?'Hub key detected · it will be used automatically.':initial.key?'Local key detected.':'No API key configured.'}</div>
        </div>
      </div>`;
    card.appendChild(sheet);
    const result=sheet.querySelector('#slx-stock-api-result'), input=sheet.querySelector('#slx-stock-api-sheet-input');
    const statusBox=sheet.querySelector('#slx-stock-api-status'), sourceBox=sheet.querySelector('#slx-stock-api-source');
    const refreshSource=()=>{
      const access=stockApiAccess();
      sourceBox.innerHTML='Active source: <b>'+esc(access.source)+'</b>';
      statusBox.className='slx-stock-api-status '+(access.key?'ok':'missing');
      statusBox.querySelector('span').textContent=access.key?'READY':'MISSING';
      return access;
    };
    sheet.querySelector('.slx-api-sheet-close').onclick=()=>sheet.remove();
    sheet.querySelector('#slx-stock-api-create').onclick=createRequiredApiKey;
    const run=async save=>{
      const typed=String(input.value||'').trim();
      if(save&&!typed){result.textContent='Paste a Torn API key first.';input.focus();return;}
      if(save)set(K.api,typed);
      const active=stockApiAccess();
      const testKey=save?typed:(typed||active.key);
      if(!testKey){result.textContent='No API key configured in Hub or locally.';refreshSource();return;}
      const buttons=[sheet.querySelector('#slx-stock-api-save'),sheet.querySelector('#slx-stock-api-check')];
      buttons.forEach(b=>b.disabled=true);result.textContent='Checking Money, User Stocks and Torn Stocks access…';
      statusBox.className='slx-stock-api-status checking';statusBox.querySelector('span').textContent='CHECKING…';
      try{
        await syncAllApi(testKey);
        result.textContent=(save?'Local key saved and tested. ':'')+'Money: OK · User Stocks: OK · Torn Stocks: OK';
        statusBox.className='slx-stock-api-status ok';statusBox.querySelector('span').textContent='ACCESS OK ✓';
        refreshSource();
        refreshInlinePanel();
        if(S.panel?.dataset.open==='1'){renderPortfolio();renderAdvisor();renderOptimizer();renderTradeAssistant();}
      } catch(e){
        result.textContent='API check failed: '+String(e?.message||e);
        statusBox.className='slx-stock-api-status error';statusBox.querySelector('span').textContent='CHECK FAILED';
      } finally { buttons.forEach(b=>b.disabled=false); }
    };
    sheet.querySelector('#slx-stock-api-save').onclick=()=>run(true);
    sheet.querySelector('#slx-stock-api-check').onclick=()=>run(false);
    sheet.querySelector('#slx-stock-api-clear').onclick=()=>{
      del(K.api);input.value='';
      const access=refreshSource();
      result.textContent=access.shared?'Local key cleared · SakaLuX Hub key remains active.':'Local API key cleared.';
      refreshInlinePanel();
    };
  }
'''
s=s[:start]+new_block+s[end:]

# Add Elimination-style status/source styling to the API sheet.
css_marker="#slx-stock-api-sheet .slx-api-sheet-result{min-height:16px!important;margin:0!important;font-size:10px!important;color:#93a4b7!important;overflow-wrap:anywhere!important}"
css_add=css_marker+"\n#slx-stock-api-sheet .slx-stock-api-required{border-color:#66591d!important;background:#211d10!important;color:#e4c95d!important}\n#slx-stock-api-sheet .slx-api-source,#slx-stock-api-sheet .slx-api-note{margin:8px 0!important;color:#9ca3af!important;font-size:9px!important;line-height:1.45!important}\n#slx-stock-api-sheet .slx-stock-api-status{display:flex!important;justify-content:space-between!important;gap:8px!important;padding:8px!important;margin-bottom:8px!important;border-radius:7px!important;background:#181d24!important;font-size:10px!important;line-height:1.35!important}\n#slx-stock-api-sheet .slx-stock-api-status b{color:#d7b94c!important}\n#slx-stock-api-sheet .slx-stock-api-status.ok span{color:#78d98b!important}\n#slx-stock-api-sheet .slx-stock-api-status.error span,#slx-stock-api-sheet .slx-stock-api-status.missing span{color:#f08b8b!important}"
if css_marker in s:
    s=s.replace(css_marker,css_add,1)
else:
    raise SystemExit('API sheet CSS marker not found')

# Health reports active API source, not only the local fallback.
s=s.replace("health:()=>({ready:true,version:APP.version,enabled:bool(K.enabled,true),apiConfigured:Boolean(getStockApiKey()),dryRun:isDryRun(),tradeBusy:S.tradeBusy})",
            "health:()=>({ready:true,version:APP.version,enabled:bool(K.enabled,true),apiConfigured:Boolean(getStockApiKey()),apiSource:stockApiAccess().source,dryRun:isDryRun(),tradeBusy:S.tradeBusy})",1)

p.write_text(s,encoding='utf-8')
print('Patched Stock Manager v0.8.9: complete API Access panel + Hub-first key source')

# trigger workflow after workflow file exists
