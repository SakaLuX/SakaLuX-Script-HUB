from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'SakaLuX-Script-Hub.user.js'
text=p.read_text(encoding='utf-8')

# Version bump
text,n=re.subn(r'(^// @version\s+)1\.9\.12(\s*$)',r'\g<1>1.9.13\2',text,count=1,flags=re.M)
if n!=1: raise SystemExit('metadata version not found')
text,n=re.subn(r"const VERSION = '1\.9\.12';", "const VERSION = '1.9.13';", text, count=1)
if n!=1: raise SystemExit('runtime version not found')

# Changelog entry
needle="    const HUB_CHANGELOG = [\n"
entry="""    const HUB_CHANGELOG = [
        {
            version: '1.9.13',
            date: '2026-09-12',
            changes: [
                'Moved the primary Hub launcher into Torn resource/status bar before the money resource when available.',
                'Replaced the native navigation skull entry with a compact SakaLuX S launcher.',
                'The floating skull now appears only as an automatic fallback when the resource bar cannot be detected.'
            ]
        },
"""
if needle not in text: raise SystemExit('changelog anchor not found')
text=text.replace(needle,entry,1)

# Replace native topbar styles with compact resource launcher styles, leaving IDs compatible.
old_css=r"#\$\{IDS\.topSkull\}\{position:relative!important;box-sizing:border-box!important\}#\$\{IDS\.topSkull\} \.slh-native-link\{[\s\S]*?@keyframes slhNativeSkullAlert\{0%,100%\{opacity:\.38\}50%\{opacity:1\}72%\{opacity:\.58\}\}"
new_css="""#${IDS.topSkull}{position:relative!important;display:inline-grid!important;place-items:center!important;flex:0 0 30px!important;width:30px!important;height:30px!important;min-width:30px!important;max-width:30px!important;min-height:30px!important;max-height:30px!important;margin:0 6px 0 0!important;padding:0!important;box-sizing:border-box!important;border:1px solid #3a4f68!important;border-radius:9px!important;background:linear-gradient(145deg,#26384d,#172332)!important;color:#9cc8ff!important;font:900 13px/1 Inter,Arial,sans-serif!important;letter-spacing:0!important;box-shadow:inset 0 1px rgba(255,255,255,.05),0 2px 7px rgba(0,0,0,.32)!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important;vertical-align:middle!important}#${IDS.topSkull}:active{transform:translateY(1px)!important}#${IDS.topSkull}.slh-alert{border-color:#765926!important;color:#f2c864!important;background:linear-gradient(145deg,#3b321f,#211d16)!important}#${IDS.topSkull} .slh-resource-mark{display:grid!important;place-items:center!important;width:100%!important;height:100%!important;border-radius:8px!important}#${IDS.topBadge}{position:absolute;top:-5px;right:-5px;min-width:14px;height:14px;padding:0 3px;box-sizing:border-box;border-radius:999px;background:#c93f50;color:#fff;display:none;align-items:center;justify-content:center;font-size:8px;font-weight:900;line-height:1;z-index:3;border:1px solid #111923}"""
text,n=re.subn(old_css,new_css,text,count=1)
if n!=1: raise SystemExit('old native skull CSS block not found')

# Replace the old mobile-nav context helper with resource bar discovery.
pat_ctx=r"    function getMobileNavContext\(\) \{[\s\S]*?\n    \}\n\n    function buildSkullSvg"
rep_ctx="""    function getResourceBarContext() {
        const visible = el => {
            if (!(el instanceof Element)) return false;
            const r = el.getBoundingClientRect();
            const s = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
        };
        const directItem = (node, row) => {
            let item = node;
            while (item && item.parentElement && item.parentElement !== row) item = item.parentElement;
            return item && item.parentElement === row ? item : null;
        };
        const resolve = node => {
            let cur = node;
            for (let depth = 0; cur && cur.parentElement && depth < 7; depth++, cur = cur.parentElement) {
                const row = cur.parentElement;
                if (!visible(row)) continue;
                const rect = row.getBoundingClientRect();
                const kids = [...row.children].filter(visible);
                if (kids.length < 3 || kids.length > 24 || rect.width < 220 || rect.height < 24 || rect.height > 100) continue;
                const moneyItem = directItem(node, row);
                if (!moneyItem) continue;
                const siblingsWithShortText = kids.filter(x => String(x.textContent || '').trim().length <= 24).length;
                if (siblingsWithShortText < 3) continue;
                return { row, moneyItem };
            }
            return null;
        };

        const exactMoney = [...document.querySelectorAll('span,div,a')].filter(el => {
            if (!visible(el)) return false;
            const t = String(el.textContent || '').replace(/\s+/g, ' ').trim();
            return /^\$\s*[\d.,]+\s*[KMBT]?$/i.test(t) && t.length <= 20;
        });
        for (const node of exactMoney) {
            const ctx = resolve(node);
            if (ctx) return ctx;
        }

        const semantic = [...document.querySelectorAll('[class*="money" i],[class*="cash" i],[data-testid*="money" i],[aria-label*="money" i]')].filter(visible);
        for (const node of semantic) {
            const ctx = resolve(node);
            if (ctx) return ctx;
        }
        return null;
    }

    function buildSkullSvg"""
