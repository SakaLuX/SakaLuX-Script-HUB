from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
BH=ROOT/'SakaLuX-Bounty-Hunter.user.js'
HUB=ROOT/'SakaLuX-Script-Hub.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
BMD=ROOT/'greasyfork/Bounty-Hunter.md'
HMD=ROOT/'greasyfork/Script-Hub.md'
TEST=ROOT/'tests/module-active-alpha-sort-regression.cjs'

bh=BH.read_text(encoding='utf-8')
hub=HUB.read_text(encoding='utf-8')

# ---------------- Bounty Hunter v0.5.1 ----------------
bh=bh.replace('@version      0.5.0','@version      0.5.1',1)
bh=bh.replace("const VERSION='0.5.0'","const VERSION='0.5.1'",1)
bh=bh.replace("let v = '0.5.0';","let v = '0.5.1';",1)
bh=bh.replace(
"// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js\n// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js",
"// @downloadURL  https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.user.js\n// @updateURL    https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.meta.js",
1
)

# API access diagnostics + GreasyFork constants.
anchor="const VERSION='0.5.1',ID='bounty-hunter',API='SakaLuXBountyHunter';"
insert=anchor+"\nconst GREASYFORK_ID='598988',GREASYFORK_URL='https://greasyfork.org/scripts/598988',HUB_SHARED_KEY_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks,bounties&market=itemmarket';"
if anchor not in bh: raise SystemExit('bounty const anchor missing')
bh=bh.replace(anchor,insert,1)

state_anchor="let S={...D,...J(KS,{})},WATCH=J(KW,{}),BLACK=J(KB,{}),CACHE=J(KC,{rows:[],at:0}),UCACHE=J(KU,{}),FFCACHE=J(KFC,{}),SCAN=J(KSCAN,{nextOffset:0,records:0,at:0,delay:950}),PROG={stage:'idle',current:0,total:0,text:''},timer=0,tickTimer=0,lastRows=[],busy=false,lastError='',lastSource='DOM',lastBountyRecords=0,notified=new Map();"
state_new=state_anchor[:-1]+",apiAccessStatus='unknown',apiAccessMessage='Not checked yet',apiAccessCheckedAt=0;"
if state_anchor not in bh: raise SystemExit('bounty state anchor missing')
bh=bh.replace(state_anchor,state_new,1)

# Cache pruning + health classification + access test, inserted after rate helpers.
rate_anchor="function rateWaitText(){const left=Math.max(0,getRateUntil()-Date.now());return left?Math.ceil(left/1000)+'s':''}"
extra=rate_anchor+"""
function transientApiIssue(message){return /rate limit|too many requests|cooldown|using cached board|api partial/i.test(String(message||''))}
function fatalHealthError(){const m=String(lastError||'').trim();return m&&!transientApiIssue(m)?m:''}
function healthWarning(){const m=String(lastError||'').trim();return m&&transientApiIssue(m)?m:''}
function pruneCaches(){const now=Date.now();let changedFF=false,changedU=false;for(const [id,c] of Object.entries(FFCACHE||{})){if(!c||now-num(c.at)>24*60*60*1000){delete FFCACHE[id];changedFF=true}}for(const [id,c] of Object.entries(UCACHE||{})){if(!c||now-num(c.at)>10*60*1000){delete UCACHE[id];changedU=true}}const ffids=Object.keys(FFCACHE);if(ffids.length>5000){ffids.sort((a,b)=>num(FFCACHE[b]?.at)-num(FFCACHE[a]?.at)).slice(5000).forEach(id=>delete FFCACHE[id]);changedFF=true}const uids=Object.keys(UCACHE);if(uids.length>1200){uids.sort((a,b)=>num(UCACHE[b]?.at)-num(UCACHE[a]?.at)).slice(1200).forEach(id=>delete UCACHE[id]);changedU=true}if(changedFF)saveFF();if(changedU)saveUsers()}
async function testTornAccess(showToast=true){const key=getKey();apiAccessCheckedAt=Date.now();if(!key){apiAccessStatus='missing';apiAccessMessage='No Torn API key available';if(showToast)toast(apiAccessMessage);return false}try{const d=await reqJson('https://api.torn.com/v2/torn/bounties?limit=1&key='+encodeURIComponent(key),60000);if(d?.error)throw new Error(d.error.error||d.error.message||'Torn rejected Bounties access');apiAccessStatus='ok';apiAccessMessage='Bounties access OK · '+keySource()+' key';if(showToast)toast(apiAccessMessage);return true}catch(e){const m=String(e?.message||e);if(isRateLimitError(m)){apiAccessStatus='warning';apiAccessMessage='Rate limited · retry later';if(showToast)toast(apiAccessMessage);return false}apiAccessStatus='error';apiAccessMessage=/access|permission|privilege|selection/i.test(m)?'Missing Torn: Bounties access · replace the shared Hub key':m;if(showToast)toast('Torn API: '+apiAccessMessage);return false}}
function createRequiredTornKey(){try{sessionStorage.setItem('SakaLuX_HUB_API_SETUP_PENDING','1')}catch{}location.href=HUB_SHARED_KEY_URL;return true}
"""
if rate_anchor not in bh: raise SystemExit('rate helper anchor missing')
bh=bh.replace(rate_anchor,extra,1)

