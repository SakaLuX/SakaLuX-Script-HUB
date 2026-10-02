from pathlib import Path

suite_path = Path('SakaLuX-Suite.user.js')
test_path = Path('tests/suite-daily-progress-regression.cjs')
md_path = Path('greasyfork/SakaLuX-Suite.md')

suite = suite_path.read_text(encoding='utf-8')

# Idempotent version bump.
suite = suite.replace('// @version      0.9.968', '// @version      0.9.969', 1)
suite = suite.replace("const VERSION = '0.9.968';\n  const SUITE = Object.freeze", "const VERSION = '0.9.969';\n  const SUITE = Object.freeze", 1)
suite = suite.replace("const API_VERSION = '2.0.0';", "const API_VERSION = '2.0.1';", 1)
suite = suite.replace('/* SakaLuX Smart Daily Checklist v2.0.0 — v0.9.968 */', '/* SakaLuX Smart Daily Checklist v2.0.1 — v0.9.969 */', 1)

old_init = "  const init=()=>{ensureBridge();observeRoutes();setTimeout(()=>refreshApi(false),2500);};"
new_init = """  function bindToolbarAction(){
    if(g.__sakaluxSuiteDailyProgressToolbarBound) return;
    g.__sakaluxSuiteDailyProgressToolbarBound=true;
    document.addEventListener('click',e=>{
      const trigger=e.target?.closest?.('[data-action=\"daily-progress\"]');
      if(!trigger) return;
      e.preventDefault();
      open();
    },true);
  }
  const init=()=>{ensureBridge();bindToolbarAction();observeRoutes();setTimeout(()=>refreshApi(false),2500);};"""

if old_init in suite:
    suite = suite.replace(old_init, new_init, 1)
elif 'function bindToolbarAction()' not in suite:
    raise SystemExit('Could not locate Smart Daily Checklist init hook')

suite_path.write_text(suite, encoding='utf-8')

# Strengthen the regression test: existence is not enough; clicking the real toolbar action must open the panel.
test = test_path.read_text(encoding='utf-8')
test = test.replace(r"0\.9\.968", r"0\.9\.969", 1)
test = test.replace("const VERSION = '0.9.968';", "const VERSION = '0.9.969';", 1)
test = test.replace("assert.equal(api.version,'2.0.0');", "assert.equal(api.version,'2.0.1');", 1)
needle = "const api=window.SakaLuXSuiteDailyProgress; assert.ok(api,'public API exposed'); assert.equal(api.version,'2.0.1'); assert.equal(api.dayKey(new Date(2026,8,6)),'2026-09-06');"
click_test = needle + "\nconst toolbarButton=window.document.createElement('button'); toolbarButton.setAttribute('data-action','daily-progress'); window.document.body.appendChild(toolbarButton); toolbarButton.click(); assert.ok(window.document.getElementById('sakalux-suite-daily-progress')?.classList.contains('open'),'Master Control Daily Progress button opens Smart Daily Checklist'); api.close();"
if needle in test and 'Master Control Daily Progress button opens Smart Daily Checklist' not in test:
    test = test.replace(needle, click_test, 1)
elif 'Master Control Daily Progress button opens Smart Daily Checklist' not in test:
    raise SystemExit('Could not locate Daily Progress API assertion for click regression')
test_path.write_text(test, encoding='utf-8')

md = md_path.read_text(encoding='utf-8')
md = md.replace('**v0.9.968**', '**v0.9.969**', 1)
md = md.replace('- Canonical version: **v0.9.968**', '- Canonical version: **v0.9.969**', 1)
old_note = """**v0.9.968 — Smart Daily Checklist v2 with API auto-completion**
- Replaces the route-only Daily Progress logic with a full Smart Daily Checklist while preserving its public API and Master Control entry point.
- Automatically checks Energy/Nerve refills, cooldowns, missions, virus coding, education, casino tokens, travel and organized crime through Torn API v2 when a shared API key is available.
- Keeps Torn-route fallback detection for Gym, Crimes, Missions, Faction/OC, Travel, City, Shops, Racing, Job, Wheels and Prayer, so TornPDA activity can still complete supported tasks without extra API calls.
- Adds DONE / ACTION / N/A / SYNC states, overall completion percentage, category filters, Show completed persistence, API refresh, custom tasks and 30-day local rollover history.
- Uses Script Hub getApiKey() first and falls back to existing Suite/Hub local settings; no API key is stored by the checklist itself."""
new_note = """**v0.9.969 — Smart Daily Checklist button hotfix**
- Restores the delegated `data-action=\"daily-progress\"` click handler used by the Master Control toolbar, so tapping **Daily Progress** opens Smart Daily Checklist again in TornPDA/Tampermonkey.
- Keeps the hidden module bridge and Smart Daily Checklist v2 behaviour unchanged.
- Adds a DOM regression test that actually clicks the Master Control action and verifies the checklist panel opens; future releases can no longer pass by checking only that the button markup exists."""
if old_note in md:
    md = md.replace(old_note, new_note, 1)
elif '**v0.9.969 — Smart Daily Checklist button hotfix**' not in md:
    raise SystemExit('Could not locate current Suite release note')

history_marker = '## Release history / Changelog\n'
history_entry = """
### v0.9.969 — Smart Daily Checklist button hotfix
- Fixes the non-responsive **Daily Progress** button introduced in v0.9.968 by restoring the delegated toolbar click listener.
- Adds an end-to-end DOM click assertion to the Suite Daily Progress regression test.
- Smart Daily Checklist public API is now v2.0.1.

"""
if history_entry.strip() not in md:
    md = md.replace(history_marker, history_marker + '\n' + history_entry, 1)
md_path.write_text(md, encoding='utf-8')
