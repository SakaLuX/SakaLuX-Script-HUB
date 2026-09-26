from pathlib import Path
import json
import re

ROOT = Path('.')
MARKET = ROOT / 'SakaLuX-Market-Intelligence.user.js'
HUB = ROOT / 'SakaLuX-Script-Hub.user.js'
REGISTRY = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork' / 'Market-Intelligence.md'
RELEASE = ROOT / 'releases' / 'market-intelligence-v1.17.53.md'

NEW_VERSION = '1.17.53'
TODAY = '2026-09-26'
NOTES = [
    'Adds a persistent MI INFO ON/OFF button to landed foreign markets so per-item Market Intelligence rows can be hidden without disabling the rest of Market Intelligence.',
    'Fixes foreign-market stock parsing so stock is read from Torn\'s Stock column/cell instead of numbers embedded in item names such as Type 98 Anti-Tank.',
    'Synchronizes Market Intelligence runtime/version surfaces and fixes Script Hub runtime version display to match its v1.9.88 metadata.'
]


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected pattern for {label}: {old[:100]!r}')
    return text.replace(old, new, 1)


# --- Market userscript ---
text = MARKET.read_text(encoding='utf-8')
text = re.sub(r'(?m)^// @version\s+\d+\.\d+\.\d+\s*$', '// @version      ' + NEW_VERSION, text, count=1)
text = re.sub(r"(?m)^\s*let v = '1\.17\.52';\s*$", "  let v = '" + NEW_VERSION + "';", text, count=1)
text = re.sub(r"(?m)^\s*const VERSION = '1\.17\.37';\s*$", "    const VERSION = '" + NEW_VERSION + "';", text, count=1)

text = replace_once(
    text,
    "        stockEta: true,\n        arrivalStock: true,",
    "        stockEta: true,\n        travelInlineInfo: true,\n        arrivalStock: true,",
    'travelInlineInfo default'
)

old_stock = r'''    function extractTravelStock(node) {
        const txt=normText(node?.innerText||node?.textContent||'');
        if(!txt)return null;
        const clean=txt.replace(/\$\s*[\d,.]+\s*[KMB]?/ig,' ');
        const nums=[...clean.matchAll(/(?:^|\s)(\d{1,6})(?=\s|$)/g)].map(m=>Number(m[1])).filter(n=>Number.isFinite(n)&&n>=0&&n<=MAX_REASONABLE_TRAVEL_STOCK);
        return nums.length?nums[0]:null;
    }'''
new_stock = r'''    function parseTravelStockCell(cell) {
        const txt=normText(cell?.innerText||cell?.textContent||'');
        if(!txt)return null;
        const m=txt.match(/^\s*([0-9][0-9,]*)\s*$/);
        if(!m)return null;
        const n=Number(m[1].replace(/,/g,''));
        return Number.isFinite(n)&&n>=0&&n<=MAX_REASONABLE_TRAVEL_STOCK?n:null;
    }
    function extractTravelStock(node) {
        if(!node)return null;
        const row=node.closest?.('tr')||node;
        if(row?.tagName==='TR'){
            const cells=[...row.children].filter(c=>/^(TD|TH)$/.test(c.tagName));
            const table=row.closest?.('table');
            let stockIndex=-1;
            if(table){
                const headerRows=[...table.querySelectorAll('thead tr, tr')].slice(0,4);
                for(const hr of headerRows){
                    const headers=[...hr.children].filter(c=>/^(TD|TH)$/.test(c.tagName));
                    const idx=headers.findIndex(c=>/^stock$/i.test(normText(c.innerText||c.textContent||'')));
                    if(idx>=0){stockIndex=idx;break;}
                }
            }
            if(stockIndex>=0&&cells[stockIndex]){
                const exact=parseTravelStockCell(cells[stockIndex]);
                if(exact!=null)return exact;
            }
            const named=[...row.querySelectorAll('[class*="stock" i],[data-label*="stock" i],[aria-label*="stock" i]')];
            for(const cell of named){const exact=parseTravelStockCell(cell);if(exact!=null)return exact;}
            // Torn foreign-market layout is Item | Name | Stock | Cost | Buy.
            // This fallback intentionally reads only the third cell and never the whole row,
            // preventing item-name numbers (for example "Type 98 Anti-Tank") from being mistaken for stock.
            if(cells.length>=5){const exact=parseTravelStockCell(cells[2]);if(exact!=null)return exact;}
            return null;
        }
        const named=node.querySelector?.('[class*="stock" i],[data-label*="stock" i],[aria-label*="stock" i]');
        return parseTravelStockCell(named);
    }'''
