'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { stripSharedCore } = require('../tools/embed-shared-core.cjs');

const market = stripSharedCore(fs.readFileSync('SakaLuX-Market-Intelligence.user.js','utf8'));
const stock = stripSharedCore(fs.readFileSync('SakaLuX-Stock-Manager-Advisor.user.js','utf8'));

assert.ok(market.includes('window.SakaLuXCore.api.requestJson'), 'Market must use Shared Core API broker');
assert.equal(/GM_xmlhttpRequest\s*\(\s*\{/.test(market), false, 'Market must not keep its private GM request transport');
assert.equal(/PDA_httpGet\s*\(\s*url/.test(market), false, 'Market must not keep its private PDA request transport');
assert.ok(market.includes('window.SakaLuXCore.storage.get(key, fallback)'), 'Market JSON storage must use Shared Core storage');
assert.ok(market.includes('window.SakaLuXCore.storage.set(key, value)'), 'Market JSON storage write must use Shared Core storage');

assert.ok(stock.includes('window.SakaLuXCore.api.requestJson'), 'Stock Manager must use Shared Core API broker');
assert.equal(/fetch\s*\(\s*`https:\/\/api\.torn\.com/.test(stock), false, 'Stock Manager must not fetch Torn API directly');
assert.equal(/fetch\s*\(\s*['"]https:\/\/api\.torn\.com/.test(stock), false, 'Stock Manager must not fetch Torn API directly');
assert.ok(stock.includes("fetch(`https://www.torn.com/page.php?sid=StockMarket&step=${encodeURIComponent(step)}"), 'transactional Torn stock POST must remain direct and isolated from API broker');
assert.ok(stock.includes("method:'POST'"), 'transactional stock write must still be POST');
assert.ok(stock.includes('window.SakaLuXCore.storage.get(STOCK_REBALANCE_CHECKPOINT,null)'), 'Stock rebalance checkpoint read must use Shared Core storage');
assert.ok(stock.includes('window.SakaLuXCore.storage.set(STOCK_REBALANCE_CHECKPOINT,state)'), 'Stock rebalance checkpoint write must use Shared Core storage');

console.log('Shared Core API/storage integration regression passed for Market + Stock Manager.');
