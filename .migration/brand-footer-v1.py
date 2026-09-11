from pathlib import Path
import json, re

ROOT=Path(__file__).resolve().parents[1]
VERSIONS={
 'SakaLuX-Script-Hub.user.js':('1.9.7','1.9.8','VERSION'),
 'SakaLuX-Enhancer-Guard.user.js':('1.3.15','1.3.16','VERSION'),
 'SakaLuX-Bazaar-Thanker-PDA.user.js':('5.3.7','5.3.8','BAZAAR_VERSION'),
 'SakaLuX-Mission-Rewards.user.js':('1.0.5','1.0.6','VERSION'),
 'SakaLuX-Market-Intelligence.user.js':('1.17.4','1.17.5','VERSION'),
 'SakaLuX-Elimination-Assistant.user.js':('1.3.10','1.3.11','VERSION'),
 'SakaLuX-Account-Auditor.user.js':('1.2.2','1.2.3','VERSION'),
 'SakaLuX-Suite.user.js':('0.9.907','0.9.908','VERSION'),
}
DOCS={
 'greasyfork/Script-Hub.md':('1.9.7','1.9.8'),
 'greasyfork/Enhancer-Guard.md':('1.3.15','1.3.16'),
 'greasyfork/Bazaar-Thanker.md':('5.3.7','5.3.8'),
 'greasyfork/Mission-Rewards.md':('1.0.5','1.0.6'),
 'greasyfork/Market-Intelligence.md':('1.17.4','1.17.5'),
 'greasyfork/Elimination-Assistant.md':('1.3.10','1.3.11'),
 'greasyfork/Account-Auditor.md':('1.2.2','1.2.3'),
 'greasyfork/SakaLuX-Suite.md':('0.9.907','0.9.908'),
}
FOOTER=r'''

// SAKALUX_PERSISTENT_BRAND_FOOTER_V1
;(() => {
    const ID='sakalux-global-made-with-love';
    const PROFILE='https://www.torn.com/profiles.php?XID=2380374';
    function ensureSakaLuXBrandFooter(){
        if(!document.body)return;
        let el=document.getElementById(ID);
        if(!el){
            el=document.createElement('div');
            el.id=ID;
            el.innerHTML='Made with ❤️ by <a href="'+PROFILE+'" target="_self" rel="noopener">SakaLuX [2380374]</a>';
            document.body.appendChild(el);
        }
        const mobile=window.matchMedia&&window.matchMedia('(max-width:700px)').matches;
        el.style.cssText='position:fixed;right:8px;bottom:'+(mobile?'76px':'8px')+';z-index:2147483646;padding:5px 8px;border:1px solid rgba(215,169,74,.42);border-radius:999px;background:rgba(12,17,23,.92);box-shadow:0 4px 14px rgba(0,0,0,.35);color:#aeb8c5;font:700 10px/1.2 Arial,sans-serif;white-space:nowrap;pointer-events:auto;backdrop-filter:blur(6px)';
        const a=el.querySelector('a');if(a)a.style.cssText='color:#d7a94a!important;text-decoration:none!important;font-weight:900!important';
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureSakaLuXBrandFooter,{once:true});else ensureSakaLuXBrandFooter();
    window.addEventListener('resize',ensureSakaLuXBrandFooter,{passive:true});
    setInterval(ensureSakaLuXBrandFooter,2500);
})();
'''

def bump_runtime(text,old,new,name):
    text,n=re.subn(r'(^// @version\s+)'+re.escape(old)+r'(\s*$)',r'\g<1>'+new+r'\2',text,count=1,flags=re.M)
    if n!=1: raise SystemExit(f'metadata version not found {old}->{new}')
    pat=r'(const\s+'+re.escape(name)+r'\s*=\s*[\'\"])'+re.escape(old)+r'([\'\"])'
    text,n=re.subn(pat,r'\g<1>'+new+r'\2',text,count=1)
    if n!=1: raise SystemExit(f'runtime version not found {name} {old}->{new}')
    return text

for file,(old,new,const) in VERSIONS.items():
    p=ROOT/file;text=p.read_text(encoding='utf-8')
    text=bump_runtime(text,old,new,const)
    if 'SAKALUX_PERSISTENT_BRAND_FOOTER_V1' not in text:
        text=text.rstrip()+FOOTER+'\n'
    p.write_text(text,encoding='utf-8')