text = replace_once(text, old_stock, new_stock, 'travel stock parser')

anchor = '''    function ensureTravelBadge(row,cls){
        if(!row)return null;'''
if anchor not in text:
    raise SystemExit('ensureTravelBadge anchor missing')

insert_after = '''    function removeTravelInlineInfo(){
        document.querySelectorAll('.sl-mi-pda-badge-row,.sl-mi-pda-badge-block').forEach(w=>{
            if(w.dataset?.miClass==='sl-mi-travel'||w.querySelector?.('.sl-mi-travel'))w.remove();
        });
        document.querySelectorAll('.sl-mi-travel').forEach(x=>x.remove());
    }

    function ensureTravelInlineInfoToggle(){
        const landed=detectPage()==='travel'&&!detectInFlight()&&!!detectDestination();
        let bar=document.getElementById('sl-mi-travel-inline-toggle');
        if(!landed){bar?.remove();return null;}
        if(!bar){
            bar=document.createElement('div');
            bar.id='sl-mi-travel-inline-toggle';
            bar.style.cssText='display:flex!important;justify-content:flex-end!important;align-items:center!important;margin:6px 0!important;padding:0 6px!important;box-sizing:border-box!important;';
            const btn=document.createElement('button');
            btn.type='button';
            btn.id='sl-mi-travel-inline-toggle-btn';
            btn.style.cssText='min-height:34px!important;padding:7px 12px!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:9px!important;background:#15202b!important;color:#eef3f8!important;font-weight:900!important;font-size:12px!important;';
            btn.addEventListener('click',()=>{
                settings.travelInlineInfo=!settings.travelInlineInfo;
                saveJson(STORAGE.settings,settings);
                updateTravelInlineInfoToggle();
                if(!settings.travelInlineInfo)removeTravelInlineInfo();
                else scheduleScan(true);
            });
            bar.appendChild(btn);
            mountTop(bar);
        }
        updateTravelInlineInfoToggle();
        return bar;
    }

    function updateTravelInlineInfoToggle(){
        const btn=document.getElementById('sl-mi-travel-inline-toggle-btn');
        if(!btn)return;
        const on=settings.travelInlineInfo!==false;
        btn.textContent='MI INFO: '+(on?'ON':'OFF');
        btn.setAttribute('aria-pressed',on?'true':'false');
        btn.style.opacity=on?'1':'.72';
    }

'''
text = text.replace(anchor, insert_after + anchor, 1)

old_scan_start = '''        if(travelCtx.state!==TRAVEL_STATES.LANDED_ABROAD)return;
        document.getElementById('sl-mi-best-run')?.remove();
        const availableCash=await fetchAvailableCash(true);'''
new_scan_start = '''        if(travelCtx.state!==TRAVEL_STATES.LANDED_ABROAD)return;
        document.getElementById('sl-mi-best-run')?.remove();
        ensureTravelInlineInfoToggle();
        if(settings.travelInlineInfo===false)removeTravelInlineInfo();
        const availableCash=await fetchAvailableCash(true);'''
text = replace_once(text, old_scan_start, new_scan_start, 'landed toggle mount')

