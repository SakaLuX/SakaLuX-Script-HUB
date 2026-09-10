from pathlib import Path
import json,re,shutil

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text()
old=s

# Backup current release before changes
backup=Path('backups/SakaLuX-Market-Intelligence-v1.16.6.user.js')
if not backup.exists(): backup.write_text(s)

s=s.replace('// @version      1.16.6','// @version      1.16.7',1)
s=s.replace("const VERSION = '1.16.6';","const VERSION = '1.16.7';",1)

# Sliding switch markup
old_toggle="""    function toggle(key,label){return '<label class=\"sl-mi-toggle\"><input id=\"sl-mi-'+key+'\" type=\"checkbox\" '+(settings[key]?'checked':'')+'><span>'+esc(label)+'</span></label>';}"""
new_toggle="""    function toggle(key,label){return '<label class=\"sl-mi-toggle\"><span class=\"sl-mi-toggle-label\">'+esc(label)+'</span><span class=\"sl-mi-switch\"><input data-mi-toggle=\"1\" data-setting=\"'+esc(key)+'\" id=\"sl-mi-'+key+'\" type=\"checkbox\" '+(settings[key]?'checked':'')+'><span class=\"sl-mi-switch-ui\"></span></span></label>';}"""
if old_toggle not in s: raise SystemExit('toggle marker missing')
s=s.replace(old_toggle,new_toggle,1)

# Live toggle helpers; do not clear caches/history or close/rebuild settings panel
marker='    function openSettings(){\n'
insert=r'''    function removeNodes(selector){document.querySelectorAll(selector).forEach(n=>n.remove());}
    function cleanupLiveFeature(key){
        const map={
            enabled:'.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items,#sl-mi-market-bar,#sl-mi-points-bar,#sl-mi-museum-bar,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-bazaar-board,#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session',
            travel:'.sl-mi-travel,#sl-mi-best-run,#sl-mi-arrival,#sl-mi-travel-plan,#sl-mi-country-best,#sl-mi-session',
            bestRun:'#sl-mi-best-run',countryBestBuys:'#sl-mi-country-best',arrivalStock:'#sl-mi-arrival',sessionSummary:'#sl-mi-session',
            bazaar:'.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,#sl-mi-bazaar-board',itemMarket:'#sl-mi-market-bar',loadoutComparator:'.sl-mi-loadout',
            items:'.sl-mi-items',museum:'#sl-mi-museum-bar',points:'#sl-mi-points-bar'
        };
        const sel=map[key];if(sel)removeNodes(sel);
    }
    function applyLiveToggle(key,value){
        if(!(key in settings))return;
        settings[key]=!!value;saveJson(STORAGE.settings,settings);
        if(!settings[key])cleanupLiveFeature(key);
        if(key==='enabled'&&!settings.enabled){cleanupLiveFeature('enabled');return;}
        if(settings.enabled)scheduleScan(false);
    }
    const REQUIRED_API_KEY_URL='https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Market%20Intelligence&user=money,travel,equipment&torn=items&market=itemmarket';
    function createRequiredApiKey(){
        try{sessionStorage.setItem('SakaLuX_MI_KEY_SETUP_PENDING','1');}catch(_){}
        location.href=REQUIRED_API_KEY_URL;
        return true;
    }

'''
if marker not in s: raise SystemExit('openSettings marker missing')
s=s.replace(marker,insert+marker,1)

# Add button under HARD REFRESH and make toggles live
old_buttons="""<button class=\"sl-mi-primary\" id=\"sl-mi-save\">SAVE</button><button class=\"sl-mi-secondary\" id=\"sl-mi-clear-sessions\">CLEAR TRAVEL HISTORY</button><button class=\"sl-mi-secondary\" id=\"sl-mi-refresh\">REFRESH PAGE DATA</button><button class=\"sl-mi-secondary\" id=\"sl-mi-hard\">HARD REFRESH MARKET CACHE</button></div>'"""
new_buttons="""<button class=\"sl-mi-primary\" id=\"sl-mi-save\">SAVE VALUES</button><button class=\"sl-mi-secondary\" id=\"sl-mi-clear-sessions\">CLEAR TRAVEL HISTORY</button><button class=\"sl-mi-secondary\" id=\"sl-mi-refresh\">REFRESH PAGE DATA</button><button class=\"sl-mi-secondary\" id=\"sl-mi-hard\">HARD REFRESH MARKET CACHE</button><button class=\"sl-mi-secondary sl-mi-api-create\" id=\"sl-mi-create-key\">🔑 CREATE REQUIRED API KEY</button></div>'"""
if old_buttons not in s: raise SystemExit('buttons marker missing')
s=s.replace(old_buttons,new_buttons,1)

