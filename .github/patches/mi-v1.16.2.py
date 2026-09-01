from pathlib import Path
import json

ROOT=Path('.')
SRC=ROOT/'SakaLuX-Market-Intelligence.user.js'
REG=ROOT/'scripts.json'
INFO=ROOT/'UPDATE-INFO.md'
GF=ROOT/'greasyfork/Market-Intelligence.md'

s=SRC.read_text(encoding='utf-8')
assert '// @version      1.16.1' in s
assert "const VERSION = '1.16.1';" in s
s=s.replace('// @version      1.16.1','// @version      1.16.2',1)
s=s.replace("const VERSION = '1.16.1';","const VERSION = '1.16.2';",1)
s=s.replace('// @description  Torn PDA-first market/travel intelligence with stable non-flickering Best Route Basket and Travel Session panels, Price Network, Bazaar Flip and travel basket tools.','// @description  Torn PDA-first market/travel intelligence with stable non-flickering Travel and Bazaar panels, Price Network, Bazaar Flip and travel basket tools.',1)

start=s.index('    function paintBazaarBoard(rows){')
end=s.index('\n    async function scanBazaar(){',start)
new_func='''    function paintBazaarBoard(rows){
        state.bazaarDeals=rows.length;
        state.bazaarBestProfit=rows[0]?.profit||0;
        state.bazaarBestRoi=rows.slice().sort((a,b)=>b.roi-a.roi)[0]?.roi||0;
        const existing=document.getElementById('sl-mi-bazaar-board');
        if(!rows.length){existing?.remove();return;}
        const top=rows.slice(0,10),best=top[0];
        const wasOpen=existing?existing.classList.contains('open'):true;
        const bar=existing||document.createElement('div');bar.id='sl-mi-bazaar-board';bar.classList.toggle('open',wasOpen);
        bar.innerHTML='<div class="sl-mi-baz-head"><div><span class="sl-mi-br-title">💰 BAZAAR FLIP INTELLIGENCE</span><strong>'+esc(best.name)+' · '+money(best.profit)+'</strong></div><div>'+top.length+' deals</div><button type="button">▾</button></div><div class="sl-mi-baz-note">Ranked by estimated net profit after '+esc(settings.marketFeePct)+'% market fee. Tap a row to scroll to that Bazaar listing.</div><div class="sl-mi-baz-body"></div>';
        const body=bar.querySelector('.sl-mi-baz-body');
        for(const r of top){
            const row=document.createElement('div');row.className='sl-mi-baz-row';row.tabIndex=0;row.setAttribute('role','button');
            row.innerHTML='<span class="name">'+esc(r.name)+'</span><span>Buy '+money(r.buy)+'</span><span>Market '+money(r.market)+'</span><strong>'+money(r.profit)+'</strong><span>'+pct(r.roi)+'</span>';
            const go=()=>{try{r.row.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){r.row.scrollIntoView();}r.row.classList.add('sl-mi-focus');setTimeout(()=>r.row.classList.remove('sl-mi-focus'),1800);};
            row.onclick=go;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};body.appendChild(row);
        }
        bar.querySelector('.sl-mi-baz-head').onclick=()=>bar.classList.toggle('open');
        if(!existing)mountTop(bar);
    }
'''
s=s[:start]+new_func+s[end:]
s=s.replace("        const previousBoard=document.getElementById('sl-mi-bazaar-board');\n",'',1)
s=s.replace("        previousBoard?.remove();\n        paintBazaarBoard(deals);","        paintBazaarBoard(deals);",1)
old="#sl-mi-best-run,#sl-mi-session,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items"
new="#sl-mi-best-run,#sl-mi-session,#sl-mi-arrival,#sl-mi-overlay,#sl-mi-country-best,#sl-mi-travel-plan,#sl-mi-bazaar-board,.sl-mi-travel,.sl-mi-bazaar,.sl-mi-bazaar-badge-wrap,.sl-mi-items"
assert old in s
s=s.replace(old,new,1)
SRC.write_text(s,encoding='utf-8')

reg=json.loads(REG.read_text(encoding='utf-8'))
for entry in reg.get('scripts',[]):
    if entry.get('id')=='market-intelligence':
        entry['version']='1.16.2'
        entry['description']='Torn PDA-first market/travel intelligence with stable non-flickering Travel and Bazaar panels, anonymous opt-in Price Network, Bazaar Flip and travel/basket tools.'
REG.write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

info=INFO.read_text(encoding='utf-8')
info=info.replace('SakaLuX Market Intelligence: **v1.16.1**','SakaLuX Market Intelligence: **v1.16.2**',1)
release='''### SakaLuX Market Intelligence v1.16.2
- Fixed **BAZAAR FLIP INTELLIGENCE** flicker during rescans.
- Bazaar Flip now keeps the same outer DOM panel and updates only its contents.
- The open/collapsed state is preserved during Bazaar refreshes.
- Removed the extra pre-paint delete from `scanBazaar()`.
- MutationObserver now ignores changes made inside the Bazaar Flip board, preventing self-triggered refresh loops.
- The board is removed only when there are genuinely no profitable deals or the page context changes.
- Added exact backup: `backups/SakaLuX-Market-Intelligence-v1.16.1.user.js`.

'''
if '### SakaLuX Market Intelligence v1.16.2' not in info:
    info=info.replace('## Latest changes\n\n','## Latest changes\n\n'+release,1)
INFO.write_text(info,encoding='utf-8')

gf=GF.read_text(encoding='utf-8')
gf=gf.replace('**Current version: v1.16.1**','**Current version: v1.16.2**',1)
gf_release='''## v1.16.2 — Stable Bazaar Flip Panel

- Fixed the visible disappear/reappear flicker of **BAZAAR FLIP INTELLIGENCE** during Bazaar rescans.
- The panel now remains mounted and updates its content in place.
- Open/collapsed state is preserved while prices refresh.
- MutationObserver ignores the script's own Bazaar board updates, preventing self-triggered rescans.

'''
if '## v1.16.2 — Stable Bazaar Flip Panel' not in gf:
    gf=gf.replace('## v1.16.1',gf_release+'## v1.16.1',1)
GF.write_text(gf,encoding='utf-8')
