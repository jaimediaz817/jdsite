import random
from django import template
from django.conf import settings

register = template.Library()


@register.filter(name="blog_thumbnail")
def blog_thumbnail(post):
    """
    Custom Template Filter para obtener la imagen del post o una aleatoria por defecto
    Cachea la imagen aleatoria por el ID del post para que no cambie en cada render
    """
    # Si el post tiene imagen propia, la devolvemos inmediatamente
    if hasattr(post, "featured_image") and post.featured_image:
        return post.featured_image.url

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