# Mark access OK when board page actually succeeds.
needle="const list=apiList(data);records+=list.length;"
if needle in bh:
    bh=bh.replace(needle,"apiAccessStatus='ok';apiAccessMessage='Bounties access OK · '+keySource()+' key';apiAccessCheckedAt=Date.now();const list=apiList(data);records+=list.length;",1)

# API panel: add Torn access test + shared key replacement + GreasyFork link.
m=re.search(r"function apiPanel\(o\)\{.*?\}\nfunction open\(\)",bh,re.S)
if not m: raise SystemExit('apiPanel block missing')
api_panel="""function apiPanel(o){const p=document.createElement('div');p.className='slx-bh-api';p.innerHTML='<b>API Access</b><div>Torn: '+keySource()+'. Full-board requires Torn: Bounties. Live target checks use User: Basic/Profile. FFScouter is optional.</div><div class="row"><button data-torntest>Test Torn access</button><button data-createhub>Replace shared Hub key</button></div><input data-torn type="password" placeholder="Optional local Torn API key"><div class="row"><button data-save>Save Torn key</button><button data-clear>Clear Torn key</button></div><input data-ffkey type="password" placeholder="FFScouter key (16 chars)" style="margin-top:7px"><div class="row"><button data-ffsave>Save FF key</button><button data-ffclear>Clear FF key</button><button data-fftest>Test FFScouter</button><button data-notify>Notifications</button></div><div style="margin-top:8px;font-size:11px;color:#9fb0c2">Distribution: <a data-gf href="'+GREASYFORK_URL+'" target="_blank" rel="noopener noreferrer">GreasyFork #'+GREASYFORK_ID+'</a></div>';const i=p.querySelector('[data-torn]'),fi=p.querySelector('[data-ffkey]');p.querySelector('[data-torntest]').onclick=()=>testTornAccess(true);p.querySelector('[data-createhub]').onclick=()=>createRequiredTornKey();p.querySelector('[data-save]').onclick=()=>{setLocalKey(i.value);i.value='';apiAccessStatus='unknown';toast('Torn API key saved');render(true)};p.querySelector('[data-clear]').onclick=()=>{setLocalKey('');apiAccessStatus='unknown';toast('Torn API key cleared');render(false)};p.querySelector('[data-ffsave]').onclick=()=>{setFFKey(fi.value);fi.value='';toast('FFScouter key saved');render(true)};p.querySelector('[data-ffclear]').onclick=()=>{setFFKey('');toast('FFScouter key cleared');render(false)};p.querySelector('[data-fftest]').onclick=async()=>{const id=lastRows[0]?.id;if(!id)return toast('Refresh the bounty board first');try{const d=await externalJson('https://ffscouter.com/api/v1/get-stats?key='+encodeURIComponent(getFFKey())+'&targets='+encodeURIComponent(id));if(Array.isArray(d))toast('FFScouter OK · '+d.length+' result');else toast('FFScouter error · '+(d?.error||d?.code||'invalid response'))}catch(e){toast('FFScouter error · '+(e.message||e))}};p.querySelector('[data-notify]').onclick=async()=>{if(!('Notification'in window))return toast('System notifications unavailable');try{toast('Notifications: '+await Notification.requestPermission())}catch{}};o.querySelector('header').insertAdjacentElement('afterend',p)}
function open()"""
bh=bh[:m.start()]+api_panel+bh[m.end():]

