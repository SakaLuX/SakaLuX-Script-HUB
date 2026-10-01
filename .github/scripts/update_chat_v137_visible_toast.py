#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CHAT = ROOT / 'SakaLuX-Chat-Intelligence.user.js'
DOC = ROOT / 'greasyfork' / 'Chat-Intelligence.md'
VERSION = '1.2.37'
MARKER = '/* SakaLuX Chat Intelligence visible-chat toast suppression v1.2.37 */'

text = CHAT.read_text(encoding='utf-8')

if MARKER not in text:
    old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    if not old_m:
        raise SystemExit('Chat Intelligence @version not found')
    old = old_m.group(1)

    text = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', text, count=1)
    text = re.sub(r"const\s+V='[^']+',ID='chat-intelligence'", f"const V='{VERSION}',ID='chat-intelligence'", text, count=1)
    text = text.replace(f"version:'{old}'", f"version:'{VERSION}'")
    text = text.replace(f'version:"{old}"', f'version:"{VERSION}"')

    decorate_marker = 'function decorate(r,e,first)'
    idx = text.find(decorate_marker)
    if idx < 0:
        raise SystemExit('decorate() not found')

    helper = '''function messageIsActuallyVisible(e){
 if(!e?.isConnected)return false;
 try{
  const cs=getComputedStyle(e);
  if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;
  const q=e.getBoundingClientRect();
  if(q.width<2||q.height<2)return false;
  if(q.bottom<=0||q.right<=0||q.top>=innerHeight||q.left>=innerWidth)return false;
  for(let n=e.parentElement;n&&n!==document.body;n=n.parentElement){
   const s=getComputedStyle(n);
   if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)===0)return false;
   const r=n.getBoundingClientRect();
   if((s.overflowY==='hidden'||s.overflowY==='auto'||s.overflowY==='scroll')&&(q.bottom<=r.top||q.top>=r.bottom))return false;
  }
  return true;
 }catch{return false}
}
'''
    text = text[:idx] + helper + text[idx:]

    old_cond = "if(first||!p.name||!allow(r)||M.has(pk(p))){rememberMessage(k);return}toast(r,(F.has(pk(p))?'★ ':'')+dn(p),b,k)"
    new_cond = "if(first||!p.name||!allow(r)||M.has(pk(p))||messageIsActuallyVisible(e)){rememberMessage(k);return}toast(r,(F.has(pk(p))?'★ ':'')+dn(p),b,k)"
    if old_cond not in text:
        raise SystemExit('notification condition anchor not found')
    text = text.replace(old_cond, new_cond, 1)

    text = text.replace('/* SakaLuX Shared Core — END */', '/* SakaLuX Shared Core — END */\n' + MARKER, 1)
    CHAT.write_text(text, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Suppress duplicate toast when the active chat message is already visible'
    bullets = [
        'Does not show a floating Chat Intelligence notification for a new message that is already visibly rendered inside the currently open chat window.',
        'Keeps notifications for minimized, hidden or off-screen chat conversations so unread activity can still be surfaced.',
        'Marks visible messages as seen to prevent the same message from producing a delayed duplicate toast after DOM rescans.'
    ]
    current = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + current.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?1\.2\.37(?:\s|—|-|$)', d):
        entry = '\n\n### v1.2.37 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Chat Intelligence v1.2.37 visible-chat toast suppression applied or already current.')
