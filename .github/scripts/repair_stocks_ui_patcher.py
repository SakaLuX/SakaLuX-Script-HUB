from pathlib import Path

p = Path('.github/scripts/fix_stocks_mission_company_ui.py')
s = p.read_text()

start_marker = '# Remove the old bottom floating launcher; the standalone Stocks entry is the launcher now.'
next_marker = "s = s.replace(\n    \"$('#slx-inline-api',card).onclick=()=>openPanelAt('#slx-stock-api');\""

start = s.find(start_marker)
end = s.find(next_marker, start if start >= 0 else 0)
if start < 0 or end < 0:
    raise SystemExit('Could not locate launcher patch block in main patcher')

replacement = r'''# Remove the old bottom floating launcher; the standalone Stocks entry is the launcher now.
launcher_start = s.find("  function managerLauncher() {")
if launcher_start < 0:
    raise SystemExit('Stock managerLauncher function missing')
launcher_end = s.find("\n\n  function ", launcher_start + len("  function managerLauncher() {"))
if launcher_end < 0:
    raise SystemExit('Could not locate function after Stock managerLauncher')
s = s[:launcher_start] + "  function managerLauncher() { $('#slx-stock-open')?.remove(); }" + s[launcher_end:]

'''

s = s[:start] + replacement + s[end:]
p.write_text(s)
print('patcher repaired with boundary-based launcher replacement')
