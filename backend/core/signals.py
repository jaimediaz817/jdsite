from allauth.account.signals import user_signed_up
from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from core.models import UserProfile


@receiver(user_signed_up)
def handle_user_signed_up(request, user, **kwargs):
    """Asigna registration_source='basic' cuando un usuario se registra con allauth.

    Este signal se dispara cuando se completa el registro vía /accounts/signup/
    (formulario básico de allauth, no social login).
    """
    UserProfile.objects.get_or_create(
        user=user,
        defaults={"registration_source": "basic"},
    )


@receiver(social_account_added)
def handle_social_account_added(request, sociallogin, **kwargs):
    """Asigna registration_source cuando un usuario se registra con OAuth.

    Detecta el provider (google/github) y crea/actualiza el UserProfile
    con la fuente correspondiente.
    """
    provider = sociallogin.account.provider  # 'google' o 'github'
    user = sociallogin.user
    UserProfile.objects.get_or_create(
        user=user,
        defaults={"registration_source": provider},
    )
