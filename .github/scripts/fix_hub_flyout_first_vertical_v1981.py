from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.80', '// @version      1.9.81', 1)
text = text.replace("const VERSION = '1.9.80';", "const VERSION = '1.9.81';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.81", "date": "2026-09-19", "changes": '
    '["Corrects Fly-out placement: SakaLuX Hub is now the first item in the vertical navigation list, immediately before Home and below the three quick-action icons.", '
    '"Clones the simple Home row instead of expandable/contact rows, so no inherited counter or chevron appears.", '
    '"Keeps the skull launcher artwork and alert blink while Topbar legacy remains handled by the native topbar launcher."]},\n'
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
        const labelOf = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();
        const cleanLabel = el => labelOf(el).replace(/\b\d+\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
        const clicks = [...document.querySelectorAll('a[href],button')]
            .filter(el => !el.closest?.(`#${IDS.navSkull}`) && visible(el));

        // The Fly-out vertical navigation always exposes Home plus several standard rows.
        // Use Home itself as the template and insertion anchor so the Hub becomes the
        // first vertical row directly below Torn's three icon quick-actions.
        const home = clicks.find(el => cleanLabel(el) === 'home');
        const items = clicks.find(el => cleanLabel(el) === 'items');
        const gym = clicks.find(el => cleanLabel(el) === 'gym');
        if (!home || !items || !gym) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const ancestors = el => {
            const out = [];
            let node = el;
            for (let i = 0; node && i < 10; i += 1, node = node.parentElement) out.push(node);
            return out;
        };
        const directChildUnder = (el, parent) => {
            if (!el || !parent) return null;
            let node = el;
            while (node?.parentElement && node.parentElement !== parent) node = node.parentElement;
            return node?.parentElement === parent ? node : null;
        };

        let listParent = null;
        let homeRow = null;
        for (const parent of ancestors(home)) {
            if (!parent || parent === document.body || parent === document.documentElement) continue;
            const hr = directChildUnder(home, parent);
            const ir = directChildUnder(items, parent);
            const gr = directChildUnder(gym, parent);
            if (hr && ir && gr && new Set([hr, ir, gr]).size === 3) {
                listParent = parent;
                homeRow = hr;
                break;
            }
        }
        if (!listParent || !homeRow) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const positionFirstVertical = row => {
            if (!row) return false;
            if (row.parentElement !== listParent || row.nextElementSibling !== homeRow) {
                listParent.insertBefore(row, homeRow);
            }
            row.dataset.sakaluxHubMode = 'flyout-first-vertical';
            return true;
        };

        if (existing?.isConnected) {
            positionFirstVertical(existing);
            // Never show a numerical Hub badge or inherited chevron in the Fly-out row.
            existing.querySelector(`#${IDS.navBadge}`)?.remove();
            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const row = homeRow.cloneNode(true);
        row.id = IDS.navSkull;
        row.setAttribute('data-sakalux-hub-launcher', 'flyout-first-vertical');
        row.dataset.sakaluxHubMode = 'flyout-first-vertical';
        row.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        row.querySelectorAll('[data-testid],[aria-current]').forEach(el => {
            el.removeAttribute('data-testid');
            el.removeAttribute('aria-current');
        });

        const click = row.matches('a[href],button') ? row : row.querySelector('a[href],button');
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

        const leaves = [...click.querySelectorAll('span,div')].filter(el => el.children.length === 0);
        const labelNode = leaves.find(el => cleanLabel(el) === 'home') || leaves.find(el => cleanLabel(el));
        if (labelNode) labelNode.textContent = 'SAKALUX HUB';

        // Home is a simple row, but strip any secondary text/badge/chevron defensively.
        for (const el of [...click.querySelectorAll('span,div')]) {
            if (el === labelNode) continue;
            const t = String(el.textContent || '').trim();
            if (/^\d+$/.test(t) || /^[›»▶►→]+$/.test(t)) {
                el.setAttribute('data-sakalux-inherited-extra', '1');
                el.remove();
            }
        }

        const svgs = [...click.querySelectorAll('svg')];
        const nativeSvg = svgs[0] || null;
        svgs.slice(1).forEach(svg => svg.remove());
        [...click.querySelectorAll('img')].forEach(img => img.remove());

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
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:34px;margin-right:8px;font-size:22px;';
            click.prepend(icon);
        }

        // No navBadge in Fly-out: the skull itself carries the alert blink state.
        const open = event => {
            event.preventDefault();
            event.stopPropagation();
            openHub();
        };
        click.addEventListener('click', open, true);
        click.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') open(event);
        }, true);

        positionFirstVertical(row);
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
print('Patched Hub v1.9.81: first vertical Fly-out row before Home')
