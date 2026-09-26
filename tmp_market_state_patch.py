from pathlib import Path
import json, re

ROOT = Path('.')
market_path = ROOT / 'SakaLuX-Market-Intelligence.user.js'
scripts_path = ROOT / 'scripts.json'
hub_path = ROOT / 'SakaLuX-Script-Hub.user.js'
market_md_path = ROOT / 'greasyfork' / 'Market-Intelligence.md'
hub_md_path = ROOT / 'greasyfork' / 'Script-Hub.md'

OLD='1.17.50'
NEW='1.17.51'
DATE='2026-09-26'

market = market_path.read_text(encoding='utf-8')
if f'// @version      {OLD}' not in market and f'// @version      {NEW}' not in market:
    raise SystemExit('Unexpected Market version; refusing patch')
market = market.replace(OLD, NEW)

state_block = r'''
    // Explicit Travel lifecycle state machine. Keeps travel UI deterministic across Torn SPA/TornPDA navigation.
    const TRAVEL_STATES = Object.freeze({
        TORN_TRAVEL_AGENCY:'TORN_TRAVEL_AGENCY',
        IN_FLIGHT:'IN_FLIGHT',
        LANDED_ABROAD:'LANDED_ABROAD',
        OTHER:'OTHER'
    });

    function detectTravelStateRuntime(){
        const href=String(location.href||''), pathname=String(location.pathname||''), body=document.body?.innerText||'';
        if(/Remaining Flight Time/i.test(body)||/Traveling from .* to /i.test(body))return {state:TRAVEL_STATES.IN_FLIGHT,destination:null};
        const textMatch=body.match(/You are in ([A-Z][A-Za-z ]+?) and have/i);
        const destination=normalizeDestination((textMatch&&textMatch[1])||detectDestination()||'');
        if(destination||/abroad\.php/i.test(href)||/\/abroad(?:\.php)?/i.test(pathname))return {state:TRAVEL_STATES.LANDED_ABROAD,destination};
        if(/travelagency\.php/i.test(href)||/[?&]sid=travel(?:&|$)/i.test(href)||/Travel Agency/i.test(body))return {state:TRAVEL_STATES.TORN_TRAVEL_AGENCY,destination:null};
        return {state:TRAVEL_STATES.OTHER,destination:null};
    }

    function travelPanelPolicy(stateName){
        return {
            bestRoute:stateName===TRAVEL_STATES.TORN_TRAVEL_AGENCY,
            arrivalBasket:stateName===TRAVEL_STATES.IN_FLIGHT,
            sessionSummary:stateName===TRAVEL_STATES.TORN_TRAVEL_AGENCY||stateName===TRAVEL_STATES.IN_FLIGHT||stateName===TRAVEL_STATES.LANDED_ABROAD,
            landedBestBuys:stateName===TRAVEL_STATES.LANDED_ABROAD
        };
    }

    function reconcileTravelPanelsRuntime(stateName){
        const policy=travelPanelPolicy(stateName);
        if(!policy.bestRoute)document.getElementById('sl-mi-best-run')?.remove();
        if(!policy.arrivalBasket)document.getElementById('sl-mi-arrival')?.remove();
        if(!policy.sessionSummary)document.getElementById('sl-mi-session')?.remove();
        if(!policy.landedBestBuys)document.querySelectorAll('#sl-mi-country-best,#sl-mi-travel-plan').forEach(n=>n.remove());
        return policy;
    }
'''

if 'const TRAVEL_STATES = Object.freeze({' not in market:
    marker = '    function detectDestination()'
    idx = market.find(marker)
    if idx < 0:
        raise SystemExit('detectDestination marker not found')
    market = market[:idx] + state_block + '\n' + market[idx:]

old_head = """    async function scanTravel(){\n        if(!settings.travel)return;\n        if(detectInFlight()){document.getElementById('sl-mi-best-run')?.remove();await renderArrivalStock();return;}\n        document.getElementById('sl-mi-arrival')?.remove();"""
new_head = """    async function scanTravel(){\n        if(!settings.travel)return;\n        const travelCtx=detectTravelStateRuntime();\n        const travelPolicy=reconcileTravelPanelsRuntime(travelCtx.state);\n        state.travelState=travelCtx.state;\n        state.travelDestination=travelCtx.destination||'';\n        if(travelCtx.state===TRAVEL_STATES.OTHER)return;\n        if(travelCtx.state===TRAVEL_STATES.IN_FLIGHT){await renderArrivalStock();paintTravelSessionSummary();return;}\n        document.getElementById('sl-mi-arrival')?.remove();"""
if old_head in market:
    market = market.replace(old_head, new_head, 1)
elif 'const travelCtx=detectTravelStateRuntime();' not in market:
    raise SystemExit('scanTravel head did not match')

old_dest = """        const destination=detectDestination();\n        // Best Route Basket belongs only to Torn's Travel page, never to a landed foreign-country shop.\n        if(!destination){await renderBestTravelRun();paintTravelSessionSummary();return;}"""
new_dest = """        const destination=travelCtx.destination||detectDestination();\n        // Explicit state policy: Best Route Basket is Torn Travel Agency only.\n        if(travelCtx.state===TRAVEL_STATES.TORN_TRAVEL_AGENCY){await renderBestTravelRun();paintTravelSessionSummary();return;}\n        if(travelCtx.state!==TRAVEL_STATES.LANDED_ABROAD)return;\n        document.getElementById('sl-mi-best-run')?.remove();"""
if old_dest in market:
    market = market.replace(old_dest, new_dest, 1)
elif 'if(travelCtx.state===TRAVEL_STATES.TORN_TRAVEL_AGENCY)' not in market:
    raise SystemExit('travel destination branch did not match')

