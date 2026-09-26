from pathlib import Path
import json, re

# Bazaar Smart Pricer: make power global while keeping runtime page-scoped.
p = Path('SakaLuX-Bazaar-Smart-Pricer.user.js')
s = p.read_text(encoding='utf-8')
s = s.replace('// @version      1.1.11', '// @version      1.1.12', 1)
s = s.replace("let v = '1.1.11';", "let v = '1.1.12';", 1)
s = s.replace("{version:'1.1.11'}", "{version:'1.1.12'}", 1)
s = s.replace("const VERSION = '1.1.11';", "const VERSION = '1.1.12';", 1)
canonical_end = '/* SakaLuX Canonical Installed Version — END */\n'
if '/* SakaLuX Bazaar Smart Pricer Global Power Bridge — BEGIN */' not in s:
    bridge = r'''
/* SakaLuX Bazaar Smart Pricer Global Power Bridge — BEGIN */
(() => {
  'use strict';
  const VERSION = '1.1.12';
  const LOCAL_KEY = 'SakaLuX_BAZAAR_SMART_PRICER_ENABLED';
  const GM_KEY = 'moduleEnabled';
  function readEnabled() {
    try { const local = localStorage.getItem(LOCAL_KEY); if (local === '1') return true; if (local === '0') return false; } catch {}
    try { return GM_getValue(GM_KEY, true) !== false; } catch { return true; }
  }
  function writeEnabled(value) {
    const enabled = Boolean(value);
    try { localStorage.setItem(LOCAL_KEY, enabled ? '1' : '0'); } catch {}
    try { GM_setValue(GM_KEY, enabled); } catch {}
    try { window.dispatchEvent(new CustomEvent('SakaLuX:BazaarSmartPricerStateChanged', { detail: { version: VERSION, enabled } })); } catch {}
    return enabled;
  }
  const api = window.SakaLuXBazaarSmartPricer || {};
  api.version = VERSION;
  api.isEnabled = readEnabled;
  api.setEnabled = writeEnabled;
  api.toggleEnabled = () => writeEnabled(!readEnabled());
  api.health = () => ({ ready: true, version: VERSION, enabled: readEnabled(), powerBridge: true, pageActive: location.pathname === '/bazaar.php' });
  window.SakaLuXBazaarSmartPricer = api;
  try {
    let bridge = document.getElementById('sakalux-module-bridge-bazaar-smart-pricer');
    if (!bridge) { bridge = document.createElement('button'); bridge.type = 'button'; bridge.id = 'sakalux-module-bridge-bazaar-smart-pricer'; bridge.hidden = true; (document.body || document.documentElement).appendChild(bridge); }
    const sync = () => { bridge.dataset.version = VERSION; bridge.dataset.enabled = readEnabled() ? 'true' : 'false'; };
    bridge.onclick = () => { const action = bridge.dataset.action; if (action === 'on') writeEnabled(true); else if (action === 'off') writeEnabled(false); else if (action === 'toggle') writeEnabled(!readEnabled()); sync(); };
    sync();
    window.addEventListener('SakaLuX:BazaarSmartPricerStateChanged', sync, { passive: true });
    window.addEventListener('SakaLuX:BazaarSmartPricerPowerRequested', event => { writeEnabled(event?.detail?.enabled); sync(); }, { passive: true });
  } catch {}
})();
/* SakaLuX Bazaar Smart Pricer Global Power Bridge — END */
'''
    if canonical_end not in s: raise SystemExit('Pricer canonical marker missing')
    s = s.replace(canonical_end, canonical_end + bridge, 1)
old_is = """    function isModuleEnabled() {\n        return GM_getValue(MODULE_ENABLED_KEY, true) !== false;\n    }"""
new_is = """    function isModuleEnabled() {\n        try { const local = localStorage.getItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED'); if (local === '1') return true; if (local === '0') return false; } catch {}\n        return GM_getValue(MODULE_ENABLED_KEY, true) !== false;\n    }"""
if old_is in s: s = s.replace(old_is, new_is, 1)
old_set = """        GM_setValue(MODULE_ENABLED_KEY, enabled);\n        if (enabled) {"""
new_set = """        GM_setValue(MODULE_ENABLED_KEY, enabled);\n        try { localStorage.setItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED', enabled ? '1' : '0'); } catch {}\n        if (enabled) {"""
if old_set in s: s = s.replace(old_set, new_set, 1)
p.write_text(s, encoding='utf-8')

