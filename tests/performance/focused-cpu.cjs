// Repeat the potentially noisy Chat/Suite/combined CPU comparisons in fresh browsers.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const adapter=fs.readFileSync('tests/performance/extended-browser.cjs','utf8');
const marker="new Function('require', source)(require);";
assert(adapter.includes(marker),'CPU adapter changed');
const injected="source=source.replace(\"files.push('__combined-SakaLuX__');\",\"files.splice(0,files.length,'SakaLuX-Chat-Intelligence.user.js','SakaLuX-Suite.user.js','__combined-SakaLuX__');\");\n"+marker;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sakalux-focused-cpu-'));
const script=path.join(temp,'adapter.cjs');fs.writeFileSync(script,adapter.replace(marker,injected));
const root='reports/extended-performance-2026-09-18';const all=[];
try{
for(let sample=1;sample<=5;sample++){
 const output=root+'/focused-sample-'+sample+'.json';
 const run=cp.spawnSync(process.execPath,[script,output],{encoding:'utf8',env:process.env,maxBuffer:4000000});
 if(run.status!==0)throw Error(run.stderr||run.stdout);
 const report=JSON.parse(fs.readFileSync(output,'utf8'));assert.equal(report.results.length,8);
 assert(report.assertions.every(x=>x.passed));
 all.push(...report.results.map(x=>({...x,sample})));console.log('FOCUSED_SAMPLE '+sample+' passed');
}
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const profiles=[...new Set(all.map(x=>x.file+'|'+x.mode))];
const summary=profiles.map(profile=>{const [file,mode]=profile.split('|');const pick=variant=>{const rows=all.filter(x=>x.file===file&&x.mode===mode&&x.variant===variant);return {medianScriptMs:median(rows.map(x=>x.scriptMs)),minScriptMs:Math.min(...rows.map(x=>x.scriptMs)),maxScriptMs:Math.max(...rows.map(x=>x.scriptMs)),medianLayoutMs:median(rows.map(x=>x.layoutMs)),longTasks:rows.reduce((n,x)=>n+x.longTasks,0)}};return {file,mode,before:pick('before'),after:pick('after')};});
const report={fixture:'Five independent fresh-Chromium repetitions of focused Chat/Suite/native/combined mobile CPU comparisons; same 6x-throttled workload; medians and full sample ranges, not phone FPS.',assertions:[{label:'40 repeated CPU samples without uncaught errors',passed:all.length===40&&all.every(x=>x.errors.length===0)},{label:'40 repeated CPU samples use actual 412px layout',passed:all.every(x=>x.layoutWidth===412)}],results:all,summary};
fs.writeFileSync(root+'/browser-focused.json',JSON.stringify(report,null,2));console.log(JSON.stringify(summary));assert(report.assertions.every(x=>x.passed));
