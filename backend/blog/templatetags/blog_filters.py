import random
from django import template
from django.conf import settings

register = template.Library()


@register.filter(name="blog_thumbnail")
def blog_thumbnail(post):
    """
    Custom Template Filter para obtener la imagen del post o una aleatoria por defecto
    Cacheca la imagen aleatoria por el ID del post para que no cambie en cada render
    """
    # Si el post tiene imagen propia, la devolvemos inmediatamente
    if hasattr(post, "cover_image") and post.cover_image:
        return post.cover_image

    # Usamos el ID del post como seed para tener siempre la MISMA imagen
    # para el mismo post, no cambia en cada refresh
    random.seed(post.id)

    # Lista de imagenes por defecto (definidas en settings)
    default_images = getattr(
        settings,
        "BLOG_DEFAULT_IMAGES",
        [
            "https://picsum.photos/seed/{}/800/450".format(post.id),
        ],
    )

    # Seleccionamos imagen aleatoria basada en el ID del post
    return random.choice(default_images)


@register.filter(name="tag_color")
def tag_color(tag_name):
    """
    Generate a consistent color for tags based on tag name.
    Returns a hex color code.
    """
    # Predefined color palette (tonos suaves, agradables)
    colors = [
        "#6f42c1",  # Purple
        "#0891b2",  # Teal
        "#e74c3c",  # Red
        "#2ecc71",  # Green
        "#f39c12",  # Orange
        "#9b59b6",  # Light Purple
        "#1abc9c",  # Mint
        "#3498db",  # Blue
        "#e67e22",  # Carrot
        "#95a5a6",  # Gray
    ]

    # Use hash of tag name to pick a consistent color
    color_index = sum(ord(c) for c in str(tag_name)) % len(colors)
    return colors[color_index]


@register.filter(name="tag_bg_color")
def tag_bg_color(tag_name):
    """
    Generate a light background color for tags.
    Returns a rgba value for subtle background.
    """
    # Hash the tag name to get consistent but varied colors
    hash_value = sum(ord(c) for c in str(tag_name))

    # Generate HSL-like colors with low saturation and high lightness
    hue = (hash_value * 137.508) % 360  # Golden ratio for distribution
    saturation = 40 + (hash_value % 30)  # 40-70%
    lightness = 85 + (hash_value % 10)  # 85-95%

    # Convert to hex (simplified)
    colors = [
        "#e8d5f5",  # Light Purple
        "#d5f5e8",  # Light Mint
        "#f5d5d5",  # Light Pink
        "#d5e8f5",  # Light Blue
        "#f5e8d5",  # Light Orange
        "#e8f5d5",  # Light Yellow
        "#d5f5f5",  # Light Cyan
        "#f0d5e8",  # Light Rose
        "#e8e8d5",  # Light Lime
        "#d5d5f5",  # Light Lavender
    ]
    return colors[hash_value % len(colors)]


@register.filter(name="tag_text_color")
def tag_text_color(tag_name):
    """
    Generate a darker text color that contrasts with the background.
    """
    hash_value = sum(ord(c) for c in str(tag_name))
    text_colors = [
        "#6f42c1",  # Purple
        "#0891b2",  # Teal
        "#c0392b",  # Dark Red
        "#2980b9",  # Dark Blue
        "#d35400",  # Dark Orange
        "#8e44ad",  # Dark Purple
        "#16a085",  # Dark Mint
        "#2c3e50",  # Dark Blue-Gray
        "#7f8c8d",  # Gray
        "#6c5ce7",  # Medium Purple
    ]
    return text_colors[hash_value % len(text_colors)]


@register.filter(name="naturaltime_es")
def naturaltime_es(value):
    """
    Traduce timesince de Django a formato relativo amigable en español.
    Uso: {{ comment.created_at|naturaltime_es }}
    Salidas: 'hace 5 min', 'hace 3 h', 'hace 2 días', 'hace 1 mes', etc.
    """
    if not value:
        return ""

    from django.utils.timesince import timesince
    from django.utils.timezone import now

    # Si la fecha es futura o muy antigua, mejor mostrar la fecha exacta
    if value > now():
        return value.strftime("%d %b %Y")

    delta_seconds = (now() - value).total_seconds()

    # Menos de 60 segundos
    if delta_seconds < 60:
        return "justo ahora"

    # Calculamos el timesince de Django y traducimos
    time_str = timesince(value)

    # Mapeo de traducciones
    # Mapeo de traducciones más completo
    translations = {
        "year": "año",
        "years": "años",
        "month": "mes",
        "months": "meses",
        "week": "semana",
        "weeks": "semanas",
        "day": "día",
        "days": "días",
        "hour": "hora",
        "hours": "horas",
        "minute": "minuto",
        "minutes": "minutos",
    }

    for eng, esp in translations.items():
        time_str = time_str.replace(eng, esp)

    # Limpiar espacios extra
    time_str = " ".join(time_str.split())

    return f"hace {time_str}"
