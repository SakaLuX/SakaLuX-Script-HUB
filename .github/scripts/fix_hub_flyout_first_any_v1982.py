from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.81', '// @version      1.9.82', 1)
text = text.replace("const VERSION = '1.9.81';", "const VERSION = '1.9.82';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.82", "date": "2026-09-19", "changes": '
    '["Fly-out launcher no longer depends on Home being present.", '
    '"Detects the real vertical Torn navigation list from any available standard sidebar rows and inserts SakaLuX Hub as the first row of that list.", '
    '"Keeps the skull artwork and avoids inherited counters or chevrons."]},\n'
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
        const cleanLabel = el => String(el?.textContent || '')
            .replace(/\b\d+\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const clicks = [...document.querySelectorAll('a[href],button')]
            .filter(el => !el.closest?.(`#${IDS.navSkull}`) && visible(el));

        const knownLabels = new Set([
            'home','items','travel agency','travel','raceway','city','item market','gym','properties',
            'education','crimes','missions','newspaper','jail','hospital','casino','forums','calendar',
            'elimination','community events','friends','enemies','targets'
        ]);
        const anchors = clicks.filter(el => knownLabels.has(cleanLabel(el)));
        if (anchors.length < 2) {
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

        let best = null;
        for (const anchor of anchors) {
            for (const parent of ancestors(anchor)) {
                if (!parent || parent === document.body || parent === document.documentElement) continue;
                const rows = [...new Set(anchors.map(el => directChildUnder(el, parent)).filter(Boolean))];
                if (rows.length < 3) continue;
                const rects = rows.map(row => row.getBoundingClientRect());
                const verticalSpread = Math.max(...rects.map(r => r.top)) - Math.min(...rects.map(r => r.top));
                if (verticalSpread < 80) continue; // reject the horizontal 3-icon quick bar
                const score = rows.length * 100 + verticalSpread;
                if (!best || score > best.score) best = { parent, rows, score };
            }
        }

        if (!best) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const listParent = best.parent;
        const rows = best.rows
            .filter(row => visible(row))
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const firstRow = rows[0];
        if (!firstRow) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const positionFirstVertical = row => {
            if (!row) return false;
            const currentFirst = [...listParent.children].find(child => child !== row && visible(child));
            const target = currentFirst || firstRow;
            if (target && (row.parentElement !== listParent || row.nextElementSibling !== target)) {
                listParent.insertBefore(row, target);
            }
            row.dataset.sakaluxHubMode = 'flyout-first-vertical';
            return true;
        };

        if (existing?.isConnected) {
            positionFirstVertical(existing);
            existing.querySelector(`#${IDS.navBadge}`)?.remove();
            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const row = firstRow.cloneNode(true);
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

        const sourceLabel = cleanLabel(firstRow);
        const leaves = [...click.querySelectorAll('span,div')].filter(el => el.children.length === 0);
        const labelNode = leaves.find(el => cleanLabel(el) === sourceLabel) || leaves.find(el => cleanLabel(el));
        if (labelNode) labelNode.textContent = 'SAKALUX HUB';

        for (const el of [...click.querySelectorAll('span,div')]) {
            if (el === labelNode) continue;
            const t = String(el.textContent || '').trim();
            if (/^\d+$/.test(t) || /^[›»▶►→]+$/.test(t)) el.remove();
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
print('Patched Hub v1.9.82: first vertical row without Home dependency')
