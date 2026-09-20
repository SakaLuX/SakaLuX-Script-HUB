#!/usr/bin/env python3
from pathlib import Path
p=Path('SakaLuX-Account-Auditor.user.js')
text=p.read_text(encoding='utf-8')
text=text.replace('// @version      1.3.20','// @version      1.3.21',1)
text=text.replace("const VERSION = '1.3.20';","const VERSION = '1.3.21';",1)
text=text.replace("version:'1.3.20'","version:'1.3.21'",1)

old="""        'stocks','properties','discord','weaponexp','workstats','skills','battlestats','networth','display','icons',
        'criminalrecord','bazaar','crimes','hof','ammo','attacksfull','bounties','calendar','casino','competition',
        'enlistedcars','equipment','faction','forumfeed','forumfriends','forumposts','forumsubscribedthreads',
        'forumthreads','gym','honors','itemmarket','itemmods','job','jobranks','medals','missions','organizedcrime',
        'organizedcrimes','perks','property','races','racingrecords','reports','revivesfull','trades','virus','snapshot'
"""
new="""        'stocks','properties','discord','weaponexp','workstats','skills','battlestats','networth','display','icons',
        'bazaar','hof','ammo','attacksfull','bounties','calendar','casino','competition',
        'enlistedcars','equipment','faction','forumfeed','forumfriends','forumposts','forumsubscribedthreads',
        'forumthreads','gym','honors','itemmarket','itemmods','job','jobranks','medals','missions','organizedcrime',
        'organizedcrimes','perks','property','races','racingrecords','reports','revivesfull','trades','virus'
"""
if old not in text: raise SystemExit('V2_ENDPOINTS anchor missing')
text=text.replace(old,new,1)

anchor="""    async function tornGlobalV2(endpoint,key,query=''){let url='https://api.torn.com/v2/torn/'+encodeURIComponent(endpoint)+(query?(query.startsWith('?')?query:'?'+query):'');return apiJsonWithRetry(withKey(url,key));}
"""
insert=anchor+"""    const CRIME_2_IDS = Object.freeze([1,2,3,4,5,6,7,8,9,10,11,12]);
    async function collectCrimes2(key){
        const byCrime={},errors={};
        for(const id of CRIME_2_IDS){
            setStatus('v2 crimes · '+id+'/'+CRIME_2_IDS.length);
            const r=await tornV2Selection('crimes',key,'id='+encodeURIComponent(id));
            if(r.ok)byCrime[id]=sanitizeDeep(r.data);
            else errors[id]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
        return{ok:Object.keys(errors).length===0,data:{crimeIds:CRIME_2_IDS.slice(),byCrime},errors};
    }
"""
if anchor not in text: raise SystemExit('tornGlobalV2 anchor missing')
text=text.replace(anchor,insert,1)

loop_anchor="""        for(let i=0;i<V2_ENDPOINTS.length;i++){
            const endpoint=V2_ENDPOINTS[i];requested++;setStatus('v2 '+endpoint+' '+(i+1)+'/'+V2_ENDPOINTS.length);
            const r=await collectPagedV2(endpoint,key,'',200);
            if(r.ok){data.v2[endpoint]=r.data;successful++;}
            else errors['v2:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
"""
replacement="""        // criminalrecord is API v1-only in Torn's current API matrix. Keep it as a compatibility
        // source, but normalize it into data.v2 so the split audit schema stays stable.
        requested++;setStatus('v1 criminalrecord compatibility');
        const criminalRecord=await tornV1('criminalrecord',key);
        if(criminalRecord.ok){data.v2.criminalrecord=sanitizeDeep(criminalRecord.data);successful++;}
        else errors['v1:criminalrecord']={error:criminalRecord.error,code:criminalRecord.code??null,httpStatus:criminalRecord.httpStatus??null};

        // user/crimes in API v2 is a per-crime endpoint and requires an explicit crime id.
        // Query every current Crimes 2.0 category instead of calling /user/crimes without an id.
        requested++;setStatus('v2 crimes by crime ID');
        const crimes2=await collectCrimes2(key);
        data.v2.crimes=crimes2.data;
        if(crimes2.ok)successful++;else errors['v2:crimes']=crimes2.errors;

        for(let i=0;i<V2_ENDPOINTS.length;i++){
            const endpoint=V2_ENDPOINTS[i];requested++;setStatus('v2 '+endpoint+' '+(i+1)+'/'+V2_ENDPOINTS.length);
            const r=await collectPagedV2(endpoint,key,'',200);
            if(r.ok){data.v2[endpoint]=r.data;successful++;}
            else errors['v2:'+endpoint]={error:r.error,code:r.code??null,httpStatus:r.httpStatus??null};
        }
"""
if loop_anchor not in text: raise SystemExit('collection loop anchor missing')
text=text.replace(loop_anchor,replacement,1)

old_caps="""capabilities:{canonicalApi:'v2',legacyV1Duplicates:false,messageList:true,messageBodyViaOfficialApi:false,messageBodyViaUserCapture:true,logsRequireFullAccess:true,splitSnapshots:Boolean(settings.splitSnapshots)}"""
new_caps="""capabilities:{canonicalApi:'v2',legacyV1Duplicates:false,legacyV1Compatibility:['criminalrecord'],excludedNonAccountEndpoints:['snapshot'],messageList:true,messageBodyViaOfficialApi:false,messageBodyViaUserCapture:true,logsRequireFullAccess:true,splitSnapshots:Boolean(settings.splitSnapshots)}"""
if old_caps not in text: raise SystemExit('capabilities anchor missing')
text=text.replace(old_caps,new_caps,1)

old_dedupe="""deduplication:'v2 canonical; no v1 mirror; no newmessages/newevents subsets; attacksfull/revivesfull replace reduced variants'"""
new_dedupe="""deduplication:'v2 canonical; criminalrecord uses required v1 compatibility; user/crimes is collected per Crimes 2.0 ID; user/snapshot is excluded because Torn returns a global daily-active-players CSV, not account data; no newmessages/newevents subsets; attacksfull/revivesfull replace reduced variants'"""
if old_dedupe not in text: raise SystemExit('deduplication anchor missing')
text=text.replace(old_dedupe,new_dedupe,1)

p.write_text(text,encoding='utf-8')
print('Account Auditor v1.3.21: correct criminalrecord/crimes handling and exclude global CSV snapshot from account coverage')
