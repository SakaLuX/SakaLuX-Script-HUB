from pathlib import Path
import json
import re

ROOT = Path('.')
BACKUP = ROOT / 'backups' / 'stocks-mission-company-ui-2026-09-18'
(BACKUP / 'greasyfork').mkdir(parents=True, exist_ok=True)

files_to_backup = [
    'SakaLuX-Stock-Manager-Advisor.user.js',
    'SakaLuX-Mission-Rewards.user.js',
    'SakaLuX-Company-Intelligence-v1.0.0.user.js',
    'scripts.json',
]
for fn in files_to_backup:
    src = ROOT / fn
    if src.exists():
        (BACKUP / fn).write_text(src.read_text())
for fn in ['greasyfork/Mission-Rewards.md', 'greasyfork/Company-Intelligence.md']:
    src = ROOT / fn
    if src.exists():
        (BACKUP / 'greasyfork' / src.name).write_text(src.read_text())

# ---------- STOCK MANAGER v0.7.14 ----------
p = ROOT / 'SakaLuX-Stock-Manager-Advisor.user.js'
s = p.read_text()
s = re.sub(r'// @version\s+0\.7\.13', '// @version      0.7.14', s, count=1)
s = s.replace("version: '0.7.13'", "version: '0.7.14'", 1)
s = s.replace("version:'0.7.13'", "version:'0.7.14'")