# Replace save handler so switches are not re-read/reset and panel stays open
pattern=re.compile(r"overlay\.querySelector\('#sl-mi-save'\)\.onclick=\(\)=>\{for\(const k of\[[^\]]+\]\)settings\[k\]=!!overlay\.querySelector\('#sl-mi-'\+k\)\?\.checked;settings\.travelSlots=.*?scheduleScan\(true\);\};",re.S)
m=pattern.search(s)
if not m: raise SystemExit('save handler marker missing')
new_save="""overlay.querySelector('#sl-mi-save').onclick=()=>{settings.travelSlots=Math.max(1,Number(overlay.querySelector('#sl-mi-slots').value)||29);settings.travelBudget=Math.max(0,parseMoney(overlay.querySelector('#sl-mi-budget').value)||0);settings.flightMultiplier=Math.max(.1,Number(overlay.querySelector('#sl-mi-flight').value)||1);settings.marketFeePct=Number(overlay.querySelector('#sl-mi-fee').value)||0;settings.minProfit=parseMoney(overlay.querySelector('#sl-mi-min-profit').value)||0;settings.priceNetworkEndpoint=normalizeNetworkEndpoint(overlay.querySelector('#sl-mi-network-endpoint')?.value||'');const api=overlay.querySelector('#sl-mi-api')?.value.trim();if(api)saveApiKey(api);saveJson(STORAGE.settings,settings);if(settings.priceNetwork)schedulePriceNetworkFlush(500);const b=overlay.querySelector('#sl-mi-save');if(b){const t=b.textContent;b.textContent='SAVED ✓';setTimeout(()=>{if(b.isConnected)b.textContent=t;},900);}scheduleScan(false);};"""
s=s[:m.start()]+new_save+s[m.end():]

# Wire switches and API key button immediately after overlay creation handlers
anchor="""document.body.appendChild(overlay);overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};overlay.querySelector('#sl-mi-close').onclick=()=>overlay.remove();"""
if anchor not in s: raise SystemExit('overlay anchor missing')
s=s.replace(anchor,anchor+"overlay.querySelectorAll('input[data-mi-toggle=\"1\"]').forEach(input=>input.addEventListener('change',()=>applyLiveToggle(input.dataset.setting,input.checked)));overlay.querySelector('#sl-mi-create-key').onclick=()=>createRequiredApiKey();",1)

# Switch CSS
css_old=""".sl-mi-toggle,.sl-mi-field{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mi-field input{width:45%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:7px}"""
css_new=""".sl-mi-toggle,.sl-mi-field{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}.sl-mi-toggle-label{flex:1;min-width:0}.sl-mi-switch{position:relative;display:inline-flex;width:46px;height:25px;flex:0 0 46px}.sl-mi-switch input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}.sl-mi-switch-ui{position:absolute;inset:0;border-radius:999px;background:#4a1f24;border:1px solid #71333c;transition:background .16s ease,border-color .16s ease}.sl-mi-switch-ui:before{content:'';position:absolute;width:19px;height:19px;left:2px;top:2px;border-radius:50%;background:#f3f4f6;box-shadow:0 1px 4px rgba(0,0,0,.45);transition:transform .16s ease}.sl-mi-switch input:checked+.sl-mi-switch-ui{background:#174d2b;border-color:#2e8a50}.sl-mi-switch input:checked+.sl-mi-switch-ui:before{transform:translateX(21px)}.sl-mi-switch input:focus-visible+.sl-mi-switch-ui{outline:2px solid #d7b94c;outline-offset:2px}.sl-mi-field input{width:45%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:7px}.sl-mi-api-create{border:1px solid #66591d!important;background:#2a2512!important;color:#e4c95d!important}"""
if css_old not in s: raise SystemExit('CSS marker missing')
s=s.replace(css_old,css_new,1)

if s==old: raise SystemExit('no script changes')
p.write_text(s)

# Update registry
j=Path('scripts.json');data=json.loads(j.read_text())
for row in data.get('scripts',[]):
    if row.get('id')=='market-intelligence':
        row['version']='1.16.7'
        row['description']='Torn PDA-first market/travel intelligence with instant sliding settings, automatic required-key creation, Loadout Comparator, Price Network, Bazaar Flip and travel basket tools.'
j.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

# Update GreasyFork info
md=Path('greasyfork/Market-Intelligence.md');t=md.read_text();t=t.replace('**Current version: v1.16.6**','**Current version: v1.16.7**',1)
entry='''\n## v1.16.7 — Live Sliding Settings + Required API Key\n\n- Replaced all Settings checkboxes with mobile-friendly sliding ON/OFF switches.\n- Toggle changes apply immediately without closing the Settings panel, clearing caches, resetting history, or rebuilding unrelated UI.\n- Turning a feature off removes only that feature's visible panel/badges; turning it on schedules an immediate normal rescan.\n- Added **CREATE REQUIRED API KEY** directly below Hard Refresh.\n- The button opens Torn's official custom-key creator prefilled as **SakaLuX Market Intelligence** with the selections used by this script: user money, travel and equipment; Torn items; Market itemmarket.\n- Numeric/text settings remain under **SAVE VALUES** and saving them no longer closes the panel.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.6.user.js`.\n\n'''
if '## v1.16.7 — Live Sliding Settings + Required API Key' not in t:
    pos=t.find('\n## ');t=t[:pos+1]+entry+t[pos+1:]
md.write_text(t)

# Update UPDATE-INFO
u=Path('UPDATE-INFO.md');x=u.read_text();x=x.replace('SakaLuX Market Intelligence: **v1.16.6**','SakaLuX Market Intelligence: **v1.16.7**',1)
latest='''\n### SakaLuX Market Intelligence v1.16.7\n- Settings toggles are now sliding switches and apply instantly without resetting caches/history or closing the panel.\n- Added a **CREATE REQUIRED API KEY** button that opens Torn's official custom-key generator with the key title `SakaLuX Market Intelligence` and the script's required selections.\n- Numeric/text fields use **SAVE VALUES** without closing Settings.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.6.user.js`.\n\n'''
needle='## Latest changes\n'
if '### SakaLuX Market Intelligence v1.16.7' not in x:x=x.replace(needle,needle+latest,1)
u.write_text(x)
