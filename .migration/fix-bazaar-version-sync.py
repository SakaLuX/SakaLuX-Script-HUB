from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
versions={
    'greasyfork/Script-Hub.md':'1.9.28',
    'greasyfork/Enhancer-Guard.md':'1.3.28',
    'greasyfork/Bazaar-Thanker.md':'5.3.19',
    'greasyfork/Mission-Rewards.md':'1.0.16',
    'greasyfork/Market-Intelligence.md':'1.17.16',
    'greasyfork/Elimination-Assistant.md':'1.3.28',
}

for path,version in versions.items():
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    # Normalize the current version block to the validator's canonical release-info format.
    text,n=re.subn(
        r'(## Current version\s+)(?:\*\*v)?[0-9]+(?:\.[0-9]+)+(?:\*\*)?',
        lambda m:m.group(1)+f'**v{version}**',
        text,
        count=1,
    )
    if n!=1:
        raise SystemExit(f'Current version block missing: {path}')
    p.write_text(text,encoding='utf-8')

print('Release info version format synchronized')
