# FASE 1: Agregar custom_slug al JS
js_path = "backend/blog/static/blog/js/blog_editor/index.js"
with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

old = """        slug: document.getElementById('edit-slug').value,
        title: document.getElementById('title').value,"""
new = """        slug: document.getElementById('edit-slug').value,
        custom_slug: (document.getElementById('custom-slug')?.value || ''),
        title: document.getElementById('title').value,"""

if old in content:
    content = content.replace(old, new, 1)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("FASE 1 OK: custom_slug agregado al JS")
else:
    if "custom_slug" in content:
        print("FASE 1 OK: custom_slug ya existe en el archivo")
    else:
        print("ERROR: No se encontro el patron en JS")
