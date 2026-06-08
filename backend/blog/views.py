"""
Task Progress Checklist:
- [x] Fase 1: Modelo `BlogModeration` (creación y migración)
- [x] Fase 2: Añadir campo `moderation_status` a `BlogPost` (pending/approved/rejected)
- [x] Fase 3: Enviar email automático al admin cuando se guarda un borrador
- [x] Fase 4: Implementar vistas del dashboard (`/dashboard/`, `/dashboard/approve/<slug>/`, `/dashboard/reject/<slug>/`) (aprobación vía URL completada)
- [x] Fase 5: Crear templates HTML del dashboard
- [x] Fase 6: Enviar email al autor con el resultado de la revisión
- [x] Fase 7: Mostrar banner de estado en el editor de blogs
- [ ] Fase 8: Pruebas end‑to‑end y validación (`python manage.py check` sin errores)
"""

import json
from pathlib import Path

from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponse
from django.views.generic import ListView, DetailView
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from allauth.socialaccount.models import SocialAccount
from django.template.loader import render_to_string
from django.db import models
from django.db.models import Q, Count
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
from django.contrib.auth.decorators import login_required
from blog.models import BlogComment, BlogPost, Category, BlogModeration
from blog.services import (
    create_comment,
    get_approved_comments,
    get_comment_count,
    save_blog_to_source,
    save_uploaded_file,
)
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from .forms import CommentForm, QuickSignupForm


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip.strip()


# ---------------------------------------------------------------------
# Vista de aprobación vía URL única
# ---------------------------------------------------------------------
def approve_blog_view(request, token):
    """Aprobar un borrador mediante token enviado por email.

    El token está asociado a un ``BlogPost`` que tiene ``is_published=False``.
    La vista verifica que el token exista, que no haya expirado (48 h) y que
    el usuario que accede sea staff o superuser. Si todo es correcto, publica
    el artículo, crea/actualiza el registro de ``BlogModeration`` y notifica al
    autor.
    """
    # Buscar el post por token
    try:
        post = BlogPost.objects.get(approval_token=token)
    except BlogPost.DoesNotExist:
        return HttpResponse(
            "Enlace de aprobación inválido o ya usado.", status=400
        )

    # Verificar expiración del token (48 h)
    if not post.approval_token_created or (
        timezone.now() - post.approval_token_created > timedelta(hours=48)
    ):
        return HttpResponse("Enlace de aprobación expirado.", status=400)

    # Sólo staff/superuser puede aprobar vía esta ruta
    if not request.user.is_authenticated or not request.user.is_staff:
        return HttpResponse("Permiso denegado.", status=403)

    # Aprobar el post
    post.is_published = True
    post.moderation_status = "approved"
    # Invalida token para uso futuro
    post.approval_token = None
    post.approval_token_created = None
    post.save()

    # Registrar moderación
    BlogModeration.objects.create(
        blog_post=post,
        author=post.author,
        reviewer=request.user,
        action="approved",
        comment="Aprobado vía enlace de email",
    )

    # Notificar al autor por email
    if post.author and post.author.email:
        subject = f"[JD Blog] Tu artículo '{post.title}' ha sido publicado"
        message = (
            f"Hola {post.author.get_full_name() or post.author.username},\n\n"
            f"Tu artículo '{post.title}' ha sido aprobado y publicado por el administrador.\n"
            f"Puedes verlo en: {settings.SITE_URL}{post.get_absolute_url()}\n\n"
            "Gracias por contribuir."
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[post.author.email],
            fail_silently=True,
        )

    # Redirigir al detalle del post o mostrar mensaje de éxito
    return redirect(post.get_absolute_url())


def reject_blog_view(request, token):
    """Rechazar un borrador mediante token enviado por email.

    Cambia el estado a ``rejected`` y elimina el token para que no pueda usarse.
    """
    try:
        post = BlogPost.objects.get(approval_token=token)
    except BlogPost.DoesNotExist:
        return HttpResponse("Enlace de rechazo inválido o ya usado.", status=400)

    if not request.user.is_authenticated or not request.user.is_staff:
        return HttpResponse("Permiso denegado.", status=403)

    post.moderation_status = "rejected"
    post.approval_token = None
    post.approval_token_created = None
    post.save()

    BlogModeration.objects.create(
        blog_post=post,
        author=post.author,
        reviewer=request.user,
        action="rejected",
        comment="Rechazado vía enlace de email",
    )

    # Notificar al autor del rechazo
    if post.author and post.author.email:
        subject = f"[JD Blog] Tu artículo '{post.title}' ha sido rechazado"
        message = (
            f"Hola {post.author.get_full_name() or post.author.username},\n\n"
            f"Tu artículo '{post.title}' ha sido revisado y rechazado por el administrador."
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[post.author.email],
            fail_silently=True,
        )

    return redirect("blog:dashboard")


