import os
import re

def update_tracking_file(fpath):
    if not os.path.exists(fpath):
        return
    with open(fpath, 'r', encoding='utf-8') as f:
        c = f.read()

    # Vollbild buttons
    c = c.replace('<span id="fullscreen3dBtnText">Vollbild</span>', '<span id="fullscreen3dBtnText" data-de="Vollbild" data-en="Fullscreen" data-fr="Plein écran" data-cs="Celá obrazovka">Vollbild</span>')
    c = c.replace('<span id="fullscreenKranCamBtnText">Vollbild</span>', '<span id="fullscreenKranCamBtnText" data-de="Vollbild" data-en="Fullscreen" data-fr="Plein écran" data-cs="Celá obrazovka">Vollbild</span>')

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(c)
    print(f'Updated {fpath}')

for p in ['dist/tracking/index.html', 'public/tracking/index.html', 'dist/kran-test/index.html', 'public/kran-test/index.html']:
    update_tracking_file(p)
