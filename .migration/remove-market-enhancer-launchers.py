from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]

def replace_once(text, old, new, label):
    if old not in text: raise SystemExit(label)
    return text.replace(old,new,1)

# Enhancer Guard
p=ROOT/'SakaLuX-Enhancer-Guard.user.js'
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(^// @version\s+)1\.3\.28(\s*$)',r'\g<1>1.3.29\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('enhancer metadata')
s,n=re.subn(r"const VERSION\s*=\s*['\"]1\.3\.28['\"]","const VERSION = '1.3.29'",s,count=1)
if n!=1: raise SystemExit('enhancer runtime')
s=s.replace("{version:'1.3.28'}","{version:'1.3.29'}",1)
s=s.replace('"selector":"#sl-eg-button",','"selector":"",',1)
s=s.replace("            #sl-eg-button{position:fixed;right:12px;bottom:82px;z-index:2147483646;border:0;border-radius:999px;padding:10px 14px;background:#111827;color:#fff;font-size:13px;font-weight:800;box-shadow:0 5px 18px rgba(0,0,0,.35)}\n",'',1)
create=re.compile(r"\n    function createButton\(\) \{\n        if \(!state\.enabled \|\| document\.getElementById\('sl-eg-button'\)\) return;\n        const button = document\.createElement\('button'\);\n        button\.id = 'sl-eg-button';\n        button\.textContent = '🛡️ Enhancers';\n        button\.onclick = openPanel;\n        document\.body\.appendChild\(button\);\n    \}\n")
s,n=create.subn('\n',s,count=1)
if n!=1: raise SystemExit('enhancer createButton block')
s=s.replace('            createButton();\n','')
s=s.replace("            document.getElementById('sl-eg-button')?.remove();\n",'')
# standalone dock open via hidden Hub bridge when there is no visible button
old="function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}if(data.fallback)location.href=data.fallback;}"
new="function openEntry(data){const el=data.selector?document.querySelector(data.selector):null;if(el){el.click();return;}const bridge=document.getElementById('sakalux-module-bridge-'+data.id);if(bridge){bridge.dataset.action='open';bridge.click();return;}if(data.fallback)location.href=data.fallback;}"
s=replace_once(s,old,new,'enhancer dock openEntry')
p.write_text(s,encoding='utf-8')

# Market Intelligence
p=ROOT/'SakaLuX-Market-Intelligence.user.js'
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(^// @version\s+)1\.17\.16(\s*$)',r'\g<1>1.17.17\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('market metadata')
s,n=re.subn(r"const VERSION\s*=\s*['\"]1\.17\.16['\"]","const VERSION = '1.17.17'",s,count=1)
if n!=1: raise SystemExit('market runtime')
s=s.replace("{version:'1.17.16'}","{version:'1.17.17'}",1)
s=s.replace('"selector":"#sl-mi-button",','"selector":"",',1)
s,n=re.subn(r"\n#sl-mi-button\{position:fixed;right:10px;bottom:106px;[^\n]*\}\n",'\n',s,count=1)
if n!=1: raise SystemExit('market button css')
s,n=re.subn(r"\n    function createButton\(\)\{if\(!settings\.enabled\|\|!settings\.showButton\|\|document\.getElementById\('sl-mi-button'\)\)return;const b=document\.createElement\('button'\);b\.id='sl-mi-button';b\.textContent='☠︎ Market';b\.onclick=openSettings;document\.body\.appendChild\(b\);\}\n",'\n',s,count=1)
if n!=1: raise SystemExit('market createButton block')
s=s.replace('injectCss();createButton();startObserver();','injectCss();startObserver();',1)
s=s.replace("removeNodes('#sl-mi-button,#sl-mi-overlay,#sl-mi-hub-prompt');","removeNodes('#sl-mi-overlay,#sl-mi-hub-prompt');",1)
s=replace_once(s,old,new,'market dock openEntry')
p.write_text(s,encoding='utf-8')

# Registry
rp=ROOT/'scripts.json'
data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item['id']=='enhancer':
        item['version']='1.3.29'; item.pop('buttonSelector',None)
    if item['id']=='market-intelligence':
        item['version']='1.17.17'; item.pop('buttonSelector',None)
rp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

# Hub v1.9.30; sync fallback versions and remove buttonSelector for these two.
hp=ROOT/'SakaLuX-Script-Hub.user.js'
h=hp.read_text(encoding='utf-8')
h,n=re.subn(r'(^// @version\s+)1\.9\.29(\s*$)',r'\g<1>1.9.30\2',h,count=1,flags=re.M)
if n!=1: raise SystemExit('hub metadata')
h,n=re.subn(r"const VERSION\s*=\s*'1\.9\.29';","const VERSION = '1.9.30';",h,count=1)
if n!=1: raise SystemExit('hub runtime')
# fallback registry entries
h,n=re.subn(r"(id:\s*'enhancer'[\s\S]{0,400}?version:\s*')1\.3\.28(')",r'\g<1>1.3.29\2',h,count=1)
if n!=1: raise SystemExit('hub enhancer fallback version')
h,n=re.subn(r"(id:\s*'market-intelligence'[\s\S]{0,400}?version:\s*')1\.17\.16(')",r'\g<1>1.17.17\2',h,count=1)
if n!=1: raise SystemExit('hub market fallback version')
h=h.replace("apiGlobal: 'SakaLuXEnhancerGuard', buttonSelector: '#sl-eg-button',","apiGlobal: 'SakaLuXEnhancerGuard',",1)
h=h.replace("apiGlobal: 'SakaLuXMarketIntelligence', buttonSelector: '#sl-mi-button',","apiGlobal: 'SakaLuXMarketIntelligence',",1)
# remove now-unneeded forced hide CSS from 1.9.29
h=re.sub(r'html\[data-sakalux-hub-active="1"\] #sl-eg-button,\nbody\[data-sakalux-hub-active="1"\] #sl-eg-button,\nhtml\[data-sakalux-hub-active="1"\] #sl-mi-button,\nbody\[data-sakalux-hub-active="1"\] #sl-mi-button\{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important\}\n','',h,count=1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.30',
            date: '2026-09-12',
            changes: [
                'Removes the Market Intelligence and Enhancer Guard floating launch buttons from their source scripts entirely.',
                'Hub and standalone access now open those panels through their hidden module bridge/API instead of visible page buttons.',
                'Removes obsolete Market/Enhancer button selectors and the temporary forced-hide CSS.'
            ]
        },
"""
if needle not in h: raise SystemExit('hub changelog anchor')
h=h.replace(needle,entry,1)
hp.write_text(h,encoding='utf-8')

# Docs versions and current release notes
for path,oldv,newv,title in [
    ('greasyfork/Enhancer-Guard.md','1.3.28','1.3.29','Enhancer Guard'),
    ('greasyfork/Market-Intelligence.md','1.17.16','1.17.17','Market Intelligence'),
]:
    fp=ROOT/path; d=fp.read_text(encoding='utf-8')
    d=d.replace(f'## Current version\n**v{oldv}**',f'## Current version\n**v{newv}**',1)
    d=d.replace(f'## Current version\n{oldv}',f'## Current version\n**v{newv}**',1)
    d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',f"## Current release note\n\n**v{newv}** removes the standalone floating launcher button from {title}. The panel remains fully accessible from SakaLuX Script Hub and the standalone SakaLuX dock through the module bridge/API.\n\n## Recommended",d,count=1,flags=re.S)
    fp.write_text(d,encoding='utf-8')

fp=ROOT/'greasyfork/Script-Hub.md'; d=fp.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.29**','## Current version\n**v1.9.30**',1)
d=d.replace('- 🛡️ SakaLuX Enhancer Guard **v1.3.28**','- 🛡️ SakaLuX Enhancer Guard **v1.3.29**')
d=d.replace('- 📈 SakaLuX Market Intelligence **v1.17.16**','- 📈 SakaLuX Market Intelligence **v1.17.17**')
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.30** removes the Market Intelligence and Enhancer Guard floating launchers at source level. Hub and standalone access now use their module bridge/API directly, so no Market or Enhancers button is created on Torn pages.

## Recommended""",d,count=1,flags=re.S)
fp.write_text(d,encoding='utf-8')

print('Removed Market and Enhancer floating launchers completely')
