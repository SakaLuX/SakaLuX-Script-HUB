#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path('.').resolve()

KEEP_WORKFLOWS = {
    'validate-userscripts.yml',
    'normalize-installed-versions.yml',
    'cleanup-repository-20260920.yml',
}
KEEP_SCRIPTS = {
    'validate_repository.py',
    'normalize_installed_versions.py',
    'fix_hub_launcher_font_audit.py',
    'cleanup_repository_20260920.py',
}

removed = []

def rm(path: Path):
    if not path.exists():
        return
    if path.is_dir():
        for child in path.rglob('*'):
            if child.is_file():
                removed.append(child.relative_to(ROOT).as_posix())
        shutil.rmtree(path)
    else:
        removed.append(path.relative_to(ROOT).as_posix())
        path.unlink()

# 1) Historical backups are already preserved in Git history and are not runtime dependencies.
rm(ROOT / 'backups')

# 2) Archived workflows / one-shot trigger files / diagnostics.
rm(ROOT / '.github' / 'workflow-archive')
for p in (ROOT / '.github').glob('*.trigger'):
    rm(p)
for name in ('oc-functions.txt', 'oc-scan-diagnostic.txt'):
    rm(ROOT / '.github' / name)

# 3) Keep only reusable maintenance/validation workflows.
wf_dir = ROOT / '.github' / 'workflows'
for p in wf_dir.glob('*.y*ml'):
    if p.name not in KEEP_WORKFLOWS:
        rm(p)

# 4) Keep only reusable maintenance/validation scripts.
sc_dir = ROOT / '.github' / 'scripts'
for p in sc_dir.glob('*'):
    if p.is_file() and p.name not in KEEP_SCRIPTS:
        rm(p)

# 5) Remove historical root audit/snapshot documents. Keep the live FONT audit because
# normalize-installed-versions explicitly regenerates/commits it.
root_junk = [
    'API-KEY-ARCHITECTURE-AUDIT-2026-09-19.md',
    'HUB-ISOLATION-AUDIT.md',
    'PERFORMANCE-UI-AUDIT.md',
    'RELEASE-PERFORMANCE-AUDIT-2026-09-17.md',
    'RELEASE-SURFACE-AUDIT-2026-09-18.md',
    'RELEASE-SURFACE-AUDIT-2026-09-19.md',
    'STANDALONE-AUDIT-2026-09-17.md',
]
for name in root_junk:
    rm(ROOT / name)

# 6) Remove generated patch fragments / diagnostics from releases while keeping human-readable release notes.
rel = ROOT / 'releases'
if rel.exists():
    for p in rel.iterdir():
        low = p.name.lower()
        if p.is_file() and ('.patch' in low or low.endswith('.diff') or 'diagnostic' in low or 'audit-' in low):
            rm(p)

# 7) Remove empty directories left behind.
for base in (ROOT / '.github' / 'scripts', ROOT / '.github' / 'workflows', ROOT / 'releases'):
    if base.exists():
        for d in sorted([x for x in base.rglob('*') if x.is_dir()], reverse=True):
            try:
                d.rmdir()
            except OSError:
                pass

# 8) Sanity checks: runtime/release sources that must never disappear.
required = [
    'scripts.json', 'locales.json', 'LICENSE',
    'SakaLuX-Script-Hub.user.js',
    'SakaLuX-Enhancer-Guard.user.js',
    'SakaLuX-Market-Intelligence.user.js',
    '.github/workflows/validate-userscripts.yml',
    '.github/workflows/normalize-installed-versions.yml',
    '.github/scripts/validate_repository.py',
    '.github/scripts/normalize_installed_versions.py',
    '.github/scripts/fix_hub_launcher_font_audit.py',
    'FONT-SAFETY-AUDIT-2026-09-18.md',
]
missing = [x for x in required if not (ROOT / x).exists()]
if missing:
    raise SystemExit('Cleanup would leave required files missing: ' + ', '.join(missing))

print(f'Removed {len(removed)} stale files.')
for name in removed:
    print(' -', name)
