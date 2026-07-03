import json
import logging
import os
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.middleware.csrf import get_token
from allauth.socialaccount.models import SocialAccount

# Importamos la función correcta
from .github_utils import get_all_github_repos

# Logger para debugging CSRF
logger = logging.getLogger(__name__)
DJANGO_ENV = os.getenv("DJANGO_ENV", "development").lower()


def github_repos_api(request):
    """Endpoint para devolver los repositorios AGRUPADOS de GitHub."""

    # NOTA: Asegúrate de que tu función se llama get_all_github_repos en el import
    # Si la llamaste get_github_repos, renómbrala a get_all_github_repos en github_utils.py

    # Llamada a la función de doble cuenta
    grouped_repos, repos_counts = get_all_github_repos()

    # Devuelve la respuesta JSON con la nueva estructura
    return JsonResponse(
        {
            "success": True,
            "projects_grouped": grouped_repos,
            "total_counts": repos_counts,
        }
    )


@require_http_methods(["GET", "POST"])
def ajax_signup(request):
    """Vista AJAX para registro de usuarios con debugging completo.

    GET: Devuelve el CSRF token para el cliente.
    POST: Procesa el registro con validación completa.
    """
    # GET request - solo para obtener CSRF token
    if request.method == "GET":
        csrf_token = get_token(request)
        return JsonResponse({"csrf_token": csrf_token})

    # POST request - procesar registro
    # === DEBUGGING EXTREMO PARA DIAGNOSTICAR 403 ===
    logger.info(
        f"[AJAX_SIGNUP] ENTRADA POST - URL: {request.build_absolute_uri()}"
    )
    logger.info(f"[AJAX_SIGNUP] DJANGO_ENV: {DJANGO_ENV}")
    logger.info(
        f"[AJAX_SIGNUP] Host recibido: {request.META.get('HTTP_HOST', 'NOT_FOUND')}"
    )
    logger.info(
        f"[AJAX_SIGNUP] Referer: {request.META.get('HTTP_REFERER', 'MISSING')}"
    )
    logger.info(
        f"[AJAX_SIGNUP] Origin: {request.META.get('HTTP_ORIGIN', 'MISSING')}"
    )
    logger.info(
        f"[AJAX_SIGNUP] CSRF cookie: {request.COOKIES.get('csrftoken', 'NOT_FOUND')[:20] if request.COOKIES.get('csrftoken') else 'NOT_FOUND'}"
    )
    logger.info(
        f"[AJAX_SIGNUP] CSRF header X-CSRFToken: {'FOUND' if request.META.get('HTTP_X_CSRFTOKEN') else 'MISSING'}"
    )
    logger.info(f"[AJAX_SIGNUP] All POST keys: {list(request.POST.keys())}")
    try:
        # Usar request.POST para FormData (no request.body)
        errors = {}

        # Capturamos todos los datos del formulario
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        password1 = request.POST.get("password1", "")
        password2 = request.POST.get("password2", "")

        # Validaciones básicas
        if not username:
            errors["username"] = ["El nombre de usuario es obligatorio."]
        elif User.objects.filter(username=username).exists():
            errors["username"] = ["Nombre de usuario ya existe."]

        if not email:
            errors["email"] = ["El correo es obligatorio."]
        elif User.objects.filter(email=email).exists():
            errors["email"] = ["Correo ya registrado."]
        elif SocialAccount.objects.filter(user__email=email).exists():
            errors["email"] = ["Correo ya registrado (OAuth)."]

        if not password1 or len(password1) < 8:
            errors["password1"] = [
                "La contraseña debe tener al menos 8 caracteres."
            ]

        if password1 != password2:
            errors["password2"] = ["Las contraseñas no coinciden."]

        if errors:
            logger.warning(f"[AJAX_SIGNUP] Errores de validación: {errors}")
            return JsonResponse(
                {
                    "success": False,
                    "errors": errors,
                    "debug_info": {
                        "url": request.build_absolute_uri(),
                        "method": request.method,
                        "has_csrf": True,
                        "csrf_cookie_found": bool(
                            request.COOKIES.get("csrftoken")
                        ),
                        "csrf_header_found": bool(
                            request.META.get("HTTP_X_CSRFTOKEN")
                        ),
                        "referer": request.META.get("HTTP_REFERER", "MISSING"),
                        "origin": request.META.get("HTTP_ORIGIN", "MISSING"),
                        "host": request.META.get("HTTP_HOST", "NOT_FOUND"),
                        "django_env": DJANGO_ENV,
                    },
                },
                status=400,
            )

        # Crear usuario
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
            first_name=first_name,
            last_name=last_name,
        )

        # Asignar registration_source='basic'
        from core.models import UserProfile

        UserProfile.objects.get_or_create(
            user=user,
            defaults={"registration_source": "basic"},
        )

        # Login automático
        user.backend = "django.contrib.auth.backends.ModelBackend"
        login(request, user)

        return JsonResponse(
            {
                "success": True,
                "redirect": "/blog/",
                "user": {"username": user.username, "email": user.email},
            }
        )

    except Exception as e:
        logger.error(
            f"[AJAX_SIGNUP] ERROR EXCEPCION: {type(e).__name__}: {str(e)} - Host: {request.META.get('HTTP_HOST')} - Referrer: {request.META.get('HTTP_REFERER')}"
        )
        return JsonResponse(
            {
                "success": False,
                "errors": {"non_field": [str(e)]},
                "debug_info": {
                    "error_type": type(e).__name__,
                    "csfr_check": {
                        "csrf_cookie_found": bool(
                            request.COOKIES.get("csrftoken")
                        ),
                        "csrf_header_found": bool(
                            request.META.get("HTTP_X_CSRFTOKEN")
                        ),
                        "referer": request.META.get("HTTP_REFERER", "MISSING"),
                        "origin": request.META.get("HTTP_ORIGIN", "MISSING"),
                        "host": request.META.get("HTTP_HOST", "NOT_FOUND"),
                    },
                    "django_env": DJANGO_ENV,
                },
            },
            status=500,
        )
