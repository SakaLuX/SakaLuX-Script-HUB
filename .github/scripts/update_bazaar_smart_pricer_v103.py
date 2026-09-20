#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGELOG=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
HUB=ROOT/'greasyfork'/'Script-Hub.md'
RELEASE=ROOT/'releases'/'bazaar-smart-pricer-v1.0.3.md'

s=SCRIPT.read_text()
s=s.replace('// @version      1.0.2','// @version      1.0.3',1)
s=s.replace("const VERSION='1.0.2';","const VERSION='1.0.3';",1)

old_css=".${PREFIX}-rowbtn{margin-left:6px;border:1px solid #49627e;background:#18283a;color:#fff;border-radius:8px;padding:4px 7px;font:800 10px Arial,sans-serif;white-space:nowrap}"
new_css=".${PREFIX}-rowbtn-wrap{display:flex;align-items:center;justify-content:center;flex:0 0 34px;width:34px;min-width:34px;margin:0 5px 0 3px;box-sizing:border-box;z-index:12}. ${PREFIX}-noop{}\n.${PREFIX}-rowbtn{width:30px;height:30px;min-width:30px;display:inline-flex;align-items:center;justify-content:center;border:0;background:#7a6bd6;color:#fff;border-radius:9px;padding:0;font:900 22px/1 Arial,sans-serif;box-shadow:0 2px 7px rgba(0,0,0,.25);cursor:pointer}. ${PREFIX}-noop2{}\n.${PREFIX}-rowbtn:disabled{opacity:.32;cursor:not-allowed;box-shadow:none}"
# remove the harmless selector-spacing sentinels immediately after substitution
new_css=new_css.replace('. ${PREFIX}-noop{}\\n','').replace('. ${PREFIX}-noop2{}\\n','')
if old_css not in s: raise SystemExit('row button css anchor missing')
s=s.replace(old_css,new_css,1)

old_decor="""  function decorateRows(){
    if(!settings.autoDecorate||!onBazaar())return;
    for(const e of findRows()){
      if(qs('.'+PREFIX+'-rowbtn',e.row))continue;
      const b=document.createElement('button');b.type='button';b.className=PREFIX+'-rowbtn';b.textContent='S PRICE';b.title='Price this item with SakaLuX Bazaar Smart Pricer';
      b.onclick=ev=>{ev.preventDefault();ev.stopPropagation();if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}priceEntry(e);};
      (e.input.parentElement||e.row).appendChild(b);
    }
  }
"""
new_decor="""  function decorateRows(){
    if(!settings.autoDecorate||!onBazaar())return;
    for(const e of findRows()){
      let old=qs('.'+PREFIX+'-rowbtn-wrap',e.row)||qs('.'+PREFIX+'-rowbtn',e.row);
      if(old&&old.dataset?.placement==='before-qty')continue;
      if(old){const target=old.classList?.contains(PREFIX+'-rowbtn-wrap')?old:old.parentElement?.classList?.contains(PREFIX+'-rowbtn-wrap')?old.parentElement:old;target?.remove();}

      const qtyEl=e.qty?.input||null;
      let amountWrap=qtyEl?.closest?.('div[class*="amount___"], .amount-main-wrap, [class*="amount"], [class*="quantity"], [class*="qty"]')||null;
      if(!amountWrap&&qtyEl)amountWrap=qtyEl.parentElement;
      const priceWrap=e.input?.closest?.('div[class*="price___"], div.price, [class*="price"]')||e.input?.parentElement||null;
      const parent=amountWrap?.parentElement||priceWrap?.parentElement||e.row;
      const before=amountWrap&&amountWrap.parentElement===parent?amountWrap:(priceWrap&&priceWrap.parentElement===parent?priceWrap:null);
      if(!parent)continue;

      const wrap=document.createElement('div');wrap.className=PREFIX+'-rowbtn-wrap';wrap.dataset.placement='before-qty';
      const b=document.createElement('button');b.type='button';b.className=PREFIX+'-rowbtn';b.textContent='+';b.dataset.placement='before-qty';
      const reason=skipReason(e);
      if(reason){b.disabled=true;b.title=`Skipped automatically: ${reason}`;b.setAttribute('aria-label',b.title);}else{
        b.title='Fill full quantity and smart price';b.setAttribute('aria-label',b.title);
        b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}b.disabled=true;try{await priceEntry(e);}finally{b.disabled=false;}};
      }
      wrap.appendChild(b);parent.insertBefore(wrap,before);
    }
  }
"""
if old_decor not in s: raise SystemExit('decorateRows anchor missing')
s=s.replace(old_decor,new_decor,1)

