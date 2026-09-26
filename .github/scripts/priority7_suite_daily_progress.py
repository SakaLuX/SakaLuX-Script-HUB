#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork/SakaLuX-Suite.md'
VERSION = '0.9.939'
BEGIN = '/* SakaLuX Suite Daily Progress — BEGIN */'
END = '/* SakaLuX Suite Daily Progress — END */'

BLOCK = r'''/* SakaLuX Suite Daily Progress — BEGIN */
(() => {
  'use strict';
  const VERSION = '1.0.0';
  const STORAGE_KEY = 'sakalux_suite_daily_progress_v1';
  const SUITE_SETTINGS_KEY = 'sakalux_master_suite_settings_v1';
  const PANEL_ID = 'sakalux-suite-daily-progress';
  const STYLE_ID = 'sakalux-suite-daily-progress-style';
  const BRIDGE_ID = 'sakalux-module-bridge-suite-daily-progress';
  const HISTORY_LIMIT = 30;
  const DEFAULT_OBJECTIVES = Object.freeze([
    { id: 'gym', label: 'Visit Gym', auto: 'gym' },
    { id: 'crimes', label: 'Check Crimes', auto: 'crimes' },
    { id: 'missions', label: 'Check Missions', auto: 'missions' },
    { id: 'oc', label: 'Check Faction / OC', auto: 'faction' },
    { id: 'travel', label: 'Check Travel', auto: 'travel' },
    { id: 'review', label: 'Review daily plan', auto: '' }
  ]);

  const clone = value => JSON.parse(JSON.stringify(value));
  function dayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  function safeParse(raw, fallback) { try { return JSON.parse(raw); } catch { return fallback; } }
  function defaultDay(key = dayKey()) {
    return { date: key, objectives: Object.fromEntries(DEFAULT_OBJECTIVES.map(x => [x.id, false])), custom: [], activities: [], updatedAt: Date.now() };
  }
  function normalizeStore(raw) {
    const store = raw && typeof raw === 'object' ? raw : {};
    const days = store.days && typeof store.days === 'object' ? store.days : {};
    return { schemaVersion: 1, days };
  }
  function loadStore() { return normalizeStore(safeParse(localStorage.getItem(STORAGE_KEY) || 'null', null)); }
  function saveStore(store) {
    const keys = Object.keys(store.days || {}).sort().reverse();
    for (const key of keys.slice(HISTORY_LIMIT)) delete store.days[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return store;
  }
  function ensureToday() {
    const store = loadStore();
    const key = dayKey();
    const day = store.days[key] && typeof store.days[key] === 'object' ? store.days[key] : defaultDay(key);
    day.objectives = { ...defaultDay(key).objectives, ...(day.objectives || {}) };
    day.custom = Array.isArray(day.custom) ? day.custom : [];
    day.activities = Array.isArray(day.activities) ? day.activities : [];
    day.updatedAt = Number(day.updatedAt) || Date.now();
    store.days[key] = day;
    saveStore(store);
    return { store, day };
  }
  function mutate(mutator) {
    const { store, day } = ensureToday();
    mutator(day);
    day.updatedAt = Date.now();
    saveStore(store);
    renderIfOpen();
    return clone(day);
  }
  function setObjective(id, value) {
    return mutate(day => {
      if (Object.prototype.hasOwnProperty.call(day.objectives, id)) day.objectives[id] = !!value;
      else {
        const row = day.custom.find(x => x.id === id);
        if (row) row.done = !!value;
      }
    });
  }
  function addObjective(label) {
    const text = String(label || '').trim().slice(0, 90);
    if (!text) return null;
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    mutate(day => day.custom.push({ id, label: text, done: false }));
    return id;
  }
  function removeObjective(id) { return mutate(day => { day.custom = day.custom.filter(x => x.id !== id); }); }
  function resetToday() {
    const store = loadStore();
    store.days[dayKey()] = defaultDay();
    saveStore(store);
    renderIfOpen();
    return clone(store.days[dayKey()]);
  }
  function classifyRoute(loc = location) {
    const text = `${loc.pathname || ''} ${loc.search || ''} ${loc.hash || ''}`.toLowerCase();
    if (/gym/.test(text)) return 'gym';
    if (/crime/.test(text)) return 'crimes';
    if (/mission/.test(text)) return 'missions';
    if (/faction|organized|oc\b/.test(text)) return 'faction';
    if (/travel|travelagency/.test(text)) return 'travel';
    return '';
  }
  function recordActivity(type, detail = '') {
    const clean = String(type || '').trim();
    if (!clean) return null;
    return mutate(day => {
      const now = Date.now();
      const last = day.activities[day.activities.length - 1];
      if (!last || last.type !== clean || now - Number(last.at || 0) > 30000) {
        day.activities.push({ type: clean, detail: String(detail || '').slice(0, 120), at: now });
        if (day.activities.length > 40) day.activities.splice(0, day.activities.length - 40);
      }
      for (const objective of DEFAULT_OBJECTIVES) if (objective.auto === clean) day.objectives[objective.id] = true;
    });
  }
  function moduleStatus() {
    const settings = safeParse(localStorage.getItem(SUITE_SETTINGS_KEY) || 'null', null);
    const modules = settings?.modules && typeof settings.modules === 'object' ? settings.modules : {};
    const values = Object.values(modules).filter(v => typeof v === 'boolean');
    const enabled = values.filter(Boolean).length;
    const rendered = document.querySelectorAll?.('[data-module-toggle]').length || 0;
    return { enabled, total: Math.max(values.length, rendered, 23) };
  }
  function summary() {
    const { day } = ensureToday();
    const fixed = DEFAULT_OBJECTIVES.map(x => ({ ...x, done: !!day.objectives[x.id] }));
    const custom = day.custom.map(x => ({ id: x.id, label: x.label, done: !!x.done, custom: true }));
    const all = [...fixed, ...custom];
    const done = all.filter(x => x.done).length;
    return { date: day.date, done, total: all.length, percent: all.length ? Math.round(done * 100 / all.length) : 0, objectives: all, activities: clone(day.activities), modules: moduleStatus() };
  }
  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
#${PANEL_ID}{position:fixed;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;padding:10px;background:rgba(3,7,12,.76);box-sizing:border-box;font-family:Inter,Arial,sans-serif}
#${PANEL_ID}.open{display:flex}#${PANEL_ID} .sdp-card{width:min(520px,100%);max-height:calc(100dvh - 24px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #344456;border-radius:16px;background:linear-gradient(155deg,#18212d,#0f161f);color:#e8eef5;box-shadow:0 22px 60px rgba(0,0,0,.6)}
#${PANEL_ID} .sdp-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.08)}#${PANEL_ID} .sdp-head b{font-size:15px}#${PANEL_ID} .sdp-close{border:0;background:transparent;color:#ddd;font-size:25px;line-height:1}
#${PANEL_ID} .sdp-body{padding:12px;overflow:auto;min-height:0}#${PANEL_ID} .sdp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px}#${PANEL_ID} .sdp-stat{padding:9px;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:#111a24;text-align:center}#${PANEL_ID} .sdp-stat strong{display:block;font-size:18px;color:#e0a557}#${PANEL_ID} .sdp-stat small{color:#98a5b3}
#${PANEL_ID} .sdp-bar{height:9px;margin:0 0 12px;border-radius:9px;background:#26313d;overflow:hidden}#${PANEL_ID} .sdp-bar>i{display:block;height:100%;background:#d89a48}
#${PANEL_ID} .sdp-list{display:grid;gap:6px}#${PANEL_ID} .sdp-row{display:flex;align-items:center;gap:9px;padding:8px 9px;border:1px solid rgba(255,255,255,.07);border-radius:9px;background:#121c27}#${PANEL_ID} .sdp-row.done{opacity:.66}#${PANEL_ID} .sdp-row label{flex:1}#${PANEL_ID} .sdp-row button{border:0;background:transparent;color:#cf7d7d;font-size:16px}
#${PANEL_ID} .sdp-section{margin-top:12px}#${PANEL_ID} .sdp-section h4{margin:0 0 7px;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#aab5c1}#${PANEL_ID} .sdp-add{display:flex;gap:7px}#${PANEL_ID} input[type=text]{flex:1;min-width:0;padding:8px;border:1px solid #344456;border-radius:8px;background:#0d141d;color:#eef3f8}#${PANEL_ID} .sdp-btn{padding:8px 10px;border:1px solid #3c4b5c;border-radius:8px;background:#172432;color:#eef3f8;font-weight:800}#${PANEL_ID} .sdp-reset{color:#f0b0b0}
#${PANEL_ID} .sdp-activity{font-size:11px;color:#9da9b6;display:grid;gap:4px}#${PANEL_ID} .sdp-foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.08)}#${PANEL_ID} .sdp-foot .sdp-btn{flex:1}
@media(max-width:700px){#${PANEL_ID}{padding:4px;align-items:stretch}#${PANEL_ID} .sdp-card{width:100%;max-height:calc(100dvh - 8px);margin:0}}
`;
    (document.head || document.documentElement).appendChild(style);
  }
  function render() {
    ensureStyle();
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      panel = document.createElement('div'); panel.id = PANEL_ID;
      panel.addEventListener('click', e => { if (e.target === panel) close(); });
      (document.body || document.documentElement).appendChild(panel);
    }
    const s = summary();
    const activities = s.activities.slice(-8).reverse().map(x => `<div>• ${esc(x.type)}${x.detail ? ` — ${esc(x.detail)}` : ''}</div>`).join('') || '<div>No activity recorded today.</div>';
    panel.innerHTML = `<div class="sdp-card"><div class="sdp-head"><div><b>📅 Daily Progress</b><div style="font-size:10px;color:#98a5b3">${esc(s.date)}</div></div><button class="sdp-close" type="button" data-sdp-close>×</button></div><div class="sdp-body"><div class="sdp-stats"><div class="sdp-stat"><strong>${s.percent}%</strong><small>progress</small></div><div class="sdp-stat"><strong>${s.done}/${s.total}</strong><small>objectives</small></div><div class="sdp-stat"><strong>${s.modules.enabled}/${s.modules.total}</strong><small>modules ON</small></div></div><div class="sdp-bar"><i style="width:${s.percent}%"></i></div><div class="sdp-list">${s.objectives.map(x => `<div class="sdp-row ${x.done?'done':''}"><input type="checkbox" data-sdp-id="${esc(x.id)}" ${x.done?'checked':''}><label>${esc(x.label)}</label>${x.custom?`<button type="button" data-sdp-remove="${esc(x.id)}" title="Remove">×</button>`:''}</div>`).join('')}</div><div class="sdp-section"><h4>Add objective</h4><div class="sdp-add"><input type="text" maxlength="90" data-sdp-new placeholder="Custom daily objective"><button class="sdp-btn" type="button" data-sdp-add>Add</button></div></div><div class="sdp-section"><h4>Recent activity</h4><div class="sdp-activity">${activities}</div></div></div><div class="sdp-foot"><button class="sdp-btn sdp-reset" type="button" data-sdp-reset>Reset today</button><button class="sdp-btn" type="button" data-sdp-close>Close</button></div></div>`;
    panel.querySelectorAll('[data-sdp-id]').forEach(el => el.addEventListener('change', () => setObjective(el.dataset.sdpId, el.checked)));
    panel.querySelectorAll('[data-sdp-remove]').forEach(el => el.addEventListener('click', () => removeObjective(el.dataset.sdpRemove)));
    panel.querySelectorAll('[data-sdp-close]').forEach(el => el.addEventListener('click', close));
    panel.querySelector('[data-sdp-add]')?.addEventListener('click', () => { const input=panel.querySelector('[data-sdp-new]'); if(addObjective(input?.value)) render(); });
    panel.querySelector('[data-sdp-new]')?.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); const id=addObjective(e.currentTarget.value); if(id) render(); }});
    panel.querySelector('[data-sdp-reset]')?.addEventListener('click', () => { if (confirm('Reset today\'s Daily Progress?')) resetToday(); });
    return panel;
  }
  function renderIfOpen() { const panel=document.getElementById(PANEL_ID); if(panel?.classList.contains('open')) render().classList.add('open'); }
  function open() { const panel=render(); panel.classList.add('open'); return true; }
  function close() { document.getElementById(PANEL_ID)?.classList.remove('open'); return true; }
  function ensureBridge() {
    let bridge=document.getElementById(BRIDGE_ID);
    if(!bridge){ bridge=document.createElement('button'); bridge.id=BRIDGE_ID; bridge.type='button'; bridge.hidden=true; (document.body||document.documentElement).appendChild(bridge); }
    bridge.dataset.version=VERSION; bridge.onclick=()=>{ const action=bridge.dataset.action||'open'; if(action==='open') open(); else if(action==='reset') resetToday(); bridge.dataset.action=''; };
  }
  function routeActivity() { const type=classifyRoute(); if(type) recordActivity(type, `${location.pathname}${location.search}${location.hash}`); }
  document.addEventListener('click', e => { if(e.target?.closest?.('[data-action="daily-progress"]')) { e.preventDefault(); open(); } }, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ensureBridge();routeActivity();},{once:true}); else {ensureBridge();routeActivity();}
  try { globalThis.SakaLuXCore?.router?.onChange?.(()=>{ensureBridge();routeActivity();}); globalThis.SakaLuXCore?.router?.bind?.(); } catch {}
  globalThis.SakaLuXSuiteDailyProgress = Object.freeze({ version:VERSION, storageKey:STORAGE_KEY, dayKey, get:()=>clone(ensureToday().day), summary, setObjective, addObjective, removeObjective, recordActivity, resetToday, open, close, moduleStatus });
})();
/* SakaLuX Suite Daily Progress — END */'''

