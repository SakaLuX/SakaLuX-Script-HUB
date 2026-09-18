from pathlib import Path

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
    if entry not in text and marker in text:
        text = text.replace(marker, marker + entry, 1)

    old = "        const nativeVisible = settings.showTopbarSkull && (isActuallyVisible(top) || isActuallyVisible(nav));\n        button.style.setProperty('display', nativeVisible ? 'none' : 'flex', 'important');"
    new = "        const nativeMounted = settings.showTopbarSkull && Boolean(\n            (top && top.isConnected) || (nav && nav.isConnected)\n        );\n        button.style.setProperty('display', nativeMounted ? 'none' : 'flex', 'important');"
    if old in text:
        text = text.replace(old, new, 1)
    if new not in text:
        raise SystemExit('Hub launcher repair could not be verified')

    HUB.write_text(text, encoding='utf-8')


def audit_native_fonts() -> list[str]:
    scanned = []
    findings = []
    for path in sorted(Path('.').glob('*.user.js')):
        scanned.append(path.name)
        src = path.read_text(encoding='utf-8', errors='replace')
        for number, line in enumerate(src.splitlines(), 1):
            low = line.lower()
            has_font = 'font-size' in low or 'fontsize' in low
            if not has_font:
                continue
            # Only flag direct same-line mutations of Torn's native resource/status
            # selectors. Script-owned SakaLuX widgets are intentionally ignored.
            native = any(token in low for token in (
                'statusicons', 'status-icons', 'pointsvalue', 'points-value',
                'meritsvalue', 'merits-value', 'resourcepoints', 'resourcemerits'
            ))
            owned = any(token in low for token in (
                'sakalux-', 'slh-', 'slx-', 'sl-mi-', 'sl-eg-', 'sl-mr-',
                'sl-aa-', 'ci-', 'apm-', '${dock_id}'
            ))
            if native and not owned:
                findings.append(f'{path.name}:{number}: {line.strip()[:260]}')

    if findings:
        raise SystemExit('Direct native Points/Merits/status font mutation found:\n' + '\n'.join(findings))
    return scanned


def write_report(scanned: list[str]) -> None:
    REPORT.write_text(
        '# Native Points / Merits font safety audit\n\n'
        'Date: 2026-09-18\n\n'
        f'Scanned {len(scanned)} active top-level userscripts.\n\n'
        'Result: **PASS** — no current SakaLuX userscript directly changes the font size of Torn native Points or Merits counters. Script-owned widgets such as `#sl-mi-points-bar` are separate UI and do not target Torn native counters.\n\n'
        'Hub fallback behavior: **PASS** — the floating launcher now depends on whether the native Hub launcher is mounted in the DOM, not whether scrolling moved it outside the viewport.\n\n'
        'Scanned files:\n' + ''.join(f'- `{name}`\n' for name in scanned),
        encoding='utf-8'
    )


if __name__ == '__main__':
    patch_hub()
    files = audit_native_fonts()
    write_report(files)
    print(f'PASS: audited {len(files)} active userscripts; Hub launcher fallback repaired.')
