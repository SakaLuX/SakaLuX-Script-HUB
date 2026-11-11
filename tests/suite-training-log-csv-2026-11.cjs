'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('SakaLuX-Suite.user.js', 'utf8');
assert.match(source, /^\/\/ @version\s+0\.9\.1007$/m);
const parserLine = source.match(/csv\.every\(v=>(\/\^.*?\$\/)\.test\(v\)\)/);
assert.ok(parserLine, 'numeric Company training CSV validation must exist');
const numeric = eval(parserLine[1]);
for (const valid of ['50','25','0','12.5']) assert.ok(numeric.test(valid),valid);
for (const bad of ['nope','abc50','50x','-3']) assert.equal(numeric.test(bad),false,bad);
function gains(raw) {
  const csv = raw.trim().split(',').map(v=>v.trim());
  if(csv.length<2||csv.length>3||!csv.every(v=>numeric.test(v))) return [];
  return ['MAN','INT','END'].flatMap((stat,i)=>Number(csv[i]||0)>0?[stat+' +'+Number(csv[i])]:[]);
}
assert.deepEqual(gains('50,25'),['MAN +50','INT +25']);
assert.deepEqual(gains('50,25,0'),['MAN +50','INT +25']);
assert.deepEqual(gains('garbage,25'),[]);
const backfill=source.slice(source.indexOf('function tlDisplayGains('),source.indexOf('function tlRenderLog('));
assert.ok(backfill.includes('parts.length<2||parts.length>3'),'saved two-value backfill must remain enabled');
console.log('Suite Training Log CSV regression: OK');