# Hub footer and changelog.
p=ROOT/'SakaLuX-Script-Hub.user.js';text=p.read_text(encoding='utf-8')
text=text.replace('<div class="slh-footer">Built by <a class="slh-author" id="slh-author" href="${PROFILE_URL}">SakaLuX [2380374]</a></div>', '<div class="slh-footer">Made with ❤️ by <a class="slh-author" id="slh-author" href="${PROFILE_URL}">SakaLuX [2380374]</a></div>')
needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [\n        {\n            version: '1.9.8',\n            date: '2026-09-11',\n            changes: [\n                'Restored the Made with ❤️ by SakaLuX [2380374] footer in Hub with the author name and ID linked to the Torn profile.',\n                'Added one persistent shared SakaLuX author footer across every current userscript.',\n                'Refined Market Intelligence header text and enlarged its close button to match Hub.'\n            ]\n        },\n"""
if needle in text and "version: '1.9.8'" not in text:text=text.replace(needle,entry,1)
p.write_text(text,encoding='utf-8')

# Market Intelligence header cleanup + Hub-sized X.
p=ROOT/'SakaLuX-Market-Intelligence.user.js';text=p.read_text(encoding='utf-8')
text=text.replace("v'+VERSION+' · '+esc(state.apiMode||'API idle')+' · page: '+esc(state.page||detectPage())", "v'+VERSION+' · Market • Bazaar • Travel Intelligence")
css_rule="#sl-mi-close,#sl-mi-api-close{width:42px!important;height:42px!important;min-width:42px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:11px!important;font-size:22px!important}"
if css_rule not in text:
    marker='.sl-mi-head-actions{display:flex;align-items:center;gap:7px}'
    text=text.replace(marker,marker+'\n'+css_rule,1)
p.write_text(text,encoding='utf-8')

# Registry + Hub fallback managed versions.
regp=ROOT/'scripts.json';reg=json.loads(regp.read_text(encoding='utf-8'))
managed={'enhancer':'1.3.16','bazaar':'5.3.8','mission-rewards':'1.0.6','market-intelligence':'1.17.5','elimination-assistant':'1.3.11'}
for item in reg['scripts']:
    if item['id'] in managed:item['version']=managed[item['id']]
regp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
hubp=ROOT/'SakaLuX-Script-Hub.user.js';hub=hubp.read_text(encoding='utf-8')
for sid,new in managed.items():
    hub,n=re.subn(r"(id:\s*['\"]"+re.escape(sid)+r"['\"][\s\S]{0,500}?version:\s*['\"])[^'\"]+(['\"])",r'\g<1>'+new+r'\2',hub,count=1)
    if n!=1:raise SystemExit('Hub fallback update failed '+sid)
hubp.write_text(hub,encoding='utf-8')

# Documentation current versions + release note.
notes={
 'greasyfork/Script-Hub.md':'- Restored **Made with ❤️ by SakaLuX [2380374]** in the Hub footer with the linked Torn profile.\n- Added the persistent shared author footer used by every current SakaLuX userscript.\n- Market Intelligence now uses a cleaner subtitle and a larger Hub-style close button.',
 'greasyfork/Market-Intelligence.md':'- Replaced the technical `Manual · page: other` style subtitle with **Market • Bazaar • Travel Intelligence**.\n- Enlarged the close button to the Hub control size.\n- Added the persistent **Made with ❤️ by SakaLuX [2380374]** linked author footer.',
}
for rel,(old,new) in DOCS.items():
    p=ROOT/rel;doc=p.read_text(encoding='utf-8')
    doc,n=re.subn(r'(## Current version\s+\*\*v)'+re.escape(old)+r'(\*\*)',r'\g<1>'+new+r'\2',doc,count=1)
    if n!=1:raise SystemExit('doc current version failed '+rel)
    if ('### v'+new) not in doc and '## Current release notes' in doc:
        body=notes.get(rel,'- Added the persistent **Made with ❤️ by SakaLuX [2380374]** author footer with the author name and Torn ID linked to the profile.\n- Keeps the SakaLuX identity visible consistently across TornPDA and desktop.')
        doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v'+new+' — Persistent SakaLuX signature\n\n'+body+'\n',1)
    p.write_text(doc,encoding='utf-8')

# Update managed versions in Hub documentation list.
p=ROOT/'greasyfork/Script-Hub.md';doc=p.read_text(encoding='utf-8')
for old,new in [('1.3.15','1.3.16'),('5.3.7','5.3.8'),('1.0.5','1.0.6'),('1.17.4','1.17.5'),('1.3.10','1.3.11')]:
    doc=doc.replace('**v'+old+'**','**v'+new+'**')
p.write_text(doc,encoding='utf-8')

print('Persistent SakaLuX branding migration applied.')
