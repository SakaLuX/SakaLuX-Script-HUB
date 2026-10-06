from pathlib import Path
import re, runpy

ROOT = Path(__file__).resolve().parents[2]
runpy.run_path(str(ROOT / '.github/scripts/update_bounty_hunter_v045.py'), run_name='__main__')

# Keep Shared Core regression aligned with the released Core version.
test = ROOT / 'tests/shared-core-v1-regression.cjs'
t = test.read_text(encoding='utf-8')
t = t.replace("assert.equal(core.version, '1.1.0');", "assert.equal(core.version, '1.2.1');")
test.write_text(t, encoding='utf-8')

# Dedicated GreasyFork description/changelog surface.
doc = ROOT / 'greasyfork/Bounty-Hunter.md'
s = doc.read_text(encoding='utf-8')
s = re.sub(r'^\*\*v[^*]+\*\*', '**v0.4.5**', s, count=1, flags=re.M)

current = """## Current release note

**v0.4.5 — Hub-aligned mobile workspace + clear toggle states**
- Matches Script Hub mobile geometry: full usable width, top aligned, and extended down to 36px above TornPDA chat/navigation.
- Removes overlay/footer blur and dimming for a cleaner native TornPDA feel.
- Active filter/toggle controls now use a clear orange ON state; inactive controls remain dark.
- Adds semantic aria-pressed and data-state attributes so control state is visually and programmatically consistent.
- Updates Shared Core workspace defaults to v1.2.1 for reuse by future SakaLuX modules.

"""

if '## Current release note' in s:
    s = re.sub(
        r'## Current release note\n.*?(?=\n## (?:Release history / )?Changelog\n)',
        current.rstrip() + '\n',
        s,
        count=1,
        flags=re.S,
    )
else:
    pos = s.find('\n## Changelog')
    s = s[:pos+1] + current + s[pos+1:] if pos >= 0 else s + '\n' + current

entries = """### v0.4.5 — Hub-aligned mobile workspace + clear toggle states
- Aligns the Bounty Hunter panel with Script Hub geometry on TornPDA.
- Removes blur/dim effects from the overlay and footer.
- Active toggles are orange; inactive toggles remain dark.
- Shared Core workspace defaults updated to v1.2.1.

### v0.4.4 — Shared Core workspace geometry
- Moves mobile panel positioning into Shared Core through applyWorkspaceLayout.
- Uses visualViewport to keep the panel stable across mobile viewport changes.
- Keeps the target list flexible while reserving the lower TornPDA navigation zone.

### v0.4.3 — Near-fullscreen TornPDA layout
- Expands the Bounty Hunter panel to almost the full mobile viewport.
- Makes the target list use the remaining vertical space with independent scrolling.
- Keeps header, filters and footer accessible.

### v0.4.2 — Footer/mobile layout repair
- Fixes the v0.4.1 footer layout regression that squeezed the panel into a narrow column.
- Moves the donation footer inside the panel and restores full-width content.

### v0.4.1 — SakaLuX donation footer
- Adds SEND MONEY, SEND ITEMS and Made with ❤️ by SakaLuX [2380374].

### v0.4.0 — Shared Core + professional Hub UI
- Embeds Shared Core and routes Torn/FFScouter requests through the shared API broker where available.
- Uses the shared SakaLuX skin, storage and performance helpers.
- Refactors the mobile UI toward the same visual system as Script Hub.

### v0.3.8 — Strict verified-status filtering
- Beatable only no longer accepts unverified Status ? targets.
- Hospital targets only pass when a valid release timestamp is known and falls inside the configured hospital window.
- Traveling, Abroad, Jail and Federal targets are excluded.

### v0.3.7 — Hospital-window and status fallback repair
- Adds stricter hospital-window filtering.
- Adds Torn API v1 basic fallback when v2 cannot provide a usable live status.
- Expands live-status validation of candidate targets.

### v0.3.6 — Travel/Abroad live-status repair
- Runs FFScouter before live-status enrichment so displayed candidates get validated first.
- Detects travel/destination/location status and excludes Abroad/Traveling targets from the attackable list.

"""

head = '## Changelog'
if head in s:
    pre, body = s.split(head, 1)
    body = re.sub(r'\n### v0\.(?:3\.[678]|4\.[0-5]).*?(?=\n### v|\Z)', '', body, flags=re.S)
    s = pre + head + '\n' + entries + body.lstrip('\n')
else:
    s += '\n' + head + '\n' + entries

doc.write_text(s, encoding='utf-8')
