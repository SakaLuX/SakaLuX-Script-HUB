'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const today = '2026-09-26';

const docByFile = {
  'SakaLuX-Account-Auditor.user.js':'Account-Auditor.md',
  'SakaLuX-Bazaar-Smart-Pricer.user.js':'Bazaar-Smart-Pricer.md',
  'SakaLuX-Bazaar-Thanker-PDA.user.js':'Bazaar-Thanker.md',
  'SakaLuX-Chat-Intelligence.user.js':'Chat-Intelligence.md',
  'SakaLuX-Company-Intelligence-v1.0.0.user.js':'Company-Intelligence.md',
  'SakaLuX-Elimination-Assistant.user.js':'Elimination-Assistant.md',
  'SakaLuX-Enhancer-Guard.user.js':'Enhancer-Guard.md',
  'SakaLuX-Market-Intelligence.user.js':'Market-Intelligence.md',
  'SakaLuX-Mission-Rewards.user.js':'Mission-Rewards.md',
  'SakaLuX-Script-Hub.user.js':'Script-Hub.md',
  'SakaLuX-Stock-Manager-Advisor.user.js':'Stock-Manager-Advisor.md',
  'SakaLuX-Suite.user.js':'SakaLuX-Suite.md'
};

function headerVersion(text) {
  const m = text.match(/^\/\/\s*@version\s+([^\s]+)$/m);
  if (!m) throw new Error('Missing @version');
  return m[1];
}
function bump(v) {
  const p = v.split('.').map(Number);
  if (p.some(n => !Number.isFinite(n))) throw new Error(`Non-numeric version: ${v}`);
  while (p.length < 3) p.push(0);
  p[p.length - 1]++;
  return p.join('.');
}
function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function patchRuntimeVersions(text, oldV, newV) {
  text = text.replace(/^\/\/\s*@version\s+[^\s]+$/m, m => m.replace(oldV,newV));
  const patterns = [
    new RegExp(`(let\\s+v\\s*=\\s*['\"])${escapeRe(oldV)}(['\"])`),
    new RegExp(`(const\\s+VERSION\\s*=\\s*['\"])${escapeRe(oldV)}(['\"])`),
    new RegExp(`(const\\s+SCRIPT_VERSION\\s*=\\s*['\"])${escapeRe(oldV)}(['\"])`),
    new RegExp(`(const\\s+VERSION\\s*=\\s*\")${escapeRe(oldV)}(\")`),
    new RegExp(`(version\\s*:\\s*['\"])${escapeRe(oldV)}(['\"])`)
  ];
  for (const re of patterns) text = text.replace(re, '$1'+newV+'$2');
  return text;
}
function updateDoc(docPath, oldV, newV, file) {
  if (!fs.existsSync(docPath)) return;
  let text=fs.readFileSync(docPath,'utf8');
  text=text.replace(new RegExp(`(## Current version\\s*\\n\\*\\*v)${escapeRe(oldV)}(\\*\\*)`), `$1${newV}$2`);
  text=text.replace(new RegExp(`(- Canonical version:\\s*\\*\\*v)${escapeRe(oldV)}(\\*\\*)`), `$1${newV}$2`);
  text=text.replace(/(- Verified:\s*\*\*)\d{4}-\d{2}-\d{2}(\*\*)/, `$1${today}$2`);
  const specific = file === 'SakaLuX-Market-Intelligence.user.js'
    ? '- Routes Market Intelligence API reads through the shared Request Broker while preserving Travel/Bazaar page behavior and strict Manage Bazaar isolation.\n'
    : file === 'SakaLuX-Stock-Manager-Advisor.user.js'
      ? '- Routes Torn API reads through the shared Request Broker while keeping stock BUY/SELL transaction POSTs isolated in the verified rebalance state machine.\n'
      : '- Embeds Shared Core v1 while keeping this userscript independently installable and runnable.\n';
  const release = `## Current release note\n\n**v${newV} — Shared Core v1**\n- Centralizes shared performance, Hub detection, standalone dock ordering, SPA routing and common storage helpers.\n- Adds the shared API Request Broker foundation with request deduplication, bounded concurrency, retry/backoff, cache and diagnostics.\n${specific}- No separate Core userscript is required; Shared Core is embedded into this standalone build.\n\n`;
  if (/## Current release note[\s\S]*?(?=## Release history \/ Changelog)/.test(text)) {
    text=text.replace(/## Current release note[\s\S]*?(?=## Release history \/ Changelog)/, release);
  }
  const historyNeedle='## Release history / Changelog\n';
  if (text.includes(historyNeedle) && !text.includes(`### v${newV} — Shared Core v1`)) {
    const history=`\n### v${newV} — Shared Core v1\n- Centralizes shared infrastructure in the embedded SakaLuX Core.\n- Adds permanent Shared Core/API broker regression coverage.\n${specific}\n`;
    text=text.replace(historyNeedle, historyNeedle+history);
  }
  fs.writeFileSync(docPath,text,'utf8');
}

const versionByFile = {};
for (const file of Object.keys(docByFile)) {
  const p=path.join(root,file);
  if(!fs.existsSync(p)) throw new Error(`Missing userscript ${file}`);
  const source=fs.readFileSync(p,'utf8');
  const oldV=headerVersion(source), newV=bump(oldV);
  const patched=patchRuntimeVersions(source,oldV,newV);
  if(headerVersion(patched)!==newV) throw new Error(`${file}: header bump failed`);
  fs.writeFileSync(p,patched,'utf8');
  versionByFile[file]={oldV,newV};
  updateDoc(path.join(root,'greasyfork',docByFile[file]),oldV,newV,file);
  console.log(`${file}: ${oldV} -> ${newV}`);
}

const registryPath=path.join(root,'scripts.json');
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
for(const row of registry.scripts||[]){
  let file='';
  try { file=decodeURIComponent(new URL(row.sourceUrl).pathname.split('/').pop()||''); } catch {}
  const v=versionByFile[file];
  if(!v) continue;
  row.version=v.newV;
  row.release=row.release||{};
  row.release.version=v.newV;
  row.release.date=today;
  row.release.notes=[
    'Embeds Shared Core v1 while preserving standalone installation and operation.',
    'Centralizes shared performance, Hub detection, dock ordering, SPA routing and common infrastructure.',
    file==='SakaLuX-Market-Intelligence.user.js'
      ? 'Routes Market API reads through the shared Request Broker with dedupe, bounded concurrency, retry/backoff and diagnostics.'
      : file==='SakaLuX-Stock-Manager-Advisor.user.js'
        ? 'Routes Torn API reads through the shared Request Broker while keeping BUY/SELL transaction POSTs isolated from broker retries.'
        : 'Includes the shared API Request Broker foundation for controlled future API migration.'
  ];
  row.detailsRevision=Number(row.detailsRevision||0)+1;
}
fs.writeFileSync(registryPath,JSON.stringify(registry,null,2)+'\n','utf8');

fs.writeFileSync(path.join(root,'SHARED-CORE-v1-RELEASE.md'), `# SakaLuX Shared Core v1\n\nRelease date: ${today}\n\nShared Core is source/build infrastructure, not a separately installed userscript. It is embedded into every standalone SakaLuX userscript.\n\n## Included\n- Shared performance helpers and mutation filtering.\n- Hub detection and canonical standalone dock order/deduplication.\n- Shared SPA route signaling.\n- JSON storage helpers.\n- API Request Broker with inflight dedupe, TTL cache, bounded concurrency, retry/backoff, timeout/abort handling, route-scoped stale suppression and privacy-safe diagnostics.\n- Market Intelligence and Stock Manager API-read migration.\n- Stock BUY/SELL transaction POSTs remain outside the broker.\n- Permanent regression coverage for Core, broker, Market Travel, Stock rebalance and repository-wide standalone compatibility.\n`, 'utf8');
console.log('Shared Core v1 production release surfaces finalized.');
