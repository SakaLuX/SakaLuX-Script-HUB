from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
RT=R/'src/core/sakalux-dock-runtime.js'
REG=R/'scripts.json'
CHANGE=R/'CHANGELOG.md'
s=RT.read_text(encoding='utf-8')
s=s.replace("const VERSION = '1.1.7';","const VERSION = '1.1.8';",1)

# First-slot launcher: always first child in Torn's status icon list.
start=s.index('  function itemHaystack(item){')
end=s.index('  function ensureDock()',start)
launcher='''  function ensureLauncher(){
    const d=doc();
    if(!d||hubInstalled()){removeNode(IDS.native);removeNode(IDS.fallback);return null;}
    const list=findStatusIconList();
    let item=d.getElementById(IDS.native);
    if(!list){item?.remove();return null;}
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
    const first=[...list.children].find(x=>x!==item)||null;
    if(first){
      if(list.firstElementChild!==item) list.insertBefore(item,first);
    }else if(item.parentElement!==list){
      list.appendChild(item);
    }
    removeNode(IDS.fallback);
    return item;
  }

'''
s=s[:start]+launcher+s[end:]

# Exact neutral centering. No top/relative offset; no copied native icon class/background.
old_start=s.index('#${IDS.native}{all:unset!important;')
old_end=s.index('\n#${IDS.prompt}',old_start)
css='''#${IDS.native}{all:unset!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;vertical-align:middle!important;box-sizing:border-box!important;flex:0 0 24px!important;width:24px!important;min-width:24px!important;max-width:24px!important;height:24px!important;min-height:24px!important;max-height:24px!important;margin:0 3px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;list-style:none!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:none!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important;overflow:visible!important}#${IDS.native}::before,#${IDS.native}::after,#${IDS.native} .slx-s-link::before,#${IDS.native} .slx-s-link::after{content:none!important;display:none!important;background:none!important;background-image:none!important}#${IDS.native} .slx-s-link{all:unset!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;background-image:none!important;box-shadow:none!important;filter:none!important;transform:none!important;color:#dfbd61!important;font:900 17px/24px Arial,sans-serif!important;line-height:24px!important;text-align:center!important;text-decoration:none!important;text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 4px rgba(223,189,97,.2)!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}#${IDS.native} .slx-s-link:active{transform:scale(.92)!important}
'''
s=s[:old_start]+css+s[old_end:]
RT.write_text(s,encoding='utf-8')

items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.4','1.3.56.5'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.4','1.3.27.5'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.4','1.0.49.5'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.4','5.3.47.5'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.4','1.1.16.5'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.4','1.3.50.5'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.4','1.17.60.5'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.4','0.8.18.5'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.4','1.8.56.5'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.4','0.5.6.5')]
data=json.loads(REG.read_text(encoding='utf-8'))
for fn,sid,ov,nv in items:
    p=R/fn;t=p.read_text(encoding='utf-8')
    if '// @version      '+ov not in t: raise SystemExit(fn+' expected '+ov)
    p.write_text(t.replace(ov,nv),encoding='utf-8')
    if sid:
        row=next(x for x in data['scripts'] if x.get('id')==sid)
        if row.get('version')!=ov: raise SystemExit(sid+' registry mismatch')
        row['version']=nv
        row['detailsRevision']=int(row.get('detailsRevision',0))+1
        row['release']={'version':nv,'date':'2026-10-06','notes':['Maintenance-only: Shared Standalone Dock Runtime v1.1.8','Standalone S is always the first status-bar icon','Plain gold S is vertically centered and cannot inherit Torn icon art']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=CHANGE.read_text(encoding='utf-8')
tag='Standalone Runtime v1.1.8 — fixed first-slot S'
if tag not in c:
    c+='\n## '+tag+'\n- Standalone S is always inserted as the first status icon.\n- Removed anchor heuristics entirely.\n- Forced 24x24 flex centering with zero positional offset and no inherited Torn/racing artwork.\n- Runtime-only .5 maintenance releases; Hub unchanged.\n'
    CHANGE.write_text(c,encoding='utf-8')