from pathlib import Path
import json,re

ROOT=Path(__file__).resolve().parents[2]
RT=ROOT/'src/core/sakalux-dock-runtime.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG.md'
RELEASE=ROOT/'releases'/'standalone-runtime-v1.1.3.md'

rt=RT.read_text(encoding='utf-8')
rt=rt.replace("const VERSION = '1.1.2';","const VERSION = '1.1.3';",1)

# Do NOT add an extra <li> into Torn's status-icons list. Mobile Torn uses child-order/visibility
# rules there, so injecting a list cell can hide native cooldown/refill/merit icons.
rt=rt.replace(
'#${IDS.native}{display:flex!important;align-items:center!important;justify-content:center!important}#${IDS.native} .slx-s-link{display:flex!important;align-items:center!important;justify-content:center!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;margin:0!important;border:0!important;border-radius:8px!important;background:transparent!important;box-shadow:none!important;font:900 14px/28px Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}',
'#${IDS.native}{position:absolute!important;z-index:50!important;display:flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;min-width:22px!important;min-height:22px!important;padding:0!important;margin:0!important;border:0!important;border-radius:50%!important;background:rgba(15,20,26,.92)!important;box-shadow:0 0 0 1px rgba(255,255,255,.09)!important;font:900 12px/22px Arial,sans-serif!important;color:#e9a84d!important;text-decoration:none!important;cursor:pointer!important;touch-action:manipulation!important}',
1)

# Remove native-cell class cloning; it was unsafe because Torn's responsive list styles can depend on li classes/order.
m=re.search(r"\n  function copyNativeCell\(item, list\) \{.*?\n  \}\n\n  function ensureLauncher",rt,re.S)
if not m:
    raise SystemExit('copyNativeCell block not found')
rt=rt[:m.start()]+"\n\n  function statusAnchorItem(list) {\n    const items=[...(list?.children||[])].filter(x=>x?.id!==IDS.native);\n    const hay=x=>[(x?.textContent||''),(x?.className||''),x?.getAttribute?.('title')||'',x?.getAttribute?.('aria-label')||'',x?.querySelector?.('a')?.getAttribute?.('title')||'',x?.querySelector?.('a')?.getAttribute?.('aria-label')||''].join(' ').toLowerCase();\n    return items.find(x=>/drug|xanax|booster|cooldown|medical|addiction/.test(hay(x))) || items[3] || items[items.length-1] || null;\n  }\n\n  function placeNativeLauncher(link,list){\n    try{\n      if(getComputedStyle(list).position==='static') list.style.position='relative';\n      const target=statusAnchorItem(list);\n      if(!target)return;\n      const left=Math.max(0,(target.offsetLeft||0)+(target.offsetWidth||28)-5);\n      const top=Math.max(0,(target.offsetTop||0)+Math.round(((target.offsetHeight||28)-22)/2));\n      link.style.left=left+'px';link.style.top=top+'px';\n    }catch{}\n  }\n\n  function ensureLauncher"+rt[m.end():]

old="""    if (list && typeof d.createElement === 'function') {
      let item = d.getElementById(IDS.native);
      if (!item) { item = d.createElement('li'); item.id = IDS.native; item.appendChild(d.createElement('a')); }
      const link = item.querySelector('a') || item.appendChild(d.createElement('a'));
      link.href = '#'; link.className = 'slx-s-link'; link.textContent = 'S'; link.title = 'SakaLuX Scripts';
      link.setAttribute?.('aria-label', 'SakaLuX Scripts');
      link.onclick = null;
      copyNativeCell(item, list);
      const children = [...(list.children || [])].filter(x => x !== item);
      const cashIndex = children.findIndex(x => /\$|cash|money/i.test((x.textContent || '') + ' ' + (x.className || '')));
      const anchor = cashIndex >= 0 ? children[cashIndex] : children[0];
      try { if (anchor?.insertAdjacentElement) anchor.insertAdjacentElement('afterend', item); else list.appendChild(item); } catch { list.appendChild?.(item); }
      removeNode(IDS.fallback);
      return item;
    }"""
new="""    if (list && typeof d.createElement === 'function') {
      let link = d.getElementById(IDS.native);
      if (!link) {
        link = d.createElement('a');
        link.id = IDS.native;
        link.href = '#';
        link.textContent = 'S';
        link.title = 'SakaLuX Scripts';
        link.setAttribute?.('aria-label','SakaLuX Scripts');
        list.appendChild(link);
      } else if (link.parentElement !== list) {
        link.remove();
        list.appendChild(link);
      }
      link.href='#'; link.textContent='S'; link.onclick=null;
      placeNativeLauncher(link,list);
      removeNode(IDS.fallback);
      return link;
    }"""
if old not in rt:
    raise SystemExit('ensureLauncher native block not found')
rt=rt.replace(old,new,1)

