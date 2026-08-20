import os
import re
from html.parser import HTMLParser

class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.untranslated = []

    def handle_starttag(self, tag, attrs):
        attr_dict = dict(attrs)
        self.stack.append((tag, attr_dict))

    def handle_endtag(self, tag):
        if self.stack:
            self.stack.pop()

    def handle_data(self, data):
        text = data.strip()
        if not text or len(text) < 3:
            return
        if self.stack:
            tag, attrs = self.stack[-1]
            if tag in ['script', 'style', 'noscript']:
                return
            # Check if current tag or any parent has data-de
            has_data_de = any('data-de' in a for t, a in self.stack)
            if not has_data_de and not text.startswith('<!--') and not text.isdigit():
                # Ignore numbers or purely symbolic / icon strings
                if re.search(r'[a-zA-ZäöüÄÖÜß]', text):
                    self.untranslated.append((tag, text))

for path in ['dist/kontakt/index.html', 'dist/leistungen/index.html', 'dist/supertechno-50/index.html', 'dist/tracking/index.html', 'dist/ueber-uns/index.html']:
    parser = TextExtractor()
    with open(path, 'r', encoding='utf-8') as f:
        parser.feed(f.read())
    print(f'=== {path} untranslated strings ({len(parser.untranslated)}) ===')
    for tag, t in parser.untranslated[:15]:
        print(f'  <{tag}>: {t}')
