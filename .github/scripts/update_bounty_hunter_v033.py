from pathlib import Path
import json,re

p=Path('SakaLuX-Bounty-Hunter.user.js')
s=p.read_text()

# Version sync
s=re.sub(r'// @version\s+\S+','// @version      0.3.3',s,count=1)
s=re.sub(r"let v = '[^']+';","let v = '0.3.3';",s,count=1)
s=re.sub(r"const VERSION='[^']+'","const VERSION='0.3.3'",s,count=1)

# Defaults: scan enough pages for the full live board and keep advanced settings collapsed.
s=s.replace("maxPages:20,liveEnrich:true","maxPages:60,liveEnrich:true",1)
s=s.replace("includeUnknownFF:false,chatButton:true","includeUnknownFF:false,chatButton:true,settingsOpen:false",1)

# Track both unique targets and raw bounty records.
s=s.replace("lastSource='DOM',notified=new Map();","lastSource='DOM',lastBountyRecords=0,notified=new Map();",1)

# One-time migration from previous 20-page limit.
anchor="try{const mk='SLX_BOUNTY_MIGRATED_032';"
if anchor not in s: raise SystemExit('032 migration anchor not found')
insert="try{const mk='SLX_BOUNTY_MIGRATED_033';if(!localStorage.getItem(mk)){if(num(S.maxPages)<=20)S.maxPages=60;S.settingsOpen=false;localStorage.setItem(mk,'1');W(KS,S)}}catch{}\n"
s=s.replace(anchor,insert+anchor,1)

# Full-board loader: up to 100 API pages, stop naturally at a short page, count raw bounty rows,
# and preserve the record count in cache so the footer can distinguish bounties from unique targets.
pat=r"async function fetchFullBoard\(force=false\)\{.*?\nfunction mergeDomHints"
m=re.search(pat,s,re.S)
if not m: raise SystemExit('fetchFullBoard block not found')
new_fetch="""async function fetchFullBoard(force=false){const key=getKey();if(!key)throw new Error('No Torn API key. Add one in API settings or Script Hub.');if(!force&&CACHE.rows?.length&&Date.now()-num(CACHE.at)<30000){lastBountyRecords=num(CACHE.records)||CACHE.rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);return CACHE.rows}const map=new Map(),pages=Math.max(1,Math.min(100,num(S.maxPages)||60));let records=0;for(let p=0;p<pages;p++){const list=apiList(await fetchPage(p*100,key));records+=list.length;for(const b of list){const x=normalizeApiBounty(b);if(!x||!x.reward)continue;const old=map.get(x.id)||x;if(old!==x){old.reward+=x.reward;old.count+=1;if(old.status==='Unknown'&&x.status!=='Unknown')old.status=x.status;if(!old.hospitalUntil&&x.hospitalUntil)old.hospitalUntil=x.hospitalUntil}map.set(x.id,old)}if(list.length<100)break}const rows=[...map.values()];lastBountyRecords=records;CACHE={rows,records,at:Date.now()};saveCache();return rows}
function mergeDomHints"""
s=s[:m.start()]+new_fetch+s[m.end():]

# In DOM mode count the actual bounty rows represented by grouped targets.
collect_match=re.search(r"async function collect\(force=false\)\{.*?\nfunction bestRows",s,re.S)
if collect_match:
    block=collect_match.group(0)
    block=block.replace("lastRows=rows;", "lastRows=rows;lastBountyRecords=lastSource==='API'?(lastBountyRecords||rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0)):rows.reduce((a,x)=>a+Math.max(1,num(x.count)||1),0);",1)
    s=s[:collect_match.start()]+block+s[collect_match.end():]

# Footer terminology: 'loaded' was unique grouped players, not bounty rows.
old="o.querySelector('[data-count]').textContent=rows.length+' matches / '+lastRows.length+' loaded · FF '+ffKnown+' known / '+ffBeatable+' beatable';"
new="o.querySelector('[data-count]').textContent=rows.length+' beatable · '+lastRows.length+' targets · '+lastBountyRecords+' bounties · FF '+ffKnown+' known / '+ffBeatable+' in range';"
if old not in s: raise SystemExit('footer count anchor not found')
s=s.replace(old,new,1)