old_badge = "const m=metrics(e.buy,market.price),box=ensureTravelBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;"
new_badge = "const m=metrics(e.buy,market.price);if(settings.travelInlineInfo!==false){const box=ensureTravelBadge(e.row,'sl-mi-travel');box.classList.toggle('loss',m.profit<Number(settings.minProfit||0));box.innerHTML='<b>☠︎ MI</b> Market '+money(market.price)+' · Net '+money(m.net)+' · <strong>'+money(m.profit)+' ('+pct(m.roi)+')</strong>'+(e.stock!=null?' · Stock '+e.stock.toLocaleString('en-US')+stockEtaText(destination,e.id,e.stock):'');state.decorated++;}"
text = replace_once(text, old_badge, new_badge, 'conditional inline badge')

MARKET.write_text(text, encoding='utf-8')

# --- Hub runtime display + embedded Market version surfaces ---
hub = HUB.read_text(encoding='utf-8')
hub = hub.replace("const VERSION = '1.9.82';", "const VERSION = '1.9.88';", 1)
hub = hub.replace('1.17.52', NEW_VERSION)
HUB.write_text(hub, encoding='utf-8')

# --- scripts.json canonical registry ---
data = json.loads(REGISTRY.read_text(encoding='utf-8'))
market = next((x for x in data.get('scripts', []) if x.get('id') == 'market-intelligence'), None)
if not market:
    raise SystemExit('market-intelligence entry missing from scripts.json')
market['version'] = NEW_VERSION
market['detailsRevision'] = int(market.get('detailsRevision') or 0) + 1
market.setdefault('release', {})['version'] = NEW_VERSION
market['release']['date'] = TODAY
market['release']['notes'] = NOTES
REGISTRY.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# --- Greasy Fork documentation ---
doc = DOC.read_text(encoding='utf-8')
doc = doc.replace('**v1.17.52**', '**v1.17.53**')
doc = doc.replace('Canonical version: **v1.17.52**', 'Canonical version: **v1.17.53**')
section = '''\n### v1.17.53 — Foreign market inline toggle + stock parsing fix\n- Adds a persistent **MI INFO: ON/OFF** button while landed abroad. Turning it OFF removes the per-item `MI Market / Net / Stock / next stock` rows without disabling Best Buys, planning, pricing or the rest of Market Intelligence.\n- Reads stock strictly from Torn's **Stock** table cell / stock-labelled element. It no longer scans the whole item row, so numbers in names such as **Type 98 Anti-Tank** cannot be mistaken for stock.\n- Synchronizes Market Intelligence runtime/version surfaces and fixes Script Hub's runtime display constant to **v1.9.88**.\n\n'''
if '### v1.17.53 — Foreign market inline toggle + stock parsing fix' not in doc:
    marker = '## Changelog\n'
    if marker in doc:
        doc = doc.replace(marker, marker + section, 1)
    else:
        doc += '\n' + section
DOC.write_text(doc, encoding='utf-8')

# --- Dedicated release note ---
RELEASE.parent.mkdir(parents=True, exist_ok=True)
RELEASE.write_text(f'''# SakaLuX Market Intelligence v{NEW_VERSION}\n\nRelease date: **{TODAY}**\n\n## Changes\n- Persistent **MI INFO: ON/OFF** control on landed foreign markets for the per-item Market Intelligence rows.\n- Foreign-market stock parser now reads Torn's Stock column/cell only, fixing item names containing numbers such as **Type 98 Anti-Tank**.\n- Market Intelligence version surfaces are synchronized to **v{NEW_VERSION}**.\n- Script Hub runtime version display is synchronized to its metadata version **v1.9.88**.\n\n## Validation\n- `node --check SakaLuX-Market-Intelligence.user.js`\n- `node --check SakaLuX-Script-Hub.user.js`\n- `python3 -m json.tool scripts.json`\n''', encoding='utf-8')

print('Prepared Market Intelligence', NEW_VERSION)
