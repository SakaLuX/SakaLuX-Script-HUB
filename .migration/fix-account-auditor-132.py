from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Account-Auditor.user.js'
s=p.read_text(encoding='utf-8')

# Version
s=s.replace('// @version      1.3.1','// @version      1.3.2',1)
s=s.replace("const VERSION = '1.3.1';","const VERSION = '1.3.2';",1)

# Prefer the explicit Auditor key over TornPDA's injected key. This is important for Full/log access.
old="function getTornApiKey(){return PDA_KEY && PDA_KEY!=='###PDA-APIKEY###' ? PDA_KEY : rawGet(STORAGE.apiKey);}"
new="function getTornApiKey(){const saved=rawGet(STORAGE.apiKey);if(saved)return saved;return PDA_KEY && PDA_KEY!=='###PDA-APIKEY###' ? PDA_KEY : ''; }"
if old not in s: raise SystemExit('getTornApiKey block not found')
s=s.replace(old,new,1)

# trade is an ID-specific detail endpoint. trades already gives the account trade list.
s=s.replace("'revivesfull','trade','trades','virus','snapshot'","'revivesfull','trades','virus','snapshot'",1)

# Generic v2 user-selection fallback for endpoints that reject /v2/user/<selection> without an ID.
old="async function tornV2(endpoint,key,query='',absoluteUrl=''){let url=absoluteUrl||('https://api.torn.com/v2/user/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):''));return apiJsonWithRetry(withKey(url,key));}\n    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}"
new="async function tornV2(endpoint,key,query='',absoluteUrl=''){let url=absoluteUrl||('https://api.torn.com/v2/user/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):''));return apiJsonWithRetry(withKey(url,key));}\n    async function tornV2Selection(endpoint,key,query=''){const q='selections='+encodeURIComponent(endpoint)+(query?'&'+String(query).replace(/^\\?/,''):'');return apiJsonWithRetry(withKey('https://api.torn.com/v2/user?'+q,key));}\n    async function tornGlobalV2(endpoint,key,query=''){let url='https://api.torn.com/v2/torn/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):'');return apiJsonWithRetry(withKey(url,key));}\n    async function keyInfo(key){return apiJsonWithRetry(withKey('https://api.torn.com/v2/key/info',key));}"
if old not in s: raise SystemExit('tornV2/keyInfo block not found')
s=s.replace(old,new,1)

# Fallback on Incorrect ID / ID-entity relation for top-level selection calls.
old="const result=await tornV2(endpoint,key,url?'':query,url);\n            if(!result.ok)return{...result,pages};"
new="let result=await tornV2(endpoint,key,url?'':query,url);\n            if(!url && !result.ok && (result.code===6 || result.code===7)) result=await tornV2Selection(endpoint,key,query);\n            if(!result.ok)return{...result,pages};"
if old not in s: raise SystemExit('collectPagedV2 request block not found')
s=s.replace(old,new,1)

# Helpers to make merit and education IDs human-readable.
anchor="    async function collectSnapshot(){\n"
helpers=r'''    function flattenCatalog(value,out=[],depth=0){
        if(depth>10||value==null)return out;
        if(Array.isArray(value)){for(const v of value)flattenCatalog(v,out,depth+1);return out;}
        if(typeof value!=='object')return out;
        const id=value.id??value.merit_id??value.education_id??value.course_id;
        const name=value.name??value.title??value.description??null;
        if(id!=null&&name)out.push({id:Number(id),name:String(name),raw:value});
        for(const v of Object.values(value))if(v&&typeof v==='object')flattenCatalog(v,out,depth+1);
        return out;
    }
    function catalogNameMap(value){const map={};for(const row of flattenCatalog(value)){if(Number.isFinite(row.id)&&!map[row.id])map[row.id]=row.name;}return map;}
    function decodeMerits(userMerits,catalog){
        const root=userMerits?.merits??userMerits??{}, upgrades=Array.isArray(root?.upgrades)?root.upgrades:[], names=catalogNameMap(catalog);
        return upgrades.map(u=>({id:u?.id??null,name:names[Number(u?.id)]||null,level:u?.level??null}));
    }
    function decodeEducation(userEducation,catalog){
        const root=userEducation?.education??userEducation??{}, names=catalogNameMap(catalog), complete=Array.isArray(root?.complete)?root.complete:[];
        return {complete:complete.map(id=>({id,name:names[Number(id)]||null})),current:root?.current?.id!=null?{...root.current,name:names[Number(root.current.id)]||null}:root?.current??null};
    }

'''
if anchor not in s: raise SystemExit('collectSnapshot anchor not found')
s=s.replace(anchor,helpers+anchor,1)