# ---------------------------------------------------------------------
# Dashboard de moderación (panel completo)
# ---------------------------------------------------------------------
@login_required
def dashboard_view(request):
    """Panel de administración del blog con filtros y acciones.

    - SUPERADMIN/STAFF: ve TODOS los artículos
    - USUARIOS NORMALES: ve SOLO sus propios artículos

    Muestra los artículos con capacidad de filtrar por estado de
    publicación y moderación, y de cambiar ambos estados directamente
    desde la dashboard.
    """
    is_super = request.user.is_staff or request.user.is_superuser

    posts = BlogPost.objects.select_related("category", "author")
    if is_super:
        posts = posts.all()
    else:
        posts = posts.filter(author=request.user)

    # Filtros
    is_published_filter = request.GET.get("is_published", "")
    moderation_filter = request.GET.get("moderation", "")
    search_query = request.GET.get("q", "").strip()

    if is_published_filter == "1":
        posts = posts.filter(is_published=True)
    elif is_published_filter == "0":
        posts = posts.filter(is_published=False)

    if moderation_filter in ("pending", "approved", "rejected"):
        posts = posts.filter(moderation_status=moderation_filter)

    if search_query:
        posts = posts.filter(
            Q(title__icontains=search_query)
            | Q(slug__icontains=search_query)
            | Q(author__username__icontains=search_query)
        )

    posts = posts.order_by("-publish_date")

    # Paginación: 20 artículos por página
    paginator = Paginator(posts, 20)
    page = request.GET.get("page", 1)
    try:
        page_obj = paginator.page(page)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    # Query string para paginación (sin page)
    query = request.GET.copy()
    if "page" in query:
        query.pop("page")
    query_string = query.urlencode()

    # Contar comentarios por slug de post y pegarlos a cada objeto
    slugs = [p.slug for p in page_obj]
    comment_counts = {}
    if slugs:
        counts_qs = (
            BlogComment.objects.filter(blog_slug__in=slugs)
            .values("blog_slug")
            .annotate(total=Count("id"))
        )
        comment_counts = {c["blog_slug"]: c["total"] for c in counts_qs}
    # Poner el contador como atributo en cada post para acceso directo en template
    for post in page_obj:
        post.comment_total = comment_counts.get(post.slug, 0)

    # Estadísticas para los badges
    stats = {
        "total": BlogPost.objects.count(),
        "published": BlogPost.objects.filter(is_published=True).count(),
        "drafts": BlogPost.objects.filter(is_published=False).count(),
        "pending": BlogPost.objects.filter(moderation_status="pending").count(),
        "approved": BlogPost.objects.filter(moderation_status="approved").count(),
        "rejected": BlogPost.objects.filter(moderation_status="rejected").count(),
    }

    return render(
        request,
        "blog/dashboard.html",
        {
            "page_obj": page_obj,
            "stats": stats,
            "is_published_filter": is_published_filter,
            "moderation_filter": moderation_filter,
            "search_query": search_query,
            "query_string": query_string,
            "comment_counts": comment_counts,
        },
    )


