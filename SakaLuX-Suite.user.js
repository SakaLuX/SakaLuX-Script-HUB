// ==UserScript==
// @name         SakaLuX Suite [EXPERIMENTAL]
// @namespace    sakalux.suite
// @version      0.9.902
// @description  Experimental all-in-one modular SakaLuX toolkit for Torn PDA / Tampermonkey.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @license      All Rights Reserved
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Suite.user.js
// @run-at       document-end
// ==/UserScript==

/*
 * Copyright © 2026 SakaLuX [2380374]
 * All Rights Reserved.
 *
 * Personal use and private modification are permitted.
 * Redistribution, republication, rebranding, or publication of
 * modified versions requires prior written permission from
 * SakaLuX [2380374].
 *
 * Original author attribution must be retained in all authorized
 * derivative works.
 */

(() => {
'use strict';

const VERSION='0.9.902';
const IDS={fallback:'slx-suite-button',native:'slx-suite-native-button',overlay:'slx-suite-overlay',style:'slx-suite-style',dock:'slx-reminder-dock'};
const K={
 modules:'SakaLuX_SUITE_MODULES_V2',api:'SakaLuX_SUITE_TORN_API_KEY',
 prayerDay:'SakaLuX_SUITE_PRAYER_UTC_DAY',recovery:'SakaLuX_SUITE_RECOVERY_SETTINGS_V1',
 eventSaved:'SakaLuX_SUITE_EVENT_SAVED_V1',race:'SakaLuX_SUITE_RACE_LEAGUE_V1'
};

const MODULES=[
{id:'daily-prayer',name:'Daily Prayer Bell',icon:'🙏',cat:'Reminders',desc:'Daily prayer cue with UTC reset, Torn Church shortcut and automatic success detection.',kind:'internal',enabled:false,action:'prayer',settings:false},
{id:'recovery-planner',name:'Recovery Planner',icon:'✚',cat:'Reminders',desc:'HP and hospital recovery advisor with configurable medical bonuses and priorities.',kind:'internal',enabled:false,action:'recovery',settings:true},
{id:'item-signals',name:'Item Signal',icon:'🔎',cat:'Reminders',desc:'Fortie-style purpose markers and compact item tooltips for OC gear, crime tools, boosters, medical items and enhancers.',kind:'internal',enabled:false,action:'items',settings:false},
{id:'event-lens',name:'Event Lens',icon:'🗂️',cat:'Reminders',desc:'Fortie-style searchable Events dashboard with category counts, daily groups and locally saved events.',kind:'internal',enabled:false,action:'events',settings:false},
{id:'chain-alarm',name:'Chain Alarm',icon:'⛓️',cat:'Reminders',desc:'Floating chain timer with warning thresholds, drag support and critical alerts.',kind:'internal',enabled:false,action:'chain',settings:false},

{id:'faction-pulse',name:'Faction Pulse',icon:'📡',cat:'Faction',desc:'Faction member activity, hospital, travel and abroad status intelligence.',kind:'internal',enabled:false,action:'factionPulse',settings:true},
{id:'armory-loan-radar',name:'Armory Loan Radar',icon:'🎒',cat:'Faction',desc:'Scans faction armory loans, highlights loan state and saves a local snapshot.',kind:'internal',enabled:false,action:'armory',settings:true},
{id:'member-travel-map',name:'Member Travel Map',icon:'🌍',cat:'Faction',desc:'Country flags on faction members with editable local overrides and sorting.',kind:'internal',enabled:false,action:'travelMap',settings:true},
{id:'oc-role-match',name:'OC Role Match',icon:'🧩',cat:'Faction',desc:'OC role suitability and visible success clues without automating crimes.',kind:'internal',enabled:false,action:'ocMatch',settings:true},
{id:'oc-readiness',name:'OC Readiness',icon:'✅',cat:'Faction',desc:'OC participation reminder with missing role/item readiness warnings.',kind:'internal',enabled:false,action:'ocReady',settings:true},
{id:'war-performance',name:'War Performance',icon:'⚔️',cat:'Faction',desc:'Ranked-war performance analytics with local report snapshots and MVP signals.',kind:'internal',enabled:false,action:'war',settings:true},

{id:'company-console',name:'Company Console',icon:'🏢',cat:'Company',desc:'Company overview with employee signals, snapshots, training log and price calculator.',kind:'internal',enabled:false,action:'company',settings:true},
{id:'odds-scout',name:'Odds Scout',icon:'🎲',cat:'Casino',desc:'Betting odds scanner with implied probability and market-margin hints.',kind:'internal',enabled:false,action:'odds',settings:true},
{id:'race-league-board',name:'Race League Board',icon:'🏁',cat:'Racing',desc:'Race result scanner with F1 points, persistent championships and duplicate protection.',kind:'internal',enabled:false,action:'racing',settings:true},

{id:'enhancer',name:'Enhancer Guard',icon:'🛡️',cat:'SakaLuX Modules',desc:'Enhancer inventory tracker and missing-item intelligence.',kind:'bridge',global:'SakaLuXEnhancerGuard',button:'#sl-eg-button',enabled:true},
{id:'bazaar',name:'Bazaar Thanker',icon:'💬',cat:'SakaLuX Modules',desc:'Buyer grouping, thank-you messages, statistics and history.',kind:'bridge',global:'SakaLuXBazaarThanker',button:'#sakalux-bt-settings-button',enabled:true},
{id:'market',name:'Market Intelligence',icon:'📈',cat:'SakaLuX Modules',desc:'Travel, Bazaar, Item Market, Museum and basket optimization.',kind:'bridge',global:'SakaLuXMarketIntelligence',button:'#sl-mi-button',enabled:true},
{id:'missions',name:'Mission Rewards',icon:'🎯',cat:'SakaLuX Modules',desc:'Mission Shop values, ammo ownership and mod intelligence.',kind:'bridge',global:'SakaLuXMissionRewards',button:'#sl-mri-button',enabled:true},
{id:'elimination',name:'Elimination Assistant',icon:'☠️',cat:'SakaLuX Modules',desc:'Eliminations target scoring, FF/BS estimates and learning.',kind:'bridge',global:'SakaLuXEliminationAssistant',button:'#slx-elim-btn',enabled:false}
];

const RECOVERY_DEFAULTS={source:'personal',bio1:false,bio2:false,iv:false,factionUpgrades:0,order:'smart',noDrugs:false,respectCooldown:true};
const RECOVERY_ITEMS=[
{name:'Small First Aid Kit',healPct:5,hospMin:30,cooldown:15,drug:false},
{name:'First Aid Kit',healPct:10,hospMin:60,cooldown:30,drug:false},
{name:'Morphine',healPct:15,hospMin:120,cooldown:45,drug:false},
{name:'Blood Bag',healPct:30,hospMin:180,cooldown:60,drug:false},
{name:'Opium',healPct:50,hospMin:0,cooldown:0,drug:true}
];
const ITEM_RULES=[
{tag:'OC',note:'Organized Crime role item',names:['Lockpicks','Shaving Foam','Jemmy','Net','Dog Treats','ID Badge','ATM Key','Police Badge','DSLR Camera','RF Detector','Gasoline','Construction Helmet','PCP','Blank Casino Chips','Binoculars','Hand Drill','Billfold','Wire Cutters','Zip Ties','Polymorphic Virus','Bolt Cutters','Spray Paint','Chloroform','Dental Mirror','C4 Explosive','Flash Grenade','Wireless Dongle']},
{tag:'ENERGY',note:'Energy gain item',names:['Xanax','Feathery Hotel Coupon','FHC','Energy Drink','Can of','Taurine']},
{tag:'NERVE',note:'Nerve gain item',names:['Beer','Bottle of','Alcohol','Keg','Tequila','Absinthe']},
{tag:'HAPPY',note:'Happiness gain item',names:['Candy','Chocolate','Lollipop','Bonbons','Jawbreaker','Pixie Sticks','Birthday Cupcake','Erotic DVD']},
{tag:'HEAL',note:'Medical / health item',names:['First Aid','Morphine','Blood Bag','Medical','Opium']},
{tag:'ENH',note:'Enhancer / temporary effect',names:['Enhancer','Epinephrine','Melatonin']}
];
const COUNTRY_META={mexico:{flag:'🇲🇽',label:'Mexico'},canada:{flag:'🇨🇦',label:'Canada'},cayman:{flag:'🇰🇾',label:'Cayman Islands'},hawaii:{flag:'🇺🇸',label:'Hawaii'},uk:{flag:'🇬🇧',label:'United Kingdom'},argentina:{flag:'🇦🇷',label:'Argentina'},switzerland:{flag:'🇨🇭',label:'Switzerland'},japan:{flag:'🇯🇵',label:'Japan'},china:{flag:'🇨🇳',label:'China'},uae:{flag:'🇦🇪',label:'UAE'},'south africa':{flag:'🇿🇦',label:'South Africa'}};
const COUNTRY_ALIASES={'united kingdom':'uk',england:'uk','cayman islands':'cayman','united arab emirates':'uae',southafrica:'south africa'};
const COUNTRY=Object.fromEntries(Object.entries(COUNTRY_META).map(([k,v])=>[k,v.flag]));
const ITEM_ID_INTEL={1203:{tag:'OC',note:'Lockpicks · OC role item'},1217:{tag:'OC',note:'Shaving Foam · OC role item'},568:{tag:'OC',note:'Jemmy · OC role item'},1362:{tag:'OC',note:'Net · OC role item'},1361:{tag:'OC',note:'Dog Treats · OC role item'},1381:{tag:'OC',note:'ID Badge · OC role item'},1379:{tag:'OC',note:'ATM Key · OC role item'}};
const ITEM_ENHANCERS=new Map([
 [570,'Improves success rate for the Transporting Drugs crime in Crimes 1.0.'],[569,'Improves success rate for the Armed Robbery crime in Crimes 1.0.'],[576,'Improves success rate for the Kidnapping crime in Crimes 1.0.'],[567,'Improves Pickpocketing crime experience and skill gains by 5%.'],[578,'Improves Card Skimming crime experience and skill gains by 5%.'],[571,'Improves Scamming crime experience and skill gains by 5%.'],[574,'Improves success rate for Robbing the Pawn Shop in Crimes 1.0.'],[1351,'Improves Burglary crime experience and skill gains by 5%.'],[564,'Improves Search for Cash crime experience and skill gains by 5%.'],[577,'Improves success rate for Arms Trafficking in Crimes 1.0.'],[565,'Improves Bootlegging crime experience and skill gains by 5% and copying speed by 100%.'],[421,'Increases travel capacity by 4. Does not stack with other suitcases.'],[633,'Improves Disposal crime experience and skill gains by 5%.'],[1346,'Improves Forgery crime experience and skill gains by 5%.'],[420,'Increases travel capacity by 3. Does not stack with other suitcases.'],[1353,'Improves Hustling crime experience and skill gains by 5%.'],[566,'Improves Shoplifting crime experience and skill gains by 5%.'],[1354,'Improves Cracking crime experience and skill gains by 5%.'],[979,'Improves Graffiti crime experience and skill gains by 5%.'],[819,'Boosts the effects of praying in the church by 10%.'],[573,'Improves success rate for Grand Theft Auto in Crimes 1.0.'],[419,'Increases travel capacity by 2. Does not stack with other suitcases.'],[386,'Increases speed gains in the gym by 5%.'],[572,'Improves success rate for Assassination in Crimes 1.0.'],[575,'Improves success rate for Counterfeiting in Crimes 1.0.'],[544,'Improves Arson crime experience and skill gains by 5%.'],[579,'Improves success rate for Hacking in Crimes 1.0.'],[893,'Required in Search for Cash.'],[568,'Improves Larceny success and unlocks additional Burglary outcomes.'],[1202,'Unlocks additional outcomes for certain Burglary targets.'],[1203,'Unlocks additional outcomes for certain Burglary targets.'],[1201,'Unlocks additional outcomes for certain Burglary targets.'],[1204,'Unlocks additional outcomes for certain Burglary targets.']
]);
const ITEM_ENERGY=new Map([[985,5],[986,10],[987,15],[530,20],[553,20],[532,25],[554,25],[533,30],[555,30],[206,250],[199,50],[367,150]]);
const ITEM_NERVE=new Map([[180,'1'],[181,'1'],[294,'1'],[426,'1'],[550,'2'],[531,'2'],[816,'2'],[638,'3'],[551,'3'],[542,'3'],[552,'4'],[541,'4'],[924,'5'],[873,'5'],[984,'5'],[196,'8–12']]);
const ITEM_HEALTH=new Map([[68,'5%'],[67,'10%'],[66,'15%'],[732,'30%'],[733,'30%'],[734,'30%'],[735,'30%'],[736,'30%'],[737,'30%'],[738,'30%'],[739,'30%'],[200,'50%']]);

const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
let state=load(K.modules,{}),apiKey=localStorage.getItem(K.api)||'',recoveryCfg={...RECOVERY_DEFAULTS,...load(K.recovery,{})};
for(const m of MODULES)if(typeof state[m.id]!=='boolean')state[m.id]=m.enabled;
const REMINDER_BOOTSTRAP='SakaLuX_SUITE_REMINDER_BOOTSTRAP_V1';
if(!localStorage.getItem(REMINDER_BOOTSTRAP)){
 state['daily-prayer']=true;
 state['recovery-planner']=true;
 localStorage.setItem(REMINDER_BOOTSTRAP,'1');
}
save(K.modules,state);

function legacyApi(m){try{return m.kind==='bridge'?(window[m.global]||null):null}catch{return null}}
function ready(m){return m.kind==='internal'||!!(legacyApi(m)||document.querySelector(m.button))}
function legacyVersion(m){try{return String(legacyApi(m)?.version||legacyApi(m)?.health?.()?.version||'')}catch{return''}}
function utcDay(){return new Date().toISOString().slice(0,10)}
function prayedToday(){return localStorage.getItem(K.prayerDay)===utcDay()}
function markPrayed(){localStorage.setItem(K.prayerDay,utcDay());document.getElementById('slx-daily-prayer')?.remove();syncReminderIcons()}

function css(){
 if(document.getElementById(IDS.style))return;
 const s=document.createElement('style');s.id=IDS.style;s.textContent=`
:root{--sakalux-bg:#111318;--sakalux-bg-soft:#15181e;--sakalux-panel:#181b22;--sakalux-panel-2:#20242d;--sakalux-elevated:#252a33;--sakalux-border:#343a46;--sakalux-border-soft:#ffffff13;--sakalux-text:#f2f4f7;--sakalux-text-soft:#c8ccd4;--sakalux-muted:#969eaa;--sakalux-gold:#d8b35f;--sakalux-gold-bright:#f0cc72;--sakalux-gold-deep:#b88a35;--sakalux-green:#4fbd83;--sakalux-green-bright:#1ed786;--sakalux-red:#df5968;--sakalux-red-bright:#f25572;--sakalux-orange:#e69a4b;--sakalux-blue:#579bd5;--sakalux-blue-bright:#7bb7e6}
#${IDS.fallback}{position:fixed;right:12px;bottom:88px;z-index:2147483645;width:52px;height:52px;border-radius:50%;border:1px solid #b78b34;background:#171717;color:#e2b34b;font-size:24px;font-weight:900;box-shadow:0 5px 20px #0009}
#${IDS.native}{cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}#${IDS.native} .slxs-skull{display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1;color:#e2b34b!important;min-width:28px;min-height:28px}
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:#000b;display:none;align-items:flex-end;justify-content:center;padding-top:max(8px,env(safe-area-inset-top));font-family:Arial,sans-serif}#${IDS.overlay}.slxs-visible{display:flex}
.slxs-panel{width:min(760px,100%);height:min(92dvh,820px);display:flex;flex-direction:column;overflow:hidden;background:#111318;color:#f3f4f6;border:1px solid #7c6233;border-radius:18px 18px 0 0;box-shadow:0 -12px 45px #000c}
.slxs-head{padding:13px 15px;border-bottom:1px solid #30333a;flex:none;background:#15181e}.slxs-row{display:flex;gap:10px;align-items:flex-start}.slxs-grow{flex:1;min-width:0}.slxs-kicker{font-size:9px;letter-spacing:2px;color:#e8bf67;font-weight:900}.slxs-title{font-size:19px;font-weight:900;margin-top:4px}.slxs-sub{font-size:10px;color:#9ca3af;margin-top:3px;line-height:1.35}.slxs-close{width:36px;height:36px;flex:0 0 auto;border:1px solid #3b414c;border-radius:10px;background:#252933;color:#fff;font-size:21px}
.slxs-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1;min-height:0;scrollbar-gutter:stable}.slxs-tools{padding:10px 12px;border-bottom:1px solid #2d3139;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;background:#12151a}.slxs-tool{min-width:0;border:1px solid #3a414d;background:#20242d;color:#dfe3e8;border-radius:8px;padding:8px 5px;font-size:9px;font-weight:700}.slxs-api{margin:10px 12px;padding:11px 12px;border:1px solid #5f5131;border-radius:11px;background:#17191f}.slxs-api h4,.slxs-cat h4{margin:0;color:#e8bf67;font-size:9px;letter-spacing:1.5px}.slxs-note{font-size:9px;color:#8e949f;margin-top:4px;line-height:1.35}.slxs-apirow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;margin-top:8px}.slxs-api input{min-width:0;background:#101218;color:#fff;border:1px solid #353b46;border-radius:8px;padding:9px}.slxs-api button{border:0;border-radius:8px;background:#d5a63e;color:#17120a;font-weight:900;padding:0 13px}
.slxs-body{padding:0 12px 14px}.slxs-cat{margin-top:10px;border:1px solid #2d3139;border-radius:11px;overflow:hidden;background:#15181e}.slxs-cat h4{padding:9px 11px;border-bottom:1px solid #2d3139;background:#181b21}.slxs-mod{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 11px;border-bottom:1px solid #282c33}.slxs-mod:last-child{border-bottom:0}.slxs-name{font-size:13px;font-weight:700}.slxs-meta{font-size:10px;color:#9298a3;line-height:1.35;margin-top:3px}.slxs-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.slxs-badge{font-size:8px;font-weight:700;border:1px solid #3e4653;border-radius:999px;padding:2px 6px}.ready{border-color:#2d7654!important;color:#8ee5b4}.off{border-color:#4b515c!important;color:#9aa1ac}.bridge{border-color:#75622e!important;color:#e8bf67}.internal{border-color:#376b96!important;color:#8acbff}.slxs-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;max-width:155px}.slxs-toggle{position:relative;width:46px;height:25px;flex:0 0 46px;margin:0;padding:0;border:1px solid #404652;border-radius:999px;background:#292d35;cursor:pointer;appearance:none;box-shadow:none;transition:border-color .18s ease,background-color .18s ease}.slxs-toggle::after{content:"";position:absolute;top:3px;left:3px;width:17px;height:17px;border-radius:50%;background:#8c939e;transition:left .18s ease,background-color .18s ease}.slxs-toggle[aria-checked="true"]{border-color:#d8b35fb8;background:#d8b35f36}.slxs-toggle[aria-checked="true"]::after{left:24px;background:#f0cc72}.slxs-toggle:focus-visible{outline:2px solid #d8b35f66;outline-offset:2px}.slxs-open,.slxs-settings{height:27px;border:1px solid #3a414d;background:#242a34;color:#cdd2d9;border-radius:7px;padding:0 8px;font-size:8px;font-weight:700}.slxs-open:disabled,.slxs-settings:disabled{opacity:.35}.slxs-foot{padding:9px 13px calc(9px + env(safe-area-inset-bottom));border-top:1px solid #2d3139;background:#0e1014;color:#7f8590;font-size:9px;display:flex;justify-content:space-between;flex:none}
#${IDS.dock}{display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:1px!important;z-index:2147483644;order:2147483647!important;flex:0 0 auto!important;width:auto!important;height:22px!important;min-height:22px!important;margin:0 1px!important;padding:0!important}.slx-rem-btn{all:unset!important;box-sizing:border-box!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;max-width:22px!important;max-height:22px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;cursor:pointer!important;flex:0 0 22px!important;-webkit-tap-highlight-color:transparent!important}.slx-rem-glyph{box-sizing:border-box!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;max-width:18px!important;max-height:18px!important;border-radius:50%!important;border:1px solid #4d5c68!important;background:radial-gradient(circle at 38% 32%,#33414c 0,#26323b 58%,#1c252c 100%)!important;color:#e2e9ee!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:10px!important;font-weight:700!important;line-height:18px!important;font-family:Arial,sans-serif!important;box-shadow:inset 0 1px 1px #ffffff14,0 1px 2px #0008!important;overflow:hidden!important}.slx-rem-btn:active .slx-rem-glyph{transform:scale(.9)!important;opacity:.82!important}.slx-rem-fallback{position:fixed;right:10px;top:180px;display:flex;flex-direction:row;gap:3px;z-index:2147483643}

.slx-recovery-card{position:fixed;z-index:2147483646;left:50%;top:50%;transform:translate(-50%,-50%);width:min(650px,calc(100vw - 24px));max-height:88vh;overflow:auto;background:#11151b;color:#edf2f7;border:1px solid #3e4b5b;border-radius:16px;box-shadow:0 16px 50px #000c;font-family:Arial,sans-serif}.slx-recovery-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #2f3946}.slx-recovery-head strong{flex:1;font-size:17px}.slx-recovery-sub{font-size:10px;color:#8d98a6;margin-top:2px}.slx-recovery-body{padding:14px}.slx-recovery-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.slx-recovery-stat{background:#171c24;border:1px solid #344050;border-radius:11px;padding:10px}.slx-recovery-label{font-size:9px;letter-spacing:1.2px;color:#8e99a7}.slx-recovery-value{font-size:17px;margin-top:4px;color:#8ee5b4}.slx-recovery-source{margin-top:10px;border:1px solid #344050;border-radius:10px;padding:10px;background:#151a21;font-size:12px}.slx-recovery-source b{color:#e8bf67}.slx-recovery-scan{width:100%;margin-top:10px;padding:11px;border:1px solid #5b5137;border-radius:10px;background:linear-gradient(#302d25,#201e1a);color:#fff;font-size:14px;font-weight:800}.slx-recovery-section{margin-top:14px;padding-top:12px;border-top:1px solid #303946}.slx-recovery-section-title{font-size:9px;letter-spacing:1.4px;color:#8d98a6;margin-bottom:8px}.slx-recovery-rec{border-left:3px solid #4cc38a;background:#171c24;border-radius:9px;padding:11px 12px;font-size:13px;line-height:1.45}.slx-recovery-list{margin-top:9px;font-size:10px;color:#aab3bf;line-height:1.5}.slx-recovery-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.slx-recovery-actions button{border:1px solid #3c4653;background:#242a34;color:#fff;border-radius:8px;padding:8px 11px;font-size:10px;font-weight:800}@media(max-width:430px){.slx-recovery-card{width:calc(100vw - 14px);max-height:84vh}.slx-recovery-stats{gap:5px}.slx-recovery-stat{padding:8px}.slx-recovery-value{font-size:14px}}
.slx-suite-float{position:fixed;z-index:2147483642;right:10px;top:220px;width:min(350px,calc(100vw - 20px));background:#15181e;border:1px solid #4a5260;border-radius:12px;color:#eee;box-shadow:0 8px 25px #0009;font-family:Arial,sans-serif}.slx-float-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #343b46}.slx-float-head strong{flex:1}.slx-float-body{padding:10px 12px;font-size:11px;line-height:1.5}
.slxs-modal{position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}.slxs-modal-card{width:min(650px,100%);max-height:88vh;overflow:auto;background:#15181e;color:#eee;border:1px solid #4a5260;border-radius:18px 18px 0 0}.slxs-modal-head{position:sticky;top:0;background:#171b22;border-bottom:1px solid #343b46;padding:14px 16px;display:flex;align-items:center;gap:10px}.slxs-modal-head strong{flex:1}.slxs-modal-body{padding:14px}.slxs-box{border:1px solid #3b434f;border-radius:13px;padding:13px;margin-bottom:12px;background:#12151a}.slxs-box-title{color:#e8bf67;font-size:10px;letter-spacing:1.5px;font-weight:900;margin-bottom:10px}.slxs-choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.slxs-choice{border:1px solid #4b5564;background:#22262f;color:#adb4c0;border-radius:10px;padding:10px}.slxs-choice.active{border-color:#76643d;background:#302b20;color:#e8c86e}.slxs-setting-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #343b46}.slxs-switch{width:48px;height:27px;border-radius:999px;border:1px solid #48505d;background:#232934;padding:3px}.slxs-switch i{display:block;width:19px;height:19px;border-radius:50%;background:#8a94a3}.slxs-switch.on{background:#173e2d;border-color:#2b7653}.slxs-switch.on i{transform:translateX(19px);background:#9be8bc}.slxs-save-wide{width:100%;padding:12px;border-radius:10px;border:1px solid #5a513a;background:#2b2923;color:#fff;font-weight:900}
.slx-item-signal-host{position:relative!important}.slx-item-signals{position:absolute;left:4px;bottom:3px;z-index:20;display:flex;gap:2px;pointer-events:auto}.slx-item-signals.slx-item-signals-right{left:auto;right:4px}.slx-item-signal{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:15px;height:15px;padding:0 3px;border:1px solid #ffffff38;border-radius:4px;color:#f5f7fa;font:700 8px/1 Arial,sans-serif;box-shadow:0 1px 4px #000b;cursor:pointer;-webkit-tap-highlight-color:transparent}.slx-item-signal.oc{background:linear-gradient(#63a9dc,#2e6f9e)}.slx-item-signal.enh{background:linear-gradient(#d2ae57,#8b6925)}.slx-item-signal.crime{background:linear-gradient(#ef6a7a,#a62f48)}.slx-item-signal.energy{background:linear-gradient(#63a9dc,#2e6f9e);border-radius:50%;min-width:15px;padding:0}.slx-item-signal.nerve{background:linear-gradient(#e36074,#9d2e46);border-radius:50%;min-width:15px;padding:0}.slx-item-signal.happy{background:linear-gradient(#e5c258,#9f7723);border-radius:50%;min-width:15px;padding:0;color:#17120a}.slx-item-signal.heal{background:linear-gradient(#54c58b,#23744b);border-radius:50%;min-width:15px;padding:0}.slx-item-tip{position:fixed;z-index:2147483647;width:max-content;max-width:calc(100vw - 20px);padding:10px 13px;border:1px solid #8d7948;border-radius:10px;background:radial-gradient(circle at 90% 0,#d8b35f1f,transparent 35%),linear-gradient(180deg,#1d2025,#15171b);color:#f0f2f4;font:400 12px/1.35 Arial,sans-serif;box-shadow:0 10px 30px #000c,inset 0 1px #ffffff0d;pointer-events:none}.slx-item-tip-title{display:block;color:#e9c866;font-size:12px;margin-bottom:4px}.slx-item-tip-line{display:block;color:#f0f2f4}.slx-item-tip-gap{height:5px}
.slx-inline-panel{margin:10px 0;padding:12px;border:1px solid #4a5260;border-radius:12px;background:#15181e;color:#eee;font-family:Arial,sans-serif}.slx-inline-top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.slx-inline-top input{flex:1;min-width:140px;background:#101218;color:#fff;border:1px solid #3c4450;border-radius:8px;padding:8px}.slx-stat{font-size:10px;color:#9ea6b2;margin-top:7px}.slx-badge-mini{display:inline-block;padding:2px 5px;border-radius:999px;border:1px solid #4b5564;font-size:8px;font-weight:900;margin:2px}
#slx-event-lens{--el-bg:#13171b;--el-panel:#171b20;--el-border:#2d333b;--el-gold:#e0bd62;--el-blue:#57a5df;--el-green:#67c65c;--el-red:#e96773;--el-muted:#969da5;margin:8px 0 14px;padding:0;border:1px solid #2b3340;border-radius:11px;background:linear-gradient(180deg,#171b21,#11151a);color:#eef1f3;overflow:hidden;font-family:Arial,sans-serif;box-shadow:0 5px 18px #0006}#slx-event-lens *{box-sizing:border-box}.slx-el-filters{display:flex;gap:8px;padding:9px;overflow-x:auto;scrollbar-width:none;background:#141923;border-bottom:1px solid #29313b;-webkit-overflow-scrolling:touch}.slx-el-filters::-webkit-scrollbar{display:none}.slx-el-chip{flex:0 0 auto;display:flex;align-items:center;gap:7px;min-height:36px;padding:6px 10px;border:1px solid #35404c;border-radius:11px;background:#171d25;color:#cbd1d6;font-size:11px;white-space:nowrap}.slx-el-chip.is-active{border-color:#a98b49;background:linear-gradient(90deg,#493e26,#24241f);color:#f4e7bd;box-shadow:inset 3px 0 var(--el-gold),0 0 0 1px #d8b35f26}.slx-el-glyph{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid currentColor;border-radius:50%;font-size:11px}.slx-el-count{padding:3px 6px;border:1px solid #49515b;border-radius:6px;background:#ffffff09;color:#d8dde1;font-size:10px}.slx-el-controls{padding:9px}.slx-el-search{display:flex;align-items:center;gap:7px;height:42px;padding:0 11px;border:1px solid #303844;border-radius:9px;background:#121720}.slx-el-search span{opacity:.65}.slx-el-search input{flex:1;min-width:0;border:0;outline:0;background:transparent;color:#eef1f3;font-size:12px}.slx-el-search input::placeholder{color:#747c86}.slx-el-clear{border:0;background:transparent;color:#89919a;font-size:18px}.slx-el-actions{display:grid;grid-template-columns:1fr 2.6fr 1fr;gap:7px;margin-top:7px}.slx-el-actions button,.slx-el-meter{height:37px;border:1px solid #30353c;border-radius:9px;background:linear-gradient(#202328,#15171a);color:#cbd0d4;font-size:10px}.slx-el-meter{display:flex;align-items:center;justify-content:center;color:#858c94}.slx-el-list{border-top:1px solid #242b32}.slx-el-day{border-bottom:1px solid #242b32}.slx-el-day-head{display:flex;align-items:center;min-height:39px;padding:0 11px;border-left:3px solid var(--el-gold);background:#171a1e;color:var(--el-gold);font-size:10px;font-weight:700}.slx-el-day-head strong{flex:1}.slx-el-day-count{margin-right:8px;padding:4px 9px;border:1px solid #685d3d;border-radius:999px;background:#d8b35f12;color:#e3c66f;font-weight:400}.slx-el-collapse{width:28px;height:28px;border:1px solid #313b48;border-radius:50%;background:#19202a;color:#c8ced5}.slx-el-card{position:relative;display:grid;grid-template-columns:34px minmax(0,1fr) 65px;gap:8px;min-height:67px;padding:8px 8px 8px 9px;border-top:1px solid #293038;border-left:4px solid var(--tone,var(--el-muted));background:linear-gradient(90deg,color-mix(in srgb,var(--tone,var(--el-muted)) 9%,#151a1e),#151a1e 33%)}.slx-el-icon{display:flex;align-items:center;justify-content:center;width:29px;height:29px;margin-top:1px;border:1px solid var(--tone,var(--el-muted));border-radius:50%;color:var(--tone,var(--el-muted));background:color-mix(in srgb,var(--tone,var(--el-muted)) 10%,transparent);font-size:13px}.slx-el-body{min-width:0}.slx-el-title{display:block;overflow:hidden;color:var(--tone,var(--el-blue));font-size:12px;line-height:1.3;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.slx-el-title:hover{text-decoration:underline}.slx-el-detail{color:#9ba2aa;font-size:10px;line-height:1.25}.slx-el-amount{color:var(--el-green);font-size:11px;line-height:1.35}.slx-el-time{text-align:right;color:#e2e5e7;font-size:10px;line-height:1.2}.slx-el-date{color:#8e959c}.slx-el-star{position:absolute;right:4px;bottom:3px;border:0;background:transparent;color:#626b74;font-size:13px}.slx-el-star.is-saved{color:var(--el-gold)}.slx-el-empty{padding:28px 12px;text-align:center;color:#848c94;font-size:11px}.slx-event-native-row-hidden{display:none!important}@media(max-width:430px){.slx-item-signal{min-width:12px;height:12px;padding:0 2px;font-size:6px}.slx-item-signal.energy,.slx-item-signal.nerve,.slx-item-signal.happy,.slx-item-signal.heal{min-width:12px}.slx-item-tip{font-size:11px}.slx-el-card{grid-template-columns:31px minmax(0,1fr) 62px;gap:6px}.slx-el-filters{gap:6px}.slx-el-chip{padding:5px 8px}}
.slx-war-wide{position:fixed!important;inset:8px!important;z-index:2147483646!important;overflow:auto!important;margin:0!important}.slx-armory-loaned{outline:1px solid #b44!important}.slx-armory-available{outline:1px solid #285!important}
.slx-item-tip{position:fixed;z-index:2147483647;max-width:min(340px,calc(100vw - 24px));background:#0f141c;color:#eef4ff;border:1px solid #4b6685;border-radius:10px;padding:10px 12px;box-shadow:0 10px 30px #000b;font-size:11px;line-height:1.45;pointer-events:auto}.slx-item-tip b{color:#8acbff}.slx-travel-grid,.slx-company-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-top:8px}.slx-mini-card{border:1px solid #374353;border-radius:8px;background:#111821;padding:7px}.slx-mini-card b{display:block;color:#eef4ff}.slx-risk-good{color:#8ee5b4}.slx-risk-mid{color:#e8bf67}.slx-risk-bad{color:#ff9bb3}
@media(max-width:560px){.slxs-panel{height:calc(100dvh - max(8px,env(safe-area-inset-top)))}.slxs-tools{grid-template-columns:repeat(3,minmax(0,1fr))}.slxs-mod{padding:10px}.slxs-meta{font-size:9px}.slxs-actions{max-width:105px}.slxs-open,.slxs-settings{width:100%}.slxs-api{margin:8px 10px}.slxs-body{padding:0 10px 12px}}
@media(min-width:700px){#${IDS.overlay}{align-items:center;padding:16px}.slxs-panel{border-radius:18px;height:min(88vh,820px)}.slxs-modal{align-items:center}.slxs-modal-card{border-radius:18px}}
`;document.head.appendChild(s)
}

function close(){document.getElementById(IDS.overlay)?.classList.remove('slxs-visible')}
function card(m){
 const on=!!state[m.id],r=ready(m),v=legacyVersion(m);
 return `<div class="slxs-mod" data-module-row="${m.id}"><div><div class="slxs-name">${m.icon} ${esc(m.name)}</div><div class="slxs-meta">${esc(m.desc)}</div><div class="slxs-badges"><span class="slxs-badge ${on?(r?'ready':'bridge'):'off'}" data-module-status>${on?(r?'READY':'WAITING'):'OFF'}</span><span class="slxs-badge ${m.kind==='internal'?'internal':'bridge'}">${m.kind==='internal'?'INTERNAL':'BRIDGE'}</span>${m.kind==='bridge'&&v?`<span class="slxs-badge ready">LEGACY v${esc(v)}</span>`:''}</div></div><div class="slxs-actions"><button class="slxs-toggle" type="button" role="switch" aria-label="${esc(m.name)}" aria-checked="${on?'true':'false'}" data-toggle="${m.id}" title="${on?'Disable':'Enable'} ${esc(m.name)}"></button>${m.settings?`<button class="slxs-settings" data-settings="${m.id}" ${on?'':'disabled'}>SETTINGS</button>`:''}${m.kind==='bridge'?`<button class="slxs-open" data-open="${m.id}" ${on&&r?'':'disabled'}>OPEN</button>`:''}</div></div>`;
}
function refreshPanelControls(){
 const o=document.getElementById(IDS.overlay);if(!o)return;
 for(const m of MODULES){const row=o.querySelector(`[data-module-row="${m.id}"]`);if(!row)continue;const on=!!state[m.id],r=ready(m),toggle=row.querySelector('[data-toggle]'),status=row.querySelector('[data-module-status]');if(toggle){toggle.setAttribute('aria-checked',on?'true':'false');toggle.title=`${on?'Disable':'Enable'} ${m.name}`}if(status){status.className=`slxs-badge ${on?(r?'ready':'bridge'):'off'}`;status.textContent=on?(r?'READY':'WAITING'):'OFF'}const settings=row.querySelector('[data-settings]');if(settings)settings.disabled=!on;const launch=row.querySelector('[data-open]');if(launch)launch.disabled=!(on&&r)}
}
function open(){
 let o=document.getElementById(IDS.overlay);if(o){refreshPanelControls();o.classList.add('slxs-visible');return}o=document.createElement('div');o.id=IDS.overlay;const cats=[...new Set(MODULES.map(m=>m.cat))];
 o.innerHTML=`<div class="slxs-panel"><div class="slxs-head"><div class="slxs-row"><div class="slxs-grow"><div class="slxs-kicker">MASTER CONTROL • EXPERIMENTAL</div><div class="slxs-title">☠ SakaLuX Suite</div><div class="slxs-sub">One installation target. Enable only the modules you use.</div></div><button class="slxs-close" id="slxs-close">×</button></div></div><div class="slxs-scroll"><div class="slxs-tools"><button class="slxs-tool" id="slxs-enable">ENABLE READY</button><button class="slxs-tool" id="slxs-disable">DISABLE ALL</button><button class="slxs-tool" id="slxs-export">EXPORT SETTINGS</button><button class="slxs-tool" id="slxs-import">IMPORT SETTINGS</button><button class="slxs-tool" id="slxs-diag">DIAGNOSTICS</button></div><div class="slxs-api"><h4>SHARED TORN API KEY</h4><div class="slxs-note">Stored only in this browser and excluded from exported Suite settings.</div><div class="slxs-apirow"><input id="slxs-key" type="password" autocomplete="off" placeholder="Enter your Torn API key" value="${esc(apiKey)}"><button id="slxs-save">SAVE KEY</button></div></div><div class="slxs-body">${cats.map(c=>`<div class="slxs-cat"><h4>${esc(c.toUpperCase())}</h4>${MODULES.filter(m=>m.cat===c).map(card).join('')}</div>`).join('')}</div></div><div class="slxs-foot"><span>Active build: v${VERSION}</span><span>SAKALUX MODULAR SUITE</span></div></div>`;
 document.body.appendChild(o);o.classList.add('slxs-visible');o.onclick=e=>{if(e.target===o)close()};
 document.getElementById('slxs-close').onclick=close;
 document.getElementById('slxs-save').onclick=()=>{apiKey=document.getElementById('slxs-key').value.trim();localStorage.setItem(K.api,apiKey);document.getElementById('slxs-save').textContent='SAVED ✓'};
 document.getElementById('slxs-enable').onclick=()=>{for(const m of MODULES)if(ready(m))state[m.id]=true;save(K.modules,state);refreshPanelControls();applyModules()};
 document.getElementById('slxs-disable').onclick=()=>{for(const m of MODULES)state[m.id]=false;save(K.modules,state);refreshPanelControls();applyModules()};
 document.getElementById('slxs-export').onclick=()=>prompt('Copy Suite settings:',JSON.stringify({app:'SakaLuX Suite',version:VERSION,modules:state,recovery:recoveryCfg,chain:load(SLX_KEYS.chain,CHAIN_DEFAULTS),item:load(SLX_KEYS.item,ITEM_CFG_DEFAULTS),events:load(SLX_KEYS.events,EVENT_CFG_DEFAULTS),odds:load(SLX_KEYS.odds,ODDS_CFG_DEFAULTS),pulse:load(SLX_KEYS.pulse,PULSE_CFG_DEFAULTS),oc:load(SLX_KEYS.ocCfg,OC_CFG_DEFAULTS)}));
 document.getElementById('slxs-diag').onclick=()=>openDiagnostics();
 document.getElementById('slxs-import').onclick=()=>{const raw=prompt('Paste Suite settings:');if(!raw)return;try{const d=JSON.parse(raw);if(d.app!=='SakaLuX Suite')throw 0;for(const m of MODULES)if(typeof d.modules?.[m.id]==='boolean')state[m.id]=d.modules[m.id];if(d.recovery)recoveryCfg={...RECOVERY_DEFAULTS,...d.recovery};if(d.chain)save(SLX_KEYS.chain,d.chain);if(d.item)save(SLX_KEYS.item,d.item);if(d.events)save(SLX_KEYS.events,d.events);if(d.odds)save(SLX_KEYS.odds,d.odds);if(d.pulse)save(SLX_KEYS.pulse,d.pulse);if(d.oc)save(SLX_KEYS.ocCfg,d.oc);save(K.modules,state);save(K.recovery,recoveryCfg);refreshPanelControls();applyModules()}catch{alert('Invalid Suite backup.')}};
 o.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{state[b.dataset.toggle]=!state[b.dataset.toggle];save(K.modules,state);refreshPanelControls();applyModules()});
 o.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openBridge(b.dataset.open));
 o.querySelectorAll('[data-settings]').forEach(b=>b.onclick=()=>openModuleSettings(b.dataset.settings));
}
function openBridge(id){const m=MODULES.find(x=>x.id===id);if(!m||!state[id])return;try{const a=legacyApi(m);if(typeof a?.open==='function'){close();a.open();return}}catch{}const b=document.querySelector(m.button);if(b){close();b.click()}}

