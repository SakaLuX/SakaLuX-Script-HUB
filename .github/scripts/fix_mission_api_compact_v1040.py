from pathlib import Path
import json, re

ROOT=Path('.')
mission_path=ROOT/'SakaLuX-Mission-Rewards.user.js'
doc_path=ROOT/'greasyfork'/'Mission-Rewards.md'
reg_path=ROOT/'scripts.json'
backup=ROOT/'backups'/'mission-api-compact-v1.0.40-2026-09-18'
backup.mkdir(parents=True, exist_ok=True)

mission=mission_path.read_text(encoding='utf-8')
doc=doc_path.read_text(encoding='utf-8')
reg_raw=reg_path.read_text(encoding='utf-8')
(backup/'SakaLuX-Mission-Rewards-v1.0.39.user.js').write_text(mission,encoding='utf-8')
(backup/'Mission-Rewards.md').write_text(doc,encoding='utf-8')
(backup/'scripts.json').write_text(reg_raw,encoding='utf-8')

# Version sync.
mission=mission.replace('1.0.39','1.0.40')

# Remove the extra visual gap after the permissions heading. The heading is already display:block.
old='<div class="sl-mr-api-required"><b>Exact permissions required</b><br>User: Ammo<br>Torn: Items<br>No write permission is requested.</div>'
new='<div class="sl-mr-api-required"><b>Exact permissions required</b>User: Ammo<br>Torn: Items<br>No write permission is requested.</div>'
if old not in mission:
    raise SystemExit('Mission permissions markup not found')
mission=mission.replace(old,new,1)

# Match Enhancer's more compact API control sizing.
mission=mission.replace('min-height:44px!important;height:44px!important','min-height:38px!important;height:38px!important')
mission=mission.replace('height:44px!important;min-height:44px!important','height:40px!important;min-height:40px!important')
mission=mission.replace('font-size:11px!important;line-height:1.1!important;box-sizing:border-box!important','font-size:10px!important;line-height:1.1!important;box-sizing:border-box!important')
mission=mission.replace('padding:12px 14px!important;border:1px solid #7d6920!important','padding:10px 14px!important;border:1px solid #7d6920!important')
mission=mission.replace('margin-bottom:2px!important;color:#f2dc72!important','margin-bottom:0!important;color:#f2dc72!important')

marker='/* SAKALUX_MISSION_API_COMPACT_V1040 */'
if marker not in mission:
    mission += r'''

/* SAKALUX_MISSION_API_COMPACT_V1040 */
(()=>{
 const st=document.createElement('style');st.id='sakalux-mission-api-compact-v1040';st.textContent=`
#sl-mr-api-sheet .sl-mr-api-required b{margin-bottom:0!important}
#sl-mr-api-sheet .sl-mr-api-primary,#sl-mr-api-sheet .sl-mr-api-danger{height:38px!important;min-height:38px!important;font-size:10px!important}
#sl-mr-api-sheet input#sl-mr-api-local{height:40px!important;min-height:40px!important}
#sl-mr-api-sheet .sl-mr-api-actions{gap:8px!important}
`;(document.head||document.documentElement).appendChild(st);
})();
'''

mission_path.write_text(mission,encoding='utf-8')

# Registry sync.
reg=json.loads(reg_raw)
entry=next((x for x in reg.get('scripts',[]) if x.get('id')=='mission-rewards'),None)
if not entry: raise SystemExit('mission-rewards missing from scripts.json')
entry['version']='1.0.40'
entry['release']={
  'date':'2026-09-18',
  'version':'1.0.40',
  'notes':[
    'Matches Mission API buttons more closely to the compact Enhancer sizing.',
    'Removes the extra blank spacing between Exact permissions required and User: Ammo.'
  ]
}
reg_path.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Documentation sync.
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*', '## Current version\n**v1.0.40**', doc, count=1)
current_note='''## Current release note\n\n**v1.0.40 — Compact API controls**\n- Reduces Mission API Access button height/font sizing to match Enhancer more closely.\n- Removes the extra blank gap between `Exact permissions required` and `User: Ammo`.\n'''
doc=re.sub(r'## Current release note\n.*?\n## Recommended', current_note+'\n## Recommended', doc, count=1, flags=re.S)
ch='''\n### v1.0.40 — Compact API controls\n- Makes the dedicated API buttons smaller to match Enhancer.\n- Removes the extra permissions-card spacing before `User: Ammo`.\n'''
idx=doc.find('## Release history / Changelog')
if idx>=0 and '### v1.0.40' not in doc:
    pos=doc.find('\n',idx)+1
    doc=doc[:pos]+ch+doc[pos:]
doc_path.write_text(doc,encoding='utf-8')

print('Mission v1.0.40 compact API patch complete')
