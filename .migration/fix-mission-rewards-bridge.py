from pathlib import Path
import re, json
ROOT=Path(__file__).resolve().parents[1]

# --- Mission Rewards 1.1.2 ---
p=ROOT/'SakaLuX-Mission-Rewards.user.js'
s=p.read_text(encoding='utf-8')

s,n=re.subn(r'(^// @version\s+)1\.1\.1(\s*$)',r'\g<1>1.1.2\2',s,count=1,flags=re.M)
if n!=1: raise SystemExit('Mission metadata version not found')
s=s.replace('{"id":"mission-rewards","name":"Missions","icon":"🎯","selector":"","fallback":"https://www.torn.com/page.php?sid=missions"},{version:\'1.1.1\'}','{"id":"mission-rewards","name":"Missions","icon":"🎯","selector":"","fallback":"https://www.torn.com/page.php?sid=missions"},{version:\'1.1.2\'}',1)
s=s.replace("const VERSION = '1.1.1';","const VERSION = '1.1.2';",1)

# Publish canonical registration + bridge synchronously in the bootstrap, before DOMContentLoaded.
anchor="""  const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant'];
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed=\"1\"]')||document.querySelector('[data-sakalux-hub-active=\"1\"]'));
"""
insert="""  const ORDER=['enhancer','bazaar','mission-rewards','market-intelligence','elimination-assistant'];
  const EARLY_BRIDGE_ID='sakalux-module-bridge-mission-rewards';
  const hubInstalled=()=>!!(window.SakaLuXScriptHub||document.getElementById('sakalux-hub-button')||document.getElementById('sakalux-hub-top-skull')||document.getElementById('sakalux-hub-nav-skull')||document.getElementById('sakalux-hub-panel')||document.getElementById('sakalux-hub-style')||document.querySelector('[data-sakalux-hub-installed=\"1\"]')||document.querySelector('[data-sakalux-hub-active=\"1\"]'));

  function publishEarlyPresence(){
    let registration=document.querySelector(`[${REG_ATTR}=\"${SELF.id}\"]`);
    if(!registration){
      registration=document.createElement('span');
      registration.setAttribute(REG_ATTR,SELF.id);
      registration.hidden=true;
      (document.body||document.documentElement).appendChild(registration);
    }
    Object.assign(registration.dataset,SELF);

    let bridge=document.getElementById(EARLY_BRIDGE_ID);
    if(!bridge){
      bridge=document.createElement('button');
      bridge.type='button';
      bridge.id=EARLY_BRIDGE_ID;
      bridge.hidden=true;
      (document.body||document.documentElement).appendChild(bridge);
    }
    let enabled=true;
    try { enabled=JSON.parse(localStorage.getItem('SakaLuX_MR_ENABLED') ?? 'true') !== false; } catch {}
    bridge.dataset.version=SELF.version;
    bridge.dataset.enabled=String(enabled);
    bridge.dataset.ready='bootstrap';
    bridge.dataset.module='mission-rewards';
  }
  publishEarlyPresence();
"""
if anchor not in s: raise SystemExit('Mission bootstrap anchor not found')
s=s.replace(anchor,insert,1)

# Keep registerSelf authoritative and make sure early presence is refreshed during normal bootstrap.
s=s.replace('  function start(){registerSelf();render();setTimeout(maybePrompt,1200);', '  function start(){publishEarlyPresence();registerSelf();render();setTimeout(maybePrompt,1200);',1)

# Fix main Hub detection to recognize current Hub launchers/marker, not only the removed old button.
old_hub="""    function hubInstalled() {
        return Boolean(window.SakaLuXScriptHub?.ready || document.getElementById('sakalux-hub-button'));
    }
"""
new_hub="""    function hubInstalled() {
        return Boolean(
            window.SakaLuXScriptHub?.ready ||
            document.getElementById('sakalux-hub-button') ||
            document.getElementById('sakalux-hub-top-skull') ||
            document.getElementById('sakalux-hub-nav-skull') ||
            document.getElementById('sakalux-hub-panel') ||
            document.querySelector('[data-sakalux-hub-active=\"1\"]') ||
            document.querySelector('[data-sakalux-hub-installed=\"1\"]')
        );
    }
"""
if old_hub not in s: raise SystemExit('Mission hubInstalled anchor not found')
s=s.replace(old_hub,new_hub,1)

