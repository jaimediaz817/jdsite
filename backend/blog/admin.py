from django.contrib import admin
from blog.models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "publish_date", "is_published")
    list_filter = ("is_published", "publish_date")
    search_fields = ("title", "description", "content_html")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "publish_date"
    readonly_fields = ("source_hash", "last_modified")
