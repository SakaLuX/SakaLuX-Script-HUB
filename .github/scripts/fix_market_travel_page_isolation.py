from pathlib import Path
import re

p = Path('SakaLuX-Market-Intelligence.user.js')
s = p.read_text(encoding='utf-8')

# Advance once for this isolation fix.
s = s.replace('// @version      1.17.57', '// @version      1.17.58', 1)
s = re.sub(r"(?m)^(\s*(?:const|let) VERSION\s*=\s*')1\.17\.57(';)", r"\g<1>1.17.58\2", s, count=1)
s = re.sub(r"(?m)^(\s*let v\s*=\s*')1\.17\.57(';)", r"\g<1>1.17.58\2", s, count=1)

marker = '/* SakaLuX Strict Travel Surface Isolation v1 */'
if marker not in s:
    anchor = """    function reconcileTravelPanelsRuntime(stateName){
        const policy=travelPanelPolicy(stateName);
        if(!policy.bestRoute)document.getElementById('sl-mi-best-run')?.remove();
        if(!policy.arrivalBasket)document.getElementById('sl-mi-arrival')?.remove();
        if(!policy.sessionSummary)document.getElementById('sl-mi-session')?.remove();
        if(!policy.landedBestBuys)document.querySelectorAll('#sl-mi-country-best,#sl-mi-travel-plan').forEach(n=>n.remove());
        return policy;
    }
"""
    replacement = anchor + """
    /* SakaLuX Strict Travel Surface Isolation v1 */
    function purgeTravelUiRuntime(){
        document.querySelectorAll('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-session,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-travel-inline-toggle').forEach(n=>n.remove());
        document.querySelectorAll('.sl-mi-pda-badge-row,.sl-mi-pda-badge-block').forEach(w=>{
            if(w.dataset?.miClass==='sl-mi-travel'||w.querySelector?.('.sl-mi-travel'))w.remove();
        });
        document.querySelectorAll('.sl-mi-travel').forEach(n=>n.remove());
    }

    function ensureTravelSurfaceRuntime(){
        const ok=detectPage()==='travel';
        if(!ok)purgeTravelUiRuntime();
        return ok;
    }
"""
    if anchor not in s:
        raise SystemExit('reconcileTravelPanelsRuntime anchor missing')
    s = s.replace(anchor, replacement, 1)

# All travel-only painters/mounters receive the same hard page guard.
replacements = {
    "    async function renderBestTravelRun(){\n": "    async function renderBestTravelRun(){\n        if(!ensureTravelSurfaceRuntime())return;\n",
    "    async function renderArrivalStock(){\n": "    async function renderArrivalStock(){\n        if(!ensureTravelSurfaceRuntime())return;\n",
    "    function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){\n": "    function paintCountryBestBuys(destination,entries,marketMap,availableCash=null){\n        if(!ensureTravelSurfaceRuntime())return;\n",
    "    function paintTravelBuyPlan(plan){\n": "    function paintTravelBuyPlan(plan){\n        if(!ensureTravelSurfaceRuntime())return;\n",
    "    function paintTravelSessionSummary(){\n": "    function paintTravelSessionSummary(){\n        if(!ensureTravelSurfaceRuntime())return;\n",
    "    function ensureTravelInlineInfoToggle(){\n": "    function ensureTravelInlineInfoToggle(){\n        if(!ensureTravelSurfaceRuntime())return null;\n",
}
for old, new in replacements.items():
    if old in s and new not in s:
        s = s.replace(old, new, 1)

old_scan = """    async function scanTravel(){
        if(!settings.travel)return;
        const travelCtx=detectTravelStateRuntime();
"""
new_scan = """    async function scanTravel(){
        if(!ensureTravelSurfaceRuntime()){
            state.travelState=TRAVEL_STATES.OTHER;
            state.travelDestination='';
            return;
        }
        if(!settings.travel){purgeTravelUiRuntime();return;}
        const travelCtx=detectTravelStateRuntime();
"""
if old_scan in s:
    s = s.replace(old_scan, new_scan, 1)
elif new_scan not in s:
    raise SystemExit('scanTravel anchor missing')

# Async race protection: before mounting after awaits, the render helpers already re-check at entry,
# and this final check prevents scanTravel from painting landed UI after SPA navigation changed page.
old_after_cash = """        const availableCash=await fetchAvailableCash(true);
        const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
"""
new_after_cash = """        const availableCash=await fetchAvailableCash(true);
        if(!ensureTravelSurfaceRuntime())return;
        const imgs=[...document.querySelectorAll('img[src*=\"/images/items/\"]')],entries=[],seen=new Set();
"""
if old_after_cash in s:
    s = s.replace(old_after_cash, new_after_cash, 1)

p.write_text(s, encoding='utf-8')
