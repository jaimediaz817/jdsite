import re


def _remove_no_import_blocks(content_md: str) -> str:
    """HU-20.A: Eliminar bloques ``:::no-import:::`` y sus cierres.

    En el editor se pueden marcar secciones como *no importables* usando
    ``:::no-import:::`` como apertura y ``:::final-no-import:::`` o
    ``:::final-niimport:::`` (error tipográfico histórico) como cierre.
    Esta función elimina todo el bloque, incluyendo ambas marcas, y también
    limpia cualquier marca suelta que pudiera quedar si sólo se había
    eliminado el cierre.
    """
    # 1️⃣ Eliminar bloques completos (apertura + contenido + cierre)
    block_pattern = (
        r":::no-import:::\n([\s\S]*?)\n:::(?:final-no-import|final-niimport):::"
    )
    stripped = re.sub(block_pattern, "", content_md)

    # 2️⃣ Eliminar marcas sueltas que pudieran quedar aisladas
    stripped = re.sub(r":::no-import:::", "", stripped)
    stripped = re.sub(r":::(?:final-no-import|final-niimport):::", "", stripped)

    # 3️⃣ Normalizar saltos de línea en blanco excesivos
    stripped = re.sub(r"\n{3,}", "\n\n", stripped)
    print(stripped.strip())


# Test case
md = """:::no-import:::\n![blocked image](image1.jpg)\n:::final-no-import:::\n\nNormal content."""
_remove_no_import_blocks(md)
