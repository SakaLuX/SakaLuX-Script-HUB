from pathlib import Path

repls = {
    'greasyfork/Company-Intelligence.md': {
        'synchronized at **v1.8.17**': 'synchronized at **v1.8.18**',
    },
    'greasyfork/Script-Hub.md': {
        'SakaLuX Company Intelligence **v1.8.17**': 'SakaLuX Company Intelligence **v1.8.18**',
        'currently registered at **v1.8.17**': 'currently registered at **v1.8.18**',
    },
}
for path, mapping in repls.items():
    p=Path(path)
    text=p.read_text(encoding='utf-8')
    for old,new in mapping.items():
        text=text.replace(old,new)
    p.write_text(text,encoding='utf-8')
