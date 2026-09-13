from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Account-Auditor.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.2\.6(\s*$)',r'\g<1>1.3.0\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION = '1\.2\.6';", "const VERSION = '1.3.0';", text, count=1)
if n!=1: raise SystemExit('runtime version not found')
text=text.replace("includePrivateData:true, maxPrivatePages:5,", "includePrivateData:true, maxPrivatePages:200,", 1)

pat=r"    const V1_SELECTIONS = \[[\s\S]*?    const V2_PRIVATE_ENDPOINTS = \['messages','newmessages','events','newevents'\];"
rep="""    const V2_ENDPOINTS = [
        'profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','money',
        'stocks','properties','discord','weaponexp','workstats','skills','battlestats','networth','display','icons',
        'criminalrecord','bazaar','crimes','hof','ammo','attacksfull','bounties','calendar','casino','competition',
        'enlistedcars','equipment','faction','forumfeed','forumfriends','forumposts','forumsubscribedthreads',
        'forumthreads','gym','honors','itemmarket','itemmods','job','jobranks','medals','missions','organizedcrime',
        'organizedcrimes','perks','property','races','racingrecords','reports','revivesfull','trade','trades','virus','snapshot'
    ];
    // newmessages/newevents are subsets of messages/events and are intentionally omitted to prevent duplicate records.
    const V2_PRIVATE_ENDPOINTS = ['messages','events'];"""
text,n=re.subn(pat,lambda m:rep,text,count=1)
if n!=1: raise SystemExit('endpoint constants block not found')

pat=r"    async function collectPagedV2\(endpoint,key,query=''\)\{[\s\S]*?\n    \}"
rep="""    async function collectPagedV2(endpoint,key,query='',maxPages=200){
        const pages=[];let url='';const seenUrls=new Set();const limit=Math.max(1,Math.min(500,Number(maxPages)||200));
        for(let page=0;page<limit;page++){
            if(url&&seenUrls.has(url))break;
            if(url)seenUrls.add(url);
            const result=await tornV2(endpoint,key,url?'':query,url);
            if(!result.ok)return{ok:false,error:result.error,code:result.code??null,httpStatus:result.httpStatus??null,pages};
            const clean=sanitizeDeep(result.data);pages.push(clean);
            const next=nextLink(clean);if(!next)break;
            url=next.startsWith('http')?next:'https://api.torn.com'+next;
        }
        const last=pages[pages.length-1];const truncated=Boolean(last&&nextLink(last)&&pages.length>=limit);
        return{ok:true,data:pages.length===1?pages[0]:{pages,pageCount:pages.length,truncated},pages,truncated};
    }"""
text,n=re.subn(pat,lambda m:rep,text,count=1)
if n!=1: raise SystemExit('collectPagedV2 not found')
text=text.replace("collectPagedV2('list',key,'cat='+encodeURIComponent(cat)+'&limit=50')", "collectPagedV2('list',key,'cat='+encodeURIComponent(cat)+'&limit=50',200)")

