from django.contrib import admin
from blog.models import BlogPost, BlogComment


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "publish_date", "is_published")
    list_filter = ("is_published", "publish_date")
    search_fields = ("title", "description", "content_html")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "publish_date"
    readonly_fields = ("source_hash", "last_modified")


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ("name", "blog_slug", "status", "created_at", "ip_address")
    list_filter = ("status", "created_at", "blog_slug")
    search_fields = ("name", "email", "content")
    readonly_fields = ("ip_address", "created_at", "updated_at")
    date_hierarchy = "created_at"
    actions = ["approve_comments", "reject_comments"]

    def approve_comments(self, request, queryset):
        queryset.update(status="approved")

    approve_comments.short_description = "Aprobar comentarios seleccionados"

    def reject_comments(self, request, queryset):
        queryset.update(status="rejected")

    reject_comments.short_description = "Rechazar comentarios seleccionados"
