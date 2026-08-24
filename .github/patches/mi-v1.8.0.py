from pathlib import Path
import json,re,shutil

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
BACKUP=ROOT/'backups/SakaLuX-Market-Intelligence-v1.7.0.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

# Always build from the exact published v1.7.0 backup.
if not BACKUP.exists(): raise SystemExit('Missing v1.7.0 backup')
shutil.copyfile(BACKUP,SRC)
s=SRC.read_text(encoding='utf-8')
if '// @version      1.7.0' not in s: raise SystemExit('Backup is not v1.7.0')

s=s.replace('// @version      1.7.0','// @version      1.8.0',1)
s=s.replace('// @description  Torn market and travel intelligence with Travel Buy Planner, real flight-time detection, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.','// @description  Torn market and travel intelligence with budget-aware Travel Buy Planner, real flight-time detection, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum valuation.',1)
s=s.replace("const VERSION = '1.7.0';","const VERSION = '1.8.0';",1)
s=s.replace("travelSlots: 29,\n        flightMultiplier: 1","travelSlots: 29,\n        travelBudget: 0,\n        flightMultiplier: 1",1)
s=s.replace("travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0","travelPlanItems: 0, travelPlanCost: 0, travelPlanProfit: 0, travelPlanSlots: 0, travelPlanBudget: 0, travelPlanUnusedBudget: 0",1)

new_build=r'''    function buildTravelBuyPlan(destination, entries, marketMap) {
        const slots=Math.max(1,Number(settings.travelSlots)||29);
        const configuredBudget=Math.max(0,Number(settings.travelBudget)||0);
        let budgetLeft=configuredBudget>0?configuredBudget:Infinity;
        const ranked=[];
        for(const e of entries){
            const market=marketMap.get(e.id);if(!market)continue;
            const m=metrics(e.buy,market.price);if(m.profit<=0)continue;
            const stock=e.stock==null?slots:Math.max(0,Number(e.stock)||0);
            if(stock<=0)continue;
            ranked.push({id:e.id,name:e.name,buy:e.buy,stock,market:market.price,profitItem:m.profit,roi:m.roi,row:e.row,efficiency:e.buy>0?m.profit/e.buy:0});
        }
        ranked.sort((a,b)=>b.profitItem-a.profitItem || b.efficiency-a.efficiency || b.roi-a.roi);
        let remaining=slots,totalCost=0,totalProfit=0;
        const plan=[];
        for(const r of ranked){
            if(remaining<=0||budgetLeft<=0)break;
            const affordable=Number.isFinite(budgetLeft)?Math.floor(budgetLeft/r.buy):remaining;
            const qty=Math.min(remaining,r.stock,affordable);
            if(qty<=0)continue;
            const cost=r.buy*qty,profit=r.profitItem*qty;
            totalCost+=cost;totalProfit+=profit;remaining-=qty;
            if(Number.isFinite(budgetLeft))budgetLeft-=cost;
            plan.push({...r,qty,cost,profit});
        }
        return {destination,slots,used:slots-remaining,remaining,totalCost,totalProfit,rows:plan,budget:configuredBudget,unusedBudget:configuredBudget>0?Math.max(0,configuredBudget-totalCost):null};
    }'''
s,n=re.subn(r'    function buildTravelBuyPlan\(destination, entries, marketMap\) \{.*?\n    \}\n\n    function paintTravelBuyPlan',new_build+'\n\n    function paintTravelBuyPlan',s,count=1,flags=re.S)
if n!=1: raise SystemExit('Could not replace buildTravelBuyPlan')

new_paint=r'''    function paintTravelBuyPlan(plan){
        document.getElementById('sl-mi-travel-plan')?.remove();
        state.travelPlanItems=plan?.rows?.length||0;
        state.travelPlanCost=plan?.totalCost||0;
        state.travelPlanProfit=plan?.totalProfit||0;
        state.travelPlanSlots=plan?.used||0;
        state.travelPlanBudget=plan?.budget||0;
        state.travelPlanUnusedBudget=plan?.unusedBudget||0;
        if(!plan?.rows?.length)return;
        const bar=document.createElement('div');bar.id='sl-mi-travel-plan';bar.className='open';
        const budgetText=plan.budget>0?(' · budget '+money(plan.budget)):' · unlimited budget';
        bar.innerHTML='<div class="sl-mi-plan-head"><div><span class="sl-mi-br-title">🧳 TRAVEL BUY PLANNER</span><strong>'+esc(plan.destination)+'</strong></div><div>'+plan.used+'/'+plan.slots+' slots · '+money(plan.totalProfit)+' profit'+budgetText+'</div><button type="button">▾</button></div><div class="sl-mi-plan-note">Plan respects both configured travel capacity and optional cash budget. Set budget to 0 for no money limit.</div><div class="sl-mi-plan-summary"><span>Spend <strong>'+money(plan.totalCost)+'</strong></span><span>Expected net profit <strong>'+money(plan.totalProfit)+'</strong></span><span>Unused slots <strong>'+plan.remaining+'</strong></span>'+(plan.budget>0?'<span>Budget left <strong>'+money(plan.unusedBudget)+'</strong></span>':'')+'</div><div class="sl-mi-plan-body"></div>';
        const body=bar.querySelector('.sl-mi-plan-body');
        for(const r of plan.rows){
            const row=document.createElement('div');row.className='sl-mi-plan-row';row.setAttribute('role','button');row.tabIndex=0;
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>BUY ×'+r.qty+'</span><span>'+money(r.buy)+'/ea</span><span>cost '+money(r.cost)+'</span><span>'+money(r.profit)+'</span><strong>'+pct(r.roi)+'</strong>';
            const go=()=>{try{r.row?.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row?.scrollIntoView();}if(r.row){r.row.classList.add('sl-mi-target');setTimeout(()=>r.row.classList.remove('sl-mi-target'),2200);}};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        }
        bar.querySelector('.sl-mi-plan-head').onclick=()=>bar.classList.toggle('open');
        mountTop(bar);
    }'''
