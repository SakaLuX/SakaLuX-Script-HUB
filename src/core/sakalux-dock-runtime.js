/* SakaLuX Shared Dock Runtime v1 - Priority 6 foundation
 * Source-only module. Not installed directly by users.
 * Intended to be embedded with Shared Core into standalone userscripts.
 */
(() => {
  'use strict';

  const g = globalThis;
  const NS = 'SakaLuXDockRuntime';
  const VERSION = '1.0.0-test.1';
  const IDS = Object.freeze({
    dock: 'sakalux-standalone-dock',
    prompt: 'sakalux-hub-install-prompt',
    native: 'sakalux-standalone-native-s',
    fallback: 'sakalux-standalone-fallback-s',
    style: 'sakalux-standalone-dock-runtime-style'
  });

  if (g[NS]?.version === VERSION) return;

  const modules = g.__SakaLuXDockRuntimeModules instanceof Map
    ? g.__SakaLuXDockRuntimeModules
    : new Map();
  g.__SakaLuXDockRuntimeModules = modules;

  function core() { return g.SakaLuXCore || null; }
  function doc() { return typeof document === 'undefined' ? null : document; }
  function hubInstalled() { return Boolean(core()?.hub?.installed?.()); }

  function normalize(entry = {}) {
    const id = String(entry.id || '').trim();
    if (!id) throw new Error('Dock module id is required');
    return Object.freeze({
      id,
      name: String(entry.name || id),
      icon: String(entry.icon || '🧩'),
      open: typeof entry.open === 'function' ? entry.open : null,
      enabled: typeof entry.enabled === 'function' ? entry.enabled : () => true
    });
  }

  function sorted() {
    const values = [...modules.values()];
    const sorter = core()?.dock?.sort;
    return typeof sorter === 'function' ? sorter.call(core().dock, values) : values;
  }

  function removeNode(id) { try { doc()?.getElementById(id)?.remove(); } catch {} }

  function removeUi() {
    removeNode(IDS.dock);
    removeNode(IDS.prompt);
    removeNode(IDS.native);
    removeNode(IDS.fallback);
  }

  function addStyle() {
    const d = doc();
    if (!d || d.getElementById(IDS.style)) return;
    const style = d.createElement('style');
    style.id = IDS.style;
    style.textContent = `
#${IDS.dock}{position:fixed;right:10px;bottom:52px;z-index:2147482500;min-width:210px;max-width:min(320px,calc(100vw - 20px));padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#0b1118;color:#eaf0f6;font:600 11px/1.25 Arial,sans-serif;box-shadow:0 14px 32px rgba(0,0,0,.38)}
#${IDS.dock}[hidden]{display:none!important}
#${IDS.dock} .sl-dock-row{display:flex;align-items:center;gap:8px;width:100%;min-height:34px;margin:0 0 6px;padding:7px 9px;border:1px solid rgba(255,255,255,.09);border-radius:9px;background:#111b26;color:#eaf0f6;text-align:left}
#${IDS.dock} .sl-dock-row:last-child{margin-bottom:0}
#${IDS.dock} .sl-dock-row[disabled]{opacity:.45}
#${IDS.native},#${IDS.fallback}{position:fixed;right:10px;bottom:10px;z-index:2147482400;width:38px;height:38px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:#0b1118;color:#e9a84d;font:800 15px/1 Arial,sans-serif}
`;
    (d.head || d.documentElement).appendChild(style);
  }

  function toggleDock(force) {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return false; }
    render();
    const panel = d.getElementById(IDS.dock);
    if (!panel) return false;
    const show = typeof force === 'boolean' ? force : panel.hidden;
    panel.hidden = !show;
    return show;
  }

  function ensureLauncher() {
    const d = doc();
    if (!d || hubInstalled()) { removeUi(); return null; }
    let button = d.getElementById(IDS.fallback);
    if (!button) {
      button = d.createElement('button');
      button.id = IDS.fallback;
      button.type = 'button';
      button.textContent = 'S';
      button.title = 'SakaLuX Scripts';
      button.addEventListener('click', () => toggleDock());
      (d.body || d.documentElement).appendChild(button);
    }
    return button;
  }

  function render() {
    const d = doc();
    if (!d) return null;
    if (hubInstalled()) {
      try { d.documentElement?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      try { d.body?.setAttribute('data-sakalux-hub-active', '1'); } catch {}
      removeUi();
      return null;
    }
    try { d.body?.removeAttribute('data-sakalux-hub-active'); } catch {}
    addStyle();
    ensureLauncher();
    let panel = d.getElementById(IDS.dock);
    if (!panel) {
      panel = d.createElement('div');
      panel.id = IDS.dock;
      panel.hidden = true;
      (d.body || d.documentElement).appendChild(panel);
    }
    panel.replaceChildren();
    for (const entry of sorted()) {
      const button = d.createElement('button');
      button.type = 'button';
      button.className = 'sl-dock-row';
      button.dataset.moduleId = entry.id;
      button.textContent = `${entry.icon} ${entry.name}`;
      let enabled = true;
      try { enabled = entry.enabled() !== false; } catch { enabled = false; }
      button.disabled = !enabled || !entry.open;
      button.addEventListener('click', () => {
        try { entry.open?.(); } finally { panel.hidden = true; }
      });
      panel.appendChild(button);
    }
    return panel;
  }

  function register(entry) {
    const normalized = normalize(entry);
    modules.set(normalized.id, normalized); // latest registration wins
    render();
    return normalized;
  }

  function unregister(id) {
    const removed = modules.delete(String(id || ''));
    render();
    return removed;
  }

  function list() { return Object.freeze(sorted().map(item => Object.freeze({ ...item }))); }

  const api = Object.freeze({ version: VERSION, ids: IDS, register, unregister, list, render, toggleDock, removeUi, hubInstalled });
  g[NS] = api;

  try { g.addEventListener?.('SakaLuX:ScriptHubReady', () => removeUi(), { passive: true }); } catch {}
})();
