from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
RT=R/'src/core/sakalux-dock-runtime.js'
REG=R/'scripts.json'
CHANGE=R/'CHANGELOG.md'
s=RT.read_text(encoding='utf-8')
s=s.replace("const VERSION = '1.1.8';","const VERSION = '1.1.9';",1)
s=s.replace("filter:none!important;transform:none!important;color:#dfbd61!important;","filter:none!important;transform:translateY(1px)!important;color:#dfbd61!important;",1)
s=s.replace("#${IDS.native} .slx-s-link:active{transform:scale(.92)!important}","#${IDS.native} .slx-s-link:active{transform:translateY(1px) scale(.92)!important}",1)
RT.write_text(s,encoding='utf-8')
items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.5','1.3.56.6'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.5','1.3.27.6'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.5','1.0.49.6'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.5','5.3.47.6'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.5','1.1.16.6'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.5','1.3.50.6'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.5','1.17.60.6'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.5','0.8.18.6'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.5','1.8.56.6'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.5','0.5.6.6')]
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
        row['release']={'version':nv,'date':'2026-10-06','notes':['Maintenance-only: Shared Standalone Dock Runtime v1.1.9','Moves the plain-gold S down by 1px for optical vertical centering','Keeps S permanently in first status-bar slot']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=CHANGE.read_text(encoding='utf-8')
tag='Standalone Runtime v1.1.9 — optical S centering'
if tag not in c:
    c+='\n## '+tag+'\n- Moves the plain gold S down by 1px for optical alignment with Torn status icons.\n- Keeps S permanently first in the status bar.\n- Runtime-only .6 maintenance releases; Hub unchanged.\n'
    CHANGE.write_text(c,encoding='utf-8')