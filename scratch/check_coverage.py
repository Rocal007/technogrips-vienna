import os
import re

targets = [
  'dist/index.html',
  'public/index.html',
  'dist/kontakt/index.html',
  'public/kontakt/index.html',
  'dist/leistungen/index.html',
  'public/leistungen/index.html',
  'dist/supertechno-50/index.html',
  'public/supertechno-50/index.html',
  'dist/tracking/index.html',
  'public/tracking/index.html',
  'dist/ueber-uns/index.html',
  'public/ueber-uns/index.html',
  'dist/kran-test/index.html',
  'public/kran-test/index.html'
]

for t in targets:
  if os.path.exists(t):
    with open(t, 'r', encoding='utf-8') as f:
      c = f.read()
    # Count data-de vs data-fr vs data-cs
    c_de = len(re.findall(r'data-de=', c))
    c_en = len(re.findall(r'data-en=', c))
    c_fr = len(re.findall(r'data-fr=', c))
    c_cs = len(re.findall(r'data-cs=', c))
    print(f'{t}: de={c_de}, en={c_en}, fr={c_fr}, cs={c_cs}')
