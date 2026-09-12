from pathlib import Path
for name in ['greasyfork/Mission-Rewards.md','greasyfork/Script-Hub.md']:
    p=Path(name)
    s=p.read_text(encoding='utf-8')
    while '## Recommended\n## Recommended\n' in s:
        s=s.replace('## Recommended\n## Recommended\n','## Recommended\n')
    p.write_text(s,encoding='utf-8')
print('Cleaned duplicate Recommended headings')
