from pathlib import Path

p = Path('SakaLuX-Bazaar-Smart-Pricer.user.js')
s = p.read_text(encoding='utf-8')

# Bump only when moving from the current release.
s = s.replace('// @version      1.1.9', '// @version      1.1.10', 1)
s = s.replace("let v = '1.1.9';", "let v = '1.1.10';", 1)
s = s.replace("{version:'1.1.9'}", "{version:'1.1.10'}", 1)
s = s.replace("const VERSION = '1.1.9';", "const VERSION = '1.1.10';", 1)

anchor = """    let bazaarObserver = null;\n\n    function setupObserver(bazaarRoot) {"""
insert = """    let bazaarObserver = null;\n\n    const MODULE_ENABLED_KEY = 'moduleEnabled';\n\n    function isModuleEnabled() {\n        return GM_getValue(MODULE_ENABLED_KEY, true) !== false;\n    }\n\n    function stopModuleRuntime() {\n        if (bazaarObserver) { bazaarObserver.disconnect(); bazaarObserver = null; }\n        clearTimeout(mutationDebounceTimer);\n        document.querySelectorAll('.qp-chip,.quick-price-btn,.quick-update-price-btn,.qp-overlay,.qp-toast-wrap').forEach(el => el.remove());\n        chipEl = null;\n        chipFillBtn = null;\n        isScriptInitialized = false;\n    }\n\n    function setModuleEnabled(value) {\n        const enabled = Boolean(value);\n        GM_setValue(MODULE_ENABLED_KEY, enabled);\n        if (enabled) {\n            checkForBazaar();\n        } else {\n            stopModuleRuntime();\n        }\n        try {\n            window.dispatchEvent(new CustomEvent('SakaLuX:BazaarSmartPricerStateChanged', { detail: { version: VERSION, enabled } }));\n        } catch {}\n        return enabled;\n    }\n\n    function toggleModuleEnabled() {\n        return setModuleEnabled(!isModuleEnabled());\n    }\n\n    function setupObserver(bazaarRoot) {"""
if 'const MODULE_ENABLED_KEY = \'moduleEnabled\';' not in s:
    if anchor not in s:
        raise SystemExit('observer anchor not found')
    s = s.replace(anchor, insert, 1)

s = s.replace("""    function initScript(bazaarRoot) {\n        // Full init regardless of key state:""", """    function initScript(bazaarRoot) {\n        if (!isModuleEnabled()) return;\n        // Full init regardless of key state:""", 1)

s = s.replace("""    function checkForBazaar() {\n        if (isScriptInitialized) return;""", """    function checkForBazaar() {\n        if (!isModuleEnabled()) return;\n        if (isScriptInitialized) return;""", 1)

s = s.replace("""    function init() {\n        // Stage 0: Check immediately""", """    function init() {\n        if (!isModuleEnabled()) return;\n        // Stage 0: Check immediately""", 1)

old_api = """            refresh: () => { processAllItems(); processManageItems(); updateChipContext(); },\n            isEnabled: () => true,\n            setEnabled: () => true\n"""
new_api = """            refresh: () => { if (isModuleEnabled()) { processAllItems(); processManageItems(); updateChipContext(); } },\n            isEnabled: isModuleEnabled,\n            setEnabled: setModuleEnabled,\n            toggleEnabled: toggleModuleEnabled\n"""
if old_api in s:
    s = s.replace(old_api, new_api, 1)
elif 'setEnabled: setModuleEnabled' not in s:
    raise SystemExit('API power anchor not found')

p.write_text(s, encoding='utf-8')
