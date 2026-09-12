from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.9\.16(\s*$)',r'\g<1>1.9.17\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version')
text,n=re.subn(r"const VERSION = '1\.9\.16';","const VERSION = '1.9.17';",text,count=1)
if n!=1: raise SystemExit('runtime version')

needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.17',
            date: '2026-09-12',
            changes: [
                'Keeps the S launcher as the first Torn statusIcons item before cash.',
                'Restores the native skull launcher before Messages when Touchscreen Navigation exposes the Fly-out sidebar.',
                'Uses the on-screen floating skull only when the Fly-out sidebar navigation is unavailable.'
            ]
        },
"""
text=text.replace(needle,entry,1)

old="""        topSkull: 'sakalux-hub-top-skull',
        topBadge: 'sakalux-hub-top-badge',
"""
new="""        topSkull: 'sakalux-hub-top-skull',
        topBadge: 'sakalux-hub-top-badge',
        navSkull: 'sakalux-hub-nav-skull',
        navBadge: 'sakalux-hub-nav-badge',
"""
if old not in text: raise SystemExit('IDS anchor')
text=text.replace(old,new,1)

css_anchor="#${IDS.topBadge}{position:absolute;top:-7px;right:-7px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3;border:1px solid #111923}\n"
nav_css="#${IDS.navSkull}{position:relative!important;box-sizing:border-box!important}#${IDS.navSkull} .slh-native-link{position:relative!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}#${IDS.navSkull} .slh-native-skull-icon{animation:slhNativeSkullBlink 2.45s ease-in-out infinite!important;transform-origin:center center!important}#${IDS.navSkull}.slh-alert .slh-native-skull-icon{animation:slhNativeSkullAlert .92s ease-in-out infinite!important}#${IDS.navBadge}{position:absolute;top:0;right:4px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3}@keyframes slhNativeSkullBlink{0%,8%,16%,24%,32%,100%{opacity:.48}11%,19%,27%{opacity:1}40%,75%{opacity:.72}}@keyframes slhNativeSkullAlert{0%,100%{opacity:.38}50%{opacity:1}72%{opacity:.58}}\n"
if css_anchor not in text: raise SystemExit('css anchor')
text=text.replace(css_anchor,css_anchor+nav_css,1)

anchor="    function findStatusIconList() {\n"
mobile_fn="""    function getMobileNavContext() {
        const swiperWrap = document.querySelector('.swiper-wrapper') || document.querySelector('[class*="swiper___"]');
        const areasWrap = document.querySelector('[class*="areasMobile___"]');
        const wrapper = swiperWrap || areasWrap;
        if (!wrapper) return null;
        const links = [...wrapper.querySelectorAll('a[class*="mobileLink___"]')];
        const messagesLink = links.find(link => {
            const label = link.querySelector('span[class*="linkName___"]');
            const text = String(label?.textContent || link.textContent || '').trim().toUpperCase();
            const href = String(link.getAttribute('href') || '').toLowerCase();
            return text === 'MESSAGES' || href.includes('messages');
        });
        if (!messagesLink) return null;
        const messagesArea = messagesLink.closest('[class*="area-mobile___"]');
        if (!messagesArea) return null;
        const messagesSlide = messagesArea.closest('[class*="slide___"]');
        const isSwiper = Boolean(messagesSlide && messagesSlide.parentElement === wrapper);
        return {
            wrapper, isSwiper, messagesLink, messagesArea, messagesSlide,
            nativeRow: messagesArea.querySelector('[class*="areaRow___"], [class*="area-row___"]'),
            nativeIconWrap: messagesLink.querySelector('span[class*="svgIconWrap___"]'),
            nativeDefaultIcon: messagesLink.querySelector('span[class*="defaultIcon___"]'),
            nativeLabel: messagesLink.querySelector('span[class*="linkName___"]'),
            nativeSvg: messagesLink.querySelector('svg')
        };
    }

"""
if anchor not in text: raise SystemExit('status anchor')
text=text.replace(anchor,mobile_fn+anchor,1)

old_sync="""    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const nativeReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.topSkull));
        button.style.setProperty('display', nativeReady ? 'none' : 'flex', 'important');
    }
"""
new_sync="""    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const flyoutReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.navSkull));
        button.style.setProperty('display', flyoutReady ? 'none' : 'flex', 'important');
    }
