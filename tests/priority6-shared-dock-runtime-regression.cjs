'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const src=fs.readFileSync('src/core/sakalux-dock-runtime.js','utf8');
assert.match(src,/SakaLuX Shared Dock Runtime v1/);
assert.match(src,/const VERSION = '1\.0\.0-test\.2'/);
assert.ok(src.includes("dock: 'sakalux-standalone-dock'"));
assert.ok(src.includes('latest registration wins'));
assert.ok(src.includes("SakaLuX:ScriptHubReady"));
assert.ok(src.includes("const OPEN_KEY = 'SakaLuX_STANDALONE_DOCK_OPEN'"));
assert.ok(src.includes('findStatusIconList()'));
assert.ok(src.includes('maybePrompt()'));

function makeNode(tag='div'){
  const n={tagName:tag.toUpperCase(),children:[],dataset:{},hidden:false,disabled:false,id:'',className:'',textContent:'',title:'',type:'',href:'',attrs:{},listeners:{},removed:false,
    appendChild(c){this.children.push(c);c.parentNode=this;if(c.id)nodes.set(c.id,c);return c;},
    replaceChildren(...c){this.children=[...c];for(const x of c){x.parentNode=this;if(x.id)nodes.set(x.id,x);}},
    remove(){this.removed=true;if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);},
    addEventListener(t,fn){this.listeners[t]=fn;},
    setAttribute(k,v){this.attrs[k]=String(v);},removeAttribute(k){delete this.attrs[k];}
  };return n;
}
const nodes=new Map();
const body=makeNode('body'),head=makeNode('head'),html=makeNode('html');
const document={
  body,head,documentElement:html,
  createElement:makeNode,
  getElementById:id=>{const n=nodes.get(id);return n&&!n.removed?n:null;},
  querySelectorAll:()=>[]
};
let hub=false;
const core={
  hub:{installed:()=>hub},
  perf:{debounce(_key,fn){fn();},unrelated:()=>false},
  router:{onChange:()=>()=>{},bind:()=>true},
  dock:{ORDER:['a','b','c'],sort(rows){return [...new Map(rows.map(x=>[x.id,x])).values()].sort((x,y)=>this.ORDER.indexOf(x.id)-this.ORDER.indexOf(y.id));}}
};
const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const context={globalThis:null,document,SakaLuXCore:core,console,Map,Object,Error,Date,localStorage,setTimeout:()=>0,clearTimeout:()=>{},location:{href:'https://www.torn.com/index.php',pathname:'/index.php'}};
context.globalThis=context;context.addEventListener=()=>{};
vm.createContext(context);vm.runInContext(src,context);
const rt=context.SakaLuXDockRuntime;assert(rt);
let opened=0;
rt.register({id:'b',name:'Bee',icon:'B',open:()=>opened++});
rt.register({id:'a',name:'Aye',icon:'A',open:()=>opened++});
rt.register({id:'b',name:'Bee 2',icon:'B2',open:()=>opened++});
assert.deepEqual(Array.from(rt.list(),x=>x.id),['a','b']);
assert.equal(rt.list()[1].name,'Bee 2');
const panel=rt.render();assert(panel);
const rows=panel.children[1].children;
assert.deepEqual(Array.from(rows,x=>x.dataset.moduleId),['a','b']);
assert.equal(rt.toggleDock(true),true);assert.equal(panel.dataset.open,'1');assert.equal(panel.hidden,false);
rows[0].listeners.click();assert.equal(opened,1);assert.equal(panel.dataset.open,'0');assert.equal(panel.hidden,true);
assert.equal(localStorage.getItem('SakaLuX_STANDALONE_DOCK_OPEN'),'0');
hub=true;assert.equal(rt.render(),null);assert.equal(document.getElementById(rt.ids.dock),null);assert.equal(document.getElementById(rt.ids.fallback),null);
console.log('Priority 6 shared dock runtime regression passed.');
