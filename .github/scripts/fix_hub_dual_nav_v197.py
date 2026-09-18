from pathlib import Path
import ast

REPO_PATCH = Path('.github/scripts/fix_hub_dual_nav.py')
HUB = Path('SakaLuX-Script-Hub.user.js')


def extract_replacement():
    tree = ast.parse(REPO_PATCH.read_text(encoding='utf-8'))
    for node in tree.body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == 'replacement':
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                        return node.value.value
    raise SystemExit('replacement block not found in fix_hub_dual_nav.py')


def main():
    text = HUB.read_text(encoding='utf-8')
    replacement = extract_replacement()

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

    # Scope the replacement to the genuine launcher section. The file contains
    # helper/template text elsewhere, so anchor after createTopbarSkull().
    topbar_marker = '    function createTopbarSkull() {'
    start_marker = '    function createNavSkull() {'
    next_marker = '\n    function updateTopbarSkullState()'

    topbar = text.find(topbar_marker)
    if topbar < 0:
        raise SystemExit('createTopbarSkull start not found')
    start = text.find(start_marker, topbar)
    if start < 0:
        raise SystemExit('createNavSkull start not found after createTopbarSkull')
    end = text.find(next_marker, start)
    if end < 0:
        raise SystemExit('updateTopbarSkullState marker not found after createNavSkull')

    text = text[:start] + replacement.rstrip() + '\n\n' + text[end + 1:]
    HUB.write_text(text, encoding='utf-8')
    print('Patched Hub v1.9.77 with scoped function-boundary replacement')


if __name__ == '__main__':
    main()
