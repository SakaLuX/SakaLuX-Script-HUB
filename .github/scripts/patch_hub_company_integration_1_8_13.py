from pathlib import Path
import json,re

company=Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
s=company.read_text(encoding='utf-8')
s=s.replace('// @version      1.8.12','// @version      1.8.13',1)
s=s.replace("version:'1.8.12'","version:'1.8.13'",1)
old="const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));"
new="const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button') || document.getElementById('sakalux-hub-top-skull') || document.getElementById('sakalux-hub-nav-skull') || document.getElementById('sakalux-hub-panel') || document.getElementById('sakalux-hub-style') || document.querySelector('[data-sakalux-hub-installed=\"1\"]') || document.querySelector('[data-sakalux-hub-active=\"1\"]'));"
if old not in s: raise SystemExit('old hubInstalled not found')
s=s.replace(old,new,1)
marker="  const STYLE_ID = 'sakalux-standalone-dock-style';\n"
insert="  const REG_ATTR = 'data-slx-standalone-registration';\n  const SELF = {id:'company-intelligence',name:'Company',icon:'🏢',selector:'#ci-launch',fallback:'https://www.torn.com/joblist.php',version:'1.8.13'};\n\n  function registerSelf(){\n    let m=document.querySelector(`[${REG_ATTR}=\"${SELF.id}\"]`);\n    if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}\n    Object.assign(m.dataset,SELF);\n  }\n"
if marker not in s: raise SystemExit('bootstrap marker not found')
s=s.replace(marker,marker+insert,1)
s=s.replace("      document.getElementById(PROMPT_ID)?.remove();\n      return null;","      document.getElementById(PROMPT_ID)?.remove();\n      document.getElementById('ci-launch')?.remove();\n      return null;",1)
s=s.replace("  function start() {\n    if (hubInstalled()) return;","  function start() {\n    registerSelf();\n    if (hubInstalled()) { ensureDock(); return; }",1)
s=s.replace("      timer = setTimeout(() => {\n        if (hubInstalled()) {","      timer = setTimeout(() => {\n        registerSelf();\n        if (hubInstalled()) {",1)
s=s.replace("    setInterval(() => { if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } }, 60000);","    setInterval(() => { registerSelf(); if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } else ensureDock(); }, 60000);",1)
old2="const hubActive=!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button'));if(hubActive)$('#ci-launch')?.remove();"
new2="const hubActive=!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed=\"1\"]')||document.querySelector('[data-sakalux-hub-active=\"1\"]'));if(hubActive)$('#ci-launch')?.remove();"
if old2 not in s: raise SystemExit('main hubActive not found')
s=s.replace(old2,new2,1)
company.write_text(s,encoding='utf-8')

sp=Path('scripts.json'); data=json.loads(sp.read_text(encoding='utf-8'))
for x in data.get('scripts',[]):
    if x.get('id')=='company-intelligence':
        x['version']='1.8.13'
        x['greasyForkId']='595873'
        x['metaUrl']='https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.meta.js'
        x['downloadUrl']='https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.user.js'
sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

hub=Path('SakaLuX-Script-Hub.user.js'); h=hub.read_text(encoding='utf-8')
h=h.replace('// @version      1.9.38','// @version      1.9.39',1)
h=h.replace("const VERSION = '1.9.38';","const VERSION = '1.9.39';",1)
needle="    'use strict';\n"
early="    'use strict';\n\n    // Publish Hub presence immediately so add-ons never enter standalone mode while Hub is running.\n    try {\n        document.documentElement?.setAttribute('data-sakalux-hub-installed', '1');\n        document.documentElement?.setAttribute('data-sakalux-hub-active', '1');\n    } catch {}\n"
if needle not in h: raise SystemExit('hub use strict marker missing')
h=h.replace(needle,early,1)
h=h.replace("version: '1.8.12',\n                description: 'Employee and Director company intelligence", "version: '1.8.13',\n                description: 'Employee and Director company intelligence",1)
h=h.replace("metaUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js',\n                downloadUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js',", "metaUrl: 'https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.meta.js',\n                downloadUrl: 'https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.user.js',",1)
ch="    const HUB_CHANGELOG = [\n"
entry="    const HUB_CHANGELOG = [\n        {\n            version: '1.9.39',\n            date: '2026-09-15',\n            changes: [\n                'Publishes Hub presence immediately at script startup so add-ons cannot fall into standalone mode when Hub is installed.',\n                'Company Intelligence v1.8.13 now uses the same Hub-presence signals as the other managed add-ons and registers itself with the standalone dock only when Hub is genuinely absent.',\n                'Company Intelligence public update metadata now follows its published Greasy Fork script 595873.'\n            ]\n        },\n"
if ch not in h: raise SystemExit('changelog marker missing')
h=h.replace(ch,entry,1)
hub.write_text(h,encoding='utf-8')

md=Path('greasyfork/Company-Intelligence.md'); m=md.read_text(encoding='utf-8')
m=m.replace('**v1.8.12**','**v1.8.13**',1)
marker='## Current release note\n'; st=m.index(marker)+len(marker); en=m.find('\n## ',st)
if en<0: en=len(m)
m=m[:st]+"\n**v1.8.13** fixes Hub/standalone detection. When Script Hub is running, Company Intelligence removes its floating launcher and does not open the standalone SakaLuX dock. Without Hub, it registers cleanly as a standalone Company entry.\n"+m[en:]
hist='## Release history\n'
if '### v1.8.13 — Hub integration detection' not in m:
    m=m.replace(hist,hist+'### v1.8.13 — Hub integration detection\n\n- Uses all current Script Hub DOM presence signals.\n- Removes the Company Intel floating button as soon as Hub is detected.\n- Registers Company Intelligence in the shared standalone dock only when Hub is truly absent.\n- Keeps standalone operation intact.\n\n',1)
md.write_text(m,encoding='utf-8')

hm=Path('greasyfork/Script-Hub.md'); t=hm.read_text(encoding='utf-8')
t=t.replace('**v1.9.38**','**v1.9.39**',1)
marker='## Current release note\n'; st=t.index(marker)+len(marker); en=t.find('\n## ',st)
if en<0: en=len(t)
t=t[:st]+"**v1.9.39** publishes the Hub-active marker immediately at startup, before add-ons initialize. This prevents the shared standalone launcher from appearing when Hub is installed and lets Company Intelligence v1.8.13 integrate directly with Hub. Company Intelligence update metadata now points to its published Greasy Fork script 595873.\n"+t[en:]
t=t.replace('- 🏢 SakaLuX Company Intelligence **v1.8.12**','- 🏢 SakaLuX Company Intelligence **v1.8.13**',1)
t=t.replace('- Company Intelligence v1.8.12 is currently distributed from the GitHub userscript source; Hub v1.9.38 no longer checks it against the unrelated Greasy Fork metadata that caused a false publish-pending state.','- Company Intelligence v1.8.13 is published on Greasy Fork script 595873 and Hub checks that public update source.',1)
hist='## Release history\n'
if '### v1.9.39 — Reliable Hub presence handshake' not in t:
    t=t.replace(hist,hist+'### v1.9.39 — Reliable Hub presence handshake\n- Marks Hub as installed/active immediately when the userscript starts.\n- Prevents managed add-ons from showing the standalone dock while Hub is running.\n- Integrates Company Intelligence v1.8.13 with the same detection contract as the other add-ons.\n- Switches Company Intelligence public update checks to Greasy Fork 595873.\n\n',1)
hm.write_text(t,encoding='utf-8')
