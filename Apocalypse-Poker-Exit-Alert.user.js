// ==UserScript==
// @name         Apocalypse Poker Exit Alert
// @namespace    apocalypse-poker-exit-alert
// @version      0.7.3
// @description  Adds a selectable warm target and one PDA-aware attack alert when a player leaves Torn poker.
// @author       Zagan
// @match        https://www.torn.com/page.php?sid=holdem*
// @match        https://torn.com/page.php?sid=holdem*
// @run-at       document-idle
// @grant        GM_addStyle
// ==/UserScript==

/* SakaLuX Standalone Dock Bootstrap — BEGIN */
(() => {
  'use strict';
  const HUB_URL = 'https://update.greasyfork.org/scripts/592699/SakaLuX%20Script%20Hub.user.js';
  const LAST_KEY = 'SakaLuX_HUB_INSTALL_PROMPT_LAST';
  const INTERVAL = 12 * 60 * 60 * 1000;
  const DOCK_ID = 'sakalux-standalone-dock';
  const PROMPT_ID = 'sakalux-hub-install-prompt';
  const STYLE_ID = 'sakalux-standalone-dock-style';

  const hubInstalled = () => !!(window.SakaLuXScriptHub || document.getElementById('sakalux-hub-button'));

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
#${DOCK_ID}{position:fixed;right:10px;bottom:72px;z-index:2147483000;display:flex;flex-direction:column;gap:6px;max-width:min(260px,calc(100vw - 20px));padding:8px;background:rgba(13,17,23,.96);border:1px solid #3b4654;border-radius:12px;box-shadow:0 8px 28px rgba(0,0,0,.45);font:12px Arial,sans-serif}
#${DOCK_ID}[data-collapsed="1"] .slx-dock-items{display:none}
#${DOCK_ID} .slx-dock-head{display:flex;align-items:center;gap:6px}
#${DOCK_ID} .slx-dock-title{flex:1;color:#facc15;font-weight:900}
#${DOCK_ID} button,#${DOCK_ID} a{box-sizing:border-box!important;position:static!important;inset:auto!important;transform:none!important;float:none!important;margin:0!important;min-width:0!important;max-width:none!important;width:100%!important;height:auto!important;min-height:34px!important;padding:7px 9px!important;border-radius:8px!important;font:700 12px/1.2 Arial,sans-serif!important;white-space:normal!important}
#${DOCK_ID} .slx-dock-head button{width:auto!important;min-height:28px!important;padding:4px 7px!important}
#${DOCK_ID} .slx-dock-install{background:#8a5a00!important;border:1px solid #f59e0b!important;color:#fff!important;text-decoration:none!important;text-align:center!important;display:block!important}
#${DOCK_ID} .slx-dock-items{display:flex;flex-direction:column;gap:5px}
`;
    (document.head || document.documentElement).appendChild(s);
  }

  function ensureDock() {
    if (hubInstalled()) {
      document.getElementById(DOCK_ID)?.remove();
      document.getElementById(PROMPT_ID)?.remove();
      return null;
    }
    addStyle();
    let dock = document.getElementById(DOCK_ID);
    if (dock) return dock;
    dock = document.createElement('div');
    dock.id = DOCK_ID;
    dock.innerHTML = `<div class="slx-dock-head"><span class="slx-dock-title">SakaLuX Scripts</span><button type="button" data-slx-collapse>−</button></div><div class="slx-dock-items"></div><a class="slx-dock-install" href="${HUB_URL}">⬇ Install SakaLuX Hub</a>`;
    (document.body || document.documentElement).appendChild(dock);
    dock.querySelector('[data-slx-collapse]').addEventListener('click', () => {
      const collapsed = dock.dataset.collapsed === '1';
      dock.dataset.collapsed = collapsed ? '0' : '1';
      dock.querySelector('[data-slx-collapse]').textContent = collapsed ? '−' : '+';
    });
    return dock;
  }

  function eligible(el) {
    if (!el || el.nodeType !== 1 || el.closest('#' + DOCK_ID) || el.id === 'sakalux-hub-button') return false;
    if (!['BUTTON','A','DIV'].includes(el.tagName)) return false;
    const ident = `${el.id || ''} ${el.className || ''}`.toLowerCase();
    if (!/(slx|sakalux)/.test(ident)) return false;
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return false;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.width > 320 || r.height > 100) return false;
    if (/panel|modal|prompt|toast|style|overlay|dock/i.test(ident)) return false;
    return true;
  }

  function collectLaunchers() {
    const dock = ensureDock();
    if (!dock) return;
    const items = dock.querySelector('.slx-dock-items');
    document.querySelectorAll('button,a,div').forEach(el => {
      if (!eligible(el)) return;
      el.dataset.slxDocked = '1';
      items.appendChild(el);
    });
  }

  function maybePrompt() {
    if (hubInstalled() || document.getElementById(PROMPT_ID)) return;
    let last = 0;
    try { last = Number(localStorage.getItem(LAST_KEY) || 0); } catch {}
    if (last && Date.now() - last < INTERVAL) return;
    try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
    const p = document.createElement('div');
    p.id = PROMPT_ID;
    p.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#000b;display:flex;align-items:center;justify-content:center;padding:16px';
    p.innerHTML = `<div style="width:min(380px,100%);background:#111820;color:#fff;border:1px solid #465365;border-radius:14px;padding:18px;font:14px Arial,sans-serif;box-shadow:0 16px 50px #0008"><b style="font-size:17px">Install SakaLuX Script Hub?</b><div style="margin-top:8px;color:#cbd5e1;line-height:1.45">Keep all SakaLuX scripts together, with shared settings and controls.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-slx-later style="flex:1;padding:10px;border-radius:8px;background:#202a36;color:#fff;border:1px solid #526174">Later</button><button type="button" data-slx-install style="flex:1;padding:10px;border-radius:8px;background:#8a5a00;color:#fff;border:1px solid #f59e0b;font-weight:900">Install Hub</button></div></div>`;
    (document.body || document.documentElement).appendChild(p);
    p.querySelector('[data-slx-later]').addEventListener('click', () => p.remove());
    p.querySelector('[data-slx-install]').addEventListener('click', () => { location.href = HUB_URL; });
  }

  function start() {
    if (hubInstalled()) return;
    ensureDock();
    collectLaunchers();
    setTimeout(maybePrompt, 1200);
    let timer = 0;
    new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (hubInstalled()) {
          document.getElementById(DOCK_ID)?.remove();
          document.getElementById(PROMPT_ID)?.remove();
        } else collectLaunchers();
      }, 80);
    }).observe(document.documentElement, {childList:true, subtree:true});
    setInterval(() => { if (!hubInstalled()) { collectLaunchers(); maybePrompt(); } }, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
/* SakaLuX Standalone Dock Bootstrap — END */


(() => {
    "use strict";

    const e = Object.freeze({
        rosterFallbackDelayMs: 1200,
        toastVisibleMs: 4800,
        toastFadeMs: 180,
        duplicateLockMs: 15000,
        minimumStack: 0,
        chirp: true,
        chirpVolume: 0.1,
        audioResumeRetryMs: 800,
        vibrate: true,
        pdaReuseMainTab: true,
        pdaWarmTargetHashSwitch: true,
        attackWindowName: "apocalypse-attack-loader",
        debug: false
    });

    const t = Object.freeze({
        table: '[class^="holdemWrapper___"], [class*=" holdemWrapper___"]',
        playerName: '[class^="name___"], [class*=" name___"]',
        playerMoney: '[class^="money___"], [class*=" money___"]',
        logMessage: '[class^="message___"], [class*=" message___"]'
    });

    const n = {
        ownId: "",
        initialized: false,
        roster: new Map(),
        cache: new Map(),
        pendingFallbacks: new Map(),
        lastToastById: new Map(),
        lastToastByName: new Map(),
        processedLogTextByNode: new WeakMap(),
        recentLogSignatures: new Map(),
        handSerial: 0,
        handKey: "",
        handStartedAt: 0,
        street: "preflop",
        streetCommitted: new Map(),
        playerHandState: new Map(),
        selectedTargetId: "",
        selectedTargetName: "",
        tableMissingSince: 0,
        scanQueued: false,
        logArmedAt: Date.now() + 1500
    };

    let a = null;
    let o = null;
    let r = true;

    function i(...t) {
        if (e.debug) {
            console.debug(
                "[Apocalypse Poker Exit Alert]",
                ...t
            );
        }
    }

    function s() {
        const t =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!e.chirp || !t) return null;

        if (!a || a.state === "closed") {
            a = new t();
            r = true;

            a.addEventListener?.(
                "statechange",
                () => {
                    if (a?.state !== "running") {
                        r = true;
                    }
                }
            );
        }

        return a;
    }

    function l(e) {
        if (
            !e ||
            e.state !== "running" ||
            !r
        ) {
            return;
        }

        try {
            const t = e.createOscillator();
            const n = e.createGain();
            const a = e.currentTime;

            n.gain.setValueAtTime(
                0.0001,
                a
            );

            t.connect(n);
            n.connect(e.destination);
            t.start(a);
            t.stop(a + 0.015);

            r = false;
        } catch (e) {
            r = true;

            i(
                "Could not prime chirp audio",
                e
            );
        }
    }

    function c() {
        const t = s();
        if (!t) return;

        if (t.state === "running") {
            l(t);
            return;
        }

        if (o) return;

        let n;

        try {
            n = Promise.resolve(t.resume());
        } catch (e) {
            r = true;

            i(
                "Could not request chirp audio resume",
                e
            );

            return;
        }

        const a = new Promise((t) => {
            setTimeout(
                t,
                e.audioResumeRetryMs
            );
        });

        o = Promise.race([n, a])
            .then(() => {
                if (t.state === "running") {
                    l(t);
                } else {
                    r = true;
                }
            })
            .catch((e) => {
                r = true;

                i(
                    "Could not arm chirp audio",
                    e
                );
            })
            .finally(() => {
                o = null;
            });
    }

    function d() {
        r = true;

        if (
            a &&
            a.state !== "closed"
        ) {
            c();
        }
    }

    function p() {
        r = true;
    }

    function u(e, t, n, a, o, r) {
        const i = e.createOscillator();
        const s = e.createGain();

        i.type = "sine";

        i.frequency.setValueAtTime(
            a,
            t
        );

        i.frequency.exponentialRampToValueAtTime(
            o,
            t + n
        );

        s.gain.setValueAtTime(
            0.0001,
            t
        );

        s.gain.exponentialRampToValueAtTime(
            Math.max(0.0001, r),
            t + 0.01
        );

        s.gain.exponentialRampToValueAtTime(
            0.0001,
            t + n
        );

        i.connect(s);
        s.connect(e.destination);
        i.start(t);
        i.stop(t + n + 0.02);
    }

    function m(e) {
        return String(e ?? "")
            .replace(
                /[\u200B-\u200D\uFEFF]/g,
                ""
            )
            .replace(/\s+/g, " ")
            .trim();
    }

    function f(e) {
        return m(e).toLowerCase();
    }

    function g(e) {
        return Boolean(
            e &&
            !e.startsWith("__self__:")
        );
    }

    function h(e) {
        const t = String(e ?? "")
            .replace(/[^\d]/g, "");

        return t ? Number(t) : 0;
    }

    function b() {
        const e =
            document.querySelector(
                "#torn-user"
            );

        if (e?.value) {
            try {
                const t =
                    JSON.parse(e.value);

                const n =
                    t.id ??
                    t.player_id ??
                    t.playerId;

                if (n) return String(n);
            } catch (e) {
                i(
                    "Could not parse #torn-user",
                    e
                );
            }
        }

        return String(
            document
                .querySelector(
                    "script[playerid]"
                )
                ?.getAttribute(
                    "playerid"
                ) || ""
        );
    }

    function y() {
        return document.querySelector(
            t.table
        );
    }

    function x(e) {
        const n = e.id.match(
            /^player-(\d+)$/
        );

        if (!n) return null;

        const a =
            e.querySelector(t.playerName);

        const o = (() => {
            const t = [
                e.dataset.hudRawName,
                e.dataset.hudName,
                e.dataset.hudBoundName
            ];

            for (const e of t) {
                const t = m(e);
                if (g(t)) return t;
            }

            if (!a) return "";

            const n = a.cloneNode(true);

            n.querySelectorAll(
                '[class*="tphud-"], [id^="tphud-"], [data-apm-target-control]'
            ).forEach(
                (e) => e.remove()
            );

            return m(n.textContent);
        })();

        if (!g(o)) return null;

        const r =
            e.querySelector(
                t.playerMoney
            );

        const i = m(r?.textContent)
            .match(/\$[\d,]+/);

        const s = i?.[0] || "";

        return {
            id: n[1],
            name: o,
            moneyText: s,
            moneyValue: h(s),
            lastSeenAt: Date.now()
        };
    }

    function w() {
        const e = y();
        const t = new Map();

        if (!e) {
            return {
                table: null,
                players: t,
                playerNodeCount: 0
            };
        }

        const n =
            e.querySelectorAll(
                '[id^="player-"]'
            );

        for (const e of n) {
            const n = x(e);

            if (n) {
                t.set(n.id, n);
            }
        }

        return {
            table: e,
            players: t,
            playerNodeCount: n.length
        };
    }

    function v(e) {
        return Boolean(
            e &&
            String(e.id) ===
                n.selectedTargetId
        );
    }

    function k() {
        document
            .querySelectorAll(
                "[data-apm-target-control]"
            )
            .forEach((e) => {
                const t =
                    e.dataset.playerId ===
                    n.selectedTargetId;

                const a =
                    e.dataset.playerName ||
                    "this player";

                e.classList.toggle(
                    "apm-target-selected",
                    t
                );

                e.setAttribute(
                    "aria-checked",
                    String(t)
                );

                e.setAttribute(
                    "aria-label",
                    t
                        ? `${a} is the warm attack target`
                        : `Preload ${a} as the warm attack target`
                );

                e.title = t
                    ? `Warm target: ${a}`
                    : `Preload ${a}`;
            });
    }

    function A(e) {
        if (!e?.id) return;

        n.selectedTargetId =
            String(e.id);

        n.selectedTargetName =
            e.name ||
            "Unknown player";

        k();

        i(
            "Warm target selected:",
            n.selectedTargetName
        );
    }

    function S() {
        n.selectedTargetId = "";
        n.selectedTargetName = "";
        k();
    }

    function T(e) {
        if (!e) return;

        e.classList.add(
            "apm-target-error"
        );

        setTimeout(() => {
            if (e.isConnected) {
                e.classList.remove(
                    "apm-target-error"
                );
            }
        }, 1400);
    }

    function H(e) {
        return (
            "https://www.torn.com/page.php" +
            `?sid=attack&user2ID=${encodeURIComponent(e)}`
        );
    }

    function Z() {
        const e =
            window.flutter_inappwebview;

        return typeof e?.callHandler ===
            "function"
            ? e
            : null;
    }

    function J(t) {
        const n = new URL(
            t,
            location.href
        );

        if (
            e.pdaWarmTargetHashSwitch
        ) {
            n.hash =
                `apm-switch-${Date.now().toString(36)}`;
        }

        return (
            `tornpda://${n.host}${n.pathname}` +
            `${n.search}${n.hash}`
        );
    }

    async function W(
        t,
        n = null
    ) {
        const a = Z();

        if (
            !a ||
            !e.pdaReuseMainTab
        ) {
            return false;
        }

        const o =
            n?.textContent || "";

        if (n) {
            n.textContent =
                "SWITCHING…";
        }

        try {
            const e =
                await a.callHandler(
                    "launchIntent",
                    J(t)
                );

            if (
                e === false ||
                e?.success === false
            ) {
                throw new Error(
                    e?.error ||
                    "Torn PDA rejected the deep link"
                );
            }

            return true;
        } catch (e) {
            i(
                "Could not reuse the Torn PDA main tab",
                e
            );

            if (n) {
                n.textContent =
                    "PDA OPEN FAILED";

                setTimeout(() => {
                    if (
                        n.isConnected
                    ) {
                        n.textContent = o;
                    }
                }, 1400);
            }

            return false;
        }
    }

    async function U(t, n) {
        A(t);

        const a = H(t.id);

        if (
            e.pdaReuseMainTab &&
            Z()
        ) {
            n?.classList.add(
                "apm-target-loading"
            );

            const e = await W(a);

            n?.classList.remove(
                "apm-target-loading"
            );

            if (!e) T(n);
            return;
        }

        const o = window.open(
            a,
            e.attackWindowName
        );

        if (o) {
            o.focus();
        } else {
            T(n);
        }
    }

    function C(a = y()) {
        if (!a) return;

        a.querySelectorAll(
            '[id^="player-"]'
        ).forEach((a) => {
            const o = x(a);

            let r = a.querySelector(
                "[data-apm-target-control]"
            );

            if (
                !o ||
                o.id === n.ownId
            ) {
                r?.remove();
                return;
            }

            const i =
                a.querySelector(
                    t.playerName
                );

            if (!i) return;

            if (
                r &&
                r.dataset.playerId !==
                    o.id
            ) {
                r.remove();
                r = null;
            }

            if (!r) {
                r =
                    document.createElement(
                        "button"
                    );

                r.type = "button";
                r.className =
                    "apm-target-radio";

                r.dataset
                    .apmTargetControl =
                    "1";

                r.setAttribute(
                    "role",
                    "radio"
                );

                r.addEventListener(
                    "pointerdown",
                    (e) => {
                        e.stopPropagation();
                    }
                );

                r.addEventListener(
                    "touchstart",
                    (e) => {
                        e.stopPropagation();
                    },
                    { passive: true }
                );

                r.addEventListener(
                    "click",
                    (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        void U(
                            {
                                id:
                                    r.dataset.playerId,
                                name:
                                    r.dataset.playerName
                            },
                            r
                        );
                    }
                );
            }

            const s =
                [...i.children].find(
                    (e) =>
                        e.matches(
                            '[class^="icon___"], [class*=" icon___"]'
                        )
                );

            if (s) {
                const e =
                    s.nextSibling;

                if (e !== r) {
                    i.insertBefore(r, e);
                }
            } else {
                const e =
                    [...i.children].find(
                        (e) =>
                            e.matches(
                                '[class*="tphud-"], [id^="tphud-"]'
                            )
                    );

                i.insertBefore(
                    r,
                    e || null
                );
            }

            r.dataset.playerId = o.id;
            r.dataset.playerName = o.name;
        });

        k();
    }

    function _(e) {
        const t =
            n.cache.get(e.id);

        const a = {
            ...t,
            ...e,
            name:
                e.name ||
                t?.name ||
                "Unknown player",
            moneyText:
                e.moneyText ||
                t?.moneyText ||
                "",
            moneyValue: e.moneyText
                ? e.moneyValue
                : t?.moneyValue ?? 0,
            lastSeenAt: Date.now()
        };

        n.cache.set(e.id, a);
        return a;
    }

    function M(e = "") {
        if (
            e &&
            e === n.handKey
        ) {
            return;
        }

        n.handSerial += 1;

        n.handKey =
            e ||
            `synthetic-${n.handSerial}-${Date.now()}`;

        n.handStartedAt =
            Date.now();

        n.street = "preflop";
        n.streetCommitted.clear();

        i(
            "Tracking hand:",
            n.handKey
        );
    }

    function E() {
        if (n.handSerial === 0) {
            M();
        }
    }

    function I(e) {
        E();

        if (n.street !== e) {
            n.street = e;
            n.streetCommitted.clear();
        }
    }

    function L(e) {
        E();

        const t =
            n.playerHandState.get(e.id);

        if (
            t?.handSerial ===
            n.handSerial
        ) {
            return t;
        }

        const a = {
            id: e.id,
            name: e.name,
            handSerial:
                n.handSerial,
            handKey: n.handKey,
            lastBetAmount: 0,
            stackBeforeLastBet:
                e.moneyValue || 0,
            lastAction: "",
            lastActionAt: 0,
            actionToken: 0,
            wonHand: false,
            folded: false,
            explicitAllIn: false,
            zeroStackConfirmed: false,
            allInCandidate: false,
            allInRuledOut: false
        };

        n.playerHandState.set(
            e.id,
            a
        );

        return a;
    }

    function P(e) {
        const t = f(e);

        for (
            const e
            of n.pendingFallbacks
                .values()
        ) {
            if (
                f(e.player.name) === t
            ) {
                return e.player;
            }
        }

        for (
            const e
            of n.roster.values()
        ) {
            if (f(e.name) === t) {
                return e;
            }
        }

        return (
            [...n.cache.values()]
                .filter(
                    (e) =>
                        f(e.name) === t &&
                        Date.now() -
                            e.lastSeenAt <
                            30000
                )
                .sort(
                    (e, t) =>
                        t.lastSeenAt -
                        e.lastSeenAt
                )[0] || null
        );
    }

    function N(
        e,
        t,
        a,
        o = null,
        r = false
    ) {
        const i = P(e);
        if (!i) return;

        const s = L(i);

        const l =
            n.streetCommitted.get(
                i.id
            ) || 0;

        let c = a;
        let d = l + a;

        if (o !== null) {
            c = Math.max(
                0,
                o - l
            );

            if (c === 0) c = a;

            d = Math.max(
                o,
                l + c
            );
        }

        n.streetCommitted.set(
            i.id,
            d
        );

        const p =
            n.cache.get(i.id) || i;

        const u =
            p.moneyValue || 0;

        s.name = i.name;
        s.lastBetAmount = c;
        s.stackBeforeLastBet = u;
        s.lastAction = t;
        s.lastActionAt = Date.now();
        s.folded = false;
        s.explicitAllIn = r;

        s.zeroStackConfirmed =
            Boolean(
                p.moneyText &&
                p.moneyValue === 0
            );

        s.allInCandidate =
            Boolean(
                r ||
                s.zeroStackConfirmed ||
                (
                    u > 0 &&
                    c >= u
                )
            );

        s.allInRuledOut = false;
        s.actionToken += 1;

        const m = s.actionToken;
        const f = s.handSerial;

        setTimeout(() => {
            const e =
                n.playerHandState.get(
                    i.id
                );

            if (
                !e ||
                e.handSerial !== f ||
                e.actionToken !== m
            ) {
                return;
            }

            const t =
                document.getElementById(
                    `player-${i.id}`
                );

            const a =
                t ? x(t) : null;

            if (!a?.moneyText) return;

            _(a);

            if (a.moneyValue === 0) {
                e.zeroStackConfirmed =
                    true;

                e.allInCandidate = true;
                e.allInRuledOut = false;
            } else if (
                !e.explicitAllIn
            ) {
                e.zeroStackConfirmed =
                    false;

                e.allInCandidate = false;
                e.allInRuledOut = true;
            }
        }, 100);
    }

    function D(
        e,
        t = "cancelled"
    ) {
        const a =
            n.pendingFallbacks.get(e);

        if (!a) return;

        clearTimeout(a.timer);

        n.pendingFallbacks.delete(e);

        i(
            `Roster fallback ${t}:`,
            a.player.name
        );
    }

    function z() {
        for (
            const e
            of [...n.pendingFallbacks.keys()]
        ) {
            D(e, "table reset");
        }
    }

    function B(t) {
        const a = Date.now();

        const o =
            n.lastToastById.get(t.id) ||
            0;

        const r =
            n.lastToastByName.get(
                f(t.name)
            ) || 0;

        return (
            a - o <
                e.duplicateLockMs ||
            a - r <
                e.duplicateLockMs
        );
    }

    function G(e) {
        const t = Date.now();

        n.lastToastById.set(
            e.id,
            t
        );

        n.lastToastByName.set(
            f(e.name),
            t
        );
    }

    function X(e) {
        const t =
            n.cache.get(e.id) || e;

        const a =
            n.playerHandState.get(
                e.id
            );

        if (!a) {
            return Boolean(
                t.moneyText &&
                t.moneyValue === 0
            );
        }

        if (a.wonHand) return false;

        if (
            t.moneyText &&
            t.moneyValue === 0
        ) {
            return true;
        }

        const o =
            Date.now() -
                a.lastActionAt <
            30000;

        if (!o || a.folded) {
            return false;
        }

        return Boolean(
            a.zeroStackConfirmed ||
            a.explicitAllIn ||
            (
                a.allInCandidate &&
                !a.allInRuledOut
            )
        );
    }

    function Q() {
        let e =
            document.querySelector(
                "#apm-toast-host"
            );

        if (!e) {
            e =
                document.createElement(
                    "div"
                );

            e.id = "apm-toast-host";
            document.body.append(e);
        }

        return e;
    }

    function K(t) {
        if (
            !t?.isConnected ||
            t.dataset.closing === "1"
        ) {
            return;
        }

        t.dataset.closing = "1";

        clearTimeout(t.apmTimer);

        t.classList.add(
            "apm-toast-out"
        );

        setTimeout(
            () => t.remove(),
            e.toastFadeMs
        );
    }

    function Y(
        t,
        n,
        a = Date.now()
    ) {
        const o = Math.max(
            0,
            Date.now() - a
        );

        const c = Math.max(
            0,
            e.toastVisibleMs - o
        );

        if (c === 0) return;

        const d = Q();
        const p = v(t);

        const m = d.querySelector(
            `[data-player-id="${t.id}"]`
        );

        if (m) return;

        while (d.children.length >= 3) {
            d.lastElementChild.remove();
        }

        const f =
            document.createElement("div");

        f.className = p
            ? "apm-toast apm-toast-warm"
            : "apm-toast apm-toast-cold";

        f.dataset.playerId = t.id;
        f.dataset.source = n;

        f.style.setProperty(
            "--apm-toast-duration",
            `${c}ms`
        );

        const g =
            document.createElement("a");

        g.className = "apm-attack-link";
        g.href = H(t.id);
        g.target =
            e.attackWindowName;

        const h =
            document.createElement(
                "span"
            );

        h.className = "apm-kicker";

        h.textContent = p
            ? "APOCALYPSE // WARM TARGET"
            : "APOCALYPSE // COLD TARGET";

        const b =
            document.createElement(
                "span"
            );

        b.className = "apm-details";

        const y =
            document.createElement(
                "strong"
            );

        y.className =
            "apm-player-name";

        y.textContent = t.name;

        const x =
            document.createElement(
                "span"
            );

        x.className = t.busted
            ? "apm-stack apm-busted"
            : "apm-stack";

        x.textContent = t.busted
            ? "BUSTED"
            : t.moneyText
                ? `${t.moneyText} last stack`
                : "Stack unavailable";

        b.append(y, x);

        const w =
            document.createElement(
                "span"
            );

        w.className = "apm-action";

        w.textContent = p
            ? "OPEN WARM"
            : "LOAD + ATTACK";

        g.append(h, b, w);

        g.addEventListener(
            "click",
            (n) => {
                if (!v(t)) A(t);

                if (
                    !e.pdaReuseMainTab ||
                    !Z()
                ) {
                    return;
                }

                n.preventDefault();
                n.stopPropagation();

                void W(g.href, w);
            }
        );

        const k =
            document.createElement(
                "button"
            );

        k.className = "apm-close";
        k.type = "button";
        k.textContent = "×";

        k.setAttribute(
            "aria-label",
            "Dismiss mug alert"
        );

        k.addEventListener(
            "click",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                K(f);
            }
        );

        const S =
            document.createElement(
                "div"
            );

        S.className = "apm-progress";

        f.append(g, k, S);
        d.prepend(f);

        requestAnimationFrame(() =>
            f.classList.add(
                "apm-toast-visible"
            )
        );

        f.apmTimer = setTimeout(
            () => K(f),
            c
        );

        (() => {
            const t = s();
            if (!t) return;

            const n = () => {
                l(t);

                const n =
                    t.currentTime + 0.015;

                u(
                    t,
                    n,
                    0.09,
                    720,
                    980,
                    e.chirpVolume
                );

                u(
                    t,
                    n + 0.105,
                    0.115,
                    1080,
                    1540,
                    e.chirpVolume * 0.85
                );
            };

            if (
                t.state === "running"
            ) {
                n();
                return;
            }

            let a;
            r = true;

            try {
                a = Promise.resolve(
                    t.resume()
                );
            } catch (e) {
                r = true;

                i(
                    "Could not request chirp playback",
                    e
                );

                return;
            }

            a.then(() => {
                if (
                    t.state === "running"
                ) {
                    n();
                }
            }).catch((e) => {
                r = true;

                i(
                    "Could not play chirp",
                    e
                );
            });
        })();

        if (
            e.vibrate &&
            typeof navigator.vibrate ===
                "function"
        ) {
            navigator.vibrate([
                120,
                60,
                120,
                60,
                220
            ]);
        }

        i(`Toast from ${n}:`, t);
    }

    function $(
        t,
        a,
        o = Date.now()
    ) {
        if (!t) return;

        const c = {
            ...t,
            ...(n.cache.get(t.id) || {})
        };

        c.busted = X(c);

        if (!n.ownId) {
            n.ownId = b();
        }

        if (
            c.id === n.ownId ||
            B(c)
        ) {
            return;
        }

        D(
            c.id,
            `${a} alert won`
        );

        G(c);

        if (
            !c.busted &&
            c.moneyText &&
            c.moneyValue <
                e.minimumStack
        ) {
            return;
        }

        Y(c, a, o);
    }

    function R(t) {
        if (
            !t ||
            t.id === n.ownId ||
            B(t) ||
            n.pendingFallbacks.has(t.id)
        ) {
            return;
        }

        const a = {
            player: { ...t },
            detectedAt: Date.now(),
            timer: null
        };

        a.timer = setTimeout(() => {
            const o =
                n.pendingFallbacks.get(
                    t.id
                );

            if (!o) return;

            const r = w();

            if (r.players.has(t.id)) {
                D(
                    t.id,
                    "player returned"
                );
                return;
            }

            if (
                !r.table ||
                r.playerNodeCount === 0
            ) {
                D(
                    t.id,
                    "table unavailable"
                );
                return;
            }

            n.pendingFallbacks.delete(
                t.id
            );

            $(
                o.player,
                "roster fallback",
                o.detectedAt
            );
        }, e.rosterFallbackDelayMs);

        n.pendingFallbacks.set(
            t.id,
            a
        );

        i(
            "Waiting for authoritative log line:",
            t.name
        );
    }

    function V(e = "unknown") {
        n.scanQueued = false;

        if (!n.ownId) {
            n.ownId = b();
        }

        const t = w();

        if (!t.table) {
            if (!n.tableMissingSince) {
                n.tableMissingSince =
                    Date.now();
            }

            if (
                n.initialized &&
                Date.now() -
                    n.tableMissingSince >
                    3000
            ) {
                z();
                S();

                n.initialized = false;
                n.roster.clear();
                n.cache.clear();
                n.handSerial = 0;
                n.handKey = "";
                n.handStartedAt = 0;
                n.street = "preflop";
                n.streetCommitted.clear();
                n.playerHandState.clear();
                n.tableMissingSince = 0;

                i("Table state reset");
            }

            return;
        }

        n.tableMissingSince = 0;

        if (
            t.playerNodeCount === 0
        ) {
            return;
        }

        const a = new Map();
        let o = 0;

        for (
            const e
            of t.players.values()
        ) {
            const t =
                n.roster.has(e.id);

            const r = _(e);

            if (!t) o += 1;

            if (
                n.pendingFallbacks.has(
                    r.id
                )
            ) {
                D(
                    r.id,
                    "player visible"
                );
            }

            a.set(r.id, r);
        }

        C(t.table);

        if (!n.initialized) {
            n.roster = a;
            n.initialized = true;

            i(
                "Initial roster:",
                [...a.values()]
            );

            return;
        }

        const r =
            [...n.roster.values()]
                .filter(
                    (e) => !a.has(e.id)
                );

        const s =
            r.length >= 3 ||
            (
                r.length >= 2 &&
                o >= r.length
            );

        n.roster = a;

        if (s) {
            z();
            S();

            n.cache = new Map(a);
            n.handSerial = 0;
            n.handKey = "";
            n.handStartedAt = 0;
            n.street = "preflop";
            n.streetCommitted.clear();
            n.playerHandState.clear();

            i(
                "Broad table replacement ignored:",
                e
            );

            return;
        }

        for (const e of r) {
            R(e);
        }
    }

    function q(
        e = "DOM mutation"
    ) {
        if (n.scanQueued) return;

        n.scanQueued = true;

        requestAnimationFrame(() => {
            setTimeout(
                () => V(e),
                35
            );
        });
    }

    function ee(e) {
        const t = Date.now();

        const a =
            n.recentLogSignatures.get(e) ||
            0;

        n.recentLogSignatures.set(
            e,
            t
        );

        if (
            n.recentLogSignatures.size >
            100
        ) {
            for (
                const [e, a]
                of n.recentLogSignatures
            ) {
                if (
                    t - a > 30000
                ) {
                    n.recentLogSignatures
                        .delete(e);
                }
            }
        }

        return t - a < 3000;
    }

    function F(e) {
        if (
            !e ||
            e.closest(
                '[class*="tphud-"], [id^="tphud-"]'
            )
        ) {
            return;
        }

        const t = m(e.textContent);

        if (
            !t ||
            n.processedLogTextByNode
                .get(e) === t
        ) {
            return;
        }

        n.processedLogTextByNode.set(
            e,
            t
        );

        if (ee(t)) return;
        if (Date.now() < n.logArmedAt) return;

        const a = t.match(
            /\bGame\s+([A-Za-z0-9_-]+)\s+started\b/i
        );

        if (a) {
            M(a[1]);
            return;
        }

        if (/\bThe preflop\b/i.test(t)) {
            if (
                n.handSerial === 0 ||
                (
                    n.street !==
                        "preflop" &&
                    Date.now() -
                        n.handStartedAt >
                        500
                )
            ) {
                M();
            }

            I("preflop");
            return;
        }

        if (/\bThe flop\b/i.test(t)) {
            I("flop");
            return;
        }

        if (/\bThe turn\b/i.test(t)) {
            I("turn");
            return;
        }

        if (/\bThe river\b/i.test(t)) {
            I("river");
            return;
        }

        const o = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+won\s+\$[\d,]+\b/i
        );

        if (o) {
            const e = P(o[1]);

            if (e) {
                const t = L(e);

                t.wonHand = true;
                t.lastAction = "won";
                t.lastActionAt =
                    Date.now();
            }

            return;
        }

        const r =
            /\ball[\s-]?in\b/i.test(t);

        const i = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+raised\s+\$([\d,]+)\s+to\s+\$([\d,]+)/i
        );

        if (i) {
            N(
                i[1],
                "raised",
                h(i[2]),
                h(i[3]),
                r
            );
            return;
        }

        const s = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+raised\s+to\s+\$([\d,]+)/i
        );

        if (s) {
            N(
                s[1],
                "raised",
                h(s[2]),
                h(s[2]),
                r
            );
            return;
        }

        const l = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+(called|bet|posted(?:\s+(?:small|big)\s+blind)?)\s+\$([\d,]+)/i
        );

        if (l) {
            N(
                l[1],
                l[2].toLowerCase(),
                h(l[3]),
                null,
                r
            );
            return;
        }

        const c = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+(?:went|is)\s+all[\s-]?in(?:\s+(?:for\s+)?\$([\d,]+))?/i
        );

        if (c) {
            const e = P(c[1]);
            const t =
                e?.moneyValue || 0;

            N(
                c[1],
                "all in",
                c[2] ? h(c[2]) : t,
                null,
                true
            );

            return;
        }

        const d = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+folded\b/i
        );

        if (d) {
            const e = P(d[1]);

            if (e) {
                const t = L(e);

                t.lastAction = "folded";
                t.lastActionAt =
                    Date.now();

                t.folded = true;
                t.explicitAllIn = false;
                t.zeroStackConfirmed =
                    false;

                t.allInCandidate = false;
                t.allInRuledOut = true;
            }

            return;
        }

        const p = t.match(
            /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{1,32})\s+(?:(?:has\s+)?left|quit)(?:\s+the)?\s+(?:table|game)\b/i
        );

        if (p) {
            const e = P(p[1]);

            if (e) {
                $(
                    e,
                    "poker log"
                );
            }

            return;
        }

        if (
            /\b[A-Za-z0-9_-]{1,32}\s+(?:has\s+)?joined(?:\s+the)?\s+table\b/i
                .test(t)
        ) {
            q("join log");
        }
    }

    function O(e) {
        if (
            e.nodeType !==
            Node.ELEMENT_NODE
        ) {
            return;
        }

        const a = [];

        if (e.matches(t.logMessage)) {
            a.push(e);
        }

        a.push(
            ...e.querySelectorAll(
                t.logMessage
            )
        );

        if (a.length > 3) {
            for (const e of a) {
                const t = m(
                    e.textContent
                );

                n.processedLogTextByNode
                    .set(e, t);

                if (t) {
                    n.recentLogSignatures
                        .set(
                            t,
                            Date.now()
                        );
                }
            }

            return;
        }

        a.forEach(F);
    }

    GM_addStyle(`
        .apm-target-radio {
            -webkit-appearance: none !important;
            appearance: none !important;
            display: inline-flex !important;
            position: relative !important;
            box-sizing: border-box !important;
            flex: 0 0 15px !important;
            align-items: center !important;
            align-self: center !important;
            justify-content: center !important;
            width: 15px !important;
            min-width: 15px !important;
            height: 15px !important;
            min-height: 15px !important;
            margin: 0 3px !important;
            padding: 0 !important;
            border: 1px solid rgba(255, 159, 10, 0.9) !important;
            border-radius: 50% !important;
            background: #171819 !important;
            box-shadow:
                0 0 0 1px rgba(0, 0, 0, 0.65),
                inset 0 0 4px rgba(255, 159, 10, 0.24) !important;
            vertical-align: -2px !important;
            cursor: pointer !important;
            visibility: visible !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
            -webkit-tap-highlight-color: transparent !important;
            z-index: 30 !important;
        }

        .apm-target-radio::after {
            content: "";
            display: block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #ff3b30;
            box-shadow: 0 0 6px rgba(255, 59, 48, 0.95);
            opacity: 0;
            transform: scale(0.25);
            transition:
                opacity 100ms ease,
                transform 100ms ease;
        }

        .apm-target-radio.apm-target-selected {
            border-color: #ff3b30 !important;
            box-shadow:
                0 0 0 1px rgba(0, 0, 0, 0.65),
                0 0 9px rgba(255, 59, 48, 0.9) !important;
        }

        .apm-target-radio.apm-target-selected::after {
            opacity: 1;
            transform: scale(1);
        }

        .apm-target-radio.apm-target-loading {
            animation:
                apm-target-pulse
                480ms
                ease-in-out
                infinite
                alternate;
        }

        .apm-target-radio.apm-target-error {
            border-color: #fff !important;
            box-shadow:
                0 0 10px #fff !important;
        }

        @keyframes apm-target-pulse {
            from {
                transform: scale(0.82);
                opacity: 0.62;
            }

            to {
                transform: scale(1.15);
                opacity: 1;
            }
        }

        #apm-toast-host {
            position: fixed;
            z-index: 2147483647;
            top: max(
                68px,
                calc(
                    env(safe-area-inset-top) +
                    12px
                )
            );
            left: 50%;
            width: min(
                430px,
                calc(100vw - 20px)
            );
            display: grid;
            gap: 8px;
            transform: translateX(-50%);
            pointer-events: none;
            font-family:
                Arial,
                Helvetica,
                sans-serif;
        }

        .apm-toast {
            position: relative;
            overflow: hidden;
            border:
                1px solid
                rgba(255, 59, 48, 0.9);
            border-left:
                5px solid #ff3b30;
            border-radius: 8px;
            background:
                linear-gradient(
                    115deg,
                    rgba(255, 59, 48, 0.14),
                    transparent 45%
                ),
                #111214;
            box-shadow:
                0 10px 30px rgba(0, 0, 0, 0.75),
                0 0 18px rgba(255, 59, 48, 0.2);
            opacity: 0;
            transform:
                translateY(-14px)
                scale(0.985);
            transition:
                opacity 180ms ease,
                transform 180ms ease;
            pointer-events: auto;
        }

        .apm-toast-warm {
            border-color:
                rgba(255, 159, 10, 0.95);
            border-left-color: #ff9f0a;
            background:
                linear-gradient(
                    115deg,
                    rgba(255, 159, 10, 0.18),
                    transparent 48%
                ),
                #111214;
            box-shadow:
                0 10px 30px rgba(0, 0, 0, 0.75),
                0 0 20px rgba(255, 159, 10, 0.28);
        }

        .apm-toast-visible {
            opacity: 1;
            transform:
                translateY(0)
                scale(1);
        }

        .apm-toast-out {
            opacity: 0;
            transform:
                translateY(-10px)
                scale(0.985);
        }

        .apm-attack-link {
            display: grid;
            grid-template-columns:
                1fr auto;
            grid-template-areas:
                "kicker action"
                "details action";
            gap: 3px 14px;
            min-height: 72px;
            padding:
                11px 45px 12px 13px;
            color: #f5f5f5 !important;
            text-decoration: none !important;
            -webkit-tap-highlight-color:
                transparent;
            touch-action: manipulation;
        }

        .apm-attack-link:active {
            background:
                rgba(255, 59, 48, 0.17);
        }

        .apm-kicker {
            grid-area: kicker;
            color: #ff453a;
            font-family: monospace;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.2px;
        }

        .apm-toast-warm .apm-kicker {
            color: #ffb340;
        }

        .apm-details {
            grid-area: details;
            display: flex;
            min-width: 0;
            flex-direction: column;
        }

        .apm-player-name {
            overflow: hidden;
            color: #fff;
            font-size: 19px;
            line-height: 23px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .apm-stack {
            color: #b7b7b7;
            font-size: 12px;
            line-height: 17px;
        }

        .apm-busted {
            color: #ff4a3d;
            font-weight: 900;
            letter-spacing: 1.1px;
        }

        .apm-action {
            grid-area: action;
            align-self: center;
            padding: 9px 10px;
            border:
                1px solid
                rgba(255, 59, 48, 0.85);
            border-radius: 5px;
            background:
                linear-gradient(
                    #d92d25,
                    #a91813
                );
            color: #fff;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.4px;
            white-space: nowrap;
        }

        .apm-toast-warm .apm-action {
            border-color:
                rgba(255, 179, 64, 0.95);
            background:
                linear-gradient(
                    #d87900,
                    #a84c00
                );
        }

        .apm-close {
            position: absolute;
            top: 4px;
            right: 5px;
            width: 30px;
            height: 30px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: transparent;
            color: #aaa;
            font-size: 24px;
            line-height: 28px;
            cursor: pointer;
        }

        .apm-progress {
            position: absolute;
            right: 0;
            bottom: 0;
            left: 0;
            height: 3px;
            background:
                linear-gradient(
                    90deg,
                    #ff9f0a,
                    #ff3b30
                );
            transform-origin:
                left center;
            animation:
                apm-progress-drain
                var(--apm-toast-duration)
                linear
                forwards;
        }

        @keyframes apm-progress-drain {
            from {
                transform: scaleX(1);
            }

            to {
                transform: scaleX(0);
            }
        }

        @media (max-width: 500px) {
            #apm-toast-host {
                top: max(
                    56px,
                    calc(
                        env(safe-area-inset-top) +
                        8px
                    )
                );
                width:
                    calc(100vw - 16px);
            }

            .apm-attack-link {
                gap: 2px 9px;
                min-height: 68px;
                padding-right: 41px;
                padding-left: 10px;
            }

            .apm-player-name {
                font-size: 18px;
            }

            .apm-action {
                padding: 8px;
                font-size: 11px;
            }
        }
    `);

    document
        .querySelectorAll(
            t.logMessage
        )
        .forEach((e) => {
            const t =
                m(e.textContent);

            n.processedLogTextByNode
                .set(e, t);

            if (t) {
                n.recentLogSignatures
                    .set(
                        t,
                        Date.now()
                    );
            }
        });

    document.addEventListener(
        "pointerdown",
        c,
        {
            capture: true,
            passive: true
        }
    );

    document.addEventListener(
        "touchstart",
        c,
        {
            capture: true,
            passive: true
        }
    );

    document.addEventListener(
        "keydown",
        c,
        true
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.visibilityState ===
                "visible"
            ) {
                d();
            } else {
                r = true;
            }
        }
    );

    window.addEventListener(
        "pageshow",
        d
    );

    window.addEventListener(
        "focus",
        d
    );

    window.addEventListener(
        "pagehide",
        p
    );

    window.addEventListener(
        "blur",
        p
    );

    new MutationObserver((e) => {
        for (const n of e) {
            if (
                n.type ===
                "characterData"
            ) {
                const e =
                    n.target.parentElement
                        ?.closest(
                            t.logMessage
                        );

                if (e) F(e);
                continue;
            }

            for (
                const e
                of n.addedNodes
            ) {
                O(e);
            }
        }

        q();
    }).observe(
        document.documentElement,
        {
            childList: true,
            subtree: true,
            characterData: true
        }
    );

    n.ownId = b();

    setInterval(
        () => V("interval"),
        1000
    );

    V("startup");
})();