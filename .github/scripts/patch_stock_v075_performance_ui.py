from pathlib import Path
import re

sp=Path('experimental/SakaLuX-Stock-Manager-Advisor.user.js')
s=sp.read_text(encoding='utf-8')

s=s.replace('// @version      0.7.4','// @version      0.7.5',1)
s=s.replace("version: '0.7.4',","version: '0.7.5',",1)
s=s.replace('Experimental Torn stock workspace with repaired inline workspaces, portfolio runtime helpers, compact controls and guided rebalance execution beside its preview.','Experimental Torn stock workspace with Hub-style premium UI, throttled SPA rendering, compact controls and guided rebalance execution.',1)

# Withdraw should use the neutral Hub-style button; Withdraw All remains the destructive red action.
s=s.replace('<button id="slx-inline-withdraw" class="danger" type="button">Withdraw</button>','<button id="slx-inline-withdraw" type="button">Withdraw</button>',1)

# Existing panel should not re-render immediately on every SPA mutation.
s=s.replace("    if($('#slx-stock-inline')) { refreshInlinePanel(); return $('#slx-stock-inline'); }","    if($('#slx-stock-inline')) return $('#slx-stock-inline');",1)

# Add a lightweight premium override layer inspired by the Script Hub design language.
anchor='''  function openPanel() { style(); const p=panel(); p.dataset.open='1'; safeRender('Targets',refreshTargetSelect); safeRender('Portfolio',renderPortfolio); safeRender('Benefit Values',renderBenefitValues); safeRender('ROI Advisor',renderAdvisor); safeRender('Portfolio Optimizer',renderOptimizer); safeRender('Rebalance Preview',renderRebalancePreview); safeRender('Trade Assistant',renderTradeAssistant); safeRender('Transaction History',renderTransactionHistory); safeRender('Action Log',renderActionLog); }\n'''
if anchor not in s:
    raise SystemExit('openPanel anchor missing')
