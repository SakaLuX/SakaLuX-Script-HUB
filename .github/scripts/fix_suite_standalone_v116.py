from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2]
RT=R/'src/core/sakalux-dock-runtime.js'
SUITE=R/'SakaLuX-Suite.user.js'
REG=R/'scripts.json'
CHANGE=R/'CHANGELOG.md'

# --- Shared Dock runtime: plain gold S, no copied Torn icon/racing class ---
s=RT.read_text(encoding='utf-8')
s=s.replace("const VERSION = '1.1.5';","const VERSION = '1.1.6';",1)

# Replace native launcher CSS with neutral, explicit plain-S styling.
s=re.sub(r'#\$\{IDS\.native\}[^\n]*',
'''#${IDS.native}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:24px!important;min-height:24px!important;max-height:24px!important;margin:0 2px!important;padding:0!important;border:0!important;border-radius:0!important;list-style:none!important;background:none!important;background-image:none!important;box-shadow:none!important;filter:none!important;overflow:visible!important}#${IDS.native}::before,#${IDS.native}::after,#${IDS.native} .slx-s-link::before,#${IDS.native} .slx-s-link::after{content:none!important;display:none!important;background:none!important;background-image:none!important}#${IDS.native} .slx-s-link{display:grid!important;place-items:center!important;width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;background-image:none!important;box-shadow:none!important;filter:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 17px/20px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 4px rgba(223,189,97,.2)!important}#${IDS.native} .slx-s-link:active{transform:scale(.9)!important}''',
s,count=1)

# Replace copyNativeCell + ensureLauncher section: never clone native classes.
a=s.index('  function copyNativeCell(')
b=s.index('  function ensureDock()',a)
new_launcher=r'''  function itemHaystack(item){
    if(!item)return '';
    const a=item.querySelector?.('a');
    return [
      item.textContent||'', item.className||'',
      item.getAttribute?.('title')||'', item.getAttribute?.('aria-label')||'',
      a?.getAttribute?.('title')||'', a?.getAttribute?.('aria-label')||'',
      a?.getAttribute?.('href')||'', item.innerHTML||''
    ].join(' ').toLowerCase();
  }
  function preferredStatusAnchor(list){
    const children=[...(list?.children||[])].filter(x=>x?.id!==IDS.native);
    return children.find(x=>/drug|xanax|booster|cooldown|addiction/.test(itemHaystack(x)))
      || children.find(x=>/merit|point/.test(itemHaystack(x)))
      || children[3] || children[children.length-1] || null;
  }
  function ensureLauncher(){
    const d=doc();if(!d||hubInstalled()){removeNode(IDS.native);removeNode(IDS.fallback);return null;}
    const list=findStatusIconList();let item=d.getElementById(IDS.native);
    if(list){
      if(!item){
        item=d.createElement('li');
        item.id=IDS.native;
      }
      item.className='slx-standalone-native';
      item.removeAttribute?.('style');
      let link=item.querySelector('a.slx-s-link');
      if(!link){
        item.replaceChildren();
        link=d.createElement('a');
        link.href='#';link.className='slx-s-link';link.textContent='S';
        link.title='SakaLuX Scripts';link.setAttribute('aria-label','SakaLuX Scripts');
        item.appendChild(link);
      }else{
        link.textContent='S';link.href='#';link.className='slx-s-link';
      }
      link.onclick=e=>{
        e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();
        const p=d.getElementById(IDS.dock);
        const open=p?.dataset.open==='1'&&!p.hidden;
        if(open)forceCloseDock();else{userOpened=true;toggleDock(true);}
      };
      const anchor=preferredStatusAnchor(list);
      if(anchor && anchor.nextElementSibling!==item) anchor.insertAdjacentElement('afterend',item);
      else if(!anchor && item.parentElement!==list) list.appendChild(item);
      removeNode(IDS.fallback);
      return item;
    }
    item?.remove();
    return null;
  }

'''
s=s[:a]+new_launcher+s[b:]
RT.write_text(s,encoding='utf-8')

