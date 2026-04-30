from django.urls import path
from . import views

app_name = "reactions"

urlpatterns = [
    path(
        "api/blog/<slug:blog_slug>/reactions/",
        views.get_reactions,
        name="get_reactions",
    ),
    path(
        "api/blog/<slug:blog_slug>/reactions/toggle/",
        views.toggle_reaction_view,
        name="toggle_reaction",
    ),
    path(
        "api/comment/<int:comment_id>/reactions/toggle/",
        views.toggle_comment_reaction_view,
        name="toggle_comment_reaction",
    ),
    path(
        "api/comment/<int:comment_id>/reactions/",
        views.get_comment_reactions,
        name="get_comment_reactions",
    ),
]
