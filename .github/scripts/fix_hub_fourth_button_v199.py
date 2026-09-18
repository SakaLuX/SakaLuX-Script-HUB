# trigger v1.9.79
from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.78', '// @version      1.9.79', 1)
text = text.replace("const VERSION = '1.9.78';", "const VERSION = '1.9.79';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.79", "date": "2026-09-19", "changes": '
    '["Corrects Fly-out placement: SakaLuX Hub is the fourth navigation button, immediately after Messages, Events and Awards/Merits.", '
    '"Removes inherited counters and chevrons from the Hub launcher.", '
    '"Topbar legacy keeps the Hub launcher immediately before Messages."]},\n'
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

        const allClickable = [...document.querySelectorAll('a[href], button')]
            .filter(el => !el.closest?.(`#${IDS.navSkull}`));
        const labelOf = el => String(el?.textContent || '').replace(/\s+/g, ' ').trim();
        const cleanLabel = el => labelOf(el)
            .replace(/\b\d+\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const named = (el, names) => names.includes(cleanLabel(el));

        const messages = allClickable.filter(el => named(el, ['messages', 'message']));
        const events = allClickable.filter(el => named(el, ['events', 'event']));
        const awards = allClickable.filter(el => named(el, ['awards', 'award', 'merits', 'merit']));

        const ancestors = el => {
            const out = [];
            let node = el;
            for (let i = 0; node && i < 10; i += 1, node = node.parentElement) out.push(node);
            return out;
        };
        const commonAncestor = (a, b, c) => {
            if (!a || !b || !c) return null;
            const bSet = new Set(ancestors(b));
            const cSet = new Set(ancestors(c));
            return ancestors(a).find(node => bSet.has(node) && cSet.has(node)) || null;
        };
        const directChildUnder = (el, parent) => {
            if (!el || !parent) return null;
            let node = el;
            while (node?.parentElement && node.parentElement !== parent) node = node.parentElement;
            return node?.parentElement === parent ? node : null;
        };

        let match = null;
        outer:
        for (const m of messages) {
            for (const e of events) {
                for (const a of awards) {
                    const container = commonAncestor(m, e, a);
                    if (!container || container === document.body || container === document.documentElement) continue;
                    const mr = directChildUnder(m, container);
                    const er = directChildUnder(e, container);
                    const ar = directChildUnder(a, container);
                    if (!mr || !er || !ar || new Set([mr, er, ar]).size < 3) continue;
                    match = { container, m, e, a, mr, er, ar };
                    break outer;
                }
            }
        }

        if (!match) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const containerText = cleanLabel(match.container);
        const isLegacyTopbar = ['home', 'items', 'travel', 'raceway', 'city']
            .filter(token => containerText.includes(token)).length >= 2;
        const mode = isLegacyTopbar ? 'topbar' : 'flyout';
        const insertTarget = isLegacyTopbar ? match.mr : match.ar;
        const templateRow = isLegacyTopbar ? match.mr : match.ar;
        const insertBefore = isLegacyTopbar;

        const position = row => {
            if (!row || !insertTarget?.parentElement) return false;
            const parent = insertTarget.parentElement;
            if (insertBefore) {
                if (row.parentElement !== parent || row.nextElementSibling !== insertTarget) parent.insertBefore(row, insertTarget);
            } else {
                if (row.parentElement !== parent || insertTarget.nextElementSibling !== row) insertTarget.insertAdjacentElement('afterend', row);
            }
            row.dataset.sakaluxHubMode = mode;
            return true;
        };

        if (existing?.isConnected) {
            position(existing);
            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const row = templateRow.cloneNode(true);
        row.id = IDS.navSkull;
        row.setAttribute('data-sakalux-hub-launcher', mode);
        row.dataset.sakaluxHubMode = mode;
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

        const sourceLabel = cleanLabel(templateRow);
        const leaves = [...click.querySelectorAll('span,div')].filter(el => el.children.length === 0);
        const labelNode = leaves.find(el => cleanLabel(el) === sourceLabel)
            || leaves.find(el => named(el, ['messages','message','events','event','awards','award','merits','merit']))
            || leaves.find(el => cleanLabel(el));
        if (labelNode) labelNode.textContent = mode === 'topbar' ? 'HUB' : 'SAKALUX HUB';

        for (const el of [...click.querySelectorAll('span,div')]) {
            if (el === labelNode) continue;
            const t = String(el.textContent || '').trim();
            if (/^\d+$/.test(t) || /^[›»▶►→]+$/.test(t)) {
                el.setAttribute('data-sakalux-inherited-extra', '1');
                el.remove();
            }
        }
        const svgList = [...click.querySelectorAll('svg')];
        const nativeSvg = svgList[0] || null;

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
            [...click.querySelectorAll('svg')].slice(1).forEach(svg => svg.remove());
        } else {
            const img = click.querySelector('img');
            if (img) img.style.display = 'none';
            const icon = document.createElement('span');
            icon.className = 'slh-native-skull-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '☠︎';
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:24px;margin-right:8px;';
            click.prepend(icon);
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

        position(row);
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
print('Patched Hub v1.9.79: fourth button after Messages, Events, Awards/Merits')
