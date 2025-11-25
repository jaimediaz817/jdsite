from django.contrib import admin

# from django.views.generic import TemplateView
from django.contrib.auth import views as auth_views
from django.urls import include, path
from inquiries.views_threads import home_view

urlpatterns = [
    path("admin/", admin.site.urls),  # admin Django (opcional)
    path("", home_view, name="home"),
    path("ask/", include("inquiries.urls")),
    # login/logout para panel “me”
    path(
        "me/login/",
        auth_views.LoginView.as_view(template_name="auth/login.html"),
        name="login",
    ),
    path("me/logout/", auth_views.LogoutView.as_view(), name="logout"),
    path("inq/", include(("inquiries.urls", "inquiries"), namespace="inquiries")),
]
