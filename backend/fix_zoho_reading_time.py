"""
HU-014: Script MINIMO para setear reading_time del blog de Zoho.
Lee el .md con grep basico, extrae tiempo_lectura, hace UPDATE en BD.
"""

import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

import django

django.setup()

from blog.models import BlogPost

# 1) Leer el .md con la opcion mas simple: open + read
md_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "blogs_source",
    "2026-04-24_por-que-las-integraciones-zoho-fallan",
    "blog.md",
)
print(f"Leyendo: {md_path}")

with open(md_path, "r", encoding="utf-8") as f:
    content = f.read()

# 2) Buscar 'tiempo_lectura:' o 'reading_time:' en las primeras 20 lineas
tiempo_lectura = None
for line in content.split("\n")[:25]:
    if line.strip().startswith("tiempo_lectura:") or line.strip().startswith(
        "reading_time:"
    ):
        # Extraer el valor (despues de los :)
        valor = line.split(":", 1)[1].strip()
        # Quitar comillas si las tiene
        valor = valor.strip('"').strip("'")
        tiempo_lectura = valor
        break

print(f"Valor encontrado: {tiempo_lectura!r}")

if not tiempo_lectura:
    print("ERROR: No se encontro tiempo_lectura en el frontmatter")
    sys.exit(1)

# 3) Convertir a int
try:
    valor_int = int(tiempo_lectura)
except (ValueError, TypeError):
    print(f"ERROR: Valor invalido: {tiempo_lectura!r}")
    sys.exit(1)

# 4) Hacer UPDATE en BD
print(
    f"\nActualizando BlogPost por slug 'por-que-las-integraciones-zoho-fallan'..."
)
blog = BlogPost.objects.get(slug="por-que-las-integraciones-zoho-fallan")
print(f"  Antes: reading_time = {blog.reading_time}")
blog.reading_time = valor_int
blog.save(update_fields=["reading_time"])
blog.refresh_from_db()
print(f"  Despues: reading_time = {blog.reading_time}")
print(f"\nEXITO! El blog de Zoho ahora tiene reading_time = {blog.reading_time}")
