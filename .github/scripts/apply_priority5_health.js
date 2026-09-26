'use strict';
const fs=require('node:fs');

const hubPath='SakaLuX-Script-Hub.user.js';
let hub=fs.readFileSync(hubPath,'utf8');

hub=hub.replace('// @version      1.9.85','// @version      1.9.86');
hub=hub.replace(/const VERSION = ['"]1\.9\.85['"];?/,'const VERSION = \'1.9.86\';');

const marker='    async function openSystemCheck() {';
if(!hub.includes(marker)) throw new Error('openSystemCheck marker missing');
if(!hub.includes('function collectHubDiagnostics()')) {
const helper=`    const HUB_RUNTIME_ERRORS = [];
    function recordHubRuntimeError(source, value) {
        const text = String(value?.message || value?.reason?.message || value?.reason || value || 'Unknown runtime error').slice(0, 240);
        HUB_RUNTIME_ERRORS.push({ source: String(source || 'runtime'), message: text, at: Date.now() });
        if (HUB_RUNTIME_ERRORS.length > 12) HUB_RUNTIME_ERRORS.splice(0, HUB_RUNTIME_ERRORS.length - 12);
    }
    if (!window.__SakaLuXHubRuntimeDiagnosticsBound) {
        window.__SakaLuXHubRuntimeDiagnosticsBound = true;
        window.addEventListener('error', event => recordHubRuntimeError('window.error', event?.error || event?.message), { passive: true });
        window.addEventListener('unhandledrejection', event => recordHubRuntimeError('unhandledrejection', event?.reason), { passive: true });
    }

    function collectHubDiagnostics() {
        const rows = getAllHealth();
        const installedRows = rows.filter(row => row.health.state !== 'missing');
        const disabled = installedRows.filter(row => !isModuleEnabled(row.script)).map(row => row.script.name);
        const errored = rows.filter(row => row.health.state === 'error').map(row => row.script.name);
        const missing = rows.filter(row => row.health.state === 'missing').map(row => row.script.name);
        const broker = window.SakaLuXCore?.api?.diagnostics?.() || null;
        const updateErrors = getUpdateErrorCount();
        const brokerIssues = broker ? Number(broker.failures || 0) + Number(broker.timeouts || 0) + Number(broker.rateLimited || 0) : 0;
        const level = errored.length || HUB_RUNTIME_ERRORS.length ? 'bad' : (missing.length || disabled.length || updateErrors || brokerIssues ? 'warn' : 'ok');
        return Object.freeze({
            level,
            hubVersion: VERSION,
            coreVersion: window.SakaLuXCore?.version || null,
            route: location.pathname + location.search + location.hash,
            modules: Object.freeze({ total: SCRIPTS.length, installed: installedRows.length, healthy: rows.filter(row => row.health.state === 'ok').length, disabled: Object.freeze([...disabled]), errored: Object.freeze([...errored]), missing: Object.freeze([...missing]) }),
            updates: Object.freeze({ available: getUpdateCount(), errors: updateErrors }),
            broker,
            runtimeErrors: Object.freeze(HUB_RUNTIME_ERRORS.map(item => Object.freeze({ ...item })))
        });
    }

`;
hub=hub.replace(marker,helper+marker);
}

const anchor="        results.push({ level: 'ok', label: 'SakaLuX Script Hub', detail: 'Loaded v' + VERSION + ' • API exposed' });";
if(!hub.includes(anchor)) throw new Error('System Check result anchor missing');
if(!hub.includes("label: 'API Broker'")) {
const add=`        const diagnostics = collectHubDiagnostics();
        results.unshift({ level: diagnostics.level, label: 'Overall health', detail: diagnostics.modules.healthy + '/' + diagnostics.modules.total + ' healthy • ' + diagnostics.modules.installed + ' installed • route ' + diagnostics.route });
        results.push({ level: diagnostics.modules.disabled.length ? 'warn' : 'ok', label: 'Disabled modules', detail: diagnostics.modules.disabled.length ? diagnostics.modules.disabled.join(', ') : 'None' });
        results.push({ level: diagnostics.runtimeErrors.length ? 'bad' : 'ok', label: 'Runtime errors', detail: diagnostics.runtimeErrors.length ? diagnostics.runtimeErrors.slice(-3).map(item => item.source + ': ' + item.message).join(' • ') : 'No captured runtime errors' });
        if (diagnostics.broker) {
            const broker = diagnostics.broker;
            const brokerLevel = broker.failures || broker.timeouts || broker.rateLimited ? 'warn' : 'ok';
            results.push({ level: brokerLevel, label: 'API Broker', detail: 'requests ' + broker.requests + ' • network ' + broker.networkRequests + ' • cache hits ' + broker.cacheHits + ' • deduped ' + broker.deduped + ' • retries ' + broker.retries + ' • failures ' + broker.failures + ' • active/queued/inflight ' + broker.active + '/' + broker.queued + '/' + broker.inflight + ' • cache ' + broker.cacheEntries });
            results.push({ level: 'ok', label: 'API transports', detail: 'PDA ' + (broker.transports?.pda ? 'ON' : 'OFF') + ' • GM ' + (broker.transports?.gm ? 'ON' : 'OFF') + ' • fetch ' + (broker.transports?.fetch ? 'ON' : 'OFF') + ' • max concurrency ' + broker.maxConcurrent });
        } else {
            results.push({ level: 'warn', label: 'API Broker', detail: 'Shared Core diagnostics unavailable' });
        }
`;
hub=hub.replace(anchor,add+anchor);
}

const apiAnchor="        refresh: async () => { await refreshRegistryAndCheck(); return true; },\n        health: () => ({ ready: true, version: VERSION";
if(!hub.includes(apiAnchor)) throw new Error('Hub public API anchor missing');
if(!hub.includes('diagnostics: collectHubDiagnostics')) {
  hub=hub.replace(apiAnchor,"        refresh: async () => { await refreshRegistryAndCheck(); return true; },\n        diagnostics: collectHubDiagnostics,\n        health: () => ({ ready: true, version: VERSION");
}
fs.writeFileSync(hubPath,hub);

const docPath='greasyfork/Script-Hub.md';
let doc=fs.readFileSync(docPath,'utf8');
doc=doc.replace(/Current version: `?v?1\.9\.85`?/i,'Current version: `v1.9.86`');
doc=doc.replace(/Canonical version: `?v?1\.9\.85`?/i,'Canonical version: `v1.9.86`');
if(!doc.includes('v1.9.86 — Hub Health / Diagnostics')) {
  const section='\n### v1.9.86 — Hub Health / Diagnostics\n- Expands System Check with an overall health snapshot, disabled-module reporting and captured runtime errors.\n- Displays Shared Core API Broker request/cache/retry/failure/queue diagnostics without exposing API keys.\n- Exposes `SakaLuXScriptHub.diagnostics()` for safe local diagnostics.\n';
  const idx=doc.indexOf('\n### v');
  doc=idx>=0?doc.slice(0,idx)+section+doc.slice(idx):doc+section;
}
fs.writeFileSync(docPath,doc);
console.log('Priority 5 Hub health diagnostics applied.');
