"""Utility functions for handling filenames used by the blog importer.

Esta módulo contiene la lógica centralizada para **sanitizar nombres de archivos**
de imagen (y, en general, cualquier archivo estático) antes de guardarlos en
``static/blogs/<slug>/``.  La función está diseñada para ser reutilizada por
``BlogProcessor`` y por el comando ``import_blogs`` y, opcionalmente, por los
scripts de subida del editor.
"""

import re


def sanitizar_nombre(nombre: str) -> str:
    """Devuelve una versión segura del nombre de archivo.

    - Elimina espacios al inicio y al final.
    - Reemplaza los espacios internos por ``_``.
    - Elimina cualquier carácter que no sea alfanumérico, ``-``, ``_`` o ``.``.
    - Convierte a minúsculas para mantener consistencia (opcional pero útil).

    Ejemplo::

        >>> sanitizar_nombre('Mi Foto 2023.png')
        'mi_foto_2023.png'
    """
    if not isinstance(nombre, str):
        return str(nombre)

    # 1️⃣ Quitar espacios al inicio y al final
    nombre = nombre.strip()
    # 2️⃣ Reemplazar espacios internos por guión bajo
    nombre = re.sub(r"\s+", "_", nombre)
    # 3️⃣ Eliminar caracteres no permitidos (mantener alfanuméricos, - _ .)
    nombre = re.sub(r"[^\w.\-]", "", nombre)
    # 4️⃣ Normalizar a minúsculas (facilita comparaciones y URLs)
    nombre = nombre.lower()
    return nombre
