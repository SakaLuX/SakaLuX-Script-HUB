from pathlib import Path

HUB = Path('SakaLuX-Script-Hub.user.js')
text = HUB.read_text(encoding='utf-8')

# Keep version 1.9.82. This is a direct hotfix to the current release.

old_visible = '''        const visible = el => {\n            if (!(el instanceof Element) || !el.isConnected) return false;\n            try {\n                const cs = getComputedStyle(el);\n                const r = el.getBoundingClientRect();\n                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01\n                    && r.width > 20 && r.height > 20 && r.bottom > 0 && r.right > 0;\n            } catch { return false; }\n        };'''
new_visible = '''        const mounted = el => {\n            if (!(el instanceof Element) || !el.isConnected) return false;\n            try {\n                const cs = getComputedStyle(el);\n                const r = el.getBoundingClientRect();\n                // Persistent CAT-style mounting: viewport position is irrelevant.\n                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01\n                    && r.width > 20 && r.height > 20;\n            } catch { return false; }\n        };'''
if old_visible not in text:
    raise SystemExit('viewport visibility helper not found')
text = text.replace(old_visible, new_visible, 1)

text = text.replace(".filter(el => !el.closest?.(`#${IDS.navSkull}`) && visible(el));", ".filter(el => !el.closest?.(`#${IDS.navSkull}`) && mounted(el));", 1)
text = text.replace('.filter(row => visible(row))', '.filter(row => mounted(row))', 1)

old_existing = '''        if (existing?.isConnected) {\n            positionFirstVertical(existing);\n            existing.querySelector(`#${IDS.navBadge}`)?.remove();\n            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());\n            updateTopbarSkullState();\n            syncFloatingButtonVisibility();\n            return true;\n        }'''
new_existing = '''        if (existing?.isConnected) {\n            // Keep the exact mounted node permanently in Torn's vertical list.\n            // Scrolling must never remove/recreate it.\n            const parent = existing.parentElement;\n            if (parent && parent.firstElementChild !== existing) parent.insertBefore(existing, parent.firstElementChild);\n            existing.querySelector(`#${IDS.navBadge}`)?.remove();\n            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());\n            updateTopbarSkullState();\n            syncFloatingButtonVisibility();\n            return true;\n        }'''
if old_existing not in text:
    raise SystemExit('existing launcher block not found')
text = text.replace(old_existing, new_existing, 1)

old_position = '''        const positionFirstVertical = row => {\n            if (!row) return false;\n            const currentFirst = [...listParent.children].find(child => child !== row && visible(child));\n            const target = currentFirst || firstRow;\n            if (target && (row.parentElement !== listParent || row.nextElementSibling !== target)) {\n                listParent.insertBefore(row, target);\n            }\n            row.dataset.sakaluxHubMode = 'flyout-first-vertical';\n            return true;\n        };'''
new_position = '''        const positionFirstVertical = row => {\n            if (!row) return false;\n            // Always keep Hub as the first child of the vertical list.\n            const target = [...listParent.children].find(child => child !== row) || firstRow;\n            if (target && (row.parentElement !== listParent || listParent.firstElementChild !== row)) {\n                listParent.insertBefore(row, target);\n            }\n            row.dataset.sakaluxHubMode = 'flyout-first-vertical';\n            return true;\n        };'''
if old_position not in text:
    raise SystemExit('positionFirstVertical block not found')
text = text.replace(old_position, new_position, 1)

HUB.write_text(text, encoding='utf-8')
print('Hotfixed Hub v1.9.82: persistent first Fly-out row')