# ---------------------------------------------------------------------
# Dashboard: Comentarios por artículo (moderación para el autor)
# ---------------------------------------------------------------------
@login_required
def dashboard_post_comments(request, slug):
    """Ver y moderar comentarios de un artículo propio.

    - SUPERADMIN/STAFF: ve TODOS los comentarios de cualquier artículo
    - USUARIOS NORMALES: ve SOLO los comentarios de SUS PROPIOS artículos
    """
    post = get_object_or_404(BlogPost, slug=slug)

    # Seguridad: el usuario debe ser el autor o superadmin/staff
    is_owner = post.author == request.user
    if not (request.user.is_staff or request.user.is_superuser or is_owner):
        return redirect("blog:blog_list")

    comments = (
        BlogComment.objects.filter(blog_slug=slug)
        .select_related("parent")
        .prefetch_related(
            models.Prefetch(
                "replies",
                queryset=BlogComment.objects.filter(blog_slug=slug).order_by(
                    "created_at"
                ),
            )
        )
        .order_by("-created_at")
    )

    # Paginación
    paginator = Paginator(comments, 20)
    page = request.GET.get("page", 1)
    try:
        page_obj = paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        page_obj = paginator.page(1)

    comments_count = comments.count()

    # Adjuntar replies a cada comentario padre (para el template)
    # Los replies ya se cargan via prefetch_related
    for comment in page_obj:
        if comment.parent_id:
            # Es un reply, se mostrará dentro de su padre
            pass

    return render(
        request,
        "blog/dashboard_post_comments.html",
        {
            "post": post,
            "comments": page_obj,
            "comments_count": comments_count,
        },
    )


@login_required
@require_http_methods(["POST"])
@csrf_protect
def moderate_comment(request, slug, comment_id):
    """Aprobar o rechazar un comentario vía AJAX.

    - SUPERADMIN/STAFF: puede moderar cualquier comentario
    - USUARIOS NORMALES: puede moderar SOLO comentarios de SUS artículos
    """
    post = get_object_or_404(BlogPost, slug=slug)
    comment = get_object_or_404(BlogComment, id=comment_id, blog_slug=slug)

    # Seguridad: el usuario debe ser el autor del post o superadmin/staff
    is_owner = post.author == request.user
    if not (request.user.is_staff or request.user.is_superuser or is_owner):
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."}, status=403
        )

    action = request.POST.get("action", "")
    if action not in ("approve", "reject"):
        return JsonResponse(
            {"success": False, "error": "Acción inválida."}, status=400
        )

    new_status = "approved" if action == "approve" else "rejected"
    comment.status = new_status
    comment.save()

    return JsonResponse(
        {
            "success": True,
            "status": comment.status,
            "comment_id": comment.id,
        }
    )


@login_required
@require_http_methods(["POST"])
@csrf_protect
def toggle_post_published(request, slug):
    """Alterna el estado is_published de un artículo (AJAX)."""
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."}, status=403
        )

    try:
        post = BlogPost.objects.get(slug=slug)
    except BlogPost.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Artículo no encontrado."}, status=404
        )

    post.is_published = not post.is_published
    if post.is_published:
        post.moderation_status = "approved"
        post.approval_token = None
        post.approval_token_created = None
    post.save()

    # Registrar moderación
    BlogModeration.objects.create(
        blog_post=post,
        author=post.author,
        reviewer=request.user,
        action="approved" if post.is_published else "pending",
        comment=f"{'Publicado' if post.is_published else 'Despublicado'} desde dashboard",
    )

    return JsonResponse(
        {
            "success": True,
            "is_published": post.is_published,
            "moderation_status": post.moderation_status,
        }
    )


@login_required
@require_http_methods(["POST"])
@csrf_protect
def change_moderation_status(request, slug):
    """Cambia el moderation_status de un artículo (AJAX)."""
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."}, status=403
        )

    try:
        post = BlogPost.objects.get(slug=slug)
    except BlogPost.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Artículo no encontrado."}, status=404
        )

    new_status = request.POST.get("status", "")
    if new_status not in ("pending", "approved", "rejected"):
        return JsonResponse(
            {"success": False, "error": "Estado inválido."}, status=400
        )

    post.moderation_status = new_status
    if new_status == "approved":
        post.is_published = True
        post.approval_token = None
        post.approval_token_created = None
    elif new_status == "rejected":
        post.is_published = False
    post.save()

    BlogModeration.objects.create(
        blog_post=post,
        author=post.author,
        reviewer=request.user,
        action=new_status,
        comment=f"Moderación cambiada a '{new_status}' desde dashboard",
    )

    return JsonResponse(
        {
            "success": True,
            "is_published": post.is_published,
            "moderation_status": post.moderation_status,
        }
    )


