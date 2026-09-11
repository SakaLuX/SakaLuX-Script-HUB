from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Elimination-Assistant.user.js'
text=p.read_text(encoding='utf-8')

# bump script version
text,n=re.subn(r'(^// @version\s+)1\.3\.12(\s*$)',r'\g<1>1.3.13\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION='1\.3\.12'", "const VERSION='1.3.13'", text, count=1)
if n!=1: raise SystemExit('runtime version not found')

# Replace filter select with checkbox chip group.
old=r'''<div class=\"slx-t slx-search\"><select id=\"slx-filter\"><option value=\"all\">All targets</option><option value=\"attackable\">Attackable only</option><option value=\"safe\">SAFE</option><option value=\"ok\">SAFE \+ RISKY</option><option value=\"new\">Not opened</option></select><input id=\"slx-q\" placeholder=\"Player / ID\"></div>'''
new='''<div class="slx-t slx-search"><div class="slx-filter-chips" id="slx-filters"><label class="slx-filter-chip"><input type="checkbox" data-filter="attackable"><span>ATTACKABLE</span></label><label class="slx-filter-chip safe-chip"><input type="checkbox" data-filter="safe"><span>SAFE</span></label><label class="slx-filter-chip risky-chip"><input type="checkbox" data-filter="risky"><span>RISKY</span></label><label class="slx-filter-chip skip-chip"><input type="checkbox" data-filter="skip"><span>SKIP</span></label><label class="slx-filter-chip"><input type="checkbox" data-filter="unopened"><span>UNOPENED</span></label></div><input id="slx-q" placeholder="Player / ID"></div>'''
text,n=re.subn(old,new,text,count=1)
if n!=1: raise SystemExit('filter markup not found')

# Replace compact search CSS that assumed select width.
text=text.replace(".slx-search #slx-filter{width:125px!important;flex:0 0 125px!important}.slx-search #slx-q{flex:1!important;min-width:0!important}", ".slx-search{align-items:flex-start!important;flex-wrap:wrap!important}.slx-filter-chips{display:flex!important;flex-wrap:wrap!important;gap:5px!important;flex:1 1 100%!important}.slx-filter-chip{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:5px 7px!important;border:1px solid #475569!important;border-radius:999px!important;background:#18212c!important;color:#cbd5e1!important;font-size:9px!important;font-weight:900!important;cursor:pointer!important;user-select:none!important}.slx-filter-chip input{appearance:none!important;-webkit-appearance:none!important;width:12px!important;height:12px!important;min-width:12px!important;margin:0!important;border:1px solid #64748b!important;border-radius:3px!important;background:#0f1720!important}.slx-filter-chip input:checked{background:#2563eb!important;border-color:#60a5fa!important;box-shadow:inset 0 0 0 2px #0f1720!important}.slx-filter-chip:has(input:checked){border-color:#4f8fe8!important;background:#17304e!important;color:#fff!important}.slx-filter-chip.safe-chip:has(input:checked){border-color:#22c55e!important;background:#12351f!important;color:#86efac!important}.slx-filter-chip.risky-chip:has(input:checked){border-color:#eab308!important;background:#3a310e!important;color:#fde047!important}.slx-filter-chip.skip-chip:has(input:checked){border-color:#ef4444!important;background:#3a171b!important;color:#fda4af!important}.slx-search #slx-q{flex:1 1 100%!important;min-width:0!important}")

# Replace apply() with multi-filter logic.
pat=r"function apply\(\)\{const q=\(\$\('#slx-q'\)\?\.value\|\|''\)\.toLowerCase\(\),f=\$\('#slx-filter'\)\?\.value\|\|'all';let a=state\.players\.filter\(p=>!q\|\|p\.name\.toLowerCase\(\)\.includes\(q\)\|\|String\(p\.id\)\.includes\(q\)\);a=a\.filter\(p=>\{const r=risk\(p\);if\(f==='attackable'\)return attackable\(p\);if\(f==='safe'\)return!unavailable\(p\)&&r\.label==='SAFE';if\(f==='ok'\)return!unavailable\(p\)&&r\.label!=='SKIP';if\(f==='new'\)return!state\.history\.some\(h=>Number\(h\.id\)===p\.id\);return true\}\);a\.sort\(\(x,y\)=>smart\(y\)-smart\(x\)\);state\.view=a;render\(\)\}"
rep="""function apply(){const q=($('#slx-q')?.value||'').toLowerCase();const filters=new Set($$('#slx-filters input[data-filter]:checked').map(x=>x.dataset.filter));let a=state.players.filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));a=a.filter(p=>{const r=risk(p);if(filters.has('attackable')&&!attackable(p))return false;if(filters.has('unopened')&&state.history.some(h=>Number(h.id)===p.id))return false;const riskFilters=['safe','risky','skip'].filter(x=>filters.has(x));if(riskFilters.length){const key=String(r.label||'').toLowerCase();if(!riskFilters.includes(key))return false}return true});a.sort((x,y)=>smart(y)-smart(x));state.view=a;render()}"""
text,n=re.subn(pat,rep,text,count=1)
if n!=1: raise SystemExit('apply() not found')

# Replace old select change binding with checkbox binding.
text=text.replace("$('#slx-filter',p).onchange=apply;", "$$('#slx-filters input[data-filter]',p).forEach(x=>x.onchange=apply);")
if "$$('#slx-filters input[data-filter]',p).forEach(x=>x.onchange=apply);" not in text:
    raise SystemExit('filter event replacement failed')

p.write_text(text,encoding='utf-8')

# scripts.json
rp=ROOT/'scripts.json'; reg=json.loads(rp.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='elimination-assistant': item['version']='1.3.13'
rp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub fallback version
hp=ROOT/'SakaLuX-Script-Hub.user.js'; hub=hp.read_text(encoding='utf-8')
hub,n=re.subn(r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,650}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>1.3.13\2',hub,count=1)
if n!=1: raise SystemExit('hub fallback version failed')
hp.write_text(hub,encoding='utf-8')

# docs
mp=ROOT/'greasyfork/Elimination-Assistant.md'; doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.3\.12(\*\*)',r'\g<1>1.3.13\2',doc,count=1)
if n!=1: raise SystemExit('elim doc version failed')
if '### v1.3.13' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.3.13 — Multi-filter targets\n\n- Replaced the single **All targets** dropdown with combinable checkbox filters: **ATTACKABLE**, **SAFE**, **RISKY**, **SKIP** and **UNOPENED**.\n- No selected filters means all targets are shown.\n- SAFE / RISKY / SKIP combine as OR filters; ATTACKABLE and UNOPENED narrow the result further.\n- **UNOPENED** means the target has not yet been opened through the assistant\'s ATK button on this device.\n',1)
mp.write_text(doc,encoding='utf-8')

sp=ROOT/'greasyfork/Script-Hub.md'; sdoc=sp.read_text(encoding='utf-8').replace('**v1.3.12**','**v1.3.13**')
sp.write_text(sdoc,encoding='utf-8')
print('Elimination multi-filter migration applied')
