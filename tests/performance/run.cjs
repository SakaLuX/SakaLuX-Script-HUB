const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const files = fs.readdirSync('.').filter(x=>x.endsWith('.user.js')).sort();
const results=[];
for (const file of files) for (const mode of ['standalone', 'relevant']) {
  const child=spawnSync(process.execPath,['tests/performance/worker.cjs',file,mode],{encoding:'utf8',timeout:12000,env:process.env,maxBuffer:1024*1024});
  try { const row=JSON.parse(child.stdout.trim().split('\n').at(-1)); results.push(row); console.log(`${file} ${mode}: ${row.queries} queries; ${row.timeoutsScheduled} timeouts; ${row.observerMs}ms observer work; errors=${row.errors.length}`); }
  catch { results.push({file,mode,error:child.error?.message || child.stderr || 'No result'}); console.log(`${file} ${mode}: FAILED`); }
}
fs.writeFileSync(process.argv[2]||'/tmp/performance-results.json',JSON.stringify({fixture:'400 rows, 40 unrelated chat mutations at 20ms intervals, 1000ms initial settle, 450ms drain; jsdom, offline APIs; no rendering/GPU',node:process.version,results},null,2));
if(results.some(x=>x.error))process.exitCode=1;
if(process.argv.includes('--assert')) {
 const assert=require('node:assert/strict');
 for(const row of results) {
  assert(!row.error,`${row.file}: ${row.error}`);
  assert.equal(row.errors.length,0,`${row.file}: ${row.errors.join('; ')}`);
  assert(row.timeoutsScheduled <= (row.file.includes('Poker') ? 35 : 25),`${row.file} ${row.mode}: ${row.timeoutsScheduled} scheduled timers`);
  if(row.file.includes('Enhancer'))assert(row.queries<100,`${row.file}: inventory rescan from unrelated workload`);
 }
 const child=spawnSync(process.execPath,['tests/performance/worker.cjs','SakaLuX-Suite.user.js','suite-enabled'],{encoding:'utf8',timeout:20000,env:process.env,maxBuffer:1024*1024});
 assert.equal(child.status,0,child.stderr);
 const enabled=JSON.parse(child.stdout.trim().split('\n').at(-1));
 assert(enabled.timeoutsScheduled<250,`Suite native modules: ${enabled.timeoutsScheduled} scheduled timers`);
 assert.equal(enabled.errors.filter(x=>!x.includes('Could not parse CSS stylesheet')).length,0);
 console.log(`Suite all-native-enabled: ${enabled.timeoutsScheduled} scheduled timers; workload budget passed.`);
}
