from pathlib import Path
import json, re

versions = {
    'enhancer': ('SakaLuX-Enhancer-Guard.user.js', '1.3.34', '1.3.35', 'VERSION', 'greasyfork/Enhancer-Guard.md'),
    'bazaar': ('SakaLuX-Bazaar-Thanker-PDA.user.js', '5.3.26', '5.3.27', 'BAZAAR_VERSION', 'greasyfork/Bazaar-Thanker.md'),
    'mission-rewards': ('SakaLuX-Mission-Rewards.user.js', '1.0.21', '1.0.22', 'VERSION', 'greasyfork/Mission-Rewards.md'),
    'market-intelligence': ('SakaLuX-Market-Intelligence.user.js', '1.17.22', '1.17.23', 'VERSION', 'greasyfork/Market-Intelligence.md'),
    'elimination-assistant': ('SakaLuX-Elimination-Assistant.user.js', '1.3.32', '1.3.33', 'VERSION', 'greasyfork/Elimination-Assistant.md'),
    'company-intelligence': ('SakaLuX-Company-Intelligence-v1.0.0.user.js', '1.8.19', '1.8.20', None, 'greasyfork/Company-Intelligence.md'),
}

def bump_file(path, old, new, runtime=None):
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    oldmeta = f'// @version      {old}'
    if oldmeta not in s:
        raise SystemExit(f'{path}: missing {oldmeta}')
    s = s.replace(oldmeta, f'// @version      {new}', 1)
    if runtime:
        pat = re.compile(rf"(const\s+{re.escape(runtime)}\s*=\s*['\"]){re.escape(old)}(['\"])")
        s, n = pat.subn(rf'\g<1>{new}\2', s, count=1)
        if n != 1:
            raise SystemExit(f'{path}: runtime {runtime} not bumped')
    else:
        s, n = re.subn(r"(const\s+APP=\{name:'SakaLuX Company Intelligence',version:')" + re.escape(old) + r"(')", rf'\g<1>{new}\2', s, count=1)
        if n != 1:
            raise SystemExit('Company APP.version not bumped')
    s = s.replace('align-items:flex-end;justify-content:center', 'align-items:flex-start;justify-content:center')
    p.write_text(s, encoding='utf-8')

for sid, (fn, old, new, runtime, md) in versions.items():
    bump_file(fn, old, new, runtime)

cp = Path('SakaLuX-Company-Intelligence-v1.0.0.user.js')
cs = cp.read_text(encoding='utf-8')
company_css = r'''
  // v1.8.20 authoritative TornPDA layout override.
  (() => {
    if (document.getElementById('sakalux-company-v1820-layout')) return;
    const st=document.createElement('style');
    st.id='sakalux-company-v1820-layout';
    st.textContent=`
#ci-root{align-items:flex-start!important;justify-content:center!important;overflow-y:auto!important;overflow-x:hidden!important;padding:0 0 88px!important;box-sizing:border-box!important;overscroll-behavior:contain!important}
#ci-root .ci-shell{display:block!important;margin:0 auto!important;max-height:none!important;height:auto!important;min-height:100%!important;overflow:visible!important;width:100%!important}
#ci-root .ci-body{overflow:visible!important;max-height:none!important}
#ci-root .ci-status{display:none!important}
#ci-root .ci-footer{display:flex!important;align-items:center!important;justify-content:center!important;position:sticky!important;bottom:76px!important;z-index:2147483640!important;min-height:44px!important;padding:11px 10px!important;box-sizing:border-box!important;background:#0b1118!important;border-top:1px solid rgba(255,255,255,.08)!important;white-space:nowrap!important;overflow:visible!important;opacity:1!important;visibility:visible!important}
`;
    (document.head||document.documentElement).appendChild(st);
  })();
'''
mark = "'use strict';\n"
if company_css.strip() not in cs:
    if mark not in cs:
        raise SystemExit('Company use strict marker missing')
    cs = cs.replace(mark, mark + company_css, 1)
cp.write_text(cs, encoding='utf-8')

hp = Path('SakaLuX-Script-Hub.user.js')
h = hp.read_text(encoding='utf-8')
if '// @version      1.9.45' not in h or "const VERSION = '1.9.45';" not in h:
    raise SystemExit('Unexpected Hub baseline')
h = h.replace('// @version      1.9.45', '// @version      1.9.46', 1)
h = h.replace("const VERSION = '1.9.45';", "const VERSION = '1.9.46';", 1)
for sid, (_, old, new, _, _) in versions.items():
    pat = re.compile(r"(id:\s*['\"]" + re.escape(sid) + r"['\"][\s\S]{0,500}?version:\s*['\"])" + re.escape(old) + r"(['\"])")
    h, n = pat.subn(rf'\g<1>{new}\2', h, count=1)
    if n != 1:
        raise SystemExit(f'Hub fallback {sid} not bumped')

marker = '    const HUB_CHANGELOG = [\n'
entry = '''        {
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
'''
if marker not in h:
    raise SystemExit('Hub changelog marker missing')
