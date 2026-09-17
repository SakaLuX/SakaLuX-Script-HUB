from pathlib import Path
import re

checks={
 'SakaLuX-Account-Auditor.user.js':'greasyfork/Account-Auditor.md',
 'SakaLuX-Bazaar-Thanker-PDA.user.js':'greasyfork/Bazaar-Thanker.md',
 'SakaLuX-Chat-Intelligence.user.js':'greasyfork/Chat-Intelligence.md',
 'SakaLuX-Company-Intelligence-v1.0.0.user.js':'greasyfork/Company-Intelligence.md',
 'SakaLuX-Elimination-Assistant.user.js':'greasyfork/Elimination-Assistant.md',
 'SakaLuX-Enhancer-Guard.user.js':'greasyfork/Enhancer-Guard.md',
 'SakaLuX-Market-Intelligence.user.js':'greasyfork/Market-Intelligence.md',
 'SakaLuX-Mission-Rewards.user.js':'greasyfork/Mission-Rewards.md',
 'SakaLuX-Script-Hub.user.js':'greasyfork/Script-Hub.md',
 'SakaLuX-Suite.user.js':'greasyfork/SakaLuX-Suite.md',
}
for sp,mp in checks.items():
    src=Path(sp).read_text(encoding='utf-8')
    mdp=Path(mp); md=mdp.read_text(encoding='utf-8')
    ver=re.search(r'^// @version\s+([^\s]+)\s*$',src,re.M).group(1)
    md=re.sub(r'(## Current version\s*\n\s*\*\*v)[^*]+(\*\*)',r'\g<1>'+ver+r'\g<2>',md,count=1,flags=re.I)
    note='uses full-screen mobile panels, removes blur and heavy visual effects, and reduces mobile rendering overhead for faster TornPDA scrolling and taps.'
    if re.search(r'## Current release note',md,re.I):
        md=re.sub(r'(## Current release note\s*\n+)\*\*v[^*]+\*\*[^\n]*',r'\g<1>**v'+ver+'** '+note,md,count=1,flags=re.I)
    if not re.search(rf'###\s+v{re.escape(ver)}\b',md):
        entry=f'### v{ver} — Full-screen performance\n- Uses the full mobile viewport for SakaLuX panels.\n- Removes backdrop blur and other expensive mobile visual effects.\n- Reduces unnecessary observer/render work where applicable.\n- Improves TornPDA scroll and tap responsiveness.\n\n'
        if '## Release history' in md:
            md=md.replace('## Release history','## Release history\n\n'+entry,1)
        else:
            md+='\n\n## Release history\n\n'+entry
    mdp.write_text(md,encoding='utf-8')
    print(mp,ver)
