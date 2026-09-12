from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]

# --- Mission Rewards 1.1.4: remove Violentmonkey-specific bridge/heartbeat path ---
p=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=p.read_text(encoding='utf-8')
s,n=re.subn(r'(^// @version\s+)1\.1\.3(\s*$)',r'\g<1>1.1.4\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Mission metadata version not found')
s=s.replace("{version:'1.1.3'}","{version:'1.1.4'}",1)
s=s.replace("const VERSION = '1.1.3';","const VERSION = '1.1.4';",1)

# Remove early hidden bridge bootstrap.
s=s.replace("  const EARLY_BRIDGE_ID='sakalux-module-bridge-mission-rewards';\n",'',1)
s,n=re.subn(r"\n  function publishEarlyPresence\(\)\{[\s\S]*?\n  \}\n  publishEarlyPresence\(\);\n",'\n',s,count=1)
if n!=1: raise SystemExit('Early presence block not found')
s=s.replace('function start(){publishEarlyPresence();registerSelf();','function start(){registerSelf();',1)

# Registration itself is the canonical live presence marker; publish enabled state too.
old="""  function registerSelf(){
    let m=document.querySelector(`[${REG_ATTR}=\"${SELF.id}\"]`);
    if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}
    Object.assign(m.dataset,SELF);
  }
"""
new="""  function registerSelf(){
    let m=document.querySelector(`[${REG_ATTR}=\"${SELF.id}\"]`);
    if(!m){m=document.createElement('span');m.setAttribute(REG_ATTR,SELF.id);m.hidden=true;(document.body||document.documentElement).appendChild(m);}
    Object.assign(m.dataset,SELF);
    try { m.dataset.enabled=String(JSON.parse(localStorage.getItem('SakaLuX_MR_ENABLED') ?? 'true') !== false); }
    catch { m.dataset.enabled='true'; }
  }
"""
if old not in s: raise SystemExit('registerSelf block not found')
s=s.replace(old,new,1)

# Remove heartbeat compatibility layer.
s=s.replace("    const HUB_HEARTBEAT_KEY = 'SakaLuX_HUB_HEARTBEAT_mission-rewards';\n    const HUB_HEARTBEAT_INTERVAL = 2000;\n",'',1)
s=s.replace("    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';\n", "    const HUB_PROMPT_ID = 'sakalux-hub-install-prompt';\n    const HUB_COMMAND_KEY = 'SakaLuX_MR_HUB_COMMAND';\n",1)
s,n=re.subn(r"\n    let hubHeartbeatTimer = null;[\s\S]*?\n    function isMissionsPage\(\) \{", "\n    function isMissionsPage() {", s, count=1)
if n!=1: raise SystemExit('Heartbeat helper block not found')
s=s.replace('        publishHubHeartbeat();\n','')
s=s.replace('        startHubHeartbeat();\n','')

# Remove old hidden control bridge introduced for Violentmonkey.
s,n=re.subn(r"\n    function syncHubBridge\(id, value\) \{[\s\S]*?\n    window\.SakaLuXMissionRewards = \{", "\n    window.SakaLuXMissionRewards = {", s, count=1)
if n!=1: raise SystemExit('Mission bridge block not found')
s=s.replace("        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());\n",'')
s=s.replace("        syncHubBridge('mission-rewards', state.enabled);\n",'')

