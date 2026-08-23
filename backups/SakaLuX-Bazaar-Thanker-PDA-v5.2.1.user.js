// ==UserScript==
// @name         SakaLuX Bazaar Thanker - PDA
// @namespace    sakalux.bazaar.thanker
// @version      5.2.1
// @description  Optimized Bazaar Thanker with custom/auto Bazaar name, buyer grouping, details, copy, big buyer detection, statistics and history management.
// @author SakaLuX
// @match        https://www.torn.com/page.php?sid=events*
// @match        https://www.torn.com/messages.php*
// @grant        none
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.user.js
// @updateURL https://update.greasyfork.org/scripts/592388/SakaLuX%20Bazaar%20Thanker%20-%20PDA.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /* =========================================================
       STORAGE
       ========================================================= */

    const STORAGE_KEY =
        'sakalux_bazaar_thanker_v5';

    const PROCESSED_KEY =
        'sakalux_bazaar_processed_events_v2';

    const HISTORY_KEY =
        'sakalux_bazaar_thanks_history_v2';

    const PENDING_SUBJECT_KEY =
        'sakalux_pending_bazaar_subject';

    const PENDING_HTML_KEY =
        'sakalux_pending_bazaar_html';

    const PENDING_PLAIN_KEY =
        'sakalux_pending_bazaar_plain';

    const PENDING_XID_KEY =
        'sakalux_pending_bazaar_xid';


    /* =========================================================
       DEFAULTS
       ========================================================= */

    const DEFAULTS = {

        sellerId:
            '2380374',

        bazaarUrl:
            'https://www.torn.com/bazaar.php?userID=2380374',

        /*
         * Leave empty for automatic detection.
         */
        bazaarName:
            '',

        priceListUrl:
            'https://weav3r.dev/pricelist/2380374',

        subject:
            'Thank you for shopping at my bazaar!',

        greeting:
            'Hello {name}!',

        /*
         * IMPORTANT:
         * Do NOT put "Thanks for shopping at..."
         * here anymore.
         */
        message:
            'Thanks for shopping at',

        priceListText:
            'Link to my price list here! New trader wanting to get a good start in the community!',

        priceListLabel:
            'Price List!',

        afterPriceList:
            'Hope to see you again soon.',

        favoriteText:
            'A favorite would be greatly appreciated :)',

        footer:
            'I also rent out 1,000 happiness mansions at $75k for 7 days. If interested, please shoot me a message. Thank You!!',

        cooldownHours:
            4,

        bigBuyerItems:
            10,

        bigBuyerSpent:
            1000000
    };


    /* =========================================================
       SETTINGS
       ========================================================= */

    function loadSettings() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || '{}'
                );

            return Object.assign(
                {},
                DEFAULTS,
                saved
            );

        } catch (e) {

            return Object.assign(
                {},
                DEFAULTS
            );
        }
    }


    function saveSettings(settings) {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(settings)
        );
    }


    /* =========================================================
       GENERIC STORAGE
       ========================================================= */

    function readStorage(key) {

        try {

            return JSON.parse(
                localStorage.getItem(
                    key
                ) || '{}'
            );

        } catch (e) {

            return {};
        }
    }


    function writeStorage(key, data) {

        localStorage.setItem(
            key,
            JSON.stringify(data)
        );
    }


    /* =========================================================
       PROCESSED EVENTS
       ========================================================= */

    function getProcessedEvents() {

        return readStorage(
            PROCESSED_KEY
        );
    }


    function hasProcessedEvent(
        eventKey
    ) {

        return Boolean(
            getProcessedEvents()[eventKey]
        );
    }


    function markEventsProcessed(
        eventKeys
    ) {

        if (
            !Array.isArray(eventKeys) ||
            !eventKeys.length
        ) {
            return;
        }

        const events =
            getProcessedEvents();

        const now =
            Date.now();

        eventKeys.forEach(
            key => {
                events[key] = now;
            }
        );

        cleanupProcessedEvents(
            events
        );

        writeStorage(
            PROCESSED_KEY,
            events
        );
    }


    function cleanupProcessedEvents(
        events
    ) {

        const maxAge =
            30 *
            24 *
            60 *
            60 *
            1000;

        const now =
            Date.now();

        Object.keys(events)
            .forEach(key => {

                if (
                    now -
                    Number(events[key]) >
                    maxAge
                ) {

                    delete events[key];
                }
            });
    }


    /* =========================================================
       THANK HISTORY
       ========================================================= */

    function getHistory() {

        return readStorage(
            HISTORY_KEY
        );
    }


    function saveHistory(history) {

        writeStorage(
            HISTORY_KEY,
            history
        );
    }


    function getLastThanked(xid) {

        const history =
            getHistory();

        return Number(
            history[xid] || 0
        );
    }


    function canThank(xid) {

        const settings =
            loadSettings();

        const last =
            getLastThanked(xid);

        if (!last) {
            return true;
        }

        const cooldown =
            Number(
                settings.cooldownHours || 0
            ) *
            60 *
            60 *
            1000;

        if (
            cooldown <= 0
        ) {
            return true;
        }

        return (
            Date.now() - last >= cooldown
        );
    }


    function markThanked(xid) {

        const history =
            getHistory();

        history[xid] =
            Date.now();

        cleanupHistory(
            history
        );

        saveHistory(
            history
        );
    }


    function cleanupHistory(history) {

        const maxAge =
            90 *
            24 *
            60 *
            60 *
            1000;

        const now =
            Date.now();

        Object.keys(history)
            .forEach(xid => {

                if (
                    now -
                    Number(history[xid]) >
                    maxAge
                ) {

                    delete history[xid];
                }
            });
    }


    function resetHistory() {

        localStorage.removeItem(
            HISTORY_KEY
        );

        localStorage.removeItem(
            PROCESSED_KEY
        );
    }


    /* =========================================================
       HTML HELPERS
       ========================================================= */

    function escapeHtml(value) {

        return String(
            value == null
                ? ''
                : value
        )
            .replace(
                /&/g,
                '&amp;'
            )
            .replace(
                /</g,
                '&lt;'
            )
            .replace(
                />/g,
                '&gt;'
            )
            .replace(
                /"/g,
                '&quot;'
            )
            .replace(
                /'/g,
                '&#039;'
            );
    }


    function makeLink(
        url,
        text
    ) {

        return (
            '<a href="' +
            escapeHtml(url) +
            '" target="_blank">' +
            escapeHtml(text) +
            '</a>'
        );
    }


    function formatMoney(amount) {

        return Number(
            amount || 0
        ).toLocaleString();
    }


    function formatDate(timestamp) {

        if (!timestamp) {
            return 'Never';
        }

        return new Date(
            timestamp
        ).toLocaleString();
    }


    /* =========================================================
       BAZAAR NAME DETECTION
       ========================================================= */

    let detectedBazaarName =
        '';


    function cleanBazaarName(
        name
    ) {

        if (!name) {
            return '';
        }

        let value =
            String(name)
                .replace(
                    /\s+/g,
                    ' '
                )
                .trim();

        value =
            value.replace(
                /^your\s+bazaar$/i,
                ''
            );

        value =
            value.replace(
                /^view\s+profile$/i,
                ''
            );

        value =
            value.replace(
                /^bazaar$/i,
                ''
            );

        value =
            value.replace(
                /^your$/i,
                ''
            );

        return value.trim();
    }


    function getManualBazaarName() {

        const settings =
            loadSettings();

        return cleanBazaarName(
            settings.bazaarName
        );
    }


    function detectBazaarNameFromDocument() {

        const candidates = [];


        if (document.title) {

            candidates.push(
                document.title
            );
        }


        const selectors = [
            'h1',
            '.profile-name',
            '.title',
            '.bazaar-name',
            '[class*="bazaar"] h1',
            '[class*="bazaar"] .title',
            '[class*="bazaar"]'
        ];


        selectors.forEach(
            selector => {

                document
                    .querySelectorAll(
                        selector
                    )
                    .forEach(el => {

                        const text =
                            el.textContent
                                .replace(
                                    /\s+/g,
                                    ' '
                                )
                                .trim();

                        if (
                            text &&
                            text.length < 150
                        ) {

                            candidates.push(
                                text
                            );
                        }
                    });
            }
        );


        const sellerId =
            loadSettings()
                .sellerId;


        document
            .querySelectorAll(
                'a[href*="XID="]'
            )
            .forEach(link => {

                const href =
                    link.href || '';

                if (
                    href.includes(
                        'XID=' +
                        sellerId
                    )
                ) {

                    const text =
                        link.textContent
                            .replace(
                                /\s+/g,
                                ' '
                            )
                            .trim();

                    if (text) {
                        candidates.push(
                            text
                        );
                    }
                }
            });


        const blacklist = [
            'your',
            'your bazaar',
            'view profile',
            'bazaar',
            'events',
            'torn',
            'home'
        ];


        for (
            const candidate
            of candidates
        ) {

            let value =
                cleanBazaarName(
                    candidate
                );

            if (!value) {
                continue;
            }

            const lower =
                value.toLowerCase();

            if (
                blacklist.includes(
                    lower
                )
            ) {
                continue;
            }

            if (
                value.length > 80
            ) {
                continue;
            }

            return value;
        }


        return '';
    }


    async function detectBazaarName() {

        const manual =
            getManualBazaarName();

        if (manual) {

            detectedBazaarName =
                manual;

            return manual;
        }


        const current =
            detectBazaarNameFromDocument();

        if (current) {

            detectedBazaarName =
                current;

            return current;
        }


        const settings =
            loadSettings();

        try {

            const response =
                await fetch(
                    settings.bazaarUrl,
                    {
                        credentials:
                            'include'
                    }
                );

            if (
                response.ok
            ) {

                const html =
                    await response.text();

                const parser =
                    new DOMParser();

                const doc =
                    parser.parseFromString(
                        html,
                        'text/html'
                    );


                const title =
                    cleanBazaarName(
                        doc.title
                    );

                if (
                    title &&
                    !/^torn$/i.test(title)
                ) {

                    detectedBazaarName =
                        title;

                    return title;
                }


                const selectors = [
                    'h1',
                    '.profile-name',
                    '.title',
                    '.bazaar-name',
                    '[class*="bazaar"] h1',
                    '[class*="bazaar"] .title'
                ];


                for (
                    const selector
                    of selectors
                ) {

                    const elements =
                        doc.querySelectorAll(
                            selector
                        );

                    for (
                        const element
                        of elements
                    ) {

                        const value =
                            cleanBazaarName(
                                element.textContent
                            );

                        if (
                            value &&
                            value.length < 80 &&
                            !/view profile/i.test(
                                value
                            )
                        ) {

                            detectedBazaarName =
                                value;

                            return value;
                        }
                    }
                }
            }

        } catch (e) {

            console.log(
                '[SakaLuX] Bazaar name detection failed:',
                e
            );
        }


        const sellerLink =
            document.querySelector(
                'a[href*="XID=' +
                settings.sellerId +
                '"]'
            );

        if (sellerLink) {

            const name =
                cleanBazaarName(
                    sellerLink.textContent
                );

            if (name) {

                detectedBazaarName =
                    name +
                    ' Bazaar';

                return detectedBazaarName;
            }
        }


        detectedBazaarName =
            'SakaLuX Bazaar';

        return detectedBazaarName;
    }


    /* =========================================================
       EVENT HELPERS
       ========================================================= */

    function getCleanEventText(p) {

        const clone =
            p.cloneNode(true);

        clone
            .querySelectorAll(
                '.sakalux-bt-ui'
            )
            .forEach(
                el => el.remove()
            );

        return clone.textContent
            .replace(
                /\s+/g,
                ' '
            )
            .trim();
    }


    function parsePurchase(text) {

        const clean =
            text
                .replace(
                    /\s+/g,
                    ' '
                )
                .trim();

        const match =
            clean.match(
                /bought\s+([\d,]+)\s+x\s+(.+?)\s+from your bazaar\s+for\s+\$([\d,]+)/i
            );

        if (!match) {
            return null;
        }

        return {

            qty:
                Number(
                    match[1]
                        .replace(
                            /,/g,
                            ''
                        )
                ),

            item:
                match[2].trim(),

            price:
                Number(
                    match[3]
                        .replace(
                            /,/g,
                            ''
                        )
                )
        };
    }


    function getBuyerFromEvent(p) {

        const link =
            p.querySelector(
                'a[href*="XID="]'
            );

        if (!link) {
            return null;
        }

        const match =
            link.href.match(
                /XID=(\d+)/
            );

        if (!match) {
            return null;
        }

        return {

            id:
                match[1],

            name:
                link.textContent.trim(),

            link
        };
    }


    function getEventKey(
        p,
        buyer
    ) {

        return (
            buyer.id +
            '|' +
            getCleanEventText(p)
        );
    }


    function getBazaarParagraphs() {

        return [
            ...document.querySelectorAll(
                'p'
            )
        ].filter(
            p =>
                !p.closest(
                    '.sakalux-bt-ui'
                ) &&
                p.textContent
                    .toLowerCase()
                    .includes(
                        'from your bazaar'
                    )
        );
    }


    /* =========================================================
       BUYER GROUPING
       ========================================================= */

    function getBuyerGroups() {

        const groups =
            new Map();

        getBazaarParagraphs()
            .forEach(p => {

                const buyer =
                    getBuyerFromEvent(
                        p
                    );

                if (!buyer) {
                    return;
                }

                const purchase =
                    parsePurchase(
                        getCleanEventText(
                            p
                        )
                    );

                if (!purchase) {
                    return;
                }

                const eventKey =
                    getEventKey(
                        p,
                        buyer
                    );


                if (
                    !groups.has(
                        buyer.id
                    )
                ) {

                    groups.set(
                        buyer.id,
                        {
                            id:
                                buyer.id,

                            name:
                                buyer.name,

                            paragraphs:
                                [],

                            events:
                                [],

                            purchases:
                                {},

                            totalItems:
                                0,

                            totalSpent:
                                0
                        }
                    );
                }


                const group =
                    groups.get(
                        buyer.id
                    );

                group.paragraphs.push(
                    p
                );

                group.events.push({

                    paragraph:
                        p,

                    eventKey,

                    purchase
                });


                const item =
                    purchase.item;


                if (
                    !group.purchases[
                        item
                    ]
                ) {

                    group.purchases[
                        item
                    ] = {

                        qty:
                            0,

                        spent:
                            0
                    };
                }


                group.purchases[
                    item
                ].qty +=
                    purchase.qty;


                group.purchases[
                    item
                ].spent +=
                    purchase.price;


                group.totalItems +=
                    purchase.qty;


                group.totalSpent +=
                    purchase.price;
            });


        return groups;
    }


    /* =========================================================
       BIG BUYER
       ========================================================= */

    function isBigBuyer(
        group
    ) {

        const settings =
            loadSettings();

        return (

            group.totalItems >=
                Number(
                    settings.bigBuyerItems ||
                    0
                )

            ||

            group.totalSpent >=
                Number(
                    settings.bigBuyerSpent ||
                    0
                )
        );
    }


    /* =========================================================
       BUYER SUMMARY
       ========================================================= */

    function buildBuyerSummary(
        group
    ) {

        let text =
            `${group.name} [XID: ${group.id}]\n\n`;

        text +=
            `Purchases: ${group.events.length}\n`;

        text +=
            `Total items: ${group.totalItems}\n`;

        text +=
            `Total spent: $${formatMoney(group.totalSpent)}\n\n`;

        text +=
            `Items:\n`;


        Object.keys(
            group.purchases
        )
            .forEach(item => {

                const p =
                    group.purchases[
                        item
                    ];

                text +=
                    `• ${item} — ${p.qty} x $${formatMoney(p.spent)}\n`;
            });


        return text;
    }


    /* =========================================================
       COPY
       ========================================================= */

    async function copyText(
        text
    ) {

        try {

            await navigator.clipboard.writeText(
                text
            );

            return true;

        } catch (e) {

            try {

                const textarea =
                    document.createElement(
                        'textarea'
                    );

                textarea.value =
                    text;

                textarea.style.position =
                    'fixed';

                textarea.style.opacity =
                    '0';

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    'copy'
                );

                textarea.remove();

                return true;

            } catch (err) {

                return false;
            }
        }
    }


    /* =========================================================
       DETAILS MODAL
       ========================================================= */

    function showDetails(
        group
    ) {

        const old =
            document.getElementById(
                'sakalux-bt-details'
            );

        if (old) {
            old.remove();
        }


        const modal =
            document.createElement(
                'div'
            );

        modal.id =
            'sakalux-bt-details';

        modal.style.cssText = `
            position:fixed;
            z-index:1000000;
            inset:0;
            background:rgba(0,0,0,.72);
            display:flex;
            align-items:center;
            justify-content:center;
            padding:15px;
            box-sizing:border-box;
            font-family:Arial,sans-serif;
        `;


        const box =
            document.createElement(
                'div'
            );

        box.style.cssText = `
            width:94vw;
            max-width:560px;
            max-height:85vh;
            overflow:auto;
            background:#181818;
            color:#fff;
            border:1px solid #666;
            border-radius:14px;
            padding:18px;
            box-sizing:border-box;
            box-shadow:0 15px 50px rgba(0,0,0,.8);
        `;


        let itemsHtml =
            '';


        Object.keys(
            group.purchases
        )
            .forEach(item => {

                const p =
                    group.purchases[
                        item
                    ];

                itemsHtml += `
                    <div style="
                        padding:9px 0;
                        border-bottom:1px solid #333;
                    ">
                        <b>${escapeHtml(item)}</b><br>
                        Quantity: ${p.qty}<br>
                        Spent: $${formatMoney(p.spent)}
                    </div>
                `;
            });


        box.innerHTML = `

            <div style="
                font-size:20px;
                font-weight:bold;
                margin-bottom:12px;
            ">
                👤 ${escapeHtml(group.name)}
            </div>

            <div style="
                color:#aaa;
                margin-bottom:15px;
            ">
                XID: ${group.id}
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
                margin-bottom:15px;
            ">

                <div style="
                    background:#252525;
                    padding:10px;
                    border-radius:8px;
                    text-align:center;
                ">
                    <b>${group.events.length}</b><br>
                    <small>Purchases</small>
                </div>

                <div style="
                    background:#252525;
                    padding:10px;
                    border-radius:8px;
                    text-align:center;
                ">
                    <b>${group.totalItems}</b><br>
                    <small>Items</small>
                </div>

                <div style="
                    background:#252525;
                    padding:10px;
                    border-radius:8px;
                    text-align:center;
                ">
                    <b>$${formatMoney(group.totalSpent)}</b><br>
                    <small>Total</small>
                </div>

            </div>


            ${
                isBigBuyer(group)
                    ? `
                <div style="
                    padding:9px;
                    margin-bottom:12px;
                    border-radius:7px;
                    background:#5b4717;
                    border:1px solid #9b7b25;
                ">
                    ⭐ BIG BUYER
                </div>
                `
                    : ''
            }


            <div style="
                font-size:16px;
                font-weight:bold;
                margin-bottom:5px;
            ">
                Purchases
            </div>


            ${itemsHtml}


            <div style="
                display:flex;
                gap:8px;
                margin-top:15px;
            ">

                <button
                    id="sbtDetailsCopy"
                    style="${buttonStyle('#2878ff')}"
                >
                    📋 COPY
                </button>

                <button
                    id="sbtDetailsClose"
                    style="${buttonStyle('#555')}"
                >
                    CLOSE
                </button>

            </div>
        `;


        modal.appendChild(
            box
        );

        document.body.appendChild(
            modal
        );


        document.getElementById(
            'sbtDetailsClose'
        ).onclick =
            () => modal.remove();


        document.getElementById(
            'sbtDetailsCopy'
        ).onclick =
            async () => {

                const ok =
                    await copyText(
                        buildBuyerSummary(
                            group
                        )
                    );

                const btn =
                    document.getElementById(
                        'sbtDetailsCopy'
                    );

                btn.textContent =
                    ok
                        ? '✓ COPIED'
                        : 'COPY FAILED';


                setTimeout(
                    () => {

                        if (btn) {

                            btn.textContent =
                                '📋 COPY';
                        }

                    },
                    1500
                );
            };


        modal.addEventListener(
            'click',
            e => {

                if (
                    e.target ===
                    modal
                ) {

                    modal.remove();
                }
            }
        );
    }


    /* =========================================================
       MESSAGE
       ========================================================= */

    async function buildMessage(
        group
    ) {

        const settings =
            loadSettings();


        const bazaarName =
            await detectBazaarName();


        const greeting =
            settings.greeting.replace(
                /\{name\}/g,
                escapeHtml(
                    group.name
                )
            );


        const bazaarLink =
            makeLink(
                settings.bazaarUrl,
                bazaarName
            );


        const priceListLink =
            makeLink(
                settings.priceListUrl,
                settings.priceListLabel
            );


        const sellerLink =
            makeLink(
                'https://www.torn.com/profiles.php?XID=' +
                encodeURIComponent(
                    settings.sellerId
                ),
                'SakaLuX'
            );


        let purchaseLines =
            '';


        Object.keys(
            group.purchases
        )
            .forEach(item => {

                const p =
                    group.purchases[
                        item
                    ];

                purchaseLines +=
                    '• ' +
                    escapeHtml(
                        item
                    ) +
                    ' (' +
                    p.qty +
                    ' x $' +
                    formatMoney(
                        p.spent
                    ) +
                    ')<br>';
            });


        let mainMessage =
            String(
                settings.message || ''
            ).trim();


        mainMessage =
            mainMessage
                .replace(
                    /Thanks\s+for\s+shopping\s+at\s*$/i,
                    'Thanks for shopping at'
                )
                .replace(
                    /Thanks\s+for\s+shopping\s+at\s+my\s+bazaar\s*!?/gi,
                    'Thanks for shopping at'
                )
                .replace(
                    /Thanks\s+for\s+shopping\s+at\s+SakaLuX\s+Bazaar\s*!?/gi,
                    'Thanks for shopping at'
                )
                .trim();


        if (
            !mainMessage ||
            /^thanks\s+for\s+shopping\s+at\s*$/i.test(
                mainMessage
            ) === false
        ) {

            if (
                /^thanks\s+for\s+shopping\s+at/i.test(
                    mainMessage
                )
            ) {

                mainMessage =
                    'Thanks for shopping at';
            }
        }


        const thanksLine =
            mainMessage +
            ' ' +
            bazaarLink +
            '!';


        const html = `
            ${greeting}<br><br>

            ${thanksLine}<br><br>

            ${escapeHtml(
                settings.priceListText
            )}
            ${priceListLink}<br><br>

            ${escapeHtml(
                settings.afterPriceList
            )}<br><br>

            You purchased:<br><br>

            ${purchaseLines}

            <br>

            Total items:
            ${group.totalItems}<br>

            Total spent:
            $${formatMoney(
                group.totalSpent
            )}<br><br>

            ${escapeHtml(
                settings.favoriteText
            )}
            ${sellerLink}<br><br>

            ${escapeHtml(
                settings.footer
            )}
        `;


        return {

            html,

            plain:
                stripHtml(
                    html
                )
        };
    }


    function stripHtml(
        html
    ) {

        const temp =
            document.createElement(
                'div'
            );

        temp.innerHTML =
            html;

        return temp.innerText;
    }


    async function storePending(
        group
    ) {

        const settings =
            loadSettings();

        const message =
            await buildMessage(
                group
            );


        localStorage.setItem(
            PENDING_SUBJECT_KEY,
            settings.subject
        );


        localStorage.setItem(
            PENDING_HTML_KEY,
            message.html
        );


        localStorage.setItem(
            PENDING_PLAIN_KEY,
            message.plain
        );


        localStorage.setItem(
            PENDING_XID_KEY,
            group.id
        );
    }


    /* =========================================================
       OPEN MESSAGE
       ========================================================= */

    function openMessage(
        xid
    ) {

        window.location.href =
            'https://www.torn.com/messages.php#/p=compose&XID=' +
            encodeURIComponent(
                xid
            );
    }


    /* =========================================================
       BUYER UI
       ========================================================= */

    function removeBuyerUI(
        xid
    ) {

        document
            .querySelectorAll(
                '.sakalux-bt-ui[data-buyer-id="' +
                CSS.escape(xid) +
                '"]'
            )
            .forEach(
                el => el.remove()
            );
    }


    function createBuyerUI(
        group
    ) {

        if (
            !group ||
            !group.paragraphs.length
        ) {
            return;
        }


        if (
            document.querySelector(
                '.sakalux-bt-ui[data-buyer-id="' +
                CSS.escape(group.id) +
                '"]'
            )
        ) {
            return;
        }


        const firstParagraph =
            group.paragraphs[0];


        const eventKeys =
            group.events.map(
                e =>
                    e.eventKey
            );


        const alreadyProcessed =
            eventKeys.some(
                hasProcessedEvent
            );


        const allowed =
            canThank(
                group.id
            );


        const wrapper =
            document.createElement(
                'span'
            );


        wrapper.className =
            'sakalux-bt-ui';


        wrapper.dataset.buyerId =
            group.id;


        wrapper.style.cssText = `
            display:inline-flex;
            flex-direction:column;
            align-items:flex-start;
            gap:4px;
            margin-left:8px;
            vertical-align:middle;
            font-family:Arial,sans-serif;
        `;


        const topRow =
            document.createElement(
                'span'
            );


        topRow.style.cssText = `
            display:inline-flex;
            align-items:center;
            gap:5px;
        `;


        const thankButton =
            document.createElement(
                'button'
            );


        thankButton.className =
            'sakalux-thanks-button';


        const count =
            group.events.length;


        const countText =
            `${count} purchase${
                count !== 1
                    ? 's'
                    : ''
            }`;


        if (
            !allowed ||
            alreadyProcessed
        ) {

            thankButton.textContent =
                '✓ THANKED';


            thankButton.disabled =
                true;


            thankButton.style.cssText = `
                padding:5px 9px;
                border-radius:6px;
                border:1px solid #397b4b;
                background:#246b35;
                color:#fff;
                font-weight:bold;
                font-size:12px;
                opacity:.85;
                white-space:nowrap;
            `;

        } else {

            thankButton.textContent =
                `💬 THANKS (${count})`;


            thankButton.style.cssText = `
                padding:5px 9px;
                border-radius:6px;
                border:1px solid #777;
                background:#292929;
                color:#fff;
                font-weight:bold;
                font-size:12px;
                cursor:pointer;
                white-space:nowrap;
            `;


            thankButton.onclick =
                async function (
                    event
                ) {

                    event.preventDefault();
                    event.stopPropagation();


                    if (
                        thankButton.disabled
                    ) {
                        return;
                    }


                    thankButton.disabled =
                        true;


                    try {

                        await storePending(
                            group
                        );

                    } catch (e) {

                        console.error(
                            '[SakaLuX] Message generation failed:',
                            e
                        );

                        thankButton.disabled =
                            false;

                        return;
                    }


                    markEventsProcessed(
                        eventKeys
                    );


                    markThanked(
                        group.id
                    );


                    thankButton.textContent =
                        '✓ THANKED';


                    thankButton.style.background =
                        '#246b35';


                    thankButton.style.borderColor =
                        '#397b4b';


                    thankButton.style.cursor =
                        'default';


                    document
                        .querySelectorAll(
                            '.sakalux-bt-ui[data-buyer-id="' +
                            CSS.escape(
                                group.id
                            ) +
                            '"]'
                        )
                        .forEach(
                            el => {

                                if (
                                    el !==
                                    wrapper
                                ) {

                                    el.remove();
                                }
                            }
                        );


                    setTimeout(
                        () => {

                            openMessage(
                                group.id
                            );

                        },
                        50
                    );
                };
        }


        const detailsButton =
            document.createElement(
                'button'
            );


        detailsButton.textContent =
            'DETAILS';


        detailsButton.className =
            'sakalux-bt-details-button';


        detailsButton.style.cssText = `
            padding:5px 8px;
            border-radius:6px;
            border:1px solid #555;
            background:#202020;
            color:#ddd;
            font-weight:bold;
            font-size:11px;
            cursor:pointer;
            white-space:nowrap;
        `;


        detailsButton.onclick =
            function (
                event
            ) {

                event.preventDefault();
                event.stopPropagation();

                showDetails(
                    group
                );
            };


        const copyButton =
            document.createElement(
                'button'
            );


        copyButton.textContent =
            '📋';


        copyButton.title =
            'Copy buyer summary';


        copyButton.style.cssText = `
            padding:5px 7px;
            border-radius:6px;
            border:1px solid #555;
            background:#202020;
            color:#ddd;
            font-size:12px;
            cursor:pointer;
        `;


        copyButton.onclick =
            async function (
                event
            ) {

                event.preventDefault();
                event.stopPropagation();


                const ok =
                    await copyText(
                        buildBuyerSummary(
                            group
                        )
                    );


                copyButton.textContent =
                    ok
                        ? '✓'
                        : '✕';


                setTimeout(
                    () => {

                        if (
                            copyButton
                        ) {

                            copyButton.textContent =
                                '📋';
                        }

                    },
                    1200
                );
            };


        const info =
            document.createElement(
                'span'
            );


        info.className =
            'sakalux-bt-info';


        info.style.cssText = `
            display:block;
            color:#aaa;
            font-size:11px;
            white-space:nowrap;
            padding-left:2px;
        `;


        info.textContent =
            `${countText} • ${
                group.totalItems
            } item${
                group.totalItems !== 1
                    ? 's'
                    : ''
            } • $${formatMoney(
                group.totalSpent
            )}`;


        if (
            isBigBuyer(group)
        ) {

            info.style.color =
                '#e5c55b';


            info.textContent =
                '⭐ ' +
                info.textContent;
        }


        topRow.appendChild(
            thankButton
        );

        topRow.appendChild(
            detailsButton
        );

        topRow.appendChild(
            copyButton
        );


        wrapper.appendChild(
            topRow
        );

        wrapper.appendChild(
            info
        );


        firstParagraph.appendChild(
            wrapper
        );
    }


    /* =========================================================
       PROCESS BUYERS
       ========================================================= */

    function processBuyerGroups() {

        if (
            !location.href.includes(
                'sid=events'
            )
        ) {
            return;
        }


        const groups =
            getBuyerGroups();


        document
            .querySelectorAll(
                '.sakalux-bt-ui[data-buyer-id]'
            )
            .forEach(
                ui => {

                    const xid =
                        ui.dataset.buyerId;

                    if (
                        !groups.has(xid)
                    ) {

                        ui.remove();
                    }
                }
            );


        groups.forEach(
            group => {

                createBuyerUI(
                    group
                );
            }
        );
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    function getStatistics() {

        const groups =
            getBuyerGroups();


        let buyers =
            0;

        let purchases =
            0;

        let items =
            0;

        let spent =
            0;


        groups.forEach(
            group => {

                buyers++;

                purchases +=
                    group.events.length;

                items +=
                    group.totalItems;

                spent +=
                    group.totalSpent;
            }
        );


        return {

            buyers,

            purchases,

            items,

            spent
        };
    }


    /* =========================================================
       SETTINGS PANEL
       ========================================================= */

    function createSettings() {

        if (
            document.getElementById(
                'sakalux-bt-settings'
            )
        ) {
            return;
        }


        const settings =
            loadSettings();


        const panel =
            document.createElement(
                'div'
            );


        panel.id =
            'sakalux-bt-settings';


        panel.style.cssText = `
            position:fixed;
            z-index:999999;
            top:60px;
            left:50%;
            transform:translateX(-50%);
            width:94vw;
            max-width:620px;
            max-height:85vh;
            overflow:auto;
            background:#181818;
            color:#fff;
            border:1px solid #666;
            border-radius:14px;
            padding:16px;
            box-sizing:border-box;
            display:none;
            box-shadow:0 10px 40px rgba(0,0,0,.8);
            font-family:Arial,sans-serif;
        `;


        panel.innerHTML = `

            <div style="
                font-size:21px;
                font-weight:bold;
                margin-bottom:6px;
            ">
                ⚙️ SakaLuX Bazaar Thanker
            </div>

            <div style="
                font-size:12px;
                color:#888;
                margin-bottom:15px;
            ">
                Version 5.2.0
            </div>


            <div id="sbtStats"
                style="
                    background:#222;
                    border:1px solid #333;
                    border-radius:9px;
                    padding:12px;
                    margin-bottom:15px;
                ">
            </div>


            <label>Your Torn ID</label>

            <input
                id="sbtSellerId"
                value="${escapeHtml(
                    settings.sellerId
                )}"
                style="${inputStyle()}"
            >


            <label>Bazaar URL</label>

            <input
                id="sbtBazaarUrl"
                value="${escapeHtml(
                    settings.bazaarUrl
                )}"
                style="${inputStyle()}"
            >


            <label>
                Bazaar Name
                <span style="
                    color:#777;
                    font-size:11px;
                ">
                    (leave empty for automatic detection)
                </span>
            </label>

            <input
                id="sbtBazaarName"
                value="${escapeHtml(
                    settings.bazaarName
                )}"
                placeholder="Example: SakaLuX Bazaar"
                style="${inputStyle()}"
            >

            <div style="
                color:#888;
                font-size:11px;
                margin-top:-8px;
                margin-bottom:14px;
            ">
                This name becomes the clickable Bazaar link
                in the THANK YOU message.
            </div>


            <label>Price List URL</label>

            <input
                id="sbtPriceListUrl"
                value="${escapeHtml(
                    settings.priceListUrl
                )}"
                style="${inputStyle()}"
            >


            <label>Subject</label>

            <input
                id="sbtSubject"
                value="${escapeHtml(
                    settings.subject
                )}"
                style="${inputStyle()}"
            >


            <label>Greeting</label>

            <textarea
                id="sbtGreeting"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.greeting
            )}</textarea>


            <label>Main message prefix</label>

            <textarea
                id="sbtMessage"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.message
            )}</textarea>

            <div style="
                color:#888;
                font-size:11px;
                margin-top:-8px;
                margin-bottom:14px;
            ">
                Normally leave this as:
                "Thanks for shopping at"
            </div>


            <label>Price List sentence</label>

            <textarea
                id="sbtPriceText"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.priceListText
            )}</textarea>


            <label>Price List clickable text</label>

            <input
                id="sbtPriceLabel"
                value="${escapeHtml(
                    settings.priceListLabel
                )}"
                style="${inputStyle()}"
            >


            <label>Text after Price List</label>

            <textarea
                id="sbtAfterPrice"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.afterPriceList
            )}</textarea>


            <label>Favorite sentence</label>

            <textarea
                id="sbtFavorite"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.favoriteText
            )}</textarea>


            <label>Footer</label>

            <textarea
                id="sbtFooter"
                style="${textareaStyle()}"
            >${escapeHtml(
                settings.footer
            )}</textarea>


            <label>Cooldown (hours)</label>

            <input
                id="sbtCooldown"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value="${Number(
                    settings.cooldownHours
                )}"
                style="${inputStyle()}"
            >


            <div style="
                font-size:16px;
                font-weight:bold;
                margin:8px 0 4px;
            ">
                ⭐ Big Buyer
            </div>


            <div style="
                color:#888;
                font-size:12px;
                margin-bottom:8px;
            ">
                A buyer becomes BIG when either threshold is reached.
            </div>


            <label>Minimum items</label>

            <input
                id="sbtBigItems"
                type="number"
                min="0"
                value="${Number(
                    settings.bigBuyerItems
                )}"
                style="${inputStyle()}"
            >


            <label>Minimum spent</label>

            <input
                id="sbtBigSpent"
                type="number"
                min="0"
                value="${Number(
                    settings.bigBuyerSpent
                )}"
                style="${inputStyle()}"
            >


            <div style="
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:8px;
                margin-top:5px;
            ">

                <button
                    id="sbtSave"
                    style="${buttonStyle('#2878ff')}"
                >
                    SAVE
                </button>

                <button
                    id="sbtReset"
                    style="${buttonStyle('#555')}"
                >
                    RESET SETTINGS
                </button>

                <button
                    id="sbtResetHistory"
                    style="${buttonStyle('#8b3030')}"
                >
                    🧹 RESET HISTORY
                </button>

                <button
                    id="sbtClose"
                    style="${buttonStyle('#444')}"
                >
                    CLOSE
                </button>

            </div>
        `;


        document.body.appendChild(
            panel
        );


        const settingsButton =
            document.createElement(
                'button'
            );


        settingsButton.id =
            'sakalux-bt-settings-button';


        settingsButton.textContent =
            '⚙️';


        settingsButton.style.cssText = `
            position:fixed;
            z-index:999998;
            right:18px;
            bottom:90px;
            width:58px;
            height:58px;
            border-radius:50%;
            border:2px solid #666;
            background:#292929;
            color:#fff;
            font-size:25px;
            box-shadow:0 4px 15px rgba(0,0,0,.5);
            cursor:pointer;
        `;


        settingsButton.onclick =
            function () {

                const open =
                    panel.style.display ===
                    'none';


                panel.style.display =
                    open
                        ? 'block'
                        : 'none';


                if (open) {

                    updateStats();
                }
            };


        document.body.appendChild(
            settingsButton
        );


        document.getElementById(
            'sbtClose'
        ).onclick =
            () => {

                panel.style.display =
                    'none';
            };


        document.getElementById(
            'sbtSave'
        ).onclick =
            function () {

                const newSettings = {

                    sellerId:
                        document.getElementById(
                            'sbtSellerId'
                        ).value.trim(),

                    bazaarUrl:
                        document.getElementById(
                            'sbtBazaarUrl'
                        ).value.trim(),

                    bazaarName:
                        document.getElementById(
                            'sbtBazaarName'
                        ).value.trim(),

                    priceListUrl:
                        document.getElementById(
                            'sbtPriceListUrl'
                        ).value.trim(),

                    subject:
                        document.getElementById(
                            'sbtSubject'
                        ).value,

                    greeting:
                        document.getElementById(
                            'sbtGreeting'
                        ).value,

                    message:
                        document.getElementById(
                            'sbtMessage'
                        ).value,

                    priceListText:
                        document.getElementById(
                            'sbtPriceText'
                        ).value,

                    priceListLabel:
                        document.getElementById(
                            'sbtPriceLabel'
                        ).value,

                    afterPriceList:
                        document.getElementById(
                            'sbtAfterPrice'
                        ).value,

                    favoriteText:
                        document.getElementById(
                            'sbtFavorite'
                        ).value,

                    footer:
                        document.getElementById(
                            'sbtFooter'
                        ).value,

                    cooldownHours:
                        Number(
                            document.getElementById(
                                'sbtCooldown'
                            ).value
                        ),

                    bigBuyerItems:
                        Number(
                            document.getElementById(
                                'sbtBigItems'
                            ).value
                        ),

                    bigBuyerSpent:
                        Number(
                            document.getElementById(
                                'sbtBigSpent'
                            ).value
                        )
                };


                saveSettings(
                    newSettings
                );


                detectedBazaarName =
                    '';


                panel.style.display =
                    'none';


                processBuyerGroups();
            };


        document.getElementById(
            'sbtReset'
        ).onclick =
            function () {

                if (
                    !confirm(
                        'Reset all message settings?'
                    )
                ) {
                    return;
                }


                saveSettings(
                    DEFAULTS
                );


                detectedBazaarName =
                    '';


                location.reload();
            };


        document.getElementById(
            'sbtResetHistory'
        ).onclick =
            function () {

                if (
                    !confirm(
                        'Reset THANKED history and processed events?'
                    )
                ) {
                    return;
                }


                resetHistory();


                alert(
                    'THANKED history has been reset.'
                );


                processBuyerGroups();
            };
    }


    function updateStats() {

        const box =
            document.getElementById(
                'sbtStats'
            );

        if (!box) {
            return;
        }


        const stats =
            getStatistics();


        box.innerHTML = `

            <div style="
                font-weight:bold;
                margin-bottom:8px;
            ">
                📊 Current Event Statistics
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(2,1fr);
                gap:7px;
            ">

                <div>
                    Buyers:
                    <b>${stats.buyers}</b>
                </div>

                <div>
                    Purchases:
                    <b>${stats.purchases}</b>
                </div>

                <div>
                    Items:
                    <b>${stats.items}</b>
                </div>

                <div>
                    Value:
                    <b>$${formatMoney(
                        stats.spent
                    )}</b>
                </div>

            </div>
        `;
    }


    function inputStyle() {

        return `
            width:100%;
            height:42px;
            margin:6px 0 14px;
            padding:8px;
            box-sizing:border-box;
            background:#090909;
            color:#fff;
            border:1px solid #555;
            border-radius:6px;
            font-size:15px;
        `;
    }


    function textareaStyle() {

        return `
            width:100%;
            min-height:70px;
            margin:6px 0 14px;
            padding:8px;
            box-sizing:border-box;
            background:#090909;
            color:#fff;
            border:1px solid #555;
            border-radius:6px;
            font-size:15px;
            resize:vertical;
        `;
    }


    function buttonStyle(
        color
    ) {

        return `
            min-height:42px;
            background:${color};
            color:#fff;
            border:0;
            border-radius:7px;
            font-weight:bold;
            cursor:pointer;
        `;
    }


    /* =========================================================
       MESSAGE SUBJECT
       ========================================================= */

    function fillSubject() {

        const subject =
            localStorage.getItem(
                PENDING_SUBJECT_KEY
            );

        if (!subject) {
            return;
        }


        const input =
            document.querySelector(
                'input.subject'
            );


        if (!input) {
            return;
        }


        if (!input.value) {

            setNativeValue(
                input,
                subject
            );
        }


        localStorage.removeItem(
            PENDING_SUBJECT_KEY
        );
    }


    /* =========================================================
       MESSAGE EDITOR
       ========================================================= */

    function fillMessageEditor() {

        const html =
            localStorage.getItem(
                PENDING_HTML_KEY
            );


        if (!html) {
            return;
        }


        try {

            if (
                window.tinymce &&
                window.tinymce.activeEditor
            ) {

                window.tinymce
                    .activeEditor
                    .setContent(
                        html
                    );


                localStorage.removeItem(
                    PENDING_HTML_KEY
                );

                localStorage.removeItem(
                    PENDING_PLAIN_KEY
                );

                return;
            }

        } catch (e) {

            console.log(
                '[SakaLuX] TinyMCE error',
                e
            );
        }


        const iframe =
            document.querySelector(
                'iframe[id^="mce_"]'
            ) ||
            document.querySelector(
                '.tox-edit-area iframe'
            );


        if (iframe) {

            try {

                const doc =
                    iframe.contentDocument ||
                    iframe.contentWindow.document;


                if (
                    doc &&
                    doc.body
                ) {

                    doc.body.innerHTML =
                        html;


                    doc.body.dispatchEvent(
                        new Event(
                            'input',
                            {
                                bubbles:
                                    true
                            }
                        )
                    );


                    localStorage.removeItem(
                        PENDING_HTML_KEY
                    );

                    localStorage.removeItem(
                        PENDING_PLAIN_KEY
                    );

                    return;
                }

            } catch (e) {

                console.log(
                    '[SakaLuX] iframe editor error',
                    e
                );
            }
        }


        const editable =
            document.querySelector(
                '[contenteditable="true"]'
            );


        if (editable) {

            editable.innerHTML =
                html;


            editable.dispatchEvent(
                new InputEvent(
                    'input',
                    {
                        bubbles:
                            true,

                        inputType:
                            'insertText'
                    }
                )
            );


            localStorage.removeItem(
                PENDING_HTML_KEY
            );

            localStorage.removeItem(
                PENDING_PLAIN_KEY
            );

            return;
        }


        const textarea =
            document.querySelector(
                'textarea'
            );


        if (textarea) {

            const plain =
                localStorage.getItem(
                    PENDING_PLAIN_KEY
                ) ||
                stripHtml(
                    html
                );


            setNativeValue(
                textarea,
                plain
            );


            localStorage.removeItem(
                PENDING_HTML_KEY
            );

            localStorage.removeItem(
                PENDING_PLAIN_KEY
            );
        }
    }


    /* =========================================================
       NATIVE VALUE
       ========================================================= */

    function setNativeValue(
        element,
        value
    ) {

        const prototype =
            Object.getPrototypeOf(
                element
            );


        const descriptor =
            Object.getOwnPropertyDescriptor(
                prototype,
                'value'
            );


        if (
            descriptor &&
            descriptor.set
        ) {

            descriptor.set.call(
                element,
                value
            );

        } else {

            element.value =
                value;
        }


        element.dispatchEvent(
            new Event(
                'input',
                {
                    bubbles:
                        true
                }
            )
        );


        element.dispatchEvent(
            new Event(
                'change',
                {
                    bubbles:
                        true
                }
            )
        );
    }


    /* =========================================================
       EVENT OBSERVER
       ========================================================= */

    let eventObserver =
        null;

    let eventProcessTimer =
        null;


    function scheduleProcess() {

        if (
            eventProcessTimer
        ) {
            return;
        }


        eventProcessTimer =
            setTimeout(
                function () {

                    eventProcessTimer =
                        null;


                    processBuyerGroups();


                    updateStats();

                },
                60
            );
    }


    function startEventObserver() {

        if (
            eventObserver
        ) {
            return;
        }


        eventObserver =
            new MutationObserver(
                function () {

                    scheduleProcess();
                }
            );


        eventObserver.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );
    }


    /* =========================================================
       MESSAGE OBSERVER
       ========================================================= */

    let messageObserver =
        null;


    function startMessageObserver() {

        if (
            messageObserver
        ) {
            return;
        }


        messageObserver =
            new MutationObserver(
                function () {

                    fillSubject();

                    fillMessageEditor();
                }
            );


        messageObserver.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );


        fillSubject();

        fillMessageEditor();


        setTimeout(
            fillSubject,
            300
        );

        setTimeout(
            fillMessageEditor,
            300
        );


        setTimeout(
            fillSubject,
            1000
        );

        setTimeout(
            fillMessageEditor,
            1000
        );


        setTimeout(
            fillSubject,
            2000
        );

        setTimeout(
            fillMessageEditor,
            2000
        );
    }


