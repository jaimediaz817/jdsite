# HU-023: Campo `registration_source` para `auth_user`

**Estado:** Pendiente  
**Fecha:** 2026-07-01  
**Prioridad:** Media  
**Dependencias:** Ninguna  

---

## 📋 Objetivo

Agregar un campo que almacene la fuente de registro del usuario (`basic`, `google`, `github`, `admin`) para poder identificar de forma declarativa y sin JOINs cómo se registró cada usuario en el sistema.

---

## 🎯 Criterios de Aceptación

1. [ ] **CA-01**: Existe un modelo `UserProfile` en `core/models.py` con:
   - `user` → OneToOneField a `User`
   - `registration_source` → CharField con choices: `basic`, `google`, `github`, `admin`
   - `created_at` → DateTimeField auto_now_add
   - `updated_at` → DateTimeField auto_now
   - `__str__` que muestre `user.username - registration_source`

2. [ ] **CA-02**: Al registrarse por **QuickSignupForm** (registro básico), se asigna `registration_source='basic'` automáticamente.

3. [ ] **CA-03**: Al registrarse o loguearse por **Google OAuth**, se asigna `registration_source='google'` automáticamente.

4. [ ] **CA-04**: Al registrarse o loguearse por **GitHub OAuth**, se asigna `registration_source='github'` automáticamente.

5. [ ] **CA-05**: Los usuarios creados manualmente en el admin de Django tienen `registration_source='admin'`.

6. [ ] **CA-06**: El campo `registration_source` es visible y filtrable en el admin de Django.

7. [ ] **CA-07**: `python manage.py check` no muestra errores.

8. [ ] **CA-08**: Backfill: existe un management command que asigna la fuente retroactivamente a usuarios existentes consultando `SocialAccount`.

---

## 🧩 Implementación

### Fase 1: Modelo `UserProfile` y migración

**Archivos a modificar:**
- `backend/core/models.py` → agregar modelo `UserProfile`

**Archivos a crear:**
- Migración en `backend/core/migrations/`

**Detalle:**

```python
# backend/core/models.py
from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    SOURCE_CHOICES = [
        ('basic', 'Registro básico'),
        ('google', 'Google OAuth'),
        ('github', 'GitHub OAuth'),
        ('admin', 'Creado por admin'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    registration_source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='basic',
        help_text='Fuente de registro del usuario',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de usuario'
        verbose_name_plural = 'Perfiles de usuario'

    def __str__(self):
        return f'{self.user.username} - {self.get_registration_source_display()}'
```

### Fase 2: Asignar source en registro básico (`quick_signup`)

**Archivo:** `backend/blog/views.py`

En la función `quick_signup`, después de crear el usuario, agregar:
```python
UserProfile.objects.get_or_create(
    user=user,
    defaults={'registration_source': 'basic'}
)
```

**Import a agregar:**
```python
from core.models import UserProfile
```

### Fase 3: Asignar source en login social (adapter/signal)

**Archivo:** `backend/jdsite/adapter.py`

Modificar `CustomSocialAccountAdapter.pre_social_login` o agregar un signal para `social_account_added` que detecte el provider (`google` o `github`) y asigne el source.

**Opción recomendada:** Usar signal `allauth.socialaccount.signals.social_account_added` en un archivo `signals.py` dentro de `core/`.

**Archivo a crear:** `backend/core/signals.py`
```python
from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver
from core.models import UserProfile


@receiver(social_account_added)
def handle_social_account_added(request, sociallogin, **kwargs):
    provider = sociallogin.account.provider  # 'google' o 'github'
    user = sociallogin.user
    UserProfile.objects.get_or_create(
        user=user,
        defaults={'registration_source': provider}
    )
```

**Archivo a modificar:** `backend/core/apps.py` → importar signals en `ready()`

### Fase 4: Admin visible

**Archivo a crear:** `backend/core/admin.py`
```python
from django.contrib import admin
from core.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'registration_source', 'created_at']
    list_filter = ['registration_source']
    search_fields = ['user__username', 'user__email']
```

### Fase 5: Backfill command

**Archivo a crear:** `backend/core/management/commands/backfill_registration_source.py`

Comando que itera sobre todos los `User` y:
1. Si tiene `SocialAccount` con `provider='google'` → source=google
2. Si tiene `SocialAccount` con `provider='github'` → source=github
3. Si `is_staff` o `is_superuser` y no tiene SocialAccount → source=admin
4. En cualquier otro caso → source=basic

---

## ✅ Check de validación pre-entrega

- [ ] `python manage.py check` sin errores
- [ ] `python manage.py makemigrations core` genera migración
- [ ] `python manage.py migrate` aplica sin errores
- [ ] `python manage.py backfill_registration_source` ejecuta sin errores
- [ ] Admin muestra los perfiles correctamente
- [ ] Registro básico asigna `basic`
- [ ] Login Google asigna `google`
- [ ] Login GitHub asigna `github`