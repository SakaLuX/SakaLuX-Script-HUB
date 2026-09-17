from pathlib import Path
import json,re

# HUB
hubp=Path('SakaLuX-Script-Hub.user.js')
h=hubp.read_text(encoding='utf-8')
h=h.replace('// @version      1.9.64','// @version      1.9.65',1)
h=h.replace("const VERSION = '1.9.64';","const VERSION = '1.9.65';",1)
old="{version:'1.9.64',date:'2026-09-17',changes:['Restores Hub launch controls defensively when Torn replaces native topbar/mobile navigation nodes.','Adds explicit Stock Manager POWER action to the Hub registry/fallback in addition to the generic ON/OFF switch.']},"
new="{version:'1.9.65',date:'2026-09-17',changes:['Keeps the floating Hub launcher visible whenever Torn/TornPDA leaves a native launcher mounted but not actually visible.','Makes launcher visibility checks use computed style and on-screen geometry instead of DOM presence only.','Synchronizes Stock Manager v0.7.9 panel/footer integration.']},\n        "+old
if old in h and "version:'1.9.65'" not in h:
    h=h.replace(old,new,1)

pat=re.compile(r"    function syncFloatingButtonVisibility\(\) \{[\s\S]*?\n    \}\n\n    let launcherRepairTimer",re.M)
replacement="""    function isActuallyVisible(element) {
        if (!element || !element.isConnected) return false;
        try {
            const cs = getComputedStyle(element);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.01) return false;
            const r = element.getBoundingClientRect();
            return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
        } catch { return false; }
    }

    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const top = document.getElementById(IDS.topSkull);
        const nav = document.getElementById(IDS.navSkull);
        const nativeVisible = settings.showTopbarSkull && (isActuallyVisible(top) || isActuallyVisible(nav));
        button.style.setProperty('display', nativeVisible ? 'none' : 'flex', 'important');
        button.style.setProperty('visibility', 'visible', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('pointer-events', 'auto', 'important');
    }

    let launcherRepairTimer"""
if not pat.search(h):
    raise SystemExit('Hub syncFloatingButtonVisibility block not found')
h=pat.sub(replacement,h,count=1)

# Stock fallback version/release inside Hub
h=h.replace('"version": "0.7.7"\n            }','"version": "0.7.9"\n            }',1)
# safer update release version 0.7.8 in stock fallback if nearby
stock_idx=h.find('"id": "stock-manager-advisor"')
if stock_idx>=0:
    end=h.find('\n            }\n        ]',stock_idx)
    if end<0: end=min(len(h),stock_idx+6000)
    block=h[stock_idx:end]
    block=block.replace('"version": "0.7.8"','"version": "0.7.9"')
    h=h[:stock_idx]+block+h[end:]
hubp.write_text(h,encoding='utf-8')

# STOCKS
sp=Path('SakaLuX-Stock-Manager-Advisor.user.js')
s=sp.read_text(encoding='utf-8')
s=s.replace('// @version      0.7.8','// @version      0.7.9',1)
s=s.replace("version: '0.7.8',","version: '0.7.9',",1)

# Add native stable author footer to full panel
needle='      <div id="slx-stock-status">Ready · open from Script Hub or Stock Manager.</div>\n    </div></div>`;'
repl='      <div id="slx-stock-status">Ready · open from Script Hub or Stock Manager.</div>\n    </div><div class="slx-stock-footer">Made with ❤️ by <a href="${APP.profile}" target="_self">SakaLuX [2380374]</a></div></div>`;'
if needle not in s:
    raise SystemExit('Stocks panel footer insertion point not found')
s=s.replace(needle,repl,1)

# Add final geometry override after base stock style so older rules cannot win.
css_append=r'''
    s.textContent += `
/* v0.7.9 shared SakaLuX full-sheet geometry */
#slx-stock-panel{box-sizing:border-box!important;align-items:flex-start!important;justify-content:center!important;overflow:hidden!important;padding:4px 4px 36px!important}
#slx-stock-panel .card{display:flex!important;flex-direction:column!important;width:min(780px,100%)!important;height:calc(100dvh - 40px)!important;max-height:calc(100dvh - 40px)!important;min-height:0!important;margin:0 auto!important;border-radius:14px!important;overflow:hidden!important}
#slx-stock-panel .head{flex:0 0 auto!important}
#slx-stock-panel .body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important}
#slx-stock-panel .slx-stock-footer{flex:0 0 44px!important;min-height:44px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important;padding:10px 12px!important;border-top:1px solid rgba(142,170,201,.22)!important;background:#0b1118!important;color:#b7c5d4!important;font:800 11px/1.2 Inter,Arial,sans-serif!important;white-space:nowrap!important;visibility:visible!important;opacity:1!important;overflow:visible!important}
#slx-stock-panel .slx-stock-footer a{color:#e7a34b!important;text-decoration:none!important;font-weight:900!important;margin-left:4px!important}
@media(max-width:700px){
  #slx-stock-panel{padding:0 4px 36px!important;background:rgba(3,7,11,.84)!important}
  #slx-stock-panel .card{width:100%!important;height:calc(100dvh - 36px)!important;max-height:calc(100dvh - 36px)!important;border-radius:14px 14px 0 0!important}
  #slx-stock-panel .head{padding:11px 12px!important}
  #slx-stock-panel .body{padding:9px!important;gap:8px!important}
  #slx-stock-panel .slx-stock-footer{flex-basis:42px!important;min-height:42px!important;padding:9px 8px!important}
}
`;
'''
append_marker='`;\n    (document.head||document.documentElement).appendChild(s);\n  }'
if append_marker not in s:
    raise SystemExit('Stocks base style append point not found')
