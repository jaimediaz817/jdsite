import hashlib
from typing import Tuple


def generate_avatar_seed(ip_address: str, commenter_name: str, secret: str = "jdsite_blog_secret") -> str:
    """
    Genera hash consistente para avatar basado en IP + nombre.

    Args:
        ip_address: Dirección IP del usuario (no se persiste)
        commenter_name: Nombre del comentarista
        secret: Palabra clave secreta para salt del hash

    Returns:
        Hash SHA256 de 64 caracteres (hexadecimal)

    Nota: Cada combinación IP + nombre genera el mismo hash siempre
    """
    data = f"{ip_address}:{commenter_name}:{secret}".encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def get_avatar_color(seed: str) -> str:
    """
    Extrae color hexadecimal consistente del seed.
    Usa primeros 6 caracteres del hash.

    Args:
        seed: Hash SHA256 generado por generate_avatar_seed()

    Returns:
        String con formato #RRGGBB

    Ejemplo: seed="abc123..." → "#abc123"
    """
    return f"#{seed[:6]}"


def get_avatar_initials(name: str) -> str:
    """
    Extrae iniciales del nombre (máximo 2 caracteres).

    Reglas:
    - Si nombre tiene 2+ palabras: Primera letra + primera letra última palabra
    - Si nombre tiene 1 palabra: Primeras 2 letras
    - Si nombre vacío: "?"

    Args:
        name: Nombre completo del comentarista

    Returns:
        String de máximo 2 caracteres en MAYÚSCULAS

    Ejemplos:
        "Juan Pérez" → "JP"
        "María" → "MA"
        "A B C D" → "AD"
        "" → "?"
    """
    name = name.strip()
    if not name:
        return "?"

    parts = name.split()

    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    else:
        return name[:2].upper()