# Public health API: transient throttling/cache warnings no longer become Hub API ERROR.
old_health="health:()=>({version:VERSION,onBounties:onBounties(),loaded:lastRows.length,bounties:lastBountyRecords,watch:Object.keys(WATCH).length,blacklist:Object.keys(BLACK).length,source:lastSource,error:lastError,fullBoard:S.fullBoard,liveEnrich:S.liveEnrich,keySource:keySource(),progress:PROG,scanResumeOffset:num(SCAN.nextOffset),scanDelay:num(SCAN.delay)||950,boardCacheAge:Date.now()-num(CACHE.at),ffCache:Object.keys(FFCACHE).length,rateCooldown:Math.max(0,getRateUntil()-Date.now())})"
new_health="health:()=>({version:VERSION,onBounties:onBounties(),loaded:lastRows.length,bounties:lastBountyRecords,watch:Object.keys(WATCH).length,blacklist:Object.keys(BLACK).length,source:lastSource,error:fatalHealthError(),warning:healthWarning(),apiAccessStatus,apiAccessMessage,apiAccessCheckedAt,fullBoard:S.fullBoard,liveEnrich:S.liveEnrich,keySource:keySource(),progress:PROG,scanResumeOffset:num(SCAN.nextOffset),scanDelay:num(SCAN.delay)||950,boardCacheAge:Date.now()-num(CACHE.at),ffCache:Object.keys(FFCACHE).length,userCache:Object.keys(UCACHE).length,rateCooldown:Math.max(0,getRateUntil()-Date.now()),distribution:'GreasyFork',greasyForkId:GREASYFORK_ID})"
if old_health not in bh: raise SystemExit('health anchor missing')
bh=bh.replace(old_health,new_health,1)

# Expose API remediation methods and prune once at startup.
bh=bh.replace(
"window[API]={id:ID,version:VERSION,open,refresh:()=>render(true),refreshBackground:backgroundRefresh,goToBounties:go,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,getApiKeySource:keySource,health:",
"pruneCaches();window[API]={id:ID,version:VERSION,open,refresh:()=>render(true),refreshBackground:backgroundRefresh,goToBounties:go,testTornAccess,createRequiredTornKey,setEnabled:enable,toggleEnabled:()=>enable(!S.enabled),isEnabled:()=>S.enabled,getApiKeySource:keySource,health:",
1
)

BH.write_text(bh,encoding='utf-8')

