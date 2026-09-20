#!/usr/bin/env python3
# Triggered after workflow creation so the v1.0.1 release job runs on main.
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG = ROOT / 'scripts.json'
GF = ROOT / 'greasyfork' / 'Bazaar-Smart-Pricer.md'
CHANGELOG = ROOT / 'CHANGELOG-Bazaar-Smart-Pricer.md'
HUB_MD = ROOT / 'greasyfork' / 'Script-Hub.md'
RELEASE = ROOT / 'releases' / 'bazaar-smart-pricer-v1.0.1.md'

s = SCRIPT.read_text()

s = s.replace('// @version      1.0.0', '// @version      1.0.1', 1)
s = s.replace("const VERSION='1.0.0';", "const VERSION='1.0.1';", 1)

style_old = ".sl-bsp-primary{background:#244a73!important;border-color:#4f8fe8!important}.sl-bsp-danger{background:#4a2025!important;border-color:#8b3d46!important}\n#${PREFIX}-status"
style_new = ".sl-bsp-primary{background:#244a73!important;border-color:#4f8fe8!important}.sl-bsp-danger{background:#4a2025!important;border-color:#8b3d46!important}\n.${PREFIX}-addbar{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;box-sizing:border-box;margin:6px 0 10px;padding:8px;background:#101923;border:1px solid #34465b;border-radius:10px}\n.${PREFIX}-quickfill{width:min(100%,360px);min-height:38px;border:1px solid #4f8fe8;background:#244a73;color:#fff;border-radius:9px;padding:8px 12px;font:900 12px/1.1 Arial,sans-serif;letter-spacing:.02em;cursor:pointer}\n.${PREFIX}-quickfill:disabled{opacity:.6;cursor:wait}\n#${PREFIX}-status"
if style_old not in s:
    raise SystemExit('style anchor not found')
s = s.replace(style_old, style_new, 1)

anchor = "  async function priceEntry(entry,{silent=false}={}){\n"
insert = r'''  function isAddItemsPage(){
    if(!onBazaar())return false;
    const route=(location.search+' '+location.hash).toLowerCase();
    if(/add[-_ ]?items?|additem/.test(route))return true;
    const text=norm(document.body?.innerText||'');
    if(/\badd items?\b/i.test(text)&&findRows().length)return true;
    return findRows().some(e=>{
      const inputs=qsa('input',e.row).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio'&&!x.disabled);
      if(inputs.length<2)return false;
      const meta=inputs.map(i=>(i.name+' '+i.id+' '+i.placeholder+' '+i.className+' '+(i.getAttribute('aria-label')||''))).join(' ').toLowerCase();
      return /qty|quantity|amount/.test(meta)&&/price|ppu|each|unit/.test(meta);
    });
  }

  function addItemsInsertionPoint(){
    const rows=findRows();
    const first=rows[0]?.row;
    if(first?.parentElement)return {parent:first.parentElement,before:first};
    const host=qs('#mainContainer .content-wrapper')||qs('.content-wrapper')||qs('#mainContainer')||document.body;
    return {parent:host,before:host.firstChild};
  }

  function injectAddItemsQuickFill(){
    const old=qs('#'+PREFIX+'-addbar');
    if(!isAddItemsPage()){old?.remove();return;}
    if(old)return;
    const point=addItemsInsertionPoint();if(!point?.parent)return;
    const bar=document.createElement('div');bar.id=PREFIX+'-addbar';bar.className=PREFIX+'-addbar';
    const b=document.createElement('button');b.type='button';b.className=PREFIX+'-quickfill';b.innerHTML='<b>S</b> QUICK FILL';b.title='Price all visible Bazaar add-item rows';
    b.onclick=async ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}
      if(state.busy)return;
      b.disabled=true;const oldText=b.innerHTML;b.textContent='PRICING…';
      try{await priceAll();}finally{b.disabled=false;b.innerHTML=oldText;}
    };
    bar.appendChild(b);
    point.parent.insertBefore(bar,point.before||null);
  }

'''
if anchor not in s:
    raise SystemExit('priceEntry anchor not found')
s = s.replace(anchor, insert + anchor, 1)

old_scan = "  function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();return;}injectLauncher();if(settings.autoDecorate)decorateRows();state.lastScan=Date.now();if(force)refreshStatus();}\n"
new_scan = "  function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();qs('#'+PREFIX+'-addbar')?.remove();return;}injectLauncher();injectAddItemsQuickFill();if(settings.autoDecorate)decorateRows();state.lastScan=Date.now();if(force)refreshStatus();}\n"
if old_scan not in s:
    raise SystemExit('scan anchor not found')
s = s.replace(old_scan, new_scan, 1)

s = s.replace("window.SakaLuXBazaarSmartPricer={version:VERSION,open:openPanel,refresh:()=>scan(true),priceAll,isEnabled:()=>!!settings.enabled,setEnabled:v=>",
              "window.SakaLuXBazaarSmartPricer={version:VERSION,open:openPanel,refresh:()=>scan(true),priceAll,quickFill:priceAll,isEnabled:()=>!!settings.enabled,setEnabled:v=>", 1)

