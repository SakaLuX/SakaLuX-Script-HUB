from pathlib import Path
import json

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text()
old=s

backup=Path('backups/SakaLuX-Market-Intelligence-v1.16.8.user.js')
if not backup.exists():
    backup.write_text(s)

s=s.replace('// @version      1.16.8','// @version      1.16.9',1)
s=s.replace("const VERSION = '1.16.8';","const VERSION = '1.16.9';",1)

# Extend state with API access diagnostic.
s=s.replace(
"        loadoutReady: false, loadoutItems: 0, loadoutComparisons: 0, loadoutBestVerdict: '', loadoutLastError: ''\n",
"        loadoutReady: false, loadoutItems: 0, loadoutComparisons: 0, loadoutBestVerdict: '', loadoutLastError: '',\n        apiAccessStatus: 'unknown', apiAccessMessage: 'Not checked yet', apiAccessCheckedAt: 0\n",
1)

# Add helpers after saveApiKey.
marker="    function saveApiKey(key) { try { localStorage.setItem(STORAGE.apiKey,key); state.apiMode='Manual'; } catch (_) {} }\n"
insert=marker+'''\n    function clearLoadoutCache(){ try{localStorage.removeItem(STORAGE.loadoutCache);}catch(_){} state.loadoutReady=false;state.loadoutItems=0; }\n    function apiErrorText(data){ return normText(data?.error?.error||data?.error?.message||data?.error||''); }\n    async function checkRequiredApiAccess(force=true){\n        const key=getApiKey();\n        if(!key){state.apiAccessStatus='missing';state.apiAccessMessage='No API key configured';state.apiAccessCheckedAt=Date.now();return {ok:false,status:'missing',message:state.apiAccessMessage};}\n        try{\n            const data=await requestJson('https://api.torn.com/v2/user/equipment?key='+encodeURIComponent(key));\n            if(data?.error){\n                const msg=apiErrorText(data)||'Torn API rejected equipment access';\n                state.apiAccessStatus=/permission|access|scope|key/i.test(msg)?'missing-equipment':'error';\n                state.apiAccessMessage=state.apiAccessStatus==='missing-equipment'?'API KEY MISSING EQUIPMENT ACCESS':msg;\n                state.apiAccessCheckedAt=Date.now();\n                return {ok:false,status:state.apiAccessStatus,message:state.apiAccessMessage,raw:msg};\n            }\n            const items=collectEquipmentItems(data);\n            state.apiAccessStatus='ok';state.apiAccessMessage='API access OK · user/equipment available';state.apiAccessCheckedAt=Date.now();\n            if(force){saveJson(STORAGE.loadoutCache,{at:Date.now(),items});state.loadoutReady=items.length>0;state.loadoutItems=items.length;}\n            return {ok:true,status:'ok',message:state.apiAccessMessage,items};\n        }catch(e){\n            const msg=String(e?.message||e||'API request failed');\n            state.apiAccessStatus=/permission|access|scope/i.test(msg)?'missing-equipment':'error';\n            state.apiAccessMessage=state.apiAccessStatus==='missing-equipment'?'API KEY MISSING EQUIPMENT ACCESS':msg;state.apiAccessCheckedAt=Date.now();\n            return {ok:false,status:state.apiAccessStatus,message:state.apiAccessMessage,raw:msg};\n        }\n    }\n    function saveReplacementApiKey(key){\n        const clean=String(key||'').trim();if(!clean)return false;\n        saveApiKey(clean);clearLoadoutCache();state.apiAccessStatus='unknown';state.apiAccessMessage='New key saved · checking access…';state.apiAccessCheckedAt=0;\n        try{sessionStorage.removeItem('SakaLuX_MI_KEY_SETUP_PENDING');}catch(_){}\n        return true;\n    }\n'''
if marker not in s: raise SystemExit('saveApiKey marker missing')
s=s.replace(marker,insert,1)

