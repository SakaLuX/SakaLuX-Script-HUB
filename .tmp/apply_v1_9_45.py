from pathlib import Path
import re, json

repo=Path('.')

# Hub 1.9.45
p=repo/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')
s=s.replace('// @version      1.9.44','// @version      1.9.45',1)
s=s.replace("const VERSION = '1.9.44';","const VERSION = '1.9.45';",1)
marker="    const HUB_CHANGELOG = [\n"
entry="""        {
            version: '1.9.45',
            date: '2026-09-16',
            changes: [
                'Moves INFO, NEW, ON/OFF and OPEN/SETTINGS into a compact 2x2 control block on the right side of every managed module card.',
                'Pins the Hub sheet to the top of the available Torn viewport on mobile instead of leaving unused space above it.',
                'Refines Hub Settings switches to smaller, cleaner proportions.',
                'Expands module INFO content with detailed feature descriptions from scripts.json.',
                'Company Intelligence now scrolls as one whole panel and keeps only the SakaLuX author footer at the bottom.'
            ]
        },
"""
if marker in s and "version: '1.9.45'" not in s:s=s.replace(marker,marker+entry,1)
s=re.sub(r"(id:\s*['\"]company-intelligence['\"][\s\S]{0,500}?version:\s*['\"])1\.8\.18(['\"])",r"\g<1>1.8.19\2",s,count=1)
anchor="@media(min-width:700px){#${IDS.overlay}{align-items:center}"
css=r'''
/* v1.9.45 compact PDA layout */
@media(max-width:699px){
#${IDS.overlay}{align-items:flex-start!important;padding:0!important}
#${IDS.panel}{height:100dvh!important;max-height:100dvh!important;border-radius:0 0 18px 18px!important;margin:0!important}
.slh-card{display:grid!important;grid-template-columns:42px minmax(0,1fr) 142px!important;align-items:center!important;column-gap:9px!important;row-gap:4px!important;padding:9px!important;min-height:82px!important}
.slh-card .slh-icon{grid-column:1!important;grid-row:1!important}
.slh-card .slh-card-copy{grid-column:2!important;grid-row:1!important;min-width:0!important}
.slh-card .slh-module-controls{grid-column:3!important;grid-row:1!important;display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-areas:'info toggle' 'new primary'!important;gap:6px!important;min-width:0!important;width:142px!important;margin:0!important;align-self:center!important}
.slh-card .slh-card-tools{display:contents!important}
.slh-card .slh-card-tool.info{grid-area:info!important}
.slh-card .slh-card-tool.new{grid-area:new!important}
.slh-card .slh-switch{grid-area:toggle!important}
.slh-card .slh-primary{grid-area:primary!important}
.slh-card .slh-card-tool,.slh-card .slh-switch,.slh-card .slh-primary{width:100%!important;min-width:0!important;min-height:34px!important;height:34px!important;padding:4px 5px!important;font-size:8px!important;border-radius:9px!important;box-sizing:border-box!important}
.slh-card .slh-switch{justify-content:space-between!important;gap:3px!important}
.slh-card .slh-switch-track{transform:scale(.88)!important;transform-origin:left center!important}
.slh-card-name{font-size:11px!important}.slh-card-meta{gap:4px!important}.slh-chip{font-size:7px!important;padding:3px 5px!important}
.slh-settings .slh-setting{padding:8px 9px!important;margin-bottom:7px!important}
.slh-settings .slh-setting-row{min-height:40px!important;gap:9px!important}
.slh-settings .slh-setting-title{font-size:9px!important}.slh-settings .slh-setting-desc{font-size:8px!important;line-height:1.35!important}
.slh-settings .slh-setting-toggle{width:40px!important;height:22px!important;min-width:40px!important;min-height:22px!important;max-width:40px!important;padding:2px!important;flex:0 0 40px!important}
.slh-settings .slh-setting-toggle i{width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important}
.slh-settings .slh-setting-toggle.on i{transform:translateX(18px)!important}
}
#ci-root{overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;display:block!important;padding:0!important}
#ci-root .ci-shell{display:block!important;max-height:none!important;min-height:100%!important;height:auto!important;overflow:visible!important;margin:0 auto!important}
#ci-root .ci-head{position:sticky!important;top:0!important;z-index:20!important}
#ci-root .ci-tabs{position:sticky!important;top:58px!important;z-index:19!important}
#ci-root .ci-body{overflow:visible!important;min-height:auto!important}
#ci-root .ci-status{display:none!important}
#ci-root .ci-footer,#ci-root .ci-shell>.sakalux-stable-module-footer{position:relative!important;bottom:auto!important;width:100%!important;box-sizing:border-box!important}
'''
if anchor not in s:raise SystemExit('Hub desktop media anchor missing')
if 'v1.9.45 compact PDA layout' not in s:s=s.replace(anchor,css+'\n'+anchor,1)
p.write_text(s,encoding='utf-8')

# Company 1.8.19
cp=repo/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
c=cp.read_text(encoding='utf-8')
c=c.replace('// @version      1.8.18','// @version      1.8.19',1)
c=c.replace("version:'1.8.18'","version:'1.8.19'",1)
c=re.sub(r'\s*<div class="ci-status">[\s\S]*?</div>','',c,count=1)
ca='.ci-footer a{color:#d7a94a;text-decoration:none;font-weight:900}'
cc=r'''#ci-root{overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;display:block!important;padding:0!important}#ci-root .ci-shell{display:block!important;width:min(1180px,100%)!important;max-height:none!important;min-height:100%!important;overflow:visible!important;margin:0 auto!important}#ci-root .ci-head{position:sticky!important;top:0!important;z-index:20!important}#ci-root .ci-tabs{position:sticky!important;top:58px!important;z-index:19!important}#ci-root .ci-body{overflow:visible!important}#ci-root .ci-status{display:none!important}#ci-root .ci-footer{position:relative!important;bottom:auto!important;width:100%!important;box-sizing:border-box!important}'''
if ca not in c:raise SystemExit('Company CSS anchor missing')
if '#ci-root .ci-status{display:none!important}' not in c:c=c.replace(ca,ca+cc,1)
cp.write_text(c,encoding='utf-8')

