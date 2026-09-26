'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const source=fs.readFileSync('SakaLuX-Account-Auditor.user.js','utf8');

assert.match(source,/^\/\/\s*@version\s+1\.3\.24$/m,'Account Auditor metadata bumped');
assert.ok(source.includes('SakaLuX Auditor Changes Since Last Audit — BEGIN'),'change block present');
assert.ok(source.includes("auditBaseline:'SakaLuX_AUDITOR_CHANGE_BASELINE_V1'"),'baseline storage present');
assert.ok(source.includes("lastChanges:'SakaLuX_AUDITOR_LAST_CHANGES_V1'"),'last changes storage present');
assert.ok(source.includes("'changes-since-last-audit.json'"),'split change file present');
assert.ok(source.includes('function buildAuditFingerprint(snapshot)'),'fingerprint builder present');
assert.ok(source.includes('function compareAuditFingerprints(previous,current)'),'comparison function present');
assert.ok(source.includes('function prepareAuditChanges(snapshot)'),'prepare function present');
assert.ok(source.includes('commitAuditBaseline(prepared.current);'),'baseline advances after sync');
const syncPos=source.indexOf('const result=await syncSnapshot(snapshot);');
const commitPos=source.indexOf('commitAuditBaseline(prepared.current);');
assert.ok(syncPos>=0&&commitPos>syncPos,'baseline commits only after successful sync call');
assert.ok(source.includes('changesSinceLastAudit(){return getLastAuditChanges();}'),'public changes API exposed');
assert.ok(source.includes("id=\"sl-aa-changes\""),'panel change counter present');
assert.ok(source.includes("AUDIT_CHANGE_GROUPS=['money','networth','battlestats','workstats','skills','criminalrecord','racingrecords','personalstats','merits','education','jobpoints','stocks','bars']"),'tracked change groups stable');
assert.ok(source.includes('changes:changes.slice(0,80)'),'report bounded to 80 detailed changes');

const doc=fs.readFileSync('greasyfork/Account-Auditor.md','utf8');
assert.ok(doc.includes('**v1.3.24**'),'doc current version synchronized');
assert.ok(doc.includes('Canonical version: **v1.3.24**'),'doc canonical version synchronized');
assert.ok(doc.includes('### v1.3.24 — Changes Since Last Audit'),'changelog synchronized');
console.log('Account Auditor Changes Since Last Audit regression passed.');
