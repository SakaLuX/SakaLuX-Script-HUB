'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const src=fs.readFileSync('src/core/sakalux-dock-runtime.js','utf8');
assert.match(src,/SakaLuX Shared Dock Runtime v1/);
assert.match(src,/const VERSION = '1\.0\.0-test\.1'/);
assert.ok(src.includes("dock: 'sakalux-standalone-dock'"));
assert.ok(src.includes('latest registration wins'));
assert.ok(src.includes("SakaLuX:ScriptHubReady"));

function makeNode(tag='div'){
  const n={tagName:tag.toUpperCase(),children:[],dataset:{},hidden:false,disabled:false,id:'',className:'',textContent:'',title:'',type:'',attrs:{},listeners:{},
    appendChild(c){this.children.push(c);c.parentNode=this;return c;},
    replaceChildren(...c){this.children=[...c];for(const x of c)x.parentNode=this;},
    remove(){this.removed=true;},
    addEventListener(t,fn){this.listeners[t]=fn;},
    setAttribute(k,v){this.attrs[k]=String(v);},removeAttribute(k){delete this.attrs[k];}
  };return n;
}
const nodes=new Map();
const body=makeNode('body'),head=makeNode('head'),html=makeNode('html');
for(const host of [body,head,html]){const old=host.appendChild.bind(host);host.appendChild=c=>{if(c.id)nodes.set(c.id,c);return old(c);};}
const document={body,head,documentElement:html,createElement:makeNode,getElementById:id=>{const n=nodes.get(id);return n&&!n.removed?n:null;}};
let hub=false;
const core={hub:{installed:()=>hub},dock:{ORDER:['a','b','c'],sort(rows){return [...new Map(rows.map(x=>[x.id,x])).values()].sort((x,y)=>this.ORDER.indexOf(x.id)-this.ORDER.indexOf(y.id));}}};
const context={globalThis:null,document,SakaLuXCore:core,console,Map,Object,Error};context.globalThis=context;context.addEventListener=()=>{};
vm.createContext(context);vm.runInContext(src,context);
const rt=context.SakaLuXDockRuntime;assert(rt);
let opened=0;
rt.register({id:'b',name:'Bee',icon:'B',open:()=>opened++});
rt.register({id:'a',name:'Aye',icon:'A',open:()=>opened++});
rt.register({id:'b',name:'Bee 2',icon:'B2',open:()=>opened++});
assert.deepEqual(rt.list().map(x=>x.id),['a','b']);
assert.equal(rt.list()[1].name,'Bee 2');
const panel=rt.render();assert(panel);assert.deepEqual(panel.children.map(x=>x.dataset.moduleId),['a','b']);
panel.children[0].listeners.click();assert.equal(opened,1);assert.equal(panel.hidden,true);
hub=true;assert.equal(rt.render(),null);assert.equal(document.getElementById(rt.ids.dock),null);assert.equal(document.getElementById(rt.ids.fallback),null);
console.log('Priority 6 shared dock runtime regression passed.');
