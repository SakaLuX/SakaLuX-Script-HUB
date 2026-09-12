from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')

s,n=re.subn(r'(^// @version\s+)1\.9\.37(\s*$)',r'\g<1>1.9.38\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
s=s.replace("const VERSION = '1.9.37';","const VERSION = '1.9.38';",1)

needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.38',
            date: '2026-09-12',
            changes: [
                'Clarifies module version reporting as the currently RUNNING userscript version, not necessarily the version already installed in TornPDA.',
                'When RUNNING is behind Registry/Latest, OPEN or SETTINGS performs one verification reload before treating it as a real missing update.',
                'Prevents a freshly updated module from being misclassified as still outdated simply because the old page instance is still injected.'
            ]
        },
"""
if "version: '1.9.38'" not in s:
    s=s.replace(needle,entry,1)

# Add runtime reload verification helpers before runAction.
anchor='    async function runAction(id, actionId) {\n'
helper="""    function runtimeReloadKey(script) {
        return 'SakaLuX_HUB_RUNTIME_RELOAD_' + script.id;
    }

    function runtimeReloadAlreadyTried(script) {
        try {
            const raw = sessionStorage.getItem(runtimeReloadKey(script));
            if (!raw) return false;
            const data = JSON.parse(raw);
            return data && data.expected === script.expectedVersion && Date.now() - Number(data.at || 0) < 120000;
        } catch { return false; }
    }

    function markRuntimeReloadTried(script) {
        try { sessionStorage.setItem(runtimeReloadKey(script), JSON.stringify({ expected: script.expectedVersion, at: Date.now() })); } catch {}
    }

    function clearRuntimeReloadTried(script) {
        try { sessionStorage.removeItem(runtimeReloadKey(script)); } catch {}
    }

"""
if helper not in s:
    s=s.replace(anchor,helper+anchor,1)

# Replace stale-runtime block in runAction with one-shot reload verification regardless update state.
old="""        const installed = getInstalledVersion(script);
        const staleRuntime = Boolean(installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0 && getUpdateState(script).state !== 'available');
        if (staleRuntime && isPanelAction) {
            savePendingModuleAction(id, actionId);
            closeHub();
            location.reload();
            return;
        }
"""
new="""        const installed = getInstalledVersion(script);
        const runtimeBehind = Boolean(installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0);
        if (runtimeBehind && isPanelAction && !runtimeReloadAlreadyTried(script)) {
            markRuntimeReloadTried(script);
            savePendingModuleAction(id, actionId);
            closeHub();
            location.reload();
            return;
        }
        if (!runtimeBehind) clearRuntimeReloadTried(script);
"""
if old not in s: raise SystemExit('runAction stale block not found')
s=s.replace(old,new,1)

# Update card semantics: always show RUNNING prefix for detected version.
old_chip="""                    <span class=\"slh-chip ${healthChipClass}\">${missing ? 'NOT INSTALLED' : 'v' + escapeHtml(installed || health.version || '?')}</span>
"""
new_chip="""                    <span class=\"slh-chip ${healthChipClass}\">${missing ? 'NOT INSTALLED' : 'RUNNING v' + escapeHtml(installed || health.version || '?')}</span>
"""
if old_chip not in s: raise SystemExit('version chip not found')
s=s.replace(old_chip,new_chip,1)

# Change stale visual condition to be independent from update.state; after first reload attempt it becomes a true update state.
old="""        const staleRuntime = Boolean(!missing && installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0 && update.state !== 'available');
"""
new="""        const staleRuntime = Boolean(!missing && installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0 && !runtimeReloadAlreadyTried(script));
"""
if old not in s: raise SystemExit('render staleRuntime expression not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

md=ROOT/'greasyfork/Script-Hub.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.37**','## Current version\n**v1.9.38**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.38:** The version chip now explicitly reports the **RUNNING** userscript version from the current Torn page.
- If RUNNING is behind Registry/Latest, OPEN or SETTINGS performs one verification reload so TornPDA can inject a newly installed script version.
- Only if the runtime is still old after that reload is the version treated as genuinely requiring an update.
""",d,count=1)
md.write_text(d,encoding='utf-8')
print('Applied Hub v1.9.38 runtime-vs-installed version fix')
