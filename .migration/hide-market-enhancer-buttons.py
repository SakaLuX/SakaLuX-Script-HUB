from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]

hub=ROOT/'SakaLuX-Script-Hub.user.js'
s=hub.read_text(encoding='utf-8')

# Bump Hub release.
s,n=re.subn(r'(^// @version\s+)1\.9\.28(\s*$)',r'\g<1>1.9.29\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
s,n=re.subn(r"const VERSION\s*=\s*'1\.9\.28';","const VERSION = '1.9.29';",s,count=1)
if n!=1: raise SystemExit('Hub runtime version not found')

# Add changelog entry.
needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.29',
            date: '2026-09-12',
            changes: [
                'Always hides the floating Market and Enhancers launch buttons while Script Hub is active.',
                'Keeps both module buttons in the DOM so Hub OPEN actions continue to work.',
                'Prevents stale local Hide individual script buttons settings from making these two launchers reappear.'
            ]
        },
"""
if needle not in s: raise SystemExit('Hub changelog anchor not found')
s=s.replace(needle,entry,1)

# Force the two floating launchers hidden whenever Hub is active.
css_anchor="        style.textContent = `\n"
css_rule="""        style.textContent = `
html[data-sakalux-hub-active="1"] #sl-eg-button,
body[data-sakalux-hub-active="1"] #sl-eg-button,
html[data-sakalux-hub-active="1"] #sl-mi-button,
body[data-sakalux-hub-active="1"] #sl-mi-button{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}
"""
if css_anchor not in s: raise SystemExit('injectCss anchor not found')
s=s.replace(css_anchor,css_rule,1)
hub.write_text(s,encoding='utf-8')

# Hub info page version/release note.
p=ROOT/'greasyfork/Script-Hub.md'
d=p.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.28**','## Current version\n**v1.9.29**',1)
d=d.replace('## Current version\n1.9.28','## Current version\n**v1.9.29**',1)
if '### v1.9.29 — Hide floating module launchers' not in d:
    if '## Release history\n' in d:
        d=d.replace('## Release history\n','## Release history\n### v1.9.29 — Hide floating module launchers\n\n- Market and Enhancers floating buttons are always hidden while Script Hub is active.\n- Their DOM controls remain available so Hub can still open both modules.\n- The fix ignores stale local launcher-visibility settings for these two buttons.\n\n',1)
# Refresh current release note if section exists.
d=re.sub(r'## Current release note\n\n.*?\n\n## Recommended',"""## Current release note

**v1.9.29** removes the floating **Market** and **Enhancers** launch buttons whenever Script Hub is active. Both controls remain in the DOM so Hub can still open their panels normally.

## Recommended""",d,count=1,flags=re.S)
p.write_text(d,encoding='utf-8')

print('Applied Hub v1.9.29 floating button hide fix')