# --- Suite: remove obsolete standalone collector bootstrap completely ---
q=SUITE.read_text(encoding='utf-8')
oldv=re.search(r'(?m)^//\s*@version\s+(\S+)',q).group(1)
newv=oldv+'.1' if oldv.count('.')==2 else oldv.rsplit('.',1)[0]+'.'+str(int(oldv.rsplit('.',1)[1])+1)
begin='/* SakaLuX Standalone Dock Bootstrap — BEGIN */'
end='/* SakaLuX Standalone Dock Bootstrap — END */'
if begin in q and end in q:
    x=q.index(begin); y=q.index(end,x)+len(end)
    q=q[:x]+'/* Legacy Standalone collector removed: shared dock runtime is owned by individual standalone modules. */\n'+q[y:]

# Suite's own master-settings icon must also never inherit Torn/racing icon classes.
old='''    const nativeClasses = Array.from(reference.classList)
      .filter(className =>
        className &&
        !className.startsWith("sakalux-") &&
        !className.startsWith("tma-")
      );
    const customClasses = Array.from(customItem.classList)
      .filter(className =>
        className.startsWith("sakalux-") ||
        className.startsWith("tma-")
      );
    customItem.className = [
      ...nativeClasses,
      ...customClasses
    ].join(" ");'''
new='''    customItem.className = "sakalux-master-status-icon";'''
if old in q:q=q.replace(old,new,1)

# Hard suppress inherited Torn pseudo/background art on Suite launcher.
needle='''        .sakalux-master-status-icon.sakalux-pda-launcher-fallback
        #sakalux-suite-launcher svg {'''
extra='''        #sakalux-master-suite-launcher-item::before,
        #sakalux-master-suite-launcher-item::after,
        #sakalux-suite-launcher::before,
        #sakalux-suite-launcher::after {
          content: none !important;
          display: none !important;
          background: none !important;
          background-image: none !important;
        }
        #sakalux-master-suite-launcher-item,
        #sakalux-suite-launcher {
          background-image: none !important;
          filter: none !important;
        }
'''
if needle in q and extra not in q:q=q.replace(needle,extra+needle,1)

q=re.sub(r'(?m)^(//\s*@version\s+)\S+',r'\g<1>'+newv,q,count=1)
q=q.replace("const VERSION = '"+oldv+"';","const VERSION = '"+newv+"';",1)
SUITE.write_text(q,encoding='utf-8')

# Maintenance .3 on all standalone modules to distribute v1.1.6.
items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.2','1.3.56.3'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.2','1.3.27.3'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.2','1.0.49.3'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.2','5.3.47.3'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.2','1.1.16.3'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.2','1.3.50.3'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.2','1.17.60.3'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.2','0.8.18.3'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.2','1.8.56.3'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.2','0.5.6.3')]
data=json.loads(REG.read_text(encoding='utf-8'))
for fn,sid,ov,nv in items:
 p=R/fn;t=p.read_text(encoding='utf-8')
 if '// @version      '+ov not in t:raise SystemExit(fn+' expected '+ov)
 p.write_text(t.replace(ov,nv),encoding='utf-8')
 if sid:
  row=next(x for x in data['scripts'] if x.get('id')==sid)
  if row.get('version')!=ov:raise SystemExit(sid+' registry mismatch')
  row['version']=nv;row['detailsRevision']=int(row.get('detailsRevision',0))+1
  row['release']={'version':nv,'date':'2026-10-06','notes':['Maintenance-only: Shared Standalone Dock Runtime v1.1.6','Plain gold S no longer clones Torn/racing icon classes','Anchors S beside drug/cooldown status when available']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

c=CHANGE.read_text(encoding='utf-8')
tag='Standalone Runtime v1.1.6 + Suite launcher cleanup'
if tag not in c:
 c+='\n## '+tag+'\n- Shared Standalone S is now a neutral plain-gold glyph and never inherits Torn/racing icon classes.\n- Launcher prefers placement beside Drug/Cooldown status.\n- Removed Suite\'s obsolete Standalone collector bootstrap, which was independently creating/moving standalone UI.\n- Suite master launcher no longer clones Torn icon classes.\n- Maintenance suffix .3 distributed to standalone modules; Hub unchanged.\n'
 CHANGE.write_text(c,encoding='utf-8')
print(newv)
