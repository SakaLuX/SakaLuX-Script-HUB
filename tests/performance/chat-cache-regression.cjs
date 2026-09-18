const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('SakaLuX-Chat-Intelligence.user.js','utf8');
function measure(text){const declaration=text.match(/const ROOTS=new WeakSet\(\).*?;\n/)[0];const decorate=text.match(/function decorate\(r,e,first\).*?\n/)[0];const remember=text.match(/function rememberMessage\(k\).*?\n/)?.[0]||'';const context=vm.createContext({who:()=>({id:'1',name:'Player'}),body:()=>'',allow:()=>true,M:new Set,pk:()=>'',F:new Set,dn:()=>'',H:x=>x,toast:()=>{},S:{notifications:false}});vm.runInContext(declaration+remember+decorate+`;for(let i=0;i<100000;i++)decorate({}, {dataset:{messageId:String(i)}},true); globalThis.result=SEEN.size;`,context);return context.result;}
const before=measure(fs.readFileSync('backups/performance-audit-2026-09-18/SakaLuX-Chat-Intelligence.user.js','utf8'));
const after=measure(source);console.log(JSON.stringify({messages:100000,beforeCacheEntries:before,afterCacheEntries:after}));
if(process.argv.includes('--assert'))assert(after<=4096);
if(process.argv.includes('--assert')){
 const declaration=source.match(/const ROOTS=new WeakSet\(\).*?;\n/)[0],decorate=source.match(/function decorate\(r,e,first\).*?\n/)[0],remember=source.match(/function rememberMessage\(k\).*?\n/)[0];let notifications=0;
 const context=vm.createContext({who:()=>({id:'1',name:'Player'}),body:()=>'',allow:()=>true,M:new Set,pk:()=>'',F:new Set,dn:()=>'',H:x=>x,toast:()=>notifications++,S:{notifications:true}});
 vm.runInContext(declaration+remember+decorate+`;const retained={dataset:{messageId:'retained'}};decorate({},retained,true);for(let i=0;i<10000;i++)decorate({},{dataset:{messageId:String(i)}},true);decorate({},retained,false);`,context);assert.equal(notifications,0,'retained DOM node stays deduplicated after cache eviction');
 vm.runInContext(`const fresh={dataset:{messageId:'fresh'}};decorate({},fresh,false);decorate({},fresh,false);`,context);assert.equal(notifications,1,'new message notifies exactly once');
 vm.runInContext(`fresh.dataset.messageId='changed';decorate({},fresh,false);`,context);assert.equal(notifications,2,'reused DOM node can notify a different message');console.log('Chat cache eviction, retained-message deduplication and new-message notification passed');
}
if(process.argv.includes('--assert')){
 const declaration=source.match(/const ROOTS=new WeakSet\(\).*?;\n/)[0],mentions=source.match(/function mentions\(r\).*?\n/)[0];const listeners=new Set,boxes=[];const root={appendChild(box){box.isConnected=true}},composer={parentElement:root,addEventListener(type,fn){listeners.add(fn)},removeEventListener(type,fn){listeners.delete(fn)}};
 const context=vm.createContext({S:{mentionAutocomplete:true},composer:()=>[composer],rootFor:()=>root,document:{createElement:()=>{const box={isConnected:false};boxes.push(box);return box}},msgs:()=>[]});context.root=root;
 vm.runInContext(declaration+mentions+';mentions(root);',context);assert.equal(listeners.size,1);
 for(let k=0;k<20;k++){boxes.at(-1).isConnected=false;vm.runInContext('mentions(root);',context);assert.equal(listeners.size,1);assert(boxes.at(-1).isConnected);}
 vm.runInContext('mentions(root);',context);assert.equal(listeners.size,1);assert.equal(boxes.length,21);console.log('Mention autocomplete restored after 20 cycles with exactly one input handler');
}
