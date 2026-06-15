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
    get_blog_for_edit,
    dashboard_view,
    dashboard_post_comments,
    moderate_comment,
    approve_blog_view,
    reject_blog_view,
    toggle_post_published,
    change_moderation_status,
    blog_email_config_view,
    delete_blog_view,
    api_authors_autocomplete,
    delete_orphan_ajax,
    delete_resource_file_ajax,
    dashboard_resources_view,
)

app_name = "blog"

urlpatterns = [
    path("", BlogListView.as_view(), name="blog_list"),
    # Rutas específicas ANTES de las rutas con <slug>
    path("quick-signup/", quick_signup, name="quick_signup"),
    # HU-011: Editor Online (DEBE ir ANTES de <slug> para no ser capturado)
    path("editor/", blog_editor_view, name="blog_editor"),
    path("editor/<slug:slug>/", blog_editor_view, name="blog_editor_edit"),
    path("api/save-blog/", save_blog_api, name="api_save_blog"),
    path("api/upload-file/", upload_file_api, name="api_upload_file"),
    path("api/get-blog/<slug:slug>/", get_blog_for_edit, name="api_get_blog"),
    # Dashboard y acciones de moderación deben ir antes del patrón <slug:slug>
    path("dashboard/", dashboard_view, name="dashboard"),
    # HU-17.18: Endpoint AJAX autocomplete de autores (ANTES de <slug>)
    path(
        "api/authors/autocomplete/",
        api_authors_autocomplete,
        name="api_authors_autocomplete",
    ),
    # HU-011.85: Configuración de envío de emails (ANTES de <slug>)
    path("email-config/", blog_email_config_view, name="blog_email_config"),
    path(
        "dashboard/comments/<slug:slug>/",
        dashboard_post_comments,
        name="dashboard_post_comments",
    ),
    path(
        "dashboard/comments/<slug:slug>/moderate/<int:comment_id>/",
        moderate_comment,
        name="moderate_comment",
    ),
    path(
        "dashboard/approve/<slug:token>/", approve_blog_view, name="approve_blog"
    ),
    path("dashboard/reject/<slug:token>/", reject_blog_view, name="reject_blog"),
    # HU-011.9: Eliminación permanente de artículos (ANTES de <slug>)
    path(
        "dashboard/delete/<int:post_id>/",
        delete_blog_view,
        name="delete_blog",
    ),
    # HU-011.17: Eliminar carpetas huérfanas (AJAX)
    path(
        "dashboard/delete-orphan/",
        delete_orphan_ajax,
        name="delete_orphan",
    ),
    # HU-011.17: Eliminar archivo individual de recursos (AJAX)
    path(
        "dashboard/delete-file/",
        delete_resource_file_ajax,
        name="delete_resource_file",
    ),
    # HU-011.17: Página de gestión de recursos (separada del dashboard home)
    path(
        "dashboard/recursos/blogs/",
        dashboard_resources_view,
        name="dashboard_resources",
    ),
    path(
        "dashboard/toggle/<slug:slug>/",
        toggle_post_published,
        name="toggle_published",
    ),
    path(
        "dashboard/moderate/<slug:slug>/",
        change_moderation_status,
        name="change_moderation",
    ),
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
