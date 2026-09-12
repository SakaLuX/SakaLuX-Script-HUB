from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
p = ROOT / 'SakaLuX-Script-Hub.user.js'
text = p.read_text(encoding='utf-8')

# Version bump
text, n = re.subn(r'(^// @version\s+)1\.9\.13(\s*$)', r'\g<1>1.9.14\2', text, count=1, flags=re.M)
if n != 1: raise SystemExit('metadata version not found')
text, n = re.subn(r"const VERSION = '1\.9\.13';", "const VERSION = '1.9.14';", text, count=1)
if n != 1: raise SystemExit('runtime version not found')

# Changelog
needle = "    const HUB_CHANGELOG = [\n"
entry = """    const HUB_CHANGELOG = [
        {
            version: '1.9.14',
            date: '2026-09-12',
            changes: [
                'Rebuilt the Hub launcher using Torn native statusIcons detection, matching the proven Fortie mounting strategy.',
                'The launcher now copies native Torn status-cell classes and mounts as a real 17px status icon.',
                'The floating skull is used only when Torn statusIcons are unavailable.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor not found')
text = text.replace(needle, entry, 1)

# Replace compact guessed resource launcher CSS with native status-icon launcher CSS
pat_css = r"#\$\{IDS\.topSkull\}\{position:relative!important;display:inline-grid!important;[\s\S]*?#\$\{IDS\.topBadge\}\{position:absolute;top:-5px;right:-5px;[\s\S]*?border:1px solid #111923\}"
new_css = """#${IDS.topSkull}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;vertical-align:top!important;background:none!important;background-image:none!important;box-shadow:none!important;overflow:visible!important}#${IDS.topSkull}::before,#${IDS.topSkull}::after{content:none!important;display:none!important}#${IDS.topSkull} .slh-status-link{position:relative!important;display:block!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;background-image:none!important;color:inherit!important;cursor:pointer!important;line-height:0!important;font-size:0!important;text-decoration:none!important;box-shadow:none!important;overflow:visible!important;transform:none!important}#${IDS.topSkull} .slh-status-link svg{display:block!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;margin:0!important;padding:0!important;overflow:visible!important;pointer-events:none!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.58))!important;transition:filter .15s ease,transform .15s ease!important}#${IDS.topSkull} .slh-status-link:active svg{transform:scale(.92)!important}#${IDS.topSkull}.slh-alert .slh-status-link svg{filter:brightness(1.2) drop-shadow(0 0 4px rgba(242,200,100,.55))!important}#${IDS.topBadge}{position:absolute;top:-7px;right:-7px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3;border:1px solid #111923}"""
text, n = re.subn(pat_css, lambda m: new_css, text, count=1)
if n != 1: raise SystemExit('resource launcher CSS block not found')

# Replace guessed resource detection with Fortie-style native status list detection and class copying.
pat_ctx = r"    function getResourceBarContext\(\) \{[\s\S]*?\n    \}\n\n    function buildSkullSvg"
rep_ctx = """    function findStatusIconList() {
        const selectors = [
            'ul[class*="statusIcons"][class*="big"]',
            'ul[class*="status-icons"][class*="big"]',
            'ul[class*="statusIcons"]',
            'ul[class*="status-icons"]'
        ];
        const lists = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
        return lists.find(list => list.isConnected && Array.from(list.children).some(item => item.querySelector?.('a'))) || null;
    }

    function copyNativeStatusCellLayout(customItem, statusList) {
        if (!customItem || !statusList) return;
        const reference = Array.from(statusList.children).find(item =>
            item !== customItem && item.id !== IDS.topSkull && item.querySelector?.('a')
        );
        if (!reference) return;
        const nativeClasses = Array.from(reference.classList).filter(className => className && !className.startsWith('slh-') && !className.startsWith('sakalux-'));
        const customClasses = Array.from(customItem.classList).filter(className => className.startsWith('slh-') || className.startsWith('sakalux-'));
        customItem.className = [...nativeClasses, ...customClasses].join(' ');
        ['width','height','min-width','min-height','max-width','max-height','margin','flex','align-self'].forEach(prop => customItem.style.removeProperty(prop));
    }

    function buildSkullSvg"""
text, n = re.subn(pat_ctx, lambda m: rep_ctx, text, count=1)
if n != 1: raise SystemExit('resource context block not found')

