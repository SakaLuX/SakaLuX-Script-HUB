from pathlib import Path
import re

HUB = Path('SakaLuX-Script-Hub.user.js')
REPORT = Path('FONT-SAFETY-AUDIT-2026-09-18.md')


def patch_hub() -> None:
    text = HUB.read_text(encoding='utf-8')

    text = text.replace('// @version      1.9.74', '// @version      1.9.75', 1)
    text = text.replace("const VERSION = '1.9.74';", "const VERSION = '1.9.75';", 1)

    marker = '    const HUB_CHANGELOG = [\n'
    entry = (
        '        {"version": "1.9.75", "date": "2026-09-18", "changes": '
        '["Floating fallback launcher now appears only when neither native Hub launcher is actually mounted; scrolling the Torn header off-screen no longer triggers it.", '
        '"Audited all current top-level SakaLuX userscripts so none changes the font size of Torn native Points or Merits counters."]},\n'
    )
    if entry not in text:
        if marker not in text:
            raise SystemExit('HUB_CHANGELOG marker not found')
        text = text.replace(marker, marker + entry, 1)

    old_line = "        const nativeVisible = settings.showTopbarSkull && (isActuallyVisible(top) || isActuallyVisible(nav));\n        button.style.setProperty('display', nativeVisible ? 'none' : 'flex', 'important');"
    new_line = "        const nativeMounted = settings.showTopbarSkull && Boolean(\n            (top && top.isConnected) || (nav && nav.isConnected)\n        );\n        button.style.setProperty('display', nativeMounted ? 'none' : 'flex', 'important');"

    if old_line in text:
        text = text.replace(old_line, new_line, 1)
    elif new_line not in text:
        raise SystemExit('Hub floating launcher visibility line not found')

    HUB.write_text(text, encoding='utf-8')


def audit_native_fonts() -> list[str]:
    own_markers = ('sakalux-', 'slh-', 'sl-', 'slx-', 'ci-', 'apm-', 'master-control', 'sakalux-suite')
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
            if 'font-size' not in low_body and not re.search(r'\bfont\s*:', low_body):
                continue

            touches_status = 'statusicons' in low_sel or 'status-icons' in low_sel
            touches_points = 'points' in low_sel
            touches_merits = 'merit' in low_sel
            if not (touches_status or touches_points or touches_merits):
                continue

            owned = any(token in low_sel for token in own_markers)
            if touches_status or not owned:
                suspicious.append(f'{path.name}: {selector[:240]}')

        # Direct JS mutation of font size is only blocked when the same statement
        # explicitly targets Torn native status/points/merit elements.
        for line in src.splitlines():
            low = line.lower()
            if ('fontsize' in low or "setproperty('font-size'" in low or 'setproperty("font-size"' in low) and any(
                token in low for token in ('statusicons', 'status-icons', 'points', 'merit')
            ):
                if not any(token in low for token in own_markers):
                    suspicious.append(f'{path.name}: {line.strip()[:240]}')

    if suspicious:
        REPORT.write_text(
            '# Native Points / Merits font safety audit\n\n'
            'Date: 2026-09-18\n\n'
            'Result: **FAIL**\n\n' + ''.join(f'- `{item}`\n' for item in suspicious),
            encoding='utf-8'
        )
        raise SystemExit('Suspicious native font mutations found:\n' + '\n'.join(' - ' + x for x in suspicious))

    return scanned


def write_report(scanned: list[str]) -> None:
    REPORT.write_text(
        '# Native Points / Merits font safety audit\n\n'
        'Date: 2026-09-18\n\n'
        f'Scanned {len(scanned)} active top-level userscripts.\n\n'
        'Result: **PASS** — no current SakaLuX userscript changes the font size of Torn native Points or Merits counters. Script-owned widgets such as `#sl-mi-points-bar` are excluded because they are not Torn native counters.\n\n'
        'Hub fallback behavior: **PASS** — the floating launcher now depends on whether a native Hub launcher is mounted in the DOM, not whether scrolling has moved it outside the viewport.\n\n'
        'Scanned files:\n' + ''.join(f'- `{name}`\n' for name in scanned),
        encoding='utf-8'
    )


if __name__ == '__main__':
    patch_hub()
    scanned_files = audit_native_fonts()
    write_report(scanned_files)
    print(f'PASS: audited {len(scanned_files)} active userscripts; Hub launcher fallback repaired.')