function fallback(){let b=document.getElementById(IDS.fallback);if(!b){b=document.createElement('button');b.id=IDS.fallback;b.textContent='☠';b.title='SakaLuX Suite';b.onclick=open;document.body.appendChild(b)}syncLaunchers()}
function moneyTarget(){const all=[...document.querySelectorAll('a,button,[role="button"]')];return all.find(el=>{if(el.id===IDS.native||el.closest('#'+IDS.overlay))return false;const t=`${el.getAttribute('aria-label')||''} ${el.getAttribute('title')||''} ${el.textContent||''}`.toLowerCase();const h=String(el.getAttribute('href')||'').toLowerCase();return /\b(money|cash|wallet|bank)\b/.test(t)||/(money|wallet|bank)/.test(h)})||null}
function nativeLauncher(){if(document.getElementById(IDS.native)){syncLaunchers();return true}const target=moneyTarget();if(!target?.parentElement)return false;const n=target.cloneNode(false);n.id=IDS.native;n.removeAttribute('href');n.removeAttribute('target');n.setAttribute('role','button');n.setAttribute('aria-label','Open SakaLuX Suite');n.setAttribute('title','SakaLuX Suite');n.innerHTML='<span class="slxs-skull">☠</span>';n.onclick=e=>{e.preventDefault();e.stopPropagation();open()};target.parentElement.insertBefore(n,target);syncLaunchers();return true}
function syncLaunchers(){const b=document.getElementById(IDS.fallback);if(b)b.style.display=document.getElementById(IDS.native)?'none':'block'}

function settingsTarget(){const all=[...document.querySelectorAll('a,button,[role="button"]')];return all.find(el=>{if(el.closest('#'+IDS.overlay)||el.closest('.slxs-modal'))return false;const t=`${el.getAttribute('aria-label')||''} ${el.getAttribute('title')||''} ${el.textContent||''}`.toLowerCase();return /\b(settings?|preferences?)\b/.test(t)||t.trim()==='⚙'||t.trim()==='⚙️'})||null}
function resourceRowTarget(){
 const money=moneyTarget();
 if(!money)return null;
 let el=money.parentElement,best=null;
 for(let i=0;el&&i<6;i++,el=el.parentElement){
  const r=el.getBoundingClientRect?.();
  const controls=el.querySelectorAll?.('a,button,[role="button"]')?.length||0;
  const kids=el.children?.length||0;
  if(r&&r.width>=Math.min(innerWidth*0.72,500)&&kids>=5)best=el;
  if(r&&r.width>=innerWidth*0.92&&controls>=5){best=el;break}
 }
 return best||money.parentElement?.parentElement||money.parentElement||null
}
function ensureDock(){
 let d=document.getElementById(IDS.dock);
 if(!d){d=document.createElement('div');d.id=IDS.dock}
 const row=resourceRowTarget();
 if(row){
  if(d.parentElement!==row||row.lastElementChild!==d)row.appendChild(d);
  d.className='';
  d.style.cssText='display:inline-flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:1px!important;position:static!important;inset:auto!important;margin-left:auto!important;margin-right:2px!important;padding:0!important;width:auto!important;height:22px!important;min-height:22px!important;z-index:auto!important;vertical-align:middle!important;flex:0 0 auto!important;order:2147483647!important;';
  return d
 }
 if(!d.isConnected)document.body.appendChild(d);
 d.className='slx-rem-fallback';
 d.style.cssText='position:fixed!important;right:8px!important;top:150px!important;display:flex!important;flex-direction:row!important;align-items:center!important;gap:4px!important;z-index:2147483644!important;';
 return d
}
function iconButton(id,text,title,fn){
 const b=document.createElement('button');
 b.type='button';b.id=id;b.className='slx-rem-btn';b.title=title;b.setAttribute('aria-label',title);
 const g=document.createElement('span');g.className='slx-rem-glyph';g.textContent=text;b.appendChild(g);
 b.onclick=e=>{e.preventDefault();e.stopPropagation();fn()};
 return b
}
function syncReminderIcons(){
 const d=ensureDock();
 const defs=[
  ['slx-daily-prayer','daily-prayer','🙏','Daily Prayer Bell',()=>{location.href='https://www.torn.com/church.php'},!prayedToday()],
  ['slx-recovery-planner','recovery-planner','✚','Recovery Planner',openRecoveryPanel,true],
  ['slx-chain-alarm-icon','chain-alarm','⛓️','Chain Alarm',()=>{const p=document.getElementById('slx-chain-alarm-panel');if(p)p.remove();else chainAlarm(true)},true]
 ];
 for(const [id,mid,ico,title,fn,extra] of defs){let b=document.getElementById(id);const need=state[mid]&&extra;if(need&&!b)d.appendChild(iconButton(id,ico,title,fn));else if(!need)b?.remove()}
}

const SLX_KEYS={chain:'SakaLuX_SUITE_CHAIN_CFG_V3',item:'SakaLuX_SUITE_ITEM_CFG_V3',events:'SakaLuX_SUITE_EVENT_CFG_V3',armory:'SakaLuX_SUITE_ARMORY_SCAN_V3',travel:'SakaLuX_SUITE_TRAVEL_OVERRIDES_V3',ocReq:'SakaLuX_SUITE_OC_REQUIREMENTS_V3',ocCfg:'SakaLuX_SUITE_OC_CFG_V3',war:'SakaLuX_SUITE_WAR_LEDGER_V3',company:'SakaLuX_SUITE_COMPANY_V3',race2:'SakaLuX_SUITE_RACE_LEAGUE_V3',odds:'SakaLuX_SUITE_ODDS_CFG_V3',pulse:'SakaLuX_SUITE_PULSE_CFG_V3'};
const CHAIN_DEFAULTS={warn:120,critical:60,flash:true,dim:true,pos:null,size:null};
const ITEM_CFG_DEFAULTS={oc:true,energy:true,nerve:true,happy:true,heal:true,enh:true};
const EVENT_CFG_DEFAULTS={savedOnly:false};
const ODDS_CFG_DEFAULTS={collapsed:false,research:true};
const PULSE_CFG_DEFAULTS={sort:'status',compact:false};
const OC_CFG_DEFAULTS={threshold:65,scope:'self'};

