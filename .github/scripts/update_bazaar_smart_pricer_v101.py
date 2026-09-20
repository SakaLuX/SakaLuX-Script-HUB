#!/usr/bin/env python3
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SCRIPT=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
CHANGELOG=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
HUB_MD=ROOT/'greasyfork'/'Script-Hub.md'
RELEASE=ROOT/'releases'/'bazaar-smart-pricer-v1.0.1.md'

s=SCRIPT.read_text()
s=s.replace('// @version      1.0.0','// @version      1.0.1',1)
s=s.replace("const VERSION='1.0.0';","const VERSION='1.0.1';",1)

if '.${PREFIX}-quickfill{' not in s:
    s=s.replace(
      '.sl-bsp-primary{background:#244a73!important;border-color:#4f8fe8!important}.sl-bsp-danger{background:#4a2025!important;border-color:#8b3d46!important}\n#${PREFIX}-status',
      '.sl-bsp-primary{background:#244a73!important;border-color:#4f8fe8!important}.sl-bsp-danger{background:#4a2025!important;border-color:#8b3d46!important}\n.${PREFIX}-addbar{display:flex;align-items:center;justify-content:center;width:100%;box-sizing:border-box;margin:6px 0 10px;padding:8px;background:#101923;border:1px solid #34465b;border-radius:10px}\n.${PREFIX}-quickfill{width:min(100%,360px);min-height:38px;border:1px solid #4f8fe8;background:#244a73;color:#fff;border-radius:9px;padding:8px 12px;font:900 12px/1.1 Arial,sans-serif;cursor:pointer}\n.${PREFIX}-quickfill:disabled{opacity:.6;cursor:wait}\n#${PREFIX}-status',1)

if 'function pickQuantityControl(row)' not in s:
    anchor='  function request(url){\n'
    insert=r'''  function pickQuantityControl(row){
    const choice=row.querySelector('div.choice-container, [class*="choiceContainer___"]');
    const checkbox=choice?.querySelector('input[type="checkbox"]')||null;
    if(checkbox)return{type:'checkbox',input:checkbox};
    const inputs=qsa('input',row).filter(x=>x.type!=='hidden'&&x.type!=='checkbox'&&x.type!=='radio'&&!x.disabled);
    const scored=inputs.map(i=>{
      const meta=(i.name+' '+i.id+' '+i.placeholder+' '+i.className+' '+(i.getAttribute('aria-label')||'')).toLowerCase();
      let score=0;if(/qty|quantity|amount|stock/.test(meta))score+=12;if(/price|ppu|each|unit/.test(meta))score-=12;return{i,score};
    }).sort((a,b)=>b.score-a.score);
    const input=scored[0]?.score>0?scored[0].i:(inputs.length>=2?inputs[0]:null);
    return input?{type:'input',input}:null;
  }

  function quantityFromRow(row){
    const title=norm(row.querySelector('[class*="name___"], .title-wrap')?.textContent||'');
    const m=title.match(/\bx(\d+)\s*$/i);
    if(m)return Math.max(1,Number(m[1])||1);
    const text=norm(row.innerText||'');
    const n=text.match(/\bx(\d+)\b/i);
    return n?Math.max(1,Number(n[1])||1):1;
  }

  function fillQuantity(entry){
    const q=entry.qty||pickQuantityControl(entry.row);if(!q)return false;
    if(q.type==='checkbox'){
      if(!q.input.checked)q.input.click();
      return true;
    }
    const amount=quantityFromRow(entry.row);
    setNativeValue(q.input,amount);
    q.input.dispatchEvent(new KeyboardEvent('keyup',{bubbles:true,key:'0'}));
    return true;
  }

'''
    if anchor not in s: raise SystemExit('request anchor missing')
    s=s.replace(anchor,insert+anchor,1)

old="  function findRows(){\n    const out=[],seen=new Set();\n    for(const img of qsa('img')){const id=itemIdFromImg(img);if(!id)continue;const row=rowFor(img);if(!row||seen.has(row))continue;const input=pickPriceInput(row);if(!input)continue;seen.add(row);out.push({id,img,row,input});}\n    return out;\n  }\n"
new="  function findRows(){\n    const out=[],seen=new Set();\n    for(const img of qsa('img')){const id=itemIdFromImg(img);if(!id)continue;const row=rowFor(img);if(!row||seen.has(row))continue;const input=pickPriceInput(row);if(!input)continue;const qty=pickQuantityControl(row);seen.add(row);out.push({id,img,row,input,qty});}\n    return out;\n  }\n"
if old in s:s=s.replace(old,new,1)

oldp="  async function priceEntry(entry,{silent=false}={}){\n    try{const r=await computePrice(entry.id);setNativeValue(entry.input,r.price);entry.input.dataset.slBspPriced=String(r.price);state.priced++;if(settings.warnNpc&&r.item.sellPrice>0&&r.price<r.item.sellPrice&&!silent)toast(`${r.item.name}: ${money(r.price)} is below NPC ${money(r.item.sellPrice)}`,'error');return true;}\n    catch(e){state.skipped++;if(!silent)toast(`Skipped item #${entry.id}: ${e.message}`,'error');return false;}\n  }\n"
newp="  async function priceEntry(entry,{silent=false}={}){\n    try{const r=await computePrice(entry.id);setNativeValue(entry.input,r.price);entry.input.dataset.slBspPriced=String(r.price);fillQuantity(entry);state.priced++;if(settings.warnNpc&&r.item.sellPrice>0&&r.price<r.item.sellPrice&&!silent)toast(`${r.item.name}: ${money(r.price)} is below NPC ${money(r.item.sellPrice)}`,'error');return true;}\n    catch(e){state.skipped++;if(!silent)toast(`Skipped item #${entry.id}: ${e.message}`,'error');return false;}\n  }\n"
if oldp in s:s=s.replace(oldp,newp,1)
elif 'fillQuantity(entry);state.priced++' not in s: raise SystemExit('priceEntry anchor missing')

