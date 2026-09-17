from pathlib import Path
import json,re
ROOT=Path('.')
mp=ROOT/'SakaLuX-Mission-Rewards.user.js'
dp=ROOT/'greasyfork'/'Mission-Rewards.md'
rp=ROOT/'scripts.json'
b=ROOT/'backups'/'mission-api-exact-enhancer-v1.0.41-2026-09-18'
b.mkdir(parents=True,exist_ok=True)
mission=mp.read_text(encoding='utf-8')
doc=dp.read_text(encoding='utf-8')
reg_raw=rp.read_text(encoding='utf-8')
(b/'SakaLuX-Mission-Rewards-v1.0.40.user.js').write_text(mission,encoding='utf-8')
(b/'Mission-Rewards.md').write_text(doc,encoding='utf-8')
(b/'scripts.json').write_text(reg_raw,encoding='utf-8')
mission=mission.replace('1.0.40','1.0.41')
start=mission.index('    function openApiSettings() {')
end=mission.index('\n    function openSettings() {',start)
new_func=r'''    function openApiSettings() {
        injectCss();
        document.getElementById('sl-mr-api-overlay')?.remove();
        const local=localStorage.getItem(STORAGE.apiKey)||'';
        getApiKey();
        const overlay=document.createElement('div');
        overlay.id='sl-mr-api-overlay';
        overlay.innerHTML=`
            <div id="sl-mr-api-panel">
                <div class="sl-mr-api-head">
                    <div><div class="sl-mr-api-title">🔑 Mission Rewards API Access</div><div class="sl-mr-api-sub">SakaLuX Mission Rewards v${VERSION}</div></div>
                    <button class="sl-mr-close" id="sl-mr-api-close">×</button>
                </div>
                <div class="sl-mr-api-required"><b>Exact permissions required</b><br>User: Ammo<br>Torn: Items<br>No write permission is requested.</div>
                <button type="button" class="sl-mr-api-create" id="sl-mr-api-create">🔑 CREATE MISSION API KEY</button>
                <div class="sl-mr-api-box">
                    <div class="sl-mr-api-status"><b>API ACCESS</b><span id="sl-mr-api-result" role="status" aria-live="polite">Not checked yet</span></div>
                    <div class="sl-mr-api-source">Active source: <b id="sl-mr-api-source"></b></div>
                    <label class="sl-mr-api-field">Replace / paste Torn API key<input id="sl-mr-api-local" type="password" autocomplete="off" placeholder="Paste newly created key here" value="${escapeHtml(local)}"></label>
                    <div class="sl-mr-api-actions"><button type="button" id="sl-mr-api-save">SAVE NEW API KEY</button><button type="button" id="sl-mr-api-check">CHECK API ACCESS</button></div>
                    <button type="button" class="sl-mr-api-clear" id="sl-mr-api-clear">CLEAR LOCAL KEY</button>
                    <div class="sl-mr-api-note">The Hub general key is used first when available. This local key remains the standalone fallback. TornPDA's injected key is never overwritten.</div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        const input=overlay.querySelector('#sl-mr-api-local'),result=overlay.querySelector('#sl-mr-api-result');
        const source=()=>{const active=getApiKey();overlay.querySelector('#sl-mr-api-source').textContent=active?(state.apiMode||'Active key'):'None';};
        source();
        overlay.onclick=e=>{if(e.target===overlay)overlay.remove();};
        overlay.querySelector('#sl-mr-api-close').onclick=()=>overlay.remove();
        overlay.querySelector('#sl-mr-api-create').onclick=()=>{location.href=REQUIRED_API_KEY_URL;};
        const run=async save=>{
            const typed=input.value.trim();
            if(save&&!typed){input.focus();result.textContent='Paste a local API key first.';return;}
            if(save)saveApiKey(typed);
            const effective=getApiKey(),key=typed||effective;
            const buttons=[overlay.querySelector('#sl-mr-api-save'),overlay.querySelector('#sl-mr-api-check')];
            buttons.forEach(x=>x.disabled=true);result.textContent='Checking access…';
            try{
                const rows=await checkMissionApiAccess(key);
                result.textContent=(save?'Local key saved. ':'')+rows.map(r=>r.label+': '+r.message).join(' · ');
                if(save){state.catalogue=new Map();state.ammo=[];localStorage.removeItem(STORAGE.catalogueTime);localStorage.removeItem(STORAGE.ammoTime);}
                source();
            }finally{buttons.forEach(x=>x.disabled=false);}
        };
        overlay.querySelector('#sl-mr-api-save').onclick=()=>run(true);
        overlay.querySelector('#sl-mr-api-check').onclick=()=>run(false);
        overlay.querySelector('#sl-mr-api-clear').onclick=()=>{localStorage.removeItem(STORAGE.apiKey);input.value='';result.textContent='Local key cleared. Shared Hub / TornPDA keys are preserved.';source();};
        return true;
    }
'''
mission=mission[:start]+new_func+mission[end:]
# Exact Enhancer API CSS, only sl-eg -> sl-mr.
marker='/* SAKALUX_MISSION_EXACT_ENHANCER_API_V1041 */'
css=r'''
#sl-mr-api-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.8);display:flex;align-items:flex-start;justify-content:center;font-family:Arial,sans-serif}
#sl-mr-api-panel{width:min(560px,100%);max-height:90vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0;box-shadow:0 -8px 35px rgba(0,0,0,.55)}
.sl-mr-api-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.sl-mr-api-head-actions{display:flex;align-items:center;gap:7px}.sl-mr-api-title{font-size:17px;font-weight:900}.sl-mr-api-sub{margin-top:3px;color:#8e96a3;font-size:10px}.sl-mr-api-required{margin:9px 0;padding:10px;border:1px solid #66591d;border-radius:9px;background:#211d10;color:#e4c95d;font-size:11px;line-height:1.5}.sl-mr-api-required b{color:#fde68a}.sl-mr-api-create{width:100%;min-height:42px;border:1px solid #7c681e;border-radius:9px;background:#2a2512;color:#f5d85f;font-weight:900}.sl-mr-api-box{margin-top:10px;padding:9px;border:1px solid #2f3945;border-radius:10px;background:#121820}.sl-mr-api-status{display:flex;justify-content:space-between;gap:8px;padding:8px;border-radius:8px;background:#181d24;font-size:10px;line-height:1.35}.sl-mr-api-status b{color:#d7b94c}.sl-mr-api-status.ok span{color:#78d98b}.sl-mr-api-status.missing span,.sl-mr-api-status.missing-permission span,.sl-mr-api-status.error span{color:#f08b8b}.sl-mr-api-source{margin:8px 0;color:#9ca3af;font-size:10px}.sl-mr-api-field{display:block;margin:8px 0;color:#d1d5db;font-size:10px}.sl-mr-api-field input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:10px;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:8px;font-size:12px}.sl-mr-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.sl-mr-api-actions button,.sl-mr-api-clear{min-height:38px;border:0;border-radius:8px;background:#374151;color:#fff;font-weight:900;font-size:10px}.sl-mr-api-actions button:first-child{background:#2563eb}.sl-mr-api-clear{width:100%;margin-top:7px}.sl-mr-api-note{margin-top:9px;color:#8e96a3;font-size:9px;line-height:1.5}.sl-mr-close{width:36px;height:36px;border:1px solid #343b45;border-radius:10px;background:#252a32;color:#fff;font-size:18px}
@media(min-width:700px){#sl-mr-api-overlay{align-items:center}#sl-mr-api-panel{border-radius:18px;max-height:90vh}}
'''
if marker not in mission:
    mission += '\n\n'+marker+"\n(()=>{const s=document.createElement('style');s.id='sakalux-mission-exact-enhancer-api-v1041';s.textContent=`"+css+"`;document.head.appendChild(s);})();\n"