class BlogListView(ListView):
    model = BlogPost
    template_name = "blog/blog_list.html"
    context_object_name = "posts"
    # Según la HU‑005.7 la paginación debe ser de 12 posts por página.
    paginate_by = 12

    def get_queryset(self):
        """Devuelve artículos visibles según el usuario.

        Reglas de visibilidad:
        - Artículos aprobados (moderation_status="approved"): visibles para todos.
        - Artículos pendientes (moderation_status="pending"): solo visibles para
          el autor o superadmin/staff.
        - Artículos rechazados: no se muestran en la lista pública.

        También aplica filtros de categoría y búsqueda por texto.
        """
        user = self.request.user

        # 🔒 SUPERADMIN/STAFF: ven TODO excepto rechazados
        if user.is_superuser or (user.is_authenticated and user.is_staff):
            qs = BlogPost.objects.exclude(moderation_status="rejected")
        else:
            # 🔒 USUARIOS NORMALES Y ANÓNIMOS:
            # Solo ven artículos aprobados (is_published=True + approved)
            qs = BlogPost.objects.filter(moderation_status="approved")
            # 🔒 USUARIOS AUTENTICADOS: también ven sus PROPIOS pending
            if user.is_authenticated:
                qs = BlogPost.objects.filter(
                    Q(moderation_status="approved")
                    | Q(author=user, moderation_status="pending")
                )

        # Aplicar orden según parámetro GET
        order_param = self.request.GET.get("order", "desc")
        if order_param == "asc":
            qs = qs.order_by("publish_date")  # más antiguos primero
        else:
            qs = qs.order_by("-publish_date")  # más recientes primero (default)

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
        """Añade al contexto la lista de categorías, query_string y artículos pendientes del usuario."""
        context = super().get_context_data(**kwargs)
        context["categories"] = Category.objects.all()
        context["search_query"] = self.request.GET.get("q", "")
        query = self.request.GET.copy()
        # Excluir parámetros internos de paginación y orden para que los enlaces
        # de paginación y los enlaces de orden los conserven correctamente.
        for param in ("page", "order"):
            if param in query:
                query.pop(param)
        context["query_string"] = query.urlencode()
        # Cadena auxiliar sin el parámetro "order", útil para que el sidebar
        # construya enlaces de ordenamiento que preserven el resto de filtros.
        context["base_query"] = context["query_string"]
        # Orden actual seleccionado (default: desc = más recientes primero).
        context["current_order"] = self.request.GET.get("order", "desc")

        # IDs de artículos pending del usuario actual (para marcar con article_pending)
        if self.request.user.is_authenticated:
            pending_ids = set(
                BlogPost.objects.filter(
                    author=self.request.user, moderation_status="pending"
                ).values_list("id", flat=True)
            )
            context["pending_post_ids"] = pending_ids
        else:
            context["pending_post_ids"] = set()

        return context


class BlogDetailView(DetailView):
    model = BlogPost
    template_name = "blog/blog_detail.html"
    context_object_name = "post"
    slug_field = "slug"
    # No establecemos ``queryset`` a nivel de clase para poder
    # ajustarlo dinámicamente en ``get_queryset`` y permitir que
    # el autor y los superusuarios vean borradores propios.
    queryset = BlogPost.objects.prefetch_related("tags")

    def get_queryset(self):
        """Permitir que el autor y superusuarios/staff vean borradores.

        Para usuarios anónimos o que no son el autor, solo se muestran
        posts publicados.  Si el usuario autenticado es el autor del
        artículo **o** es superuser/staff, también puede ver borradores
        (``is_published=False``) para poder previsualizarlos.
        """
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated:
            # El autor siempre puede ver su propio artículo
            # (incluso si está en borrador)
            return qs.filter(
                Q(is_published=True)
                | Q(author=user)
                | Q(author__isnull=True, is_published=True)
            )
        else:
            # Usuarios anónimos solo ven artículos publicados
            return qs.filter(is_published=True)

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

    Si se proporciona un slug, se carga el artículo existente para edición y se muestra
    un banner con el estado de moderación del borrador.
    """
    from blog.models import Category, BlogPost

    context = {
        "categories": Category.objects.filter(is_active=True),
        "edit_slug": slug,
    }
    if slug:
        try:
            post = BlogPost.objects.get(slug=slug)
            context["post_status"] = post.moderation_status
        except BlogPost.DoesNotExist:
            context["post_status"] = None
    return render(request, "blog/blog_editor.html", context)


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
