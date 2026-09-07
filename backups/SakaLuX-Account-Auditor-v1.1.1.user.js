// ==UserScript==
// @name         SakaLuX Account Auditor
// @namespace    sakalux.account.auditor
// @version      1.1.1
// @description  Private read-only Torn account snapshot collector with broad API v1/v2 coverage, corrected inventory/lists/personal-stats handling, messages/events/logs, and secure GitHub sync.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      api.torn.com
// @connect      api.github.com
// @license      MIT
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.1.1';
    const NAME = 'SakaLuX Account Auditor';
    const PDA_KEY = '###PDA-APIKEY###';

    const STORAGE = {
        apiKey: 'SakaLuX_AUDITOR_TORN_API_KEY',
        githubToken: 'SakaLuX_AUDITOR_GITHUB_TOKEN',
        settings: 'SakaLuX_AUDITOR_SETTINGS_V2',
        lastSync: 'SakaLuX_AUDITOR_LAST_SYNC_V2'
    };

    const DEFAULT_SETTINGS = {
        repo: 'SakaLuX/SakaLuX-Torn-Account-Data',
        branch: 'main',
        path: 'SakaLuX-Account-Snapshot.json',
        autoSync: false,
        autoSyncMinutes: 30,
        showButton: true,
        includePrivateData: true,
        maxPrivatePages: 20
    };

    const V1_SELECTIONS = [
        'profile','bars','cooldowns','travel','education','jobpoints','merits','refills',
        'notifications','money','stocks','properties','discord','personalstats','weaponexp',
        'workstats','skills','battlestats','networth','inventory','display','icons','criminalrecord'
    ];

    const V2_ENDPOINTS = [
        'ammo','attacks','attacksfull','bars','basic','battlestats','bounties','calendar','casino',
        'competition','cooldowns','discord','education','enlistedcars','equipment','faction','forumfeed',
        'forumfriends','forumposts','forumsubscribedthreads','forumthreads','gym','honors','icons',
        'itemmarket','itemmods','job','jobpoints','jobranks','medals','merits','missions','money',
        'networth','notifications','organizedcrime','organizedcrimes','perks','profile','properties',
        'property','races','racingrecords','refills','reports','revives','revivesFull','skills','stocks',
        'trades','travel','virus','weaponexp','workstats'
    ];

    const V2_PRIVATE_ENDPOINTS = ['messages','newmessages','events','newevents'];
    const CONTACT_LISTS = ['Friends','Enemies','Targets'];
    const INVENTORY_CATEGORIES = [
        'Collectible','Clothing','Other','Tool','Melee','Defensive','Material','Car','Primary','Secondary',
        'Book','Special','Supply Pack','Temporary','Enhancer','Artifact','Flower','Booster','Medical','Candy',
        'Jewelry','Alcohol','Plushie','Drug','Energy Drink'
    ];

    let settings = Object.assign({}, DEFAULT_SETTINGS, loadJson(STORAGE.settings, {}));
    let busy = false;
    let autoTimer = null;
    let lastStatus = '';

    function rawGet(key) {
        try {
            if (typeof GM_getValue === 'function') {
                const v = GM_getValue(key, '');
                if (typeof v === 'string' && v) return v;
            }
        } catch (_) {}
        try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
    }

    function rawSet(key, value) {
        const text = String(value ?? '');
        try { if (typeof GM_setValue === 'function') GM_setValue(key, text); } catch (_) {}
        try { localStorage.removeItem(key); } catch (_) {}
    }

    function loadJson(key, fallback) {
        try { const raw = rawGet(key); return raw ? JSON.parse(raw) : fallback; }
        catch (_) { return fallback; }
    }
    function saveJson(key, value) { try { rawSet(key, JSON.stringify(value)); } catch (_) {} }
    function getLocal(key) { return rawGet(key); }
    function setLocal(key, value) { rawSet(key, value); }
    function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    function getTornApiKey() {
        if (PDA_KEY && PDA_KEY !== '###PDA-APIKEY###') return PDA_KEY;
        return getLocal(STORAGE.apiKey);
    }

    function request(url, options={}) {
        return new Promise((resolve, reject) => {
            const method = options.method || 'GET';
            const headers = options.headers || {};
            const body = options.body;
            if (method === 'GET' && typeof window.PDA_httpGet === 'function' && url.includes('api.torn.com')) {
                window.PDA_httpGet(url, headers).then(r => {
                    try {
                        const raw = r?.responseText ?? r?.body ?? r?.data ?? r;
                        resolve({status:200, text:typeof raw === 'string' ? raw : JSON.stringify(raw)});
                    } catch (e) { reject(e); }
                }).catch(reject);
                return;
            }
            if (typeof GM_xmlhttpRequest === 'function') {
                GM_xmlhttpRequest({
                    method, url, headers, data: body, timeout: 30000,
                    onload: r => resolve({status:r.status, text:r.responseText, headers:r.responseHeaders}),
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
                return;
            }
            fetch(url,{method,headers,body}).then(async r=>resolve({status:r.status,text:await r.text()})).catch(reject);
        });
    }

    async function apiJson(url) {
        try {
            const r = await request(url);
            let data;
            try { data = JSON.parse(r.text || '{}'); }
            catch (_) { return {ok:false,error:'Invalid JSON',httpStatus:r.status}; }
            if (data?.error) return {ok:false,error:data.error.error || data.error.message || 'Torn API error',code:data.error.code ?? null,httpStatus:r.status};
            if (r.status < 200 || r.status >= 300) return {ok:false,error:'HTTP '+r.status,httpStatus:r.status,data};
            return {ok:true,data,httpStatus:r.status};
        } catch (e) { return {ok:false,error:String(e?.message || e)}; }
    }

    function withKey(url, key) {
        const sep = url.includes('?') ? '&' : '?';
        return /[?&]key=/.test(url) ? url : url + sep + 'key=' + encodeURIComponent(key);
    }

    async function tornV1(selection, key) {
        return apiJson('https://api.torn.com/user/?selections=' + encodeURIComponent(selection) + '&key=' + encodeURIComponent(key));
    }

    async function tornV2(endpoint, key, query='', absoluteUrl='') {
        let url = absoluteUrl || ('https://api.torn.com/v2/user/' + encodeURIComponent(endpoint) + (query ? (query.startsWith('?') ? query : '?' + query) : ''));
        return apiJson(withKey(url, key));
    }

    async function keyInfo(key) {
        return apiJson(withKey('https://api.torn.com/v2/key/info', key));
    }

    function sanitizeDeep(value, depth=0) {
        if (depth > 40) return '[depth-limit]';
        if (Array.isArray(value)) return value.map(v => sanitizeDeep(v, depth + 1));
        if (!value || typeof value !== 'object') return value;
        const out = {};
        for (const [k,v] of Object.entries(value)) {
            const kk = String(k).toLowerCase();
            if (['key','apikey','api_key','token','authorization','cookie','cookies','session','sessionid','password','secret'].includes(kk)) continue;
            out[k] = sanitizeDeep(v, depth + 1);
        }
        return out;
    }

    function nextLink(data) {
        const n = data?._metadata?.links?.next ?? data?.metadata?.links?.next ?? data?._metadata?.next ?? null;
        return typeof n === 'string' && n ? n : null;
    }

    async function collectPagedV2(endpoint, key, query='') {
        const pages = [];
        let url = '';
        const maxPages = Math.max(1, Math.min(100, Number(settings.maxPrivatePages) || 20));
        for (let page=0; page<maxPages; page++) {
            const result = await tornV2(endpoint, key, url ? '' : query, url);
            if (!result.ok) return {ok:false,error:result.error,code:result.code ?? null,httpStatus:result.httpStatus ?? null,pages};
            pages.push(sanitizeDeep(result.data));
            const next = nextLink(result.data);
            if (!next) break;
            url = next.startsWith('http') ? next : 'https://api.torn.com' + next;
            await sleep(300);
        }
        const last = pages[pages.length-1];
        return {ok:true,data:{pages,pageCount:pages.length,truncated:Boolean(last && nextLink(last) && pages.length >= maxPages)}};
    }

    async function collectContacts(key) {
        const out = {};
        const errors = {};
        for (const cat of CONTACT_LISTS) {
            const r = await collectPagedV2('list', key, 'cat=' + encodeURIComponent(cat) + '&limit=50');
            if (r.ok) out[cat.toLowerCase()] = r.data;
            else errors[cat] = {error:r.error,code:r.code ?? null,httpStatus:r.httpStatus ?? null};
            await sleep(250);
        }
        return {data:out,errors};
    }

    async function collectInventory(key) {
        const categories = {};
        const errors = {};
        let itemCount = 0;
        for (const cat of INVENTORY_CATEGORIES) {
            const r = await tornV2('inventory', key, 'cat=' + encodeURIComponent(cat) + '&limit=250&offset=0');
            if (r.ok) {
                const clean = sanitizeDeep(r.data);
                categories[cat] = clean;
                const items = Array.isArray(clean?.inventory) ? clean.inventory : [];
                itemCount += items.length;
            } else {
                errors[cat] = {error:r.error,code:r.code ?? null,httpStatus:r.httpStatus ?? null};
            }
            await sleep(180);
        }
        return {data:{categories,itemCount,categoryCount:Object.keys(categories).length},errors};
    }

    async function collectPersonalStatsV2(key) {
        return tornV2('personalstats', key, 'cat=all');
    }

    async function collectUserLogs(key) {
        return collectPagedV2('log', key, 'limit=100&sort=desc');
    }

    async function collectSnapshot() {
        const key = getTornApiKey();
        if (!key) throw new Error('Torn API key missing. Open AUDIT settings and add a key with the permissions you want audited, or use Torn PDA API injection.');

        const data = {keyInfo:null,v1:{},v2:{},special:{},private:{}};
        const errors = {};
        const unavailable = {};
        let requested = 0;
        let successful = 0;

        requested++;
        setStatus('Checking Torn API key capabilities…');
        const ki = await keyInfo(key);
        if (ki.ok) { data.keyInfo = sanitizeDeep(ki.data); successful++; }
        else errors['key:info'] = {error:ki.error,code:ki.code ?? null,httpStatus:ki.httpStatus ?? null};
        await sleep(200);

        for (let i=0; i<V1_SELECTIONS.length; i++) {
            const selection = V1_SELECTIONS[i];
            requested++;
            setStatus('Reading v1: ' + selection + ' (' + (i+1) + '/' + V1_SELECTIONS.length + ')');
            const result = await tornV1(selection, key);
            if (result.ok) { data.v1[selection] = sanitizeDeep(result.data); successful++; }
            else errors['v1:'+selection] = {error:result.error,code:result.code ?? null,httpStatus:result.httpStatus ?? null};
            await sleep(220);
        }

        for (let i=0; i<V2_ENDPOINTS.length; i++) {
            const endpoint = V2_ENDPOINTS[i];
            requested++;
            setStatus('Reading v2: ' + endpoint + ' (' + (i+1) + '/' + V2_ENDPOINTS.length + ')');
            const result = await tornV2(endpoint, key);
            if (result.ok) { data.v2[endpoint] = sanitizeDeep(result.data); successful++; }
            else errors['v2:'+endpoint] = {error:result.error,code:result.code ?? null,httpStatus:result.httpStatus ?? null};
            await sleep(220);
        }

        requested++;
        setStatus('Reading v2 personal stats (cat=all)…');
        const ps = await collectPersonalStatsV2(key);
        if (ps.ok) { data.special.personalstats = sanitizeDeep(ps.data); successful++; }
        else errors['v2:personalstats'] = {error:ps.error,code:ps.code ?? null,httpStatus:ps.httpStatus ?? null};
        await sleep(250);

        requested++;
        setStatus('Reading contacts lists…');
        const contacts = await collectContacts(key);
        data.special.contacts = contacts.data;
        if (Object.keys(contacts.data).length) successful++;
        if (Object.keys(contacts.errors).length) errors['v2:list'] = contacts.errors;

        requested++;
        setStatus('Reading inventory categories…');
        const inv = await collectInventory(key);
        data.special.inventory = inv.data;
        if (inv.data.categoryCount) successful++;
        if (Object.keys(inv.errors).length) errors['v2:inventory'] = inv.errors;

        if (settings.includePrivateData) {
            for (let i=0; i<V2_PRIVATE_ENDPOINTS.length; i++) {
                const endpoint = V2_PRIVATE_ENDPOINTS[i];
                requested++;
                setStatus('Reading PRIVATE v2: ' + endpoint + ' (' + (i+1) + '/' + V2_PRIVATE_ENDPOINTS.length + ')');
                const result = await collectPagedV2(endpoint, key, endpoint.includes('events') ? 'limit=100' : 'limit=100&sort=desc');
                if (result.ok) { data.private[endpoint] = result.data; successful++; }
                else {
                    if (result.pages?.length) data.private[endpoint] = {pages:result.pages,pageCount:result.pages.length,partial:true};
                    errors['private:'+endpoint] = {error:result.error,code:result.code ?? null,httpStatus:result.httpStatus ?? null};
                }
                await sleep(300);
            }

            requested++;
            setStatus('Reading PRIVATE v2: logs…');
            const logs = await collectUserLogs(key);
            if (logs.ok) { data.private.log = logs.data; successful++; }
            else {
                if (logs.code === 16) {
                    unavailable['private:log'] = {
                        reason:'Torn requires a Full access API key for user/log.',
                        code:16,
                        action:'Use a Full-access key only if you explicitly want account logs included. No bypass is attempted.'
                    };
                } else {
                    errors['private:log'] = {error:logs.error,code:logs.code ?? null,httpStatus:logs.httpStatus ?? null};
                }
            }
        }

        const profile = data.v1.profile || data.v2.profile || data.v2.basic || {};
        return {
            schema: 'sakalux-torn-account-snapshot-v2',
            generatedAt: new Date().toISOString(),
            generatedAtUnix: Date.now(),
            script: {name:NAME,version:VERSION,mode:'read-only'},
            privacy: {
                containsTornApiKey:false,
                containsGitHubToken:false,
                containsBrowserCookies:false,
                containsPassword:false,
                privateDataIncluded:Boolean(settings.includePrivateData),
                note:'Only data returned by the official Torn API is synced. No password, browser session, cookies or account-control credentials are collected.'
            },
            capabilities: {
                messageList:true,
                messageBody:false,
                messageBodyReason:'The official Torn API v2 UserMessage schema exposes id, sender, timestamp, topic, type, seen and read, but not the message body/content.',
                logsRequireFullAccess:true
            },
            account: {
                playerId: profile.player_id ?? profile.playerID ?? profile.user_id ?? profile.id ?? null,
                name: profile.name ?? null,
                level: profile.level ?? null,
                rank: profile.rank ?? null,
                status: profile.status ?? null,
                faction: profile.faction ?? null,
                job: profile.job ?? null,
                lastAction: profile.last_action ?? profile.lastAction ?? null,
                age: profile.age ?? null
            },
            coverage: {
                requested,
                successful,
                failed:Object.keys(errors).length,
                unavailable:Object.keys(unavailable).length,
                v1Selections:V1_SELECTIONS.slice(),
                v2Endpoints:V2_ENDPOINTS.slice(),
                specialEndpoints:['personalstats?cat=all','list?cat=Friends|Enemies|Targets','inventory?cat=<each official category>'],
                privateEndpoints:settings.includePrivateData ? V2_PRIVATE_ENDPOINTS.concat(['log']) : [],
                privateDataEnabled:Boolean(settings.includePrivateData)
            },
            data,
            errors,
            unavailable
        };
    }

    function parseRepo() {
        const m = String(settings.repo || '').trim().match(/^([^/\s]+)\/([^/\s]+)$/);
        if (!m) throw new Error('GitHub repo must be owner/repository.');
        return {owner:m[1],repo:m[2]};
    }

    function utf8ToBase64(text) {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        for (let i=0;i<bytes.length;i+=0x8000) binary += String.fromCharCode(...bytes.subarray(i,i+0x8000));
        return btoa(binary);
    }

    async function githubJson(url, options={}) {
        const token = getLocal(STORAGE.githubToken);
        if (!token) throw new Error('GitHub token missing. Add a fine-grained token with Contents read/write access only to the private snapshot repository.');
        const headers = {
            'Accept':'application/vnd.github+json',
            'Authorization':'Bearer ' + token,
            'X-GitHub-Api-Version':'2022-11-28',
            'Content-Type':'application/json'
        };
        const r = await request(url,{method:options.method || 'GET',headers,body:options.body ? JSON.stringify(options.body) : undefined});
        let data = {};
        try { data = JSON.parse(r.text || '{}'); } catch (_) {}
        if (r.status < 200 || r.status >= 300) throw new Error('GitHub ' + r.status + ': ' + (data?.message || 'request failed'));
        return data;
    }

    async function syncSnapshot(snapshot) {
        const {owner,repo} = parseRepo();
        const branch = String(settings.branch || 'main').trim() || 'main';
        const path = String(settings.path || 'SakaLuX-Account-Snapshot.json').replace(/^\/+/, '');
        const api = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');
        let sha = null;
        try { sha = (await githubJson(api + '?ref=' + encodeURIComponent(branch)))?.sha || null; }
        catch (e) { if (!/GitHub 404:/.test(String(e?.message || e))) throw e; }
        const body = {
            message:'Sync Torn account snapshot ' + new Date().toISOString(),
            content:utf8ToBase64(JSON.stringify(snapshot,null,2) + '\n'),
            branch
        };
        if (sha) body.sha = sha;
        const result = await githubJson(api,{method:'PUT',body});
        const meta = {at:Date.now(),atIso:new Date().toISOString(),repo:settings.repo,branch,path,commitSha:result?.commit?.sha || null,htmlUrl:result?.content?.html_url || null};
        saveJson(STORAGE.lastSync,meta);
        return meta;
    }

    async function syncNow() {
        if (busy) return false;
        busy = true;
        try {
            setStatus('Collecting read-only account snapshot…');
            const snapshot = await collectSnapshot();
            setStatus('Uploading sanitized snapshot to private GitHub repo…');
            const result = await syncSnapshot(snapshot);
            setStatus('SYNC OK · ' + new Date(result.at).toLocaleTimeString());
            updatePanelStatus();
            return true;
        } catch (e) {
            setStatus('ERROR · ' + String(e?.message || e));
            updatePanelStatus();
            return false;
        } finally {
            busy = false;
        }
    }

    function setStatus(text) {
        lastStatus = String(text || '');
        const el = document.getElementById('sl-aa-status');
        if (el) el.textContent = lastStatus;
        const b = document.getElementById('sl-aa-button');
        if (b) b.textContent = busy ? '☠︎ SYNC…' : '☠︎ AUDIT';
    }

    function lastSyncText() {
        const s = loadJson(STORAGE.lastSync, null);
        if (!s?.at) return 'Never';
        try { return new Date(s.at).toLocaleString(); } catch (_) { return 'Unknown'; }
    }

    function updatePanelStatus() {
        const el = document.getElementById('sl-aa-last-sync');
        if (el) el.textContent = lastSyncText();
        setStatus(lastStatus);
    }

    function openSettings() {
        document.getElementById('sl-aa-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.id = 'sl-aa-overlay';
        overlay.innerHTML = '<div id="sl-aa-panel">' +
            '<div class="sl-aa-head"><div><b>☠︎ SakaLuX Account Auditor</b><small>v'+VERSION+' · PRIVATE / READ-ONLY</small></div><button id="sl-aa-close">×</button></div>' +
            '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> The snapshot can contain private Torn data. Credentials, passwords, cookies and browser session data are never synced.</div>' +
            '<div class="sl-aa-note"><b>Messages:</b> Torn API exposes sender/topic/status metadata, but not message body text. v1.1.1 records that limitation explicitly instead of pretending the body is available.</div>' +
            '<label>GitHub repository <input id="sl-aa-repo" value="'+esc(settings.repo)+'" placeholder="SakaLuX/SakaLuX-Torn-Account-Data"></label>' +
            '<label>Branch <input id="sl-aa-branch" value="'+esc(settings.branch)+'" placeholder="main"></label>' +
            '<label>Snapshot path <input id="sl-aa-path" value="'+esc(settings.path)+'" placeholder="SakaLuX-Account-Snapshot.json"></label>' +
            '<label>GitHub fine-grained token <input id="sl-aa-gh" type="password" value="" placeholder="Stored in userscript storage"></label>' +
            (!getTornApiKey() ? '<label>Torn API key <input id="sl-aa-torn" type="password" value="" placeholder="Use the least access you need"></label>' : '') +
            '<label class="sl-aa-check"><input id="sl-aa-private" type="checkbox" '+(settings.includePrivateData?'checked':'')+'> Include messages, events and logs</label>' +
            '<label class="sl-aa-check"><input id="sl-aa-auto" type="checkbox" '+(settings.autoSync?'checked':'')+'> Auto-sync while Torn is open</label>' +
            '<label>Auto-sync interval (minutes) <input id="sl-aa-minutes" type="number" min="15" max="1440" value="'+esc(settings.autoSyncMinutes)+'"></label>' +
            '<label>Max private pages <input id="sl-aa-pages" type="number" min="1" max="100" value="'+esc(settings.maxPrivatePages)+'"></label>' +
            '<div class="sl-aa-info">Last sync: <strong id="sl-aa-last-sync">'+esc(lastSyncText())+'</strong></div>' +
            '<div id="sl-aa-status">'+esc(lastStatus || 'Ready')+'</div>' +
            '<button id="sl-aa-save">SAVE SETTINGS</button>' +
            '<button id="sl-aa-sync">SYNC NOW</button>' +
            '</div>';
        document.body.appendChild(overlay);
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        overlay.querySelector('#sl-aa-close').onclick = () => overlay.remove();
        overlay.querySelector('#sl-aa-save').onclick = () => {
            settings.repo = overlay.querySelector('#sl-aa-repo').value.trim();
            settings.branch = overlay.querySelector('#sl-aa-branch').value.trim() || 'main';
            settings.path = overlay.querySelector('#sl-aa-path').value.trim() || 'SakaLuX-Account-Snapshot.json';
            settings.includePrivateData = !!overlay.querySelector('#sl-aa-private').checked;
            settings.autoSync = !!overlay.querySelector('#sl-aa-auto').checked;
            settings.autoSyncMinutes = Math.max(15, Math.min(1440, Number(overlay.querySelector('#sl-aa-minutes').value) || 30));
            settings.maxPrivatePages = Math.max(1, Math.min(100, Number(overlay.querySelector('#sl-aa-pages').value) || 20));
            const gh = overlay.querySelector('#sl-aa-gh').value.trim(); if (gh) setLocal(STORAGE.githubToken, gh);
            const tk = overlay.querySelector('#sl-aa-torn')?.value.trim(); if (tk) setLocal(STORAGE.apiKey, tk);
            saveJson(STORAGE.settings, settings);
            scheduleAutoSync();
            setStatus('Settings saved');
            updatePanelStatus();
        };
        overlay.querySelector('#sl-aa-sync').onclick = async () => { await syncNow(); };
    }

    function injectCss() {
        if (document.getElementById('sl-aa-style')) return;
        const s = document.createElement('style');
        s.id = 'sl-aa-style';
        s.textContent = `
#sl-aa-button{position:fixed;right:10px;bottom:150px;z-index:2147483643;border:0;border-radius:999px;padding:9px 11px;background:#16191f;color:#fff;box-shadow:0 5px 18px rgba(0,0,0,.42);font:900 12px Arial}
#sl-aa-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;font-family:Arial,sans-serif}
#sl-aa-panel{width:min(620px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}
.sl-aa-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sl-aa-head>div{display:flex;flex-direction:column;gap:3px}.sl-aa-head small{color:#8e96a3}#sl-aa-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}
#sl-aa-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}#sl-aa-panel label input{width:54%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:8px}.sl-aa-check input{width:auto!important}.sl-aa-warning,.sl-aa-note{margin:8px 0;padding:10px;border-radius:9px;font-size:10px;line-height:1.45}.sl-aa-warning{background:#2a2010;border:1px solid #6a5420;color:#f2dc8c}.sl-aa-note{background:#122033;border:1px solid #29456b;color:#cfe3ff}.sl-aa-info,#sl-aa-status{margin:9px 0;padding:9px;background:#12171e;border:1px solid #29313a;border-radius:8px;font-size:10px}#sl-aa-save,#sl-aa-sync{width:100%;min-height:42px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900}#sl-aa-save{background:#374151}#sl-aa-sync{background:#2563eb}
@media(min-width:700px){#sl-aa-overlay{align-items:center}#sl-aa-panel{border-radius:18px}}
`;
        document.head.appendChild(s);
    }

    function createButton() {
        if (!settings.showButton || document.getElementById('sl-aa-button')) return;
        const b = document.createElement('button');
        b.id = 'sl-aa-button'; b.textContent = '☠︎ AUDIT'; b.onclick = openSettings;
        document.body.appendChild(b);
    }

    function scheduleAutoSync() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
        if (!settings.autoSync) return;
        const mins = Math.max(15, Number(settings.autoSyncMinutes) || 30);
        autoTimer = setInterval(() => syncNow(), mins * 60 * 1000);
        const last = loadJson(STORAGE.lastSync, null);
        if (!last?.at || Date.now() - Number(last.at) >= mins * 60 * 1000) setTimeout(() => syncNow(), 5000);
    }

    window.SakaLuXAccountAuditor = {
        id:'account-auditor', name:'Account Auditor', version:VERSION,
        open(){ openSettings(); return true; },
        async sync(){ return syncNow(); },
        async snapshot(){ return collectSnapshot(); },
        status(){ return {version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),settings:{repo:settings.repo,branch:settings.branch,path:settings.path,autoSync:settings.autoSync,autoSyncMinutes:settings.autoSyncMinutes,includePrivateData:settings.includePrivateData,maxPrivatePages:settings.maxPrivatePages},hasTornKey:Boolean(getTornApiKey()),hasGitHubToken:Boolean(getLocal(STORAGE.githubToken))}; }
    };
    window.dispatchEvent(new CustomEvent('SakaLuX:AccountAuditorReady',{detail:{version:VERSION}}));

    function init(){ injectCss(); createButton(); scheduleAutoSync(); console.log('['+NAME+' v'+VERSION+'] Loaded.'); }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
