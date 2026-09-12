from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]

# Mission Rewards v1.1.3: live heartbeat independent of DOM bridge.
p=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(^// @version\s+)1\.1\.2(\s*$)',r'\g<1>1.1.3\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Mission metadata version not found')
s=s.replace("{version:'1.1.2'}","{version:'1.1.3'}",1)
s=s.replace("const VERSION = '1.1.2';","const VERSION = '1.1.3';",1)

# Add heartbeat constants near main constants.
anchor="""    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Mission%20Rewards&user=ammo&torn=items';
"""
insert="""    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';
    const REQUIRED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Mission%20Rewards&user=ammo&torn=items';
    const HUB_HEARTBEAT_KEY = 'SakaLuX_HUB_HEARTBEAT_mission-rewards';
    const HUB_HEARTBEAT_INTERVAL = 2000;
"""
if anchor not in s: raise SystemExit('Mission constants anchor missing')
s=s.replace(anchor,insert,1)

# Add heartbeat helpers before isMissionsPage.
anchor="""    function isMissionsPage() {
"""
helper="""    let hubHeartbeatTimer = null;

    function publishHubHeartbeat() {
        try {
            localStorage.setItem(HUB_HEARTBEAT_KEY, JSON.stringify({
                id: 'mission-rewards',
                version: VERSION,
                enabled: Boolean(state.enabled),
                ready: true,
                at: Date.now()
            }));
        } catch {}
    }

    function startHubHeartbeat() {
        publishHubHeartbeat();
        if (hubHeartbeatTimer) clearInterval(hubHeartbeatTimer);
        hubHeartbeatTimer = setInterval(publishHubHeartbeat, HUB_HEARTBEAT_INTERVAL);
    }

    function isMissionsPage() {
"""
if anchor not in s: raise SystemExit('Mission heartbeat anchor missing')
s=s.replace(anchor,helper,1)

# Keep heartbeat in sync with enabled changes.
old="""        window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsStateChanged', { detail: { version: VERSION, enabled: state.enabled } }));
        syncHubBridge('mission-rewards', state.enabled);
"""
new="""        window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsStateChanged', { detail: { version: VERSION, enabled: state.enabled } }));
        syncHubBridge('mission-rewards', state.enabled);
        publishHubHeartbeat();
"""
if old not in s: raise SystemExit('Mission setEnabled anchor missing')
s=s.replace(old,new,1)

# Start heartbeat at init before anything page-specific.
old="""    async function init() {
        try { localStorage.setItem('SakaLuX_Installed_mission-rewards', VERSION); } catch {}
        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());
"""
new="""    async function init() {
        try { localStorage.setItem('SakaLuX_Installed_mission-rewards', VERSION); } catch {}
        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        startHubHeartbeat();
        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());
"""
if old not in s: raise SystemExit('Mission init anchor missing')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

# scripts.json Mission version
pj=ROOT/'scripts.json'; data=json.loads(pj.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item['id']=='mission-rewards': item['version']='1.1.3'
pj.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Hub v1.9.41: fresh heartbeat fallback + rerender on DOM changes.
h=ROOT/'SakaLuX-Script-Hub.user.js'; hs=h.read_text(encoding='utf-8')
hs,n=re.subn(r'(^// @version\s+)1\.9\.40(\s*$)',r'\g<1>1.9.41\2',hs,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version missing')
hs=hs.replace("const VERSION = '1.9.40';","const VERSION = '1.9.41';",1)
hs=hs.replace("name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.2',","name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.3',",1)

# Add heartbeat TTL constant.
hs=hs.replace("    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;","    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;\n    const MODULE_HEARTBEAT_TTL = 10000;",1)

# Changelog.
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.41',
            date: '2026-09-13',
            changes: [
                'Adds a fresh localStorage heartbeat channel for Mission Rewards so Hub detection no longer depends only on fragile hidden DOM bridges.',
                'A heartbeat is accepted only while fresh, preventing deleted or disabled scripts from becoming permanent ghost modules.',
                'Hub now re-renders open module cards and stats when bridge/registration DOM nodes are added or removed.'
            ]
        },
"""
if "version: '1.9.41'" not in hs: hs=hs.replace(needle,entry,1)

# Add heartbeat helper before getInstalledVersion.
anchor='    function getInstalledVersion(script) {\n'
helper="""    function getFreshHeartbeat(script) {
        try {
            const raw = localStorage.getItem('SakaLuX_HUB_HEARTBEAT_' + script.id);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || data.id !== script.id || !data.at) return null;
            if (Date.now() - Number(data.at) > MODULE_HEARTBEAT_TTL) return null;
            return data;
        } catch { return null; }
    }

"""
if anchor not in hs: raise SystemExit('Hub getInstalledVersion anchor missing')
hs=hs.replace(anchor,helper+anchor,1)

# Add heartbeat fallback before return null in getInstalledVersion only.
start=hs.index('    function getInstalledVersion(script) {')
end=hs.index('\n    function ',start+10)
block=hs[start:end]
if 'getFreshHeartbeat(script)' not in block:
    block=block.replace('        return null;\n    }',"""        const heartbeat = getFreshHeartbeat(script);
        if (heartbeat?.version) return String(heartbeat.version);
        return null;
    }""",1)
    hs=hs[:start]+block+hs[end:]

# getLiveEnabledState: add heartbeat before false.
start=hs.index('    function getLiveEnabledState(script) {')
end=hs.index('\n    function ',start+10)
block=hs[start:end]
if 'getFreshHeartbeat(script)' not in block:
    block=block.replace('        return false;\n    }',"""        const heartbeat = getFreshHeartbeat(script);
        if (heartbeat) return heartbeat.enabled !== false;
        return false;
    }""",1)
    hs=hs[:start]+block+hs[end:]

# Rerender Hub when DOM modules change.
old="""    function queueEnsure() {
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => { observerTimer = null; ensureEverything(); }, 300);
    }