pat=r"    async function collectSnapshot\(\)\{[\s\S]*?\n    \}\n\n    function parseRepo\(\)"
rep="""    async function collectSnapshot(){
        const key=getTornApiKey(); if(!key)throw new Error('Torn API key missing. Open AUDIT settings and add a key, or use Torn PDA API injection.');
        const data={keyInfo:null,v2:{},special:{},private:{}},errors={},unavailable={};let requested=0,successful=0;
        requested++;setStatus('Checking API key…');const ki=await keyInfo(key);if(ki.ok){data.keyInfo=sanitizeDeep(ki.data);successful++;}else errors['key:info']={error:ki.error,code:ki.code??null,httpStatus:ki.httpStatus??null};
        if(settings.includePrivateData){
            const privatePages=Math.max(1,Math.min(500,Number(settings.maxPrivatePages)||200));
            for(let i=0;i<V2_PRIVATE_ENDPOINTS.length;i++){
                const endpoint=V2_PRIVATE_ENDPOINTS[i];requested++;setStatus('PRIVATE '+endpoint+' '+(i+1)+'/'+V2_PRIVATE_ENDPOINTS.length);
                const q=endpoint==='events'?'limit=100':'limit=100&sort=desc';
                const r=await collectPagedV2(endpoint,key,q,privatePages);
                if(r.ok){data.private[endpoint]=r.data;successful++;}
                else{if(r.pages?.length)data.private[endpoint]={pages:r.pages,pageCount:r.pages.length,partial:true};errors['private:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};}
            }
            requested++;setStatus('PRIVATE logs');const logs=await collectPagedV2('log',key,'limit=100&sort=desc',privatePages);
            if(logs.ok){data.private.log=logs.data;successful++;}
            else if(logs.code===16)unavailable['private:log']={reason:'Torn requires a Full access API key for user/log.',code:16};
            else errors['private:log']={error:logs.error,code:logs.code??null,httpStatus:logs.httpStatus??null};
        }
        for(let i=0;i<V2_ENDPOINTS.length;i++){
            const endpoint=V2_ENDPOINTS[i];requested++;setStatus('v2 '+endpoint+' '+(i+1)+'/'+V2_ENDPOINTS.length);
            const r=await collectPagedV2(endpoint,key,'',200);
            if(r.ok){data.v2[endpoint]=r.data;successful++;}
            else errors['v2:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        requested++;const ps=await collectPagedV2('personalstats',key,'cat=all',200);if(ps.ok){data.special.personalstats=ps.data;successful++;}else errors['v2:personalstats']={error:ps.error,code:ps.code??null,httpStatus:ps.httpStatus??null};
        requested++;const contacts=await collectContacts(key);data.special.contacts=contacts.data;if(Object.keys(contacts.data).length)successful++;if(Object.keys(contacts.errors).length)errors['v2:list']=contacts.errors;
        requested++;const inv=await collectInventory(key);data.special.inventory=inv.data;if(inv.data.categoryCount)successful++;if(Object.keys(inv.errors).length)errors['v2:inventory']=inv.errors;
        const profile=data.v2.profile||{};
        return{schema:'sakalux-torn-account-snapshot-v4',generatedAt:new Date().toISOString(),generatedAtUnix:Date.now(),script:{name:NAME,version:VERSION,mode:'read-only'},privacy:{containsTornApiKey:false,containsGitHubToken:false,containsBrowserCookies:false,containsPassword:false,privateDataIncluded:Boolean(settings.includePrivateData),capturedMessageBodiesRequireExplicitUserAction:true,note:'Official Torn API data plus only message text explicitly captured by the user from a visible Torn message page.'},capabilities:{canonicalApi:'v2',legacyV1Duplicates:false,messageList:true,messageBodyViaOfficialApi:false,messageBodyViaUserCapture:true,logsRequireFullAccess:true,splitSnapshots:Boolean(settings.splitSnapshots)},account:{playerId:profile.player_id??profile.playerID??profile.user_id??profile.id??null,name:profile.name??null,level:profile.level??null,rank:profile.rank??null,status:profile.status??null,faction:profile.faction??null,job:profile.job??null,lastAction:profile.last_action??profile.lastAction??null,age:profile.age??null},coverage:{requested,successful,failed:Object.keys(errors).length,unavailable:Object.keys(unavailable).length,v2Endpoints:V2_ENDPOINTS.slice(),privateEndpoints:settings.includePrivateData?V2_PRIVATE_ENDPOINTS.concat(['log']):[],privateDataEnabled:Boolean(settings.includePrivateData),deduplication:'v2 canonical; no v1 mirror; no newmessages/newevents subsets; attacksfull/revivesfull replace reduced variants'},data,errors,unavailable};
    }

    function parseRepo()"""
text,n=re.subn(pat,lambda m:rep,text,count=1)
if n!=1: raise SystemExit('collectSnapshot block not found')

pat=r"    async function syncJsonFile\(path,value,message\)\{[^\n]*\}"
rep="""    async function syncJsonFile(path,value,message){
        const{owner,repo}=parseRepo(),branch=String(settings.branch||'main').trim()||'main';path=String(path).replace(/^\\/+/, '');
        const api='https://api.github.com/repos/'+encodeURIComponent(owner)+'/'+encodeURIComponent(repo)+'/contents/'+path.split('/').map(encodeURIComponent).join('/');
        const json=JSON.stringify(value,null,2)+'\\n', encoded=utf8ToBase64(json);let current=null;
        try{current=await githubJson(api+'?ref='+encodeURIComponent(branch));}catch(e){if(!/GitHub 404:/.test(String(e?.message||e)))throw e;}
        if(current?.content&&String(current.content).replace(/\\s/g,'')===encoded)return{unchanged:true,sha:current.sha,commit:null};
        const body={message,content:encoded,branch};if(current?.sha)body.sha=current.sha;
        return githubJson(api,{method:'PUT',body});
    }"""
text,n=re.subn(pat,lambda m:rep,text,count=1)
if n!=1: raise SystemExit('syncJsonFile not found')

