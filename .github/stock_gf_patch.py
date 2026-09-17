from pathlib import Path
import json,re

repo=Path('.')
script=repo/'SakaLuX-Stock-Manager-Advisor.user.js'
s=script.read_text(encoding='utf-8')
old_user='https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js'
gf_user='https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.user.js'
gf_meta='https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js'
s=s.replace('// @version      0.7.7','// @version      0.7.8',1)
s=s.replace("version: '0.7.7'","version: '0.7.8'",1)
s=s.replace('// @downloadURL  '+old_user,'// @downloadURL  '+gf_user,1)
s=s.replace('// @updateURL    '+old_user,'// @updateURL    '+gf_meta,1)
script.write_text(s,encoding='utf-8')

rp=repo/'scripts.json'
data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='stock-manager-advisor':
        item['version']='0.7.8'
        item['sourceUrl']=old_user
        item['downloadUrl']=gf_user
        item['metaUrl']=gf_meta
        item['release']={'version':'0.7.8','date':'2026-09-17','notes':['Moves Stock Manager & Advisor public update delivery to Greasy Fork script 596192.','GitHub remains the source repository while Greasy Fork becomes the install/update channel used by Script Hub.']}
        break
else:
    raise SystemExit('stock-manager-advisor missing from scripts.json')
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

hp=repo/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
h=h.replace('// @version      1.9.62','// @version      1.9.63',1)
h=h.replace("const VERSION = '1.9.62';","const VERSION = '1.9.63';",1)
h=h.replace("{version:'1.9.62',date:'2026-09-17',changes:['Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW release details.','Stocks installs and checks updates from its main GitHub source.']},","{version:'1.9.63',date:'2026-09-17',changes:['Moves Stock Manager & Advisor v0.7.8 public install/update checks to Greasy Fork script 596192 while retaining GitHub as source.']},\n        {version:'1.9.62',date:'2026-09-17',changes:['Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW release details.','Stocks installs and checks updates from its main GitHub source.']},",1)
h=h.replace('"version": "0.7.7"','"version": "0.7.8"',1)
h=h.replace('"downloadUrl": "'+old_user+'"','"downloadUrl": "'+gf_user+'"',1)
h=h.replace('"metaUrl": "'+old_user+'"','"metaUrl": "'+gf_meta+'"',1)
h=h.replace('"release": {\n                    "version": "0.7.7"','"release": {\n                    "version": "0.7.8"',1)
h=h.replace('"date": "2026-09-17",\n                    "notes": [\n                        "Promotes Stock Manager & Advisor from experimental to the main script directory and registers it in Script Hub and the standalone dock.",','"date": "2026-09-17",\n                    "notes": [\n                        "Moves Stock Manager & Advisor public update delivery to Greasy Fork script 596192.",\n                        "GitHub remains the source repository while Greasy Fork becomes the install/update channel used by Script Hub.",',1)
hp.write_text(h,encoding='utf-8')

md=repo/'greasyfork/Stock-Manager-Advisor.md'
m=md.read_text(encoding='utf-8')
m=m.replace('**v0.7.7**','**v0.7.8**',2)
if '### v0.7.8' not in m:
    marker='## Release history\n'
    entry='### v0.7.8 — Greasy Fork update channel\n- Public installs and automatic updates now use Greasy Fork script 596192.\n- GitHub remains the canonical source repository.\n\n'
    m=m.replace(marker,marker+entry,1)
md.write_text(m,encoding='utf-8')

hubmd=repo/'greasyfork/Script-Hub.md'
hm=hubmd.read_text(encoding='utf-8')
hm=hm.replace('**v1.9.62**','**v1.9.63**',2)
hm=hm.replace('**v1.9.62** Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW details. Stocks uses its main GitHub source for installation and update checks.','**v1.9.63** Moves Stock Manager & Advisor v0.7.8 install/update checks to Greasy Fork script 596192 while GitHub remains its source repository.',1)
if '### v1.9.63' not in hm:
    marker='## Release history\n'
    entry='### v1.9.63 — Stocks Greasy Fork update channel\n- Stock Manager & Advisor v0.7.8 now installs and checks updates through Greasy Fork script 596192.\n- GitHub remains the canonical source repository.\n\n'
    hm=hm.replace(marker,marker+entry,1)
hubmd.write_text(hm,encoding='utf-8')

vp=repo/'.github/workflows/validate-userscripts.yml'
v=vp.read_text(encoding='utf-8')
v=v.replace("url = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js'\n          assert stock['sourceUrl'] == stock['downloadUrl'] == stock['metaUrl'] == url\n          assert url in source and stock['apiGlobal'] in source","url = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js'\n          gf_user = 'https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.user.js'\n          gf_meta = 'https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js'\n          assert stock['sourceUrl'] == url\n          assert stock['downloadUrl'] == gf_user\n          assert stock['metaUrl'] == gf_meta\n          assert gf_user in source and gf_meta in source and stock['apiGlobal'] in source",1)
vp.write_text(v,encoding='utf-8')
