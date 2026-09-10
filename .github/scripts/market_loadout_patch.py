from pathlib import Path
import json

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text()
old=s
s=s.replace('// @version      1.16.5','// @version      1.16.6',1)
s=s.replace("const VERSION = '1.16.5';","const VERSION = '1.16.6';",1)
s=s.replace('stable non-flickering Travel and Bazaar panels, Price Network, Bazaar Flip and travel basket tools.','stable Travel/Bazaar panels, Loadout Comparator, Price Network, Bazaar Flip and travel basket tools.',1)
s=s.replace("networkLastObservation: 'SakaLuX_MI_PRICE_NETWORK_LAST_OBS_V1'","networkLastObservation: 'SakaLuX_MI_PRICE_NETWORK_LAST_OBS_V1',\n        loadoutCache: 'SakaLuX_MI_LOADOUT_CACHE_V1'",1)
s=s.replace("const CASH_CACHE_MS = 30 * 1000;","const CASH_CACHE_MS = 30 * 1000;\n    const LOADOUT_CACHE_MS = 2 * 60 * 1000;",1)
s=s.replace("itemMarket: true,\n        priceNetwork: false,","itemMarket: true,\n        loadoutComparator: true,\n        priceNetwork: false,",1)
s=s.replace("availableCash: null, availableCashAt: 0","availableCash: null, availableCashAt: 0,\n        loadoutReady: false, loadoutItems: 0, loadoutComparisons: 0, loadoutBestVerdict: '', loadoutLastError: ''",1)

