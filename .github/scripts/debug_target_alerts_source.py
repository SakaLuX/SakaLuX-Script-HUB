#!/usr/bin/env python3
from pathlib import Path
s = (Path(__file__).resolve().parents[2] / 'SakaLuX-Suite.user.js').read_text(encoding='utf-8')
for needle in ['hydrateMissingAvatars', 'pollAllLists', 'previousStatuses', 'profile_image', 'avatar']:
    print('\n===== NEEDLE:', needle, '=====')
    start = 0
    hits = 0
    while True:
        i = s.find(needle, start)
        if i < 0 or hits >= 8:
            break
        lo = max(0, i - 1800)
        hi = min(len(s), i + 3500)
        print(s[lo:hi])
        print('\n----- HIT END -----\n')
        hits += 1
        start = i + len(needle)
