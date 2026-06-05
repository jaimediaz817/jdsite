import json
from pathlib import Path

from django.conf import settings
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
from django.contrib.auth.decorators import login_required
from blog.models import BlogComment, BlogPost, Category
from blog.forms import CommentForm, QuickSignupForm
from blog.services import (
    create_comment,
    get_approved_comments,
    get_comment_count,
    save_blog_to_source,
    save_uploaded_file,
)


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
    # Según la HU‑005.7 la paginación debe ser de 12 posts por página.
    paginate_by = 12
    # Base queryset sin filtro de categoría; el método ``get_queryset`` aplicará
    # opcionalmente el filtro por slug de categoría recibido vía querystring.
    queryset = BlogPost.objects.filter(is_published=True).order_by(
        "-publish_date"
    )

    def get_queryset(self):
        """Aplica filtro de categoría y/o búsqueda por texto.

        - ``?category=slug`` → filtra por categoría
        - ``?q=termino`` → busca en title, content_html, description,
          slug, category__name, tags__name (icontains)
        - Ambos pueden combinarse: ``?category=slug&q=termino``

        La paginación se aplica DESPUÉS sobre el queryset ya filtrado,
        así que la búsqueda barre todos los posts, no solo la página actual.
        """
        qs = super().get_queryset()
        category_slug = self.request.GET.get("category")
        search_query = self.request.GET.get("q", "").strip()

        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        if search_query:
            qs = qs.filter(
                Q(title__icontains=search_query)
                | Q(content_html__icontains=search_query)
                | Q(description__icontains=search_query)
                | Q(slug__icontains=search_query)
                | Q(category__name__icontains=search_query)
                | Q(tags__name__icontains=search_query)
            ).distinct()

        return qs

    def get_context_data(self, **kwargs):
        """Añade al contexto la lista de categorías y el ``query_string``.

        ``query_string`` contiene todos los parámetros de la query‑string actual
        excepto ``page``; esto permite que los enlaces de paginación mantengan
        cualquier filtro activo (por ejemplo ``?category=slug``).

        También pasa ``search_query`` para mantener el valor del input de búsqueda
        y mostrar un hint de resultados.
        """
        context = super().get_context_data(**kwargs)
        context["categories"] = Category.objects.all()
        # Pasar el término de búsqueda actual al template
        context["search_query"] = self.request.GET.get("q", "")
        # Construir query_string sin el parámetro ``page``
        query = self.request.GET.copy()
        if "page" in query:
            query.pop("page")
        context["query_string"] = query.urlencode()
        return context


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
    from django.contrib.auth.models import AnonymousUser

    request_user = (
        request.user if request.user.is_authenticated else AnonymousUser()
    )
    html = render_to_string(
        "blog/partials/_comments_list.html",
        {
            "comments": page_obj,
            "has_more": page_obj.has_next(),
            "user": request_user,
        },
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


# ======================================================
# HU-011: Editor Online - Vistas
# ======================================================


@login_required
def blog_editor_view(request, slug=None):
    """Vista del editor de blogs (GET).

    Si se proporciona un slug, se carga el artículo existente para edición.
    """
    from blog.models import Category

    return render(
        request,
        "blog/blog_editor.html",
        {
            "categories": Category.objects.filter(is_active=True),
            "edit_slug": slug,
        },
    )


@require_http_methods(["GET"])
def get_blog_for_edit(request, slug):
    """
    Devuelve los datos de un artículo existente para su edición.
    Extrae el frontmatter y el contenido markdown.
    Copia los recursos multimedia al directorio temporal del usuario.

    SEGURIDAD (HU-011.3): Solo el autor del blog o un superusuario
    puede abrir un artículo en el editor. Esto garantiza que cada
    usuario solo pueda editar sus propios blogs.
    """
    from blog.utils.yaml_simple import parse_frontmatter
    import shutil
    from pathlib import Path

    # ── 0. Verificar autoría ANTES de hacer cualquier trabajo ──
    try:
        blog_post = BlogPost.objects.get(slug=slug)
    except BlogPost.DoesNotExist:
        return JsonResponse(
            {"error": f"Artículo con slug '{slug}' no encontrado en BD."},
            status=404,
        )

    is_owner = blog_post.author_id == request.user.id or (
        blog_post.author and blog_post.author.email == request.user.email
    )
    if not (request.user.is_superuser or is_owner):
        return JsonResponse(
            {
                "error": (
                    "No tienes permisos para editar este artículo. "
                    "Solo el autor del blog puede abrirlo en el editor."
                )
            },
            status=403,
        )

    # Buscar la carpeta del artículo
    source_dir = Path(settings.BASE_DIR) / "blogs_source"
    target_dir = None

    # El slug puede ser el nombre completo de la carpeta o una parte
    # Buscar carpetas que contengan el slug al final
    for folder in source_dir.iterdir():
        if folder.is_dir():
            # Intentar coincidencia exacta primero
            if folder.name == slug:
                target_dir = folder
                break
            # Intentar con endswith _slug (formato YYYY-MM-DD_slug)
            if folder.name.endswith(f"_{slug}"):
                target_dir = folder
                break
            # Intentar extrayendo slug después del primer _
            if "_" in folder.name:
                folder_slug = "_".join(folder.name.split("_")[1:])
                if folder_slug == slug:
                    target_dir = folder
                    break

    if not target_dir:
        return JsonResponse(
            {"error": f"No se encontró carpeta para slug: {slug}"},
            status=404,
        )

    blog_file = target_dir / "blog.md"
    if not blog_file.exists():
        return JsonResponse(
            {"error": "Archivo blog.md no encontrado"}, status=404
        )

    # Leer el contenido
    content = blog_file.read_text(encoding="utf-8")

    # Extraer frontmatter
    frontmatter = {}
    markdown_content = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                frontmatter, markdown_content = parse_frontmatter(content)
                # body ya viene de parse_frontmatter
            except Exception as e:
                return JsonResponse(
                    {"error": f"Error parsing frontmatter: {str(e)}"}, status=500
                )

    # No copiar archivos a media/ - usar directamente desde static/blogs/
    existing_files = []
    IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp")
    VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi")

    for f in target_dir.iterdir():
        if f.is_file():
            if f.suffix.lower() in IMAGE_EXTENSIONS + VIDEO_EXTENSIONS:
                ftype = (
                    "video" if f.suffix.lower() in VIDEO_EXTENSIONS else "image"
                )
                existing_files.append(
                    {
                        "filename": f.name,
                        "type": ftype,
                        "url": f"/static/blogs/{slug}/{f.name}",
                    }
                )

    return JsonResponse(
        {
            "slug": slug,
            "frontmatter": frontmatter,
            "content_md": markdown_content,
            "existing_files": existing_files,
            "folder": target_dir.name,
        }
    )


@login_required
@require_http_methods(["POST"])
def save_blog_api(request):
    """Endpoint para guardar un artículo (POST).
    Recibe JSON con title, content_md, etc.
    """
    try:
        if request.content_type == "application/json":
            data = json.loads(request.body)
        else:
            data = request.POST.dict()
        result = save_blog_to_source(data, request.user)
        return JsonResponse({"status": "ok", **result})
    except Exception as e:
        return JsonResponse({"status": "error", "error": str(e)}, status=400)


@csrf_exempt  # Allow FilePond uploads without CSRF token issues
@login_required
@require_http_methods(["POST"])
def upload_file_api(request):
    """Endpoint para subir o eliminar un archivo temporal del editor.

    - POST con archivo: sube el archivo a ``media/blog_editor_temp/<user_id>/``.
    - POST con campo ``action=delete`` y ``filename``: elimina el archivo físico
      del directorio temporal del usuario.
    """
    # Detectar acción de borrado (usamos un campo del POST en lugar de un
    # segundo endpoint para mantener compatibilidad con FilePond).
    if request.POST.get("action") == "delete":
        filename = request.POST.get("filename", "").strip()
        if not filename:
            return JsonResponse(
                {"success": False, "error": "filename requerido"}, status=400
            )
        # Seguridad: evitar path traversal
        safe_name = Path(filename).name
        file_path = (
            Path(settings.MEDIA_ROOT)
            / "blog_editor_temp"
            / str(request.user.id)
            / safe_name
        )
        if file_path.exists() and file_path.is_file():
            try:
                file_path.unlink()
                return JsonResponse(
                    {
                        "success": True,
                        "message": f"Archivo {safe_name} eliminado.",
                    }
                )
            except OSError as exc:
                return JsonResponse(
                    {"success": False, "error": str(exc)}, status=500
                )
        # Si el archivo no existe, lo consideramos éxito idempotente.
        return JsonResponse(
            {
                "success": True,
                "message": "Archivo no encontrado, nada que eliminar.",
            }
        )

    # Cargar el archivo desde la petición (FilePond)
    uploaded_file = request.FILES.get("file")
    if not uploaded_file:
        uploaded_file = next(iter(request.FILES.values()), None)
    if not uploaded_file:
        return JsonResponse({"error": "No se envió ningún archivo"}, status=400)

    result = save_uploaded_file(uploaded_file, request.user)
    if result is None:
        return JsonResponse(
            {"error": "Tipo de archivo no permitido o demasiado grande"},
            status=400,
        )
    return JsonResponse(result)


@csrf_protect
@require_http_methods(["POST"])
@login_required
def delete_comment(request, slug, comment_id):
    """
    Elimina un comentario o respuesta. Solo accesible para superusuarios.
    Método POST con protección CSRF.
    """
    if not request.user.is_superuser:
        return JsonResponse(
            {
                "success": False,
                "error": "No tienes permisos para eliminar comentarios.",
            },
            status=403,
        )
    try:
        comment = BlogComment.objects.get(id=comment_id, blog_slug=slug)
        comment.delete()
        return JsonResponse(
            {"success": True, "message": "Comentario eliminado correctamente."}
        )
    except BlogComment.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Comentario no encontrado"}, status=404
        )
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)
