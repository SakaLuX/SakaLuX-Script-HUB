from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Market-Intelligence.user.js'
REG = ROOT / 'scripts.json'
DOC = ROOT / 'greasyfork' / 'Market-Intelligence.md'
REL = ROOT / 'releases' / 'market-intelligence-v1.17.57.md'

s = SCRIPT.read_text(encoding='utf-8')

# Version sync.
s = s.replace('// @version      1.17.56', '// @version      1.17.57', 1)
s = s.replace("let v = '1.17.56';", "let v = '1.17.57';", 1)
s = s.replace("const VERSION = '1.17.56';", "const VERSION = '1.17.57';", 1)


def replace_between(text, start_marker, end_marker, replacement, label):
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f'{label}: start marker not found')
    end = text.find(end_marker, start)
    if end < 0:
        raise SystemExit(f'{label}: end marker not found')
    return text[:start] + replacement + text[end:]

# Prefer the live Torn travel-page balance when it is visible. This fixes the PDA case where
# the API balance path can transiently report zero while Torn itself shows the actual cash.
cash_block = r'''    function readAvailableCashFromPage() {
        const root=document.querySelector('#mainContainer,[role="main"],main,#content')||document.body;
        const text=normText(root?.innerText||root?.textContent||'');
        if(!text)return null;
        const patterns=[
            /\byou are in\b.{0,120}?\band have\s*\$\s*([\d,.]+)\b/i,
            /\byou have\s*\$\s*([\d,.]+)\b/i
        ];
        for(const re of patterns){
            const m=text.match(re);if(!m)continue;
            const n=Number(String(m[1]).replace(/,/g,''));
            if(Number.isFinite(n)&&n>=0)return Math.floor(n);
        }
        return null;
    }

    async function fetchAvailableCash(force=false) {
        const now=Date.now();
        const pageCash=readAvailableCashFromPage();
        if(Number.isFinite(pageCash)){
            state.availableCash=pageCash;state.availableCashAt=now;state.availableCashSource='torn-page';
            return state.availableCash;
        }
        if(!force&&Number.isFinite(state.availableCash)&&now-state.availableCashAt<CASH_CACHE_MS)return state.availableCash;
        const key=getApiKey();if(!key)return Number.isFinite(state.availableCash)?state.availableCash:null;
        try{
            const data=await requestJson('https://api.torn.com/user/?selections=money&key='+encodeURIComponent(key));
            checkApiError(data);
            const raw=data?.money_onhand??data?.money?.onhand??data?.money?.cash??data?.cash;
            const cash=Number(raw);
            if(Number.isFinite(cash)&&cash>=0){state.availableCash=Math.floor(cash);state.availableCashAt=now;state.availableCashSource='torn-api';return state.availableCash;}
        }catch(_){}
        return Number.isFinite(state.availableCash)?state.availableCash:null;
    }
'''
s = replace_between(
    s,
    '    async function fetchAvailableCash(force=false) {',
    '\n\n    function normalizeGearStats',
    cash_block,
    'cash reader'
)

