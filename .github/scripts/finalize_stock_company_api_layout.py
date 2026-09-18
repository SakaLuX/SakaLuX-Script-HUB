from pathlib import Path
import json, re, shutil

ROOT = Path('.')
DATE = '2026-09-18'
STOCK_OLD, STOCK_NEW = '0.7.17', '0.7.18'
COMPANY_OLD, COMPANY_NEW = '1.8.37', '1.8.38'
BACKUP = ROOT / 'backups' / 'stock-company-api-final-2026-09-18'
(BACKUP / 'greasyfork').mkdir(parents=True, exist_ok=True)

files_to_backup = [
    ('SakaLuX-Stock-Manager-Advisor.user.js', f'SakaLuX-Stock-Manager-Advisor-v{STOCK_OLD}.user.js'),
    ('SakaLuX-Company-Intelligence-v1.0.0.user.js', f'SakaLuX-Company-Intelligence-v{COMPANY_OLD}.user.js'),
    ('scripts.json', 'scripts.json'),
]
for src, dst in files_to_backup:
    p = ROOT / src
    if p.exists():
        shutil.copy2(p, BACKUP / dst)
for name in ('Stock-Manager-Advisor.md', 'Company-Intelligence.md'):
    p = ROOT / 'greasyfork' / name
    if p.exists():
        shutil.copy2(p, BACKUP / 'greasyfork' / name)


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing expected {label}: {old!r}')
    return text.replace(old, new)

# Stocks
stock_path = ROOT / 'SakaLuX-Stock-Manager-Advisor.user.js'
stock = stock_path.read_text(encoding='utf-8')
stock = must_replace(stock, STOCK_OLD, STOCK_NEW, 'Stocks version')
marker = '/* SAKALUX_STOCK_API_FINAL_V0718 */'
if marker not in stock:
    stock += r'''

/* SAKALUX_STOCK_API_FINAL_V0718 */
(()=>{
  if(document.getElementById('sakalux-stock-api-final-v0718')) return;
  const st=document.createElement('style');
  st.id='sakalux-stock-api-final-v0718';
  st.textContent=`
#slx-stock-panel .head{display:flex!important;align-items:center!important;gap:7px!important;padding:8px 10px!important}
#slx-stock-panel .head>div:first-child,#slx-stock-panel .head>h2{min-width:0!important;flex:1 1 auto!important}
#slx-stock-panel .head button,#slx-stock-panel .slx-stock-api-trigger{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;padding:0!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:10px!important}
#slx-stock-api-sheet#slx-stock-api-sheet{position:absolute!important;inset:6px!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;max-height:calc(100% - 12px)!important;border:1px solid #3b4654!important;border-radius:14px!important;background:#0b1118!important;box-shadow:0 18px 48px rgba(0,0,0,.55)!important}
#slx-stock-api-sheet .slx-api-sheet-head{display:flex!important;align-items:center!important;gap:8px!important;flex:0 0 58px!important;height:58px!important;padding:8px 10px!important;border-bottom:1px solid #2d3d50!important;background:linear-gradient(155deg,#18212d,#101720 72%)!important}
#slx-stock-api-sheet .slx-api-sheet-head>div{min-width:0!important;flex:1 1 auto!important}
#slx-stock-api-sheet .slx-api-sheet-title{font-size:15px!important;font-weight:900!important;line-height:1.15!important}
#slx-stock-api-sheet .slx-api-sheet-sub{font-size:9px!important;color:#93a4b7!important;margin-top:2px!important}
#slx-stock-api-sheet .slx-api-sheet-close{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;padding:0!important;margin:0!important;border-radius:10px!important;font-size:20px!important}
#slx-stock-api-sheet .slx-api-sheet-body{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding:10px!important;display:flex!important;flex-direction:column!important;gap:8px!important}
#slx-stock-api-sheet .slx-api-box{margin:0!important;padding:10px!important;border:1px solid #2d3d50!important;border-radius:10px!important;background:#111a24!important;font-size:11px!important;line-height:1.45!important}
#slx-stock-api-sheet .slx-api-box p{margin:5px 0!important;color:#93a4b7!important}
#slx-stock-api-sheet label{display:block!important;margin:5px 0 4px!important;font-size:10px!important;color:#c7d2df!important}
#slx-stock-api-sheet input{width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;padding:8px 10px!important;box-sizing:border-box!important;border-radius:9px!important}
#slx-stock-api-sheet button{height:40px!important;min-height:40px!important;margin:0!important;border-radius:10px!important;font-size:11px!important;font-weight:900!important;line-height:1.1!important}
#slx-stock-api-sheet #slx-stock-api-create{width:100%!important;background:linear-gradient(180deg,#a87b17,#79550e)!important;border-color:#c79b34!important;color:#fff!important}
#slx-stock-api-sheet .slx-api-sheet-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:0!important}
#slx-stock-api-sheet .slx-api-sheet-actions>button{width:100%!important;min-width:0!important}
#slx-stock-api-sheet #slx-stock-api-save,#slx-stock-api-sheet #slx-stock-api-check{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important;color:#fff!important}
#slx-stock-api-sheet #slx-stock-api-clear{width:100%!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#slx-stock-api-sheet .slx-api-sheet-result{min-height:16px!important;margin:0!important;font-size:10px!important;color:#93a4b7!important;overflow-wrap:anywhere!important}
@media(max-width:520px){#slx-stock-api-sheet .slx-api-sheet-actions{grid-template-columns:1fr 1fr!important}#slx-stock-api-sheet button{font-size:10px!important}}
`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
stock_path.write_text(stock, encoding='utf-8')

# Company
company_path = ROOT / 'SakaLuX-Company-Intelligence-v1.0.0.user.js'
company = company_path.read_text(encoding='utf-8')
company = must_replace(company, COMPANY_OLD, COMPANY_NEW, 'Company version')
marker = '/* SAKALUX_COMPANY_API_FINAL_V1838 */'
if marker not in company:
    company += r'''