# Hub: one-tap remediation actions.
p = Path('SakaLuX-Script-Hub.user.js')
h = p.read_text(encoding='utf-8')
h = h.replace('// @version      1.9.87', '// @version      1.9.88', 1)
h = h.replace("const VERSION = '1.9.87';", "const VERSION = '1.9.88';", 1)
summary_anchor = """    function getHealthSummary() {\n        const counts = { OK:0, UPDATE_AVAILABLE:0, DISABLED:0, WRONG_PAGE:0, API_ERROR:0, CHECK_ERROR:0, NOT_INSTALLED:0 };\n        for (const row of getAllModuleStatus()) counts[row.status.code] = (counts[row.status.code] || 0) + 1;\n        return Object.freeze(counts);\n    }\n"""
if summary_anchor not in h: raise SystemExit('Hub health summary anchor missing')
if 'function getRemediationAction(script)' not in h:
    helper = r'''

    function getRemediationAction(script) {
        const status = getModuleStatus(script);
        if (status.code === 'UPDATE_AVAILABLE') return { label: 'UPDATE', kind: 'update' };
        if (status.code === 'DISABLED') return { label: 'ENABLE', kind: 'enable' };
        if (status.code === 'WRONG_PAGE') return { label: 'OPEN PAGE', kind: 'page' };
        if (status.code === 'API_ERROR') return { label: 'FIX API', kind: 'api' };
        if (status.code === 'CHECK_ERROR') return { label: 'RECHECK', kind: 'recheck' };
        if (status.code === 'NOT_INSTALLED') return { label: 'INSTALL', kind: 'install' };
        return null;
    }

    async function runRemediationAction(id) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return false;
        const remediation = getRemediationAction(script);
        if (!remediation) return true;
        if (remediation.kind === 'update' || remediation.kind === 'install') { const url = getInstallUrl(script); if (url) { location.href = url; return true; } throw new Error('Installer URL is unavailable.'); }
        if (remediation.kind === 'enable') { await setModulePower(script.id, true); return true; }
        if (remediation.kind === 'recheck') { await checkScriptUpdate(script, true); renderList(); renderMainStats(); return true; }
        if (remediation.kind === 'api') {
            const api = script.api();
            const apiAction = (script.quickActions || []).find(a => ['create-key','api-key','test-key'].includes(a.id)) || (script.quickActions || []).find(a => /api|key/i.test(a.label || ''));
            if (api && apiAction && typeof api[apiAction.method] === 'function') { await api[apiAction.method](); return true; }
            if (typeof api?.createRequiredTornKey === 'function') { await api.createRequiredTornKey(); return true; }
            openSettings(); return true;
        }
        if (remediation.kind === 'page') {
            const primary = getPrimaryAction(script);
            const configured = (script.quickActions || []).find(a => a.id === primary.id) || primary;
            if (configured?.fallbackUrl) { location.href = configured.fallbackUrl; return true; }
            if (script.id === 'bazaar-smart-pricer') { location.href = 'https://www.torn.com/bazaar.php'; return true; }
            if (script.fallbackOpen()) return true;
            throw new Error('No module page is configured.');
        }
        return false;
    }
'''
    h = h.replace(summary_anchor, summary_anchor + helper, 1)
old_power_ready = "        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id));"
new_power_ready = "        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id) || (script.id === 'bazaar-smart-pricer' && installed));"
if old_power_ready in h: h = h.replace(old_power_ready, new_power_ready, 1)
chip_anchor = """                    <span class=\"slh-chip ${statusChipClass}\" title=\"${escapeHtml(moduleStatus.detail)}\">${escapeHtml(moduleStatus.label)}</span>\n                    <span class=\"slh-chip ${updateChipClass}\">${escapeHtml(update.text)}</span>"""
chip_repl = """                    <span class=\"slh-chip ${statusChipClass}\" title=\"${escapeHtml(moduleStatus.detail)}\">${escapeHtml(moduleStatus.label)}</span>\n                    ${getRemediationAction(script) ? `<button class=\"slh-chip ${statusChipClass} slh-remedy\" type=\"button\" data-remediate=\"${escapeHtml(script.id)}\" title=\"${escapeHtml(moduleStatus.detail)}\">${escapeHtml(getRemediationAction(script).label)}</button>` : ''}\n                    <span class=\"slh-chip ${updateChipClass}\">${escapeHtml(update.text)}</span>"""
if chip_anchor not in h: raise SystemExit('Hub card chip anchor missing')
h = h.replace(chip_anchor, chip_repl, 1)
bind_anchor = "        document.querySelectorAll('[data-module-new]').forEach(button => { button.onclick = () => openModuleRelease(SCRIPTS.find(item => item.id === button.dataset.moduleNew)); });\n"
if bind_anchor not in h: raise SystemExit('Hub bindCards anchor missing')
if "document.querySelectorAll('[data-remediate]')" not in h:
    h = h.replace(bind_anchor, bind_anchor + """        document.querySelectorAll('[data-remediate]').forEach(button => {\n            button.onclick = async () => {\n                button.disabled = true;\n                try { await runRemediationAction(button.dataset.remediate); }\n                catch (error) { console.error('[SakaLuX Hub remediation]', error); alert('Repair action failed: ' + String(error?.message || error)); renderList(); }\n            };\n        });\n""", 1)
