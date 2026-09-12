from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
DOCS = sorted((ROOT / 'greasyfork').glob('*.md'))
ORDER = ['Current version','What it does','Current release note','Recommended','License','Privacy','Important']


def split_sections(text):
    title_match = re.search(r'^#\s+.+$', text, re.M)
    title = title_match.group(0) if title_match else '# SakaLuX Script'
    pre_start = title_match.end() if title_match else 0
    matches = list(re.finditer(r'^##\s+(.+?)\s*$', text, re.M))
    pre_end = matches[0].start() if matches else len(text)
    pre = text[pre_start:pre_end].strip()
    sections = []
    for i, m in enumerate(matches):
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        sections.append((m.group(1).strip(), text[m.end():end].strip()))
    return title, pre, sections


def norm_name(name):
    s = name.strip().lower()
    if s == 'current release notes':
        return 'Release history'
    return name.strip()

for path in DOCS:
    text = path.read_text(encoding='utf-8')
    title, pre, raw = split_sections(text)
    sections = []
    for name, body in raw:
        name = norm_name(name)
        sections.append((name, body))

    lookup = {}
    extras = []
    for name, body in sections:
        if name in ORDER and name not in lookup:
            lookup[name] = body
        else:
            extras.append((name, body))

    is_hub = path.name == 'Script-Hub.md'
    lines = [title, '']
    if is_hub:
        lines += ['> Central manager for the SakaLuX script ecosystem.', '']
    else:
        lines += ['> Complementary add-on for **SakaLuX Script Hub**. It also works standalone.', '']

    for name in ORDER:
        body = lookup.get(name, '').strip()
        if not body:
            continue
        lines += [f'## {name}', body, '']

    # Preserve any historical/extra documentation after the required release block.
    for name, body in extras:
        # Remove duplicate marketing lines/empty pseudo-sections from older docs.
        if not body and name not in {'Release history'}:
            continue
        lines += [f'## {name}', body, '']

    path.write_text('\n'.join(lines).rstrip() + '\n', encoding='utf-8')
    print('Normalized', path.relative_to(ROOT))
