#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGELOG=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
HUB_MD=ROOT/'greasyfork'/'Script-Hub.md'
RELEASE=ROOT/'releases'/'bazaar-smart-pricer-v1.0.2.md'

s=SCRIPT.read_text()
s=s.replace('// @version      1.0.1','// @version      1.0.2',1)
s=s.replace("const VERSION='1.0.1';","const VERSION='1.0.2';",1)

# New safety settings, enabled by default.
s=s.replace("    autoDecorate:get('autoDecorate',true),\n    cacheMinutes:Number(get('cacheMinutes',5))||5",
            "    autoDecorate:get('autoDecorate',true),\n    skipRwWeapons:get('skipRwWeapons',true),\n    skipBonusItems:get('skipBonusItems',true),\n    cacheMinutes:Number(get('cacheMinutes',5))||5",1)

# Replace the old pill launcher with a compact circular + bubble.
s=s.replace("#${PREFIX}-launcher{position:fixed;right:12px;bottom:104px;z-index:2147482500;border:1px solid #50637a;background:#101923;color:#fff;border-radius:14px;padding:9px 12px;font:800 12px/1.2 Arial,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.4);cursor:pointer}\n#${PREFIX}-launcher b{color:#dfbd61}",
            "#${PREFIX}-launcher{position:fixed;right:10px;bottom:104px;z-index:2147482500;width:52px;height:52px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.2);background:#7a6bd6;color:#fff;border-radius:50%;padding:0;font:900 30px/1 Arial,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.35);cursor:pointer;overflow:hidden}\n#${PREFIX}-launcher:active{transform:scale(.96)}",1)
s=s.replace("@media(max-width:700px){#${PREFIX}-launcher{right:8px;bottom:92px}.sl-bsp-row{grid-template-columns:1fr}.sl-bsp-actions{grid-template-columns:1fr}}",
            "@media(max-width:700px){#${PREFIX}-launcher{right:8px;bottom:92px;width:48px;height:48px;font-size:28px}.sl-bsp-row{grid-template-columns:1fr}.sl-bsp-actions{grid-template-columns:1fr}}",1)

# Detect ranked-war / bonus items from Torn's bonus attachment icons and rarity glow.
anchor="  function pickQuantityControl(row){\n"
if 'function bonusInfo(row)' not in s:
    insert=r'''  function bonusInfo(row){
    const icons=qsa('ul.bonuses-wrap li.bonus i[class*="bonus-attachment-"], i[class*="bonus-attachment-"]',row)
      .filter(i=>!String(i.className||'').includes('blank-bonus'));
    const names=icons.map(i=>{const m=String(i.className||'').match(/bonus-attachment-([a-z0-9-]+)/i);return m?.[1]||'bonus';});
    const rarity=!!row.querySelector('div.image-wrap[class*="glow-"], [class*="glow-yellow"], [class*="glow-orange"], [class*="glow-red"]');
    const bonusWrap=!!row.querySelector('ul.bonuses-wrap li.bonus:not(.blank-bonus), [class*="bonuses"] [class*="bonus"]');
    return {hasBonus:icons.length>0||bonusWrap,isRw:icons.length>0||rarity,names};
  }

  function skipReason(entry){
    const info=bonusInfo(entry.row);
    if(settings.skipRwWeapons&&info.isRw)return 'RW weapon';
    if(settings.skipBonusItems&&info.hasBonus)return info.names.length?`bonus item (${info.names.join(', ')})`:'bonus item';
    return '';
  }

'''
    if anchor not in s: raise SystemExit('quantity anchor missing')
    s=s.replace(anchor,insert+anchor,1)

