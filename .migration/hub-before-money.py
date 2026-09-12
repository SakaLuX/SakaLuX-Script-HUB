from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

text,n=re.subn(r'(^// @version\s+)1\.9\.14(\s*$)',r'\g<1>1.9.15\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION = '1\.9\.14';","const VERSION = '1.9.15';",text,count=1)
if n!=1: raise SystemExit('runtime version not found')

needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.15',
            date: '2026-09-12',
            changes: [
                'Positions the native SakaLuX Hub status icon immediately before Torn money/cash when that native cell is identifiable.',
                'Keeps the Fortie-style statusIcons mounting and native class inheritance unchanged.',
                'Falls back to the end of the native status row only if Torn money/cash cannot be identified.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor missing')
text=text.replace(needle,entry,1)

anchor="    function createTopbarSkull() {\n"
helper="""    function findMoneyStatusItem(statusList) {
        if (!statusList) return null;
        const items = Array.from(statusList.children).filter(item => item.id !== IDS.topSkull);
        const describe = item => {
            const anchor = item.querySelector?.('a');
            const parts = [
                item.id,
                item.className,
                item.getAttribute?.('title'),
                item.getAttribute?.('aria-label'),
                item.getAttribute?.('data-type'),
                item.getAttribute?.('data-testid'),
                item.textContent,
                anchor?.id,
                anchor?.className,
                anchor?.getAttribute?.('title'),
                anchor?.getAttribute?.('aria-label'),
                anchor?.getAttribute?.('href'),
                anchor?.getAttribute?.('data-type'),
                anchor?.getAttribute?.('data-testid')
            ];
            item.querySelectorAll?.('[class],[id],[title],[aria-label],[data-type],[data-testid]').forEach(node => {
                parts.push(node.id, node.className, node.getAttribute('title'), node.getAttribute('aria-label'), node.getAttribute('data-type'), node.getAttribute('data-testid'));
            });
            return parts.filter(Boolean).join(' ').toLowerCase();
        };
        return items.find(item => {
            const d = describe(item);
            return d.includes('$') || /(^|[^a-z])(money|cash|wallet|dollar)([^a-z]|$)/i.test(d);
        }) || null;
    }

"""
if anchor not in text: raise SystemExit('createTopbarSkull anchor missing')
text=text.replace(anchor,helper+anchor,1)

old_existing="""        if (existing?.isConnected && existing.parentElement === statusList) {
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
"""
new_existing="""        if (existing?.isConnected && existing.parentElement === statusList) {
            const moneyItem = findMoneyStatusItem(statusList);
            if (moneyItem && existing.nextElementSibling !== moneyItem) statusList.insertBefore(existing, moneyItem);
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
"""
if old_existing not in text: raise SystemExit('existing launcher block missing')
text=text.replace(old_existing,new_existing,1)

old_append="""        item.appendChild(launcher);
        statusList.appendChild(item);
        copyNativeStatusCellLayout(item, statusList);
"""
new_append="""        item.appendChild(launcher);
        const moneyItem = findMoneyStatusItem(statusList);
        if (moneyItem) statusList.insertBefore(item, moneyItem);
        else statusList.appendChild(item);
        copyNativeStatusCellLayout(item, statusList);
"""
if old_append not in text: raise SystemExit('append block missing')
text=text.replace(old_append,new_append,1)

p.write_text(text,encoding='utf-8')

mp=ROOT/'greasyfork/Script-Hub.md'
doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.9\.14(\*\*)',r'\g<1>1.9.15\2',doc,count=1)
if n!=1: raise SystemExit('doc version missing')
if '### v1.9.15' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.9.15 — Launcher before money\n\n- Keeps the native Fortie-style `statusIcons` mounting introduced in v1.9.14.\n- Positions the SakaLuX Hub icon immediately before Torn money/cash when that status cell is identifiable.\n- Falls back safely to the end of the native status row if Torn changes the money cell internals.\n',1)
mp.write_text(doc,encoding='utf-8')
print('Hub v1.9.15 before-money migration applied')
