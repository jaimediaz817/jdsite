from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from blog.models import BlogPost
from blog.forms import CommentForm
from blog.services import create_comment, get_approved_comments, get_comment_count


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip.strip()


class BlogListView(ListView):
    model = BlogPost
    template_name = "blog/blog_list.html"
    context_object_name = "posts"
    paginate_by = 10
    queryset = BlogPost.objects.filter(is_published=True).order_by(
        "-publish_date"
    )


class BlogDetailView(DetailView):
    model = BlogPost
    template_name = "blog/blog_detail.html"
    context_object_name = "post"
    slug_field = "slug"
    queryset = BlogPost.objects.filter(is_published=True).prefetch_related("tags")

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["comment_form"] = CommentForm()
        context["comments"] = get_approved_comments(self.object.slug)
        context["comment_count"] = get_comment_count(self.object.slug)
        return context


@csrf_protect
@require_http_methods(["POST"])
def post_comment(request, slug):
    """
    Endpoint para publicar un comentario
    """
    form = CommentForm(request.POST)

    if form.is_valid():
        ip = get_client_ip(request)

        comment = create_comment(
            blog_slug=slug,
            name=form.cleaned_data["name"],
            email=form.cleaned_data["email"],
            content=form.cleaned_data["content"],
            ip_address=ip,
            parent_id=form.cleaned_data.get("parent_id"),
        )

        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return JsonResponse(
                {
                    "success": True,
                    "message": "Tu comentario esta pendiente de moderación.",
                }
            )

        return redirect("blog:blog_detail", slug=slug)

    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return JsonResponse({"success": False, "errors": form.errors}, status=400)

    # Si no es ajax, volver al detalle del blog
    return redirect("blog:blog_detail", slug=slug)