# Skip before fetching/writing price or quantity.
old="  async function priceEntry(entry,{silent=false}={}){\n    try{const r=await computePrice(entry.id);setNativeValue(entry.input,r.price);entry.input.dataset.slBspPriced=String(r.price);fillQuantity(entry);state.priced++;if(settings.warnNpc&&r.item.sellPrice>0&&r.price<r.item.sellPrice&&!silent)toast(`${r.item.name}: ${money(r.price)} is below NPC ${money(r.item.sellPrice)}`,'error');return true;}\n    catch(e){state.skipped++;if(!silent)toast(`Skipped item #${entry.id}: ${e.message}`,'error');return false;}\n  }\n"
new="  async function priceEntry(entry,{silent=false}={}){\n    try{const reason=skipReason(entry);if(reason){state.skipped++;entry.row.dataset.slBspSkip=reason;if(!silent)toast(`Skipped item #${entry.id}: ${reason}`,'error');return false;}const r=await computePrice(entry.id);setNativeValue(entry.input,r.price);entry.input.dataset.slBspPriced=String(r.price);fillQuantity(entry);state.priced++;if(settings.warnNpc&&r.item.sellPrice>0&&r.price<r.item.sellPrice&&!silent)toast(`${r.item.name}: ${money(r.price)} is below NPC ${money(r.item.sellPrice)}`,'error');return true;}\n    catch(e){state.skipped++;if(!silent)toast(`Skipped item #${entry.id}: ${e.message}`,'error');return false;}\n  }\n"
if old not in s: raise SystemExit('priceEntry anchor missing')
s=s.replace(old,new,1)

# Compact plus launcher. While a batch runs it temporarily shows progress.
s=s.replace("  function launcherText(temp=''){const b=qs('#'+PREFIX+'-launcher');if(!b)return;b.innerHTML=temp?esc(temp):'<b>S</b> Smart Pricer';}\n\n  function injectLauncher(){\n    if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();return;}if(qs('#'+PREFIX+'-launcher'))return;\n    const b=document.createElement('button');b.id=PREFIX+'-launcher';b.type='button';b.innerHTML='<b>S</b> Smart Pricer';b.onclick=openPanel;document.documentElement.appendChild(b);\n  }",
"  function launcherText(temp=''){const b=qs('#'+PREFIX+'-launcher');if(!b)return;b.textContent=temp?temp.replace(/^Pricing\\s*/i,''):'+';b.style.fontSize=temp?'11px':'';}\n\n  function injectLauncher(){\n    if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();return;}if(qs('#'+PREFIX+'-launcher'))return;\n    const b=document.createElement('button');b.id=PREFIX+'-launcher';b.type='button';b.textContent='+';b.title='SakaLuX Bazaar Smart Pricer';b.setAttribute('aria-label',b.title);b.onclick=openPanel;document.documentElement.appendChild(b);\n  }",1)

# Add UI toggles.
s=s.replace("      <label class=\"sl-bsp-check\"><input id=\"${PREFIX}-decor\" type=\"checkbox\"> Add S PRICE button beside detected Bazaar price fields</label>\n      <div class=\"sl-bsp-actions\">",
"      <label class=\"sl-bsp-check\"><input id=\"${PREFIX}-decor\" type=\"checkbox\"> Add S PRICE button beside detected Bazaar price fields</label>\n      <label class=\"sl-bsp-check\"><input id=\"${PREFIX}-skiprw\" type=\"checkbox\"> Skip Ranked War (RW) weapons</label>\n      <label class=\"sl-bsp-check\"><input id=\"${PREFIX}-skipbonus\" type=\"checkbox\"> Skip items / weapons with bonus icons</label>\n      <div class=\"sl-bsp-actions\">",1)

s=s.replace("qs('#'+PREFIX+'-ignore',p).checked=settings.ignoreLow;qs('#'+PREFIX+'-npc',p).checked=settings.warnNpc;qs('#'+PREFIX+'-decor',p).checked=settings.autoDecorate;",
            "qs('#'+PREFIX+'-ignore',p).checked=settings.ignoreLow;qs('#'+PREFIX+'-npc',p).checked=settings.warnNpc;qs('#'+PREFIX+'-decor',p).checked=settings.autoDecorate;qs('#'+PREFIX+'-skiprw',p).checked=settings.skipRwWeapons;qs('#'+PREFIX+'-skipbonus',p).checked=settings.skipBonusItems;",1)

