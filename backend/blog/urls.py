from django.urls import path
from blog.views import (
    BlogListView,
    BlogDetailView,
    post_comment,
    load_more_comments,
    quick_signup,
    check_comment_status,
    delete_comment,
    blog_editor_view,
    save_blog_api,
    upload_file_api,
)

app_name = "blog"

urlpatterns = [
    path("", BlogListView.as_view(), name="blog_list"),
    # Rutas específicas ANTES de las rutas con <slug>
    path("quick-signup/", quick_signup, name="quick_signup"),
    # HU-011: Editor Online (DEBE ir ANTES de <slug> para no ser capturado)
    path("editor/", blog_editor_view, name="blog_editor"),
    path("api/save-blog/", save_blog_api, name="api_save_blog"),
    path("api/upload-file/", upload_file_api, name="api_upload_file"),
    path("<slug:slug>/", BlogDetailView.as_view(), name="blog_detail"),
    path("<slug:slug>/comment/", post_comment, name="post_comment"),
    path(
        "<slug:slug>/comment/<int:comment_id>/status/",
        check_comment_status,
        name="check_comment_status",
    ),
    path(
        "<slug:slug>/comments/load-more/",
        load_more_comments,
        name="load_more_comments",
    ),
    path(
        "<slug:slug>/comment/<int:comment_id>/delete/",
        delete_comment,
        name="delete_comment",
    ),
]