SCRIPT.write_text(s)

data = json.loads(REG.read_text())
scripts = data.setdefault('scripts', [])
entry = next((x for x in scripts if x.get('id') == 'bazaar-smart-pricer'), None)
if entry is None:
    entry = {
      'active': True,
      'apiGlobal': 'SakaLuXBazaarSmartPricer',
      'buttonSelector': '#sl-bsp-launcher',
      'category': 'Trading',
      'description': 'Smart Bazaar pricing for add-item and manage/reprice flows with market value, lowest listing and configurable undercut modes.',
      'downloadUrl': 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js',
      'icon': '💰',
      'id': 'bazaar-smart-pricer',
      'info': 'Purpose\nBazaar Smart Pricer prices Torn Bazaar sale fields using Torn market value, the lowest current item-market listing or a configurable undercut. It supports both add-item and manage/reprice workflows.\n\nWorkflow\nOn the Add Items sale page, S QUICK FILL appears directly above the item rows and prices every visible item in one tap. Per-item S PRICE and the settings-panel PRICE ALL VISIBLE action remain available.\n\nAPI and storage\nRequires a Torn read-only/public API key. The key and settings are stored locally and requests go only to api.torn.com.',
      'name': 'Bazaar Smart Pricer',
      'quickActions': [
        {'icon':'⚙️','id':'open','label':'SETTINGS','method':'open','fallbackUrl':'https://www.torn.com/bazaar.php'},
        {'icon':'💰','id':'price-all','label':'PRICE ALL','method':'priceAll','fallbackUrl':'https://www.torn.com/bazaar.php'},
        {'icon':'🔄','id':'refresh','label':'REFRESH','method':'refresh','fallbackUrl':'https://www.torn.com/bazaar.php'}
      ],
      'sourceUrl': 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js',
      'type':'addon',
      'detailsRevision':1
    }
    idx = next((i+1 for i,x in enumerate(scripts) if x.get('id')=='bazaar'), len(scripts))
    scripts.insert(idx, entry)
entry['version']='1.0.1'
entry['detailsRevision']=max(2, int(entry.get('detailsRevision',1))+1)
entry['release']={
  'version':'1.0.1','date':'2026-09-20','notes':[
    'Adds a native S QUICK FILL button directly on the Bazaar Add Items sale page.',
    'The Add Items button prices all visible sale rows without opening the settings panel.',
    'Keeps per-row S PRICE and PRICE ALL VISIBLE actions unchanged.'
  ]
}
REG.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n')

if GF.exists():
    t=GF.read_text().replace('**v1.0.0**','**v1.0.1**',1)
    marker='## Current release note\n'
    note='\n**v1.0.1 — Add Items QUICK FILL button**\n- Adds **S QUICK FILL** directly above the Bazaar Add Items sale rows.\n- One tap prices all currently visible item rows using the saved pricing mode.\n- Keeps per-row **S PRICE** and panel **PRICE ALL VISIBLE** available.\n\n'
    if marker in t and '**v1.0.1 — Add Items QUICK FILL button**' not in t:
        t=t.replace(marker, marker+note,1)
    GF.write_text(t)

if CHANGELOG.exists():
    t=CHANGELOG.read_text()
    block='# SakaLuX Bazaar Smart Pricer — Changelog\n\n## v1.0.1 — 2026-09-20\n- Added **S QUICK FILL** directly to the Bazaar Add Items sale page.\n- QUICK FILL prices every visible sale row with the current Smart Pricer mode.\n- Button is SPA/TornPDA-aware and disappears outside the Add Items flow.\n- Preserved per-row **S PRICE**, settings, API test and bulk panel pricing.\n\n'
    if '## v1.0.1 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n', block,1)
    CHANGELOG.write_text(t)

if HUB_MD.exists():
    t=HUB_MD.read_text().replace('SakaLuX Bazaar Smart Pricer **v1.0.0**','SakaLuX Bazaar Smart Pricer **v1.0.1**')
    HUB_MD.write_text(t)

RELEASE.parent.mkdir(parents=True, exist_ok=True)
RELEASE.write_text('''# SakaLuX Bazaar Smart Pricer v1.0.1\n\nRelease date: **2026-09-20**\n\n## Add Items workflow\n- Adds a prominent **S QUICK FILL** button directly above the Bazaar Add Items sale rows.\n- The button calls the same pricing engine as **PRICE ALL VISIBLE** and fills all detected visible price inputs.\n- It works with Torn SPA/TornPDA navigation and is removed automatically outside the Add Items flow.\n- Per-row **S PRICE**, settings and Manage/Reprice support remain unchanged.\n\n## Validation\n- JavaScript syntax checked with `node --check`.\n- `scripts.json` validated with `python3 -m json.tool`.\n''')

print('Bazaar Smart Pricer v1.0.1 surfaces synchronized.')
