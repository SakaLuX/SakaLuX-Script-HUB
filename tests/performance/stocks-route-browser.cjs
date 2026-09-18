const fs=require('node:fs');
const prefix=fs.readFileSync('tests/performance/extended.cjs','utf8').split('try{\nfor(const file of files)')[0];
const body=String.raw`
report.fixture='Offline final Stocks SPA return verification: original 35ms-away/65ms-return sample plus explicit 500ms eventual deadline. Preserves every early miss and measured latency; no real API calls.';
try{const item=await setup('SakaLuX-Stock-Manager-Advisor.user.js');const {page}=item;const original=new URL(page.url());const before=await page.evaluate(()=>__snapshot());const cycles=[];
for(let cycle=0;cycle<100;cycle++){
 await page.evaluate(()=>{history.pushState({},'','/index.php');dispatchEvent(new PopStateEvent('popstate'));document.querySelector('#visible').replaceChildren(Object.assign(document.createElement('ul'),{id:'stock_visible'}));__pulse(1)});
 const removed=await page.locator('#slx-stock-inline').count()===0;await page.waitForTimeout(35);
 const start=Date.now();await page.evaluate(url=>{history.pushState({},'',url);dispatchEvent(new PopStateEvent('popstate'))},original.pathname+original.search);await page.waitForTimeout(65);
 const early=await page.locator('#slx-stock-inline').count()===1;let deadline=false;
 if(!early){try{await page.waitForFunction(()=>document.querySelectorAll('#slx-stock-inline').length===1,{},{timeout:435});}catch{deadline=true;}}
 const mounted=await page.locator('#slx-stock-inline').count()===1;cycles.push({cycle:cycle+1,removed,within65ms:early,mounted,deadline,elapsedMs:Date.now()-start});
}
await page.waitForTimeout(3500);const after=await page.evaluate(()=>__snapshot());report.results.push({file:'SakaLuX-Stock-Manager-Advisor.user.js',version:fs.readFileSync('SakaLuX-Stock-Manager-Advisor.user.js','utf8').match(/@version\s+(\S+)/)[1],before,after,cycles,errors:item.errors});
check(cycles.every(x=>x.removed),'Stocks previous host/panel removed on all 100 departures');
check(cycles.every(x=>x.mounted&&!x.deadline),'Stocks remounts once on all 100 returns within 500ms deadline');
check(after.observers<=before.observers+2&&after.intervals<=before.intervals+2,'Stocks route observers and intervals remain bounded');
check(item.errors.length===0,'Stocks timed route returns no uncaught errors');console.log('STOCK_ROUTE_RESULT '+JSON.stringify(report.results[0]));
}finally{await browser.close();fs.writeFileSync('reports/extended-performance-2026-09-18/stocks-route-verification.json',JSON.stringify(report,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});`;
new Function('require',prefix+body)(require);
