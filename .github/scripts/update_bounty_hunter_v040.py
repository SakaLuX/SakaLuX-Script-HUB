from pathlib import Path
import json,re,subprocess

bh=Path('SakaLuX-Bounty-Hunter.user.js')
corep=Path('src/core/sakalux-core.js')
s=bh.read_text()
core=corep.read_text()

# Register Bounty Hunter with Shared Core settings + dock ordering.
if "match: /Bounty Hunter/i" not in core:
    anchor="    { match: /Bazaar Thanker/i, id: 'bazaar', version: 1, keys: ['sakalux_bazaar_thanker_v5'] },\n"
    row="    { match: /Bounty Hunter/i, id: 'bounty-hunter', version: 1, keys: ['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1'] },\n"
    if anchor not in core: raise SystemExit('Shared Core catalog anchor missing')
    core=core.replace(anchor,anchor+row,1)
core=core.replace("'enhancer','bazaar','bazaar-smart-pricer','mission-rewards','market-intelligence',","'enhancer','bazaar','bazaar-smart-pricer','bounty-hunter','mission-rewards','market-intelligence',",1)
corep.write_text(core)

# Version bump.
s=s.replace('@version      0.3.8','@version      0.4.0',1)
s=s.replace("let v = '0.3.8';","let v = '0.4.0';",1)
s=s.replace("const VERSION='0.3.8'","const VERSION='0.4.0'",1)

# Shared Core bootstrap + storage/settings integration.
old="const VERSION='0.4.0',ID='bounty-hunter',API='SakaLuXBountyHunter';\nconst KS="
new="""const VERSION='0.4.0',ID='bounty-hunter',API='SakaLuXBountyHunter';
const CORE=globalThis.SakaLuXCore||null;
try{CORE?.ui?.ensureSharedSkin?.();CORE?.settings?.register?.({id:ID,version:1,keys:['SLX_BOUNTY_SETTINGS_V3','SLX_BOUNTY_WATCH_V1','SLX_BOUNTY_BLACK_V1','SLX_BOUNTY_CACHE_V2','SLX_BOUNTY_USER_CACHE_V1']});CORE?.api?.configure?.({maxConcurrent:4});}catch{}
const PERF=globalThis.SakaLuXPerf||CORE?.perf||null;
const KS="""
if old not in s: raise SystemExit('bootstrap anchor missing')
s=s.replace(old,new,1)

old_j="const J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch{return d}},W=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},N="
new_j="const J=(k,d)=>{try{return CORE?.storage?.get?CORE.storage.get(k,d):(JSON.parse(localStorage.getItem(k)||'null')??d)}catch{return d}},W=(k,v)=>{try{if(CORE?.storage?.set)return CORE.storage.set(k,v);localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}},N="
if old_j not in s: raise SystemExit('storage anchor missing')
s=s.replace(old_j,new_j,1)

