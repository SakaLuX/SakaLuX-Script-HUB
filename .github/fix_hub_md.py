from pathlib import Path
p=Path('greasyfork/Script-Hub.md')
s=p.read_text(encoding='utf-8')
s=s.replace('**v1.9.64** Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW details. Stocks uses its main GitHub source for installation and update checks.','**v1.9.64** Restores Hub launch controls when Torn replaces native launcher nodes and adds an explicit Stock Manager POWER action. Stocks remains on Greasy Fork for public updates.',1)
s=s.replace('- 📊 SakaLuX Stock Manager & Advisor **v0.7.7**','- 📊 SakaLuX Stock Manager & Advisor **v0.7.8**',1)
marker='## Release history / Changelog\n\n'
entry='### v1.9.64 — Launcher recovery\n- Recreates the Hub topbar/mobile launcher when Torn replaces the native navigation DOM.\n- Keeps the floating Hub button as a fallback when native launchers are unavailable.\n- Adds an explicit Stock Manager POWER action in the Hub registry/fallback.\n\n### v1.9.63 — Stocks Greasy Fork update channel\n- Moves Stock Manager & Advisor v0.7.8 install/update checks to Greasy Fork script 596192.\n- GitHub remains the canonical source repository.\n\n'
if '### v1.9.64 ' not in s:
    s=s.replace(marker,marker+entry,1)
p.write_text(s,encoding='utf-8')
