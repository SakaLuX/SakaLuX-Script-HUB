from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHAT = ROOT / 'SakaLuX-Chat-Intelligence.user.js'
DOC = ROOT / 'greasyfork' / 'Chat-Intelligence.md'

text = CHAT.read_text(encoding='utf-8')
original = text

# Version surfaces.
text, n = re.subn(r'(?m)^(//\s*@version\s+)\S+', r'\g<1>1.2.23', text, count=1)
assert n == 1, 'header version not found'
text, n = re.subn(r"const V='[^']+',ID='chat-intelligence'", "const V='1.2.23',ID='chat-intelligence'", text, count=1)
assert n == 1, 'runtime version not found'

# Restore the Search switch plus management actions in Settings.
old = "const a=[['enabled','Module enabled'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete'],['exportSearch','Export search']];o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button>×</button></header><main>'+a.map(([k,l])=>'<label>'+l+'<input type=\"checkbox\" data-k=\"'+k+'\" '+(S[k]?'checked':'')+'></label>').join('')+'</main></section>';document.body.appendChild(o);o.querySelector('header button').onclick=()=>o.remove();o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{S[x.dataset.k]=x.checked;save();if(x.dataset.k==='enabled')enable(x.checked);else scan()})"
new = "const a=[['enabled','Module enabled'],['search','Search'],['quickActions','Context actions'],['notifications','Notifications'],['notifyPM','Notify PM'],['notifyFaction','Notify Faction'],['notifyCompany','Notify Company'],['mentionAutocomplete','@mention autocomplete'],['exportSearch','Export search']];o.innerHTML='<section><header><b>💬 Chat Intelligence v'+V+'</b><button>×</button></header><main>'+a.map(([k,l])=>'<label>'+l+'<input type=\"checkbox\" data-k=\"'+k+'\" '+(S[k]?'checked':'')+'></label>').join('')+'<div class=\"slx-settings-actions\"><button type=\"button\" data-clear-mute>Clear mute list</button><button type=\"button\" data-clear-people>Clear aliases/favorites</button></div></main><footer>SakaLuX [2380374]</footer></section>';document.body.appendChild(o);o.querySelector('header button').onclick=()=>o.remove();o.querySelectorAll('[data-k]').forEach(x=>x.onchange=()=>{S[x.dataset.k]=x.checked;save();if(x.dataset.k==='enabled')enable(x.checked);else scan()});o.querySelector('[data-clear-mute]').onclick=()=>{M.clear();saveP()};o.querySelector('[data-clear-people]').onclick=()=>{P={};F.clear();saveP()}"
if old not in text:
    raise SystemExit('settings block marker not found')
text = text.replace(old, new, 1)

# Restore alias + optional custom color.
old = "if(a==='alias'){const d=pd(p),al=prompt('Alias',d.alias||'');if(al!==null){P[k]={...d,alias:N(al)};saveP()}hideMenu()}"
new = "if(a==='alias'){const d=pd(p),al=prompt('Alias for '+(p.name||p.id),d.alias||'');if(al===null)return;const co=prompt('Optional color (#d7a94a). Blank = default.',d.color||'');if(co===null)return;P[k]={...d,alias:N(al),color:N(co)};saveP();hideMenu()}"
assert old in text, 'alias handler marker not found'
text = text.replace(old, new, 1)

# Surface alias/color state in the contextual action.
old = "MENU.querySelector('[data-a=\"mute\"]').textContent=M.has(k)?'🔈':'🔇';MENU.classList.add('show');"
new = "MENU.querySelector('[data-a=\"mute\"]').textContent=M.has(k)?'🔈':'🔇';const ab=MENU.querySelector('[data-a=\"alias\"]'),d=pd(p);if(ab)ab.title=(d.alias?'Alias: '+d.alias:'Alias / color')+(d.color?' • '+d.color:'');MENU.classList.add('show');"
assert old in text, 'menu state marker not found'
text = text.replace(old, new, 1)

# Restore favorite-first mention suggestions and player IDs.
old = "const a=[...map.values()].filter(p=>!q||p.name.toLowerCase().includes(q)||dn(p).toLowerCase().includes(q)).slice(0,6);b.innerHTML='';a.forEach(p=>{const z=document.createElement('button');z.textContent=dn(p);"
new = "const a=[...map.values()].filter(p=>!q||p.name.toLowerCase().includes(q)||dn(p).toLowerCase().includes(q)).sort((x,y)=>Number(F.has(pk(y)))-Number(F.has(pk(x)))||dn(x).localeCompare(dn(y))).slice(0,7);b.innerHTML='';a.forEach(p=>{const z=document.createElement('button');z.innerHTML='<strong>'+dn(p).replace(/[<>]/g,'')+'</strong>'+(p.id?'<small>#'+p.id+'</small>':'');"
assert old in text, 'mentions marker not found'
text = text.replace(old, new, 1)

