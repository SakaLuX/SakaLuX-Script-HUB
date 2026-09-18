from pathlib import Path
import re

HUB = Path('SakaLuX-Script-Hub.user.js')
REPORT = Path('FONT-SAFETY-AUDIT-2026-09-18.md')


def patch_hub() -> None:
    text = HUB.read_text(encoding='utf-8')

    # Version bump is intentionally idempotent.
    text = text.replace('// @version      1.9.74', '// @version      1.9.75', 1)
    text = text.replace("const VERSION = '1.9.74';", "const VERSION = '1.9.75';", 1)

    marker = '    const HUB_CHANGELOG = [\n'
    entry = (
        '        {"version": "1.9.75", "date": "2026-09-18", "changes": '
        '["Floating fallback launcher now appears only when neither native Hub launcher is actually mounted in the DOM; scrolling the Torn header off-screen no longer triggers it.", '
        '"Audited all current top-level SakaLuX userscripts to ensure none applies font-size styling to Torn native Points or Merits counters."]},\n'
    )
    if entry not in text:
        if marker not in text:
            raise SystemExit('HUB_CHANGELOG marker not found')
        text = text.replace(marker, marker + entry, 1)

    old = '''    function isActuallyVisible(element) {
        if (!element || !element.isConnected) return false;
        try {
            const cs = getComputedStyle(element);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.01) return false;
            const r = element.getBoundingClientRect();
            return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
        } catch { return false; }
    }

    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const top = document.getElementById(IDS.topSkull);
        const nav = document.getElementById(IDS.navSkull);
        const nativeVisible = settings.showTopbarSkull && (isActuallyVisible(top) || isActuallyVisible(nav));
        button.style.setProperty('display', nativeVisible ? 'none' : 'flex', 'important');
        button.style.setProperty('visibility', 'visible', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('pointer-events', 'auto', 'important');
    }
'''
    new = '''    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const top = document.getElementById(IDS.topSkull);
        const nav = document.getElementById(IDS.navSkull);
        // A native launcher remains authoritative while mounted, even when the
        // user scrolls the header/sidebar temporarily outside the viewport.
        const nativeMounted = settings.showTopbarSkull && Boolean(
            (top && top.isConnected) || (nav && nav.isConnected)
        );
        button.style.setProperty('display', nativeMounted ? 'none' : 'flex', 'important');
        button.style.setProperty('visibility', 'visible', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('pointer-events', 'auto', 'important');
    }
'''

    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise SystemExit('Neither old nor repaired Hub launcher visibility block was found')

    HUB.write_text(text, encoding='utf-8')


def audit_native_fonts() -> list[str]:
    # We audit only current top-level userscripts. Historical backup files do not
    # execute when the current scripts are installed.
    own_markers = (
        'sakalux-', 'slh-', 'sl-', 'slx-', 'ci-', 'apm-',
        'master-control', 'sakalux-suite'
    )
    suspicious = []
    scanned = []
    css_rule = re.compile(r'([^{}]+)\{([^{}]*)\}', re.S)

    for path in sorted(Path('.').glob('*.user.js')):
        scanned.append(path.name)
        src = path.read_text(encoding='utf-8', errors='replace')

        for match in css_rule.finditer(src):
            selector = match.group(1).strip()
            body = match.group(2)
            low_sel = selector.lower()
            low_body = body.lower()
            if 'font-size' not in low_body:
                continue

            touches_status = 'statusicons' in low_sel or 'status-icons' in low_sel
            touches_points = 'points' in low_sel
            touches_merits = 'merit' in low_sel
            if not (touches_status or touches_points or touches_merits):
                continue

            # Script-owned components such as #sl-mi-points-bar may style their own
            # text. The protected target is Torn's native Points/Merits/status row.
            owned = any(token in low_sel for token in own_markers)
            if touches_status or not owned:
                suspicious.append(f'{path.name}: CSS font-size selector: {selector[:220]}')

        lines = src.splitlines()
        for index, line in enumerate(lines):
            low = line.lower()
            if 'fontsize' not in low and 'font-size' not in low:
                continue
            context = '\n'.join(lines[max(0, index - 5):min(len(lines), index + 6)]).lower()
            if not any(token in context for token in ('points', 'merit', 'statusicons', 'status-icons')):
                continue
            if any(token in context for token in own_markers) and 'statusicons' not in context and 'status-icons' not in context:
                continue
            suspicious.append(f'{path.name}: JS/context font sizing: {line.strip()[:220]}')

    if suspicious:
        raise SystemExit('Suspicious native font mutations found:\n' + '\n'.join(' - ' + x for x in suspicious))

    return scanned


def write_report(scanned: list[str]) -> None:
    REPORT.write_text(
        '# Native Points / Merits font safety audit\n\n'
        'Date: 2026-09-18\n\n'
        f'Scanned {len(scanned)} active top-level userscripts.\n\n'
        'Result: **PASS** — no current SakaLuX userscript applies `font-size` styling to Torn native Points or Merits counters, and no `statusIcons` rule applies `font-size` to the native row.\n\n'
        'The Hub fallback launcher now uses DOM mounting state rather than viewport geometry, so scrolling the native Hub icon off-screen does not make the floating fallback appear.\n\n'
        'Scanned files:\n' + ''.join(f'- `{name}`\n' for name in scanned),
        encoding='utf-8'
    )


if __name__ == '__main__':
    patch_hub()
    scanned_files = audit_native_fonts()
    write_report(scanned_files)
    print(f'PASS: audited {len(scanned_files)} active userscripts; Hub launcher fallback repaired.')
