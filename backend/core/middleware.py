"""
Middleware para debugging de errores CSRF 403 Forbidden.
Provee información EXTREMADAMENTE detallada cuando ocurre un error CSRF.
"""

import logging
import json
import os

logger = logging.getLogger(__name__)
DJANGO_ENV = os.getenv("DJANGO_ENV", "development").lower()


class CSRFDiagnosticMiddleware:
    """
    Middleware que captura y registra información detallada
    cuando Django rechaza una petición por fallo de CSRF.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """Captura excepciones relacionadas con CSRF."""
        return None

    def process_view(self, request, view_func, view_args, view_kwargs):
        """Antes de procesar la vista - logging de información CSRF."""
        # Solo para peticiones POST
        if request.method != "POST":
            return None

        # Información CSRF detallada
        csrf_cookie = request.COOKIES.get("csrftoken", "NOT_FOUND")
        csrf_token = request.POST.get("csrfmiddlewaretoken", "NOT_FOUND")
        csrf_header = request.META.get("HTTP_X_CSRFTOKEN", "NOT_FOUND")
        referer = request.META.get("HTTP_REFERER", "MISSING")
        origin = request.META.get("HTTP_ORIGIN", "MISSING")
        host = request.META.get("HTTP_HOST", "NOT_FOUND")

        logger.info(f"[CSRF_DIAGNOSTIC] POST a {request.path}")
        logger.info(
            f"[CSRF_DIAGNOSTIC] CSRF cookie: {csrf_cookie[:20] if csrf_cookie != 'NOT_FOUND' else 'NOT_FOUND'}"
        )
        logger.info(
            f"[CSRF_DIAGNOSTIC] CSRF token form: {csrf_token[:20] if csrf_token != 'NOT_FOUND' else 'NOT_FOUND'}"
        )
        logger.info(
            f"[CSRF_DIAGNOSTIC] CSRF header X-CSRFToken: {csrf_header[:20] if csrf_header != 'NOT_FOUND' else 'NOT_FOUND'}"
        )
        logger.info(f"[CSRF_DIAGNOSTIC] Referer: {referer}")
        logger.info(f"[CSRF_DIAGNOSTIC] Origin: {origin}")
        logger.info(f"[CSRF_DIAGNOSTIC] Host: {host}")
        logger.info(f"[CSRF_DIAGNOSTIC] DJANGO_ENV: {DJANGO_ENV}")

        # Verificar si el origen está en CSRF_TRUSTED_ORIGINS
        from django.conf import settings

        trusted_origins = getattr(settings, "CSRF_TRUSTED_ORIGINS", [])

        if origin != "MISSING":
            origin_trusted = (
                any(origin.startswith(trusted) for trusted in trusted_origins)
                if trusted_origins
                else False
            )
            logger.info(f"[CSRF_DIAGNOSTIC] Origin trusted: {origin_trusted}")

        return None

    def process_response(self, request, response):
        """Después de la respuesta - detectar 403 CSRF."""
        # Solo para respuestes 403
        if response.status_code == 403:
            logger.warning(f"[CSRF_DIAGNOSTIC] 403 DETECTADO en {request.path}")

            # Información adicional para el log
            response_headers = {
                "Content-Type": response.get("Content-Type", "unknown"),
                "Content-Length": (
                    len(response.content) if hasattr(response, "content") else 0
                ),
            }
            logger.warning(
                f"[CSRF_DIAGNOSTIC] Response headers: {response_headers}"
            )

            # Intentar modificar la respuesta para agregar información útil
            # Solo en desarrollo o con DEBUG=True
            if DJANGO_ENV == "production":
                # Agregar información al cuerpo de la respuesta si es HTML
                content_type = response.get("Content-Type", "")
                if "text/html" in content_type and hasattr(response, "content"):
                    content = response.content.decode("utf-8", errors="ignore")
                    # Buscar el mensaje de error CSRF
                    if "CSRF" in content or "Forbidden" in content:
                        # Agregar JSON con información de debug
                        debug_info = json.dumps(
                            {
                                "error_403_detected": True,
                                "path": request.path,
                                "method": request.method,
                                "host": request.META.get("HTTP_HOST"),
                                "referer": request.META.get("HTTP_REFERER"),
                                "origin": request.META.get("HTTP_ORIGIN"),
                                "has_csrf_cookie": bool(
                                    request.COOKIES.get("csrftoken")
                                ),
                                "has_csrf_form": bool(
                                    request.POST.get("csrfmiddlewaretoken")
                                ),
                                "has_csrf_header": bool(
                                    request.META.get("HTTP_X_CSRFTOKEN")
                                ),
                                "django_env": DJANGO_ENV,
                            }
                        )
                        # Agregar al final del HTML (oculto)
                        modified_content = content.replace(
                            "</body>", f"<!-- CSRF_DEBUG: {debug_info} --></body>"
                        )
                        response.content = modified_content.encode("utf-8")

        return response
