from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """Perfil extendido de usuario.

    Almacena metadata adicional del usuario que no pertenece a la tabla
    ``auth_user`` de Django. El campo ``registration_source`` indica
    cómo se registró el usuario en el sistema.
    """

    SOURCE_CHOICES = [
        ("basic", "Registro básico"),
        ("google", "Google OAuth"),
        ("github", "GitHub OAuth"),
        ("admin", "Creado por admin"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    registration_source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="basic",
        help_text="Fuente de registro del usuario",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Perfil de usuario"
        verbose_name_plural = "Perfiles de usuario"

    def __str__(self):
        return f"{self.user.username} - {self.get_registration_source_display()}"
