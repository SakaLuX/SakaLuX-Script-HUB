from pathlib import Path
p=Path('UPDATE-INFO.md')
s=p.read_text()
s=s.replace('SakaLuX Account Auditor: **v1.1.1**','SakaLuX Account Auditor: **v1.1.2**',1)
anchor='## Latest changes\n\n'
block='''### SakaLuX Account Auditor v1.1.2\n- Added a central Torn API rate gate with a minimum ~900 ms gap between requests.\n- Added automatic retry/backoff for Torn error code 5 (`Too many requests`) using 2.5s, 5s and 10s waits.\n- Private/high-value data is collected first: messages, new messages, events, new events and logs now run before the broad account audit.\n- Reduced default private pagination cap from 20 pages to 5 to avoid exhausting the API allowance during routine syncs.\n- Removed redundant fixed sleeps; pacing is now handled centrally by the rate gate.\n- Inventory/contact/personal-stat requests use the same retry-aware scheduler.\n- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.1.user.js`.\n- Auditor remains read-only and intentionally excluded from `scripts.json` / Script Hub install prompts.\n\n'''
if block not in s:
    s=s.replace(anchor,anchor+block,1)
p.write_text(s)

p=Path('greasyfork/Account-Auditor.md')
s=p.read_text()
s=s.replace('**Current version: v1.1.1**','**Current version: v1.1.2**',1)
anchor='SakaLuX Account Auditor is a private read-only Torn PDA / Tampermonkey tool that builds a structured account snapshot and can sync it to a user-controlled private GitHub repository.\n\n'
block='''## v1.1.2\n\n- Added centralized API pacing (~900 ms minimum gap) for all Torn requests.\n- Added automatic retries with progressive backoff when Torn returns code 5 / Too many requests.\n- Messages, events and logs are now collected before the broad audit so private/high-value data is prioritized.\n- Reduced default private pagination from 20 pages to 5 for safer routine syncs.\n- Inventory, contacts and personal stats now use the same retry-aware scheduler.\n- Added exact backup: `backups/SakaLuX-Account-Auditor-v1.1.1.user.js`.\n\n'''
if block not in s:
    s=s.replace(anchor,anchor+block,1)
p.write_text(s)