# Strengthen non-travel cleanup to include all travel panels from the explicit policy.
market = market.replace(
    "document.querySelectorAll('#sl-mi-session,#sl-mi-arrival').forEach(n=>n.remove())",
    "document.querySelectorAll('#sl-mi-session,#sl-mi-arrival,#sl-mi-best-run,#sl-mi-country-best,#sl-mi-travel-plan').forEach(n=>n.remove())"
)
market_path.write_text(market, encoding='utf-8')

# Registry metadata.
data = json.loads(scripts_path.read_text(encoding='utf-8'))
entry = next((x for x in data.get('scripts',[]) if x.get('id')=='market-intelligence'), None)
if not entry:
    raise SystemExit('market-intelligence missing from scripts.json')
entry['version']=NEW
entry['detailsRevision']=int(entry.get('detailsRevision',0))+1
entry['release']={
    'version':NEW,
    'date':DATE,
    'notes':[
        'Adds an explicit Travel lifecycle state machine: TORN_TRAVEL_AGENCY, IN_FLIGHT, LANDED_ABROAD and OTHER.',
        'Shows Best Route Basket only on Torn Travel Agency, Arrival Basket only in flight, and landed Best Buys/Planner only abroad.',
        'Removes stale Travel panels deterministically during Torn SPA/TornPDA navigation, including Travel → Flight → foreign country → Messages → Travel.',
        'Keeps Travel Session Summary inside the travel lifecycle and adds permanent regression coverage for Hawaii and other foreign destinations.'
    ]
}
scripts_path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

# Hub offline/fallback registry version surfaces. Limit the replacement to the Market record neighborhood.
hub = hub_path.read_text(encoding='utf-8')
market_idx = hub.find('"id": "market-intelligence"')
if market_idx < 0:
    market_idx = hub.find("'id':'market-intelligence'")
if market_idx < 0:
    raise SystemExit('Market registry not found in Hub')
start=max(0, market_idx-2500); end=min(len(hub), market_idx+9000)
chunk=hub[start:end]
chunk=chunk.replace(OLD,NEW)
# Refresh release metadata in fallback block when recognizable.
release_pattern=re.compile(r'("release"\s*:\s*\{\s*"version"\s*:\s*")'+re.escape(NEW)+r'("\s*,\s*"date"\s*:\s*")[^"]+("\s*,\s*"notes"\s*:\s*\[)(.*?)(\]\s*\})', re.S)
notes='"Adds an explicit Travel lifecycle state machine for Travel Agency, flight, landed-abroad and other pages.", "Scopes Best Route, Arrival Basket and landed-country panels to their exact travel states.", "Adds SPA/TornPDA stale-panel cleanup and permanent travel navigation regression coverage."'
chunk=release_pattern.sub(lambda m:m.group(1)+NEW+m.group(2)+DATE+m.group(3)+notes+m.group(5),chunk,count=1)
hub=hub[:start]+chunk+hub[end:]
hub_path.write_text(hub,encoding='utf-8')

# GreasyFork documentation + changelog.
md=market_md_path.read_text(encoding='utf-8')
md=md.replace(f'**v{OLD}**',f'**v{NEW}**',1)
md=md.replace(f'Canonical version: **v{OLD}**',f'Canonical version: **v{NEW}**')
release_block=f'''**v{NEW} — Explicit Travel state machine**\n- Adds explicit `TORN_TRAVEL_AGENCY`, `IN_FLIGHT`, `LANDED_ABROAD` and `OTHER` travel states.\n- Best Route Basket is now strictly limited to Torn Travel Agency.\n- Arrival Basket is limited to active flights; in-country Best Buys / Travel Buy Planner are limited to landed foreign pages.\n- Travel Session Summary remains inside the travel lifecycle and all stale travel panels are removed during SPA/TornPDA route changes.\n- Permanent regression coverage validates Hawaii/foreign-country classification and Travel → Flight → foreign country → Messages → Travel navigation.\n'''
if f'**v{NEW} — Explicit Travel state machine**' not in md:
    marker='## Current release note'
    pos=md.find(marker)
    if pos>=0:
        after=md.find('\n',pos)+1
        # Replace the first current-release paragraph heading with the new release while retaining prior history below.
        next_heading=md.find('**v',after)
        history_heading=md.find('## Release history / Changelog')
        if next_heading>=0 and history_heading>next_heading:
            md=md[:next_heading]+release_block+'\n'+md[history_heading:]
        else:
            md=md[:after]+'\n'+release_block+'\n'+md[after:]
    hist='## Release history / Changelog'
    hpos=md.find(hist)
    if hpos>=0 and f'### v{NEW} — Explicit Travel state machine' not in md:
        insert=hpos+len(hist)
        changelog='\n\n### v'+NEW+' — Explicit Travel state machine\n- Adds explicit `TORN_TRAVEL_AGENCY`, `IN_FLIGHT`, `LANDED_ABROAD` and `OTHER` travel states.\n- Enforces deterministic panel scoping for Best Route, Arrival Basket, landed-country tools and Travel Session Summary.\n- Cleans stale panels on SPA/TornPDA navigation and adds permanent regression coverage for the complete travel lifecycle.\n'
        md=md[:insert]+changelog+md[insert:]
market_md_path.write_text(md,encoding='utf-8')

if hub_md_path.exists():
    hmd=hub_md_path.read_text(encoding='utf-8').replace(f'SakaLuX Market Intelligence **v{OLD}**',f'SakaLuX Market Intelligence **v{NEW}**')
    hub_md_path.write_text(hmd,encoding='utf-8')

print('Market Travel state machine integration prepared for',NEW)