"""
if old_sync not in text: raise SystemExit('sync block')
text=text.replace(old_sync,new_sync,1)

insert_before="    function updateTopbarSkullState() {\n"
nav_function="""    function createNavSkull() {
        const existing = document.getElementById(IDS.navSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        const ctx = getMobileNavContext();
        if (!ctx) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected) {
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
        const area = document.createElement('div');
        area.className = ctx.messagesArea.className;
        const row = document.createElement('div');
        if (ctx.nativeRow) row.className = ctx.nativeRow.className;
        const link = document.createElement('a');
        link.className = ctx.messagesLink.className;
        link.href = '#';
        link.tabIndex = 0;
        link.classList.add('slh-native-link');
        link.setAttribute('aria-label', 'Open SakaLuX Script Hub');
        link.setAttribute('title', 'SakaLuX Script Hub');
        const iconWrap = document.createElement('span');
        if (ctx.nativeIconWrap) iconWrap.className = ctx.nativeIconWrap.className;
        const innerIcon = document.createElement('span');
        if (ctx.nativeDefaultIcon) innerIcon.className = ctx.nativeDefaultIcon.className;
        innerIcon.classList.add('slh-native-skull-icon');
        innerIcon.style.setProperty('filter', 'none', 'important');
        innerIcon.style.setProperty('-webkit-filter', 'none', 'important');
        const skullSvg = buildSkullSvg(ctx.nativeSvg);
        if (skullSvg) innerIcon.appendChild(skullSvg); else innerIcon.textContent = '☠︎';
        iconWrap.appendChild(innerIcon);
        link.appendChild(iconWrap);
        const label = document.createElement('span');
        if (ctx.nativeLabel) label.className = ctx.nativeLabel.className;
        label.textContent = 'HUB';
        link.appendChild(label);
        const badge = document.createElement('span');
        badge.id = IDS.navBadge;
        link.appendChild(badge);
        const open = event => { event.preventDefault(); event.stopPropagation(); openHub(); };
        link.addEventListener('click', open);
        link.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(event); });
        row.appendChild(link);
        area.appendChild(row);
        let mounted;
        if (ctx.isSwiper && ctx.messagesSlide) {
            const slide = document.createElement('div');
            slide.className = ctx.messagesSlide.className.replace(/swiper-slide-active|swiper-slide-next|swiper-slide-prev|contextMenuActive___\\S+/g, '').trim();
            if (ctx.messagesSlide.style.width) slide.style.width = ctx.messagesSlide.style.width;
            slide.appendChild(area);
            mounted = slide;
        } else mounted = area;
        mounted.id = IDS.navSkull;
        const reference = ctx.isSwiper ? ctx.messagesSlide : ctx.messagesArea;
        ctx.wrapper.insertBefore(mounted, reference);
        if (ctx.isSwiper) {
            try { ctx.wrapper.parentElement?.swiper?.update?.(); } catch {}
        }
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

"""
if insert_before not in text: raise SystemExit('update anchor')
text=text.replace(insert_before,nav_function+insert_before,1)

old_update="""        const skull = document.getElementById(IDS.topSkull);
        const badge = document.getElementById(IDS.topBadge);
        if (!skull) return;
        const total = getIssueCount();
        skull.classList.toggle('slh-alert', total > 0);
        if (badge) {
            badge.style.display = total > 0 ? 'flex' : 'none';
            badge.textContent = total > 99 ? '99+' : String(total);
        }
"""
new_update="""        const total = getIssueCount();
        for (const [skullId, badgeId] of [[IDS.topSkull, IDS.topBadge], [IDS.navSkull, IDS.navBadge]]) {
            const skull = document.getElementById(skullId);
            const badge = document.getElementById(badgeId);
            if (!skull) continue;
            skull.classList.toggle('slh-alert', total > 0);
            if (badge) {
                badge.style.display = total > 0 ? 'flex' : 'none';
                badge.textContent = total > 99 ? '99+' : String(total);
            }
        }
"""
if old_update not in text: raise SystemExit('update state block')
text=text.replace(old_update,new_update,1)

text=text.replace("updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); createTopbarSkull(); syncFloatingButtonVisibility(); openHub();",
                  "updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); openHub();")
text=text.replace("updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); createTopbarSkull(); syncFloatingButtonVisibility(); alert('Backup restored.'); openHub();",
                  "updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); alert('Backup restored.'); openHub();")
text=text.replace("updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); createTopbarSkull(); syncFloatingButtonVisibility(); updateBadge(); openHub();",
                  "updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); updateBadge(); openHub();")
text=text.replace("injectCss(); createTopbarSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();",
                  "injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();",1)
text=text.replace("nativeHubLauncher: Boolean(document.getElementById(IDS.topSkull))",
                  "nativeHubLauncher: Boolean(document.getElementById(IDS.topSkull)), flyoutHubLauncher: Boolean(document.getElementById(IDS.navSkull)), floatingFallback: !Boolean(document.getElementById(IDS.navSkull))",1)
text=text.replace("'Torn status-bar launcher', 'Mount the compact SakaLuX icon directly inside Torn statusIcons. The floating skull is used only when Torn does not expose that native icon list.'",
                  "'Torn launchers', 'Show S before cash and, when Touchscreen Navigation uses Fly-out sidebar, show the skull before Messages. Otherwise use the floating skull fallback.'",1)

p.write_text(text,encoding='utf-8')

mp=ROOT/'greasyfork/Script-Hub.md'
doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.9\.16(\*\*)',r'\g<1>1.9.17\2',doc,count=1)
if n!=1: raise SystemExit('doc version')
if '### v1.9.17' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.9.17 — Three-tier Torn launcher behavior\n\n- Keeps the compact **S** as the first native `statusIcons` item before cash.\n- Restores the skull launcher before **Messages** when Touchscreen Navigation exposes the **Fly-out sidebar**.\n- Shows the floating skull only when the Fly-out sidebar navigation is unavailable.\n',1)
mp.write_text(doc,encoding='utf-8')
print('Hub v1.9.17 three-tier launcher migration applied')