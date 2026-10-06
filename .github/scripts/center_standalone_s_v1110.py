from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
RT=R/'src/core/sakalux-dock-runtime.js'
REG=R/'scripts.json'
CHANGE=R/'CHANGELOG.md'
s=RT.read_text(encoding='utf-8')
s=s.replace("const VERSION = '1.1.9';","const VERSION = '1.1.10';",1)
s=s.replace("transform:translateY(1px)!important;color:#dfbd61!important;","transform:translateY(2px)!important;color:#dfbd61!important;",1)
s=s.replace("#${IDS.native} .slx-s-link:active{transform:translateY(1px) scale(.92)!important}","#${IDS.native} .slx-s-link:active{transform:translateY(2px) scale(.92)!important}",1)
RT.write_text(s,encoding='utf-8')
items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.6','1.3.56.7'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.6','1.3.27.7'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.6','1.0.49.7'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.6','5.3.47.7'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.6','1.1.16.7'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.6','1.3.50.7'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.6','1.17.60.7'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.6','0.8.18.7'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.6','1.8.56.7'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.6','0.5.6.7')]
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
        row['release']={'version':nv,'date':'2026-10-06','notes':['Maintenance-only: Shared Standalone Dock Runtime v1.1.10','Moves the plain-gold S down by 2px total for optical centering','Keeps S permanently in first status-bar slot']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=CHANGE.read_text(encoding='utf-8')
tag='Standalone Runtime v1.1.10 — S +2px optical centering'
if tag not in c:
    c+='\n## '+tag+'\n- Moves the plain gold S down by 2px total for better optical alignment.\n- Keeps S permanently first in the status bar.\n- Runtime-only .7 maintenance releases; Hub unchanged.\n'
    CHANGE.write_text(c,encoding='utf-8')