from django.http import HttpResponseForbidden
import time
from collections import defaultdict


class RateLimitMiddleware:
    """
    Rate limit simple sin dependencias externas.
    Limita a 30 peticiones POR MINUTO por IP solo para POST.
    Diseñado especificamente para endpoints de reacciones.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit = 30
        self.window = 60  # 1 minuto
        self.requests = defaultdict(list)

    def __call__(self, request):
        if (
            request.path.startswith("/api/blog/")
            and "/reactions/" in request.path
            and request.method == "POST"
        ):
            ip = self.get_client_ip(request)

            # Limpiar peticiones antiguas
            now = time.time()
            self.requests[ip] = [
                t for t in self.requests[ip] if now - t < self.window
            ]

            if len(self.requests[ip]) >= self.rate_limit:
                return HttpResponseForbidden("Rate limit excedido")

            self.requests[ip].append(now)

        return self.get_response(request)

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip.strip()