# Harden fetchEquippedLoadout diagnostics.
old_fetch="""            const data=await requestJson('https://api.torn.com/v2/user/equipment?key='+encodeURIComponent(key));\n            checkApiError(data);\n            const items=collectEquipmentItems(data);\n            saveJson(STORAGE.loadoutCache,{at:Date.now(),items});\n            state.loadoutReady=items.length>0;state.loadoutItems=items.length;state.loadoutLastError=items.length?'':'No equipped combat items returned';\n            return items;\n        }catch(e){state.loadoutReady=false;state.loadoutLastError=String(e?.message||e);return cached?.items||[];}\n"""
new_fetch="""            const data=await requestJson('https://api.torn.com/v2/user/equipment?key='+encodeURIComponent(key));\n            if(data?.error){\n                const msg=apiErrorText(data)||'Torn API rejected equipment access';\n                state.apiAccessStatus=/permission|access|scope|key/i.test(msg)?'missing-equipment':'error';\n                state.apiAccessMessage=state.apiAccessStatus==='missing-equipment'?'API KEY MISSING EQUIPMENT ACCESS':msg;state.apiAccessCheckedAt=Date.now();\n                throw new Error(state.apiAccessMessage);\n            }\n            const items=collectEquipmentItems(data);\n            saveJson(STORAGE.loadoutCache,{at:Date.now(),items});\n            state.apiAccessStatus='ok';state.apiAccessMessage='API access OK · user/equipment available';state.apiAccessCheckedAt=Date.now();\n            state.loadoutReady=items.length>0;state.loadoutItems=items.length;state.loadoutLastError=items.length?'':'API access OK, but no equipped combat items were returned';\n            return items;\n        }catch(e){state.loadoutReady=false;state.loadoutLastError=String(e?.message||e);return cached?.items||[];}\n"""
if old_fetch not in s: raise SystemExit('fetchEquippedLoadout marker missing')
s=s.replace(old_fetch,new_fetch,1)

# Improve comparator error output and add direct key-settings button.
old_err="""        if(!current){block.innerHTML='<div class=\"sl-mi-loadout-head\"><b>⚔ LOADOUT COMPARATOR</b><span>Could not match equipped '+esc(slot)+'</span></div><small class=\"sl-mi-loadout-error\">'+esc(state.loadoutLastError||'The Torn API key may need user/equipment access.')+'</small>';state.loadoutComparisons=0;state.loadoutBestVerdict='';return;}\n"""
new_err="""        if(!current){\n            const missing=state.apiAccessStatus==='missing-equipment'||/MISSING EQUIPMENT ACCESS/i.test(state.loadoutLastError||'');\n            const headline=missing?'API KEY MISSING EQUIPMENT ACCESS':'Could not match equipped '+esc(slot);\n            const detail=missing?'Create a new SakaLuX Market Intelligence API key, then paste/save it in Settings.':(state.loadoutLastError||'No compatible equipped item was returned.');\n            block.innerHTML='<div class=\"sl-mi-loadout-head\"><b>⚔ LOADOUT COMPARATOR</b><span>'+headline+'</span></div><small class=\"sl-mi-loadout-error\">'+esc(detail)+'</small><button type=\"button\" class=\"sl-mi-loadout-keyfix\">FIX API KEY</button>';\n            block.querySelector('.sl-mi-loadout-keyfix').onclick=()=>openSettings();state.loadoutComparisons=0;state.loadoutBestVerdict='';return;\n        }\n"""
if old_err not in s: raise SystemExit('comparator error marker missing')
s=s.replace(old_err,new_err,1)

# Replace API URL + create flow.
old_key="""    const REQUIRED_API_KEY_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Market%20Intelligence&user=money,travel,equipment&torn=items&market=itemmarket';\n    function createRequiredApiKey(){\n        try{sessionStorage.setItem('SakaLuX_MI_KEY_SETUP_PENDING','1');}catch(_){}\n        location.href=REQUIRED_API_KEY_URL;\n        return true;\n    }\n"""
new_key="""    const REQUIRED_API_KEY_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Market%20Intelligence&user=money,travel,equipment&torn=items&market=itemmarket';\n    function createRequiredApiKey(){\n        clearLoadoutCache();state.apiAccessStatus='setup';state.apiAccessMessage='Create the named key in Torn, then return and paste it below.';\n        try{sessionStorage.setItem('SakaLuX_MI_KEY_SETUP_PENDING','1');}catch(_){}\n        location.href=REQUIRED_API_KEY_URL;\n        return true;\n    }\n    function apiSetupPending(){try{return sessionStorage.getItem('SakaLuX_MI_KEY_SETUP_PENDING')==='1';}catch(_){return false;}}\n"""
if old_key not in s: raise SystemExit('key creation marker missing')
s=s.replace(old_key,new_key,1)

