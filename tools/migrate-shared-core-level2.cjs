'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { stripSharedCore, embedSharedCore } = require('./embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'src/core/sakalux-core.js'), 'utf8');
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

const dockRankRe = /const\s+regs=\[\.\.\.new\s+Map\(regsRaw\.map\(r=>\[r\.id,r\]\)\)\.values\(\)\];\s*const\s+rank=id=>\{const\s+i=ORDER\.indexOf\(id\);return\s+i<0\?ORDER\.length\+100:i\};\s*regs\.sort\(\(a,b\)=>rank\(a\.id\)-rank\(b\.id\)\|\|String\(a\.name\|\|a\.id\)\.localeCompare\(String\(b\.name\|\|b\.id\)\)\);/g;
const dockSimpleRe = /const\s+regs=\[\.\.\.new\s+Map\(regsRaw\.map\(r=>\[r\.id,r\]\)\)\.values\(\)\];\s*regs\.sort\(\(a,b\)=>ORDER\.indexOf\(a\.id\)-ORDER\.indexOf\(b\.id\)\);/g;
const routePairRe = /addEventListener\('hashchange',\(\)=>queue\(350\),\{passive:true\}\);\s*addEventListener\('popstate',\(\)=>queue\(350\),\{passive:true\}\);/g;
const dockCore = 'const regs=window.SakaLuXCore.dock.sort(regsRaw);';
const routeCore = 'window.SakaLuXCore.router.onChange(()=>queue(350)); window.SakaLuXCore.router.bind();';

let changedFiles = 0;
let dockReplacements = 0;
let routeReplacements = 0;

for (const file of walk(root).sort()) {
  const original = fs.readFileSync(file, 'utf8');
  let body = stripSharedCore(original);
  let localDock = 0, localRoute = 0;

  body = body.replace(dockRankRe, () => { localDock++; return dockCore; });
  body = body.replace(dockSimpleRe, () => { localDock++; return dockCore; });
  body = body.replace(routePairRe, () => { localRoute++; return routeCore; });

  dockReplacements += localDock;
  routeReplacements += localRoute;
  const output = embedSharedCore(body, core);
  if (output !== original) {
    fs.writeFileSync(file, output, 'utf8');
    changedFiles++;
  }
}

console.log(JSON.stringify({ changedFiles, dockReplacements, routeReplacements }));
if (dockReplacements < 8) throw new Error(`Expected at least 8 shared dock replacements, got ${dockReplacements}`);
if (routeReplacements < 7) throw new Error(`Expected at least 7 shared route replacements, got ${routeReplacements}`);
