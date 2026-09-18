const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
const source=fs.readFileSync('SakaLuX-Market-Intelligence.user.js','utf8');let key='key-a',calls=[],reject=false;
const context=vm.createContext({Map,Promise,String,getApiKey:()=>key,fetchMarketData:async(id,force)=>{calls.push({kind:'market',id,key,force});await new Promise(r=>setTimeout(r,15));if(reject)throw Error('Fixture error');return id;},fetchEquippedLoadoutData:async force=>{calls.push({kind:'equipment',key,force});await new Promise(r=>setTimeout(r,15));if(reject)throw Error('Fixture error');return [];}});
for(const name of ['fetchMarket','fetchEquippedLoadout']){const declaration=source.match(new RegExp('    const '+name+'Pending=new Map\\(\\);\\n    function '+name+'\\([^\\n]+'))[0];vm.runInContext(declaration+'\nglobalThis.'+name+'='+name+';',context);}
await Promise.all(Array.from({length:20},()=>context.fetchMarket(206,true)));assert.equal(calls.length,1);
await Promise.all([context.fetchMarket(206,true),context.fetchMarket(207,true)]);assert.equal(calls.length,3,'different item IDs remain independent');
const first=context.fetchMarket(206,true);key='key-b';await Promise.all([first,context.fetchMarket(206,true)]);assert.equal(calls.length,5,'different API keys remain independent');
reject=true;await assert.rejects(context.fetchMarket(206,true));reject=false;assert.equal(await context.fetchMarket(206,true),206,'rejection clears pending lookup');
calls=[];await Promise.all(Array.from({length:20},()=>context.fetchEquippedLoadout(true)));assert.equal(calls.length,1);reject=true;await assert.rejects(context.fetchEquippedLoadout(true));reject=false;await context.fetchEquippedLoadout(true);assert.equal(calls.length,3);
const hub=fs.readFileSync('SakaLuX-Script-Hub.user.js','utf8');const a=hub.indexOf('    function refreshRegistryAndCheck() {'),b=hub.indexOf('\n    function getUpdateState(',a);let loads=0,checks=0,fail=false;const hc=vm.createContext({Promise,updateCheckRunning:false,loadRegistry:async()=>{loads++;await new Promise(r=>setTimeout(r,15));if(fail)throw Error('Fixture registry error')},checkAllUpdates:async()=>{checks++}});vm.runInContext('let registryRefreshPending=null;'+hub.slice(a,b)+';globalThis.refresh=refreshRegistryAndCheck;',hc);
await Promise.all(Array.from({length:20},()=>hc.refresh()));assert.equal(loads,1);assert.equal(checks,1);fail=true;await assert.rejects(hc.refresh());fail=false;await hc.refresh();assert.equal(loads,3);assert.equal(checks,2);
console.log('Market request identity, distinct items/keys, equipment sharing, Hub sharing and failure recovery passed');
})().catch(e=>{console.error(e);process.exitCode=1});
