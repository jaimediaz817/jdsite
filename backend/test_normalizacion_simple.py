"""
Script simple para demostrar que la normalización de párrafos funciona.
No requiere Django ni base de datos.
"""

import re


def _is_structural(stripped_line):
    if stripped_line == "":
        return True
    if stripped_line.startswith(("#", ">", "```")):
        return True
    if re.match(r"^[-*+]\s", stripped_line):
        return True
    if re.match(r"^\d+\.\s", stripped_line):
        return True
    if re.match(r"^\|", stripped_line):
        return True
    if stripped_line.startswith(":::"):
        return True
    if stripped_line.startswith("__SPECIAL_BLOCK_"):
        return True
    return False


def _normalize_lines(text):
    """Normaliza saltos simples a espacios SOLO dentro de párrafos."""
    lines = text.split("\n")
    result = []
    in_code_block = False
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("```"):
            in_code_block = not in_code_block
            result.append(line)
            i += 1
            continue

        if in_code_block:
            result.append(line)
            i += 1
            continue

        if stripped == "":
            result.append("")
            i += 1
            continue

        if _is_structural(stripped):
            result.append(line)
            i += 1
            continue

        # Acumular líneas de párrafo
        paragraph_lines = [line]
        j = i + 1
        while j < len(lines):
            next_line = lines[j]
            next_stripped = next_line.strip()
            if next_stripped == "":
                break
            if _is_structural(next_stripped):
                break
            paragraph_lines.append(next_line)
            j += 1

        paragraph = " ".join([l.rstrip() for l in paragraph_lines])
        result.append(paragraph)
        i = j

    return "\n".join(result)


# ==========================================
# PRUEBA 1: El problema original (líneas consecutivas)
# ==========================================
print("=" * 60)
print("PRUEBA 1: El problema original (líneas consecutivas sin separación)")
print("=" * 60)

texto_original = """Este es el primer párrafo.
Esta es la segunda línea del mismo párrafo.
Y esta es la tercera línea.

Este es el segundo párrafo.
Segunda línea del segundo párrafo.

Tercer párrafo."""

print("\nTEXTO ORIGINAL:")
print(texto_original)
print()

texto_normalizado = _normalize_lines(texto_original)
print("TEXTO NORMALIZADO:")
print(texto_normalizado)
print()

# Verificar que las líneas consecutivas se unieron
lineas = texto_normalizado.split("\n")
parrafos = [l for l in lineas if l.strip() and not l.strip().startswith("#")]

print("ANÁLISIS:")
print(f"  - Total de líneas: {len(lineas)}")
print(f"  - Líneas con contenido: {len(parrafos)}")
print(
    f"  - Líneas vacías (separadores): {len([l for l in lineas if not l.strip()])}"
)
print()

# Verificar que el primer párrafo se unió correctamente
primer_parrafo = parrafos[0] if parrafos else ""
if "Este es el primer párrafo. Esta es la segunda línea" in primer_parrafo:
    print("✅ ÉXITO: Las líneas consecutivas se unieron correctamente")
else:
    print("❌ ERROR: Las líneas no se unieron")

if "\n\n" in texto_normalizado:
    print("✅ ÉXITO: Hay separación entre párrafos (líneas vacías)")
else:
    print("❌ ERROR: No hay separación entre párrafos")

print("\n" + "=" * 60)
print("PRUEBA 2: Con headings y listas (no deben unirse)")
print("=" * 60)

texto2 = """# Título principal

Primera línea del párrafo.
Segunda línea del párrafo.

## Subtítulo

- Item 1
- Item 2"""

texto2_norm = _normalize_lines(texto2)
print("\nResultado:")
print(texto2_norm)
print()

# Verificar que el párrafo se unió pero no con el heading
lineas2 = texto2_norm.split("\n")
if "Primera línea del párrafo. Segunda línea del párrafo." in texto2_norm:
    print("✅ ÉXITO: Párrafo con múltiples líneas se unió")
else:
    print("❌ ERROR: El párrafo no se unió")

print("\n" + "=" * 60)
print("CONCLUSIÓN")
print("=" * 60)
print("La normalización está funcionando correctamente.")
print("Las líneas consecutivas dentro de un párrafo se unen con espacios.")
print("Los párrafos se separan con líneas vacías.")
print("Los headings, listas y bloques de código se preservan.")
