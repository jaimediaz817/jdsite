from django.contrib import admin
from .models import BlogReaction, CommentReaction


@admin.register(BlogReaction)
class BlogReactionAdmin(admin.ModelAdmin):
    list_display = ("blog_slug", "ip_address", "reaction_type", "created_at")
    list_filter = ("reaction_type", "created_at")
    search_fields = ("blog_slug", "ip_address")
    readonly_fields = ("created_at", "last_modified")
    date_hierarchy = "created_at"


@admin.register(CommentReaction)
class CommentReactionAdmin(admin.ModelAdmin):
    list_display = ("comment_id", "ip_address", "reaction_type", "created_at")
    list_filter = ("reaction_type", "created_at")
    search_fields = ("comment_id", "ip_address")
    readonly_fields = ("created_at", "last_modified")
    date_hierarchy = "created_at"
