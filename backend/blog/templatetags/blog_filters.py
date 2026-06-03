from django import template
from django.utils import timezone

register = template.Library()


@register.filter
def naturaltime_es(value):
    """Devuelve una cadena como “hace 5 minutos”, “hace 2 horas” o “hace 3 días”. Asegura que tanto ``value`` como ``now`` sean timezone‑aware."""
    now = timezone.localtime()
    if timezone.is_naive(value):
        value = timezone.make_aware(value, timezone.get_current_timezone())
    else:
        value = timezone.localtime(value)
    delta = now - value
    if delta.days > 0:
        return f"hace {delta.days} días"
    elif delta.seconds >= 3600:
        hours = delta.seconds // 3600
        return f"hace {hours} horas"
    else:
        minutes = delta.seconds // 60
        return f"hace {minutes} minutos"


@register.filter
def tag_bg_color(value):
    # Generar un color de fondo basado en el nombre del tag
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 85%)"


@register.filter
def tag_text_color(value):
    # Generar un color de texto basado en el nombre del tag
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 40%)"


@register.filter
def tag_color(value):
    # Generar un color para el ícono basado en el nombre del tag
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 50%)"


@register.filter
def blog_thumbnail(post):
    """Devuelve la URL de la imagen de portada del blog post.
    ``cover_image`` es un ``CharField`` que ya contiene la ruta completa
    (ej: ``/static/blogs/test_blog/image.png``).
    Si no hay portada, devuelve una cadena vacía."""
    if not post:
        return ""
    return post.cover_image or ""


@register.simple_tag
def remove_param(request, param):
    """HU-017: Retorna la query string actual sin el parámetro especificado."""
    query = request.GET.copy()
    query.pop(param, None)
    return query.urlencode()
