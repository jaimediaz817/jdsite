from django.urls import path
from blog.views import BlogListView, BlogDetailView, post_comment

app_name = "blog"

urlpatterns = [
    path("", BlogListView.as_view(), name="blog_list"),
    path("<slug:slug>/", BlogDetailView.as_view(), name="blog_detail"),
    path("<slug:slug>/comment/", post_comment, name="post_comment"),
]