s,n=re.subn(r'    function paintTravelBuyPlan\(plan\)\{.*?\n    \}\n\n    async function scanTravel',new_paint+'\n\n    async function scanTravel',s,count=1,flags=re.S)
if n!=1: raise SystemExit('Could not replace paintTravelBuyPlan')

# Settings field and save handler.
s=s.replace("<label class=\"sl-mi-field\">Travel slots<input id=\"sl-mi-slots\" type=\"number\" min=\"1\" max=\"100\" value=\"'+esc(settings.travelSlots)+'\"></label>","<label class=\"sl-mi-field\">Travel slots<input id=\"sl-mi-slots\" type=\"number\" min=\"1\" max=\"100\" value=\"'+esc(settings.travelSlots)+'\"></label><label class=\"sl-mi-field\">Travel budget ($)<input id=\"sl-mi-budget\" inputmode=\"numeric\" value=\"'+esc(settings.travelBudget||0)+'\" placeholder=\"0 = unlimited\"></label>",1)
s=s.replace("settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.flightMultiplier", "settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.travelBudget=Math.max(0,parseMoney(overlay.querySelector('#sl-mi-budget').value)||0);settings.flightMultiplier",1)
s=s.replace("travelPlanItems:state.travelPlanItems,travelPlanCost:state.travelPlanCost,travelPlanProfit:state.travelPlanProfit,travelPlanSlots:state.travelPlanSlots", "travelPlanItems:state.travelPlanItems,travelPlanCost:state.travelPlanCost,travelPlanProfit:state.travelPlanProfit,travelPlanSlots:state.travelPlanSlots,travelPlanBudget:state.travelPlanBudget,travelPlanUnusedBudget:state.travelPlanUnusedBudget",1)

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for e in reg.get('scripts',[]):
    if e.get('id')=='market-intelligence':
        e['version']='1.8.0'
        e['description']='Market/travel intelligence with budget-aware Travel Buy Planner, real Torn flight times, Bazaar Flip Intelligence, Item Market trend/signals, arrival prediction and Museum set valuation.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.7.0**','SakaLuX Market Intelligence: **v1.8.0**',1)
release='''### SakaLuX Market Intelligence v1.8.0\n- Added **Travel Budget Planner** on top of the existing Travel Buy Planner.\n- Added a configurable **Travel budget ($)** field; `0` means unlimited budget.\n- Recommended shopping quantities now respect both available travel slots and available cash budget.\n- The planner automatically reduces quantities when the next item would exceed the configured budget.\n- Shows configured budget, planned spend, remaining budget, expected net profit, used slots and unused slots.\n- Keeps the existing direct jump/highlight behavior for recommended abroad items.\n- Added `travelPlanBudget` and `travelPlanUnusedBudget` to `health()`.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.7.0.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
info=info.replace('## Backups available\n\n','## Backups available\n\n- `backups/SakaLuX-Market-Intelligence-v1.7.0.user.js`\n',1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.7.0**','**Current version: v1.8.0**',1)
gf_release='''## v1.8.0 — Travel Budget Planner\n\n- Travel Buy Planner can now use an optional cash budget in addition to travel capacity.\n- Set **Travel budget ($)** in Settings; `0` keeps the old unlimited-budget behavior.\n- Recommended quantities are automatically capped by both available slots and remaining budget.\n- The planner shows total spend, expected net profit, remaining budget, used capacity and unused slots.\n- Existing item jump/highlight behavior remains unchanged.\n- `health()` now exposes configured and unused planner budget.\n\n'''
gf=gf.replace('## v1.7.0 — Travel Buy Planner\n',gf_release+'## v1.7.0 — Travel Buy Planner\n',1)
gf=gf.replace('No observations are uploaded to a SakaLuX server in v1.7.0.','No observations are uploaded to a SakaLuX server in v1.8.0.',1)
GF.write_text(gf,encoding='utf-8')
