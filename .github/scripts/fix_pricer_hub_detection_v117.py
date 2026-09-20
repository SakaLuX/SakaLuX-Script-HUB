#!/usr/bin/env python3
from pathlib import Path

p = Path('SakaLuX-Bazaar-Smart-Pricer.user.js')
text = p.read_text(encoding='utf-8')

old_match = '// @match        https://www.torn.com/bazaar.php*'
new_match = '// @match        https://www.torn.com/*'
if old_match in text:
    text = text.replace(old_match, new_match, 1)
elif new_match not in text:
    raise SystemExit('Expected Smart Pricer @match not found')

text = text.replace('// @version      1.1.6', '// @version      1.1.7', 1)
text = text.replace("let v = '1.1.6';", "let v = '1.1.7';", 1)
text = text.replace("|| '1.1.5';", "|| '1.1.7';", 1)

needle = "(function() {\n    'use strict';\n"
guard = "(function() {\n    'use strict';\n\n    // The userscript runs on every Torn page so Script Hub can always see the\n    // canonical installed-version DOM marker above. Keep all Bazaar runtime\n    // work strictly scoped to the real Bazaar page.\n    if (location.pathname !== '/bazaar.php') return;\n"
if guard not in text:
    if needle not in text:
        raise SystemExit('Smart Pricer IIFE anchor not found')
    text = text.replace(needle, guard, 1)

p.write_text(text, encoding='utf-8')
print('Smart Pricer Hub detection fixed: global Torn marker + Bazaar-only runtime, v1.1.7')
