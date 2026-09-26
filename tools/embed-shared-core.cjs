'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BEGIN = '/* SakaLuX Shared Core — BEGIN */';
const END = '/* SakaLuX Shared Core — END */';

function stripSharedCore(source) {
  if (typeof source !== 'string') throw new TypeError('source must be a string');
  // The embedder owns the two newlines immediately before BEGIN. Removing the
  // block together with only those owned newlines restores the original file
  // byte-for-byte, including whatever whitespace originally followed metadata.
  const ownedBlock = new RegExp(`\\n\\n${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`, 'g');
  return source.replace(ownedBlock, '');
}

function embedSharedCore(source, core) {
  if (typeof source !== 'string' || typeof core !== 'string') throw new TypeError('source/core must be strings');
  if (!source.includes('// ==/UserScript==')) throw new Error('userscript metadata terminator not found');
  if (!core.includes("const NS = 'SakaLuXCore'")) throw new Error('unexpected Shared Core source');

  const stripped = stripSharedCore(source);
  const marker = '// ==/UserScript==';
  const at = stripped.indexOf(marker) + marker.length;
  return stripped.slice(0, at) + `\n\n${BEGIN}\n${core.trim()}\n${END}` + stripped.slice(at);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function metadataHeader(source) {
  const end = source.indexOf('// ==/UserScript==');
  if (end < 0) throw new Error('userscript metadata terminator not found');
  return source.slice(0, end + '// ==/UserScript=='.length);
}

function cli(argv = process.argv.slice(2)) {
  if (argv.length !== 3) {
    console.error('Usage: node tools/embed-shared-core.cjs <userscript> <core> <output>');
    process.exitCode = 2;
    return;
  }
  const [sourcePath, corePath, outputPath] = argv;
  const source = fs.readFileSync(sourcePath, 'utf8');
  const core = fs.readFileSync(corePath, 'utf8');
  const output = embedSharedCore(source, core);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf8');
}

if (require.main === module) cli();
module.exports = { embedSharedCore, stripSharedCore, metadataHeader, BEGIN, END };
