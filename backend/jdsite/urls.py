from django.contrib import admin

# from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views
from django.contrib.sitemaps import Sitemap

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
    path("", home_view, name="home"),
    # path("ask/", include("inquiries.urls")),
    path(
        "ask/",
        include(("inquiries.urls", "inquiries_ask"), namespace="inquiries_ask"),
    ),
    # login/logout para panel “me”
    path(
        "me/login/",
        auth_views.LoginView.as_view(template_name="auth/login.html"),
        name="login",
    ),
    path("me/logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("inq/", include(("inquiries.urls", "inquiries"), namespace="inquiries")),
    # ... otras URLs
    path("api/", include("core.urls")),
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
]