if 'function injectAddItemsQuickFill()' not in s:
    anchor='  async function priceEntry(entry,{silent=false}={}){\n'
    insert=r'''  function isAddItemsPage(){
    if(!onBazaar())return false;
    const route=(location.search+' '+location.hash).toLowerCase();
    if(/add[-_ ]?items?|additem/.test(route))return true;
    return findRows().some(e=>!!e.qty);
  }

  function injectAddItemsQuickFill(){
    const old=qs('#'+PREFIX+'-addbar');
    if(!isAddItemsPage()){old?.remove();return;}
    if(old)return;
    const rows=findRows(),first=rows[0]?.row;
    if(!first?.parentElement)return;
    const bar=document.createElement('div');bar.id=PREFIX+'-addbar';bar.className=PREFIX+'-addbar';
    const b=document.createElement('button');b.type='button';b.className=PREFIX+'-quickfill';b.innerHTML='<b>S</b> QUICK FILL';b.title='Fill quantity and price for all visible Bazaar items';
    b.onclick=async ev=>{ev.preventDefault();ev.stopPropagation();if(!settings.apiKey){openPanel();toast('Add your Torn API key first.','error');return;}if(state.busy)return;b.disabled=true;const keep=b.innerHTML;b.textContent='FILLING…';try{await priceAll();}finally{b.disabled=false;b.innerHTML=keep;}};
    bar.appendChild(b);first.parentElement.insertBefore(bar,first);
  }

'''
    if anchor not in s: raise SystemExit('quick fill anchor missing')
    s=s.replace(anchor,insert+anchor,1)

oldscan="  function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();return;}injectLauncher();if(settings.autoDecorate)decorateRows();state.lastScan=Date.now();if(force)refreshStatus();}\n"
newscan="  function scan(force=false){if(!settings.enabled)return;if(!onBazaar()){qs('#'+PREFIX+'-launcher')?.remove();qs('#'+PREFIX+'-addbar')?.remove();return;}injectLauncher();injectAddItemsQuickFill();if(settings.autoDecorate)decorateRows();state.lastScan=Date.now();if(force)refreshStatus();}\n"
if oldscan in s:s=s.replace(oldscan,newscan,1)

s=s.replace('Price all visible Bazaar add-item rows','Fill quantity and price for all visible Bazaar add-item rows')
s=s.replace('priceAll,isEnabled:', 'priceAll,quickFill:priceAll,isEnabled:',1) if 'quickFill:priceAll' not in s else s
SCRIPT.write_text(s)

data=json.loads(REG.read_text()); scripts=data.setdefault('scripts',[])
entry=next((x for x in scripts if x.get('id')=='bazaar-smart-pricer'),None)
if entry:
    entry['version']='1.0.1'; entry['detailsRevision']=max(2,int(entry.get('detailsRevision',1))+1)
    entry['release']={'version':'1.0.1','date':'2026-09-20','notes':['QUICK FILL on Add Items now fills both quantity and price, matching the established Torn Bazaar Quick Pricer workflow.','Quantity uses the visible stack amount (xN) or selects Torn’s quantity checkbox when that control is present.','Per-row S PRICE also fills quantity on Add Items while Manage/Reprice keeps price-focused behavior.']}
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

if CHANGELOG.exists():
    t=CHANGELOG.read_text()
    block='## v1.0.1 — 2026-09-20\n- Added **S QUICK FILL** directly to Add Items.\n- QUICK FILL now fills **both quantity and price** for each visible item, following the behavior of Torn Bazaar Quick Pricer.\n- Quantity is taken from the visible `xN` stack amount, or the Torn quantity checkbox is enabled where that UI is used.\n- Per-item **S PRICE** uses the same quantity + price fill path on Add Items.\n\n'
    if '## v1.0.1 — 2026-09-20' in t:
        a=t.index('## v1.0.1 — 2026-09-20'); b=t.find('\n## ',a+4); t=t[:a]+block+(t[b+1:] if b!=-1 else '')
    else:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
    CHANGELOG.write_text(t)

if GF.exists():
    t=GF.read_text().replace('**v1.0.0**','**v1.0.1**',1)
    if 'fills **both quantity and price**' not in t:t+='\n### v1.0.1 — Add Items Quick Fill\n- **S QUICK FILL** fills **both quantity and price** for visible Add Items rows.\n- Per-row **S PRICE** uses the same fill behavior.\n'
    GF.write_text(t)
if HUB_MD.exists():HUB_MD.write_text(HUB_MD.read_text().replace('SakaLuX Bazaar Smart Pricer **v1.0.0**','SakaLuX Bazaar Smart Pricer **v1.0.1**'))
RELEASE.parent.mkdir(parents=True,exist_ok=True)
RELEASE.write_text('# SakaLuX Bazaar Smart Pricer v1.0.1\n\nRelease date: **2026-09-20**\n\n## Add Items Quick Fill\n- Adds **S QUICK FILL** directly on the Add Items page.\n- One tap fills **quantity and price** for every currently visible item row.\n- Quantity comes from the displayed stack (`xN`) or enables Torn’s quantity checkbox when applicable.\n- Uses the saved Smart Pricer price mode for the price.\n- Per-item **S PRICE** follows the same quantity + price behavior.\n\n## Validation\n- JavaScript checked with `node --check`.\n- `scripts.json` checked with `python3 -m json.tool`.\n')
print('Bazaar Smart Pricer v1.0.1 quantity + price Quick Fill synchronized.')
