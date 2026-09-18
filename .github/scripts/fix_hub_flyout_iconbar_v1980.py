# trigger v1.9.80
from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.79', '// @version      1.9.80', 1)
text = text.replace("const VERSION = '1.9.79';", "const VERSION = '1.9.80';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.80", "date": "2026-09-19", "changes": '
    '["Fly-out launcher now mounts in Torn\'s three-icon quick-action strip as the fourth button, after Messages, Events and Awards/Merits.", '
    '"Uses the actual visible icon row instead of text labels, fixing TornPDA layouts where those three buttons have no text nodes.", '
    '"Keeps the blinking skull artwork and removes inherited badges/labels from the cloned quick-action button."]},\n'
)
if entry not in text:
    if marker not in text:
        raise SystemExit('HUB_CHANGELOG marker not found')
    text = text.replace(marker, marker + entry, 1)

replacement = r'''    function createNavSkull() {
        const existing = document.getElementById(IDS.navSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const visible = el => {
            if (!(el instanceof Element) || !el.isConnected) return false;
            try {
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01
                    && r.width > 20 && r.height > 20 && r.bottom > 0 && r.right > 0;
            } catch { return false; }
        };
        const labelOf = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const allClicks = [...document.querySelectorAll('a[href],button')]
            .filter(el => !el.closest?.(`#${IDS.navSkull}`) && visible(el));

        const gym = allClicks.find(el => labelOf(el) === 'gym');
        const home = allClicks.find(el => labelOf(el) === 'home');
        if (!gym || !home) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const ancestors = el => {
            const out = [];
            let node = el;
            for (let i = 0; node && i < 12; i += 1, node = node.parentElement) out.push(node);
            return out;
        };
        const homeAnc = new Set(ancestors(home));
        const sidebar = ancestors(gym).find(node => homeAnc.has(node) && node !== document.body && node !== document.documentElement);
        if (!sidebar) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const gymRect = gym.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        const sidebarClicks = allClicks.filter(el => sidebar.contains(el));
        const grouped = new Map();
        for (const el of sidebarClicks) {
            const r = el.getBoundingClientRect();
            if (r.top >= gymRect.top || r.bottom > gymRect.top + 2) continue;
            if (r.left < sidebarRect.left - 4 || r.right > sidebarRect.right + 4) continue;
            if (r.width < 45 || r.width > 140 || r.height < 38 || r.height > 90) continue;
            const key = Math.round(r.top / 4) * 4;
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(el);
        }

        let quick = null;
        for (const group of grouped.values()) {
            const unique = [...new Set(group)].sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
            const ys = unique.map(el => el.getBoundingClientRect());
            const aligned = unique.length >= 3 && Math.max(...ys.map(r => r.top)) - Math.min(...ys.map(r => r.top)) <= 8;
            if (!aligned) continue;
            if (!quick || unique[0].getBoundingClientRect().top < quick[0].getBoundingClientRect().top) quick = unique;
        }

        if (!quick || quick.length < 3) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const directChildUnder = (el, parent) => {
            let node = el;
            while (node?.parentElement && node.parentElement !== parent) node = node.parentElement;
            return node?.parentElement === parent ? node : null;
        };
        let rowParent = null;
        let cells = null;
        for (const first of quick) {
            let p = first.parentElement;
            for (let depth = 0; p && depth < 6; depth += 1, p = p.parentElement) {
                const mapped = quick.map(el => directChildUnder(el, p)).filter(Boolean);
                const uniq = [...new Set(mapped)];
                if (uniq.length >= 3 && uniq.every(el => el.parentElement === p)) {
                    rowParent = p;
                    cells = uniq.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
                    break;
                }
            }
            if (rowParent) break;
        }
        if (!rowParent || !cells || cells.length < 3) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const third = cells[2];
        const positionFourth = row => {
            if (!row || !third?.parentElement) return false;
            if (row.parentElement !== rowParent || third.nextElementSibling !== row) third.insertAdjacentElement('afterend', row);
            row.dataset.sakaluxHubMode = 'flyout-iconbar';
            return true;
        };

        if (existing?.isConnected) {
            positionFourth(existing);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const cell = third.cloneNode(true);
        cell.id = IDS.navSkull;
        cell.setAttribute('data-sakalux-hub-launcher', 'flyout-iconbar');
        cell.dataset.sakaluxHubMode = 'flyout-iconbar';
        cell.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        cell.querySelectorAll('[data-testid],[aria-current]').forEach(el => {
            el.removeAttribute('data-testid');
            el.removeAttribute('aria-current');
        });

        const click = cell.matches('a[href],button') ? cell : cell.querySelector('a[href],button');
        if (!click) {
            syncFloatingButtonVisibility();
            return false;
        }
        if (click.tagName === 'A') click.setAttribute('href', '#sakalux-hub');
        click.removeAttribute('target');
        click.removeAttribute('rel');
        click.classList.add('slh-native-link');
        click.setAttribute('title', 'SakaLuX Hub');
        click.setAttribute('aria-label', 'SakaLuX Hub');

        [...click.querySelectorAll('span,div')].forEach(el => {
            if (el.children.length === 0 && String(el.textContent || '').trim()) el.textContent = '';
        });
        [...click.querySelectorAll('img')].forEach(img => img.remove());
        const svgs = [...click.querySelectorAll('svg')];
        const nativeSvg = svgs[0] || null;
        svgs.slice(1).forEach(svg => svg.remove());

        const makeSkullSvg = sourceSvg => {
            if (!sourceSvg) return null;
            const svg = sourceSvg.cloneNode(false);
            const vb = (sourceSvg.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
            const vbW = vb[2] || 24;
            const vbH = vb[3] || 24;
            const ART_INK = 20;
            const scale = vbH / ART_INK;
            const tx = (vb[0] || 0) + (vbW - 24 * scale) / 2;
            const ty = (vb[1] || 0) + (vbH - 24 * scale) / 2;
            svg.style.overflow = 'visible';
            svg.style.setProperty('filter', 'none', 'important');
            svg.style.setProperty('-webkit-filter', 'none', 'important');
            svg.setAttribute('aria-hidden', 'true');
            svg.classList.add('slh-native-skull-icon');
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`);
            g.setAttribute('fill', 'none');
            g.setAttribute('stroke', 'currentColor');
            g.setAttribute('stroke-width', '1.75');
            g.setAttribute('stroke-linecap', 'round');
            g.setAttribute('stroke-linejoin', 'round');
            g.innerHTML = `<path d="M12 2.4c-4.8 0-8.1 3.2-8.1 7.6 0 2.8 1.4 5.1 3.8 6.4v3.1h2.2v-2.1h1v2.1h2.2v-2.1h1v2.1h2.2v-3.1c2.4-1.3 3.8-3.6 3.8-6.4 0-4.4-3.3-7.6-8.1-7.6Z"/><circle cx="8.8" cy="10.5" r="1.65"/><circle cx="15.2" cy="10.5" r="1.65"/><path d="m12 12.7-1 1.8h2l-1-1.8Z"/><path d="M8.1 16.1h7.8M10.5 16.1v1.3M13.5 16.1v1.3"/>`;
            svg.appendChild(g);
            return svg;
        };

        if (nativeSvg) {
            const skullSvg = makeSkullSvg(nativeSvg);
            if (skullSvg) nativeSvg.replaceWith(skullSvg);
        } else {
            const icon = document.createElement('span');
            icon.className = 'slh-native-skull-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '☠︎';
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:24px;';
            click.appendChild(icon);
        }

        const badge = document.createElement('span');
        badge.id = IDS.navBadge;
        click.appendChild(badge);

        const open = event => {
            event.preventDefault();
            event.stopPropagation();
            openHub();
        };
        click.addEventListener('click', open, true);
        click.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') open(event);
        }, true);

        positionFourth(cell);
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }
'''

start_marker = '    function createNavSkull() {'
end_marker = '\n    function updateTopbarSkullState()'
start = text.find(start_marker)
if start < 0:
    raise SystemExit('createNavSkull start not found')
end = text.find(end_marker, start)
if end < 0:
    raise SystemExit('updateTopbarSkullState marker not found')
text = text[:start] + replacement.rstrip() + '\n\n' + text[end + 1:]
HUB.write_text(text, encoding='utf-8')
print('Patched Hub v1.9.80: fly-out quick-action iconbar fourth button')
