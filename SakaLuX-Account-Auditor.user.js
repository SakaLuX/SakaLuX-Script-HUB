// ==UserScript==
// @name         SakaLuX Account Auditor
// @namespace    sakalux.account.auditor
// @version      1.0.0
// @description  Torn PDA/Tampermonkey account snapshot collector with secure GitHub sync. API keys and GitHub tokens stay local and are never written to the snapshot.
// @author       SakaLuX
// @match        https://www.torn.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.torn.com
// @connect      api.github.com
// @license      MIT
// @run-at       document-end
// @downloadURL  https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// @updateURL    https://raw.githubusercontent.com/SakaLuX/SakaLuX-Script-HUB/main/SakaLuX-Account-Auditor.user.js
// ==/UserScript==

(function () {
    'use strict';

    const VERSION = '1.0.0';
    const NAME = 'SakaLuX Account Auditor';
    const PDA_KEY = '###PDA-APIKEY###';

    const STORAGE = {
        apiKey: 'SakaLuX_AUDITOR_TORN_API_KEY',
        githubToken: 'SakaLuX_AUDITOR_GITHUB_TOKEN',
        settings: 'SakaLuX_AUDITOR_SETTINGS_V1',
        lastSync: 'SakaLuX_AUDITOR_LAST_SYNC_V1',
        lastSnapshot: 'SakaLuX_AUDITOR_LAST_SNAPSHOT_V1'
    };

    const DEFAULT_SETTINGS = {
        repo: 'SakaLuX/SakaLuX-Torn-Account-Data',
        branch: 'main',
        path: 'SakaLuX-Account-Snapshot.json',
        autoSync: false,
        autoSyncMinutes: 30,
        showButton: true
    };

    // Requested separately so one unsupported/permission-limited selection does not break the whole snapshot.
    const USER_SELECTIONS = [
        'profile','bars','cooldowns','travel','education','jobpoints','merits','refills',
        'notifications','money','stocks','properties','discord','personalstats','weaponexp',
        'workstats','skills','battlestats','networth','inventory','display','icons','criminalrecord'
    ];

    let settings = Object.assign({}, DEFAULT_SETTINGS, loadJson(STORAGE.settings, {}));
    let busy = false;
    let autoTimer = null;
    let lastStatus = '';

    function loadJson(key, fallback) {
        try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
        catch (_) { return fallback; }
    }
    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
    function getLocal(key) { try { return localStorage.getItem(key) || ''; } catch (_) { return ''; } }
    function setLocal(key, value) { try { localStorage.setItem(key, String(value || '')); } catch (_) {} }
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
                    method, url, headers, data: body, timeout: 20000,
                    onload: r => resolve({status:r.status, text:r.responseText, headers:r.responseHeaders}),
                    onerror: () => reject(new Error('Network error')),
                    ontimeout: () => reject(new Error('Request timeout'))
                });
                return;
            }
            fetch(url,{method,headers,body}).then(async r=>resolve({status:r.status,text:await r.text()})).catch(reject);
        });
    }

    async function tornSelection(selection, key) {
        const url = 'https://api.torn.com/user/?selections=' + encodeURIComponent(selection) + '&key=' + encodeURIComponent(key);
        try {
            const r = await request(url);
            let data = null;
            try { data = JSON.parse(r.text || '{}'); } catch (_) { return {ok:false,error:'Invalid JSON',httpStatus:r.status}; }
            if (data?.error) return {ok:false,error:data.error.error || data.error.message || 'Torn API error',code:data.error.code ?? null,httpStatus:r.status};
            return {ok:true,data,httpStatus:r.status};
        } catch (e) {
            return {ok:false,error:String(e?.message || e)};
        }
    }

    function sanitizeDeep(value, depth=0) {
        if (depth > 30) return '[depth-limit]';
        if (Array.isArray(value)) return value.map(v => sanitizeDeep(v, depth + 1));
        if (!value || typeof value !== 'object') return value;
        const out = {};
        for (const [k,v] of Object.entries(value)) {
            const key = String(k).toLowerCase();
            if (['key','apikey','api_key','token','authorization','cookie','cookies','session','sessionid','password','secret'].includes(key)) continue;
            out[k] = sanitizeDeep(v, depth + 1);
        }
        return out;
    }

    async function collectSnapshot() {
        const key = getTornApiKey();
        if (!key) throw new Error('Torn API key missing. Open AUDIT settings and add a public/limited key, or use Torn PDA API injection.');

        const selections = {};
        const errors = {};
        let successCount = 0;

        for (let i=0; i<USER_SELECTIONS.length; i++) {
            const selection = USER_SELECTIONS[i];
            setStatus('Reading Torn: ' + selection + ' (' + (i+1) + '/' + USER_SELECTIONS.length + ')');
            const result = await tornSelection(selection, key);
            if (result.ok) {
                selections[selection] = sanitizeDeep(result.data);
                successCount++;
            } else {
                errors[selection] = {error:result.error, code:result.code ?? null, httpStatus:result.httpStatus ?? null};
            }
            await sleep(110);
        }

        const profile = selections.profile || {};
        const snapshot = {
            schema: 'sakalux-torn-account-snapshot-v1',
            generatedAt: new Date().toISOString(),
            generatedAtUnix: Date.now(),
            script: {name:NAME, version:VERSION},
            privacy: {
                containsTornApiKey: false,
                containsGitHubToken: false,
                containsBrowserCookies: false,
                note: 'Credentials are intentionally stripped before sync.'
            },
            account: {
                playerId: profile.player_id ?? profile.playerID ?? profile.user_id ?? null,
                name: profile.name ?? null,
                level: profile.level ?? null,
                rank: profile.rank ?? null,
                status: profile.status ?? null,
                faction: profile.faction ?? null,
                job: profile.job ?? null,
                lastAction: profile.last_action ?? null,
                age: profile.age ?? null
            },
            coverage: {
                requested: USER_SELECTIONS.length,
                successful: successCount,
                failed: Object.keys(errors).length,
                selections: USER_SELECTIONS.slice()
            },
            data: selections,
            errors
        };

        saveJson(STORAGE.lastSnapshot, snapshot);
        return snapshot;
    }

    function parseRepo() {
        const m = String(settings.repo || '').trim().match(/^([^/\s]+)\/([^/\s]+)$/);
        if (!m) throw new Error('GitHub repo must be owner/repository.');
        return {owner:m[1], repo:m[2]};
    }

    function utf8ToBase64(text) {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        const chunk = 0x8000;
        for (let i=0;i<bytes.length;i+=chunk) binary += String.fromCharCode(...bytes.subarray(i, i+chunk));
        return btoa(binary);
    }

    async function githubJson(url, options={}) {
        const token = getLocal(STORAGE.githubToken);
        if (!token) throw new Error('GitHub token missing. Add a fine-grained token with Contents read/write access to the private snapshot repository.');
        const headers = {
            'Accept':'application/vnd.github+json',
            'Authorization':'Bearer ' + token,
            'X-GitHub-Api-Version':'2022-11-28',
            'Content-Type':'application/json'
        };
        const r = await request(url,{method:options.method || 'GET',headers,body:options.body ? JSON.stringify(options.body) : undefined});
        let data = null;
        try { data = JSON.parse(r.text || '{}'); } catch (_) { data = {}; }
        if (r.status < 200 || r.status >= 300) throw new Error('GitHub ' + r.status + ': ' + (data?.message || 'request failed'));
        return data;
    }

    async function syncSnapshot(snapshot) {
        const {owner, repo} = parseRepo();
        const branch = String(settings.branch || 'main').trim() || 'main';
        const path = String(settings.path || 'SakaLuX-Account-Snapshot.json').replace(/^\/+/, '');
        const api = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/contents/' + path.split('/').map(encodeURIComponent).join('/');

        let sha = null;
        try {
            const existing = await githubJson(api + '?ref=' + encodeURIComponent(branch));
            sha = existing?.sha || null;
        } catch (e) {
            if (!/GitHub 404:/.test(String(e?.message || e))) throw e;
        }

        const content = JSON.stringify(snapshot, null, 2) + '\n';
        const body = {
            message: 'Sync Torn account snapshot ' + new Date().toISOString(),
            content: utf8ToBase64(content),
            branch
        };
        if (sha) body.sha = sha;

        const result = await githubJson(api,{method:'PUT',body});
        const syncMeta = {
            at: Date.now(),
            atIso: new Date().toISOString(),
            repo: settings.repo,
            branch,
            path,
            commitSha: result?.commit?.sha || null,
            htmlUrl: result?.content?.html_url || null
        };
        saveJson(STORAGE.lastSync, syncMeta);
        return syncMeta;
    }

    async function syncNow() {
        if (busy) return false;
        busy = true;
        try {
            setStatus('Collecting account snapshot…');
            const snapshot = await collectSnapshot();
            setStatus('Uploading sanitized snapshot to GitHub…');
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
            '<div class="sl-aa-head"><div><b>☠︎ SakaLuX Account Auditor</b><small>v'+VERSION+'</small></div><button id="sl-aa-close">×</button></div>' +
            '<div class="sl-aa-warning"><b>Use a PRIVATE GitHub repository.</b> The snapshot can contain detailed Torn account information. Torn API key, GitHub token, cookies and session data are never included.</div>' +
            '<label>GitHub repository <input id="sl-aa-repo" value="'+esc(settings.repo)+'" placeholder="SakaLuX/SakaLuX-Torn-Account-Data"></label>' +
            '<label>Branch <input id="sl-aa-branch" value="'+esc(settings.branch)+'" placeholder="main"></label>' +
            '<label>Snapshot path <input id="sl-aa-path" value="'+esc(settings.path)+'" placeholder="SakaLuX-Account-Snapshot.json"></label>' +
            '<label>GitHub fine-grained token <input id="sl-aa-gh" type="password" value="" placeholder="Stored only on this device"></label>' +
            (!getTornApiKey() ? '<label>Torn API key <input id="sl-aa-torn" type="password" value="" placeholder="Public / limited key"></label>' : '') +
            '<label class="sl-aa-check"><input id="sl-aa-auto" type="checkbox" '+(settings.autoSync?'checked':'')+'> Auto-sync while Torn is open</label>' +
            '<label>Auto-sync interval (minutes) <input id="sl-aa-minutes" type="number" min="15" max="1440" value="'+esc(settings.autoSyncMinutes)+'"></label>' +
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
            settings.autoSync = !!overlay.querySelector('#sl-aa-auto').checked;
            settings.autoSyncMinutes = Math.max(15, Math.min(1440, Number(overlay.querySelector('#sl-aa-minutes').value) || 30));
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
#sl-aa-panel{width:min(590px,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:14px;background:#101318;color:#fff;border-radius:18px 18px 0 0}
.sl-aa-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.sl-aa-head>div{display:flex;flex-direction:column;gap:3px}.sl-aa-head small{color:#8e96a3}#sl-aa-close{width:36px;height:36px;border:0;border-radius:9px;background:#272d35;color:#fff;font-size:20px}
#sl-aa-panel label{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:7px 0;padding:10px;border-radius:9px;background:#181d24;border:1px solid #292f38;font-size:11px}#sl-aa-panel label input{width:54%;box-sizing:border-box;background:#0f1217;color:#fff;border:1px solid #303640;border-radius:7px;padding:8px}.sl-aa-check input{width:auto!important}.sl-aa-warning{margin:8px 0;padding:10px;background:#2a2010;border:1px solid #6a5420;border-radius:9px;color:#f2dc8c;font-size:10px;line-height:1.45}.sl-aa-info,#sl-aa-status{margin:9px 0;padding:9px;background:#12171e;border:1px solid #29313a;border-radius:8px;font-size:10px}#sl-aa-save,#sl-aa-sync{width:100%;min-height:42px;margin-top:7px;border:0;border-radius:9px;color:#fff;font-weight:900}#sl-aa-save{background:#374151}#sl-aa-sync{background:#2563eb}
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
        status(){ return {version:VERSION,busy,lastStatus,lastSync:loadJson(STORAGE.lastSync,null),settings:{repo:settings.repo,branch:settings.branch,path:settings.path,autoSync:settings.autoSync,autoSyncMinutes:settings.autoSyncMinutes},hasTornKey:Boolean(getTornApiKey()),hasGitHubToken:Boolean(getLocal(STORAGE.githubToken))}; }
    };
    window.dispatchEvent(new CustomEvent('SakaLuX:AccountAuditorReady',{detail:{version:VERSION}}));

    function init() {
        injectCss(); createButton(); scheduleAutoSync();
        console.log('['+NAME+' v'+VERSION+'] Loaded.');
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
