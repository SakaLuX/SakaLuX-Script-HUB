'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { embedSharedCore, stripSharedCore } = require('./embed-shared-core.cjs');

const root = path.resolve(__dirname, '..');
const core = fs.readFileSync(path.join(root, 'src/core/sakalux-core.js'), 'utf8');
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const FOUNDATION = '// Shared SakaLuX performance + Hub-style UI foundation.';
const CANONICAL_ORDER = [
  'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',
  'elimination-assistant','company-intelligence','chat-intelligence','stock-manager-advisor','account-auditor'
];

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

function removeLegacyFoundation(source) {
  let text = source;
  let removed = 0;
  for (;;) {
    const marker = text.indexOf(FOUNDATION);
    if (marker < 0) break;
    const lineStart = text.lastIndexOf('\n', marker) + 1;
    const close = text.indexOf('\n  })();', marker);
    if (close < 0 || close - marker > 16000) {
      throw new Error(`Legacy foundation marker found without nearby IIFE close (${marker})`);
    }
    let end = close + '\n  })();'.length;
    while (text[end] === '\r' || text[end] === '\n') end++;
    text = text.slice(0, lineStart) + text.slice(end);
    removed++;
  }
  return { text, removed };
}

function centralizeHubDetection(source) {
  let changed = 0;
  const text = source.replace(/const\s+hubInstalled\s*=\s*\(\)\s*=>\s*!!\([^;\n]+\);/g, () => {
    changed++;
    return 'const hubInstalled = () => !!window.SakaLuXCore?.hub?.installed?.();';
  });
  return { text, changed };
}

function centralizeDockOrder(source) {
  let changed = 0;
  const text = source.replace(/const\s+ORDER\s*=\s*\[(?:.|\n){0,900}?\];/g, block => {
    if (!CANONICAL_ORDER.every(id => block.includes(`'${id}'`) || block.includes(`\"${id}\"`))) return block;
    changed++;
    return 'const ORDER = window.SakaLuXCore.dock.ORDER;';
  });
  return { text, changed };
}

let changedFiles = 0;
let foundationBlocks = 0;
let hubDefs = 0;
let orderDefs = 0;

for (const file of walk(root).sort()) {
  const original = fs.readFileSync(file, 'utf8');
  let body = stripSharedCore(original);

  const a = removeLegacyFoundation(body); body = a.text; foundationBlocks += a.removed;
  const b = centralizeHubDetection(body); body = b.text; hubDefs += b.changed;
  const c = centralizeDockOrder(body); body = c.text; orderDefs += c.changed;

  const output = embedSharedCore(body, core);
  if (output !== original) {
    fs.writeFileSync(file, output, 'utf8');
    changedFiles++;
  }
}

console.log(JSON.stringify({ changedFiles, foundationBlocks, hubDefs, orderDefs }));
if (!changedFiles) console.log('Shared Core legacy dedup migration: no changes needed.');
