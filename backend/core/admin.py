from django.contrib import admin
from core.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "registration_source", "created_at", "updated_at"]
    list_filter = ["registration_source"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["created_at", "updated_at"]
