from django.urls import path

from . import views

urlpatterns = [
    path("github/repos/", views.github_repos_api, name="github_repos_api"),
    path(
        "ajax/signup/", views.ajax_signup, name="ajax_signup"
    ),  # AJAX endpoint para registro con debugging completo
]
