from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
s=p.read_text(encoding='utf-8')

s,n=re.subn(r'(^// @version\s+)1\.9\.35(\s*$)',r'\g<1>1.9.36\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
s=s.replace("const VERSION = '1.9.35';","const VERSION = '1.9.36';",1)

needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.36',
            date: '2026-09-12',
            changes: [
                'Fixes pending module actions when the fallback destination is already the current Torn page.',
                'Forces a full reload on same-page fallback so older installed add-ons can recreate their DOM bridge.',
                'Extends pending-action lifetime and retries automatically after reload.'
            ]
        },
"""
if "version: '1.9.36'" not in s:
    s=s.replace(needle,entry,1)

# Extend pending lifetime from 30 seconds to 2 minutes.
s=s.replace("Date.now() - Number(pending.at || 0) > 30000","Date.now() - Number(pending.at || 0) > 120000")

# Add helper for robust fallback navigation.
anchor="""    function clearPendingModuleAction() {
        try { sessionStorage.removeItem('SakaLuX_HUB_PENDING_MODULE_ACTION'); } catch {}
    }

"""
helper="""    function clearPendingModuleAction() {
        try { sessionStorage.removeItem('SakaLuX_HUB_PENDING_MODULE_ACTION'); } catch {}
    }

    function normalizeUrlForCompare(url) {
        try {
            const u = new URL(url, location.href);
            return u.origin + u.pathname + u.search + u.hash;
        } catch { return String(url || ''); }
    }

    function navigateForPendingAction(url) {
        const target = normalizeUrlForCompare(url);
        const current = normalizeUrlForCompare(location.href);
        if (target === current) {
            location.reload();
            return;
        }
        location.href = url;
    }

"""
if anchor not in s: raise SystemExit('pending clear anchor missing')
s=s.replace(anchor,helper,1)

# Replace direct fallback navigations used by pending module actions.
s=s.replace("                    location.href = action.fallbackUrl;\n                    return;","                    navigateForPendingAction(action.fallbackUrl);\n                    return;",1)
s=s.replace("if (result === false && action.fallbackUrl) { savePendingModuleAction(id, actionId); location.href = action.fallbackUrl; return; }","if (result === false && action.fallbackUrl) { savePendingModuleAction(id, actionId); navigateForPendingAction(action.fallbackUrl); return; }",1)
s=s.replace("if (action.fallbackUrl) { savePendingModuleAction(id, actionId); recordUsage(id); location.href = action.fallbackUrl; return; }","if (action.fallbackUrl) { savePendingModuleAction(id, actionId); recordUsage(id); navigateForPendingAction(action.fallbackUrl); return; }",1)

# Retry again when Mission Rewards announces itself ready, covering slow userscript startup.
s=s.replace("window.addEventListener('SakaLuX:MissionRewardsReady', () => { queueEnsure(); renderList(); renderMainStats(); });","window.addEventListener('SakaLuX:MissionRewardsReady', () => { queueEnsure(); renderList(); renderMainStats(); setTimeout(() => retryPendingModuleAction(), 100); });",1)

p.write_text(s,encoding='utf-8')

md=ROOT/'greasyfork/Script-Hub.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.35**','## Current version\n**v1.9.36**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.36:** Fixes installed-module actions when the requested fallback page is already open.
- Hub now performs a full page reload in that case so older add-ons can recreate their DOM bridge, then automatically retries the saved action.
- Pending actions now remain valid for up to two minutes and retry when Mission Rewards announces readiness.
""",d,count=1)
md.write_text(d,encoding='utf-8')

print('Applied Hub v1.9.36 same-page pending action fix')
