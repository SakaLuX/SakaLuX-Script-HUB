from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')

# bump Hub
s,n=re.subn(r'(^// @version\s+)1\.9\.38(\s*$)',r'\g<1>1.9.39\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
s=s.replace("const VERSION = '1.9.38';","const VERSION = '1.9.39';",1)

needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.39',
            date: '2026-09-12',
            changes: [
                'Makes live DOM bridge/API presence authoritative for managed-module state.',
                'Persistent localStorage install markers no longer make disabled or deleted TornPDA scripts appear installed, healthy or active.',
                'Module cards and switches now represent the runtime actually present in the current Torn page.'
            ]
        },
"""
if "version: '1.9.39'" not in s:
    s=s.replace(needle,entry,1)

# Replace getInstalledVersion entirely. Markers are deliberately excluded from active state.
start=s.index('    function getInstalledVersion(script) {')
end=s.index('\n    function ', start+10)
old=s[start:end]
new=r'''    function getInstalledVersion(script) {
        // Runtime authority only. Persistent markers are intentionally NOT used here:
        // they survive TornPDA disable/delete and create ghost installed/active cards.
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge?.dataset?.version) return String(bridge.dataset.version);
        } catch {}
        try {
            const api = script.api();
            if (api?.version) return String(api.version);
            const health = api?.health?.();
            if (health?.version) return String(health.version);
        } catch {}
        try {
            const standalone = document.querySelector(`[data-slx-standalone-registration="${script.id}"]`);
            if (standalone?.dataset?.version) return String(standalone.dataset.version);
        } catch {}
        return null;
    }

    function getHistoricalMarkerVersion(script) {
        try {
            return localStorage.getItem('SakaLuX_Installed_' + script.id)
                || (script.id === 'elimination-assistant' ? localStorage.getItem('SakaLuX_Installed_elimination') : '')
                || null;
        } catch { return null; }
    }
'''
s=s[:start]+new+s[end:]

# Replace getHealth marker fallback semantics.
old_health="""    function getHealth(script) {
        const api = script.api();
        if (!api) {
            const installed = getInstalledVersion(script);
            if (installed) return { state: 'ok', text: 'INSTALLED', version: installed, data: { detection: 'installation marker' } };
            return { state: 'missing', text: 'NOT INSTALLED', version: null, data: null };
"""
new_health="""    function getHealth(script) {
        const api = script.api();
        if (!api) {
            const running = getInstalledVersion(script);
            if (running) return { state: 'ok', text: 'RUNNING', version: running, data: { detection: 'live bridge' } };
            return { state: 'missing', text: 'NOT RUNNING', version: null, data: { historicalVersion: getHistoricalMarkerVersion(script) } };
"""
if old_health not in s: raise SystemExit('getHealth anchor not found')
s=s.replace(old_health,new_health,1)

# Ensure missing card label says NOT RUNNING instead of implying manager installation state.
s=s.replace("${missing ? 'NOT INSTALLED' : 'RUNNING v' + escapeHtml(installed || health.version || '?')}","${missing ? 'NOT RUNNING' : 'RUNNING v' + escapeHtml(installed || health.version || '?')}")

# Any active/enabled state should prefer live bridge dataset. Add helper and use it where common patterns exist.
helper_anchor='    function getHealth(script) {'
helper=r'''    function getLiveEnabledState(script) {
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge) return bridge.dataset.enabled !== 'false';
        } catch {}
        try {
            const api = script.api();
            if (api && typeof api.isEnabled === 'function') return api.isEnabled() !== false;
            const health = api?.health?.();
            if (health && typeof health.enabled === 'boolean') return health.enabled;
        } catch {}
        return false;
    }

'''
s=s.replace(helper_anchor,helper+helper_anchor,1)

# Replace bridge/api enabled reads where known with authoritative helper in card rendering/control paths.
s=s.replace("const enabled = health.data?.enabled !== false;","const enabled = getLiveEnabledState(script);")
s=s.replace("const enabled = api?.isEnabled?.() !== false;","const enabled = getLiveEnabledState(script);")

p.write_text(s,encoding='utf-8')

# docs
md=ROOT/'greasyfork/Script-Hub.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.38**','## Current version\n**v1.9.39**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.39:** Managed-module state is now based on the live bridge/API present in the current Torn page.
- Old persistent install markers no longer make disabled or deleted TornPDA scripts appear installed, healthy or active.
- Cards and ON/OFF switches now represent the userscript runtime actually loaded on the page; historical marker data is diagnostic only.
""",d,count=1)
md.write_text(d,encoding='utf-8')
print('Applied Hub v1.9.39 live-runtime authority fix')
