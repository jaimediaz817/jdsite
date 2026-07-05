"""
Función 404 personalizada - Método simple para testing
"""

from django.shortcuts import render


def custom_404_view(request, exception=None):
    """Vista personalizada para error 404."""
    return render(
        request,
        "404.html",
        {
            "exception_title": "Página no encontrada",
            "exception_message": "Lo que buscas no existe o ha sido movido. Por favor, verifica la URL o vuelve a la página principal.",
        },
        status=404,
    )
