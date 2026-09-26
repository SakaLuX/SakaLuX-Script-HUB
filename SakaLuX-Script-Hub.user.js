// ==UserScript==
// @name         SakaLuX Script Hub
// @namespace    sakalux.script.hub
// @version      1.9.84
// @description  Premium TornPDA control center for SakaLuX add-ons with clean module cards, persistent slide switches and one-tap panel access.
// @author       SakaLuX [2380374]
// @copyright    2026 SakaLuX [2380374]
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      update.greasyfork.org
// @connect      raw.githubusercontent.com
// @connect      api.torn.com
// @license      All Rights Reserved
// @downloadURL  https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js
// @updateURL    https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.meta.js
// @homepage     https://github.com/SakaLuX/SakaLuX-Script-HUB
// @supportURL   https://github.com/SakaLuX/SakaLuX-Script-HUB/issues
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

  // Shared SakaLuX performance + Hub-style UI foundation.
  (() => {
    const g = window;
    if (!g.SakaLuXPerf) {
      const timers = new Map();
      g.SakaLuXPerf = {
        debounce(key, fn, wait=220) {
          const old = timers.get(key); if (old) clearTimeout(old);
          const id = setTimeout(() => { timers.delete(key); fn(); }, Math.max(120, wait));
          timers.set(key,id); return id;
        },
        idle(fn, timeout=700) {
          if ('requestIdleCallback' in g) return g.requestIdleCallback(fn,{timeout});
          return setTimeout(fn,32);
        }
      };
    }
    // Ignore chat and our own dock/footer mutations in unrelated UI maintenance.
    if (!g.SakaLuXPerf.unrelated) g.SakaLuXPerf.unrelated = records => records.length > 0 && records.every(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return !!target?.closest?.('#chat-box,[id^="chat-box"],[class*="chat-box"],[class*="chatBox"],#sakalux-standalone-dock,[id^="sakalux-inline-footer-"]');
    });
    if (!document.getElementById('sakalux-shared-hub-skin')) {
      const st=document.createElement('style');
      st.id='sakalux-shared-hub-skin';
      st.textContent=`
:root{--slx-bg:#0b1118;--slx-card:#111a24;--slx-card2:#172331;--slx-border:#34465b;--slx-border-soft:rgba(255,255,255,.09);--slx-text:#edf3fa;--slx-muted:#93a4b7;--slx-blue:#4f8fe8;--slx-gold:#dfbd61;--slx-green:#55d98a;--slx-red:#ff6b78;--slx-shadow:0 16px 40px rgba(0,0,0,.46)}
body [id^="sakalux-"] button,body [id^="slx-"] button,body [class^="sakalux-"] button,body [class*=" sakalux-"] button{border-radius:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04);font-family:Inter,Arial,sans-serif;transition:border-color .15s ease,background .15s ease,transform .08s ease,opacity .15s ease}
body [id^="sakalux-"] button:active,body [id^="slx-"] button:active{transform:scale(.985)}
body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{border-radius:10px;border-color:#3a4d63;background:#151f2b;color:var(--slx-text);font-family:Inter,Arial,sans-serif}
body [id*="sakalux"][id*="panel"],body [id*="sakalux"][id*="modal"],body [id*="slx"][id*="panel"],body [id*="slx"][id*="modal"],body #slx-stock-inline{font-family:Inter,Arial,sans-serif;color:var(--slx-text);border-color:var(--slx-border);box-shadow:var(--slx-shadow)}
body [id^="sakalux-"] .header,body [id^="sakalux-"] .head,body [id^="slx-"] .header,body [id^="slx-"] .head{background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 42%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-color:var(--slx-border-soft)}
body [id^="sakalux-"] .card,body [id^="slx-"] .card{border-color:var(--slx-border-soft);background:linear-gradient(180deg,rgba(19,28,39,.98),rgba(11,17,24,.98))}
@media(max-width:700px){body [id^="sakalux-"] button,body [id^="slx-"] button{min-height:36px}body [id^="sakalux-"] input,body [id^="sakalux-"] select,body [id^="slx-"] input,body [id^="slx-"] select{min-height:36px}}
`;
      (document.head||document.documentElement).appendChild(st);
    }
  })();


    // Publish Hub presence immediately so add-ons never enter standalone mode while Hub is running.
    try {
        document.documentElement?.setAttribute('data-sakalux-hub-installed', '1');
        document.documentElement?.setAttribute('data-sakalux-hub-active', '1');
    } catch {}

    const VERSION = '1.9.82';
    const PROFILE_XID = '2380374';
    const PROFILE_URL = 'https://www.torn.com/profiles.php?XID=' + PROFILE_XID;
    const REGISTRY_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/scripts.json';
    const LOCALES_URL = 'https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/locales.json';
    const SHARED_API_KEY_URL = 'https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=SakaLuX%20Script%20Hub&user=basic,profile,workstats,job,money,travel,equipment,inventory,battlestats,ammo,stocks&company=profile,employees,stock&torn=items,elimination,eliminationteam,stocks&market=itemmarket';
    const UPDATE_CACHE_TIME = 24 * 60 * 60 * 1000;

    const IDS = {
        button: 'sakalux-hub-button',
        badge: 'sakalux-hub-badge',
        topSkull: 'sakalux-hub-top-skull',
        navSkull: 'sakalux-hub-nav-skull',
        overlay: 'sakalux-hub-overlay',
        panel: 'sakalux-hub-panel',
        style: 'sakalux-hub-style'
    };


    const HUB_CHANGELOG = [
        {"version": "1.9.84", "date": "2026-09-24", "changes": ["Stops installed module SETTINGS/OPEN actions from falling through to the install/source URL when the module API is unavailable on the current page.", "Bazaar Smart Pricer now routes to Bazaar first when needed; pressing it again opens its own settings through the module API.", "Keeps standalone module ordering deterministic across all shared dock renderers."]},
        {"version": "1.9.83", "date": "2026-09-19", "changes": ["Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.", "Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata."]},
        {"version": "1.9.82", "date": "2026-09-19", "changes": ["Makes the Fly-out Hub launcher a persistent native child of Torn's vertical navigation list, matching CAT-style behavior instead of viewport-driven mounting.", "Keeps SakaLuX Hub permanently as the first row of the vertical list while that Torn menu exists; scrolling no longer removes or recreates it.", "Keeps module INFO, NEW, scripts.json, offline fallback data, release documentation and version labels synchronized to the userscript metadata versions."]},
        {"version": "1.9.81", "date": "2026-09-19", "changes": ["Corrects Fly-out placement: SakaLuX Hub is now the first item in the vertical navigation list, immediately before Home and below the three quick-action icons.", "Clones the simple Home row instead of expandable/contact rows, so no inherited counter or chevron appears.", "Keeps the skull launcher artwork and alert blink while Topbar legacy remains handled by the native topbar launcher."]},
        {"version": "1.9.80", "date": "2026-09-19", "changes": ["Fly-out launcher now mounts in Torn's three-icon quick-action strip as the fourth button, after Messages, Events and Awards/Merits.", "Uses the actual visible icon row instead of text labels, fixing TornPDA layouts where those three buttons have no text nodes.", "Keeps the blinking skull artwork and removes inherited badges/labels from the cloned quick-action button."]},
        {"version": "1.9.79", "date": "2026-09-19", "changes": ["Corrects Fly-out placement: SakaLuX Hub is the fourth navigation button, immediately after Messages, Events and Awards/Merits.", "Removes inherited counters and chevrons from the Hub launcher.", "Topbar legacy keeps the Hub launcher immediately before Messages."]},
        {"version": "1.9.78", "date": "2026-09-19", "changes": ["Fly-out launcher now mounts as the first native sidebar row, directly before Gym, instead of cloning expandable contact rows near the bottom.", "Removes inherited counters and chevrons from the Hub fly-out row so no stray 1 or arrow appears.", "Keeps the blinking skull artwork and native Torn row styling."]},
        {"version": "1.9.77", "date": "2026-09-19", "changes": ["Restores the original blinking skull artwork for the native Hub navigation launcher.", "In Topbar (legacy) mode the Hub launcher is mounted immediately before Messages; in Fly-out mode it is mounted immediately after Messages, Events and Awards/Merits.", "Keeps the launcher inside Torn native navigation rows so sizing, spacing and scrolling match the selected navigation mode."]},
        {"version": "1.9.76", "date": "2026-09-18", "changes": ["Makes the Hub launcher independent of Torn Touchscreen Navigation mode: the fly-out menu gets a native Hub row whenever that menu exists, while the normal topbar S remains available in legacy topbar mode.", "Uses a cloned native Torn navigation row, matching the robust CAT-style approach instead of depending on one hashed menu container."]},
        {"version": "1.9.75", "date": "2026-09-18", "changes": ["Floating fallback launcher now appears only when neither native Hub launcher is actually mounted; scrolling the Torn header off-screen no longer triggers it.", "Audited all current top-level SakaLuX userscripts so none changes the font size of Torn native Points or Merits counters."]},
        {"version": "1.9.74", "date": "2026-09-18", "changes": ["Uses metadata-derived canonical installed versions for managed modules to prevent false UPDATE AVAILABLE states.", "Synchronizes scripts.json, the offline Hub registry, NEW release details and release markdown surfaces from the same release metadata."]},
        {"version": "1.9.73", "date": "2026-09-18", "changes": ["Synchronizes Stocks v0.8.7, Market v1.17.40 and Elimination v1.3.44 performance details and offline fallback.", "Updates cached NEW details without replacing saved preferences; shares overlapping registry/update refreshes."]},
        {"version": "1.9.72", "date": "2026-09-18", "changes": ["Avoids rewriting badge text when its value is unchanged, preventing self-triggered observer work.", "Ignores unrelated chat/dock/footer changes and coalesces launcher maintenance.", "Synchronizes current performance release notes for all seven registered modules."]},
        {"version": "1.9.71", "date": "2026-09-18", "changes": ["Expands INFO for all seven registered modules with readable feature sections.", "Synchronizes NEW with each current module release, including Stocks v0.8.5, Company v1.8.37, Mission v1.0.41 and Market v1.17.38.", "Updates offline details and refreshes stale cached module information without overriding newer release metadata."]},
        {version:'1.9.70',date:'2026-09-17',changes:['Synchronizes Market Intelligence v1.17.37 and Mission Rewards v1.0.36.','Both modules now use the complete working Elimination Assistant donation/footer implementation with their own panel selectors and footer IDs.']},
        {version:'1.9.69',date:'2026-09-17',changes:['Prevents Script Hub from injecting its legacy author-only fallback footer into Market Intelligence settings.','Market Intelligence keeps exactly one footer: SEND MONEY, SEND ITEMS, then Made with ❤️ by SakaLuX [2380374].','Preserves Market settings, calculations, cache controls and Suite launcher behavior unchanged.']},
        {version:'1.9.68',date:'2026-09-17',changes:['Synchronizes Stocks v0.7.12 and its full-width native-row layout release notes in the registry and offline INFO/NEW.']},
        {version:'1.9.67',date:'2026-09-17',changes:['Synchronizes Stocks v0.7.11 and its compact UI/footer release details in the registry and offline fallback.']},
        {version:'1.9.66',date:'2026-09-17',changes:['Restores the missing IDS map used by Hub launchers, overlay, panel and style selectors.','Fixes the runtime ReferenceError that prevented the Hub from opening in TornPDA.']},
        {version:'1.9.65',date:'2026-09-17',changes:['Keeps the floating Hub launcher visible whenever Torn/TornPDA leaves a native launcher mounted but not actually visible.','Makes launcher visibility checks use computed style and on-screen geometry instead of DOM presence only.','Synchronizes Stock Manager v0.7.9 panel/footer integration.']},
        {version:'1.9.64',date:'2026-09-17',changes:['Restores Hub launch controls defensively when Torn replaces native topbar/mobile navigation nodes.','Adds explicit Stock Manager POWER action to the Hub registry/fallback in addition to the generic ON/OFF switch.']},
        {version:'1.9.63',date:'2026-09-17',changes:['Moves Stock Manager & Advisor v0.7.8 public install/update checks to Greasy Fork script 596192 while retaining GitHub as source.']},
        {version:'1.9.62',date:'2026-09-17',changes:['Adds Stock Manager & Advisor v0.7.7 to the managed modules, offline registry and INFO/NEW release details.','Stocks installs and checks updates from its main GitHub source.']},
        {version:'1.9.61',date:'2026-09-17',changes:["Synchronizes module INFO/NEW fallback details and versions with the registry.","Updates release histories and registered-module documentation after the UI and performance audit."]},
        {version:'1.9.60',date:'2026-09-17',changes:['Shrinks INSTALLED / HEALTHY / UPDATES / ISSUES status cards to 38px.','Sets CHECK / UPDATE / HEALTH / NEW / SETTINGS buttons to 32px, matching module INFO / NEW controls.']},
        {version:'1.9.59',date:'2026-09-17',changes:['Uses Elimination mobile panel geometry: rounded 14px corners, 4px side gaps and 36px bottom clearance for chat.','Shrinks SEND MONEY / SEND ITEMS buttons to 20px.']},
        {version:'1.9.58',date:'2026-09-17',changes:['Reduces SEND MONEY / SEND ITEMS buttons to 40px and donation section to 48px.','Shares the same compact donation and author footer with SakaLuX module panels.']},
        {version:'1.9.57',date:'2026-09-17',changes:[
            'Fixes Hub Settings switch dimensions and centers the thumb in both ON and OFF states.',
            'Keeps switch thumbs inside their tracks despite older shared/mobile styles.'
        ]},
        {version:'1.9.56',date:'2026-09-17',changes:[
            'UI refinement: full-height mobile Hub, compact author footer and rounded donation/footer outer corners.',
            'Keeps SEND MONEY and SEND ITEMS visible while Managed Modules scroll independently.',
            'Performance tweaks: lightweight mobile rendering, disabled blur/animations and fewer global DOM scans.'
        ]},
        { version: '1.9.55', date: '2026-09-17', changes: ['Makes Hub use the same reliable full-screen container model as Enhancer Guard and Market Intelligence.','The overlay owns the viewport with fixed inset:0 and maximum stacking; the Hub panel fills that container with flex instead of using a second fixed viewport.','Removes double-fixed geometry that could leave unused space at the bottom in TornPDA.','Keeps blur disabled and Managed Modules as the only primary scroll surface.'] },
        { version: '1.9.54', date: '2026-09-17', changes: ['Extends the TornPDA Hub sheet to the lower host edge and makes SEND MONEY / SEND ITEMS plus the author line a real non-overlapping flex footer.','Removes full-screen backdrop blur from the Hub scroll surface while keeping a subtle header blur for a smoother GPU path.','Disconnects Hub DOM observation while Hub sheets are open and removes the global language MutationObserver.','OPEN/SETTINGS now closes the Hub before awaiting a module API so taps feel immediate.','Managed standalone observers fully disconnect once Script Hub is detected.'] },
        { version: '1.9.52', date: '2026-09-17', changes: ['Extends the mobile Hub lower into the available TornPDA area so the author footer sits closer to the bottom navigation.','Keeps SEND MONEY / SEND ITEMS fully visible above the author footer.','Reduces mobile blur/shadow compositor cost and contains module cards for smoother scrolling.','Hub DOM and language observers now ignore unrelated Torn mutations while the Hub is open.','Managed module standalone bootstraps no longer run periodic render loops while Script Hub is active.'] },
        { version: '1.9.51', date: '2026-09-17', changes: ['Moves SEND MONEY / SEND ITEMS and the author footer to a compact bottom overlay so more module cards remain visible.','Keeps only Managed Modules as the primary Hub scroll surface.','Removes the expensive document-wide Mobile Surface scan and the obsolete 1.2-second card repair timer.','Replaces the global managed-footer MutationObserver with a one-shot repair to reduce TornPDA DOM overhead.'] },
        { version: '1.9.50', date: '2026-09-17', changes: ['Restores list-only scrolling: Hub chrome stays fixed while Managed Modules scrolls independently.','Removes the shared full-sheet geometry mutation from add-on panels, restoring Standalone OPEN behavior.','Keeps TornPDA host sizing and blur without forcing add-on panel dimensions.'] },
        { version: '1.9.49', date: '2026-09-17', changes: ['Fixes TornPDA vertical scrolling by sizing Hub to the available host container instead of forcing physical 100dvh.','Makes the complete Hub panel the vertical pan-y scroll surface so footer and bottom actions remain reachable.','Keeps blur and the 2x2 module controls while removing the fixed fullscreen override that could extend under TornPDA navigation.'] },
        { version: '1.9.48', date: '2026-09-17', changes: ['Makes Hub a true top-to-bottom mobile sheet with translucent blur.','Enforces INFO / ON-OFF / NEW / OPEN-SETTINGS as a runtime 2x2 module control block.','Introduces the shared SakaLuX full-height + blur surface contract.','Company Intelligence now uses whole-sheet scrolling and orange SakaLuX attribution.'] },
        {
            version: '1.9.47',
            date: '2026-09-17',
            changes: [
                'Applies the mobile top-alignment contract directly in every managed module and Chat Intelligence.',
                'Forces module INFO, NEW, ON/OFF and OPEN/SETTINGS controls into the right-side 2x2 block after legacy CSS.',
                'Normalizes compact Hub Settings switches after all older mobile rules.'
            ]
        },
        {
            version: '1.9.46',
            date: '2026-09-16',
            changes: [
                'Keeps INFO, NEW, ON/OFF and OPEN/SETTINGS in a compact right-side 2x2 control block on PDA cards.',
                'Pins Hub and managed SakaLuX sheets to the top of the available Torn viewport.',
                'Shrinks and normalizes Hub Settings switches.',
                'Makes Company Intelligence scrollable from the whole sheet and keeps the complete SakaLuX footer visible above TornPDA navigation.',
                'Removes the Company status line so only the author footer remains.'
            ]
        },
        {
            version: '1.9.45',
            date: '2026-09-16',
            changes: [
                'Moves INFO, NEW, ON/OFF and OPEN/SETTINGS into a compact 2x2 control block on the right side of every managed module card.',
                'Pins the Hub sheet to the top of the available Torn viewport on mobile instead of leaving unused space above it.',
                'Refines Hub Settings switches to smaller, cleaner proportions.',
                'Expands module INFO content with detailed feature descriptions from scripts.json.',
                'Company Intelligence now scrolls as one whole panel and keeps only the SakaLuX author footer at the bottom.'
            ]
        },
        {
            version: '1.9.44',
            date: '2026-09-16',
            changes: [
                'Rearranges managed module controls into two clean rows on mobile: INFO + ON/OFF, then NEW + OPEN/SETTINGS.',
                'Fixes Company Intelligence so its content scrolls independently while the author footer remains visible at the bottom of the panel.',
                'Makes Hub Settings switches compact and proportional instead of oversized on PDA/mobile screens.',
                'Keeps desktop module cards unchanged while improving narrow-screen readability and preventing clipped controls.'
            ]
        },
        {
            version: '1.9.43',
            date: '2026-09-16',
            changes: [
                'Adds native INFO and NEW controls to every managed module card.',
                'Keeps module cards focused on version, update status, ACTIVE/DISABLED state and last-check time.',
                'INFO explains exactly what a module does; NEW shows that module current release notes from scripts.json.',
                'Uses Greasy Fork again as the official public version/update source for managed modules.',
                'Stabilizes the Made with ❤️ by SakaLuX [2380374] footer inside managed module panels.',
                'Removes the temporary standalone Hub Card UX userscript because its behavior is now native to Script Hub.'
            ]
        },
        {
            version: '1.9.40',
            date: '2026-09-15',
            changes: [
                'Fixes installed-version reporting when an add-on header was updated but its runtime bridge constant was still stale.',
                'Installed version detection now compares bridge, API/health and standalone registration signals and uses the newest valid version.',
                'Synchronizes runtime version constants for Enhancer, Bazaar, Missions and Market with their current userscript headers.'
            ]
        },
        {
            version: '1.9.39',
            date: '2026-09-15',
            changes: [
                'Publishes Hub presence immediately at script startup so add-ons cannot fall into standalone mode when Hub is installed.',
                'Company Intelligence v1.8.13 now uses the same Hub-presence signals as the other managed add-ons and registers itself with the standalone dock only when Hub is genuinely absent.',
                'Company Intelligence public update metadata now follows its published Greasy Fork script 595873.'
            ]
        },
        {
            version: '1.9.38',
            date: '2026-09-15',
            changes: [
                'Built directly from the known-good v1.9.37 baseline.',
                'Synchronizes the offline fallback registry with the current live registry: Enhancer Guard v1.3.31, Bazaar Thanker v5.3.21, Mission Rewards v1.0.18, Market Intelligence v1.17.19, Elimination Assistant v1.3.31 and Company Intelligence v1.8.12.',
                'Adds Company Intelligence to Hub management and aligns its update source with its actual GitHub distribution channel to prevent a false PUBLISH PENDING state.',
                'Keeps Market Intelligence on its configured Greasy Fork distribution source; PUBLISH PENDING is shown only while Greasy Fork is genuinely behind the registry version.',
                'Improves pending-version chips to show the published version and registry version separately, and rotates update/registry caches after the registry expansion.'
            ]
        },
        {
            version: '1.9.37',
            date: '2026-09-13',
            changes: [
                'Rotates the persistent registry and update cache keys so stale rolled-back add-on versions cannot survive a Hub update.',
                'Mission Rewards now starts from registry v1.0.18 instead of cached v1.0.21 PUBLISH PENDING state.',
                'Keeps scripts.json and the offline fallback registry as the authoritative current version sources.'
            ]
        },
        {
            version: '1.9.36',
            date: '2026-09-13',
            changes: [
                'Invalidates stale registry and update caches after an add-on registry rollback.',
                'Prevents rolled-back modules from showing an obsolete REGISTRY version as PUBLISH PENDING.',
                'Mission Rewards registry state now resolves cleanly to the restored stable v1.0.18.'
            ]
        },
        {
            version: '1.9.35',
            date: '2026-09-13',
            changes: [
                'Installation status now uses live module presence only.',
                'Removed persistent local installation markers from installed/active detection.',
                'Deleted modules can no longer remain as installed ghost entries in Hub.'
            ]
        },
        {
            version: '1.9.34',
            date: '2026-09-13',
            changes: [
                'Removed userscript-manager-specific compatibility handling from Script Hub.',
                'Module control now uses only the generic runtime API or DOM bridge integration.',
                'Removed the obsolete manager-specific compatibility release entry from the active Hub changelog.'
            ]
        },
        {
            version: '1.9.33',
            date: '2026-09-12',
            changes: [
                'Places every managed add-on panel above the shared standalone dock.',
                'Keeps the standalone SakaLuX Scripts dock below active module panels so it never covers controls or content.',
                'Synchronizes all five managed add-on patch versions after the stacking fix.'
            ]
        },
        {
            version: '1.9.32',
            date: '2026-09-12',
            changes: [
                'Restores the Hub panel runtime accidentally removed during the bridge-only launcher migration.',
                'Fixes the S status launcher, Fly-out HUB launcher and floating fallback so all open the Hub panel again.',
                'Adds runtime validation for openHub, closeHub and createOverlay to prevent this regression.'
            ]
        },
        {
            version: '1.9.31',
            date: '2026-09-12',
            changes: [
                'All five managed add-ons now use bridge/API-only access with no individual floating launcher buttons.',
                'Bazaar Thanker, Mission Rewards and Elimination Assistant no longer create their own page launchers.',
                'Removed the obsolete Hide individual script buttons setting and cleans up legacy launchers from older loaded versions.'
            ]
        },
        {
            version: '1.9.30',
            date: '2026-09-12',
            changes: [
                'Removes the Market Intelligence and Enhancer Guard floating launch buttons from their source scripts entirely.',
                'Hub and standalone access now open those panels through their hidden module bridge/API instead of visible page buttons.',
                'Removes obsolete Market/Enhancer button selectors and the temporary forced-hide CSS.'
            ]
        },
        {
            version: '1.9.29',
            date: '2026-09-12',
            changes: [
                'Always hides the floating Market and Enhancers launch buttons while Script Hub is active.',
                'Keeps both module buttons in the DOM so Hub OPEN actions continue to work.',
                'Prevents stale local Hide individual script buttons settings from making these two launchers reappear.'
            ]
        },
        {
            version: '1.9.28',
            date: '2026-09-12',
            changes: [
                'Fixes Bazaar Thanker runtime version reporting mismatch that caused a permanent false update badge.',
                'Installed-version detection now prefers live bridge/API/standalone registration data before localStorage markers.',
                'Synchronizes all five Hub fallback registry versions with scripts.json.'
            ]
        },
        {
            version: '1.9.27',
            date: '2026-09-12',
            changes: [
                'Update availability now follows the version actually published by the configured Greasy Fork meta source.',
                'Registry versions ahead of Greasy Fork are shown as PUBLISH PENDING instead of creating an update loop.',
                'UPDATE no longer redirects to the raw GitHub source when the public distribution is behind.'
            ]
        },
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
        updates: 'SakaLuX_HUB_UPDATES_V19',
        registry: 'SakaLuX_HUB_REGISTRY_V21',
        locales: 'SakaLuX_HUB_LOCALES_V1',
        modulePower: 'SakaLuX_HUB_MODULE_POWER_V19',
        apiKey: 'SakaLuX_HUB_TORN_API_KEY'
    };

    const DEFAULT_SETTINGS = {
        buttonPosition: 'top-right',
        buttonSize: 48,
        language: 'en',
        autoCheckUpdates: true,
        showTopbarSkull: true
    };

    const FALLBACK_REGISTRY = {
        "scripts": [
            {
                "active": true,
                "apiGlobal": "SakaLuXEnhancerGuard",
                "buttonSelector": "#sl-eg-button",
                "category": "Inventory",
                "description": "Advanced Enhancer inventory tracker with dedicated API access setup for Torn PDA / Tampermonkey.",
                "downloadUrl": "https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.user.js",
                "greasyForkId": "592698",
                "icon": "🛡️",
                "id": "enhancer",
                "info": "Purpose\nEnhancer Guard helps you track Enhancers and Enhancer Relics in your Torn inventory and protect items you want to keep. It combines an inventory dashboard with Item Protector integration directly on Torn Items.\n\nInventory dashboard\nShows which tracked items you own, which are missing and the quantities available. Search locates individual items; filters and sorting narrow the list; favorites keep important items easy to find. Compact mode reduces space used on TornPDA. Refresh and hard refresh update the information, and optional auto-refresh can periodically refresh inventory data.\n\nItem protection\nDisplays lock badges for fully protected, partially protected and unlocked items. Partial protection lets you retain a chosen quantity instead of locking the entire item stack. Local protection settings and Item Protector state are used to keep the display consistent. Fully protected items are hidden or blocked in supported Bazaar sale-selection flows so they do not enter the selection accidentally.\n\nAPI and saved settings\nUses Torn API v2 inventory/item data and includes a dedicated API Access panel for creating, testing, saving or clearing the required key. Favorites, display preferences, protection quantities and cached inventory state are saved locally. Compatible Hub key integration is available; the module also works standalone.\n\nHow to use\nRefresh after inventory changes, search or filter for the item, then review its protection state and retained quantity. Inventory data can lag until refreshed. Protection is a local browser safeguard, so review Torn's final sale list before confirming any sale.",
                "metaUrl": "https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js",
                "name": "Enhancer Guard",
                "quickActions": [
                    {
                        "icon": "🛡️",
                        "id": "open",
                        "label": "OPEN",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "icon": "⚡",
                        "id": "hardRefresh",
                        "label": "HARD",
                        "method": "hardRefresh"
                    }
                ],
                "release": {
                    "version": "1.3.51",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Enhancer-Guard.user.js",
                "type": "addon",
                "version": "1.3.51",
                "detailsRevision": 4,
                "updateUrl": "https://update.greasyfork.org/scripts/592698/SakaLuX%20Enhancer%20Guard.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/592698",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Enhancer-Guard.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXBazaarThanker",
                "buttonSelector": "#sakalux-bt-settings-button",
                "category": "Trading",
                "description": "Bazaar buyer grouping, thank-you messages, statistics and history management.",
                "downloadUrl": "https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js",
                "greasyForkId": "592388",
                "icon": "💬",
                "id": "bazaar",
                "info": "Purpose\nBazaar Thanker organizes purchases from your Bazaar and helps prepare personal thank-you messages for customers. It reads Events and assists on Messages; Hub can detect and open its settings from other Torn pages.\n\nBuyer grouping and purchase details\nDetects supported Bazaar purchase events and groups purchases by buyer. Buyer details let you review the purchase information before preparing a message. Copy tools help reuse purchase or message information. Configurable big-buyer thresholds highlight customers by item count or amount spent.\n\nMessage customization\nUses a custom Bazaar name when supplied and automatic name detection when no custom name is configured. Message text is configurable so you can include your preferred greeting and Bazaar information. The thank-you workflow prepares text for Torn's messaging flow; review the recipient and final message before sending.\n\nHistory and repeat-message control\nKeeps local buyer/message history, statistics and processed-event state. A configurable cooldown avoids repeatedly thanking the same buyer too soon; the default is four hours. History-management controls help inspect or clear the records stored on the device.\n\nAccess and persistence\nDoes not need a Torn API key. Settings and working records are stored locally in TornPDA or the userscript environment. Script Hub provides detection, settings access and ON/OFF integration; the shared standalone dock can open the module when Hub is absent. Core purchase and message processing remains limited to the relevant Events and Messages pages.",
                "metaUrl": "https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js",
                "name": "Bazaar Thanker",
                "quickActions": [
                    {
                        "icon": "⚙️",
                        "id": "open",
                        "label": "SETTINGS",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=events",
                        "icon": "📋",
                        "id": "events",
                        "label": "EVENTS",
                        "method": "goToEvents"
                    }
                ],
                "release": {
                    "version": "5.3.43",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Thanker-PDA.user.js",
                "type": "addon",
                "version": "5.3.43",
                "detailsRevision": 2,
                "updateUrl": "https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/592388",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bazaar-Thanker.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXBazaarSmartPricer",
                "buttonSelector": ".qp-chip",
                "category": "Trading",
                "description": "Quick Pricer-parity Bazaar helper with per-item Quick Add/Undo, quantity + price fill, bulk pricing, RW/bonus protection and Hub-styled settings.",
                "downloadUrl": "https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.user.js",
                "icon": "💰",
                "id": "bazaar-smart-pricer",
                "info": "Purpose\\nBazaar Smart Pricer is now rebased on the proven Torn Bazaar Quick Pricer v2.9.3 behavior. Add Items gets the same compact per-item Quick Add/Undo control in the native item description area; one tap fills full quantity and calculated price. Manage Bazaar gets native price-update controls.\\n\\nBulk workflow\\nThe draggable Quick Fill / Update All chip and its gear button use the upstream behavior, including visible-row processing and progress.\\n\\nSafety\\nSkip RW weapons, Skip bonus items, Skip $1 items, NPC floor enforcement, discount/markup direction, price-change alert threshold and cache controls are available in Settings. RW and generic bonus skipping default to ON.\\n\\nHub integration\\nThe settings modal keeps the polished Quick Pricer layout but uses SakaLuX Hub dark tokens. API Access automatically prefers the Hub shared key when Hub is installed and keeps a local fallback. Manage Bazaar Update All can open collapsed rows sequentially, fill prices, and leaves Torn SAVE CHANGES as the final confirmation step. Script Hub can open Settings and run Quick Fill through the SakaLuXBazaarSmartPricer API global.\\n\\nPricing source\\nAutomatic pricing uses Torn market_value with the configured discount/markup. If Torn City shop-floor enforcement is enabled, buy_price is the hard minimum; sell_price is only a fallback when buy_price is unavailable.",
                "name": "Bazaar Smart Pricer",
                "quickActions": [
                    {
                        "icon": "⚙️",
                        "id": "open",
                        "label": "SETTINGS",
                        "method": "open",
                        "fallbackUrl": "https://www.torn.com/bazaar.php"
                    },
                    {
                        "icon": "💰",
                        "id": "quick-fill",
                        "label": "QUICK FILL",
                        "method": "quickFill",
                        "fallbackUrl": "https://www.torn.com/bazaar.php"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh",
                        "fallbackUrl": "https://www.torn.com/bazaar.php"
                    }
                ],
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Bazaar-Smart-Pricer.user.js",
                "type": "addon",
                "detailsRevision": 24,
                "version": "1.1.10",
                "release": {
                    "version": "1.1.10",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "updateUrl": "https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.meta.js",
                "metaUrl": "https://update.greasyfork.org/scripts/596672/SakaLuX%20Bazaar%20Smart%20Pricer.meta.js",
                "greasyForkId": "596672",
                "greasyForkUrl": "https://greasyfork.org/scripts/596672",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Bazaar-Smart-Pricer.md",
                "license": "MIT"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXMissionRewards",
                "buttonSelector": "#sl-mri-button",
                "category": "Missions",
                "description": "Mission Shop reward values, value per credit, ammo ownership and weapon mod tracking.",
                "downloadUrl": "https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.user.js",
                "greasyForkId": "592711",
                "icon": "🎯",
                "id": "mission-rewards",
                "info": "Purpose\nMission Rewards adds practical purchase information to Torn's Mission Shop, helping compare rewards before spending mission credits. It decorates supported reward cards and provides a more detailed reward panel.\n\nReward value\nShows estimated market value and value per mission credit, so offers with different prices can be compared on the same basis. Values are estimates based on available item data; they are guidance rather than guaranteed resale prices.\n\nSpecial ammunition\nReads currently owned special ammunition through the configured API key and shows ownership context alongside relevant rewards. This helps distinguish ammunition you already have from offers you may want to buy.\n\nWeapon-mod price learning\nTracks normal and special weapon-mod credit ranges from offers seen locally. Learned ranges build up as you use the script on the device. They describe observed offers and do not guarantee the price of future Mission Shop rewards.\n\nAPI and refresh\nDedicated API Access uses User: Ammo and Torn: Items permissions. Includes key setup and validation, refresh controls and local item/ammo caches. Compatible shared Hub key access can be used where available. No API write permission is required for reward information.\n\nWhere it runs\nRegisters with Hub on every Torn page, but Mission Shop scanning only runs on Missions. Settings and learned ranges are stored locally. The current stable branch is v1.0.41; the rolled-back experimental Mission Hints branch is not part of the active feature set. Reward purchases remain normal player actions.",
                "metaUrl": "https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js",
                "name": "Mission Rewards",
                "quickActions": [
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=missions",
                        "icon": "⚙️",
                        "id": "open",
                        "label": "SETTINGS",
                        "method": "open"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=missions",
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=missions",
                        "icon": "🎯",
                        "id": "missions",
                        "label": "MISSIONS",
                        "method": "goToMissions"
                    }
                ],
                "release": {
                    "version": "1.0.45",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Mission-Rewards.user.js",
                "type": "addon",
                "version": "1.0.45",
                "detailsRevision": 2,
                "updateUrl": "https://update.greasyfork.org/scripts/592711/SakaLuX%20Mission%20Rewards.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/592711",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Mission-Rewards.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXMarketIntelligence",
                "buttonSelector": "#sl-mi-button",
                "category": "Trading",
                "description": "Torn PDA-first market/travel intelligence with strict Item Market page scoping, Loadout Comparator, API access diagnostics/key setup, Price Network and travel tools.",
                "downloadUrl": "https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.user.js",
                "greasyForkId": "592781",
                "icon": "📈",
                "id": "market-intelligence",
                "info": "Purpose\nMarket Intelligence combines item-price analysis, Bazaar-flip estimates, travel purchasing plans, Museum set analysis and equipment comparisons. It provides decision support on the relevant Torn market and travel pages.\n\nItem Market and watchlists\nShows live or cached item-price information, locally collected price history and trends. BUY NOW, FAIR, WAIT and LEARNING signals summarize the available price context. Watchlists help keep selected items under review. Limited history is identified as learning rather than treated as a reliable long-term trend.\n\nBazaar Flip Intelligence\nCompares available price information to estimate net profit and return on investment for possible flips. Estimates depend on the prices and stock visible to the module; an apparent opportunity is not a guaranteed sale or profit.\n\nTravel purchasing\nBest Travel Run compares possible runs; Best Route Basket and the Travel Buy Planner help allocate carrying capacity across purchases. In-country Best Buys evaluates available buying opportunities. Arrival Stock and Arrival Basket support planning while flying. Local travel-session estimates, recent plans and stock/restock observations improve the context collected on the device.\n\nMuseum and equipment\nMuseum Set Intelligence adds set-oriented item context. The Loadout Comparator helps compare weapon and armor options using supported equipment data, alongside the trading/travel workspace.\n\nData and settings\nUses Torn API data and YATA public travel data where needed. Keeps local caches, price/travel history, watchlists and preferences. Dedicated API diagnostics help identify missing data access. The optional SakaLuX Price Network client is disabled by default and can be configured separately.\n\nHub and manual actions\nSupports persistent Hub ON/OFF and native settings access, with the shared standalone dock available separately. Market features run on relevant market pages and travel tools on relevant travel pages. It does not automatically buy or sell items; prices, stocks and travel estimates should be checked before acting.",
                "metaUrl": "https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js",
                "name": "Market Intelligence",
                "quickActions": [
                    {
                        "icon": "⚙️",
                        "id": "open",
                        "label": "SETTINGS",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=travel",
                        "icon": "✈️",
                        "id": "best-run",
                        "label": "BEST RUN",
                        "method": "goToBestRun"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=ItemMarket",
                        "icon": "📈",
                        "id": "market",
                        "label": "MARKET",
                        "method": "goToMarket"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/museum.php",
                        "icon": "🏛️",
                        "id": "museum",
                        "label": "MUSEUM",
                        "method": "goToMuseum"
                    }
                ],
                "release": {
                    "version": "1.17.51",
                    "date": "2026-09-26",
                    "notes": ["Adds an explicit Travel lifecycle state machine for Travel Agency, flight, landed-abroad and other pages.", "Scopes Best Route, Arrival Basket and landed-country panels to their exact travel states.", "Adds SPA/TornPDA stale-panel cleanup and permanent travel navigation regression coverage."]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Market-Intelligence.user.js",
                "type": "addon",
                "version": "1.17.51",
                "detailsRevision": 9,
                "updateUrl": "https://update.greasyfork.org/scripts/592781/SakaLuX%20Market%20Intelligence.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/592781",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Market-Intelligence.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXEliminationAssistant",
                "buttonSelector": "#slx-elim-btn",
                "category": "Combat",
                "description": "Eliminations advisor with unified Torn + FFScouter API setup, rotating 500-player batches, availability status, TornPDA export and PC-safe attack routing.",
                "downloadUrl": "https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.user.js",
                "greasyForkId": "594921",
                "icon": "⚔️",
                "id": "elimination-assistant",
                "info": "Purpose\nElimination Assistant helps find and review combat targets during Torn Eliminations. It loads team members and target availability, ranks candidates and organizes targets you want to revisit.\n\nTeams and batch loading\nUses Torn API v2 to load Elimination teams and target data. Large teams are processed in rotating groups of up to 500 players, with LOAD NEXT to continue through the membership. Player search, filters and sorting help narrow the current results.\n\nTarget recommendations\nSAFE, RISKY and SKIP recommendations and Smart Target Score summarize the data available for each target. Optional FFScouter Fair Fight/battle-stat estimates can be compared with your calibrated or manually entered battle stats. These are estimates, not a guarantee that an attack will be won.\n\nCalibration and target learning\nSupports calibration and optional FF scans. Manually recorded WIN/LOSS outcomes add local per-target learning, so results you record can contribute context on later visits.\n\nAvailability and navigation\nAttackable-state checks help distinguish targets currently suitable to open. PROFILE and ATTACK actions take you to the selected player or attack page, including routing suitable for PC and TornPDA. The script never attacks automatically.\n\nSaved SAFE targets and export\nRemembers SAFE targets across batches and sessions. Saved targets can be reviewed, copied, exported, removed individually or cleared. SAFE/RISKY attackable targets can be exported in TornPDA Chain Targets format.\n\nAPI and settings\nIncludes dedicated Torn API Access and optional FFScouter key controls. Target/filter preferences and local saved-target state persist across normal use. Hub provides persistent ON/OFF and module access; the shared standalone dock remains available when Hub is absent.",
                "metaUrl": "https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js",
                "name": "Elimination Assistant",
                "quickActions": [
                    {
                        "icon": "⏻",
                        "id": "toggle",
                        "label": "POWER",
                        "method": "toggleEnabled"
                    },
                    {
                        "icon": "⚔️",
                        "id": "open",
                        "label": "OPEN",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "icon": "📊",
                        "id": "ffscan",
                        "label": "FF SCAN",
                        "method": "scanFF"
                    },
                    {
                        "icon": "📤",
                        "id": "export-targets",
                        "label": "EXPORT TARGETS",
                        "method": "exportTargets"
                    },
                    {
                        "icon": "🎯",
                        "id": "calibrate",
                        "label": "CALIBRATE",
                        "method": "calibrate"
                    },
                    {
                        "icon": "🧪",
                        "id": "test-key",
                        "label": "TEST KEY",
                        "method": "testTornKey"
                    },
                    {
                        "icon": "🔑",
                        "id": "create-key",
                        "label": "API KEY",
                        "method": "createRequiredTornKey"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=elimination",
                        "icon": "🏆",
                        "id": "event",
                        "label": "ELIMS",
                        "method": "goToEliminations"
                    }
                ],
                "release": {
                    "version": "1.3.46",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Elimination-Assistant.user.js",
                "type": "addon",
                "version": "1.3.46",
                "detailsRevision": 3,
                "updateUrl": "https://update.greasyfork.org/scripts/594921/SakaLuX%20Elimination%20Assistant.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/594921",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Elimination-Assistant.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXCompanyIntelligence",
                "buttonSelector": "#sakalux-module-bridge-company-intelligence",
                "category": "Company",
                "description": "Employee and Director company intelligence with work-stat position advisor, effectiveness, growth/star direction, staff optimization, training, contracts and mobile-first TornPDA UI.",
                "downloadUrl": "https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.user.js",
                "greasyForkId": "595873",
                "icon": "🏢",
                "id": "company-intelligence",
                "info": "Purpose\nCompany Intelligence provides Employee and Director workspaces for understanding your job, staff, training commitments and company development. It combines permitted Torn company/user data with local history and manually recorded planning data.\n\nEmployee workspace\nShows work stats and position suitability, personal progress, train tracking, employment offers and actionable advice. Employee Progress compares changes in work stats and train compliance and provides 30/90-day projections based on the available history. Offer comparison helps review the information recorded for possible jobs.\n\nCompany Growth Center\nBuilds daily company snapshots, shows the Sunday rating countdown and presents a star outlook. Growth direction and star predictions are advisory: Torn ratings are comparative, and missing competitor or historical data limits confidence.\n\nDirector staff planning\nProvides staff overview, effectiveness and position analysis, position-optimization advice and actionable employee flags. Smart training rotation, training debt and per-employee train history help track commitments and plan future training. Director-only API data requires the key owner to be the company director.\n\nTrain-sale contracts\nTracks contracts, delivered and remaining trains, balances and employee training history. CSV/report export supports reviewing records outside the panel. Local contract records are planning data and should be kept current with actual deliveries.\n\nFinance, stock and benchmarks\nWeekly finance and balance views use known API values and locally logged amounts. Unknown costs are not silently converted into real zeroes. Stock intelligence, competitor benchmarks, company timeline, diagnostics and advice add broader context. Same-type competitor samples and regular snapshots improve comparisons.\n\nAPI and employment state\nSupports Torn API v2 with classic API and local company-cache fallbacks. Fresh job data is prioritized when refreshing employment status; historical planning records can remain available after job changes. Dedicated API controls manage the data needed by the selected workspace.\n\nPersistence and access\nCompany notes, contracts, benchmarks, snapshots and history are stored locally. Uses the shared Bazaar-style Standalone Dock registration and Hub module bridge rather than a second Company menu. The module provides analysis and planning; it does not perform automated company actions. Refresh after the daily company report to build useful history.",
                "metaUrl": "https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.meta.js",
                "name": "Company Intelligence",
                "quickActions": [
                    {
                        "icon": "⏻",
                        "id": "toggle",
                        "label": "POWER",
                        "method": "toggleEnabled"
                    },
                    {
                        "icon": "🏢",
                        "id": "open",
                        "label": "OPEN",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    }
                ],
                "release": {
                    "version": "1.8.40",
                    "date": "2026-09-24",
                    "notes": [
                        "Locks the shared standalone launcher to one canonical module order so rows no longer jump as add-ons register or refresh.",
                        "Deduplicates standalone registrations by module id before rendering.",
                        "Makes Bazaar Smart Pricer open its Settings on Bazaar and otherwise navigate to Bazaar first instead of opening an installer/source page."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Company-Intelligence-v1.0.0.user.js",
                "type": "addon",
                "version": "1.8.40",
                "detailsRevision": 2,
                "updateUrl": "https://update.greasyfork.org/scripts/595873/SakaLuX%20Company%20Intelligence.meta.js",
                "greasyForkUrl": "https://greasyfork.org/scripts/595873",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Company-Intelligence.md",
                "license": "All Rights Reserved"
            },
            {
                "active": true,
                "apiGlobal": "SakaLuXStockManagerAdvisor",
                "buttonSelector": "#sakalux-module-bridge-stock-manager-advisor",
                "category": "Trading",
                "description": "Torn stock vault and advisor with Financial Advisor, Technical Trade Assistant, Portfolio Simulator and Smart Rebalance strategy profiles.",
                "downloadUrl": "https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.user.js",
                "icon": "📊",
                "id": "stock-manager-advisor",
                "info": "Purpose\nStock Manager & Advisor adds a stock workspace directly to Torn Stocks and provides a full dashboard through Hub. It combines portfolio tracking, benefit-block analysis, financial and technical advice, simulations and explicit player-triggered trade controls.\n\nPortfolio and inline workspace\nShows invested capital when cost basis is known, market value, unrealized profit/loss, cash and holdings. Per-stock companion cards expose portfolio/benefit context and compact actions. Search, sorting, filters, favorites, favorite targets and Compact mode help organize the list. Transaction history and action logs keep local activity records.\n\nVault and withdrawal controls\nVault Max and Vault Keep calculate purchases for the selected target using the configured cash amount or retained-cash preference. Withdrawal controls calculate shares to sell for a chosen amount; Withdraw All, Sell Excess and Sell to Cash Target support explicit stock-management workflows where available. Target Lock helps prevent accidental target changes. PANIC is an explicit cash-to-stock action using its configured primary/fallback target and preview flow.\n\nBenefit and ROI advice\nAnalyzes benefit tiers, protected benefit floors, distance to the next benefit, estimated yield, marginal APR and payback. Best ROI and Best Affordable candidates help compare potential purchases. Benefit values and adviser scores are estimates rather than guaranteed returns.\n\nFinancial Advisor\nModels gross benefit income per day, month and year, configurable costs and net income. Exclusions keep chosen stocks out of adviser comparisons. Bank comparison supports different deposit periods, with best-effort automatic rate capture on supported Bank pages and a manual APR fallback.\n\nTechnical Trade Assistant\nCollects price history locally and compares 24H, 1W and 1M windows. Provides a chart with price, EMA20, EMA90 and Bollinger overlays, RSI14, momentum and technical-score context. BUY BIAS, SELL BIAS, WATCH and NEUTRAL states summarize the local signals. History grows with use on the device; the module does not depend on an external historical-price service.\n\nPortfolio Simulator\nShows before/after what-if reallocations, safely reallocatable coverage, benefit-yield and technical-score changes, target-tier movement and unused cash/share-rounding effects. Simulator results are previews and do not submit trades.\n\nSmart Rebalance and profiles\nBuilds portfolio-wide SELL-to-BUY proposals using free shares above protected benefit floors. SAFE, BALANCED and AGGRESSIVE profiles tune turnover caps, score thresholds, weighting and suggested-move limits. Recalculation updates the local technical context. Plans remain preview-only until the separate guided execution controls are deliberately used.\n\nTrading safeguards and API\nDry Run, Benefit Lock, confirmations and cooldown checks protect the trade workflow. A dedicated API Access panel manages money, portfolio and stock-catalogue data. Hub OPEN and REFRESH display or synchronize data; they do not place orders. Review a proposed trade before confirming it.\n\nPersistence and TornPDA behavior\nSettings, targets, profiles, caches, local price history, favorites and transaction records persist during normal updates. Export/import excludes the API key. The inline workspace mounts without waiting for page/chat mutations to stop, skips hidden stock containers and recovers after Stocks content is replaced. Disabling the module stops its runtime controls and blocks new orders; an already submitted request is not cancelled.\n\nAPI Access\nUses the shared SakaLuX Hub Torn API key automatically when Hub is installed and active. A local Stock Manager key can still be saved as the standalone fallback. The dedicated API Access sheet checks User Money, User Stocks and Torn Stocks permissions.",
                "metaUrl": "https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js",
                "name": "Stock Manager & Advisor",
                "quickActions": [
                    {
                        "icon": "⏻",
                        "id": "toggle",
                        "label": "POWER",
                        "method": "toggleEnabled"
                    },
                    {
                        "icon": "📊",
                        "id": "open",
                        "label": "OPEN",
                        "method": "open"
                    },
                    {
                        "icon": "🔄",
                        "id": "refresh",
                        "label": "REFRESH",
                        "method": "refresh"
                    },
                    {
                        "fallbackUrl": "https://www.torn.com/page.php?sid=stocks",
                        "icon": "📈",
                        "id": "stocks",
                        "label": "STOCKS",
                        "method": "goToStocks"
                    }
                ],
                "release": {
                    "version": "0.8.14",
                    "date": "2026-09-26",
                    "notes": [
                        "Introduces a verified Stock Rebalance state machine: PLANNING → SELLING → VERIFYING_SELL → WAITING_SYNC → VERIFYING_CASH → BUYING → VERIFYING_POSITION → COMPLETE.",
                        "Verifies each SELL before another transaction, preventing duplicate sales after TornPDA/network uncertainty and supporting safe retry only when a sale did not land.",
                        "Persists recovery checkpoints so interrupted rebalances can resume without repeating completed SELL or BUY actions.",
                        "Re-syncs cash, target price and held shares before BUY, recalculates affordable quantity, preserves reserve cash and verifies the final position.",
                        "Keeps the BUY target excluded from SELL sources and retains the 0.1% sell-fee-aware planning introduced in v0.8.13.",
                        "Adds permanent regression coverage for multiple SELLs, interruption/recovery, retry safety, TornPDA transitions, large amounts and post-BUY verification."
                    ]
                },
                "sourceUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Stock-Manager-Advisor.user.js",
                "type": "addon",
                "version": "0.8.14",
                "detailsRevision": 6,
                "updateUrl": "https://update.greasyfork.org/scripts/596192/SakaLuX%20Stock%20Manager%20%26%20Advisor.meta.js",
                "greasyForkId": "596192",
                "greasyForkUrl": "https://greasyfork.org/scripts/596192",
                "documentationUrl": "https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/greasyfork/Stock-Manager-Advisor.md",
                "license": "All Rights Reserved"
            }
        ],
        "lastVerified": "2026-09-20",
        "repository": "https://github.com/SakaLuX/SakaLuX-Script-HUB"
    }

    const FALLBACK_MODULE_DETAILS = Object.fromEntries(
        (FALLBACK_REGISTRY.scripts || []).map(s => [s.id, { info: s.info, release: s.release }])
    );

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
    function startLanguageObserver(){applyLanguage()}

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
        return published || registryVersion;
    }

    function getInstallUrl(script) {
        return script.downloadUrl || script.sourceUrl || '';
    }



    function normalizeRegistry(data) {
        const rows = Array.isArray(data?.scripts) ? data.scripts : FALLBACK_REGISTRY.scripts;
        return rows.filter(s => s?.active !== false).map(s => {
            const baseline = FALLBACK_REGISTRY.scripts.find(item => item.id === s.id);
            if (baseline && compareVersions(s.version, baseline.version) <= 0 &&
                Number(s.detailsRevision || 0) < Number(baseline.detailsRevision || 0)) {
                s = { ...s, version: baseline.version, info: baseline.info,
                    release: baseline.release, detailsRevision: baseline.detailsRevision };
            }
            return ({
            ...s,
            expectedVersion: String(s.version || '0'),
            info: s.info || FALLBACK_MODULE_DETAILS[s.id]?.info,
            release: s.release || FALLBACK_MODULE_DETAILS[s.id]?.release,
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
            });
        });
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
        // Canonical metadata marker: authoritative installed version.
        try {
            const canonical = globalThis.__SakaLuXInstalledVersions?.[script.id]
                || document.documentElement?.getAttribute('data-sakalux-installed-' + script.id);
            const v = String(canonical || '').trim();
            if (/^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(v)) return v;
        } catch {}
        const versions = [];
        const add = value => {
            const v = String(value || '').trim();
            if (/^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(v)) versions.push(v);
        };
        try {
            const bridge = document.getElementById('sakalux-module-bridge-' + script.id);
            add(bridge?.dataset?.version);
        } catch {}
        try {
            const api = script.api();
            add(api?.version);
            add(api?.health?.()?.version);
        } catch {}
        try {
            const standalone = document.querySelector(`[data-slx-standalone-registration="${script.id}"]`);
            add(standalone?.dataset?.version);
        } catch {}
        if (!versions.length) return null;
        return versions.reduce((best, v) => compareVersions(v, best) > 0 ? v : best, versions[0]);
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
        const publishedLatest = data.publishedLatest ? String(data.publishedLatest) : null;
        const latest = canonicalLatestVersion(script, publishedLatest);
        const distributionBehind = Boolean(publishedLatest && compareVersions(publishedLatest, script.expectedVersion) < 0);
        const available = Boolean(installed && publishedLatest && compareVersions(publishedLatest, installed) > 0);
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
            available: Boolean(installed && publishedLatest && compareVersions(publishedLatest, installed) > 0),
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

    let registryRefreshPending=null;
    function refreshRegistryAndCheck() {
        if(registryRefreshPending)return registryRefreshPending;
        registryRefreshPending=(async()=>{
        if (updateCheckRunning) return;
        await loadRegistry(true);
        await checkAllUpdates(true);
        })().finally(()=>{registryRefreshPending=null;});
        return registryRefreshPending;
    }

    function getUpdateState(script) {
        const installed = getInstalledVersion(script);
        if (installed === '?') return { state: 'unknown', text: 'VERSION UNKNOWN', data: null };
        const data = normalizeCachedUpdate(script);
        if (!installed) return { state: 'missing', text: 'NOT INSTALLED', data: data || null };
        if (!data) return { state: 'unknown', text: 'NOT CHECKED', data: null };
        if (data.error) return { state: 'failed', text: 'CHECK FAILED', data };
        if (data.available) return { state: 'available', text: 'UPDATE AVAILABLE', data };
        if (data.distributionBehind) return { state: 'pending', text: 'PUBLISH PENDING', data };
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
            if (installed) return { state: 'ok', text: 'INSTALLED', version: installed, data: { detection: 'live runtime' } };
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
            if (!bridge) throw new Error(script.name + ' control interface is unavailable on this page.');
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
#${IDS.overlay}{position:fixed;inset:0;z-index:2147483647;background:rgba(4,8,13,.84);backdrop-filter:none!important;display:flex;align-items:flex-end;justify-content:center;font-family:Inter,Arial,sans-serif;color:#e7edf5}
#${IDS.panel}{--sl-bg:#0f141c;--sl-soft:#151c26;--sl-panel:#18212d;--sl-panel2:#1d2836;--sl-elev:#223041;--sl-border:#314154;--sl-border2:#43566e;--sl-text:#e7edf5;--sl-softtext:#a9b7c8;--sl-muted:#7f90a6;--sl-blue:#4f8fe8;--sl-blue2:#2f6ebf;--sl-green:#18b26b;--sl-red:#cc3d57;--sl-gold:#d7a94a;width:min(680px,100%);max-height:95vh;display:flex;flex-direction:column;overflow:hidden;background:var(--sl-bg);color:var(--sl-text);border:1px solid var(--sl-border);border-radius:22px 22px 0 0;box-shadow:0 -22px 70px rgba(0,0,0,.72),inset 0 1px rgba(255,255,255,.025)}
.slh-header{padding:16px 16px 12px;flex-shrink:0;background:radial-gradient(circle at 12% -20%,rgba(79,143,232,.18),transparent 40%),linear-gradient(155deg,#18212d 0%,#101720 72%);border-bottom:1px solid var(--sl-border)}.slh-headrow{display:flex;align-items:center;justify-content:space-between;gap:12px}.slh-brand{display:flex;align-items:center;gap:11px;min-width:0}.slh-brand-icon{width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;border:1px solid #41536b;border-radius:13px;background:linear-gradient(145deg,#263448,#17212e);box-shadow:inset 0 1px rgba(255,255,255,.05),0 7px 20px rgba(0,0,0,.25);font-size:22px}.slh-brand-copy{min-width:0}.slh-kicker{font-size:8px;line-height:1.2;letter-spacing:.18em;font-weight:900;color:#6fa6ef;text-transform:uppercase}.slh-title{margin-top:2px;font-size:18px;line-height:1.15;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slh-sub{margin-top:4px;color:var(--sl-muted);font-size:9px;line-height:1.3}.slh-registry-dot{display:inline-block;width:6px;height:6px;margin-right:4px;border-radius:50%;background:#64748b}.slh-registry-dot.online{background:var(--sl-green);box-shadow:0 0 8px rgba(24,178,107,.6)}.slh-close{width:38px;height:38px;flex:0 0 auto;border:1px solid var(--sl-border);border-radius:11px;background:#1b2532;color:#c8d3df;font-size:21px;line-height:1;transition:.15s ease}.slh-close:active{transform:scale(.96)}
.slh-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:13px}.slh-stat{position:relative;overflow:hidden;background:rgba(24,33,45,.86);border:1px solid var(--sl-border);border-radius:11px;padding:9px 7px 8px}.slh-stat:before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:#4f8fe8;opacity:.8}.slh-stat.warn:before{background:var(--sl-gold)}.slh-stat.bad:before{background:var(--sl-red)}.slh-stat.good:before{background:var(--sl-green)}.slh-stat strong{display:block;color:#f8fafc;font-size:15px;line-height:1}.slh-stat span{display:block;margin-top:5px;color:var(--sl-muted);font-size:7px;font-weight:800;letter-spacing:.08em}.slh-stat small{display:block;margin-top:3px;color:#64748b;font-size:7px}
.slh-tools{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:9px}.slh-tool{min-width:0;height:42px;display:flex;align-items:center;justify-content:center;gap:5px;border:1px solid var(--sl-border);border-radius:10px;background:linear-gradient(180deg,#202c3a,#17212d);color:#d9e3ee;font-size:9px;font-weight:900;white-space:nowrap;touch-action:manipulation}.slh-tool span{font-size:13px}.slh-tool.checking{opacity:.56}.slh-tool.whatsnew{border-color:#54446b;background:linear-gradient(180deg,#3a2b4d,#271d35)}.slh-tool.settings{border-color:#4a5262}.slh-tool:active,.slh-bottom-btn:active,.slh-primary:active,.slh-switch:active,.slh-cat:active,.slh-setting-toggle:active{transform:translateY(1px)}
.slh-cats{display:flex;gap:6px;margin-top:9px;padding-bottom:1px;overflow-x:auto;scrollbar-width:none}.slh-cats::-webkit-scrollbar{display:none}.slh-cat{flex-shrink:0;border:1px solid #2c394b;border-radius:999px;padding:6px 10px;background:#111923;color:#8999ac;font-size:8px;font-weight:900;letter-spacing:.05em}.slh-cat.active{border-color:#4c84cc;background:#1d3b60;color:#dcebff;box-shadow:inset 0 0 0 1px rgba(111,166,239,.08)}
.slh-list,.slh-view,.slh-settings{overflow-y:auto;padding:11px;-webkit-overflow-scrolling:touch}.slh-list{background:linear-gradient(180deg,#0d131b 0%,#0f141c 100%)}.slh-section-label{margin:1px 2px 8px;color:#6e8095;font-size:8px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.slh-card{position:relative;display:grid;grid-template-columns:46px minmax(0,1fr) 100px;gap:11px;align-items:center;padding:12px;margin-bottom:9px;background:linear-gradient(145deg,#18212d,#131b25);border:1px solid #2d3c4e;border-radius:15px;box-shadow:0 7px 20px rgba(0,0,0,.17),inset 0 1px rgba(255,255,255,.018)}.slh-card:before{content:'';position:absolute;left:-1px;top:13px;bottom:13px;width:2px;border-radius:4px;background:#40526a}.slh-card.update:before{background:var(--sl-gold);box-shadow:0 0 8px rgba(215,169,74,.28)}.slh-card.missing:before{background:#64748b}.slh-card.off:before{background:#8a4d59}.slh-card.off .slh-card-copy{opacity:.62}.slh-card-copy{min-width:0}.slh-icon{width:44px;height:44px;display:grid;place-items:center;background:linear-gradient(145deg,#263448,#1a2431);border:1px solid #35475d;border-radius:13px;font-size:21px;box-shadow:inset 0 1px rgba(255,255,255,.04)}.slh-name-line{display:flex;align-items:center;gap:6px;min-width:0}.slh-name{min-width:0;color:#f3f7fb;font-size:13px;font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.slh-category-chip{flex:0 0 auto;border:1px solid #33445a;border-radius:999px;padding:2px 5px;color:#7f94aa;background:#121a24;font-size:6.5px;font-weight:900;letter-spacing:.05em;text-transform:uppercase}.slh-description{display:-webkit-box;margin-top:4px;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;color:#91a2b5;font-size:8.5px;line-height:1.35}.slh-chips{display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-top:6px}.slh-chip{display:inline-flex;align-items:center;min-height:17px;padding:2px 6px;border:1px solid #304055;border-radius:999px;background:#111922;color:#8496aa;font-size:6.5px;font-weight:900;line-height:1;letter-spacing:.035em}.slh-chip.good{border-color:#235f46;background:#10271f;color:#72d6a2}.slh-chip.warn{border-color:#68522b;background:#292314;color:#e7c675}.slh-chip.bad{border-color:#693642;background:#2c171d;color:#f09aa8}.slh-chip.info{border-color:#31567e;background:#14263b;color:#8fc0ff}.slh-chip.muted{color:#8290a1}.slh-module-controls{display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:6px}.slh-switch,.slh-primary{width:100%;min-height:35px;border-radius:10px;font-family:Inter,Arial,sans-serif;font-size:9px;font-weight:900;touch-action:manipulation}.slh-switch{display:grid;grid-template-columns:36px 1fr;align-items:center;gap:5px;padding:5px 7px;border:1px solid #475569;background:#111827;color:#94a3b8}.slh-switch-track{position:relative;display:block;width:34px;height:19px;border-radius:999px;background:#4b5563;box-shadow:inset 0 1px 3px rgba(0,0,0,.55);transition:.18s ease}.slh-switch-track i{position:absolute;left:3px;top:3px;width:13px;height:13px;border-radius:50%;background:#e5e7eb;box-shadow:0 1px 4px #0008;transition:.18s ease}.slh-switch.on{border-color:#216b4a;background:#102a21;color:#86efac}.slh-switch.on .slh-switch-track{background:#1eb36a}.slh-switch.on .slh-switch-track i{transform:translateX(15px);background:#fff}.slh-switch.off{border-color:#5d3a43;background:#26151a;color:#f0a0ad}.slh-switch:disabled{opacity:.48}.slh-primary{border:1px solid #3d78bf;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;padding:7px}.slh-primary:disabled{border-color:#374151;background:#202733;color:#6b7280}.slh-primary.install{border-color:#24754f;background:linear-gradient(180deg,#22945f,#176d46)}
.slh-bottom{padding:9px 11px;background:#0c1219;border-top:1px solid #263547;flex-shrink:0}.slh-bottom-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.slh-bottom-btn{border:1px solid #2d3d50;border-radius:10px;padding:9px;background:#151f2a;color:#b9c7d6;font-size:8px;font-weight:900;letter-spacing:.04em}.slh-footer{padding:8px;text-align:center;color:#5f7083;font-size:8px;border-top:1px solid #202d3c;background:#0b1118}.slh-author{color:#78aef2;font-weight:900;text-decoration:none}
.slh-setting,.slh-note,.slh-check-row{background:#17202b;border:1px solid #2c3b4e;border-radius:11px;padding:11px;margin-bottom:8px;color:#cbd5e1;font-size:10px;line-height:1.5}.slh-settings-pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}.slh-settings-pair .slh-setting{min-width:0}.slh-setting select,.slh-setting input[type=range],.slh-setting input[type=password]{width:100%;box-sizing:border-box;margin-top:7px}.slh-setting input[type=password],.slh-setting select{min-height:40px;padding:9px;border:1px solid #3a4b61;border-radius:8px;background:#0d141d;color:#fff}.slh-setting-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.slh-setting-copy{min-width:0}.slh-setting-title{color:#e7edf5;font-size:10px;font-weight:900}.slh-setting-desc{margin-top:3px;color:#7f90a6;font-size:8px;line-height:1.35}.slh-setting-toggle{position:relative;flex:0 0 auto;width:48px;height:26px;border:1px solid #46566a;border-radius:999px;background:#303a48;padding:0;box-shadow:inset 0 1px 3px rgba(0,0,0,.42);transition:.18s ease}.slh-setting-toggle i{position:absolute;left:4px;top:4px;width:16px;height:16px;border-radius:50%;background:#d7dee8;box-shadow:0 2px 5px rgba(0,0,0,.45);transition:.18s ease}.slh-setting-toggle.on{border-color:#237250;background:#168c58}.slh-setting-toggle.on i{transform:translateX(22px);background:#fff}.slh-api-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px}.slh-big-btn{width:100%;padding:10px;margin-top:6px;border:1px solid #3d78bf;border-radius:9px;background:linear-gradient(180deg,#377fcf,#275f9f);color:#fff;font-size:10px;font-weight:900}.slh-big-btn.gray{border-color:#394859;background:#1e2936}.slh-big-btn.red{border-color:#743946;background:#51222c}.slh-big-btn.update{border-color:#7a5b25;background:#684b1d}.slh-big-btn.install{border-color:#24754f;background:#176d46}.slh-version-title{font-size:12px;font-weight:900;margin-bottom:5px}.slh-version-date{color:#718197;font-size:8px;margin-left:5px}
@media(max-width:520px){.slh-header{padding:12px 10px 10px}.slh-brand-icon{width:38px;height:38px;font-size:19px}.slh-title{font-size:15px}.slh-kicker{font-size:7px}.slh-sub{font-size:8px}.slh-close{width:34px;height:34px}.slh-stats{gap:5px;margin-top:10px}.slh-stat{padding:8px 5px 7px}.slh-stat strong{font-size:13px}.slh-stat span{font-size:6.5px}.slh-stat small{display:none}.slh-tools{gap:4px}.slh-tool{height:38px;gap:3px;font-size:7px}.slh-tool span{font-size:11px}.slh-cats{gap:5px}.slh-cat{padding:5px 8px;font-size:7px}.slh-list{padding:8px}.slh-card{grid-template-columns:39px minmax(0,1fr) 84px;gap:8px;padding:9px 8px;margin-bottom:7px;border-radius:13px}.slh-icon{width:37px;height:37px;border-radius:11px;font-size:18px}.slh-name{font-size:11.5px}.slh-category-chip{font-size:5.8px}.slh-description{font-size:7.7px;-webkit-line-clamp:1}.slh-chips{gap:3px;margin-top:5px}.slh-chip{min-height:15px;padding:2px 4px;font-size:5.7px}.slh-module-controls{gap:5px}.slh-switch,.slh-primary{min-height:32px;font-size:8px}.slh-switch{grid-template-columns:31px 1fr;padding:4px}.slh-switch-track{width:30px;height:17px}.slh-switch-track i{width:11px;height:11px}.slh-switch.on .slh-switch-track i{transform:translateX(13px)}}

/* v1.9.45 compact PDA layout */
@media(max-width:699px){
#${IDS.overlay}{align-items:flex-start!important;padding:0!important}
#${IDS.panel}{height:100dvh!important;max-height:100dvh!important;border-radius:0 0 18px 18px!important;margin:0!important}
.slh-card{display:grid!important;grid-template-columns:42px minmax(0,1fr) 142px!important;align-items:center!important;column-gap:9px!important;row-gap:4px!important;padding:9px!important;min-height:82px!important}
.slh-card .slh-icon{grid-column:1!important;grid-row:1!important}
.slh-card .slh-card-copy{grid-column:2!important;grid-row:1!important;min-width:0!important}
.slh-card .slh-module-controls{grid-column:3!important;grid-row:1!important;display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-areas:'info toggle' 'new primary'!important;gap:6px!important;min-width:0!important;width:142px!important;margin:0!important;align-self:center!important}
.slh-card .slh-card-tools{display:contents!important}
.slh-card .slh-card-tool.info{grid-area:info!important}
.slh-card .slh-card-tool.new{grid-area:new!important}
.slh-card .slh-switch{grid-area:toggle!important}
.slh-card .slh-primary{grid-area:primary!important}
.slh-card .slh-card-tool,.slh-card .slh-switch,.slh-card .slh-primary{width:100%!important;min-width:0!important;min-height:34px!important;height:34px!important;padding:4px 5px!important;font-size:8px!important;border-radius:9px!important;box-sizing:border-box!important}
.slh-card .slh-switch{justify-content:space-between!important;gap:3px!important}
.slh-card .slh-switch-track{transform:scale(.88)!important;transform-origin:left center!important}
.slh-card-name{font-size:11px!important}.slh-card-meta{gap:4px!important}.slh-chip{font-size:7px!important;padding:3px 5px!important}
.slh-settings .slh-setting{padding:8px 9px!important;margin-bottom:7px!important}
.slh-settings .slh-setting-row{min-height:40px!important;gap:9px!important}
.slh-settings .slh-setting-title{font-size:9px!important}.slh-settings .slh-setting-desc{font-size:8px!important;line-height:1.35!important}
.slh-settings .slh-setting-toggle{width:40px!important;height:22px!important;min-width:40px!important;min-height:22px!important;max-width:40px!important;padding:2px!important;flex:0 0 40px!important}
.slh-settings .slh-setting-toggle i{width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important}
.slh-settings .slh-setting-toggle.on i{transform:translateX(18px)!important}
}
#ci-root{overflow-y:auto!important;overflow-x:hidden!important;align-items:flex-start!important;display:block!important;padding:0!important}
#ci-root .ci-shell{display:block!important;max-height:none!important;min-height:100%!important;height:auto!important;overflow:visible!important;margin:0 auto!important}
#ci-root .ci-head{position:sticky!important;top:0!important;z-index:20!important}
#ci-root .ci-tabs{position:sticky!important;top:58px!important;z-index:19!important}
#ci-root .ci-body{overflow:visible!important;min-height:auto!important}
#ci-root .ci-status{display:none!important}
#ci-root .ci-footer,#ci-root .ci-shell>.sakalux-stable-module-footer{position:relative!important;bottom:auto!important;width:100%!important;box-sizing:border-box!important}

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
 [id^="ci-"],[class*="ci-"],
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
){background:rgba(4,8,13,.84)!important;backdrop-filter:none!important;}

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
 button[id^="ci-"],button[class*="ci-"],
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
        style.textContent += `
/* v1.9.46 authoritative final layout overrides */
#${IDS.overlay}{align-items:flex-start!important;justify-content:center!important;padding-top:0!important}
body [id^="sakalux-"][id*="overlay"],body [id^="sl-"][id*="overlay"],body [id^="slx-"][id*="overlay"]{align-items:flex-start!important;padding-top:0!important}
#ci-root{align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 0 88px!important;box-sizing:border-box!important}
#ci-root .ci-shell{display:block!important;margin:0 auto!important;max-height:none!important;height:auto!important;min-height:100%!important;overflow:visible!important}
#ci-root .ci-body{overflow:visible!important;max-height:none!important}
#ci-root .ci-status{display:none!important}
#ci-root .ci-footer,#ci-root .ci-shell>.sakalux-stable-module-footer{display:flex!important;align-items:center!important;justify-content:center!important;position:sticky!important;bottom:76px!important;z-index:2147483640!important;min-height:44px!important;padding:11px 10px!important;box-sizing:border-box!important;background:#0b1118!important;white-space:nowrap!important;overflow:visible!important;opacity:1!important;visibility:visible!important}
#${IDS.panel} .slh-settings .slh-setting-row{display:flex!important;align-items:center!important;gap:10px!important}
#${IDS.panel} .slh-settings .slh-setting-copy{min-width:0!important;flex:1 1 auto!important}
#${IDS.panel} .slh-settings .slh-setting-toggle{box-sizing:border-box!important;width:36px!important;min-width:36px!important;max-width:36px!important;height:22px!important;min-height:22px!important;max-height:22px!important;padding:2px!important;border-radius:999px!important;flex:0 0 36px!important}
#${IDS.panel} .slh-settings .slh-setting-toggle i{box-sizing:border-box!important;width:16px!important;min-width:16px!important;max-width:16px!important;height:16px!important;min-height:16px!important;max-height:16px!important;margin:1px!important;border-radius:50%!important;transform:translateX(0)!important}
#${IDS.panel} .slh-settings .slh-setting-toggle.on i{transform:translateX(14px)!important}
@media(max-width:700px){
  #${IDS.panel}{margin:0!important;border-radius:0 0 18px 18px!important;max-height:calc(100dvh - 70px)!important;width:100%!important}
  #${IDS.panel} .slh-card{display:grid!important;grid-template-columns:40px minmax(0,1fr) 134px!important;grid-template-rows:auto!important;align-items:center!important;column-gap:8px!important;row-gap:0!important;padding:8px!important;min-height:78px!important}
  #${IDS.panel} .slh-card .slh-icon{grid-column:1!important;grid-row:1!important;width:40px!important;height:40px!important;min-width:40px!important;margin:0!important}
  #${IDS.panel} .slh-card .slh-card-copy{grid-column:2!important;grid-row:1!important;min-width:0!important;align-self:center!important}
  #${IDS.panel} .slh-card .slh-module-controls{grid-column:3!important;grid-row:1!important;display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:32px 32px!important;grid-template-areas:"info toggle" "new primary"!important;gap:5px!important;width:134px!important;min-width:134px!important;max-width:134px!important;margin:0!important;align-self:center!important}
  #${IDS.panel} .slh-card .slh-card-tools{display:contents!important}
  #${IDS.panel} .slh-card .slh-card-tool.info{grid-area:info!important}
  #${IDS.panel} .slh-card .slh-card-tool.new{grid-area:new!important}
  #${IDS.panel} .slh-card .slh-switch{grid-area:toggle!important}
  #${IDS.panel} .slh-card .slh-primary{grid-area:primary!important}
  #${IDS.panel} .slh-card .slh-card-tool,#${IDS.panel} .slh-card .slh-switch,#${IDS.panel} .slh-card .slh-primary{box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;min-height:32px!important;height:32px!important;padding:3px 4px!important;font-size:8px!important;line-height:1!important;margin:0!important}
  #${IDS.panel} .slh-card .slh-name{font-size:12px!important;line-height:1.15!important}
  #${IDS.panel} .slh-card .slh-meta,#${IDS.panel} .slh-card .slh-badges{gap:3px!important}
  #${IDS.panel} .slh-setting{padding:7px 9px!important;margin-bottom:7px!important}
}
`;
        style.textContent += `
/* v1.9.47 FINAL PDA OVERRIDE */
@media(max-width:700px){
#${IDS.overlay}{align-items:flex-start!important;justify-content:center!important;padding:0!important;margin:0!important}
#${IDS.panel}{margin:0 auto!important;align-self:flex-start!important;border-radius:0 0 18px 18px!important;max-height:calc(100dvh - 72px)!important}
.slh-card{display:grid!important;grid-template-columns:42px minmax(0,1fr) 136px!important;grid-template-rows:auto!important;align-items:center!important;column-gap:8px!important;row-gap:0!important;padding:9px!important;min-height:78px!important}
.slh-card .slh-icon{grid-column:1!important;grid-row:1!important;margin:0!important}
.slh-card .slh-card-copy{grid-column:2!important;grid-row:1!important;min-width:0!important;margin:0!important}
.slh-card .slh-module-controls{grid-column:3!important;grid-row:1!important;display:grid!important;grid-template-columns:1fr 1fr!important;grid-template-rows:32px 32px!important;grid-template-areas:'info toggle' 'new primary'!important;gap:5px!important;width:136px!important;min-width:136px!important;margin:0!important;align-self:center!important}
.slh-card .slh-card-tools{display:contents!important}
.slh-card .slh-info-btn{grid-area:info!important}.slh-card .slh-new-btn{grid-area:new!important}.slh-card .slh-switch-wrap{grid-area:toggle!important}.slh-card .slh-primary{grid-area:primary!important}
.slh-card .slh-info-btn,.slh-card .slh-new-btn,.slh-card .slh-switch-wrap,.slh-card .slh-primary{width:100%!important;min-width:0!important;height:32px!important;min-height:32px!important;padding:0 4px!important;margin:0!important;font-size:8px!important;border-radius:9px!important}
.slh-settings .slh-setting-row{display:grid!important;grid-template-columns:minmax(0,1fr) 38px!important;align-items:center!important;gap:10px!important}
.slh-settings .slh-setting-toggle{width:38px!important;min-width:38px!important;max-width:38px!important;height:22px!important;min-height:22px!important;padding:2px!important;border-radius:999px!important;justify-self:end!important}
.slh-settings .slh-setting-toggle i{width:16px!important;height:16px!important;margin:0!important}.slh-settings .slh-setting-toggle.on i{transform:translateX(16px)!important}
}
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

    function isActuallyVisible(element) {
        if (!element || !element.isConnected) return false;
        try {
            const cs = getComputedStyle(element);
            if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0.01) return false;
            const r = element.getBoundingClientRect();
            return r.width > 4 && r.height > 4 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
        } catch { return false; }
    }

    function syncFloatingButtonVisibility() {
        const button = document.getElementById(IDS.button);
        if (!button) return;
        const top = document.getElementById(IDS.topSkull);
        const nav = document.getElementById(IDS.navSkull);
        const nativeMounted = settings.showTopbarSkull && Boolean(
            (top && top.isConnected) || (nav && nav.isConnected)
        );
        button.style.setProperty('display', nativeMounted ? 'none' : 'flex', 'important');
        button.style.setProperty('visibility', 'visible', 'important');
        button.style.setProperty('opacity', '1', 'important');
        button.style.setProperty('pointer-events', 'auto', 'important');
    }

    let launcherRepairTimer = null;
    function startLauncherRepair() {
        if (launcherRepairTimer) return;
        launcherRepairTimer = setInterval(() => {
            if (document.hidden || document.getElementById(IDS.overlay)) return;
            try {
                createTopbarSkull();
                createNavSkull();
                createHubButton();
                syncFloatingButtonVisibility();
            } catch (error) {
                console.debug('[SakaLuX Hub] launcher repair retry', error);
            }
        }, 1500);
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

        const mounted = el => {
            if (!(el instanceof Element) || !el.isConnected) return false;
            try {
                const cs = getComputedStyle(el);
                const r = el.getBoundingClientRect();
                // Persistent CAT-style mounting: viewport position is irrelevant.
                return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity || 1) > 0.01
                    && r.width > 20 && r.height > 20;
            } catch { return false; }
        };
        const cleanLabel = el => String(el?.textContent || '')
            .replace(/\b\d+\b/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .toLowerCase();
        const clicks = [...document.querySelectorAll('a[href],button')]
            .filter(el => !el.closest?.(`#${IDS.navSkull}`) && mounted(el));

        const knownLabels = new Set([
            'home','items','travel agency','travel','raceway','city','item market','gym','properties',
            'education','crimes','missions','newspaper','jail','hospital','casino','forums','calendar',
            'elimination','community events','friends','enemies','targets'
        ]);
        const anchors = clicks.filter(el => knownLabels.has(cleanLabel(el)));
        if (anchors.length < 2) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const ancestors = el => {
            const out = [];
            let node = el;
            for (let i = 0; node && i < 10; i += 1, node = node.parentElement) out.push(node);
            return out;
        };
        const directChildUnder = (el, parent) => {
            if (!el || !parent) return null;
            let node = el;
            while (node?.parentElement && node.parentElement !== parent) node = node.parentElement;
            return node?.parentElement === parent ? node : null;
        };

        let best = null;
        for (const anchor of anchors) {
            for (const parent of ancestors(anchor)) {
                if (!parent || parent === document.body || parent === document.documentElement) continue;
                const rows = [...new Set(anchors.map(el => directChildUnder(el, parent)).filter(Boolean))];
                if (rows.length < 3) continue;
                const rects = rows.map(row => row.getBoundingClientRect());
                const verticalSpread = Math.max(...rects.map(r => r.top)) - Math.min(...rects.map(r => r.top));
                if (verticalSpread < 80) continue; // reject the horizontal 3-icon quick bar
                const score = rows.length * 100 + verticalSpread;
                if (!best || score > best.score) best = { parent, rows, score };
            }
        }

        if (!best) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const listParent = best.parent;
        const rows = best.rows
            .filter(row => mounted(row))
            .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const firstRow = rows[0];
        if (!firstRow) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }

        const positionFirstVertical = row => {
            if (!row) return false;
            // Always keep Hub as the first child of the vertical list.
            const target = [...listParent.children].find(child => child !== row) || firstRow;
            if (target && (row.parentElement !== listParent || listParent.firstElementChild !== row)) {
                listParent.insertBefore(row, target);
            }
            row.dataset.sakaluxHubMode = 'flyout-first-vertical';
            return true;
        };

        if (existing?.isConnected) {
            // Keep the exact mounted node permanently in Torn's vertical list.
            // Scrolling must never remove/recreate it.
            const parent = existing.parentElement;
            if (parent && parent.firstElementChild !== existing) parent.insertBefore(existing, parent.firstElementChild);
            existing.querySelector(`#${IDS.navBadge}`)?.remove();
            existing.querySelectorAll('[data-sakalux-inherited-extra]').forEach(el => el.remove());
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }

        const row = firstRow.cloneNode(true);
        row.id = IDS.navSkull;
        row.setAttribute('data-sakalux-hub-launcher', 'flyout-first-vertical');
        row.dataset.sakaluxHubMode = 'flyout-first-vertical';
        row.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        row.querySelectorAll('[data-testid],[aria-current]').forEach(el => {
            el.removeAttribute('data-testid');
            el.removeAttribute('aria-current');
        });

        const click = row.matches('a[href],button') ? row : row.querySelector('a[href],button');
        if (!click) {
            syncFloatingButtonVisibility();
            return false;
        }
        if (click.tagName === 'A') click.setAttribute('href', '#sakalux-hub');
        click.removeAttribute('target');
        click.removeAttribute('rel');
        click.classList.add('slh-native-link');
        click.setAttribute('title', 'SakaLuX Hub');
        click.setAttribute('aria-label', 'SakaLuX Hub');

        const sourceLabel = cleanLabel(firstRow);
        const leaves = [...click.querySelectorAll('span,div')].filter(el => el.children.length === 0);
        const labelNode = leaves.find(el => cleanLabel(el) === sourceLabel) || leaves.find(el => cleanLabel(el));
        if (labelNode) labelNode.textContent = 'SAKALUX HUB';

        for (const el of [...click.querySelectorAll('span,div')]) {
            if (el === labelNode) continue;
            const t = String(el.textContent || '').trim();
            if (/^\d+$/.test(t) || /^[›»▶►→]+$/.test(t)) el.remove();
        }

        const svgs = [...click.querySelectorAll('svg')];
        const nativeSvg = svgs[0] || null;
        svgs.slice(1).forEach(svg => svg.remove());
        [...click.querySelectorAll('img')].forEach(img => img.remove());

        const makeSkullSvg = sourceSvg => {
            if (!sourceSvg) return null;
            const svg = sourceSvg.cloneNode(false);
            const vb = (sourceSvg.getAttribute('viewBox') || '0 0 24 24').split(/\s+/).map(Number);
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
            svg.classList.add('slh-native-skull-icon');
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
        };

        if (nativeSvg) {
            const skullSvg = makeSkullSvg(nativeSvg);
            if (skullSvg) nativeSvg.replaceWith(skullSvg);
        } else {
            const icon = document.createElement('span');
            icon.className = 'slh-native-skull-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.textContent = '☠︎';
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:34px;margin-right:8px;font-size:22px;';
            click.prepend(icon);
        }

        const open = event => {
            event.preventDefault();
            event.stopPropagation();
            openHub();
        };
        click.addEventListener('click', open, true);
        click.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') open(event);
        }, true);

        positionFirstVertical(row);
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
                { const label = total > 99 ? '99+' : String(total); if (badge.textContent !== label) badge.textContent = label; }
            }
        }
    }

    function updateBadge() {
        const total = getIssueCount();
        const badge = document.getElementById(IDS.badge);
        if (badge) {
            badge.style.display = total > 0 ? 'flex' : 'none';
            if (total > 0) { const label = total > 99 ? '99+' : String(total); if (badge.textContent !== label) badge.textContent = label; }
        }
        updateTopbarSkullState();
    }

    function updateHiddenButtons() {
        for (const selector of ['#sl-eg-button','#sakalux-bt-settings-button','#sl-mri-button','#sl-mi-button','#slx-elim-btn','#ci-launch']) {
            document.querySelectorAll(selector).forEach(element => element.remove());
        }
    }

    function pauseHubObserver() {
        if (observer) { observer.disconnect(); observer = null; }
    }

    function closeHub(resumeObserver = true) {
        document.getElementById(IDS.overlay)?.remove();
        if (resumeObserver) setTimeout(startObserver, 0);
    }

    function createOverlay(content) {
        document.getElementById(IDS.overlay)?.remove();
        pauseHubObserver();
        const overlay = document.createElement('div');
        overlay.id = IDS.overlay;
        overlay.innerHTML = `<div id="${IDS.panel}">${content}</div>`;
        document.body.appendChild(overlay);
        overlay.onclick = event => { if (event.target === overlay) closeHub(true); };
        requestAnimationFrame(() => applyLanguage());
        return overlay;
    }

    function headerMarkup(title, subtitle, closeId, icon = '☠️', kicker = 'SAKALUX CONTROL CENTER') {
        return `<div class="slh-header"><div class="slh-headrow"><div class="slh-brand"><div class="slh-brand-icon">${icon}</div><div class="slh-brand-copy"><div class="slh-kicker">${escapeHtml(kicker)}</div><div class="slh-title">${escapeHtml(title)}</div><div class="slh-sub">${subtitle}</div></div></div><button class="slh-close" id="${closeId}" aria-label="Close">×</button></div></div>`;
    }


    const MANAGED_PANEL_SELECTORS = [
        '#sl-eg-panel',
        '#sakalux-bt-settings',
        '#sl-mr-settings',
        '#sl-mi-panel',
        '#slx-elim',
        '[id^="slx-elim-"][id*="panel" i]',
        '[id^="ci-"][id*="panel" i]',
        '[class^="ci-"][class*="panel" i]',
        '[class*=" ci-"][class*="panel" i]',
        '#ci-root .ci-shell'
    ];
    let managedFooterObserver = null;

    function ensureNativeCardStyles() {
        if (document.getElementById('sakalux-hub-native-card-style')) return;
        const style = document.createElement('style');
        style.id = 'sakalux-hub-native-card-style';
        style.textContent = `
.slh-card .slh-description{display:none!important}
.slh-card .slh-module-controls{display:flex!important;flex-direction:column!important;gap:7px!important;align-items:stretch!important;min-width:136px!important}
.slh-card-tools{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
.slh-card-tool{min-height:31px;padding:6px 8px;border-radius:9px;border:1px solid #3b4d63;background:linear-gradient(180deg,#182536,#111a25);color:#dbe8f7;font:800 9px/1 Arial,sans-serif;letter-spacing:.6px;box-shadow:inset 0 1px rgba(255,255,255,.04)}
.slh-card-tool.info{border-color:#3c6da7;background:linear-gradient(180deg,#173353,#10243a)}
.slh-card-tool.new{border-color:#6a4c83;background:linear-gradient(180deg,#33213f,#23172d);color:#ecdfff}
.slh-card .slh-switch,.slh-card .slh-primary{width:100%!important;box-sizing:border-box!important}

.slh-settings .slh-setting-row{align-items:center!important;gap:10px!important}
.slh-settings .slh-setting-toggle{width:46px!important;height:26px!important;min-width:46px!important;min-height:26px!important;max-width:46px!important;padding:2px!important;border-radius:999px!important;flex:0 0 46px!important}
.slh-settings .slh-setting-toggle i{width:20px!important;height:20px!important;min-width:20px!important;min-height:20px!important;border-radius:50%!important;margin:0!important;transform:translateX(0)!important}
.slh-settings .slh-setting-toggle.on i{transform:translateX(20px)!important}
#ci-root{overflow:hidden!important;align-items:stretch!important}
#ci-root .ci-shell{display:flex!important;flex-direction:column!important;max-height:calc(100dvh - 32px)!important;min-height:0!important;overflow:hidden!important;margin:auto 0!important}
#ci-root .ci-head,#ci-root .ci-tabs,#ci-root .ci-status,#ci-root .ci-footer{flex:0 0 auto!important}
#ci-root .ci-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important}
#ci-root .ci-footer,#ci-root .ci-shell>.sakalux-stable-module-footer{position:relative!important;bottom:auto!important;z-index:30!important;width:100%!important;box-sizing:border-box!important}
@media(max-width:700px){
  .slh-card{display:grid!important;grid-template-columns:46px minmax(0,1fr)!important;align-items:start!important;column-gap:10px!important;row-gap:7px!important}
  .slh-card .slh-icon{grid-column:1!important;grid-row:1!important}
  .slh-card .slh-card-copy{grid-column:2!important;grid-row:1!important;min-width:0!important}
  .slh-card .slh-module-controls{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-areas:'info toggle' 'new primary'!important;gap:7px!important;width:100%!important;min-width:0!important;margin-top:3px!important}
  .slh-card .slh-card-tools{display:contents!important}
  .slh-card .slh-card-tool.info{grid-area:info!important}
  .slh-card .slh-card-tool.new{grid-area:new!important}
  .slh-card .slh-switch{grid-area:toggle!important;min-height:36px!important;width:100%!important;justify-content:space-between!important;padding:5px 9px!important}
  .slh-card .slh-primary{grid-area:primary!important;min-height:36px!important;width:100%!important}
  .slh-card .slh-card-tool{min-height:36px!important;width:100%!important;font-size:9px!important}
}
.sakalux-stable-module-footer{flex:0 0 auto!important;position:sticky!important;bottom:0!important;z-index:25!important;width:100%!important;box-sizing:border-box!important;text-align:center!important;padding:9px 10px!important;border-top:1px solid rgba(255,255,255,.08)!important;background:#0c131b!important;color:#74869a!important;font:500 10px/1.3 Arial,sans-serif!important}
.sakalux-stable-module-footer a{color:#5f9fe8!important;text-decoration:none!important}
@media(max-width:700px){.slh-card .slh-module-controls{min-width:124px!important}.slh-card-tool{min-height:34px!important}}
`;
        (document.head || document.documentElement).appendChild(style);
    }

    function ensureManagedModuleFooters() {
        const seen = new Set();
        for (const selector of MANAGED_PANEL_SELECTORS) {
            document.querySelectorAll(selector).forEach(panel => {
                if (!(panel instanceof HTMLElement) || seen.has(panel)) return;
                seen.add(panel);

                // Market owns its native compact donation/author footer. Avoid the
                // generic author-only fallback during Market's async footer render.
                if (panel.matches('#sl-mi-panel')) {
                    const nativeMarketFooter = panel.querySelector('#sakalux-inline-footer-market-intelligence');
                    if (nativeMarketFooter) nativeMarketFooter.classList.add('sakalux-stable-module-footer');
                    return;
                }

                let footer = panel.querySelector('[id^="sakalux-inline-footer-"], .sakalux-stable-module-footer, .ci-footer');
                if (!footer) {
                    footer = document.createElement('div');
                    footer.innerHTML = `Made with ❤️ by <a href="${PROFILE_URL}" target="_self" rel="noopener">SakaLuX [2380374]</a>`;
                    footer.querySelector('a').onclick = event => { event.preventDefault(); location.href = PROFILE_URL; };
                    panel.appendChild(footer);
                }
                footer.classList.add('sakalux-stable-module-footer');
            });
        }
    }

    function startManagedFooterObserver() {
        // v1.9.51: one-shot footer repair only. A document-wide MutationObserver was
        // expensive on TornPDA and unnecessary because module actions already call
        // ensureManagedModuleFooters() after opening a panel.
        ensureManagedModuleFooters();
    }

    function openModuleInfo(script) {
        if (!script) return;
        createOverlay(`${headerMarkup(script.name, 'What this module does', 'slhmi-close', script.icon || '🧩', 'MODULE INFORMATION')}<div class="slh-view"><div class="slh-note"><div class="slh-version-title">v${escapeHtml(script.version || script.expectedVersion || '?')} <span class="slh-version-date">${escapeHtml(script.category || 'Other')}</span></div><div style="margin-top:8px">${String(script.info || script.description || 'No module information available.').split(/\n\s*\n/).map(section => { const lines = section.split('\n'); return lines.length > 1 ? `<section style="margin-bottom:16px"><h3 style="margin:0 0 6px;color:#f3f7fb;font-size:12px">${escapeHtml(lines.shift())}</h3><p style="margin:0;line-height:1.6">${escapeHtml(lines.join('\n'))}</p></section>` : `<p style="margin:0 0 12px;line-height:1.6">${escapeHtml(section)}</p>`; }).join('')}</div></div><button class="slh-big-btn gray" id="slhmi-back">← BACK</button></div>`);
        document.getElementById('slhmi-close').onclick = closeHub;
        document.getElementById('slhmi-back').onclick = openHub;
    }

    function openModuleRelease(script) {
        if (!script) return;
        const release = script.release || {};
        const notes = Array.isArray(release.notes) && release.notes.length
            ? release.notes.map(note => `<div>• ${escapeHtml(note)}</div>`).join('')
            : '<div>No release notes available yet.</div>';
        createOverlay(`${headerMarkup(script.name, 'Current module release notes', 'slhmn-close', '✦', 'RELEASE CENTER')}<div class="slh-view"><div class="slh-note"><div class="slh-version-title">v${escapeHtml(release.version || script.version || script.expectedVersion || '?')} ${release.date ? `<span class="slh-version-date">${escapeHtml(release.date)}</span>` : ''}</div><div style="margin-top:8px">${notes}</div></div><button class="slh-big-btn gray" id="slhmn-back">← BACK</button></div>`);
        document.getElementById('slhmn-close').onclick = closeHub;
        document.getElementById('slhmn-back').onclick = openHub;
    }

    function openHub() {
        ensureNativeCardStyles();
        startManagedFooterObserver();
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
        const missing = health.state === 'missing';
        const enabled = !missing && isModuleEnabled(script);
        const moduleApi = script.api();
        const powerReady = Boolean((moduleApi && typeof moduleApi.setEnabled === 'function' && typeof moduleApi.isEnabled === 'function') || document.getElementById('sakalux-module-bridge-' + script.id));
        const primary = getPrimaryAction(script);
        const primaryLabel = /settings/i.test(primary.label || '') ? 'SETTINGS' : 'OPEN';
        const updateChipClass = update.state === 'current' ? 'good' : update.state === 'available' ? 'warn' : update.state === 'pending' ? 'info' : update.state === 'failed' ? 'bad' : 'muted';
        const healthChipClass = health.state === 'ok' ? 'good' : health.state === 'error' ? 'bad' : 'warn';
        const controls = missing
            ? `<div class="slh-card-tools"><button class="slh-card-tool info" data-module-info="${escapeHtml(script.id)}" type="button">INFO</button><button class="slh-card-tool new" data-module-new="${escapeHtml(script.id)}" type="button">✦ NEW</button></div><button class="slh-switch off" type="button" role="switch" aria-checked="false" disabled><span class="slh-switch-track"><i></i></span><b>OFF</b></button><button class="slh-primary install" data-install="${escapeHtml(script.id)}">INSTALL</button>`
            : `<div class="slh-card-tools"><button class="slh-card-tool info" data-module-info="${escapeHtml(script.id)}" type="button">INFO</button><button class="slh-card-tool new" data-module-new="${escapeHtml(script.id)}" type="button">✦ NEW</button></div><button class="slh-switch ${enabled ? 'on' : 'off'}" type="button" role="switch" aria-checked="${enabled ? 'true' : 'false'}" data-module-toggle="${escapeHtml(script.id)}" title="${powerReady ? `Turn ${escapeHtml(script.name)} ${enabled ? 'off' : 'on'}` : `Update ${escapeHtml(script.name)} to enable native power control`}" ${powerReady ? '' : 'disabled'}><span class="slh-switch-track"><i></i></span><b>${enabled ? 'ON' : 'OFF'}</b></button><button class="slh-primary" data-script="${escapeHtml(script.id)}" data-action="${escapeHtml(primary.id)}" ${enabled ? '' : 'disabled'}>${primaryLabel}</button>`;
        return `<div class="slh-card ${update.state === 'available' ? 'update' : ''} ${missing ? 'missing' : ''} ${!missing && !enabled ? 'off' : ''}">
            <div class="slh-icon">${script.icon || '🧩'}</div>
            <div class="slh-card-copy">
                <div class="slh-name-line"><div class="slh-name">${escapeHtml(script.name)}</div><span class="slh-category-chip">${escapeHtml(script.category || 'Other')}</span></div>
                <div class="slh-chips">
                    <span class="slh-chip ${healthChipClass}">${missing ? 'NOT INSTALLED' : 'v' + escapeHtml(installed || health.version || '?')}</span>
                    <span class="slh-chip ${updateChipClass}">${escapeHtml(update.text)}</span>
                    ${!missing ? `<span class="slh-chip ${enabled ? 'good' : 'bad'}">${enabled ? 'ACTIVE' : 'DISABLED'}</span>` : ''}
                    ${update.data?.checkedAt ? `<span class="slh-chip muted">${escapeHtml(formatAgo(update.data.checkedAt))}</span>` : ''}
                </div>
            </div>
            <div class="slh-module-controls">${controls}</div>
        </div>`;
    }

    function bindCards() {
        document.querySelectorAll('[data-module-info]').forEach(button => { button.onclick = () => openModuleInfo(SCRIPTS.find(item => item.id === button.dataset.moduleInfo)); });
        document.querySelectorAll('[data-module-new]').forEach(button => { button.onclick = () => openModuleRelease(SCRIPTS.find(item => item.id === button.dataset.moduleNew)); });
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
            // Installed modules must never fall through to their installer/source URL
            // just because their runtime API is not active on this Torn page.
            if (script.id === 'bazaar-smart-pricer') {
                const smartAction = (script.quickActions || []).find(item => item.id === actionId)
                    || (script.quickActions || []).find(item => item.id === 'open');
                if (smartAction?.fallbackUrl && location.pathname !== '/bazaar.php') {
                    recordUsage(id);
                    closeHub();
                    location.href = smartAction.fallbackUrl;
                    return;
                }
            }
            if (script.fallbackOpen()) {
                recordUsage(id);
                closeHub();
                return;
            }
            const fallbackAction = (script.quickActions || []).find(item => item.id === actionId)
                || (script.quickActions || []).find(item => item.id === 'open');
            if (fallbackAction?.fallbackUrl) {
                recordUsage(id);
                closeHub();
                location.href = fallbackAction.fallbackUrl;
                return;
            }
            if (getInstalledVersion(script)) {
                alert(script.name + ' is installed but its panel is not available on this page. Open the module page and press SETTINGS again.');
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
                if (isPanelAction) {
                    closeHub(false);
                    await new Promise(resolve => requestAnimationFrame(() => resolve()));
                }
                const result = await api[action.method]();
                setTimeout(ensureManagedModuleFooters, 160);
                setTimeout(startObserver, 500);
                if (result === false && action.fallbackUrl) { location.href = action.fallbackUrl; return; }
                if (!isPanelAction) setTimeout(openHub, 100);
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
                results.push({ level: behind || !published ? 'warn' : 'ok', label: script.name + ' update source', detail: 'Canonical v' + canonical + (published ? ' • ' + (script.greasyForkId ? 'Greasy Fork' : 'Distribution') + ' v' + published + (behind ? ' (publish pending)' : '') : ' • ' + (script.greasyForkId ? 'Greasy Fork' : 'Distribution') + ' unavailable') });
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
        injectCss(); createTopbarSkull(); createNavSkull(); createHubButton(); updateHiddenButtons(); updateBadge(); syncFloatingButtonVisibility(); startLauncherRepair();
    }

    function queueEnsure() {
        if (observerTimer) return;
        observerTimer = setTimeout(() => { observerTimer = null; ensureEverything(); }, 300);
    }

    function startObserver() {
        if (observer || document.getElementById(IDS.overlay)) return;
        observer = new MutationObserver(mutations => {
            if (window.SakaLuXPerf?.unrelated?.(mutations)) return;
            if (!mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) return;
            queueEnsure();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        if (!startObserver.routeBound) {
            const routeRefresh = () => setTimeout(queueEnsure, 500);
            window.addEventListener('hashchange', routeRefresh, { passive: true });
            window.addEventListener('popstate', routeRefresh, { passive: true });
            startObserver.routeBound = true;
        }
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
    window.addEventListener('SakaLuX:EliminationAssistantReady', () => { queueEnsure(); renderList(); renderMainStats(); });
    window.addEventListener('SakaLuX:CompanyIntelligenceReady', () => { queueEnsure(); renderList(); renderMainStats(); });

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

/* SakaLuX Hub mobile layout v1.9.56 — validated UI and performance refinement */
(()=>{
  if(document.getElementById('sakalux-hub-layout-1955')) return;
  const s=document.createElement('style');
  s.id='sakalux-hub-layout-1955';
  s.textContent=`@media(max-width:820px){
    #sakalux-hub-overlay#sakalux-hub-overlay{
      position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;
      z-index:2147483647!important;width:auto!important;height:auto!important;min-height:0!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;box-sizing:border-box!important;overflow:hidden!important;
      display:flex!important;align-items:stretch!important;justify-content:stretch!important;
      background:#0b1118!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important;box-shadow:none!important
    }
    #sakalux-hub-overlay>#sakalux-hub-panel{
      position:relative!important;inset:auto!important;flex:1 1 auto!important;align-self:stretch!important;
      width:100%!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
      margin:0!important;padding:0!important;box-sizing:border-box!important;border-radius:0!important;
      display:flex!important;flex-direction:column!important;overflow:hidden!important;
      background:#0b1118!important;box-shadow:none!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important
    }
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-header{flex:0 0 auto!important;position:relative!important;background:#0d151f!important;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:8px!important;contain:layout paint style!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-view,#sakalux-hub-overlay>#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;touch-action:pan-y!important;-webkit-overflow-scrolling:touch!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom{position:relative!important;flex:0 0 58px!important;height:58px!important;min-height:58px!important;margin:0!important;padding:4px 14px!important;box-sizing:border-box!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:50px!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:50px!important;min-height:50px!important;box-shadow:none!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-footer{position:relative!important;flex:0 0 22px!important;height:22px!important;min-height:22px!important;max-height:22px!important;margin:0!important;padding:0 6px!important;box-sizing:border-box!important;line-height:20px!important;font-size:9px!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;background:#080d13!important;border-top:1px solid rgba(223,154,55,.52)!important;color:#df9a37!important}
    #sakalux-hub-overlay>#sakalux-hub-panel{border-radius:0 0 10px 10px!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom{border-radius:10px 10px 0 0!important;overflow:hidden!important}
    #sakalux-hub-overlay>#sakalux-hub-panel>.slh-footer{border-radius:0 0 10px 10px!important;overflow:hidden!important}
    #sakalux-hub-overlay#sakalux-hub-overlay *,#sakalux-hub-overlay>#sakalux-hub-panel *{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
    #sakalux-hub-overlay>#sakalux-hub-panel *{animation:none!important;transition:none!important}
  }`;
  (document.head||document.documentElement).appendChild(s);
})();


/* Hub v1.9.57: scoped Settings switch geometry overrides legacy styles. */
(()=>{
 const s=document.createElement('style');s.id='sakalux-hub-settings-switch-1957';
 s.textContent=`
#sakalux-hub-panel#sakalux-hub-panel .slh-settings .slh-setting-toggle{
 position:relative!important;display:block!important;box-sizing:border-box!important;
 flex:0 0 38px!important;width:38px!important;min-width:38px!important;max-width:38px!important;
 height:22px!important;min-height:22px!important;max-height:22px!important;
 margin:0!important;padding:0!important;border-width:1px!important;border-radius:999px!important;overflow:hidden!important;
}
#sakalux-hub-panel#sakalux-hub-panel .slh-settings .slh-setting-toggle i{
 position:absolute!important;display:block!important;box-sizing:border-box!important;
 left:2px!important;right:auto!important;top:50%!important;bottom:auto!important;
 width:16px!important;min-width:16px!important;max-width:16px!important;
 height:16px!important;min-height:16px!important;max-height:16px!important;
 margin:0!important;padding:0!important;border:0!important;border-radius:50%!important;
 transform:translate(0,-50%)!important;
}
#sakalux-hub-panel#sakalux-hub-panel .slh-settings .slh-setting-toggle.on i{transform:translate(16px,-50%)!important}
`;(document.head||document.documentElement).appendChild(s);
})();

/* Hub v1.9.58 compact donation buttons. */
(()=>{const s=document.createElement('style');s.textContent=`
#sakalux-hub-overlay>#sakalux-hub-panel#sakalux-hub-panel>.slh-bottom{flex-basis:48px!important;height:48px!important;min-height:48px!important}
#sakalux-hub-overlay>#sakalux-hub-panel#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:40px!important}
#sakalux-hub-overlay>#sakalux-hub-panel#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:40px!important;min-height:40px!important;padding:6px!important}
`;(document.head||document.documentElement).appendChild(s)})();

/* Compact donation controls and Elimination mobile panel geometry 1.9.59 */
(()=>{const s=document.createElement('style');s.textContent="@media(max-width:820px){\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay{position:fixed!important;inset:0 4px 36px!important;top:0!important;bottom:36px!important;left:4px!important;right:4px!important;width:auto!important;height:auto!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;margin:0!important;transform:none!important;box-sizing:border-box!important;padding:0!important;background:transparent!important;overflow:hidden!important;border-radius:14px!important;align-items:stretch!important;justify-content:stretch!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay #sakalux-hub-panel#sakalux-hub-panel{position:relative!important;inset:auto!important;top:auto!important;bottom:auto!important;left:auto!important;right:auto!important;align-self:stretch!important;flex:1 1 auto!important;width:100%!important;height:100%!important;min-height:0!important;max-height:100%!important;max-width:100%!important;margin:0!important;transform:none!important;box-sizing:border-box!important;border:1px solid #3c4652!important;border-radius:14px!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay #sakalux-hub-panel#sakalux-hub-panel{display:flex!important;flex-direction:column!important;overflow:hidden!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay #sakalux-hub-panel#sakalux-hub-panel>.slh-list{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay #sakalux-hub-panel#sakalux-hub-panel>.slh-settings{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay #sakalux-hub-panel#sakalux-hub-panel>.slh-view{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom{flex:0 0 28px!important;height:28px!important;min-height:28px!important}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:20px!important}\n#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:20px!important;min-height:20px!important;padding:0 4px!important;font-size:8px!important;line-height:1.2!important}\n\n}";(document.head||document.documentElement).appendChild(s)})();

(()=>{const s=document.createElement('style');s.textContent='#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom{flex:0 0 28px!important;height:28px!important;min-height:28px!important}#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-grid{height:20px!important}#sakalux-hub-overlay#sakalux-hub-overlay#sakalux-hub-overlay>#sakalux-hub-panel>.slh-bottom .slh-bottom-btn{height:20px!important;min-height:20px!important;padding:0 4px!important;font-size:8px!important;line-height:1.2!important}';(document.head||document.documentElement).appendChild(s)})();

/* Hub v1.9.60 compact summary and toolbar. */
(()=>{const s=document.createElement('style');s.textContent=`
#sakalux-hub-panel#sakalux-hub-panel .slh-stats{gap:5px!important}
#sakalux-hub-panel#sakalux-hub-panel .slh-stat{
 box-sizing:border-box!important;height:38px!important;min-height:38px!important;max-height:38px!important;
 padding:4px 6px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;
}
#sakalux-hub-panel#sakalux-hub-panel .slh-stat strong{font-size:13px!important;line-height:14px!important}
#sakalux-hub-panel#sakalux-hub-panel .slh-stat span{margin-top:2px!important;font-size:6.5px!important;line-height:9px!important}
#sakalux-hub-panel#sakalux-hub-panel .slh-stat small{display:none!important}
#sakalux-hub-panel#sakalux-hub-panel .slh-tools{gap:5px!important}
#sakalux-hub-panel#sakalux-hub-panel .slh-tool{
 box-sizing:border-box!important;height:32px!important;min-height:32px!important;max-height:32px!important;
 padding:3px 4px!important;margin:0!important;font-size:8px!important;line-height:1!important;gap:3px!important;border-radius:9px!important;
}
#sakalux-hub-panel#sakalux-hub-panel .slh-tool span{font-size:11px!important;line-height:1!important}
@media(max-width:520px){#sakalux-hub-panel#sakalux-hub-panel .slh-tool{font-size:7px!important}}
`;(document.head||document.documentElement).appendChild(s)})();
