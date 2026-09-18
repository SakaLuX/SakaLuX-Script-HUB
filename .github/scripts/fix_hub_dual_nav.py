from pathlib import Path

path = Path('SakaLuX-Script-Hub.user.js')
text = path.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.76', '// @version      1.9.77', 1)
text = text.replace("const VERSION = '1.9.76';", "const VERSION = '1.9.77';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.77", "date": "2026-09-19", "changes": '
    '["Restores the original blinking skull artwork for the native Hub navigation launcher.", '
    '"In Topbar (legacy) mode the Hub launcher is mounted immediately before Messages; in Fly-out mode it is mounted immediately after Messages, Events and Awards/Merits.", '
    '"Keeps the launcher inside Torn native navigation rows so sizing, spacing and scrolling match the selected navigation mode."]},\n'
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
        const hrefOf = el => String(el?.getAttribute?.('href') || '').toLowerCase();
        const named = (el, names) => names.includes(cleanLabel(el));

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

        const firstNamed = names => allClickable.find(el => named(el, names));
        const messagesAnchor = firstNamed(['messages', 'message']);
        const eventsAnchor = firstNamed(['events', 'event']);
        const awardsAnchor = firstNamed(['awards', 'award', 'merits', 'merit']);

        const messagesRow = findNativeRow(messagesAnchor);
        const eventsRow = findNativeRow(eventsAnchor);
        const awardsRow = findNativeRow(awardsAnchor);

        let navParent = null;
        if (messagesRow?.parentElement && eventsRow?.parentElement === messagesRow.parentElement) {
            navParent = messagesRow.parentElement;
        } else if (messagesRow?.parentElement && awardsRow?.parentElement === messagesRow.parentElement) {
            navParent = messagesRow.parentElement;
        }

        let mode = 'flyout';
        let insertTarget = null;
        let insertBefore = false;
        let templateRow = null;

        if (navParent) {
            const navText = cleanLabel(navParent);
            const legacySignals = ['home', 'items', 'travel', 'raceway', 'city'];
            mode = legacySignals.some(token => navText.includes(token)) ? 'topbar' : 'flyout';

            if (mode === 'topbar') {
                insertTarget = messagesRow || eventsRow || awardsRow;
                insertBefore = true;
                templateRow = messagesRow || eventsRow || awardsRow;
            } else {
                insertTarget = awardsRow || eventsRow || messagesRow;
                insertBefore = false;
                templateRow = awardsRow || eventsRow || messagesRow;
            }
        }

        if (!insertTarget || !templateRow) {
            const catAnchor = allClickable.find(el => /^cat script$/i.test(labelOf(el)));
            const targetAnchor = allClickable.find(el => named(el, ['targets', 'target']) || hrefOf(el).includes('target'));
            const enemyAnchor = allClickable.find(el => named(el, ['enemies', 'enemy']) || hrefOf(el).includes('enemies'));
            const friendAnchor = allClickable.find(el => named(el, ['friends', 'friend']) || hrefOf(el).includes('friends'));
            const fallbackAnchor = catAnchor || targetAnchor || enemyAnchor || friendAnchor;
            templateRow = findNativeRow(fallbackAnchor);
            insertTarget = templateRow;
            insertBefore = Boolean(catAnchor && templateRow);
            mode = 'flyout';
        }

        if (!insertTarget?.parentElement || !templateRow?.parentElement) {
            syncFloatingButtonVisibility();
            return false;
        }

        const positionExisting = row => {
            const parent = insertTarget.parentElement;
            if (!parent || !row) return false;
            if (insertBefore) {
                if (row.parentElement !== parent || row.nextElementSibling !== insertTarget) {
                    parent.insertBefore(row, insertTarget);
                }
            } else {
                if (row.parentElement !== parent || insertTarget.nextElementSibling !== row) {
                    insertTarget.insertAdjacentElement('afterend', row);
                }
            }
            row.dataset.sakaluxHubMode = mode;
            return true;
        };

        if (existing?.isConnected) {
            positionExisting(existing);
            const icon = existing.querySelector('.slh-native-skull-icon');
            if (icon) icon.style.animation = '';
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

        const sourceText = cleanLabel(templateRow);
        const textLeaves = [...click.querySelectorAll('span,div')].filter(el => {
            const t = cleanLabel(el);
            return t && el.children.length === 0;
        });
        const labelNode = textLeaves.find(el => cleanLabel(el) === sourceText)
            || textLeaves.find(el => ['messages','message','events','event','awards','award','merits','merit','cat script','targets','target','enemies','enemy','friends','friend'].includes(cleanLabel(el)))
            || textLeaves[textLeaves.length - 1];
        if (labelNode) labelNode.textContent = mode === 'topbar' ? 'HUB' : 'SAKALUX HUB';

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

        const oldBadges = row.querySelectorAll(`#${IDS.navBadge}`);
        oldBadges.forEach(badge => badge.remove());
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

        positionExisting(row);
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }
'''

needle = '    function createNavSkull() {'
start = text.find(needle)
if start < 0:
    raise SystemExit('createNavSkull start not found')
brace = text.find('{', start)
if brace < 0:
    raise SystemExit('createNavSkull opening brace not found')

depth = 0
quote = None
escape = False
i = brace
while i < len(text):
    ch = text[i]
    if quote:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == quote:
            quote = None
    else:
        if ch in ('\"', "'", '`'):
            quote = ch
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    i += 1
else:
    raise SystemExit('createNavSkull closing brace not found')

text = text[:start] + replacement + text[end:]
path.write_text(text, encoding='utf-8')
print('Patched Hub v1.9.77 native blinking skull placement')
