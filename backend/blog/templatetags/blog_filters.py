import random
from django import template
from django.conf import settings
from django.utils import timezone

register = template.Library()


@register.filter(name="blog_thumbnail")
def blog_thumbnail(post):
    """Custom Template Filter para obtener la imagen del post o una aleatoria por defecto"""
    if hasattr(post, "cover_image") and post.cover_image:
        return post.cover_image
    random.seed(post.id)
    default_images = getattr(
        settings,
        "BLOG_DEFAULT_IMAGES",
        [
            "https://picsum.photos/seed/{}/800/450".format(post.id),
        ],
    )
    return random.choice(default_images)


@register.filter(name="tag_color")
def tag_color(tag_name):
    """Generate a consistent color for tags based on tag name. Returns a hex color code."""
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
    color_index = sum(ord(c) for c in str(tag_name)) % len(colors)
    return colors[color_index]


@register.filter(name="tag_bg_color")
def tag_bg_color(tag_name):
    """Generate a light background color for tags. Returns a rgba value for subtle background."""
    hash_value = sum(ord(c) for c in str(tag_name))
    # Generate HSL-like colors with low saturation and high lightness
    hue = (hash_value * 137.508) % 360  # Golden ratio for distribution
    saturation = 40 + (hash_value % 30)  # 40-70%
    lightness = 85 + (hash_value % 10)  # 85-95%
    colors = [
        "#e8d5f5",  # Light Purple
        "#d5f5e8",  # Light Mint
        "#f5d5d5",  # Light Pink
        "#d5e8f5",  # Light Blue
        "#f5e8d5",  # Light Orange
        "#d5f5f5",  # Light Yellow
        "#f0d5e8",  # Light Cyan
        "#e8e8d5",  # Light Rose
        "#d5d5f5",  # Light Lavender
    ]
    return colors[hash_value % len(colors)]


@register.filter(name="tag_text_color")
def tag_text_color(tag_name):
    """Generate a darker text color that contrasts with the background."""
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
    """Traduce timesince de Django a formato relativo amigable en español."""
    if not value:
        return ""
    from django.utils.timesince import timesince
    from django.utils.timezone import now

    if value > now():
        return value.strftime("%d %b %Y")
    delta_seconds = (now() - value).total_seconds()
    if delta_seconds < 60:
        return "justo ahora"
    time_str = timesince(value)
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
    time_str = " ".join(time_str.split())
    return f"hace {time_str}"


@register.filter
def date_es(value):
    """Formatea una fecha datetime a 'd de MMMM de YYYY' en español."""
    if not isinstance(value, timezone.datetime):
        return value
    months = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ]
    day = value.day
    month = months[value.month - 1]
    year = value.year
    return f"{day} de {month} de {year}"
