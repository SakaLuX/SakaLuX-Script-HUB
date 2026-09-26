'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('src/core/sakalux-core.js', 'utf8');

function boot(name, initial = {}) {
  const values = new Map(Object.entries(initial));
  const localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(String(key), String(value)),
    removeItem: key => values.delete(String(key))
  };
  const context = {
    GM_info: { script: { name } },
    localStorage,
    console,
    URL,
    setTimeout: () => 1,
    clearTimeout() {},
    fetch: async () => ({ status: 200, text: async () => '{}' }),
    location: { origin: 'https://www.torn.com', pathname: '/', search: '', hash: '' },
    addEventListener() {},
    globalThis: null
  };
  context.globalThis = context;
  vm.runInNewContext(source, context);
  return { context, values };
}

{
  const { context, values } = boot('SakaLuX Market Intelligence', {
    SakaLuX_MI_SETTINGS_V2: JSON.stringify({ enabled: true, compact: false })
  });
  const status = context.SakaLuXCore.settings.status('market-intelligence');
  assert.equal(context.SakaLuXCore.version, '1.1.0');
  assert.equal(status.version, 1);
  assert.equal(status.fallback, false);
  assert.deepEqual(JSON.parse(values.get('SakaLuX_MI_SETTINGS_V2')), { enabled: true, compact: false });
  assert.ok(values.has('SakaLuX_SettingsBackup::market-intelligence'));
}

{
  const { context, values } = boot('Unknown test userscript', { custom: JSON.stringify({ count: 2 }) });
  const status = context.SakaLuXCore.settings.register({
    id: 'custom', version: 2, keys: ['custom'],
    migrations: {
      1: value => ({ ...value, enabled: true }),
      2: value => ({ ...value, count: Number(value.count || 0) + 1 })
    }
  });
  assert.equal(status.version, 2);
  assert.equal(status.migrated, true);
  assert.deepEqual(JSON.parse(values.get('custom')), { count: 3, enabled: true });
  const second = context.SakaLuXCore.settings.register({ id: 'custom', version: 2, keys: ['custom'] });
  assert.equal(second.version, 2);
  assert.deepEqual(JSON.parse(values.get('custom')), { count: 3, enabled: true });
}

{
  const backup = { version: 1, at: 1, values: { broken: JSON.stringify({ restored: true }) } };
  const { context, values } = boot('Unknown test userscript', {
    broken: '{bad json',
    'SakaLuX_SettingsBackup::recover': JSON.stringify(backup)
  });
  const status = context.SakaLuXCore.settings.register({ id: 'recover', version: 1, keys: ['broken'] });
  assert.deepEqual(JSON.parse(values.get('broken')), { restored: true });
  assert.deepEqual(Array.from(status.recovered), ['broken']);
}

{
  const { context, values } = boot('Unknown test userscript', { broken: '{bad json' });
  const status = context.SakaLuXCore.settings.register({ id: 'fallback', version: 1, keys: ['broken'] });
  assert.equal(values.has('broken'), false);
  assert.equal(status.fallback, true);
  assert.deepEqual(Array.from(status.reset), ['broken']);
}

{
  const { context, values } = boot('Unknown test userscript', {
    custom: JSON.stringify({ stable: true }),
    'SakaLuX_SettingsSchema::custom': JSON.stringify({ version: 4 })
  });
  const status = context.SakaLuXCore.settings.register({ id: 'custom', version: 2, keys: ['custom'] });
  assert.equal(status.version, 4, 'schema registration must never downgrade stored settings');
  assert.deepEqual(JSON.parse(values.get('custom')), { stable: true });
}

const catalogIds = new Set(boot('Unknown').context.SakaLuXCore.settings.catalog.map(entry => entry.id));
for (const id of [
  'account-auditor', 'bazaar-smart-pricer', 'bazaar', 'chat-intelligence',
  'company-intelligence', 'elimination-assistant', 'enhancer', 'market-intelligence',
  'mission-rewards', 'script-hub', 'stock-manager-advisor', 'suite'
]) assert.ok(catalogIds.has(id), `missing settings schema catalog entry: ${id}`);

console.log('Shared Core settings schema, migration, recovery, fallback and no-downgrade regressions passed.');
