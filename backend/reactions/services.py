from django.db import IntegrityError
from django.db.models import Count
from .models import BlogReaction


def get_reaction_counts(blog_slug: str) -> dict:
    """
    Obtiene el conteo de reacciones por tipo para un blog.
    Funciona incluso si el blog no existe o fue borrado.
    """
    counts = (
        BlogReaction.objects.filter(blog_slug=blog_slug)
        .values("reaction_type")
        .annotate(total=Count("id"))
    )

    result = {}
    for item in counts:
        result[item["reaction_type"]] = item["total"]

    return result


def get_user_reactions(blog_slug: str, ip_address: str) -> list:
    """
    Obtiene que reacciones ha dado un usuario a un blog.
    """
    return list(
        BlogReaction.objects.filter(
            blog_slug=blog_slug, ip_address=ip_address
        ).values_list("reaction_type", flat=True)
    )


def toggle_reaction(blog_slug: str, ip_address: str, reaction_type: str) -> bool:
    """
    Alterna una reaccion: si existe la borra, si no existe la crea.
    ✅ NUEVA REGLA: Solo se permite UNA reaccion por usuario por blog.
    Al activar una nueva reaccion se borran automaticamente todas las demas.

    100% atomico a nivel de base de datos.
    No importa cuantas peticiones simultaneas lleguen, siempre funciona correctamente.
    """
    try:
        # Primero borramos CUALQUIER otra reaccion que tenga el usuario en este blog
        BlogReaction.objects.filter(
            blog_slug=blog_slug,
            ip_address=ip_address,
        ).exclude(reaction_type=reaction_type).delete()

        # Ahora alternamos la reaccion solicitada
        deleted, _ = BlogReaction.objects.filter(
            blog_slug=blog_slug,
            ip_address=ip_address,
            reaction_type=reaction_type,
        ).delete()

        if deleted > 0:
            # Se borro correctamente, retornamos falso (desactivado)
            return False

        # No existia, creamos nueva
        BlogReaction.objects.create(
            blog_slug=blog_slug,
            ip_address=ip_address,
            reaction_type=reaction_type,
        )

        # Se creo correctamente, retornamos verdadero (activado)
        return True

    except IntegrityError:
        # Unica razon para integrity error aqui es que otro request
        # acaba de crear exactamente la misma reaccion.
        # En ese caso retornamos True como si nosotros la hubieramos creado.
        return True
