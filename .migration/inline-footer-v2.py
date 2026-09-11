from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
VERSIONS={
'SakaLuX-Script-Hub.user.js':('1.9.8','1.9.9','VERSION'),
'SakaLuX-Enhancer-Guard.user.js':('1.3.16','1.3.17','VERSION'),
'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.8','5.3.9','BAZAAR_VERSION'),
'SakaLuX-Mission-Rewards.user.js':('1.0.6','1.0.7','VERSION'),
'SakaLuX-Market-Intelligence.user.js':('1.17.5','1.17.6','VERSION'),
'SakaLuX-Elimination-Assistant.user.js':('1.3.11','1.3.12','VERSION'),
'SakaLuX-Account-Auditor.user.js':('1.2.3','1.2.4','VERSION'),
'SakaLuX-Suite.user.js':('0.9.908','0.9.909','VERSION'),
}
PANELS={
'SakaLuX-Enhancer-Guard.user.js':('#sl-eg-panel','enhancer-guard'),
'SakaLuX-Bazaar-Thanker-PDA.user.js':('#sakalux-bt-settings','bazaar-thanker'),
'SakaLuX-Mission-Rewards.user.js':('#sl-mr-settings','mission-rewards'),
'SakaLuX-Market-Intelligence.user.js':('#sl-mi-panel','market-intelligence'),
'SakaLuX-Elimination-Assistant.user.js':('#slx-elim','elimination-assistant'),
'SakaLuX-Account-Auditor.user.js':('#sl-aa-panel','account-auditor'),
'SakaLuX-Suite.user.js':('#sakalux-master-suite-panel','suite'),
}
DOCS={
'greasyfork/Script-Hub.md':('1.9.8','1.9.9'),
'greasyfork/Enhancer-Guard.md':('1.3.16','1.3.17'),
'greasyfork/Bazaar-Thanker.md':('5.3.8','5.3.9'),
'greasyfork/Mission-Rewards.md':('1.0.6','1.0.7'),
'greasyfork/Market-Intelligence.md':('1.17.5','1.17.6'),
'greasyfork/Elimination-Assistant.md':('1.3.11','1.3.12'),
'greasyfork/Account-Auditor.md':('1.2.3','1.2.4'),
'greasyfork/SakaLuX-Suite.md':('0.9.908','0.9.909'),
}

def bump(text,old,new,const):
    text,n=re.subn(r'(^// @version\s+)'+re.escape(old)+r'(\s*$)',r'\g<1>'+new+r'\2',text,count=1,flags=re.M)
    if n!=1: raise SystemExit('metadata bump failed '+old+' -> '+new)
    pat=r'(const\s+'+re.escape(const)+r'\s*=\s*[\'\"]?)'+re.escape(old)+r'([\'\"]?)'
    text,n=re.subn(pat,r'\g<1>'+new+r'\2',text,count=1)
    if n!=1: raise SystemExit('runtime bump failed '+const+' '+old+' -> '+new)
    return text

def remove_floating(text):
    # Remove the old body-fixed signature block appended by v1.9.8 migration.
    text,n=re.subn(r'\n// SAKALUX_PERSISTENT_BRAND_FOOTER_V1[\s\S]*?\n\}\)\(\);\s*$', '\n', text, count=1)
    return text

def inline_footer(selector,slug):
    return f'''\n// SAKALUX_INLINE_PANEL_FOOTER_V2\n;(() => {{\n    const FOOTER_ID='sakalux-inline-footer-{slug}';\n    const PANEL_SELECTOR={selector!r};\n    const PROFILE='https://www.torn.com/profiles.php?XID=2380374';\n    function ensureInlineSakaLuXFooter(){{\n        const panel=document.querySelector(PANEL_SELECTOR);\n        if(!panel)return;\n        let footer=panel.querySelector('#'+FOOTER_ID);\n        if(!footer){{\n            footer=document.createElement('div');\n            footer.id=FOOTER_ID;\n            footer.innerHTML='Made with ❤️ by <a href="'+PROFILE+'" target="_self" rel="noopener">SakaLuX [2380374]</a>';\n            footer.style.cssText='flex:0 0 auto;width:100%;box-sizing:border-box;margin-top:10px;padding:10px 8px 9px;border-top:1px solid #2d3c4e;background:rgba(10,15,21,.72);color:#8e99a8;text-align:center;font:700 10px/1.25 Arial,sans-serif';\n            const link=footer.querySelector('a');\n            if(link)link.style.cssText='color:#d7a94a!important;text-decoration:none!important;font-weight:900!important';\n        }}\n        if(panel.lastElementChild!==footer)panel.appendChild(footer);\n    }}\n    const start=()=>{{\n        ensureInlineSakaLuXFooter();\n        if(!document.body)return;\n        const observer=new MutationObserver(ensureInlineSakaLuXFooter);\n        observer.observe(document.body,{{childList:true,subtree:true}});\n    }};\n    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{{once:true}});else start();\n}})();\n'''

