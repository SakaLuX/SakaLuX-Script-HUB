#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Account-Auditor.user.js'
DOC = ROOT / 'greasyfork/Account-Auditor.md'

src = SCRIPT.read_text(encoding='utf-8')
if 'SakaLuX Auditor Changes Since Last Audit — BEGIN' in src:
    print('Priority 8 already applied.')
    raise SystemExit(0)

# Version surfaces.
src = src.replace('// @version      1.3.23', '// @version      1.3.24', 1)
src = src.replace('{ version: "1.3.23" }', '{ version: "1.3.24" }', 1)
src = re.sub(r"(const\s+VERSION\s*=\s*['\"])1\.3\.23(['\"])", r'\g<1>1.3.24\2', src, count=1)
src = src.replace("g.__SakaLuXInstalledVersions['account-auditor'] = v;", "g.__SakaLuXInstalledVersions['account-auditor'] = v;", 1)

storage_old = """        lastSync:'SakaLuX_AUDITOR_LAST_SYNC_V3',\n        captures:'SakaLuX_AUDITOR_MESSAGE_CAPTURES_V1'\n"""
storage_new = """        lastSync:'SakaLuX_AUDITOR_LAST_SYNC_V3',\n        captures:'SakaLuX_AUDITOR_MESSAGE_CAPTURES_V1',\n        auditBaseline:'SakaLuX_AUDITOR_CHANGE_BASELINE_V1',\n        lastChanges:'SakaLuX_AUDITOR_LAST_CHANGES_V1'\n"""
if storage_old not in src:
    raise RuntimeError('Storage anchor not found')
src = src.replace(storage_old, storage_new, 1)

anchor = "    function clearCapturedMessages(){saveJson(STORAGE.captures,[]);setStatus('Captured messages cleared.');updatePanelStatus();}\n\n"
if anchor not in src:
    raise RuntimeError('Priority 8 insertion anchor not found')