# Professional Hub-aligned skin. Shared Core owns the variables; this only scopes layout.
skin="""
function ensureBountyProSkin(){try{CORE?.ui?.ensureSharedSkin?.()}catch{}if(document.getElementById('slx-bh-pro-skin'))return;const st=document.createElement('style');st.id='slx-bh-pro-skin';st.textContent=`
#slx-bh{--bh-bg:var(--slx-bg,#0b1118);--bh-card:var(--slx-card,#111a24);--bh-card2:var(--slx-card2,#172331);--bh-border:var(--slx-border,#34465b);--bh-text:var(--slx-text,#edf3fa);--bh-muted:var(--slx-muted,#93a4b7);--bh-blue:var(--slx-blue,#4f8fe8);--bh-gold:var(--slx-gold,#dfbd61);--bh-green:var(--slx-green,#45d483);font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif!important;background:linear-gradient(180deg,rgba(17,26,36,.985),rgba(8,14,21,.985))!important;border:1px solid color-mix(in srgb,var(--bh-border) 82%,transparent)!important;border-radius:18px!important;box-shadow:0 22px 70px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.035)!important;overflow:hidden!important;color:var(--bh-text)!important;}
#slx-bh .head{min-height:58px!important;padding:10px 12px!important;background:linear-gradient(180deg,rgba(28,43,59,.96),rgba(18,29,40,.96))!important;border-bottom:1px solid rgba(255,255,255,.08)!important;display:flex!important;align-items:center!important;gap:8px!important;}
#slx-bh .head b,#slx-bh .head strong{font-size:15px!important;letter-spacing:.1px!important;}
#slx-bh button,#slx-bh input,#slx-bh select{font:inherit!important;border-radius:11px!important;border:1px solid color-mix(in srgb,var(--bh-border) 88%,transparent)!important;background:linear-gradient(180deg,rgba(25,39,54,.98),rgba(16,27,38,.98))!important;color:var(--bh-text)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035)!important;transition:border-color .16s ease,background .16s ease,transform .12s ease,box-shadow .16s ease!important;}
#slx-bh button:active{transform:scale(.975)!important}#slx-bh button:hover{border-color:var(--bh-blue)!important}
#slx-bh input:focus,#slx-bh select:focus{outline:none!important;border-color:var(--bh-blue)!important;box-shadow:0 0 0 2px color-mix(in srgb,var(--bh-blue) 22%,transparent)!important;}
#slx-bh .slx-bh-settings{margin:8px 12px 10px!important;padding:10px!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:14px!important;background:rgba(7,13,19,.38)!important;}
#slx-bh .bar{gap:8px!important;padding:6px 12px!important}#slx-bh .bar label{font-size:11px!important;color:var(--bh-muted)!important;letter-spacing:.2px!important}
#slx-bh .slx-bh-tog{padding:4px 0 2px!important;display:flex!important;gap:7px!important;flex-wrap:wrap!important}#slx-bh .slx-bh-tog button{min-height:34px!important;padding:6px 10px!important;font-size:12px!important}
#slx-bh .slx-bh-list{padding:8px 12px 74px!important;display:grid!important;gap:9px!important}#slx-bh .slx-bh-list>div{background:linear-gradient(180deg,rgba(20,31,43,.96),rgba(14,23,32,.96))!important;border:1px solid rgba(86,111,139,.48)!important;border-radius:14px!important;box-shadow:0 8px 22px rgba(0,0,0,.16)!important;padding:11px 12px!important}
#slx-bh .slx-bh-list>div b,#slx-bh .slx-bh-list>div strong{color:var(--bh-text)!important}#slx-bh .slx-bh-list>div [style*="color"]{text-shadow:none!important}
#slx-bh .slx-bh-empty{color:var(--bh-muted)!important;text-align:center!important;padding:24px 14px!important}
#slx-bh [data-filters]{margin:8px 12px!important;width:calc(100% - 24px)!important;min-height:38px!important;font-weight:700!important;background:linear-gradient(180deg,rgba(31,48,66,.98),rgba(20,33,46,.98))!important}
#slx-bh .slx-bh-api{margin:8px 12px!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:14px!important;background:rgba(9,16,23,.96)!important;padding:12px!important}
#slx-bh .foot,#slx-bh [class*="foot"]{backdrop-filter:blur(12px)!important;background:rgba(10,17,24,.94)!important;border-top:1px solid rgba(255,255,255,.08)!important;color:var(--bh-muted)!important}
.slx-bh-chat-btn{border-radius:10px!important;background:linear-gradient(180deg,var(--slx-card2,#172331),var(--slx-card,#111a24))!important;border:1px solid var(--slx-border,#34465b)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important}
@media(max-width:520px){#slx-bh{width:min(96vw,760px)!important;max-height:74vh!important;border-radius:16px!important}#slx-bh .head{min-height:52px!important;padding:8px 10px!important}#slx-bh .slx-bh-list{padding:7px 8px 68px!important;gap:7px!important}#slx-bh .slx-bh-list>div{padding:9px 10px!important;border-radius:12px!important}#slx-bh .slx-bh-settings{margin:6px 8px 8px!important;padding:8px!important}#slx-bh [data-filters]{margin:7px 8px!important;width:calc(100% - 16px)!important}}
`;document.head?.appendChild(st)}
"""
if 'function ensureBountyProSkin()' not in s:
    marker='function toast(msg)'
    if marker not in s: raise SystemExit('skin insertion anchor missing')
    s=s.replace(marker,skin+'\n'+marker,1)

# Ensure skin/core on each launcher/open path and use Shared Core perf debounce for repeated mutation refreshes.
s=s.replace('function button(){ensureCss();','function button(){ensureCss();ensureBountyProSkin();',1)
s=s.replace('function open(){','function open(){ensureBountyProSkin();',1)

# Safer scheduled redraw helper that reuses Shared Core debounce when available.
if 'function scheduleBountyRender' not in s:
    marker='function bestRows()'
    helper="function scheduleBountyRender(fn,wait=180){if(PERF?.debounce)return PERF.debounce('bounty-hunter-render',fn,wait);return setTimeout(fn,wait)}\n"
    if marker in s:s=s.replace(marker,helper+marker,1)

bh.write_text(s)

# Embed current Shared Core exactly once into the standalone userscript.
subprocess.run(['node','tools/embed-shared-core.cjs',str(bh),str(corep),str(bh)],check=True)

# Registry + changelog.
sp=Path('scripts.json')
if sp.exists():
    data=json.loads(sp.read_text())
    seq=data if isinstance(data,list) else data.get('scripts',[]) if isinstance(data,dict) else []
    for it in seq:
        if isinstance(it,dict) and it.get('id')=='bounty-hunter':
            it['version']='0.4.0'
            it['description']='Full-board Torn bounty hunter with Shared Core, Hub-aligned UI, FFScouter beatable filtering, strict live status and hospital timing.'
    sp.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

cp=Path('CHANGELOG.md')
if cp.exists():
    c=cp.read_text()
    note='''\n## Bounty Hunter v0.4.0\n- Embedded SakaLuX Shared Core v1 into the standalone Bounty Hunter build.\n- Registered Bounty Hunter in Shared Core settings protection and dock ordering.\n- Settings/cache storage now uses Shared Core storage when available, with localStorage fallback.\n- Torn/FFScouter requests now consistently benefit from the Shared Core API broker, request dedupe, TTL cache, retry/backoff, concurrency control and route-scoped cancellation.\n- Enabled the Shared Core Hub skin and added a Bounty-specific professional UI layer using the same SakaLuX design tokens.\n- Tightened mobile spacing, card hierarchy, filters, controls, focus states and footer/list readability.\n- Added Shared Core performance debounce plumbing for future incremental renders.\n'''
    if 'Bounty Hunter v0.4.0' not in c: cp.write_text(c.rstrip()+"\n"+note)