for file,(old,new,const) in VERSIONS.items():
    p=ROOT/file
    text=p.read_text(encoding='utf-8')
    text=remove_floating(text)
    text=bump(text,old,new,const)
    if file in PANELS:
        selector,slug=PANELS[file]
        if 'SAKALUX_INLINE_PANEL_FOOTER_V2' not in text:
            text=text.rstrip()+inline_footer(selector,slug)+'\n'
    p.write_text(text,encoding='utf-8')

# Hub keeps its existing native footer only; update changelog.
hubp=ROOT/'SakaLuX-Script-Hub.user.js';hub=hubp.read_text(encoding='utf-8')
needle='    const HUB_CHANGELOG = [\n'
if "version: '1.9.9'" not in hub:
    entry="""    const HUB_CHANGELOG = [\n        {\n            version: '1.9.9',\n            date: '2026-09-11',\n            changes: [\n                'Removed the floating Made with love badge from Torn pages.',\n                'Moved the author signature inside each script panel as the final panel footer, matching Script Hub.',\n                'Kept SakaLuX [2380374] clickable to the Torn profile.'\n            ]\n        },\n"""
    if needle not in hub: raise SystemExit('Hub changelog anchor missing')
    hub=hub.replace(needle,entry,1)
hubp.write_text(hub,encoding='utf-8')

# Registry managed versions.
managed={'enhancer':'1.3.17','bazaar':'5.3.9','mission-rewards':'1.0.7','market-intelligence':'1.17.6','elimination-assistant':'1.3.12'}
regp=ROOT/'scripts.json';reg=json.loads(regp.read_text(encoding='utf-8'))
for item in reg.get('scripts',[]):
    if item.get('id') in managed:item['version']=managed[item['id']]
regp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
# Hub fallback managed versions.
hub=hubp.read_text(encoding='utf-8')
for sid,new in managed.items():
    hub,n=re.subn(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{{0,550}}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>'+new+r'\2',hub,count=1)
    if n!=1: raise SystemExit('Hub fallback version failed '+sid)
hubp.write_text(hub,encoding='utf-8')

# Docs.
for rel,(old,new) in DOCS.items():
    p=ROOT/rel;doc=p.read_text(encoding='utf-8')
    doc,n=re.subn(r'(## Current version\s+\*\*v)'+re.escape(old)+r'(\*\*)',r'\g<1>'+new+r'\2',doc,count=1)
    if n!=1: raise SystemExit('doc version failed '+rel)
    if '### v'+new not in doc and '## Current release notes' in doc:
        body='- Removed the floating author badge from the Torn page.\n- **Made with ❤️ by SakaLuX [2380374]** now lives inside the script panel as its final footer, with the author name and ID linked to the Torn profile.'
        doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v'+new+' — Inline panel signature\n\n'+body+'\n',1)
    p.write_text(doc,encoding='utf-8')

# Update version list in Hub docs.
p=ROOT/'greasyfork/Script-Hub.md';doc=p.read_text(encoding='utf-8')
for old,new in [('1.3.16','1.3.17'),('5.3.8','5.3.9'),('1.0.6','1.0.7'),('1.17.5','1.17.6'),('1.3.11','1.3.12')]: doc=doc.replace('**v'+old+'**','**v'+new+'**')
p.write_text(doc,encoding='utf-8')
print('Inline panel footer migration applied')