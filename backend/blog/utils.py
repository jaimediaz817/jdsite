import hashlib
from typing import Tuple

BLUE_PURPLE_PALETTE = [
    "#0891b2",  # cyan-blue
    "#0e7490",  # dark cyan
    "#1e40af",  # blue
    "#3730a3",  # indigo
    "#6f42c1",  # purple
    "#7c3aed",  # light purple
    "#3b82f6",  # bright blue
    "#6366f1",  # indigo-light
    "#0284c7",  # sky blue
    "#a855f7",  # violet
    "#2563eb",  # blue-600
    "#7e22ce",  # fuchsia
]


def generate_avatar_seed(
    ip_address: str, commenter_name: str, secret: str = "jdsite_blog_secret"
) -> str:
    """
    Genera hash consistente para avatar basado en IP + nombre.

    Args:
        ip_address: Dirección IP del usuario (no se persiste)
        commenter_name: Nombre del comentarista.
        secret: Palabra clave secreta para salt del hash.

    Returns:
        Hash SHA256 de 64 caracteres (hexadecimal).

    Nota: Cada combinación IP + nombre genera el mismo hash siempre.
    """
    data = f"{ip_address}:{commenter_name}:{secret}".encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def get_avatar_color(seed: str) -> str:
    """
    Extrae color de la paleta azul/morado basado en el seed.
    Usa el hash para seleccionar un color de la paleta fija.

    Args:
        seed: Hash SHA256 generado por generate_avatar_seed().

    Returns:
        String con formato #RRGGBB de la paleta azul/morado.
    """
    # Usar los primeros 2 caracteres del hash como número
    # para seleccionar un color de la paleta
    hex_value = int(seed[:2], 16)
    color_index = hex_value % len(BLUE_PURPLE_PALETTE)
    return BLUE_PURPLE_PALETTE[color_index]


def get_avatar_initials(name: str) -> str:
    """
    Extrae iniciales del nombre (máximo 2 caracteres).

    Reglas:
    - Si nombre tiene 2+ palabras: Primera letra + primera letra última palabra.
    - Si nombre tiene 1 palabra: Primeras 2 letras.
    - Si nombre vacío: "?".

    Args:
        name: Nombre completo del comentarista.

    Returns:
        String de máximo 2 caracteres en MAYÚSCULAS.

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


# ---------------------------------------------------------------------
# HU-026-B: Email propietario configurable desde dashboard
# ---------------------------------------------------------------------
def get_owner_email() -> str:
    """Retorna el email propietario para notificaciones.

    Prioridad:
    1. Busca en AdminConfig el valor con key='owner_email'
    2. Fallback a settings.OWNER_EMAIL

    Returns:
        str: Email del propietario o string vacío si no hay configuración
    """
    from django.conf import settings
    from .models import AdminConfig

    config = AdminConfig.objects.filter(key="owner_email").first()
    if config and config.value:
        return config.value
    return getattr(settings, "OWNER_EMAIL", "")
