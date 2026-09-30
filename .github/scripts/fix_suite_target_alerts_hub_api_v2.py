#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SUITE = ROOT / 'SakaLuX-Suite.user.js'
DOC = ROOT / 'greasyfork' / 'SakaLuX-Suite.md'
MARKER = '/* SakaLuX Target Alerts Hub API + v2 Profile Fix v0.9.967 */'
VERSION = '0.9.967'

s = SUITE.read_text(encoding='utf-8')

if MARKER not in s:
    old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', s)
    if not old_m:
        raise SystemExit('Suite @version missing')
    old = old_m.group(1)
    s = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', s, count=1)
    s = re.sub(r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)", lambda m: m.group(1)+VERSION+m.group(2), s, count=1)

    old_key = '''    function getSharedApiKey() {\n        return String(\n            state.settings?.api?.key ||\n            context.settings?.api?.key ||\n            \"\"\n        ).trim();\n    }'''
    new_key = '''    function getSharedApiKey() {\n        let hubKey = \"\";\n        try {\n            if (typeof window.SakaLuXScriptHub?.getApiKey === \"function\") {\n                hubKey = String(window.SakaLuXScriptHub.getApiKey() || \"\").trim();\n            }\n        } catch {}\n        return String(\n            hubKey ||\n            state.settings?.api?.key ||\n            context.settings?.api?.key ||\n            \"\"\n        ).trim();\n    }'''
    if old_key not in s:
        raise SystemExit('getSharedApiKey anchor not found')
    s = s.replace(old_key, new_key, 1)

    # Replace the legacy v1 user profile call inside requestUserProfileImage with
    # the stable v2 /user/{id}/profile endpoint. Do this with a scoped regex so
    # formatting differences do not make the release normalizer brittle.
    profile_fn = re.search(r'(?s)(function\s+requestUserProfileImage\s*\([^)]*\)\s*\{.*?)(?=\n\s*function\s+|\n\s*async\s+function\s+)', s)
    if not profile_fn:
        raise SystemExit('requestUserProfileImage function not found')
    block = profile_fn.group(1)
    changed = block
    changed = changed.replace('https://api.torn.com/user/', 'https://api.torn.com/v2/user/')
    changed = re.sub(
        r'(`\$\{encodeURIComponent\(id\)\}`\s*\+)\s*`\?selections=profile`',
        r'`${encodeURIComponent(id)}/profile` +\n            `?striptags=true`',
        changed,
        count=1,
    )
    # Handle one-line/template formatting as a fallback.
    changed = changed.replace('${encodeURIComponent(id)}` +\n            `?selections=profile', '${encodeURIComponent(id)}/profile` +\n            `?striptags=true')
    if changed == block or '/profile' not in changed or 'api.torn.com/v2/user/' not in changed:
        raise SystemExit('Could not convert profile request to v2')
    s = s[:profile_fn.start(1)] + changed + s[profile_fn.end(1):]

    # v2 profile response is wrapped in { profile: ... } and exposes image.
    parse_pat = re.compile(r'(?s)const\s+profileImage\s*=\s*(.*?);\s*resolve\(typeof\s+profileImage\s*===\s*[\"\']string[\"\']\s*\?\s*profileImage\s*:\s*[\"\'][\"\']\);')
    pm = parse_pat.search(s)
    if not pm:
        raise SystemExit('profile image parser anchor not found')
    replacement = '''const profileImage =\n              data?.profile?.image ||\n              data?.image ||\n              data?.profile_image ||\n              data?.profile?.profile_image ||\n              \"\";\n          resolve(typeof profileImage === \"string\" ? profileImage : \"\");'''
    s = s[:pm.start()] + replacement + s[pm.end():]

    old_status = '''    function readApiListStatuses(entry) {\n        return {\n            activity: normaliseState(entry?.last_action?.status),\n            state: normaliseState(entry?.status?.state)\n        };\n    }'''
    new_status = '''    function readApiListStatuses(entry) {\n        const row = entry?.user || entry?.profile || entry || {};\n        return {\n            activity: normaliseState(row?.last_action?.status),\n            state: normaliseState(row?.status?.state)\n        };\n    }'''
    if old_status not in s:
        raise SystemExit('list status parser anchor not found')
    s = s.replace(old_status, new_status, 1)

    marker_anchor = '/* SakaLuX Target Alerts Async Repaint v0.9.966 */\n'
    if marker_anchor not in s:
        raise SystemExit('v0.9.966 marker not found')
    s = s.replace(marker_anchor, marker_anchor + MARKER + '\n', 1)
    SUITE.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Target Alerts Hub API bridge and Torn API v2 profile recovery'
    bullets = [
        'Reads the Torn API key directly from SakaLuX Script Hub through getApiKey(), fixing Target/Enemy lists that stayed on SYNC when the key existed only in Hub.',
        'Moves avatar hydration from the legacy v1 profile request to the current v2 user/{id}/profile endpoint and reads profile.image.',
        'Keeps the v2 contact-list status parser and adds tolerance for nested response rows while preserving the existing refresh-loop protection.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?0\.9\.967(?:\s|—|-|$)', d):
        entry = '\n\n### v0.9.967 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Suite Target Alerts Hub API/v2 profile fix applied or already current.')