# ---------------- Script Hub v1.9.91 ----------------
hub=hub.replace('// @version      1.9.90','// @version      1.9.91',1)
# Runtime version may use different spacing.
hub=re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])1\.9\.90(['\"])",r"\g<1>1.9.91\2",hub,count=1)

old_url="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks&market=itemmarket"
new_url="https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks,bounties&market=itemmarket"
if old_url not in hub: raise SystemExit('shared API URL anchor missing')
hub=hub.replace(old_url,new_url,1)

old_test="""    async function testSharedApiKey(key = getSharedApiKey()) {
        if (!key) throw new Error('Paste or create the shared Torn API key first.');
        const raw = await httpGet('https://api.torn.com/v2/user/battlestats?key=' + encodeURIComponent(key));
        const data = JSON.parse(String(raw || '{}'));
        if (data?.error) throw new Error(data.error.error || data.error.message || 'Torn rejected the API key.');
        return true;
    }"""
new_test="""    async function testSharedApiKey(key = getSharedApiKey()) {
        if (!key) throw new Error('Paste or create the shared Torn API key first.');
        const checks = [
            ['User: Battle Stats', 'https://api.torn.com/v2/user/battlestats?key=' + encodeURIComponent(key)],
            ['Torn: Bounties', 'https://api.torn.com/v2/torn/bounties?limit=1&key=' + encodeURIComponent(key)]
        ];
        for (const [label,url] of checks) {
            const raw = await httpGet(url);
            const data = JSON.parse(String(raw || '{}'));
            if (data?.error) {
                const message = data.error.error || data.error.message || 'Torn rejected the API key.';
                if (label === 'Torn: Bounties') throw new Error('Missing Torn: Bounties access. Replace the shared Hub key. · ' + message);
                throw new Error(label + ' failed · ' + message);
            }
        }
        return true;
    }"""
if old_test not in hub: raise SystemExit('Hub shared API test anchor missing')
hub=hub.replace(old_test,new_test,1)

# Add changelog item at top.
cl_anchor="    const HUB_CHANGELOG = [\n"
entry="        {version:'1.9.91',date:'2026-10-06',changes:['Adds Torn: Bounties to the shared Hub API-key permission superset for Bounty Hunter.','Shared API CHECK now validates both User: Battle Stats and Torn: Bounties and reports a specific missing-permission message.','Bounty Hunter moves update/install distribution to GreasyFork #598988 and transient rate-limit/cache warnings no longer appear as Hub API ERROR.']},\n"
if cl_anchor not in hub: raise SystemExit('Hub changelog anchor missing')
hub=hub.replace(cl_anchor,cl_anchor+entry,1)

HUB.write_text(hub,encoding='utf-8')

# ---------------- Registry ----------------
data=json.loads(REG.read_text(encoding='utf-8'))
row=next(x for x in data['scripts'] if x.get('id')=='bounty-hunter')
row['version']='0.5.1'
row['downloadUrl']='https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.user.js'
row['updateUrl']='https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.meta.js'
row['metaUrl']='https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.meta.js'
row['greasyForkId']='598988'
row['greasyForkUrl']='https://greasyfork.org/scripts/598988'
row['sourceUrl']='https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js'
row['documentationUrl']='https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bounty-Hunter.md'
row['detailsRevision']=int(row.get('detailsRevision',0))+1
row['info']=row.get('info','')+"\n\nAPI Access\nThe shared Script Hub key now requires Torn: Bounties in addition to the existing User Basic/Profile access. API diagnostics distinguish missing Bounties permission from temporary rate limiting. Distribution and update checks now use GreasyFork #598988."
row['release']={'version':'0.5.1','date':'2026-10-06','notes':[
    'Moves public install/update distribution to GreasyFork script 598988 while keeping GitHub as source.',
    'Adds explicit Torn: Bounties access diagnostics and one-tap shared Hub key replacement.',
    'Transient rate-limit/cache warnings no longer report as Script Hub API ERROR.',
    'Adds cache pruning for stale FFScouter/live-status entries and caps cache growth.',
    'Exposes API access status, warning state, cache sizes and GreasyFork distribution in Hub health diagnostics.'
]}
qas=row.setdefault('quickActions',[])
if not any(a.get('id')=='test-key' for a in qas):
    qas.append({'icon':'🧪','id':'test-key','label':'TEST API','method':'testTornAccess','fallbackUrl':'https://www.torn.com/bounties.php'})
if not any(a.get('id')=='create-key' for a in qas):
    qas.append({'icon':'🔑','id':'create-key','label':'API KEY','method':'createRequiredTornKey','fallbackUrl':'https://www.torn.com/preferences.php#tab=api'})
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Synchronize embedded Bounty registry block in Hub to the new public GreasyFork distribution.
hub=HUB.read_text(encoding='utf-8')
hub=hub.replace('https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js','https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.user.js')
# Keep sourceUrl raw if replacement changed it inside embedded registry: selectively restore source URL keys.
hub=hub.replace('"sourceUrl": "https://update.greasyfork.org/scripts/598988/SakaLuX%20Bounty%20Hunter.user.js"','"sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bounty-Hunter.user.js"')
hub=hub.replace('"version": "0.5.0"', '"version": "0.5.1"', 1) if '"id": "bounty-hunter"' in hub else hub
HUB.write_text(hub,encoding='utf-8')

# ---------------- Docs / changelogs ----------------
if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    note="""\n## Bounty Hunter v0.5.1 + Script Hub v1.9.91
- Bounty Hunter public distribution moves to GreasyFork #598988; GitHub remains the source repository.
- Shared Hub API key creation now includes Torn: Bounties.
- Hub API CHECK validates Bounties access and reports a specific missing-permission error.
- Bounty Hunter separates transient rate-limit/cache warnings from fatal health errors, preventing false Hub API ERROR badges.
- Adds stale/capped FFScouter and live-status cache pruning.
"""
    if 'Bounty Hunter v0.5.1 + Script Hub v1.9.91' not in c:
        CHANGE.write_text(c.rstrip()+note+'\n',encoding='utf-8')

if BMD.exists():
    d=BMD.read_text(encoding='utf-8')
    d=re.sub(r'^\*\*v[^*]+\*\*','**v0.5.1**',d,count=1,flags=re.M)
    current="""## Current release note

**v0.5.1 — GreasyFork distribution + API access diagnostics**
- Public updates now use GreasyFork #598988; GitHub remains the canonical source.
- Adds a Torn Bounties permission check and a one-tap shared Hub key replacement action.
- Temporary rate-limit/cache warnings no longer show as Script Hub API ERROR.
- Prunes stale FFScouter/live-status cache records and caps cache growth.
- Health diagnostics now expose API access state, warnings, cache sizes and distribution.
"""
    if '## Current release note' in d:
        d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
    entry="""### v0.5.1 — GreasyFork distribution + API access diagnostics
- Moves install/update URLs to GreasyFork #598988.
- Adds Torn: Bounties permission diagnostics and shared Hub-key replacement.
- Separates temporary API throttling/cache warnings from fatal Hub health errors.
- Adds FF/live cache pruning and size caps.

"""
    if '### v0.5.1' not in d:
        d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
    BMD.write_text(d,encoding='utf-8')

if HMD.exists():
    d=HMD.read_text(encoding='utf-8')
    d=d.replace('**v1.9.90**','**v1.9.91**',1)
    d=d.replace('Canonical version: **v1.9.90**','Canonical version: **v1.9.91**',1)
    entry="""### v1.9.91 — Shared Bounties API access
- Adds Torn: Bounties to the shared Script Hub API-key creation URL.
- Shared API CHECK now validates Bounties access and reports a specific replace-key message when missing.
- Integrates Bounty Hunter GreasyFork #598988 distribution and avoids treating temporary rate-limit/cache warnings as fatal module health errors.

"""
    if '### v1.9.91' not in d:
        marker='## Changelog\n'
        if marker in d: d=d.replace(marker,marker+entry,1)
        else: d=d.rstrip()+'\n\n'+entry
    HMD.write_text(d,encoding='utf-8')

# Version-pinned regression test.
if TEST.exists():
    t=TEST.read_text(encoding='utf-8').replace("[[a,'1.9.90']","[[a,'1.9.91']")
    TEST.write_text(t,encoding='utf-8')
