'use strict';

const fs=require('node:fs');
const path=require('node:path');

const BEGIN='/* SakaLuX Shared Dock Runtime — BEGIN */';
const END='/* SakaLuX Shared Dock Runtime — END */';
const CANONICAL_END='/* SakaLuX Canonical Installed Version — END */';

function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function stripSharedDockRuntime(source){
  if(typeof source!=='string') throw new TypeError('source must be a string');
  const re=new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`,'g');
  return source.replace(re,'').replace(/\n{3,}/g,'\n\n');
}
function embedSharedDockRuntime(source,runtime){
  if(typeof source!=='string'||typeof runtime!=='string') throw new TypeError('source/runtime must be strings');
  if(!runtime.includes("const NS = 'SakaLuXDockRuntime'")) throw new Error('unexpected Shared Dock Runtime source');
  if(source.includes(BEGIN)){
    const re=new RegExp(`${escapeRegExp(BEGIN)}[\\s\\S]*?${escapeRegExp(END)}`);
    return source.replace(re,`${BEGIN}\n${runtime.trim()}\n${END}`);
  }
  const at=source.indexOf(CANONICAL_END);
  if(at<0) throw new Error('canonical installed-version marker not found');
  const pos=at+CANONICAL_END.length;
  return source.slice(0,pos)+`\n\n${BEGIN}\n${runtime.trim()}\n${END}`+source.slice(pos);
}
function cli(argv=process.argv.slice(2)){
  if(argv.length!==3){console.error('Usage: node tools/embed-shared-dock-runtime.cjs <userscript> <runtime> <output>');process.exitCode=2;return;}
  const [sourcePath,runtimePath,outputPath]=argv;
  const source=fs.readFileSync(sourcePath,'utf8');
  const runtime=fs.readFileSync(runtimePath,'utf8');
  const output=embedSharedDockRuntime(source,runtime);
  fs.mkdirSync(path.dirname(outputPath),{recursive:true});
  fs.writeFileSync(outputPath,output,'utf8');
}
if(require.main===module)cli();
module.exports={embedSharedDockRuntime,stripSharedDockRuntime,BEGIN,END};