s=s.replace("settings.ignoreLow=qs('#'+PREFIX+'-ignore',p).checked;settings.warnNpc=qs('#'+PREFIX+'-npc',p).checked;settings.autoDecorate=qs('#'+PREFIX+'-decor',p).checked;save();",
            "settings.ignoreLow=qs('#'+PREFIX+'-ignore',p).checked;settings.warnNpc=qs('#'+PREFIX+'-npc',p).checked;settings.autoDecorate=qs('#'+PREFIX+'-decor',p).checked;settings.skipRwWeapons=qs('#'+PREFIX+'-skiprw',p).checked;settings.skipBonusItems=qs('#'+PREFIX+'-skipbonus',p).checked;save();",1)

s=s.replace("Mode: <b>${esc(settings.pricingMode)}</b> · API: <b>${settings.apiKey?'saved':'missing'}</b> · last priced: <b>${state.priced}</b> · skipped: <b>${state.skipped}</b>",
            "Mode: <b>${esc(settings.pricingMode)}</b> · API: <b>${settings.apiKey?'saved':'missing'}</b> · RW skip: <b>${settings.skipRwWeapons?'ON':'OFF'}</b> · Bonus skip: <b>${settings.skipBonusItems?'ON':'OFF'}</b> · last priced: <b>${state.priced}</b> · skipped: <b>${state.skipped}</b>",1)

SCRIPT.write_text(s)

# Registry/version metadata.
data=json.loads(REG.read_text()); entry=next((x for x in data.get('scripts',[]) if x.get('id')=='bazaar-smart-pricer'),None)
if entry:
    entry['version']='1.0.2'; entry['detailsRevision']=int(entry.get('detailsRevision',1))+1
    entry['release']={'version':'1.0.2','date':'2026-09-20','notes':['Replaces the right-side Smart Pricer pill with a compact circular + button.','Adds default-on protection to skip Ranked War weapons.','Adds default-on protection to skip items/weapons with Torn bonus icons so base market prices are not written to special gear.']}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGELOG.exists():
    t=CHANGELOG.read_text(); block='## v1.0.2 — 2026-09-20\n- Replaced the right-side launcher with a compact circular **+** button.\n- Added **Skip Ranked War (RW) weapons** setting, enabled by default.\n- Added **Skip items / weapons with bonus icons** setting, enabled by default.\n- RW/bonus detection uses Torn bonus-attachment icons and rarity glow; skipped rows are never given quantity or price.\n\n'
    if '## v1.0.2 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGELOG.write_text(t)
if GF.exists():
    t=GF.read_text().replace('**v1.0.1**','**v1.0.2**',1)
    if '### v1.0.2' not in t:t+='\n### v1.0.2 — RW / bonus safety + compact launcher\n- Right-side launcher is now a circular **+**.\n- RW weapons and bonus items are skipped by default; both protections can be changed in Settings.\n'
    GF.write_text(t)
if HUB_MD.exists(): HUB_MD.write_text(HUB_MD.read_text().replace('SakaLuX Bazaar Smart Pricer **v1.0.1**','SakaLuX Bazaar Smart Pricer **v1.0.2**'))
RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text('# SakaLuX Bazaar Smart Pricer v1.0.2\n\nRelease date: **2026-09-20**\n\n## Changes\n- The floating launcher at the right edge is now a compact circular **+** button.\n- **Skip Ranked War (RW) weapons** is enabled by default.\n- **Skip items / weapons with bonus icons** is enabled by default.\n- Detection uses Torn bonus attachment icons plus RW rarity glow.\n- When a protected item is detected, Smart Pricer does not write either quantity or price.\n- Existing Quick Fill quantity + price behavior remains unchanged for normal items.\n\n## Validation\n- `node --check` for the userscript.\n- `python3 -m json.tool` for `scripts.json`.\n')
print('Bazaar Smart Pricer v1.0.2 synchronized.')