premium=r'''  function premiumStyle() {
    if($('#slx-stock-premium-style')) return;
    const st=document.createElement('style');
    st.id='slx-stock-premium-style';
    st.textContent=`
:root{--slx-surface:#101720;--slx-surface-2:#18212d;--slx-surface-3:#0b1118;--slx-border:rgba(142,170,201,.22);--slx-border-strong:#41536b;--slx-text:#f2f6fb;--slx-muted:#8fa1b5;--slx-accent:#dfbd61;--slx-blue:#4f8fe8;--slx-green:#59d88a;--slx-red:#ff6b78}
#slx-stock-panel{background:rgba(3,7,11,.84);backdrop-filter:blur(10px);font-family:Inter,Arial,sans-serif;padding:52px 8px 90px}
#slx-stock-panel .card{width:min(780px,100%);background:linear-gradient(180deg,rgba(16,23,32,.995),rgba(9,14,20,.995));border:1px solid rgba(255,255,255,.10);border-radius:20px;box-shadow:0 24px 70px rgba(0,0,0,.62),inset 0 1px 0 rgba(255,255,255,.04)}
#slx-stock-panel .head{padding:16px;background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.20),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-bottom:1px solid var(--slx-border)}
#slx-stock-panel h2{font-size:17px;letter-spacing:.01em;color:var(--slx-text)}
#slx-stock-panel .body{padding:12px;gap:10px;background:linear-gradient(180deg,rgba(255,255,255,.012),transparent)}
#slx-stock-panel .section{border:1px solid var(--slx-border);border-radius:14px;padding:11px;background:linear-gradient(180deg,rgba(21,31,42,.92),rgba(12,19,27,.96));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
#slx-stock-panel .title{color:#a9c8ef;font-size:10px;letter-spacing:.11em}
#slx-stock-panel button,#slx-stock-panel select,#slx-stock-panel input,#slx-stock-inline button,#slx-stock-inline select,#slx-stock-inline input{min-height:38px;border:1px solid var(--slx-border-strong);border-radius:11px;background:linear-gradient(180deg,#202c3a,#17212d);color:#e9f0f7;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease}
#slx-stock-panel button,#slx-stock-inline button{font-weight:850;letter-spacing:.01em}
#slx-stock-panel button:active,#slx-stock-inline button:active{transform:scale(.985)}
#slx-stock-panel button:hover,#slx-stock-inline button:hover{border-color:#5b7390;background:linear-gradient(180deg,#263448,#192532)}
#slx-stock-panel .primary,#slx-stock-inline .primary{border-color:#2f7854;background:linear-gradient(180deg,#173f2b,#102d20);color:#7ee0a5}
#slx-stock-panel .danger,#slx-stock-inline .danger{border-color:#8b3543;background:linear-gradient(180deg,#401821,#2b1016);color:#ff8c97}
#slx-stock-inline{margin:10px 0 14px;border:1px solid rgba(255,255,255,.10);border-radius:20px;background:linear-gradient(180deg,rgba(11,17,24,.995),rgba(7,12,18,.995));box-shadow:0 18px 52px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.035);font-family:Inter,Arial,sans-serif}
#slx-stock-inline .slx-inline-head{padding:14px 14px 13px;background:radial-gradient(circle at 10% -30%,rgba(79,143,232,.22),transparent 45%),linear-gradient(155deg,#18212d,#101720 72%);border-bottom:1px solid var(--slx-border)}
#slx-stock-inline .slx-inline-head b{font-size:15px;color:var(--slx-text)}
#slx-stock-inline .slx-inline-head small{font-size:9px;color:#7f94aa;font-weight:750;letter-spacing:.07em}
#slx-stock-inline .slx-inline-head-actions button{min-width:42px;padding:7px 9px}
#slx-stock-inline .slx-inline-body{padding:12px;gap:10px}
#slx-stock-inline .slx-inline-summary{gap:7px}
#slx-stock-inline .slx-inline-summary>div{padding:10px;border:1px solid var(--slx-border);border-radius:12px;background:linear-gradient(180deg,rgba(24,35,47,.86),rgba(15,23,32,.92));box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
#slx-stock-inline .slx-inline-summary span{font-size:8px;text-transform:uppercase;letter-spacing:.07em;color:#8296aa}
#slx-stock-inline .slx-inline-summary b{font-size:13px;color:#edf4fb}
#slx-stock-inline .slx-inline-nav{gap:7px}
#slx-stock-inline .slx-inline-nav button[data-active="1"]{border-color:#6b84a2;background:linear-gradient(180deg,#29384a,#1c2937);color:#fff}
#slx-stock-inline .slx-inline-target{padding:10px;border:1px solid var(--slx-border);border-radius:13px;background:rgba(16,24,34,.72)}
#slx-stock-inline .slx-inline-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;padding:10px;border:1px solid var(--slx-border);border-radius:13px;background:rgba(16,24,34,.72)}
#slx-stock-inline .slx-inline-actions button,#slx-stock-inline .slx-inline-actions input{width:100%}
#slx-stock-inline .slx-inline-options{padding:8px 2px;gap:12px}
#slx-stock-inline .slx-inline-options label{font-size:10px;color:#9eacbc}
#slx-stock-inline .slx-inline-presets{gap:6px}
#slx-stock-inline .slx-inline-presets button{min-height:34px;padding:6px}
#slx-stock-inline .slx-inline-config,#slx-stock-inline .slx-inline-advanced,#slx-stock-inline .slx-inline-workspace{border:1px solid var(--slx-border)!important;border-radius:13px!important;background:linear-gradient(180deg,rgba(18,27,37,.90),rgba(12,18,26,.94))!important}
#slx-stock-inline .slx-inline-note{border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(13,20,28,.72);padding:8px 10px;color:#8fa1b5}
#slx-stock-open{border:1px solid #41536b!important;border-radius:13px!important;background:linear-gradient(145deg,#263448,#17212e)!important;box-shadow:0 10px 28px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.05)!important;color:#eaf2fb!important;font-family:Inter,Arial,sans-serif!important;padding:9px 12px!important}
#slx-stock-panic{border-radius:13px!important;box-shadow:0 10px 28px rgba(0,0,0,.42)!important}
.slx-stock-row-tools{border-color:rgba(142,170,201,.20)!important;background:linear-gradient(180deg,rgba(17,26,36,.94),rgba(10,16,23,.95))!important;border-radius:12px!important;box-shadow:inset 0 1px rgba(255,255,255,.025)}
@media(max-width:620px){#slx-stock-panel{padding:42px 5px 86px}#slx-stock-inline{border-radius:16px}#slx-stock-inline .slx-inline-head{align-items:flex-start;flex-wrap:wrap}#slx-stock-inline .slx-inline-head-actions{width:100%;display:grid;grid-template-columns:repeat(5,1fr)}#slx-stock-inline .slx-inline-summary{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-nav{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-target{grid-template-columns:1fr 92px}#slx-stock-inline .slx-inline-actions{grid-template-columns:repeat(2,minmax(0,1fr))}#slx-stock-inline .slx-inline-presets{grid-template-columns:repeat(3,minmax(0,1fr))}}
`;
    document.head.appendChild(st);
  }

'''
s=s.replace(anchor,premium+anchor,1)

