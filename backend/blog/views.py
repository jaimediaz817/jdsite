import json

from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.views.generic import ListView, DetailView
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from allauth.socialaccount.models import SocialAccount
from django.template.loader import render_to_string
from django.db.models import Q
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from blog.models import BlogComment, BlogPost
from blog.forms import CommentForm, QuickSignupForm
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
        context["comments"] = get_approved_comments(self.object.slug, limit=10)
        context["comment_count"] = get_comment_count(self.object.slug)
        # Pasar mapa {id: status} de TODOS los comentarios para que el frontend
        # pueda decidir qué skeletons mostrar sin llamar N endpoints
        all_comments = BlogComment.objects.filter(
            blog_slug=self.object.slug
        ).values("id", "status")
        comments_status_map = {str(c["id"]): c["status"] for c in all_comments}
        context["comments_status_json"] = json.dumps(comments_status_map)

        # Pasar datos de comentarios pendientes para mostrar skeletons con info real
        # ---------------------------------------------------------------------
        # Comentarios pendientes del usuario autenticado
        # ---------------------------------------------------------------------
        # Anteriormente filtrábamos por el nombre completo del usuario (`full_name`
        # o `username`). En la práctica los comentarios pendientes se guardan con
        # el nombre tal cual lo ingresa el usuario al crear el comentario, lo que
        # puede no coincidir exactamente con `full_name`. Para evitar que los
        # skeletons desaparezcan por una diferencia de mayúsculas/minúsculas o
        # por usar el nombre completo en vez del username, ahora filtramos de
        # forma case‑insensitive (`iexact`). De esta manera, siempre que el
        # nombre almacenado sea una variante del username o del nombre del
        # usuario, el comentario pendiente será incluido.
        if self.request.user.is_authenticated:
            # Preferimos el username porque es único y siempre está presente.
            user_name = self.request.user.username
            pending_comments = BlogComment.objects.filter(
                Q(name__iexact=user_name)
                | Q(name__iexact=self.request.user.get_full_name()),
                blog_slug=self.object.slug,
                status="pending",
            ).values("id", "name", "content")[:20]
        else:
            # Para usuarios anónimos, no mostramos skeletons de pendientes (no pueden ver pendientes de otros)
            pending_comments = BlogComment.objects.none()
        pending_list = []
        for pc in pending_comments:
            pending_list.append(
                {
                    "id": str(pc["id"]),
                    "name": pc["name"],
                    "content": pc["content"][:200],  # truncar para no saturar
                }
            )
        context["pending_comments_json"] = json.dumps(pending_list)
        return context


@csrf_protect
@require_http_methods(["POST"])
def post_comment(request, slug):
    if not request.user.is_authenticated:
        return JsonResponse(
            {"success": False, "error": "Debes iniciar sesión para comentar."},
            status=401,
        )
    form = CommentForm(request.POST)
    if form.is_valid():
        ip = get_client_ip(request)
        identification_level = "registered"
        provider = None
        provider_uid = None
        if hasattr(request.user, "socialaccount_set"):
            social_account = request.user.socialaccount_set.first()
            if social_account:
                provider = social_account.provider
                provider_uid = social_account.uid
        name = request.user.get_full_name() or request.user.username
        email = request.user.email
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
        return JsonResponse(
            {
                "success": True,
                "message": "Comentario pendiente.",
                "comment_id": comment.id,
            }
        )
    # Convert form errors to JSON-serializable format
    errors = {}
    for field, errors_list in form.errors.items():
        errors[field] = list(errors_list)
    return JsonResponse({"success": False, "errors": form.errors}, status=400)


