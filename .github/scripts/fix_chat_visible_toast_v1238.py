#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / 'SakaLuX-Chat-Intelligence.user.js'
DOC = ROOT / 'greasyfork' / 'Chat-Intelligence.md'
VERSION = '1.2.38'
MARKER = '/* SakaLuX Chat Intelligence active-chat toast suppression v1.2.38 */'

s = SCRIPT.read_text(encoding='utf-8')

if MARKER not in s:
    old_m = re.search(r'(?m)^//\s*@version\s+(\S+)', s)
    if not old_m:
        raise SystemExit('Chat Intelligence @version missing')
    old = old_m.group(1)
    s = re.sub(r'(?m)^(//\s*@version\s+)\S+', rf'\g<1>{VERSION}', s, count=1)
    s = re.sub(r"const V='[^']+',ID='chat-intelligence'", f"const V='{VERSION}',ID='chat-intelligence'", s, count=1)

    old_fn = '''function messageIsActuallyVisible(e){
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
}'''
    new_fn = '''function chatIsActivelyVisible(r,e){
 if(!r?.isConnected||!e?.isConnected)return false;
 if(document.visibilityState&&document.visibilityState!=='visible')return false;
 try{
  const rc=getComputedStyle(r),rr=r.getBoundingClientRect();
  if(rc.display==='none'||rc.visibility==='hidden'||Number(rc.opacity)===0)return false;
  if(rr.width<120||rr.height<120||rr.bottom<=0||rr.right<=0||rr.top>=innerHeight||rr.left>=innerWidth)return false;
  const c=composer().find(x=>rootFor(x)===r);
  if(!c||!c.isConnected)return false;
  const cc=getComputedStyle(c),cr=c.getBoundingClientRect();
  if(cc.display==='none'||cc.visibility==='hidden'||Number(cc.opacity)===0)return false;
  if(cr.width<80||cr.height<18||cr.bottom<=0||cr.right<=0||cr.top>=innerHeight||cr.left>=innerWidth)return false;
  const ec=getComputedStyle(e),er=e.getBoundingClientRect();
  if(ec.display==='none'||ec.visibility==='hidden'||Number(ec.opacity)===0)return false;
  if(er.width<2||er.height<2||er.bottom<=0||er.right<=0||er.top>=innerHeight||er.left>=innerWidth)return false;
  return true;
 }catch{return false}
}'''
    if old_fn not in s:
        raise SystemExit('v1.2.37 visibility function anchor not found')
    s = s.replace(old_fn, new_fn, 1)

    old_cond = "if(first||!p.name||!allow(r)||M.has(pk(p))||messageIsActuallyVisible(e)){rememberMessage(k);return}"
    new_cond = "if(first||!p.name||!allow(r)||M.has(pk(p))||chatIsActivelyVisible(r,e)){rememberMessage(k);return}"
    if old_cond not in s:
        raise SystemExit('decorate notification condition anchor not found')
    s = s.replace(old_cond, new_cond, 1)

    prior = '/* SakaLuX Chat Intelligence visible-chat toast suppression v1.2.37 */\n'
    if prior in s:
        s = s.replace(prior, prior + MARKER + '\n', 1)
    else:
        s = MARKER + '\n' + s

    SCRIPT.write_text(s, encoding='utf-8')

if DOC.exists():
    d = DOC.read_text(encoding='utf-8')
    d = re.sub(r'(?is)(##\s+Current version\s*\n+\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    d = re.sub(r'(?im)^(-\s*Canonical version:\s*\*\*v?)[^*\n]+(\*\*)', rf'\g<1>{VERSION}\2', d, count=1)
    title = 'Active-chat notification suppression recovery'
    bullets = [
        'Fixes v1.2.37 suppressing every new toast merely because the newly rendered message element was visible.',
        'Suppresses duplicate toasts only when the actual chat root and its composer are both visible and active on screen.',
        'Keeps notifications available for minimized, hidden or background chat states while avoiding duplicate popups over the conversation currently being read.'
    ]
    block = '## Current release note\n\n**v' + VERSION + ' — ' + title + '**\n' + '\n'.join('- ' + x for x in bullets) + '\n'
    m = re.search(r'(?is)##\s+Current release note\b.*?(?=\n##\s|\Z)', d)
    if m:
        d = d[:m.start()] + block.rstrip() + '\n' + d[m.end():]
    heading = re.search(r'(?im)^##\s+Release history\s*/\s*Changelog\s*$', d)
    if heading and not re.search(r'(?im)^###\s+v?1\.2\.38(?:\s|—|-|$)', d):
        entry = '\n\n### v1.2.38 — ' + title + '\n' + '\n'.join('- ' + x for x in bullets) + '\n'
        d = d[:heading.end()] + entry + d[heading.end():]
    DOC.write_text(d, encoding='utf-8')

print('Chat Intelligence v1.2.38 active-chat toast suppression fix applied or already current.')