# Replace hot-path SPA observer logic. The old observer scanned synchronously for every DOM mutation,
# then refreshed and enhanced the rows again in the debounced callback. This was the main source of lag.
old=r'''  let inlineMountTimer=0;
  function scheduleInlineMount() {
    clearTimeout(inlineMountTimer);
    inlineMountTimer=setTimeout(()=>{if(isStocks()){mountInlinePanel();enhanceStockRows();} else {$('#slx-stock-inline')?.remove();$$('.slx-stock-row-tools').forEach(x=>x.remove());}},120);
  }

  async function init() {
    style(); restoreCache(); panicButton(); managerLauncher(); if(isStocks()) setTimeout(()=>{mountInlinePanel();enhanceStockRows();},250);
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(openPanel,700);} } catch {}
    if(isStocks()) {
      const wait=setInterval(()=>{ if(scanStocks().size){clearInterval(wait); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},500);
      setTimeout(()=>clearInterval(wait),15000);
    }
    const mo=new MutationObserver(()=>{ if(isStocks()) scanStocks(); scheduleInlineMount(); if(!$('#slx-stock-open')) managerLauncher(); if(!$('#slx-stock-panic')) panicButton(); });
    mo.observe(document.documentElement,{subtree:true,childList:true});
  }
'''
new=r'''  let inlineMountTimer=0, lastSpaRefresh=0, lastHref=location.href;
  function scheduleInlineMount(force=false) {
    clearTimeout(inlineMountTimer);
    const delay=force?40:360;
    inlineMountTimer=setTimeout(()=>{
      const now=Date.now();
      if(!force && now-lastSpaRefresh<300) return;
      lastSpaRefresh=now;
      if(isStocks()) {
        mountInlinePanel();
        scanStocks();
        refreshInlinePanel();
      } else {
        $('#slx-stock-inline')?.remove();
        $$('.slx-stock-row-tools').forEach(x=>x.remove());
      }
      if(!$('#slx-stock-open')) managerLauncher();
      if(!$('#slx-stock-panic')) panicButton();
    },delay);
  }

  async function init() {
    style(); premiumStyle(); restoreCache(); panicButton(); managerLauncher();
    if(isStocks()) setTimeout(()=>scheduleInlineMount(true),220);
    try { if(sessionStorage.getItem('SakaLuX_STOCK_KEY_SETUP_PENDING')==='1'){sessionStorage.removeItem('SakaLuX_STOCK_KEY_SETUP_PENDING');setTimeout(openPanel,700);} } catch {}
    if(isStocks()) {
      const wait=setInterval(()=>{ if(scanStocks().size){clearInterval(wait); scheduleInlineMount(true); if(S.panel?.dataset.open==='1'){refreshTargetSelect();renderAdvisor();} if(get(K.panicPending)==='1') panic();}},650);
      setTimeout(()=>clearInterval(wait),10000);
    }
    const mo=new MutationObserver(records=>{
      const hrefChanged=location.href!==lastHref;
      if(hrefChanged) lastHref=location.href;
      const relevant=hrefChanged || records.some(r=>r.addedNodes.length || r.removedNodes.length);
      if(relevant) scheduleInlineMount(hrefChanged);
    });
    mo.observe(document.body||document.documentElement,{subtree:true,childList:true});
  }
'''
if old not in s:
    raise SystemExit('performance observer block missing')
s=s.replace(old,new,1)

# Ensure premium style is present when full panel is opened independently.
s=s.replace("  function openPanel() { style(); const p=panel();", "  function openPanel() { style(); premiumStyle(); const p=panel();",1)

sp.write_text(s,encoding='utf-8')

md=Path('experimental/Stock-Manager-Advisor.md')
d=md.read_text(encoding='utf-8')
d=d.replace('**v0.7.4**','**v0.7.5**',1)
d=re.sub(r'\*\*v0\.7\.4\*\*[^\n]*', '**v0.7.5** introduces a Script Hub-style premium visual system and removes the main TornPDA lag source by throttling SPA mutation work instead of rescanning and rebuilding stock rows for every DOM change.', d, count=1)
entry='''### v0.7.5 — Performance & Hub-Style UI\n\n- Rebuilt the Stock Manager visual layer around the Script Hub design language: premium dark surfaces, radial/gradient headers, consistent borders, rounded cards, unified buttons and mobile spacing.\n- Removed the red destructive styling from the normal **Withdraw** button; **Withdraw All** remains visually destructive.\n- Identified and fixed the main performance bottleneck: the global MutationObserver previously called `scanStocks()` synchronously on every Torn DOM mutation and then triggered another scan/render/enhance cycle.\n- SPA updates are now debounced/throttled and processed as one refresh pass rather than repeated full row scans.\n- Existing inline panels are no longer fully refreshed merely because `mountInlinePanel()` was called after a DOM mutation.\n- Reduced initial stock polling frequency and timeout while preserving SPA remount recovery.\n- Added Hub-style responsive treatment for the full modal, inline workspace, summary cards, vault controls, settings, row tools and launcher.\n- Preserved all trading protections, confirmations, Benefit Lock, Dry Run and transaction logic.\n\n'''
d=d.replace('## Changelog\n','## Changelog\n'+entry,1)
md.write_text(d,encoding='utf-8')
