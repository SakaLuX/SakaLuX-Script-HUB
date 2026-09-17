from pathlib import Path
import json, re

ROOT=Path('.')
mission_path=ROOT/'SakaLuX-Mission-Rewards.user.js'
doc_path=ROOT/'greasyfork'/'Mission-Rewards.md'
reg_path=ROOT/'scripts.json'
backup=ROOT/'backups'/'mission-api-enhancer-parity-v1.0.39-2026-09-18'
backup.mkdir(parents=True, exist_ok=True)

mission=mission_path.read_text(encoding='utf-8')
doc=doc_path.read_text(encoding='utf-8')
reg_raw=reg_path.read_text(encoding='utf-8')
(backup/'SakaLuX-Mission-Rewards-v1.0.38.user.js').write_text(mission,encoding='utf-8')
(backup/'Mission-Rewards.md').write_text(doc,encoding='utf-8')
(backup/'scripts.json').write_text(reg_raw,encoding='utf-8')

# Version sync.
mission=mission.replace('1.0.38','1.0.39')

# Remove the duplicate inline API status/key input from the normal Mission settings page.
lines=[]
removed=False
for line in mission.splitlines(True):
    if 'API: <b>${getApiKey()' in line and 'sl-mr-api-key' in line:
        removed=True
        continue
    lines.append(line)
mission=''.join(lines)
if not removed:
    raise SystemExit('Inline Mission API Missing/key block was not found')

# Replace only the dedicated Mission API sheet markup, retaining the current working handlers/IDs.
start_marker="        sheet.innerHTML=`<div class=\"sl-mr-settings-head\""
start=mission.find(start_marker)
if start < 0:
    raise SystemExit('Mission API sheet markup start not found')
end=mission.find("</div>`;", start)
if end < 0:
    raise SystemExit('Mission API sheet markup end not found')
end += len("</div>`;")
new_markup=r'''        sheet.innerHTML=`
        <div class="sl-mr-api-head">
          <div class="sl-mr-api-heading"><div class="sl-mr-api-title">🔑 Mission Rewards API Access</div><div class="sl-mr-api-sub">SakaLuX Mission Rewards v${VERSION}</div></div>
          <button type="button" class="sl-mr-api-close" id="sl-mr-api-close">×</button>
        </div>
        <div class="sl-mr-api-body">
          <div class="sl-mr-api-required"><b>Exact permissions required</b><br>User: Ammo<br>Torn: Items<br>No write permission is requested.</div>
          <button type="button" class="sl-mr-api-primary sl-mr-api-create" id="sl-mr-api-create">🔑 CREATE MISSION API KEY</button>
          <div class="sl-mr-api-card">
            <div class="sl-mr-api-status"><b>API ACCESS</b><span id="sl-mr-api-result" role="status" aria-live="polite">Not checked yet</span></div>
            <div class="sl-mr-api-source" id="sl-mr-api-source"></div>
            <label for="sl-mr-api-local">Replace / paste Torn API key</label>
            <input id="sl-mr-api-local" type="password" autocomplete="off" placeholder="Paste newly created key here" value="${escapeHtml(local)}">
            <div class="sl-mr-api-actions"><button type="button" class="sl-mr-api-primary" id="sl-mr-api-save">SAVE NEW API KEY</button><button type="button" class="sl-mr-api-primary" id="sl-mr-api-check">CHECK API ACCESS</button></div>
            <button type="button" class="sl-mr-api-danger" id="sl-mr-api-clear">CLEAR LOCAL KEY</button>
            <div class="sl-mr-api-note">The Hub general key is used first when available. This local key remains the standalone fallback. TornPDA's injected key is never overwritten.</div>
          </div>
        </div>`;'''
mission=mission[:start]+new_markup+mission[end:]

