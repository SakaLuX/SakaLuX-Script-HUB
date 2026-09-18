from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.77', '// @version      1.9.78', 1)
text = text.replace("const VERSION = '1.9.77';", "const VERSION = '1.9.78';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.78", "date": "2026-09-19", "changes": '
    '["Fly-out launcher now mounts as the first native sidebar row, directly before Gym, instead of cloning expandable contact rows near the bottom.", '
    '"Removes inherited counters and chevrons from the Hub fly-out row so no stray 1 or arrow appears.", '
    '"Keeps the blinking skull artwork and native Torn row styling."]},\n'
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

        const findNativeRow = start => {
            if (!start) return null;
            let node = start;
            for (let depth = 0; node && depth < 8; depth += 1) {
                const parent = node.parentElement;
                if (!parent) break;
                const siblings = [...parent.children].filter(child => {
                    const click = child.matches?.('a[href],button') ? child : child.querySelector?.('a[href],button');
                    return Boolean(click);
                });
                if (siblings.length >= 3) return node;
                node = parent;
            }
            return start.closest?.('li,[role="menuitem"]') || start.parentElement;
        };

        // Fly-out mode is identified by Torn's native main sidebar rows.
        // The Hub belongs at the very top of this list: immediately before Gym.
        const names = ['gym', 'properties', 'education', 'crimes', 'missions', 'newspaper', 'jail', 'hospital', 'casino'];
        const anchors = names
            .map(name => allClickable.find(el => cleanLabel(el) === name))
            .filter(Boolean);
        const rows = anchors.map(findNativeRow).filter(Boolean);

        let sidebarParent = null;
        let templateRow = null;
        let insertTarget = null;
        for (const row of rows) {
            const parent = row.parentElement;
            if (!parent) continue;
            const sameParentCount = rows.filter(candidate => candidate.parentElement === parent).length;
            if (sameParentCount >= 3) {
                sidebarParent = parent;
                templateRow = rows.find(candidate => candidate.parentElement === parent && cleanLabel(candidate).includes('gym'))
                    || rows.find(candidate => candidate.parentElement === parent)
                    || row;
                insertTarget = templateRow;
                break;
            }
        }

        if (!sidebarParent || !templateRow || !insertTarget) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const positionAtTop = row => {
            if (!row) return false;
            if (row.parentElement !== sidebarParent || row.nextElementSibling !== insertTarget) {
                sidebarParent.insertBefore(row, insertTarget);
            }
            row.dataset.sakaluxHubMode = 'flyout';
            return true;
        };

        if (existing?.isConnected) {
            positionAtTop(existing);
            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const row = templateRow.cloneNode(true);
        row.id = IDS.navSkull;
        row.setAttribute('data-sakalux-hub-launcher', 'flyout');
        row.dataset.sakaluxHubMode = 'flyout';
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

        const leafText = [...click.querySelectorAll('span,div')].filter(el => el.children.length === 0);
        const labelNode = leafText.find(el => cleanLabel(el) === 'gym')
            || leafText.find(el => cleanLabel(el) === cleanLabel(templateRow))
            || leafText.find(el => cleanLabel(el));
        if (labelNode) labelNode.textContent = 'SAKALUX HUB';

        // Remove any inherited numeric badges / right-side labels from the cloned row.
        for (const el of leafText) {
            if (el === labelNode) continue;
            const t = String(el.textContent || '').trim();
            if (/^\d+$/.test(t) || /^[›»▶►→]+$/.test(t)) {
                el.setAttribute('data-sakalux-inherited-extra', '1');
                el.remove();
            }
        }

        const makeSkullSvg = nativeSvg => {
            if (!nativeSvg) return null;
            const svg = nativeSvg.cloneNode(false);
            const vb = (nativeSvg.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
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
            g.innerHTML = `
                <path d="M12 2.4c-4.8 0-8.1 3.2-8.1 7.6 0 2.8 1.4 5.1 3.8 6.4v3.1h2.2v-2.1h1v2.1h2.2v-2.1h1v2.1h2.2v-3.1c2.4-1.3 3.8-3.6 3.8-6.4 0-4.4-3.3-7.6-8.1-7.6Z"/>
                <circle cx="8.8" cy="10.5" r="1.65"/>
                <circle cx="15.2" cy="10.5" r="1.65"/>
                <path d="m12 12.7-1 1.8h2l-1-1.8Z"/>
                <path d="M8.1 16.1h7.8M10.5 16.1v1.3M13.5 16.1v1.3"/>`;
            svg.appendChild(g);
            return svg;
        };

        const nativeSvg = click.querySelector('svg');
        if (nativeSvg) {
            const skullSvg = makeSkullSvg(nativeSvg);
            if (skullSvg) nativeSvg.replaceWith(skullSvg);
            // A fly-out row can contain a second SVG chevron. Keep only the skull.
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

        positionAtTop(row);
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
print('Patched Hub v1.9.78 fly-out launcher placement')