pat=r"    function baseMeta\(snapshot\)\{[\s\S]*?    async function syncSnapshot\(snapshot\)\{[\s\S]*?\n    \}"
rep="""    function pickFields(source,names,assigned){const out={};for(const name of names){if(Object.prototype.hasOwnProperty.call(source,name)){out[name]=source[name];assigned.add(name);}}return out;}
    function buildSplitSnapshots(snapshot){
        const v2=snapshot.data?.v2||{},sp=snapshot.data?.special||{},pv=snapshot.data?.private||{},assigned=new Set(),captures=settings.includeCapturedMessages?loadJson(STORAGE.captures,[]):[];
        const parts={};
        parts['summary.json']=pickFields(v2,['profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','discord','display','icons','calendar','competition','faction','gym','honors','job','jobranks','medals','perks','virus','hof'],assigned);
        parts['finance.json']=pickFields(v2,['money','networth','stocks','properties','property','bazaar','itemmarket','trade','trades'],assigned);
        parts['combat.json']=pickFields(v2,['battlestats','attacksfull','ammo','bounties','equipment','itemmods','weaponexp','workstats','skills','revivesfull'],assigned);
        parts['crimes.json']={...pickFields(v2,['criminalrecord','crimes','missions','organizedcrime','organizedcrimes'],assigned),personalstats:sp.personalstats||null};
        parts['racing.json']=pickFields(v2,['enlistedcars','races','racingrecords'],assigned);
        parts['forum.json']=pickFields(v2,['forumfeed','forumfriends','forumposts','forumsubscribedthreads','forumthreads'],assigned);
        parts['activity.json']=pickFields(v2,['reports','snapshot'],assigned);
        parts['inventory.json']={inventory:sp.inventory||null};
        parts['contacts.json']={contacts:sp.contacts||null};
        parts['messages.json']={api:pv.messages||null,captured:captures};
        parts['events.json']={events:pv.events||null};
        parts['logs.json']={logs:pv.log||null};
        const other={};for(const[k,v]of Object.entries(v2))if(!assigned.has(k))other[k]=v;if(Object.keys(other).length)parts['other.json']=other;
        const manifest={schema:'sakalux-account-split-v2',generatedAt:snapshot.generatedAt,script:snapshot.script,account:snapshot.account,privacy:snapshot.privacy,capabilities:snapshot.capabilities,coverage:snapshot.coverage,errors:snapshot.errors,unavailable:snapshot.unavailable,files:Object.keys(parts)};
        return{'manifest.json':manifest,...parts};
    }
    async function syncSnapshot(snapshot){
        const fullPath=String(settings.path||'SakaLuX-Account-Snapshot.json').replace(/^\\/+/, '');const files=[];let primary=null;
        if(settings.splitSnapshots){
            const parts=buildSplitSnapshots(snapshot);
            for(const[path,value]of Object.entries(parts)){setStatus('Uploading '+path+'…');await syncJsonFile(path,value,'Sync Torn split snapshot '+path+' '+new Date().toISOString());files.push(path);}
            const pointer={schema:'sakalux-account-split-pointer-v1',generatedAt:snapshot.generatedAt,manifest:'manifest.json',note:'Data is split across the manifest files to avoid duplicating the full account payload.'};
            setStatus('Updating snapshot pointer…');primary=await syncJsonFile(fullPath,pointer,'Update Torn account snapshot pointer '+new Date().toISOString());
        }else{
            setStatus('Uploading full snapshot…');primary=await syncJsonFile(fullPath,snapshot,'Sync Torn account snapshot '+new Date().toISOString());
        }
        const meta={at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch:settings.branch,path:fullPath,splitFiles:files,commitSha:primary?.commit?.sha||null};saveJson(STORAGE.lastSync,meta);return meta;
    }"""
text,n=re.subn(pat,lambda m:rep,text,count=1)
if n!=1: raise SystemExit('split/sync block not found')

text=text.replace('Sync summary/finance/combat/crimes/messages/events/logs JSON files','Sync deduplicated split JSON files (recommended)')
text=text.replace('Max private pages <input id="sl-aa-pages" type="number" min="1" max="20"', 'Max paged history pages <input id="sl-aa-pages" type="number" min="1" max="500"')
text=text.replace("Math.max(1,Math.min(20,Number(overlay.querySelector('#sl-aa-pages').value)||5))", "Math.max(1,Math.min(500,Number(overlay.querySelector('#sl-aa-pages').value)||200))")
p.write_text(text,encoding='utf-8')

d=ROOT/'greasyfork/Account-Auditor.md'
doc=d.read_text(encoding='utf-8')
doc=doc.replace('**v1.2.6**','**v1.3.0**',1)
doc=doc.replace('**v1.2.6** is the current standalone Account Auditor release. It keeps the shared standalone SakaLuX dock/install-reminder behavior while remaining outside the Script Hub registry.', '**v1.3.0** is the current standalone Account Auditor release. It uses Torn API v2 as the canonical source, removes overlapping duplicate selections, follows paginated account history, and stores split snapshot data only once while remaining outside the Script Hub registry.',1)
insert='''\n### v1.3.0 — Deduplicated full-account collection\n\n- Switched the audit payload to **Torn API v2 as the canonical source** instead of storing matching v1 and v2 data twice.\n- Removed redundant subset pairs: `basic/profile`, `attacks/attacksfull`, `revives/revivesfull`, `newmessages/messages` and `newevents/events`.\n- Added missing account selections including Bazaar, crimes, criminal record, display, Hall of Fame, trade and snapshot data where API permissions allow them.\n- Follows API pagination with loop protection so multi-page history is not silently limited to the first page.\n- Split mode no longer uploads a second full copy of the same account data. The main snapshot path becomes a small pointer to `manifest.json`.\n- Added dedicated racing, forum, inventory, contacts and activity split files plus `other.json` fallback so newly returned unmapped fields are not discarded.\n- Identical GitHub file content is not rewritten unnecessarily.\n- Snapshot schema upgraded to `sakalux-torn-account-snapshot-v4`.\n\n'''
doc=doc.replace('## Release history\n','## Release history\n'+insert,1)
d.write_text(doc,encoding='utf-8')
print('Account Auditor v1.3.0 migration applied')
