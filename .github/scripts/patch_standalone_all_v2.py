from pathlib import Path
import json,re

modern={
 'SakaLuX-Enhancer-Guard.user.js':('1.3.32','1.3.33','enhancer','greasyfork/Enhancer-Guard.md'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.22','5.3.23','bazaar','greasyfork/Bazaar-Thanker.md'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.19','1.0.20','mission-rewards','greasyfork/Mission-Rewards.md'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.20','1.17.21','market-intelligence','greasyfork/Market-Intelligence.md'),
}
ORDER="const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant','company-intelligence'];"
old_sort="regs.sort((a,b)=>ORDER.indexOf(a.id)-ORDER.indexOf(b.id)); box.replaceChildren();"
new_sort="const rank=id=>{const i=ORDER.indexOf(id);return i<0?ORDER.length+100:i}; regs.sort((a,b)=>rank(a.id)-rank(b.id)||String(a.name||a.id).localeCompare(String(b.name||b.id))); box.replaceChildren();"

for fn,(oldv,newv,sid,mdpath) in modern.items():
 p=Path(fn); s=p.read_text(encoding='utf-8')
 if f'// @version      {oldv}' not in s: raise SystemExit(f'{fn}: header version missing')
 s=s.replace(f'// @version      {oldv}',f'// @version      {newv}',1)
 if f"version:'{oldv}'" not in s: raise SystemExit(f'{fn}: SELF version missing')
 s=s.replace(f"version:'{oldv}'",f"version:'{newv}'",1)
 s=re.sub(r"const ORDER=\[[^\n]+\];",ORDER,s,count=1)
 if old_sort not in s: raise SystemExit(f'{fn}: old sort missing')
 s=s.replace(old_sort,new_sort,1)
 p.write_text(s,encoding='utf-8')

 md=Path(mdpath); m=md.read_text(encoding='utf-8')
 # current version only
 m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v'+newv+'**',m,count=1)
 note=(f"**v{newv}** standardizes the shared Standalone menu ordering. Known modules now use one canonical order, and any unknown/new module is placed after known modules instead of jumping directly below the STANDALONE subtitle. This prevents Company Intelligence from appearing at the top when another add-on renders the dock.\n")
 marker='## Current release note\n'; st=m.find(marker)
 if st>=0:
  st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
  m=m[:st]+'\n'+note+m[en:]
 hist='## Release history\n'
 entry=f"### v{newv} — Shared Standalone ordering fix\n\n- Uses the canonical SakaLuX standalone order including Company Intelligence.\n- Unknown/new modules sort after known modules instead of before them.\n- Keeps the mobile dock layout and Install SakaLuX Hub button readable.\n\n"
 if hist in m and entry.split('\n')[0] not in m: m=m.replace(hist,hist+entry,1)
 md.write_text(m,encoding='utf-8')

# Company: keep it registered in Standalone but make its own compatibility normalizer stronger.
p=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js'); s=p.read_text(encoding='utf-8')
if '// @version      1.8.16' not in s: raise SystemExit('company header version missing')
s=s.replace('// @version      1.8.16','// @version      1.8.17',1)
s=s.replace("version:'1.8.16'","version:'1.8.17'",1)
old="""function normalizeStandaloneCompanyPlacement(){
 try{
  const box=document.querySelector('#sakalux-standalone-dock .slx-dock-items');
  if(!box) return;
  const rows=[...box.querySelectorAll('.slx-dock-row')];
  const company=rows.find(row=>String(row.querySelector('.slx-title')?.textContent||row.textContent||'').trim().toLowerCase()==='company');
  if(company&&company!==box.lastElementChild) box.appendChild(company);
 }catch{}
}
"""
new="""function normalizeStandaloneCompanyPlacement(){
 try{
  const dock=document.querySelector('#sakalux-standalone-dock');
  const box=dock?.querySelector('.slx-dock-items');
  if(!dock||!box) return;
  // Repair malformed/legacy docks that placed a module row outside the list.
  for(const row of [...dock.querySelectorAll(':scope > .slx-dock-row')]) box.appendChild(row);
  const rows=[...box.querySelectorAll(':scope > .slx-dock-row')];
  const company=rows.find(row=>String(row.querySelector('.slx-title')?.textContent||row.textContent||'').trim().toLowerCase()==='company');
  if(company&&company!==box.lastElementChild) box.appendChild(company);
 }catch{}
}
"""
if old not in s: raise SystemExit('company normalizer missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md'); m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.8.17**',m,count=1)
m=m.replace('synchronized at **v1.8.16**','synchronized at **v1.8.17**')
marker='## Current release note\n'; st=m.find(marker)
if st>=0:
 st+=len(marker); en=m.find('\n## ',st); en=len(m) if en<0 else en
 m=m[:st]+"\n**v1.8.17** hardens Company Intelligence placement in the shared Standalone dock. If an older dock renderer places Company outside the script list or directly below the STANDALONE subtitle, Company is moved back into the module list and kept after the other known add-ons.\n"+m[en:]
h='## Release history\n'; entry='### v1.8.17 — Standalone placement hardening\n\n- Repairs legacy/malformed dock placement for the Company row.\n- Keeps Company inside the module list, after the other known add-ons.\n- Preserves Hub integration and removes no standalone functionality.\n\n'
if h in m and '### v1.8.17 — Standalone placement hardening' not in m: m=m.replace(h,h+entry,1)
md.write_text(m,encoding='utf-8')

# Account Auditor is standalone-only and must not be able to win/overwrite the shared official dock IDs/styles.
p=Path('SakaLuX-Account-Auditor.user.js'); s=p.read_text(encoding='utf-8')
if '// @version      1.3.3' in s: s=s.replace('// @version      1.3.3','// @version      1.3.4',1)
s=s.replace("const DOCK_ID = 'sakalux-standalone-dock';","const DOCK_ID = 'sakalux-account-auditor-standalone-dock';",1)
s=s.replace("const PROMPT_ID = 'sakalux-hub-install-prompt';","const PROMPT_ID = 'sakalux-account-auditor-hub-install-prompt';",1)
s=s.replace("const STYLE_ID = 'sakalux-standalone-dock-style';","const STYLE_ID = 'sakalux-account-auditor-standalone-style';",1)
p.write_text(s,encoding='utf-8')
md=Path('greasyfork/Account-Auditor.md'); m=md.read_text(encoding='utf-8')
m=re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*',r'\1**v1.3.4**',m,count=1)
md.write_text(m,encoding='utf-8')

# Registry sync for official add-ons.
sp=Path('scripts.json'); data=json.loads(sp.read_text(encoding='utf-8'))
versions={'enhancer':'1.3.33','bazaar':'5.3.23','mission-rewards':'1.0.20','market-intelligence':'1.17.21','company-intelligence':'1.8.17'}
for x in data.get('scripts',[]):
 if x.get('id') in versions: x['version']=versions[x['id']]
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