# Bridge should advertise fully-ready state once main runtime installs its handler.
s=s.replace("bridge.dataset.version = VERSION; bridge.dataset.enabled = String(Boolean(state.enabled));","bridge.dataset.version = VERSION; bridge.dataset.enabled = String(Boolean(state.enabled)); bridge.dataset.ready = '1'; bridge.dataset.module = id;",1)

# Remove premature Ready event. It was emitted before installHubBridge() existed.
premature="""    window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsReady', { detail: { version: VERSION, enabled: state.enabled } }));

    async function init() {
"""
replacement="""    async function init() {
"""
if premature not in s: raise SystemExit('Premature ready event anchor not found')
s=s.replace(premature,replacement,1)

# Emit Ready only after bridge is fully installed, and ensure early registration version is refreshed.
old_init="""        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());
        if (state.enabled) setTimeout(maybePromptForHub, 3500);
"""
new_init="""        state.enabled = loadJson(STORAGE.enabled, true) !== false;
        installHubBridge('mission-rewards', () => window.SakaLuXMissionRewards.open());
        try {
            const registration = document.querySelector('[data-slx-standalone-registration=\"mission-rewards\"]');
            if (registration) registration.dataset.version = VERSION;
        } catch {}
        window.dispatchEvent(new CustomEvent('SakaLuX:MissionRewardsReady', { detail: { version: VERSION, enabled: state.enabled, bridgeReady: true } }));
        if (state.enabled) setTimeout(maybePromptForHub, 3500);
"""
if old_init not in s: raise SystemExit('Mission init bridge anchor not found')
s=s.replace(old_init,new_init,1)
p.write_text(s,encoding='utf-8')

# --- scripts.json ---
pj=ROOT/'scripts.json'
data=json.loads(pj.read_text(encoding='utf-8'))
for item in data['scripts']:
    if item['id']=='mission-rewards': item['version']='1.1.2'
pj.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# --- Hub 1.9.40 and fallback registry sync ---
h=ROOT/'SakaLuX-Script-Hub.user.js'
hs=h.read_text(encoding='utf-8')
hs,n=re.subn(r'(^// @version\s+)1\.9\.39(\s*$)',r'\g<1>1.9.40\2',hs,count=1,flags=re.M)
if n!=1: raise SystemExit('Hub metadata version not found')
hs=hs.replace("const VERSION = '1.9.39';","const VERSION = '1.9.40';",1)
hs=hs.replace("name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.1',","name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.1.2',",1)
needle='    const HUB_CHANGELOG = [\n'
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.40',
            date: '2026-09-12',
            changes: [
                'Mission Rewards v1.1.2 publishes its DOM bridge and standalone registration immediately at userscript bootstrap.',
                'Mission Rewards Ready is now emitted only after the full Hub bridge handler is installed, fixing TornPDA/Violentmonkey isolated-context detection.',
                'Hub fallback registry is synchronized with Mission Rewards v1.1.2.'
            ]
        },
"""
if "version: '1.9.40'" not in hs: hs=hs.replace(needle,entry,1)
h.write_text(hs,encoding='utf-8')

# --- Docs ---
md=ROOT/'greasyfork/Mission-Rewards.md'
d=md.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.1.1**','## Current version\n**v1.1.2**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.1.2:** Publishes the Mission Rewards DOM bridge and standalone registration immediately when the userscript starts.
- The Hub-ready event is emitted only after the full bridge handler is installed, preventing false missing/old-version states in TornPDA and Violentmonkey isolated contexts.
- Hub presence detection now recognizes the current S status launcher, Fly-out HUB launcher and Hub-active DOM marker.
""",d,count=1)
md.write_text(d,encoding='utf-8')

hd=ROOT/'greasyfork/Script-Hub.md'
d=hd.read_text(encoding='utf-8')
d=d.replace('## Current version\n**v1.9.39**','## Current version\n**v1.9.40**',1)
if '## Current release notes' in d:
    d=re.sub(r'## Current release notes\n[\s\S]*?(?=\n## Recommended)',"""## Current release notes
- **v1.9.40:** Synchronizes the fallback registry with Mission Rewards v1.1.2.
- Mission Rewards now announces itself to Hub synchronously at bootstrap and emits Ready only after its actionable bridge is fully installed.
- This directly fixes the false Mission Rewards missing / old runtime state seen in TornPDA and Violentmonkey.
""",d,count=1)
hd.write_text(d,encoding='utf-8')

print('Applied Mission Rewards v1.1.2 bridge-order fix and Hub v1.9.40 sync')
