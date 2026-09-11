from pathlib import Path
p=Path(__file__).resolve().parent/'inline-footer-v2.py'
text=p.read_text(encoding='utf-8')
text=text.replace(r'[\s\S]{{0,550}}?', r'[\s\S]{0,550}?')
p.write_text(text,encoding='utf-8')
print('inline footer migration regex fixed')