# Empty diagnostic should also make the grouped-vs-total distinction clear.
s=s.replace("'No matching targets.<br>Board: '+lastRows.length+' · FF known: '+known+' · FF in range: '+beat", "'No matching targets.<br>Targets: '+lastRows.length+' · Bounties: '+lastBountyRecords+' · FF known: '+known+' · FF in range: '+beat",1)

# Compact panel: search stays visible, advanced filters/toggles collapse behind one button.
old='<div class="bar"><label>Mode<select data-mode>'
new='<button data-filters style="margin:8px 12px 4px;width:calc(100% - 24px);min-height:34px">⚙ Filters</button><div class="slx-bh-settings"><div class="bar"><label>Mode<select data-mode>'
if old not in s: raise SystemExit('settings open anchor not found')
s=s.replace(old,new,1)
old='</label></div><div class="slx-bh-tog"></div><div class="slx-bh-list"></div>'
new='</label></div><div class="slx-bh-tog"></div></div><div class="slx-bh-list"></div>'
if old not in s: raise SystemExit('settings close anchor not found')
s=s.replace(old,new,1)

# Increase editable API page range to match full-board scanner.
s=s.replace('data-pages type="number" min="1" max="20"','data-pages type="number" min="1" max="100"',1)
s=s.replace("bindNum('[data-pages]','maxPages',1,20);","bindNum('[data-pages]','maxPages',1,100);",1)

# Wire collapsed settings and keep the button informative.
needle="const mode=o.querySelector('[data-mode]'),src=o.querySelector('[data-source-mode]'),sort=o.querySelector('[data-sort]'),q=o.querySelector('[data-q]');"
if needle not in s: raise SystemExit('open bindings anchor not found')
extra=needle+"const settings=o.querySelector('.slx-bh-settings'),filterBtn=o.querySelector('[data-filters]');const syncFilters=()=>{if(!settings||!filterBtn)return;settings.style.display=S.settingsOpen?'block':'none';filterBtn.textContent=(S.settingsOpen?'▴ Hide filters':'⚙ Filters')+' · FF '+num(S.minFF)+'–'+num(S.maxFF)+' · ≥'+fmt(S.minReward)};filterBtn.onclick=()=>{S.settingsOpen=!S.settingsOpen;save();syncFilters()};syncFilters();"
s=s.replace(needle,extra,1)

# Refresh filter-button summary when numeric filters change.
old="e.onchange=()=>{S[key]=Math.max(min,Math.min(max,num(e.value)));save();render(false)}"
new="e.onchange=()=>{S[key]=Math.max(min,Math.min(max,num(e.value)));save();if(typeof syncFilters==='function')syncFilters();render(false)}"
if old in s:s=s.replace(old,new,1)

p.write_text(s)

# Docs + registry
md=Path('greasyfork/Bounty-Hunter.md')
t=md.read_text()
t=re.sub(r'\*\*v[^*]+\*\*','**v0.3.3**',t,count=1)
entry='''\n### v0.3.3 — Compact target-first UI + complete board paging\n- Collapses advanced filters and toggles behind a single Filters button so bounty targets occupy most of the mobile panel.\n- Keeps Search, Sort, Refresh and API access visible at all times.\n- Raises the full-board paging ceiling from 20 to 100 pages and migrates the default to 60 pages, enough for boards well above 4,000 bounty rows.\n- Stops automatically when the API returns a short page, so it does not request unused pages.\n- Footer now distinguishes raw bounty records from grouped unique target players (`beatable / targets / bounties`).\n- Preserves raw bounty count in cache and shows the same distinction in zero-result diagnostics.\n'''
if '### v0.3.3' not in t:t=t.replace('## Changelog','## Changelog'+entry)
md.write_text(t)

rp=Path('scripts.json')
data=json.loads(rp.read_text())
for x in data.get('scripts',[]):
    if x.get('id')=='bounty-hunter':
        x['version']='0.3.3'
        x['release']={'version':'0.3.3','date':'2026-10-05','notes':['Collapses advanced settings so targets fill the mobile panel.','Raises full-board scanning to 60 default / 100 max API pages.','Shows beatable targets, unique targets and raw bounty count separately.']}
        break
rp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print('updated Bounty Hunter to v0.3.3')