# Detailed registry info
rp=repo/'scripts.json';data=json.loads(rp.read_text(encoding='utf-8'))
infos={
'enhancer':"Enhancer Guard is the inventory-safety module for SakaLuX. It reads your Torn inventory through the configured API key, identifies Enhancer-related items, shows counts and status, and lets you protect important items from accidental sale through local protection rules. It exposes health/version state to Script Hub, supports refresh and hard-refresh actions, and includes dedicated API-key setup and TornPDA-friendly controls. It is informational and protective; it does not automate item sales or gameplay actions.",
'bazaar':"Bazaar Thanker is a Bazaar management and customer-history module. It groups buyers from Bazaar sales, prepares reusable thank-you messages, keeps local buyer history and statistics, highlights larger or repeat buyers, and provides quick access to relevant Bazaar and event information. It is designed for TornPDA and desktop userscript managers, stores working data locally, and can be configured directly from Script Hub. Its core thank-you workflow does not require a Torn API key.",
'mission-rewards':"Mission Rewards enhances Torn's Mission Shop with decision-support information. It calculates estimated market value and value per mission credit, shows reward context, tracks ammunition ownership, and helps identify weapon mods and other rewards you already own. It can use the shared Script Hub API key and refresh from the Hub while keeping normal Mission Shop interactions manual.",
'market-intelligence':"Market Intelligence is the trading and travel analysis module. It provides Item Market price intelligence, comparisons and signals, Bazaar-flip support, loadout comparison, travel-profit tools, route and basket analysis, and API-access diagnostics. Market panels are scoped to relevant Torn pages and travel tools to travel pages. It is TornPDA-first and provides decision support rather than automated buying or selling.",
'elimination-assistant':"Elimination Assistant is a combat-target advisor for Torn Eliminations. It combines Torn data with optional FFScouter information, loads large teams in rotating batches of up to 500 players, tracks availability, supports SAFE/RISKY filtering, calibration, FF scans, TornPDA export and PC-safe attack routing. It can test or create the required Torn API key, remembers relevant settings locally, and helps open targets without automatically attacking them.",
'company-intelligence':"Company Intelligence provides separate Employee and Director views for company analysis. Employee tools cover work stats, position suitability, personal progress, trains, offers and advice. Director tools cover star and growth direction, staff effectiveness and inactivity flags, position optimization, training commitments, train contracts, payroll and balance views, stock intelligence, benchmarks, timeline/history and advisory insights. It uses Torn company/user API data where permitted, supports the shared Script Hub API key, stores planning data locally, and never performs automated company actions."
}
for item in data['scripts']:
    if item['id'] in infos:item['info']=infos[item['id']]
    if item['id']=='company-intelligence':
        item['version']='1.8.19';item['release']={'version':'1.8.19','date':'2026-09-16','notes':['Whole-panel scrolling on mobile: swipe from anywhere inside Company Intelligence.','Removed the Updated / Hub / no automated company actions status line from the visible panel.','Keeps only the Made with ❤️ by SakaLuX author footer at the bottom.']}
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Docs
hd=repo/'greasyfork/Script-Hub.md';d=hd.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.44**','## Current version\n**v1.9.45**',1)
d=re.sub(r'(## Current release note\s*\n+)\*\*v1\.9\.44\*\*[^\n]*',r'\1**v1.9.45** Compact right-side module controls, top-aligned mobile Hub, refined Settings switches, detailed INFO content and Company whole-panel scrolling.',d,count=1)
h='## Release history\n';e='''### v1.9.45 — Compact module cards and detailed INFO\n\n- Moves INFO, NEW, ON/OFF and OPEN/SETTINGS into a compact 2x2 block on the right side of each managed module card.\n- Aligns the Hub panel with the top of the available Torn viewport on mobile.\n- Refines Settings switches to smaller proportions.\n- Expands per-module INFO content in `scripts.json`.\n- Updates Company Intelligence integration for whole-panel scrolling and a simplified footer.\n\n'''
if h in d and '### v1.9.45 ' not in d:d=d.replace(h,h+e,1)
d=d.replace('SakaLuX Company Intelligence **v1.8.18**','SakaLuX Company Intelligence **v1.8.19**');hd.write_text(d,encoding='utf-8')

cd=repo/'greasyfork/Company-Intelligence.md';x=cd.read_text(encoding='utf-8')
x=x.replace('## Current version\n**v1.8.18**','## Current version\n**v1.8.19**',1)
x=re.sub(r'(## Current release note\s*\n+)\*\*v1\.8\.18\*\*[^\n]*',r'\1**v1.8.19** Whole-panel mobile scrolling, simplified visible footer and removal of the status timestamp line.',x,count=1)
e2='''### v1.8.19 — Whole-panel mobile scrolling\n\n- The entire Company Intelligence panel is now the scroll surface on mobile.\n- Removed the visible `Updated … · SakaLuX Script Hub · no automated company actions` status line.\n- Keeps the `Made with ❤️ by SakaLuX [2380374]` footer as the only bottom attribution line.\n\n'''
if h in x and '### v1.8.19 ' not in x:x=x.replace(h,h+e2,1)
cd.write_text(x,encoding='utf-8')
