from django.contrib import admin
import os
from django.conf import settings
from django.conf.urls.static import static

# from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views
from .views import custom_logout, CustomLoginView
from .views import custom_logout
from django.contrib.sitemaps import Sitemap
from django.views.static import serve

# IMPORTACIONES SEO
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path, reverse
from django.views.generic import TemplateView
from inquiries.views_threads import (
    descargar_certificaciones_real,
    descargar_cv,
    descargar_cv_real,
    home_view,
)


# 1. Definir la clase Sitemap para tu Home
class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = "monthly"

    def items(self):
        return ["home"]  # Asegúrate de que tu URL name sea 'home'

    def location(self, item):
        return reverse(item)


sitemaps = {
    "static": StaticViewSitemap,
}

urlpatterns = [
    path("admin/", admin.site.urls),  # admin Django (opcional)
    # --- URLs allauth (Google/GitHub) ---
    # Mantenemos /accounts/ para compatibilidad, pero el blog usa /blog/accounts/
    path("accounts/", include("allauth.urls")),
    # path("blog/accounts/", include("allauth.urls")),  # Eliminado para evitar redirect_uri con /blog/
    # path("ask/", include("inquiries.urls")),
    path(
        "ask/",
        include(("inquiries.urls", "inquiries_ask"), namespace="inquiries_ask"),
    ),
    # login/logout para panel "me"
    # La vista de login personalizada debe usar la plantilla correcta que contiene
    # el formulario con el checkbox "Recordar sesión". La plantilla está en
    # "backend/templates/account/login.html", por lo que la ruta del template es
    # "account/login.html" (Django busca dentro de los directorios de templates).
    path(
        "me/login/",
        CustomLoginView.as_view(template_name="account/login.html"),
        name="login",
    ),
    # Custom logout view that clears any lingering messages before redirecting to login
    path("me/logout/", custom_logout, name="logout"),
    path("inq/", include(("inquiries.urls", "inquiries"), namespace="inquiries")),
    # ... otras URLs
    path("api/", include("core.urls")),
    path("", include("soap_service.urls")),
    path("cv/", descargar_cv, name="descargar_cv"),
    path("cv-file/", descargar_cv_real, name="descargar_cv_real"),
    path(
        "cv-file-certificaciones/",
        descargar_certificaciones_real,
        name="descargar_certificaciones_real",
    ),
    path(
        "cv-gracias/",
        TemplateView.as_view(template_name="cv/descargando.html"),
        name="cv_gracias",
    ),
    # --- RUTAS SEO ---
    # Robots.txt directo
    path(
        "robots.txt",
        TemplateView.as_view(
            template_name="robots.txt", content_type="text/plain"
        ),
    ),
    # Sitemap.xml
    path(
        "sitemap.xml",
        sitemap,
        {"sitemaps": sitemaps},
        name="django.contrib.sitemaps.views.sitemap",
    ),
    # ✅ SISTEMA DE BLOGS
    path("blog/", include("blog.urls")),
    # ✅ SISTEMA DE REACCIONES
    path("", include(("reactions.urls", "reactions"), namespace="reactions")),
    # ✅ HOME SIEMPRE AL FINAL! (Django evalua rutas en ORDEN - error mas comun)
    path("", home_view, name="home"),
    # ✅ FAVICON
    path(
        "favicon.ico",
        serve,
        {
            "path": "blog/images/favicon/favicon.ico",
            "document_root": os.path.join(settings.BASE_DIR, "blog", "static"),
        },
    ),
    path(
        "favicon-32.png",
        serve,
        {
            "path": "blog/images/favicon/favicon-32.png",
            "document_root": os.path.join(settings.BASE_DIR, "blog", "static"),
        },
    ),
    # ↓ agrega estos dos
    path(
        "favicon-16.png",
        serve,
        {
            "path": "blog/images/favicon/favicon-16.png",
            "document_root": os.path.join(settings.BASE_DIR, "blog", "static"),
        },
    ),
    path(
        "favicon-512.png",
        serve,
        {
            "path": "blog/images/favicon/favicon-512.png",
            "document_root": os.path.join(settings.BASE_DIR, "blog", "static"),
        },
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
