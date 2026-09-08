// ==UserScript==
// @name         SakaLuX Suite [EXPERIMENTAL]
// @namespace    sakalux.suite
// @version      0.1.0
// @description  Experimental one-install modular master control for the SakaLuX Torn script suite. Prototype only; existing standalone scripts remain untouched.
// @author       SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        none
// @license      MIT
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  const VERSION = '0.1.0';
  const BUILD = 'CONTROL-LAYER PROTOTYPE';
  const IDS = {
    button: 'slx-suite-button',
    overlay: 'slx-suite-overlay',
    panel: 'slx-suite-panel',
    style: 'slx-suite-style'
  };
  const STORAGE = {
    modules: 'SakaLuX_SUITE_MODULES_V1',
    settings: 'SakaLuX_SUITE_SETTINGS_V1',
    apiKey: 'SakaLuX_SUITE_TORN_API_KEY',
    migration: 'SakaLuX_SUITE_MIGRATION_V1'
  };

  const DEFAULT_SETTINGS = {
    buttonPosition: 'bottom-right',
    compactCards: false,
    showExperimentalNotice: true
  };

  const MODULE_DEFS = [
    {
      id: 'enhancer',
      name: 'Enhancer Guard',
      icon: '🛡️',
      category: 'Inventory',
      description: 'Enhancer inventory tracker and missing-item intelligence.',
      legacyGlobal: 'SakaLuXEnhancerGuard',
      legacyButton: '#sl-eg-button',
      openMethod: 'open',
      defaultEnabled: true,
      stage: 'BRIDGE'
    },
    {
      id: 'bazaar',
      name: 'Bazaar Thanker',
      icon: '💬',
      category: 'Trading',
      description: 'Buyer grouping, thank-you messages, statistics and history.',
      legacyGlobal: 'SakaLuXBazaarThanker',
      legacyButton: '#sakalux-bt-settings-button',
      openMethod: 'open',
      defaultEnabled: true,
      stage: 'BRIDGE'
    },
    {
      id: 'mission-rewards',
      name: 'Mission Rewards',
      icon: '🎯',
      category: 'Missions',
      description: 'Mission Shop values, ammo ownership and mod intelligence.',
      legacyGlobal: 'SakaLuXMissionRewards',
      legacyButton: '#sl-mri-button',
      openMethod: 'open',
      defaultEnabled: true,
      stage: 'BRIDGE'
    },
    {
      id: 'market-intelligence',
      name: 'Market Intelligence',
      icon: '📈',
      category: 'Trading',
      description: 'Travel, Bazaar, Item Market, Museum and basket optimization.',
      legacyGlobal: 'SakaLuXMarketIntelligence',
      legacyButton: '#sl-mi-button',
      openMethod: 'open',
      defaultEnabled: true,
      stage: 'BRIDGE'
    },
    {
      id: 'elimination-assistant',
      name: 'Elimination Assistant',
      icon: '⚔️',
      category: 'Combat',
      description: 'Eliminations target scoring, FF/BS estimates and learning.',
      legacyGlobal: 'SakaLuXEliminationAssistant',
      legacyButton: '#slx-elim-btn',
      openMethod: 'open',
      defaultEnabled: false,
      stage: 'BRIDGE'
    }
  ];

  const loadJson = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  let settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, {}) };
  let moduleState = loadJson(STORAGE.modules, {});
  let sharedApiKey = localStorage.getItem(STORAGE.apiKey) || '';

  for (const def of MODULE_DEFS) {
    if (typeof moduleState[def.id] !== 'boolean') moduleState[def.id] = Boolean(def.defaultEnabled);
  }
  saveJson(STORAGE.modules, moduleState);

  function getLegacyApi(def) {
    try { return window[def.legacyGlobal] || null; } catch { return null; }
  }

  function getLegacyVersion(def) {
    const api = getLegacyApi(def);
    try {
      if (api?.version) return String(api.version);
      const health = api?.health?.();
      return health?.version ? String(health.version) : null;
    } catch {
      return null;
    }
  }

  function isLegacyReady(def) {
    if (getLegacyApi(def)) return true;
    try { return Boolean(document.querySelector(def.legacyButton)); } catch { return false; }
  }

  function moduleStatus(def) {
    const enabled = Boolean(moduleState[def.id]);
    const ready = isLegacyReady(def);
    if (!enabled) return { key: 'off', label: 'OFF' };
    if (ready) return { key: 'ready', label: 'READY' };
    return { key: 'planned', label: 'WAITING' };
  }

  function injectCss() {
    if (document.getElementById(IDS.style)) return;
    const style = document.createElement('style');
    style.id = IDS.style;
    style.textContent = `
#${IDS.button}{position:fixed;z-index:2147483645;width:52px;height:52px;border-radius:50%;border:1px solid #b78b34;background:#171717;color:#f3c75f;font-size:23px;font-weight:900;box-shadow:0 5px 20px #0009;display:flex;align-items:center;justify-content:center;touch-action:manipulation}
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
#${IDS.panel}{width:min(720px,100%);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;background:#111318;color:#f3f4f6;border:1px solid #7c6233;border-radius:20px 20px 0 0;box-shadow:0 -12px 45px #000c}
.slxs-head{padding:16px 18px;border-bottom:1px solid #30333a;flex-shrink:0}.slxs-headrow{display:flex;gap:10px;align-items:flex-start}.slxs-titlebox{flex:1}.slxs-kicker{font-size:10px;letter-spacing:3px;color:#e8bf67;font-weight:900}.slxs-title{font-size:21px;font-weight:900;margin-top:5px}.slxs-sub{font-size:11px;color:#9ca3af;margin-top:5px;line-height:1.45}.slxs-close{width:38px;height:38px;border:1px solid #3b414c;border-radius:10px;background:#252933;color:#fff;font-size:21px}
.slxs-tools{padding:12px 16px;border-bottom:1px solid #2d3139;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.slxs-tool{border:1px solid #3a414d;background:#20242d;color:#fff;border-radius:10px;padding:10px;font-size:11px;font-weight:900}.slxs-tool.danger{border-color:#7d3447;color:#ff9bb3}
.slxs-api{margin:12px 16px;padding:14px;border:1px solid #5f5131;border-radius:14px;background:#17191f}.slxs-api-title{font-size:10px;letter-spacing:2px;color:#e8bf67;font-weight:900}.slxs-api-note{font-size:10px;color:#8e949f;margin-top:5px;line-height:1.4}.slxs-api-row{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.slxs-api input{min-width:0;background:#101218;color:#fff;border:1px solid #353b46;border-radius:9px;padding:10px}.slxs-api button{border:0;border-radius:9px;background:#d5a63e;color:#17120a;font-weight:900;padding:0 16px}
.slxs-body{overflow-y:auto;padding:0 16px 16px;-webkit-overflow-scrolling:touch}.slxs-cat{margin-top:12px;border:1px solid #2d3139;border-radius:14px;overflow:hidden;background:#15181e}.slxs-cat-title{padding:11px 14px;border-bottom:1px solid #2d3139;color:#e8bf67;font-size:10px;letter-spacing:2px;font-weight:900}.slxs-module{display:grid;grid-template-columns:1fr auto;gap:10px;padding:13px 14px;border-bottom:1px solid #282c33}.slxs-module:last-child{border-bottom:0}.slxs-name{font-size:14px;font-weight:900}.slxs-meta{font-size:10px;color:#9298a3;line-height:1.45;margin-top:5px}.slxs-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.slxs-badge{font-size:8px;font-weight:900;border:1px solid #3e4653;border-radius:999px;padding:3px 7px}.slxs-badge.ready{border-color:#2d7654;color:#8ee5b4}.slxs-badge.off{border-color:#7d3447;color:#ff9bb3}.slxs-badge.planned{border-color:#75622e;color:#e8bf67}.slxs-actions{display:flex;flex-direction:column;gap:7px;align-items:flex-end}.slxs-toggle{min-width:78px;border-radius:999px;padding:8px 12px;border:1px solid #7d3447;background:#411c28;color:#ffb3c4;font-size:10px;font-weight:900}.slxs-toggle.on{border-color:#2d7654;background:#183b2c;color:#9bf0bd}.slxs-open{border:1px solid #3a414d;background:#242a34;color:#fff;border-radius:8px;padding:7px 10px;font-size:9px;font-weight:900}.slxs-open:disabled{opacity:.35}
.slxs-foot{padding:11px 16px;border-top:1px solid #2d3139;background:#0e1014;color:#7f8590;font-size:9px;display:flex;justify-content:space-between;gap:10px;flex-shrink:0}.slxs-notice{margin:12px 16px 0;padding:11px;border:1px solid #6b5627;background:#282111;color:#e8c777;border-radius:10px;font-size:10px;line-height:1.45}
@media(min-width:700px){#${IDS.overlay}{align-items:center}#${IDS.panel}{border-radius:20px;max-height:88vh}.slxs-tools{grid-template-columns:repeat(4,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
  }

  function positionButton() {
    const button = document.getElementById(IDS.button);
    if (!button) return;
    ['top', 'bottom', 'left', 'right'].forEach(k => button.style.removeProperty(k));
    if (settings.buttonPosition === 'top-right') {
      button.style.top = '82px'; button.style.right = '12px';
    } else if (settings.buttonPosition === 'top-left') {
      button.style.top = '82px'; button.style.left = '12px';
    } else if (settings.buttonPosition === 'bottom-left') {
      button.style.bottom = '88px'; button.style.left = '12px';
    } else {
      button.style.bottom = '88px'; button.style.right = '12px';
    }
  }

  function createButton() {
    let button = document.getElementById(IDS.button);
    if (!button) {
      button = document.createElement('button');
      button.id = IDS.button;
      button.type = 'button';
      button.title = 'SakaLuX Suite';
      button.textContent = '☠';
      button.onclick = openSuite;
      document.body.appendChild(button);
    }
    positionButton();
  }

  function closeSuite() {
    document.getElementById(IDS.overlay)?.remove();
  }

  function moduleCard(def) {
    const enabled = Boolean(moduleState[def.id]);
    const status = moduleStatus(def);
    const version = getLegacyVersion(def);
    const ready = isLegacyReady(def);
    return `
      <div class="slxs-module" data-module="${escapeHtml(def.id)}">
        <div>
          <div class="slxs-name">${def.icon} ${escapeHtml(def.name)}</div>
          <div class="slxs-meta">${escapeHtml(def.description)}</div>
          <div class="slxs-badges">
            <span class="slxs-badge ${status.key}">${escapeHtml(status.label)}</span>
            <span class="slxs-badge planned">${escapeHtml(def.stage)}</span>
            ${version ? `<span class="slxs-badge ready">LEGACY v${escapeHtml(version)}</span>` : ''}
          </div>
        </div>
        <div class="slxs-actions">
          <button class="slxs-toggle ${enabled ? 'on' : ''}" data-toggle="${escapeHtml(def.id)}">${enabled ? 'ON' : 'OFF'}</button>
          <button class="slxs-open" data-open="${escapeHtml(def.id)}" ${ready && enabled ? '' : 'disabled'}>OPEN</button>
        </div>
      </div>`;
  }

  function openSuite() {
    closeSuite();
    const overlay = document.createElement('div');
    overlay.id = IDS.overlay;
    const categories = [...new Set(MODULE_DEFS.map(m => m.category))];
    overlay.innerHTML = `
      <div id="${IDS.panel}">
        <div class="slxs-head">
          <div class="slxs-headrow">
            <div class="slxs-titlebox">
              <div class="slxs-kicker">MASTER CONTROL • EXPERIMENTAL</div>
              <div class="slxs-title">☠ SakaLuX Suite</div>
              <div class="slxs-sub">One installation target. Enable only the modules you use. Existing standalone scripts are untouched in this prototype.</div>
            </div>
            <button class="slxs-close" id="slxs-close">×</button>
          </div>
        </div>
        ${settings.showExperimentalNotice ? `<div class="slxs-notice"><b>TEST BUILD v${VERSION}</b> — module switches currently control Suite state and bridge access to your existing scripts. The real module code will be moved inside Suite progressively after UI/performance testing.</div>` : ''}
        <div class="slxs-tools">
          <button class="slxs-tool" id="slxs-enable-ready">ENABLE READY</button>
          <button class="slxs-tool" id="slxs-disable-all">DISABLE ALL</button>
          <button class="slxs-tool" id="slxs-export">EXPORT SETTINGS</button>
          <button class="slxs-tool" id="slxs-import">IMPORT SETTINGS</button>
        </div>
        <div class="slxs-api">
          <div class="slxs-api-title">SHARED TORN API KEY</div>
          <div class="slxs-api-note">Stored only in this browser. It is not included in exported Suite settings. Future embedded modules will read this single shared key.</div>
          <div class="slxs-api-row"><input id="slxs-api-key" type="password" autocomplete="off" placeholder="Enter your Torn API key" value="${escapeHtml(sharedApiKey)}"><button id="slxs-save-key">SAVE KEY</button></div>
        </div>
        <div class="slxs-body">
          ${categories.map(cat => `<div class="slxs-cat"><div class="slxs-cat-title">${escapeHtml(cat.toUpperCase())}</div>${MODULE_DEFS.filter(m => m.category === cat).map(moduleCard).join('')}</div>`).join('')}
        </div>
        <div class="slxs-foot"><span>Active build: v${VERSION}</span><span>${BUILD}</span></div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = e => { if (e.target === overlay) closeSuite(); };
    document.getElementById('slxs-close').onclick = closeSuite;
    document.getElementById('slxs-save-key').onclick = saveSharedKey;
    document.getElementById('slxs-enable-ready').onclick = enableReady;
    document.getElementById('slxs-disable-all').onclick = disableAll;
    document.getElementById('slxs-export').onclick = exportSettings;
    document.getElementById('slxs-import').onclick = importSettings;
    overlay.querySelectorAll('[data-toggle]').forEach(btn => btn.onclick = () => toggleModule(btn.dataset.toggle));
    overlay.querySelectorAll('[data-open]').forEach(btn => btn.onclick = () => openLegacy(btn.dataset.open));
  }

  function toggleModule(id) {
    if (!(id in moduleState)) return;
    moduleState[id] = !moduleState[id];
    saveJson(STORAGE.modules, moduleState);
    openSuite();
  }

  function enableReady() {
    for (const def of MODULE_DEFS) if (isLegacyReady(def)) moduleState[def.id] = true;
    saveJson(STORAGE.modules, moduleState);
    openSuite();
  }

  function disableAll() {
    for (const def of MODULE_DEFS) moduleState[def.id] = false;
    saveJson(STORAGE.modules, moduleState);
    openSuite();
  }

  function saveSharedKey() {
    const input = document.getElementById('slxs-api-key');
    sharedApiKey = String(input?.value || '').trim();
    try { localStorage.setItem(STORAGE.apiKey, sharedApiKey); } catch {}
    const button = document.getElementById('slxs-save-key');
    if (button) {
      const old = button.textContent;
      button.textContent = 'SAVED ✓';
      setTimeout(() => { if (button.isConnected) button.textContent = old; }, 1200);
    }
  }

  function openLegacy(id) {
    const def = MODULE_DEFS.find(m => m.id === id);
    if (!def || !moduleState[id]) return false;
    const api = getLegacyApi(def);
    try {
      if (api && typeof api[def.openMethod] === 'function') {
        closeSuite();
        api[def.openMethod]();
        return true;
      }
    } catch (error) {
      console.error('[SakaLuX Suite] legacy API open failed', def.id, error);
    }
    const button = document.querySelector(def.legacyButton);
    if (button) {
      closeSuite();
      button.click();
      return true;
    }
    return false;
  }

  async function exportSettings() {
    const payload = JSON.stringify({
      app: 'SakaLuX Suite',
      version: VERSION,
      createdAt: Date.now(),
      settings,
      modules: moduleState
    });
    try {
      await navigator.clipboard.writeText(payload);
      alert('SakaLuX Suite settings copied to clipboard. API key was NOT included.');
    } catch {
      prompt('Copy Suite settings:', payload);
    }
  }

  function importSettings() {
    const raw = prompt('Paste SakaLuX Suite settings:');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.app !== 'SakaLuX Suite') throw new Error('Wrong backup type');
      settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
      const importedModules = data.modules && typeof data.modules === 'object' ? data.modules : {};
      for (const def of MODULE_DEFS) {
        if (typeof importedModules[def.id] === 'boolean') moduleState[def.id] = importedModules[def.id];
      }
      saveJson(STORAGE.settings, settings);
      saveJson(STORAGE.modules, moduleState);
      positionButton();
      openSuite();
    } catch {
      alert('Invalid SakaLuX Suite backup.');
    }
  }

  function migrateLegacyHints() {
    if (localStorage.getItem(STORAGE.migration)) return;
    const detected = MODULE_DEFS.filter(isLegacyReady).map(m => m.id);
    saveJson(STORAGE.migration, { at: Date.now(), detected });
  }

  function health() {
    return {
      version: VERSION,
      build: BUILD,
      modules: MODULE_DEFS.map(def => ({
        id: def.id,
        enabled: Boolean(moduleState[def.id]),
        legacyReady: isLegacyReady(def),
        legacyVersion: getLegacyVersion(def)
      })),
      sharedApiKeyStored: Boolean(sharedApiKey)
    };
  }

  window.SakaLuXSuite = {
    version: VERSION,
    build: BUILD,
    open: openSuite,
    close: closeSuite,
    health,
    setModuleEnabled(id, enabled) {
      if (!(id in moduleState)) return false;
      moduleState[id] = Boolean(enabled);
      saveJson(STORAGE.modules, moduleState);
      return true;
    },
    isModuleEnabled(id) { return Boolean(moduleState[id]); },
    getSharedApiKey() { return sharedApiKey; }
  };

  function init() {
    injectCss();
    createButton();
    migrateLegacyHints();
    window.dispatchEvent(new CustomEvent('SakaLuXSuiteReady', { detail: { version: VERSION, build: BUILD } }));
    console.log(`[SakaLuX Suite v${VERSION}] ${BUILD} loaded.`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