/* SAKALUX_COMPANY_API_FINAL_V1838 */
(()=>{
  if(document.getElementById('sakalux-company-api-final-v1838')) return;
  const st=document.createElement('style');
  st.id='sakalux-company-api-final-v1838';
  st.textContent=`
#ci-root .ci-head{overflow:hidden!important}
#ci-root .ci-head>.ci-icon{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;max-width:38px!important;max-height:38px!important;padding:0!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:center!important;border-radius:10px!important}
#ci-root .ci-head>.ci-icon.api{color:#f5d85f!important;background:#29240f!important;border-color:#78621b!important}
#ci-root .ci-tabs{display:flex!important;gap:4px!important;padding:5px 7px!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:none!important}
#ci-root .ci-tabs::-webkit-scrollbar{display:none!important}
#ci-root .ci-tabs button{flex:0 0 auto!important;min-width:82px!important;height:34px!important;min-height:34px!important;padding:0 10px!important;border-radius:8px!important;font-size:10px!important;white-space:nowrap!important}
#ci-root .ci-body{padding:10px!important}
#ci-root .ci-body input#ci-api{width:100%!important;height:40px!important;min-height:40px!important;margin:5px 0 8px!important;padding:8px 10px!important;box-sizing:border-box!important;border-radius:9px!important}
#ci-root .ci-body .ci-actions{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;margin:8px 0!important;align-items:stretch!important}
#ci-root .ci-body .ci-actions>.ci-btn,#ci-root .ci-body .ci-actions>button{width:100%!important;min-width:0!important;height:40px!important;min-height:40px!important;margin:0!important;padding:0 8px!important;border-radius:10px!important;font-size:10px!important;line-height:1.1!important;white-space:normal!important}
#ci-root .ci-body [data-act="create-key"]{display:block!important;width:100%!important;height:40px!important;min-height:40px!important;margin:0 0 8px!important;background:linear-gradient(180deg,#a87b17,#79550e)!important;border-color:#c79b34!important;color:#fff!important}
#ci-root .ci-body [data-act="save-key"],#ci-root .ci-body [data-act="test-key"]{background:linear-gradient(180deg,#377fcf,#275f9f)!important;border-color:#3d78bf!important;color:#fff!important}
#ci-root .ci-body [data-act="clear-key"]{grid-column:1/-1!important;width:100%!important;height:40px!important;min-height:40px!important;margin:0!important;background:linear-gradient(180deg,#733344,#54232f)!important;border-color:#864354!important;color:#ffd7df!important}
#ci-root .ci-body button[id*="create"][id*="key"],#ci-root .ci-body button[id*="api-create"]{width:100%!important}
#ci-root .ci-body button[id*="clear"][id*="key"],#ci-root .ci-body button[id*="api-clear"]{width:100%!important}
@media(max-width:700px){
 #ci-root .ci-head{grid-template-columns:minmax(0,1fr) auto!important;grid-template-rows:auto auto!important;gap:7px!important;padding:8px!important}
 #ci-root .ci-brand{grid-column:1!important;grid-row:1!important;min-width:0!important}
 #ci-root .ci-brand b{display:block!important;font-size:14px!important;line-height:1.12!important;white-space:normal!important}
 #ci-root .ci-brand small{display:block!important;margin-top:2px!important;font-size:9px!important;line-height:1.15!important;white-space:normal!important}
 #ci-root .ci-head-actions{grid-column:2!important;grid-row:1!important;display:flex!important;gap:5px!important;align-items:center!important;justify-content:flex-end!important}
 #ci-root .ci-mode{grid-column:1/-1!important;grid-row:2!important;display:grid!important;grid-template-columns:1fr 1fr!important;width:100%!important;min-width:0!important;height:36px!important}
 #ci-root .ci-mode button{width:100%!important;height:36px!important;min-height:36px!important;margin:0!important;padding:0 8px!important;font-size:10px!important;white-space:nowrap!important}
}
`;
  (document.head||document.documentElement).appendChild(st);
})();
'''
company_path.write_text(company, encoding='utf-8')

# scripts.json version + release metadata
registry_path = ROOT / 'scripts.json'
data = json.loads(registry_path.read_text(encoding='utf-8'))

release_notes = {
    'stock-manager-advisor': {
        'version': STOCK_NEW,
        'date': DATE,
        'title': 'Elimination-style API panel finalization',
        'changes': [
            'Finalizes the Stocks API sheet with the compact Elimination-style layout.',
            'Keeps Create Required Key full width, Save/Test side by side, and Clear Local Key full width below.',
            'Normalizes header icon sizing, input sizing, spacing and TornPDA scrolling.'
        ]
    },
    'company-intelligence': {
        'version': COMPANY_NEW,
        'date': DATE,
        'title': 'API controls and mobile button geometry finalization',
        'changes': [
            'Keeps the v1.8.37 two-row TornPDA header and normalizes Refresh/API/Close controls.',
            'Aligns Company API controls with Elimination-style button geometry.',
            'Uses full-width Create/Clear actions and balanced Save/Test actions for narrow screens.'
        ]
    }
}

def walk(obj):
    if isinstance(obj, dict):
        ident = obj.get('id')
        if ident in release_notes:
            rel = release_notes[ident]
            obj['version'] = rel['version']
            if isinstance(obj.get('release'), dict):
                obj['release']['version'] = rel['version']
                obj['release']['date'] = rel['date']
                if 'title' in obj['release']:
                    obj['release']['title'] = rel['title']
                if 'changes' in obj['release']:
                    obj['release']['changes'] = rel['changes']
                if 'notes' in obj['release']:
                    obj['release']['notes'] = ' '.join(rel['changes'])
        for value in obj.values():
            walk(value)
    elif isinstance(obj, list):
        for value in obj:
            walk(value)

walk(data)
registry_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# Greasy Fork information pages
stock_doc_path = ROOT / 'greasyfork' / 'Stock-Manager-Advisor.md'
stock_doc = stock_doc_path.read_text(encoding='utf-8')
stock_doc = re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*', rf'\1**v{STOCK_NEW}**', stock_doc, count=1)
stock_note = f'''## Current release note\n\n**v{STOCK_NEW} — Elimination-style API panel finalization**\n- Finalizes the Stocks API sheet so it follows the same compact visual contract as Elimination.\n- Keeps **CREATE REQUIRED API KEY** full width.\n- Keeps **SAVE & TEST** and **CHECK ACCESS** balanced on the same row.\n- Keeps **CLEAR LOCAL KEY** full width below the primary actions.\n- Normalizes header icon size, spacing, password field geometry and TornPDA scrolling.\n- Preserves the shared standalone dock, PANIC behavior, trading safeguards and existing stock logic.\n'''
stock_doc = re.sub(r'## Current release note\n.*?(?=\n## )', stock_note.rstrip(), stock_doc, count=1, flags=re.S)
stock_changelog = f'''### v{STOCK_NEW} — Elimination-style API panel finalization\n- Finalized the dedicated Stocks API sheet using the compact Elimination visual contract.\n- Full-width Create action; equal Save/Test actions; full-width Clear action.\n- Unified header/API icon sizing, field geometry, spacing and mobile scroll behavior.\n- No trading logic, PANIC flow or API permission requirements were changed.\n\n### v{STOCK_OLD} — Shared standalone bootstrap\n- Preserved the Bazaar-style shared standalone dock registration and current Stocks module bridge behavior.\n'''
stock_doc = stock_doc.replace('## Changelog\n', '## Changelog\n\n' + stock_changelog, 1)
stock_doc_path.write_text(stock_doc, encoding='utf-8')

