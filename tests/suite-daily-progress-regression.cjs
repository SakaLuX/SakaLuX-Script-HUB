'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require('jsdom');

const source=fs.readFileSync('SakaLuX-Suite.user.js','utf8');
assert.match(source,/\/\/\s*@version\s+0\.9\.939\b/,'Suite metadata version');
assert.match(source,/const VERSION = '0\.9\.939';\s*\n\s*const SUITE = Object\.freeze/,'Suite runtime version synchronized');
assert.ok(source.includes('data-action="daily-progress"'),'Daily Progress is exposed in Master Control toolbar');
const begin='/* SakaLuX Suite Daily Progress — BEGIN */';
const end='/* SakaLuX Suite Daily Progress — END */';
assert.equal((source.match(/SakaLuX Suite Daily Progress — BEGIN/g)||[]).length,1,'Daily Progress block exactly once');
const a=source.indexOf(begin),b=source.indexOf(end,a);
assert.ok(a>=0&&b>a,'Daily Progress block markers');
const block=source.slice(a+begin.length,b);

const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'https://www.torn.com/index.php',runScripts:'outside-only',pretendToBeVisual:true});
const {window}=dom;
window.confirm=()=>true;
window.SakaLuXCore={router:{onChange(){return()=>{}},bind(){return true;}}};
window.eval(block);
const api=window.SakaLuXSuiteDailyProgress;
assert.ok(api,'Daily Progress public API exposed');
assert.equal(api.version,'1.0.0');
assert.equal(api.dayKey(new Date(2026,8,6)),'2026-09-06','local day key is stable');
let s=api.summary();
assert.equal(s.total,6,'six default objectives');
assert.equal(s.done,0);
assert.equal(s.percent,0);

api.setObjective('review',true);
s=api.summary();
assert.equal(s.done,1);
assert.equal(s.percent,17);
const customId=api.addObjective('Check bazaar listings');
assert.ok(customId);
s=api.summary();
assert.equal(s.total,7);
assert.equal(s.objectives.find(x=>x.id===customId).done,false);
api.setObjective(customId,true);
assert.equal(api.summary().done,2);
api.removeObjective(customId);
assert.equal(api.summary().total,6);

api.recordActivity('gym','/gym.php');
assert.equal(api.summary().objectives.find(x=>x.id==='gym').done,true,'Gym route can auto-complete Gym objective');
api.recordActivity('gym','/gym.php');
assert.equal(api.get().activities.filter(x=>x.type==='gym').length,1,'duplicate route activity coalesced within 30 seconds');

const storeKey=api.storageKey;
const yesterday='2000-01-01';
window.localStorage.setItem(storeKey,JSON.stringify({schemaVersion:1,days:{[yesterday]:{date:yesterday,objectives:{review:true},custom:[],activities:[],updatedAt:1}}}));
const today=api.get();
assert.notEqual(today.date,yesterday,'new local day creates a fresh day record');
assert.equal(today.objectives.review,false,'daily objectives roll over instead of carrying completion');

const bulk={schemaVersion:1,days:{}};
for(let i=1;i<=40;i++){const k=`2025-01-${String(i).padStart(2,'0')}`;bulk.days[k]={date:k,objectives:{},custom:[],activities:[],updatedAt:i};}
window.localStorage.setItem(storeKey,JSON.stringify(bulk));
api.recordActivity('missions','/loader.php?sid=missions');
const bounded=JSON.parse(window.localStorage.getItem(storeKey));
assert.ok(Object.keys(bounded.days).length<=30,'history is bounded to 30 local days');

window.localStorage.setItem('sakalux_master_suite_settings_v1',JSON.stringify({modules:{a:true,b:false,c:true}}));
const modules=api.moduleStatus();
assert.equal(modules.enabled,2,'module status counts enabled settings');
assert.ok(modules.total>=23,'module status keeps Suite baseline');

assert.equal(api.open(),true);
const panel=window.document.getElementById('sakalux-suite-daily-progress');
assert.ok(panel?.classList.contains('open'),'dashboard opens');
assert.ok(panel.querySelector('.sdp-bar'),'progress bar rendered');
api.close();
assert.ok(!panel.classList.contains('open'),'dashboard closes');
const bridge=window.document.getElementById('sakalux-module-bridge-suite-daily-progress');
assert.ok(bridge,'hidden Daily Progress bridge exists');
bridge.dataset.action='open';bridge.click();
assert.ok(window.document.getElementById('sakalux-suite-daily-progress').classList.contains('open'),'bridge opens dashboard');

api.resetToday();
assert.equal(api.summary().done,0,'reset today clears completion');
dom.window.close();
console.log('Suite Daily Progress: storage, rollover, objectives, route activity, module status, UI and bridge passed.');
