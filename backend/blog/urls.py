from django.urls import path
from blog.feeds import BlogRSSFeed, BlogAtomFeed
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
    delete_resource_file_ajax,
    dashboard_resources_view,
    dashboard_users_view,
    toggle_user_active,
    post_can_view,
    dashboard_qr_view,
    generate_qr_view,
    qr_redirect_view,
    download_qr_view,
    delete_qr_view,
    qr_no_article_view,
    unlink_qr_view,
    update_qr_view,
)

# HU-031: Importar vista de prueba 404
from blog.views_404 import test_404_page

app_name = "blog"

urlpatterns = [
    path("", BlogListView.as_view(), name="blog_list"),
    path("quick-signup/", quick_signup, name="quick_signup"),
    path("feed/rss/", BlogRSSFeed(), name="blog_rss"),
    path("feed/atom/", BlogAtomFeed(), name="blog_atom"),
    path("editor/", blog_editor_view, name="blog_editor"),
    path("editor/<slug:slug>/", blog_editor_view, name="blog_editor_edit"),
    path("api/save-blog/", save_blog_api, name="api_save_blog"),
    path("api/upload-file/", upload_file_api, name="api_upload_file"),
    path("api/get-blog/<slug:slug>/", get_blog_for_edit, name="api_get_blog"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path(
        "api/post-can-view/<slug:slug>/",
        post_can_view,
        name="api_post_can_view",
    ),
    path(
        "api/authors/autocomplete/",
        api_authors_autocomplete,
        name="api_authors_autocomplete",
    ),
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
    path(
        "dashboard/delete/<int:post_id>/",
        delete_blog_view,
        name="delete_blog",
    ),
    path(
        "dashboard/delete-file/",
        delete_resource_file_ajax,
        name="delete_resource_file",
    ),
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
    path(
        "dashboard/users/",
        dashboard_users_view,
        name="dashboard_users",
    ),
    path(
        "dashboard/users/toggle/<int:user_id>/",
        toggle_user_active,
        name="toggle_user_active",
    ),
    path("test-404/", test_404_page, name="test_404"),
    path("dashboard/qr/", dashboard_qr_view, name="dashboard_qr"),
    path(
        "dashboard/qr/generate/",
        generate_qr_view,
        name="generate_qr",
    ),
    path(
        "dashboard/qr/<slug:slug>/download/",
        download_qr_view,
        name="download_qr",
    ),
    path(
        "dashboard/qr/<slug:slug>/delete/",
        delete_qr_view,
        name="delete_qr",
    ),
    path(
        "dashboard/qr/<slug:slug>/unlink/",
        unlink_qr_view,
        name="unlink_qr",
    ),
    path(
        "dashboard/qr/<slug:slug>/update/",
        update_qr_view,
        name="update_qr",
    ),
    path("qr/<slug:slug>/", qr_redirect_view, name="qr_redirect"),
    path(
        "dashboard/qr/<slug:slug>/associate/",
        qr_no_article_view,
        name="qr_no_article",
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
