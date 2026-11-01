'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/core/sakalux-signed-license-grant.js'),'utf8').trimEnd();
const embedded='/* SakaLuX Signed License Verifier — BEGIN */\n'+source+'\n/* SakaLuX Signed License Verifier — END */';
for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.user.js'))){
  const target=path.join(root,file),code=fs.readFileSync(target,'utf8');
  if(!code.includes('/* SakaLuX Signed License Verifier — BEGIN */'))continue;
  fs.writeFileSync(target,code.replace(/\/\* SakaLuX Signed License Verifier — BEGIN \*\/[\s\S]*?\/\* SakaLuX Signed License Verifier — END \*\//,()=>embedded));
}
