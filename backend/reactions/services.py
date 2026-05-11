from django.db import IntegrityError
from django.db.models import Count
from .models import BlogReaction, CommentReaction


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


def get_user_reactions(
    blog_slug: str, ip_address: str, user_id: int = None
) -> list:
    """
    Obtiene que reacciones ha dado un usuario a un blog.
    Si el usuario está autenticado se usa su ID, de lo contrario se usa la IP.
    """
    filters = {"blog_slug": blog_slug}
    if user_id:
        filters["user_id"] = user_id
    else:
        filters["ip_address"] = ip_address
    return list(
        BlogReaction.objects.filter(**filters).values_list(
            "reaction_type", flat=True
        )
    )


def toggle_reaction(
    blog_slug: str, ip_address: str, reaction_type: str, user_id: int = None
) -> bool:
    """
    Alterna una reacción: si existe la borra, si no existe la crea.
    Si el usuario está autenticado se usa su ID, de lo contrario se usa la IP.
    ✅ NUEVA REGLA: Solo se permite UNA reacción por usuario por blog.
    Al activar una nueva reacción se borran automáticamente todas las demás.
    """
    try:
        # Primero borramos CUALQUIER otra reacción que tenga el usuario en este blog
        filter_kwargs = {"blog_slug": blog_slug}
        if user_id:
            filter_kwargs["user_id"] = user_id
        else:
            filter_kwargs["ip_address"] = ip_address

        BlogReaction.objects.filter(**filter_kwargs).exclude(
            reaction_type=reaction_type
        ).delete()

        # Ahora alternamos la reacción solicitada
        filter_kwargs["reaction_type"] = reaction_type
        deleted, _ = BlogReaction.objects.filter(**filter_kwargs).delete()

        if deleted > 0:
            # Se borró correctamente, retornamos falso (desactivado)
            return False

        # No existía, creamos nueva
        BlogReaction.objects.create(
            blog_slug=blog_slug,
            ip_address=ip_address,
            reaction_type=reaction_type,
            user_id=user_id,
        )

        # Se creó correctamente, retornamos verdadero (activado)
        return True

    except IntegrityError:
        # Única razón para integrity error aquí es que otro request
        # acaba de crear exactamente la misma reacción.
        # En ese caso retornamos True como si nosotros la hubiéramos creado.
        return True


def get_comment_reaction_counts(comment_id: int) -> dict:
    """
    Obtiene el conteo de reacciones por tipo para un comentario.
    Funciona incluso si el comentario no existe o fue borrado.
    """
    counts = (
        CommentReaction.objects.filter(comment_id=comment_id)
        .values("reaction_type")
        .annotate(total=Count("id"))
    )

    result = {}
    for item in counts:
        result[item["reaction_type"]] = item["total"]

    return result


def get_user_comment_reactions(
    comment_id: int, ip_address: str, user_id: int = None
) -> list:
    """
    Obtiene que reacciones ha dado un usuario a un comentario.
    Si el usuario está autenticado se usa su ID, de lo contrario se usa la IP.
    """
    filters = {"comment_id": comment_id}
    if user_id:
        filters["user_id"] = user_id
    else:
        filters["ip_address"] = ip_address
    return list(
        CommentReaction.objects.filter(**filters).values_list(
            "reaction_type", flat=True
        )
    )


def toggle_comment_reaction(
    comment_id: int, ip_address: str, reaction_type: str, user_id: int = None
) -> bool:
    """
    Alterna una reacción en comentario: si existe la borra, si no existe la crea.
    Si el usuario está autenticado se usa su ID, de lo contrario se usa la IP.
    ✅ Solo se permite UNA reacción por usuario por comentario.
    Al activar una nueva reacción se borran automáticamente todas las demás.
    """
    try:
        # Primero borramos CUALQUIER otra reacción que tenga el usuario en este comentario
        filter_kwargs = {"comment_id": comment_id}
        if user_id:
            filter_kwargs["user_id"] = user_id
        else:
            filter_kwargs["ip_address"] = ip_address

        CommentReaction.objects.filter(**filter_kwargs).exclude(
            reaction_type=reaction_type
        ).delete()

        # Ahora alternamos la reacción solicitada
        filter_kwargs["reaction_type"] = reaction_type
        deleted, _ = CommentReaction.objects.filter(**filter_kwargs).delete()

        if deleted > 0:
            # Se borró correctamente, retornamos falso (desactivado)
            return False

        # No existía, creamos nueva
        CommentReaction.objects.create(
            comment_id=comment_id,
            ip_address=ip_address,
            reaction_type=reaction_type,
            user_id=user_id,
        )

        # Se creó correctamente, retornamos verdadero (activado)
        return True

    except IntegrityError:
        # Única razón para integrity error aquí es que otro request
        # acaba de crear exactamente la misma reacción.
        # En ese caso retornamos True como si nosotros la hubiéramos creado.
        return True
