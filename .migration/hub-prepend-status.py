from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.9\.15(\s*$)',r'\g<1>1.9.16\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION = '1\.9\.15';","const VERSION = '1.9.16';",text,count=1)
if n!=1: raise SystemExit('runtime version not found')

needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.16',
            date: '2026-09-12',
            changes: [
                'Places the native SakaLuX Hub launcher as the first item in Torn statusIcons so it appears before the cash resource on the current mobile layout.',
                'Removed the unreliable money-cell detection introduced in v1.9.15.',
                'Keeps Fortie-style statusIcons mounting, native class inheritance and skull fallback unchanged.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor missing')
text=text.replace(needle,entry,1)

# Remove money detector helper entirely.
text,n=re.subn(r"    function findMoneyStatusItem\(statusList\) \{[\s\S]*?\n    \}\n\n    function createTopbarSkull\(\) \{","    function createTopbarSkull() {",text,count=1)
if n!=1: raise SystemExit('money helper block not found')

old_existing="""        if (existing?.isConnected && existing.parentElement === statusList) {
            const moneyItem = findMoneyStatusItem(statusList);
            if (moneyItem && existing.nextElementSibling !== moneyItem) statusList.insertBefore(existing, moneyItem);
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
"""
new_existing="""        if (existing?.isConnected && existing.parentElement === statusList) {
            if (statusList.firstElementChild !== existing) statusList.insertBefore(existing, statusList.firstElementChild);
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
"""
if old_existing not in text: raise SystemExit('existing launcher block not found')
text=text.replace(old_existing,new_existing,1)

old_append="""        item.appendChild(launcher);
        const moneyItem = findMoneyStatusItem(statusList);
        if (moneyItem) statusList.insertBefore(item, moneyItem);
        else statusList.appendChild(item);
        copyNativeStatusCellLayout(item, statusList);
"""
new_append="""        item.appendChild(launcher);
        statusList.insertBefore(item, statusList.firstElementChild);
        copyNativeStatusCellLayout(item, statusList);
"""
if old_append not in text: raise SystemExit('append block not found')
text=text.replace(old_append,new_append,1)

p.write_text(text,encoding='utf-8')

mp=ROOT/'greasyfork/Script-Hub.md'
doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.9\.15(\*\*)',r'\g<1>1.9.16\2',doc,count=1)
if n!=1: raise SystemExit('doc version not found')
if '### v1.9.16' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.9.16 — Launcher before cash\n\n- Places the native Hub launcher as the first `statusIcons` item so it appears directly before the cash resource on the current Torn mobile layout.\n- Removed the unreliable money/cash element detector from v1.9.15.\n- Fortie-style native mounting and skull fallback remain unchanged.\n',1)
mp.write_text(doc,encoding='utf-8')
print('Hub v1.9.16 prepend launcher migration applied')