s=s.replace('Add S PRICE button beside detected Bazaar price fields','Add + button before Qty (fills full quantity + price)',1)

# Remove stale old per-row buttons once when scanning, then let decorateRows rebuild correctly.
old_scan="function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();qs('#'+PREFIX+'-addbar')?.remove();return;}injectLauncher();injectAddItemsQuickFill();if(settings.autoDecorate)decorateRows();state.lastScan=Date.now();if(force)refreshStatus();}"
new_scan="function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();qs('#'+PREFIX+'-addbar')?.remove();qsa('.'+PREFIX+'-rowbtn-wrap, .'+PREFIX+'-rowbtn').forEach(x=>x.remove());return;}injectLauncher();injectAddItemsQuickFill();if(settings.autoDecorate)decorateRows();else qsa('.'+PREFIX+'-rowbtn-wrap, .'+PREFIX+'-rowbtn').forEach(x=>x.remove());state.lastScan=Date.now();if(force)refreshStatus();}"
if old_scan not in s: raise SystemExit('scan anchor missing')
s=s.replace(old_scan,new_scan,1)

SCRIPT.write_text(s)

data=json.loads(REG.read_text())
entry=next((x for x in data.get('scripts',[]) if x.get('id')=='bazaar-smart-pricer'),None)
if not entry: raise SystemExit('registry entry missing')
entry['version']='1.0.3'
entry['detailsRevision']=max(3,int(entry.get('detailsRevision',1))+1)
entry['info']='Purpose\nBazaar Smart Pricer prices Torn Bazaar sale fields using Torn market value, the lowest current item-market listing or a configurable undercut. It supports both add-item and manage/reprice workflows.\n\nAdd Items workflow\nEach sellable item gets a compact + button immediately before Qty. Pressing + fills the full visible stack quantity and the calculated price for that item. The bulk S QUICK FILL action remains available for all visible items. RW weapons and bonus items can be skipped automatically from Settings.\n\nSafety\nSkip Ranked War (RW) weapons and Skip items / weapons with bonus icons are enabled by default so special weapons are not priced from the ordinary base-item market value.\n\nAPI and storage\nRequires a Torn read-only/public API key. The key and settings are stored locally and requests go only to api.torn.com.'
entry['release']={'version':'1.0.3','date':'2026-09-20','notes':['Moves the per-item pricing control from the far-right price area to a compact + button immediately before Qty.','The + button fills the full available quantity and the calculated price for that one item.','Removes stale right-side S PRICE controls so they can no longer overflow off-screen on TornPDA/mobile.','RW/bonus skip settings remain enabled by default; skipped special items show a disabled + control.']}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGELOG.exists():
    t=CHANGELOG.read_text()
    block='## v1.0.3 — 2026-09-20\n- Replaced right-side **S PRICE** controls with compact **+** buttons placed immediately before **Qty**.\n- Per-item **+** fills the full visible stack quantity and smart price together.\n- Removes legacy right-edge controls that could overflow outside the mobile viewport.\n- RW/bonus items remain protected by the skip settings and show a disabled per-item control when skipped.\n\n'
    if '## v1.0.3 — 2026-09-20' not in t:
        t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGELOG.write_text(t)
if GF.exists():
    t=GF.read_text().replace('**v1.0.2**','**v1.0.3**',1)
    if '### v1.0.3' not in t:t+='\n### v1.0.3 — Per-item + before Qty\n- Per-item control is now a compact **+** immediately before Qty.\n- Pressing it fills full quantity + smart price.\n- Old right-side buttons are removed to prevent mobile overflow.\n- RW/bonus skip protection remains enabled by default.\n'
    GF.write_text(t)
if HUB.exists():HUB.write_text(HUB.read_text().replace('SakaLuX Bazaar Smart Pricer **v1.0.2**','SakaLuX Bazaar Smart Pricer **v1.0.3**'))
RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text('# SakaLuX Bazaar Smart Pricer v1.0.3\n\nRelease date: **2026-09-20**\n\n## Mobile Add Items UI\n- Replaces the overflowing right-side per-item buttons with a compact **+** placed immediately before **Qty**.\n- The **+** fills the item’s full visible stack quantity and calculated price in one tap.\n- The bulk **S QUICK FILL** remains available.\n- RW weapons and bonus items remain skipped by default; their per-item + is disabled.\n\n## Validation\n- `node --check SakaLuX-Bazaar-Smart-Pricer.user.js`\n- `python3 -m json.tool scripts.json`\n')
print('Bazaar Smart Pricer v1.0.3 synchronized.')