block = r'''/* SakaLuX Auditor Changes Since Last Audit — BEGIN */
    const AUDIT_CHANGE_GROUPS=['money','networth','battlestats','workstats','skills','criminalrecord','racingrecords','personalstats','merits','education','jobpoints','stocks','bars'];
    const AUDIT_CHANGE_IGNORE=/(?:^|\.)(?:timestamp|time|date|last_action|lastAction|updated|cooldown|current|maximum|interval|until|expires|expiry)(?:$|\.)/i;
    function auditScalar(value){return value===null||['string','number','boolean'].includes(typeof value);}
    function flattenAuditValues(value,prefix,out,depth=0){
        if(depth>6||Object.keys(out).length>=600)return;
        if(auditScalar(value)){if(prefix&&!AUDIT_CHANGE_IGNORE.test(prefix))out[prefix]=value;return;}
        if(Array.isArray(value)){if(prefix)out[prefix+'.length']=value.length;return;}
        if(!value||typeof value!=='object')return;
        for(const key of Object.keys(value).sort()){
            if(Object.keys(out).length>=600)break;
            flattenAuditValues(value[key],prefix?prefix+'.'+key:key,out,depth+1);
        }
    }
    function buildAuditFingerprint(snapshot){
        const values={};
        flattenAuditValues(snapshot?.account||{},'account',values);
        flattenAuditValues(snapshot?.coverage||{},'coverage',values);
        const v2=snapshot?.data?.v2||{};
        const special=snapshot?.data?.special||{};
        for(const group of AUDIT_CHANGE_GROUPS){
            const value=group==='personalstats'?special.personalstats:v2[group];
            if(value!==undefined)flattenAuditValues(value,group,values);
        }
        return{schema:'sakalux-audit-fingerprint-v1',at:snapshot?.generatedAt||new Date().toISOString(),playerId:snapshot?.account?.playerId??null,values};
    }
    function auditChangePriority(path){
        if(/^account\.(?:level|rank|job|faction)/.test(path))return 0;
        if(/^(?:networth|money|battlestats|workstats|skills)\./.test(path))return 1;
        if(/^(?:criminalrecord|racingrecords|personalstats|stocks)\./.test(path))return 2;
        return 3;
    }
    function compareAuditFingerprints(previous,current){
        const previousValues=previous?.values||{},currentValues=current?.values||{};
        if(!previous||previous.schema!=='sakalux-audit-fingerprint-v1')return{schema:'sakalux-audit-changes-v1',baseline:true,previousAt:null,currentAt:current?.at||null,totalChanges:0,shownChanges:0,changes:[]};
        const changes=[];
        for(const path of [...new Set([...Object.keys(previousValues),...Object.keys(currentValues)])].sort()){
            const before=Object.prototype.hasOwnProperty.call(previousValues,path)?previousValues[path]:null;
            const after=Object.prototype.hasOwnProperty.call(currentValues,path)?currentValues[path]:null;
            if(Object.is(before,after))continue;
            const row={path,before,after};
            if(typeof before==='number'&&typeof after==='number'&&Number.isFinite(before)&&Number.isFinite(after))row.delta=after-before;
            changes.push(row);
        }
        changes.sort((a,b)=>auditChangePriority(a.path)-auditChangePriority(b.path)||a.path.localeCompare(b.path));
        return{schema:'sakalux-audit-changes-v1',baseline:false,previousAt:previous?.at||null,currentAt:current?.at||null,totalChanges:changes.length,shownChanges:Math.min(80,changes.length),changes:changes.slice(0,80)};
    }
    function prepareAuditChanges(snapshot){
        const current=buildAuditFingerprint(snapshot),previous=loadJson(STORAGE.auditBaseline,null),report=compareAuditFingerprints(previous,current);
        snapshot.changesSinceLastAudit=report;
        saveJson(STORAGE.lastChanges,report);
        return{current,report};
    }
    function commitAuditBaseline(fingerprint){if(fingerprint)saveJson(STORAGE.auditBaseline,fingerprint);}
    function getLastAuditChanges(){return loadJson(STORAGE.lastChanges,{schema:'sakalux-audit-changes-v1',baseline:true,totalChanges:0,shownChanges:0,changes:[]});}
/* SakaLuX Auditor Changes Since Last Audit — END */

'''
src = src.replace(anchor, anchor + block, 1)

sync_old = "async function syncNow(){if(busy)return false;busy=true;try{setStatus('Collecting read-only account snapshot…');const snapshot=await collectSnapshot();const result=await syncSnapshot(snapshot);setStatus('SYNC OK · '+new Date(result.at).toLocaleTimeString()+' · '+(result.splitFiles?.length||0)+' split files');updatePanelStatus();return true;}catch(e){setStatus('ERROR · '+String(e?.message||e));updatePanelStatus();return false;}finally{busy=false;}}"
sync_new = "async function syncNow(){if(busy)return false;busy=true;try{setStatus('Collecting read-only account snapshot…');const snapshot=await collectSnapshot();const prepared=prepareAuditChanges(snapshot);const result=await syncSnapshot(snapshot);commitAuditBaseline(prepared.current);setStatus('SYNC OK · '+new Date(result.at).toLocaleTimeString()+' · '+(result.splitFiles?.length||0)+' split files · '+(prepared.report.totalChanges||0)+' changes');updatePanelStatus();return true;}catch(e){setStatus('ERROR · '+String(e?.message||e));updatePanelStatus();return false;}finally{busy=false;}}"
if sync_old not in src:
    raise RuntimeError('syncNow anchor not found')
src = src.replace(sync_old, sync_new, 1)

parts_anchor = "        const parts={};\n"
if parts_anchor not in src:
    raise RuntimeError('parts anchor not found')
src = src.replace(parts_anchor, parts_anchor + "        if(snapshot.changesSinceLastAudit)parts['changes-since-last-audit.json']=snapshot.changesSinceLastAudit;\n", 1)

