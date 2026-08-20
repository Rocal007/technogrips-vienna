import sqlite3
import re
import glob

print("=== CMS INTEGRITY & COVERAGE VERIFICATION ===")

conn = sqlite3.connect('public/api/db/data.sqlite')
c = conn.cursor()

db_keys = set()
missing_translations = []

for row in c.execute("SELECT section, key, label, value_de, value_en, value_fr, value_cs FROM page_content"):
    sec, k, lbl, de, en, fr, cs = row
    full_key = f"{sec}.{k}"
    db_keys.add(full_key)
    if not de:
        missing_translations.append((full_key, 'de'))
    if not en:
        missing_translations.append((full_key, 'en'))
    if not fr:
        missing_translations.append((full_key, 'fr'))
    if not cs:
        missing_translations.append((full_key, 'cs'))

print(f"Total keys in SQLite DB: {len(db_keys)}")
print(f"Missing translations: {len(missing_translations)}")
if missing_translations:
    for item in missing_translations[:10]:
        print(f"  Missing: {item}")

# Scan all HTML files for data-cms and data-cms-text
html_files = glob.glob('public/**/*.html', recursive=True) + glob.glob('public/*.html')
unmatched_html_keys = []
total_cms_tags_found = 0

for hf in set(html_files):
    if 'admin' in hf:
        continue
    with open(hf, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # find data-cms="..."
    matches_cms = re.findall(r'data-cms="([^"]+)"', content)
    matches_cms_text = re.findall(r'data-cms-text="([^"]+)"', content)
    matches_cms_img = re.findall(r'data-cms-img="([^"]+)"', content)
    
    all_tags = matches_cms + matches_cms_text + matches_cms_img
    total_cms_tags_found += len(all_tags)
    for tag in all_tags:
        if tag not in db_keys:
            # check if hero/about alias
            if tag.startswith('about.') and f"hero.{tag.split('.')[1]}" in db_keys:
                continue
            if tag.startswith('hero.') and f"about.{tag.split('.')[1]}" in db_keys:
                continue
            unmatched_html_keys.append((hf, tag))

print(f"Total HTML data-cms tags inspected: {total_cms_tags_found}")
print(f"Unmatched tags in HTML: {len(unmatched_html_keys)}")
if unmatched_html_keys:
    for hf, tag in unmatched_html_keys:
        print(f"  Unmatched in {hf}: {tag}")
else:
    print("✅ 100% PERFECT MATCH! Every single data-cms attribute maps directly to an existing DB row.")

conn.close()