# Remove the old bottom floating launcher; the standalone Stocks entry is the launcher now.
s, count = re.subn(
    r"  function managerLauncher\(\) \{.*?\n  \}\n\n  function restoreCache",
    "  function managerLauncher() { $('#slx-stock-open')?.remove(); }\n\n  function restoreCache",
    s,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit('Could not replace Stock Manager floating launcher')

s = s.replace(
    "$('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');",
    "$('#slx-inline-api',card).onclick=()=>{openPanel();setTimeout(openStockApiSheet,25);};",
    1,
)

marker = '/* SAKALUX_STOCKS_PANEL_CHROME_V0714 */'
helper = r'''
  /* SAKALUX_STOCKS_PANEL_CHROME_V0714 */
  function normalizeStockPanelChrome() {
    const p=S.panel||$('#slx-stock-panel'); if(!p) return;
    p.style.setProperty('z-index','2147483646','important');
    const card=p.querySelector('.card');
    const head=p.querySelector('.head');
    if(head && !head.querySelector('#slx-stock-api-trigger')) {
      const b=document.createElement('button');
      b.id='slx-stock-api-trigger'; b.type='button'; b.title='API Access'; b.textContent='🔑';
      b.className='slx-stock-api-trigger'; b.onclick=openStockApiSheet;
      const close=head.querySelector('.close, [data-close], button:last-child');
      if(close) head.insertBefore(b,close); else head.appendChild(b);
    }
    const oldInput=p.querySelector('.section #slx-stock-api');
    const oldSection=oldInput?.closest('.section');
    if(oldSection) oldSection.remove();
    if(!document.getElementById('slx-stock-api-sheet-style')) {
      const st=document.createElement('style'); st.id='slx-stock-api-sheet-style';
      st.textContent=`
#slx-stock-panel{z-index:2147483646!important}
#slx-stock-panel .slx-stock-api-trigger{width:36px!important;height:36px!important;min-width:36px!important;min-height:36px!important;padding:0!important;border:1px solid #78621b!important;background:#29240f!important;color:#f5d85f!important;font-size:17px!important}
#slx-stock-api-sheet{position:absolute!important;inset:0!important;z-index:20!important;background:#0b1118!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
#slx-stock-api-sheet .slx-api-sheet-head{display:flex!important;align-items:center!important;gap:8px!important;padding:12px!important;border-bottom:1px solid #34465b!important;background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-api-sheet .slx-api-sheet-head>div{flex:1!important}.slx-api-sheet-title{font-size:16px!important;font-weight:900!important}.slx-api-sheet-sub{font-size:9px!important;color:#93a4b7!important;margin-top:2px!important}
#slx-stock-api-sheet .slx-api-sheet-close{width:36px!important;height:36px!important;padding:0!important;font-size:20px!important}
#slx-stock-api-sheet .slx-api-sheet-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;padding:12px!important;display:grid!important;gap:9px!important}
#slx-stock-api-sheet .slx-api-box{padding:10px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#111a24!important;font-size:11px!important;line-height:1.45!important}
#slx-stock-api-sheet input{width:100%!important;box-sizing:border-box!important}.slx-api-sheet-actions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important}
#slx-stock-api-sheet .slx-api-primary{background:#194f86!important;border-color:#2e77b9!important}.slx-api-sheet-result{font-size:10px!important;color:#93a4b7!important;min-height:18px!important}
`;
      (document.head||document.documentElement).appendChild(st);
    }
    if(card) card.style.position='relative';
  }

  function openStockApiSheet() {
    normalizeStockPanelChrome();
    const p=S.panel||$('#slx-stock-panel'); const card=p?.querySelector('.card'); if(!card) return;
    card.querySelector('#slx-stock-api-sheet')?.remove();
    const sheet=document.createElement('div'); sheet.id='slx-stock-api-sheet';
    const local=get(K.api,'');
    sheet.innerHTML=`<div class="slx-api-sheet-head"><div><div class="slx-api-sheet-title">🔑 Stock Manager API Access</div><div class="slx-api-sheet-sub">v${APP.version}</div></div><button type="button" class="slx-api-sheet-close">×</button></div>
      <div class="slx-api-sheet-body">
        <div class="slx-api-box"><b>Exact read-only permissions required</b><br>User: Money, Stocks<br>Torn: Stocks</div>
        <button type="button" class="slx-api-primary" id="slx-stock-api-create">🔑 CREATE REQUIRED API KEY</button>
        <div class="slx-api-box"><div id="slx-stock-api-source">Active source: ${local?'Local standalone key':'No key configured'}</div><p>Use the key only for Stock Manager read-only data and portfolio calculations.</p><label>Replace / paste standalone Torn API key</label><input id="slx-stock-api-sheet-input" type="password" autocomplete="off" placeholder="Paste Torn API key here" value="${esc(local)}"></div>
        <div class="slx-api-sheet-actions"><button type="button" class="slx-api-primary" id="slx-stock-api-save">SAVE & TEST</button><button type="button" id="slx-stock-api-check">CHECK ACCESS</button></div>
        <button type="button" id="slx-stock-api-clear">CLEAR LOCAL KEY</button>
        <div class="slx-api-sheet-result" id="slx-stock-api-result" role="status" aria-live="polite"></div>
      </div>`;
    card.appendChild(sheet);
    const result=sheet.querySelector('#slx-stock-api-result'), input=sheet.querySelector('#slx-stock-api-sheet-input');
    sheet.querySelector('.slx-api-sheet-close').onclick=()=>sheet.remove();
    sheet.querySelector('#slx-stock-api-create').onclick=()=>{location.href=REQUIRED_API_KEY_URL;};
    const run=async save=>{
      const typed=String(input.value||'').trim();
      if(save&&!typed){result.textContent='Paste a Torn API key first.';input.focus();return;}
      if(save)set(K.api,typed);
      const key=typed||String(get(K.api,'')).trim();
      if(!key){result.textContent='No API key configured.';return;}
      const buttons=[sheet.querySelector('#slx-stock-api-save'),sheet.querySelector('#slx-stock-api-check')];buttons.forEach(b=>b.disabled=true);result.textContent='Checking access…';
      try{await apiSync();result.textContent=(save?'Key saved. ':'')+'Money: Access OK · Stocks: Access OK';refreshInlinePanel();if(S.panel?.dataset.open==='1'){renderPortfolio();renderAdvisor();}}
      catch(e){result.textContent='API check failed: '+String(e?.message||e);}
      finally{buttons.forEach(b=>b.disabled=false);}
    };
    sheet.querySelector('#slx-stock-api-save').onclick=()=>run(true);
    sheet.querySelector('#slx-stock-api-check').onclick=()=>run(false);
    sheet.querySelector('#slx-stock-api-clear').onclick=()=>{del(K.api);input.value='';result.textContent='Local API key cleared.';sheet.querySelector('#slx-stock-api-source').textContent='Active source: No key configured';refreshInlinePanel();};
  }

'''
if marker not in s:
    anchor = '  function openPanel() {'
    if anchor not in s:
        raise SystemExit('Stock openPanel anchor missing')
    s = s.replace(anchor, helper + anchor, 1)

s = s.replace(
    "  function openPanel() { style(); premiumStyle(); const p=panel(); p.dataset.open='1';",
    "  function openPanel() { style(); premiumStyle(); const p=panel(); normalizeStockPanelChrome(); p.dataset.open='1';",
    1,
)
p.write_text(s)

# ---------- MISSION v1.0.38 ----------
p = ROOT / 'SakaLuX-Mission-Rewards.user.js'
s = p.read_text()
s = re.sub(r'// @version\s+1\.0\.\d+', '// @version      1.0.38', s, count=1)
s = re.sub(r"const VERSION\s*=\s*'1\.0\.\d+';", "const VERSION = '1.0.38';", s, count=1)
s = re.sub(r"(\"id\":\"mission-rewards\".*?\{version:')1\.0\.\d+('})", r"\g<1>1.0.38\2", s, count=1, flags=re.S)
marker = '/* SAKALUX_MISSION_REAL_FOOTER_V1038 */'
if marker not in s:
    s += r'''

/* SAKALUX_MISSION_REAL_FOOTER_V1038 */
(()=>{
 const ID='sakalux-inline-footer-mission-rewards',PROFILE='https://www.torn.com/profiles.php?XID=2380374';
 const css=document.createElement('style');css.textContent=`
 #sl-mr-settings#sl-mr-settings{display:flex!important;flex-direction:column!important;overflow:hidden!important;min-height:0!important}
 #sl-mr-settings#sl-mr-settings>.sl-mr-settings-content{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}
 #${ID}#${ID}{position:relative!important;display:block!important;flex:0 0 50px!important;width:100%!important;height:50px!important;min-height:50px!important;max-height:50px!important;margin:0!important;padding:0!important;z-index:50!important;overflow:hidden!important;background:#080d13!important}
 #${ID} .slh-bottom{height:28px!important;padding:4px 14px!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
 #${ID} .slh-bottom-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;height:20px!important}
 #${ID} .slh-bottom-btn{display:block!important;width:100%!important;height:20px!important;min-height:20px!important;padding:0 4px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#151f2a!important;color:#b9c7d6!important;font:900 8px/1.2 Arial,sans-serif!important}
 #${ID} .slh-footer{height:22px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;border-top:1px solid rgba(223,154,55,.52)!important;background:#080d13!important;color:#df9a37!important;font:400 9px/20px Arial,sans-serif!important;white-space:nowrap!important}
 #${ID} .slh-author{color:#78aef2!important;font-weight:900!important;text-decoration:none!important}
 `;(document.head||document.documentElement).appendChild(css);
 function ensure(){
  const panel=document.querySelector('#sl-mr-settings'); if(!panel)return;
  let f=panel.querySelector('#'+ID);
  if(!f){f=document.createElement('div');f.id=ID;f.innerHTML='<div class="slh-bottom"><div class="slh-bottom-grid"><button type="button" class="slh-bottom-btn" data-slx-mr-donate>💸 SEND MONEY</button><button type="button" class="slh-bottom-btn" data-slx-mr-donate>🎁 SEND ITEMS</button></div></div><div class="slh-footer">Made with ❤️ by <a class="slh-author" href="'+PROFILE+'">SakaLuX [2380374]</a></div>';f.querySelectorAll('[data-slx-mr-donate]').forEach(b=>b.onclick=()=>location.href=PROFILE);panel.appendChild(f);}
  else if(f.parentElement!==panel)panel.appendChild(f);
 }
 const kick=()=>{ensure();requestAnimationFrame(ensure);setTimeout(ensure,60);setTimeout(ensure,220)};
 new MutationObserver(()=>kick()).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',kick,{once:true});else kick();
})();
'''
p.write_text(s)

# ---------- COMPANY v1.8.32 ----------
p = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
s = p.read_text()
s = re.sub(r'// @version\s+1\.8\.31', '// @version      1.8.32', s, count=1)
s = s.replace("version:'1.8.31'", "version:'1.8.32'", 1)
s = s.replace("selector:'',fallback:'https://www.torn.com/joblist.php'", "selector:'#sakalux-module-bridge-company-intelligence',fallback:'https://www.torn.com/joblist.php'", 1)
marker = '/* SAKALUX_COMPANY_ABOVE_STANDALONE_V1832 */'
if marker not in s:
    s += r'''

/* SAKALUX_COMPANY_ABOVE_STANDALONE_V1832 */
(()=>{const st=document.createElement('style');st.textContent='#ci-root#ci-root{z-index:2147483646!important}';(document.head||document.documentElement).appendChild(st);const fix=()=>{const e=document.querySelector('[data-slx-standalone-registration="company-intelligence"]');if(e){e.dataset.selector='#sakalux-module-bridge-company-intelligence';e.dataset.version='1.8.32';}};fix();setTimeout(fix,100);setTimeout(fix,700);})();
'''
p.write_text(s)

# ---------- Registry version sync (Hub source itself is untouched) ----------
data = json.loads((ROOT / 'scripts.json').read_text())
versions = {
    'stock-manager-advisor': '0.7.14',
    'mission-rewards': '1.0.38',
    'company-intelligence': '1.8.32',
}
def walk(o):
    if isinstance(o, dict):
        mid = o.get('id')
        if mid in versions:
            o['version'] = versions[mid]
        for v in o.values():
            walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)
walk(data)
(ROOT / 'scripts.json').write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')

notes = {
    'greasyfork/Mission-Rewards.md': '\n## Current release note — v1.0.38\n- Footer now mounts on the real `#sl-mr-settings` panel and stays visible with SEND MONEY / SEND ITEMS / Made with ❤️.\n',
    'greasyfork/Company-Intelligence.md': '\n## Current release note — v1.8.32\n- Company now opens through the standalone module bridge and its panel is layered above SakaLuX Scripts Standalone.\n',
}
for fn, note in notes.items():
    q = ROOT / fn
    if q.exists():
        txt = q.read_text()
        if note.strip() not in txt:
            q.write_text(txt.rstrip() + '\n' + note)

print('Patch complete')
