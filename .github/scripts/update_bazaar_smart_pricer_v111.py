#!/usr/bin/env python3
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
P=ROOT/'SakaLuX-Bazaar-Smart-Pricer.user.js'
REG=ROOT/'scripts.json'
CHANGE=ROOT/'CHANGELOG-Bazaar-Smart-Pricer.md'
GF=ROOT/'greasyfork'/'Bazaar-Smart-Pricer.md'
REL=ROOT/'releases'/'bazaar-smart-pricer-v1.1.1.md'
s=P.read_text()

s=s.replace('// @version      1.1.0','// @version      1.1.1',1)
s=s.replace("|| '1.1.0';","|| '1.1.1';",1)

# Hub-aware API resolution: shared Hub key wins, local key remains fallback.
anchor="""    function setSetting(name, val) {\n        settingsCache[name] = val;\n        GM_setValue(name, val);\n    }\n\n"""
insert=anchor+"""    function hubInstalled() {\n        try {\n            return !!(window.SakaLuXScriptHub || document.documentElement?.getAttribute('data-sakalux-hub-installed') === '1' || document.documentElement?.getAttribute('data-sakalux-hub-active') === '1' || document.getElementById('sakalux-hub-panel') || document.getElementById('sakalux-hub-button'));\n        } catch { return false; }\n    }\n\n    function getHubSharedApiKey() {\n        if (!hubInstalled()) return '';\n        try {\n            const k=(localStorage.getItem('SakaLuX_HUB_TORN_API_KEY')||'').trim();\n            return isValidApiKey(k)?k:'';\n        } catch { return ''; }\n    }\n\n    function activeApiSource() { return getHubSharedApiKey() ? 'SakaLuX Hub shared key' : (CONFIG.apiKey ? 'Local key' : 'No key'); }\n\n"""
if anchor not in s: raise SystemExit('settings anchor missing')
s=s.replace(anchor,insert,1)
old="""        get apiKey() {\n            const k = getSetting('tornApiKey', '');\n            return isValidApiKey(k) ? k : '';\n        },\n        set apiKey(val) { setSetting('tornApiKey', val); },\n"""
new="""        get apiKey() {\n            const hub=getHubSharedApiKey();\n            if (hub) return hub;\n            const k = getSetting('tornApiKey', '');\n            return isValidApiKey(k) ? k : '';\n        },\n        set apiKey(val) { setSetting('tornApiKey', val); },\n"""
if old not in s: raise SystemExit('api getter missing')
s=s.replace(old,new,1)

# Fix false bonus detections: only real bonus attachments on rarity/RW weapon rows count.
old="""    function hasAnyBonus(itemElement) {\n        const icons = itemElement.querySelectorAll('ul.bonuses-wrap li.bonus i[class*=\"bonus-attachment-\"], i[class*=\"bonus-attachment-\"]');\n        return Array.from(icons).some(icon => !String(icon.className || '').includes('blank-bonus'));\n    }\n"""
new="""    function hasAnyBonus(itemElement) {\n        const rw=getRWBonusInfo(itemElement);\n        if (rw.isRanked) return true;\n        const rarity=itemElement.querySelector(SELECTORS.rarityGlow);\n        if (!rarity) return false;\n        const icons=itemElement.querySelectorAll('ul.bonuses-wrap li.bonus i[class*=\"bonus-attachment-\"]');\n        return Array.from(icons).some(icon => !String(icon.className || '').includes('blank-bonus'));\n    }\n"""
if old not in s: raise SystemExit('bonus helper missing')
s=s.replace(old,new,1)

# Header: remove GitHub link and add API Access control next to X.
old='''                        <div class="qp-head__sub">v${VERSION} · <a href="https://github.com/SakaLuX/SakaLuX-Script-HUB" target="_blank" rel="noopener">GitHub</a></div>\n                    </div>\n                    <button class="qp-close" id="qpCancel" aria-label="Close">✕</button>'''
new='''                        <div class="qp-head__sub">v${VERSION}</div>\n                    </div>\n                    <div class="qp-head-actions"><button class="qp-close qp-api-head" id="qpApiAccess" title="API Access" aria-label="API Access">🔑</button><button class="qp-close" id="qpCancel" aria-label="Close">✕</button></div>'''
if old not in s: raise SystemExit('settings header missing')
s=s.replace(old,new,1)

