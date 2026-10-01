from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
JS=ROOT/'SakaLuX-Company-Intelligence-v1.0.0.user.js'
text=JS.read_text(encoding='utf-8')
if 'function cleanPositionName(raw){' not in text:
    anchor='function normalizedPositionDisplayName(raw){'
    helper="""function cleanPositionName(raw){
 let t=String(raw||'').replace(/\\s+/g,' ').trim();
 t=t.replace(/^[\\s:|·\\-–—]+|[\\s:|·\\-–—]+$/g,'').trim();
 return t.length<=100?t:'';
}
"""
    if anchor not in text: raise SystemExit('normalized position helper anchor not found')
    text=text.replace(anchor,helper+anchor,1)
    JS.write_text(text,encoding='utf-8')
    print('Restored cleanPositionName helper.')
else:
    print('cleanPositionName helper already present.')