# Replace launcher implementation with native li/a status icon.
pat_create = r"    function createTopbarSkull\(\) \{[\s\S]*?\n    \}\n\n    function updateTopbarSkullState\(\) \{"
rep_create = """    function createTopbarSkull() {
        const existing = document.getElementById(IDS.topSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        const statusList = findStatusIconList();
        if (!statusList) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected && existing.parentElement === statusList) {
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
        existing?.remove();
        const item = document.createElement('li');
        item.id = IDS.topSkull;
        item.className = 'slh-master-status-icon';
        const launcher = document.createElement('a');
        launcher.href = '#';
        launcher.className = 'slh-status-link';
        launcher.setAttribute('aria-label', 'SakaLuX Script Hub');
        launcher.setAttribute('title', 'SakaLuX Script Hub');
        launcher.setAttribute('tabindex', '0');
        launcher.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id="slh-settings-gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#f4d57d"/>
                        <stop offset=".45" stop-color="#d8b35f"/>
                        <stop offset="1" stop-color="#9a742c"/>
                    </linearGradient>
                    <linearGradient id="slh-settings-inner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#3a3d44"/>
                        <stop offset="1" stop-color="#15171b"/>
                    </linearGradient>
                </defs>
                <path fill="url(#slh-settings-gold)" stroke="#6f511a" stroke-width=".45" d="M7.28.8h2.44l.36 1.7c.51.15.99.35 1.43.59l1.49-.9 1.72 1.72-.9 1.49c.24.44.44.92.59 1.43l1.7.36v2.44l-1.7.36c-.15.51-.35.99-.59 1.43l.9 1.49-1.72 1.72-1.49-.9c-.44.24-.92.44-1.43.59l-.36 1.7H7.28l-.36-1.7c-.51-.15-.99-.35-1.43-.59l-1.49.9-1.72-1.72.9-1.49a6.97 6.97 0 0 1-.59-1.43l-1.7-.36V7.19l1.7-.36c.15-.51.35-.99.59-1.43l-.9-1.49L4 2.19l1.49.9c.44-.24.92-.44 1.43-.59L7.28.8Z"/>
                <circle cx="8.5" cy="8.41" r="3.15" fill="url(#slh-settings-inner)" stroke="#f0cc72" stroke-width=".5"/>
                <text x="8.5" y="10.65" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.1" font-weight="900" fill="#f0cc72">S</text>
            </svg>
            <span id="${IDS.topBadge}"></span>`;
        launcher.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openHub(); });
        launcher.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openHub(); } });
        item.appendChild(launcher);
        statusList.appendChild(item);
        copyNativeStatusCellLayout(item, statusList);
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

    function updateTopbarSkullState() {"""
text, n = re.subn(pat_create, lambda m: rep_create, text, count=1)
if n != 1: raise SystemExit('createTopbarSkull block not found')

# Settings/system check copy
text = text.replace("${settingSwitch('slhs-topbar', 'Torn resource-bar launcher', 'Show the compact SakaLuX button before the money resource when available. The skull button is used automatically as fallback.', settings.showTopbarSkull)}",
                    "${settingSwitch('slhs-topbar', 'Torn status-bar launcher', 'Mount the compact SakaLuX icon directly inside Torn statusIcons. The floating skull is used only when Torn does not expose that native icon list.', settings.showTopbarSkull)}", 1)
text = text.replace("results.push({ level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn', label: 'Torn resource-bar HUB launcher', detail: document.getElementById(IDS.topSkull) ? 'Mounted before the money resource' : 'Resource bar not detected — floating skull fallback active' });",
                    "results.push({ level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn', label: 'Torn status-bar HUB launcher', detail: document.getElementById(IDS.topSkull) ? 'Mounted inside Torn statusIcons using native cell classes' : 'Torn statusIcons not detected — floating skull fallback active' });", 1)

p.write_text(text, encoding='utf-8')

# Docs
mp = ROOT / 'greasyfork/Script-Hub.md'
doc = mp.read_text(encoding='utf-8')
doc, n = re.subn(r'(## Current version\s+\*\*v)1\.9\.13(\*\*)', r'\g<1>1.9.14\2', doc, count=1)
if n != 1: raise SystemExit('Hub doc version not found')
if '### v1.9.14' not in doc:
    doc = doc.replace('## Current release notes\n', "## Current release notes\n\n### v1.9.14 — Native Torn status launcher\n\n- Replaced the guessed money-resource detector with Torn's native `statusIcons` list detection used by the Fortie launcher strategy.\n- The Hub launcher is now a real 17px Torn status icon and inherits native cell classes from adjacent Torn icons.\n- The floating skull remains only as fallback when the native status icon list is unavailable.\n", 1)
mp.write_text(doc, encoding='utf-8')

print('Hub v1.9.14 Fortie-style status launcher migration applied')
