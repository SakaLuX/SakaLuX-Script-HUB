from pathlib import Path
p=Path('greasyfork/Stock-Manager-Advisor.md')
s=p.read_text(encoding='utf-8')
s=s.replace('> Main SakaLuX module, registered in Script Hub and the standalone dock. Distributed from GitHub.','> Main SakaLuX module, registered in Script Hub and the standalone dock. Source is maintained on GitHub; public installs and updates are delivered through Greasy Fork.',1)
s=s.replace('**v0.7.8** Promotes Stock Manager & Advisor from experimental to the main script directory and registers it in Script Hub and the standalone dock. Adds native OPEN, REFRESH, health and persistent ON/OFF controls; disabling removes launchers/inline tools, disconnects observers and blocks new orders. Preserves existing API settings, portfolio caches, Dry Run, Benefit Lock, confirmations and trading behavior; filters self-generated SPA mutations.','**v0.7.8** Moves public installation and automatic updates to Greasy Fork script 596192 while keeping GitHub as the canonical source repository. Hub integration, ON/OFF control and existing trading protections are preserved.',1)
s=s.replace('- Install the main `SakaLuX-Stock-Manager-Advisor.user.js` from GitHub. Use one installed copy; replace the old experimental copy with this version.','- Install/update the public release through Greasy Fork script 596192. GitHub remains the canonical source repository.',1)
marker='## Changelog\n\n'
entry='### v0.7.8 — Greasy Fork update channel\n\n- Moves public installs and automatic updates to Greasy Fork script 596192.\n- Keeps GitHub as the canonical source repository.\n- Preserves Script Hub integration, ON/OFF controls, Dry Run, Benefit Lock and existing trading safeguards.\n\n'
if '### v0.7.8 ' not in s:
    s=s.replace(marker,marker+entry,1)
p.write_text(s,encoding='utf-8')
