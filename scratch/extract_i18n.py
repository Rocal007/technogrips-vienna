import os
import re
import json
from html import unescape

strings = {}

def scan_file(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Match data-de="..." data-en="..."
    p1 = re.compile(r'data-de="([^"]*)"(?:\s+data-en="([^"]*)")?')
    for m in p1.finditer(content):
        de = unescape(m.group(1).strip())
        en = unescape(m.group(2).strip()) if m.group(2) else ''
        if de and de not in strings:
            strings[de] = en
            
    p2 = re.compile(r"data-de='([^']*)'(?:\s+data-en='([^']*)')?")
    for m in p2.finditer(content):
        de = unescape(m.group(1).strip())
        en = unescape(m.group(2).strip()) if m.group(2) else ''
        if de and de not in strings:
            strings[de] = en

for root, dirs, files in os.walk('dist'):
    for f in files:
        if f.endswith('.html') or f.endswith('.js'):
            scan_file(os.path.join(root, f))

print(f"Total unique data-de strings found: {len(strings)}")
with open('scratch/extracted_strings.json', 'w', encoding='utf-8') as out:
    json.dump(strings, out, ensure_ascii=False, indent=2)
print("Saved to scratch/extracted_strings.json")
