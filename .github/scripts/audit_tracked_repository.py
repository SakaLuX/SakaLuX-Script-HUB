#!/usr/bin/env python3
"""Audit the entire tracked Git tree without deleting files."""
import collections
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
paths = [p for p in subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().split("\0") if p]
tracked = set(paths)
errors, warnings = [], []
groups = collections.defaultdict(list)
for name in paths:
    file = ROOT / name
    if not file.is_file():
        errors.append(f"Tracked file unavailable: {name}")
        continue
    groups[hashlib.sha256(file.read_bytes()).hexdigest()].append(name)
    if re.search(r"(?:\.bak(?:\.|$)|\.orig$|~$|\.tmp$)", name, re.I):
        warnings.append(f"Tracked backup/temporary file: {name}")

duplicates = [v for v in groups.values() if len(v) > 1]
config = json.loads((ROOT / "release-config.json").read_text(encoding="utf-8"))
versions = []
for entry in config["scripts"]:
    filename, docname = entry["file"], entry["doc"]
    if filename not in tracked or docname not in tracked:
        errors.append(f"{entry['id']}: source or document missing: {filename}, {docname}")
        continue
    source = (ROOT / filename).read_text(encoding="utf-8", errors="replace")
    doc = (ROOT / docname).read_text(encoding="utf-8", errors="replace")
    match = re.search(r"(?m)^//\s*@version\s+(\S+)", source)
    version = match.group(1) if match else None
    current = re.search(r"(?m)^## Current version\s*\n\s*\*\*v([^*]+)\*\*", doc)
    documented = current.group(1) if current else None
    versions.append({"id": entry["id"], "source": version, "doc": documented})
    if not version or version != documented:
        errors.append(f"{entry['id']}: source version {version} != current MD version {documented}")

workflows = [x for x in paths if x.startswith(".github/workflows/") and x.endswith((".yml", ".yaml"))]
legacy_autopush = []
for name in workflows:
    text = (ROOT / name).read_text(encoding="utf-8")
    if re.search(r"(?m)^  push\s*:", text) and re.search(r"(?m)^  workflow_dispatch\s*:", text) and re.search(r"(?m)^\s*contents:\s*write\s*$", text):
        if name not in {".github/workflows/sakalux-release-sync.yml", ".github/workflows/release-gate.yml"}:
            legacy_autopush.append(name)
if legacy_autopush:
    errors.extend("Workflow retains unexpected push+write: " + f for f in legacy_autopush)

report = {"trackedFileCount": len(paths), "workflowCount": len(workflows),
          "identicalContentGroups": duplicates, "backupWarnings": warnings,
          "releaseConfigVersions": versions, "unexpectedAutoWriteWorkflows": legacy_autopush,
          "errors": errors}
print(json.dumps(report, ensure_ascii=False, indent=2))
if errors:
    sys.exit(1)
