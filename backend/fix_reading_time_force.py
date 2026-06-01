"""
Script de diagnostico y reparacion HU-014: Bypassea TODO el sistema de import
de Python y lee el parser directamente del archivo .py (sin .pyc).
"""

import os
import sys
import shutil
from pathlib import Path

# Setup Django ANTES de cualquier import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")

# ✅ ELIMINAR TODO EL CACHE DE PYTHON PARA EL MODULO
BACKEND_DIR = Path(__file__).parent
PROJECT_DIR = BACKEND_DIR.parent
for root, dirs, files in os.walk(BACKEND_DIR):
    if "__pycache__" in dirs:
        cache_dir = Path(root) / "__pycache__"
        try:
            shutil.rmtree(cache_dir)
            print(f"[CACHE] Borrado: {cache_dir.relative_to(PROJECT_DIR)}")
        except Exception as e:
            print(f"[CACHE WARNING] No se pudo borrar {cache_dir}: {e}")
        dirs.remove("__pycache__")

# ✅ LIMPIAR sys.modules de cualquier version cacheada
mods_a_borrar = [
    k for k in sys.modules if "markdown_utils" in k or "importer" in k
]
for m in mods_a_borrar:
    del sys.modules[m]
print(f"[SYS.MODULES] Borrados {len(mods_a_borrar)} modulos del cache")

# ✅ AHORA SI importar Django
import django

django.setup()

# Verificar la version del parser LEYENDO EL ARCHIVO DIRECTAMENTE
markdown_utils_path = (
    BACKEND_DIR / "blog" / "utils" / "importer" / "markdown_utils.py"
)
src_directo = markdown_utils_path.read_text(encoding="utf-8")

# Detectar la version activa (ignorando comentarios y strings)
# Quitar comentarios de linea y de bloque
import re as _re

src_sin_comentarios = _re.sub(r"#.*", "", src_directo)
src_sin_comentarios = _re.sub(
    r'""".*?"""', "", src_sin_comentarios, flags=_re.DOTALL
)
src_sin_comentarios = _re.sub(
    r"'''.*?'''", "", src_sin_comentarios, flags=_re.DOTALL
)

if 'split("---"' in src_sin_comentarios:
    print(
        "\n[ERROR] El archivo markdown_utils.py tiene la version VIEJA (split ---)"
    )
    print(
        "Mostrando las primeras 10 lineas con 'split' (excluyendo comentarios):"
    )
    for i, line in enumerate(src_directo.split("\n"), 1):
        if "split" in line and "---" in line and not line.strip().startswith("#"):
            print(f"  Linea {i}: {line.strip()}")
    sys.exit(1)
elif "re.match" in src_sin_comentarios and "---" in src_sin_comentarios:
    print("\n[OK] Parser detectado: version CORREGIDA (usa regex)")
else:
    print("\n[UNKNOWN] No se pudo determinar la version del parser")
    print("Buscando 'tiempo_lectura' en el archivo:")
    if "tiempo_lectura" in src_directo:
        print("  -> 'tiempo_lectura' SÍ esta en el archivo")

# Importar el modulo con importlib para bypassear TODO cache
import importlib.util

spec = importlib.util.spec_from_file_location(
    "markdown_utils_FRESH",
    markdown_utils_path,
)
markdown_utils = importlib.util.module_from_spec(spec)
spec.loader.exec_module(markdown_utils)
print("[IMPORT] Modulo cargado con importlib (sin cache)")

from django.conf import settings
from blog.models import BlogPost

SOURCE_DIR = Path(settings.BASE_DIR) / "blogs_source"


def main():
    print("\n" + "=" * 60)
    print("ACTUALIZACION reading_time (HU-014)")
    print("=" * 60)

    # Paso 1: Listar blogs en BD
    blogs_bd = BlogPost.objects.all()
    print(f"\n[BD] Total blogs: {blogs_bd.count()}")

    # Paso 2: Listar archivos markdown
    print(f"\n[FS] Buscando .md en: {SOURCE_DIR}")
    md_files = list(SOURCE_DIR.glob("*/blog.md"))
    print(f"Encontrados: {len(md_files)} archivos blog.md")

    # Paso 3: Actualizar
    actualizados = 0
    for md_file in md_files:
        slug = md_file.parent.name
        try:
            _, frontmatter = markdown_utils.read_markdown_file(md_file)
            tiempo_lectura = frontmatter.get("tiempo_lectura")
            reading_time = frontmatter.get("reading_time")
            valor = tiempo_lectura or reading_time
            print(
                f"  [{slug}] frontmatter: tiempo_lectura={tiempo_lectura!r}, reading_time={reading_time!r}"
            )

            if valor is not None and str(valor).strip() != "":
                try:
                    valor_int = int(str(valor).strip())
                except (ValueError, TypeError):
                    print(f"    [SKIP] Valor invalido: {valor!r}")
                    continue
            else:
                valor_int = None

            try:
                blog = BlogPost.objects.get(slug=slug)
                blog.reading_time = valor_int
                blog.save(update_fields=["reading_time"])
                blog.refresh_from_db()
                print(f"    [OK] reading_time = {blog.reading_time}")
                actualizados += 1
            except BlogPost.DoesNotExist:
                print(f"    [SKIP] Blog no existe en BD")

        except Exception as e:
            print(f"  [ERROR] {slug}: {type(e).__name__}: {e}")

    print(f"\n{'=' * 60}")
    print(f"RESUMEN: {actualizados} blogs actualizados")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
