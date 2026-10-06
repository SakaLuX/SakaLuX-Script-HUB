from pathlib import Path
import json
R=Path(__file__).resolve().parents[2]
RT=R/'src/core/sakalux-dock-runtime.js'
REG=R/'scripts.json'
CHANGE=R/'CHANGELOG.md'
s=RT.read_text(encoding='utf-8')
s=s.replace("const VERSION = '1.1.6';","const VERSION = '1.1.7';",1)
s=s.replace('#\\${IDS.','#${IDS.')
s=s.replace("#${IDS.native}{position:relative!important;","#${IDS.native}{all:unset!important;position:relative!important;",1)
s=s.replace("#${IDS.native} .slx-s-link{display:grid!important;","#${IDS.native} .slx-s-link{all:unset!important;display:grid!important;",1)
RT.write_text(s,encoding='utf-8')
items=[
('SakaLuX-Enhancer-Guard.user.js','enhancer','1.3.56.3','1.3.56.4'),
('SakaLuX-Account-Auditor.user.js',None,'1.3.27.3','1.3.27.4'),
('SakaLuX-Mission-Rewards.user.js','mission-rewards','1.0.49.3','1.0.49.4'),
('SakaLuX-Bazaar-Thanker-PDA.user.js','bazaar','5.3.47.3','5.3.47.4'),
('SakaLuX-Bazaar-Smart-Pricer.user.js','bazaar-smart-pricer','1.1.16.3','1.1.16.4'),
('SakaLuX-Elimination-Assistant.user.js','elimination-assistant','1.3.50.3','1.3.50.4'),
('SakaLuX-Market-Intelligence.user.js','market-intelligence','1.17.60.3','1.17.60.4'),
('SakaLuX-Stock-Manager-Advisor.user.js','stock-manager-advisor','0.8.18.3','0.8.18.4'),
('SakaLuX-Company-Intelligence-v1.0.0.user.js','company-intelligence','1.8.56.3','1.8.56.4'),
('SakaLuX-Bounty-Hunter.user.js','bounty-hunter','0.5.6.3','0.5.6.4')]
data=json.loads(REG.read_text(encoding='utf-8'))
for fn,sid,ov,nv in items:
    p=R/fn; t=p.read_text(encoding='utf-8')
    if '// @version      '+ov not in t: raise SystemExit(fn+' expected '+ov)
    p.write_text(t.replace(ov,nv),encoding='utf-8')
    if sid:
        row=next(x for x in data['scripts'] if x.get('id')==sid)
        row['version']=nv
        row['detailsRevision']=int(row.get('detailsRevision',0))+1
        row['release']={'version':nv,'date':'2026-10-06','notes':['Maintenance-only: Shared Standalone Dock Runtime v1.1.7','Fix escaped CSS selectors so plain-gold S styling applies','Reset inherited Torn status-icon background']}
REG.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
c=CHANGE.read_text(encoding='utf-8')
tag='Standalone Runtime v1.1.7 — plain S CSS selector fix'
if tag not in c:
    c+='\n## '+tag+'\n- Fixed escaped CSS selectors introduced in v1.1.6.\n- Plain gold S styles now target the real launcher.\n- Added all:unset to block inherited Torn/racing/status backgrounds.\n'
    CHANGE.write_text(c,encoding='utf-8')