h = h.replace(marker, marker + entry, 1)

append_anchor = '        document.head.appendChild(style);\n'
override = r'''        style.textContent += `
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
'''
if append_anchor not in h:
    raise SystemExit('Hub CSS append anchor missing')
h = h.replace(append_anchor, override + append_anchor, 1)
hp.write_text(h, encoding='utf-8')

rp = Path('scripts.json')
data = json.loads(rp.read_text(encoding='utf-8'))
items = {x['id']: x for x in data['scripts']}
for sid, (_, _, new, _, _) in versions.items():
    items[sid]['version'] = new
    items[sid]['release'] = {'version': new, 'date': '2026-09-16', 'notes': ['PDA/mobile top-aligned panel refinement.', 'Improves compact Hub card integration and panel visibility.']}
items['company-intelligence']['release']['notes'] = [
    'Whole Company sheet can now be scrolled from anywhere on the panel.',
    'Removes the Updated / SakaLuX Script Hub / no automated company actions status line.',
    'Keeps only the Made with ❤️ by SakaLuX author footer and keeps it fully visible above TornPDA navigation.',
    'Panel opens from the top of the available Torn viewport.'
]
rp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

for sid, (_, old, new, _, md_path) in versions.items():
    p = Path(md_path)
    d = p.read_text(encoding='utf-8')
    d, n = re.subn(r'(## Current version\s*\n\s*\*\*v)' + re.escape(old) + r'(\*\*)', rf'\g<1>{new}\2', d, count=1)
    if n == 0:
        d, n = re.subn(r'(\*\*Current version:\s*v)' + re.escape(old) + r'(\*\*)', rf'\g<1>{new}\2', d, count=1)
    if n == 0:
        raise SystemExit(f'{md_path}: current version marker not found')
    d, n = re.subn(r'(## Current release note\s*\n+\*\*v)' + re.escape(old) + r'(\*\*)[^\n]*', rf'\g<1>{new}\2 PDA/mobile top-aligned sheet and compact Hub integration refinement.', d, count=1)
    if n == 0:
        raise SystemExit(f'{md_path}: release note marker not found')
    hist = '## Release history\n'
    rel = f"### v{new} — PDA top-aligned panel refinement\n\n- Opens the SakaLuX panel from the top of the available Torn viewport.\n- Improves compact Hub integration and mobile visibility.\n"
    if sid == 'company-intelligence':
        rel += "- Makes the whole Company sheet scrollable and keeps only the fully visible SakaLuX author footer.\n"
    rel += '\n'
    if hist not in d:
        raise SystemExit(f'{md_path}: history marker missing')
    if f'### v{new}' not in d:
        d = d.replace(hist, hist + rel, 1)
    p.write_text(d, encoding='utf-8')

hd = Path('greasyfork/Script-Hub.md')
d = hd.read_text(encoding='utf-8')
d, n = re.subn(r'(## Current version\s*\n\s*\*\*v)1\.9\.45(\*\*)', r'\g<1>1.9.46\2', d, count=1)
if n == 0:
    raise SystemExit('Hub doc current version not found')
d, n = re.subn(r'(## Current release note\s*\n+\*\*v)1\.9\.45(\*\*)[^\n]*', r'\g<1>1.9.46\2 Right-side 2x2 module controls, compact Settings toggles, top-aligned SakaLuX sheets and corrected Company footer/scroll behavior.', d, count=1)
if n == 0:
    raise SystemExit('Hub doc release note not found')
names = {
    'Enhancer Guard': ('1.3.34', '1.3.35'),
    'Bazaar Thanker - PDA': ('5.3.26', '5.3.27'),
    'Mission Rewards': ('1.0.21', '1.0.22'),
    'Market Intelligence': ('1.17.22', '1.17.23'),
    'Elimination Assistant': ('1.3.32', '1.3.33'),
    'Company Intelligence': ('1.8.19', '1.8.20'),
}
for name, (old, new) in names.items():
    pat = re.compile(r'(^- .*SakaLuX ' + re.escape(name) + r' \*\*v)' + re.escape(old) + r'(\*\*)', re.M)
    d, n = pat.subn(rf'\g<1>{new}\2', d, count=1)
    if n == 0:
        print(f'warning: Hub doc module line not found for {name}')
hist = '## Release history\n'
rel = '''### v1.9.46 — Authoritative PDA layout correction

- Keeps INFO, NEW, ON/OFF and OPEN/SETTINGS in a compact 2×2 block on the right side of managed module cards.
- Makes Hub Settings switches smaller and uniform.
- Opens Hub and managed SakaLuX panels from the top of the available Torn viewport.
- Makes Company Intelligence scroll as a whole sheet and keeps only the fully visible SakaLuX author footer.

'''
if hist not in d:
    raise SystemExit('Hub doc history marker missing')
if '### v1.9.46' not in d:
    d = d.replace(hist, hist + rel, 1)
hd.write_text(d, encoding='utf-8')
