from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]

p=ROOT/'greasyfork/Mission-Rewards.md'
s=p.read_text(encoding='utf-8')
s=s.replace('- Suppresses duplicate TornTools/TornPDA mission-information boxes when the integrated guide is active.\n','')
s=re.sub(r'## Current release note\n[\s\S]*?(?=\n## Recommended)',"""## Current release note

**v1.0.19** is rebuilt directly from the confirmed-working **v1.0.18** runtime. The Task + Hint Mission Guide is now a completely isolated visual layer and does not alter Mission Rewards initialization, Hub bridge, ON/OFF state, API access, reward scanning or Standalone Dock behavior. The stabilization line is distributed from GitHub so the old broken `1.1.x` Greasy Fork branch is no longer used as the desired Hub update.

## Recommended""",s,count=1)
p.write_text(s,encoding='utf-8')

p=ROOT/'greasyfork/Script-Hub.md'
s=p.read_text(encoding='utf-8')
s=re.sub(r'## Current release note\n[\s\S]*?(?=\n## Recommended)',"""## Current release note

**v1.9.43** pins Mission Rewards to the stable **v1.0.19** line, rebuilt from the confirmed-working v1.0.18 runtime. Hub now follows the GitHub stabilization source for Mission Rewards instead of the broken `1.1.x` Greasy Fork branch, and Mission Rewards uses its normal generic bridge/API integration again.

## Recommended""",s,count=1)
p.write_text(s,encoding='utf-8')
print('Release info synchronized for Mission Rewards v1.0.19 / Hub v1.9.43')