# Best Buys becomes an explicit single-choice picker. Every visible candidate can be selected,
# the selected item persists per destination, and its quantity is recalculated from live cash,
# free slots and current foreign stock. MARK PLAN BOUGHT records that selected plan.
best_buys_block = r'''    function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){
        document.getElementById('sl-mi-country-best')?.remove();
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const cash=Number.isFinite(Number(availableCash))?Math.max(0,Math.floor(Number(availableCash))):null;
        const fallbackBudget=Math.max(0,Number(settings.travelBudget)||0);
        const effectiveBudget=cash!=null?cash:fallbackBudget;
        const suggestedPlan=buildTravelBuyPlan(destination,entries,marketMap,effectiveBudget);
        const suggestedQty=new Map((suggestedPlan?.rows||[]).map(r=>[String(r.id),Number(r.qty)||0]));
        const candidates=travelPlannerCandidates(entries,marketMap,slots).map(r=>{
            const stock=Math.max(0,Math.floor(Number(r.stock)||0));
            return {...r,suggestedQty:suggestedQty.get(String(r.id))||0,stock};
        });
        candidates.sort((a,b)=>{
            const ap=a.suggestedQty>0?1:0,bp=b.suggestedQty>0?1:0;
            if(ap!==bp)return bp-ap;
            if(ap&&bp)return (b.profitItem*b.suggestedQty)-(a.profitItem*a.suggestedQty)||b.profitItem-a.profitItem||b.roi-a.roi;
            return b.profitItem-a.profitItem||b.roi-a.roi;
        });
        if(!candidates.length){state.countryBestBuysRows=0;return;}

        const selectionKey='SakaLuX_MI_BEST_BUY_SELECTION_V1';
        let selections={};
        try{selections=JSON.parse(localStorage.getItem(selectionKey)||'{}')||{};}catch(_){selections={};}
        const suggestedId=Number(suggestedPlan?.rows?.[0]?.id)||Number(candidates[0]?.id)||0;
        const savedId=Number(selections[destination])||0;
        let selected=candidates.find(r=>Number(r.id)===savedId)||candidates.find(r=>Number(r.id)===suggestedId)||candidates[0];

        function singleItemPlan(r){
            if(!r)return null;
            const budget=cash!=null?cash:fallbackBudget;
            const affordable=budget>0?Math.floor(budget/Math.max(1,Number(r.buy)||1)):0;
            const qty=Math.max(0,Math.min(slots,Math.max(0,Number(r.stock)||0),affordable));
            const cost=(Number(r.buy)||0)*qty,profit=(Number(r.profitItem)||0)*qty;
            return {destination,slots,used:qty,remaining:Math.max(0,slots-qty),totalCost:cost,totalProfit:profit,rows:qty>0?[{...r,qty,cost,profit}]:[],budget,unusedBudget:Math.max(0,budget-cost),mode:'SELECTED'};
        }

        let activePlan=singleItemPlan(selected);
        updateLandedSession(destination,activePlan);
        state.countryBestBuysRows=Math.min(12,candidates.length);
        state.countryBestBuysDestination=destination||'';
        state.countryBestBuyName=selected?.name||'';
        state.countryBestBuyProfit=selected?.profitItem||0;
        state.countryBestBuyQty=activePlan?.used||0;

        const top=candidates.slice(0,12);
        if(selected&&!top.some(r=>Number(r.id)===Number(selected.id))){if(top.length>=12)top[top.length-1]=selected;else top.push(selected);}
        const bar=document.createElement('div');bar.id='sl-mi-country-best';bar.className='open';
        const cashText=cash!=null?(' · cash '+money(cash)):(fallbackBudget>0?(' · fallback budget '+money(fallbackBudget)):' · cash unavailable');
        const selectedLabel=selected?.name||('Item #'+(selected?.id||'?'));
        const canBuy=(activePlan?.used||0)>0;
        bar.innerHTML='<div class="sl-mi-country-head"><div><span class="sl-mi-br-title">🌍 BEST BUYS · '+esc(destination.toUpperCase())+'</span><strong>Selected: '+esc(selectedLabel)+'</strong></div><div>'+((activePlan?.used)||0)+'/'+slots+' slots · '+money(activePlan?.totalProfit||0)+' profit'+cashText+'</div><button type="button">▾</button></div>'+
            '<div class="sl-mi-country-note">Live Torn cash is detected automatically. Tap any option below to make it your active buy plan; the selected item stays selected for this destination and MARK PLAN BOUGHT records that choice.</div>'+
            '<div class="sl-mi-country-summary"><span>Spend <strong>'+money(activePlan?.totalCost||0)+'</strong></span><span>Expected net profit <strong>'+money(activePlan?.totalProfit||0)+'</strong></span><span>Mode <strong>SELECTED</strong></span><span>Cash left <strong>'+money(activePlan?.unusedBudget||0)+'</strong></span><button type="button" id="sl-mi-mark-bought" '+(canBuy?'':'disabled')+'>'+(travelSessions.current?.recorded?'PLAN RECORDED ✓':(canBuy?'MARK PLAN BOUGHT':'NOT ENOUGH CASH'))+'</button></div><div class="sl-mi-country-body"></div>';
        const body=bar.querySelector('.sl-mi-country-body');
        top.forEach((r,index)=>{
            const isSelected=Number(r.id)===Number(selected?.id);
            const row=document.createElement('div');row.className='sl-mi-country-row '+(isSelected?'recommended selected':'alternative');row.setAttribute('role','button');row.tabIndex=0;row.dataset.itemId=String(r.id);
            if(isSelected)row.style.outline='2px solid currentColor';
            const rowBudget=cash!=null?cash:fallbackBudget;
            const rowQty=Math.max(0,Math.min(slots,Math.max(0,Number(r.stock)||0),rowBudget>0?Math.floor(rowBudget/Math.max(1,Number(r.buy)||1)):0));
            const buyLabel=isSelected?(rowQty>0?('SELECTED · BUY ×'+rowQty):'SELECTED · UNAFFORDABLE'):'SELECT';
            const total=isSelected?(r.profitItem*rowQty):r.profitItem;
            row.innerHTML='<span class="rank">#'+(index+1)+'</span><span class="name">'+esc(r.name)+'</span><strong class="buy">'+buyLabel+'</strong><span>stock '+Math.round(r.stock).toLocaleString('en-US')+'</span><span>buy '+money(r.buy)+'</span><span>market '+money(r.market)+'</span><span class="profit">+'+money(r.profitItem)+'/ea</span><span>'+pct(r.roi)+'</span><strong class="total">+'+money(total)+'</strong>';
            const choose=()=>{
                selections[destination]=Number(r.id);try{localStorage.setItem(selectionKey,JSON.stringify(selections));}catch(_){}
                if(travelSessions.current){travelSessions.current.recorded=null;travelSessions.current.status='LANDED';saveTravelSessions();}
                try{r.row?.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row?.scrollIntoView();}
                if(r.row){r.row.classList.add('sl-mi-target');setTimeout(()=>r.row.classList.remove('sl-mi-target'),2200);}
                paintCountryBestBuys(destination,entries,marketMap,availableCash);
                paintTravelSessionSummary();
            };
            row.onclick=choose;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}};body.appendChild(row);
        });
        bar.querySelector('.sl-mi-country-head').onclick=()=>bar.classList.toggle('open');
        const mark=bar.querySelector('#sl-mi-mark-bought');if(mark)mark.onclick=e=>{e.stopPropagation();if(markCurrentPlanBought()){mark.textContent='PLAN RECORDED ✓';mark.disabled=true;}};
        mountTop(bar);
        paintTravelSessionSummary();
    }

'''
s = replace_between(
    s,
    '    function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){',
    '    function paintTravelBuyPlan(plan){',
    best_buys_block,
    'Best Buys picker'
)

