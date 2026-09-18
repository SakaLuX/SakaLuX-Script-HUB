from pathlib import Path

path = Path('SakaLuX-Script-Hub.user.js')
text = path.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.75', '// @version      1.9.76', 1)
text = text.replace("const VERSION = '1.9.75';", "const VERSION = '1.9.76';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.76", "date": "2026-09-18", "changes": '
    '["Makes the Hub launcher independent of Torn Touchscreen Navigation mode: the fly-out menu gets a native Hub row whenever that menu exists, while the normal topbar S remains available in legacy topbar mode.", '
    '"Uses a cloned native Torn navigation row, matching the robust CAT-style approach instead of depending on one hashed menu container."]},\n'
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
        if (existing?.isConnected) {
            syncFloatingButtonVisibility();
            return true;
        }

        const allClickable = [...document.querySelectorAll('a[href], button')];
        const labelOf = el => String(el.textContent || '').replace(/\s+/g, ' ').trim();
        const hrefOf = el => String(el.getAttribute?.('href') || '').toLowerCase();
        const isNamed = (el, name) => labelOf(el).toLowerCase() === name.toLowerCase();
        const isHref = (el, token) => hrefOf(el).includes(token);

        // Prefer CAT when present because it proves we are inside Torn's real
        // fly-out navigation list. Otherwise anchor to stable native contact rows.
        const catAnchor = allClickable.find(el => /^cat script$/i.test(labelOf(el)));
        const targetAnchor = allClickable.find(el => isNamed(el, 'Targets') || isHref(el, 'target'));
        const enemyAnchor = allClickable.find(el => isNamed(el, 'Enemies') || isHref(el, 'enemies'));
        const friendAnchor = allClickable.find(el => isNamed(el, 'Friends') || isHref(el, 'friends'));
        const anchor = catAnchor || targetAnchor || enemyAnchor || friendAnchor;
        if (!anchor) {
            syncFloatingButtonVisibility();
            return false;
        }

        const findNativeRow = start => {
            let node = start;
            for (let depth = 0; node && depth < 7; depth += 1) {
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

        const sourceRow = findNativeRow(anchor);
        if (!sourceRow?.parentElement) {
            syncFloatingButtonVisibility();
            return false;
        }

        const row = sourceRow.cloneNode(true);
        row.id = IDS.navSkull;
        row.setAttribute('data-sakalux-hub-launcher', 'flyout');
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
        click.setAttribute('title', 'SakaLuX Hub');
        click.setAttribute('aria-label', 'SakaLuX Hub');

        const textNodes = [...click.querySelectorAll('span,div')].filter(el => {
            const t = labelOf(el);
            return t && el.children.length === 0 && /^(cat script|targets|enemies|friends)$/i.test(t);
        });
        if (textNodes.length) {
            textNodes[textNodes.length - 1].textContent = 'SakaLuX Hub';
        } else {
            click.textContent = '☠️  SakaLuX Hub';
        }

        const img = click.querySelector('img');
        if (img) {
            img.removeAttribute('src');
            img.removeAttribute('srcset');
            img.style.display = 'none';
        }
        if (!click.querySelector('[data-sakalux-hub-icon]')) {
            const icon = document.createElement('span');
            icon.setAttribute('data-sakalux-hub-icon', '1');
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '☠️';
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:24px;margin-right:8px;';
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

        sourceRow.insertAdjacentElement('afterend', row);
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
print('Patched Hub v1.9.76 dual navigation launcher')