mp.write_text(mission,encoding='utf-8')
reg=json.loads(reg_raw)
e=next(x for x in reg['scripts'] if x.get('id')=='mission-rewards')
e['version']='1.0.41';e['release']={'date':'2026-09-18','version':'1.0.41','notes':['Copies the Enhancer Guard API Access structure and CSS exactly, changing only Mission-specific text, IDs and permissions.','Mission API permissions remain User: Ammo and Torn: Items.']}
rp.write_text(json.dumps(reg,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
doc=re.sub(r'## Current version\n\*\*v[^*]+\*\*','## Current version\n**v1.0.41**',doc,count=1)
new='''## Current release note\n\n**v1.0.41 — Exact Enhancer API panel copy**\n- Uses the same API overlay/panel structure, spacing, dimensions, button sizes, cards, colors and responsive behavior as Enhancer Guard.\n- Only Mission-specific text and permissions differ: `User: Ammo` and `Torn: Items`.\n'''
doc=re.sub(r'## Current release note\n.*?\n## Recommended',new+'\n## Recommended',doc,count=1,flags=re.S)
if '### v1.0.41' not in doc:
    idx=doc.find('## Release history / Changelog')
    if idx>=0:
        p=doc.find('\n',idx)+1
        doc=doc[:p]+'\n### v1.0.41 — Exact Enhancer API panel copy\n- Copies Enhancer Guard API panel geometry/CSS exactly; only Mission labels, IDs and required permissions are changed.\n'+doc[p:]
dp.write_text(doc,encoding='utf-8')
print('Mission 1.0.41 exact Enhancer API copy complete')