"""
new="""    function queueEnsure() {
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
            observerTimer = null;
            ensureEverything();
            if (document.getElementById(IDS.panel)) {
                renderList();
                renderMainStats();
            }
        }, 300);
    }
"""
if old not in hs: raise SystemExit('Hub queueEnsure anchor missing')
hs=hs.replace(old,new,1)

# Poll heartbeat while hub exists/open so stale/fresh state updates without DOM mutations.
init_anchor="""        startObserver();
        ensureEverything();
"""
init_new="""        startObserver();
        ensureEverything();
        setInterval(() => {
            if (document.getElementById(IDS.panel)) {
                renderList();
                renderMainStats();
                updateBadge();
            }
        }, 2500);
"""
if init_anchor not in hs: raise SystemExit('Hub init polling anchor missing')
hs=hs.replace(init_anchor,init_new,1)
h.write_text(hs,encoding='utf-8')

# Docs
md=ROOT/'greasyfork/Mission-Rewards.md'; d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.1.2**','## Current version\n**v1.1.3**',1)
d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.1.3:** Adds a live heartbeat shared through localStorage in addition to the DOM bridge.
- Hub can now detect Mission Rewards reliably even if Torn/TornPDA replaces the hidden bridge node during SPA rendering.
- Heartbeat carries the running version and enabled state and refreshes every two seconds.
""",d,count=1)
md.write_text(d,encoding='utf-8')

hd=ROOT/'greasyfork/Script-Hub.md'; d=hd.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.40**','## Current version\n**v1.9.41**',1)
d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.41:** Adds fresh heartbeat detection for Mission Rewards as a robust cross-sandbox fallback to the DOM bridge.
- Heartbeats expire after ten seconds, so disabled/deleted scripts do not remain as permanent ghost modules after reload.
- Open Hub cards/stats now re-render when module bridge/registration nodes change and while fresh heartbeat state changes.
""",d,count=1)
hd.write_text(d,encoding='utf-8')

print('Applied Mission Rewards v1.1.3 + Hub v1.9.41 heartbeat detection fix')
