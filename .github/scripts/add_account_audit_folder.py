#!/usr/bin/env python3
from pathlib import Path

p = Path('SakaLuX-Account-Auditor.user.js')
text = p.read_text(encoding='utf-8')

# Version bump
text = text.replace('// @version      1.3.17', '// @version      1.3.18', 1)
text = text.replace("const VERSION = '1.3.17';", "const VERSION = '1.3.18';", 1)
text = text.replace("version:'1.3.17'", "version:'1.3.18'", 1)

# Add a dedicated audit folder setting.
old = "repo:'SakaLuX/SakaLuX-Torn-Account-Data', branch:'main', path:'SakaLuX-Account-Snapshot.json',"
new = "repo:'SakaLuX/SakaLuX-Torn-Account-Data', branch:'main', auditFolder:'audit', path:'SakaLuX-Account-Snapshot.json',"
if old not in text:
    raise SystemExit('DEFAULT_SETTINGS anchor not found')
text = text.replace(old, new, 1)

old_sync = """    async function syncSnapshot(snapshot){\n        const fullPath=String(settings.path||'SakaLuX-Account-Snapshot.json').replace(/^\\/+/, '');const files=[];let primary=null;\n        if(settings.splitSnapshots){\n            const parts=buildSplitSnapshots(snapshot);\n            for(const[path,value]of Object.entries(parts)){setStatus('Uploading '+path+'…');await syncJsonFile(path,value,'Sync Torn split snapshot '+path+' '+new Date().toISOString());files.push(path);}\n            const pointer={schema:'sakalux-account-split-pointer-v1',generatedAt:snapshot.generatedAt,manifest:'manifest.json',note:'Data is split across the manifest files to avoid duplicating the full account payload.'};\n            setStatus('Updating snapshot pointer…');primary=await syncJsonFile(fullPath,pointer,'Update Torn account snapshot pointer '+new Date().toISOString());\n        }else{\n            setStatus('Uploading full snapshot…');primary=await syncJsonFile(fullPath,snapshot,'Sync Torn account snapshot '+new Date().toISOString());\n        }\n        const meta={at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch:settings.branch,path:fullPath,splitFiles:files,commitSha:primary?.commit?.sha||null};saveJson(STORAGE.lastSync,meta);return meta;\n    }\n"""
new_sync = """    function normalizeAuditFolder(){\n        const raw=String(settings.auditFolder||'audit').trim().replace(/\\\\/g,'/').replace(/^\\/+|\\/+$/g,'');\n        const clean=raw.split('/').filter(Boolean).filter(part=>part!=='.'&&part!=='..').join('/');\n        return clean||'audit';\n    }\n    function auditPath(name){return normalizeAuditFolder()+'/'+String(name||'').replace(/^\\/+/, '');}\n    async function syncSnapshot(snapshot){\n        const configured=String(settings.path||'SakaLuX-Account-Snapshot.json').replace(/^\\/+/, '');\n        const fileName=configured.split('/').filter(Boolean).pop()||'SakaLuX-Account-Snapshot.json';\n        const folder=normalizeAuditFolder(), fullPath=auditPath(fileName), files=[];let primary=null;\n        if(settings.splitSnapshots){\n            const parts=buildSplitSnapshots(snapshot);\n            for(const[path,value]of Object.entries(parts)){const remotePath=auditPath(path);setStatus('Uploading '+remotePath+'…');await syncJsonFile(remotePath,value,'Sync Torn split snapshot '+remotePath+' '+new Date().toISOString());files.push(remotePath);}\n            const pointer={schema:'sakalux-account-split-pointer-v1',generatedAt:snapshot.generatedAt,manifest:auditPath('manifest.json'),folder,note:'All Account Auditor data is stored inside the dedicated audit folder. Data is split across the manifest files to avoid duplicating the full account payload.'};\n            setStatus('Updating snapshot pointer…');primary=await syncJsonFile(fullPath,pointer,'Update Torn account snapshot pointer '+new Date().toISOString());\n        }else{\n            setStatus('Uploading full snapshot…');primary=await syncJsonFile(fullPath,snapshot,'Sync Torn account snapshot '+new Date().toISOString());\n        }\n        const meta={at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch:settings.branch,auditFolder:folder,path:fullPath,splitFiles:files,commitSha:primary?.commit?.sha||null};saveJson(STORAGE.lastSync,meta);return meta;\n    }\n"""
if old_sync not in text:
    raise SystemExit('syncSnapshot anchor not found')
text = text.replace(old_sync, new_sync, 1)

old_ui = "'<label>GitHub repository <input id=\"sl-aa-repo\" value=\"'+esc(settings.repo)+'\"></label><label>Branch <input id=\"sl-aa-branch\" value=\"'+esc(settings.branch)+'\"></label><label>Full snapshot path <input id=\"sl-aa-path\" value=\"'+esc(settings.path)+'\"></label>'+"
new_ui = "'<label>GitHub repository <input id=\"sl-aa-repo\" value=\"'+esc(settings.repo)+'\"></label><label>Branch <input id=\"sl-aa-branch\" value=\"'+esc(settings.branch)+'\"></label><label>Audit folder <input id=\"sl-aa-folder\" value=\"'+esc(settings.auditFolder||'audit')+'\" placeholder=\"audit\"></label><label>Snapshot filename <input id=\"sl-aa-path\" value=\"'+esc(String(settings.path||'SakaLuX-Account-Snapshot.json').split('/').pop())+'\"></label>'+"
if old_ui not in text:
    raise SystemExit('settings UI anchor not found')
text = text.replace(old_ui, new_ui, 1)

old_save = "settings.repo=overlay.querySelector('#sl-aa-repo').value.trim();settings.branch=overlay.querySelector('#sl-aa-branch').value.trim()||'main';settings.path=overlay.querySelector('#sl-aa-path').value.trim()||'SakaLuX-Account-Snapshot.json';"
new_save = "settings.repo=overlay.querySelector('#sl-aa-repo').value.trim();settings.branch=overlay.querySelector('#sl-aa-branch').value.trim()||'main';settings.auditFolder=overlay.querySelector('#sl-aa-folder').value.trim()||'audit';settings.path=(overlay.querySelector('#sl-aa-path').value.trim().split('/').pop()||'SakaLuX-Account-Snapshot.json');"
if old_save not in text:
    raise SystemExit('settings save anchor not found')
text = text.replace(old_save, new_save, 1)

# Update description of the feature in the UI warning.
text = text.replace(
    '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> Split files can contain private Torn data. Passwords, cookies, session data and API/GitHub keys are never synced.</div>',
    '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> All account snapshot files are saved inside the dedicated <b>audit/</b> folder (or the folder you choose). Split files can contain private Torn data. Passwords, cookies, session data and API/GitHub keys are never synced.</div>',
    1
)

p.write_text(text, encoding='utf-8')
print('Account Auditor v1.3.18: dedicated audit folder enabled')
