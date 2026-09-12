from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')

# bump Hub
s,n=re.subn(r'(^// @version\s+)1\.9\.34(\s*$)',r'\g<1>1.9.35\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
s=s.replace("const VERSION = '1.9.34';","const VERSION = '1.9.35';",1)

# changelog
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.35',
            date: '2026-09-12',
            changes: [
                'Fixes Mission Rewards SETTINGS when its bridge is not yet available in the current userscript context.',
                'Installed module actions now remember the requested action, navigate to the module fallback page when needed, then retry through the bridge/API.',
                'Removes the dead-end Violentmonkey bridge alert for modules that provide a valid fallback page.'
            ]
        },
"""
if "version: '1.9.35'" not in s:
    s=s.replace(needle,entry,1)

# replace runAction with resilient version
start=s.index('    async function runAction(id, actionId) {')
end=s.index('\n    async function updateAll()', start)
new_run=r'''    function savePendingModuleAction(id, actionId) {
        try { sessionStorage.setItem('SakaLuX_HUB_PENDING_MODULE_ACTION', JSON.stringify({ id, actionId, at: Date.now() })); } catch {}
    }

    function clearPendingModuleAction() {
        try { sessionStorage.removeItem('SakaLuX_HUB_PENDING_MODULE_ACTION'); } catch {}
    }

    async function retryPendingModuleAction() {
        let pending = null;
        try { pending = JSON.parse(sessionStorage.getItem('SakaLuX_HUB_PENDING_MODULE_ACTION') || 'null'); } catch {}
        if (!pending?.id || !pending?.actionId || Date.now() - Number(pending.at || 0) > 30000) { clearPendingModuleAction(); return false; }
        const script = SCRIPTS.find(item => item.id === pending.id);
        if (!script) { clearPendingModuleAction(); return false; }
        for (let i = 0; i < 12; i++) {
            const api = script.api();
            if (api) {
                const action = script.quickActions.find(item => item.id === pending.actionId) || { method: pending.actionId };
                if (typeof api[action.method] === 'function') {
                    clearPendingModuleAction();
                    try { await api[action.method](); recordUsage(script.id); } catch (error) { console.error('[SakaLuX Hub pending action]', error); }
                    return true;
                }
            }
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge) {
                clearPendingModuleAction();
                bridge.dataset.action = pending.actionId === 'open' || pending.actionId === 'settings' ? 'open' : pending.actionId;
                bridge.click();
                recordUsage(script.id);
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 250));
        }
        clearPendingModuleAction();
        return false;
    }

    async function runAction(id, actionId) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const action = script.quickActions.find(item => item.id === actionId) || { method: actionId };
        const isPanelAction = actionId === getPrimaryAction(script).id || actionId === 'open' || actionId === 'settings';
        const api = script.api();
        if (!api) {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge) {
                bridge.dataset.action = isPanelAction ? 'open' : actionId;
                bridge.click();
                recordUsage(id);
                closeHub();
                return;
            }
            if (script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            if (getInstalledVersion(script)) {
                if (action.fallbackUrl) {
                    savePendingModuleAction(id, actionId);
                    closeHub();
                    location.href = action.fallbackUrl;
                    return;
                }
                alert(script.name + ' is installed, but its control bridge is not available on this page.');
                return;
            }
            const url = getInstallUrl(script);
            if (url) location.href = url;
            return;
        }
        try {
            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                const result = await api[action.method]();
                if (result === false && action.fallbackUrl) { savePendingModuleAction(id, actionId); location.href = action.fallbackUrl; return; }
                if (isPanelAction) closeHub(); else setTimeout(openHub, 100);
                return;
            }
            if (action.fallbackUrl) { savePendingModuleAction(id, actionId); recordUsage(id); location.href = action.fallbackUrl; return; }
            if (isPanelAction && script.fallbackOpen()) { recordUsage(id); closeHub(); return; }
            alert(script.name + ' is not available on this page.');
        } catch (error) {
            console.error('[SakaLuX Hub]', error);
            alert('Action failed: ' + String(error?.message || error));
        }
    }
'''
s=s[:start]+new_run+s[end:]

# retry pending action during init after registry loaded
anchor='        await loadRegistry(false);\n'
if anchor not in s: raise SystemExit('init registry anchor missing')
s=s.replace(anchor,anchor+"        setTimeout(() => retryPendingModuleAction(), 350);\n",1)

p.write_text(s,encoding='utf-8')

# docs
md=ROOT/'greasyfork/Script-Hub.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.34**','## Current version\n**v1.9.35**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.35:** Fixes module actions when an installed add-on bridge is not immediately available in the current userscript context.
- Hub now remembers the requested action, navigates to the module fallback page, and retries through the module bridge/API after navigation.
- Mission Rewards SETTINGS no longer stops on the old Violentmonkey bridge warning when the Missions fallback page can be used.
""",d,count=1)
md.write_text(d,encoding='utf-8')

print('Hub v1.9.35 pending module action fix applied')