# CSS for header actions and API status card.
css_anchor='''        .qp-close:hover { background: #e9e5f6; }\n        .qp-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 12px; }'''
css_new='''        .qp-close:hover { background: #e9e5f6; }\n        .qp-head-actions{margin-left:auto;display:flex;align-items:center;gap:7px}.qp-api-head{font-size:14px!important}\n        .qp-api-status{padding:10px 12px;border-radius:12px;background:var(--qp-field-bg);border:1.5px solid var(--qp-border);font:800 11px/1.45 var(--qp-font);color:var(--qp-muted)}\n        .qp-api-status strong{color:var(--qp-ink)}\n        .qp-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 12px; }'''
if css_anchor not in s: raise SystemExit('css close anchor missing')
s=s.replace(css_anchor,css_new,1)

# Dedicated API Access panel, modeled on the Hub modules: shared key auto-use + local fallback.
marker='''    function showSettingsPanel() {\n'''
api_func=r'''    function showApiAccessPanel() {
        const overlay=document.createElement('div');
        overlay.className='qp-overlay';
        const shared=getHubSharedApiKey();
        const local=getSetting('tornApiKey','');
        overlay.innerHTML=`
            <div class="qp-modal">
                <div class="qp-head">
                    <div class="qp-head__badge">${keyBadgeSVG}</div>
                    <div><div class="qp-head__title">API Access</div><div class="qp-head__sub">SakaLuX Bazaar Smart Pricer</div></div>
                    <button class="qp-close" id="qpApiClose" aria-label="Close">✕</button>
                </div>
                <div class="qp-body">
                    <div class="qp-api-status">Active source: <strong>${shared?'SakaLuX Hub shared key':(isValidApiKey(local)?'Local key':'No valid key')}</strong><br>${shared?'Hub is installed, so the shared key is used automatically. Local key stays as fallback.':'Install/configure SakaLuX Hub for automatic shared-key use, or save a local Public key below.'}</div>
                    <div><div class="qp-label">LOCAL FALLBACK KEY</div><div class="qp-field"><input type="password" id="qpApiLocal" autocomplete="off" spellcheck="false"/><div class="qp-eye-toggle" id="qpApiEye" role="button" tabindex="0">${eyeSVG}</div></div></div>
                    <div class="qp-note"><span>🔒</span><span>Only read access to Torn item data is required. A Hub shared key is preferred when Hub is active.</span></div>
                    <div class="qp-btn-row"><button class="qp-btn qp-btn--ghost" id="qpCreateKey">Create key</button><button class="qp-btn qp-btn--primary" id="qpTestActive">Test active</button></div>
                    <div class="qp-btn-row"><button class="qp-btn qp-btn--danger" id="qpClearLocal">Clear local</button><button class="qp-btn qp-btn--primary" id="qpSaveLocal">Save local</button></div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const input=overlay.querySelector('#qpApiLocal'); input.value=isValidApiKey(local)?local:'';
        const eye=overlay.querySelector('#qpApiEye'); eye.onclick=()=>{const p=input.type==='password';input.type=p?'text':'password';eye.innerHTML=p?eyeOffSVG:eyeSVG;};
        const close=()=>overlay.remove(); overlay.querySelector('#qpApiClose').onclick=close; overlay.onclick=e=>{if(e.target===overlay)close();};
        overlay.querySelector('#qpCreateKey').onclick=()=>window.open('https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Bazaar%20Smart%20Pricer&torn=items','_blank');
        overlay.querySelector('#qpSaveLocal').onclick=()=>{const k=input.value.trim();if(k && !isValidApiKey(k))return qpToast('API key must be 16 alphanumeric characters','error');CONFIG.apiKey=k;qpToast('Local fallback key saved','success');close();};
        overlay.querySelector('#qpClearLocal').onclick=()=>{CONFIG.apiKey='';input.value='';qpToast('Local fallback key cleared','success');};
        overlay.querySelector('#qpTestActive').onclick=()=>{const k=CONFIG.apiKey;if(!k)return qpToast('No active API key','error');GM_xmlhttpRequest({method:'GET',url:`https://api.torn.com/torn/1?selections=items&key=${k}`,timeout:12000,onload:r=>{try{const d=JSON.parse(r.responseText);if(d.error)throw new Error(d.error.error||'API error');qpToast(`API works · ${activeApiSource()}`,'success');}catch(e){qpToast('API test failed: '+e.message,'error');}},onerror:()=>qpToast('API test failed','error'),ontimeout:()=>qpToast('API test timed out','error')});};
        wireOverlayA11y(overlay,close);
    }

'''
if marker not in s: raise SystemExit('settings function marker missing')
s=s.replace(marker,api_func+marker,1)
# Wire header API button after settings modal append.
needle="""        document.body.appendChild(overlay);\n        wireToggleRowLabel(overlay, 'qpNpcCheck');\n"""
replace="""        document.body.appendChild(overlay);\n        overlay.querySelector('#qpApiAccess').onclick = (e) => { e.preventDefault(); showApiAccessPanel(); };\n        wireToggleRowLabel(overlay, 'qpNpcCheck');\n"""
if needle not in s: raise SystemExit('settings append marker missing')
s=s.replace(needle,replace,1)

