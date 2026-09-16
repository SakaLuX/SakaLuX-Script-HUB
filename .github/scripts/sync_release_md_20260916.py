from pathlib import Path
import re

updates = {
    'greasyfork/Account-Auditor.md': ('1.3.5', 'Performance/UI optimization: adds the shared SakaLuX performance foundation, reduces duplicate high-frequency UI work, and aligns controls/cards with the Hub visual language.'),
    'greasyfork/Bazaar-Thanker.md': ('5.3.26', 'Performance/UI optimization: reduces repeated DOM work on Torn/TornPDA redraws and aligns standalone controls with the shared SakaLuX Hub-style UI foundation.'),
    'greasyfork/Company-Intelligence.md': ('1.8.18', 'Performance/UI optimization: throttles expensive redraw paths and applies the shared Hub-style surface, controls, spacing and mobile-friendly visual foundation.'),
    'greasyfork/Elimination-Assistant.md': ('1.3.32', 'Performance/UI optimization: reduces duplicate observer-driven work and aligns assistant controls with the shared SakaLuX Hub-style UI foundation while preserving attack safety behavior.'),
    'greasyfork/Enhancer-Guard.md': ('1.3.34', 'Performance/UI optimization: uses the shared single-instance SakaLuX performance helpers, reduces repeated observer/render work and aligns the standalone UI with the Hub visual system.'),
    'greasyfork/Market-Intelligence.md': ('1.17.22', 'Performance/UI optimization: tunes high-frequency DOM/update paths and applies the shared SakaLuX Hub-style UI foundation across standalone controls without changing market logic.'),
    'greasyfork/Mission-Rewards.md': ('1.0.21', 'Performance/UI optimization: reduces unnecessary repeated DOM work and aligns Mission Rewards controls with the common SakaLuX Hub-style visual foundation.'),
    'greasyfork/SakaLuX-Suite.md': ('0.9.913', 'Performance/UI optimization: introduces the shared SakaLuX performance/UI foundation, reduces duplicate high-frequency rendering work and aligns Suite surfaces with the Hub visual language.'),
    'greasyfork/Script-Hub.md': ('1.9.42', 'Performance/UI optimization release: adds the shared single-instance SakaLuX performance foundation used across compatible scripts, synchronizes optimized module versions, and keeps the Hub as the canonical visual design reference.'),
    'experimental/Stock-Manager-Advisor.md': ('0.7.6', 'Performance/UI optimization: builds on the Stock Manager v0.7.5 SPA throttling with the shared SakaLuX performance/UI foundation so multiple SakaLuX scripts can coexist with less duplicate work and a consistent Hub-style interface.'),
}

def replace_current_version(text, version):
    patterns = [
        (r'(## Current version\s*\n\s*\*\*v)[^*]+(\*\*)', rf'\g<1>{version}\g<2>'),
        (r'(\*\*Current version:\s*v)[^*]+(\*\*)', rf'\g<1>{version}\g<2>'),
    ]
    for pat, rep in patterns:
        text2, n = re.subn(pat, rep, text, count=1, flags=re.I)
        if n:
            return text2
    return text

def replace_release_note(text, version, note):
    heading = re.search(r'## Current release note\s*\n', text, flags=re.I)
    block = f'## Current release note\n\n**v{version}** {note}\n\n'
    if not heading:
        insert_at = text.find('## Recommended')
        if insert_at >= 0:
            return text[:insert_at] + block + text[insert_at:]
        return text.rstrip() + '\n\n' + block
    start = heading.start()
    after = heading.end()
    nxt = re.search(r'\n##\s+', text[after:])
    end = after + nxt.start() + 1 if nxt else len(text)
    return text[:start] + block + text[end:]

def ensure_changelog(text, version, note):
    entry = f'### v{version}\n\n- {note}\n\n'
    if re.search(rf'^###\s+v{re.escape(version)}\b', text, flags=re.M):
        return text
    m = re.search(r'^## Changelog\s*\n', text, flags=re.M|re.I)
    if m:
        return text[:m.end()] + '\n' + entry + text[m.end():]
    return text.rstrip() + '\n\n## Changelog\n\n' + entry

for path_s, (version, note) in updates.items():
    p = Path(path_s)
    if not p.exists():
        raise SystemExit(f'Missing release md: {path_s}')
    text = p.read_text(encoding='utf-8')
    text = replace_current_version(text, version)
    text = replace_release_note(text, version, note)
    text = ensure_changelog(text, version, note)
    p.write_text(text, encoding='utf-8')

chat = Path('greasyfork/Chat-Intelligence.md')
if not chat.exists():
    chat.write_text('''# 💬 SakaLuX Chat Intelligence\n\n> Complementary add-on for SakaLuX Script Hub.\n\n## Current version\n**v1.2.9**\n\n## What it does\n- Enhances Torn chat with SakaLuX chat intelligence features.\n- Keeps its standalone behavior available when Script Hub is not installed.\n- Uses the shared SakaLuX performance and Hub-style UI foundation.\n\n## Current release note\n\n**v1.2.9** Performance/UI optimization: reduces duplicate high-frequency DOM work and aligns Chat Intelligence surfaces with the shared SakaLuX Hub-style UI foundation.\n\n## Recommended\n- Use together with SakaLuX Script Hub for consistent controls and status handling.\n\n## License\nAll Rights Reserved — SakaLuX [2380374].\n\n## Changelog\n\n### v1.2.9\n\n- Performance/UI optimization: reduces duplicate high-frequency DOM work and aligns Chat Intelligence surfaces with the shared SakaLuX Hub-style UI foundation.\n''', encoding='utf-8')

# Add a release-doc policy note to the audit so future updates treat MD sync as required.
audit = Path('PERFORMANCE-UI-AUDIT.md')
if audit.exists():
    text = audit.read_text(encoding='utf-8')
    marker = '## Release documentation policy'
    if marker not in text:
        text += '''\n## Release documentation policy\n\nEvery future userscript version bump must update its dedicated release/info Markdown in the same change: current version, current release note, changelog, and Hub registry/info references where applicable.\n'''
        audit.write_text(text, encoding='utf-8')