# capture selector supports direct anchor now (not nested .slx-s-link)
rt=rt.replace("'#'+IDS.native+' .slx-s-link,#'+IDS.fallback","'#'+IDS.native+',#'+IDS.fallback",1)
rt=rt.replace("'#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback","'#'+IDS.dock+',#'+IDS.native+',#'+IDS.fallback",1)

RT.write_text(rt,encoding='utf-8')

items = [
    ('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.55','1.3.56','greasyfork/Enhancer-Guard.md'),
    ('SakaLuX-Account-Auditor.user.js',None,'1.3.26','1.3.27',None),
    ('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.48','1.0.49','greasyfork/Mission-Rewards.md'),
    ('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.46','5.3.47','greasyfork/Bazaar-Thanker.md'),
    ('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.15','1.1.16','greasyfork/Bazaar-Smart-Pricer.md'),
    ('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.49','1.3.50','greasyfork/Elimination-Assistant.md'),
    ('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.59','1.17.60','greasyfork/Market-Intelligence.md'),
    ('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.17','0.8.18','greasyfork/Stock-Manager-Advisor.md'),
    ('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.55','1.8.56','greasyfork/Company-Intelligence.md'),
    ('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.5','0.5.6','greasyfork/Bounty-Hunter.md'),
]
note=['Maintenance release: embeds Shared Standalone Dock Runtime v1.1.3.','Fixes Torn mobile status bar regression: Standalone no longer inserts an extra list cell that can hide native refill/merit/cooldown icons.','No module feature changes.']

for filename,sid,old,new,docpath in items:
    p=ROOT/filename
    s=p.read_text(encoding='utf-8')
    if f'// @version      {old}' not in s: raise SystemExit(f'{filename}: expected {old}')
    s=s.replace(old,new)
    p.write_text(s,encoding='utf-8')
    if docpath:
        dp=ROOT/docpath
        if dp.exists():
            d=dp.read_text(encoding='utf-8')
            d=re.sub(r'^\*\*v[^*]+\*\*',f'**v{new}**',d,count=1,flags=re.M)
            current=f"""## Current release note

**v{new} — Standalone Dock Runtime v1.1.3 status-bar fix**
- Embeds Shared Standalone Dock Runtime v1.1.3.
- Fixes the TornPDA status bar so native icons after Points/Merits/Refill/Cooldowns are no longer displaced or hidden.
- Standalone S is now an absolutely positioned overlay anchored near the cooldown area and does not consume a native status-list slot.
- No module feature changes.
"""
            if '## Current release note' in d:
                d=re.sub(r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',current.rstrip()+'\n',d,count=1,flags=re.S)
            entry=f"""### v{new} — Standalone Dock Runtime v1.1.3 status-bar fix
- Runtime-only maintenance update.
- Prevents Standalone from changing Torn's native status-list child count/order.
- Restores all native status icons while keeping the S launcher near cooldowns.

"""
            if f'### v{new}' not in d:
                if '## Changelog\n' in d:d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
                elif '## Release history / Changelog\n' in d:d=d.replace('## Release history / Changelog\n','## Release history / Changelog\n'+entry,1)
            dp.write_text(d,encoding='utf-8')

data=json.loads(REG.read_text(encoding='utf-8'))
for filename,sid,old,new,docpath in items:
    if not sid: continue
    row=next(x for x in data['scripts'] if x.get('id')==sid)
    if row.get('version')!=old: raise SystemExit(f'{sid}: registry expected {old}, got {row.get("version")}')
    row['version']=new; row['release']={'version':new,'date':'2026-10-06','notes':note}; row['detailsRevision']=int(row.get('detailsRevision',0))+1
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if CHANGE.exists():
    c=CHANGE.read_text(encoding='utf-8')
    block="""\n## Standalone Runtime v1.1.3 — Torn status-bar regression fix
- Stops injecting an extra <li> into Torn's native statusIcons list.
- The S launcher is now an absolutely positioned overlay anchored near the drug/cooldown area, so Torn's responsive child-count rules remain untouched.
- Fixes native status icons disappearing after Points/Merits/Refill on TornPDA.
- Runtime-only maintenance bumps: Enhancer 1.3.56, Auditor 1.3.27, Missions 1.0.49, Bazaar Thanker 5.3.47, Smart Pricer 1.1.16, Elimination 1.3.50, Market 1.17.60, Stocks 0.8.18, Company 1.8.56, Bounty 0.5.6.
- Script Hub version is unchanged.
"""
    if 'Standalone Runtime v1.1.3 — Torn status-bar regression fix' not in c:CHANGE.write_text(c.rstrip()+block+'\n',encoding='utf-8')

RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text("""# Shared Standalone Dock Runtime v1.1.3 — Torn status-bar regression fix

The v1.1.2 launcher still inserted an additional list cell into Torn's native mobile status-icons list. TornPDA applies responsive visibility rules to that list, so the extra child could push/hide native status icons after Points/Merits/Refill.

v1.1.3 no longer changes the native list child count. The S launcher is a positioned overlay anchored near the cooldown area.

No module feature changes are included.
""",encoding='utf-8')
