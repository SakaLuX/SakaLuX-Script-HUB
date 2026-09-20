#!/usr/bin/env python3
from pathlib import Path
p=Path('SakaLuX-Account-Auditor.user.js')
text=p.read_text(encoding='utf-8')
old="""    function rawSet(key,value){ const text=String(value??''); try{if(typeof GM_setValue==='function')GM_setValue(key,text);}catch(_){} try{localStorage.removeItem(key);}catch(_){} }"""
new="""    function rawSet(key,value){
        const text=String(value??'');
        try{if(typeof GM_setValue==='function')GM_setValue(key,text);}catch(_){}
        // TornPDA/Tampermonkey compatibility: mirror values to localStorage too.
        // Some environments expose asynchronous GM storage semantics, so removing
        // the fallback here made freshly-saved values (notably LAST SYNC) read as empty.
        try{localStorage.setItem(key,text);}catch(_){}
    }"""
if old not in text:
    raise SystemExit('rawSet anchor not found')
text=text.replace(old,new,1)
text=text.replace('// @version      1.3.17','// @version      1.3.18',1)
text=text.replace("const VERSION = '1.3.17';","const VERSION = '1.3.18';",1)
text=text.replace("version:'1.3.17'","version:'1.3.18'",1)
p.write_text(text,encoding='utf-8')
print('Fixed Account Auditor LAST SYNC persistence, v1.3.18')