# Add an Enhancer-parity visual contract for the dedicated Mission API sheet.
marker='/* SAKALUX_MISSION_API_ENHANCER_PARITY_V1039 */'
if marker not in mission:
    mission += r'''

/* SAKALUX_MISSION_API_ENHANCER_PARITY_V1039 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-mission-api-enhancer-parity-v1039';st.textContent=`
#sl-mr-api-sheet#sl-mr-api-sheet{position:absolute!important;inset:0!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;min-height:0!important;max-height:100%!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important;border:0!important;border-radius:0!important;background:#0b151f!important;color:#edf3fa!important;box-shadow:none!important}
#sl-mr-api-sheet .sl-mr-api-head{display:flex!important;align-items:center!important;gap:10px!important;flex:0 0 92px!important;min-height:92px!important;padding:18px 26px 14px!important;box-sizing:border-box!important;background:linear-gradient(155deg,#142235 0%,#0f1a28 72%)!important;border-bottom:1px solid rgba(255,255,255,.08)!important}
#sl-mr-api-sheet .sl-mr-api-heading{min-width:0!important;flex:1 1 auto!important}
#sl-mr-api-sheet .sl-mr-api-title{font-size:17px!important;font-weight:900!important;line-height:1.15!important;color:#f4f7fb!important}
#sl-mr-api-sheet .sl-mr-api-sub{margin-top:4px!important;font-size:10px!important;font-weight:500!important;color:#8f9cad!important}
#sl-mr-api-sheet .sl-mr-api-close{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;padding:0!important;border-radius:12px!important;border:1px solid #34465b!important;background:#172331!important;color:#e6edf5!important;font-size:22px!important;font-weight:700!important;display:grid!important;place-items:center!important}
#sl-mr-api-sheet .sl-mr-api-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:12px 16px 24px!important;display:flex!important;flex-direction:column!important;gap:12px!important;box-sizing:border-box!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#sl-mr-api-sheet .sl-mr-api-required{padding:12px 14px!important;border:1px solid #7d6920!important;border-radius:10px!important;background:#211c08!important;color:#d8bc55!important;font-size:11px!important;line-height:1.5!important}
#sl-mr-api-sheet .sl-mr-api-required b{display:block!important;margin-bottom:2px!important;color:#f2dc72!important}
#sl-mr-api-sheet button{font-family:Inter,Arial,sans-serif!important;font-weight:900!important}
#sl-mr-api-sheet .sl-mr-api-primary,#sl-mr-api-sheet .sl-mr-api-danger{width:100%!important;min-height:44px!important;height:44px!important;margin:0!important;padding:0 10px!important;border-radius:10px!important;font-size:11px!important;line-height:1.1!important;box-sizing:border-box!important}
#sl-mr-api-sheet .sl-mr-api-create{background:linear-gradient(180deg,#3a84d8,#2866ad)!important;border:1px solid #4b8ed9!important;color:#fff!important}
#sl-mr-api-sheet .sl-mr-api-card{padding:10px!important;border:1px solid #2e4055!important;border-radius:11px!important;background:#121b25!important;display:flex!important;flex-direction:column!important;gap:8px!important;box-sizing:border-box!important}
#sl-mr-api-sheet .sl-mr-api-status{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;padding:8px!important;border-radius:8px!important;background:#151e29!important;font-size:10px!important;color:#e8eef5!important}
#sl-mr-api-sheet .sl-mr-api-status b{color:#d8bc55!important}
#sl-mr-api-sheet .sl-mr-api-status span{font-weight:500!important;color:#e8eef5!important;text-align:right!important}
#sl-mr-api-sheet .sl-mr-api-source{font-size:10px!important;color:#aab6c5!important;line-height:1.35!important}
#sl-mr-api-sheet label{display:block!important;margin:0!important;font-size:10px!important;color:#c5cfdb!important}
#sl-mr-api-sheet input#sl-mr-api-local{width:100%!important;height:44px!important;min-height:44px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;border:1px solid #3a4d63!important;border-radius:9px!important;background:#0d1622!important;color:#f4f7fb!important;font-size:11px!important}
#sl-mr-api-sheet .sl-mr-api-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0!important}
#sl-mr-api-sheet .sl-mr-api-actions .sl-mr-api-primary{min-width:0!important;background:linear-gradient(180deg,#3a84d8,#2866ad)!important;border:1px solid #4b8ed9!important;color:#fff!important}
#sl-mr-api-sheet .sl-mr-api-danger{background:linear-gradient(180deg,#8b394d,#6b293a)!important;border:1px solid #9f4a60!important;color:#ffe4ea!important}
#sl-mr-api-sheet .sl-mr-api-note{padding:8px!important;border-radius:8px!important;background:#151e29!important;color:#c5cfdb!important;font-size:9px!important;line-height:1.45!important}
@media(max-width:700px){
 #sl-mr-api-sheet .sl-mr-api-head{flex-basis:84px!important;min-height:84px!important;padding:14px 18px 12px!important}
 #sl-mr-api-sheet .sl-mr-api-title{font-size:16px!important}
 #sl-mr-api-sheet .sl-mr-api-body{padding:10px 14px 18px!important;gap:10px!important}
}
`;(document.head||document.documentElement).appendChild(st);
})();
'''

mission_path.write_text(mission,encoding='utf-8')

# Registry sync.
reg=json.loads(reg_raw)
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='mission-rewards'),None)
if not entry: raise SystemExit('mission-rewards missing from scripts.json')
entry['version']='1.0.39'
entry['release']={
  'date':'2026-09-18',
  'version':'1.0.39',
  'notes':[
    'Removes the duplicate inline API Missing/key input from Mission settings.',
    'Rebuilds dedicated Mission API Access to match Enhancer API Access layout and button geometry.',
    'Keeps Mission Items/Ammo read-only permissions and existing save/check/clear behavior.'
  ]
}
reg_path.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Documentation sync / clean current version and release note.
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*', '## Current version\n**v1.0.39**', doc, count=1)
current_note='''## Current release note\n\n**v1.0.39 — Enhancer-style API Access parity**\n- Removes the duplicate inline `API: Missing` status and API-key input from the normal Mission settings page.\n- Rebuilds the dedicated Mission API Access sheet to match Enhancer API Access: title/close header, exact-permissions card, full-width create button, API Access status card, two equal save/check buttons, full-width clear button and explanatory note.\n- Keeps Mission Rewards permissions read-only: `User: Ammo` and `Torn: Items`.\n'''
doc=re.sub(r'## Current release note\n.*?\n## Recommended', current_note+'\n## Recommended', doc, count=1, flags=re.S)
ch='''\n### v1.0.39 — Enhancer-style API Access parity\n- Removes the duplicate inline API status/key field above SAVE.\n- Makes the dedicated API Access panel visually match Enhancer Guard while preserving Mission-specific permissions and behavior.\n'''
idx=doc.find('## Release history / Changelog')
if idx>=0 and '### v1.0.39' not in doc:
    pos=doc.find('\n',idx)+1
    doc=doc[:pos]+ch+doc[pos:]
doc_path.write_text(doc,encoding='utf-8')

print('Mission v1.0.39 API Enhancer parity patch complete')