# Manage Bazaar: auto-open collapsed rows one-by-one so Update All can reach their price input.
pat=re.compile(r"    async function updateAllManagePrices\(\) \{.*?\n    \}\n\n    // =====================================================================\n    // FLOATING DRAG CHIP",re.S)
if not pat.search(s): raise SystemExit('updateAllManagePrices block missing')
newblock=r'''    async function ensureManagePriceEditor(item) {
        const findEditor=()=>{
            const direct=item.querySelector(SELECTORS.managePriceWrap);
            if(direct?.querySelector(SELECTORS.managePriceInput)) return direct;
            const name=getItemName(item);
            const container=findSectionContainer(h => h.textContent.includes('Manage your Bazaar') || h.textContent.includes('Manage items') || h.textContent.includes('Manage Bazaar')) || item.parentElement;
            if(!container) return null;
            for(const candidate of container.querySelectorAll(SELECTORS.manageItems)){
                if(name && getItemName(candidate)!==name) continue;
                const p=candidate.querySelector(SELECTORS.managePriceWrap);
                if(p?.querySelector(SELECTORS.managePriceInput)) return p;
            }
            return null;
        };
        let p=findEditor(); if(p) return {priceDiv:p,opened:false,toggle:null};
        const controls=[...item.querySelectorAll('button,[role="button"],a')];
        let toggle=controls.find(el=>/expand|edit|details|open/i.test((el.getAttribute('aria-label')||'')+' '+(el.title||'')+' '+(el.className||'')));
        if(!toggle) toggle=controls[controls.length-1] || item.querySelector('[class*="arrow"],[class*="chevron"],[class*="expand"]');
        if(!toggle) return null;
        toggle.click();
        for(let i=0;i<24;i++){await new Promise(r=>setTimeout(r,75));p=findEditor();if(p)return{priceDiv:p,opened:true,toggle};}
        return null;
    }

    async function updateAllManagePrices() {
        const updateButton=chipFillBtn;
        if(updateButton){updateButton.disabled=true;updateButton.style.opacity='0.5';updateButton.textContent='Loading…';}
        const restoreButton=()=>{if(updateButton){updateButton.disabled=false;updateButton.style.opacity='1';updateButton.textContent='Update All';}};
        const items=getManageItems();
        if(items.length===0){restoreButton();qpToast('No items found to update!','error');return;}
        const moreBelow=mayHaveUnloadedItems(items);
        let skippedRw=0,skippedBonus=0,skippedDollar=0,updated=0,failed=0,done=0;
        const work=[];
        for(const item of items){
            const image=item.querySelector('img'); if(!image)continue;
            const itemId=getItemIdFromImage(image); if(!itemId)continue;
            if(CONFIG.skipRwWeapons&&getRWBonusInfo(item).isRanked){skippedRw++;continue;}
            if(CONFIG.skipBonusItems&&hasAnyBonus(item)){skippedBonus++;continue;}
            work.push({item,itemId,itemName:getItemName(item)});
        }
        for(const job of work){
            done++; if(updateButton)updateButton.textContent=`Opening ${done}/${work.length}`;
            const editor=await ensureManagePriceEditor(job.item);
            if(!editor){failed++;continue;}
            const input=editor.priceDiv.querySelector(SELECTORS.managePriceInput);
            const current=input?parseInt(String(input.value||'').replace(/,/g,''),10)||0:0;
            if(CONFIG.skipDollarItems&&current===1){skippedDollar++;if(editor.opened&&editor.toggle)editor.toggle.click();continue;}
            if(updateButton)updateButton.textContent=`Updating ${done}/${work.length}`;
            const result=await updateManageItemPrice(editor.priceDiv,job.itemId,job.itemName);
            if(result==='updated')updated++;else if(result==='failed')failed++;
            await new Promise(r=>setTimeout(r,100));
            if(editor.opened&&editor.toggle)editor.toggle.click();
        }
        restoreButton();
        let msg=`Updated ${updated} of ${work.length} item price${work.length===1?'':'s'}`;
        if(skippedRw)msg+=` — ${skippedRw} RW skipped`; if(skippedBonus)msg+=` — ${skippedBonus} bonus skipped`; if(skippedDollar)msg+=` — ${skippedDollar} $1 skipped`; if(failed)msg+=` — ${failed} failed`; if(moreBelow)msg+=' — scroll down to load more items, then run again';
        msg+=' — press SAVE CHANGES in Torn to commit';
        qpToast(msg,failed?'error':'success',6500);
    }

    // =====================================================================
    // FLOATING DRAG CHIP'''
