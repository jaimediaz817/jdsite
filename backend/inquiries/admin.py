from django.contrib import admin

# from .models import Inquiry
from .models import InquiryMessage, InquiryThread, Recruiter


@admin.register(Recruiter)
class RecruiterAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "company", "created_at")
    search_fields = ("name", "email")


class MessageInline(admin.TabularInline):
    model = InquiryMessage
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(InquiryThread)
class InquiryThreadAdmin(admin.ModelAdmin):
    list_display = ("code", "recruiter", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("code", "recruiter__email")
    inlines = [MessageInline]


@admin.register(InquiryMessage)
class InquiryMessageAdmin(admin.ModelAdmin):
    list_display = ("thread", "sender", "created_at")
    list_filter = ("sender",)