s=s.replace(append_marker,'`;\n'+css_append+'    (document.head||document.documentElement).appendChild(s);\n  }',1)
sp.write_text(s,encoding='utf-8')

# REGISTRY
rp=Path('scripts.json')
data=json.loads(rp.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item.get('id')=='stock-manager-advisor':
        item['version']='0.7.9'
        item['release']={
            'version':'0.7.9','date':'2026-09-17','notes':[
                'Matches the shared SakaLuX full-sheet panel geometry used by the other managed modules.',
                'Makes the full Stocks panel body scroll independently while header and author footer stay visible.',
                'Adds a stable Made with ❤️ by SakaLuX [2380374] footer at the bottom of the panel.'
            ]
        }
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# STOCK DOC
mdp=Path('greasyfork/Stock-Manager-Advisor.md')
md=mdp.read_text(encoding='utf-8')
md=md.replace('**v0.7.8**','**v0.7.9**',2)
current_note=re.search(r'(## Current release note\s*\n\s*\*\*v0\.7\.9\*\*)([^\n]*)',md,re.I)
if current_note:
    md=md[:current_note.start()]+current_note.group(1)+' Uses the shared SakaLuX full-sheet panel geometry, keeps the content as the scrollable area, and adds a stable Made with ❤️ by SakaLuX [2380374] footer at the bottom.'+md[current_note.end():]
if '### v0.7.9 ' not in md:
    md=md.replace('## Changelog\n\n','## Changelog\n\n### v0.7.9 — Shared panel geometry and stable footer\n\n- Matches the full-sheet shape used by the other SakaLuX managed modules.\n- Keeps the panel header and author footer visible while the body scrolls independently.\n- Adds `Made with ❤️ by SakaLuX [2380374]` as the stable bottom footer.\n\n',1)
mdp.write_text(md,encoding='utf-8')

# HUB DOC
hmdp=Path('greasyfork/Script-Hub.md')
hmd=hmdp.read_text(encoding='utf-8')
hmd=hmd.replace('**v1.9.64**','**v1.9.65**',2)
hmd=hmd.replace('- 📊 SakaLuX Stock Manager & Advisor **v0.7.8**','- 📊 SakaLuX Stock Manager & Advisor **v0.7.9**',1)
m=re.search(r'(## Current release note\s*\n\s*\*\*v1\.9\.65\*\*)([^\n]*)',hmd,re.I)
if m:
    hmd=hmd[:m.start()]+m.group(1)+' Keeps a guaranteed Hub fallback launcher whenever native Torn/TornPDA launch controls are mounted but not actually visible, and synchronizes Stock Manager v0.7.9 panel/footer integration.'+hmd[m.end():]
if '### v1.9.65 ' not in hmd:
    hmd=hmd.replace('## Release history / Changelog\n\n','## Release history / Changelog\n\n### v1.9.65 — Visible launcher fallback + Stocks panel parity\n- Detects real launcher visibility with computed style and viewport geometry.\n- Keeps the floating Hub button available whenever native launchers are hidden, clipped or off-screen.\n- Synchronizes Stock Manager v0.7.9 with the shared full-sheet panel/footer layout.\n\n',1)
hmdp.write_text(hmd,encoding='utf-8')

# VALIDATOR: Stocks now intentionally uses GitHub source + Greasy Fork install/meta.
vp=Path('.github/workflows/validate-userscripts.yml')
v=vp.read_text(encoding='utf-8')
oldv="""          url = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js'\n          assert stock['sourceUrl'] == stock['downloadUrl'] == stock['metaUrl'] == url\n          assert url in source and stock['apiGlobal'] in source\n"""
newv="""          source_url = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js'\n          download_url = 'https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.user.js'\n          meta_url = 'https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js'\n          assert stock['sourceUrl'] == source_url\n          assert stock['downloadUrl'] == download_url\n          assert stock['metaUrl'] == meta_url\n          assert download_url in source and meta_url in source and stock['apiGlobal'] in source\n"""
if oldv not in v:
    raise SystemExit('Validator Stocks distribution block not found')
v=v.replace(oldv,newv,1)
vp.write_text(v,encoding='utf-8')

print('patched hub 1.9.65 + stocks 0.7.9 + registry/docs/validator')
