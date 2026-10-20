const fs = require('node:fs');
const assert = require('node:assert/strict');

const source = fs.readFileSync('SakaLuX-Suite.user.js', 'utf8');

assert.match(source, /^\/\/\s*@version\s+0\.9\.985$/m);
assert.equal((source.match(/(?:const VERSION\s*=\s*['"]0\.9\.985['"])/g) || []).length, 2);
assert.match(source, /lotteryMaxBuy:\s*true/);
assert.match(source, /id:\s*"lotteryMaxBuy"/);
assert.match(source, /factory:\s*createLotteryMaxBuyModule/);
assert.match(source, /function createLotteryMaxBuyModule\(context\)/);
assert.ok(source.includes("daily\\s*dime|lucky\\s*shot"));
assert.ok(source.includes("holy\\s*grail"));
assert.match(source, /availableTokens\(\)/);
assert.match(source, /MAX BUY/);
assert.match(source, /input\.dispatchEvent\(new Event\('input'/);
assert.match(source, /input\.dispatchEvent\(new Event\('change'/);
assert.doesNotMatch(source, /slx-lottery-max-buy[\s\S]{0,4000}\.click\(\)/);

console.log('suite lottery max buy 0.9.985 regression: OK');
