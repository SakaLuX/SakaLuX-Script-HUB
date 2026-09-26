'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { embedSharedCore } = require('./embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const corePath = path.join(root, 'src/core/sakalux-core.js');
const core = fs.readFileSync(corePath, 'utf8');

const SKIP_DIRS = new Set(['.git', 'node_modules']);

function collectUserscripts(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectUserscripts(path.join(dir, entry.name), out);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.user.js')) out.push(path.join(dir, entry.name));
  }
  return out;
}

const files = collectUserscripts(root).sort();
if (!files.length) throw new Error('No userscripts found');

let changed = 0;
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const output = embedSharedCore(source, core);
  if (output !== source) {
    fs.writeFileSync(file, output, 'utf8');
    changed += 1;
  }
}

console.log(`Shared Core embed complete: ${files.length} userscripts scanned, ${changed} changed.`);
