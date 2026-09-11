from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Elimination-Assistant.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.3\.15(\s*$)',r'\g<1>1.3.16\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION='1\.3\.15'", "const VERSION='1.3.16'", text, count=1)
if n!=1: raise SystemExit('runtime version not found')

pat=r"\.slx-targets-menu\{[\s\S]*?\.slx-search #slx-q\{flex:1 1 auto!important;min-width:0!important\}"
new=""".slx-targets-menu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;z-index:50!important;width:184px!important;padding:8px!important;border:1px solid #334155!important;border-radius:12px!important;background:linear-gradient(160deg,#17202b,#10161e)!important;box-shadow:0 14px 30px rgba(0,0,0,.48)!important}.slx-targets-menu.open{display:block!important}.slx-targets-title{padding:2px 3px 7px!important;color:#8fa0b5!important;font-size:9px!important;font-weight:900!important;letter-spacing:.35px!important;text-transform:uppercase!important}.slx-target-option{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;min-height:35px!important;margin:3px 0!important;padding:7px 9px!important;box-sizing:border-box!important;border:1px solid #263545!important;border-radius:9px!important;background:#121a23!important;color:#d6dee8!important;font-size:10px!important;font-weight:850!important;cursor:pointer!important;transition:background .16s ease,border-color .16s ease!important}.slx-target-option:hover{background:#151f2a!important}.slx-target-option span{order:1!important;flex:1!important;white-space:nowrap!important;letter-spacing:.1px!important}.slx-target-option input{order:2!important;appearance:none!important;-webkit-appearance:none!important;position:relative!important;width:40px!important;height:22px!important;min-width:40px!important;max-width:40px!important;min-height:22px!important;max-height:22px!important;margin:0!important;padding:0!important;border:1px solid #46576b!important;border-radius:999px!important;background:#25303d!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.35)!important;outline:none!important;transition:background .18s ease,border-color .18s ease!important;cursor:pointer!important}.slx-target-option input:before{content:''!important;position:absolute!important;top:2px!important;left:2px!important;width:16px!important;height:16px!important;border-radius:50%!important;background:#b9c4d0!important;box-shadow:0 1px 2px rgba(0,0,0,.45)!important;transition:transform .18s ease,background .18s ease!important}.slx-target-option input:checked{background:#2563eb!important;border-color:#3b82f6!important}.slx-target-option input:checked:before{transform:translateX(18px)!important;background:#fff!important}.slx-target-option:has(input:checked){border-color:#334a62!important;background:#14202c!important;color:#eef4fb!important}.slx-target-option.safe-opt:has(input:checked){border-color:#315b43!important;color:#93e6ad!important}.slx-target-option.safe-opt input:checked{background:#198754!important;border-color:#2aa66a!important}.slx-target-option.risky-opt:has(input:checked){border-color:#625225!important;color:#f1d56b!important}.slx-target-option.risky-opt input:checked{background:#8a6f16!important;border-color:#b69428!important}.slx-targets-menu #slx-targets-clear{width:100%!important;margin-top:7px!important;min-height:30px!important;border:1px solid #344357!important;border-radius:8px!important;background:#1a2430!important;color:#aeb9c7!important;font-size:9px!important;font-weight:900!important}.slx-search #slx-q{flex:1 1 auto!important;min-width:0!important}"""
text,n=re.subn(pat,new,text,count=1)
if n!=1: raise SystemExit('TARGETS CSS block not found')
p.write_text(text,encoding='utf-8')

rp=ROOT/'scripts.json'; reg=json.loads(rp.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='elimination-assistant': item['version']='1.3.16'
rp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

hp=ROOT/'SakaLuX-Script-Hub.user.js'; hub=hp.read_text(encoding='utf-8')
hub,n=re.subn(r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,650}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>1.3.16\2',hub,count=1)
if n!=1: raise SystemExit('hub fallback version failed')
hp.write_text(hub,encoding='utf-8')

mp=ROOT/'greasyfork/Elimination-Assistant.md'; doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.3\.15(\*\*)',r'\g<1>1.3.16\2',doc,count=1)
if n!=1: raise SystemExit('elim doc version failed')
if '### v1.3.16' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.3.16 — Refined professional target switches\n\n- Reworked TARGETS toggles into compact 40×22 px switches with correctly centered knobs.\n- Removed heavy full-row active outlines and oversized glow styling.\n- SAFE and RISKY now use restrained color accents while the menu keeps a neutral professional look.\n',1)
mp.write_text(doc,encoding='utf-8')

sp=ROOT/'greasyfork/Script-Hub.md'; sdoc=sp.read_text(encoding='utf-8').replace('**v1.3.15**','**v1.3.16**')
sp.write_text(sdoc,encoding='utf-8')
print('Professional Elimination switches applied')
