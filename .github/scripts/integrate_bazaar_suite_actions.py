#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[2]
BAZAAR = ROOT / 'SakaLuX-Bazaar-Thanker-PDA.user.js'
SUITE = ROOT / 'SakaLuX-Suite.user.js'
REGISTRY = ROOT / 'scripts.json'
SENTINEL_BAZAAR = 'SakaLuX Bazaar ↔ Suite Event Actions — BAZAAR v1'
SENTINEL_SUITE = 'SakaLuX Bazaar ↔ Suite Event Actions — SUITE v1'


def header_version(text: str) -> str:
    m = re.search(r'(?m)^//\s*@version\s+(\S+)', text)
    if not m:
        raise RuntimeError('Missing @version')
    return m.group(1)


def bump_patch(v: str) -> str:
    parts = v.split('.')
    if not all(p.isdigit() for p in parts):
        raise RuntimeError(f'Non numeric version: {v}')
    while len(parts) < 3:
        parts.append('0')
    parts[-1] = str(int(parts[-1]) + 1)
    return '.'.join(parts)


def replace_header_version(text: str, new: str) -> str:
    return re.sub(r'(?m)^(//\s*@version\s+)\S+', lambda m: m.group(1) + new, text, count=1)


# ---- Bazaar Thanker -------------------------------------------------------
bazaar = BAZAAR.read_text(encoding='utf-8')
if SENTINEL_BAZAAR not in bazaar:
    old = header_version(bazaar)
    new = bump_patch(old)
    bazaar = replace_header_version(bazaar, new)

    # Keep every runtime version surface aligned with the userscript header.
    bazaar = re.sub(r"(let\s+v\s*=\s*['\"])" + re.escape(old) + r"(['\"])", rf"\g<1>{new}\2", bazaar, count=1)
    bazaar = re.sub(r"(\{version:['\"])" + re.escape(old) + r"(['\"]\}\))", rf"\g<1>{new}\2", bazaar, count=1)
    bazaar = re.sub(r"const\s+BAZAAR_VERSION\s*=\s*['\"][^'\"]+['\"]\s*;", f"const BAZAAR_VERSION='{new}';", bazaar, count=1)

    # Remove only the small clipboard button shown after DETAILS in Bazaar Thanker.
    copy_block = re.compile(
        r"\n\s*const copyButton = document\.createElement\('button'\);"
        r".*?"
        r"\n\s*};\n\n\s*const info = document\.createElement\('span'\);",
        re.S,
    )
    if not copy_block.search(bazaar):
        raise RuntimeError('Bazaar copy button block not found')
    bazaar = copy_block.sub("\n\n        /* " + SENTINEL_BAZAAR + " */\n        const info = document.createElement('span');", bazaar, count=1)
    bazaar = bazaar.replace("\n        topRow.appendChild(copyButton);", "", 1)
    BAZAAR.write_text(bazaar, encoding='utf-8')

    # Keep registry release information current; permanent normalizer handles MD/Hub fallback too.
    registry = json.loads(REGISTRY.read_text(encoding='utf-8'))
    for row in registry.get('scripts', []):
        if row.get('id') == 'bazaar':
            row['version'] = new
            release = row.setdefault('release', {})
            release['version'] = new
            notes = release.get('notes') if isinstance(release.get('notes'), list) else []
            note = 'Integrates Bazaar Thanker actions with Suite Event Lens: removes the inline clipboard button and exposes Thanks/Details through the Suite action row when Bazaar Thanker is active.'
            if note not in notes:
                notes.insert(0, note)
            release['notes'] = notes
            break
    REGISTRY.write_text(json.dumps(registry, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

# ---- Suite Event Lens -----------------------------------------------------
suite = SUITE.read_text(encoding='utf-8')
if SENTINEL_SUITE not in suite:
    old = header_version(suite)
    new = bump_patch(old)
    suite = replace_header_version(suite, new)
    suite = re.sub(
        r"(\bconst\s+VERSION\s*=\s*['\"])" + re.escape(old) + r"(['\"]\s*;)",
        lambda m: m.group(1) + new + m.group(2),
        suite,
        count=1,
    )

    # Add Bazaar-action discovery helpers to Event Lens. DOM markers work across
    # userscript isolation boundaries in TornPDA/Violentmonkey.
    helper_anchor = "          const getNativeActionGroup = () => {\n"
    helper = f"""          /* {SENTINEL_SUITE} */
          const bazaarInstalled = () => Boolean(
              document.documentElement?.getAttribute('data-sakalux-installed-bazaar') ||
              document.querySelector('[data-slx-standalone-registration=\"bazaar\"]') ||
              document.getElementById('sakalux-module-bridge-bazaar')
          );
          const getBazaarThank = () =>
              getLiveRow()?.querySelector('.sakalux-thanks-button') || null;
          const getBazaarDetails = () =>
              getLiveRow()?.querySelector('.sakalux-bt-details-button') || null;
          const hasBazaarActions = () => Boolean(
              bazaarInstalled() && getBazaarThank() && getBazaarDetails()
          );
          const clickBazaarAction = selector => {{
              const button = getLiveRow()?.querySelector(selector) || null;
              if (!button) return false;
              button.click();
              button.blur?.();
              return true;
          }};
"""
    if helper_anchor not in suite:
        raise RuntimeError('Suite Event Lens helper anchor not found')
    suite = suite.replace(helper_anchor, helper + helper_anchor, 1)

    # Desktop/wide PDA: replace Copy with compact Thanks + Details proxies when
    # Bazaar Thanker is present. Save remains the existing native-star proxy.
    append_copy = """              target.appendChild(
                  copyButton
              );
"""
    replacement = """              if (hasBazaarActions()) {
                  const thankProxy = document.createElement('button');
                  thankProxy.className = 'ax-action-btn ax-bazaar-thanks';
                  thankProxy.type = 'button';
                  thankProxy.textContent = '🙏Thanks';
                  thankProxy.title = 'Bazaar Thanker: Thanks';
                  thankProxy.setAttribute('aria-label', 'Bazaar Thanker Thanks');
                  thankProxy.style.cssText = 'width:38px;min-width:38px;padding:0 2px;font-size:7px;line-height:1;';
                  thankProxy.addEventListener('click', event => {
                      event.preventDefault();
                      event.stopPropagation();
                      clickBazaarAction('.sakalux-thanks-button');
                  });

                  const detailsProxy = document.createElement('button');
                  detailsProxy.className = 'ax-action-btn ax-bazaar-details';
                  detailsProxy.type = 'button';
                  detailsProxy.textContent = '📋Details';
                  detailsProxy.title = 'Bazaar Thanker: Details';
                  detailsProxy.setAttribute('aria-label', 'Bazaar Thanker Details');
                  detailsProxy.style.cssText = 'width:43px;min-width:43px;padding:0 2px;font-size:7px;line-height:1;';
                  detailsProxy.addEventListener('click', event => {
                      event.preventDefault();
                      event.stopPropagation();
                      clickBazaarAction('.sakalux-bt-details-button');
                  });

                  target.style.gap = '2px';
                  target.appendChild(thankProxy);
                  target.appendChild(detailsProxy);
              } else {
                  target.appendChild(copyButton);
              }
"""
    if append_copy not in suite:
        raise RuntimeError('Suite desktop Copy append anchor not found')
    suite = suite.replace(append_copy, replacement, 1)

    # Narrow PDA: show a purpose-built three-button Suite toolbar and temporarily
    # hide Torn's native Copy/Save row while the Event Lens card is expanded.
    pda_anchor = """              const nativeIsExpanded = () => {
"""
    pda_helpers = """              const removeBazaarToolbar = () => {
                  slot.querySelector('.ax-bazaar-suite-toolbar')?.remove();
                  liveRow.classList.remove('ax-suite-bazaar-linked');
              };
              const syncBazaarToolbar = () => {
                  const thankNative = getBazaarThank();
                  const detailsNative = getBazaarDetails();
                  if (!bazaarInstalled() || !thankNative || !detailsNative) {
                      removeBazaarToolbar();
                      return false;
                  }

                  liveRow.classList.add('ax-suite-bazaar-linked');
                  let toolbar = slot.querySelector('.ax-bazaar-suite-toolbar');
                  if (!toolbar) {
                      toolbar = document.createElement('div');
                      toolbar.className = 'ax-bazaar-suite-toolbar';
                      toolbar.style.cssText = 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;margin-top:8px;box-sizing:border-box;';
                      toolbar.innerHTML = `
                          <button type="button" class="ax-bazaar-suite-thanks">🙏 Thanks</button>
                          <button type="button" class="ax-bazaar-suite-details">📋 Details</button>
                          <button type="button" class="ax-bazaar-suite-save">☆ Save</button>
                      `;
                      toolbar.querySelectorAll('button').forEach(button => {
                          button.style.cssText = 'min-width:0;height:40px;padding:0 7px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:#20262c;color:#d8dde2;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;gap:4px;';
                      });
                      toolbar.querySelector('.ax-bazaar-suite-thanks').addEventListener('click', event => {
                          event.preventDefault();
                          event.stopPropagation();
                          clickBazaarAction('.sakalux-thanks-button');
                          setTimeout(syncBazaarToolbar, 80);
                      });
                      toolbar.querySelector('.ax-bazaar-suite-details').addEventListener('click', event => {
                          event.preventDefault();
                          event.stopPropagation();
                          clickBazaarAction('.sakalux-bt-details-button');
                      });
                      toolbar.querySelector('.ax-bazaar-suite-save').addEventListener('click', event => {
                          event.preventDefault();
                          event.stopPropagation();
                          const nativeSave = getNativeSave();
                          nativeSave?.click();
                          nativeSave?.blur?.();
                          [80, 250, 600].forEach(delay => setTimeout(syncBazaarToolbar, delay));
                      });
                      slot.appendChild(toolbar);
                  }

                  const thanksButton = toolbar.querySelector('.ax-bazaar-suite-thanks');
                  const detailsButton = toolbar.querySelector('.ax-bazaar-suite-details');
                  const saveButton = toolbar.querySelector('.ax-bazaar-suite-save');
                  const nativeSave = getNativeSave();
                  const saved = isSaved(nativeSave);
                  const thanked = Boolean(thankNative.disabled) || /THANKED/i.test(thankNative.textContent || '');

                  thanksButton.textContent = thanked ? '✓ Thanked' : '🙏 Thanks';
                  thanksButton.disabled = thanked;
                  thanksButton.style.opacity = thanked ? '.72' : '1';
                  detailsButton.textContent = '📋 Details';
                  saveButton.textContent = saved ? '★ Save' : '☆ Save';
                  saveButton.style.color = saved ? '#f0c84b' : '#d8dde2';
                  return true;
              };

"""
    if pda_anchor not in suite:
        raise RuntimeError('Suite PDA helper anchor not found')
    suite = suite.replace(pda_anchor, pda_helpers + pda_anchor, 1)

    prepare_anchor = """                  if (buttons) {
                      buttons.classList.add(
                          'ax-pda-native-event-buttons'
                      );
"""
    # Keep existing code and call toolbar sync after native button preparation.
    if prepare_anchor not in suite:
        raise RuntimeError('Suite PDA prepare anchor not found')

    # Add sync call immediately after the button loop block by using the unique
    # end just before prepareNativeRow closes.
    loop_end = """                      ].forEach(button => {
                          button.removeAttribute(
                              'title'
                          );
                          button.setAttribute(
                              'data-is-tooltip-opened',
                              'false'
                          );
                      });
                  }
              };
"""
    loop_replacement = """                      ].forEach(button => {
                          button.removeAttribute(
                              'title'
                          );
                          button.setAttribute(
                              'data-is-tooltip-opened',
                              'false'
                          );
                      });
                  }
                  syncBazaarToolbar();
              };
"""
    if loop_end not in suite:
        raise RuntimeError('Suite PDA prepare loop end not found')
    suite = suite.replace(loop_end, loop_replacement, 1)

    clear_anchor = """                  buttons
                      ?.querySelector(
                          '[class*=\"send\"]'
                      )
                      ?.classList.remove(
                          'ax-pda-native-event-send'
                      );
              };
"""
    clear_replacement = """                  buttons
                      ?.querySelector(
                          '[class*=\"send\"]'
                      )
                      ?.classList.remove(
                          'ax-pda-native-event-send'
                      );
                  removeBazaarToolbar();
              };
"""
    if clear_anchor not in suite:
        raise RuntimeError('Suite PDA clear anchor not found')
    suite = suite.replace(clear_anchor, clear_replacement, 1)

    # Hide the original two native action buttons only while the three-button
    # Bazaar toolbar is active inside Suite.
    css_anchor = """              .ax-pda-native-event-content {
                  display: none !important;
              }
"""
    css_extra = """              .ax-suite-bazaar-linked .ax-pda-native-event-buttons {
                  display: none !important;
              }
"""
    if css_anchor not in suite:
        raise RuntimeError('Suite PDA CSS anchor not found')
    suite = suite.replace(css_anchor, css_anchor + css_extra, 1)

    SUITE.write_text(suite, encoding='utf-8')

print('Bazaar Thanker ↔ Suite Event Lens integration applied.')
