'use strict';
const fs=require('node:fs');
const path='SakaLuX-Script-Hub.user.js';
let s=fs.readFileSync(path,'utf8');

s=s.replace(/\/\/ @version\s+1\.9\.86/,()=> '// @version      1.9.87');
s=s.replace(/const VERSION\s*=\s*['"]1\.9\.86['"];?/,()=> "const VERSION = '1.9.87';");

const healthAnchor=`    function getAllHealth() {\n        return SCRIPTS.map(script => ({ script, health: getHealth(script) }));\n    }\n`;
if(!s.includes(healthAnchor)) throw new Error('getAllHealth anchor missing');
if(!s.includes('function getModuleStatus(script)')) {
const helper=`\n    function getModuleStatus(script) {\n        const health = getHealth(script);\n        const update = getUpdateState(script);\n        const installed = getInstalledVersion(script);\n        const api = script.api();\n        const bridge = document.getElementById('sakalux-module-bridge-' + script.id);\n        const detailError = String(health.data?.error || update.data?.error || '').trim();\n        if (health.state === 'missing') return { code: 'NOT_INSTALLED', label: 'NOT INSTALLED', level: 'warn', detail: 'No installed runtime or saved installed version detected.' };\n        if (health.state === 'error') return { code: 'API_ERROR', label: 'API ERROR', level: 'bad', detail: detailError || 'The module health endpoint reported an error.' };\n        if (update.state === 'available') return { code: 'UPDATE_AVAILABLE', label: 'UPDATE AVAILABLE', level: 'warn', detail: 'Installed v' + (installed || health.version || '?') + ' • latest v' + (update.data?.latest || script.expectedVersion || '?') };\n        if (!isModuleEnabled(script)) return { code: 'DISABLED', label: 'DISABLED', level: 'warn', detail: 'Installed, but the module power state is OFF.' };\n        if (installed && !api && !bridge) return { code: 'WRONG_PAGE', label: 'WRONG PAGE', level: 'warn', detail: 'Installed, but its runtime controls are not active on this Torn page.' };\n        if (update.state === 'failed') return { code: 'CHECK_ERROR', label: 'CHECK ERROR', level: 'warn', detail: detailError || 'The latest-version check failed.' };\n        return { code: 'OK', label: 'OK', level: 'ok', detail: 'Installed and available on the current page.' };\n    }\n\n    function getAllModuleStatus() {\n        return SCRIPTS.map(script => ({ script, status: getModuleStatus(script) }));\n    }\n\n    function getHealthSummary() {\n        const counts = { OK:0, UPDATE_AVAILABLE:0, DISABLED:0, WRONG_PAGE:0, API_ERROR:0, CHECK_ERROR:0, NOT_INSTALLED:0 };\n        for (const row of getAllModuleStatus()) counts[row.status.code] = (counts[row.status.code] || 0) + 1;\n        return Object.freeze(counts);\n    }\n`;
s=s.replace(healthAnchor,()=>healthAnchor+helper);
}

if(!s.includes("healthSummaryBox.id = 'slh-health-summary'")) {
const start=s.indexOf('    function renderMainStats() {');
const next=s.indexOf('\n    function updateCheckButtonState',start);
if(start<0||next<0) throw new Error('renderMainStats block missing');
const close=s.lastIndexOf('\n    }',next);
if(close<start) throw new Error('renderMainStats closing brace missing');
const insert=`\n        const healthSummary = getHealthSummary();\n        let healthSummaryBox = document.getElementById('slh-health-summary');\n        if (!healthSummaryBox) {\n            healthSummaryBox = document.createElement('div');\n            healthSummaryBox.id = 'slh-health-summary';\n            healthSummaryBox.style.cssText = 'display:flex;gap:5px;flex-wrap:wrap;margin:7px 0 0;padding:0 1px';\n            box.insertAdjacentElement('afterend', healthSummaryBox);\n        }\n        const healthItems = [\n            ['OK', healthSummary.OK, 'good'], ['UPDATE', healthSummary.UPDATE_AVAILABLE, 'warn'], ['OFF', healthSummary.DISABLED, 'warn'],\n            ['PAGE', healthSummary.WRONG_PAGE, 'warn'], ['API ERR', healthSummary.API_ERROR, 'bad'], ['CHECK', healthSummary.CHECK_ERROR, 'warn'], ['MISSING', healthSummary.NOT_INSTALLED, 'bad']\n        ];\n        healthSummaryBox.innerHTML = healthItems.map(([label,count,tone]) => '<span class="slh-chip ' + tone + '" style="font-size:7px">' + label + ' ' + count + '</span>').join('');\n`;
s=s.slice(0,close)+insert+s.slice(close);
}

if(!s.includes('const moduleStatus = getModuleStatus(script);')) {
s=s.replace("        const healthChipClass = health.state === 'ok' ? 'good' : health.state === 'error' ? 'bad' : 'warn';",()=>
`        const moduleStatus = getModuleStatus(script);\n        const healthChipClass = health.state === 'ok' ? 'good' : health.state === 'error' ? 'bad' : 'warn';\n        const statusChipClass = moduleStatus.level === 'ok' ? 'good' : moduleStatus.level === 'bad' ? 'bad' : 'warn';`);
const chip='                    <span class="slh-chip ${healthChipClass}">${missing ? \'NOT INSTALLED\' : \'v\' + escapeHtml(installed || health.version || \'?\')}</span>\n';
if(!s.includes(chip)) throw new Error('card health chip anchor missing');
const extra='                    <span class="slh-chip ${statusChipClass}" title="${escapeHtml(moduleStatus.detail)}">${escapeHtml(moduleStatus.label)}</span>\n';
s=s.replace(chip,()=>chip+extra);
}

const localStatus=`            const health = getHealth(script);\n            results.push({ level: health.state === 'ok' ? 'ok' : health.state === 'missing' ? 'warn' : 'bad', label: script.name + ' local status', detail: health.state === 'missing' ? 'Not installed' : health.state === 'ok' ? 'Installed v' + health.version : String(health.data?.error || 'Error') });`;
if(s.includes(localStatus)) {
s=s.replace(localStatus,()=>`            const moduleStatus = getModuleStatus(script);\n            results.push({ level: moduleStatus.level, label: script.name + ' local status', detail: moduleStatus.label + ' • ' + moduleStatus.detail });`);
}

if(!s.includes('moduleStatuses: Object.freeze(statuses.map')) {
const collectNeedle=`        const rows = getAllHealth();\n        const installedRows = rows.filter(row => row.health.state !== 'missing');`;
if(!s.includes(collectNeedle)) throw new Error('collectHubDiagnostics rows anchor missing');
s=s.replace(collectNeedle,()=>`        const rows = getAllHealth();\n        const statuses = getAllModuleStatus();\n        const installedRows = rows.filter(row => row.health.state !== 'missing');`);
const returnNeedle=`            modules: Object.freeze({ total: SCRIPTS.length, installed: installedRows.length, healthy: rows.filter(row => row.health.state === 'ok').length, disabled: Object.freeze([...disabled]), errored: Object.freeze([...errored]), missing: Object.freeze([...missing]) }),\n            updates: Object.freeze({ available: getUpdateCount(), errors: updateErrors }), broker,`;
if(!s.includes(returnNeedle)) throw new Error('diagnostics return anchor missing');
s=s.replace(returnNeedle,()=>`            modules: Object.freeze({ total: SCRIPTS.length, installed: installedRows.length, healthy: rows.filter(row => row.health.state === 'ok').length, disabled: Object.freeze([...disabled]), errored: Object.freeze([...errored]), missing: Object.freeze([...missing]) }),\n            moduleStatuses: Object.freeze(statuses.map(row => Object.freeze({ id: row.script.id, name: row.script.name, code: row.status.code, label: row.status.label, level: row.status.level, detail: row.status.detail }))),\n            statusCounts: getHealthSummary(),\n            updates: Object.freeze({ available: getUpdateCount(), errors: updateErrors }), broker,`);
}

fs.writeFileSync(path,s);

const docPath='greasyfork/Script-Hub.md';
let d=fs.readFileSync(docPath,'utf8');
d=d.replace('**v1.9.86**','**v1.9.87**');
d=d.replace(/- Canonical version: \*\*v1\.9\.\d+\*\*/,'- Canonical version: **v1.9.87**');
d=d.replace(/\*\*v1\.9\.86 — Hub Health \/ Diagnostics\*\*[\s\S]*?(?=\n## Release history)/,
`**v1.9.87 — Per-module Health Status**\n- Adds explicit per-module states: OK, UPDATE AVAILABLE, DISABLED, WRONG PAGE, API ERROR, CHECK ERROR and NOT INSTALLED.\n- Adds a compact health summary directly under the main Hub counters.\n- System Check now reports the exact local status reason for each managed module.\n- Exposes per-module status rows and status counts through SakaLuXScriptHub.diagnostics().\n`);
if(!d.includes('### v1.9.87 — Per-module Health Status')) {
 const sec=`\n### v1.9.87 — Per-module Health Status\n- Adds explicit per-module states: OK, UPDATE AVAILABLE, DISABLED, WRONG PAGE, API ERROR, CHECK ERROR and NOT INSTALLED.\n- Adds a compact main-screen summary and exact local status reasons in System Check.\n- Exposes moduleStatuses and statusCounts from SakaLuXScriptHub.diagnostics().\n`;
 const idx=d.indexOf('\n### v'); d=idx>=0?d.slice(0,idx)+sec+d.slice(idx):d+sec;
}
fs.writeFileSync(docPath,d);
console.log('Priority 5 health status v2 applied.');
