from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHAT = ROOT / 'SakaLuX-Chat-Intelligence.user.js'
DOC = ROOT / 'greasyfork' / 'Chat-Intelligence.md'

text = CHAT.read_text(encoding='utf-8')
original = text

text, n = re.subn(r'(?m)^(//\s*@version\s+)\S+', r'\g<1>1.2.24', text, count=1)
assert n == 1
text, n = re.subn(r"const V='[^']+',ID='chat-intelligence'", "const V='1.2.24',ID='chat-intelligence'", text, count=1)
assert n == 1

# Mark the control strip so Chat-specific CSS can outrank shared/global button rules.
old = "x.className='slx-head-controls';x._root=r;x.dataset.root=r.dataset.slxRootId;"
new = "x.className='slx-head-controls';x.dataset.sakaluxChatControls='1';x._root=r;x.dataset.root=r.dataset.slxRootId;"
assert old in text, 'control mount marker not found'
text = text.replace(old, new, 1)

# Replace the pill-style block with true native-like individual controls.
old_css = ".slx-head-controls{position:absolute!important;right:48px!important;top:50%!important;transform:translateY(-50%)!important;height:30px!important;display:flex!important;align-items:center!important;gap:2px!important;z-index:20!important;pointer-events:auto!important;margin:0!important;padding:0 2px!important;max-width:96px!important;background:rgba(20,24,29,.72)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:8px!important}.slx-head-controls button{all:unset!important;box-sizing:border-box!important;width:28px!important;min-width:28px!important;height:28px!important;display:grid!important;place-items:center!important;font-size:14px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border-radius:6px!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}.slx-head-controls button:active{background:rgba(255,255,255,.14)!important}.slx-head-controls button[hidden]{display:none!important}"
new_css = "body .slx-head-controls[data-sakalux-chat-controls=\"1\"]{position:absolute!important;right:50px!important;top:0!important;bottom:0!important;transform:none!important;width:auto!important;max-width:none!important;height:auto!important;display:flex!important;align-items:stretch!important;gap:0!important;z-index:2147483001!important;pointer-events:auto!important;margin:0!important;padding:0!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button{all:unset!important;box-sizing:border-box!important;display:grid!important;place-items:center!important;flex:0 0 34px!important;width:34px!important;min-width:34px!important;max-width:34px!important;height:100%!important;min-height:0!important;padding:0!important;margin:0!important;font-size:15px!important;line-height:1!important;color:#d9e0e6!important;background:transparent!important;border:0!important;border-left:1px solid rgba(255,255,255,.07)!important;border-radius:0!important;box-shadow:none!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button:first-child{border-left:0!important}body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button:active{background:rgba(255,255,255,.10)!important}body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button[hidden]{display:none!important}"
assert old_css in text, 'v1.2.23 controls css marker not found'
text = text.replace(old_css, new_css, 1)

# On very narrow chat headers keep the strip compact enough to preserve the player name and native close button.
insert_after = "body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button[hidden]{display:none!important}"
mobile = "@media(max-width:520px){body .slx-head-controls[data-sakalux-chat-controls=\"1\"]{right:48px!important}body .slx-head-controls[data-sakalux-chat-controls=\"1\"] button{flex-basis:30px!important;width:30px!important;min-width:30px!important;max-width:30px!important;font-size:14px!important}}"
assert insert_after in text
text = text.replace(insert_after, insert_after + mobile, 1)

CHAT.write_text(text, encoding='utf-8')

doc = DOC.read_text(encoding='utf-8')
doc = re.sub(r'(?m)^\*\*v[^*]+\*\*$', '**v1.2.24**', doc, count=1)
doc = re.sub(r'(?m)^- Verified: \*\*[^*]+\*\*$', '- Verified: **2026-09-29**', doc, count=1)
doc = re.sub(r'(?m)^- Canonical version: \*\*v[^*]+\*\*$', '- Canonical version: **v1.2.24**', doc, count=1)
current_note = "**v1.2.24 — Native Chat V3 control alignment fix**\n- Removes the black rounded control capsule visible in TornPDA chat headers.\n- Gives Chat Intelligence controls a dedicated high-specificity selector so shared/global SakaLuX button CSS cannot stretch them.\n- Renders Search / Maximize / Export as flat native-style header buttons immediately before Torn's close control.\n- Adds a narrower mobile sizing rule while preserving all restored v1.2.23 features."
doc = re.sub(r'(?s)(## Current release note\n\n).*?(\n\n## Release history / Changelog)', lambda m: m.group(1)+current_note+m.group(2), doc, count=1)
history = "\n### v1.2.24 — Native Chat V3 control alignment fix\n- Removed the pill/capsule background around Chat Intelligence header controls.\n- Added Chat-specific high-specificity CSS to defeat shared/global button stretching on TornPDA.\n- Kept Search, Maximize and Export as separate native-like controls beside the Torn close button.\n- Added compact mobile sizing and synchronized runtime/header versions.\n"
marker='## Release history / Changelog\n'
if history.strip() not in doc:
    doc = doc.replace(marker, marker + history, 1)
DOC.write_text(doc, encoding='utf-8')

print('Updated Chat Intelligence to v1.2.24')
