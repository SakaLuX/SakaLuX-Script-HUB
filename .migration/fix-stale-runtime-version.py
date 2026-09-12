from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')

s,n=re.subn(r'(^// @version\s+)1\.9\.36(\s*$)',r'\g<1>1.9.37\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
s=s.replace("const VERSION = '1.9.36';","const VERSION = '1.9.37';",1)

needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.37',
            date: '2026-09-12',
            changes: [
                'Detects stale userscript runtimes after a module update is installed but the current Torn page still runs the previous injected version.',
                'Shows RELOAD REQUIRED instead of presenting the old runtime version as fully current.',
                'Module OPEN/SETTINGS automatically reloads the page and retries when the installed runtime is behind the registry version.'
            ]
        },
"""
if "version: '1.9.37'" not in s:
    s=s.replace(needle,entry,1)

# Mark stale runtime in card rendering.
old="""        const installed = getInstalledVersion(script);
        const latest = update.data?.publishedLatest || update.data?.latest || script.expectedVersion || '?';
        const missing = health.state === 'missing';
"""
new="""        const installed = getInstalledVersion(script);
        const latest = update.data?.publishedLatest || update.data?.latest || script.expectedVersion || '?';
        const missing = health.state === 'missing';
        const staleRuntime = Boolean(!missing && installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0 && update.state !== 'available');
"""
if old not in s: raise SystemExit('renderCard anchor missing')
s=s.replace(old,new,1)

old_chip="""                    <span class=\"slh-chip ${updateChipClass}\">${escapeHtml(update.text)}</span>
"""
new_chip="""                    <span class=\"slh-chip ${staleRuntime ? 'warn' : updateChipClass}\">${escapeHtml(staleRuntime ? 'RELOAD REQUIRED' : update.text)}</span>
"""
if old_chip not in s: raise SystemExit('update chip anchor missing')
s=s.replace(old_chip,new_chip,1)

# Add helper to distinguish stale loaded runtime from truly old installed version.
anchor="""    async function runAction(id, actionId) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const action = script.quickActions.find(item => item.id === actionId) || { method: actionId };
        const isPanelAction = actionId === getPrimaryAction(script).id || actionId === 'open' || actionId === 'settings';
        const api = script.api();
"""
replacement="""    async function runAction(id, actionId) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const action = script.quickActions.find(item => item.id === actionId) || { method: actionId };
        const isPanelAction = actionId === getPrimaryAction(script).id || actionId === 'open' || actionId === 'settings';
        const installed = getInstalledVersion(script);
        const staleRuntime = Boolean(installed && installed !== '?' && script.expectedVersion && compareVersions(installed, script.expectedVersion) < 0 && getUpdateState(script).state !== 'available');
        if (staleRuntime && isPanelAction) {
            savePendingModuleAction(id, actionId);
            closeHub();
            location.reload();
            return;
        }
        const api = script.api();
"""
if anchor not in s: raise SystemExit('runAction anchor missing')
s=s.replace(anchor,replacement,1)

p.write_text(s,encoding='utf-8')

md=ROOT/'greasyfork/Script-Hub.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.36**','## Current version\n**v1.9.37**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.37:** Detects when TornPDA has installed a newer add-on but the currently open Torn page is still running the previous injected userscript instance.
- Such modules now show **RELOAD REQUIRED** instead of looking fully current with the stale runtime version.
- OPEN / SETTINGS automatically reloads Torn and retries the requested module action after the new userscript runtime starts.
""",d,count=1)
md.write_text(d,encoding='utf-8')
print('Applied Hub v1.9.37 stale runtime detection fix')
