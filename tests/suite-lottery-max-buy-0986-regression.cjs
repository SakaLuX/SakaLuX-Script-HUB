const fs = require('node:fs');
const assert = require('node:assert/strict');

const source = fs.readFileSync('SakaLuX-Suite.user.js', 'utf8');

assert.match(source, /^\/\/\s*@version\s+0\.9\.986$/m);
assert.equal((source.match(/(?:const VERSION\s*=\s*['"]0\.9\.986['"])/g) || []).length, 2);
assert.match(source, /lotteryMaxBuy:\s*true/);
assert.match(source, /function createLotteryMaxBuyModule\(context\)/);
assert.match(source, /function nativeBuyControls\(root = document\)/);
assert.match(source, /you\\s\+have\.\{0,80\}\?\\band\\s\+\(\[\\d,\.\]\+\)\\s\+/);
assert.match(source, /\^buy\$\/i\.test\(controlText\(control\)\)/);
assert.match(source, /nativeBuy\.insertAdjacentElement\('afterend', button\)/);
assert.match(source, /Cumperi maximum \$\{startTokens\} bilete/);
assert.match(source, /nativeBuy\.click\(\)/);
assert.match(source, /waitForTokenDecrease\(before\)/);
assert.match(source, /STOP · \$\{Math\.max\(0, remaining \|\| tokens\)\}/);

console.log('suite lottery max buy 0.9.986 button-only regression: OK');