# Add simple localStorage command channel for Hub control; no sandbox bridge required.
anchor="""    window.SakaLuXMissionRewards = {
"""
command="""    let hubCommandTimer = null;
    let hubPowerTimer = null;

    async function consumeHubCommand() {
        let command = null;
        try { command = JSON.parse(localStorage.getItem(HUB_COMMAND_KEY) || 'null'); } catch {}
        if (!command?.action) return false;
        if (Date.now() - Number(command.at || 0) > 30000) {
            try { localStorage.removeItem(HUB_COMMAND_KEY); } catch {}
            return false;
        }
        try { localStorage.removeItem(HUB_COMMAND_KEY); } catch {}
        const action = String(command.action);
        if (action === 'open' || action === 'settings') {
            if (!state.enabled) setEnabled(true);
            if (!isMissionsPage()) { location.href = MISSIONS_URL; return true; }
            openSettings();
            return true;
        }
        if (action === 'refresh') {
            if (!isMissionsPage()) { location.href = MISSIONS_URL; return true; }
            try { await window.SakaLuXMissionRewards?.refresh?.(); } catch {}
            return true;
        }
        if (action === 'missions') { location.href = MISSIONS_URL; return true; }
        return false;
    }

    function startHubCommandChannel() {
        consumeHubCommand();
        if (hubCommandTimer) clearInterval(hubCommandTimer);
        hubCommandTimer = setInterval(consumeHubCommand, 500);
        if (hubPowerTimer) clearInterval(hubPowerTimer);
        hubPowerTimer = setInterval(() => {
            const desired = loadJson(STORAGE.enabled, true) !== false;
            if (desired !== state.enabled) setEnabled(desired);
            const registration = document.querySelector('[data-slx-standalone-registration=\"mission-rewards\"]');
            if (registration) {
                registration.dataset.version = VERSION;
                registration.dataset.enabled = String(Boolean(state.enabled));
            }
        }, 1000);
    }

    window.SakaLuXMissionRewards = {
"""
if anchor not in s: raise SystemExit('Mission API anchor not found')
s=s.replace(anchor,command,1)

# Start command channel immediately during normal init.
old="""        state.enabled = loadJson(STORAGE.enabled, true) !== false;
"""
new="""        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        startHubCommandChannel();
"""
if old not in s: raise SystemExit('Mission init state anchor not found')
s=s.replace(old,new,1)

# Remove bridge-ready wording/state if still present.
s=s.replace(" bridge.dataset.ready = '1'; bridge.dataset.module = id;",'')
s=s.replace(', bridgeReady: true','')

p.write_text(s,encoding='utf-8')

