from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Elimination-Assistant.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.3\.14(\s*$)',r'\g<1>1.3.15\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION='1\.3\.14'", "const VERSION='1.3.15'", text, count=1)
if n!=1: raise SystemExit('runtime version not found')

old=(".slx-targets-menu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;z-index:50!important;width:210px!important;padding:8px!important;border:1px solid #3a4b61!important;border-radius:12px!important;background:linear-gradient(155deg,#18212d,#101720)!important;box-shadow:0 14px 36px rgba(0,0,0,.55)!important}.slx-targets-menu.open{display:block!important}.slx-targets-title{padding:4px 5px 8px!important;color:#9fb0c5!important;font-size:10px!important;font-weight:900!important;text-transform:uppercase!important}.slx-target-option{display:flex!important;align-items:center!important;gap:8px!important;padding:8px 7px!important;margin:3px 0!important;border:1px solid #2d3c4e!important;border-radius:9px!important;background:#131b25!important;color:#dce6f0!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}.slx-target-option input{appearance:none!important;-webkit-appearance:none!important;width:16px!important;height:16px!important;min-width:16px!important;margin:0!important;border:1px solid #607089!important;border-radius:4px!important;background:#0d141d!important}.slx-target-option input:checked{background:#2563eb!important;border-color:#60a5fa!important;box-shadow:inset 0 0 0 3px #0d141d!important}.slx-target-option.safe-opt:has(input:checked){border-color:#22c55e!important;color:#86efac!important}.slx-target-option.risky-opt:has(input:checked){border-color:#eab308!important;color:#fde047!important}.slx-targets-menu #slx-targets-clear{width:100%!important;margin-top:6px!important;min-height:30px!important;background:#202a37!important;border-color:#3a4a5d!important;color:#cbd5e1!important;font-size:9px!important}")
new=(".slx-targets-menu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;z-index:50!important;width:188px!important;padding:8px!important;border:1px solid #3a4b61!important;border-radius:12px!important;background:linear-gradient(155deg,#18212d,#101720)!important;box-shadow:0 14px 36px rgba(0,0,0,.55)!important}.slx-targets-menu.open{display:block!important}.slx-targets-title{padding:3px 4px 7px!important;color:#9fb0c5!important;font-size:9px!important;font-weight:900!important;text-transform:uppercase!important}.slx-target-option{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;padding:7px 8px!important;margin:3px 0!important;min-height:34px!important;box-sizing:border-box!important;border:1px solid #2d3c4e!important;border-radius:9px!important;background:#131b25!important;color:#dce6f0!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}.slx-target-option span{order:1!important;flex:1!important;white-space:nowrap!important}.slx-target-option input{order:2!important;appearance:none!important;-webkit-appearance:none!important;position:relative!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0!important;border:1px solid #4b5d72!important;border-radius:999px!important;background:#273240!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.45)!important;transition:.18s ease!important;cursor:pointer!important}.slx-target-option input:before{content:''!important;position:absolute!important;top:2px!important;left:2px!important;width:15px!important;height:15px!important;border-radius:50%!important;background:#c7d1dc!important;box-shadow:0 1px 3px rgba(0,0,0,.5)!important;transition:transform .18s ease,background .18s ease!important}.slx-target-option input:checked{background:#2563eb!important;border-color:#60a5fa!important}.slx-target-option input:checked:before{transform:translateX(17px)!important;background:#fff!important}.slx-target-option:has(input:checked){border-color:#41658e!important;background:#15263a!important;color:#fff!important}.slx-target-option.safe-opt:has(input:checked){border-color:#22c55e!important;color:#86efac!important}.slx-target-option.safe-opt input:checked{background:#15803d!important;border-color:#4ade80!important}.slx-target-option.risky-opt:has(input:checked){border-color:#d6a914!important;color:#fde047!important}.slx-target-option.risky-opt input:checked{background:#8a6a05!important;border-color:#eab308!important}.slx-targets-menu #slx-targets-clear{width:100%!important;margin-top:6px!important;min-height:30px!important;background:#202a37!important;border-color:#3a4a5d!important;color:#cbd5e1!important;font-size:9px!important}")
if old not in text: raise SystemExit('TARGETS popup CSS block not found')
text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')

rp=ROOT/'scripts.json'; reg=json.loads(rp.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='elimination-assistant': item['version']='1.3.15'
rp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

hp=ROOT/'SakaLuX-Script-Hub.user.js'; hub=hp.read_text(encoding='utf-8')
hub,n=re.subn(r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,650}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>1.3.15\2',hub,count=1)
if n!=1: raise SystemExit('hub fallback version failed')
hp.write_text(hub,encoding='utf-8')

mp=ROOT/'greasyfork/Elimination-Assistant.md'; doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.3\.14(\*\*)',r'\g<1>1.3.15\2',doc,count=1)
if n!=1: raise SystemExit('elim doc version failed')
if '### v1.3.15' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.3.15 — Compact sliding target switches\n\n- Replaced oversized TARGETS checkboxes with compact sliding ON/OFF switches.\n- Kept ATTACKABLE, SAFE, RISKY and UNOPENED on single clean rows.\n- Reduced TARGETS popup width and vertical footprint for TornPDA.\n',1)
mp.write_text(doc,encoding='utf-8')
sp=ROOT/'greasyfork/Script-Hub.md'; sdoc=sp.read_text(encoding='utf-8').replace('**v1.3.14**','**v1.3.15**')
sp.write_text(sdoc,encoding='utf-8')
print('Elimination target switches applied')