panel_old = "'<div class=\"sl-aa-info\">Captured messages: <strong id=\"sl-aa-captures\">'+loadJson(STORAGE.captures,[]).length+'</strong> · Last sync: <strong id=\"sl-aa-last-sync\">'+esc(lastSyncText())+'</strong></div><div id=\"sl-aa-status\">'+esc(lastStatus||'Ready')+'</div>'+"
panel_new = "'<div class=\"sl-aa-info\">Captured messages: <strong id=\"sl-aa-captures\">'+loadJson(STORAGE.captures,[]).length+'</strong> · Last sync: <strong id=\"sl-aa-last-sync\">'+esc(lastSyncText())+'</strong> · Changes: <strong id=\"sl-aa-changes\">'+esc(getLastAuditChanges().totalChanges||0)+'</strong></div><div id=\"sl-aa-status\">'+esc(lastStatus||'Ready')+'</div>'+"
if panel_old not in src:
    raise RuntimeError('panel info anchor not found')
src = src.replace(panel_old, panel_new, 1)

status_old = "function updatePanelStatus(){const el=document.getElementById('sl-aa-last-sync');if(el)el.textContent=lastSyncText();const c=document.getElementById('sl-aa-captures');if(c)c.textContent=String(loadJson(STORAGE.captures,[]).length);setStatus(lastStatus);}"
status_new = "function updatePanelStatus(){const el=document.getElementById('sl-aa-last-sync');if(el)el.textContent=lastSyncText();const c=document.getElementById('sl-aa-captures');if(c)c.textContent=String(loadJson(STORAGE.captures,[]).length);const d=document.getElementById('sl-aa-changes');if(d)d.textContent=String(getLastAuditChanges().totalChanges||0);setStatus(lastStatus);}"
if status_old not in src:
    raise RuntimeError('updatePanelStatus anchor not found')
src = src.replace(status_old, status_new, 1)

api_old = "capturedMessages(){return loadJson(STORAGE.captures,[]);},status(){return{version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),capturedMessages:loadJson(STORAGE.captures,[]).length,settings:"
api_new = "capturedMessages(){return loadJson(STORAGE.captures,[]);},changesSinceLastAudit(){return getLastAuditChanges();},status(){return{version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),changesSinceLastAudit:getLastAuditChanges(),capturedMessages:loadJson(STORAGE.captures,[]).length,settings:"
if api_old not in src:
    raise RuntimeError('public API anchor not found')
src = src.replace(api_old, api_new, 1)

SCRIPT.write_text(src, encoding='utf-8')

# Synchronize documentation.
doc = DOC.read_text(encoding='utf-8')
doc = doc.replace('**v1.3.23**', '**v1.3.24**', 1)
doc = re.sub(r'Canonical version:\s*\*\*v[^*]+\*\*', 'Canonical version: **v1.3.24**', doc, count=1)
current_start = doc.find('## Current release note')
history_start = doc.find('## Release history / Changelog')
if current_start < 0 or history_start < 0:
    raise RuntimeError('Account Auditor documentation release sections missing')
new_current = """## Current release note\n\n**v1.3.24 — Changes Since Last Audit**\n- Compares each successful audit against the previous successful audit using a compact local fingerprint.\n- Adds `changes-since-last-audit.json` to split snapshots with old/new values and numeric deltas.\n- Shows the change count in the Auditor panel and exposes `changesSinceLastAudit()` without storing API keys or tokens.\n- The baseline advances only after a successful sync, so failed syncs do not erase the comparison point.\n\n"""
doc = doc[:current_start] + new_current + doc[history_start:]
history_marker = '## Release history / Changelog\n'
entry = """\n### v1.3.24 — Changes Since Last Audit\n- Adds a compact local baseline/fingerprint for the previous successful audit.\n- Produces a bounded, prioritized change report covering account, finance, battle/work stats, skills, crimes, racing, stocks and related tracked selections.\n- Adds `changes-since-last-audit.json`, panel change count and public read-only diagnostics access.\n- Keeps the comparison baseline unchanged when a sync fails.\n\n"""
if entry.strip() not in doc:
    doc = doc.replace(history_marker, history_marker + entry, 1)
DOC.write_text(doc, encoding='utf-8')
print('Applied Priority 8 Account Auditor Changes Since Last Audit v1.3.24.')
