from pathlib import Path
import re, json

# --- Hub shared key: union of all shared modules, intentionally excluding Account Auditor ---
hub=Path('SakaLuX-Script-Hub.user.js')
s=hub.read_text(encoding='utf-8')
s=s.replace('// @version      1.9.82','// @version      1.9.83',1)
s=s.replace("let v = '1.9.82';","let v = '1.9.83';",1)
old=re.search(r"const SHARED_API_KEY_URL\s*=\s*'[^']+';",s)
if not old: raise SystemExit('Hub SHARED_API_KEY_URL not found')
new="const SHARED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks&market=itemmarket';"
s=s[:old.start()]+new+s[old.end():]
hub.write_text(s,encoding='utf-8')

# --- Mission: own CREATE button must always create Mission-only key ---
mis=Path('SakaLuX-Mission-Rewards.user.js')
s=mis.read_text(encoding='utf-8')
s=s.replace('// @version      1.0.43','// @version      1.0.44',1)
s=s.replace("let v = '1.0.43';","let v = '1.0.44';",1)
s=s.replace("version:'1.0.43'","version:'1.0.44'")
pat=re.compile(r"function createRequiredApiKey\(\)\s*\{\s*if \(window\.SakaLuXScriptHub\?\.createRequiredTornKey\) return window\.SakaLuXScriptHub\.createRequiredTornKey\(\);\s*location\.href\s*=\s*REQUIRED_API_KEY_URL;\s*return true;\s*\}")
rep="function createRequiredApiKey() {\n        location.href = REQUIRED_API_KEY_URL;\n        return true;\n    }"
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('Mission createRequiredApiKey delegate block not found')
mis.write_text(s,encoding='utf-8')

# --- Account Auditor: fully isolated Torn API key + own create-key button ---
aud=Path('SakaLuX-Account-Auditor.user.js')
s=aud.read_text(encoding='utf-8')
s=s.replace('// @version      1.3.16','// @version      1.3.17',1)
s=s.replace("const VERSION = '1.3.16';","const VERSION = '1.3.17';",1)
s=s.replace("version:'1.3.16'","version:'1.3.17'")
api_url=("https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Account%20Auditor"
"&user=profile,bars,cooldowns,travel,education,jobpoints,merits,refills,notifications,money,stocks,properties,discord,weaponexp,workstats,skills,battlestats,networth,display,icons,criminalrecord,bazaar,crimes,hof,ammo,attacksfull,bounties,calendar,casino,competition,enlistedcars,equipment,faction,forumfeed,forumfriends,forumposts,forumsubscribedthreads,forumthreads,gym,honors,itemmarket,itemmods,job,jobranks,medals,missions,organizedcrime,organizedcrimes,perks,property,races,racingrecords,reports,revivesfull,trades,virus,snapshot,personalstats,list,inventory,messages,events,log"
"&torn=merits,education")
marker="    const PDA_KEY = '###PDA-APIKEY###';"
if marker not in s: raise SystemExit('Auditor PDA_KEY marker not found')
s=s.replace(marker,marker+"\n    const AUDITOR_API_CREATE_URL = '"+api_url+"';",1)
needle="'<label>GitHub fine-grained token <input id=\"sl-aa-gh\" type=\"password\" placeholder=\"Stored in userscript storage\"></label>'+(!getTornApiKey()?'<label>Torn API key <input id=\"sl-aa-torn\" type=\"password\" placeholder=\"Use the least access you need\"></label>':'')+"
if needle not in s: raise SystemExit('Auditor API input UI marker not found')
repl="'<label>GitHub fine-grained token <input id=\"sl-aa-gh\" type=\"password\" placeholder=\"Stored in userscript storage\"></label>'+\n        '<button id=\"sl-aa-create-api\" type=\"button\">🔑 CREATE AUDITOR API KEY</button>'+\n        '<div class=\"sl-aa-note\"><b>Auditor key is isolated.</b> It is never read from or written to the Script Hub shared API key.</div>'+(!getTornApiKey()?'<label>Torn API key <input id=\"sl-aa-torn\" type=\"password\" placeholder=\"Auditor-only Torn API key\"></label>':'')+"
s=s.replace(needle,repl,1)
bind="overlay.querySelector('#sl-aa-close').onclick=()=>overlay.remove();"
if bind not in s: bind="overlay.querySelector('#sl-aa-close').onclick = () => overlay.remove();"
if bind not in s: raise SystemExit('Auditor close binding marker not found')
s=s.replace(bind,bind+"overlay.querySelector('#sl-aa-create-api').onclick=()=>{location.href=AUDITOR_API_CREATE_URL;};",1)
aud.write_text(s,encoding='utf-8')

# --- Registry release surfaces for registered modules ---
regp=Path('scripts.json')
data=json.loads(regp.read_text(encoding='utf-8'))
for row in data.get('scripts',[]):
    if row.get('id')=='mission-rewards':
        row['version']='1.0.44'; row['release']={'version':'1.0.44','date':'2026-09-19','notes':['Keeps the Mission API create button module-specific even when Script Hub is installed.','Creates only the Mission key permissions: User Ammo and Torn Items.','Shared Hub key may still be used for runtime data when available; the local Mission key remains the standalone fallback.']}
    if row.get('id')=='script-hub':
        row['version']='1.9.83'; row['release']={'version':'1.9.83','date':'2026-09-19','notes':['Expands the shared Hub Torn API create link to the exact union required by all shared API modules.','Adds Company and Stock Manager permissions to the shared key.','Intentionally excludes Account Auditor permissions because Auditor owns a separate isolated key.']}
regp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

md=Path('greasyfork/Account-Auditor.md')
if md.exists():
    t=md.read_text(encoding='utf-8')
    t=re.sub(r'\*\*v1\.3\.16\*\*','**v1.3.17**',t,count=1)
    heading='### v1.3.17 — Isolated Auditor API key creation\n- Adds an Auditor-only CREATE AUDITOR API KEY button prefilled with the selections collected by Account Auditor.\n- Keeps the Auditor Torn key completely separate from the Script Hub shared key.\n- Auditor permissions are intentionally excluded from the Hub shared-key superset.\n\n'
    if '### v1.3.17 — Isolated Auditor API key creation' not in t:
        pos=t.find('## Release history')
        if pos>=0:
            insert=t.find('\n',pos)+1
            t=t[:insert]+'\n'+heading+t[insert:]
        else: t+='\n'+heading
    md.write_text(t,encoding='utf-8')

audit=Path('.github/scripts/audit_api_key_architecture_20260919.py')
if audit.exists():
    t=audit.read_text(encoding='utf-8')
    t=t.replace("uses_api='api.torn.com' in s or '###PDA-APIKEY###' in s or 'TORN_API_KEY' in s or 'API_KEY' in s","uses_api='api.torn.com' in s or '###PDA-APIKEY###' in s")
    t=t.replace("'hub_global':'SakaLuXScriptHub' in s,","'hub_global':bool(re.search(r'SakaLuXScriptHub\\?\\.getApiKey|SakaLuXScriptHub\\.getApiKey',s)),")
    audit.write_text(t,encoding='utf-8')

print('API architecture fixed: Hub 1.9.83, Mission 1.0.44, Auditor 1.3.17')
# rerun after Suite classification check
