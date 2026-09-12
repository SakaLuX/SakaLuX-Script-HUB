// ==UserScript==
// @name         SakaLuX Script Hub
// @namespace    sakalux.script.hub
// @version      1.9.26
// @description  Premium TornPDA control center for SakaLuX add-ons with clean module cards, persistent slide switches and one-tap panel access.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @connect      raw.githubusercontent.com
// @connect      api.torn.com
// @license      All Rights Reserved
// @downloadURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
// @updateURL https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js
// ==/UserScript==

/*
 * Copyright © 2026 SakaLuX [2380374]
 * All Rights Reserved.
 *
 * Personal use and private modification are permitted.
 * Redistribution, republication, rebranding, or publication of
 * modified versions requires prior written permission from
 * SakaLuX [2380374].
 *
 * Original author attribution must be retained in all authorized
 * derivative works.
 */

(function () {
    'use strict';

    const VERSION = '1.9.26';
    const PROFILE_XID = '2380374';
    const PROFILE_URL = 'https://www.torn.com/profiles.php?XID=' + PROFILE_XID;
    const REGISTRY_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/scripts.json';
    const LOCALES_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/locales.json';
    const SHARED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,money,travel,equipment,inventory,battlestats,ammo&torn=items,elimination,eliminationteam&market=itemmarket';
    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;

    const HUB_CHANGELOG = [
        {
            version: '1.9.26',
            date: '2026-09-12',
            changes: [
                'Fixes false standalone mode detection when the Hub is already installed.',
                'Marks the page as Hub-active and removes stale standalone dock/install prompts from older add-ons.',
                'Keeps native S and Fly-out HUB launchers as authoritative Hub-presence signals.'
            ]
        },
        {
            version: '1.9.25',
            date: '2026-09-12',
            changes: [
                'The S badge inside the standalone dock now closes the dock when tapped.',
                'Kept the native Torn S status launcher as the primary open/close toggle.',
                'Added accessible button semantics and touch feedback without changing the final dock layout.'
            ]
        },
        {
            version: '1.9.24',
            date: '2026-09-12',
            changes: [
                'Final standalone dock polish with icon badges and true optical centering.',
                'Refined compact spacing, borders, shadows and Hub install action for a more professional mobile presentation.',
                'Keeps the native S launcher after cash and the shared 12-hour Hub reminder behavior.'
            ]
        },
        {
            version: '1.9.23',
            date: '2026-09-12',
            changes: [
                'Refined the standalone SakaLuX dock into a smaller centered premium layout.',
                'Centered module names visually while preserving dedicated icons and native S launcher control.',
                'Kept the shared Hub install reminder limited to once every 12 hours.'
            ]
        },
        {
            version: '1.9.22',
            date: '2026-09-12',
            changes: [
                'Refined standalone add-on launcher into a smaller professional dock.',
                'Replaced the dock + control with a native gold S status-bar launcher mounted after cash.',
                'Added compact fallback S launcher only when Torn statusIcons are unavailable.'
            ]
        },
        {
            version: '1.9.18',
            date: '2026-09-12',
            changes: [
                'Fixed the floating skull fallback so it is hidden whenever the native S status-bar launcher is mounted.',
                'The floating skull now appears only when neither the S status-bar launcher nor the Fly-out HUB skull is available.',
                'Keeps the Fly-out HUB skull before Messages when that navigation bar is present.'
            ]
        },
        {
            version: '1.9.17',
            date: '2026-09-12',
            changes: [
                'Keeps the S launcher as the first Torn statusIcons item before cash.',
                'Restores the native skull launcher before Messages when Touchscreen Navigation exposes the Fly-out sidebar.',
                'Uses the on-screen floating skull only when the Fly-out sidebar navigation is unavailable.'
            ]
        },
        {
            version: '1.9.16',
            date: '2026-09-12',
            changes: [
                'Places the native SakaLuX Hub launcher as the first item in Torn statusIcons so it appears before the cash resource on the current mobile layout.',
                'Removed the unreliable money-cell detection introduced in v1.9.15.',
                'Keeps Fortie-style statusIcons mounting, native class inheritance and skull fallback unchanged.'
            ]
        },
        {
            version: '1.9.15',
            date: '2026-09-12',
            changes: [
                'Positions the native SakaLuX Hub status icon immediately before Torn money/cash when that native cell is identifiable.',
                'Keeps the Fortie-style statusIcons mounting and native class inheritance unchanged.',
                'Falls back to the end of the native status row only if Torn money/cash cannot be identified.'
            ]
        },
        {
            version: '1.9.14',
            date: '2026-09-12',
            changes: [
                'Rebuilt the Hub launcher using Torn native statusIcons detection, matching the proven Fortie mounting strategy.',
                'The launcher now copies native Torn status-cell classes and mounts as a real 17px status icon.',
                'The floating skull is used only when Torn statusIcons are unavailable.'
            ]
        },
        {
            version: '1.9.13',
            date: '2026-09-12',
            changes: [
                'Moved the primary Hub launcher into Torn resource/status bar before the money resource when available.',
                'Replaced the native navigation skull entry with a compact SakaLuX S launcher.',
                'The floating skull now appears only as an automatic fallback when the resource bar cannot be detected.'
            ]
        },
        {
            version: '1.9.12',
            date: '2026-09-12',
            changes: [
                'Made English the guaranteed standalone default for every SakaLuX script.',
                'Added an extensible locale registry loaded by Hub with bundled English/Romanian fallback.',
                'Language options are now generated from the registry so future languages require no UI code changes.'
            ]
        },
        {
            version: '1.9.11',
            date: '2026-09-12',
            changes: [
                'Added a persistent Language selector beside Fallback button position.',
                'Added shared English and Romanian UI localization for SakaLuX Hub and add-on panels.',
                'Language changes apply immediately to existing and dynamically rendered SakaLuX interfaces.'
            ]
        },
        {
            version: '1.9.10',
            date: '2026-09-11',
            changes: [
                'Fixed false OFF and INSTALL states in Violentmonkey isolated userscript sandboxes on macOS and desktop browsers.',
                'Installation markers are checked before sandboxed window APIs, with legacy Elimination marker support.',
                'Added hidden DOM control bridges so ON/OFF and OPEN work across isolated userscript contexts.'
            ]
        },
        {
            version: '1.9.9',
            date: '2026-09-11',
            changes: [
                'Removed the floating Made with love badge from Torn pages.',
                'Moved the author signature inside each script panel as the final panel footer, matching Script Hub.',
                'Kept SakaLuX [2380374] clickable to the Torn profile.'
            ]
        },
        {
            version: '1.9.8',
            date: '2026-09-11',
            changes: [
                'Restored the Made with ❤️ by SakaLuX [2380374] footer in Hub with the author name and ID linked to the Torn profile.',
                'Added one persistent shared SakaLuX author footer across every current userscript.',
                'Refined Market Intelligence header text and enlarged its close button to match Hub.'
            ]
        },
        {
            version: '1.9.7',
            date: '2026-09-11',
            changes: [
                'Embedded the unified SakaLuX Control Center theme directly into every current SakaLuX userscript.',
                'Managed add-ons now keep the same visual language even when used without Script Hub.',
                'Account Auditor and Suite receive the same self-contained visual layer while remaining standalone and absent from the Hub registry.',
                'Synchronized all managed add-on patch versions across scripts.json, Hub fallback data and documentation.'
            ]
        },
        {
            version: '1.9.6',
            date: '2026-09-11',
            changes: [
                'Added one unified SakaLuX Control Center visual theme for all current SakaLuX script interfaces.',
                'Standardized dark panels, borders, buttons, fields, cards, overlays and mobile spacing across Hub add-ons.',
                'Converted compatible prefixed settings checkboxes to the same sliding-switch visual language used by Hub.',
                'Includes visual support for Account Auditor and Suite when they are installed, without registering either standalone tool in Hub.',
                'The theme is CSS-only for external module panels and does not change their feature logic or saved data.'
            ]
        },
        {
            version: '1.9.5',
            date: '2026-09-11',
            changes: [
                'Converted Hub Settings boolean options to professional slide switches.',
                'Removed the duplicate Refresh scripts.json and Check updates now buttons from Settings.',
                'CHECK now refreshes the live scripts.json registry before checking published add-on versions.',
                'UPDATE now refreshes the live registry and update state before opening available installers.',
                'Removed the fallback-skull long-press Quick Menu option and its runtime gesture handling.'
            ]
        },
        {
            version: '1.9.4',
            date: '2026-09-11',
            changes: [
                'Redesigned the Hub as a premium SakaLuX Control Center with a cleaner visual hierarchy and stronger TornPDA readability.',
                'Rebuilt the header, health summary, command bar, category navigation and module cards around a consistent dark control-room design.',
                'Replaced icon-only management tools with clear labelled actions while keeping the interface compact on mobile.',
                'Added concise module status chips so installed version, update state, health and category are easier to scan.',
                'Preserved the existing registry, update, shared API key, module power and native HUB launcher behavior.'
            ]
        },
        {
            version: '1.9.1',
            date: '2026-09-10',
            changes: [
                'Made scripts.json the canonical minimum version so Latest can never fall behind Registry.',
                'Invalidates update cache whenever a registry version changes.',
                'Uses the current GitHub userscript source when the Greasy Fork mirror is behind, preventing downgrades.',
                'Synchronized the offline fallback registry and added automated cross-file version checks.'
            ]
        },
        {
            version: '1.9.0',
            date: '2026-09-10',
            changes: [
                'Redesigned the Hub as a cleaner professional TornPDA control center.',
                'Replaced every module action cluster with one persistent ON/OFF slide switch and one OPEN or SETTINGS button.',
                'Removed favorite, refresh, scan, calibration, key and navigation buttons from module cards.',
                'All managed add-ons now use the same native setEnabled, toggleEnabled and isEnabled power API.',
                'Added one shared Hub Torn API key with a general key creator; installed add-ons automatically prefer it while retaining standalone key support.',
                'Kept update, diagnostics and management tools in the Hub header instead of repeating them on every card.'
            ]
        },
        {
            version: '1.8.6',
            date: '2026-08-24',
            changes: [
                'Fixed false UPDATE AVAILABLE states caused by cached checks from an older installed add-on version.',
                'Cached update data is now fresh only when its recorded installed version still matches the version currently loaded.',
                'Update cards, counters and HUB alert badge now recalculate availability from Latest versus Installed before rendering.',
                'Added Market Intelligence v1.1.1 to the offline fallback registry and its ready-event integration.'
            ]
        }
    ];

    const STORAGE = {
        settings: 'SakaLuX_HUB_SETTINGS_V16',
        favorites: 'SakaLuX_HUB_FAVORITES_V16',
        usage: 'SakaLuX_HUB_USAGE_V16',
        updates: 'SakaLuX_HUB_UPDATES_V16',
        registry: 'SakaLuX_HUB_REGISTRY_V18',
        locales: 'SakaLuX_HUB_LOCALES_V1',
        modulePower: 'SakaLuX_HUB_MODULE_POWER_V19',
        apiKey: 'SakaLuX_HUB_TORN_API_KEY'
    };

    const DEFAULT_SETTINGS = {
        hideIndividualButtons: true,
        buttonPosition: 'top-right',
        buttonSize: 48,
        language: 'en',
        autoCheckUpdates: true,
        showTopbarSkull: true
    };

    const FALLBACK_REGISTRY = {
        scripts: [
            {
                id: 'enhancer', type: 'addon', active: true,
                name: 'Enhancer Guard', icon: '🛡️', category: 'Inventory', version: '1.3.27',
                description: 'Advanced Enhancer inventory tracker for Torn PDA / Tampermonkey.',
                greasyForkId: '592698',
                metaUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Enhancer-Guard.user.js',
                apiGlobal: 'SakaLuXEnhancerGuard', buttonSelector: '#sl-eg-button',
                quickActions: [
                    { id: 'open', label: 'OPEN', icon: '🛡️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'hardRefresh', label: 'HARD', icon: '⚡', method: 'hardRefresh' }
                ]
            },
            {
                id: 'bazaar', type: 'addon', active: true,
                name: 'Bazaar Thanker', icon: '💬', category: 'Trading', version: '5.3.17',
                description: 'Bazaar buyer grouping, thank-you messages, statistics and history management.',
                greasyForkId: '592388',
                metaUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Thanker-PDA.user.js',
                apiGlobal: 'SakaLuXBazaarThanker', buttonSelector: '#sakalux-bt-settings-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'events', label: 'EVENTS', icon: '📋', method: 'goToEvents', fallbackUrl: 'https://www.torn.com/page.php?sid=events' }
                ]
            },
            {
                id: 'mission-rewards', type: 'addon', active: true,
                name: 'Mission Rewards', icon: '🎯', category: 'Missions', version: '1.0.15',
                description: 'Mission Shop reward values, value per credit, ammo ownership and weapon mod tracking.',
                greasyForkId: '592711',
                metaUrl: 'https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js',
                apiGlobal: 'SakaLuXMissionRewards', buttonSelector: '#sl-mri-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' },
                    { id: 'missions', label: 'MISSIONS', icon: '🎯', method: 'goToMissions', fallbackUrl: 'https://www.torn.com/page.php?sid=missions' }
                ]
            },
            {
                id: 'market-intelligence', type: 'addon', active: true,
                name: 'Market Intelligence', icon: '📈', category: 'Trading', version: '1.17.15',
                description: 'Market and travel intelligence with clickable Best Travel Run routes, stock/restock ETA, Bazaar deals, Item Market watchlist, Items, Museum and Points Market support.',
                greasyForkId: '592781',
                metaUrl: 'https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Market-Intelligence.user.js',
                apiGlobal: 'SakaLuXMarketIntelligence', buttonSelector: '#sl-mi-button',
                quickActions: [
                    { id: 'open', label: 'SETTINGS', icon: '⚙️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' },
                    { id: 'best-run', label: 'BEST RUN', icon: '✈️', method: 'goToBestRun', fallbackUrl: 'https://www.torn.com/page.php?sid=travel' },
                    { id: 'market', label: 'MARKET', icon: '📈', method: 'goToMarket', fallbackUrl: 'https://www.torn.com/page.php?sid=ItemMarket' }
                ]
            },
            {
                id: 'elimination-assistant', type: 'addon', active: true,
                name: 'Elimination Assistant', icon: '⚔️', category: 'Combat', version: '1.3.27',
                description: 'Eliminations advisor with rotating target batches, availability status and TornPDA export.',
                greasyForkId: '594921',
                metaUrl: 'https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js',
                downloadUrl: 'https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js',
                sourceUrl: 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant.user.js',
                apiGlobal: 'SakaLuXEliminationAssistant', buttonSelector: '#slx-elim-btn',
                quickActions: [
                    { id: 'open', label: 'OPEN', icon: '⚔️', method: 'open' },
                    { id: 'refresh', label: 'REFRESH', icon: '🔄', method: 'refresh' }
                ]
            }
        ]
    };

    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        topSkull: 'sakalux-hub-top-skull',
        topBadge: 'sakalux-hub-top-badge',
        navSkull: 'sakalux-hub-nav-skull',
        navBadge: 'sakalux-hub-nav-badge',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };

    let registry = loadJson(STORAGE.registry, FALLBACK_REGISTRY);
    let SCRIPTS = normalizeRegistry(registry);
    let settings = { ...DEFAULT_SETTINGS, ...loadJson(STORAGE.settings, DEFAULT_SETTINGS) };
    delete settings.longPressQuickMenu;
    let favorites = new Set(loadJson(STORAGE.favorites, []));
    let usage = loadJson(STORAGE.usage, {});
    let updateCache = loadJson(STORAGE.updates, {});
    let modulePower = loadJson(STORAGE.modulePower, {});
    let category = 'ALL';
    let registryStatus = 'cached';
    let updateCheckRunning = false;
    let observer = null;
    let observerTimer = null;

    function loadJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveJson(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }

    const UI_RO = {
        'Settings':'Setări','Hub Settings':'Setări Hub','Configuration':'Configurare','Language':'Limbă','English':'English','Romanian':'Română',
        'Fallback button position':'Poziția butonului de rezervă','Fallback button size':'Dimensiunea butonului de rezervă',
        'Top right':'Dreapta sus','Middle right':'Dreapta mijloc','Bottom right':'Dreapta jos','Top left':'Stânga sus',
        'Save':'Salvează','Save Settings':'Salvează setările','Close':'Închide','Back':'Înapoi','Refresh':'Reîmprospătează',
        'Hard Refresh':'Reîmprospătare completă','Search':'Caută','Search...':'Caută...','🔎 Search...':'🔎 Caută...','All':'Toate','Owned':'Deținute','Missing':'Lipsă',
        'Enhancers':'Enhancere','Relics':'Relicve','Owned Value':'Valoare deținută','Missing Cost':'Cost lipsă',
        'Market Value':'Valoare de piață','Total':'Total','Priority':'Prioritate','Unlock item':'Deblochează obiectul',
        'Edit reserved quantity':'Modifică cantitatea rezervată','Protect item':'Protejează obiectul','Read-only':'Doar citire',
        'API Access':'Acces API','Create General API Key':'Creează cheia API generală','Save & Test':'Salvează și testează',
        'Clear Key':'Șterge cheia','Backup':'Copie de siguranță','Restore':'Restaurează','Reset Hub':'Resetează Hub-ul',
        'Hide individual script buttons':'Ascunde butoanele individuale ale scripturilor',
        'Torn-native HUB launcher':'Lansator HUB integrat în Torn','Automatic update checks':'Verificări automate de actualizare',
        'Updates':'Actualizări','Installed':'Instalat','Not installed':'Neinstalat','Update available':'Actualizare disponibilă',
        'Open':'Deschide','Install':'Instalează','Power':'Pornire','On':'Pornit','Off':'Oprit','Tools':'Instrumente',
        'History':'Istoric','Clear history':'Șterge istoricul','Clear cache':'Șterge cache-ul','Target filters':'Filtre ținte',
        'Safe':'Sigur','Risky':'Riscant','Unopened':'Nedeschis','Attackable':'Atacabil',
        'Team':'Echipă','Player':'Jucător','Status':'Stare','Actions':'Acțiuni','Level':'Nivel','Current version':'Versiunea curentă',
        'Employee':'Angajat','Director':'Director','Overview':'Prezentare','Position':'Poziție','Growth':'Creștere','Advice':'Sfaturi',
        'Offers':'Oferte','Trains':'Antrenamente','Company':'Companie','Compact PDA mode':'Mod compact PDA',
        'Mission Rewards':'Recompense misiuni','Item Market':'Piața de obiecte','Travel':'Călătorii','Profile':'Profil',
        'No data':'Nu există date','Loading':'Se încarcă','Error':'Eroare','Cancel':'Anulează','Delete':'Șterge','Export':'Exportă','Import':'Importă',
        'Not Owned':'Nu deții','Add-ons':'Extensii','Check':'Verifică','Update':'Actualizează','Health':'Stare sistem','New':'Noutăți',
        'Send Money':'Trimite bani','Send Items':'Trimite obiecte','System Check':'Verificare sistem','Diagnostics':'Diagnosticare',
        'Actions':'Acțiuni','Attack':'Atacă','Calibrate':'Calibrează','Calibrate Me':'Calibrează-mă','Check Access':'Verifică accesul',
        'Check API Access':'Verifică accesul API','Clear':'Șterge','Clear All':'Șterge tot','Clear All Protections':'Șterge toate protecțiile',
        'Clear Captured Messages':'Șterge mesajele capturate','Clear Local API Key':'Șterge cheia API locală','Clear Local Key':'Șterge cheia locală',
        'Clear Local Torn Key':'Șterge cheia Torn locală','Clear Travel History':'Șterge istoricul călătoriilor','Copy All Safe':'Copiază toate țintele sigure',
        'Details':'Detalii','Export CSV':'Exportă CSV','Export Report CSV':'Exportă raportul CSV','Export Safe':'Exportă țintele sigure',
        'Export Targets':'Exportă țintele','Fix API Key':'Repară cheia API','Load':'Încarcă','Load Next':'Încarcă următorul','Loaded':'Încărcat',
        'Loss':'Înfrângere','Not Now':'Nu acum','Open FFScouter':'Deschide FFScouter','Operations':'Operațiuni','Original Event':'Eveniment original',
        'Refresh Page Data':'Reîmprospătează datele paginii','Remove':'Elimină','Reset Settings':'Resetează setările','Roster...':'Listă membri...',
        'Safe + Risky':'Sigur + riscant','Save Key':'Salvează cheia','Save Manual BS':'Salvează BS manual','Save New API Key':'Salvează cheia API nouă',
        'Save Values':'Salvează valorile','Staff':'Personal','Sync Now':'Sincronizează acum','Targets':'Ținte','Test & Refresh':'Testează și reîmprospătează',
        'Time':'Timp','Torn API Access':'Acces API Torn','Unavailable':'Indisponibil','Unlock':'Deblochează','Volatility':'Volatilitate',
        'Wait':'Așteaptă','Waiting for Profile':'Se așteaptă profilul','Win':'Victorie','Capture Current Message':'Capturează mesajul curent',
        'Install Hub':'Instalează Hub-ul','Create Required API Key':'Creează cheia API necesară','Create Market Intelligence API Key':'Creează cheia API Market Intelligence',
        'You have no protected items.':'Nu ai obiecte protejate.','Clear all protections':'Șterge toate protecțiile'
    };
    let LOCALES={en:{label:'English',translations:{}},ro:{label:'Română',translations:UI_RO}};
    function language(){return LOCALES[settings.language]?settings.language:'en'}
    function mergeLocaleRegistry(data){if(!data||!data.locales||!data.locales.en)return false;for(const [code,locale] of Object.entries(data.locales)){if(!locale||typeof locale!=='object'||typeof locale.label!=='string'||!locale.translations||typeof locale.translations!=='object')continue;LOCALES[code]={label:locale.label,translations:locale.translations}}return true}
    async function loadLocaleRegistry(){const cached=loadJson(STORAGE.locales,null);mergeLocaleRegistry(cached);try{const data=JSON.parse(await httpGet(LOCALES_URL+'?v='+Date.now()));if(mergeLocaleRegistry(data))saveJson(STORAGE.locales,data)}catch(error){console.warn('[SakaLuX Hub] Locale registry fallback:',error?.message||error)}if(!LOCALES[settings.language]){settings.language='en';saveJson(STORAGE.settings,settings)}}
    function translateValue(value, lang=language()){
        const raw=String(value??''),lead=raw.match(/^\s*/)?.[0]||'',trail=raw.match(/\s*$/)?.[0]||'',key=raw.trim();
        if(!key)return raw;let canonical=key;for(const locale of Object.values(LOCALES)){const hit=Object.entries(locale.translations||{}).find(([,translated])=>String(translated).toLowerCase()===key.toLowerCase());if(hit){canonical=hit[0];break}}const map=LOCALES[lang]?.translations||{};let translated=lang==='en'?canonical:map[canonical];if(translated===undefined){const hit=Object.entries(map).find(([source])=>source.toLowerCase()===canonical.toLowerCase());translated=hit?.[1]}if(translated===undefined)return raw;if(key===key.toUpperCase())translated=String(translated).toUpperCase();return lead+translated+trail;
    }
    function isSakaLuXNode(node){const el=node?.nodeType===1?node:node?.parentElement;if(!el)return false;return !!el.closest('[id^="sakalux"],[id^="sl-"],[id^="slx-"],[id^="ci-"],[id^="apm-"],[class*="sakalux"],[class^="sl-"],[class*=" sl-"],[class^="slx-"],[class*=" slx-"],[class^="ci-"],[class*=" ci-"],[class^="apm-"],[class*=" apm-"]')}
    function translateSakaLuX(root=document){
        const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
        while((node=walker.nextNode()))if(isSakaLuXNode(node)&&!node.parentElement?.matches('script,style,textarea'))node.nodeValue=translateValue(node.nodeValue);
        const scope=root.querySelectorAll?root:document;
        scope.querySelectorAll('input[placeholder],textarea[placeholder],[title],[aria-label]').forEach(el=>{if(!isSakaLuXNode(el))return;for(const attr of ['placeholder','title','aria-label'])if(el.hasAttribute(attr))el.setAttribute(attr,translateValue(el.getAttribute(attr)))});
        document.documentElement.lang=language()==='ro'?'ro':'en';
    }
    let languageObserver;
    function applyLanguage(){translateSakaLuX(document);window.dispatchEvent(new CustomEvent('SakaLuX:LanguageChanged',{detail:{language:language()}}))}
    function startLanguageObserver(){if(languageObserver)return;languageObserver=new MutationObserver(records=>{for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1||node.nodeType===3)translateSakaLuX(node.nodeType===1?node:node.parentElement)});languageObserver.observe(document.documentElement,{childList:true,subtree:true});applyLanguage()}

    function getSharedApiKey() {
        try { return (localStorage.getItem(STORAGE.apiKey) || '').trim(); }
        catch { return ''; }
    }

    function setSharedApiKey(value) {
        const key = String(value || '').trim();
        try {
            if (key) localStorage.setItem(STORAGE.apiKey, key);
            else localStorage.removeItem(STORAGE.apiKey);
        } catch {}
        window.dispatchEvent(new CustomEvent('SakaLuX:HubApiKeyChanged', { detail: { available: Boolean(key) } }));
        return Boolean(key);
    }

    async function testSharedApiKey(key = getSharedApiKey()) {
        if (!key) throw new Error('Paste or create the shared Torn API key first.');
        const raw = await httpGet('https://api.torn.com/v2/user/battlestats?key=' + encodeURIComponent(key));
        const data = JSON.parse(String(raw || '{}'));
        if (data?.error) throw new Error(data.error.error || data.error.message || 'Torn rejected the API key.');
        return true;
    }

    function createSharedApiKey() {
        try { sessionStorage.setItem('SakaLuX_HUB_API_SETUP_PENDING', '1'); } catch {}
        location.href = SHARED_API_KEY_URL;
        return true;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatAgo(timestamp) {
        if (!timestamp) return 'Never';
        const diff = Date.now() - Number(timestamp);
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Now';
        if (minutes < 60) return minutes + 'm ago';
        const hours = Math.floor(minutes / 60);
        return hours < 24 ? hours + 'h ago' : Math.floor(hours / 24) + 'd ago';
    }

    function compareVersions(a, b) {
        const pa = String(a || '0').split('.').map(v => parseInt(v, 10) || 0);
        const pb = String(b || '0').split('.').map(v => parseInt(v, 10) || 0);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            if ((pa[i] || 0) > (pb[i] || 0)) return 1;
            if ((pa[i] || 0) < (pb[i] || 0)) return -1;
        }
        return 0;
    }

    function canonicalLatestVersion(script, publishedVersion) {
        const registryVersion = String(script?.expectedVersion || script?.version || '0');
        const published = publishedVersion ? String(publishedVersion) : null;
        return published && compareVersions(published, registryVersion) > 0 ? published : registryVersion;
    }

    function getInstallUrl(script) {
        const data = normalizeCachedUpdate(script);
        if (data?.distributionBehind && script.sourceUrl) return script.sourceUrl;
        return script.downloadUrl || script.sourceUrl || '';
    }

    function normalizeRegistry(data) {
        const rows = Array.isArray(data?.scripts) ? data.scripts : FALLBACK_REGISTRY.scripts;
        return rows.filter(s => s?.active !== false).map(s => ({
            ...s,
            expectedVersion: String(s.version || '0'),
            quickActions: Array.isArray(s.quickActions) ? s.quickActions : [],
            api() {
                try { return s.apiGlobal ? window[s.apiGlobal] || null : null; } catch { return null; }
            },
            fallbackOpen() {
                if (!s.buttonSelector) return false;
                const button = document.querySelector(s.buttonSelector);
                if (!button) return false;
                button.click();
                return true;
            }
        }));
    }

    function httpGet(url) {
        return new Promise((resolve, reject) => {
            if (typeof window.PDA_httpGet === 'function') {
                window.PDA_httpGet(url, { Accept: 'text/plain' })
                    .then(r => { const body = r?.responseText ?? r?.body ?? r?.data ?? r ?? ''; resolve(typeof body === 'string' ? body : JSON.stringify(body)); })
                    .catch(reject);
                return;
            }
            if (window.flutter_inappwebview?.callHandler) {
                window.flutter_inappwebview.callHandler('PDA_httpGet', url, { Accept: 'text/plain' })
                    .then(r => { const body = r?.responseText ?? r?.body ?? r?.data ?? r ?? ''; resolve(typeof body === 'string' ? body : JSON.stringify(body)); })
                    .catch(reject);
                return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method: 'GET', url, headers: { Accept: 'text/plain' }, timeout: 15000,
                    onload: r => r.status >= 200 && r.status < 400 ? resolve(r.responseText || '') : reject(new Error('HTTP ' + r.status)),
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
                return;
            }
            fetch(url, { cache: 'no-store' })
                .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
                .then(resolve)
                .catch(reject);
        });
    }

    async function loadRegistry(force = false) {
        try {
            const raw = await httpGet(REGISTRY_URL + (force ? '?t=' + Date.now() : ''));
            const data = JSON.parse(raw);
            if (!Array.isArray(data?.scripts)) throw new Error('Invalid registry');
            registry = data;
            SCRIPTS = normalizeRegistry(data);
            registryStatus = 'online';
            saveJson(STORAGE.registry, data);
            updateHiddenButtons();
            updateBadge();
            renderCategories();
            renderList();
            renderMainStats();
            return true;
        } catch (error) {
            console.warn('[SakaLuX Hub] Registry fallback:', error);
            registryStatus = 'fallback';
            if (!Array.isArray(registry?.scripts)) registry = FALLBACK_REGISTRY;
            SCRIPTS = normalizeRegistry(registry);
            return false;
        }
    }

    function parseMetaVersion(text) {
        const match = String(text).match(/^\s*\/\/\s*@version\s+([^\s]+)\s*$/mi);
        return match ? match[1].trim() : null;
    }

    function getInstalledVersion(script) {
        try {
            const marker = localStorage.getItem('SakaLuX_Installed_' + script.id)
                || (script.id === 'elimination-assistant' ? localStorage.getItem('SakaLuX_Installed_elimination') : '');
            if (marker) return String(marker);
        } catch {}
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge?.dataset?.version) return String(bridge.dataset.version);
        } catch {}
        try {
            const api = script.api();
            if (api?.version) return String(api.version);
            const health = api?.health?.();
            if (health?.version) return String(health.version);
        } catch {}
        try {
            return document.querySelector(script.buttonSelector) ? '?' : null;
        } catch { return null; }
    }

    function recordUsage(id) {
        if (!usage[id]) usage[id] = { count: 0, lastUsed: 0 };
        usage[id].count++;
        usage[id].lastUsed = Date.now();
        saveJson(STORAGE.usage, usage);
    }

    function isUpdateCacheFresh(script) {
        const data = updateCache[script.id];
        const installed = getInstalledVersion(script);
        return Boolean(
            data?.checkedAt &&
            Date.now() - Number(data.checkedAt) < UPDATE_CACHE_TIME &&
            String(data.installed || '') === String(installed || '') &&
            String(data.expected || '') === String(script.expectedVersion || '')
        );
    }

    function normalizeCachedUpdate(script) {
        const data = updateCache[script.id];
        if (!data) return null;
        const installed = getInstalledVersion(script);
        const publishedLatest = data.publishedLatest ? String(data.publishedLatest) : (data.latest ? String(data.latest) : null);
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const available = Boolean(installed && latest && compareVersions(latest, installed) > 0);
        if (String(data.installed || '') !== String(installed || '') || String(data.latest || '') !== latest || String(data.expected || '') !== String(script.expectedVersion || '') || Boolean(data.available) !== available || Boolean(data.distributionBehind) !== distributionBehind) {
            updateCache[script.id] = { ...data, installed, expected: script.expectedVersion, publishedLatest, latest, distributionBehind, available };
            saveJson(STORAGE.updates, updateCache);
        }
        return updateCache[script.id];
    }

    async function checkScriptUpdate(script, force = false) {
        if (!force && isUpdateCacheFresh(script)) return normalizeCachedUpdate(script);
        const installed = getInstalledVersion(script);
        let publishedLatest = null;
        let sourceError = null;
        try {
            publishedLatest = parseMetaVersion(await httpGet(script.metaUrl));
            if (!publishedLatest) throw new Error('No @version found');
        } catch (error) {
            sourceError = String(error?.message || error);
        }
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const data = {
            installed,
            expected: script.expectedVersion,
            publishedLatest,
            latest,
            distributionBehind,
            available: Boolean(installed && compareVersions(latest, installed) > 0),
            checkedAt: Date.now(),
            sourceError,
            error: null
        };
        updateCache[script.id] = data;
        saveJson(STORAGE.updates, updateCache);
        return data;
    }

    async function checkAllUpdates(force = false) {
        if (updateCheckRunning) return;
        updateCheckRunning = true;
        updateCheckButtonState(true);
        try {
            await Promise.allSettled(SCRIPTS.map(s => checkScriptUpdate(s, force)));
        } finally {
            updateCheckRunning = false;
            updateCheckButtonState(false);
            updateBadge();
            renderList();
            renderMainStats();
        }
    }

    async function refreshRegistryAndCheck() {
        if (updateCheckRunning) return;
        await loadRegistry(true);
        await checkAllUpdates(true);
    }

    function getUpdateState(script) {
        const installed = getInstalledVersion(script);
        if (installed === '?') return { state: 'unknown', text: 'VERSION UNKNOWN', data: null };
        const data = normalizeCachedUpdate(script);
        if (!installed) return { state: 'missing', text: 'NOT INSTALLED', data: data || null };
        if (!data) return { state: 'unknown', text: 'NOT CHECKED', data: null };
        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: 'UPDATE AVAILABLE', data };
        return { state: 'current', text: 'UP TO DATE', data };
    }

    function getUpdateCount() {
        return SCRIPTS.filter(script => Boolean(normalizeCachedUpdate(script)?.available)).length;
    }

    function getUpdateErrorCount() {
        return SCRIPTS.filter(s => updateCache[s.id]?.error).length;
    }

    function getMissingCount() {
        return SCRIPTS.filter(s => getHealth(s).state === 'missing').length;
    }

    function getHealth(script) {
        const api = script.api();
        if (!api) {
            const installed = getInstalledVersion(script);
            if (installed) return { state: 'ok', text: 'INSTALLED', version: installed, data: { detection: 'installation marker' } };
            return { state: 'missing', text: 'NOT INSTALLED', version: null, data: null };
        }
        try {
            const data = typeof api.health === 'function' ? api.health() : null;
            if (data?.error) return { state: 'error', text: 'ERROR', version: api.version || data.version || '?', data };
            return { state: 'ok', text: 'INSTALLED', version: api.version || data?.version || '?', data };
        } catch (error) {
            return { state: 'error', text: 'ERROR', version: api.version || '?', data: { error: String(error?.message || error) } };
        }
    }

    function getAllHealth() {
        return SCRIPTS.map(script => ({ script, health: getHealth(script) }));
    }

    function getPrimaryAction(script) {
        const actions = Array.isArray(script.quickActions) ? script.quickActions : [];
        return actions.find(action => action.id === 'open')
            || actions.find(action => action.id === 'settings' || /settings/i.test(action.label || ''))
            || actions.find(action => action.method === 'open')
            || { id: 'open', label: 'OPEN', icon: '↗', method: 'open' };
    }

    function isModuleEnabled(script) {
        const api = script.api();
        try {
            if (api && typeof api.isEnabled === 'function') return api.isEnabled() !== false;
            const health = api && typeof api.health === 'function' ? api.health() : null;
            if (typeof health?.enabled === 'boolean') return health.enabled;
        } catch {}
        const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
        if (bridge?.dataset?.enabled === 'true') return true;
        if (bridge?.dataset?.enabled === 'false') return false;
        return Object.prototype.hasOwnProperty.call(modulePower, script.id) ? modulePower[script.id] !== false : true;
    }

    async function setModulePower(id, enabled) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return false;
        const api = script.api();
        if (api && typeof api.setEnabled === 'function' && typeof api.isEnabled === 'function') {
            await api.setEnabled(Boolean(enabled));
        } else {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (!bridge) throw new Error('Update ' + script.name + ' to the latest version to use its Violentmonkey control bridge.');
            bridge.dataset.action = enabled ? 'on' : 'off';
            bridge.click();
        }
        modulePower[id] = Boolean(enabled);
        saveJson(STORAGE.modulePower, modulePower);
        updateHiddenButtons();
        renderList();
        renderMainStats();
        return true;
    }

    function getIssueCount() {
        return getAllHealth().filter(row => row.health.state === 'error').length + getUpdateCount() + getMissingCount();
    }

    function injectCss() {
        if (document.getElementById(IDS.style)) return;
        const style = document.createElement('style');
        style.id = IDS.style;
        style.textContent = `
#${IDS.button}{position:fixed!important;z-index:2147483646!important;border:1px solid #3d4f66!important;border-radius:50%!important;background:linear-gradient(145deg,#1d2836,#111923)!important;color:#f8fafc!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;margin:0!important;font-size:23px!important;box-shadow:0 10px 28px rgba(0,0,0,.58),inset 0 1px rgba(255,255,255,.04)!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;touch-action:manipulation!important}
#${IDS.badge}{position:absolute;top:-5px;right:-5px;min-width:18px;height:18px;padding:0 4px;box-sizing:border-box;border-radius:999px;background:#d84b59;color:#fff;display:none;align-items:center;justify-content:center;font-size:9px;font-weight:900;border:2px solid #111923}
#${IDS.topSkull}{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;padding:0!important;border:0!important;list-style:none!important;vertical-align:top!important;background:none!important;background-image:none!important;box-shadow:none!important;overflow:visible!important}#${IDS.topSkull}::before,#${IDS.topSkull}::after{content:none!important;display:none!important}#${IDS.topSkull} .slh-status-link{position:relative!important;display:block!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:none!important;background-image:none!important;color:inherit!important;cursor:pointer!important;line-height:0!important;font-size:0!important;text-decoration:none!important;box-shadow:none!important;overflow:visible!important;transform:none!important}#${IDS.topSkull} .slh-status-link svg{display:block!important;width:17px!important;height:17px!important;min-width:17px!important;min-height:17px!important;max-width:17px!important;max-height:17px!important;margin:0!important;padding:0!important;overflow:visible!important;pointer-events:none!important;filter:drop-shadow(0 1px 1px rgba(0,0,0,.58))!important;transition:filter .15s ease,transform .15s ease!important}#${IDS.topSkull} .slh-status-link:active svg{transform:scale(.92)!important}#${IDS.topSkull}.slh-alert .slh-status-link svg{filter:brightness(1.2) drop-shadow(0 0 4px rgba(242,200,100,.55))!important}#${IDS.topBadge}{position:absolute;top:-7px;right:-7px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3;border:1px solid #111923}
#${IDS.navSkull}{position:relative!important;box-sizing:border-box!important}#${IDS.navSkull} .slh-native-link{position:relative!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important}#${IDS.navSkull} .slh-native-skull-icon{animation:slhNativeSkullBlink 2.45s ease-in-out infinite!important;transform-origin:center center!important}#${IDS.navSkull}.slh-alert .slh-native-skull-icon{animation:slhNativeSkullAlert .92s ease-in-out infinite!important}#${IDS.navBadge}{position:absolute;top:0;right:4px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3}@keyframes slhNativeSkullBlink{0%,8%,16%,24%,32%,100%{opacity:.48}11%,19%,27%{opacity:1}40%,75%{opacity:.72}}@keyframes slhNativeSkullAlert{0%,100%{opacity:.38}50%{opacity:1}72%{opacity:.58}}
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:rgba(4,8,13,.84);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;font-family:Inter,Arial,sans-serif;color:#e7edf5}
#${IDS.panel}{--sl-bg:#0f141c;--sl-soft:#151c26;--sl-panel:#18212d;--sl-panel2:#1d2836;--sl-elev:#223041;--sl-border:#314154;--sl-border2:#43566e;--sl-text:#e7edf5;--sl-softtext:#a9b7c8;--sl-muted:#7f90a6;--sl-blue:#4f8fe8;--sl-blue2:#2f6ebf;--sl-green:#18b26b;--sl-red:#cc3d57;--sl-gold:#d7a94a;width:min(680px,100%);max-height:95vh;display:flex;flex-direction:column;overflow:hidden;background:var(--sl-bg);color:var(--sl-text);border:1px solid var(--sl-border);border-radius:22px 22px 0 0;box-shadow:0 -22px 70px rgba(0,0,0,.72),inset 0 1px rgba(255,255,255,.025)}
.slh-header{padding:16px 16px 12px;flex-shrink:0;background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 40%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-bottom:1px solid var(--sl-border)}.slh-headrow{display:flex;align-items:center;justify-content:space-between;gap:12px}.slh-brand{display:flex;align-items:center;gap:11px;min-width:0}.slh-brand-icon{width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;border:1px solid #41536b;border-radius:13px;background:linear-gradient(145deg,#263448,#17212e);box-shadow:inset 0 1px rgba(255,255,255,.05),0 7px 20px rgba(0,0,0,.25);font-size:22px}.slh-brand-copy{min-width:0}.slh-kicker{font-size:8px;line-height:1.2;letter-spacing:.18em;font-weight:900;color:#6fa6ef;text-transform:uppercase}.slh-title{margin-top:2px;font-size:18px;line-height:1.15;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slh-sub{margin-top:4px;color:var(--sl-muted);font-size:9px;line-height:1.3}.slh-registry-dot{display:inline-block;width:6px;height:6px;margin-right:4px;border-radius:50%;background:#64748b}.slh-registry-dot.online{background:var(--sl-green);box-shadow:0 0 8px rgba(24,178,107,.6)}.slh-close{width:38px;height:38px;flex:0 0 auto;border:1px solid var(--sl-border);border-radius:11px;background:#1b2532;color:#c8d3df;font-size:21px;line-height:1;transition:.15s ease}.slh-close:active{transform:scale(.96)}
.slh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.slh-stat{position:relative;overflow:hidden;background:rgba(24,33,45,.86);border:1px solid var(--sl-border);border-radius:11px;padding:9px 7px 8px}.slh-stat:before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#4f8fe8;opacity:.8}.slh-stat.warn:before{background:var(--sl-gold)}.slh-stat.bad:before{background:var(--sl-red)}.slh-stat.good:before{background:var(--sl-green)}.slh-stat strong{display:block;color:#f8fafc;font-size:15px;line-height:1}.slh-stat span{display:block;margin-top:5px;color:var(--sl-muted);font-size:7px;font-weight:800;letter-spacing:.08em}.slh-stat small{display:block;margin-top:3px;color:#64748b;font-size:7px}
.slh-tools{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:9px}.slh-tool{min-width:0;height:42px;display:flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--sl-border);border-radius:10px;background:linear-gradient(180deg,#202c3a,#17212d);color:#d9e3ee;font-size:9px;font-weight:900;white-space:nowrap;touch-action:manipulation}.slh-tool span{font-size:13px}.slh-tool.checking{opacity:.56}.slh-tool.whatsnew{border-color:#54446b;background:linear-gradient(180deg,#3a2b4d,#271d35)}.slh-tool.settings{border-color:#4a5262}.slh-tool:active,.slh-bottom-btn:active,.slh-primary:active,.slh-switch:active,.slh-cat:active,.slh-setting-toggle:active{transform:translateY(1px)}
.slh-cats{display:flex;gap:6px;margin-top:9px;padding-bottom:1px;overflow-x:auto;scrollbar-width:none}.slh-cats::-webkit-scrollbar{display:none}.slh-cat{flex-shrink:0;border:1px solid #2c394b;border-radius:999px;padding:6px 10px;background:#111923;color:#8999ac;font-size:8px;font-weight:900;letter-spacing:.05em}.slh-cat.active{border-color:#4c84cc;background:#1d3b60;color:#dcebff;box-shadow:inset 0 0 0 1px rgba(111,166,239,.08)}
.slh-list,.slh-view,.slh-settings{overflow-y:auto;padding:11px;-webkit-overflow-scrolling:touch}.slh-list{background:linear-gradient(180deg,#0d131b 0%,#0f141c 100%)}.slh-section-label{margin:1px 2px 8px;color:#6e8095;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.slh-card{position:relative;display:grid;grid-template-columns:46px minmax(0,1fr) 100px;gap:11px;align-items:center;padding:12px;margin-bottom:9px;background:linear-gradient(145deg,#18212d,#131b25);border:1px solid #2d3c4e;border-radius:15px;box-shadow:0 7px 20px rgba(0,0,0,.17),inset 0 1px rgba(255,255,255,.018)}.slh-card:before{content:'';position:absolute;left:-1px;top:13px;bottom:13px;width:2px;border-radius:4px;background:#40526a}.slh-card.update:before{background:var(--sl-gold);box-shadow:0 0 8px rgba(215,169,74,.28)}.slh-card.missing:before{background:#64748b}.slh-card.off:before{background:#8a4d59}.slh-card.off .slh-card-copy{opacity:.62}.slh-card-copy{min-width:0}.slh-icon{width:44px;height:44px;display:grid;place-items:center;background:linear-gradient(145deg,#263448,#1a2431);border:1px solid #35475d;border-radius:13px;font-size:21px;box-shadow:inset 0 1px rgba(255,255,255,.04)}.slh-name-line{display:flex;align-items:center;gap:6px;min-width:0}.slh-name{min-width:0;color:#f3f7fb;font-size:13px;font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slh-category-chip{flex:0 0 auto;border:1px solid #33445a;border-radius:999px;padding:2px 5px;color:#7f94aa;background:#121a24;font-size:6.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.slh-description{display:-webkit-box;margin-top:4px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#91a2b5;font-size:8.5px;line-height:1.35}.slh-chips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px}.slh-chip{display:inline-flex;align-items:center;min-height:17px;padding:2px 6px;border:1px solid #304055;border-radius:999px;background:#111922;color:#8496aa;font-size:6.5px;font-weight:900;line-height:1;letter-spacing:.035em}.slh-chip.good{border-color:#235f46;background:#10271f;color:#72d6a2}.slh-chip.warn{border-color:#68522b;background:#292314;color:#e7c675}.slh-chip.bad{border-color:#693642;background:#2c171d;color:#f09aa8}.slh-chip.info{border-color:#31567e;background:#14263b;color:#8fc0ff}.slh-chip.muted{color:#8290a1}.slh-module-controls{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:6px}.slh-switch,.slh-primary{width:100%;min-height:35px;border-radius:10px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:900;touch-action:manipulation}.slh-switch{display:grid;grid-template-columns:36px 1fr;align-items:center;gap:5px;padding:5px 7px;border:1px solid #475569;background:#111827;color:#94a3b8}.slh-switch-track{position:relative;display:block;width:34px;height:19px;border-radius:999px;background:#4b5563;box-shadow:inset 0 1px 3px rgba(0,0,0,.55);transition:.18s ease}.slh-switch-track i{position:absolute;left:3px;top:3px;width:13px;height:13px;border-radius:50%;background:#e5e7eb;box-shadow:0 1px 4px #0008;transition:.18s ease}.slh-switch.on{border-color:#216b4a;background:#102a21;color:#86efac}.slh-switch.on .slh-switch-track{background:#1eb36a}.slh-switch.on .slh-switch-track i{transform:translateX(15px);background:#fff}.slh-switch.off{border-color:#5d3a43;background:#26151a;color:#f0a0ad}.slh-switch:disabled{opacity:.48}.slh-primary{border:1px solid #3d78bf;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;padding:7px}.slh-primary:disabled{border-color:#374151;background:#202733;color:#6b7280}.slh-primary.install{border-color:#24754f;background:linear-gradient(180deg,#22945f,#176d46)}
.slh-bottom{padding:9px 11px;background:#0c1219;border-top:1px solid #263547;flex-shrink:0}.slh-bottom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.slh-bottom-btn{border:1px solid #2d3d50;border-radius:10px;padding:9px;background:#151f2a;color:#b9c7d6;font-size:8px;font-weight:900;letter-spacing:.04em}.slh-footer{padding:8px;text-align:center;color:#5f7083;font-size:8px;border-top:1px solid #202d3c;background:#0b1118}.slh-author{color:#78aef2;font-weight:900;text-decoration:none}
.slh-setting,.slh-note,.slh-check-row{background:#17202b;border:1px solid #2c3b4e;border-radius:11px;padding:11px;margin-bottom:8px;color:#cbd5e1;font-size:10px;line-height:1.5}.slh-settings-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}.slh-settings-pair .slh-setting{min-width:0}.slh-setting select,.slh-setting input[type=range],.slh-setting input[type=password]{width:100%;box-sizing:border-box;margin-top:7px}.slh-setting input[type=password],.slh-setting select{min-height:40px;padding:9px;border:1px solid #3a4b61;border-radius:8px;background:#0d141d;color:#fff}.slh-setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.slh-setting-copy{min-width:0}.slh-setting-title{color:#e7edf5;font-size:10px;font-weight:900}.slh-setting-desc{margin-top:3px;color:#7f90a6;font-size:8px;line-height:1.35}.slh-setting-toggle{position:relative;flex:0 0 auto;width:48px;height:26px;border:1px solid #46566a;border-radius:999px;background:#303a48;padding:0;box-shadow:inset 0 1px 3px rgba(0,0,0,.42);transition:.18s ease}.slh-setting-toggle i{position:absolute;left:4px;top:4px;width:16px;height:16px;border-radius:50%;background:#d7dee8;box-shadow:0 2px 5px rgba(0,0,0,.45);transition:.18s ease}.slh-setting-toggle.on{border-color:#237250;background:#168c58}.slh-setting-toggle.on i{transform:translateX(22px);background:#fff}.slh-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.slh-big-btn{width:100%;padding:10px;margin-top:6px;border:1px solid #3d78bf;border-radius:9px;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;font-size:10px;font-weight:900}.slh-big-btn.gray{border-color:#394859;background:#1e2936}.slh-big-btn.red{border-color:#743946;background:#51222c}.slh-big-btn.update{border-color:#7a5b25;background:#684b1d}.slh-big-btn.install{border-color:#24754f;background:#176d46}.slh-version-title{font-size:12px;font-weight:900;margin-bottom:5px}.slh-version-date{color:#718197;font-size:8px;margin-left:5px}
@media(max-width:520px){.slh-header{padding:12px 10px 10px}.slh-brand-icon{width:38px;height:38px;font-size:19px}.slh-title{font-size:15px}.slh-kicker{font-size:7px}.slh-sub{font-size:8px}.slh-close{width:34px;height:34px}.slh-stats{gap:5px;margin-top:10px}.slh-stat{padding:8px 5px 7px}.slh-stat strong{font-size:13px}.slh-stat span{font-size:6.5px}.slh-stat small{display:none}.slh-tools{gap:4px}.slh-tool{height:38px;gap:3px;font-size:7px}.slh-tool span{font-size:11px}.slh-cats{gap:5px}.slh-cat{padding:5px 8px;font-size:7px}.slh-list{padding:8px}.slh-card{grid-template-columns:39px minmax(0,1fr) 84px;gap:8px;padding:9px 8px;margin-bottom:7px;border-radius:13px}.slh-icon{width:37px;height:37px;border-radius:11px;font-size:18px}.slh-name{font-size:11.5px}.slh-category-chip{font-size:5.8px}.slh-description{font-size:7.7px;-webkit-line-clamp:1}.slh-chips{gap:3px;margin-top:5px}.slh-chip{min-height:15px;padding:2px 4px;font-size:5.7px}.slh-module-controls{gap:5px}.slh-switch,.slh-primary{min-height:32px;font-size:8px}.slh-switch{grid-template-columns:31px 1fr;padding:4px}.slh-switch-track{width:30px;height:17px}.slh-switch-track i{width:11px;height:11px}.slh-switch.on .slh-switch-track i{transform:translateX(13px)}}
@media(min-width:700px){#${IDS.overlay}{align-items:center}#${IDS.panel}{border-radius:22px;max-height:90vh}.slh-tools{grid-template-columns:repeat(5,minmax(0,1fr))}}

/* SakaLuX Unified Control Center theme ------------------------------------ */
/* Visual-only layer for all SakaLuX interfaces. Standalone tools remain
   standalone: these selectors do not register them in Hub or alter logic. */
:where(
 [id^="sl-eg-"],[class*="sl-eg-"],
 [id^="sakalux-bt-"],[class*="sakalux-bt-"],
 [id^="sl-mr-"],[class*="sl-mr-"],[id^="sl-mri-"],[class*="sl-mri-"],
 [id^="sl-mi-"],[class*="sl-mi-"],
 [id^="slx-elim-"],[class*="slx-elim-"],
 [id^="sl-aa-"],[class*="sl-aa-"],
 [id*="sakalux-suite" i],[class*="sakalux-suite" i],
 [id*="master-control" i],[class*="master-control" i]
){font-family:Inter,Arial,sans-serif!important;box-sizing:border-box}

/* Main panels, settings windows, modals and detail surfaces */
:where(
 [id^="sl-eg-"][id*="panel" i],[id^="sl-eg-"][id*="settings" i],[id^="sl-eg-"][id*="modal" i],[id^="sl-eg-"][id*="details" i],
 [id^="sakalux-bt-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],[id^="sakalux-bt-"][id*="modal" i],[id^="sakalux-bt-"][id*="details" i],
 [id^="sl-mr-"][id*="panel" i],[id^="sl-mr-"][id*="settings" i],[id^="sl-mr-"][id*="modal" i],[id^="sl-mri-"][id*="panel" i],
 [id^="sl-mi-"][id*="panel" i],[id^="sl-mi-"][id*="settings" i],[id^="sl-mi-"][id*="modal" i],[id^="sl-mi-"][id*="details" i],
 [id^="slx-elim-"][id*="panel" i],[id^="slx-elim-"][id*="settings" i],[id^="slx-elim-"][id*="modal" i],[id^="slx-elim-"][id*="details" i],
 [id^="sl-aa-"][id*="panel" i],[id^="sl-aa-"][id*="settings" i],[id^="sl-aa-"][id*="modal" i],
 [id*="sakalux-suite" i][id*="panel" i],[id*="sakalux-suite" i][id*="control" i],[id*="master-control" i]
){
 background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.15),transparent 38%),linear-gradient(155deg,#18212d 0%,#101720 72%)!important;
 color:#e7edf5!important;border:1px solid #314154!important;border-radius:16px!important;
 box-shadow:0 18px 52px rgba(0,0,0,.55),inset 0 1px rgba(255,255,255,.025)!important;
}

/* Backdrops */
:where(
 [id^="sl-eg-"][id*="overlay" i],[id^="sakalux-bt-"][id*="overlay" i],
 [id^="sl-mr-"][id*="overlay" i],[id^="sl-mi-"][id*="overlay" i],
 [id^="slx-elim-"][id*="overlay" i],[id^="sl-aa-"][id*="overlay" i],
 [id*="sakalux-suite" i][id*="overlay" i]
){background:rgba(4,8,13,.84)!important;backdrop-filter:blur(6px)!important}

/* Headers and title bars */
:where(
 [class*="sl-eg-"][class*="header" i],[id^="sl-eg-"][id*="header" i],
 [class*="sakalux-bt-"][class*="header" i],[id^="sakalux-bt-"][id*="header" i],
 [class*="sl-mr-"][class*="header" i],[id^="sl-mr-"][id*="header" i],
 [class*="sl-mi-"][class*="header" i],[id^="sl-mi-"][id*="header" i],
 [class*="slx-elim-"][class*="header" i],[id^="slx-elim-"][id*="header" i],
 [class*="sl-aa-"][class*="header" i],[id^="sl-aa-"][id*="header" i],
 [class*="sakalux-suite" i][class*="header" i],[id*="sakalux-suite" i][id*="header" i]
){background:linear-gradient(155deg,#1b2634,#111923)!important;border-color:#314154!important;color:#f8fafc!important}

/* Cards, rows, sections and information blocks */
:where(
 [class*="sl-eg-"][class*="card" i],[class*="sl-eg-"][class*="row" i],[class*="sl-eg-"][class*="section" i],[class*="sl-eg-"][class*="note" i],
 [class*="sakalux-bt-"][class*="card" i],[class*="sakalux-bt-"][class*="row" i],[class*="sakalux-bt-"][class*="section" i],[class*="sakalux-bt-"][class*="note" i],
 [class*="sl-mr-"][class*="card" i],[class*="sl-mr-"][class*="row" i],[class*="sl-mr-"][class*="section" i],[class*="sl-mr-"][class*="note" i],
 [class*="sl-mi-"][class*="card" i],[class*="sl-mi-"][class*="row" i],[class*="sl-mi-"][class*="section" i],[class*="sl-mi-"][class*="note" i],
 [class*="slx-elim-"][class*="card" i],[class*="slx-elim-"][class*="row" i],[class*="slx-elim-"][class*="section" i],[class*="slx-elim-"][class*="note" i],
 [class*="sl-aa-"][class*="card" i],[class*="sl-aa-"][class*="row" i],[class*="sl-aa-"][class*="section" i],[class*="sl-aa-"][class*="note" i],
 [class*="sakalux-suite" i][class*="card" i],[class*="sakalux-suite" i][class*="row" i],[class*="sakalux-suite" i][class*="section" i]
){background:linear-gradient(145deg,#18212d,#131b25)!important;border-color:#2d3c4e!important;border-radius:12px!important;color:#dce6f0!important;box-shadow:0 6px 18px rgba(0,0,0,.14)!important}

/* Buttons */
:where(
 button[id^="sl-eg-"],button[class*="sl-eg-"],
 button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
 button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mri-"],button[class*="sl-mri-"],
 button[id^="sl-mi-"],button[class*="sl-mi-"],
 button[id^="slx-elim-"],button[class*="slx-elim-"],
 button[id^="sl-aa-"],button[class*="sl-aa-"],
 button[id*="sakalux-suite" i],button[class*="sakalux-suite" i],button[id*="master-control" i]
){border:1px solid #3d78bf!important;border-radius:10px!important;background:linear-gradient(180deg,#377fcf,#275f9f)!important;color:#fff!important;font-weight:900!important;box-shadow:none!important;transition:transform .12s ease,filter .12s ease!important}
:where(
 button[id^="sl-eg-"],button[class*="sl-eg-"],button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
 button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mi-"],button[class*="sl-mi-"],
 button[id^="slx-elim-"],button[class*="slx-elim-"],button[id^="sl-aa-"],button[class*="sl-aa-"]
):active{transform:translateY(1px)!important}
:where(
 button[id*="close" i],button[class*="close" i],button[id*="back" i],button[class*="gray" i],button[class*="secondary" i]
){background:linear-gradient(180deg,#253243,#1a2431)!important;border-color:#3a4a5d!important;color:#d7e1eb!important}
:where(
 button[id*="clear" i],button[id*="reset" i],button[id*="delete" i],button[class*="danger" i],button[class*="red" i]
){background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}

/* Inputs and selects */
:where(
 [id^="sl-eg-"] input,[id^="sl-eg-"] select,[id^="sl-eg-"] textarea,
 [id^="sakalux-bt-"] input,[id^="sakalux-bt-"] select,[id^="sakalux-bt-"] textarea,
 [id^="sl-mr-"] input,[id^="sl-mr-"] select,[id^="sl-mr-"] textarea,
 [id^="sl-mi-"] input,[id^="sl-mi-"] select,[id^="sl-mi-"] textarea,
 [id^="slx-elim-"] input,[id^="slx-elim-"] select,[id^="slx-elim-"] textarea,
 [id^="sl-aa-"] input,[id^="sl-aa-"] select,[id^="sl-aa-"] textarea,
 [id*="sakalux-suite" i] input,[id*="sakalux-suite" i] select,[id*="sakalux-suite" i] textarea,
 input[id^="sl-eg-"],select[id^="sl-eg-"],textarea[id^="sl-eg-"],
 input[id^="sakalux-bt-"],select[id^="sakalux-bt-"],textarea[id^="sakalux-bt-"],
 input[id^="sl-mr-"],select[id^="sl-mr-"],textarea[id^="sl-mr-"],
 input[id^="sl-mi-"],select[id^="sl-mi-"],textarea[id^="sl-mi-"],
 input[id^="slx-elim-"],select[id^="slx-elim-"],textarea[id^="slx-elim-"],
 input[id^="sl-aa-"],select[id^="sl-aa-"],textarea[id^="sl-aa-"]
){background:#0d141d!important;border:1px solid #3a4b61!important;border-radius:9px!important;color:#f4f7fb!important;outline:none!important}

/* Sliding toggles for compatible settings checkboxes */
:where(
 input[type="checkbox"][id^="sl-eg-"],input[type="checkbox"][id^="sakalux-bt-"],
 input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"],
 input[type="checkbox"][id^="sl-mi-"],input[type="checkbox"][id^="slx-elim-"],
 input[type="checkbox"][id^="sl-aa-"],input[type="checkbox"][id*="sakalux-suite" i]
){appearance:none!important;-webkit-appearance:none!important;width:38px!important;height:21px!important;min-width:38px!important;margin:0 8px 0 0!important;vertical-align:middle!important;border:1px solid #546276!important;border-radius:999px!important;background:radial-gradient(circle at 10px 50%,#e7edf5 0 6px,transparent 6.5px),#465365!important;cursor:pointer!important;transition:.18s ease!important;box-shadow:inset 0 1px 3px rgba(0,0,0,.4)!important}
:where(
 input[type="checkbox"][id^="sl-eg-"],input[type="checkbox"][id^="sakalux-bt-"],
 input[type="checkbox"][id^="sl-mr-"],input[type="checkbox"][id^="sl-mri-"],
 input[type="checkbox"][id^="sl-mi-"],input[type="checkbox"][id^="slx-elim-"],
 input[type="checkbox"][id^="sl-aa-"],input[type="checkbox"][id*="sakalux-suite" i]
):checked{border-color:#24754f!important;background:radial-gradient(circle at 27px 50%,#fff 0 6px,transparent 6.5px),#1eb36a!important}

/* Headings and muted copy */
:where(
 [class*="sl-eg-"][class*="title" i],[class*="sakalux-bt-"][class*="title" i],
 [class*="sl-mr-"][class*="title" i],[class*="sl-mi-"][class*="title" i],
 [class*="slx-elim-"][class*="title" i],[class*="sl-aa-"][class*="title" i],
 [class*="sakalux-suite" i][class*="title" i]
){color:#f8fafc!important;font-weight:900!important}
:where(
 [class*="sl-eg-"][class*="muted" i],[class*="sakalux-bt-"][class*="muted" i],
 [class*="sl-mr-"][class*="muted" i],[class*="sl-mi-"][class*="muted" i],
 [class*="slx-elim-"][class*="muted" i],[class*="sl-aa-"][class*="muted" i],
 [class*="sakalux-suite" i][class*="muted" i]
){color:#8799ad!important}

@media(max-width:520px){
 :where(
  [id^="sl-eg-"][id*="panel" i],[id^="sakalux-bt-"][id*="settings" i],
  [id^="sl-mr-"][id*="panel" i],[id^="sl-mi-"][id*="panel" i],
  [id^="slx-elim-"][id*="panel" i],[id^="sl-aa-"][id*="panel" i],
  [id*="sakalux-suite" i][id*="panel" i],[id*="master-control" i]
 ){border-radius:15px 15px 0 0!important}
 :where(
  button[id^="sl-eg-"],button[class*="sl-eg-"],button[id^="sakalux-bt-"],button[class*="sakalux-bt-"],
  button[id^="sl-mr-"],button[class*="sl-mr-"],button[id^="sl-mi-"],button[class*="sl-mi-"],
  button[id^="slx-elim-"],button[class*="slx-elim-"],button[id^="sl-aa-"],button[class*="sl-aa-"]
 ){min-height:34px!important;font-size:9px!important}
}
/* End unified theme ------------------------------------------------------- */

        `;
        document.head.appendChild(style);
    }

    function positionButton() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const size = Math.max(38, Math.min(64, Number(settings.buttonSize) || 48));
        button.style.setProperty('width', size + 'px', 'important');
        button.style.setProperty('height', size + 'px', 'important');
        ['top', 'bottom', 'left', 'right'].forEach(p => button.style.removeProperty(p));
        if (settings.buttonPosition === 'middle-right') {
            button.style.setProperty('top', '45%', 'important');
            button.style.setProperty('right', '12px', 'important');
        } else if (settings.buttonPosition === 'bottom-right') {
            button.style.setProperty('bottom', '90px', 'important');
            button.style.setProperty('right', '12px', 'important');
        } else if (settings.buttonPosition === 'top-left') {
            button.style.setProperty('top', '76px', 'important');
            button.style.setProperty('left', '12px', 'important');
        } else {
            button.style.setProperty('top', '76px', 'important');
            button.style.setProperty('right', '12px', 'important');
        }
    }

    function createHubButton() {
        let button = document.getElementById(IDS.button);
        if (!button) {
            button = document.createElement('button');
            button.id = IDS.button;
            button.type = 'button';
            button.innerHTML = `☠️<span id="${IDS.badge}"></span>`;
            document.body.appendChild(button);
            bindMainButton(button);
        }
        positionButton();
        updateBadge();
        syncFloatingButtonVisibility();
    }

    function bindMainButton(button) {
        button.addEventListener('click', event => {
            event.preventDefault();
            openHub();
        });
    }

    function getMobileNavContext() {
        const swiperWrap = document.querySelector('.swiper-wrapper') || document.querySelector('[class*="swiper___"]');
        const areasWrap = document.querySelector('[class*="areasMobile___"]');
        const wrapper = swiperWrap || areasWrap;
        if (!wrapper) return null;
        const links = [...wrapper.querySelectorAll('a[class*="mobileLink___"]')];
        const messagesLink = links.find(link => {
            const label = link.querySelector('span[class*="linkName___"]');
            const text = String(label?.textContent || link.textContent || '').trim().toUpperCase();
            const href = String(link.getAttribute('href') || '').toLowerCase();
            return text === 'MESSAGES' || href.includes('messages');
        });
        if (!messagesLink) return null;
        const messagesArea = messagesLink.closest('[class*="area-mobile___"]');
        if (!messagesArea) return null;
        const messagesSlide = messagesArea.closest('[class*="slide___"]');
        const isSwiper = Boolean(messagesSlide && messagesSlide.parentElement === wrapper);
        return {
            wrapper, isSwiper, messagesLink, messagesArea, messagesSlide,
            nativeRow: messagesArea.querySelector('[class*="areaRow___"], [class*="area-row___"]'),
            nativeIconWrap: messagesLink.querySelector('span[class*="svgIconWrap___"]'),
            nativeDefaultIcon: messagesLink.querySelector('span[class*="defaultIcon___"]'),
            nativeLabel: messagesLink.querySelector('span[class*="linkName___"]'),
            nativeSvg: messagesLink.querySelector('svg')
        };
    }

    function findStatusIconList() {
        const selectors = [
            'ul[class*="statusIcons"][class*="big"]',
            'ul[class*="status-icons"][class*="big"]',
            'ul[class*="statusIcons"]',
            'ul[class*="status-icons"]'
        ];
        const lists = selectors.flatMap(selector => Array.from(document.querySelectorAll(selector)));
        return lists.find(list => list.isConnected && Array.from(list.children).some(item => item.querySelector?.('a'))) || null;
    }

    function copyNativeStatusCellLayout(customItem, statusList) {
        if (!customItem || !statusList) return;
        const reference = Array.from(statusList.children).find(item =>
            item !== customItem && item.id !== IDS.topSkull && item.querySelector?.('a')
        );
        if (!reference) return;
        const nativeClasses = Array.from(reference.classList).filter(className => className && !className.startsWith('slh-') && !className.startsWith('sakalux-'));
        const customClasses = Array.from(customItem.classList).filter(className => className.startsWith('slh-') || className.startsWith('sakalux-'));
        customItem.className = [...nativeClasses, ...customClasses].join(' ');
        ['width','height','min-width','min-height','max-width','max-height','margin','flex','align-self'].forEach(prop => customItem.style.removeProperty(prop));
    }

    function buildSkullSvg(nativeSvg) {
        if (!nativeSvg) return null;
        const svg = nativeSvg.cloneNode(false);
        const vb = (nativeSvg.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
        const vbW = vb[2] || 24;
        const vbH = vb[3] || 24;
        const ART_INK = 20;
        const scale = vbH / ART_INK;
        const tx = (vb[0] || 0) + (vbW - 24 * scale) / 2;
        const ty = (vb[1] || 0) + (vbH - 24 * scale) / 2;
        svg.style.overflow = 'visible';
        svg.style.setProperty('filter', 'none', 'important');
        svg.style.setProperty('-webkit-filter', 'none', 'important');
        svg.setAttribute('aria-hidden', 'true');
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`);
        g.setAttribute('fill', 'none');
        g.setAttribute('stroke', 'currentColor');
        g.setAttribute('stroke-width', '1.75');
        g.setAttribute('stroke-linecap', 'round');
        g.setAttribute('stroke-linejoin', 'round');
        g.innerHTML = `<path d="M12 2.4c-4.8 0-8.1 3.2-8.1 7.6 0 2.8 1.4 5.1 3.8 6.4v3.1h2.2v-2.1h1v2.1h2.2v-2.1h1v2.1h2.2v-3.1c2.4-1.3 3.8-3.6 3.8-6.4 0-4.4-3.3-7.6-8.1-7.6Z"/><circle cx="8.8" cy="10.5" r="1.65"/><circle cx="15.2" cy="10.5" r="1.65"/><path d="m12 12.7-1 1.8h2l-1-1.8Z"/><path d="M8.1 16.1h7.8M10.5 16.1v1.3M13.5 16.1v1.3"/>`;
        svg.appendChild(g);
        return svg;
    }

    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const statusReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.topSkull));
        const flyoutReady = settings.showTopbarSkull && Boolean(document.getElementById(IDS.navSkull));
        const nativeReady = statusReady || flyoutReady;
        button.style.setProperty('display', nativeReady ? 'none' : 'flex', 'important');
    }

    function createTopbarSkull() {
        const existing = document.getElementById(IDS.topSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        const statusList = findStatusIconList();
        if (!statusList) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected && existing.parentElement === statusList) {
            if (statusList.firstElementChild !== existing) statusList.insertBefore(existing, statusList.firstElementChild);
            copyNativeStatusCellLayout(existing, statusList);
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
        existing?.remove();
        const item = document.createElement('li');
        item.id = IDS.topSkull;
        item.className = 'slh-master-status-icon';
        const launcher = document.createElement('a');
        launcher.href = '#';
        launcher.className = 'slh-status-link';
        launcher.setAttribute('aria-label', 'SakaLuX Script Hub');
        launcher.setAttribute('title', 'SakaLuX Script Hub');
        launcher.setAttribute('tabindex', '0');
        launcher.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17 17" width="17" height="17" aria-hidden="true" focusable="false">
                <defs>
                    <linearGradient id="slh-settings-gold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#f4d57d"/>
                        <stop offset=".45" stop-color="#d8b35f"/>
                        <stop offset="1" stop-color="#9a742c"/>
                    </linearGradient>
                    <linearGradient id="slh-settings-inner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stop-color="#3a3d44"/>
                        <stop offset="1" stop-color="#15171b"/>
                    </linearGradient>
                </defs>
                <path fill="url(#slh-settings-gold)" stroke="#6f511a" stroke-width=".45" d="M7.28.8h2.44l.36 1.7c.51.15.99.35 1.43.59l1.49-.9 1.72 1.72-.9 1.49c.24.44.44.92.59 1.43l1.7.36v2.44l-1.7.36c-.15.51-.35.99-.59 1.43l.9 1.49-1.72 1.72-1.49-.9c-.44.24-.92.44-1.43.59l-.36 1.7H7.28l-.36-1.7c-.51-.15-.99-.35-1.43-.59l-1.49.9-1.72-1.72.9-1.49a6.97 6.97 0 0 1-.59-1.43l-1.7-.36V7.19l1.7-.36c.15-.51.35-.99.59-1.43l-.9-1.49L4 2.19l1.49.9c.44-.24.92-.44 1.43-.59L7.28.8Z"/>
                <circle cx="8.5" cy="8.41" r="3.15" fill="url(#slh-settings-inner)" stroke="#f0cc72" stroke-width=".5"/>
                <text x="8.5" y="10.65" text-anchor="middle" font-family="Arial,sans-serif" font-size="6.1" font-weight="900" fill="#f0cc72">S</text>
            </svg>
            <span id="${IDS.topBadge}"></span>`;
        launcher.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openHub(); });
        launcher.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openHub(); } });
        item.appendChild(launcher);
        statusList.insertBefore(item, statusList.firstElementChild);
        copyNativeStatusCellLayout(item, statusList);
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

    function createNavSkull() {
        const existing = document.getElementById(IDS.navSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        const ctx = getMobileNavContext();
        if (!ctx) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected) {
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
        const area = document.createElement('div');
        area.className = ctx.messagesArea.className;
        const row = document.createElement('div');
        if (ctx.nativeRow) row.className = ctx.nativeRow.className;
        const link = document.createElement('a');
        link.className = ctx.messagesLink.className;
        link.href = '#';
        link.tabIndex = 0;
        link.classList.add('slh-native-link');
        link.setAttribute('aria-label', 'Open SakaLuX Script Hub');
        link.setAttribute('title', 'SakaLuX Script Hub');
        const iconWrap = document.createElement('span');
        if (ctx.nativeIconWrap) iconWrap.className = ctx.nativeIconWrap.className;
        const innerIcon = document.createElement('span');
        if (ctx.nativeDefaultIcon) innerIcon.className = ctx.nativeDefaultIcon.className;
        innerIcon.classList.add('slh-native-skull-icon');
        innerIcon.style.setProperty('filter', 'none', 'important');
        innerIcon.style.setProperty('-webkit-filter', 'none', 'important');
        const skullSvg = buildSkullSvg(ctx.nativeSvg);
        if (skullSvg) innerIcon.appendChild(skullSvg); else innerIcon.textContent = '☠︎';
        iconWrap.appendChild(innerIcon);
        link.appendChild(iconWrap);
        const label = document.createElement('span');
        if (ctx.nativeLabel) label.className = ctx.nativeLabel.className;
        label.textContent = 'HUB';
        link.appendChild(label);
        const badge = document.createElement('span');
        badge.id = IDS.navBadge;
        link.appendChild(badge);
        const open = event => { event.preventDefault(); event.stopPropagation(); openHub(); };
        link.addEventListener('click', open);
        link.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(event); });
        row.appendChild(link);
        area.appendChild(row);
        let mounted;
        if (ctx.isSwiper && ctx.messagesSlide) {
            const slide = document.createElement('div');
            slide.className = ctx.messagesSlide.className.replace(/swiper-slide-active|swiper-slide-next|swiper-slide-prev|contextMenuActive___\S+/g, '').trim();
            if (ctx.messagesSlide.style.width) slide.style.width = ctx.messagesSlide.style.width;
            slide.appendChild(area);
            mounted = slide;
        } else mounted = area;
        mounted.id = IDS.navSkull;
        const reference = ctx.isSwiper ? ctx.messagesSlide : ctx.messagesArea;
        ctx.wrapper.insertBefore(mounted, reference);
        if (ctx.isSwiper) {
            try { ctx.wrapper.parentElement?.swiper?.update?.(); } catch {}
        }
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

    function updateTopbarSkullState() {
        const total = getIssueCount();
        for (const [skullId, badgeId] of [[IDS.topSkull, IDS.topBadge], [IDS.navSkull, IDS.navBadge]]) {
            const skull = document.getElementById(skullId);
            const badge = document.getElementById(badgeId);
            if (!skull) continue;
            skull.classList.toggle('slh-alert', total > 0);
            if (badge) {
                badge.style.display = total > 0 ? 'flex' : 'none';
                badge.textContent = total > 99 ? '99+' : String(total);
            }
        }
    }

    function updateBadge() {
        const total = getIssueCount();
        const badge = document.getElementById(IDS.badge);
        if (badge) {
            badge.style.display = total > 0 ? 'flex' : 'none';
            if (total > 0) badge.textContent = total > 99 ? '99+' : String(total);
        }
        updateTopbarSkullState();
    }

    function updateHiddenButtons() {
        for (const script of SCRIPTS) {
            if (!script.buttonSelector) continue;
            const moduleEnabled = isModuleEnabled(script);
            document.querySelectorAll(script.buttonSelector).forEach(element => {
                if (!moduleEnabled || settings.hideIndividualButtons) {
                    element.style.setProperty('display', 'none', 'important');
                    element.style.setProperty('visibility', 'hidden', 'important');
                } else {
                    element.style.removeProperty('display');
                    element.style.removeProperty('visibility');
                }
            });
        }
    }

    function closeHub() {
        document.getElementById(IDS.overlay)?.remove();
    }

    function createOverlay(content) {
        closeHub();
        const overlay = document.createElement('div');
        overlay.id = IDS.overlay;
        overlay.innerHTML = `<div id="${IDS.panel}">${content}</div>`;
        document.body.appendChild(overlay);
        overlay.onclick = event => { if (event.target === overlay) closeHub(); };
        return overlay;
    }

    function headerMarkup(title, subtitle, closeId, icon = '☠️', kicker = 'SAKALUX CONTROL CENTER') {
        return `<div class="slh-header"><div class="slh-headrow"><div class="slh-brand"><div class="slh-brand-icon">${icon}</div><div class="slh-brand-copy"><div class="slh-kicker">${escapeHtml(kicker)}</div><div class="slh-title">${escapeHtml(title)}</div><div class="slh-sub">${subtitle}</div></div></div><button class="slh-close" id="${closeId}" aria-label="Close">×</button></div></div>`;
    }

    function openHub() {
        const registryClass = registryStatus === 'online' ? 'online' : '';
        createOverlay(`
            <div class="slh-header">
                <div class="slh-headrow">
                    <div class="slh-brand">
                        <div class="slh-brand-icon">☠️</div>
                        <div class="slh-brand-copy">
                            <div class="slh-kicker">SAKALUX CONTROL CENTER</div>
                            <div class="slh-title">Script Hub</div>
                            <div class="slh-sub"><span class="slh-registry-dot ${registryClass}"></span>v${VERSION} · Registry ${escapeHtml(registryStatus)} · ${SCRIPTS.length} managed add-ons</div>
                        </div>
                    </div>
                    <button class="slh-close" id="slh-close" aria-label="Close">×</button>
                </div>
                <div class="slh-stats" id="slh-stats"></div>
                <div class="slh-tools">
                    <button class="slh-tool" id="slh-update-check" title="Refresh registry and check updates"><span>↻</span>CHECK</button>
                    <button class="slh-tool" id="slh-update-all" title="Refresh registry and update all"><span>⇧</span>UPDATE</button>
                    <button class="slh-tool" id="slh-health" title="System check"><span>◉</span>HEALTH</button>
                    <button class="slh-tool whatsnew" id="slh-whats-new" title="What's new"><span>✦</span>NEW</button>
                    <button class="slh-tool settings" id="slh-settings" title="Settings"><span>⚙</span>SETTINGS</button>
                </div>
                <div class="slh-cats" id="slh-cats"></div>
            </div>
            <div class="slh-list" id="slh-list"></div>
            <div class="slh-bottom"><div class="slh-bottom-grid"><button class="slh-bottom-btn" id="slh-money">💸 SEND MONEY</button><button class="slh-bottom-btn" id="slh-items">🎁 SEND ITEMS</button></div></div>
            <div class="slh-footer">Made with ❤️ by <a class="slh-author" id="slh-author" href="${PROFILE_URL}">SakaLuX [2380374]</a></div>
        `);
        document.getElementById('slh-close').onclick = closeHub;
        document.getElementById('slh-update-check').onclick = refreshRegistryAndCheck;
        document.getElementById('slh-update-all').onclick = updateAll;
        document.getElementById('slh-health').onclick = openSystemCheck;
        document.getElementById('slh-whats-new').onclick = openWhatsNew;
        document.getElementById('slh-settings').onclick = openSettings;
        document.getElementById('slh-money').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-items').onclick = () => location.href = PROFILE_URL;
        document.getElementById('slh-author').onclick = event => { event.preventDefault(); location.href = PROFILE_URL; };
        renderMainStats();
        renderCategories();
        renderList();
        updateCheckButtonState(updateCheckRunning);
        if (settings.autoCheckUpdates) checkAllUpdates(false);
    }

    function renderMainStats() {
        const box = document.getElementById('slh-stats');
        if (!box) return;
        const rows = getAllHealth();
        const installed = rows.filter(r => r.health.state !== 'missing').length;
        const healthy = rows.filter(r => r.health.state === 'ok').length;
        const issues = rows.filter(r => r.health.state === 'error').length + getUpdateErrorCount();
        const updates = getUpdateCount();
        box.innerHTML = `
            <div class="slh-stat good"><strong>${installed}/${SCRIPTS.length}</strong><span>INSTALLED</span><small>managed modules</small></div>
            <div class="slh-stat good"><strong>${healthy}</strong><span>HEALTHY</span><small>reporting OK</small></div>
            <div class="slh-stat ${updates ? 'warn' : 'good'}"><strong>${updates}</strong><span>UPDATES</span><small>${updates ? 'action available' : 'all current'}</small></div>
            <div class="slh-stat ${issues ? 'bad' : 'good'}"><strong>${issues}</strong><span>ISSUES</span><small>${issues ? 'needs attention' : 'system clear'}</small></div>`;
    }

    function updateCheckButtonState(loading) {
        const button = document.getElementById('slh-update-check');
        if (!button) return;
        button.disabled = Boolean(loading);
        button.classList.toggle('checking', Boolean(loading));
        button.innerHTML = loading ? '<span>…</span>CHECKING' : '<span>↻</span>CHECK';
    }

    function renderCategories() {
        const box = document.getElementById('slh-cats');
        if (!box) return;
        const categories = ['ALL', ...new Set(SCRIPTS.map(s => s.category || 'Other'))];
        box.innerHTML = categories.map(value => `<button class="slh-cat ${category === value ? 'active' : ''}" data-category="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join('');
        box.querySelectorAll('[data-category]').forEach(button => {
            button.onclick = () => { category = button.dataset.category; renderCategories(); renderList(); };
        });
    }

    function renderList() {
        const list = document.getElementById('slh-list');
        if (!list) return;
        let rows = getAllHealth().map(row => ({ ...row, favorite: favorites.has(row.script.id), usage: usage[row.script.id] || { count: 0, lastUsed: 0 }, update: getUpdateState(row.script) }));
        rows = rows.filter(row => category === 'ALL' || row.script.category === category);
        rows.sort((a, b) => {
            if (a.health.state === 'missing' && b.health.state !== 'missing') return -1;
            if (b.health.state === 'missing' && a.health.state !== 'missing') return 1;
            if (a.update.state === 'available' && b.update.state !== 'available') return -1;
            if (b.update.state === 'available' && a.update.state !== 'available') return 1;
            if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
            return b.usage.count - a.usage.count;
        });
        list.innerHTML = `<div class="slh-section-label">${category === 'ALL' ? 'MANAGED MODULES' : escapeHtml(category) + ' MODULES'} · ${rows.length}</div>` + (rows.map(renderCard).join('') || '<div style="padding:30px;text-align:center;color:#78889b">No modules found.</div>');
        bindCards();
    }

    function renderCard(row) {
        const script = row.script;
        const health = row.health;
        const update = row.update;
        const installed = getInstalledVersion(script);
        const latest = update.data?.latest || script.expectedVersion || '?';
        const missing = health.state === 'missing';
        let extra = '';
        if (script.id === 'enhancer' && health.data) extra = `Inventory ${health.data.inventoryEntries ?? 0}`;
        if (script.id === 'bazaar' && health.data) extra = (health.data.onEvents || health.data.onMessages) ? `Buyers ${health.data.buyers ?? 0}` : 'Standby';
        if (script.id === 'mission-rewards' && health.data) extra = health.data.onMissions === false ? 'Standby' : `Rewards ${health.data.rewardCards ?? 0}`;
        const enabled = !missing && isModuleEnabled(script);
        const moduleApi = script.api();
        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id));
        const primary = getPrimaryAction(script);
        const primaryLabel = /settings/i.test(primary.label || '') ? 'SETTINGS' : 'OPEN';
        const updateChipClass = update.state === 'current' ? 'good' : update.state === 'available' ? 'warn' : update.state === 'failed' ? 'bad' : 'muted';
        const healthChipClass = health.state === 'ok' ? 'good' : health.state === 'error' ? 'bad' : 'warn';
        const controls = missing
            ? `<button class="slh-switch off" type="button" role="switch" aria-checked="false" disabled><span class="slh-switch-track"><i></i></span><b>OFF</b></button><button class="slh-primary install" data-install="${escapeHtml(script.id)}">INSTALL</button>`
            : `<button class="slh-switch ${enabled ? 'on' : 'off'}" type="button" role="switch" aria-checked="${enabled ? 'true' : 'false'}" data-module-toggle="${escapeHtml(script.id)}" title="${powerReady ? `Turn ${escapeHtml(script.name)} ${enabled ? 'off' : 'on'}` : `Update ${escapeHtml(script.name)} to enable native power control`}" ${powerReady ? '' : 'disabled'}><span class="slh-switch-track"><i></i></span><b>${enabled ? 'ON' : 'OFF'}</b></button><button class="slh-primary" data-script="${escapeHtml(script.id)}" data-action="${escapeHtml(primary.id)}" ${enabled ? '' : 'disabled'}>${primaryLabel}</button>`;
        return `<div class="slh-card ${update.state === 'available' ? 'update' : ''} ${missing ? 'missing' : ''} ${!missing && !enabled ? 'off' : ''}">
            <div class="slh-icon">${script.icon || '🧩'}</div>
            <div class="slh-card-copy">
                <div class="slh-name-line"><div class="slh-name">${escapeHtml(script.name)}</div><span class="slh-category-chip">${escapeHtml(script.category || 'Other')}</span></div>
                ${script.description ? `<div class="slh-description">${escapeHtml(script.description)}</div>` : ''}
                <div class="slh-chips">
                    <span class="slh-chip ${healthChipClass}">${missing ? 'NOT INSTALLED' : 'v' + escapeHtml(installed || health.version || '?')}</span>
                    <span class="slh-chip ${updateChipClass}">${escapeHtml(update.text)}</span>
                    ${!missing ? `<span class="slh-chip ${enabled ? 'good' : 'bad'}">${enabled ? 'ACTIVE' : 'DISABLED'}</span>` : ''}
                    ${latest !== '?' && update.state === 'available' ? `<span class="slh-chip info">LATEST v${escapeHtml(latest)}</span>` : ''}
                    ${extra ? `<span class="slh-chip muted">${escapeHtml(extra)}</span>` : ''}
                    ${update.data?.checkedAt ? `<span class="slh-chip muted">${escapeHtml(formatAgo(update.data.checkedAt))}</span>` : ''}
                </div>
            </div>
            <div class="slh-module-controls">${controls}</div>
        </div>`;
    }

    function bindCards() {
        document.querySelectorAll('[data-module-toggle]').forEach(button => {
            button.onclick = async () => {
                const id = button.dataset.moduleToggle;
                const next = button.getAttribute('aria-checked') !== 'true';
                button.disabled = true;
                try { await setModulePower(id, next); }
                catch (error) { console.error('[SakaLuX Hub]', error); alert('Power control failed: ' + String(error?.message || error)); renderList(); }
            };
        });
        document.querySelectorAll('[data-install]').forEach(button => button.onclick = () => {
            const script = SCRIPTS.find(item => item.id === button.dataset.install);
            const url = script ? getInstallUrl(script) : '';
            if (url) location.href = url;
        });
        document.querySelectorAll('[data-update]').forEach(button => button.onclick = () => {
            const script = SCRIPTS.find(item => item.id === button.dataset.update);
            const url = script ? getInstallUrl(script) : '';
            if (url) location.href = url;
        });
        document.querySelectorAll('[data-script][data-action]').forEach(button => { button.onclick = () => runAction(button.dataset.script, button.dataset.action); });
    }

    async function runAction(id, actionId) {
        const script = SCRIPTS.find(item => item.id === id);
        if (!script) return;
        const api = script.api();
        if (!api) {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            if (bridge) {
                bridge.dataset.action = 'open';
                bridge.click();
                recordUsage(id);
                closeHub();
                return;
            }
            if (script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            if (getInstalledVersion(script)) {
                alert(script.name + ' is installed, but this version needs the Violentmonkey bridge update before Hub can open it.');
                return;
            }
            const url = getInstallUrl(script);
            if (url) location.href = url;
            return;
        }
        const action = script.quickActions.find(item => item.id === actionId) || { method: actionId };
        const isPanelAction = actionId === getPrimaryAction(script).id || actionId === 'open' || actionId === 'settings';
        try {
            if (typeof api[action.method] === 'function') {
                recordUsage(id);
                const result = await api[action.method]();
                if (result === false && action.fallbackUrl) { location.href = action.fallbackUrl; return; }
                if (isPanelAction) closeHub(); else setTimeout(openHub, 100);
                return;
            }
            if (action.fallbackUrl) { recordUsage(id); location.href = action.fallbackUrl; return; }
            if (isPanelAction && script.fallbackOpen()) { recordUsage(id); closeHub(); return; }
            alert(script.name + ' is not available on this page.');
        } catch (error) {
            console.error('[SakaLuX Hub]', error);
            alert('Action failed: ' + String(error?.message || error));
        }
    }

    async function updateAll() {
        await refreshRegistryAndCheck();
        const updates = SCRIPTS.filter(script => getUpdateState(script).state === 'available' && getInstallUrl(script));
        if (!updates.length) { alert('All installed SakaLuX add-ons are up to date.'); return; }
        if (!confirm('Open ' + updates.length + ' update installer' + (updates.length === 1 ? '' : 's') + ' now?')) return;
        let opened = 0;
        for (const script of updates) {
            try { const win = window.open(getInstallUrl(script), '_blank'); if (win) opened++; } catch {}
        }
        if (opened < updates.length) alert('Some installer tabs were blocked. Use the individual update installer for the remaining add-ons.');
    }

    function openWhatsNew() {
        createOverlay(`${headerMarkup("What's New", 'SakaLuX Script Hub release notes', 'slhn-close', '✦', 'RELEASE CENTER')}<div class="slh-view">${HUB_CHANGELOG.map(release => `<div class="slh-note"><div class="slh-version-title">v${escapeHtml(release.version)} <span class="slh-version-date">${escapeHtml(release.date)}</span></div>${release.changes.map(change => `<div>• ${escapeHtml(change)}</div>`).join('')}</div>`).join('')}<button class="slh-big-btn" id="slhn-back">← BACK</button></div>`);
        document.getElementById('slhn-close').onclick = closeHub;
        document.getElementById('slhn-back').onclick = openHub;
    }

    async function openSystemCheck() {
        createOverlay(`${headerMarkup('System Check', 'Registry, update sources and local module health', 'slhc-close', '◉', 'DIAGNOSTICS')}<div class="slh-view" id="slhc-results"><div class="slh-note">⏳ Running diagnostics...</div></div>`);
        document.getElementById('slhc-close').onclick = closeHub;
        const results = [];
        try {
            const data = JSON.parse(await httpGet(REGISTRY_URL + '?check=' + Date.now()));
            results.push({ level: Array.isArray(data?.scripts) ? 'ok' : 'bad', label: 'scripts.json registry', detail: Array.isArray(data?.scripts) ? data.scripts.length + ' add-ons found' : 'Invalid registry' });
        } catch (error) { results.push({ level: 'bad', label: 'scripts.json registry', detail: String(error?.message || error) }); }
        for (const script of SCRIPTS) {
            try {
                const published = parseMetaVersion(await httpGet(script.metaUrl));
                const canonical = canonicalLatestVersion(script, published);
                const behind = Boolean(published && compareVersions(published, script.expectedVersion) < 0);
                results.push({ level: behind || !published ? 'warn' : 'ok', label: script.name + ' update source', detail: 'Canonical v' + canonical + (published ? ' • Greasy Fork v' + published + (behind ? ' (mirror behind; GitHub source used)' : '') : ' • Greasy Fork unavailable') });
            } catch (error) { results.push({ level: 'warn', label: script.name + ' update source', detail: 'Canonical Registry v' + script.expectedVersion + ' • ' + String(error?.message || error) }); }
            const health = getHealth(script);
            results.push({ level: health.state === 'ok' ? 'ok' : health.state === 'missing' ? 'warn' : 'bad', label: script.name + ' local status', detail: health.state === 'missing' ? 'Not installed' : health.state === 'ok' ? 'Installed v' + health.version : String(health.data?.error || 'Error') });
        }
        results.push({ level: 'ok', label: 'SakaLuX Script Hub', detail: 'Loaded v' + VERSION + ' • API exposed' });
        results.push({ level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn', label: 'Torn status-bar HUB launcher', detail: document.getElementById(IDS.topSkull) ? 'Mounted inside Torn statusIcons using native cell classes' : 'Torn statusIcons not detected — floating skull fallback active' });
        const box = document.getElementById('slhc-results');
        if (!box) return;
        box.innerHTML = results.map(result => `<div class="slh-check-row slh-check-${result.level}">${result.level === 'ok' ? '🟢' : result.level === 'warn' ? '🟠' : '🔴'} <b>${escapeHtml(result.label)}</b><br><span style="color:#8fa0b3">${escapeHtml(result.detail)}</span></div>`).join('') + '<button class="slh-big-btn" id="slhc-back">← BACK</button>';
        document.getElementById('slhc-back').onclick = openHub;
    }

    function settingSwitch(id, title, description, enabled) {
        return `<div class="slh-setting"><div class="slh-setting-row"><div class="slh-setting-copy"><div class="slh-setting-title">${escapeHtml(title)}</div><div class="slh-setting-desc">${escapeHtml(description)}</div></div><button class="slh-setting-toggle ${enabled ? 'on' : ''}" id="${id}" type="button" role="switch" aria-checked="${enabled ? 'true' : 'false'}"><i></i></button></div></div>`;
    }

    function bindSettingToggle(id) {
        const button = document.getElementById(id);
        if (!button) return;
        button.onclick = () => {
            const next = button.getAttribute('aria-checked') !== 'true';
            button.setAttribute('aria-checked', next ? 'true' : 'false');
            button.classList.toggle('on', next);
        };
    }

    function settingToggleValue(id) {
        return document.getElementById(id)?.getAttribute('aria-checked') === 'true';
    }

    function openSettings() {
        createOverlay(`${headerMarkup('Hub Settings', `SakaLuX Script Hub v${VERSION}`, 'slhs-close', '⚙️', 'CONFIGURATION')}<div class="slh-settings">
            ${settingSwitch('slhs-hide', 'Hide individual script buttons', 'Keep each add-on launcher hidden while Hub manages access.', settings.hideIndividualButtons)}
            ${settingSwitch('slhs-topbar', 'Torn launchers', 'Show S before cash and, when Touchscreen Navigation uses Fly-out sidebar, show the skull before Messages. Otherwise use the floating skull fallback.', settings.showTopbarSkull)}
            ${settingSwitch('slhs-auto', 'Automatic update checks', 'Check published add-on versions automatically while the Hub is running.', settings.autoCheckUpdates)}
            <div class="slh-settings-pair"><div class="slh-setting">Fallback button position<select id="slhs-position"><option value="top-right">Top right</option><option value="middle-right">Middle right</option><option value="bottom-right">Bottom right</option><option value="top-left">Top left</option></select></div><div class="slh-setting">Language<select id="slhs-language">${Object.entries(LOCALES).map(([code,locale])=>`<option value="${escapeHtml(code)}">${escapeHtml(locale.label)}</option>`).join('')}</select></div></div>
            <div class="slh-setting">Fallback button size: <b id="slhs-size-label">${settings.buttonSize}px</b><input id="slhs-size" type="range" min="38" max="64" step="2" value="${settings.buttonSize}"></div>
            <div class="slh-setting"><b>🔑 SHARED SAKALUX TORN API KEY</b><div style="margin-top:4px;color:#8fa0b3">One key for Enhancer Guard, Mission Rewards, Market Intelligence and Elimination Assistant. Bazaar Thanker does not require a Torn API key.</div><div id="slhs-api-status" style="margin-top:6px;color:${getSharedApiKey() ? '#72d6a2' : '#e7c675'}">${getSharedApiKey() ? '✅ Shared key saved' : '⚠️ No shared key saved'}</div><input id="slhs-api-key" type="password" autocomplete="off" placeholder="Paste the newly created Torn API key"><button class="slh-big-btn update" id="slhs-api-create">🔑 CREATE GENERAL API KEY</button><div class="slh-api-actions"><button class="slh-big-btn" id="slhs-api-save">SAVE & TEST</button><button class="slh-big-btn red" id="slhs-api-clear">CLEAR KEY</button></div></div>
            <button class="slh-big-btn" id="slhs-save">💾 SAVE SETTINGS</button><button class="slh-big-btn gray" id="slhs-backup">📤 BACKUP</button><button class="slh-big-btn gray" id="slhs-restore">📥 RESTORE</button><button class="slh-big-btn red" id="slhs-reset">🧹 RESET HUB</button><button class="slh-big-btn gray" id="slhs-back">← BACK</button>
        </div>`);
        const position = document.getElementById('slhs-position');
        const languageSelect = document.getElementById('slhs-language');
        const size = document.getElementById('slhs-size');
        position.value = settings.buttonPosition;
        languageSelect.value = language();
        languageSelect.onchange = function () { settings.language = LOCALES[this.value] ? this.value : 'en'; saveJson(STORAGE.settings, settings); applyLanguage(); openSettings(); };
        size.oninput = function () { document.getElementById('slhs-size-label').textContent = this.value + 'px'; };
        bindSettingToggle('slhs-hide');
        bindSettingToggle('slhs-topbar');
        bindSettingToggle('slhs-auto');
        document.getElementById('slhs-close').onclick = closeHub;
        document.getElementById('slhs-back').onclick = openHub;
        document.getElementById('slhs-api-create').onclick = createSharedApiKey;
        document.getElementById('slhs-api-save').onclick = async () => {
            const input = document.getElementById('slhs-api-key');
            const status = document.getElementById('slhs-api-status');
            const key = input.value.trim() || getSharedApiKey();
            status.style.color = '#e7c675'; status.textContent = '⏳ Testing shared key...';
            try { await testSharedApiKey(key); setSharedApiKey(key); input.value = ''; status.style.color = '#72d6a2'; status.textContent = '✅ Shared key valid and saved'; }
            catch (error) { status.style.color = '#f09aa8'; status.textContent = '❌ ' + String(error?.message || error); }
        };
        document.getElementById('slhs-api-clear').onclick = () => { if (!confirm('Remove the shared SakaLuX Torn API key?')) return; setSharedApiKey(''); openSettings(); };
        document.getElementById('slhs-save').onclick = () => {
            settings.hideIndividualButtons = settingToggleValue('slhs-hide');
            settings.showTopbarSkull = settingToggleValue('slhs-topbar');
            settings.autoCheckUpdates = settingToggleValue('slhs-auto');
            settings.buttonPosition = position.value;
            settings.language = LOCALES[languageSelect.value] ? languageSelect.value : 'en';
            settings.buttonSize = Number(size.value);
            delete settings.longPressQuickMenu;
            saveJson(STORAGE.settings, settings);
            updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); openHub();
        };
        document.getElementById('slhs-backup').onclick = backupSettings;
        document.getElementById('slhs-restore').onclick = restoreSettings;
        document.getElementById('slhs-reset').onclick = resetHub;
    }

    async function backupSettings() {
        const text = JSON.stringify({ app: 'SakaLuX Script Hub', version: VERSION, created: Date.now(), settings, favorites: [...favorites], usage });
        try { await navigator.clipboard.writeText(text); alert('Hub backup copied to clipboard.'); }
        catch { prompt('Copy this backup:', text); }
    }

    function restoreSettings() {
        const raw = prompt('Paste SakaLuX Hub backup:');
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.app !== 'SakaLuX Script Hub') throw new Error();
            settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
            delete settings.longPressQuickMenu;
            favorites = new Set(Array.isArray(data.favorites) ? data.favorites : []);
            usage = data.usage && typeof data.usage === 'object' ? data.usage : {};
            saveJson(STORAGE.settings, settings); saveJson(STORAGE.favorites, [...favorites]); saveJson(STORAGE.usage, usage);
            updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); alert('Backup restored.'); openHub();
        } catch { alert('Invalid Hub backup.'); }
    }

    function resetHub() {
        if (!confirm('Reset only SakaLuX Script Hub settings?')) return;
        Object.entries(STORAGE).forEach(([name, key]) => { if (name !== 'apiKey') localStorage.removeItem(key); });
        settings = { ...DEFAULT_SETTINGS }; favorites = new Set(); usage = {}; updateCache = {}; registry = FALLBACK_REGISTRY; SCRIPTS = normalizeRegistry(registry);
        updateHiddenButtons(); positionButton(); document.getElementById(IDS.topSkull)?.remove(); document.getElementById(IDS.navSkull)?.remove(); createTopbarSkull(); createNavSkull(); syncFloatingButtonVisibility(); updateBadge(); openHub();
    }

    function suppressStandaloneDock() {
        try {
            document.documentElement?.setAttribute('data-sakalux-hub-active', '1');
            document.body?.setAttribute('data-sakalux-hub-active', '1');
            for (const id of ['sakalux-standalone-dock','sakalux-hub-install-prompt','sakalux-standalone-native-s','sakalux-standalone-fallback-s']) {
                document.getElementById(id)?.remove();
            }
        } catch {}
    }

    function ensureEverything() {
        suppressStandaloneDock();
        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility();
    }

    function queueEnsure() {
        if (observerTimer) clearTimeout(observerTimer);
        observerTimer = setTimeout(() => { observerTimer = null; ensureEverything(); }, 300);
    }

    function startObserver() {
        if (observer) return;
        observer = new MutationObserver(mutations => { if (mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) queueEnsure(); });
        observer.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('hashchange', () => setTimeout(queueEnsure, 250));
    }

    window.SakaLuXScriptHub = {
        id: 'script-hub', name: 'SakaLuX Script Hub', version: VERSION, ready: true,
        open: () => { openHub(); return true; }, getApiKey: getSharedApiKey, setApiKey: setSharedApiKey,
        getLanguage: language, getLanguages:()=>Object.fromEntries(Object.entries(LOCALES).map(([code,locale])=>[code,locale.label])), setLanguage: value => { settings.language=LOCALES[value]?value:'en';saveJson(STORAGE.settings,settings);applyLanguage();return settings.language; },
        hasApiKey: () => Boolean(getSharedApiKey()), createRequiredTornKey: createSharedApiKey,
        refresh: async () => { await refreshRegistryAndCheck(); return true; },
        health: () => ({ ready: true, version: VERSION, registryStatus, addOns: SCRIPTS.length, installed: SCRIPTS.filter(script => script.api()).length, updates: getUpdateCount(), sharedApiKey: Boolean(getSharedApiKey()), nativeHubLauncher: Boolean(document.getElementById(IDS.topSkull)), flyoutHubLauncher: Boolean(document.getElementById(IDS.navSkull)), floatingFallback: !Boolean(document.getElementById(IDS.topSkull)) && !Boolean(document.getElementById(IDS.navSkull)) })
    };

    window.dispatchEvent(new CustomEvent('SakaLuX:ScriptHubReady', { detail: { version: VERSION } }));
    window.addEventListener('SakaLuX:EnhancerGuardReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:BazaarThankerReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:MissionRewardsReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:MarketIntelligenceReady', () => { queueEnsure(); renderList(); renderMainStats(); });

    async function init() {
        await loadLocaleRegistry();
        startLanguageObserver();
        ensureEverything();
        startObserver();
        await loadRegistry(false);
        setTimeout(ensureEverything, 700);
        setTimeout(ensureEverything, 1800);
        setTimeout(ensureEverything, 4000);
        try {
            if (sessionStorage.getItem('SakaLuX_HUB_API_SETUP_PENDING') === '1' && !/preferences\.php/i.test(location.pathname + location.href)) {
                sessionStorage.removeItem('SakaLuX_HUB_API_SETUP_PENDING');
                setTimeout(openSettings, 900);
            }
        } catch {}
        if (settings.autoCheckUpdates) setTimeout(() => checkAllUpdates(false), 1500);
        console.log('[SakaLuX Script Hub v' + VERSION + '] Loaded.');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})();
