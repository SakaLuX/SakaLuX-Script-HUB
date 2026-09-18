from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

text = text.replace('// @version      1.9.82', '// @version      1.9.83', 1)
text = text.replace("const VERSION = '1.9.82';", "const VERSION = '1.9.83';", 1)

marker = '    const HUB_CHANGELOG = [\n'
entry = (
    '        {"version": "1.9.83", "date": "2026-09-19", "changes": '
    '["Makes the Fly-out Hub launcher a persistent native child of the Torn vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.", '
    '"Scrolling no longer removes, recreates or repositions the Hub launcher.", '
    '"Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; it remounts only if Torn rebuilds the menu DOM."]},\n'
)
if entry not in text:
    if marker not in text:
        raise SystemExit('HUB_CHANGELOG marker not found')
    text = text.replace(marker, marker + entry, 1)

old_visible = '''        const visible = el => {\n            if (!(el instanceof Element) || !el.isConnected) return false;\n            try {\n                const cs = getComputedStyle(el);\n                const r = el.getBoundingClientRect();\n                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01\n                    && r.width > 20 && r.height > 20 && r.bottom > 0 && r.right > 0;\n            } catch { return false; }\n        };'''
new_visible = '''        const mounted = el => {\n            if (!(el instanceof Element) || !el.isConnected) return false;\n            try {\n                const cs = getComputedStyle(el);\n                const r = el.getBoundingClientRect();\n                // CAT-style persistence: DOM presence decides whether a native row exists.\n                // Do not require the row to be inside the current viewport; scrolling must\n                // never make the Hub launcher disappear or get recreated.\n                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01\n                    && r.width > 20 && r.height > 20;\n            } catch { return false; }\n        };'''
if old_visible not in text:
    raise SystemExit('viewport visibility helper not found')
text = text.replace(old_visible, new_visible, 1)

text = text.replace(".filter(el => !el.closest?.(`#${IDS.navSkull}`) && visible(el));", ".filter(el => !el.closest?.(`#${IDS.navSkull}`) && mounted(el));", 1)

old_existing = '''        if (existing?.isConnected) {\n            positionFirstVertical(existing);\n            existing.querySelector(`#${IDS.navBadge}`)?.remove();\n            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());\n            updateTopbarSkullState();\n            syncFloatingButtonVisibility();\n            return true;\n        }'''
new_existing = '''        if (existing?.isConnected) {\n            // Once mounted, keep this exact node in Torn's list just like CAT does.\n            // Scroll position must not participate in launcher lifecycle.\n            const parent = existing.parentElement;\n            if (parent && parent.firstElementChild !== existing) parent.insertBefore(existing, parent.firstElementChild);\n            existing.querySelector(`#${IDS.navBadge}`)?.remove();\n            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());\n            updateTopbarSkullState();\n            syncFloatingButtonVisibility();\n            return true;\n        }'''
if old_existing not in text:
    raise SystemExit('existing launcher block not found')
text = text.replace(old_existing, new_existing, 1)

old_position = '''        const positionFirstVertical = row => {\n            if (!row) return false;\n            const currentFirst = [...listParent.children].find(child => child !== row && visible(child));\n            const target = currentFirst || firstRow;\n            if (target && (row.parentElement !== listParent || row.nextElementSibling !== target)) {\n                listParent.insertBefore(row, target);\n            }\n            row.dataset.sakaluxHubMode = 'flyout-first-vertical';\n            return true;\n        };'''
new_position = '''        const positionFirstVertical = row => {\n            if (!row) return false;\n            // Always make Hub the first real child of the vertical list. Do not choose\n            // a target based on viewport visibility, because that changes while scrolling.\n            const target = [...listParent.children].find(child => child !== row) || firstRow;\n            if (target && (row.parentElement !== listParent || listParent.firstElementChild !== row)) {\n                listParent.insertBefore(row, target);\n            }\n            row.dataset.sakaluxHubMode = 'flyout-first-vertical';\n            return true;\n        };'''
if old_position not in text:
    raise SystemExit('positionFirstVertical block not found')
text = text.replace(old_position, new_position, 1)

text = text.replace('.filter(row => visible(row))', '.filter(row => mounted(row))', 1)

HUB.write_text(text, encoding='utf-8')
print('Patched Hub v1.9.83: persistent first Fly-out row')
