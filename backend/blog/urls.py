from django.urls import path
from blog.views import (
    BlogListView,
    BlogDetailView,
    post_comment,
    load_more_comments,
)

app_name = "blog"

urlpatterns = [
    path("", BlogListView.as_view(), name="blog_list"),
    path("<slug:slug>/", BlogDetailView.as_view(), name="blog_detail"),
    path("<slug:slug>/comment/", post_comment, name="post_comment"),
    path(
        "<slug:slug>/comments/load-more/",
        load_more_comments,
        name="load_more_comments",
    ),
]