marker="    function requestJson(url) {"
insert=r'''    function normalizeGearStats(raw) {
        const stats=raw?.stats||raw?.item_details?.stats||raw?.itemDetails?.stats||raw?.item?.stats||{};
        const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null;};
        return {damage:num(stats.damage),accuracy:num(stats.accuracy),armor:num(stats.armor??stats.armour),quality:num(stats.quality)};
    }

    function inferGearSlot(raw, hint='') {
        const text=normText([hint,raw?.slot,raw?.position,raw?.type,raw?.sub_type,raw?.subType,raw?.name,raw?.item?.type,raw?.item?.sub_type,raw?.item?.name].filter(Boolean).join(' ')).toLowerCase();
        if(/primary/.test(text))return 'primary';
        if(/secondary/.test(text))return 'secondary';
        if(/melee/.test(text))return 'melee';
        if(/temporary/.test(text))return 'temporary';
        if(/helmet|mask|head/.test(text))return 'armor-head';
        if(/glove|gauntlet|hand/.test(text))return 'armor-hands';
        if(/boot|shoe|foot|feet/.test(text))return 'armor-feet';
        if(/pant|trouser|legging|leg/.test(text))return 'armor-legs';
        if(/vest|body|chest|mail/.test(text))return 'armor-body';
        if(/armor|armour/.test(text))return 'armor';
        if(/weapon|rifle|pistol|smg|shotgun|machine gun/.test(text))return 'weapon';
        return '';
    }

    function normalizeEquipmentItem(raw, hint='') {
        if(!raw||typeof raw!=='object')return null;
        const details=raw.item_details||raw.itemDetails||raw.item||raw;
        const stats=normalizeGearStats(raw);
        if(stats.damage==null&&stats.accuracy==null&&stats.armor==null)return null;
        const name=details?.name||raw.name||raw.item_name||raw.label||hint||'Equipped item';
        const uid=details?.uid??raw.uid??raw.item_uid??null;
        const type=details?.type||raw.type||'';
        const subType=details?.sub_type||details?.subType||raw.sub_type||raw.subType||'';
        const slot=inferGearSlot({...raw,...details,name,type,sub_type:subType},hint);
        const bonuses=Array.isArray(details?.bonuses)?details.bonuses:(Array.isArray(raw.bonuses)?raw.bonuses:[]);
        return {name:String(name),uid,slot,type,subType,stats,bonuses};
    }

    function collectEquipmentItems(payload) {
        const out=[],seen=new Set();
        const visit=(node,hint='',depth=0)=>{
            if(depth>6||node==null)return;
            if(Array.isArray(node)){node.forEach((x,i)=>visit(x,hint||String(i),depth+1));return;}
            if(typeof node!=='object')return;
            const item=normalizeEquipmentItem(node,hint);
            if(item){const key=String(item.uid||'')+'|'+item.name+'|'+item.slot;if(!seen.has(key)){seen.add(key);out.push(item);}return;}
            for(const [k,v] of Object.entries(node)){
                if(['ammo','mods','modifications','clothing'].includes(String(k).toLowerCase()))continue;
                visit(v,k,depth+1);
            }
        };
        visit(payload?.equipment??payload,'equipment',0);
        return out;
    }

    async function fetchEquippedLoadout(force=false) {
        const cached=loadJson(STORAGE.loadoutCache,null);
        if(!force&&cached?.at&&Date.now()-Number(cached.at)<LOADOUT_CACHE_MS&&Array.isArray(cached.items)){
            state.loadoutReady=true;state.loadoutItems=cached.items.length;state.loadoutLastError='';return cached.items;
        }
        const key=getApiKey();
        if(!key){state.loadoutReady=false;state.loadoutLastError='API key not configured';return [];}
        try{
            const data=await requestJson('https://api.torn.com/v2/user/equipment?key='+encodeURIComponent(key));
            checkApiError(data);
            const items=collectEquipmentItems(data);
            saveJson(STORAGE.loadoutCache,{at:Date.now(),items});
            state.loadoutReady=items.length>0;state.loadoutItems=items.length;state.loadoutLastError=items.length?'':'No equipped combat items returned';
            return items;
        }catch(e){state.loadoutReady=false;state.loadoutLastError=String(e?.message||e);return cached?.items||[];}
    }

    function marketGearListings(market) { return Array.isArray(market?.gearListings)?market.gearListings:[]; }
    function candidateSlot(market) { const meta=market?.itemMeta||{};return inferGearSlot(meta,meta.type||''); }
    function armorFamily(slot){return String(slot||'').startsWith('armor-')?slot:(slot==='armor'?'armor':'');}
    function compatibleEquipped(candidateSlotValue,equipped){
        if(!candidateSlotValue)return [];
        if(candidateSlotValue==='weapon')return equipped.filter(x=>['primary','secondary','melee','weapon'].includes(x.slot));
        if(candidateSlotValue==='armor')return equipped.filter(x=>armorFamily(x.slot));
        if(candidateSlotValue.startsWith('armor-')){const exact=equipped.filter(x=>x.slot===candidateSlotValue);return exact.length?exact:equipped.filter(x=>armorFamily(x.slot));}
        return equipped.filter(x=>x.slot===candidateSlotValue);
    }
    function equippedScore(item,slot){const st=item?.stats||{};return String(slot).startsWith('armor')?(Number(st.armor)||0):((Number(st.damage)||0)+(Number(st.accuracy)||0));}
    function compareGear(candidate,equippedItem,slot) {
        const cs=candidate?.stats||{},es=equippedItem?.stats||{};
        const delta=(a,b)=>a==null||b==null?null:Number(a)-Number(b);
        const dd=delta(cs.damage,es.damage),da=delta(cs.accuracy,es.accuracy),dar=delta(cs.armor,es.armor),dq=delta(cs.quality,es.quality);
        let verdict='SIDEGRADE';
        if(String(slot).startsWith('armor')) verdict=dar==null?'UNKNOWN':dar>0.05?'UPGRADE':dar<-0.05?'DOWNGRADE':'SIDEGRADE';
        else if(dd!=null||da!=null){const vals=[dd,da].filter(v=>v!=null);if(vals.length&&vals.every(v=>v>=0)&&vals.some(v=>v>0.05))verdict='UPGRADE';else if(vals.length&&vals.every(v=>v<=0)&&vals.some(v=>v<-0.05))verdict='DOWNGRADE';}
        else verdict='UNKNOWN';
        return {verdict,deltaDamage:dd,deltaAccuracy:da,deltaArmor:dar,deltaQuality:dq};
    }
    function signedStat(v){if(v==null||!Number.isFinite(Number(v)))return '—';const n=Number(v);return (n>=0?'+':'')+n.toFixed(2);}
    function statValue(v){return v==null||!Number.isFinite(Number(v))?'—':Number(v).toFixed(2);}
    function verdictClass(v){return v==='UPGRADE'?'upgrade':v==='DOWNGRADE'?'downgrade':v==='SIDEGRADE'?'sidegrade':'unknown';}

    async function renderLoadoutComparator(bar,market,id) {
        bar.querySelector('.sl-mi-loadout')?.remove();
        if(!settings.loadoutComparator)return;
        const gear=marketGearListings(market),slot=candidateSlot(market),block=document.createElement('div');block.className='sl-mi-loadout';
        if(!gear.length||!slot){block.innerHTML='<div class="sl-mi-loadout-head"><b>⚔ LOADOUT COMPARATOR</b><span>Not a comparable weapon/armor listing</span></div>';bar.appendChild(block);state.loadoutComparisons=0;state.loadoutBestVerdict='';return;}
        block.innerHTML='<div class="sl-mi-loadout-head"><b>⚔ LOADOUT COMPARATOR</b><span>Loading equipped gear…</span></div>';bar.appendChild(block);
        const equipped=await fetchEquippedLoadout(false);if(!bar.isConnected||bar.dataset.itemId!==String(id))return;
        const matches=compatibleEquipped(slot,equipped).sort((a,b)=>equippedScore(b,slot)-equippedScore(a,slot)),current=matches[0]||null;
        if(!current){block.innerHTML='<div class="sl-mi-loadout-head"><b>⚔ LOADOUT COMPARATOR</b><span>Could not match equipped '+esc(slot)+'</span></div><small class="sl-mi-loadout-error">'+esc(state.loadoutLastError||'The Torn API key may need user/equipment access.')+'</small>';state.loadoutComparisons=0;state.loadoutBestVerdict='';return;}
        const rows=gear.slice(0,8).map(g=>({...g,comparison:compareGear(g,current,slot)})),rank={UPGRADE:3,SIDEGRADE:2,UNKNOWN:1,DOWNGRADE:0};
        rows.sort((a,b)=>(rank[b.comparison.verdict]-rank[a.comparison.verdict])||(Number(a.price)-Number(b.price)));
        state.loadoutComparisons=rows.length;state.loadoutBestVerdict=rows[0]?.comparison?.verdict||'';
        const cs=current.stats||{},currentStats=String(slot).startsWith('armor')?'Armor '+statValue(cs.armor):'Dmg '+statValue(cs.damage)+' · Acc '+statValue(cs.accuracy);
        block.innerHTML='<div class="sl-mi-loadout-head"><div><b>⚔ LOADOUT COMPARATOR</b><span>Equipped: <strong>'+esc(current.name)+'</strong> · '+esc(currentStats)+'</span></div><button type="button" class="sl-mi-loadout-refresh">↻</button></div><div class="sl-mi-loadout-note">Verdict compares base combat stats only. Weapon bonuses/mods can change the practical choice.</div><div class="sl-mi-loadout-rows"></div>';
        const host=block.querySelector('.sl-mi-loadout-rows');
        rows.forEach(g=>{const c=g.comparison,row=document.createElement('div');row.className='sl-mi-loadout-row '+verdictClass(c.verdict);const stats=String(slot).startsWith('armor')?'Armor '+statValue(g.stats.armor)+' ('+signedStat(c.deltaArmor)+')':'Dmg '+statValue(g.stats.damage)+' ('+signedStat(c.deltaDamage)+') · Acc '+statValue(g.stats.accuracy)+' ('+signedStat(c.deltaAccuracy)+')';const bonus=(g.bonuses||[]).map(x=>x?.title).filter(Boolean).slice(0,2).join(', ');row.innerHTML='<strong class="sl-mi-loadout-verdict">'+esc(c.verdict)+'</strong><span>'+money(g.price)+'</span><span>'+esc(stats)+'</span><span>Q '+statValue(g.stats.quality)+(bonus?' · '+esc(bonus):'')+'</span>';host.appendChild(row);});
        block.querySelector('.sl-mi-loadout-refresh').onclick=async()=>{localStorage.removeItem(STORAGE.loadoutCache);await renderLoadoutComparator(bar,market,id);};
    }

'''
if marker not in s: raise SystemExit('requestJson marker missing')
s=s.replace(marker,insert+marker,1)