SCRIPT.write_text(s, encoding='utf-8')

# Registry sync.
obj=json.loads(REG.read_text(encoding='utf-8'))
for row in obj.get('scripts',[]):
    if row.get('id')=='market-intelligence':
        row['version']='1.17.57'
        row['detailsRevision']=int(row.get('detailsRevision') or 0)+1
        row['release']={
            'version':'1.17.57','date':'2026-09-30',
            'notes':[
                'Best Buys now detects the live Torn cash balance automatically, including a Torn-page fallback for PDA travel pages.',
                'Every Best Buys option is selectable instead of always using the first recommendation.',
                'The selected item persists per destination and recalculates quantity from live cash, travel slots and current stock.',
                'MARK PLAN BOUGHT now records the currently selected option and its calculated quantity.'
            ]
        }
        break
REG.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Greasy Fork documentation + changelog.
if DOC.exists():
    d=DOC.read_text(encoding='utf-8')
    d=d.replace('**v1.17.56**','**v1.17.57**',1)
    d=d.replace('Canonical version: **v1.17.56**','Canonical version: **v1.17.57**',1)
    marker='## Changelog\n'
    entry='''\n### v1.17.57 — Automatic cash + selectable Best Buys\n- Best Buys reads the live Torn cash balance automatically; on TornPDA/foreign travel pages it can fall back to Torn\'s visible “you have $…” balance.\n- Any Best Buys row can be selected as the active plan instead of the first recommendation being forced.\n- The selection persists per destination and the selected quantity is recalculated from cash, slot capacity and current stock.\n- MARK PLAN BOUGHT records the selected item plan, not an implicit first-row plan.\n\n'''
    if marker in d:d=d.replace(marker,marker+entry,1)
    else:d+=entry
    DOC.write_text(d,encoding='utf-8')

REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('''# SakaLuX Market Intelligence v1.17.57\n\nRelease date: **2026-09-30**\n\n## Travel / Best Buys\n- Live cash is detected automatically.\n- TornPDA foreign-market pages use Torn\'s visible cash sentence as a robust fallback before the API cache.\n- Every Best Buys candidate is selectable.\n- The selected candidate persists independently for each destination.\n- BUY quantity is recalculated from available cash, travel slots and current foreign stock.\n- The summary and Travel Session use the selected plan.\n- MARK PLAN BOUGHT records the selected candidate and quantity.\n\n## Compatibility\n- Existing Travel Session Summary, market pricing, YATA cache, stock tracking, inline travel info and non-Best-Buys planner behavior remain intact.\n''',encoding='utf-8')
