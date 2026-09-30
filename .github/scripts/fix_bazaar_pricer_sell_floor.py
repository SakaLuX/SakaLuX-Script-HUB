from pathlib import Path

p = Path('SakaLuX-Bazaar-Smart-Pricer.user.js')
s = p.read_text(encoding='utf-8')

# Bump current release once.
s = s.replace('// @version      1.1.13', '// @version      1.1.14', 1)
s = s.replace('"version":"1.1.13"', '"version":"1.1.14"', 1)
s = s.replace('{ version: "1.1.13" }', '{ version: "1.1.14" }', 1)

# The Torn API exposes buy_price (what the player pays the city shop) and
# sell_price (what the city shop pays the player). The safety floor must use
# sell_price. Using buy_price can incorrectly force Bazaar prices up to the
# city purchase price, e.g. Kodachi $95,000 instead of its $80,000 sell floor.
old = "const cityShopFloor = Number(buyPrice) > 0 ? Number(buyPrice) : (Number(sellPrice) || 0);"
new = "const cityShopFloor = Number(sellPrice) || 0;"
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Pricing floor anchor not found')

old_border = "const cityFloor=(buyPrice>0?buyPrice:sellPrice); const borderColor = (cityFloor > 0 && newPrice === cityFloor) ? '#f0a35e' : '#4f8fe8';"
new_border = "const cityFloor=Number(sellPrice)||0; const borderColor = (cityFloor > 0 && newPrice === cityFloor) ? '#f0a35e' : '#4f8fe8';"
if old_border in s:
    s = s.replace(old_border, new_border, 1)

s = s.replace('Never price below Torn City shop buy price', 'Never price below Torn City shop sell price', 1)
s = s.replace('NPC sell price unless the user disabled floor enforcement', 'NPC sell price unless the user disabled floor enforcement', 1)

# Force stale cached pricing data to clear once after the logic correction.
s = s.replace("market-value-city-floor-v1", "market-value-city-sell-floor-v2")

p.write_text(s, encoding='utf-8')