old_fetch="const norm=listings.map(l=>({price:Number(l.price??l.cost??0),qty:Number(l.amount??l.quantity??1)})).filter(l=>l.price>0).sort((a,b)=>a.price-b.price);"
new_fetch=old_fetch+"\n        const itemMeta=data?.itemmarket?.item||{};\n        const gearListings=listings.map(l=>{const d=l?.item_details||l?.itemDetails||null;if(!d?.stats)return null;return{price:Number(l.price??l.cost??0),qty:Number(l.amount??l.quantity??1),uid:d.uid??null,stats:normalizeGearStats(d),bonuses:Array.isArray(d.bonuses)?d.bonuses:[],rarity:d.rarity||null};}).filter(x=>x&&x.price>0);"
if old_fetch not in s: raise SystemExit('fetchMarket marker missing')
s=s.replace(old_fetch,new_fetch,1)
s=s.replace("const row={price:marketValue,averagePrice:average>0?average:null,minPrice:floor,listingPrice:effective?.price||floor,qty:effective?.qty||0,count:norm.length};","const row={price:marketValue,averagePrice:average>0?average:null,minPrice:floor,listingPrice:effective?.price||floor,qty:effective?.qty||0,count:norm.length,itemMeta,gearListings};",1)
anchor="        if(settings.priceNetwork&&priceNetworkConfigured())fetchNetworkConsensus(id).then(data=>{if(bar.dataset.itemId===String(id))updateNetworkBlock(bar,data);});"
if anchor not in s: raise SystemExit('scanItemMarket anchor missing')
s=s.replace(anchor,anchor+"\n        await renderLoadoutComparator(bar,market,id);",1)
s=s.replace("+toggle('itemMarket','Item Market + local watchlist')+toggle('priceNetwork'","+toggle('itemMarket','Item Market + local watchlist')+toggle('loadoutComparator','Loadout Comparator — compare market gear vs equipped')+toggle('priceNetwork'",1)
s=s.replace("'bazaar','itemMarket','priceNetwork','items'","'bazaar','itemMarket','loadoutComparator','priceNetwork','items'",1)
s=s.replace("itemMarketHistorySamples:state.itemMarketHistorySamples};","itemMarketHistorySamples:state.itemMarketHistorySamples,loadoutComparatorEnabled:settings.loadoutComparator,loadoutReady:state.loadoutReady,loadoutItems:state.loadoutItems,loadoutComparisons:state.loadoutComparisons,loadoutBestVerdict:state.loadoutBestVerdict,loadoutLastError:state.loadoutLastError};",1)
s=s.replace("itemMarketIntelligence(){if(detectPage()!=='itemmarket')return null;const id=selectedMarketItemId();if(!id)return null;const c=cachePeek(id);if(!c)return null;return analyzePriceHistory(id,Number(c.minPrice),c);},","itemMarketIntelligence(){if(detectPage()!=='itemmarket')return null;const id=selectedMarketItemId();if(!id)return null;const c=cachePeek(id);if(!c)return null;return analyzePriceHistory(id,Number(c.minPrice),c);},\n        async loadoutComparator(force=false){const id=selectedMarketItemId();if(!id)return null;const market=await fetchMarket(id,!!force);const equipped=await fetchEquippedLoadout(!!force);const slot=candidateSlot(market),current=compatibleEquipped(slot,equipped).sort((a,b)=>equippedScore(b,slot)-equippedScore(a,slot))[0]||null;return{itemId:id,slot,equipped:current,listings:marketGearListings(market).map(g=>({...g,comparison:current?compareGear(g,current,slot):null}))};},",1)
css_anchor=".sl-mi-network{display:flex;flex-direction:column;gap:3px;margin-top:7px;padding:7px;border:1px solid #2b3b49;border-radius:6px;background:#101820}"
css_add=".sl-mi-loadout{margin-top:7px;padding:7px;border:1px solid #374151;border-radius:7px;background:#10151b}.sl-mi-loadout-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.sl-mi-loadout-head>div{display:flex;flex-direction:column;gap:2px}.sl-mi-loadout-head>b,.sl-mi-loadout-head div>b{color:#d7b94c}.sl-mi-loadout-head span{color:#b8c0cb;font-size:9px}.sl-mi-loadout-refresh{border:1px solid #3a4654;background:#1a222c;color:#d7b94c;border-radius:6px;padding:4px 8px;font-weight:900}.sl-mi-loadout-note,.sl-mi-loadout-error{display:block;margin-top:5px;color:#8f98a5;font-size:8px;font-weight:600}.sl-mi-loadout-rows{display:flex;flex-direction:column;gap:4px;margin-top:6px}.sl-mi-loadout-row{display:grid;grid-template-columns:auto auto minmax(0,1fr) minmax(0,1fr);gap:6px;align-items:center;padding:6px;border-radius:5px;border:1px solid #29323a;font-size:9px}.sl-mi-loadout-row.upgrade{border-left:3px solid #78d98b;background:#142019}.sl-mi-loadout-row.downgrade{border-left:3px solid #e06c6c;background:#211515}.sl-mi-loadout-row.sidegrade{border-left:3px solid #d7b94c;background:#211e13}.sl-mi-loadout-row.unknown{border-left:3px solid #6b7280}.sl-mi-loadout-row.upgrade .sl-mi-loadout-verdict{color:#78d98b}.sl-mi-loadout-row.downgrade .sl-mi-loadout-verdict{color:#e06c6c}.sl-mi-loadout-row.sidegrade .sl-mi-loadout-verdict{color:#d7b94c}@media(max-width:700px){.sl-mi-loadout-row{grid-template-columns:auto auto;gap:3px 7px}.sl-mi-loadout-row>span:nth-child(3),.sl-mi-loadout-row>span:nth-child(4){grid-column:1/-1}}\n"
if css_anchor not in s: raise SystemExit('CSS anchor missing')
s=s.replace(css_anchor,css_add+css_anchor,1)
if s==old: raise SystemExit('no source changes')
p.write_text(s)

