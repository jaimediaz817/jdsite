from django.urls import path

from . import views_threads

app_name = "inquiries"
urlpatterns = [
    path("api/submit/", views_threads.api_submit_question, name="api_submit"),
    path("t/<str:code>/", views_threads.thread_public_view, name="thread_public"),
    path("admin/threads/", views_threads.admin_threads, name="admin_threads"),
    path(
        "admin/threads/<str:code>/",
        views_threads.admin_thread_detail,
        name="admin_thread_detail",
    ),
    path("api/admin/reply/", views_threads.api_admin_reply, name="api_admin_reply"),
]

# urlpatterns = [
#     # Público
#     # path("", views.ask_api, name="ask"),
#     # path("api/submit/", views.ask_api, name="ask_api"),
#     # path("status/<uuid:token>/", views.status_view, name="status"),
#     # Panel admin sencillo
#     # path("me/", views.me_list, name="me_list"),
#     # path("me/<int:pk>/", views.me_detail, name="me_detail"),

#     path("api/submit/", views_threads.api_submit_question, name="api_submit"),
#     path(
#         "t/<str:code>/",
#         views_threads.thread_public_view, name="thread_public"),
#     path("admin/threads/", views_threads.admin_threads, name="admin_threads"),
#     path(
#         "admin/threads/<str:code>/",
#         views_threads.admin_thread_detail,
#         name="admin_thread_detail",
#     ),
#     path(
#         "api/admin/reply/",
#         views_threads.api_admin_reply, name="api_admin_reply"
#     ),
# ]