# Make header detection stricter: do not award matches just because unrelated UI says Touching Grass/Faction/Trade.
text = text.replace("if(/touching grass|faction|company|chat|trade|global/i.test(t))s+=30;", "if(/^(?:faction|company|global|trade|new players|chat)(?:\\s|$)/i.test(t))s+=30;", 1)

# Compact, adaptive native-header controls. This keeps native minimize/close untouched and avoids oversized blocks on TornPDA.
old_css = ".slx-head-controls{position:absolute!important;right:52px!important;top:0!important;bottom:0!important;height:auto!important;display:flex!important;align-items:stretch!important;z-index:20!important;pointer-events:auto!important;margin:0!important;padding:0!important}.slx-head-controls button{all:unset!important;box-sizing:border-box!important;width:32px!important;min-width:32px!important;height:100%!important;display:grid!important;place-items:center!important;font-size:15px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border-left:1px solid rgba(255,255,255,.08)!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.slx-head-controls button:active{background:rgba(255,255,255,.12)!important}.slx-head-controls button[hidden]{display:none!important}"
new_css = ".slx-head-controls{position:absolute!important;right:48px!important;top:50%!important;transform:translateY(-50%)!important;height:30px!important;display:flex!important;align-items:center!important;gap:2px!important;z-index:20!important;pointer-events:auto!important;margin:0!important;padding:0 2px!important;max-width:96px!important;background:rgba(20,24,29,.72)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important}.slx-head-controls button{all:unset!important;box-sizing:border-box!important;width:28px!important;min-width:28px!important;height:28px!important;display:grid!important;place-items:center!important;font-size:14px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border-radius:6px!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.slx-head-controls button:active{background:rgba(255,255,255,.14)!important}.slx-head-controls button[hidden]{display:none!important}"
if old_css not in text:
    raise SystemExit('header controls CSS marker not found')
text = text.replace(old_css, new_css, 1)

# Settings action/footer styling and richer mention rows.
needle = ".slx-mentions button{display:block!important;width:100%!important;padding:6px!important;border:0!important;background:transparent!important;color:#eee!important;text-align:left!important}"
replacement = ".slx-mentions button{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important;padding:7px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.06)!important;background:transparent!important;color:#eee!important;text-align:left!important}.slx-mentions small{color:#8fa3ba!important;font-size:10px!important}.slx-settings-actions{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-top:8px!important}.slx-settings-actions button{flex:1 1 145px!important;min-height:34px!important;padding:7px 9px!important;background:#1a2634!important;color:#fff!important;border:1px solid #3a4c62!important;border-radius:8px!important}#sakalux-chat-settings-overlay footer{text-align:center!important;padding:8px!important;color:#8fa3ba!important}"
assert needle in text, 'mentions CSS marker not found'
text = text.replace(needle, replacement, 1)

# Ensure the Search control honors its switch even though header controls are always mounted.
old = "x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button>';"
new = "x.innerHTML='<button data-s title=\"Search\">🔎</button><button data-m title=\"Maximize\">⛶</button><button data-e title=\"Export\">⇩</button>';"
assert old in text, 'controls markup marker not found'
# Keep markup, update visibility immediately after mount/update.
vis_old = "x.querySelector('[data-e]').hidden=!S.exportSearch;const mb=x.querySelector('[data-m]');"
vis_new = "x.querySelector('[data-s]').hidden=!S.search;x.querySelector('[data-e]').hidden=!S.exportSearch;const mb=x.querySelector('[data-m]');"
assert vis_old in text, 'controls visibility marker not found'
text = text.replace(vis_old, vis_new, 1)

if text == original:
    raise SystemExit('no changes produced')
CHAT.write_text(text, encoding='utf-8')

# Synchronize release documentation.
doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.23**', doc, count=1)
doc = re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-29**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.23**', doc, count=1)
current_note = "**v1.2.23 — Restore complete chat controls and TornPDA header layout**\n- Restores the Search switch, mute/alias/favorite maintenance actions, alias colors and richer @mention suggestions.\n- Keeps favorites first in @mention autocomplete and shows player IDs.\n- Tightens native Chat V3 header detection and uses compact adaptive Search / Maximize / Export controls without touching Torn native minimize/close buttons.\n- Synchronizes runtime and metadata versions."
doc = re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)', lambda m: m.group(1)+current_note+m.group(2), doc, count=1)
history = "\n### v1.2.23 — Restore complete chat controls and TornPDA header layout\n- Restored the Search settings switch and Clear mute / Clear aliases-favorites actions.\n- Restored alias custom colors and contextual alias/color state.\n- Restored favorite-first @mention suggestions with player IDs.\n- Reworked Chat V3 header detection and compact mobile controls to avoid collisions with unrelated chat widgets.\n- Synchronized runtime/header version surfaces to v1.2.23.\n"
marker = '## Release history / Changelog\n'
if history.strip() not in doc:
    doc = doc.replace(marker, marker + history, 1)
DOC.write_text(doc, encoding='utf-8')

print('Updated Chat Intelligence to v1.2.23')
