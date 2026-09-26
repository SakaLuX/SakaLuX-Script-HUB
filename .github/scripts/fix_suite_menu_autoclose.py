from pathlib import Path
import re
p=Path('SakaLuX-Suite.user.js')
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(?m)^(//\s*@version\s+)0\.9\.941\s*$',r'\g<1>0.9.942',s,count=1)
if n!=1: raise SystemExit('Suite version marker not found')
old="function rowFor(panel,name){const candidates=$$('label,li,[class*=row],[class*=module],div',panel);return candidates.find(x=>new RegExp(name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),'i').test(txt(x))&&x.querySelector('input[type=checkbox],button,[role=switch]'));}\nfunction switchState(row,want){const c=row?.querySelector('input[type=checkbox]');if(c){if(c.checked!==want){c.checked=want;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}return;}const b=row?.querySelector('[role=switch],button');if(!b)return;const on=b.getAttribute('aria-checked')==='true'||/\\bon\\b/i.test(txt(b));if(on!==want)b.click();}"
new="function rowFor(panel,name){const esc=name.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'),rx=new RegExp(esc,'i');const candidates=$$('label,li,[class*=row],[class*=module]',panel).filter(x=>rx.test(txt(x))&&x.querySelector('input[type=checkbox],[role=switch]'));return candidates.sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0]||null;}\nfunction switchState(row,want){const c=row?.querySelector('input[type=checkbox]');if(c){if(c.checked!==want){c.checked=want;c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));}return;}const b=row?.querySelector('[role=switch]');if(!b)return;const on=b.getAttribute('aria-checked')==='true';if(on!==want){b.setAttribute('aria-checked',want?'true':'false');b.dispatchEvent(new Event('change',{bubbles:true}));}}"
if old not in s: raise SystemExit('sync functions marker not found')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

d=Path('greasyfork/SakaLuX-Suite.md');t=d.read_text(encoding='utf-8')
t=re.sub(r'(?m)^\*\*v0\.9\.941\*\*$', '**v0.9.942**', t, count=1)
t=re.sub(r'(?m)^- Canonical version: \*\*v0\.9\.941\*\*$', '- Canonical version: **v0.9.942**', t, count=1)
release='''\n### v0.9.942 — Suite menu stability\n- Fixes the Suite/Master Control panel closing itself shortly after opening.\n- Hub synchronization now targets only real module switches (checkbox / role=switch), never generic buttons such as Close.\n- Module-row matching prefers the smallest valid row instead of broad container elements.\n'''
if '### v0.9.942' not in t:
    pos=t.find('\n## Current version')
    t=t[:pos]+release+t[pos:]
t=t.replace('**v0.9.941 — Release documentation synchronized with the current Suite userscript version**','**v0.9.942 — Suite menu stability**',1)
t=t.replace('- Release documentation synchronized with the current Suite userscript version.','- Prevents Hub-state reconciliation from treating the Suite Close button as a module switch.',1)
d.write_text(t,encoding='utf-8')

test=Path('tests/suite-menu-autoclose-regression.cjs')
test.write_text("const fs=require('node:fs');const assert=require('node:assert/strict');const s=fs.readFileSync('SakaLuX-Suite.user.js','utf8');assert.match(s,/^\\/\\/\\s*@version\\s+0\\.9\\.942$/m);const start=s.indexOf('function switchState(row,want)');const end=s.indexOf('function badgeState',start);assert.ok(start>0&&end>start,'switchState block');const block=s.slice(start,end);assert.ok(!block.includes(\"querySelector('[role=switch],button')\"),'must never target generic buttons');assert.ok(!block.includes('.click()'),'Hub sync must not click controls');assert.ok(s.includes(\"$$('label,li,[class*=row],[class*=module]'\"),'row matcher constrained');console.log('suite menu autoclose regression: OK');\n",encoding='utf-8')
print('Suite menu autoclose fix applied')
