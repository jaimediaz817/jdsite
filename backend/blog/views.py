from django.shortcuts import render, get_object_or_404, redirect
from django.views.generic import ListView, DetailView
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect
from django.template.loader import render_to_string
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
        identification_level = form.cleaned_data.get(
            "identification_level", "anonymous"
        )
        provider = None
        provider_uid = None

        # Si el usuario está autenticado con OAuth, usar sus datos
        if request.user.is_authenticated:
            identification_level = "registered"
            # Obtener proveedor social
            if hasattr(request.user, "socialaccount_set"):
                social_account = request.user.socialaccount_set.first()
                if social_account:
                    provider = social_account.provider
                    provider_uid = social_account.uid
            # Usar nombre y email del usuario autenticado
            name = request.user.get_full_name() or request.user.username
            email = request.user.email
        else:
            name = form.cleaned_data["name"]
            email = form.cleaned_data["email"]

        comment = create_comment(
            blog_slug=slug,
            name=name,
            email=email,
            content=form.cleaned_data["content"],
            ip_address=ip,
            parent_id=form.cleaned_data.get("parent_id"),
            identification_level=identification_level,
            provider=provider,
            provider_uid=provider_uid,
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


@require_http_methods(["GET"])
def load_more_comments(request, slug):
    """
    ✅ HU-005.6 - ENDPOINT SCROLL INFINITO
    Retorna HTML parcial de comentarios paginados para carga incremental automatica
    """
    page = request.GET.get("page", 2)
    COMENTARIOS_POR_PAGINA = 12

    # Obtener todos los comentarios aprobados
    todos_comentarios = get_approved_comments(slug)

    # Paginacion nativa Django
    paginador = Paginator(todos_comentarios, COMENTARIOS_POR_PAGINA)

    # Si la pagina solicitada no existe, devolver vacio
    if int(page) > paginador.num_pages:
        respuesta = HttpResponse()
        respuesta["X-Has-More"] = "false"
        return respuesta

    pagina_comentarios = paginador.get_page(page)

    # Renderizar solo el HTML parcial de los comentarios
    html_comentarios = render_to_string(
        "blog/partials/_comments_list.html", {"comments": pagina_comentarios}
    )

    # Crear respuesta con cabecera que indica si hay mas paginas
    respuesta = HttpResponse(html_comentarios)
    respuesta["X-Has-More"] = "true" if pagina_comentarios.has_next() else "false"

    return respuesta