# Fetch global merit/education catalogs right after key info, but don't turn catalog problems into account failures.
old="requested++;setStatus('Checking API key…');const ki=await keyInfo(key);if(ki.ok){data.keyInfo=sanitizeDeep(ki.data);successful++;}else errors['key:info']={error:ki.error,code:ki.code??null,httpStatus:ki.httpStatus??null};\n        if(settings.includePrivateData){"
new="requested++;setStatus('Checking API key…');const ki=await keyInfo(key);if(ki.ok){data.keyInfo=sanitizeDeep(ki.data);successful++;}else errors['key:info']={error:ki.error,code:ki.code??null,httpStatus:ki.httpStatus??null};\n        setStatus('Loading Torn merit / education catalogs…');\n        const meritCatalog=await tornGlobalV2('merits',key), educationCatalog=await tornGlobalV2('education',key);\n        data.special.reference={merits:meritCatalog.ok?sanitizeDeep(meritCatalog.data):null,education:educationCatalog.ok?sanitizeDeep(educationCatalog.data):null};\n        if(settings.includePrivateData){"
if old not in s: raise SystemExit('keyInfo snapshot block not found')
s=s.replace(old,new,1)

# Add decoded merit/education view and fix nested v2 profile extraction before returning snapshot.
old="const profile=data.v2.profile||{};\n        return{schema:'sakalux-torn-account-snapshot-v4'"
new="data.special.decoded={merits:decodeMerits(data.v2.merits,data.special.reference?.merits),education:decodeEducation(data.v2.education,data.special.reference?.education)};\n        const profileRoot=data.v2.profile||{},profile=profileRoot.profile||profileRoot;\n        return{schema:'sakalux-torn-account-snapshot-v5'"
if old not in s: raise SystemExit('profile return block not found')
s=s.replace(old,new,1)

# Manifest: preserve sanitized key-info diagnostics and decoded readable data.
old="const manifest={schema:'sakalux-account-split-v2',generatedAt:snapshot.generatedAt,script:snapshot.script,account:snapshot.account,privacy:snapshot.privacy,capabilities:snapshot.capabilities,coverage:snapshot.coverage,errors:snapshot.errors,unavailable:snapshot.unavailable,files:Object.keys(parts)};"
new="const manifest={schema:'sakalux-account-split-v3',generatedAt:snapshot.generatedAt,script:snapshot.script,account:snapshot.account,privacy:snapshot.privacy,capabilities:snapshot.capabilities,apiKeyInfo:snapshot.data?.keyInfo||null,decoded:snapshot.data?.special?.decoded||null,coverage:snapshot.coverage,errors:snapshot.errors,unavailable:snapshot.unavailable,files:Object.keys(parts)};"
if old not in s: raise SystemExit('manifest block not found')
s=s.replace(old,new,1)

# Also include reference/decoded data in summary split output for easy reading.
old="parts['summary.json']=pickFields(v2,['profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','discord','display','icons','calendar','competition','faction','gym','honors','job','jobranks','medals','perks','virus','hof'],assigned);"
new="parts['summary.json']={...pickFields(v2,['profile','bars','cooldowns','travel','education','jobpoints','merits','refills','notifications','discord','display','icons','calendar','competition','faction','gym','honors','job','jobranks','medals','perks','virus','hof'],assigned),decoded:sp.decoded||null,reference:sp.reference||null};"
if old not in s: raise SystemExit('summary split block not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

# Info / release page
md=ROOT/'greasyfork/Account-Auditor.md'
d=md.read_text(encoding='utf-8')
d=d.replace('**v1.3.1**','**v1.3.2**',1)
d=re.sub(r'## Current release note\s*\n\n.*?\n\n## Recommended',"""## Current release note

**v1.3.2** fixes account-audit accuracy and diagnostics: an explicitly saved Auditor API key now overrides the TornPDA-injected key, ID-sensitive v2 selections retry through the canonical `selections=` route, the single-trade detail endpoint is no longer incorrectly polled without a trade ID, nested v2 profile data populates `manifest.json`, and Torn merit/education catalogs are stored with decoded human-readable IDs (for example merit 15 = Education Length). The split manifest now includes sanitized API-key capability information to make Full-access/log failures diagnosable without storing the key itself.

## Recommended""",d,count=1,flags=re.S)
insert='''\n### v1.3.2 — API diagnostics and readable merits\n\n- Saved Auditor API key now takes priority over TornPDA injection so a manually configured Full key is actually used.\n- Added canonical v2 `selections=` fallback for selections that reject the path form with code 6/7.\n- Removed invalid bare `trade` detail polling; `trades` remains collected.\n- Fixed nested v2 profile extraction so manifest account fields are populated.\n- Added Torn merit and education reference catalogs plus decoded readable entries.\n- Added sanitized key capability information to the split manifest for log-access diagnostics.\n- Snapshot schema is now `sakalux-torn-account-snapshot-v5`; split manifest schema is `sakalux-account-split-v3`.\n\n'''
d=d.replace('## Release history\n','## Release history\n'+insert,1)
md.write_text(d,encoding='utf-8')
print('Account Auditor v1.3.2 migration applied')