# Always show replacement key field and API status controls in Settings.
old_api="""+(!getApiKey()?'<label class=\"sl-mi-field\">Manual Torn API key<input id=\"sl-mi-api\" type=\"password\" placeholder=\"Public/limited key\"></label>':'')+'<div class=\"sl-mi-info\">"""
new_api="""+'<div class=\"sl-mi-api-box\"><div class=\"sl-mi-api-status '+esc(state.apiAccessStatus)+'\"><b>API ACCESS</b><span>'+esc(state.apiAccessMessage||'Not checked yet')+'</span></div><label class=\"sl-mi-field\">Replace / paste Torn API key<input id=\"sl-mi-api\" type=\"password\" autocomplete=\"off\" placeholder=\"Paste newly created key here\"></label><div class=\"sl-mi-api-actions\"><button type=\"button\" id=\"sl-mi-save-key\">SAVE NEW API KEY</button><button type=\"button\" id=\"sl-mi-check-key\">CHECK API ACCESS</button></div></div><div class=\"sl-mi-info\">"""
if old_api not in s: raise SystemExit('settings API field marker missing')
s=s.replace(old_api,new_api,1)

# Wire save/check buttons right after create-key wire.
wire="overlay.querySelector('#sl-mi-create-key').onclick=()=>createRequiredApiKey();"
wire_new=wire+"overlay.querySelector('#sl-mi-save-key').onclick=async()=>{const input=overlay.querySelector('#sl-mi-api');if(!saveReplacementApiKey(input?.value)){input?.focus();return;}const b=overlay.querySelector('#sl-mi-save-key');b.textContent='CHECKING…';const r=await checkRequiredApiAccess(true);b.textContent=r.ok?'API KEY OK ✓':'KEY SAVED · CHECK FAILED';if(r.ok){input.value='';scheduleScan(false);}setTimeout(()=>{if(overlay.isConnected)openSettings();},500);};overlay.querySelector('#sl-mi-check-key').onclick=async()=>{const b=overlay.querySelector('#sl-mi-check-key');b.textContent='CHECKING…';await checkRequiredApiAccess(true);if(overlay.isConnected)openSettings();};"
if wire not in s: raise SystemExit('settings wire marker missing')
s=s.replace(wire,wire_new,1)

# SAVE VALUES should only replace key if actually typed, via replacement helper.
s=s.replace("const api=overlay.querySelector('#sl-mi-api')?.value.trim();if(api)saveApiKey(api);","const api=overlay.querySelector('#sl-mi-api')?.value.trim();if(api)saveReplacementApiKey(api);",1)

# Add styles.
css_marker=".sl-mi-api-create{border:1px solid #66591d!important;background:#2a2512!important;color:#e4c95d!important}"
css_add=css_marker+".sl-mi-api-box{margin:9px 0;padding:8px;border:1px solid #2f3945;border-radius:9px;background:#121820}.sl-mi-api-status{display:flex;justify-content:space-between;gap:8px;padding:7px 8px;border-radius:7px;background:#181d24;font-size:10px}.sl-mi-api-status b{color:#d7b94c}.sl-mi-api-status.ok span{color:#78d98b}.sl-mi-api-status.missing-equipment span,.sl-mi-api-status.error span,.sl-mi-api-status.missing span{color:#f08b8b}.sl-mi-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sl-mi-api-actions button,.sl-mi-loadout-keyfix{min-height:36px;border:0;border-radius:8px;background:#374151;color:#fff;font-weight:900;font-size:10px}.sl-mi-loadout-keyfix{margin-top:6px;width:100%;background:#6b4f12;color:#ffe08a}"
if css_marker not in s: raise SystemExit('css marker missing')
s=s.replace(css_marker,css_add,1)

