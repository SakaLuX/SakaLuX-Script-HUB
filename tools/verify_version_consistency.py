#!/usr/bin/env python3
"""Fail CI when the SakaLuX published module version metadata drifts."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
registry = json.loads((ROOT / "scripts.json").read_text(encoding="utf-8"))
hub = (ROOT / "SakaLuX-Script-Hub.user.js").read_text(encoding="utf-8")
errors = []

def version_match(text, pattern, label):
    found = re.search(pattern, text)
    if not found:
        errors.append("Missing " + label)
        return None
    return found.group(1)

hub_header = version_match(hub, r"(?m)^// @version\s+(\S+)", "Hub @version")
hub_internal = version_match(hub, r"const VERSION\s*=\s*['\"]([^'\"]+)", "Hub VERSION")
if hub_header != hub_internal:
    errors.append(f"Hub header={hub_header}, runtime={hub_internal}")

docs = {
    "enhancer": "Enhancer-Guard", "bazaar": "Bazaar-Thanker",
    "bazaar-smart-pricer": "Bazaar-Smart-Pricer",
    "mission-rewards": "Mission-Rewards",
    "market-intelligence": "Market-Intelligence",
    "bounty-hunter": "Bounty-Hunter",
    "elimination-assistant": "Elimination-Assistant",
    "company-intelligence": "Company-Intelligence",
    "stock-manager-advisor": "Stock-Manager-Advisor",
}

for module in registry["scripts"]:
    ident, expected = module["id"], module["version"]
    path = ROOT / module["sourceUrl"].rsplit("/", 1)[-1]
    source = path.read_text(encoding="utf-8")
    header = version_match(source, r"(?m)^// @version\s+(\S+)", ident + " header")
    internal = version_match(source, r"const SELF\s*=[^\n]*?version:\s*['\"]([^'\"]+)", ident + " SELF.version")
    offset = hub.find('"id": "' + ident + '"')
    end = hub.find("\n            }", offset)
    if offset < 0 or end < 0:
        errors.append(ident + " missing in Hub offline registry")
        embedded = []
    else:
        embedded = re.findall(r'"version": "([^"]+)"', hub[offset:end])
    document = (ROOT / "greasyfork" / (docs[ident] + ".md")).read_text(encoding="utf-8")
    current_doc = version_match(document, r"## Current version\s*\n\*\*v([^*]+)\*\*", ident + " documentation")
    release = module.get("release", {}).get("version")
    notes = ROOT / "releases" / f"{ident}-v{expected}-version-audit-2026-10-10.md"
    versions = {"header": header, "runtime": internal, "manifest release": release, "docs": current_doc}
    for label, value in versions.items():
        if value != expected:
            errors.append(f"{ident} {label}={value!r}, expected {expected}")
    if not embedded or any(v != expected for v in embedded):
        errors.append(f"{ident} Hub versions={embedded!r}, expected {expected}")
    if not notes.exists():
        errors.append(f"{ident}: missing audit release note {notes.relative_to(ROOT)}")

hub_docs = (ROOT / "greasyfork" / "Script-Hub.md").read_text(encoding="utf-8")
if version_match(hub_docs, r"## Current version\s*\n\*\*v([^*]+)\*\*", "Hub docs") != hub_header:
    errors.append("Hub documentation version differs from Hub @version")

if errors:
    raise SystemExit("Version audit failed:\n" + "\n".join("- " + e for e in errors))
print("PASS: nine modules and Hub have consistent current-version metadata.")