/* =========================================================
   SAKALUX HUB API
   ========================================================= */

const BAZAAR_VERSION =
    '5.2.1';


function openSettingsPanel() {

    if (
        !location.href.includes(
            'sid=events'
        )
    ) {
        return false;
    }


    createSettings();


    const panel =
        document.getElementById(
            'sakalux-bt-settings'
        );


    if (!panel) {
        return false;
    }


    panel.style.display =
        'block';


    updateStats();


    return true;
}


function closeSettingsPanel() {

    const panel =
        document.getElementById(
            'sakalux-bt-settings'
        );


    if (!panel) {
        return false;
    }


    panel.style.display =
        'none';


    return true;
}


window.SakaLuXBazaarThanker = {

    id:
        'bazaar-thanker',

    name:
        'Bazaar Thanker',

    version:
        BAZAAR_VERSION,


    open() {

        return openSettingsPanel();
    },


    close() {

        return closeSettingsPanel();
    },


    refresh() {

        if (
            location.href.includes(
                'sid=events'
            )
        ) {

            processBuyerGroups();

            updateStats();
        }


        return true;
    },


    stats() {

        if (
            !location.href.includes(
                'sid=events'
            )
        ) {

            return {
                buyers: 0,
                purchases: 0,
                items: 0,
                spent: 0
            };
        }


        return getStatistics();
    },


    health() {

        const onEvents =
            location.href.includes(
                'sid=events'
            );


        const onMessages =
            location.pathname.includes(
                'messages.php'
            );


        let statistics = {
            buyers: 0,
            purchases: 0,
            items: 0,
            spent: 0
        };


        if (onEvents) {

            try {

                statistics =
                    getStatistics();

            } catch (e) {

                console.error(
                    '[SakaLuX Bazaar Thanker] Health stats error:',
                    e
                );
            }
        }


        return {

            ready:
                true,

            version:
                BAZAAR_VERSION,

            onEvents,

            onMessages,

            settingsAvailable:
                Boolean(
                    document.getElementById(
                        'sakalux-bt-settings'
                    )
                ),

            buttonAvailable:
                Boolean(
                    document.getElementById(
                        'sakalux-bt-settings-button'
                    )
                ),

            observerActive:
                Boolean(
                    eventObserver ||
                    messageObserver
                ),

            detectedBazaarName:
                detectedBazaarName ||
                '',

            buyers:
                statistics.buyers,

            purchases:
                statistics.purchases,

            items:
                statistics.items,

            spent:
                statistics.spent
        };
    },


    goToEvents() {

        location.href =
            'https://www.torn.com/page.php?sid=events';


        return true;
    }
};


window.dispatchEvent(
    new CustomEvent(
        'SakaLuX:BazaarThankerReady',
        {
            detail: {
                version:
                    BAZAAR_VERSION
            }
        }
    )
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

function init() {

    if (
        location.href.includes(
            'sid=events'
        )
    ) {

        createSettings();

        processBuyerGroups();

        startEventObserver();
    }


    if (
        location.pathname.includes(
            'messages.php'
        )
    ) {

        startMessageObserver();
    }
}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init,
        {
            once:
                true
        }
    );

} else {

    init();
}

})();