# --- scripts.json ---
pj=ROOT/'scripts.json'; data=json.loads(pj.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item['id']=='mission-rewards': item['version']='1.1.4'
pj.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# --- Hub 1.9.42: Mission uses registration + localStorage command channel, not Violentmonkey bridge ---
h=ROOT/'SakaLuX-Script-Hub.user.js'; hs=h.read_text(encoding='utf-8')
hs,n=re.subn(r'(^// @version\s+)1\.9\.41(\s*$)',r'\g<1>1.9.42\2',hs,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
hs=hs.replace("const VERSION = '1.9.41';","const VERSION = '1.9.42';",1)
hs=hs.replace("name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.3',","name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.4',",1)
hs=hs.replace('    const MODULE_HEARTBEAT_TTL = 10000;\n','',1)

# Remove heartbeat helper and all heartbeat fallbacks.
hs,n=re.subn(r"\n    function getFreshHeartbeat\(script\) \{[\s\S]*?\n    \}\n\n    function getInstalledVersion", "\n    function getInstalledVersion", hs, count=1)
if n!=1: raise SystemExit('Hub heartbeat helper not found')
hs=re.sub(r"\n        const heartbeat = getFreshHeartbeat\(script\);\n        if \(heartbeat\?\.version\) return String\(heartbeat\.version\);",'',hs)
hs=re.sub(r"\n        const heartbeat = getFreshHeartbeat\(script\);\n        if \(heartbeat\) return heartbeat\.enabled !== false;",'',hs)

# Registration marker also carries live enabled state.
needle="""        const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
        if (bridge?.dataset?.enabled === 'true') return true;
        if (bridge?.dataset?.enabled === 'false') return false;
        return Object.prototype.hasOwnProperty.call(modulePower, script.id) ? modulePower[script.id] !== false : true;
"""
replacement="""        const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
        if (bridge?.dataset?.enabled === 'true') return true;
        if (bridge?.dataset?.enabled === 'false') return false;
        const registration = document.querySelector(`[data-slx-standalone-registration=\"${script.id}\"]`);
        if (registration?.dataset?.enabled === 'true') return true;
        if (registration?.dataset?.enabled === 'false') return false;
        return Object.prototype.hasOwnProperty.call(modulePower, script.id) ? modulePower[script.id] !== false : true;
"""
if needle not in hs: raise SystemExit('Hub enabled-state anchor not found')
hs=hs.replace(needle,replacement,1)

# Mission power control uses its own persistent setting, no hidden bridge.
old="""        } else {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (!bridge) throw new Error('Update ' + script.name + ' to the latest version to use its Violentmonkey control bridge.');
            bridge.dataset.action = enabled ? 'on' : 'off';
            bridge.click();
        }
"""
new="""        } else {
            if (script.id === 'mission-rewards') {
                localStorage.setItem('SakaLuX_MR_ENABLED', JSON.stringify(Boolean(enabled)));
                const registration = document.querySelector('[data-slx-standalone-registration=\"mission-rewards\"]');
                if (registration) registration.dataset.enabled = String(Boolean(enabled));
            } else {
                const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
                if (!bridge) throw new Error('Module control is unavailable for ' + script.name + '.');
                bridge.dataset.action = enabled ? 'on' : 'off';
                bridge.click();
            }
        }
"""
if old not in hs: raise SystemExit('Hub setModulePower bridge block not found')
hs=hs.replace(old,new,1)

# Mission panel actions use a simple localStorage command channel.
old="""        if (!api) {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
"""
new="""        if (!api) {
            if (script.id === 'mission-rewards') {
                try { localStorage.setItem('SakaLuX_MR_HUB_COMMAND', JSON.stringify({ action: isPanelAction ? 'open' : actionId, at: Date.now() })); } catch {}
                recordUsage(id);
                closeHub();
                return;
            }
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
"""
if old not in hs: raise SystemExit('Hub runAction no-api block not found')
hs=hs.replace(old,new,1)

# Mission switch is ready when its registration is present even without a hidden bridge.
old="""        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id));
"""
new="""        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id) || (script.id === 'mission-rewards' && document.querySelector('[data-slx-standalone-registration=\"mission-rewards\"]')));
"""
if old not in hs: raise SystemExit('Hub powerReady anchor not found')
hs=hs.replace(old,new,1)

# New changelog entry.
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.42',
            date: '2026-09-13',
            changes: [
                'Mission Rewards no longer depends on the Violentmonkey-specific hidden control bridge or heartbeat compatibility layer.',
                'Mission Rewards presence/version comes from the normal standalone registration marker, while OPEN/SETTINGS uses a simple localStorage command channel.',
                'Mission Rewards ON/OFF now writes its native enabled setting directly and the module synchronizes it at runtime.'
            ]
        },
"""
if "version: '1.9.42'" not in hs: hs=hs.replace(needle,entry,1)
h.write_text(hs,encoding='utf-8')

# --- Docs ---
md=ROOT/'greasyfork/Mission-Rewards.md'; d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.1.3**','## Current version\n**v1.1.4**',1)
d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.1.4:** Removes the Violentmonkey-specific hidden bridge and heartbeat compatibility path.
- Mission Rewards now starts normally and announces itself through the same standalone registration mechanism used by the shared dock.
- Hub OPEN/SETTINGS and ON/OFF use a simple localStorage command/state channel instead of an isolated userscript bridge.
""",d,count=1)
md.write_text(d,encoding='utf-8')

hd=ROOT/'greasyfork/Script-Hub.md'; d=hd.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.41**','## Current version\n**v1.9.42**',1)
d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.42:** Mission Rewards no longer requires its former Violentmonkey control bridge/heartbeat compatibility path.
- The Hub detects Mission Rewards through its live registration marker and controls it through its native localStorage command/state channel.
- The Mission Rewards switch is active whenever the live registration exists, without a hidden bridge dependency.
""",d,count=1)
hd.write_text(d,encoding='utf-8')

print('Applied Mission Rewards v1.1.4 clean startup + Hub v1.9.42')
