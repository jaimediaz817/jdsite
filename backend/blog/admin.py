from django.contrib import admin
from django.urls import reverse
from blog.models import (
    Category,
    Tag,
    BlogPost,
    BlogComment,
    BlogEmailConfig,
    BlogModeration,
    AdminConfig,
    QRCode,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ["name"]}


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "slug",
        "author",
        "is_published",
        "moderation_status",
        "publish_date",
    ]
    list_filter = [
        "is_published",
        "moderation_status",
        "category",
        "publish_date",
    ]
    search_fields = ["title", "slug", "description"]
    prepopulated_fields = {"slug": ["title"]}
    filter_horizontal = ["tags"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "blog_slug",
        "status",
        "identification_level",
        "created_at",
    ]
    list_filter = ["status", "identification_level", "created_at"]
    search_fields = ["name", "email", "blog_slug", "content"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(BlogEmailConfig)
class BlogEmailConfigAdmin(admin.ModelAdmin):
    list_display = [
        "admin_notifications_enabled",
        "author_notifications_enabled",
        "updated_at",
        "updated_by",
    ]
    list_filter = ["admin_notifications_enabled", "author_notifications_enabled"]
    readonly_fields = ["updated_at"]


@admin.register(BlogModeration)
class BlogModerationAdmin(admin.ModelAdmin):
    list_display = [
        "blog_post",
        "author",
        "reviewer",
        "action",
        "created_at",
        "reviewed_at",
    ]
    list_filter = ["action", "created_at", "reviewed_at"]
    search_fields = ["blog_post__title", "author__username", "reviewer__username"]
    readonly_fields = ["created_at", "reviewed_at"]


@admin.register(AdminConfig)
class AdminConfigAdmin(admin.ModelAdmin):
    list_display = ["key", "value", "description", "updated_at"]
    search_fields = ["key", "value", "description"]
    readonly_fields = ["updated_at"]


# HU-029: Admin para códigos QR
@admin.register(QRCode)
class QRCodeAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "slug",
        "blog_post",
        "is_active",
        "created_by",
        "created_at",
    ]
    list_filter = ["is_active", "created_at", "blog_post"]
    search_fields = ["name", "slug", "slogan"]
    readonly_fields = ["created_at", "image_path"]
    actions = ["regenerate_qr"]

    def regenerate_qr(self, request, queryset):
        """Acción personalizada: regenerar QR seleccionados."""
        from blog.utils.qr_generator import (
            generate_qr_with_logo,
            get_qr_full_path,
            get_qr_media_path,
        )

        count = 0
        for qr in queryset:
            if qr.blog_post:
                qr_url = request.build_absolute_uri(
                    reverse("blog:qr_redirect", args=[qr.slug])
                )
                output_path = get_qr_full_path(qr.slug)
                try:
                    generate_qr_with_logo(
                        qr_url, output_path, text=qr.name, slogan=qr.slogan
                    )
                    qr.image_path = get_qr_media_path(qr.slug)
                    qr.save(update_fields=["image_path"])
                    count += 1
                except Exception as e:
                    self.message_user(
                        request,
                        f"Error al regenerar QR '{qr.slug}': {str(e)}",
                        level="error",
                    )
        self.message_user(request, f"{count} QR(s) regenerado(s) exitosamente.")

    regenerate_qr.short_description = "Regenerar imágenes QR"
