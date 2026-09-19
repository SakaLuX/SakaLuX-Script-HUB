from pathlib import Path
import re

p=Path('SakaLuX-Market-Intelligence.user.js')
s=p.read_text(encoding='utf-8')

# Version bump.
s=s.replace('// @version      1.17.41','// @version      1.17.42',1)
s=s.replace("let v = '1.17.41';","let v = '1.17.42';",1)
s=s.replace("version:'1.17.41'","version:'1.17.42'")

# Add a strict page-scope detector for the two travel-only panels. Flight state alone is NOT a page detector.
marker='    function paintTravelSessionSummary(){'
if marker not in s:
    raise SystemExit('paintTravelSessionSummary marker not found')
helper=r'''    function isTravelPanelPage(){
        const href=String(location.href||'');
        const path=String(location.pathname||'');
        const searchHash=(String(location.search||'')+' '+String(location.hash||'')).toLowerCase();

        // Canonical Torn travel routes. Do not treat "currently flying" as being on the Travel page.
        if(/travelagency\.php/i.test(path)) return true;
        if(/(?:^|[?&#])sid=travel(?:[&#]|$)/i.test(href)) return true;
        if(/(?:^|[\/#?&=])travel(?:[\/#?&=]|$)/i.test(searchHash)) return true;

        // SPA fallback: only accept an exact visible main-page heading, never sidebar/menu text.
        const root=document.querySelector('#mainContainer,[role="main"],main,#content')||document.body;
        const headings=[...root.querySelectorAll('h1,h2,h3,h4,[class*="content-title"],[class*="page-title"]')];
        return headings.some(el=>{
            const cs=getComputedStyle(el);
            if(cs.display==='none'||cs.visibility==='hidden') return false;
            const r=el.getBoundingClientRect();
            if(r.width<1||r.height<1) return false;
            const text=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
            return text==='travel' || text==='travel agency';
        });
    }

    function enforceTravelPanelScope(){
        if(isTravelPanelPage()) return;
        document.getElementById('sl-mi-session')?.remove();
        document.getElementById('sl-mi-arrival')?.remove();
    }

    // Torn is SPA-like on mobile/PDA, so remove stale travel panels immediately after navigation.
    window.addEventListener('popstate',()=>setTimeout(enforceTravelPanelScope,0),{passive:true});
    window.addEventListener('hashchange',()=>setTimeout(enforceTravelPanelScope,0),{passive:true});
    document.addEventListener('click',()=>setTimeout(enforceTravelPanelScope,120),true);
    setInterval(enforceTravelPanelScope,1500);

'''
s=s.replace(marker,helper+marker,1)

old="        if(detectPage()!=='travel'){existing?.remove();return;}"
new="        if(!isTravelPanelPage()){existing?.remove();return;}"
if old not in s:
    raise SystemExit('travel session page guard not found')
s=s.replace(old,new,1)

old2="        if(!settings.arrivalStock||!detectInFlight()){previousArrival?.remove();return;}"
new2="        if(!settings.arrivalStock||!detectInFlight()||!isTravelPanelPage()){previousArrival?.remove();return;}"
if old2 not in s:
    raise SystemExit('arrival stock guard not found')
s=s.replace(old2,new2,1)

p.write_text(s,encoding='utf-8')
print('Market Intelligence patched to v1.17.42: Travel Session Summary + Arrival Basket are strict Travel-page only.')
