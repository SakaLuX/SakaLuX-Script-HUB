from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

# Version sync
s=re.sub(r'// @version\s+\S+','// @version      0.3.0',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.0';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.0'",s,count=1)

# Storage + defaults (preserve v0.2.2 user cache)
s=re.sub(r"const KS='SLX_BOUNTY_SETTINGS_V3',KW='SLX_BOUNTY_WATCH_V1',KB='SLX_BOUNTY_BLACK_V1',KK='SakaLuX_BOUNTY_API_KEY',KC='SLX_BOUNTY_CACHE_V2',KU='SLX_BOUNTY_USER_CACHE_V1';",
"const KS='SLX_BOUNTY_SETTINGS_V3',KW='SLX_BOUNTY_WATCH_V1',KB='SLX_BOUNTY_BLACK_V1',KK='SakaLuX_BOUNTY_API_KEY',KF='SakaLuX_BOUNTY_FFSCOUTER_KEY',KC='SLX_BOUNTY_CACHE_V2',KU='SLX_BOUNTY_USER_CACHE_V1';",s,count=1)
s=re.sub(r"const D=\{[^\n]+\};",
"const D={enabled:true,mode:'safe',source:'auto',sort:'smart',query:'',minReward:500000,maxLevel:100,okay:true,hospital:true,hideUnknown:true,watchOnly:false,autoRefresh:true,refreshSec:60,compact:true,fullBoard:true,maxPages:20,liveEnrich:true,enrichCount:12,notifyTargets:true,notifyMinReward:500000,notifyWatch:true,minFF:1,maxFF:3,maxBS:0,hospitalWindowMin:5,onlyBeatable:true,includeUnknownFF:false,chatButton:true};",s,count=1)

# FFScouter helpers
anchor="function setLocalKey(v){try{localStorage.setItem(KK,String(v||'').trim())}catch{}}"
if 'function getFFKey()' not in s:
    ins=anchor+"\nfunction getFFKey(){try{return String(localStorage.getItem(KF)||localStorage.getItem('bh_ffscouterKey')||'').trim()}catch{return''}}\nfunction setFFKey(v){try{localStorage.setItem(KF,String(v||'').trim())}catch{}}\nasync function externalJson(url){const core=window.SakaLuXCore?.api;if(core?.requestJson){try{return await core.requestJson({url,ttl:30000,retries:1,timeout:15000,throwApiError:false})}catch{}}const r=await fetch(url,{credentials:'omit'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()}\nasync function enrichFF(rows){const key=getFFKey();if(!key)return rows;const out=new Map(rows.map(x=>[String(x.id),x]));const ids=[...out.keys()];for(let i=0;i<ids.length;i+=205){const batch=ids.slice(i,i+205);const data=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(key)+'&targets='+batch.join(','));if(data?.code)throw new Error('FFScouter: '+(data.error||('code '+data.code)));for(const f of (Array.isArray(data)?data:[])){const x=out.get(String(f.player_id));if(!x)continue;if(Number.isFinite(Number(f.fair_fight)))x.ff=Number(f.fair_fight);if(Number.isFinite(Number(f.bs_estimate)))x.bs=Number(f.bs_estimate);x.ffSource='FFScouter'}}return rows}"
    if anchor not in s: raise SystemExit('key anchor not found')
    s=s.replace(anchor,ins,1)

# Beatability filtering, retaining search/watch filters
s=re.sub(r"function allowed\(x\)\{if\(BLACK\[x\.id\]\|\|!textMatch\(x\)\)return false;if\(S\.watchOnly&&!WATCH\[x\.id\]\)return false;if\(x\.reward<num\(S\.minReward\)\)return false;if\(x\.level!=null&&x\.level>num\(S\.maxLevel\|\|100\)\)return false;if\(S\.maxFF>0&&x\.ff!=null&&x\.ff>S\.maxFF\)return false;if\(S\.maxBS>0&&x\.bs!=null&&x\.bs>S\.maxBS\)return false;",
"function allowed(x){if(BLACK[x.id]||!textMatch(x))return false;if(S.watchOnly&&!WATCH[x.id])return false;if(x.reward<num(S.minReward))return false;if(x.level!=null&&x.level>num(S.maxLevel||100))return false;if(S.onlyBeatable){if(x.ff==null&&!S.includeUnknownFF)return false;if(x.ff!=null&&(x.ff<num(S.minFF||1)||x.ff>num(S.maxFF||3)))return false;}else if(S.maxFF>0&&x.ff!=null&&x.ff>S.maxFF)return false;if(S.maxBS>0&&x.bs!=null&&x.bs>S.maxBS)return false;",s,count=1)

# FF enrich after Torn full-board/status enrichment and before filtering
m=re.search(r"async function collect\(force=false\)\{.*?\n?function bestRows",s,re.S)
if not m: raise SystemExit('collect function not found')
block=m.group(0)
if 'await enrichFF(rows)' not in block:
    block=block.replace('lastRows=rows;return rows}',"try{if(getFFKey()&&rows.length)await enrichFF(rows)}catch(e){lastError=(lastError?lastError+' · ':'')+(e.message||String(e))}lastRows=rows;return rows}")
    s=s[:m.start()]+block+s[m.end():]

# Panel source status
s=s.replace("lastSource+' · key '+keySource()","lastSource+' · Torn '+keySource()+(getFFKey()?' · FFScouter ✓':' · FFScouter ✕')")

# API panel replacement
ap=re.search(r"function apiPanel\(o\)\{.*?\nfunction open\(\)",s,re.S)
if not ap: raise SystemExit('apiPanel not found')
new_api="""function apiPanel(o){const p=document.createElement('div');p.className='slx-bh-api';p.innerHTML='<b>API Access</b><div>Torn: '+keySource()+'. Full-board uses Torn API v2. FFScouter filters the board to targets in your fair-fight range.</div><input data-torn type=\"password\" placeholder=\"Optional local Torn API key\"><div class=\"row\"><button data-save>Save Torn key</button><button data-clear>Clear Torn key</button></div><input data-ffkey type=\"password\" placeholder=\"FFScouter key (16 chars)\" style=\"margin-top:7px\"><div class=\"row\"><button data-ffsave>Save FF key</button><button data-ffclear>Clear FF key</button><button data-notify>Notifications</button></div>';const i=p.querySelector('[data-torn]'),fi=p.querySelector('[data-ffkey]');p.querySelector('[data-save]').onclick=()=>{setLocalKey(i.value);i.value='';toast('Torn API key saved');render(true)};p.querySelector('[data-clear]').onclick=()=>{setLocalKey('');toast('Torn API key cleared');render(false)};p.querySelector('[data-ffsave]').onclick=()=>{setFFKey(fi.value);fi.value='';toast('FFScouter key saved');render(true)};p.querySelector('[data-ffclear]').onclick=()=>{setFFKey('');toast('FFScouter key cleared');render(false)};p.querySelector('[data-notify]').onclick=async()=>{if(!('Notification'in window))return toast('System notifications unavailable');try{toast('Notifications: '+await Notification.requestPermission())}catch{}};o.querySelector('section').appendChild(p)}
function open()"""
s=s[:ap.start()]+new_api+s[ap.end():]

# FF fields and toggles
s=s.replace('<label>Max FF (0 off)<input data-ff type="number" min="0" step="0.1"></label>','<label>Min FF<input data-minff type="number" min="1" step="0.1"></label><label>Max FF<input data-ff type="number" min="1" step="0.1"></label>')
s=s.replace("bindNum('[data-ff]','maxFF',0,999);","bindNum('[data-minff]','minFF',1,99);bindNum('[data-ff]','maxFF',1,99);")
s=s.replace("chip('Full board API',S.fullBoard,()=>{S.fullBoard=!S.fullBoard;save();rebuild();render(true)}),","chip('Full board API',S.fullBoard,()=>{S.fullBoard=!S.fullBoard;save();rebuild();render(true)}),chip('Beatable only',S.onlyBeatable,()=>{S.onlyBeatable=!S.onlyBeatable;save();rebuild();render(false)}),chip('Unknown FF',S.includeUnknownFF,()=>{S.includeUnknownFF=!S.includeUnknownFF;save();rebuild();render(false)}),")

# Chat composer launcher CSS
s=s.replace('@media(max-width:520px){#slx-bh .bar','.slx-bh-chat-btn{flex:0 0 34px!important;width:34px!important;height:34px!important;min-height:34px!important;border:1px solid #3d5066!important;border-radius:8px!important;background:#172331!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:18px!important;margin:0 4px!important;padding:0!important;z-index:4!important}@media(max-width:520px){#slx-bh .bar')

# Chat launcher + bounty-page fallback floating button
bs=s.index('function button(){')
be=s.index('\nfunction chip(',bs)
launcher="""function mountChatButtons(){if(!S.enabled||!S.chatButton)return 0;const editors=[...document.querySelectorAll('textarea,[contenteditable=\"true\"]')].filter(e=>{const r=e.getBoundingClientRect?.();return r&&r.width>80&&r.height>15&&r.bottom>0&&r.top<innerHeight&&(/message|chat|type/i.test((e.getAttribute('placeholder')||'')+' '+(e.getAttribute('aria-label')||''))||e.closest('[id*=\"chat\"],[class*=\"chat\"],[class*=\"Chat\"]'))});for(const e of editors){let row=e.parentElement;for(let i=0;i<4&&row?.parentElement;i++){const r=row.getBoundingClientRect?.();if(r&&r.width>180&&r.height>=28&&r.height<=110)break;row=row.parentElement}if(!row||row.querySelector('.slx-bh-chat-btn'))continue;const b=document.createElement('button');b.type='button';b.className='slx-bh-chat-btn';b.textContent='🎯';b.title='SakaLuX Bounty Hunter';b.setAttribute('aria-label','Bounty Hunter');b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();open()};const native=[...row.querySelectorAll('button')];if(native.length)row.insertBefore(b,native[native.length-1]);else row.appendChild(b)}return document.querySelectorAll('.slx-bh-chat-btn').length}
function button(){ensureCss();const chatCount=mountChatButtons();let b=document.getElementById('slx-bh-btn');if(!b){b=document.createElement('button');b.id='slx-bh-btn';b.textContent='🎯';b.title='SakaLuX Bounty Hunter';b.onclick=open;document.body.appendChild(b)}b.hidden=!S.enabled||chatCount>0||!onBounties()}"""
s=s[:bs]+launcher+s[be:]

# Allow full-board scan from chat / any Torn page
s=s.replace('if(!S.enabled||!onBounties()||busy)return;','if(!S.enabled||busy)return;')
s=s.replace('if(onBounties())setTimeout(backgroundRefresh,800)','if(getKey())setTimeout(backgroundRefresh,800)')
s=s.replace('setInterval(button,2500)','setInterval(()=>{button();mountChatButtons()},1800)')

# Health info
s=s.replace('fullBoard:S.fullBoard})','fullBoard:S.fullBoard,onlyBeatable:S.onlyBeatable,ffScouter:!!getFFKey(),ffRange:[S.minFF,S.maxFF]})')
p.write_text(s)

# Docs
md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text(); t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.0**',t,count=1)
entry='''\n### v0.3.0 — Chat launcher + beatable-only scan\n- Adds a 🎯 Bounty Hunter button beside the Torn Chat V3 message composer; the floating button remains only as a bounty-page fallback.\n- Full-board Torn API scanning can now run from any Torn page.\n- Adds direct FFScouter bulk lookup (up to 205 targets per request) through `/api/v1/get-stats`.\n- Adds `Beatable only`, enabled by default, with FF range 1.0–3.0 and unknown-FF targets excluded by default.\n- Adds FFScouter key storage and reuses the original Bounty Hunter `bh_ffscouterKey` when already present.\n- Raises the default auto-refresh interval to 60 seconds to reduce Torn API pressure.\n'''
if '### v0.3.0' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

# Hub registry
rp=Path('scripts.json'); data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.0'; x['description']='Full-board Torn bounty hunter with Chat V3 launcher, FFScouter beatable-only filtering, hospital timing, watchlist and alerts.'
        x['info']='Purpose\nBounty Hunter scans the full Torn bounty board and shows a compact list of targets worth attacking. v0.3.0 adds a launcher directly beside the Chat V3 message composer.\n\nBeatable-only filtering\nWith an FFScouter key, the module checks bounty targets in bulk and keeps only targets inside the configured fair-fight range. Default: FF 1.0–3.0; unknown FF targets are excluded.\n\nBoard scanning\nTorn API v2 pages through the global bounty board from any Torn page. Hospital countdowns, watchlist, blacklist, alerts, Attack/Profile actions and Safe/Profit sorting remain available.'
        x['release']={'version':'0.3.0','date':'2026-10-05','notes':['Adds a Bounty Hunter launcher directly in Torn Chat V3.','Adds FFScouter bulk lookup and Beatable only filtering with default FF 1.0–3.0.','Scans the full Torn bounty board from any Torn page and hides unknown-FF targets by default.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.0')