text = SUITE.read_text(encoding='utf-8')
if BEGIN in text:
    text = re.sub(re.escape(BEGIN) + r'[\s\S]*?' + re.escape(END), BLOCK, text, count=1)
else:
    text = text.rstrip() + '\n\n' + BLOCK + '\n'
text = re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m.group(1) + VERSION, text, count=1)
text = re.sub(r"const VERSION = '0\.9\.\d+';\s*\n\s*const SUITE = Object\.freeze", f"const VERSION = '{VERSION}';\n  const SUITE = Object.freeze", text, count=1)
button = '          <button class="sakalux-suite-btn" type="button" data-action="daily-progress">Daily Progress</button>\n'
if 'data-action="daily-progress"' not in text[:text.find(BEGIN) if BEGIN in text else len(text)]:
    anchor = '          <button class="sakalux-suite-btn" type="button" data-action="disable-all">Disable All</button>\n'
    if anchor not in text: raise RuntimeError('Suite toolbar anchor not found')
    text = text.replace(anchor, anchor + button, 1)
SUITE.write_text(text, encoding='utf-8')

doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v0\.9\.\d+\*\*$', f'**v{VERSION}**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v0\.9\.\d+\*\*$', f'- Canonical version: **v{VERSION}**', doc, count=1)
doc = re.sub(r'(?s)## Current release note\n\n\*\*.*?\*\*\n(?:- .*\n)+', f'## Current release note\n\n**v{VERSION} — Suite Daily Progress Dashboard**\n- Adds a persistent daily progress dashboard with objectives, route activity and Suite module status.\n- Supports custom daily objectives, automatic local-day rollover, reset-today and 30-day bounded history.\n- Adds a Daily Progress action directly to Suite Master Control and a public bridge/API for reliable opening.\n', doc, count=1)
entry = f'''\n### v{VERSION} — Suite Daily Progress Dashboard\n- Adds a mobile-first Daily Progress dashboard to Suite Master Control.\n- Tracks daily objectives, recent route activity and enabled Suite-module status locally.\n- Automatically marks Gym, Crimes, Missions, Faction/OC and Travel checks when those routes are visited; Review daily plan remains manual.\n- Supports custom objectives, day rollover, reset-today and a bounded 30-day local history.\n- Exposes `SakaLuXSuiteDailyProgress` plus the hidden `sakalux-module-bridge-suite-daily-progress` bridge; no API key or remote sync is required.\n\n'''
marker = '## Release history / Changelog\n'
if f'### v{VERSION} ' not in doc:
    if marker not in doc: raise RuntimeError('Suite changelog marker missing')
    doc = doc.replace(marker, marker + entry, 1)
DOC.write_text(doc, encoding='utf-8')
print(f'Priority 7 Suite Daily Progress applied: v{VERSION}')