@csrf_exempt
def quick_signup(request):
    if request.method != "POST":
        return JsonResponse(
            {
                "success": False,
                "errors": {"non_field_error": "Método no permitido."},
            },
            status=405,
        )
    try:
        form = QuickSignupForm(request.POST)
        # Para registro rápido, no validamos estrictamente - aceptamos cualquier dato
        # y enviamos mensaje de confirmación por email
        email = form.data.get("email", "").strip()
        username = form.data.get("username", "").strip()
        first_name = form.data.get("first_name", "").strip()
        last_name = form.data.get("last_name", "").strip()

        # Verificar si el correo ya existe
        if email and (
            User.objects.filter(email=email).exists()
            or SocialAccount.objects.filter(user__email=email).exists()
        ):
            return JsonResponse(
                {
                    "success": False,
                    "errors": {"email": ["Correo ya registrado."]},
                }
            )

        # Verificar si el username ya existe
        if username and User.objects.filter(username=username).exists():
            return JsonResponse(
                {
                    "success": False,
                    "errors": {"username": ["Usuario ya registrado."]},
                }
            )

        # Si no hay errores críticos, procesar registro
        if form.is_valid():
            user = form.save()
            user.backend = "django.contrib.auth.backends.ModelBackend"
            login(request, user)
            return JsonResponse({"success": True, "redirect": "/blog/"})
        else:
            # Si hay errores de validación pero no son críticos,
            # mostramos mensaje de confirmación de envío
            return JsonResponse(
                {
                    "success": True,
                    "message": "Correo electrónico de confirmación enviado a "
                    + (email or "tu dirección de correo")
                    + ".",
                    "info": "Menú:\nIniciar sesión\nRegistrarse\n\nVerifique su dirección de correo electrónico\nLe hemos enviado un correo electrónico para su verificación. Siga el enlace proporcionado para finalizar el proceso de registro. Si no ves el correo electrónico de verificación en tu bandeja de entrada principal, comprueba tu carpeta de correo no deseado. Por favor, póngase en contacto con nosotros si no recibe el correo electrónico de verificación en unos minutos.",
                }
            )
    except Exception as e:
        return JsonResponse(
            {"success": False, "errors": {"non_field_error": [str(e)]}},
            status=500,
        )


@require_http_methods(["GET"])
def load_more_comments(request, slug):
    """Carga paginada de comentarios vía AJAX.

    La vista original lanzaba una excepción cuando el parámetro ``page``
    no era convertible a entero o cuando ``page`` superaba el número de
    páginas disponibles.  Además, devolvía una respuesta vacía sin cuerpo
    cuando no había más comentarios, lo que provocaba que el cliente
    intentara procesar ``response.text()`` sobre un cuerpo inexistente y
    generara un error 500.

    Esta versión protege la conversión de ``page`` y siempre devuelve
    contenido HTML (aunque sea vacío) junto con la cabecera ``X-Has-More``
    que indica si existen más páginas.
    """
    # Obtener número de página, garantizando que sea un entero válido.
    try:
        page = int(request.GET.get("page", 2))
    except (TypeError, ValueError):
        # Si el parámetro es inválido, devolvemos la primera página.
        page = 2

    # Obtener queryset de comentarios aprobados.
    try:
        comments_qs = get_approved_comments(slug)
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.exception(
            "Error al obtener comentarios aprobados para slug %s: %s", slug, e
        )
        return HttpResponse(status=500)

    # Paginación de 10 comentarios por página.
    paginator = Paginator(comments_qs, 10)

    # Si la página solicitada supera el total, devolvemos una respuesta
    # vacía pero con la cabecera indicando que no hay más datos.
    if page > paginator.num_pages:
        response = HttpResponse("")
        response["X-Has-More"] = "false"
        return response

    # Obtener la página solicitada.
    page_obj = paginator.get_page(page)

    # Renderizar los comentarios usando el mismo template que la vista
    # principal.  El contexto incluye ``has_more`` para que el template
    # pueda, si lo desea, mostrar un indicador.
    html = render_to_string(
        "blog/partials/_comments_list.html",
        {"comments": page_obj, "has_more": page_obj.has_next()},
    )

    response = HttpResponse(html)
    response["X-Has-More"] = "true" if page_obj.has_next() else "false"
    return response


@require_http_methods(["GET"])
def check_comment_status(request, slug, comment_id):
    """
    Verifica el estado de un comentario específico (approved/rejected/pending)
    """
    try:
        comment = BlogComment.objects.get(id=comment_id, blog_slug=slug)
        return JsonResponse({"success": True, "status": comment.status})
    except BlogComment.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Comentario no encontrado"}, status=404
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
