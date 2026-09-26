'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const marketPath = path.join(root, 'SakaLuX-Market-Intelligence.user.js');
const stockPath = path.join(root, 'SakaLuX-Stock-Manager-Advisor.user.js');

function replaceBetween(source, start, end, replacement, label) {
  const a = source.indexOf(start);
  if (a < 0) throw new Error(`${label}: start marker not found`);
  const b = source.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`${label}: end marker not found`);
  return source.slice(0, a) + replacement + source.slice(b);
}

function replaceOnce(source, oldText, newText, label) {
  const first = source.indexOf(oldText);
  if (first < 0) throw new Error(`${label}: expected text not found`);
  if (source.indexOf(oldText, first + oldText.length) >= 0) throw new Error(`${label}: expected text is not unique`);
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

let market = fs.readFileSync(marketPath, 'utf8');
market = replaceOnce(
  market,
  "    function loadJson(key, fallback) {\n        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }\n        catch (_) { return fallback; }\n    }\n    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }",
  "    function loadJson(key, fallback) { return window.SakaLuXCore.storage.get(key, fallback); }\n    function saveJson(key, value) { window.SakaLuXCore.storage.set(key, value); }",
  'Market JSON storage migration'
);

market = replaceBetween(
  market,
  '    function requestJson(url) {',
  '    function checkApiError(data)',
  `    function requestJson(url, options={}) {\n        if (typeof window.PDA_httpGet === 'function') state.apiMode='Torn PDA';\n        else {\n            let gm=false; try { gm=typeof GM_xmlhttpRequest === 'function'; } catch (_) {}\n            state.apiMode=gm?'Tampermonkey':(state.apiMode||'Fetch');\n        }\n        return window.SakaLuXCore.api.requestJson(url,{\n            timeout:15000,\n            retries:2,\n            retryBase:450,\n            ttl:Math.max(0,Number(options.ttl)||0),\n            force:!!options.force,\n            routeScoped:!!options.routeScoped,\n            headers:{Accept:'application/json'}\n        });\n    }\n`,
  'Market requestJson migration'
);

fs.writeFileSync(marketPath, market, 'utf8');

let stock = fs.readFileSync(stockPath, 'utf8');
stock = replaceBetween(
  stock,
  "  async function apiJson(url, label='API') {",
  '  function normalizeUserStocks(data) {',
  `  async function apiJson(url, label='API') {\n    try {\n      const data=await window.SakaLuXCore.api.requestJson(url,{timeout:15000,retries:2,retryBase:450});\n      if(data?.error) throw new Error(apiErrorMessage(data));\n      return data;\n    } catch(err) {\n      if(err?.code==='INVALID_JSON') throw new Error(\\`${'${label}'}: invalid JSON response.\\`);\n      if(err?.code==='HTTP') throw new Error(\\`${'${label}'}: HTTP ${'${err.status||0}'} · ${'${err.message||\'request failed\'}'}\\`);\n      throw new Error(\\`${'${label}'}: ${'${err?.message||\'request failed\'}'}\\`);\n    }\n  }\n\n`,
  'Stock apiJson migration'
);

stock = replaceOnce(
  stock,
  "        const r=await fetch(`https://api.torn.com/v2/torn/${id}/items?key=${encodeURIComponent(key)}&ts=${Date.now()}`,{credentials:'omit'});\n        const d=await r.json();\n        if(d?.error) throw new Error(d.error.error||'API error');",
  "        const d=await apiJson(`https://api.torn.com/v2/torn/${id}/items?key=${encodeURIComponent(key)}&ts=${Date.now()}`,'Torn / item');",
  'Stock benefit item API migration'
);

stock = replaceOnce(
  stock,
  "  function stockRebalanceCheckpointRead(){try{return JSON.parse(localStorage.getItem(STOCK_REBALANCE_CHECKPOINT)||'null')}catch{return null}}\n  function stockRebalanceCheckpointWrite(state){try{localStorage.setItem(STOCK_REBALANCE_CHECKPOINT,JSON.stringify(state))}catch{}}\n  function stockRebalanceCheckpointClear(){try{localStorage.removeItem(STOCK_REBALANCE_CHECKPOINT)}catch{}}",
  "  function stockRebalanceCheckpointRead(){return window.SakaLuXCore.storage.get(STOCK_REBALANCE_CHECKPOINT,null)}\n  function stockRebalanceCheckpointWrite(state){window.SakaLuXCore.storage.set(STOCK_REBALANCE_CHECKPOINT,state)}\n  function stockRebalanceCheckpointClear(){window.SakaLuXCore.storage.remove(STOCK_REBALANCE_CHECKPOINT)}",
  'Stock checkpoint storage migration'
);

fs.writeFileSync(stockPath, stock, 'utf8');

console.log('Shared Core API/storage migration applied to Market Intelligence and Stock Manager.');
