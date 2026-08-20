import shutil
import os

files_to_copy = [
    ('public/admin/admin_content.html', 'dist/admin/admin_content.html'),
    ('public/assets/js/shared.js', 'dist/assets/js/shared.js'),
    ('public/index.html', 'dist/index.html'),
    ('public/ueber-uns/index.html', 'dist/ueber-uns/index.html'),
    ('public/leistungen/index.html', 'dist/leistungen/index.html'),
    ('public/supertechno-50/index.html', 'dist/supertechno-50/index.html'),
    ('public/kontakt/index.html', 'dist/kontakt/index.html'),
    ('public/tracking/index.html', 'dist/tracking/index.html'),
    ('public/impressum/index.html', 'dist/impressum/index.html'),
    ('public/datenschutz/index.html', 'dist/datenschutz/index.html'),
    ('public/agb/index.html', 'dist/agb/index.html'),
    ('public/sitemap.xml', 'dist/sitemap.xml'),
    ('public/api/db/data.sqlite', 'dist/api/db/data.sqlite'),
    ('public/api/leads.php', 'dist/api/leads.php'),
    ('public/api/db.php', 'dist/api/db.php'),
    ('public/api/booking.php', 'dist/api/booking.php'),
    ('public/assets/docs/supertechno_50_plus_manual.pdf', 'dist/assets/docs/supertechno_50_plus_manual.pdf'),
    ('public/assets/docs/supertechno_50_plus_weights.pdf', 'dist/assets/docs/supertechno_50_plus_weights.pdf'),
    ('public/downloads/supertechno-50-manual.pdf', 'dist/downloads/supertechno-50-manual.pdf'),
    ('public/downloads/supertechno-50-weights.pdf', 'dist/downloads/supertechno-50-weights.pdf'),
]

for src, dst in files_to_copy:
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"Copied {src} -> {dst}")

print("Synchronization to dist/ completed successfully!")