company_doc_path = ROOT / 'greasyfork' / 'Company-Intelligence.md'
company_doc = company_doc_path.read_text(encoding='utf-8')
company_doc = re.sub(r'(## Current version\s*\n)\*\*v[^*]+\*\*', rf'\1**v{COMPANY_NEW}**', company_doc, count=1)
company_note = f'''## Current release note\n\n**v{COMPANY_NEW} — Elimination-style API controls + polished TornPDA buttons**\n- Keeps the professional two-row mobile header introduced in v{COMPANY_OLD}.\n- Normalizes **Refresh**, **API Key** and **Close** to the same compact square geometry.\n- Arranges Company API actions like Elimination: full-width Create, balanced Save/Test actions, then full-width Clear.\n- Tightens tab spacing and API input geometry for TornPDA without changing Company calculations or API permissions.\n- Preserves shared standalone registration, Hub integration and the fixed donation/author footer.\n'''
company_doc = re.sub(r'## Current release note\n.*?(?=\n## )', company_note.rstrip(), company_doc, count=1, flags=re.S)
company_entry = f'''### v{COMPANY_NEW} — Elimination-style API controls\n- Keeps the v{COMPANY_OLD} two-row TornPDA header and equal Employee/Director selector.\n- Normalizes Refresh/API/Close button geometry and keeps the action group inside the viewport.\n- Makes Create and Clear full width and keeps Save/Test balanced side by side.\n- Tightens API field, tab and action spacing to match Elimination more closely.\n- Does not change company calculations, API permission requirements or stored data.\n\n'''
company_doc = company_doc.replace('## Release history / Changelog\n', '## Release history / Changelog\n\n' + company_entry, 1)
company_doc = company_doc.replace(f'synchronized at **v{COMPANY_OLD}**', f'synchronized at **v{COMPANY_NEW}**')
company_doc_path.write_text(company_doc, encoding='utf-8')

print('Patched Stocks', STOCK_NEW, 'and Company', COMPANY_NEW)
