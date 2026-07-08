"""
Vistas para manejo de errores y testing
"""

from django.shortcuts import render
from django.http import Http404
from django.views.defaults import page_not_found


def custom_404_view(request, exception=None):
    """Vista personalizada para error 404 (usada cuando DEBUG=False)."""
    return render(
        request,
        "404.html",
        {
            "exception_title": "Artículo no encontrado",
            "exception_message": "Lo que buscas no existe o ha sido movido. Por favor, verifica la URL o vuelve a la página principal del blog para intentar abrir otro similar.",
        },
        status=404,
    )


def test_404_page(request):
    """Vista de testing para previsualizar el template 404 sin DEBUG=False."""
    return custom_404_view(request, exception=Http404())
