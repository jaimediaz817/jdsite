"""HU-026-B: Email propietario configurable desde dashboard"""


def get_owner_email() -> str:
    """Retorna el email propietario para notificaciones.

    Prioridad:
    1. Busca en AdminConfig el valor con key='owner_email'
    2. Fallback a settings.OWNER_EMAIL

    Returns:
        str: Email del propietario o string vacío si no hay configuración
    """
    from django.apps import apps
    from django.conf import settings

    AdminConfig = apps.get_model("blog", "AdminConfig")
    config = AdminConfig.objects.filter(key="owner_email").first()
    if config and config.value:
        return config.value
    return getattr(settings, "OWNER_EMAIL", "")