bp=Path('backups/SakaLuX-Market-Intelligence-v1.16.5.user.js')
if not bp.exists(): bp.write_text(old)

jp=Path('scripts.json');data=json.loads(jp.read_text())
for row in data['scripts']:
    if row.get('id')=='market-intelligence':
        row['version']='1.16.6'
        row['description']='Torn PDA-first market/travel intelligence with Loadout Comparator, automatic live-cash Best Buys, stable Travel/Bazaar panels, Price Network and Bazaar Flip.'
jp.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

mp=Path('greasyfork/Market-Intelligence.md');m=mp.read_text().replace('**Current version: v1.16.5**','**Current version: v1.16.6**',1)
rel="""## v1.16.6 — Loadout Comparator

- Added **Loadout Comparator** to Item Market Intelligence for weapons and armor.
- Reads your currently equipped combat gear from Torn API v2 `user/equipment` with a short local cache.
- Compares each stat-bearing Item Market listing against the matching equipped slot.
- Shows **UPGRADE / SIDEGRADE / DOWNGRADE**, listing price, Damage/Accuracy or Armor deltas, Quality and up to two listed bonuses.
- Weapon verdicts use base Damage + Accuracy direction; armor verdicts use Armor. Bonuses/mods are shown but intentionally not folded into a fake universal score.
- Added a manual refresh button, a Settings toggle, health diagnostics and `loadoutComparator()` to the public API.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.5.user.js`.

"""
if '## v1.16.4\n' not in m: raise SystemExit('docs marker missing')
m=m.replace('## v1.16.4\n',rel+'## v1.16.4\n',1);mp.write_text(m)

up=Path('UPDATE-INFO.md');u=up.read_text().replace('SakaLuX Market Intelligence: **v1.16.5**','SakaLuX Market Intelligence: **v1.16.6**',1).replace('**Market Intelligence v1.16.5**','**Market Intelligence v1.16.6**',1)
latest="""### SakaLuX Market Intelligence v1.16.6 — Loadout Comparator
- Added Item Market weapon/armor comparison against the player's currently equipped gear via Torn API v2 `user/equipment`.
- Shows UPGRADE / SIDEGRADE / DOWNGRADE with combat-stat deltas, price, quality and listed bonuses.
- Uses a short loadout cache and exposes comparator diagnostics/API helpers.

"""
if '## Latest changes\n\n' in u:u=u.replace('## Latest changes\n\n','## Latest changes\n\n'+latest,1)
up.write_text(u)
