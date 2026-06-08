import re

from django import template
from django.utils import timezone
from django.utils.html import strip_tags

register = template.Library()


# Patrones que pueden "leak" desde el frontmatter YAML dentro del
# ``content_html`` de algunos posts antiguos o importados con errores.
# Si el excerpt empieza con un bloque de frontmatter (title/description/date),
# esta regex lo detecta y lo elimina.
_FRONTMATTER_LIKE_RE = re.compile(
    r"^(?:[A-Za-z_][A-Za-z0-9_]*\s*:\s*['\"]?[^'\"\n]*['\"]?(?:\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*['\"]?[^'\"\n]*['\"]?)*\s*)+",
    re.MULTILINE,
)


@register.filter
def naturaltime_es(value):
    """Devuelve una cadena como "hace 5 minutos", "hace 2 horas" o "hace 3 días".
    Asegura que tanto ``value`` como ``now`` sean timezone-aware.
    """
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
def timesince_safe(value, fallback_attr=None):
    """Variante robusta de ``timesince`` que tolera ``None`` y datetimes naive.

    El filtro ``timesince`` de Django exige un datetime timezone-aware cuando
    ``USE_TZ=True``. Si el valor es ``None`` (por ejemplo, posts antiguos
    insertados antes de que existiera el campo ``created_at``), o si es un
    datetime naive, el filtro falla silenciosamente y la plantilla pinta
    "hace ..." sin el sufijo.

    Este filtro:
    1. Si ``value`` es ``None`` y se pasa ``fallback_attr`` (cadena con el
       nombre del atributo a leer del objeto), intenta leerlo dinámicamente.
    2. Convierte datetimes naive a aware usando ``timezone.get_current_timezone()``.
    3. Si ``value`` es una fecha futura (probable desfase horario), devuelve "hace unos segundos".
    4. Devuelve una cadena vacía solo si no hay forma de calcular nada,
       para que la UI no muestre "hace ..." roto.
    """
    from django.utils.timesince import timesince as django_timesince

    # 1) Si es None y hay fallback_attr, intentar leer el atributo del objeto
    if value is None and fallback_attr:
        value = getattr(fallback_attr, "__call__", lambda: None)()
        # fallback_attr podría llegar como string desde el template, en ese
        # caso lo ignoramos; el caller debe pasar el objeto directamente.
        if value is None:
            try:
                value = fallback_attr
            except Exception:
                return ""

    if value is None:
        return ""

    # 2) Normalizar a aware
    if hasattr(value, "tzinfo"):
        if timezone.is_naive(value):
            try:
                value = timezone.make_aware(
                    value, timezone.get_current_timezone()
                )
            except Exception:
                return ""
        else:
            value = timezone.localtime(value)

    # 3) Calcular diferencia
    try:
        delta_str = django_timesince(value, timezone.now())
        if not delta_str.strip():
            # Si el resultado está vacío (por ejemplo, valor en el futuro)
            return "hace unos segundos"
        return delta_str
    except Exception:
        return ""


@register.filter
def tag_bg_color(value):
    """Genera un color de fondo basado en el nombre del tag."""
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 85%)"


@register.filter
def tag_text_color(value):
    """Genera un color de texto basado en el nombre del tag."""
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 40%)"


@register.filter
def tag_color(value):
    """Genera un color para el ícono basado en el nombre del tag."""
    hash_value = hash(value) % 360
    return f"hsl({hash_value}, 70%, 50%)"


@register.filter
def blog_thumbnail(post):
    """Devuelve la URL de la imagen de portada del blog post.

    ``cover_image`` es un ``CharField`` que ya contiene la ruta completa
    (ej: ``/static/blogs/test_blog/image.png``).
    Si no hay portada, devuelve una cadena vacía.
    """
    if not post:
        return ""
    return post.cover_image or ""


@register.filter
def blog_excerpt(post, max_chars=140):
    """Devuelve un excerpt limpio y seguro del post para usar en cards/listas.

    Reglas:
    1. Si el post tiene ``description`` no vacía, se usa esa (es el campo
       pensado para tal fin y suele ser un resumen manual y limpio).
    2. Si no, se toma ``content_html`` y se le aplica ``strip_tags`` para
       eliminar cualquier HTML residual. Adicionalmente se elimina cualquier
       fragmento de frontmatter YAML que se haya colado al inicio del
       contenido (esto sucede en algunos posts antiguos cuyo
       ``content_html`` empieza con ``title: ... description: ...``).
    3. Se trunca a ``max_chars`` (por defecto 140) sin cortar palabras.
    4. Se colapsan espacios y saltos de línea múltiples en un solo espacio.

    El filtro es seguro frente a ``post`` None o a campos vacíos.
    """
    if not post:
        return ""

    # 1) Priorizar el campo ``description`` si está presente
    description = getattr(post, "description", None)
    if description:
        text = str(description).strip()
        if text:
            return _clean_excerpt(text, max_chars)

    # 2) Fallback: limpiar ``content_html``
    content_html = getattr(post, "content_html", None) or ""
    text = strip_tags(content_html).strip()
    if not text:
        return ""

    # Eliminar el leak de frontmatter YAML (al inicio del string)
    text = _FRONTMATTER_LIKE_RE.sub("", text, count=1).strip()
    if not text:
        return ""

    return _clean_excerpt(text, max_chars)


def _clean_excerpt(text, max_chars):
    """Normaliza y trunca un texto a ``max_chars`` sin cortar palabras."""
    # Colapsar todos los espacios/saltos de línea en un único espacio
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_chars:
        return text
    # Truncar respetando palabras completas
    truncated = text[:max_chars].rsplit(" ", 1)[0]
    return f"{truncated}…"


@register.simple_tag
def remove_param(request, param):
    """HU-017: Retorna la query string actual sin el parámetro especificado."""
    query = request.GET.copy()
    query.pop(param, None)
    return query.urlencode()
