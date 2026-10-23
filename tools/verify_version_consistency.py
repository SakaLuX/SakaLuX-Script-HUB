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
    internal = None if ident == "gym-optimizer" else version_match(source, r"const SELF\s*=[^\n]*?version:\s*['\"]([^'\"]+)", ident + " SELF.version")
    # Parse the embedded Hub fallback as JSON rather than scanning through later modules.
    marker = '    const FALLBACK_REGISTRY = '
    terminator = '\n\n    const FALLBACK_MODULE_DETAILS = '
    start = hub.find(marker)
    stop = hub.find(terminator, start)
    if start < 0 or stop < 0:
        errors.append("Hub fallback registry not found")
        embedded = []
    else:
        fallback = json.loads(hub[start + len(marker):stop])
        record = next((m for m in fallback.get("scripts", []) if m.get("id") == ident), None)
        if record is None:
            errors.append(ident + " missing in Hub offline registry")
            embedded = []
        else:
            embedded = [record.get("version"), record.get("release", {}).get("version")]
    if ident == "gym-optimizer":
        if header != expected or module.get("release", {}).get("version") != expected:
            errors.append(f"gym-optimizer: metadata mismatch with registry version {expected}")
        if not embedded or any(v != expected for v in embedded):
            errors.append(f"gym-optimizer: Hub versions={embedded!r}, expected {expected}")
        meta = (ROOT / "SakaLuX-Gym-Optimizer.meta.js").read_text(encoding="utf-8")
        if version_match(meta, r"(?m)^// @version\s+(\S+)", "Gym meta @version") != expected:
            errors.append("gym-optimizer: meta version drift")
        continue
    document = (ROOT / "greasyfork" / (docs[ident] + ".md")).read_text(encoding="utf-8")
    current_doc = version_match(document, r"## Current version\s*\n\*\*v([^*]+)\*\*", ident + " documentation")
    release = module.get("release", {}).get("version")
    notes = list((ROOT / "releases").glob(f"{ident}-v{expected}-version-audit-*.md"))
    versions = {"header": header, "runtime": internal, "manifest release": release, "docs": current_doc}
    for label, value in versions.items():
        if value != expected:
            errors.append(f"{ident} {label}={value!r}, expected {expected}")
    if not embedded or any(v != expected for v in embedded):
        errors.append(f"{ident} Hub versions={embedded!r}, expected {expected}")
    if not notes:
        errors.append(f"{ident}: missing version audit release note for v{expected}")

hub_docs = (ROOT / "greasyfork" / "Script-Hub.md").read_text(encoding="utf-8")
if version_match(hub_docs, r"## Current version\s*\n\*\*v([^*]+)\*\*", "Hub docs") != hub_header:
    errors.append("Hub documentation version differs from Hub @version")

if errors:
    raise SystemExit("Version audit failed:\n" + "\n".join("- " + e for e in errors))
print("PASS: nine modules and Hub have consistent current-version metadata.")