# Init: check access quietly, and reopen settings after user returns from Torn API page.
old_init="""    function init(){injectCss();createButton();startObserver();maybePromptHub();saveTravelSessions();if(settings.priceNetwork&&networkQueue.length)schedulePriceNetworkFlush(2500);scheduleScan(true);console.log('['+NAME+' v'+VERSION+'] Loaded.');}\n"""
new_init="""    function init(){injectCss();createButton();startObserver();maybePromptHub();saveTravelSessions();if(settings.priceNetwork&&networkQueue.length)schedulePriceNetworkFlush(2500);if(getApiKey())checkRequiredApiAccess(false);scheduleScan(true);if(apiSetupPending()&&!/preferences\\.php/i.test(location.pathname+location.href)){setTimeout(()=>openSettings(),900);}console.log('['+NAME+' v'+VERSION+'] Loaded.');}\n"""
if old_init not in s: raise SystemExit('init marker missing')
s=s.replace(old_init,new_init,1)

# Health output.
s=s.replace("loadoutLastError:state.loadoutLastError};},","loadoutLastError:state.loadoutLastError,apiAccessStatus:state.apiAccessStatus,apiAccessMessage:state.apiAccessMessage,apiAccessCheckedAt:state.apiAccessCheckedAt};},",1)

p.write_text(s)
if s==old: raise SystemExit('no changes')

# Registry
j=Path('scripts.json');data=json.loads(j.read_text())
for row in data.get('scripts',[]):
    if row.get('id')=='market-intelligence':
        row['version']='1.16.9'
        row['description']='Torn PDA-first market/travel intelligence with Loadout Comparator, API access diagnostics/key setup, robust Item Market detection, Price Network and travel tools.'
j.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

# GreasyFork info
md=Path('greasyfork/Market-Intelligence.md');t=md.read_text()
t=t.replace('**Current version: v1.16.8**','**Current version: v1.16.9**',1)
entry='''\n## v1.16.9 — Loadout API Key Fix\n\n- Added explicit API permission diagnostics for `user/equipment`.\n- Loadout Comparator now shows `API KEY MISSING EQUIPMENT ACCESS` when the active key cannot read equipped gear.\n- `CREATE REQUIRED API KEY` opens Torn's named-key flow for **SakaLuX Market Intelligence** with the selections used by the script and clears stale loadout cache first.\n- Settings now always exposes a secure replacement-key field plus **SAVE NEW API KEY** and **CHECK API ACCESS** controls.\n- After returning from Torn's API-key page, Market Intelligence reopens Settings so the new key can be pasted and verified immediately.\n- No script can safely read a newly created Torn API secret directly from Torn's preferences page; the one-time paste step is intentionally retained.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.8.user.js`.\n\n'''
if '## v1.16.9 — Loadout API Key Fix' not in t:
    pos=t.find('\n## '); t=t[:pos+1]+entry+t[pos+1:]
md.write_text(t)

u=Path('UPDATE-INFO.md');x=u.read_text()
x=x.replace('SakaLuX Market Intelligence: **v1.16.8**','SakaLuX Market Intelligence: **v1.16.9**',1)
latest='''\n### SakaLuX Market Intelligence v1.16.9\n- Added live `user/equipment` API permission diagnostics and a clear `API KEY MISSING EQUIPMENT ACCESS` state.\n- Added named-key setup handoff, always-visible replacement key field, SAVE NEW API KEY and CHECK API ACCESS controls.\n- Returning from Torn API setup now reopens Settings for immediate paste/verification; stale loadout cache is cleared on key replacement.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.8.user.js`.\n\n'''
needle='## Latest changes\n'
if '### SakaLuX Market Intelligence v1.16.9' not in x:
    x=x.replace(needle,needle+latest,1)
u.write_text(x)
