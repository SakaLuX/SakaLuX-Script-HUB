from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Elimination-Assistant.user.js'
text=p.read_text(encoding='utf-8')

# Version bump
text,n=re.subn(r'(^// @version\s+)1\.3\.13(\s*$)',r'\g<1>1.3.14\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION='1\.3\.13'", "const VERSION='1.3.14'", text, count=1)
if n!=1: raise SystemExit('runtime version not found')

# Replace expanded chip row with compact TARGETS button + search field.
old='''<div class="slx-t slx-search"><div class="slx-filter-chips" id="slx-filters"><label class="slx-filter-chip"><input type="checkbox" data-filter="attackable"><span>ATTACKABLE</span></label><label class="slx-filter-chip safe-chip"><input type="checkbox" data-filter="safe"><span>SAFE</span></label><label class="slx-filter-chip risky-chip"><input type="checkbox" data-filter="risky"><span>RISKY</span></label><label class="slx-filter-chip skip-chip"><input type="checkbox" data-filter="skip"><span>SKIP</span></label><label class="slx-filter-chip"><input type="checkbox" data-filter="unopened"><span>UNOPENED</span></label></div><input id="slx-q" placeholder="Player / ID"></div>'''
new='''<div class="slx-t slx-search"><div class="slx-target-wrap"><button id="slx-targets-btn" type="button">TARGETS <span id="slx-targets-count"></span>⌄</button><div id="slx-targets-menu" class="slx-targets-menu"><div class="slx-targets-title">Target filters</div><label class="slx-target-option"><input type="checkbox" data-filter="attackable"><span>ATTACKABLE</span></label><label class="slx-target-option safe-opt"><input type="checkbox" data-filter="safe"><span>SAFE</span></label><label class="slx-target-option risky-opt"><input type="checkbox" data-filter="risky"><span>RISKY</span></label><label class="slx-target-option"><input type="checkbox" data-filter="unopened"><span>UNOPENED</span></label><button type="button" id="slx-targets-clear">CLEAR</button></div></div><input id="slx-q" placeholder="Player / ID"></div>'''
if old not in text: raise SystemExit('current filter markup not found')
text=text.replace(old,new,1)

# Replace compact filter CSS block from v1.3.13 with popup styling.
old_css=".slx-search{align-items:flex-start!important;flex-wrap:wrap!important}.slx-filter-chips{display:flex!important;flex-wrap:wrap!important;gap:5px!important;flex:1 1 100%!important}.slx-filter-chip{display:inline-flex!important;align-items:center!important;gap:4px!important;padding:5px 7px!important;border:1px solid #475569!important;border-radius:999px!important;background:#18212c!important;color:#cbd5e1!important;font-size:9px!important;font-weight:900!important;cursor:pointer!important;user-select:none!important}.slx-filter-chip input{appearance:none!important;-webkit-appearance:none!important;width:12px!important;height:12px!important;min-width:12px!important;margin:0!important;border:1px solid #64748b!important;border-radius:3px!important;background:#0f1720!important}.slx-filter-chip input:checked{background:#2563eb!important;border-color:#60a5fa!important;box-shadow:inset 0 0 0 2px #0f1720!important}.slx-filter-chip:has(input:checked){border-color:#4f8fe8!important;background:#17304e!important;color:#fff!important}.slx-filter-chip.safe-chip:has(input:checked){border-color:#22c55e!important;background:#12351f!important;color:#86efac!important}.slx-filter-chip.risky-chip:has(input:checked){border-color:#eab308!important;background:#3a310e!important;color:#fde047!important}.slx-filter-chip.skip-chip:has(input:checked){border-color:#ef4444!important;background:#3a171b!important;color:#fda4af!important}.slx-search #slx-q{flex:1 1 100%!important;min-width:0!important}"
new_css=".slx-search{align-items:center!important;flex-wrap:nowrap!important;position:relative!important}.slx-target-wrap{position:relative!important;flex:0 0 auto!important}.slx-search #slx-targets-btn{min-width:118px!important;min-height:34px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;font-weight:900!important}.slx-search #slx-targets-count{display:none!important;min-width:17px!important;height:17px!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;background:#2563eb!important;color:#fff!important;font-size:9px!important}.slx-search #slx-targets-count.on{display:inline-flex!important}.slx-targets-menu{display:none!important;position:absolute!important;left:0!important;top:calc(100% + 6px)!important;z-index:50!important;width:210px!important;padding:8px!important;border:1px solid #3a4b61!important;border-radius:12px!important;background:linear-gradient(155deg,#18212d,#101720)!important;box-shadow:0 14px 36px rgba(0,0,0,.55)!important}.slx-targets-menu.open{display:block!important}.slx-targets-title{padding:4px 5px 8px!important;color:#9fb0c5!important;font-size:10px!important;font-weight:900!important;text-transform:uppercase!important}.slx-target-option{display:flex!important;align-items:center!important;gap:8px!important;padding:8px 7px!important;margin:3px 0!important;border:1px solid #2d3c4e!important;border-radius:9px!important;background:#131b25!important;color:#dce6f0!important;font-size:10px!important;font-weight:900!important;cursor:pointer!important}.slx-target-option input{appearance:none!important;-webkit-appearance:none!important;width:16px!important;height:16px!important;min-width:16px!important;margin:0!important;border:1px solid #607089!important;border-radius:4px!important;background:#0d141d!important}.slx-target-option input:checked{background:#2563eb!important;border-color:#60a5fa!important;box-shadow:inset 0 0 0 3px #0d141d!important}.slx-target-option.safe-opt:has(input:checked){border-color:#22c55e!important;color:#86efac!important}.slx-target-option.risky-opt:has(input:checked){border-color:#eab308!important;color:#fde047!important}.slx-targets-menu #slx-targets-clear{width:100%!important;margin-top:6px!important;min-height:30px!important;background:#202a37!important;border-color:#3a4a5d!important;color:#cbd5e1!important;font-size:9px!important}.slx-search #slx-q{flex:1 1 auto!important;min-width:0!important}"
if old_css not in text: raise SystemExit('current chip css not found')
text=text.replace(old_css,new_css,1)

# Filter logic: remove skip from selectable risk filters; add count update.
old_apply="function apply(){const q=($('#slx-q')?.value||'').toLowerCase();const filters=new Set($$('#slx-filters input[data-filter]:checked').map(x=>x.dataset.filter));let a=state.players.filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));a=a.filter(p=>{const r=risk(p);if(filters.has('attackable')&&!attackable(p))return false;if(filters.has('unopened')&&state.history.some(h=>Number(h.id)===p.id))return false;const riskFilters=['safe','risky','skip'].filter(x=>filters.has(x));if(riskFilters.length){const key=String(r.label||'').toLowerCase();if(!riskFilters.includes(key))return false}return true});a.sort((x,y)=>smart(y)-smart(x));state.view=a;render()}"
new_apply="function updateTargetFilterCount(){const n=$$('#slx-targets-menu input[data-filter]:checked').length,c=$('#slx-targets-count');if(c){c.textContent=n?String(n):'';c.classList.toggle('on',n>0)}}\nfunction apply(){const q=($('#slx-q')?.value||'').toLowerCase();const filters=new Set($$('#slx-targets-menu input[data-filter]:checked').map(x=>x.dataset.filter));let a=state.players.filter(p=>!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));a=a.filter(p=>{const r=risk(p);if(filters.has('attackable')&&!attackable(p))return false;if(filters.has('unopened')&&state.history.some(h=>Number(h.id)===p.id))return false;const riskFilters=['safe','risky'].filter(x=>filters.has(x));if(riskFilters.length){const key=String(r.label||'').toLowerCase();if(!riskFilters.includes(key))return false}return true});a.sort((x,y)=>smart(y)-smart(x));state.view=a;updateTargetFilterCount();render()}"
if old_apply not in text: raise SystemExit('current apply function not found')
text=text.replace(old_apply,new_apply,1)

# Replace checkbox binding and add popup open/close/clear behavior.
old_bind="$$('#slx-filters input[data-filter]',p).forEach(x=>x.onchange=apply);"
new_bind="$$('#slx-targets-menu input[data-filter]',p).forEach(x=>x.onchange=apply);$('#slx-targets-btn',p).onclick=e=>{e.stopPropagation();$('#slx-targets-menu',p).classList.toggle('open')};$('#slx-targets-menu',p).onclick=e=>e.stopPropagation();$('#slx-targets-clear',p).onclick=()=>{$$('#slx-targets-menu input[data-filter]',p).forEach(x=>x.checked=false);apply()};document.addEventListener('click',()=>$('#slx-targets-menu',p)?.classList.remove('open'));"
if old_bind not in text: raise SystemExit('current filter binding not found')
text=text.replace(old_bind,new_bind,1)

p.write_text(text,encoding='utf-8')

# Registry
rp=ROOT/'scripts.json';reg=json.loads(rp.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id')=='elimination-assistant': item['version']='1.3.14'
rp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub fallback
hp=ROOT/'SakaLuX-Script-Hub.user.js';hub=hp.read_text(encoding='utf-8')
hub,n=re.subn(r"(id:\s*['\"]elimination-assistant['\"][\s\S]{0,650}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>1.3.14\2',hub,count=1)
if n!=1: raise SystemExit('hub fallback version failed')
hp.write_text(hub,encoding='utf-8')

# Docs
mp=ROOT/'greasyfork/Elimination-Assistant.md';doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.3\.13(\*\*)',r'\g<1>1.3.14\2',doc,count=1)
if n!=1: raise SystemExit('elim doc version failed')
if '### v1.3.14' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.3.14 — Compact TARGETS menu\n\n- Replaced the wide inline filter chips with one compact **TARGETS** button beside the player search field.\n- TARGETS opens a dropdown panel with **ATTACKABLE**, **SAFE**, **RISKY** and **UNOPENED** checkboxes.\n- Multiple filters can be combined; a badge on TARGETS shows how many are active.\n- Added **CLEAR** to reset all target filters.\n- Removed **SKIP** from the selectable target menu because it represents targets to avoid rather than preferred targets.\n',1)
mp.write_text(doc,encoding='utf-8')

sp=ROOT/'greasyfork/Script-Hub.md';sdoc=sp.read_text(encoding='utf-8').replace('**v1.3.13**','**v1.3.14**')
sp.write_text(sdoc,encoding='utf-8')
print('Elimination TARGETS popup migration applied')