function visibleLife(){const text=document.body.innerText||'';for(const re of [/life[^0-9]{0,25}(\d[\d,]*)\s*\/\s*(\d[\d,]*)/i,/(\d[\d,]*)\s*\/\s*(\d[\d,]*)\s*(?:life|hp)/i]){const m=text.match(re);if(m){const cur=Number(m[1].replace(/,/g,'')),max=Number(m[2].replace(/,/g,''));if(max>0&&cur>=0&&cur<=max)return{cur,max}}}return null}
function hospitalMinutes(){const text=document.body.innerText||'';const h=text.match(/hospital[^0-9]{0,40}(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?/i);return h?(Number(h[1]||0)*60)+Number(h[2]||0):0}
function recoveryBonus(){return(recoveryCfg.bio1?10:0)+(recoveryCfg.bio2?10:0)+(recoveryCfg.iv?10:0)+(Number(recoveryCfg.factionUpgrades)||0)*5}
function inventoryQty(name){const n=name.toLowerCase();if(recoveryCfg.source==='faction'){const snap=load(SLX_KEYS.armory,{rows:[]});const hits=(snap.rows||[]).filter(x=>(x.item||x.t||'').toLowerCase().includes(n));if(hits.length)return hits.length}for(const e of document.querySelectorAll('li,tr,[class*="item"],[data-item],[data-itemid],[data-item-id]')){const t=(e.innerText||'').toLowerCase();if(!t.includes(n))continue;const q=(e.innerText||'').match(/(?:x|qty\s*:?|quantity\s*:?)[ ]*(\d[\d,]*)/i);if(q)return Number(q[1].replace(/,/g,''));return 1}return null}
function medicalCooldownMinutes(){const t=document.body.innerText||'';const m=t.match(/medical cooldown[^0-9]{0,25}(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i);return m?(+m[1]||0)*60+(+m[2]||0):0}
function recoveryData(){const hp=visibleLife(),hosp=hospitalMinutes(),medCd=medicalCooldownMinutes(),bonus=recoveryBonus(),missing=hp?Math.max(0,hp.max-hp.cur):0;let items=RECOVERY_ITEMS.filter(x=>!(recoveryCfg.noDrugs&&x.drug)).map(x=>{const pct=x.healPct*(1+bonus/100),heal=hp?Math.max(1,Math.round(hp.max*pct/100)):0,need=hp&&missing>0?Math.max(1,Math.ceil(missing/heal)):0,qty=inventoryQty(x.name),usable=qty===null?need:Math.min(need,qty),restored=heal*usable,waste=hp?Math.max(0,restored-missing):0,eff=heal/Math.max(1,x.cooldown||1);return{...x,healPct:pct,heal,count:need,qty,usable,restored,waste,eff}});const score=x=>recoveryCfg.order==='exit'?x.hospMin:recoveryCfg.order==='full'?x.restored:recoveryCfg.order==='waste'?-x.waste:recoveryCfg.order==='cooldown'?x.eff:recoveryCfg.order==='strongest'?x.healPct:(x.healPct*3)+(x.hospMin/20)+(x.eff/5)-(x.waste/Math.max(1,hp?.max||1))*15;items.sort((a,b)=>score(b)-score(a));const blocked=!!(recoveryCfg.respectCooldown&&medCd>0);return{hp,hosp,medCd,bonus,missing,blocked,items}}
function openRecoveryPanel(){
document.getElementById('slx-recovery-panel')?.remove();
const d=recoveryData(),usable=d.items.filter(x=>x.qty===null||x.qty>0),best=usable[0]||d.items[0];
const hpText=d.hp?`${d.hp.cur.toLocaleString()}/${d.hp.max.toLocaleString()}`:'Not detected';
const hospText=d.hosp>0?`${Math.round(d.hosp)} min`:'Free ✓';
const bonusText=d.bonus>0?`+${d.bonus}%`:'None';
let recommendation='No recommendation available.';
if(d.hp&&d.missing<=0&&d.hosp<=0)recommendation='✅ Full health and not in hospital — no recovery item is needed.';
else if(d.blocked)recommendation=`⏳ Medical cooldown active — ${Math.round(d.medCd)} min remaining.`;
else if(best)recommendation=`Suggested: ${best.name}${d.hp?` × ${Math.max(1,best.usable||best.count)}`:''}${best.qty!==null?` · owned ${best.qty}`:''}.`;
const p=document.createElement('div');p.id='slx-recovery-panel';p.className='slx-recovery-card';
p.innerHTML=`<div class="slx-recovery-head"><div style="font-size:20px">✚</div><div><strong>SakaLuX Recovery Planner</strong><div class="slx-recovery-sub">Health and hospital recovery assistant</div></div><button class="slxs-close" id="slx-recovery-close">×</button></div><div class="slx-recovery-body"><div class="slx-recovery-stats"><div class="slx-recovery-stat"><div class="slx-recovery-label">HP</div><div class="slx-recovery-value">${esc(hpText)}</div></div><div class="slx-recovery-stat"><div class="slx-recovery-label">HOSPITAL</div><div class="slx-recovery-value">${esc(hospText)}</div></div><div class="slx-recovery-stat"><div class="slx-recovery-label">BONUS</div><div class="slx-recovery-value">${esc(bonusText)}</div></div></div><div class="slx-recovery-source">📦 Items from: <b>${recoveryCfg.source==='faction'?'Faction Armory':'Personal Items'}</b>${d.medCd>0?` · medical cooldown ${Math.round(d.medCd)} min`:''}</div><button class="slx-recovery-scan" id="slx-recovery-scan">↻ Scan Again</button><div class="slx-recovery-section"><div class="slx-recovery-section-title">RECOMMENDATION</div><div class="slx-recovery-rec">${esc(recommendation)}</div>${d.items.length?`<div class="slx-recovery-list">${d.items.slice(0,5).map(x=>`${esc(x.name)} — ${x.healPct.toFixed(1)}%${d.hp?` · ${x.count} needed · est. restore ${x.restored.toLocaleString()} · waste ${x.waste.toLocaleString()}`:''}${x.qty!==null?` · owned ${x.qty}`:''}`).join('<br>')}</div>`:''}</div><div class="slx-recovery-actions"><button id="slx-recovery-settings-open">SETTINGS</button></div></div>`;
document.body.appendChild(p);
document.getElementById('slx-recovery-close').onclick=()=>p.remove();
document.getElementById('slx-recovery-scan').onclick=()=>{p.remove();openRecoveryPanel()};
document.getElementById('slx-recovery-settings-open').onclick=()=>openRecoverySettings();
}
function openRecoverySettings(){document.getElementById('slx-recovery-settings')?.remove();const m=document.createElement('div');m.className='slxs-modal';m.id='slx-recovery-settings';const choices=[['smart','Balanced'],['exit','Hospital Exit'],['full','Full Life'],['waste','Low Waste'],['cooldown','Low Cooldown'],['strongest','Strongest']],sw=(key,label)=>`<div class="slxs-setting-row"><span>${label}</span><button class="slxs-switch ${recoveryCfg[key]?'on':''}" data-rsw="${key}"><i></i></button></div>`;m.innerHTML=`<div class="slxs-modal-card"><div class="slxs-modal-head"><strong>⚙ Recovery Planner Settings</strong><button class="slxs-close" id="slx-r-close">×</button></div><div class="slxs-modal-body"><div class="slxs-box"><div>Total recovery bonus: <b style="color:#e8bf67">+${recoveryBonus()}%</b></div></div><div class="slxs-box"><div class="slxs-box-title">ITEM SOURCE</div><div class="slxs-choice-grid"><button class="slxs-choice ${recoveryCfg.source==='personal'?'active':''}" data-rsource="personal">Personal Items</button><button class="slxs-choice ${recoveryCfg.source==='faction'?'active':''}" data-rsource="faction">Faction Armory</button></div></div><div class="slxs-box"><div class="slxs-box-title">EDUCATION</div>${sw('bio1','Intermediate Biochemistry +10%')}${sw('bio2','Advanced Biochemistry +10%')}${sw('iv','Intravenous Therapy')}</div><div class="slxs-box"><div class="slxs-box-title">FACTION BONUS</div><input id="slx-r-range" type="range" min="0" max="10" value="${Number(recoveryCfg.factionUpgrades)||0}" style="width:100%"><div id="slx-r-label">${Number(recoveryCfg.factionUpgrades)||0} upgrades (+${(Number(recoveryCfg.factionUpgrades)||0)*5}%)</div></div><div class="slxs-box"><div class="slxs-box-title">PRIORITY</div><div class="slxs-choice-grid">${choices.map(([k,l])=>`<button class="slxs-choice ${recoveryCfg.order===k?'active':''}" data-rorder="${k}">${l}</button>`).join('')}</div></div><div class="slxs-box">${sw('noDrugs','No Drug Usage (exclude Opium)')}${sw('respectCooldown','Respect visible medical cooldown')}</div><button class="slxs-save-wide" id="slx-r-save">Save Settings</button></div></div>`;document.body.appendChild(m);m.onclick=e=>{if(e.target===m)m.remove()};document.getElementById('slx-r-close').onclick=()=>m.remove();m.querySelectorAll('[data-rsource]').forEach(b=>b.onclick=()=>{recoveryCfg.source=b.dataset.rsource;save(K.recovery,recoveryCfg);openRecoverySettings()});m.querySelectorAll('[data-rorder]').forEach(b=>b.onclick=()=>{recoveryCfg.order=b.dataset.rorder;save(K.recovery,recoveryCfg);openRecoverySettings()});m.querySelectorAll('[data-rsw]').forEach(b=>b.onclick=()=>{recoveryCfg[b.dataset.rsw]=!recoveryCfg[b.dataset.rsw];save(K.recovery,recoveryCfg);openRecoverySettings()});const r=document.getElementById('slx-r-range');r.oninput=()=>{recoveryCfg.factionUpgrades=Number(r.value);document.getElementById('slx-r-label').textContent=`${r.value} upgrades (+${Number(r.value)*5}%)`};document.getElementById('slx-r-save').onclick=()=>{save(K.recovery,recoveryCfg);m.remove()}}
function toggleFloat(id,title,html,after){const old=document.getElementById(id);if(old){old.remove();return}const p=document.createElement('div');p.id=id;p.className='slx-suite-float';p.innerHTML=`<div class="slx-float-head"><strong>${esc(title)}</strong><button class="slxs-close">×</button></div><div class="slx-float-body">${html}</div>`;document.body.appendChild(p);p.querySelector('.slxs-close').onclick=()=>p.remove();after?.(p)}

  function createSakaLuXEventLensModule(context) {
  'use strict';
      const ROOT_ID = 'sakalux-events-dashboard';
      const state = {
          filter: 'all',
          search: '',
          showAllFilters: false,
          secondaryFilters: new Set(['trades','jail','education','drugs','property','company','travel','marriage','rewards','other']),
          nativeList: null,
          observer: null,
          refreshTimer: null,
          saveOverlayUpdaters: new Set(),
          saveOverlayRAF: null,
          suppressNativeRefresh: false,
          pdaSyncTimer: null,
          pdaLastSignature: '',
          pdaLastUrl: location.href,
          startupTimer: null,
          events: [],
          expandedDate: '',
          pendingNativeRefresh: false,
          lastCardToggleAt: 0,
          lastCardToggleKey: ''
      };
      const STYLE_ID = 'sakalux-events-dashboard-styles';
      let moduleActive = false;
      let eventController = null;
      function onEventsPage() {
          const search = new URLSearchParams(location.search);
          const hash = String(location.hash || '');
          const hashQuery = hash.includes('?')
              ? new URLSearchParams(hash.slice(hash.indexOf('?') + 1))
              : new URLSearchParams(hash.replace(/^#/, ''));
          const sid = String(search.get('sid') || hashQuery.get('sid') || '').toLowerCase();
          if (sid === 'events') return true;
          const route = `${location.pathname}${location.search}${hash}`.toLowerCase();
          if (/(?:^|[\/#?&=])events(?:\.php)?(?:$|[\/#?&=])/.test(route)) return true;
          return [...document.querySelectorAll('h1,h2')].some(title =>
              !title.closest(`#${ROOT_ID}, #slx-suite-overlay`) &&
              cleanText(title.textContent).toLowerCase() === 'events'
          );
      }
      const EVENT_TONES = {
          green:  ['var(--sakalux-green)',       'color-mix(in srgb, var(--sakalux-green) 16%, transparent)',       'color-mix(in srgb, var(--sakalux-green) 46%, transparent)'],
          blue:   ['var(--sakalux-blue)',        'color-mix(in srgb, var(--sakalux-blue) 16%, transparent)',        'color-mix(in srgb, var(--sakalux-blue) 46%, transparent)'],
          red:    ['var(--sakalux-red)',         'color-mix(in srgb, var(--sakalux-red) 16%, transparent)',         'color-mix(in srgb, var(--sakalux-red) 46%, transparent)'],
          orange: ['var(--sakalux-orange)',      'color-mix(in srgb, var(--sakalux-orange) 16%, transparent)',      'color-mix(in srgb, var(--sakalux-orange) 46%, transparent)'],
          gold:   ['var(--sakalux-gold-bright)', 'color-mix(in srgb, var(--sakalux-gold-bright) 16%, transparent)', 'color-mix(in srgb, var(--sakalux-gold-bright) 46%, transparent)'],
          muted:  ['var(--sakalux-muted)',       'color-mix(in srgb, var(--sakalux-muted) 14%, transparent)',       'color-mix(in srgb, var(--sakalux-muted) 36%, transparent)']
      };
      const eventCategory = (label, glyph, tone = 'muted') => {
          const [color, soft, border] = EVENT_TONES[tone] || EVENT_TONES.muted;
          return { label, color, soft, border, glyph };
      };
      const CATEGORY_INFO = {
          money: eventCategory('Money', '$', 'green'),
          bets: eventCategory('Bets', '♠', 'green'),
          items: eventCategory('Items', '▣', 'blue'),
          armory: eventCategory('Armory', '◈', 'blue'),
          trades: eventCategory('Trades', '⇄', 'blue'),
          attacks: eventCategory('Attacks', '⚔', 'red'),
          racing: eventCategory('Racing', '⚑', 'gold'),
          hospital: eventCategory('Hospital', '✚', 'red'),
          bounties: eventCategory('Bounties', '★', 'orange'),
          jail: eventCategory('Jail', '▥', 'muted'),
          crimes: eventCategory('Organized Crimes', '◆', 'orange'),
          stocks: eventCategory('Stocks', '↗', 'green'),
          education: eventCategory('Education', '✓', 'blue'),
          drugs: eventCategory('Drugs', '◐', 'orange'),
          property: eventCategory('Property', '⌂', 'gold'),
          company: eventCategory('Company', '▦', 'blue'),
          travel: eventCategory('Travel', '✈', 'blue'),
          marriage: eventCategory('Marriage', '♥', 'red'),
          rewards: eventCategory('Rewards', '✦', 'gold'),
          faction: eventCategory('Faction', '⬡', 'gold'),
          other: eventCategory('Other', '•••', 'muted')
      };
      function isPDAView() {
          const ua = String(navigator.userAgent || '').toLowerCase();
          const platform = String(navigator.platform || '').toLowerCase();
          const htmlClass = String(
              document.documentElement?.className || ''
          ).toLowerCase();
          const bodyClass = String(
              document.body?.className || ''
          ).toLowerCase();

          const mobileUA =
              /tornpda|torn pda|android|iphone|ipad|ipod|mobile/.test(ua);

          const desktopUA =
              /windows nt|macintosh|cros|x11/.test(ua) &&
              !/android|iphone|ipad|ipod|mobile/.test(ua);

          if (desktopUA) {
              return false;
          }

          const explicitPDAClass =
              /(^|\s)pda(?:-|\s|$)/.test(htmlClass) ||
              /(^|\s)pda(?:-|\s|$)/.test(bodyClass);

          const explicitPDAPlatform = Boolean(
              document.querySelector('[data-platform="pda"]')
          );

          return mobileUA || explicitPDAClass || explicitPDAPlatform;
      }
      function eventViewportWidth() {
          const visualWidth = Number(
              window.visualViewport?.width || 0
          );
          const innerWidth = Number(window.innerWidth || 0);
          const clientWidth = Number(
              document.documentElement?.clientWidth || 0
          );

          return Math.max(
              visualWidth,
              innerWidth,
              clientWidth,
              0
          );
      }
      function isWidePDAView() {
          if (!isPDAView()) return false;

          const width = eventViewportWidth();
          const height = Math.max(
              Number(window.visualViewport?.height || 0),
              Number(window.innerHeight || 0),
              1
          );

          return (
              width >= 540 ||
              (width >= 480 && width / height >= 0.72)
          );
      }
      function clearEventViewportGeometry(root) {
          root.style.removeProperty('--ax-viewport-shift');
          root.style.removeProperty('--ax-viewport-width');
          root.style.removeProperty('--ax-pda-available-height');
          root.style.removeProperty('--ax-pda-bottom-safe');
      }
      function updateEventViewportMode() {
          const root = document.getElementById(ROOT_ID);
          if (!root) return;

          root.classList.remove('ax-wide-pda');
          clearEventViewportGeometry(root);

          if (!isPDAView()) return;
          if (!isWidePDAView()) return;

          const rect = root.getBoundingClientRect();
          const viewport = window.visualViewport;
          const viewportLeft = Number(viewport?.offsetLeft || 0);
          const viewportTop = Number(viewport?.offsetTop || 0);
          const viewportWidth = Math.max(
              Number(viewport?.width || 0),
              Number(window.innerWidth || 0),
              Number(document.documentElement?.clientWidth || 0),
              Number(window.outerWidth || 0),
              Number(window.screen?.width || 0)
          );
          const viewportHeight = Math.max(
              Number(viewport?.height || 0),
              Number(window.innerHeight || 0),
              Number(document.documentElement?.clientHeight || 0),
              1
          );

          const sideGutter = 10;
          const bottomSafe = 112;
          const maxUnfoldedWidth = 2256;

          const usableWidth = Math.max(
              320,
              Math.min(
                  maxUnfoldedWidth,
                  viewportWidth - (sideGutter * 2)
              )
          );

          const centeredGutter = Math.max(
              sideGutter,
              (viewportWidth - usableWidth) / 2
          );
          const targetLeft = viewportLeft + centeredGutter;
          const shift = targetLeft - rect.left;

          const rootTopInViewport = Math.max(
              0,
              rect.top - viewportTop
          );
          const availableHeight = Math.max(
              320,
              viewportHeight - rootTopInViewport - bottomSafe - 8
          );

          root.style.setProperty(
              '--ax-viewport-shift',
              `${shift}px`
          );
          root.style.setProperty(
              '--ax-viewport-width',
              `${usableWidth}px`
          );
          root.style.setProperty(
              '--ax-pda-available-height',
              `${availableHeight}px`
          );
          root.style.setProperty(
              '--ax-pda-bottom-safe',
              `${bottomSafe}px`
          );
          root.classList.add('ax-wide-pda');
      }
      function scheduleSaveOverlayPositions() {
          if (state.saveOverlayRAF) {
              return;
          }
          state.saveOverlayRAF =
              requestAnimationFrame(() => {
                  state.saveOverlayRAF = null;
                  state.saveOverlayUpdaters
                      .forEach(update => {
                          try {
                              update();
                          } catch (error) {
                          }
                      });
              });
      }
      function startDashboard() {
          if (!moduleActive || !onEventsPage()) return;
          if (document.getElementById(ROOT_ID)) return;
          injectCSS();
          eventController?.abort();
          eventController = new AbortController();
          window.addEventListener(
              'scroll',
              scheduleSaveOverlayPositions,
              {
                  capture: true,
                  signal: eventController.signal
              }
          );
          window.addEventListener(
              'resize',
              scheduleSaveOverlayPositions,
              {
                  signal: eventController.signal
              }
          );
          window.addEventListener(
              'resize',
              updateEventViewportMode,
              {
                  signal: eventController.signal
              }
          );
          window.addEventListener(
              'orientationchange',
              updateEventViewportMode,
              {
                  signal: eventController.signal
              }
          );
          window.visualViewport?.addEventListener(
              'resize',
              updateEventViewportMode,
              {
                  signal: eventController.signal
              }
          );
          document.addEventListener(
              'click',
              event => {
                  if (!isPDAView()) {
                      return;
                  }
                  const control =
                      event.target.closest(
                          'button, [role="button"], a'
                      );
                  if (!control) {
                      return;
                  }
                  const label =
                      cleanText(
                          control.getAttribute(
                              'aria-label'
                          ) ||
                          control.getAttribute(
                              'title'
                          ) ||
                          control.textContent ||
                          ''
                      ).toLowerCase();
                  const classText =
                      cleanText(
                          control.className?.baseVal ||
                          control.className ||
                          ''
                      ).toLowerCase();
                  if (
                      /saved event|saved events|all events|events/.test(
                          label
                      ) ||
                      /saved|event/.test(
                          classText
                      )
                  ) {
                      setTimeout(
                          queuePDAViewSync,
                          40
                      );
                  }
              },
              {
                  capture: true,
                  signal: eventController.signal
              }
          );
          state.startupTimer = setInterval(() => {
              const rows = getNativeRows();
              if (!rows.length) return;
              clearInterval(state.startupTimer);
              state.startupTimer = null;
              state.nativeList =
                  rows[0].closest('ul') ||
                  rows[0].parentElement;
              buildDashboard();
              refreshDashboard();
              updateEventViewportMode();
              observeNativeList();
              startPDASmartSync();
          }, 300);
      }
      function getPDANativeSignature(rows) {
          if (!rows.length) {
              return '';
          }
          const sampleRows =
              rows.length <= 6
                  ? rows
                  : [
                      ...rows.slice(0, 3),
                      ...rows.slice(-3)
                  ];
          return [
              rows.length,
              ...sampleRows.map(row => {
                  const message =
                      cleanText(
                          row.querySelector(
                              '[class*="message"], [data-sakalux-event-message]'
                          )?.textContent
                      );
                  const time =
                      cleanText(
                          row.querySelector(
                              'time[class*="dateTime"], [data-sakalux-event-time]'
                          )?.textContent
                      );
                  return `${message}|${time}`;
              })
          ].join('||');
      }
      function queuePDAViewSync() {
          if (!isPDAView()) {
              return;
          }
          let attempts = 0;
          const waitForView =
              setInterval(() => {
                  attempts += 1;
                  if (
                      state.suppressNativeRefresh ||
                      document.querySelector(
                          `#${ROOT_ID} .ax-event-card.ax-expanded-open`
                      )
                  ) {
                      if (attempts >= 24) {
                          clearInterval(
                              waitForView
                          );
                      }
                      return;
                  }
                  const rows =
                      getNativeRows();
                  if (rows.length) {
                      const currentNativeList =
                          rows[0].closest('ul') ||
                          rows[0].parentElement;
                      const signature =
                          getPDANativeSignature(
                              rows
                          );
                      if (
                          currentNativeList !==
                          state.nativeList
                      ) {
                          state.nativeList =
                              currentNativeList;
                      }
                      if (
                          signature !==
                          state.pdaLastSignature ||
                          attempts >= 3
                      ) {
                          clearInterval(
                              waitForView
                          );
                          state.pdaLastSignature =
                              signature;
                          refreshDashboard();
                          return;
                      }
                  }
                  if (attempts >= 24) {
                      clearInterval(
                          waitForView
                      );
                  }
              }, 100);
      }
      function startPDASmartSync() {
          if (
              !isPDAView() ||
              state.pdaSyncTimer
          ) {
              return;
          }
          state.pdaLastSignature =
              getPDANativeSignature(
                  getNativeRows()
              );
          state.pdaLastUrl =
              location.href;
          state.pdaSyncTimer =
              setInterval(() => {
                  if (
                      !isPDAView() ||
                      state.suppressNativeRefresh
                  ) {
                      return;
                  }

                  updateEventViewportMode();
                  if (
                      document.querySelector(
                          `#${ROOT_ID} .ax-event-card.ax-expanded-open`
                      )
                  ) {
                      return;
                  }
                  const rows =
                      getNativeRows();
                  if (!rows.length) {
                      return;
                  }
                  const currentNativeList =
                      rows[0].closest('ul') ||
                      rows[0].parentElement;
                  const signature =
                      getPDANativeSignature(
                          rows
                      );
                  const urlChanged =
                      location.href !==
                      state.pdaLastUrl;
                  const nativeListChanged =
                      currentNativeList !==
                      state.nativeList;
                  const contentChanged =
                      signature !==
                      state.pdaLastSignature;
                  const rootMissing =
                      !document.getElementById(
                          ROOT_ID
                      );
                  if (
                      !urlChanged &&
                      !nativeListChanged &&
                      !contentChanged &&
                      !rootMissing
                  ) {
                      return;
                  }
                  state.pdaLastUrl =
                      location.href;
                  state.pdaLastSignature =
                      signature;
                  if (
                      nativeListChanged ||
                      !state.nativeList?.isConnected
                  ) {
                      state.nativeList =
                          currentNativeList;
                  }
                  if (rootMissing) {
                      buildDashboard();
                  }
                  clearTimeout(
                      state.refreshTimer
                  );
                  state.refreshTimer =
                      setTimeout(() => {
                          if (
                              document.querySelector(
                                  `#${ROOT_ID} .ax-event-card.ax-expanded-open`
                              )
                          ) {
                              return;
                          }
                          refreshDashboard();
                          state.pdaLastSignature =
                              getPDANativeSignature(
                                  getNativeRows()
                              );
                      }, 120);
              }, 450);
      }
      function getNativeRows() {
          const exact = [
              ...document.querySelectorAll(
                  'li[class*="listItemWrapper"]'
              )
          ].filter(row => {
              return (
                  row.querySelector('[class*="message"]') &&
                  row.querySelector('time[class*="dateTime"]')
              );
          });
          if (exact.length) return exact;

          // Fortie's parser stays unchanged; this adapter only discovers the
          // equivalent TornPDA SPA nodes when generated class names differ.
          return [...document.querySelectorAll('li, [role="listitem"]')].filter(row => {
              if (row.closest(`#${ROOT_ID}, #slx-suite-overlay`)) return false;
              const message = row.querySelector('[class*="message"], [class*="contentGroup"], [class*="eventText"]');
              const time = row.querySelector('time[class*="dateTime"], time, [class*="dateTime"]');
              if (!message || !time || cleanText(message.textContent).length < 3) return false;
              message.setAttribute('data-sakalux-event-message', '');
              time.setAttribute('data-sakalux-event-time', '');
              return true;
          });
      }
      function buildDashboard() {
          if (document.getElementById(ROOT_ID)) return;
          const root = document.createElement('div');
          root.id = ROOT_ID;
          root.innerHTML = `
              <div class="ax-layout">
                  <aside class="ax-sidebar">
                      <div class="ax-panel">
                          <div class="ax-panel-title">
                              FILTERS
                          </div>
                          <div class="ax-filter-list">
                              ${filterButton('all', 'All Events')}
                              ${filterButton('money', 'Money')}
                              ${filterButton('bets', 'Bets')}
                              ${filterButton('items', 'Items')}
                              ${filterButton('armory', 'Armory')}
                              ${filterButton('trades', 'Trades')}
                              ${filterButton('attacks', 'Attacks')}
                              ${filterButton('racing', 'Racing')}
                              ${filterButton('hospital', 'Hospital')}
                              ${filterButton('bounties', 'Bounties')}
                              ${filterButton('jail', 'Jail')}
                              ${filterButton('crimes', 'OCs')}
                              ${filterButton('stocks', 'Stocks')}
                              ${filterButton('education', 'Education')}
                              ${filterButton('drugs', 'Drugs')}
                              ${filterButton('property', 'Property')}
                              ${filterButton('company', 'Company')}
                              ${filterButton('travel', 'Travel')}
                              ${filterButton('marriage', 'Marriage')}
                              ${filterButton('rewards', 'Rewards')}
                              ${filterButton('faction', 'Faction')}
                              ${filterButton('other', 'Other')}
                          </div>
                          <button
                              class="ax-filter-more"
                              type="button"
                          >
                              <span class="ax-filter-more-label">Show all filters</span>
                              <span class="ax-filter-more-chevron">›</span>
                          </button>
                      </div>
                      <div class="ax-panel ax-stats-panel">
                          <div class="ax-panel-title ax-stats-title">
                              TODAY - QUICK STATS
                          </div>
                          <div class="ax-stat-row">
                              <span>Money In</span>
                              <strong class="ax-stat-money-in">$0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Money Out</span>
                              <strong class="ax-stat-money-out">$0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Net Cash Flow</span>
                              <strong class="ax-stat-net">$0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Internal Transfers</span>
                              <strong class="ax-stat-transfers">$0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Items Moved</span>
                              <strong class="ax-stat-items">0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Net Item Sales</span>
                              <strong class="ax-stat-item-sales">$0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Bounties Claimed</span>
                              <strong class="ax-stat-bounties">0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Events</span>
                              <strong class="ax-stat-today">0</strong>
                          </div>
                          <div class="ax-stat-row">
                              <span>Racing Points</span>
                              <strong class="ax-stat-racing">0</strong>
                          </div>
                      </div>
                      <div class="ax-tct">
                          All times in TCT
                      </div>
                  </aside>
                  <main class="ax-main">
                      <div class="ax-toolbar">
                          <div class="ax-search-wrap">
                              <span class="ax-search-icon">
                                  🔎
                              </span>
                              <input
                                  class="ax-search"
                                  type="text"
                                  placeholder="Search people, items, races, amounts..."
                              >
                              <button
                                  class="ax-search-clear"
                                  title="Clear search"
                              >
                                  ×
                              </button>
                          </div>
                          <div class="ax-visible-count">
                              0 / 0
                          </div>
                          <button
                              class="ax-refresh"
                              title="Refresh dashboard"
                          >
                              ↻
                          </button>
                          <button class="ax-clear">
                              Clear Filters
                          </button>
                      </div>
                      <div class="ax-columns">
                          <div>EVENT</div>
                          <div>DETAILS</div>
                          <div>TIME</div>
                          <div class="ax-actions-heading">ACTIONS</div>
                      </div>
                      <div class="ax-event-list"></div>
                      <div class="ax-empty">
                          No matching events
                      </div>
                  </main>
              </div>
          `;
          state.nativeList.parentElement.insertBefore(
              root,
              state.nativeList
          );
          bindControls();

          updateEventViewportMode();
          requestAnimationFrame(() => {
              updateEventViewportMode();
              requestAnimationFrame(updateEventViewportMode);
          });
          setTimeout(updateEventViewportMode, 180);
          setTimeout(updateEventViewportMode, 650);
      }
      function filterButton(key, label) {
          const meta = key === 'all'
              ? {
                  color: 'var(--sakalux-gold-bright)',
                  soft: 'color-mix(in srgb, var(--sakalux-gold) 14%, transparent)',
                  border: 'color-mix(in srgb, var(--sakalux-gold) 42%, transparent)',
                  glyph: '▦'
              }
              : CATEGORY_INFO[key];
          return `
              <button
                  class="ax-filter ${key === 'all' ? 'active' : ''} ${state.secondaryFilters.has(key) ? 'ax-filter-secondary' : ''}"
                  data-filter="${key}"
                  style="
                      --filter-color:${meta.color};
                      --filter-soft:${meta.soft};
                      --filter-border:${meta.border};
                  "
              >
                  <span class="ax-filter-badge">
                      ${meta.glyph}
                  </span>
                  <span class="ax-filter-name">
                      ${label}
                  </span>
                  <span
                      class="ax-filter-count"
                      data-count="${key}"
                  >
                      0
                  </span>
              </button>
          `;
      }
      function refreshDashboard() {
          const rows = getNativeRows();
          if (!rows.length) return;
          state.pendingNativeRefresh = false;
          const events =
              rows
                  .map(parseRow)
                  .filter(Boolean);
          state.events = events;
          renderEvents(events);
          updateCounts(events);
          updateStats(events);
          if (events.length) {
              state.nativeList.classList.add(
                  'ax-native-list-hidden'
              );
          }
          if (isPDAView()) {
              state.pdaLastSignature =
                  getPDANativeSignature(
                      getNativeRows()
                  );
              state.pdaLastUrl =
                  location.href;
          }
      }
      function getEventDestination(message, category) {
          const text = String(message || '').toLowerCase();

          if (
              category === 'bets' &&
              (
                  /you won \$[\d,]+ on your \$[\d,]+ .* bet/.test(text) ||
                  /you lost your \$[\d,]+ .* bet/.test(text)
              )
          ) {
              return {
                  text: 'View',
                  href: 'https://www.torn.com/page.php?sid=bookie#/your-bets',
                  label: 'Open your Bookie bets'
              };
          }

          if (
              category === 'stocks' &&
              (
                  text.includes('stock dividend available') ||
                  (
                      text.includes('stock dividend') &&
                      text.includes('withdraw')
                  )
              )
          ) {
              return {
                  text: 'View',
                  href: 'https://www.torn.com/page.php?sid=stocks',
                  label: 'Open the Stock Exchange'
              };
          }

          return null;
      }

      let eventPlayerIdentityCache = null;

      function getEventPlayerIdentity() {
          if (
              eventPlayerIdentityCache?.xid ||
              eventPlayerIdentityCache?.name
          ) {
              return eventPlayerIdentityCache;
          }

          const selectors = [
              '#sidebarroot a[href*="profiles.php?XID="]',
              '[class*="sidebar"] a[href*="profiles.php?XID="]',
              '[class*="userInfo"] a[href*="profiles.php?XID="]',
              '[class*="userName"] a[href*="profiles.php?XID="]',
              'header a[href*="profiles.php?XID="]'
          ];

          for (const selector of selectors) {
              for (const link of document.querySelectorAll(selector)) {
                  const href =
                      link.getAttribute('href') ||
                      link.href ||
                      '';
                  const xid =
                      href.match(/[?&]XID=(\d+)/i)?.[1] ||
                      '';
                  const name =
                      cleanText(
                          link.getAttribute('aria-label') ||
                          link.textContent ||
                          ''
                      )
                          .replace(/^View profile of\s+/i, '')
                          .trim();

                  if (xid || name) {
                      eventPlayerIdentityCache = {
                          xid: String(xid || ''),
                          name
                      };
                      return eventPlayerIdentityCache;
                  }
              }
          }

          return { xid: '', name: '' };
      }

      function getInternalFactionTransferInfo(
          message,
          category,
          links
      ) {
          if (category !== 'faction') return null;

          const match =
              String(message || '').match(
                  /^(.+?) gave \$([\d,]+) to you from (.+)$/i
              );
          if (!match) return null;

          const senderName =
              cleanText(match[1]).trim();
          const amount =
              parseInt(
                  String(match[2]).replace(/,/g, ''),
                  10
              ) || 0;
          const source =
              cleanText(match[3]).trim();

          const senderProfile =
              links.find(link =>
                  /profiles\.php\?XID=\d+/i.test(
                      String(link.href || '')
                  )
              );
          const senderXid =
              String(senderProfile?.href || '')
                  .match(/[?&]XID=(\d+)/i)?.[1] ||
              '';

          const self = getEventPlayerIdentity();

          const sameXid =
              !!senderXid &&
              !!self.xid &&
              String(senderXid) === String(self.xid);

          const sameName =
              !!senderName &&
              !!self.name &&
              senderName.localeCompare(
                  self.name,
                  undefined,
                  { sensitivity: 'base' }
              ) === 0;

          if (!sameXid && !sameName) {
              return null;
          }

          return {
              amount,
              senderName,
              source
          };
      }

      function parseRow(row, index) {
          const messageEl =
              row.querySelector(
                  '[class*="message"], [data-sakalux-event-message]'
              );
          const timeEl =
              row.querySelector(
                  'time[class*="dateTime"], [data-sakalux-event-time]'
              );
          const buttonsEl =
              row.querySelector(
                  '[class*="buttonsGroup"]'
              );
          const nativeActionEls =
              [
                  ...row.querySelectorAll(
                      '*'
                  )
              ]
                  .filter(el => {
                      const label =
                          cleanText(
                              el.getAttribute?.('aria-label') ||
                              el.getAttribute?.('title') ||
                              el.getAttribute?.('data-tooltip') ||
                              el.textContent ||
                              ''
                          ).toLowerCase();
                      const classText =
                          cleanText(
                              el.className?.baseVal ||
                              el.className ||
                              ''
                          ).toLowerCase();
                      return (
                          /^(copy|save|saved|unsave|favorite|unfavorite|favourite|unfavourite|remove)( event)?$/.test(label) || /\b(add to saved|remove from saved|save event|unsave event|saved event)\b/.test(label) ||
                          /\b(copy|save|unsave|favorite|unfavorite|favourite|unfavourite|bookmark)\b/.test(classText)
                      );
                  });
          if (!messageEl || !timeEl) {
              return null;
          }
          const message =
              cleanText(messageEl.textContent);
          const timeText =
              cleanText(
                  timeEl.innerText ||
                  timeEl.textContent ||
                  ''
              );
          const timeParts = [
              ...timeEl.childNodes
          ]
              .map(node =>
                  cleanText(node.textContent)
              )
              .filter(Boolean);
          const rawTime =
              timeParts.find(part =>
                  /^\d{1,2}:\d{2}:\d{2}$/.test(part)
              ) ||
              timeText.match(
                  /\b\d{1,2}:\d{2}:\d{2}\b/
              )?.[0] ||
              '';
          const rawDate =
              timeParts.find(part =>
                  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(part)
              ) ||
              timeText.match(
                  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/
              )?.[0] ||
              '';
          const category =
              detectCategory(message);
          const links =
              [...messageEl.querySelectorAll('a')]
                  .map(a => ({
                      text: cleanText(a.textContent),
                      href: a.href
                  }))
                  .filter(link => link.text);
          const internalFactionTransfer =
              getInternalFactionTransferInfo(
                  message,
                  category,
                  links
              );
          const nativeViewLink =
              links.find(link =>
                  /^view$/i.test(link.text)
              ) || null;
          const completedVirus =
              /\b(?:completed|finished)\b[^.]*\bvirus\b|\bvirus\b[^.]*\b(?:completed|finished)\b/i.test(
                  message
              );
          const routedDestination =
              getEventDestination(
                  message,
                  category
              );
          const viewLink =
              nativeViewLink ||
              (
                  completedVirus
                      ? {
                          text: 'View',
                          href: 'https://www.torn.com/pc.php',
                          label: 'Open Programming'
                      }
                      : routedDestination
              );
          const details =
              parseDetails(
                  message,
                  category
              );
          let display =
              buildDisplayData(
                  message,
                  category
              );

          if (internalFactionTransfer) {
              details.amount =
                  internalFactionTransfer.amount;
              details.direction = null;
              details.internalTransfer = true;

              display = {
                  title: 'Vault transfer',
                  subtitle:
                      `Faction vault to Wallet • ${internalFactionTransfer.source}`,
                  value:
                      `$${formatNumber(
                          internalFactionTransfer.amount
                      )}`,
                  detailLabel: 'Internal transfer'
              };
          }

          return {
              index,
              row,
              message,
              category,
              buttonsEl,
              nativeActionEls,
              links,
              viewLink,
              time: rawTime,
              date: rawDate,
              details,
              display
          };
      }
      function detectCategory(text) {
          const t = text.toLowerCase();
          if (/you won \$[\d,]+ on your \$[\d,]+ .* bet|you lost your \$[\d,]+ .* bet/.test(t)) {
              return 'bets';
          }
          if (
              /earned (?:you|your) \$[\d,]+\s+bounty reward|bounty reward|bount(?:y|ies) on you|bounty was placed on you|you placed a .* bounty/i.test(t)
          ) {
              return 'bounties';
          }
          if (/trade\b|accepted the trade|initiated a trade|trade titled/i.test(t)) {
              return 'trades';
          }
          if (/faction armory|loaned yourself .* from the faction armory|gave yourself .* from the faction armory/.test(t)) {
              return 'armory';
          }
          if (/scenario .* has been initiated|scenario you participated in has been initiated|organized crime|organised crime|scenario .* failed to initiate/.test(t)) {
              return 'crimes';
          }
          if (/successfully busted you out of jail|busted you out of jail|jail/.test(t)) {
              return 'jail';
          }
          if (/stock dividend|stock exchange|dividend/.test(t)) {
              return 'stocks';
          }
          if (/you completed the .* which is now in your inventory|education|course completed/.test(t)) {
              return 'education';
          }
          if (
              /you took some .*overdosed|you overdosed|overdose|drug cooldown|addiction|rehab|took some xanax|took some ecstasy|took some vicodin|took some cannabis|took some lsd|took some opium|took some ketamine|took some shrooms/.test(t)
          ) {
              return 'drugs';
          }
          if (/finished renting your|leased your .* property|leasing your .* property|property lease|private island|property/i.test(t)) {
              return 'property';
          }
          if (/applied to join your company|been fired from|company application|join your company/.test(t)) {
              return 'company';
          }
          if (/flight has been temporarily denied|flight time has been increased|traveling|travelling|flight/.test(t)) {
              return 'travel';
          }
          if (/witnessed the marriage|invited you to witness their marriage|marriage with|wedding gift/.test(t)) {
              return 'marriage';
          }
          if (/congratulations! you upgraded your level|credited with .* donator pack items|found .* on your doorstep/.test(t)) {
              return 'rewards';
          }
          if (/race|racing points?|best lap/.test(t)) {
              return 'racing';
          }
          if (/faction|axiom \{|faction balance|money balance/.test(t)) {
              return 'faction';
          }
          if (/hospital|hospitalized|hospitalised|revived|revive/.test(t)) {
              return 'hospital';
          }
          if (/attacked|attack |mugged|mugging|defeated|stalemate|bounty|hit you/.test(t)) {
              return 'attacks';
          }
          if (/you were sent \$[\d,]+|sent you \$[\d,]+|received \$[\d,]+|gave \$[\d,]+ to you/.test(t)) {
              return 'money';
          }
          if (/item market|bazaar|you were sent|sent \d+\s*x|bought \d+\s*x|sold \d+\s*x/.test(t)) {
              return 'items';
          }
          if (/\$[\d,.]+|gave .* to you|gave you/.test(t)) {
              return 'money';
          }
          return 'other';
      }
      function parseDetails(text, category) {
          const details = {
              amount: null,
              direction: null,
              secondary: '',
              itemQuantity: 0,
              racingPoints: 0,
              isBountyRewardInfo: false,
              internalTransfer: false
          };
          const bountyRewardMatch =
              text.match(
                  /(?:hospitalized|hospitalised).*?earned (?:you|your) \$([\d,]+)\s+bounty reward/i
              ) ||
              text.match(
                  /earned (?:you|your) \$([\d,]+)\s+bounty reward/i
              );
          if (bountyRewardMatch) {
              details.amount =
                  parseInt(
                      bountyRewardMatch[1].replace(/,/g, ''),
                      10
                  ) || 0;
              details.direction = null;
              details.isBountyRewardInfo = true;
          } else {
              const moneyMatches =
                  [...text.matchAll(/\$([\d,]+)/g)];
              if (moneyMatches.length) {
                  details.amount =
                      parseInt(
                          moneyMatches[0][1].replace(/,/g, ''),
                          10
                      ) || 0;
              }
              if (/you were sent \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
              } else if (/sent you \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
              } else if (/bought .* from your bazaar for \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
              } else if (/you sold .* on the item market .* for \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
              } else if (/gave \$[\d,]+ to you/i.test(text)) {
                  details.direction = 'in';
              } else if (/gave .* to you from/i.test(text)) {
                  details.direction = 'in';
              } else if (/received \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
              } else if (/they have paid \$[\d,]+/i.test(text)) {
                  details.direction = 'in';
                  const paidMatch =
                      text.match(
                          /they have paid \$([\d,]+)/i
                      );
                  if (paidMatch) {
                      details.amount =
                          parseInt(
                              paidMatch[1].replace(/,/g, ''),
                              10
                          ) || 0;
                  }
              } else if (/decreased your .* money balance by \$[\d,]+/i.test(text)) {
                  details.direction = 'out';
              } else if (/you gave \$[\d,]+/i.test(text)) {
                  details.direction = 'out';
              } else if (/you paid \$[\d,]+/i.test(text)) {
                  details.direction = 'out';
              }
          }
          const quantities =
              [...text.matchAll(/\b(\d+)\s*x\b/gi)];
          details.itemQuantity =
              quantities.reduce(
                  (sum, match) => sum + Number(match[1]),
                  0
              );
          const pointsMatch =
              text.match(/received\s+(\d+)\s+racing points?/i);
          if (pointsMatch) {
              details.racingPoints = Number(pointsMatch[1]);
          }
          const lapMatch =
              text.match(/best lap was\s+([0-9:.]+)/i);
          if (lapMatch) {
              details.secondary = `Best lap ${lapMatch[1]}`;
          }
          const feeMatch =
              text.match(/after\s+\$([\d,]+)\s+in fees?/i);
          if (feeMatch) {
              details.secondary = `Fee $${feeMatch[1]}`;
          }
          if (category === 'bets') {
              const wonMatch =
                  text.match(
                      /you won \$([\d,]+) on your \$([\d,]+) .+? bet on /i
                  );
              const lostMatch =
                  text.match(
                      /you lost your \$([\d,]+) .+? bet on /i
                  );

              if (wonMatch) {
                  details.amount =
                      parseInt(
                          wonMatch[1].replace(/,/g, ''),
                          10
                      ) || 0;
                  details.direction = 'in';
              } else if (lostMatch) {
                  details.amount =
                      parseInt(
                          lostMatch[1].replace(/,/g, ''),
                          10
                      ) || 0;
                  details.direction = 'out';
              } else {
                  details.direction = null;
              }
          }
          return details;
      }
      function buildDisplayData(message, category) {
          let match;
          if (category === 'bets') {
              match =
                  message.match(
                      /you won \$([\d,]+) on your \$([\d,]+) (.+?) bet on (.+?)\. You can withdraw these funds at the Bookie\./i
                  );
              if (match) {
                  return {
                      title: `Bet won - ${match[4]}`,
                      subtitle: `Stake $${match[2]} • ${match[3]}`,
                      value: `+$${match[1]}`,
                      detailLabel: 'Bookie win'
                  };
              }
              match =
                  message.match(
                      /you lost your \$([\d,]+) (.+?) bet on (.+)/i
                  );
              if (match) {
                  return {
                      title: `Bet lost - ${match[3]}`,
                      subtitle: `Stake $${match[1]} • ${match[2]}`,
                      value: `-$${match[1]}`,
                      detailLabel: 'Bookie loss'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Bet'
              };
          }
          if (category === 'bounties') {
              match =
                  message.match(
                      /(.+?) hospitalized (.+?) and earned (?:you|your) \$([\d,]+)\s+bounty reward/i
                  ) ||
                  message.match(
                      /(.+?) hospitalised (.+?) and earned (?:you|your) \$([\d,]+)\s+bounty reward/i
                  );
              if (match) {
                  const claimant =
                      cleanText(match[1]).trim();
                  const target =
                      cleanText(match[2]).trim();
                  return {
                      title: `Claimed by ${claimant}`,
                      subtitle: `Hit ${target}`,
                      value: '',
                      detailLabel: '',
                      valueStyle: 'bounty',
                      bountySubtype: 'claimed',
                      hideQuickDetails: true
                  };
              }
              match =
                  message.match(
                      /(.+?) has placed (\d+) bounties on you with rewards? of \$([\d,]+)/i
                  ) ||
                  message.match(
                      /(.+?) has placed a bounty on you with (?:a )?reward of \$([\d,]+)/i
                  );
              if (match) {
                  const multiple =
                      match.length >= 4;
                  const placer =
                      cleanText(match[1]).trim();
                  const count =
                      multiple
                          ? Number(match[2])
                          : 1;
                  const amount =
                      multiple
                          ? match[3]
                          : match[2];
                  return {
                      title:
                          count > 1
                              ? `${placer} placed ${count} bounties on you`
                              : `${placer} placed a bounty on you`,
                      subtitle: '',
                      value: `$${amount}`,
                      detailLabel: '',
                      valueStyle: 'bounty',
                      bountySubtype: 'received'
                  };
              }
              match =
                  message.match(
                      /you placed a \$([\d,]+)\s+bounty on (.+?)(?:\.|$)/i
                  );
              if (match) {
                  return {
                      title: 'Bounty placed',
                      subtitle: `Target: ${cleanText(match[2]).trim()}`,
                      value: `$${match[1]}`,
                      detailLabel: 'Placed',
                      valueStyle: 'bounty',
                      bountySubtype: 'placed'
                  };
              }
              match =
                  message.match(
                      /a \$([\d,]+)\s+bounty was placed on you(?:\s+by\s+(.+?))?(?:\.|$)/i
                  );
              if (match) {
                  return {
                      title: 'Bounty received',
                      subtitle:
                          match[2]
                              ? `Placed by: ${cleanText(match[2]).trim()}`
                              : 'Placed on you',
                      value: `$${match[1]}`,
                      detailLabel: 'Incoming bounty',
                      valueStyle: 'bounty',
                      bountySubtype: 'received'
                  };
              }
              match =
                  message.match(
                      /your bounty on (.+?) (?:expired|was removed|has been removed)/i
                  );
              if (match) {
                  return {
                      title: 'Bounty ended',
                      subtitle: `Target: ${cleanText(match[1]).trim()}`,
                      value: '',
                      detailLabel: 'Expired / removed',
                      bountySubtype: 'ended'
                  };
              }
              return {
                  title: 'Bounty update',
                  subtitle: message,
                  value: '',
                  detailLabel: 'Bounty',
                  bountySubtype: 'other'
              };
          }
          if (category === 'trades') {
              match =
                  message.match(/(.+?) has accepted the trade\.\s*(.+)$/i);
              if (match) {
                  return {
                      title: 'Trade accepted',
                      subtitle: `${match[1]} • ${match[2]}`,
                      value: '',
                      detailLabel: 'Completed'
                  };
              }
              match =
                  message.match(/(.+?) has initiated a trade titled "(.+?)"\.\s*(.+)$/i);
              if (match) {
                  return {
                      title: 'Trade initiated',
                      subtitle: `${match[1]} • "${match[2]}"`,
                      value: '',
                      detailLabel: 'Pending'
                  };
              }
              match =
                  message.match(/(.+?) has cancelled the trade/i);
              if (match) {
                  return {
                      title: 'Trade cancelled',
                      subtitle: match[1],
                      value: '',
                      detailLabel: 'Cancelled'
                  };
              }
              return {
                  title: 'Trade update',
                  subtitle: message,
                  value: '',
                  detailLabel: 'Trade'
              };
          }
          if (category === 'armory') {
              match =
                  message.match(/you gave yourself (\d+)\s*x\s*(.+?) from the faction armory/i);
              if (match) {
                  return {
                      title: `${match[1]}× ${match[2]}`,
                      subtitle: 'Taken from faction armory',
                      value: '',
                      detailLabel: 'Armory'
                  };
              }
              match =
                  message.match(/you loaned yourself (\d+)\s*x\s*(.+?) from the faction armory/i);
              if (match) {
                  return {
                      title: `${match[1]}× ${match[2]}`,
                      subtitle: 'Loaned from faction armory',
                      value: '',
                      detailLabel: 'Armory loan'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Armory'
              };
          }
          if (category === 'crimes') {
              match =
                  message.match(/the (.+?) scenario you participated in has been initiated/i);
              if (match) {
                  return {
                      title: `${match[1]} initiated`,
                      subtitle: 'Organized Crime',
                      value: '',
                      detailLabel: 'OC'
                  };
              }
              match =
                  message.match(/the (.+?) scenario you are participating in has failed to initiate because you are currently (.+)/i);
              if (match) {
                  return {
                      title: `${match[1]} failed to start`,
                      subtitle: `Reason: ${match[2]}`,
                      value: '',
                      detailLabel: 'OC failed'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'OC'
              };
          }
          if (category === 'jail') {
              match =
                  message.match(/(.+?) successfully busted you out of jail/i);
              if (match) {
                  return {
                      title: 'Busted out of jail',
                      subtitle: `By ${match[1]}`,
                      value: '',
                      detailLabel: 'Jail'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Jail'
              };
          }
          if (category === 'stocks') {
              if (/stock dividend/i.test(message)) {
                  return {
                      title: 'Stock dividend available',
                      subtitle: message,
                      value: '',
                      detailLabel: 'Stocks'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Stocks'
              };
          }
          if (category === 'education') {
              match =
                  message.match(/you completed the (.+?) which is now in your inventory/i);
              if (match) {
                  return {
                      title: `${match[1]} completed`,
                      subtitle: 'Now available in inventory',
                      value: '',
                      detailLabel: 'Completed'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Education'
              };
          }
          if (category === 'company') {
              let match =
                  message.match(/(.+?) has applied to join your company/i);
              if (match) {
                  return {
                      title: 'Company application',
                      subtitle: `${match[1]} applied to join`,
                      value: '',
                      detailLabel: 'Application'
                  };
              }
              match =
                  message.match(/you have been fired from (.+)/i);
              if (match) {
                  return {
                      title: 'Fired from company',
                      subtitle: match[1],
                      value: '',
                      detailLabel: 'Company'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Company'
              };
          }
          if (category === 'travel') {
              let match =
                  message.match(/flight time has been increased by ([\d,]+) minutes/i);
              if (match) {
                  return {
                      title: 'Flight delayed',
                      subtitle: 'Landing temporarily denied',
                      value: `+${match[1]} min`,
                      detailLabel: 'Travel delay'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Travel'
              };
          }
          if (category === 'marriage') {
              let match =
                  message.match(/you witnessed the marriage of (.+?) and (.+?)\./i);
              if (match) {
                  return {
                      title: 'Marriage witnessed',
                      subtitle: `${match[1]} + ${match[2]}`,
                      value: '',
                      detailLabel: 'Marriage'
                  };
              }
              match =
                  message.match(/(.+?) has invited you to witness their marriage with (.+?)\./i);
              if (match) {
                  return {
                      title: 'Marriage invitation',
                      subtitle: `${match[1]} + ${match[2]}`,
                      value: '',
                      detailLabel: 'Invitation'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Marriage'
              };
          }
          if (category === 'rewards') {
              let match =
                  message.match(/congratulations! you upgraded your level to ([\d,]+)!/i);
              if (match) {
                  return {
                      title: `Level up - ${match[1]}`,
                      subtitle: 'New level reached',
                      value: '',
                      detailLabel: 'Progression'
                  };
              }
              match =
                  message.match(/you have been credited with ([\d,]+) donator pack items/i);
              if (match) {
                  return {
                      title: 'Donator Pack reward',
                      subtitle: `${match[1]} items credited`,
                      value: '',
                      detailLabel: 'Reward'
                  };
              }
              match =
                  message.match(/you found (.+?) on your doorstep/i);
              if (match) {
                  return {
                      title: 'Reward received',
                      subtitle: match[1],
                      value: '',
                      detailLabel: 'Reward'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Reward'
              };
          }
          if (category === 'drugs') {
              let match =
                  message.match(
                      /you took some (.+?) and downed a glass of water\.\s*a headache was followed by nausea and vomiting\.\s*you overdosed\.?/i
                  );
              if (match) {
                  return {
                      title: `${cleanText(match[1])} overdose`,
                      subtitle: 'Headache followed by nausea and vomiting',
                      value: '',
                      detailLabel: 'Overdose'
                  };
              }
              match =
                  message.match(
                      /you took some (.+?) and (.+?overdosed.+)$/i
                  );
              if (match) {
                  return {
                      title: `${cleanText(match[1])} overdose`,
                      subtitle:
                          cleanText(match[2])
                              .replace(/^downed a glass of water\.?\s*/i, '')
                              .replace(/\s*you overdosed\.?$/i, '')
                              .trim(),
                      value: '',
                      detailLabel: 'Overdose'
                  };
              }
              match =
                  message.match(
                      /you took some (.+?)(?:\.|$)/i
                  );
              if (match) {
                  return {
                      title: `${cleanText(match[1])} used`,
                      subtitle: '',
                      value: '',
                      detailLabel: 'Drug'
                  };
              }
              if (/rehab/i.test(message)) {
                  return {
                      title: 'Rehab update',
                      subtitle: message,
                      value: '',
                      detailLabel: 'Drugs'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Drugs'
              };
          }
          if (category === 'property') {
              let match =
                  message.match(/(.+?) has finished renting your (.+?)(?:\.|$)/i);
              if (match) {
                  return {
                      title: 'Property rental ended',
                      subtitle: `${match[1]} • ${match[2]}`,
                      value: '',
                      detailLabel: 'Rental ended'
                  };
              }
              match =
                  message.match(
                      /(.+?) has accepted the offer and is now leasing your (.+?) from you for (.+?)\. They have paid \$([\d,]+)/i
                  );
              if (match) {
                  return {
                      title: 'Property lease accepted',
                      subtitle: `${cleanText(match[1])} • ${cleanText(match[2])} • ${cleanText(match[3])}`,
                      value: `+$${match[4]}`,
                      detailLabel: 'Lease'
                  };
              }
              match =
                  message.match(/(.+?) has accepted your offer of \$([\d,]+) for leasing your (.+?)(?:\.|$)/i);
              if (match) {
                  return {
                      title: `Property lease accepted`,
                      subtitle: `${match[1]} • ${match[3]}`,
                      value: `+$${match[2]}`,
                      detailLabel: 'Lease'
                  };
              }
              match =
                  message.match(/(.+?) leased your (.+?) for \$([\d,]+)/i);
              if (match) {
                  return {
                      title: `Property leased`,
                      subtitle: `${match[1]} • ${match[2]}`,
                      value: `+$${match[3]}`,
                      detailLabel: 'Lease'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Property'
              };
          }
          if (category === 'hospital') {
              let match =
                  message.match(
                      /^(.+?) successfully revived you/i
                  );
              if (match) {
                  return {
                      title: `Revived by ${cleanText(match[1])}`,
                      subtitle: 'Life restored',
                      value: '',
                      detailLabel: 'Revive',
                      hospitalSubtype: 'revive'
                  };
              }
              match =
                  message.match(
                      /^(.+?) attacked and hospitalized you/i
                  ) ||
                  message.match(
                      /^(.+?) attacked and hospitalised you/i
                  );
              if (match) {
                  const rawAttacker =
                      cleanText(match[1]).trim();
                  const attackerParts =
                      rawAttacker.split(
                          /\s+and\s+/i
                      );
                  const primaryAttacker =
                      attackerParts.shift()?.trim() || '';
                  const secondaryParticipants =
                      attackerParts
                          .map(name => name.trim())
                          .filter(Boolean);
                  return {
                      title:
                          primaryAttacker.toLowerCase() === 'someone'
                              ? 'Hospitalized by unknown attacker'
                              : `Hospitalized by ${primaryAttacker}`,
                      subtitle:
                          secondaryParticipants.length
                              ? `Also involved: ${secondaryParticipants.join(', ')}`
                              : 'Attack result',
                      value: '',
                      detailLabel: 'Hospital',
                      hospitalSubtype: 'attack'
                  };
              }
              match =
                  message.match(
                      /^you were hospitalized by ([^.,\[]+)/i
                  ) ||
                  message.match(
                      /^you were hospitalised by ([^.,\[]+)/i
                  );
              if (match) {
                  return {
                      title: `Hospitalized by ${cleanText(match[1])}`,
                      subtitle: '',
                      value: '',
                      detailLabel: 'Hospital',
                      hospitalSubtype: 'attack'
                  };
              }
              match =
                  message.match(
                      /^(.+?) hospitalized you(?:\b|\s)/i
                  ) ||
                  message.match(
                      /^(.+?) hospitalised you(?:\b|\s)/i
                  );
              if (match) {
                  const rawAttacker =
                      cleanText(match[1]).trim();
                  const attackerParts =
                      rawAttacker.split(
                          /\s+and\s+/i
                      );
                  const primaryAttacker =
                      attackerParts.shift()?.trim() || '';
                  const secondaryParticipants =
                      attackerParts
                          .map(name => name.trim())
                          .filter(Boolean);
                  return {
                      title:
                          primaryAttacker
                              ? `Hospitalized by ${primaryAttacker}`
                              : 'Hospitalized',
                      subtitle:
                          secondaryParticipants.length
                              ? `Also involved: ${secondaryParticipants.join(', ')}`
                              : 'Attack result',
                      value: '',
                      detailLabel: 'Hospital',
                      hospitalSubtype: 'attack'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Hospital'
              };
          }
          if (category === 'racing') {
              const raceMatch =
                  message.match(
                      /finished\s+(\d+(?:st|nd|rd|th))\s+in the\s+(.+?)\s+race/i
                  );
              const lapMatch =
                  message.match(/best lap was\s+([0-9:.]+)/i);
              const pointsMatch =
                  message.match(/received\s+(\d+)\s+racing points?/i);
              if (raceMatch) {
                  return {
                      title: `${raceMatch[1]} - ${raceMatch[2]}`,
                      subtitle: lapMatch ? `Best lap ${lapMatch[1]}` : '',
                      value: pointsMatch
                          ? `+${pointsMatch[1]} point${Number(pointsMatch[1]) === 1 ? '' : 's'}`
                          : '',
                      detailLabel: pointsMatch ? '' : 'No points'
                  };
              }
          }
          match =
              message.match(
                  /you were sent\s+(\d+)\s*x\s+(.+?)\s+from\s+(.+?)(?:\s+with the message:|$)/i
              );
          if (match) {
              return {
                  title: `${match[1]}× ${match[2]}`,
                  subtitle: `From ${match[3]}`,
                  value: '',
                  detailLabel: 'Received'
              };
          }
          match =
              message.match(
                  /(.+?) bought (\d+)\s*x\s+(.+?) from your bazaar for \$([\d,]+)/i
              );
          if (match) {
              return {
                  title: `${match[2]}× ${match[3]} sold`,
                  subtitle: `Buyer: ${match[1]}`,
                  value: `+$${match[4]}`,
                  detailLabel: 'Bazaar sale'
              };
          }
          match =
              message.match(
                  /you sold (\d+)\s*x\s+(.+?) on the item market to (.+?) for \$([\d,]+)/i
              );
          if (match) {
              return {
                  title: `${match[2]} sold`,
                  subtitle: `Buyer: ${match[3]}`,
                  value: `+$${match[4]}`,
                  detailLabel: 'Item Market'
              };
          }
          match =
              message.match(
                  /the ranked war between (.+?) and (.+?) has begun/i
              );
          if (match) {
              return {
                  title: 'Ranked War started',
                  subtitle: `${match[1]} vs ${match[2]}`,
                  value: '',
                  detailLabel: 'Faction'
              };
          }
          match =
              message.match(
                  /the ranked war between (.+?) and (.+?) will begin in (.+?)(?:\.|$)/i
              );
          if (match) {
              return {
                  title: 'Ranked War scheduled',
                  subtitle: `${match[1]} vs ${match[2]}`,
                  value: '',
                  detailLabel: match[3]
              };
          }
          match =
              message.match(
                  /(.+?) gave ([\d,]+) points to you from (.+)/i
              );
          if (match) {
              return {
                  title: 'Faction points received',
                  subtitle: `From ${match[1]} • ${match[3]}`,
                  value: `+${match[2]} points`,
                  detailLabel: 'Faction points'
              };
          }
          match =
              message.match(
                  /(.+?) decreased your (.+?) points balance by ([\d,]+) from ([\d,]+) to ([\d,]+)/i
              );
          if (match) {
              return {
                  title: 'Faction points reduced',
                  subtitle: `${match[1]} • ${match[2]}`,
                  value: `-${match[3]} points`,
                  detailLabel: `${match[4]} → ${match[5]}`
              };
          }
          match =
              message.match(
                  /(.+?) gave \$([\d,]+) to you from (.+)/i
              );
          if (match) {
              return {
                  title: 'Faction payment',
                  subtitle: `From ${match[1]} • ${match[3]}`,
                  value: `+$${match[2]}`,
                  detailLabel: 'Faction transfer'
              };
          }
          match =
              message.match(
                  /(.+?) decreased your (.+?) money balance by \$([\d,]+)/i
              );
          if (match) {
              return {
                  title: 'Faction balance reduced',
                  subtitle: `${match[1]} • ${match[2]}`,
                  value: `-$${match[3]}`,
                  detailLabel: 'Faction deduction'
              };
          }
          if (category === 'attacks') {
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Combat'
              };
          }
          if (category === 'money') {
              let cashMatch =
                  message.match(
                      /you were sent \$([\d,]+) from (.+?)(?:\s+with the message:\s*(.+))?$/i
                  );
              if (cashMatch) {
                  return {
                      title: 'Money received',
                      subtitle: `From ${cashMatch[2]}${cashMatch[3] ? ` • “${cashMatch[3]}”` : ''}`,
                      value: `+$${cashMatch[1]}`,
                      detailLabel: 'Cash'
                  };
              }
              cashMatch =
                  message.match(
                      /(.+?) sent you \$([\d,]+)/i
                  );
              if (cashMatch) {
                  return {
                      title: 'Money received',
                      subtitle: `From ${cashMatch[1]}`,
                      value: `+$${cashMatch[2]}`,
                      detailLabel: 'Cash'
                  };
              }
              return {
                  title: message,
                  subtitle: '',
                  value: '',
                  detailLabel: 'Transaction'
              };
          }
          return {
              title: message,
              subtitle: '',
              value: '',
              detailLabel: CATEGORY_INFO[category]?.label || 'Other'
          };
      }
      function renderEvents(events) {
          const list =
              document.querySelector(
                  `#${ROOT_ID} .ax-event-list`
              );
          if (!list) return;
          list.innerHTML = '';
          const groups =
              groupEvents(events);
          const availableDates = new Set(
              groups.map(group => group.date)
          );
          if (
              !state.expandedDate ||
              !availableDates.has(state.expandedDate)
          ) {
              state.expandedDate =
                  groups.find(group => group.label === 'TODAY')?.date ||
                  groups[0]?.date ||
                  '';
          }
          groups.forEach(group => {
              const section =
                  document.createElement('section');
              section.className =
                  'ax-date-group';
              section.dataset.date = group.date;
              const isActiveDate =
                  group.date === state.expandedDate;
              if (!isActiveDate) {
                  section.classList.add(
                      'ax-date-collapsed'
                  );
              }
              section.innerHTML = `
                  <div class="ax-date-header">
                      <strong>
                          ${escapeHTML(group.label)}
                      </strong>
                      <div class="ax-date-header-right">
                          <span class="ax-date-count">
                              ${group.events.length}
                              event${group.events.length === 1 ? '' : 's'}
                          </span>
                          <button
                              class="ax-date-toggle"
                              type="button"
                              aria-label="${isActiveDate ? 'Collapse date' : 'Expand date'}"
                          >
                              ${isActiveDate ? '▴' : '▾'}
                          </button>
                      </div>
                  </div>
              `;
              group.events.forEach(event => {
                  section.appendChild(
                      buildEventCard(event)
                  );
              });
              const toggle =
                  section.querySelector(
                      '.ax-date-toggle'
                  );
              const dateHeader =
                  section.querySelector(
                      '.ax-date-header'
                  );
              if (dateHeader && toggle) {
                  dateHeader.addEventListener(
                      'click',
                      event => {
                          if (event.target.closest('.ax-date-toggle')) {
                              return;
                          }
                          toggle.click();
                      }
                  );
              }
              if (toggle) {
                  toggle.addEventListener(
                      'click',
                      event => {
                          event.preventDefault();
                          event.stopPropagation();

                          const isCollapsed =
                              section.classList.contains(
                                  'ax-date-collapsed'
                              );

                          if (isCollapsed) {
                              state.expandedDate = group.date;
                              list.querySelectorAll(
                                  '.ax-date-group'
                              ).forEach(otherSection => {
                                  if (otherSection === section) {
                                      return;
                                  }

                                  otherSection.classList.add(
                                      'ax-date-collapsed'
                                  );

                                  const otherToggle =
                                      otherSection.querySelector(
                                          '.ax-date-toggle'
                                      );

                                  if (otherToggle) {
                                      otherToggle.textContent = '▾';
                                      otherToggle.setAttribute(
                                          'aria-label',
                                          'Expand date'
                                      );
                                  }
                              });

                              section.classList.remove(
                                  'ax-date-collapsed'
                              );
                              toggle.textContent = '▴';
                              toggle.setAttribute(
                                  'aria-label',
                                  'Collapse date'
                              );
                          } else {
                              state.expandedDate = '';
                              section.classList.add(
                                  'ax-date-collapsed'
                              );
                              toggle.textContent = '▾';
                              toggle.setAttribute(
                                  'aria-label',
                                  'Expand date'
                              );
                          }
                          updateCounts(state.events);
                          updateStats(state.events);
                      }
                  );
              }
              list.appendChild(section);
          });
          applyFilters();
      }
      function isLargeMoneyValue(value) {
          if (!value) return false;
          const match =
              String(value).match(
                  /[$]([\d,]+)/
              );
          if (!match) return false;
          const amount =
              Number(
                  match[1].replace(/,/g, '')
              );
          return amount >= 10000000;
      }
      function buildEventCard(event) {
          const meta =
              CATEGORY_INFO[event.category];
          const card =
              document.createElement('article');
          card.className =
              'ax-event-card';
          card.dataset.category =
              event.category;
          card.dataset.search =
              event.message.toLowerCase();
          card.style.setProperty(
              '--category-color',
              meta.color
          );
          card.style.setProperty(
              '--category-soft',
              meta.soft
          );
          card.style.setProperty(
              '--category-border',
              meta.border
          );
          if (
              isLargeMoneyValue(
                  event.display.value
              )
          ) {
              card.classList.add(
                  'ax-large-money'
              );
          }
          if (event.category === 'money') {
              const moneyDirection =
                  event.details.direction ||
                  (
                      event.display.value?.startsWith('-')
                          ? 'out'
                          : event.display.value?.startsWith('+')
                              ? 'in'
                              : null
                  );
              if (moneyDirection) {
                  card.dataset.moneyDirection =
                      moneyDirection;
              }
              if (moneyDirection === 'out') {
                  card.style.setProperty(
                      '--category-color',
                      '#ff5b54'
                  );
                  card.style.setProperty(
                      '--category-soft',
                      'rgba(255, 91, 84, .14)'
                  );
                  card.style.setProperty(
                      '--category-border',
                      'rgba(255, 91, 84, .42)'
                  );
              } else if (moneyDirection === 'in') {
                  card.style.setProperty(
                      '--category-color',
                      '#70d952'
                  );
                  card.style.setProperty(
                      '--category-soft',
                      'rgba(112, 217, 82, .14)'
                  );
                  card.style.setProperty(
                      '--category-border',
                      'rgba(112, 217, 82, .42)'
                  );
              }
          }
          if (
              event.category === 'hospital' &&
              event.display.hospitalSubtype
          ) {
              card.dataset.hospitalSubtype =
                  event.display.hospitalSubtype;
          }
          if (
              event.category === 'bounties' &&
              event.display.bountySubtype
          ) {
              card.dataset.bountySubtype =
                  event.display.bountySubtype;
          }
          if (event.category === 'bets') {
              const betLost =
                  /^\s*you lost/i.test(event.message);
              const betWon =
                  /^\s*you won/i.test(event.message);
              if (betLost) {
                  card.style.setProperty(
                      '--category-color',
                      '#ff626f'
                  );
                  card.style.setProperty(
                      '--category-soft',
                      'rgba(255, 98, 111, .16)'
                  );
                  card.style.setProperty(
                      '--category-border',
                      'rgba(255, 98, 111, .46)'
                  );
                  card.dataset.betResult = 'lost';
              } else if (betWon) {
                  card.dataset.betResult = 'won';
              }
          }
          let detailHTML = '';
          if (
              !event.display.hideQuickDetails &&
              event.display.value
          ) {
              let cls = 'ax-money-neutral';
              if (event.display.valueStyle === 'bounty') {
                  cls = 'ax-bounty-value';
              } else if (event.display.value.startsWith('+')) {
                  cls =
                      event.category === 'racing'
                          ? 'ax-points'
                          : 'ax-money-in';
              } else if (event.display.value.startsWith('-')) {
                  cls = 'ax-money-out';
              }
              detailHTML += `
                  <strong class="${cls}">
                      ${escapeHTML(event.display.value)}
                  </strong>
              `;
          } else if (
              !event.display.hideQuickDetails &&
              event.details.amount !== null
          ) {
              let cls =
                  'ax-money-neutral';
              let prefix = '';
              if (
                  event.details.direction === 'in'
              ) {
                  cls = 'ax-money-in';
                  prefix = '+';
              }
              if (
                  event.details.direction === 'out'
              ) {
                  cls = 'ax-money-out';
                  prefix = '-';
              }
              detailHTML += `
                  <strong class="${cls}">
                      ${prefix}$${formatNumber(
                          event.details.amount
                      )}
                  </strong>
              `;
          }
          if (
              !event.display.hideQuickDetails &&
              event.details.secondary &&
              event.details.secondary !==
                  event.display.subtitle
          ) {
              detailHTML += `
                  <span class="ax-secondary">
                      ${escapeHTML(
                          event.details.secondary
                      )}
                  </span>
              `;
          }
          if (
              !event.display.hideQuickDetails &&
              event.display.detailLabel &&
              !detailHTML
          ) {
              detailHTML = `
                  <span class="ax-context-label">
                      ${escapeHTML(
                          event.display.detailLabel
                      )}
                  </span>
              `;
          }
          if (
              !detailHTML &&
              !event.display.hideQuickDetails
          ) {
              detailHTML = `
                  <span class="ax-category-label">
                      ${meta.label}
                  </span>
              `;
          }
          card.innerHTML = `
              <div class="ax-accent"></div>
              <div class="ax-event-primary">
                  <div class="ax-event-badge">
                      ${
                          event.category === 'hospital' &&
                          event.display.hospitalSubtype === 'revive'
                              ? '♥'
                              : event.category === 'bounties' &&
                                event.display.bountySubtype === 'placed'
                                  ? '◎'
                                  : event.category === 'bounties' &&
                                    event.display.bountySubtype === 'received'
                                      ? '!'
                                      : event.category === 'bounties' &&
                                        event.display.bountySubtype === 'ended'
                                          ? '×'
                                          : meta.glyph
                      }
                  </div>
                  <div class="ax-event-copy">
                      <div class="ax-event-title">
                          ${formatDisplayText(
                              event.display.title
                          )}
                      </div>
                      ${
                          event.display.subtitle
                              ? `
                                  <div class="ax-event-subtitle">
                                      ${escapeHTML(
                                          event.display.subtitle
                                      )}
                                  </div>
                              `
                              : ''
                      }
                  </div>
              </div>
              <div class="ax-event-details">
                  ${detailHTML}
                  ${
                      event.viewLink
                          ? `
                              <a
                                  class="ax-view-inline"
                                  href="${escapeHTML(event.viewLink.href)}"
                              >
                                  View
                              </a>
                          `
                          : ''
                  }
              </div>
              <div class="ax-event-expanded">
                  <div class="ax-expanded-label">ORIGINAL EVENT</div>
                  <div class="ax-expanded-message">
                      ${formatOriginalMessage(event.message)}
                  </div>
                  <div class="ax-pda-native-actions" aria-hidden="true">
                      <span class="ax-pda-native-actions-slot"></span>
                  </div>
              </div>
              <div class="ax-event-time">
                  <span class="ax-time-value">
                      ${escapeHTML(event.time)}
                  </span>
                  <span class="ax-date-value">
                      ${escapeHTML(event.date)}
                  </span>
              </div>
              <div class="ax-actions"></div>
          `;
          restoreLinks(
              card,
              event.links
          );
          copyButtons(
              card,
              event.buttonsEl,
              event.nativeActionEls,
              event.message,
              event.row,
              event.time,
              event.date
          );
          addViewAction(
              card,
              event.viewLink
          );
          card.addEventListener(
              'click',
              clickEvent => {
                  if (
                      clickEvent.target.closest(
                          'a, button, .ax-actions'
                      )
                  ) {
                      return;
                  }

                  const cardKey =
                      `${event.date}|${event.time}|${event.message}`;
                  const now =
                      performance.now();
                  if (
                      state.lastCardToggleKey === cardKey &&
                      now - state.lastCardToggleAt < 220
                  ) {
                      return;
                  }
                  state.lastCardToggleKey =
                      cardKey;
                  state.lastCardToggleAt =
                      now;

                  const willOpen =
                      !card.classList.contains(
                          'ax-expanded-open'
                      );

                  if (
                      isPDAView() &&
                      willOpen
                  ) {
                      card
                          .closest('.ax-event-list')
                          ?.querySelectorAll(
                              '.ax-event-card.ax-expanded-open'
                          )
                          .forEach(openCard => {
                              if (openCard !== card) {
                                  openCard.classList.remove(
                                      'ax-expanded-open'
                                  );
                              }
                          });
                  }

                  if (willOpen) {
                      card.classList.add(
                          'ax-expanded-open'
                      );
                  } else {
                      card.classList.remove(
                          'ax-expanded-open'
                      );

                      if (
                          !isPDAView() &&
                          state.pendingNativeRefresh
                      ) {
                          state.pendingNativeRefresh =
                              false;
                          clearTimeout(
                              state.refreshTimer
                          );
                          state.refreshTimer =
                              setTimeout(
                                  refreshDashboard,
                                  80
                              );
                      }
                  }
              }
          );
          return card;
      }
      function formatDisplayText(text) {
          let html =
              escapeHTML(text);
          html =
              html.replace(
                  /\b(\d+)(st|nd|rd|th)\b/gi,
                  '<strong class="ax-position">$1$2</strong>'
              );
          html =
              html.replace(
                  /\b(\d+)\s*x\b/gi,
                  '<strong class="ax-quantity">$1×</strong>'
              );
          return html;
      }
      function restoreLinks(card, links) {
          const title =
              card.querySelector(
                  '.ax-event-title'
              );
          if (!title) return;
          let html =
              title.innerHTML;
          links.forEach(link => {
              if (!link.text) return;
              const escaped =
                  escapeHTML(link.text);
              if (!html.includes(escaped)) {
                  return;
              }
              html =
                  html.replace(
                      escaped,
                      `<a href="${escapeHTML(
                          link.href
                      )}">${escaped}</a>`
                  );
          });
          title.innerHTML = html;
      }
      function addViewAction(card, viewLink) {
          if (!viewLink) return;
          const target =
              card.querySelector(
                  '.ax-actions'
              );
          if (!target) return;
          const link =
              document.createElement('a');
          link.className = 'ax-view-action';
          link.href = viewLink.href;
          const actionLabel =
              viewLink.label ||
              'View event';
          link.setAttribute(
              'aria-label',
              actionLabel
          );
          link.title = actionLabel;
          link.textContent = '↗';
          target.prepend(link);
      }
      function copyButtons(
          card,
          buttonsGroup,
          fallbackActions = [],
          message = '',
          sourceRow = null,
          eventTime = '',
          eventDate = ''
      ) {
          const target =
              card.querySelector(
                  '.ax-actions'
              );
          if (!target) return;
          const getLiveRow = () => {
              if (sourceRow?.isConnected) {
                  return sourceRow;
              }
              return getNativeRows()
                  .find(row => {
                      const msgEl =
                          row.querySelector(
                              '[class*="message"], [data-sakalux-event-message]'
                          );
                      const timeEl =
                          row.querySelector(
                              'time[class*="dateTime"], [data-sakalux-event-time]'
                          );
                      if (!msgEl || !timeEl) {
                          return false;
                      }
                      const rowMessage =
                          cleanText(
                              msgEl.textContent
                          );
                      const rowTimeText =
                          cleanText(
                              timeEl.innerText ||
                              timeEl.textContent ||
                              ''
                          );
                      return (
                          rowMessage === message &&
                          (
                              !eventTime ||
                              rowTimeText.includes(
                                  eventTime
                              )
                          ) &&
                          (
                              !eventDate ||
                              rowTimeText.includes(
                                  eventDate
                              )
                          )
                      );
                  }) || null;
          };
          const getNativeActionGroup = () => {
              const liveRow =
                  getLiveRow();
              return liveRow?.querySelector(
                  '[class*="buttonsGroup"]'
              ) || null;
          };
          const getNativeCopy = () => {
              const group =
                  getNativeActionGroup();
              if (!group) return null;
              return (
                  [
                      ...group.querySelectorAll(
                          'button'
                      )
                  ].find(button => {
                      const aria =
                          cleanText(
                              button.getAttribute(
                                  'aria-label'
                              )
                          ).toLowerCase();
                      const text =
                          cleanText(
                              button.textContent
                          ).toLowerCase();
                      return (
                          aria === 'copy event' ||
                          aria === 'copy' ||
                          text === 'copy'
                      );
                  }) ||
                  group.querySelector('button') ||
                  null
              );
          };
          const getNativeSave = () => {
              const liveRow =
                  getLiveRow();
              return (
                  liveRow?.querySelector(
                      'button[class*="saveButton"]'
                  ) ||
                  null
              );
          };
          const isSaved = nativeSave => {
              if (!nativeSave) {
                  return false;
              }
              const wrapper =
                  nativeSave.closest(
                      '[class*="save___"]'
                  ) ||
                  nativeSave.parentElement;
              const cls =
                  cleanText(
                      wrapper?.className?.baseVal ||
                      wrapper?.className ||
                      ''
                  );
              return /(?:^|\s)active___/i.test(
                  cls
              );
          };
          const buildDesktopActions = () => {
              const copyButton =
                  document.createElement(
                      'button'
                  );
              copyButton.className =
                  'ax-action-btn ax-action-copy';
              copyButton.type = 'button';
              copyButton.setAttribute(
                  'aria-label',
                  'Copy event'
              );
              copyButton.innerHTML =
                  '<span class="ax-copy-glyph" aria-hidden="true"></span>';
              copyButton.addEventListener(
                  'click',
                  async event => {
                      event.preventDefault();
                      event.stopPropagation();
                      const nativeCopy =
                          getNativeCopy();
                      if (nativeCopy) {
                          nativeCopy.click();
                          nativeCopy.blur?.();
                      } else {
                          try {
                              await navigator.clipboard.writeText(
                                  message
                              );
                          } catch (error) {
                              const textarea =
                                  document.createElement(
                                      'textarea'
                                  );
                              textarea.value =
                                  message;
                              textarea.style.position =
                                  'fixed';
                              textarea.style.opacity =
                                  '0';
                              document.body.appendChild(
                                  textarea
                              );
                              textarea.select();
                              document.execCommand(
                                  'copy'
                              );
                              textarea.remove();
                          }
                      }
                      copyButton.classList.add(
                          'ax-action-success'
                      );
                      setTimeout(
                          () =>
                              copyButton.classList.remove(
                                  'ax-action-success'
                              ),
                          700
                      );
                  }
              );
              target.appendChild(
                  copyButton
              );
              const saveButton =
                  document.createElement(
                      'button'
                  );
              saveButton.className =
                  'ax-action-btn ax-action-save';
              saveButton.type = 'button';
              const syncDesktopSave = () => {
                  const nativeSave =
                      getNativeSave();
                  const saved =
                      isSaved(
                          nativeSave
                      );
                  saveButton.classList.toggle(
                      'ax-saved',
                      saved
                  );
                  saveButton.textContent =
                      saved
                          ? '★'
                          : '☆';
                  saveButton.setAttribute(
                      'aria-label',
                      saved
                          ? 'Unsave event'
                          : 'Save event'
                  );
              };
              saveButton.addEventListener(
                  'click',
                  event => {
                      event.preventDefault();
                      event.stopPropagation();
                      const nativeSave =
                          getNativeSave();
                      if (!nativeSave) {
                          return;
                      }
                      nativeSave.click();
                      nativeSave.blur?.();
                      nativeSave.setAttribute?.(
                          'data-is-tooltip-opened',
                          'false'
                      );
                      [
                          100,
                          300,
                          700
                      ].forEach(delay => {
                          setTimeout(
                              syncDesktopSave,
                              delay
                          );
                      });
                  }
              );
              target.appendChild(
                  saveButton
              );
              syncDesktopSave();
              const liveRow =
                  getLiveRow();
              if (liveRow) {
                  const observer =
                      new MutationObserver(
                          syncDesktopSave
                      );
                  observer.observe(
                      liveRow,
                      {
                          attributes: true,
                          subtree: true,
                          attributeFilter: [
                              'class'
                          ]
                      }
                  );
              }
          };
          const setupPDAActions = () => {
              const slot =
                  card.querySelector(
                      '.ax-pda-native-actions-slot'
                  );
              const liveRow =
                  getLiveRow();
              if (
                  !slot ||
                  !liveRow
              ) {
                  return;
              }
              const originalParent =
                  liveRow.parentNode;
              if (!originalParent) {
                  return;
              }
              const homeMarker =
                  document.createComment(
                      'sakalux-native-event-home'
                  );
              originalParent.insertBefore(
                  homeMarker,
                  liveRow
              );
              let openingNative =
                  false;
              const getContentGroup = () =>
                  liveRow.querySelector(
                      '[class*="contentGroup"]'
                  );
              const getButtonsGroup = () =>
                  liveRow.querySelector(
                      '[class*="buttonsGroup"]'
                  );
              const nativeIsExpanded = () => {
                  const rowClass =
                      cleanText(
                          liveRow.className
                      );
                  const contentClass =
                      cleanText(
                          getContentGroup()?.className
                      );
                  return (
                      /buttonsExpanded/i.test(
                          rowClass
                      ) ||
                      /buttonsExpanded/i.test(
                          contentClass
                      )
                  );
              };
              const prepareNativeRow = () => {
                  liveRow.classList.add(
                      'ax-pda-native-event-row'
                  );
                  const content =
                      getContentGroup();
                  const buttons =
                      getButtonsGroup();
                  if (content) {
                      content.classList.add(
                          'ax-pda-native-event-content'
                      );
                  }
                  if (buttons) {
                      buttons.classList.add(
                          'ax-pda-native-event-buttons'
                      );
                      const send =
                          buttons.querySelector(
                              '[class*="send"]'
                          );
                      if (send) {
                          send.classList.add(
                              'ax-pda-native-event-send'
                          );
                      }
                      [
                          ...buttons.querySelectorAll(
                              'button'
                          )
                      ].forEach(button => {
                          button.removeAttribute(
                              'title'
                          );
                          button.setAttribute(
                              'data-is-tooltip-opened',
                              'false'
                          );
                      });
                  }
              };
              const clearNativeRow = () => {
                  liveRow.classList.remove(
                      'ax-pda-native-event-row'
                  );
                  getContentGroup()?.classList.remove(
                      'ax-pda-native-event-content'
                  );
                  const buttons =
                      getButtonsGroup();
                  buttons?.classList.remove(
                      'ax-pda-native-event-buttons'
                  );
                  buttons
                      ?.querySelector(
                          '[class*="send"]'
                      )
                      ?.classList.remove(
                          'ax-pda-native-event-send'
                      );
              };
              const moveWholeRowIntoPanel = () => {
                  if (
                      liveRow.parentNode !== slot
                  ) {
                      state.suppressNativeRefresh =
                          true;
                      slot.appendChild(
                          liveRow
                      );
                      setTimeout(() => {
                          state.suppressNativeRefresh =
                              false;
                      }, 350);
                  }
                  prepareNativeRow();
              };
              const restoreWholeRow = () => {
                  if (
                      !homeMarker.parentNode
                  ) {
                      return;
                  }
                  if (
                      liveRow.parentNode ===
                      homeMarker.parentNode
                  ) {
                      clearNativeRow();
                      return;
                  }
                  state.suppressNativeRefresh =
                      true;
                  clearNativeRow();
                  homeMarker.parentNode.insertBefore(
                      liveRow,
                      homeMarker.nextSibling
                  );
                  requestAnimationFrame(() => {
                      state.suppressNativeRefresh =
                          false;
                  });
              };
              const openNativeThenMove = () => {
                  if (
                      nativeIsExpanded() &&
                      getButtonsGroup()
                  ) {
                      moveWholeRowIntoPanel();
                      return;
                  }
                  if (openingNative) {
                      return;
                  }
                  openingNative = true;
                  const content =
                      getContentGroup();
                  if (content) {
                      content.click();
                  }
                  let attempts = 0;
                  const waitForButtons =
                      setInterval(() => {
                          attempts += 1;
                          if (
                              getButtonsGroup()
                          ) {
                              clearInterval(
                                  waitForButtons
                              );
                              openingNative = false;
                              moveWholeRowIntoPanel();
                              return;
                          }
                          if (
                              attempts >= 30
                          ) {
                              clearInterval(
                                  waitForButtons
                              );
                              openingNative = false;
                          }
                      }, 50);
              };
              const sync = () => {
                  if (
                      card.classList.contains(
                          'ax-expanded-open'
                      )
                  ) {
                      openNativeThenMove();
                  } else {
                      restoreWholeRow();
                  }
              };
              const observer =
                  new MutationObserver(
                      sync
                  );
              observer.observe(
                  card,
                  {
                      attributes: true,
                      attributeFilter: [
                          'class'
                      ]
                  }
              );
              sync();
          };
          if (isPDAView() && !isWidePDAView()) {
              setupPDAActions();
          } else {
              buildDesktopActions();
          }
      }
      function groupEvents(events) {
          const map = new Map();
          events.forEach(event => {
              if (!map.has(event.date)) {
                  map.set(event.date, []);
              }
              map.get(event.date).push(event);
          });
          return [...map.entries()]
              .map(([date, groupEvents]) => {
                  const label = getDateLabel(date);
                  return {
                      date,
                      label,
                      events: groupEvents
                  };
              });
      }
      function getDateLabel(date) {
          const parts =
              date.split('/')
                  .map(Number);
          if (parts.length !== 3) {
              return date;
          }
          let [
              day,
              month,
              year
          ] = parts;
          if (year < 100) {
              year += 2000;
          }
          const eventDate =
              new Date(
                  year,
                  month - 1,
                  day
              );
          const today =
              new Date();
          eventDate.setHours(
              0, 0, 0, 0
          );
          today.setHours(
              0, 0, 0, 0
          );
          const yesterday =
              new Date(today);
          yesterday.setDate(
              yesterday.getDate() - 1
          );
          if (
              eventDate.getTime() ===
              today.getTime()
          ) {
              return 'TODAY';
          }
          if (
              eventDate.getTime() ===
              yesterday.getTime()
          ) {
              return 'YESTERDAY';
          }
          return date;
      }
      function bindControls() {
          const root =
              document.getElementById(
                  ROOT_ID
              );
          root
              .querySelectorAll(
                  '.ax-filter'
              )
              .forEach(button => {
                  button.addEventListener(
                      'click',
                      () => {
                          state.filter =
                              button.dataset.filter;
                          root
                              .querySelectorAll(
                                  '.ax-filter'
                              )
                              .forEach(other => {
                                  other.classList.toggle(
                                      'active',
                                      other === button
                                  );
                              });
                          applyFilters();
                      }
                  );
              });
          const search =
              root.querySelector(
                  '.ax-search'
              );
          search.addEventListener(
              'input',
              () => {
                  state.search =
                      search.value
                          .trim()
                          .toLowerCase();
                  applyFilters();
              }
          );
          root
              .querySelector(
                  '.ax-search-clear'
              )
              .addEventListener(
                  'click',
                  () => {
                      search.value = '';
                      state.search = '';
                      applyFilters();
                  }
              );
          root
              .querySelector(
                  '.ax-clear'
              )
              .addEventListener(
                  'click',
                  () => {
                      state.filter = 'all';
                      state.search = '';
                      search.value = '';
                      root
                          .querySelectorAll(
                              '.ax-filter'
                          )
                          .forEach(btn => {
                              btn.classList.toggle(
                                  'active',
                                  btn.dataset.filter === 'all'
                              );
                          });
                      applyFilters();
                  }
              );
          root
              .querySelector(
                  '.ax-refresh'
              )
              .addEventListener(
                  'click',
                  refreshDashboard
              );
          root
              .querySelector(
                  '.ax-filter-more'
              )
              ?.addEventListener(
                  'click',
                  event => {
                      state.showAllFilters =
                          !state.showAllFilters;
                      const label =
                          event.currentTarget.querySelector(
                              '.ax-filter-more-label'
                          );
                      const chevron =
                          event.currentTarget.querySelector(
                              '.ax-filter-more-chevron'
                          );
                      if (label) {
                          label.textContent =
                              state.showAllFilters
                                  ? 'Hide zero-count filters'
                                  : 'Show all filters';
                      }
                      if (chevron) {
                          chevron.textContent =
                              state.showAllFilters
                                  ? '‹'
                                  : '›';
                      }
                      updateFilterVisibility();
                  }
              );
      }
      function applyFilters() {
          const root =
              document.getElementById(
                  ROOT_ID
              );
          let visible = 0;
          root
              .querySelectorAll(
                  '.ax-event-card'
              )
              .forEach(card => {
                  const categoryMatch =
                      state.filter === 'all' ||
                      card.dataset.category ===
                          state.filter;
                  const searchMatch =
                      !state.search ||
                      card.dataset.search.includes(
                          state.search
                      );
                  const show =
                      categoryMatch &&
                      searchMatch;
                  card.classList.toggle(
                      'ax-hidden',
                      !show
                  );
                  if (show) {
                      visible++;
                  }
              });
          root
              .querySelectorAll(
                  '.ax-date-group'
              )
              .forEach(group => {
                  const visibleCards =
                      group.querySelectorAll(
                          '.ax-event-card:not(.ax-hidden)'
                      );
                  group.classList.toggle(
                      'ax-hidden',
                      !visibleCards.length
                  );
                  const count =
                      group.querySelector(
                          '.ax-date-count'
                      );
                  if (count) {
                      count.textContent =
                          `${visibleCards.length} event${
                              visibleCards.length === 1
                                  ? ''
                                  : 's'
                          }`;
                  }
              });
          root
              .querySelector(
                  '.ax-empty'
              )
              .classList.toggle(
                  'active',
                  visible === 0
              );
          const total =
              root.querySelectorAll(
                  '.ax-event-card'
              ).length;
          const countDisplay =
              root.querySelector(
                  '.ax-visible-count'
              );
          if (countDisplay) {
              countDisplay.textContent =
                  `${visible} / ${total}`;
          }
          updateStats(state.events);
      }
      function updateCounts(events) {
          const activeDate = state.expandedDate;
          const visibleEvents = activeDate
              ? events.filter(event => event.date === activeDate)
              : [];

          const counts = {
              all: visibleEvents.length,
              money: 0,
              bets: 0,
              items: 0,
              armory: 0,
              trades: 0,
              attacks: 0,
              racing: 0,
              hospital: 0,
              bounties: 0,
              jail: 0,
              crimes: 0,
              stocks: 0,
              education: 0,
              drugs: 0,
              property: 0,
              company: 0,
              travel: 0,
              marriage: 0,
              rewards: 0,
              faction: 0,
              other: 0
          };
          visibleEvents.forEach(event => {
              if (Object.prototype.hasOwnProperty.call(counts, event.category)) {
                  counts[event.category]++;
              } else {
                  counts.other++;
              }
          });
          Object.entries(counts)
              .forEach(([key, value]) => {
                  const el =
                      document.querySelector(
                          `#${ROOT_ID} [data-count="${key}"]`
                      );
                  if (el) {
                      el.textContent = value;
                  }
              });
          updateFilterVisibility();
      }
      function updateFilterVisibility() {
          const root =
              document.getElementById(
                  ROOT_ID
              );
          if (!root) return;
          root
              .querySelectorAll(
                  '.ax-filter'
              )
              .forEach(button => {
                  if (
                      button.dataset.filter === 'all'
                  ) {
                      button.classList.remove(
                          'ax-zero-hidden'
                      );
                      return;
                  }
                  const count =
                      Number(
                          button.querySelector(
                              '.ax-filter-count'
                          )?.textContent || 0
                      );
                  const isSecondary =
                      button.classList.contains(
                          'ax-filter-secondary'
                      );
                  button.classList.toggle(
                      'ax-zero-hidden',
                      !state.showAllFilters &&
                      (count === 0 || isSecondary)
                  );
              });
          const hiddenFilterCount =
              [...root.querySelectorAll(
                  '.ax-filter'
              )]
                  .filter(button => {
                      if (
                          button.dataset.filter === 'all'
                      ) {
                          return false;
                      }
                      const count = Number(
                          button.querySelector(
                              '.ax-filter-count'
                          )?.textContent || 0
                      );
                      return (
                          count === 0 ||
                          button.classList.contains(
                              'ax-filter-secondary'
                          )
                      );
                  })
                  .length;
          const moreButton =
              root.querySelector(
                  '.ax-filter-more'
              );
          if (moreButton) {
              moreButton.style.display =
                  hiddenFilterCount > 0
                      ? ''
                      : 'none';
          }
      }
      function updateStats(events) {
          const activeDate = state.expandedDate;
          const activeEvents = activeDate
              ? events.filter(event => event.date === activeDate)
              : [];
          const activeLabel = activeDate
              ? getDateLabel(activeDate)
              : 'NONE';
          const statsTitle =
              document.querySelector(
                  `#${ROOT_ID} .ax-stats-title`
              );
          if (statsTitle) {
              statsTitle.textContent =
                  `${activeLabel} - QUICK STATS`;
          }
          let moneyIn = 0;
          let moneyOut = 0;
          let internalTransfers = 0;
          let items = 0;
          let racingPoints = 0;
          let itemSales = 0;
          let bountiesClaimed = 0;
          let eventsToday = 0;
          activeEvents.forEach(event => {
              if (
                  event.details.direction ===
                  'in'
              ) {
                  moneyIn +=
                      event.details.amount || 0;
              }
              if (
                  event.details.direction ===
                  'out'
              ) {
                  moneyOut +=
                      event.details.amount || 0;
              }
              if (
                  event.details.internalTransfer
              ) {
                  internalTransfers +=
                      event.details.amount || 0;
              }
              items +=
                  event.details.itemQuantity || 0;
              racingPoints +=
                  event.details.racingPoints || 0;
              if (
                  event.category === 'items' &&
                  event.details.direction === 'in'
              ) {
                  itemSales +=
                      event.details.amount || 0;
              }
              if (
                  event.category === 'bounties'
              ) {
                  bountiesClaimed++;
              }
              eventsToday++;
          });
          setText(
              '.ax-stat-money-in',
              `+$${formatNumber(moneyIn)}`
          );
          setText(
              '.ax-stat-money-out',
              `-$${formatNumber(moneyOut)}`
          );
          const netCash =
              moneyIn - moneyOut;
          setText(
              '.ax-stat-net',
              `${netCash >= 0 ? '+' : '-'}$${formatNumber(
                  Math.abs(netCash)
              )}`
          );
          setText(
              '.ax-stat-transfers',
              `$${formatNumber(
                  internalTransfers
              )}`
          );
          const netEl =
              document.querySelector(
                  `#${ROOT_ID} .ax-stat-net`
              );
          if (netEl) {
              netEl.classList.toggle(
                  'ax-net-positive',
                  netCash >= 0
              );
              netEl.classList.toggle(
                  'ax-net-negative',
                  netCash < 0
              );
          }
          setText(
              '.ax-stat-items',
              formatNumber(items)
          );
          setText(
              '.ax-stat-item-sales',
              `+$${formatNumber(itemSales)}`
          );
          setText(
              '.ax-stat-bounties',
              formatNumber(bountiesClaimed)
          );
          setText(
              '.ax-stat-today',
              formatNumber(eventsToday)
          );
          setText(
              '.ax-stat-racing',
              formatNumber(
                  racingPoints
              )
          );
      }
      function setText(selector, text) {
          const el =
              document.querySelector(
                  `#${ROOT_ID} ${selector}`
              );
          if (el) {
              el.textContent = text;
          }
      }
      function observeNativeList() {
          if (!state.nativeList) return;
          state.observer?.disconnect();
          if (isPDAView()) {
              return;
          }
          state.observer =
              new MutationObserver(() => {
                  if (
                      state.suppressNativeRefresh
                  ) {
                      return;
                  }

                  if (
                      !isPDAView() &&
                      document.querySelector(
                          `#${ROOT_ID} .ax-event-card.ax-expanded-open`
                      )
                  ) {
                      state.pendingNativeRefresh =
                          true;
                      return;
                  }

                  clearTimeout(
                      state.refreshTimer
                  );
                  state.refreshTimer =
                      setTimeout(
                          refreshDashboard,
                          250
                      );
              });
          state.observer.observe(
              state.nativeList,
              {
                  childList: true,
                  subtree: true
              }
          );
      }
      function formatOriginalMessage(message) {
          return escapeHTML(message)
              .replace(
                  /\b(\$[\d,]+)\b/g,
                  '<strong class="ax-original-money">$1</strong>'
              )
              .replace(
                  /\b(\d+)(st|nd|rd|th)\b/gi,
                  '<strong class="ax-original-position">$1$2</strong>'
              );
      }
      function cleanText(text) {
          return String(
              text || ''
          )
              .replace(/\s+/g, ' ')
              .trim();
      }
      function formatNumber(value) {
          return Number(
              value || 0
          ).toLocaleString(
              'en-US'
          );
      }
      function escapeHTML(value) {
          return String(
              value ?? ''
          )
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
      }
      function injectCSS() {
          if (document.getElementById(STYLE_ID)) return;
          const style = document.createElement('style');
          style.id = STYLE_ID;
          style.textContent = `
              .ax-native-list-hidden {
                  display: none !important;
              }
              @media(max-width: 700px) {
                  .ax-native-list-hidden {
                      display: block !important;
                      position: fixed !important;
                      left: -200vw !important;
                      top: 0 !important;
                      width: min(420px, 100vw) !important;
                      height: auto !important;
                      max-height: none !important;
                      margin: 0 !important;
                      padding: 0 !important;
                      overflow: visible !important;
                      visibility: visible !important;
                      opacity: 0.001 !important;
                      pointer-events: none !important;
                      z-index: -1 !important;
                  }
                  #${ROOT_ID} .ax-pda-native-event-row {
                      opacity: 1 !important;
                      visibility: visible !important;
                      pointer-events: auto !important;
                      z-index: auto !important;
                  }
              }
              #${ROOT_ID} {
                  --panel: var(--sakalux-panel);
                  --border: var(--sakalux-border-soft);
                  width: 100%;
                  margin-top: 7px;
                  margin-bottom: 10px;
                  color: var(--sakalux-text);
                  font-family:
                      Arial,
                      Helvetica,
                      sans-serif;
              }
              #${ROOT_ID} *,
              #${ROOT_ID} *::before,
              #${ROOT_ID} *::after {
                  box-sizing: border-box;
              }
              .ax-layout {
                  display: grid;
                  grid-template-columns: 164px minmax(0, 1fr);
                  gap: 8px;
              }
              .ax-sidebar {
                  display: flex;
                  flex-direction: column;
                  gap: 7px;
                  position: sticky;
                  top: 6px;
                  align-self: start;
                  max-height: calc(100vh - 12px);
              }
              .ax-panel {
                  border: 1px solid var(--border);
                  border-radius: 6px;
                  background:
                      linear-gradient(
                          180deg,
                          rgba(255,255,255,.025),
                          rgba(255,255,255,.005)
                      ),
                      var(--panel);
                  overflow: hidden;
              }
              .ax-panel-title {
                  padding: 8px 9px 6px;
                  border-bottom: 1px solid var(--sakalux-border-soft);
                  color: var(--sakalux-text-soft);
                  font-size: 9px;
                  font-weight: 900;
              }
              .ax-stats-panel {
                  margin-top: 7px;
                  border-top: 2px solid var(--sakalux-gold-deep);
                  box-shadow: 0 -3px 10px rgba(0,0,0,.16);
              }
              .ax-stats-title {
                  color: var(--sakalux-gold-bright);
                  letter-spacing: .55px;
                  background: color-mix(in srgb, var(--sakalux-gold) 5%, var(--sakalux-panel));
              }
              .ax-filter-list {
                  padding: 3px;
                  max-height: 58vh;
                  overflow-y: auto;
                  scrollbar-width: thin;
              }
              .ax-filter-more {
                  width: calc(100% - 12px);
                  min-height: 25px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 4px;
                  margin: 2px 6px 5px;
                  padding: 0;
                  border: 1px solid transparent;
                  border-radius: 5px;
                  background: transparent;
                  color: var(--sakalux-muted);
                  font-size: 7.8px;
                  font-weight: 700;
                  cursor: pointer;
              }
              .ax-filter-more:hover {
                  color: var(--sakalux-gold-bright);
                  border-color: color-mix(in srgb, var(--sakalux-gold) 20%, transparent);
                  background: color-mix(in srgb, var(--sakalux-gold) 5%, transparent);
              }
              .ax-filter-more-chevron {
                  font-size: 11px;
                  line-height: 1;
                  opacity: .8;
              }
              .ax-filter.ax-zero-hidden {
                  display: none;
              }
              .ax-filter.active {
                  box-shadow:
                      inset 3px 0 0 var(--filter-color),
                      inset 0 0 0 1px var(--filter-border);
              }
              .ax-filter-secondary {
                  opacity: .92;
              }
              .ax-filter {
                  width: 100%;
                  min-height: 32px;
                  display: grid;
                  grid-template-columns: 24px 1fr auto;
                  gap: 5px;
                  align-items: center;
                  padding: 2px 6px;
                  border: 0;
                  border-bottom: 1px solid rgba(255,255,255,.045);
                  border-radius: 4px;
                  background: transparent;
                  color: #ddd;
                  cursor: pointer;
                  text-align: left;
              }
              .ax-filter:hover {
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--filter-color) 10%, transparent),
                          transparent 72%
                      );
              }
              .ax-filter.active {
                  position: relative;
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--filter-color) 24%, transparent),
                          color-mix(in srgb, var(--filter-color) 6%, transparent)
                      );
                  outline: 1px solid var(--filter-border);
              }
              .ax-filter.active::before {
                  content: '';
                  position: absolute;
                  left: -3px;
                  top: 5px;
                  bottom: 5px;
                  width: 3px;
                  border-radius: 2px;
                  background: var(--filter-color);
                  box-shadow: 0 0 6px color-mix(in srgb, var(--filter-color) 35%, transparent);
              }
              .ax-filter-badge {
                  width: 22px;
                  height: 22px;
                  display: grid;
                  place-items: center;
                  border-radius: 50%;
                  border: 1px solid var(--filter-border);
                  background: var(--filter-soft) !important;
                  background-image: none !important;
                  color: var(--filter-color);
                  font-size: 10px;
                  font-weight: 800;
                  line-height: 1;
                  font-family: Arial, Helvetica, sans-serif;
                  mask: none !important;
                  -webkit-mask: none !important;
                  box-shadow: none;
                  overflow: hidden;
              }
              .ax-filter-badge::before,
              .ax-filter-badge::after {
                  display: none !important;
                  content: none !important;
                  background: none !important;
                  background-image: none !important;
                  mask: none !important;
                  -webkit-mask: none !important;
              }
              .ax-filter.active .ax-filter-badge {
                  box-shadow: 0 0 0 1px color-mix(in srgb, var(--filter-color) 28%, transparent);
              }
              .ax-filter-name {
                  font-size: 10px;
                  color: color-mix(in srgb, var(--filter-color) 26%, #f2f5f7);
              }
              .ax-filter-count {
                  min-width: 22px;
                  padding: 2px 4px;
                  border-radius: 4px;
                  border: 1px solid color-mix(in srgb, var(--filter-color) 18%, transparent);
                  background: color-mix(in srgb, var(--filter-color) 8%, rgba(255,255,255,.04));
                  color: #eef2f5;
                  text-align: center;
                  font-size: 8px;
                  font-weight: 700;
              }
              .ax-stat-row {
                  min-height: 27px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 3px 9px;
                  font-size: 8.7px;
              }
              .ax-stat-money-in {
                  color: #6ed54f;
              }
              .ax-stat-money-out {
                  color: #ff5a52;
              }
              .ax-stat-transfers {
                  color: #8bc1e7;
              }
              .ax-stat-items {
                  color: #45a4ff;
              }
              .ax-stat-item-sales {
                  color: #70d952;
              }
              .ax-stat-bounties {
                  color: #ff9a61;
              }
              .ax-stat-today {
                  color: #d7dce0;
              }
              .ax-stat-racing {
                  color: #efbf27;
              }
              .ax-tct {
                  color: #767d82;
                  text-align: center;
                  font-size: 8px;
              }
              .ax-main {
                  min-width: 0;
              }
              .ax-toolbar {
                  display: grid;
                  grid-template-columns: minmax(0,1fr) auto 31px auto;
                  gap: 5px;
                  margin-bottom: 6px;
              }
              .ax-visible-count {
                  min-width: 52px;
                  height: 34px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0 9px;
                  border: 1px solid rgba(255,255,255,.08);
                  border-radius: 999px;
                  background: rgba(255,255,255,.025);
                  color: #8f979d;
                  font-size: 8px;
                  font-weight: 800;
                  white-space: nowrap;
              }
              .ax-search-wrap {
                  height: 34px;
                  display: grid;
                  grid-template-columns: 29px 1fr 28px;
                  align-items: center;
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  background: var(--panel);
                  overflow: hidden;
              }
              .ax-search-icon {
                  text-align: center;
                  font-size: 10px;
                  opacity: .5;
              }
              .ax-search {
                  width: 100% !important;
                  height: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;
                  outline: 0 !important;
                  background: transparent !important;
                  color: white !important;
                  box-shadow: none !important;
                  font-size: 9.5px !important;
              }
              .ax-search-clear {
                  height: 100%;
                  border: 0;
                  background: transparent;
                  color: #858b90;
                  font-size: 17px;
                  cursor: pointer;
              }
              .ax-refresh,
              .ax-clear {
                  height: 34px;
                  border: 1px solid var(--border);
                  border-radius: 5px;
                  background:
                      linear-gradient(
                          180deg,
                          rgba(255,255,255,.07),
                          rgba(255,255,255,.025)
                      );
                  color: #d6d8da;
                  cursor: pointer;
              }
              .ax-refresh {
                  width: 31px;
                  font-size: 16px;
              }
              .ax-clear {
                  padding: 0 9px;
                  font-size: 9px;
              }
              .ax-columns,
              .ax-event-card {
                  display: grid;
                  grid-template-columns:
                      minmax(0, 1.14fr)
                      145px
                      86px
                      108px;
                  gap: 6px;
                  width: 100%;
              }
              .ax-event-card {
                  grid-template-areas:
                      "primary details time actions"
                      "expanded expanded expanded expanded";
              }
              .ax-event-primary {
                  grid-area: primary;
              }
              .ax-event-details {
                  grid-area: details;
              }
              .ax-event-time {
                  grid-area: time;
              }
              .ax-actions {
                  grid-area: actions;
              }
              .ax-columns {
                  min-height: 30px;
                  align-items: center;
                  padding: 0 9px;
                  border: 1px solid var(--border);
                  border-radius: 6px 6px 0 0;
                  background:
                      linear-gradient(
                          180deg,
                          #25282b,
                          #191c1f
                      );
                  color: #b7bcc0;
                  font-size: 8.5px;
                  font-weight: 800;
              }
              .ax-actions-heading {
                  text-align: right;
                  padding-right: 4px;
              }
              .ax-event-list {
                  border: 1px solid var(--border);
                  border-top: 0;
                  border-radius: 0 0 6px 6px;
                  overflow: visible;
              }
              .ax-date-group {
                  position: relative;
              }
              .ax-date-header {
                  min-height: 28px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: 4px 9px;
                  border-bottom: 1px solid var(--sakalux-border-soft);
                  border-left: 3px solid var(--sakalux-gold);
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--sakalux-gold) 8%, var(--sakalux-bg)),
                          var(--sakalux-bg-soft)
                      );
                  color: var(--sakalux-text);
                  font-size: 9px;
                  position: sticky;
                  top: 0;
                  z-index: 30;
                  isolation: isolate;
                  backdrop-filter: blur(4px);
                  -webkit-backdrop-filter: blur(4px);
                  box-shadow: 0 1px 0 var(--sakalux-border-soft);
              }
              .ax-date-group.ax-date-collapsed > .ax-date-header {
                  min-height: 22px;
                  padding-top: 1px;
                  padding-bottom: 1px;
                  border-left-color: transparent;
                  background: var(--sakalux-bg);
                  color: var(--sakalux-text-soft);
                  position: relative;
              }
              .ax-date-group:not(.ax-date-collapsed) > .ax-date-header strong {
                  color: var(--sakalux-gold-bright);
              }
              .ax-date-group:not(.ax-date-collapsed) > .ax-date-header .ax-date-count {
                  border: 1px solid color-mix(in srgb, var(--sakalux-gold) 30%, transparent);
                  background: color-mix(in srgb, var(--sakalux-gold) 10%, var(--sakalux-panel-2));
                  color: var(--sakalux-gold-bright);
              }
              .ax-date-group.ax-date-collapsed > .ax-date-header:hover {
                  background: color-mix(in srgb, var(--sakalux-gold) 5%, var(--sakalux-bg));
                  color: var(--sakalux-text);
              }
              .ax-date-count {
                  padding: 2px 6px;
                  border-radius: 11px;
                  background: var(--sakalux-panel-2);
                  color: var(--sakalux-muted);
                  font-size: 8px;
              }
              .ax-date-header-right {
                  display: flex;
                  align-items: center;
                  gap: 5px;
              }
              .ax-date-toggle {
                  width: 22px;
                  height: 22px;
                  display: grid;
                  place-items: center;
                  padding: 0;
                  border: 1px solid var(--sakalux-border);
                  border-radius: 50%;
                  background: var(--sakalux-panel-2);
                  color: var(--sakalux-gold);
                  font-size: 10px;
                  cursor: pointer;
              }
              .ax-date-toggle:hover {
                  background: var(--sakalux-elevated);
                  color: var(--sakalux-gold-bright);
              }
              .ax-date-group.ax-date-collapsed .ax-date-toggle {
                  border-color: var(--sakalux-border-soft);
                  color: var(--sakalux-muted);
                  background: var(--sakalux-bg-soft);
              }
              .ax-date-group.ax-date-collapsed .ax-date-toggle:hover {
                  color: var(--sakalux-gold-bright);
                  border-color: var(--sakalux-gold-deep);
              }
              .ax-date-group.ax-date-collapsed
              > .ax-event-card {
                  display: none !important;
              }
              .ax-event-card {
                  position: relative;
                  min-height: 42px;
                  align-items: center;
                  padding: 4px 5px 4px 10px;
                  border-bottom: 1px solid rgba(255,255,255,.06);
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--category-color) 10%, transparent),
                          transparent 38%
                      ),
                      #181b1d;
              }
              .ax-event-card:hover {
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--category-color) 16%, transparent),
                          rgba(255,255,255,.02) 46%
                      ),
                      #1d2023;
              }
              .ax-accent {
                  position: absolute;
                  left: 0;
                  top: 0;
                  bottom: 0;
                  width: 3px;
                  background:
                      linear-gradient(
                          180deg,
                          color-mix(in srgb, white 28%, var(--category-color)),
                          var(--category-color)
                      );
                  box-shadow: 0 0 9px color-mix(in srgb, var(--category-color) 24%, transparent);
              }
              .ax-event-primary,
              .ax-event-copy,
              .ax-event-title,
              .ax-event-subtitle,
              .ax-event-details {
                  min-width: 0;
              }
              .ax-event-primary {
                  display: grid;
                  grid-template-columns: 28px minmax(0, 1fr);
                  gap: 6px;
                  align-items: center;
              }
              .ax-event-badge {
                  width: 25px;
                  height: 25px;
                  display: grid;
                  place-items: center;
                  border-radius: 50%;
                  border: 1px solid var(--category-border);
                  background:
                      linear-gradient(
                          180deg,
                          color-mix(in srgb, var(--category-color) 11%, #20262b),
                          color-mix(in srgb, var(--category-color) 6%, #11161b)
                      ) !important;
                  background-image:
                      linear-gradient(
                          180deg,
                          color-mix(in srgb, var(--category-color) 11%, #20262b),
                          color-mix(in srgb, var(--category-color) 6%, #11161b)
                      ) !important;
                  color: var(--category-color);
                  box-shadow:
                      inset 0 0 0 1px rgba(255,255,255,.025),
                      0 0 4px color-mix(in srgb, var(--category-color) 9%, transparent);
                  font-size: 13px;
                  font-weight: 800;
                  line-height: 1;
                  font-family: Arial, Helvetica, sans-serif;
                  mask: none !important;
                  -webkit-mask: none !important;
                  overflow: hidden;
              }
              .ax-event-badge::before,
              .ax-event-badge::after {
                  display: none !important;
                  content: none !important;
                  background: none !important;
                  background-image: none !important;
                  mask: none !important;
                  -webkit-mask: none !important;
              }
              .ax-event-title {
                  color: #e0e2e4;
                  font-size: 10.2px;
                  font-weight: 650;
                  line-height: 1.2;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: normal;
                  overflow-wrap: anywhere;
              }
              .ax-event-title a {
                  color: #45aef5 !important;
                  text-decoration: none !important;
              }
              .ax-event-card[data-category="bounties"][data-bounty-subtype="claimed"]
              .ax-event-title,
              .ax-event-card[data-category="bounties"][data-bounty-subtype="claimed"]
              .ax-event-title a,
              .ax-event-card[data-category="bounties"][data-bounty-subtype="claimed"]
              .ax-event-subtitle,
              .ax-event-card[data-category="bounties"][data-bounty-subtype="claimed"]
              .ax-context-label,
              .ax-event-card[data-category="bounties"][data-bounty-subtype="claimed"]
              .ax-bounty-value {
                  color: var(--category-color) !important;
              }
              .ax-event-subtitle {
                  margin-top: 2px;
                  color: #969da2;
                  font-size: 8.5px;
                  line-height: 1.2;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }
              .ax-event-details {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 2px 6px;
                  align-items: center;
                  overflow: hidden;
                  font-size: 9px;
              }
              .ax-money-in {
                  color: #70d952;
                  font-weight: 800;
              }
              .ax-money-out {
                  color: #ff5b54;
                  font-weight: 800;
              }
              .ax-stat-net {
                  font-weight: 800;
              }
              .ax-stat-net.ax-net-positive {
                  color: #70d952;
              }
              .ax-stat-net.ax-net-negative {
                  color: #ff5b54;
              }
              .ax-event-card.ax-large-money
              .ax-event-details strong {
                  font-size: 9.5px;
                  letter-spacing: .1px;
                  text-shadow: 0 0 7px rgba(255,255,255,.03);
              }
              .ax-money-neutral {
                  color: #dedede;
              }
              .ax-bounty-value {
                  color: var(--category-color);
              }
              .ax-points {
                  color: #75d954;
              }
              .ax-secondary {
                  color: #959ba0;
                  font-size: 8px;
              }
              .ax-category-label {
                  color: #9ea5aa;
              }
              .ax-context-label {
                  color: #aeb5ba;
                  font-size: 8px;
                  font-weight: 600;
                  letter-spacing: .1px;
              }
              .ax-event-card {
                  cursor: pointer;
              }
              .ax-event-expanded {
                  display: none;
                  grid-area: expanded;
                  width: auto;
                  margin: 5px 5px 3px 31px;
                  padding: 8px 10px;
                  border: 1px solid color-mix(in srgb, var(--category-color) 20%, rgba(255,255,255,.07));
                  border-radius: 5px;
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--category-color) 7%, transparent),
                          rgba(255,255,255,.018)
                      );
                  color: #aeb4b9;
                  font-size: 8.5px;
                  line-height: 1.35;
                  cursor: text;
              }
              .ax-event-card.ax-expanded-open {
                  background:
                      linear-gradient(
                          90deg,
                          color-mix(in srgb, var(--category-color) 13%, transparent),
                          rgba(255,255,255,.02) 46%
                      ),
                      #1b1f22;
              }
              .ax-event-card.ax-expanded-open .ax-event-expanded {
                  display: block;
              }
              .ax-pda-native-actions {
                  display: none;
              }
              .ax-expanded-label {
                  margin-bottom: 4px;
                  color: color-mix(in srgb, var(--category-color) 68%, #cfd5da);
                  font-size: 7px;
                  font-weight: 800;
                  letter-spacing: .6px;
              }
              .ax-expanded-message {
                  color: #b8bec3;
              }
              .ax-original-money {
                  color: #d9dee2;
                  font-weight: 700;
              }
              .ax-original-position {
                  color: #efc85b;
              }
              .ax-event-title::after {
                  content: '›';
                  display: inline-block;
                  margin-left: 5px;
                  color: color-mix(in srgb, var(--category-color) 34%, #6d757b);
                  font-size: 11px;
                  font-weight: 700;
                  transform: translateY(.3px);
                  transition: transform .15s ease;
              }
              .ax-event-card.ax-expanded-open .ax-event-title::after {
                  transform: rotate(90deg) translateX(.5px);
              }
              .ax-event-time {
                  width: 86px;
                  min-width: 86px;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  padding-left: 0;
                  line-height: 1.15;
                  white-space: nowrap;
                  overflow: visible;
                  position: relative;
                  z-index: 3;
                  text-align: center;
              }
              .ax-time-value {
                  display: block;
                  color: #f0f1f2;
                  font-size: 9px;
                  font-weight: 700;
                  line-height: 1.15;
              }
              .ax-date-value {
                  display: block;
                  margin-top: 2px;
                  color: #91989d;
                  font-size: 8px;
                  line-height: 1.15;
              }
              .ax-actions {
                  width: 108px;
                  min-width: 108px;
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  gap: 3px;
                  overflow: visible;
              }
              .ax-action-btn {
                  width: 24px;
                  height: 24px;
                  display: grid;
                  place-items: center;
                  padding: 4px;
                  border: 1px solid rgba(255,255,255,.09);
                  border-radius: 4px;
                  background: rgba(255,255,255,.035);
                  color: #9fa5aa;
                  cursor: pointer;
              }
              .ax-action-btn:hover {
                  background: rgba(255,255,255,.08);
                  color: white;
              }
              .ax-action-copy,
              .ax-action-save {
                  display: grid;
                  place-items: center;
              }
              .ax-action-save {
                  color: #aeb4b9;
                  font-size: 17px;
                  line-height: 1;
                  padding: 0;
              }
              .ax-pda-native-event-row {
                  display: block !important;
                  width: auto !important;
                  min-width: 0 !important;
                  height: auto !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                  overflow: visible !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  pointer-events: auto !important;
              }
              .ax-pda-native-event-row > [class*="listItem"] {
                  display: block !important;
                  width: auto !important;
                  min-height: 0 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                  overflow: visible !important;
              }
              .ax-pda-native-event-content {
                  display: none !important;
              }
              .ax-pda-native-event-buttons {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: flex-start !important;
                  gap: 8px !important;
                  position: static !important;
                  width: auto !important;
                  height: auto !important;
                  min-height: 32px !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  pointer-events: auto !important;
                  transform: none !important;
                  overflow: visible !important;
              }
              .ax-pda-native-event-buttons > div {
                  display: flex !important;
                  align-items: center !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  pointer-events: auto !important;
              }
              .ax-pda-native-event-buttons
              .ax-pda-native-event-send,
              .ax-pda-native-event-buttons
              [class*="send"] {
                  display: none !important;
              }
              .ax-pda-native-event-buttons button {
                  min-width: 68px !important;
                  height: 30px !important;
                  display: inline-flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  gap: 5px !important;
                  margin: 0 !important;
                  position: static !important;
                  visibility: visible !important;
                  opacity: 1 !important;
                  pointer-events: auto !important;
                  transform: none !important;
                  cursor: pointer !important;
              }
              .ax-pda-native-event-buttons button svg {
                  width: 14px !important;
                  height: 14px !important;
              }
              .ax-pda-native-event-buttons button [class*="text"] {
                  display: inline !important;
              }
              .ax-action-save:hover {
                  color: #f0cb58;
              }
              .ax-action-save.ax-saved {
                  color: #f0c84b;
                  border-color: rgba(240,200,75,.3);
                  background: rgba(240,200,75,.07);
              }
              .ax-action-save {
                  transition:
                      color .12s ease,
                      background .12s ease,
                      border-color .12s ease;
              }
              .ax-action-btn svg {
                  width: 12px;
                  height: 12px;
                  fill: currentColor;
              }
              .ax-copy-glyph {
                  position: relative;
                  display: block;
                  width: 12px;
                  height: 12px;
              }
              .ax-copy-glyph::before,
              .ax-copy-glyph::after {
                  content: '';
                  position: absolute;
                  width: 8px;
                  height: 9px;
                  border: 1.5px solid currentColor;
                  border-radius: 1.5px;
                  box-sizing: border-box;
              }
              .ax-copy-glyph::before {
                  left: 1px;
                  top: 2px;
                  opacity: .62;
              }
              .ax-copy-glyph::after {
                  left: 3px;
                  top: 0;
                  background: #1b1f22;
              }
              .ax-view-action {
                  width: 24px;
                  height: 24px;
                  display: grid;
                  place-items: center;
                  padding: 0;
                  border: 1px solid color-mix(in srgb, #47b7ff 35%, rgba(255,255,255,.09));
                  border-radius: 4px;
                  background: rgba(71,183,255,.08);
                  color: #6ec7ff !important;
                  text-decoration: none !important;
                  font-size: 14px;
                  font-weight: 800;
                  line-height: 1;
              }
              .ax-view-action:hover {
                  background: rgba(71,183,255,.16);
                  color: #a2dcff !important;
              }
              .ax-view-inline {
                  display: none;
                  align-items: center;
                  justify-content: center;
                  min-height: 19px;
                  padding: 2px 7px;
                  border: 1px solid rgba(71,183,255,.36);
                  border-radius: 4px;
                  background: rgba(71,183,255,.09);
                  color: #72caff !important;
                  text-decoration: none !important;
                  font-size: 8px;
                  font-weight: 800;
                  line-height: 1;
              }
              .ax-position {
                  color: #efc129;
              }
              .ax-quantity {
                  color: #49a8ff;
              }
              .ax-event-card[data-category="items"] .ax-event-badge {
                  font-size: 12px;
                  font-weight: 900;
              }
              .ax-event-card[data-category="racing"] .ax-event-badge {
                  font-size: 15px;
                  font-weight: 900;
              }
              .ax-event-card[data-category="bounties"] .ax-event-badge {
                  font-size: 13px;
              }
              .ax-event-card[data-category="bets"] .ax-event-title,
              .ax-event-card[data-category="bets"] .ax-context-label {
                  color: #7de3aa;
              }
              .ax-event-card[data-category="bets"][data-bet-result="lost"] .ax-event-title,
              .ax-event-card[data-category="bets"][data-bet-result="lost"] .ax-context-label {
                  color: #ff929b;
              }
              .ax-event-card[data-category="armory"] .ax-event-title,
              .ax-event-card[data-category="armory"] .ax-context-label {
                  color: #9db8de;
              }
              .ax-event-card[data-category="jail"] .ax-event-title,
              .ax-event-card[data-category="jail"] .ax-context-label {
                  color: #d8dce2;
              }
              .ax-event-card[data-category="crimes"] .ax-event-title,
              .ax-event-card[data-category="crimes"] .ax-context-label {
                  color: #f7af8f;
              }
              .ax-event-card[data-category="stocks"] .ax-event-title,
              .ax-event-card[data-category="stocks"] .ax-context-label {
                  color: #9be0bf;
              }
              .ax-event-card[data-category="education"] .ax-event-title,
              .ax-event-card[data-category="education"] .ax-context-label {
                  color: #9fc4ff;
              }
              .ax-event-card[data-category="money"] .ax-event-title,
              .ax-event-card[data-category="money"] .ax-context-label {
                  color: var(--category-color);
              }
              .ax-event-card[data-category="money"][data-money-direction="in"]
              .ax-event-title,
              .ax-event-card[data-category="money"][data-money-direction="in"]
              .ax-context-label {
                  color: #70d952;
              }
              .ax-event-card[data-category="money"][data-money-direction="out"]
              .ax-event-title,
              .ax-event-card[data-category="money"][data-money-direction="out"]
              .ax-context-label {
                  color: #ff5b54;
              }
              .ax-event-card[data-category="items"] .ax-event-title,
              .ax-event-card[data-category="items"] .ax-context-label {
                  color: #7ddfff;
              }
              .ax-event-card[data-category="trades"] .ax-event-title,
              .ax-event-card[data-category="trades"] .ax-context-label {
                  color: #84e6e0;
              }
              .ax-event-card[data-category="attacks"] .ax-event-title,
              .ax-event-card[data-category="attacks"] .ax-context-label {
                  color: #ff929b;
              }
              .ax-event-card[data-category="racing"] .ax-event-title,
              .ax-event-card[data-category="racing"] .ax-context-label {
                  color: #f6d166;
              }
              .ax-event-card[data-category="hospital"] .ax-event-title,
              .ax-event-card[data-category="hospital"] .ax-context-label {
                  color: #ff95cd;
              }
              .ax-event-card[data-category="bounties"] .ax-event-title,
              .ax-event-card[data-category="bounties"] .ax-context-label {
                  color: #ffb17d;
              }
              .ax-event-card[data-category="bounties"][data-bounty-subtype="placed"] {
                  --category-color: var(--sakalux-orange) !important;
                  --category-soft: color-mix(in srgb, var(--sakalux-orange) 14%, transparent) !important;
                  --category-border: color-mix(in srgb, var(--sakalux-orange) 42%, transparent) !important;
              }
              .ax-event-card[data-category="bounties"][data-bounty-subtype="received"] {
                  --category-color: var(--sakalux-red) !important;
                  --category-soft: color-mix(in srgb, var(--sakalux-red) 14%, transparent) !important;
                  --category-border: color-mix(in srgb, var(--sakalux-red) 42%, transparent) !important;
              }
              .ax-event-card[data-category="bounties"][data-bounty-subtype="ended"] {
                  --category-color: var(--sakalux-gold) !important;
                  --category-soft: color-mix(in srgb, var(--sakalux-gold) 12%, transparent) !important;
                  --category-border: color-mix(in srgb, var(--sakalux-gold) 36%, transparent) !important;
              }
              .ax-event-card[data-category="drugs"] .ax-event-title,
              .ax-event-card[data-category="drugs"] .ax-context-label {
                  color: #c6dc78;
              }
              .ax-event-card[data-category="drugs"] .ax-event-badge {
                  font-size: 13px;
                  font-weight: 900;
                  transform: rotate(-28deg);
              }
              .ax-event-card[data-category="hospital"][data-hospital-subtype="revive"] {
                  --category-color: var(--sakalux-green) !important;
                  --category-soft: color-mix(in srgb, var(--sakalux-green) 14%, transparent) !important;
                  --category-border: color-mix(in srgb, var(--sakalux-green) 42%, transparent) !important;
              }
              .ax-event-card[data-category="hospital"][data-hospital-subtype="revive"] .ax-event-title,
              .ax-event-card[data-category="hospital"][data-hospital-subtype="revive"] .ax-context-label {
                  color: #8ee3bc;
              }
              .ax-event-card[data-category="property"] .ax-event-title,
              .ax-event-card[data-category="property"] .ax-context-label {
                  color: #e7c889;
              }
              .ax-event-card[data-category="company"] .ax-event-title,
              .ax-event-card[data-category="company"] .ax-context-label {
                  color: #8cddda;
              }
              .ax-event-card[data-category="travel"] .ax-event-title,
              .ax-event-card[data-category="travel"] .ax-context-label {
                  color: #98c1ff;
              }
              .ax-event-card[data-category="marriage"] .ax-event-title,
              .ax-event-card[data-category="marriage"] .ax-context-label {
                  color: #ffb0db;
              }
              .ax-event-card[data-category="rewards"] .ax-event-title,
              .ax-event-card[data-category="rewards"] .ax-context-label {
                  color: #f7d676;
              }
              .ax-event-card[data-category="faction"] .ax-event-title,
              .ax-event-card[data-category="faction"] .ax-context-label {
                  color: #c7a7ff;
              }
              .ax-event-card[data-category="other"] .ax-event-title,
              .ax-event-card[data-category="other"] .ax-context-label {
                  color: #ced4da;
              }
              .ax-empty {
                  display: none;
                  padding: 35px;
                  text-align: center;
                  color: #8d9499;
                  background: #171a1c;
                  border: 1px solid var(--border);
                  border-radius: 6px;
              }
              .ax-empty.active {
                  display: block;
              }
              .ax-hidden {
                  display: none !important;
              }
              @media(max-width: 700px) {
                  #sakalux-events-dashboard {
                      margin-top: 6px;
                  }
                  .ax-layout {
                      display: block;
                  }
                  .ax-sidebar {
                      margin-bottom: 7px;
                      position: static;
                      max-height: none;
                  }
                  .ax-panel:first-child {
                      border-radius: 8px;
                  }
                  .ax-panel-title {
                      display: none;
                  }
                  .ax-filter-list {
                      display: flex;
                      gap: 4px;
                      overflow-x: auto;
                      overflow-y: hidden;
                      max-height: none;
                      padding: 5px;
                      scroll-snap-type: x proximity;
                      scrollbar-width: none;
                      -webkit-overflow-scrolling: touch;
                  }
                  .ax-filter-list::-webkit-scrollbar {
                      display: none;
                  }
                  .ax-filter {
                      flex: 0 0 auto;
                      width: auto;
                      min-width: max-content;
                      min-height: 30px;
                      grid-template-columns: 18px auto auto;
                      gap: 4px;
                      padding: 3px 6px;
                      border: 0;
                      border-radius: 6px;
                      scroll-snap-align: start;
                  }
                  .ax-filter-badge {
                      width: 18px;
                      height: 18px;
                      font-size: 9px;
                      background-image: none !important;
                      mask: none !important;
                      -webkit-mask: none !important;
                  }
                  .ax-filter-name {
                      font-size: 8.5px;
                      white-space: nowrap;
                      color: color-mix(in srgb, var(--filter-color) 24%, #f2f5f7);
                  }
                  .ax-filter-count {
                      min-width: 18px;
                      padding: 2px 4px;
                      font-size: 7.5px;
                  }
                  .ax-stats-panel,
                  .ax-tct {
                      display: none;
                  }
                  .ax-toolbar {
                      display: grid;
                      grid-template-columns: auto 1fr auto;
                      grid-template-areas:
                          "search search search"
                          "refresh count clear";
                      gap: 4px;
                      margin-bottom: 5px;
                  }
                  .ax-visible-count {
                      grid-area: count;
                      height: 30px;
                      min-width: 52px;
                      padding: 0 8px;
                      font-size: 7.5px;
                      border-radius: 999px;
                  }
                  .ax-filter-more {
                      display: none !important;
                  }
                  .ax-search-wrap {
                      grid-area: search;
                      height: 34px;
                      border-radius: 7px;
                  }
                  .ax-search {
                      font-size: 10px !important;
                  }
                  .ax-refresh {
                      grid-area: refresh;
                      width: auto;
                      min-width: 70px;
                      height: 30px;
                      padding: 0 9px;
                      font-size: 0;
                  }
                  .ax-refresh::after {
                      content: '↻  Refresh';
                      font-size: 9px;
                  }
                  .ax-clear {
                      grid-area: clear;
                      height: 30px;
                      min-width: 62px;
                      padding: 0 8px;
                      font-size: 0;
                  }
                  .ax-clear::after {
                      content: 'Reset';
                      font-size: 9px;
                  }
                  .ax-columns {
                      display: none;
                  }
                  .ax-event-list {
                      border-top: 1px solid var(--border);
                      border-radius: 8px;
                  }
                  .ax-date-header {
                      min-height: 28px;
                      padding: 4px 8px;
                      font-size: 9px;
                      position: sticky;
                      top: 0;
                      z-index: 25;
                      box-shadow:
                          0 1px 0 rgba(255,255,255,.04),
                          0 3px 8px rgba(0,0,0,.16);
                  }
                  .ax-date-count {
                      padding: 2px 6px;
                      font-size: 7.5px;
                  }
                  .ax-date-count {
                      padding: 3px 7px;
                      font-size: 8px;
                  }
                  .ax-event-card {
                      grid-template-columns: minmax(0, 1fr) 52px 64px;
                      grid-template-areas:
                          "primary actions time"
                          "details actions time"
                          "expanded expanded expanded";
                      gap: 1px 4px;
                      min-height: 45px;
                      padding: 4px 5px 4px 7px;
                  }
                  .ax-event-primary {
                      grid-area: primary;
                      grid-template-columns: 24px minmax(0, 1fr);
                      gap: 5px;
                  }
                  .ax-event-badge {
                      width: 22px;
                      height: 22px;
                      font-size: 11px;
                      mask: none !important;
                      -webkit-mask: none !important;
                  }
                  .ax-event-card[data-category="racing"] .ax-event-badge {
                      font-size: 14px;
                  }
                  .ax-event-card[data-category="items"] .ax-event-badge {
                      font-size: 11px;
                  }
                  .ax-event-card[data-category="drugs"] .ax-event-badge {
                      font-size: 11px;
                  }
                  .ax-event-title {
                      font-size: 9.3px;
                      line-height: 1.18;
                  }
                  .ax-event-subtitle {
                      margin-top: 0;
                      font-size: 7.4px;
                      line-height: 1.12;
                  }
                  .ax-event-details {
                      grid-area: details;
                      padding-left: 29px;
                      min-height: 11px;
                      gap: 1px 4px;
                      font-size: 8px;
                      line-height: 1.05;
                  }
                  .ax-secondary {
                      font-size: 7.3px;
                  }
                  .ax-event-expanded {
                      grid-area: expanded;
                      margin: 5px 1px 2px 29px;
                      padding: 7px 8px;
                      font-size: 7.7px;
                      line-height: 1.3;
                  }
                  .ax-expanded-label {
                      font-size: 6.5px;
                  }
                  .ax-event-title::after {
                      font-size: 10px;
                      margin-left: 4px;
                  }
                  .ax-event-time {
                      grid-area: time;
                      width: 68px;
                      min-width: 68px;
                      align-items: flex-end;
                      justify-content: center;
                      text-align: right;
                      padding-left: 0;
                      padding-right: 2px;
                  }
                  .ax-time-value {
                      font-size: 8.4px;
                      line-height: 1.05;
                      font-weight: 700;
                  }
                  .ax-date-value {
                      margin-top: 1px;
                      font-size: 6.8px;
                      line-height: 1.05;
                      opacity: .68;
                  }
                  .ax-actions {
                      grid-area: actions;
                      width: auto;
                      min-width: 0;
                      display: none !important;
                  }
                  .ax-event-card:not(.ax-expanded-open)
                  .ax-pda-native-actions {
                      display: none !important;
                  }
                  .ax-pda-native-actions {
                      display: flex;
                      align-items: center;
                      justify-content: flex-start;
                      width: 100%;
                      margin-top: 8px;
                      padding-top: 7px;
                      border-top: 1px solid rgba(255,255,255,.08);
                  }
                  .ax-pda-native-actions-slot {
                      display: block;
                      width: 100%;
                      min-height: 32px;
                      overflow: visible;
                  }
                  .ax-actions .ax-action-btn {
                      width: 22px;
                      height: 22px;
                      padding: 4px;
                      border-radius: 5px;
                  }
                  .ax-actions .ax-action-btn svg {
                      width: 11px;
                      height: 11px;
                  }
                  .ax-actions .ax-view-action {
                      display: none !important;
                  }
                  .ax-actions .ax-action-btn {
                      color: #aeb6bc;
                  }
                  .ax-actions .ax-action-copy {
                      color: #b9c1c7;
                  }
                  .ax-actions .ax-action-save {
                      color: #aeb4b9;
                      font-size: 17px;
                      padding: 0;
                      display: grid !important;
                      place-items: center !important;
                      visibility: visible !important;
                      opacity: 1 !important;
                  }
                  .ax-actions .ax-action-save.ax-saved {
                      color: #f0c84b;
                  }
                  .ax-actions .ax-action-success {
                      color: #7ee6a2 !important;
                      border-color: rgba(126, 230, 162, .45) !important;
                  }
                  .ax-view-inline {
                      display: inline-flex;
                      margin-left: 1px;
                      min-height: 18px;
                      padding: 2px 6px;
                      font-size: 7.8px;
                  }
                  .ax-accent {
                      width: 4px;
                  }
              }
              @media (min-width: 820px) and (max-width: 1024px) and (pointer: coarse) {
                  #${ROOT_ID} {
                      width: calc(100vw - 18px);
                      max-width: calc(100vw - 18px);
                      margin-left: auto;
                      margin-right: auto;
                  }
                  .ax-layout {
                      display: grid;
                      grid-template-columns: 150px minmax(0, 1fr);
                      gap: 7px;
                  }
                  .ax-sidebar {
                      position: sticky;
                      top: 6px;
                      max-height: calc(100dvh - 112px);
                  }
                  .ax-filter-list {
                      display: block;
                      max-height: 54dvh;
                      overflow-y: auto;
                      overflow-x: hidden;
                      padding: 3px;
                  }
                  .ax-filter {
                      width: 100%;
                      min-width: 0;
                      min-height: 31px;
                      grid-template-columns: 22px 1fr auto;
                      padding: 2px 5px;
                      border-bottom: 1px solid rgba(255,255,255,.045);
                      border-radius: 4px;
                  }
                  .ax-filter-name {
                      font-size: 9px;
                  }
                  .ax-stats-panel {
                      display: block;
                  }
                  .ax-toolbar {
                      grid-template-columns: minmax(0,1fr) auto 32px auto;
                      gap: 5px;
                  }
                  .ax-columns,
                  .ax-event-card {
                      grid-template-columns: minmax(0, 1fr) 108px 70px 78px;
                      gap: 4px;
                  }
                  .ax-event-card {
                      min-height: 44px;
                      padding: 4px 5px 4px 8px;
                  }
                  .ax-event-primary {
                      grid-template-columns: 24px minmax(0,1fr);
                      gap: 5px;
                  }
                  .ax-event-badge {
                      width: 22px;
                      height: 22px;
                  }
                  .ax-event-title {
                      font-size: 9px;
                  }
                  .ax-event-subtitle {
                      font-size: 7.4px;
                  }
                  .ax-event-details {
                      font-size: 7.8px;
                  }
                  .ax-event-time {
                      width: 70px;
                      min-width: 70px;
                  }
                  .ax-actions {
                      width: 78px;
                  }
              }
              @media (min-width: 761px) and (max-width: 1100px) {
                  .ax-layout {
                      display: block;
                  }
                  .ax-sidebar {
                      position: static;
                      top: auto;
                      max-height: none;
                      margin-bottom: 8px;
                  }
                  .ax-panel:first-child {
                      border-radius: 8px;
                  }
                  .ax-panel-title {
                      display: block;
                  }
                  .ax-filter-list {
                      display: flex;
                      gap: 5px;
                      overflow-x: auto;
                      overflow-y: hidden;
                      max-height: none;
                      padding: 6px;
                      scroll-snap-type: x proximity;
                      scrollbar-width: none;
                      -webkit-overflow-scrolling: touch;
                  }
                  .ax-filter-list::-webkit-scrollbar {
                      display: none;
                  }
                  .ax-filter-more {
                      display: none !important;
                  }
                  .ax-filter {
                      flex: 0 0 auto;
                      width: auto;
                      min-width: max-content;
                      min-height: 32px;
                      grid-template-columns: 20px auto auto;
                      gap: 5px;
                      padding: 4px 8px;
                      border: 0;
                      border-radius: 7px;
                      scroll-snap-align: start;
                  }
                  .ax-filter-badge {
                      width: 20px;
                      height: 20px;
                      font-size: 9px;
                  }
                  .ax-filter-name {
                      font-size: 9px;
                      white-space: nowrap;
                  }
                  .ax-filter-count {
                      min-width: 20px;
                      padding: 2px 5px;
                      font-size: 8px;
                  }
                  .ax-stats-panel {
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                  }
                  .ax-stat-row {
                      min-height: 29px;
                      font-size: 9px;
                  }
                  .ax-tct {
                      display: none;
                  }
                  .ax-toolbar {
                      grid-template-columns: minmax(0, 1fr) auto 34px auto;
                      gap: 6px;
                  }
                  .ax-search-wrap {
                      height: 36px;
                  }
                  .ax-search {
                      font-size: 10px !important;
                  }
                  .ax-visible-count {
                      height: 32px;
                      font-size: 8px;
                  }
                  .ax-refresh {
                      width: 34px;
                      font-size: 16px;
                  }
                  .ax-clear {
                      font-size: 9px;
                      padding: 0 10px;
                  }
                  .ax-columns,
                  .ax-event-card {
                      grid-template-columns: minmax(0, 1fr) 118px 74px 86px;
                      gap: 5px;
                  }
                  .ax-columns {
                      font-size: 8px;
                  }
                  .ax-event-card {
                      min-height: 46px;
                      padding: 4px 6px 4px 9px;
                  }
                  .ax-event-primary {
                      grid-template-columns: 26px minmax(0, 1fr);
                      gap: 6px;
                  }
                  .ax-event-badge {
                      width: 24px;
                      height: 24px;
                      font-size: 10px;
                  }
                  .ax-event-title {
                      font-size: 9.6px;
                      line-height: 1.18;
                  }
                  .ax-event-subtitle {
                      font-size: 7.8px;
                  }
                  .ax-event-details {
                      font-size: 8.2px;
                  }
                  .ax-event-time {
                      width: 74px;
                      min-width: 74px;
                  }
                  .ax-time-value {
                      font-size: 8.8px;
                  }
                  .ax-date-value {
                      font-size: 7.2px;
                  }
                  .ax-actions {
                      width: 86px;
                  }
                  .ax-actions .ax-action-btn {
                      width: 24px;
                      height: 24px;
                  }
              }
              #${ROOT_ID}.ax-wide-pda {
                  position: relative !important;
                  left: var(--ax-viewport-shift, 0px) !important;
                  transform: none !important;
                  width: var(--ax-viewport-width, calc(100vw - 16px)) !important;
                  max-width: none !important;
                  min-width: 0 !important;
                  margin: 7px 0 10px !important;
                  z-index: 20 !important;
                  box-sizing: border-box !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-layout {
                  display: grid !important;
                  grid-template-columns: 136px minmax(0, 1fr) !important;
                  gap: 6px !important;
                  width: 100% !important;
                  min-width: 0 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-sidebar {
                  display: flex !important;
                  position: sticky !important;
                  top: 6px !important;
                  align-self: start !important;
                  max-height: calc(100dvh - 102px) !important;
                  margin: 0 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-panel-title {
                  display: block !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-list {
                  display: block !important;
                  max-height: 47dvh !important;
                  overflow-x: hidden !important;
                  overflow-y: auto !important;
                  padding: 3px !important;
                  scroll-snap-type: none !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-more {
                  display: flex !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter {
                  display: grid !important;
                  grid-template-columns: 22px minmax(0, 1fr) auto !important;
                  width: 100% !important;
                  min-width: 0 !important;
                  min-height: 30px !important;
                  padding: 2px 5px !important;
                  border-radius: 4px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-name {
                  min-width: 0 !important;
                  overflow: hidden !important;
                  text-overflow: ellipsis !important;
                  white-space: nowrap !important;
                  font-size: 9px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-badge {
                  width: 21px !important;
                  height: 21px !important;
                  font-size: 9px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-count {
                  min-width: 19px !important;
                  padding: 2px 4px !important;
                  font-size: 7.5px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-stats-panel {
                  display: block !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-stat-row {
                  min-height: 26px !important;
                  padding: 4px 7px !important;
                  font-size: 8.3px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-tct {
                  display: block !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-main {
                  width: 100% !important;
                  min-width: 0 !important;
                  overflow: hidden !important;
                  padding-right: 18px !important;
                  box-sizing: border-box !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-toolbar {
                  display: grid !important;
                  grid-template-columns: minmax(0, 1fr) auto 32px auto !important;
                  gap: 4px !important;
                  width: 100% !important;
                  margin-bottom: 6px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-search-wrap {
                  width: 100% !important;
                  min-width: 0 !important;
                  height: 34px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-visible-count {
                  height: 32px !important;
                  min-width: 54px !important;
                  font-size: 8px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-refresh {
                  width: 34px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-clear {
                  min-width: 78px !important;
                  padding: 0 8px !important;
                  font-size: 8.5px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-columns,
              #${ROOT_ID}.ax-wide-pda .ax-event-card {
                  display: grid !important;
                  grid-template-columns: minmax(215px, 1.72fr) minmax(78px, .58fr) 64px 92px !important;
                  gap: 4px !important;
                  width: 100% !important;
                  min-width: 0 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-columns {
                  font-size: 7.7px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-card {
                  min-height: 44px !important;
                  padding: 4px 5px 4px 8px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-primary {
                  grid-template-columns: 23px minmax(0, 1fr) !important;
                  gap: 5px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-badge {
                  width: 22px !important;
                  height: 22px !important;
                  font-size: 9px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-title {
                  font-size: 9px !important;
                  line-height: 1.15 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-subtitle {
                  font-size: 7.2px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-details {
                  min-width: 0 !important;
                  font-size: 7.7px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-time {
                  width: 64px !important;
                  min-width: 64px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-time-value {
                  font-size: 8.5px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-date-value {
                  font-size: 7px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-actions {
                  width: 92px !important;
                  justify-content: center !important;
                  gap: 4px !important;
                  padding: 0 8px 0 2px !important;
                  box-sizing: border-box !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-actions .ax-action-btn,
              #${ROOT_ID}.ax-wide-pda .ax-view-action {
                  width: 23px !important;
                  height: 23px !important;
                  min-width: 23px !important;
                  flex: 0 0 23px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-columns > :last-child {
                  justify-self: stretch !important;
                  padding-right: 8px !important;
                  text-align: center !important;
                  box-sizing: border-box !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-view-action {
                  margin-right: 0 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-day-header {
                  min-height: 31px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter {
                  min-height: 26px !important;
                  padding-top: 0 !important;
                  padding-bottom: 0 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-filter-list {
                  gap: 3px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-quick-stats {
                  margin-top: 6px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-quick-stats h3,
              #${ROOT_ID}.ax-wide-pda .ax-quick-stats-title {
                  min-height: 27px !important;
                  margin: 0 !important;
                  padding-top: 5px !important;
                  padding-bottom: 5px !important;
                  line-height: 1.1 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-stat-row {
                  min-height: 21px !important;
                  padding-top: 2px !important;
                  padding-bottom: 2px !important;
                  line-height: 1.15 !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-stat-row + .ax-stat-row {
                  border-top-color: rgba(255,255,255,.035) !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-sidebar-footer,
              #${ROOT_ID}.ax-wide-pda .ax-time-note {
                  margin-top: 5px !important;
                  padding-top: 3px !important;
                  padding-bottom: 3px !important;
                  font-size: 8px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-day-header:not(.is-active) {
                  min-height: 29px !important;
              }
              #${ROOT_ID}.ax-wide-pda {
                  max-height: none !important;
                  overflow: visible !important;
                  padding-bottom: var(--ax-pda-bottom-safe, 112px) !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-layout {
                  max-height: none !important;
                  overflow: visible !important;
                  align-items: start !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-sidebar {
                  position: sticky !important;
                  top: 6px !important;
                  max-height: calc(100dvh - 132px) !important;
                  overflow-y: auto !important;
                  overflow-x: hidden !important;
                  overscroll-behavior: contain !important;
                  padding-bottom: 8px !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-main {
                  display: block !important;
                  max-height: none !important;
                  overflow: visible !important;
              }
              #${ROOT_ID}.ax-wide-pda .ax-event-list {
                  min-height: 0 !important;
                  max-height: none !important;
                  overflow: visible !important;
                  padding-bottom: 0 !important;
              }
          `;
          document.head.appendChild(style);
      }
  function stopDashboard() {
          state.observer?.disconnect();
          state.observer = null;
          clearTimeout(state.refreshTimer);
          state.refreshTimer = null;
          if (state.pdaSyncTimer) {
              clearInterval(state.pdaSyncTimer);
              state.pdaSyncTimer = null;
          }
          if (state.startupTimer) {
              clearInterval(state.startupTimer);
              state.startupTimer = null;
          }
          if (state.saveOverlayRAF) {
              cancelAnimationFrame(state.saveOverlayRAF);
              state.saveOverlayRAF = null;
          }
          eventController?.abort();
          eventController = null;
          const root = document.getElementById(ROOT_ID);
          root?.querySelectorAll('.ax-pda-native-event-row').forEach(row => {
              row.classList.remove('ax-pda-native-event-row');
              row.querySelector('[class*="contentGroup"]')
                  ?.classList.remove('ax-pda-native-event-content');
              const buttons = row.querySelector('[class*="buttonsGroup"]');
              buttons?.classList.remove('ax-pda-native-event-buttons');
              buttons?.querySelector('[class*="send"]')
                  ?.classList.remove('ax-pda-native-event-send');
              state.nativeList?.appendChild(row);
          });
          state.nativeList?.classList.remove('ax-native-list-hidden');
          root?.remove();
          document.getElementById(STYLE_ID)?.remove();
          state.saveOverlayUpdaters.clear();
          state.suppressNativeRefresh = false;
          state.nativeList = null;
          state.pdaLastSignature = '';
          state.pdaLastUrl = location.href;
      }
      function init() {
          if (moduleActive) return;
          moduleActive = true;
          startDashboard();
      }
      function destroy() {
          moduleActive = false;
          stopDashboard();
      }
      return {
          init,
          onRouteChange() {
              if (!moduleActive) return;
              if (onEventsPage()) {
                  startDashboard();
              } else {
                  stopDashboard();
              }
          },
          status() {
              const eventsRoute = onEventsPage();
              return {
                  active: moduleActive,
                  onEventsPage: eventsRoute,
                  nativeRows: eventsRoute ? getNativeRows().length : 0,
                  mounted: !!document.getElementById(ROOT_ID),
                  waiting: !!state.startupTimer
              };
          },
          destroy
      };
  }

  function createSakaLuXItemSignalModule(context) {
    const STYLE_ID = "sakalux-item-intel-style";
    const PORTAL_ID = "sakalux-item-intel-tip-portal";
    const DONE_ATTR = "sakaluxIntelDone";
    const ITEM_IDS = {
      "Lockpicks":1203,"Shaving Foam":1217,"Jemmy":568,"Net":1362,"Dog Treats":1361,
      "ID Badge":1381,"ATM Key":1379,"Police Badge":1350,"DSLR Camera":1383,"RF Detector":1380,
      "Gasoline":172,"Construction Helmet":643,"PCP":201,"Blank Casino Chips":327,"Binoculars":1258,
      "Hand Drill":1331,"Billfold":1080,"Wire Cutters":981,"Zip Ties":1429,"Polymorphic Virus":70,
      "Bolt Cutters":159,"Spray Paint : Black":856,"Chloroform":576,"Dental Mirror":1284,"C4 Explosive":190,
      "Flash Grenade":222,"Wireless Dongle":579,"Tunneling Virus":71,"Core Drill":1431,"Shaped Charge":1430,
      "Firewalk Virus":103,"Smoke Grenade":226,"Stealth Virus":73,"Cigar Cutter":1223,"Car Battery":884,
      "Cut-Throat Razor":567,"Thermite":1461,"Remote Detonator":1230,"Tear Gas":256,
      "Blood Bag : Irradiated":1012,"Syringe":1094,"Cassock":1313,"Cell Phone":1096,"Ladder":980,
      "Angle Grinder":1509,"Razor Wire":1259,"Floor Cleaner":1277,"Hard Drive":45,"Lubricant":1092,
      "Igniter Cord":1227
    };
    const CONSUMABLE_OC_IDS = new Set([
      1217,1361,1379,201,327,1080,981,1429,70,856,576,1284,190,222,71,1430,103,73,1461,1230,256
    ]);
    const OC_INFO = new Map();
    function addOC(level, crime, entries) {
      for (const {item,role} of entries) {
        const id=ITEM_IDS[item];
        if(!id) continue;
        const key=String(id);
        if(!OC_INFO.has(key)) OC_INFO.set(key,[]);
        OC_INFO.get(key).push({level,crime,role,item,consumable:CONSUMABLE_OC_IDS.has(id)});
      }
    }
    addOC(1,"First Aid and Abet",[{item:"Lockpicks",role:"Picklock"},{item:"Shaving Foam",role:"Decoy"}]);
    addOC(1,"Mob Mentality",[{item:"Jemmy",role:"Looter"}]);
    addOC(1,"Pet Project",[{item:"Dog Treats",role:"Kidnapper"},{item:"Net",role:"Muscle"},{item:"Lockpicks",role:"Picklock"}]);
    addOC(2,"Cash Me If You Can",[{item:"ID Badge",role:"Thief"},{item:"ATM Key",role:"Thief"}]);
    addOC(2,"Best of the Lot",[{item:"Lockpicks",role:"Picklock"},{item:"Police Badge",role:"Impersonator"}]);
    addOC(2,"Thou Shalt Not Steal",[{item:"Lockpicks",role:"Picklock"},{item:"Cassock",role:"Pickpocket"},{item:"Cell Phone",role:"Thief"}]);
    addOC(3,"Smoke and Wing Mirrors",[{item:"RF Detector",role:"Car Thief"},{item:"DSLR Camera",role:"Impersonator"}]);
    addOC(3,"Market Forces",[{item:"Gasoline",role:"Arsonist"}]);
    addOC(3,"Gaslight the Way",[{item:"Construction Helmet",role:"Imitator"},{item:"ID Badge",role:"Imitator"}]);
    addOC(4,"Snow Blind",[{item:"PCP",role:"Impersonator"}]);
    addOC(4,"Plucking the Lotus Petal",[{item:"Blank Casino Chips",role:"Hustler"}]);
    addOC(4,"Stage Fright",[{item:"Binoculars",role:"Lookout"}]);
    addOC(5,"Guardian Angels",[{item:"Hand Drill",role:"Engineer"}]);
    addOC(5,"Honey Trap",[{item:"Billfold",role:"Muscle"},{item:"Billfold",role:"Enforcer"}]);
    addOC(5,"Counter Offer",[{item:"Zip Ties",role:"Robber"},{item:"Zip Ties",role:"Looter"},{item:"Polymorphic Virus",role:"Hacker"},{item:"Lockpicks",role:"Picklock"},{item:"Wire Cutters",role:"Engineer"}]);
    addOC(5,"No Reserve",[{item:"Bolt Cutters",role:"Car Thief"},{item:"Spray Paint : Black",role:"Techie"},{item:"Chloroform",role:"Engineer"}]);
    addOC(6,"Bidding War",[{item:"C4 Explosive",role:"Bomber"},{item:"Flash Grenade",role:"Robber"},{item:"Dental Mirror",role:"Robber"},{item:"Jemmy",role:"Robber"}]);
    addOC(6,"Leave No Trace",[{item:"Police Badge",role:"Negotiator"},{item:"Police Badge",role:"Imitator"}]);
    addOC(6,"Sneaky Git Grab",[{item:"Tunneling Virus",role:"Hacker"},{item:"Wireless Dongle",role:"Techie"}]);
    addOC(7,"Blast from the Past",[{item:"Firewalk Virus",role:"Hacker"},{item:"Core Drill",role:"Engineer"},{item:"Shaped Charge",role:"Bomber"},{item:"Zip Ties",role:"Muscle"}]);
    addOC(7,"Window of Opportunity",[{item:"Wire Cutters",role:"Engineer"},{item:"Ladder",role:"Looter"},{item:"Angle Grinder",role:"Looter"},{item:"Razor Wire",role:"Muscle"},{item:"Floor Cleaner",role:"Muscle"}]);
    addOC(8,"Break the Bank",[{item:"Hand Drill",role:"Robber"},{item:"Hand Drill",role:"Muscle"},{item:"Hand Drill",role:"Thief"},{item:"Zip Ties",role:"Muscle"}]);
    addOC(8,"Clinical Precision",[{item:"Chloroform",role:"Assassin"},{item:"Blood Bag : Irradiated",role:"Cleaner"},{item:"Syringe",role:"Imitator"}]);
    addOC(8,"Stacking the Deck",[{item:"Jemmy",role:"Cat Burglar"},{item:"Smoke Grenade",role:"Driver"},{item:"Stealth Virus",role:"Hacker"},{item:"ID Badge",role:"Imitator"}]);
    addOC(8,"Lock Stock",[{item:"Lubricant",role:"Smuggler"}]);
    addOC(8,"Manifest Cruelty",[{item:"Stealth Virus",role:"Hacker"},{item:"Cigar Cutter",role:"Interrogator"},{item:"Car Battery",role:"Reviver"},{item:"Zip Ties",role:"Cat Burglar"}]);
    addOC(9,"Ace in the Hole",[{item:"ID Badge",role:"Imitator"}]);
    addOC(9,"Hostile Takeover",[{item:"Hard Drive",role:"Cat Burglar"},{item:"Igniter Cord",role:"Kidnapper"}]);
    addOC(9,"Gone Fission",[{item:"Zip Ties",role:"Hijacker"},{item:"Thermite",role:"Engineer"},{item:"Cut-Throat Razor",role:"Pickpocket"},{item:"DSLR Camera",role:"Imitator"},{item:"C4 Explosive",role:"Bomber"}]);
    addOC(10,"Crane Reaction",[{item:"Binoculars",role:"Lookout"},{item:"Shaped Charge",role:"Engineer"},{item:"Remote Detonator",role:"Bomber"},{item:"Tear Gas",role:"Muscle"}]);
    const OC_IDS=new Set([...OC_INFO.keys()]);
    const ENHANCER_INFO=new Map([
      [570,{effect:"Improves success rate for the Transporting Drugs crime in Crimes 1.0."}],
      [569,{effect:"Improves success rate for the Armed Robbery crime in Crimes 1.0."}],
      [576,{effect:"Improves success rate for the Kidnapping crime in Crimes 1.0."}],
      [567,{effect:"Improves Pickpocketing crime exp & skill gains by 5%."}],
      [578,{effect:"Improves Card Skimming crime exp & skill gains by 5%."}],
      [571,{effect:"Improves Scamming crime exp & skill gains by 5%."}],
      [574,{effect:"Improves success rate for the Robbing The Pawn Shop crime in Crimes 1.0."}],
      [1351,{effect:"Improves Burglary crime exp & skill gains by 5%."}],
      [564,{effect:"Improves Search for cash crime exp & skill gains by 5%."}],
      [577,{effect:"Improves success rate for the Arms Trafficking crime in Crimes 1.0."}],
      [565,{effect:"Improves Bootlegging crime exp & skill gains by 5% and copying speed by 100%."}],
      [421,{effect:"Increases travel capacity by +4. Does not stack with other suitcases."}],
      [633,{effect:"Improves Disposal crime exp & skill gains by 5%."}],
      [1346,{effect:"Improves Forgery crime exp & skill gains by 5%."}],
      [420,{effect:"Increases travel capacity by +3. Does not stack with other suitcases."}],
      [1353,{effect:"Improves Hustling crime exp & skill gains by 5%."}],
      [566,{effect:"Improves Shoplifting crime exp & skill gains by 5%."}],
      [1354,{effect:"Improves Cracking crime exp & skill gains by 5%."}],
      [979,{effect:"Improves Graffiti crime exp & skill gains by 5%."}],
      [819,{effect:"Boosts the effects of praying in the church by 10%."}],
      [573,{effect:"Improves success rate for the Grand Theft Auto crime in Crimes 1.0."}],
      [419,{effect:"Increases travel capacity by +2. Does not stack with other suitcases."}],
      [386,{effect:"Increases speed gains in the gym by 5%."}],
      [572,{effect:"Improves success rate for the Assassination crime in Crimes 1.0."}],
      [575,{effect:"Improves success rate for the Counterfeiting crime in Crimes 1.0."}],
      [544,{effect:"Improves Arson crime exp & skill gains by 5%. Ignites a fire in Arson."}],
      [579,{effect:"Improves success rate for the Hacking crime in Crimes 1.0."}],
      [893,{effect:"Required in Search for Cash."}],[1386,{effect:"Provides a passive damage bonus of +100%."}],
      [1384,{effect:"Prevents all addiction and negative side effects caused by Drugs."}],
      [1170,{effect:"Allows books to be read repeatedly."}],[1171,{effect:"Doubles resource bars and regeneration rates."}],
      [1385,{effect:"Prevents consumables from being consumed upon use."}],[1172,{effect:"Provides a passive critical hit chance bonus of +25%."}],
      [980,{effect:"Unlocks additional outcomes in Graffiti."}],[981,{effect:"Unlocks additional outcomes in Graffiti."}],
      [852,{effect:"Enables ability to search the beach."}],[853,{effect:"Enables access to the cemetery in Search For Cash."}],
      [886,{effect:"Unlocks additional outcomes in Shoplifting."}],[1084,{effect:"Unlocks additional outcomes for certain targets in Burglary."}],
      [568,{effect:"Improves success rate for the Larceny crime. Unlocks additional outcomes for certain targets in Burglary."}],
      [1202,{effect:"Unlocks additional outcomes for certain targets in Burglary."}],[1203,{effect:"Unlocks additional outcomes for certain targets in Burglary."}],
      [1201,{effect:"Unlocks additional outcomes for certain targets in Burglary."}],[1204,{effect:"Unlocks additional outcomes for certain targets in Burglary."}]
    ]);
    const ENH_IDS=new Set([...ENHANCER_INFO.keys()].map(String));
    const CRIME_ITEMS = [
      [1,"Forgery"],[54,"Arson"],[61,"Bootlegging. Required in Cracking"],[69,"Crimes 1.0"],[96,"Crimes 1.0"],
      [154,"Bootlegging. Required in Cracking"],[200,"Arson"],[201,"Arson"],[220,"Arson"],[221,"Arson"],[255,"Arson"],
      [259,"Arson"],[265,"Arson"],[275,"Arson"],[278,"Arson"],[280,"Arson"],[328,"Forgery"],[358,"Arson"],
      [381,"Bootlegging. Required in Cracking"],[407,"Arson"],[427,"Arson"],[437,"Forgery"],[544,"Arson"],[707,"Forgery"],
      [742,"Arson"],[833,"Forgery"],[846,"Forgery"],[856,"Forgery"],[857,"Graffiti"],[858,"Graffiti"],[859,"Graffiti"],
      [860,"Graffiti"],[861,"Graffiti"],[862,"Forgery"],[863,"Graffiti"],[883,"Forgery"],[906,"Disposal"],[907,"Forgery"],
      [956,"Bootlegging"],[1084,"Forgery"],[1085,"Arson"],[1094,"Arson"],[1123,"Card Skimming"],[1124,"Forgery"],
      [1125,"Card Skimming"],[1143,"Disposal"],[1201,"Disposal"],[1207,"Forgery"],[1212,"Disposal"],[1213,"Disposal"],
      [1215,"Forgery"],[1219,"Arson"],[1228,"Forgery"],[1233,"Disposal"],[1234,"Disposal"],[1235,"Arson"],[1244,"Forgery"],
      [1246,"Forgery"],[1248,"Arson"],[1249,"Disposal"],[1250,"Disposal"],[1252,"Forgery"],[1264,"Arson"],[1270,"Disposal"],
      [1272,"Arson"],[1261,"Forgery"],[1282,"Arson"],[1286,"Forgery"],[1289,"Forgery"],[1290,"Forgery"],[1294,"Arson"],
      [1300,"Cracking"],[1301,"Cracking"],[1302,"Cracking"],[1303,"Cracking"],[1304,"Cracking"],[1305,"Cracking"],[1306,"Cracking"],
      [1314,"Forgery"],[1315,"Forgery"],[1316,"Forgery"],[1317,"Forgery"],[1318,"Forgery"],[1319,"Forgery"],[1320,"Forgery"],
      [1321,"Forgery"],[1322,"Forgery"],[1327,"Forgery"],[1328,"Forgery"],[1329,"Forgery"],[1330,"Forgery"],[1332,"Forgery"],
      [1333,"Forgery"],[1334,"Forgery"],[1338,"Forgery"],[1340,"Disposal"],[1344,"Forgery"],[1347,"Forgery"],[1348,"Forgery"],
      [1382,"Forgery"],[1457,"Arson"],[1458,"Arson"],[1459,"Arson"],[1460,"Arson"],[1461,"Arson"],[1462,"Arson"],[1463,"Arson"],[1466,"Arson"]
    ];
    const CRIME_INFO=new Map(CRIME_ITEMS.map(([id,where])=>[id,{effect:`Required in ${where}.`} ]));
    CRIME_INFO.set(61,{effect:"Can be used to program viruses. Required in Bootlegging. Required in Cracking."});
    CRIME_INFO.set(154,{effect:"Can be used to access additional services while traveling and program viruses. Required in Bootlegging. Required in Cracking."});
    CRIME_INFO.set(381,{effect:"Can be used to access additional services while traveling and program viruses. Required in Bootlegging. Required in Cracking."});
    const CRIME_IDS=new Set(CRIME_ITEMS.map(([id])=>String(id)));
    const ENERGY_GAIN_INFO=new Map([[985,5],[986,10],[987,15],[530,20],[553,20],[532,25],[554,25],[533,30],[555,30],[206,250],[199,50],[367,150]]);
    const ENERGY_IDS=new Set([...ENERGY_GAIN_INFO.keys()].map(String));
    const NERVE_GAIN_INFO=new Map([
      [180,"1"],[181,"1"],[294,"1"],[426,"1"],[550,"2"],[531,"2"],[816,"2"],[638,"3"],[551,"3"],[542,"3"],
      [552,"4"],[541,"4"],[924,"5"],[873,"5"],[984,"5"],[196,"8-12"]
    ]);
    const NERVE_IDS=new Set([...NERVE_GAIN_INFO.keys()].map(String));
    const HAPPY_GAIN_INFO=new Map([
      [403,"Increases happiness by 5-20 if under 20% of maximum."],[366,"Increases happiness by 2,500 and booster cooldown by 6 hours."],
      [475,"Increases happiness by 10,000 and booster cooldown by 6 hours."],[367,"Refills energy. Increases happiness by 500 and booster cooldown by 6 hours."],
      [197,"Doubles happiness."],[206,"Increases happiness by 75. Includes side effects."],[199,"Increases happiness by 200-500. Includes side effects."],
      [201,"Increases happiness by 250. Includes side effects."],[203,"Increases happiness by 500 and reduces energy by 25. Includes side effects."],
      [205,"Increases happiness by 75."],[204,"Increases happiness by 50. Includes side effects."],[37,"Increases happiness by 25 and booster cooldown by 30 minutes."],
      [210,"Increases happiness by 25 and booster cooldown by 30 minutes."],[38,"Increases happiness by 25 and booster cooldown by 30 minutes."],
      [39,"Increases happiness by 25 and booster cooldown by 30 minutes."],[209,"Increases happiness by 25 and booster cooldown by 30 minutes."],
      [310,"Increases happiness by 25 and booster cooldown by 30 minutes."],[35,"Increases happiness by 25 and booster cooldown by 30 minutes."],
      [36,"Increases happiness by 35 and booster cooldown by 30 minutes."],[527,"Increases happiness by 50 and booster cooldown by 30 minutes."],
      [1312,"Increases happiness by 50 and booster cooldown by 30 minutes."],[634,"Increases happiness by 75 and booster cooldown by 30 minutes."],
      [528,"Increases happiness by 75 and booster cooldown by 30 minutes."],[529,"Increases happiness by 100 and booster cooldown by 30 minutes."],
      [556,"Increases happiness by 100 and booster cooldown by 30 minutes."],[1039,"Increases happiness by 150 and booster cooldown by 30 minutes."],
      [587,"Increases happiness by 150 and booster cooldown by 30 minutes."],[586,"Increases happiness by 150 and booster cooldown by 30 minutes."],
      [151,"Increases happiness by 150 and booster cooldown by 30 minutes."],[1028,"Increases happiness by 250 and booster cooldown by 30 minutes."]
    ]);
    const HAPPY_IDS=new Set([...HAPPY_GAIN_INFO.keys()].map(String));
    const HEALTH_GAIN_INFO=new Map([[68,"5%"],[67,"10%"],[66,"15%"],[732,"30%"],[733,"30%"],[736,"30%"],[737,"30%"],[734,"30%"],[735,"30%"],[738,"30%"],[739,"30%"],[200,"50%"]]);
    const HEALTH_IDS=new Set([...HEALTH_GAIN_INFO.keys()].map(String));
    let portal=null, observer=null, activeTipEl=null, activeTrigger=null, active=false;
    const GAP=8;

    const FORGERY_NAME_INTEL = Object.freeze({
      "skeleton key": {
        label: "ENHANCER",
        cls: "sakalux-ii-forgery--enh"
      },
      "id badge": {
        label: "OC",
        cls: "sakalux-ii-forgery--oc"
      },
      "atm key": {
        label: "OC",
        cls: "sakalux-ii-forgery--oc"
      },
      "police badge": {
        label: "OC",
        cls: "sakalux-ii-forgery--oc"
      }
    });

    function isForgeryPage(){
      return (
        location.pathname === "/page.php" &&
        new URLSearchParams(location.search).get("sid") === "crimes" &&
        location.hash.toLowerCase().includes("/forgery")
      );
    }

    function forgeryName(node){
      if(!node) return "";

      const clone=node.cloneNode(true);

      if(node.matches?.('[class*="optionWithLevelRequirement"]')){
        clone.querySelectorAll(
          '[class*="level___"],[class*="levelLabel"],[class*="levelStar"],[class*="separator"]'
        ).forEach(el=>el.remove());
      }

      if(node.matches?.('[class*="crimeOptionSection"]')){
        clone.querySelectorAll(
          'button,[class*="abandonButtonWrapper"]'
        ).forEach(el=>el.remove());
      }

      clone.querySelectorAll(".sakalux-ii-forgery-tag")
        .forEach(el=>el.remove());

      return String(clone.textContent||"")
        .replace(/\s+/g," ")
        .trim();
    }

    function applyForgeryIntel(node){
      if(!active||!isForgeryPage()||!node) return;

      const name=forgeryName(node);
      const info=FORGERY_NAME_INTEL[
        String(name||"").toLowerCase()
      ];
      const existing=node.querySelector(
        ':scope > .sakalux-ii-forgery-tag'
      );

      if(!info){
        existing?.remove();
        return;
      }

      if(
        existing &&
        existing.dataset.sakaluxForgeryType===info.label
      ) return;

      existing?.remove();

      const badge=document.createElement("span");
      badge.className=
        `sakalux-ii-forgery-tag ${info.cls}`;
      badge.dataset.sakaluxForgeryType=info.label;
      badge.textContent=info.label;
      badge.title=
        info.label==="ENHANCER"
          ?"Item Intel Enhancer"
          :"Item Intel OC Item";

      const abandon=node.querySelector(
        ':scope > [class*="abandonButtonWrapper"]'
      );

      if(abandon){
        node.insertBefore(badge,abandon);
      }else{
        node.appendChild(badge);
      }
    }

    function scanForgery(root=document){
      if(!active||!isForgeryPage()) return;

      const selector=
        '[class*="optionWithLevelRequirement"],' +
        '[class*="crimeOptionSection"]';

      if(root?.matches?.(selector)){
        applyForgeryIntel(root);
      }

      root?.querySelectorAll?.(selector)
        .forEach(applyForgeryIntel);
    }

    function injectStyles(){
      if(document.getElementById(STYLE_ID)) return;
      const style=document.createElement("style");
      style.id=STYLE_ID;
      style.textContent=`
        .sakalux-ii-badge{position:absolute;bottom:4px;display:inline-flex;align-items:center;gap:2px;min-height:15px;padding:1px 2px;border-radius:5px;background:color-mix(in srgb,var(--sakalux-bg) 88%,transparent);border:1px solid color-mix(in srgb,var(--sakalux-gold) 18%,transparent);box-sizing:border-box;z-index:10;overflow:visible;box-shadow:0 2px 5px rgba(0,0,0,.42),inset 0 1px 0 rgba(255,255,255,.04);backdrop-filter:blur(2px)}
        .sakalux-ii-badge--left{left:4px}.sakalux-ii-badge--right{right:4px}
        .sakalux-ii-token{height:11px;min-width:11px;padding:0 3px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;font-size:7px;line-height:1;font-weight:400;color:var(--sakalux-text);cursor:default;user-select:none;border:1px solid rgba(255,255,255,.14);box-shadow:0 0 4px rgba(0,0,0,.22)}
        .sakalux-ii-token--oc{background:linear-gradient(180deg,var(--sakalux-blue-bright),var(--sakalux-blue))!important}.sakalux-ii-token--enh{background:linear-gradient(180deg,var(--sakalux-gold-bright),var(--sakalux-gold-deep))!important}.sakalux-ii-token--cr{background:linear-gradient(180deg,var(--sakalux-red-bright),var(--sakalux-red))!important}
        .sakalux-ii-token--energy,.sakalux-ii-token--nerve,.sakalux-ii-token--happy,.sakalux-ii-token--health{width:11px;min-width:11px;padding:0;border-radius:50%;font-size:8px}
        .sakalux-ii-token--energy{background:linear-gradient(180deg,var(--sakalux-blue-bright),var(--sakalux-blue))!important}.sakalux-ii-token--nerve{background:linear-gradient(180deg,var(--sakalux-red-bright),var(--sakalux-red))!important}.sakalux-ii-token--happy{background:linear-gradient(180deg,var(--sakalux-gold-bright),var(--sakalux-gold))!important;color:var(--sakalux-bg)}.sakalux-ii-token--health{background:linear-gradient(180deg,var(--sakalux-green-bright),var(--sakalux-green))!important}
        .sakalux-ii-forgery-tag{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:16px!important;margin-left:7px!important;padding:1px 6px!important;border-radius:4px!important;font-size:9px!important;font-weight:700!important;line-height:12px!important;letter-spacing:.2px!important;vertical-align:middle!important;white-space:nowrap!important;box-sizing:border-box!important}
        .sakalux-ii-forgery--enh{color:var(--sakalux-gold-bright)!important;background:color-mix(in srgb,var(--sakalux-gold) 14%,var(--sakalux-bg))!important;border:1px solid color-mix(in srgb,var(--sakalux-gold) 58%,transparent)!important}
        .sakalux-ii-forgery--oc{color:#8bc1e7!important;background:color-mix(in srgb,var(--sakalux-blue) 14%,var(--sakalux-bg))!important;border:1px solid color-mix(in srgb,var(--sakalux-blue) 56%,transparent)!important}
        @media(max-width:820px){.sakalux-ii-forgery-tag{min-height:14px!important;margin-left:5px!important;padding:1px 5px!important;font-size:8px!important;line-height:10px!important}}
        .sakalux-ii-tip{position:fixed;background:radial-gradient(circle at top right,rgba(240,204,114,.12),transparent 34%),linear-gradient(180deg,var(--sakalux-panel),var(--sakalux-bg));color:var(--sakalux-text);border:1px solid rgba(240,204,114,.34);border-radius:8px;padding:7px 9px;font-size:11px;font-weight:400;line-height:1.25;white-space:nowrap;box-shadow:0 8px 18px rgba(0,0,0,.46),inset 0 1px 0 rgba(255,255,255,.05);pointer-events:none;text-align:left;opacity:0;transition:opacity .12s ease;z-index:2147483647}.sakalux-ii-tip.is-visible{opacity:1}.sakalux-ii-tip__line{display:block}.sakalux-ii-tip__line:first-child{color:#f0cc72}.sakalux-ii-tip__line+.sakalux-ii-tip__line{margin-top:2px}.sakalux-ii-tip__gap{display:block;height:6px}
        @media(max-width:820px){.sakalux-ii-badge{bottom:2px!important;gap:1px!important;min-height:11px!important;padding:1px 2px!important;border-radius:4px!important}.sakalux-ii-badge--left{left:4px!important}.sakalux-ii-badge--right{right:4px!important}.sakalux-ii-token{width:8px!important;min-width:8px!important;height:8px!important;min-height:8px!important;padding:0!important;border-radius:2px!important;font-size:5.5px!important;line-height:8px!important;font-weight:400!important}.sakalux-ii-token--energy,.sakalux-ii-token--nerve,.sakalux-ii-token--happy,.sakalux-ii-token--health{width:9px!important;min-width:9px!important;height:9px!important;min-height:9px!important;border-radius:50%!important;font-size:7px!important;line-height:9px!important}.sakalux-ii-token--health{font-size:0!important;position:relative!important}.sakalux-ii-token--health:before,.sakalux-ii-token--health:after{content:"";display:block;position:absolute;background:#fff;border-radius:1px}.sakalux-ii-token--health:before{width:2px;height:7px;left:3.5px;top:1px}.sakalux-ii-token--health:after{width:7px;height:2px;left:1px;top:3.5px}.sakalux-ii-tip{max-width:calc(100vw - 16px)!important;white-space:normal!important;font-size:10px!important}}
      `;
      document.head.appendChild(style);
    }
    function ensurePortal(){
      portal=document.getElementById(PORTAL_ID);
      if(portal) return portal;
      portal=document.createElement("div");portal.id=PORTAL_ID;portal.style.cssText="position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483647;";document.body.appendChild(portal);return portal;
    }
    function hideActiveTip(){if(activeTipEl){activeTipEl.classList.remove("is-visible");activeTipEl.remove();activeTipEl=null;}activeTrigger=null;}
    function positionTip(trigger,tip,preferRight){const tr=trigger.getBoundingClientRect(),vw=innerWidth,vh=innerHeight,tw=tip.offsetWidth,th=tip.offsetHeight;let left;if(preferRight){left=tr.right+GAP+tw<=vw-4?tr.right+GAP:tr.left-GAP-tw}else{left=tr.left-GAP-tw>=4?tr.left-GAP-tw:tr.right+GAP}left=Math.max(4,Math.min(vw-tw-4,left));let top=Math.max(4,Math.min(vh-th-4,tr.top+tr.height/2-th/2));tip.style.left=left+"px";tip.style.top=top+"px";}
    function appendLines(parent,text){String(text).trim().split(/(?<=\.)\s+/).filter(Boolean).forEach(part=>{const e=document.createElement("span");e.className="sakalux-ii-tip__line";e.textContent=part;parent.appendChild(e);});}
    function simpleTip(lines){const tip=document.createElement("div");tip.className="sakalux-ii-tip";lines.forEach(x=>appendLines(tip,x));return tip;}
    function ocTip(id){const tip=simpleTip(["OC Item"]);const rows=[...(OC_INFO.get(id)||[])].sort((a,b)=>b.level-a.level||a.crime.localeCompare(b.crime)||a.role.localeCompare(b.role));const seen=new Set();rows.forEach((r,i)=>{const k=`${r.level}|${r.crime}|${r.role}|${r.consumable}`;if(seen.has(k))return;seen.add(k);appendLines(tip,`Lvl ${r.level} - ${r.crime}`);appendLines(tip,r.role);if(r.consumable)appendLines(tip,"Consumable");const gap=document.createElement("span");gap.className="sakalux-ii-tip__gap";tip.appendChild(gap);});tip.lastElementChild?.classList.contains("sakalux-ii-tip__gap")&&tip.lastElementChild.remove();return tip;}
    const enhTip=id=>simpleTip(["Enhancer Item",ENHANCER_INFO.get(Number(id))?.effect||`ID ${id}`]);
    const crimeTip=id=>simpleTip(["Crime Item",CRIME_INFO.get(Number(id))?.effect||`ID ${id}`]);
    const energyTip=id=>simpleTip([`Energy Gain - ${ENERGY_GAIN_INFO.get(Number(id))} Energy`]);
    const nerveTip=id=>simpleTip([`Nerve Gain - ${NERVE_GAIN_INFO.get(Number(id))} Nerve`]);
    const happyTip=id=>simpleTip(["Happy Gains",HAPPY_GAIN_INFO.get(Number(id))||`ID ${id}`]);
    const healthTip=id=>simpleTip([`Health Gain - ${HEALTH_GAIN_INFO.get(Number(id))} Life`]);
    function bindTrigger(el,build,preferRight){
      const show=()=>{if(!active||activeTrigger===el)return;hideActiveTip();const tip=build();ensurePortal().appendChild(tip);void tip.offsetWidth;positionTip(el,tip,preferRight);requestAnimationFrame(()=>tip.classList.add("is-visible"));activeTipEl=tip;activeTrigger=el;};
      const hide=()=>{if(activeTrigger===el)hideActiveTip();};
      const toggle=e=>{e.stopPropagation();activeTrigger===el?hideActiveTip():show();};
      el.addEventListener("mouseenter",show);el.addEventListener("mouseleave",hide);el.addEventListener("click",toggle);el.addEventListener("focus",show);el.addEventListener("blur",hide);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(e)}else if(e.key==="Escape")hide();});
    }
    function token(cls,text,build,preferRight,label){const e=document.createElement("span");e.className="sakalux-ii-token "+cls;e.textContent=text;const pda=matchMedia("(max-width:820px)").matches;e.tabIndex=pda?-1:0;if(label&&!pda)e.setAttribute("aria-label",label);bindTrigger(e,build,preferRight);return e;}
    function leftBadge(id,a,b,c){const g=document.createElement("span");g.className="sakalux-ii-badge sakalux-ii-badge--left";const pda=matchMedia("(max-width:820px)").matches;if(a)g.appendChild(token("sakalux-ii-token--oc",pda?"O":"OC",()=>ocTip(id),true,"OC Item"));if(b)g.appendChild(token("sakalux-ii-token--enh",pda?"E":"ENH",()=>enhTip(id),true,"Enhancer Item"));if(c)g.appendChild(token("sakalux-ii-token--cr",pda?"C":"CR",()=>crimeTip(id),true,"Crime Item"));return g;}
    function rightBadge(id,a,b,c,d){const g=document.createElement("span");g.className="sakalux-ii-badge sakalux-ii-badge--right";if(a)g.appendChild(token("sakalux-ii-token--energy","⚡",()=>energyTip(id),false,"Energy Gain"));if(b)g.appendChild(token("sakalux-ii-token--nerve","✦",()=>nerveTip(id),false,"Nerve Gain"));if(c)g.appendChild(token("sakalux-ii-token--happy","☺",()=>happyTip(id),false,"Happy Gain"));if(d)g.appendChild(token("sakalux-ii-token--health","✚",()=>healthTip(id),false,"Health Gain"));return g;}
    function getId(img){const src=(img.getAttribute("src")||"")+" "+(img.getAttribute("srcset")||"");return src.match(/\/images\/items\/(\d+)\//i)?.[1]||null;}
    const ignore=el=>el.closest(".view-item-info")||el.closest(".item-model-player")||el.closest('[class*="previewAndPropertiesWrapper"]')||el.closest('[class*="itemPreview"]');
    const hostFor=img=>img.closest('[data-testid="img-container"]')||img.closest(".imgContainer___tEZeE")||img.closest(".image-wrap")||img.closest(".img-wrap")||img.closest(".thumbnail")||img.closest(".item-plate")||img.parentElement;
    function apply(img){if(!active||!img||img.dataset[DONE_ATTR])return;img.dataset[DONE_ATTR]="1";const id=getId(img),host=id?hostFor(img):null;if(!id||!host||ignore(host))return;const oc=OC_IDS.has(id),en=ENH_IDS.has(id),cr=CRIME_IDS.has(id),eg=ENERGY_IDS.has(id),ng=NERVE_IDS.has(id),hg=HAPPY_IDS.has(id),hl=HEALTH_IDS.has(id);if(!(oc||en||cr||eg||ng||hg||hl))return;if(getComputedStyle(host).position==="static")host.style.position="relative";if((oc||en||cr)&&!host.querySelector(".sakalux-ii-badge--left"))host.appendChild(leftBadge(id,oc,en,cr));if((eg||ng||hg||hl)&&!host.querySelector(".sakalux-ii-badge--right"))host.appendChild(rightBadge(id,eg,ng,hg,hl));}
    function scan(root=document){root.querySelectorAll?.('img[src*="/images/items/"],img[srcset*="/images/items/"]').forEach(apply);scanForgery(root);}
    function reposition(){if(activeTipEl&&activeTrigger)positionTip(activeTrigger,activeTipEl,!activeTrigger.closest(".sakalux-ii-badge--right"));}
    const clickHandler=e=>{if(!e.target.closest(".sakalux-ii-badge"))hideActiveTip();};
    function init(){if(active)return;active=true;injectStyles();ensurePortal();scan(document);observer=new MutationObserver(muts=>{if(!active)return;for(const m of muts)for(const n of m.addedNodes){if(!n||n.nodeType!==1)continue;if(n.tagName==="IMG")apply(n);scan(n);}});observer.observe(document.body,{childList:true,subtree:true});document.addEventListener("click",clickHandler);window.addEventListener("scroll",reposition,{passive:true,capture:true});window.addEventListener("resize",reposition,{passive:true});}
    function destroy(){active=false;observer?.disconnect();observer=null;hideActiveTip();document.removeEventListener("click",clickHandler);window.removeEventListener("scroll",reposition,true);window.removeEventListener("resize",reposition);document.querySelectorAll(".sakalux-ii-badge,.sakalux-ii-forgery-tag").forEach(e=>e.remove());document.querySelectorAll(`[data-${DONE_ATTR.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())}]`).forEach(e=>delete e.dataset[DONE_ATTR]);document.getElementById(PORTAL_ID)?.remove();portal=null;document.getElementById(STYLE_ID)?.remove();}
    return {init,onRouteChange(){if(active)scan(document);},destroy};
  }


let sakaluxItemSignalModule=null;
let sakaluxEventLensModule=null;
function itemSignals(){
 if(state['item-signals']){
  if(!sakaluxItemSignalModule){document.querySelectorAll('.slx-item-signals,.slx-item-tip').forEach(x=>x.remove());sakaluxItemSignalModule=createSakaLuXItemSignalModule({});sakaluxItemSignalModule.init()}
  else sakaluxItemSignalModule.onRouteChange();
 }else if(sakaluxItemSignalModule){sakaluxItemSignalModule.destroy();sakaluxItemSignalModule=null}
}
function eventLens(){
 document.getElementById('slx-event-lens')?.remove();
 if(state['event-lens']){
  if(!sakaluxEventLensModule){restoreNativeEvents();sakaluxEventLensModule=createSakaLuXEventLensModule({});sakaluxEventLensModule.init()}
  else sakaluxEventLensModule.onRouteChange();
 }else{if(sakaluxEventLensModule){sakaluxEventLensModule.destroy();sakaluxEventLensModule=null}restoreNativeEvents()}
}

let itemSignalsCfgSignature='';
function legacyItemSignals(){
 if(!state['item-signals']){document.querySelectorAll('.slx-item-signals,.slx-item-tip').forEach(x=>x.remove());itemSignalsCfgSignature='';return}
 const cfg={...ITEM_CFG_DEFAULTS,...load(SLX_KEYS.item,{})};
 const cfgSignature=JSON.stringify(cfg);if(cfgSignature!==itemSignalsCfgSignature){document.querySelectorAll('.slx-item-signals').forEach(x=>x.remove());itemSignalsCfgSignature=cfgSignature}
 const getId=img=>Number(((img.getAttribute('src')||'')+' '+(img.getAttribute('srcset')||'')).match(/\/images\/items\/(\d+)\//i)?.[1]||img.closest('[data-itemid],[data-item-id]')?.getAttribute('data-itemid')||img.closest('[data-item-id]')?.getAttribute('data-item-id')||0);
 const purpose=(txt,id)=>{
  const low=txt.toLowerCase(),out=[];
  const add=(type,label,title,note,glyph)=>{if(cfg[type]&&!out.some(x=>x.type===type))out.push({type,label,title,note,glyph})};
  if(ITEM_ID_INTEL[id]||ITEM_RULES[0].names.some(n=>low.includes(n.toLowerCase())))add('oc','O','OC Item',ITEM_ID_INTEL[id]?.note||'Required for one or more Organized Crime roles.','O');
  if(ITEM_ENHANCERS.has(id)||/enhancer|temporary effect|cooldown reduction/i.test(txt))add('enh','E','Enhancer Item',ITEM_ENHANCERS.get(id)||'Provides an enhancer or temporary effect.','E');
  if(/crime requirement|required in (?:forgery|arson|bootlegging|cracking|disposal)/i.test(txt))add('crime','C','Crime Item','Required by one or more Crimes 2.0 outcomes.','C');
  if(ITEM_ENERGY.has(id)||/\+\s*\d+\s*energy/i.test(txt))add('energy','⚡','Energy Gain',ITEM_ENERGY.has(id)?`Restores ${ITEM_ENERGY.get(id)} energy.`:'Restores energy.','⚡');
  if(ITEM_NERVE.has(id)||/\+\s*\d+\s*nerve/i.test(txt))add('nerve','✦','Nerve Gain',ITEM_NERVE.has(id)?`Restores ${ITEM_NERVE.get(id)} nerve.`:'Restores nerve.','✦');
  if(/\+\s*\d+\s*(?:happy|happiness)|candy|chocolate|lollipop|bonbons|jawbreaker|pixie sticks|erotic dvd/i.test(txt))add('happy','☺','Happy Gains','Increases happiness.','☺');
  if(ITEM_HEALTH.has(id)||/first aid|morphine|blood bag|medical|\bheal|\blife/i.test(txt))add('heal','✚','Health Gain',ITEM_HEALTH.has(id)?`Restores ${ITEM_HEALTH.get(id)} life.`:'Restores life or reduces hospital time.','✚');
  return out;
 };
 const hideTip=()=>document.querySelectorAll('.slx-item-tip').forEach(x=>x.remove());
 const showTip=(host,items)=>{
  hideTip();const tip=document.createElement('div');tip.className='slx-item-tip';
  tip.innerHTML=items.map((x,i)=>`${i?'<div class="slx-item-tip-gap"></div>':''}<span class="slx-item-tip-title">${esc(x.title)}</span><span class="slx-item-tip-line">${esc(x.note)}</span>`).join('');
  document.body.appendChild(tip);const r=(host.closest('li,tr,[class*="item"]')||host).getBoundingClientRect(),left=Math.max(10,Math.min(innerWidth-tip.offsetWidth-10,(innerWidth-tip.offsetWidth)/2));let top=r.top-tip.offsetHeight-8;if(top<8)top=Math.min(innerHeight-tip.offsetHeight-8,r.bottom+8);tip.style.left=left+'px';tip.style.top=Math.max(8,top)+'px';
  clearTimeout(itemSignals.tipTimer);itemSignals.tipTimer=setTimeout(hideTip,4500);
 };
 for(const img of document.querySelectorAll('img[src*="/images/items/"],img[srcset*="/images/items/"]')){
  if(img.closest('#'+IDS.overlay+',.slx-suite-float,.slx-item-tip'))continue;
  const id=getId(img),row=img.closest('li,tr,[class*="item"],[data-item],[data-itemid],[data-item-id],a')||img.parentElement,host=img.closest('[data-testid="img-container"],[class*="imgContainer"],.image-wrap,.img-wrap,.thumbnail,.item-plate')||img.parentElement;
  if(!host||host.closest('.view-item-info,[class*="itemPreview"],[class*="previewAndPropertiesWrapper"]'))continue;
  if(host.querySelector('.slx-item-signals'))continue;
  const txt=(row?.innerText||img.alt||img.title||'').trim(),items=purpose(txt,id);if(!items.length)continue;
  host.classList.add('slx-item-signal-host');const left=document.createElement('span'),right=document.createElement('span');left.className='slx-item-signals';right.className='slx-item-signals slx-item-signals-right';
  for(const x of items){const b=document.createElement('button');b.type='button';b.className='slx-item-signal '+x.type;b.textContent=x.label;b.title=x.title;b.onclick=e=>{e.preventDefault();e.stopPropagation();showTip(host,[x,...items.filter(y=>y!==x)])};(x.type==='oc'||x.type==='enh'||x.type==='crime'?left:right).appendChild(b)}
  if(left.childElementCount)host.appendChild(left);if(right.childElementCount)host.appendChild(right);
 }
}
function onEventsPage(){return /\/page\.php$/i.test(location.pathname)&&new URLSearchParams(location.search).get('sid')==='events'||/\bEvents\b/i.test(document.querySelector('h1,h2')?.textContent||'')}
const EVENT_LENS_CATS={
 all:{label:'All Events',glyph:'▦',tone:'#e0bd62'},money:{label:'Money',glyph:'$',tone:'#67c65c'},items:{label:'Items',glyph:'▣',tone:'#57a5df'},faction:{label:'Faction',glyph:'⬡',tone:'#e0bd62'},attacks:{label:'Attacks',glyph:'⚔',tone:'#e96773'},racing:{label:'Racing',glyph:'⚑',tone:'#e0bd62'},hospital:{label:'Hospital',glyph:'✚',tone:'#e96773'},trades:{label:'Trades',glyph:'⇄',tone:'#57a5df'},crimes:{label:'Crimes',glyph:'◆',tone:'#e69a4b'},other:{label:'Other',glyph:'•••',tone:'#969da5'},saved:{label:'Saved',glyph:'★',tone:'#e0bd62'}
};
const eventLensState={filter:'all',search:'',collapsed:new Set(),signature:''};
function classifyEvent(t){if(/\bsold\b|\bbought\b|received.+item|item market|bazaar|plushie|flower|grenade|bottle|weapon|armor/i.test(t))return'items';if(/faction|chain|ranked war|territor|armory/i.test(t))return'faction';if(/attack|mug|defeat|assist|stalemate|bounty|hospitalized/i.test(t))return'attacks';if(/hospital|reviv|medical/i.test(t))return'hospital';if(/race|racing|raceway/i.test(t))return'racing';if(/trade|exchange/i.test(t))return'trades';if(/crime|burgl|pickpocket|scam/i.test(t))return'crimes';if(/payment|money|cash|bank|stock|dividend|interest|\$[\d,]+/i.test(t))return'money';return'other'}
function collectEvents(){
 const selector='li,tr,[class*="event"]',rows=[...document.querySelectorAll(selector)],out=[],seen=new Set();
 for(const el of rows){
  if(el.closest('#slx-event-lens')||el===document.body||el===document.documentElement)continue;
  if([...el.children].some(c=>c.matches?.(selector)&&(c.innerText||'').trim().length>10))continue;
  const raw=(el.innerText||'').trim(),text=raw.replace(/\s+/g,' ');if(text.length<10||text.length>800||seen.has(text))continue;
  if(!/\d{1,2}:\d{2}|ago|yesterday|today|you |your |buyer:|from:/i.test(text))continue;
  seen.add(text);const lines=raw.split(/\n+/).map(x=>x.trim()).filter(Boolean),time=(text.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/)||[])[0]||'',date=(text.match(/\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/)||[])[0]||'',amount=(text.match(/[+\-]?\$[\d,]+(?:\.\d+)?/)||[])[0]||'';
  const clean=lines.filter(x=>x!==time&&x!==date&&!/^\d{1,2}:\d{2}(?::\d{2})?$/.test(x)&&!/^(today|yesterday)$/i.test(x)),title=(clean[0]||text).replace(/\s+[›»>]\s*$/,'').slice(0,180),detail=clean.filter((x,i)=>i>0&&x!==amount).slice(0,2).join(' · '),link=el.querySelector('a[href]')?.href||'';
  const now=new Date(),day=date||(/yesterday/i.test(text)?'Yesterday':'Today');out.push({key:text,text,title,detail,amount,time,date,day,cat:classifyEvent(text),link,el});if(out.length>=150)break;
 }
 return out;
}
function restoreNativeEvents(){document.querySelectorAll('.slx-event-native-row-hidden').forEach(x=>x.classList.remove('slx-event-native-row-hidden'))}
function legacyEventLens(force=false){
 if(!state['event-lens']||!onEventsPage()){document.getElementById('slx-event-lens')?.remove();restoreNativeEvents();eventLensState.signature='';return}
 const events=collectEvents();if(!events.length)return;const sig=events.map(x=>x.key).join('|');let panel=document.getElementById('slx-event-lens');
 if(panel&&!force&&sig===eventLensState.signature)return;eventLensState.signature=sig;
 if(!panel){panel=document.createElement('section');panel.id='slx-event-lens';const first=events[0].el,parent=first?.parentElement;if(parent?.parentElement)parent.parentElement.insertBefore(panel,parent);else(document.querySelector('#mainContainer')||document.body).prepend(panel)}
 for(const x of events)x.el.classList.add('slx-event-native-row-hidden');
 const counts=events.reduce((a,x)=>(a[x.cat]=(a[x.cat]||0)+1,a),{}),order=['all','money','items','faction','attacks','racing','hospital','trades','crimes','other','saved'];
 panel.innerHTML=`<div class="slx-el-filters">${order.filter(k=>k==='all'||k==='saved'||counts[k]).map(k=>{const c=EVENT_LENS_CATS[k],n=k==='all'?events.length:k==='saved'?load(K.eventSaved,[]).length:counts[k]||0;return`<button class="slx-el-chip ${eventLensState.filter===k?'is-active':''}" data-el-filter="${k}" style="color:${c.tone}"><span class="slx-el-glyph">${c.glyph}</span><span>${c.label}</span><span class="slx-el-count">${n}</span></button>`}).join('')}</div><div class="slx-el-controls"><label class="slx-el-search"><span>🔎</span><input id="slx-el-search" value="${esc(eventLensState.search)}" placeholder="Search people, items, races, amounts..."><button class="slx-el-clear" type="button">×</button></label><div class="slx-el-actions"><button id="slx-el-refresh">↻ Refresh</button><div class="slx-el-meter"><span id="slx-el-visible">0</span>&nbsp;/&nbsp;${events.length}</div><button id="slx-el-reset">Reset</button></div></div><div class="slx-el-list"></div>`;
 const paint=()=>{
  const saved=load(K.eventSaved,[]),q=eventLensState.search.trim().toLowerCase(),visible=events.filter(x=>(eventLensState.filter==='all'||eventLensState.filter==='saved'&&saved.includes(x.key)||x.cat===eventLensState.filter)&&(!q||x.text.toLowerCase().includes(q))).slice(0,100),groups=new Map();for(const x of visible){if(!groups.has(x.day))groups.set(x.day,[]);groups.get(x.day).push(x)}
  panel.querySelector('#slx-el-visible').textContent=visible.length;const list=panel.querySelector('.slx-el-list');list.innerHTML=visible.length?[...groups].map(([day,items])=>`<section class="slx-el-day"><header class="slx-el-day-head"><strong>${esc(String(day).toUpperCase())}</strong><span class="slx-el-day-count">${items.length} event${items.length===1?'':'s'}</span><button class="slx-el-collapse" data-el-day="${esc(encodeURIComponent(day))}">${eventLensState.collapsed.has(day)?'▼':'▲'}</button></header><div ${eventLensState.collapsed.has(day)?'hidden':''}>${items.map(x=>{const c=EVENT_LENS_CATS[x.cat],isSaved=saved.includes(x.key);return`<article class="slx-el-card" style="--tone:${c.tone}"><span class="slx-el-icon">${c.glyph}</span><div class="slx-el-body">${x.link?`<a class="slx-el-title" href="${esc(x.link)}">${esc(x.title)} ›</a>`:`<span class="slx-el-title">${esc(x.title)}</span>`}${x.detail?`<div class="slx-el-detail">${esc(x.detail)}</div>`:''}${x.amount?`<div class="slx-el-amount">${esc(x.amount)}</div>`:''}</div><div class="slx-el-time">${esc(x.time||'')}<div class="slx-el-date">${esc(x.date||'')}</div></div><button class="slx-el-star ${isSaved?'is-saved':''}" data-el-save="${esc(encodeURIComponent(x.key))}" title="Save event">★</button></article>`}).join('')}</div></section>`).join(''):'<div class="slx-el-empty">No events match these filters.</div>';
  list.querySelectorAll('[data-el-save]').forEach(b=>b.onclick=()=>{const key=decodeURIComponent(b.dataset.elSave);let a=load(K.eventSaved,[]);a=a.includes(key)?a.filter(x=>x!==key):[key,...a];save(K.eventSaved,a.slice(0,250));paint()});list.querySelectorAll('[data-el-day]').forEach(b=>b.onclick=()=>{const day=decodeURIComponent(b.dataset.elDay);eventLensState.collapsed.has(day)?eventLensState.collapsed.delete(day):eventLensState.collapsed.add(day);paint()});
 };
 panel.querySelectorAll('[data-el-filter]').forEach(b=>b.onclick=()=>{eventLensState.filter=b.dataset.elFilter;eventLens(true)});const input=panel.querySelector('#slx-el-search');input.oninput=()=>{eventLensState.search=input.value;paint()};panel.querySelector('.slx-el-clear').onclick=()=>{eventLensState.search='';input.value='';paint()};panel.querySelector('#slx-el-reset').onclick=()=>{eventLensState.filter='all';eventLensState.search='';eventLens(true)};panel.querySelector('#slx-el-refresh').onclick=()=>{restoreNativeEvents();const native=[...document.querySelectorAll('button,a')].find(x=>!x.closest('#slx-event-lens')&&/refresh/i.test(x.textContent||x.title||''));native?.click();setTimeout(()=>eventLens(true),700)};paint();
}

function chainText(){const t=document.body.innerText||'',m=t.match(/chain[^0-9]{0,30}(\d[\d,]*)[\s\S]{0,100}?(\d{1,2}:\d{2}(?::\d{2})?)/i);return m?{count:m[1],time:m[2]}:null}
function chainSecs(x){if(!x)return 99999;const a=x.split(':').map(Number);return a.length===3?a[0]*3600+a[1]*60+a[2]:a[0]*60+a[1]}
function chainAlarm(force=false){let p=document.getElementById('slx-chain-alarm-panel');if(!state['chain-alarm']){p?.remove();return}const c=chainText();if(!c&&!force){p?.remove();return}const cfg={...CHAIN_DEFAULTS,...load(SLX_KEYS.chain,{})};if(!p){p=document.createElement('div');p.id='slx-chain-alarm-panel';p.className='slx-suite-float';p.style.top=(cfg.pos?.top||155)+'px';p.style.left=cfg.pos?.left!=null?cfg.pos.left+'px':'';p.style.right=cfg.pos?.left!=null?'auto':'10px';p.style.width=(cfg.size?.w||210)+'px';p.style.height=(cfg.size?.h||120)+'px';p.style.resize='both';p.style.overflow='auto';p.innerHTML='<div class="slx-float-head"><strong>⛓️ Chain Alarm</strong><button class="slxs-close">×</button></div><div class="slx-float-body"></div>';document.body.appendChild(p);p.querySelector('.slxs-close').onclick=()=>p.remove();let d=null,h=p.querySelector('.slx-float-head');h.onpointerdown=e=>{d={x:e.clientX-p.offsetLeft,y:e.clientY-p.offsetTop};h.setPointerCapture(e.pointerId)};h.onpointermove=e=>{if(d){p.style.left=Math.max(0,e.clientX-d.x)+'px';p.style.top=Math.max(0,e.clientY-d.y)+'px';p.style.right='auto'}};h.onpointerup=()=>{d=null;cfg.pos={left:p.offsetLeft,top:p.offsetTop};cfg.size={w:p.offsetWidth,h:p.offsetHeight};save(SLX_KEYS.chain,cfg)}}const sec=chainSecs(c?.time),crit=sec<=cfg.critical,warn=sec<=cfg.warn;const body=p.querySelector('.slx-float-body');body.innerHTML=c?`Chain: <b>${c.count}</b><br>Timer: <b>${c.time}</b>${warn?'<br>⚠ Chain timer is low.':''}`:'Chain data is not visible on this page.';p.style.borderColor=crit?'#db4455':warn?'#b78b34':'#4a5260';p.style.opacity=(cfg.dim&&document.hidden)?'.45':'1';p.style.animation=(cfg.flash&&crit&&!document.hidden)?'slxChainFlash .8s steps(2,end) infinite':'none'}
if(!document.getElementById('slx-chain-keyframes')){const st=document.createElement('style');st.id='slx-chain-keyframes';st.textContent='@keyframes slxChainFlash{50%{box-shadow:0 0 20px #ff334d}}';document.head.appendChild(st)}
document.addEventListener('visibilitychange',()=>{if(state['chain-alarm'])chainAlarm()});document.addEventListener('keydown',e=>{if(e.altKey&&String(e.key).toLowerCase()==='c'){e.preventDefault();const p=document.getElementById('slx-chain-alarm-panel');if(p)p.remove();else chainAlarm(true)}});

function pagePanel(id,title,html){document.getElementById(id)?.remove();const a=document.querySelector('h1,h2')?.parentElement||document.querySelector('#mainContainer');if(!a)return;const p=document.createElement('div');p.id=id;p.className='slx-inline-panel';p.innerHTML=`<div class="slx-inline-top"><strong>${title}</strong></div><div class="slx-stat">${html}</div>`;a.prepend(p)}
function factionRows(){const o=[],seen=new Set;for(const e of document.querySelectorAll('tr,li,[class*="member"]')){const a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]');if(!a)continue;const n=(a.textContent||'').trim(),t=(e.innerText||'').replace(/\s+/g,' ');if(!n||seen.has(n)||t.length>800)continue;seen.add(n);o.push({n,t,e,a,status:/hospital/i.test(t)?'Hospital':/travel|abroad/i.test(t)?'Travel':/jail/i.test(t)?'Jail':'Okay',act:/online/i.test(t)?'Online':/idle/i.test(t)?'Idle':/offline/i.test(t)?'Offline':'Unknown'})}return o}
function factionPulse(){
 document.getElementById('slx-faction-pulse')?.remove();if(!state['faction-pulse']||!/faction/i.test(location.href))return;
 const cfg={...PULSE_CFG_DEFAULTS,...load(SLX_KEYS.pulse,{})},r=factionRows(),n=x=>r.filter(y=>y.status===x||y.act===x).length;if(!r.length)return;
 const order={Hospital:0,Travel:1,Jail:2,Okay:3},actOrder={Online:0,Idle:1,Unknown:2,Offline:3};
 const sorted=[...r].sort((a,b)=>cfg.sort==='name'?a.n.localeCompare(b.n):(order[a.status]-order[b.status]||actOrder[a.act]-actOrder[b.act]||a.n.localeCompare(b.n)));
 pagePanel('slx-faction-pulse','📡 Faction Pulse',`Members: <b>${r.length}</b> · online: <b>${n('Online')}</b> · idle: <b>${n('Idle')}</b> · hospital: <b>${n('Hospital')}</b> · traveling: <b>${n('Travel')}</b> · jail: <b>${n('Jail')}</b> · offline: <b>${n('Offline')}</b><br><button id="slx-pulse-sort">SORT ${cfg.sort==='name'?'STATUS':'NAME'}</button> <button id="slx-pulse-copy">COPY WATCHLIST</button>${cfg.compact?'':`<br>${sorted.filter(x=>x.status!=='Okay'||x.act==='Offline').slice(0,12).map(x=>`${esc(x.n)} [${x.status}/${x.act}]`).join(' · ')}`}`);
 document.getElementById('slx-pulse-sort')?.addEventListener('click',()=>{cfg.sort=cfg.sort==='name'?'status':'name';save(SLX_KEYS.pulse,cfg);factionPulse()});
 document.getElementById('slx-pulse-copy')?.addEventListener('click',()=>prompt('Faction Pulse watchlist:',sorted.filter(x=>x.status!=='Okay'||x.act==='Offline').map(x=>`${x.n}: ${x.status}/${x.act}`).join('\n')));
}
function armoryRadar(){
 document.getElementById('slx-armory-radar')?.remove();document.querySelectorAll('[data-slx-loan]').forEach(x=>x.remove());document.querySelectorAll('.slx-armory-loaned,.slx-armory-available').forEach(x=>{x.classList.remove('slx-armory-loaned','slx-armory-available');x.style.removeProperty('outline')});
 if(!state['armory-loan-radar']||!/(armory|armoury|faction|profiles\.php)/i.test(location.href))return;
 const onArmory=/(armory|armoury)/i.test(location.href)||/\barmou?ry\b/i.test(document.body.innerText||'');
 if(onArmory){const rows=[];for(const e of document.querySelectorAll('li,tr,[class*="item"],[class*="weapon"],[class*="armor"]')){const t=(e.innerText||'').replace(/\s+/g,' ').trim();if(t.length>800||!/loaned|borrowed|available|returned|holder/i.test(t))continue;const h=(t.match(/(?:loaned to|borrowed by|holder)\s*:?\s*([A-Za-z0-9_\-\[\] ]{2,35})/i)||[])[1]?.trim()||'';const item=(e.querySelector('[class*="name"],a')?.textContent||t.split(/loaned|borrowed|available/i)[0]).trim().slice(0,90);rows.push({item,t,h});e.classList.add(h?'slx-armory-loaned':'slx-armory-available');e.style.outline=h?'1px solid #b44':'1px solid #285';if(h){const b=document.createElement('button');b.dataset.slxLoan='1';b.className='slx-badge-mini';b.textContent='LOAN';b.onclick=()=>alert(`${item}\nHolder: ${h}\n\n${t}`);e.appendChild(b)}}if(rows.length){save(SLX_KEYS.armory,{at:Date.now(),url:location.href,rows});pagePanel('slx-armory-radar','🎒 Armory Loan Radar',`Scanned: <b>${rows.length}</b> · loaned: <b>${rows.filter(x=>x.h).length}</b> · available: <b>${rows.filter(x=>!x.h).length}</b> · snapshot saved. <button id="slx-armory-rescan">SCAN</button>`);document.getElementById('slx-armory-rescan')?.addEventListener('click',armoryRadar)}}
 const snap=load(SLX_KEYS.armory,null);if(!snap?.rows?.length)return;
 for(const r of factionRows()){const mine=snap.rows.filter(x=>x.h&&x.h.toLowerCase().includes(r.n.toLowerCase()));if(!mine.length)continue;const b=document.createElement('button');b.dataset.slxLoan='1';b.className='slx-badge-mini';b.textContent=`🎒 ${mine.length}`;b.title='Armory loans';b.onclick=e=>{e.preventDefault();e.stopPropagation();alert(`${r.n} — loaned items\n\n`+mine.map(x=>x.item).join('\n'))};r.a.after(b)}
}
function travelMap(){
 document.querySelectorAll('.slx-country-tag').forEach(x=>x.remove());document.getElementById('slx-travel-summary')?.remove();if(!state['member-travel-map']||!/faction|profiles\.php/i.test(location.href))return;
 const normalize=x=>COUNTRY_ALIASES[x]||x,ov=load(SLX_KEYS.travel,{}),rows=factionRows(),counts={};
 for(const r of rows){const id=(r.a.href.match(/XID=(\d+)/)||[])[1]||r.n,low=r.t.toLowerCase();let c=normalize(ov[id]||Object.keys({...COUNTRY_META,...COUNTRY_ALIASES}).find(x=>low.includes(x))||'');if(!COUNTRY_META[c])continue;counts[c]=(counts[c]||0)+1;const tag=document.createElement('button');tag.type='button';tag.className='slx-country-tag slx-badge-mini';tag.textContent=COUNTRY_META[c].flag;tag.title=`${COUNTRY_META[c].label} — tap to edit`;tag.dataset.country=c;tag.onclick=e=>{e.preventDefault();e.stopPropagation();const v=prompt('Country override (blank = automatic):',COUNTRY_META[c].label);if(v===null)return;const k=normalize(v.trim().toLowerCase());if(v.trim())ov[id]=k;else delete ov[id];save(SLX_KEYS.travel,ov);travelMap()};r.a.after(tag)}
 const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]||COUNTRY_META[a[0]].label.localeCompare(COUNTRY_META[b[0]].label));if(entries.length){pagePanel('slx-travel-summary','🌍 Member Travel Map',`<button id="slx-travel-sort">SORT COUNT/NAME</button> <button id="slx-travel-all">SHOW ALL</button> <button id="slx-travel-wipe">WIPE OVERRIDES</button><div class="slx-travel-grid">${entries.map(([c,n])=>`<button class="slx-mini-card" data-country="${esc(c)}"><b>${COUNTRY_META[c].flag} ${esc(COUNTRY_META[c].label)}</b>${n} member${n===1?'':'s'}</button>`).join('')}</div>`);const panel=document.getElementById('slx-travel-summary');panel?.querySelectorAll('[data-country]').forEach(b=>b.onclick=()=>{const c=b.dataset.country;rows.forEach(r=>{const tag=r.e.querySelector?.(`.slx-country-tag[data-country="${CSS.escape(c)}"]`);if(!r.e.dataset.slxOrigDisplay)r.e.dataset.slxOrigDisplay=r.e.style.display||'__empty__';r.e.style.display=tag?'': 'none'})});document.getElementById('slx-travel-sort')?.addEventListener('click',()=>{entries.sort((a,b)=>COUNTRY_META[a[0]].label.localeCompare(COUNTRY_META[b[0]].label));const grid=panel?.querySelector('.slx-travel-grid');if(grid)grid.innerHTML=entries.map(([c,n])=>`<button class="slx-mini-card" data-country="${esc(c)}"><b>${COUNTRY_META[c].flag} ${esc(COUNTRY_META[c].label)}</b>${n} member${n===1?'':'s'}</button>`).join('');travelMap()});document.getElementById('slx-travel-all')?.addEventListener('click',()=>rows.forEach(r=>{r.e.style.display=r.e.dataset.slxOrigDisplay==='__empty__'?'':(r.e.dataset.slxOrigDisplay||'')}));document.getElementById('slx-travel-wipe')?.addEventListener('click',()=>{if(confirm('Clear all country overrides?')){localStorage.removeItem(SLX_KEYS.travel);travelMap()}})}
}
function ocRoleMatch(){document.querySelectorAll('.slx-oc-match,.slx-oc-pred').forEach(x=>x.remove());if(!state['oc-role-match']||!/(organizedcrimes|crime|faction)/i.test(location.href))return;const cfg={...OC_CFG_DEFAULTS,...load(SLX_KEYS.ocCfg,{})};for(const e of document.querySelectorAll('li,tr,[class*="crime"],[class*="role"],[class*="panel"]')){const t=e.innerText||'';if(t.length>1600||!/(role|success|position|chance)/i.test(t))continue;const ps=[...t.matchAll(/([A-Za-z][A-Za-z \-]{2,34})\s*[:\-]?\s*(\d{1,3}(?:\.\d+)?)\s*%/g)].map(m=>({n:m[1].trim(),p:+m[2]})).filter(x=>x.p<=100);if(!ps.length)continue;const sorted=[...ps].sort((a,b)=>b.p-a.p),best=sorted[0],avg=ps.reduce((a,x)=>a+x.p,0)/ps.length,tier=avg>=75?'HIGH':avg>=65?'NORMAL':avg>=50?'LOW':'CRITICAL',risk=avg>=75?'Balanced Team':avg>=65?'Moderate Risk':avg>=50?'Needs Attention':'High-Risk Assignment';const tag=document.createElement('span');tag.className='slx-oc-match slx-badge-mini';tag.textContent=`BEST ${best.n} ${best.p}%`;tag.title=`Suitability ${tier} · threshold ${cfg.threshold}%`;e.appendChild(tag);const pred=document.createElement('span');pred.className='slx-oc-pred slx-badge-mini';pred.textContent=`EST ${avg.toFixed(0)}% ${avg>=cfg.threshold?'✓':'⚠'} ${tier}`;pred.title=risk;e.appendChild(pred)}}
function ocReadiness(){
 document.getElementById('slx-oc-ready')?.remove();document.querySelectorAll('.slx-oc-loan-role').forEach(x=>x.remove());if(!state['oc-readiness']||!/(organizedcrimes|crime|faction)/i.test(location.href))return;
 const cfg={...OC_CFG_DEFAULTS,...load(SLX_KEYS.ocCfg,{})},t=document.body.innerText||'',no=/not (?:currently )?in an organized crime|not in an oc|join an organized crime/i.test(t),matches=[...t.matchAll(/(?:missing|required item|vacant role|not ready)[^\n]{0,160}/gi)].map(x=>x[0].trim());
 const sections=[...document.querySelectorAll('section,article,div,li')].filter(e=>/recruiting|planning/i.test((e.querySelector('h1,h2,h3,h4,[class*="title"]')?.textContent||'').trim())&&(e.innerText||'').length<8000),captured=[];for(const sec of sections){const phase=/recruiting/i.test(sec.innerText||'')?'Recruiting':'Planning';for(const m of (sec.innerText||'').matchAll(/(?:role|position)\s*:?\s*([A-Za-z][A-Za-z \-]{2,40})[\s\S]{0,120}?(?:requires?|required item)\s*:?\s*([A-Za-z0-9 '&\-]{3,60})/gi))captured.push({phase,role:m[1].trim(),item:m[2].trim()})}
 const generic=[...t.matchAll(/(?:requires?|required)\s*:?\s*([A-Za-z0-9 '&\-]{3,55})/gi)].map(x=>({phase:'Visible',role:'Unknown',item:x[1].trim()}));const requirements=[...captured,...generic].filter((x,i,a)=>a.findIndex(y=>y.phase===x.phase&&y.role===x.role&&y.item===x.item)===i).slice(0,200);if(requirements.length)save(SLX_KEYS.ocReq,{at:Date.now(),url:location.href,requirements});
 const scan=load(SLX_KEYS.ocReq,{requirements:[]}),loan=load(SLX_KEYS.armory,{rows:[]});let loanHits=0,reqHits=0;for(const e of document.querySelectorAll('li,tr,[class*="crime"],[class*="role"]')){const txt=(e.innerText||'').replace(/\s+/g,' ');if(txt.length>1400)continue;const role=(txt.match(/(?:role|position)\s*:?\s*([A-Za-z][A-Za-z \-]{2,35})/i)||[])[1],mem=(txt.match(/([A-Za-z0-9_\-]{2,30})\s*\[\d+\]/)||[])[1];if(!mem)continue;const held=(loan.rows||[]).filter(x=>x.h&&x.h.toLowerCase().includes(mem.toLowerCase())),needed=(scan.requirements||[]).filter(x=>!role||x.role==='Unknown'||x.role.toLowerCase().includes(role.toLowerCase())||role.toLowerCase().includes(x.role.toLowerCase()));const matching=held.filter(h=>needed.some(n=>(h.item||h.t||'').toLowerCase().includes(n.item.toLowerCase())));if(held.length){const b=document.createElement('span');b.className='slx-oc-loan-role slx-badge-mini';b.textContent=`🎒 ${held.length}${matching.length?` / ${matching.length} req`:''}`;b.title=[...held.map(x=>x.item||x.t),...matching.map(x=>'MATCH: '+(x.item||x.t))].join('\n');e.appendChild(b);loanHits++;reqHits+=matching.length}}
 if(no||matches.length||scan.requirements?.length)pagePanel('slx-oc-ready','✅ OC Readiness',`${no?'⚠ <b>Not in an active OC.</b><br>':''}${matches.length?`Warnings: <b>${matches.length}</b><br>${matches.slice(0,cfg.scope==='all'?12:6).map(esc).join('<br>')}`:'No visible missing-role/item warning.'}${scan.requirements?.length?`<br>Cached requirements: <b>${scan.requirements.length}</b> · ${scan.requirements.slice(0,8).map(x=>`${esc(x.phase)} / ${esc(x.role)} → ${esc(x.item)}`).join(' · ')}`:''}<br>Loan holders matched: <b>${loanHits}</b> · role-item matches: <b>${reqHits}</b> · scope: <b>${cfg.scope}</b>`)
}
function warPerformance(){
 document.getElementById('slx-war-performance')?.remove();if(!state['war-performance']||!/faction/i.test(location.href))return;
 const fr=factionRows(),rows=fr.map(x=>{const q=x.t.match(/respect[^0-9]{0,14}([\d,.]+)/i),h=x.t.match(/hits?[^0-9]{0,14}(\d+)/i),a=x.t.match(/attacks?[^0-9]{0,14}(\d+)/i),ret=x.t.match(/retaliations?[^0-9]{0,14}(\d+)/i),assist=x.t.match(/assists?[^0-9]{0,14}(\d+)/i);return{n:x.n,res:q?+q[1].replace(/,/g,''):0,h:h?+h[1]:0,a:a?+a[1]:0,ret:ret?+ret[1]:0,assist:assist?+assist[1]:0,risk:x.status!=='Okay'||x.act==='Offline',status:x.status,act:x.act}}).filter(x=>x.res||x.h||x.a||x.ret||x.assist),d=load(SLX_KEYS.war,{reports:[],hidden:[],search:'',sort:'score',riskFilter:'ALL'});if(!rows.length)return;
 d.reports??=[];d.hidden??=[];const resultText=(document.body.innerText||'').match(/ranked war[\s\S]{0,250}?(victory|won|defeat|lost)/i);d.history??=[];if(resultText){const outcome=/victory|won/i.test(resultText[1])?'W':'L',key=location.pathname+location.search+location.hash+'|'+outcome;if(!d.history.some(x=>x.key===key))d.history.unshift({key,outcome,at:Date.now()});d.history=d.history.slice(0,200)}
 const score=x=>x.res*10+x.h*2+x.a+x.ret*3+x.assist,sig=rows.map(x=>`${x.n}:${x.res}:${x.h}:${x.a}:${x.ret}:${x.assist}`).join('|');if(d.reports[0]?.sig!==sig)d.reports=[{sig,at:Date.now(),url:location.href,rows},...d.reports].slice(0,100);const historical=n=>d.reports.map(r=>r.rows?.find(x=>x.n===n)?.h??null).filter(x=>x!==null).slice(0,5),decorate=x=>{const hs=historical(x.n),part=hs.length?Math.round(hs.filter(v=>v>0).length/hs.length*100):100,zeros=hs.filter(v=>v===0).length,rel=Math.max(0,Math.min(100,Math.round(part-zeros*9+(x.h>0?5:0)-(x.risk?10:0)))),risk=rel<40?'DANGER':rel<60?'HIGH':rel<75?'MEDIUM':rel<90?'LOW':'OK';return{...x,score:score(x),history:hs,part,rel,riskLevel:risk}};const ranked=rows.map(decorate).sort((a,b)=>d.sort==='name'?a.n.localeCompare(b.n):d.sort==='risk'?(a.rel-b.rel||b.score-a.score):b.score-a.score);save(SLX_KEYS.war,d);const visible=ranked.filter(x=>!d.hidden.includes(x.n)&&(!d.search||x.n.toLowerCase().includes(d.search.toLowerCase()))&&(d.riskFilter==='ALL'||x.riskLevel===d.riskFilter));pagePanel('slx-war-performance','⚔️ War Performance',`<button id="slx-war-wide">WIDE</button> <button id="slx-war-risk">SORT RISK</button> <button id="slx-war-filter">FILTER ${esc(d.riskFilter)}</button> <button id="slx-war-search">SEARCH</button> <button id="slx-war-aar">AAR</button> <button id="slx-war-backup">BACKUP</button><br>Tracked: <b>${rows.length}</b> · MVP: <b>${esc(ranked[0].n)}</b> · avg reliability: <b>${Math.round(ranked.reduce((a,x)=>a+x.rel,0)/ranked.length)}%</b> · reports: <b>${d.reports.length}</b> · W/L: <b>${d.history.filter(x=>x.outcome==='W').length}/${d.history.filter(x=>x.outcome==='L').length}</b><br>${visible.slice(0,40).map((x,i)=>`${i+1}. <button data-war-member="${esc(encodeURIComponent(x.n))}">${esc(x.n)}</button> — ${x.res}R / ${x.h}H / ${x.a}A · Rel <b>${x.rel}%</b> · Part ${x.part}% · ${x.riskLevel} · L5 [${x.history.join(',')||'—'}]`).join('<br>')}`);
 const panel=document.getElementById('slx-war-performance');document.getElementById('slx-war-wide')?.addEventListener('click',()=>panel?.classList.toggle('slx-war-wide'));document.getElementById('slx-war-risk')?.addEventListener('click',()=>{d.sort=d.sort==='risk'?'score':'risk';save(SLX_KEYS.war,d);warPerformance()});document.getElementById('slx-war-filter')?.addEventListener('click',()=>{const opts=['ALL','OK','LOW','MEDIUM','HIGH','DANGER'];d.riskFilter=opts[(opts.indexOf(d.riskFilter)+1)%opts.length];save(SLX_KEYS.war,d);warPerformance()});document.getElementById('slx-war-search')?.addEventListener('click',()=>{d.search=prompt('Member search:',d.search||'')||'';save(SLX_KEYS.war,d);warPerformance()});document.getElementById('slx-war-aar')?.addEventListener('click',()=>{const top=ranked.slice(0,5),danger=ranked.filter(x=>['HIGH','DANGER'].includes(x.riskLevel));prompt('After Action Report',`War report ${new Date().toLocaleString()}\nMembers: ${rows.length}\nAvg reliability: ${Math.round(ranked.reduce((a,x)=>a+x.rel,0)/ranked.length)}%\nHigh risk: ${danger.map(x=>x.n).join(', ')||'none'}\nTop: ${top.map(x=>x.n+' '+x.res+'R/'+x.h+'H').join(', ')}`)});document.getElementById('slx-war-backup')?.addEventListener('click',()=>prompt('War Performance backup:',JSON.stringify(d)));panel?.querySelectorAll('[data-war-member]').forEach(b=>b.onclick=()=>{const n=decodeURIComponent(b.dataset.warMember),x=ranked.find(y=>y.n===n);if(confirm(`${n}\n${x.res} respect · ${x.h} hits · ${x.a} attacks\nReliability ${x.rel}% · Participation ${x.part}% · ${x.riskLevel}\n\nHide from ledger?`)){if(!d.hidden.includes(n))d.hidden.push(n);save(SLX_KEYS.war,d);warPerformance()}})
}
function companyConsole(){
 document.getElementById('slx-company-console')?.remove();if(!state['company-console']||!/company/i.test(location.href))return;
 const t=document.body.innerText||'',emps=[...document.querySelectorAll('tr,li,[class*="employee"]')].filter(e=>/wage|position|employee|train|effectiveness/i.test(e.innerText||'')),employeeRows=emps.map(e=>{const tx=(e.innerText||'').replace(/\s+/g,' '),a=e.querySelector('a[href*="profiles.php"],a[href*="XID="]'),eff=+((tx.match(/(?:effectiveness|efficiency)[^0-9]{0,10}(\d+)/i)||[])[1]||0);return{name:(a?.textContent||tx.split(' ')[0]||'Employee').trim(),wage:+((tx.match(/(?:wage|salary)[^$]{0,12}\$([\d,]+)/i)||[])[1]||'0').replace(/,/g,''),eff,text:tx}}),wages=[...t.matchAll(/(?:wage|salary)[^$]{0,20}\$([\d,]+)/gi)].map(m=>+m[1].replace(/,/g,'')),income=(t.match(/(?:income|revenue|profit)[^$]{0,30}\$([\d,]+)/i)||[])[1],stock=(t.match(/stock[^0-9$]{0,20}([\d,]+)/i)||[])[1],tr=(t.match(/trains?[^0-9]{0,20}(\d+)/i)||[])[1],tax=(t.match(/tax[^$]{0,25}\$([\d,]+)/i)||[])[1],d=load(SLX_KEYS.company,{snapshots:[],training:[],tax:[],prices:[],stockLog:[]}),snap={at:Date.now(),employees:emps.length,wages:wages.reduce((a,b)=>a+b,0),income:income?+income.replace(/,/g,''):null,stock:stock?+stock.replace(/,/g,''):null,trains:+tr||null,tax:tax?+tax.replace(/,/g,''):null};if(!d.snapshots[0]||Date.now()-d.snapshots[0].at>300000)d.snapshots=[snap,...d.snapshots].slice(0,250);if(snap.stock!=null&&d.stockLog[0]?.stock!==snap.stock)d.stockLog.unshift({at:Date.now(),stock:snap.stock});d.stockLog=d.stockLog.slice(0,250);save(SLX_KEYS.company,d);const sorted=[...employeeRows].sort((a,b)=>(b.eff-a.eff)||(a.wage-b.wage));
 pagePanel('slx-company-console','🏢 Company Console',`Employees: <b>${emps.length}</b> · wages: <b>$${snap.wages.toLocaleString()}</b> · income: <b>${snap.income!=null?'$'+snap.income.toLocaleString():'—'}</b> · stock: <b>${snap.stock??'—'}</b> · trains: <b>${snap.trains??'—'}</b> · tax: <b>${snap.tax!=null?'$'+snap.tax.toLocaleString():'—'}</b><br><button id="slx-co-price">PRICE</button> <button id="slx-co-train">TRAIN</button> <button id="slx-co-tax">TAX</button> <button id="slx-co-history">HISTORY</button> <button id="slx-co-emps">EMPLOYEES</button> <button id="slx-co-backup">BACKUP</button><div class="slx-company-grid">${sorted.slice(0,12).map(x=>`<div class="slx-mini-card"><b>${esc(x.name)}</b>Eff ${x.eff||'—'} · $${x.wage.toLocaleString()}</div>`).join('')}</div>`);
 document.getElementById('slx-co-price')?.addEventListener('click',()=>{const c=+prompt('Cost per item')||0,m=+prompt('Markup %','10')||0,v=Math.round(c*(1+m/100));if(v){d.prices.unshift({at:Date.now(),cost:c,markup:m,price:v});d.prices=d.prices.slice(0,200);save(SLX_KEYS.company,d)}alert('Suggested price: $'+v.toLocaleString())});document.getElementById('slx-co-train')?.addEventListener('click',()=>{const n=prompt('Training note / employee:');if(n){d.training.unshift({at:Date.now(),note:n});d.training=d.training.slice(0,500);save(SLX_KEYS.company,d)}});document.getElementById('slx-co-tax')?.addEventListener('click',()=>{const v=+prompt('Tax amount')||0;if(v){d.tax.unshift({at:Date.now(),amount:v});d.tax=d.tax.slice(0,500);save(SLX_KEYS.company,d)}});document.getElementById('slx-co-emps')?.addEventListener('click',()=>prompt('Employees sorted by effectiveness:',sorted.slice(0,60).map(x=>`${x.name} — eff ${x.eff||'—'} — $${x.wage.toLocaleString()}`).join('\n')));document.getElementById('slx-co-history')?.addEventListener('click',()=>alert(`Snapshots: ${d.snapshots.length}\nStock changes: ${d.stockLog.length}\nTraining logs: ${d.training.length}\nTax logs: ${d.tax.length}\nPrice records: ${d.prices.length}`));document.getElementById('slx-co-backup')?.addEventListener('click',()=>prompt('Company Console backup:',JSON.stringify(d)))
}
function oddsScout(){
 document.querySelectorAll('.slx-odds-hint').forEach(x=>x.remove());document.getElementById('slx-odds-summary')?.remove();if(!state['odds-scout']||!/(casino|bookie|sports)/i.test(location.href))return;
 const cfg={...ODDS_CFG_DEFAULTS,...load(SLX_KEYS.odds,{})},markets=[],seen=new Set(),active=(document.querySelector('[class*="tabs"] [class*="active"][title],[class*="tab"][class*="active"]')?.getAttribute('title')||document.querySelector('[class*="tabs"] [class*="active"]')?.textContent||'Sports').trim();for(const e of document.querySelectorAll('tr,li,[class*="bet"],[class*="market"],[class*="event"],[class*="sport"]')){const t=(e.innerText||'').trim().replace(/\s+/g,' ');if(t.length>1200||t.length<8)continue;const key=t.slice(0,220);if(seen.has(key))continue;seen.add(key);const o=[...t.matchAll(/(?:^|\s)x?([1-9]\d*(?:\.\d{1,3})?)(?=\s|$)/gi)].map(m=>+m[1]).filter(x=>x>=1.01&&x<=1000);if(o.length<2||o.length>8)continue;const probs=o.map(x=>100/x),sum=probs.reduce((a,x)=>a+x,0),margin=sum-100,spread=Math.max(...probs)-Math.min(...probs),risk=spread>=45?'One-Sided':spread<=15?'Coin Flip':'Competitive',best=Math.max(...probs);if(e.querySelector('.slx-odds-hint'))continue;const tag=document.createElement('span');tag.className='slx-odds-hint slx-badge-mini';tag.textContent=`M ${margin.toFixed(1)}% · ${risk}`;tag.title='Implied: '+probs.map(x=>x.toFixed(1)+'%').join(' / ');e.appendChild(tag);markets.push({t,o,probs,margin,spread,risk,best})}
 if(markets.length){const best=[...markets].sort((a,b)=>a.margin-b.margin)[0],sport=/football|soccer/i.test(active+' '+best.t)?'football':/basketball|nba/i.test(active+' '+best.t)?'basketball':/tennis/i.test(active+' '+best.t)?'tennis':/baseball|mlb/i.test(active+' '+best.t)?'baseball':active||'sports';pagePanel('slx-odds-summary','🎲 Odds Scout',`<button id="slx-odds-collapse">${cfg.collapsed?'EXPAND':'HIDE'}</button> ${cfg.collapsed?'':`Sport: <b>${esc(sport)}</b> · markets: <b>${markets.length}</b> · lowest margin: <b>${best.margin.toFixed(1)}%</b> · risk: <b>${best.risk}</b><br>${markets.sort((a,b)=>a.margin-b.margin).slice(0,10).map(x=>`${x.margin.toFixed(1)}% · ${x.risk} — ${esc(x.t.slice(0,95))}`).join('<br>')}<br><button id="slx-odds-research">RESEARCH EVENT</button>`}`);document.getElementById('slx-odds-collapse')?.addEventListener('click',()=>{cfg.collapsed=!cfg.collapsed;save(SLX_KEYS.odds,cfg);oddsScout()});document.getElementById('slx-odds-research')?.addEventListener('click',()=>{if(cfg.research===false)return;const q=encodeURIComponent(`${sport} ${best.t.slice(0,130)}`);window.open('https://www.google.com/search?q='+q,'_blank')})}
}
function raceLeague(){
 document.getElementById('slx-race-league')?.remove();if(!state['race-league-board']||!/race/i.test(location.href))return;
 const rows=[],seen=new Set();for(const e of document.querySelectorAll('tr,li,[class*="result"]')){const t=(e.innerText||'').trim().replace(/\s+/g,' '),m=t.match(/(?:^|\s)(\d{1,2})(?:st|nd|rd|th)?[.)\s-]+([A-Za-z0-9_\-\[\] ]{2,40})/i);if(m&&+m[1]<=30&&!seen.has(m[1]+'|'+m[2])){seen.add(m[1]+'|'+m[2]);rows.push({p:+m[1],n:m[2].trim()})}}
 const d=load(SLX_KEYS.race2,{active:'Default',champs:{Default:{races:[],drivers:{}}}});d.champs??={Default:{races:[],drivers:{}}};d.active=d.active&&d.champs[d.active]?d.active:Object.keys(d.champs)[0]||'Default';d.champs[d.active]??={races:[],drivers:{}};const c=d.champs[d.active];if(rows.length>=2){const pts=[25,18,15,12,10,8,6,4,2,1],key=rows.map(x=>x.p+':'+x.n).join('|');if(!c.races.some(x=>x.key===key)){c.races.unshift({key,at:Date.now(),url:location.href,rows});for(const x of rows){c.drivers[x.n]??={pts:0,w:0,podiums:0,r:0,best:99};c.drivers[x.n].pts+=pts[x.p-1]||0;c.drivers[x.n].r++;c.drivers[x.n].best=Math.min(c.drivers[x.n].best,x.p);if(x.p===1)c.drivers[x.n].w++;if(x.p<=3)c.drivers[x.n].podiums++}c.races=c.races.slice(0,500);save(SLX_KEYS.race2,d)}}
 const z=Object.entries(c.drivers).sort((a,b)=>b[1].pts-a[1].pts).slice(0,25);if(!z.length&&!rows.length)return;pagePanel('slx-race-league','🏁 Race League Board',`Championship: <b>${esc(d.active)}</b> · races: <b>${c.races.length}</b><br><button id="slx-race-new">NEW</button> <button id="slx-race-switch">SWITCH</button> <button id="slx-race-rename">RENAME</button> <button id="slx-race-log">RACE LOG</button> <button id="slx-race-stats">STATS</button> <button id="slx-race-csv">CSV</button> <button id="slx-race-backup">BACKUP/IMPORT</button> <button id="slx-race-del">DELETE</button><br>${z.map(([n,v],i)=>`${i+1}. <button data-driver="${esc(encodeURIComponent(n))}">${esc(n)}</button> <b>${v.pts} pts</b> · ${v.w}W · ${v.podiums}P · best P${v.best<99?v.best:'—'} · ${v.r} races`).join('<br>')}`);
 document.getElementById('slx-race-new')?.addEventListener('click',()=>{const n=prompt('New championship name:');if(n?.trim()){d.champs[n.trim()]={races:[],drivers:{}};d.active=n.trim();save(SLX_KEYS.race2,d);raceLeague()}});document.getElementById('slx-race-switch')?.addEventListener('click',()=>{const n=prompt('Championship:\n'+Object.keys(d.champs).join('\n'),d.active);if(n&&d.champs[n]){d.active=n;save(SLX_KEYS.race2,d);raceLeague()}});document.getElementById('slx-race-rename')?.addEventListener('click',()=>{const n=prompt('Rename championship:',d.active)?.trim();if(n&&n!==d.active&&!d.champs[n]){d.champs[n]=d.champs[d.active];delete d.champs[d.active];d.active=n;save(SLX_KEYS.race2,d);raceLeague()}});document.getElementById('slx-race-csv')?.addEventListener('click',()=>{const lines=['date,driver,position'];for(const r of [...c.races].reverse())for(const x of r.rows)lines.push(`${new Date(r.at).toISOString()},"${String(x.n).replace(/"/g,'""')}",${x.p}`);prompt('Race CSV:',lines.join('\n'))});document.getElementById('slx-race-log')?.addEventListener('click',()=>alert(c.races.slice(0,20).map((r,i)=>`${i+1}. ${new Date(r.at).toLocaleString()} — ${r.rows.slice(0,3).map(x=>'P'+x.p+' '+x.n).join(', ')}`).join('\n\n')||'No races saved.'));document.getElementById('slx-race-stats')?.addEventListener('click',()=>alert(`Drivers: ${Object.keys(c.drivers).length}\nRaces: ${c.races.length}\nWins recorded: ${Object.values(c.drivers).reduce((a,x)=>a+x.w,0)}\nPodiums: ${Object.values(c.drivers).reduce((a,x)=>a+x.podiums,0)}`));document.getElementById('slx-race-backup')?.addEventListener('click',()=>{const raw=prompt('Backup JSON. Paste replacement JSON to import:',JSON.stringify(d));if(raw&&raw!==JSON.stringify(d)){try{const x=JSON.parse(raw);if(!x.champs)throw 0;save(SLX_KEYS.race2,x);raceLeague()}catch{alert('Invalid race backup.')}}});document.getElementById('slx-race-del')?.addEventListener('click',()=>{if(Object.keys(d.champs).length<=1)return alert('Keep at least one championship.');if(confirm('Delete championship '+d.active+'?')){delete d.champs[d.active];d.active=Object.keys(d.champs)[0];save(SLX_KEYS.race2,d);raceLeague()}});document.querySelectorAll('[data-driver]').forEach(btn=>btn.onclick=()=>{const n=decodeURIComponent(btn.dataset.driver),v=c.drivers[n],races=c.races.filter(r=>r.rows.some(x=>x.n===n)).slice(0,10);alert(`${n}\nPoints: ${v.pts}\nWins: ${v.w}\nPodiums: ${v.podiums}\nBest: P${v.best<99?v.best:'—'}\nRaces: ${v.r}\n\nRecent:\n${races.map(r=>new Date(r.at).toLocaleDateString()+' P'+r.rows.find(x=>x.n===n).p).join('\n')}`)})
}

function openModuleSettings(id){
 if(id==='recovery-planner'){openRecoverySettings();return}
 if(id==='daily-prayer'){if(confirm('Reset today\'s prayer reminder?')){localStorage.removeItem(K.prayerDay);syncReminderIcons()}return}
 if(id==='chain-alarm'){const c={...CHAIN_DEFAULTS,...load(SLX_KEYS.chain,{})};c.warn=Math.max(10,+prompt('Warning threshold (seconds):',c.warn)||c.warn);c.critical=Math.max(5,+prompt('Critical threshold (seconds):',c.critical)||c.critical);c.flash=confirm('Enable critical flashing?');c.dim=confirm('Dim tracker when Torn is not focused?');save(SLX_KEYS.chain,c);chainAlarm();return}
 if(id==='item-signals'){const c={...ITEM_CFG_DEFAULTS,...load(SLX_KEYS.item,{})};for(const k of Object.keys(c))c[k]=confirm(`Show ${k.toUpperCase()} markers?`);save(SLX_KEYS.item,c);itemSignals();return}
 if(id==='event-lens'){const c={...EVENT_CFG_DEFAULTS,...load(SLX_KEYS.events,{})};c.savedOnly=confirm('Show only saved events by default?');save(SLX_KEYS.events,c);eventLens();return}
 if(id==='oc-role-match'||id==='oc-readiness'){const c={...OC_CFG_DEFAULTS,...load(SLX_KEYS.ocCfg,{})};c.threshold=Math.max(0,Math.min(100,+prompt('Suitability threshold %:',c.threshold)||c.threshold));c.scope=confirm('Check all visible members? OK = all, Cancel = self')?'all':'self';save(SLX_KEYS.ocCfg,c);applyModules();return}
 if(id==='armory-loan-radar'){const d=load(SLX_KEYS.armory,null);alert(d?`Last armory snapshot: ${new Date(d.at).toLocaleString()}\nRows: ${d.rows.length}`:'No armory snapshot yet.');return}
 if(id==='member-travel-map'){if(confirm('Clear all country overrides?')){localStorage.removeItem(SLX_KEYS.travel);travelMap()}return}
 if(id==='war-performance'){const d=load(SLX_KEYS.war,{reports:[]});if(confirm(`Stored war reports: ${d.reports.length}\nClear them?`)){save(SLX_KEYS.war,{reports:[]});warPerformance()}return}
 if(id==='company-console'){const d=load(SLX_KEYS.company,{snapshots:[],training:[],tax:[]});prompt('Company local data backup:',JSON.stringify(d));return}
 if(id==='odds-scout'){const c={...ODDS_CFG_DEFAULTS,...load(SLX_KEYS.odds,{})};c.research=confirm('Enable research links?');save(SLX_KEYS.odds,c);oddsScout();return}
 if(id==='race-league-board'){const d=load(SLX_KEYS.race2,{active:'Default',champs:{Default:{races:[],drivers:{}}}}),raw=prompt('Race League backup / paste replacement:',JSON.stringify(d));if(raw&&raw!==JSON.stringify(d)){try{save(SLX_KEYS.race2,JSON.parse(raw));raceLeague()}catch{alert('Invalid race backup.')}}return}
 if(id==='faction-pulse'){const c={...PULSE_CFG_DEFAULTS,...load(SLX_KEYS.pulse,{})};c.compact=confirm('Compact summary only?');save(SLX_KEYS.pulse,c);factionPulse();return}
}


function openDiagnostics(){
 const checks=[];
 const add=(name,ok,detail='')=>checks.push({name,ok,detail});
 add('Suite launcher',!!(document.getElementById(IDS.native)||document.getElementById(IDS.fallback)));
 add('Reminder dock',!!document.getElementById(IDS.dock));
 add('Shared API key',!!apiKey,'optional');
 add('Prayer detection',typeof observePrayerSuccess==='function');
 add('Recovery life parser',!!visibleLife()||true,visibleLife()?'Life detected':'Life not visible on this page');
 add('Chain parser',!!chainText()||true,chainText()?'Chain detected':'Chain not visible on this page');
 const eventStatus=sakaluxEventLensModule?.status?.();
 add('Event Lens',!state['event-lens']||!!eventStatus?.mounted||!eventStatus?.onEventsPage,eventStatus?`${eventStatus.onEventsPage?'Events route':'Other route'} · ${eventStatus.nativeRows} native rows · ${eventStatus.mounted?'mounted':eventStatus.waiting?'waiting for rows':'not mounted'}`:'disabled');
 add('Faction rows',factionRows().length>0||!/faction/i.test(location.href),`${factionRows().length} rows`);
 add('Recovery settings',MODULES.find(m=>m.id==='recovery-planner')?.settings===true);
 const html=checks.map(x=>`${x.ok?'✅':'❌'} <b>${esc(x.name)}</b>${x.detail?' — '+esc(x.detail):''}`).join('<br>');
 toggleFloat('slx-suite-diagnostics','Suite Diagnostics',html);
}
let lastRoute='';let lastHeavy=0;
function applyModules(force=false){
 const route=location.pathname+location.search+location.hash,routeChanged=route!==lastRoute;lastRoute=route;
 syncReminderIcons();chainAlarm();observePrayerSuccess();
 const now=Date.now();if(!force&&!routeChanged&&now-lastHeavy<1200)return;lastHeavy=now;
 itemSignals();eventLens();factionPulse();armoryRadar();travelMap();ocRoleMatch();ocReadiness();warPerformance();companyConsole();oddsScout();raceLeague();
}
function health(){return{version:VERSION,nativeLauncher:!!document.getElementById(IDS.native),sharedApiKeyStored:!!apiKey,modules:MODULES.map(m=>({id:m.id,name:m.name,enabled:!!state[m.id],kind:m.kind,ready:ready(m),legacyVersion:m.kind==='bridge'?legacyVersion(m):null}))}}
window.SakaLuXSuite={version:VERSION,open,close,health,eventLensStatus:()=>sakaluxEventLensModule?.status?.()||{active:false,onEventsPage:false,nativeRows:0,mounted:false,waiting:false},isModuleEnabled:id=>!!state[id],getSharedApiKey:()=>apiKey,openRecoverySettings,openModuleSettings,markPrayed};

let scanTimer=0;
function scheduleScan(){clearTimeout(scanTimer);scanTimer=setTimeout(()=>applyModules(false),500)}
function observePrayerSuccess(){if(!state['daily-prayer']||!/church\.php/i.test(location.href))return;const t=(document.body.innerText||'').toLowerCase();if(/you (?:have )?prayed|prayer (?:was )?successful|already prayed today|you pray|you prayed|prayed successfully|daily prayer (?:complete|completed)/.test(t))markPrayed()}
document.addEventListener('click',e=>{if(!state['daily-prayer'])return;const b=e.target.closest?.('button,a');if(!b)return;const t=((b.textContent||'')+' '+(b.getAttribute('title')||'')).toLowerCase();if(/\bpray\b/.test(t)){setTimeout(observePrayerSuccess,700);setTimeout(observePrayerSuccess,1600);setTimeout(observePrayerSuccess,3000)}},true);
function init(){
 css();fallback();nativeLauncher();applyModules();observePrayerSuccess();
 setInterval(()=>{if(!document.getElementById(IDS.native))nativeLauncher();syncLaunchers();if(!document.getElementById(IDS.dock))ensureDock();syncReminderIcons();if(state['chain-alarm'])chainAlarm()},1800);
 new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!String(n.id||'').startsWith('slx-')&&!String(n.className||'').includes('slx-'))))scheduleScan()}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('hashchange',()=>setTimeout(()=>{nativeLauncher();applyModules(true)},300));
 window.addEventListener('popstate',()=>setTimeout(()=>applyModules(true),300));
 window.dispatchEvent(new CustomEvent('SakaLuXSuiteReady',{detail:{version:VERSION}}));
 console.log('[SakaLuX Suite v'+VERSION+'] loaded');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
