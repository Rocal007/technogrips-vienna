import os
import re

def patch_file(file_path, replacements):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    initial = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    if content != initial:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched {file_path}")
    else:
        print(f"No changes in {file_path}")

print("=== Patching HTML CMS Bindings ===")
