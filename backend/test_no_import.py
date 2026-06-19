"""
Test HU-20.A: Verificar que _remove_no_import_blocks funciona correctamente.
Simula la función exacta que está en blog_processor.py
"""

import re


def _remove_no_import_blocks(content_md):
    """Copia exacta de la función en blog_processor.py"""
    pattern = r":::no-import:::\n([\s\S]*?)\n:::final-no-import:::"
    stripped = re.sub(pattern, "", content_md)
    stripped = re.sub(r"\n{3,}", "\n\n", stripped)
    return stripped.strip()


tests_passed = 0
tests_failed = 0

# === TEST 1: Imagen individual envuelta ===
print("=" * 60)
print("TEST 1: Imagen individual envuelta en no-import")
print("=" * 60)
md1 = """![imagen-1.png](./imagen-1.png)
:::no-import:::
![imagen-2.png](./imagen-2.png)
:::final-no-import:::
![imagen-3.png](./imagen-3.png)"""
result1 = _remove_no_import_blocks(md1)
expected1 = """![imagen-1.png](./imagen-1.png)

![imagen-3.png](./imagen-3.png)"""
if result1 == expected1:
    print("OK TEST 1")
    tests_passed += 1
else:
    print("FAIL TEST 1")
    print(f"  Esperado:\n{expected1!r}")
    print(f"  Obtenido:\n{result1!r}")
    tests_failed += 1

# === TEST 2: Slides completo sin no-import (no debe cambiar) ===
print()
print("=" * 60)
print("TEST 2: Slides SIN no-import debe conservarse intacto")
print("=" * 60)
md2 = """Texto antes
:::slides
![Slide 1](image-1.png)
:::
Texto después"""
result2 = _remove_no_import_blocks(md2)
expected2 = """Texto antes
:::slides
![Slide 1](image-1.png)
:::
Texto después"""
if result2 == expected2:
    print("OK TEST 2")
    tests_passed += 1
else:
    print("❌ TEST 2 FALLÓ")
    print(f"  Esperado:\n{expected2!r}")
    print(f"  Obtenido:\n{result2!r}")
    tests_failed += 1

# === TEST 3: Slide completo envuelto en no-import (todo eliminar) ===
print()
print("=" * 60)
print("TEST 3: Slides COMPLETO envuelto en no-import (se elimina todo)")
print("=" * 60)
md3 = """Texto antes
:::no-import:::
:::slides
![Slide 1](image-1.png)
:::
:::final-no-import:::
Texto después"""
result3 = _remove_no_import_blocks(md3)
expected3 = "Texto antes\n\nTexto después"
if result3 == expected3:
    print("OK TEST 3")
    tests_passed += 1
else:
    print("❌ TEST 3 FALLÓ")
    print(f"  Esperado:\n{expected3!r}")
    print(f"  Obtenido:\n{result3!r}")
    tests_failed += 1

# === TEST 4: Popup gallery con una imagen envuelta ===
print()
print("=" * 60)
print("TEST 4: Popup gallery - solo la línea envuelta se elimina")
print("=" * 60)
md4 = """:::popup:gallery
![imagen-1.png](image-1.png)
:::no-import:::
![imagen-2.png](image-2.png)
:::final-no-import:::
:::"""
result4 = _remove_no_import_blocks(md4)
if (
    "image-2" not in result4
    and ":::popup:gallery" in result4
    and ":::final-no-import" not in result4
):
    print("OK TEST 4")
    tests_passed += 1
else:
    print("❌ TEST 4 FALLÓ")
    print(f"  Resultado: {result4!r}")
    tests_failed += 1

# === TEST 5: Múltiples referencias misma imagen ===
print()
print("=" * 60)
print("TEST 5: Múltiples referencias a misma imagen")
print("=" * 60)
md5 = """![misma.png](./misma.png)
:::no-import:::
![misma.png](./misma.png)
:::final-no-import:::
![misma.png](./misma.png)"""
result5 = _remove_no_import_blocks(md5)
lines = [l for l in result5.split("\n") if "misma" in l]
if len(lines) == 2:
    print("OK TEST 5")
    tests_passed += 1
else:
    print(f"❌ TEST 5 FALLÓ: quedaron {len(lines)} referencias, esperado 2")
    print(f"  Resultado: {result5!r}")
    tests_failed += 1

# === TEST 6: Sin bloques no-import en el texto ===
print()
print("=" * 60)
print("TEST 6: Texto sin no-import (no debe cambiar)")
print("=" * 60)
md6 = """# Título
Esto es un párrafo normal.
![imagen.png](./imagen.png)
Otro párrafo."""
result6 = _remove_no_import_blocks(md6)
expected6 = md6.strip()
if result6 == expected6:
    print("OK TEST 6")
    tests_passed += 1
else:
    print("❌ TEST 6 FALLÓ")
    print(f"  Esperado:\n{expected6!r}")
    print(f"  Obtenido:\n{result6!r}")
    tests_failed += 1

# === TEST 7: Video HTML envuelto ===
print()
print("=" * 60)
print("TEST 7: Video HTML envuelto en no-import")
print("=" * 60)
md7 = """Texto antes
:::no-import:::
<video src="./video.mp4" controls></video>
:::final-no-import:::
Texto después"""
result7 = _remove_no_import_blocks(md7)
expected7 = "Texto antes\n\nTexto después"
if result7 == expected7:
    print("OK TEST 7")
    tests_passed += 1
else:
    print("❌ TEST 7 FALLÓ")
    print(f"  Esperado:\n{expected7!r}")
    print(f"  Obtenido:\n{result7!r}")
    tests_failed += 1

# === TEST 8: Estructura HTML padre envuelta ===
print()
print("=" * 60)
print("TEST 8: Estructura HTML padre envuelta")
print("=" * 60)
md8 = """Texto
:::no-import:::
<div class="padre">
<div class="item">
<img src="./image.png" />
</div>
</div>
:::final-no-import:::
Fin"""
result8 = _remove_no_import_blocks(md8)
expected8 = "Texto\n\nFin"
if result8 == expected8:
    print("OK TEST 8")
    tests_passed += 1
else:
    print("❌ TEST 8 FALLÓ")
    print(f"  Esperado:\n{expected8!r}")
    print(f"  Obtenido:\n{result8!r}")
    tests_failed += 1

# === TEST 9: Múltiples bloques no-import ===
print()
print("=" * 60)
print("TEST 9: Múltiples bloques no-import")
print("=" * 60)
md9 = """![img1.png](./img1.png)
:::no-import:::
![img2.png](./img2.png)
:::final-no-import:::
![img3.png](./img3.png)
:::no-import:::
![img4.png](./img4.png)
:::final-no-import:::
![img5.png](./img5.png)"""
result9 = _remove_no_import_blocks(md9)
if (
    "img2" not in result9
    and "img4" not in result9
    and "img1" in result9
    and "img3" in result9
    and "img5" in result9
):
    print("OK TEST 9")
    tests_passed += 1
else:
    print("❌ TEST 9 FALLÓ")
    print(f"  Resultado: {result9!r}")
    tests_failed += 1

print()
print("=" * 60)
print(f"RESULTADOS: {tests_passed} pasaron, {tests_failed} fallaron")
print("=" * 60)
if tests_failed == 0:
    print("🎉 TODOS LOS TESTS PASARON")
else:
    print(f"⚠️ {tests_failed} test(s) FALLARON")
