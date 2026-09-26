'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { stripSharedCore } = require('../tools/embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['.git','node_modules']);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.user.js')) out.push(full);
  }
  return out;
}

function count(src, re) { return [...src.matchAll(re)].length; }

const report = [];
for (const file of walk(root).sort()) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const src = stripSharedCore(fs.readFileSync(file, 'utf8'));
  const row = {
    file: rel,
    routeListeners: count(src, /addEventListener\s*\(\s*['"](?:popstate|hashchange)['"]/g),
    historyPatch: count(src, /history\.(?:pushState|replaceState)|(?:pushState|replaceState)\s*=\s*function/g),
    hrefPolling: count(src, /location\.(?:href|pathname|search|hash)/g),
    dockSorts: count(src, /\.sort\s*\(\s*\([^)]*\)\s*=>[\s\S]{0,500}ORDER\.indexOf/g),
    dockDedupeMaps: count(src, /new\s+Map\s*\([\s\S]{0,300}\.map\s*\([^)]*=>\s*\[[^\]]+\.id\s*,/g),
    jsonStorageGet: count(src, /localStorage\.getItem\([^\n]{0,160}JSON\.parse|JSON\.parse\([^\n]{0,160}localStorage\.getItem/g),
    jsonStorageSet: count(src, /localStorage\.setItem\([^\n]{0,200}JSON\.stringify/g),
    gmRequests: count(src, /GM_xmlhttpRequest\s*\(/g),
    pdaGets: count(src, /PDA_httpGet\s*\(/g),
    fetchCalls: count(src, /\bfetch\s*\(/g),
    apiTornRefs: count(src, /api\.torn\.com/g),
    coreRouterRefs: count(src, /SakaLuXCore\??\.router|SakaLuXCore\.router/g),
    coreDockRefs: count(src, /SakaLuXCore\??\.dock|SakaLuXCore\.dock/g),
    coreStorageRefs: count(src, /SakaLuXCore\??\.storage|SakaLuXCore\.storage/g)
  };
  report.push(row);
}

const totals = report.reduce((a, r) => {
  for (const [k,v] of Object.entries(r)) if (k !== 'file') a[k] = (a[k] || 0) + v;
  return a;
}, {});

console.log('LEVEL2_AUDIT_TOTALS ' + JSON.stringify(totals));
for (const row of report) console.log('LEVEL2_AUDIT_FILE ' + JSON.stringify(row));