s=pat.sub(newblock,s,1)

P.write_text(s)

# Registry + docs.
data=json.loads(REG.read_text()); e=next(x for x in data['scripts'] if x.get('id')=='bazaar-smart-pricer')
e['version']='1.1.1'; e['detailsRevision']=int(e.get('detailsRevision',7))+1
e['release']={'version':'1.1.1','date':'2026-09-20','notes':['Removes the GitHub link from the settings header and adds a dedicated API Access key button beside Close.','Automatically uses SakaLuX Hub shared key when Hub is installed, with a local key fallback and test/create/save/clear controls.','Fixes false bonus-item skips on normal armor such as Construction Helmet and Leather Gloves by requiring real bonus attachments on rarity/RW weapon rows.','Update All now opens collapsed Manage Bazaar rows one at a time, updates their price, closes them again and leaves Torn SAVE CHANGES as the final confirmation step.']}
e['info']=e.get('info','').replace('The settings modal keeps the polished Quick Pricer layout but uses SakaLuX Hub dark tokens.','The settings modal keeps the polished Quick Pricer layout but uses SakaLuX Hub dark tokens. API Access automatically prefers the Hub shared key when Hub is installed and keeps a local fallback. Manage Bazaar Update All can open collapsed rows sequentially, fill prices, and leaves Torn SAVE CHANGES as the final confirmation step.')
REG.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
if CHANGE.exists():
 t=CHANGE.read_text(); block='## v1.1.1 — 2026-09-20\n- Added dedicated **API Access** beside Close; Hub shared key is used automatically when available.\n- Removed the GitHub link from the settings header.\n- Fixed false **bonus item** detection on normal armor/items.\n- **Update All** can now open collapsed Manage Bazaar rows sequentially, update prices and close them again; Torn **SAVE CHANGES** remains the final confirmation.\n\n';
 if '## v1.1.1 — 2026-09-20' not in t:t=t.replace('# SakaLuX Bazaar Smart Pricer — Changelog\n\n','# SakaLuX Bazaar Smart Pricer — Changelog\n\n'+block,1)
 CHANGE.write_text(t)
if GF.exists():
 t=GF.read_text().replace('**v1.1.0**','**v1.1.1**',1)
 if '### v1.1.1' not in t:t+='\n### v1.1.1 — Hub API + collapsed Manage Update\n- API Access beside Close, automatic Hub shared-key use, local fallback.\n- False bonus-item detection fixed.\n- Update All opens collapsed Manage Bazaar rows sequentially and prepares price changes.\n'
 GF.write_text(t)
REL.parent.mkdir(parents=True,exist_ok=True)
REL.write_text('# SakaLuX Bazaar Smart Pricer v1.1.1\n\nRelease date: **2026-09-20**\n\n- Removed the GitHub header link.\n- Added API Access beside Close with automatic SakaLuX Hub shared-key selection and local fallback.\n- Tightened bonus detection so ordinary armor such as Construction Helmet / Leather Gloves is not skipped.\n- Update All now expands collapsed Manage Bazaar rows one at a time, updates the price, collapses the row, and leaves **SAVE CHANGES** to the user.\n\nValidation: `node --check` + `python3 -m json.tool scripts.json`.\n')
print('Bazaar Smart Pricer v1.1.1 updated')