old_else = """        } else {\n            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);\n            if (!bridge) throw new Error(script.name + ' control interface is unavailable on this page.');\n            bridge.dataset.action = enabled ? 'on' : 'off';\n            bridge.click();\n        }\n"""
new_else = """        } else {\n            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);\n            if (bridge) { bridge.dataset.action = enabled ? 'on' : 'off'; bridge.click(); }\n            else if (script.id === 'bazaar-smart-pricer' && getInstalledVersion(script)) {\n                try { localStorage.setItem('SakaLuX_BAZAAR_SMART_PRICER_ENABLED', enabled ? '1' : '0'); } catch {}\n                try { window.dispatchEvent(new CustomEvent('SakaLuX:BazaarSmartPricerPowerRequested', { detail: { enabled: Boolean(enabled) } })); } catch {}\n            } else throw new Error(script.name + ' control interface is unavailable on this page.');\n        }\n"""
if old_else not in h: raise SystemExit('Hub setModulePower fallback anchor missing')
h = h.replace(old_else, new_else, 1)
p.write_text(h, encoding='utf-8')

reg_path = Path('scripts.json')
reg = json.loads(reg_path.read_text(encoding='utf-8'))
for row in reg.get('scripts', []):
    if row.get('id') == 'script-hub':
        row['version'] = '1.9.88'; row['detailsRevision'] = int(row.get('detailsRevision', 0)) + 1
        row['release'] = {'version':'1.9.88','date':'2026-09-26','notes':['Adds one-tap remediation actions for Hub health states.','Adds UPDATE, ENABLE, OPEN PAGE, FIX API, RECHECK and INSTALL repair actions.','Keeps Bazaar Smart Pricer power controllable from Hub on every Torn page.']}
    elif row.get('id') == 'bazaar-smart-pricer':
        row['version'] = '1.1.12'; row['detailsRevision'] = int(row.get('detailsRevision', 0)) + 1
        row['release'] = {'version':'1.1.12','date':'2026-09-26','notes':['Adds a global persistent power bridge so Hub ON/OFF works from every Torn page.','Synchronizes Hub power state with Pricer storage.','Keeps pricing runtime page-scoped while power control remains global.']}
reg_path.write_text(json.dumps(reg, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

doc = Path('greasyfork/Script-Hub.md'); d = doc.read_text(encoding='utf-8')
d = d.replace('**v1.9.87**','**v1.9.88**',1); d = re.sub(r'- Canonical version: \*\*v1\.9\.\d+\*\*','- Canonical version: **v1.9.88**',d,1)
if '### v1.9.88 — Health Remediation Actions' not in d:
    idx=d.find('\n### v'); sec='\n### v1.9.88 — Health Remediation Actions\n- Adds one-tap UPDATE, ENABLE, OPEN PAGE, FIX API, RECHECK and INSTALL actions from module health status.\n- Keeps remediation inside Hub and refreshes health after local actions.\n- Bazaar Smart Pricer power can now be toggled from Hub on any Torn page.\n'; d=d[:idx]+sec+d[idx:] if idx>=0 else d+sec
doc.write_text(d,encoding='utf-8')
q=Path('greasyfork/Bazaar-Smart-Pricer.md')
if q.exists():
    x=q.read_text(encoding='utf-8').replace('1.1.11','1.1.12')
    if 'v1.1.12 — Global Hub power control' not in x: x += '\n\n### v1.1.12 — Global Hub power control\n- ON/OFF can be changed from Script Hub on any Torn page.\n- Pricing runtime remains limited to Bazaar pages.\n'
    q.write_text(x,encoding='utf-8')
print('Priority 5 remediation actions + Bazaar Smart Pricer global power applied.')
