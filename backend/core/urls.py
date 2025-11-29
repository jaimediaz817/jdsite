from django.urls import path

from . import views

urlpatterns = [
    path(
        "github/repos/", views.github_repos_api, name="github_repos_api"
    ),  # Define el nombre de la URL
]