text,n=re.subn(pat_ctx,rep_ctx,text,count=1)
if n!=1: raise SystemExit('mobile nav helper block not found')

# Replace createTopbarSkull implementation while preserving existing call sites/settings key.
pat_create=r"    function createTopbarSkull\(\) \{[\s\S]*?\n    \}\n\n    function updateTopbarSkullState\(\) \{"
rep_create="""    function createTopbarSkull() {
        const existing = document.getElementById(IDS.topSkull);
        if (!settings.showTopbarSkull) {
            existing?.remove();
            syncFloatingButtonVisibility();
            return false;
        }
        if (existing?.isConnected) {
            updateTopbarSkullState();
            syncFloatingButtonVisibility();
            return true;
        }
        const ctx = getResourceBarContext();
        if (!ctx) {
            syncFloatingButtonVisibility();
            return false;
        }
        const button = document.createElement('button');
        button.id = IDS.topSkull;
        button.type = 'button';
        button.setAttribute('aria-label', 'Open SakaLuX Script Hub');
        button.setAttribute('title', 'SakaLuX Script Hub');
        button.innerHTML = `<span class="slh-resource-mark">S</span><span id="${IDS.topBadge}"></span>`;
        button.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openHub(); });
        ctx.row.insertBefore(button, ctx.moneyItem);
        updateTopbarSkullState();
        syncFloatingButtonVisibility();
        return true;
    }

    function updateTopbarSkullState() {"""
text,n=re.subn(pat_create,rep_create,text,count=1)
if n!=1: raise SystemExit('createTopbarSkull block not found')

# Settings copy
text=text.replace("${settingSwitch('slhs-topbar', 'Torn-native HUB launcher', 'Show the blinking skull HUB entry before Messages when Torn navigation is available.', settings.showTopbarSkull)}",
                  "${settingSwitch('slhs-topbar', 'Torn resource-bar launcher', 'Show the compact SakaLuX button before the money resource when available. The skull button is used automatically as fallback.', settings.showTopbarSkull)}",1)

# System check wording
old="results.push({ level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn', label: 'Torn-native HUB launcher', detail: document.getElementById(IDS.topSkull) ? 'Mounted as a native mobile navigation entry before Messages' : 'Torn mobile navigation not detected yet' });"
new="results.push({ level: document.getElementById(IDS.topSkull) ? 'ok' : 'warn', label: 'Torn resource-bar HUB launcher', detail: document.getElementById(IDS.topSkull) ? 'Mounted before the money resource' : 'Resource bar not detected — floating skull fallback active' });"
if old not in text: raise SystemExit('system check launcher wording not found')
text=text.replace(old,new,1)

# Health API keeps same compatibility property but now reflects resource launcher.
# No code change needed for the boolean because IDS.topSkull is still the primary launcher id.

p.write_text(text,encoding='utf-8')

# Hub docs
mp=ROOT/'greasyfork/Script-Hub.md'
doc=mp.read_text(encoding='utf-8')
doc,n=re.subn(r'(## Current version\s+\*\*v)1\.9\.12(\*\*)',r'\g<1>1.9.13\2',doc,count=1)
if n!=1: raise SystemExit('Hub doc version not found')
if '### v1.9.13' not in doc:
    doc=doc.replace('## Current release notes\n','## Current release notes\n\n### v1.9.13 — Resource-bar launcher\n\n- Replaced the native navigation skull entry with a compact SakaLuX **S** launcher mounted directly in Torn\'s resource/status bar.\n- The launcher is inserted immediately before the money resource when Torn exposes the resource bar.\n- The existing floating skull is now strictly an automatic fallback when that native resource-bar anchor cannot be detected.\n- Update/issue badges are preserved on the new compact launcher.\n',1)
mp.write_text(doc,encoding='utf-8')

print('Hub resource-bar launcher migration applied')
