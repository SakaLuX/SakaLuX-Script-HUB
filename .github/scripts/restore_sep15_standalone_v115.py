from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2]
P=R/'src/core/sakalux-dock-runtime.js'
s=P.read_text(encoding='utf-8').replace("const VERSION = '1.1.4';","const VERSION = '1.1.5';",1)

# Restore Sep-15 launcher CSS exactly (plain gold S, no inherited pseudo/icon art).
s=re.sub(r'#\$\{IDS\.native\}[^\n]*',
'''#\${IDS.native}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;background:none!important;box-shadow:none!important}#\${IDS.native}::before,#\${IDS.native}::after{content:none!important;display:none!important}#\${IDS.native} .slx-s-link{display:grid!important;place-items:center!important;width:17px!important;height:17px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;text-decoration:none!important;color:#dfbd61!important;font:900 15px/17px Arial,sans-serif!important;text-shadow:0 1px 1px rgba(0,0,0,.72),0 0 4px rgba(223,189,97,.18)!important}#\${IDS.native} .slx-s-link:active{transform:scale(.9)!important}''',
s,count=1)

# Restore Sep-15 dock header and rows instead of the later horizontal/racing-style UI.
s=re.sub(r'#\$\{IDS\.dock\} \.slx-dock-head\{[^\n]*\}',
'#\${IDS.dock} .slx-dock-head{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;padding:4px 6px 10px;margin-bottom:7px;border-bottom:1px solid rgba(255,255,255,.055)}',s,count=1)
s=re.sub(r'#\$\{IDS\.dock\} \.slx-dock-mark\{[^\n]*\}',
'#\${IDS.dock} .slx-dock-mark{width:30px;height:30px;display:grid;place-items:center;padding:0;margin:0;border-radius:10px;background:linear-gradient(180deg,#293545,#1a2430);border:1px solid rgba(223,189,97,.38);color:#dfbd61;font:900 16px/30px Arial,sans-serif;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 4px 10px rgba(0,0,0,.2);cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',s,count=1)
s=re.sub(r'#\$\{IDS\.dock\} \.slx-dock-title\{[^\n]*\}',
'#\${IDS.dock} .slx-dock-title{color:#f4f7fb;font-size:11px;font-weight:900;line-height:1.15;letter-spacing:.01em;text-align:center}',s,count=1)
s=re.sub(r'#\$\{IDS\.dock\} \.slx-dock-sub\{[^\n]*\}',
'#\${IDS.dock} .slx-dock-sub{color:#8693a3;font-size:8px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;text-align:center}',s,count=1)

# Ensure launcher uses the old Sep-15 native LI/class cloning path.
a=s.index('  function findStatusIconList()')
b=s.index('  function ensureDock()',a)
launcher="""  function findStatusIconList() {
    const d=doc(); if(!d)return null;
    const selectors=['ul[class*="statusIcons"][class*="big"]','ul[class*="status-icons"][class*="big"]','ul[class*="statusIcons"]','ul[class*="status-icons"]'];
    const lists=selectors.flatMap(q=>[...d.querySelectorAll(q)]);
    return lists.find(list=>list.isConnected&&[...list.children].some(item=>item.querySelector?.('a')))||null;
  }
  function copyNativeCell(item,list){
    const ref=[...list.children].find(x=>x!==item&&x.querySelector?.('a'));if(!ref)return;
    const native=[...ref.classList].filter(x=>x&&!x.startsWith('slx-')&&!x.startsWith('sakalux-'));
    item.className=[...native,'slx-standalone-native'].join(' ');
  }
  function ensureLauncher(){
    const d=doc();if(!d||hubInstalled()){removeNode(IDS.native);removeNode(IDS.fallback);return null;}
    const list=findStatusIconList();let item=d.getElementById(IDS.native);
    if(list){
      if(!item){item=d.createElement('li');item.id=IDS.native;item.innerHTML='<a href="#" class="slx-s-link" aria-label="SakaLuX Scripts" title="SakaLuX Scripts">S</a>';}
      const link=item.querySelector('a');
      if(link)link.onclick=e=>{e.preventDefault();e.stopPropagation();const p=d.getElementById(IDS.dock);const o=p?.dataset.open==='1'&&!p.hidden;if(o)forceCloseDock();else{userOpened=true;toggleDock(true);}};
      copyNativeCell(item,list);
      const children=[...list.children].filter(x=>x!==item);
      const cashIndex=children.findIndex(x=>/\\$|cash|money/i.test((x.textContent||'')+' '+(x.className||'')));
      const anchor=cashIndex>=0?children[cashIndex]:children[0];
      if(anchor)anchor.insertAdjacentElement('afterend',item);else list.appendChild(item);
      removeNode(IDS.fallback);return item;
    }
    item?.remove();return null;
  }

"""
s=s[:a]+launcher+s[b:]

# Start closed; S in panel closes; no separate X.
s=s.replace("panel.dataset.open = readOpen() ? '1' : '0';","panel.dataset.open='0';panel.hidden=true;writeOpen(false);")
s=s.replace("const mark = d.createElement('div'); mark.className = 'slx-dock-mark'; mark.textContent = 'S'; mark.setAttribute?.('aria-hidden','true');",
"const mark=d.createElement('button');mark.type='button';mark.className='slx-dock-mark';mark.textContent='S';mark.title='Close SakaLuX Scripts';mark.onclick=e=>{e?.preventDefault?.();e?.stopPropagation?.();forceCloseDock();};")
P.write_text(s,encoding='utf-8')

items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.1','1.3.56.2'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.1','1.3.27.2'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.1','1.0.49.2'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.1','5.3.47.2'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.1','1.1.16.2'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.1','1.3.50.2'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.1','1.17.60.2'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.1','0.8.18.2'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.1','1.8.56.2'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.1','0.5.6.2')]
reg=json.loads((R/'scripts.json').read_text(encoding='utf-8'))
for fn,sid,old,new in items:
 p=R/fn;t=p.read_text(encoding='utf-8')
 if '// @version      '+old not in t:raise SystemExit(fn+' expected '+old)
 p.write_text(t.replace(old,new),encoding='utf-8')
 if sid:
  row=next(x for x in reg['scripts'] if x.get('id')==sid)
  if row.get('version')!=old:raise SystemExit(sid+' registry mismatch')
  row['version']=new;row['detailsRevision']=int(row.get('detailsRevision',0))+1
  row['release']={'version':new,'date':'2026-10-06','notes':['Maintenance-only: Standalone Runtime v1.1.5','Restores Sep-15 plain gold S launcher and old dock visual behavior','No module feature changes']}
(R/'scripts.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=(R/'CHANGELOG.md').read_text(encoding='utf-8')
if 'Standalone Runtime v1.1.5 Sep-15 restore' not in c:
 c+='\\n## Standalone Runtime v1.1.5 Sep-15 restore\\n- Restores Sep-15 plain gold S launcher and old Standalone visuals.\\n- Keeps singleton/open-close fixes.\\n- Uses .2 maintenance suffixes; Hub unchanged.\\n'
 (R/'CHANGELOG.md').write_text(c,encoding='utf-8')
