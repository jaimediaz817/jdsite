"""
Script para demostrar que la normalización de párrafos está funcionando.
"""

import sys

sys.path.append("backend")
from blog.management.commands.import_blogs import Command

cmd = Command()

# Texto de ejemplo con líneas consecutivas (el problema original)
texto_original = """Este es el primer párrafo.
Esta es la segunda línea del mismo párrafo.
Y esta es la tercera línea.

Este es el segundo párrafo.
Segunda línea del segundo párrafo.

Tercer párrafo."""

print("=" * 60)
print("TEXTO ORIGINAL (con líneas consecutivas sin separación):")
print("=" * 60)
print(texto_original)
print()

print("=" * 60)
print("TEXTO NORMALIZADO (con líneas en blanco entre párrafos):")
print("=" * 60)
texto_normalizado = cmd._normalize_lines(texto_original)
print(texto_normalizado)
print()

print("=" * 60)
print("ANÁLISIS:")
print("=" * 60)
lineas = texto_normalizado.split("\n")
parrafos = [l for l in lineas if l.strip()]
print(f"Total de líneas: {len(lineas)}")
print(f"Líneas con contenido (no vacías): {len(parrafos)}")
print(f"Líneas vacías (separadores): {len([l for l in lineas if not l.strip()])}")
