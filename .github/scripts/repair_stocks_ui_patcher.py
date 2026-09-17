from pathlib import Path
p=Path('.github/scripts/fix_stocks_mission_company_ui.py')
s=p.read_text()
old='''s, count = re.subn(\n    r"  function managerLauncher\\(\\) \\{.*?\\n  \\}\\n\\n  function restoreCache",\n    "  function managerLauncher() { $(\'#slx-stock-open\')?.remove(); }\\n\\n  function restoreCache",\n    s,\n    count=1,\n    flags=re.S,\n)'''
# Match the entire launcher up to whichever next top-level function follows it.
start="s, count = re.subn(\n    r\"  function managerLauncher\\(\\) \\{.*?\\n  \\}\\n\\n  function restoreCache\","
if start in s:
    begin=s.index(start)
    end=s.index("\nif count != 1:", begin)
    replacement='''s, count = re.subn(\n    r"  function managerLauncher\\(\\) \\{.*?\\n  \\}(?=\\n\\n  function )",\n    "  function managerLauncher() { $(\'#slx-stock-open\')?.remove(); }",\n    s,\n    count=1,\n    flags=re.S,\n)'''
    s=s[:begin]+replacement+s[end:]
else:
    # Idempotent fallback if the patcher layout has changed.
    s=s.replace(r'r"  function managerLauncher\(\) \{.*?\n  \}\n\n  function restoreCache"', r'r"  function managerLauncher\(\) \{.*?\n  \}(?=\n\n  function )"')
    s=s.replace('"  function managerLauncher() { $(\'#slx-stock-open\')?.remove(); }\\n\\n  function restoreCache"', '"  function managerLauncher() { $(\'#slx-stock-open\')?.remove(); }"')
p.write_text(s)
print('patcher repaired')
