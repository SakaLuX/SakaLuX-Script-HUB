from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

def repl(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing anchor: {label}')
    return text.replace(old,new,1)

s=SRC.read_text(encoding='utf-8')
s=repl(s,'// @version      1.16.1','// @version      1.16.2','metadata version')
s=repl(s,"const VERSION = '1.16.1';","const VERSION = '1.16.2';",'runtime version')
s=repl(s,
"// @description  Torn PDA-first market/travel intelligence with stable non-flickering Best Route Basket and Travel Session panels, Price Network, Bazaar Flip and travel basket tools.",
"// @description  Torn PDA-first market/travel intelligence with stable non-flickering Travel and Bazaar panels, Price Network, Bazaar Flip and travel basket tools.",
'metadata description')

old_baz="""    function paintBazaarBoard(rows){\n        document.getElementById('sl-mi-bazaar-board')?.remove();\n        state.bazaarDeals=rows.length;\n        state.bazaarBestProfit=rows[0]?.profit||0;\n        state.bazaarBestRoi=rows.slice().sort((a,b)=>b.roi-a.roi)[0]?.roi||0;\n        if(!rows.length)return;\n        const top=rows.slice(0,10),best=top[0];\n        const bar=document.createElement('div');bar.id='sl-mi-bazaar-board';bar.className='open';\n        bar.innerHTML='<div class=\"sl-mi-baz-head\"><div><span class=\"sl-mi-br-title\">💰 BAZAAR FLIP INTELLIGENCE</span><strong>'+esc(best.name)+' · '+money(best.profit)+'</strong></div><div>'+top.length+' deals</div><button type=\"button\">▾</button></div><div class=\"sl-mi-baz-note\">Ranked by estimated net profit after '+esc(settings.marketFeePct)+'% market fee. Tap a row to scroll to that Bazaar listing.</div><div class=\"sl-mi-baz-body\"></div>';\n        const body=bar.querySelector('.sl-mi-baz-body');\n        for(const r of top){\n            const row=document.createElement('div');row.className='sl-mi-baz-row';row.tabIndex=0;row.setAttribute('role','button');\n            row.innerHTML='<span class=\"name\">'+esc(r.name)+'</span><span>Buy '+money(r.buy)+'</span><span>Market '+money(r.market)+'</span><strong>'+money(r.profit)+'</strong><span>'+pct(r.roi)+'</span>';\n            const go=()=>{try{r.row.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row.scrollIntoView();}r.row.classList.add('sl-mi-focus');setTimeout(()=>r.row.classList.remove('sl-mi-focus'),1800);};\n            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);\n        }\n        bar.querySelector('.sl-mi-baz-head').onclick=()=>bar.classList.toggle('open');mountTop(bar);\n    }\n"""
new_baz="""    function paintBazaarBoard(rows){\n        state.bazaarDeals=rows.length;\n        state.bazaarBestProfit=rows[0]?.profit||0;\n        state.bazaarBestRoi=rows.slice().sort((a,b)=>b.roi-a.roi)[0]?.roi||0;\n        const existing=document.getElementById('sl-mi-bazaar-board');\n        if(!rows.length){existing?.remove();return;}\n        const top=rows.slice(0,10),best=top[0];\n        const wasOpen=existing?existing.classList.contains('open'):true;\n        const bar=existing||document.createElement('div');bar.id='sl-mi-bazaar-board';bar.classList.toggle('open',wasOpen);\n        bar.innerHTML='<div class=\"sl-mi-baz-head\"><div><span class=\"sl-mi-br-title\">💰 BAZAAR FLIP INTELLIGENCE</span><strong>'+esc(best.name)+' · '+money(best.profit)+'</strong></div><div>'+top.length+' deals</div><button type=\"button\">▾</button></div><div class=\"sl-mi-baz-note\">Ranked by estimated net profit after '+esc(settings.marketFeePct)+'% market fee. Tap a row to scroll to that Bazaar listing.</div><div class=\"sl-mi-baz-body\"></div>';\n        const body=bar.querySelector('.sl-mi-baz-body');\n        for(const r of top){\n            const row=document.createElement('div');row.className='sl-mi-baz-row';row.tabIndex=0;row.setAttribute('role','button');\n            row.innerHTML='<span class=\"name\">'+esc(r.name)+'</span><span>Buy '+money(r.buy)+'</span><span>Market '+money(r.market)+'</span><strong>'+money(r.profit)+'</strong><span>'+pct(r.roi)+'</span>';\n            const go=()=>{try{r.row.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row.scrollIntoView();}r.row.classList.add('sl-mi-focus');setTimeout(()=>r.row.classList.remove('sl-mi-focus'),1800);};\n            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);\n        }\n        bar.querySelector('.sl-mi-baz-head').onclick=()=>bar.classList.toggle('open');\n        if(!existing)mountTop(bar);\n    }\n"""
s=repl(s,old_baz,new_baz,'persistent bazaar board')

s=repl(s,
"        const previousBoard=document.getElementById('sl-mi-bazaar-board');\n        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;",
"        state.bazaarDeals=0;state.bazaarBestProfit=0;state.bazaarBestRoi=0;",
'scan bazaar previous board')
s=repl(s,
"        deals.sort((a,b)=>b.profit-a.profit || b.roi-a.roi);\n        previousBoard?.remove();\n        paintBazaarBoard(deals);",
"        deals.sort((a,b)=>b.profit-a.profit || b.roi-a.roi);\n        paintBazaarBoard(deals);",
'scan bazaar no remove')

s=repl(s,
"if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-museum-bar,#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove());",
"if(force)document.querySelectorAll('.sl-mi-travel,.sl-mi-bazaar,.sl-mi-items,#sl-mi-museum-bar,#sl-mi-travel-plan,#sl-mi-country-best').forEach(n=>n.remove());",
'force selector unchanged')

s=repl(s,
"if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-session,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items'))return false;",
"if(n.closest?.('#sl-mi-best-run,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-session,#sl-mi-bazaar-board,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items'))return false;",
'observer ignore bazaar board')

SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.16.2'
        entry['description']='Torn PDA-first market/travel intelligence with stable non-flickering Travel and Bazaar panels, anonymous opt-in Price Network, Bazaar Flip and travel/basket tools.'
        break
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.16.1**','SakaLuX Market Intelligence: **v1.16.2**',1)
release='''### SakaLuX Market Intelligence v1.16.2\n- Fixed **BAZAAR FLIP INTELLIGENCE** flicker during rescans.\n- Bazaar Flip now keeps the same outer DOM panel and updates only its contents.\n- The open/collapsed state is preserved during Bazaar refreshes.\n- Removed the extra pre-paint delete from `scanBazaar()`.\n- MutationObserver now ignores changes made inside the Bazaar Flip board, preventing self-triggered refresh loops.\n- The board is removed only when there are genuinely no profitable deals or the page context changes.\n- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.1.user.js`.\n\n'''
info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.16.1**','**Current version: v1.16.2**',1)
gf_release='''## v1.16.2 — Stable Bazaar Flip Panel\n\n- Fixed the visible disappear/reappear flicker of **BAZAAR FLIP INTELLIGENCE** during Bazaar rescans.\n- The panel now remains mounted and updates its content in place.\n- Open/collapsed state is preserved while prices refresh.\n- MutationObserver ignores the script's own Bazaar board updates, preventing self-triggered rescans.\n\n'''
gf=gf.replace('## v1.16.1',gf_release+'## v1.16.1',1)
GF.write_text(gf,encoding='utf-8')
