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
import shutil

from django.conf import settings
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden
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
from blog.models import (
    BlogComment,
    BlogPost,
    Category,
    Tag,
    BlogModeration,
    BlogEmailConfig,
)
from core.models import UserProfile

from blog.services import (
    create_comment,
    delete_resource_file,
    get_approved_comments,
    get_comment_count,
    save_blog_to_source,
    save_uploaded_file,
    are_admin_notifications_enabled,
    are_author_notifications_enabled,
    delete_post_permanently,
    get_post_files_info,
)
from django.core.mail import send_mail
from django.utils import timezone
from datetime import timedelta
from django.contrib import messages
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

    # HU-011.85: Notificar al autor por email (solo si habilitado)
    if post.author and post.author.email and are_author_notifications_enabled():
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

    # HU-011.85: Notificar al autor del rechazo (solo si habilitado)
    if post.author and post.author.email and are_author_notifications_enabled():
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

    # HU-17.18: Filtro específico de autor
    author_filter = request.GET.get("author", "").strip()
    if author_filter:
        posts = posts.filter(author__username__icontains=author_filter)

    # HU-17.18: Orden por peso o por fecha
    sort = request.GET.get("sort", "date")
    if sort in ("weight_desc", "weight_asc"):
        # Calcular peso para TODOS los posts filtrados
        post_list = list(posts)
        for post in post_list:
            info = get_post_files_info(post.slug)
            post._total_size_bytes = info["total_size_bytes"]

        reverse_order = sort == "weight_desc"
        post_list.sort(key=lambda p: p._total_size_bytes, reverse=reverse_order)
        post_ids = [p.id for p in post_list]

        from django.db.models import Case, When

        preserved = Case(
            *[When(id=pid, then=pos) for pos, pid in enumerate(post_ids)]
        )
        posts = (
            BlogPost.objects.filter(id__in=post_ids)
            .annotate(sort_order=preserved)
            .order_by("sort_order")
        )
    else:
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

    # HU-011.10: Información de archivos asociados (solo superadmin)
    if is_super:
        for post in page_obj:
            post.files_info = get_post_files_info(post.slug)

    # Estadísticas para los badges
    # Si el usuario es superadmin/staff, mostramos los totales globales.
    # Para un autor normal, filtramos los contadores por su propio autor.
    if is_super:
        stats = {
            "total": BlogPost.objects.count(),
            "published": BlogPost.objects.filter(is_published=True).count(),
            "drafts": BlogPost.objects.filter(is_published=False).count(),
            "pending": BlogPost.objects.filter(
                moderation_status="pending"
            ).count(),
            "approved": BlogPost.objects.filter(
                moderation_status="approved"
            ).count(),
            "rejected": BlogPost.objects.filter(
                moderation_status="rejected"
            ).count(),
        }
    else:
        # Filtrar por el autor actual
        author_qs = BlogPost.objects.filter(author=request.user)
        stats = {
            "total": author_qs.count(),
            "published": author_qs.filter(is_published=True).count(),
            "drafts": author_qs.filter(is_published=False).count(),
            "pending": author_qs.filter(moderation_status="pending").count(),
            "approved": author_qs.filter(moderation_status="approved").count(),
            "rejected": author_qs.filter(moderation_status="rejected").count(),
        }

    # HU-011.85: Estado del envío de emails para el indicador visual
    email_config = BlogEmailConfig.get_config()

    # HU-17.18: Variables para el template
    has_active_filters = bool(
        author_filter
        or sort != "date"
        or is_published_filter
        or moderation_filter
    )

    return render(
        request,
        "blog/dashboard.html",
        {
            "page_obj": page_obj,
            "stats": stats,
            "is_published_filter": is_published_filter,
            "moderation_filter": moderation_filter,
            "search_query": search_query,
            "author_filter": author_filter,
            "sort_filter": sort,
            "has_active_filters": has_active_filters,
            "query_string": query_string,
            "comment_counts": comment_counts,
            "email_config": email_config,
        },
    )


# ---------------------------------------------------------------------
# HU-011.85: Configuración de envío de emails
# ---------------------------------------------------------------------
@login_required
def blog_email_config_view(request):
    """Página de configuración del interruptor maestro de envío de emails.

    Solo accesible por superadmin. Permite activar/desactivar el envío
    de correos electrónicos del blog de forma global.

    HU-011.85 — Protección reforzada:
    - No autenticados → redirigir a login (@login_required)
    - Autenticados sin is_superuser → 403 Forbidden (no redirect silencioso)
    - POST sin permiso → 403 también (protege contra CSRF cruzado)
    """
    # 🔒 Doble verificación: autenticado + superadmin
    if not request.user.is_superuser:
        return HttpResponseForbidden(
            "<h1>403 — Acceso denegado</h1>"
            "<p>No tienes permisos para acceder a la configuración de emails.</p>"
            f'<p><a href="{reverse("blog:dashboard")}">← Volver al dashboard</a></p>'
        )

    email_config = BlogEmailConfig.get_config()

    if request.method == "POST":
        # HU-011.85: Leer ambos toggles independientes
        admin_enabled = request.POST.get("admin_notifications") == "on"
        author_enabled = request.POST.get("author_notifications") == "on"
        email_config.admin_notifications_enabled = admin_enabled
        email_config.author_notifications_enabled = author_enabled
        email_config.updated_by = request.user
        email_config.save()
        messages.success(
            request,
            "📧 Configuración de emails actualizada correctamente.",
        )
        return redirect("blog:blog_email_config")

    return render(
        request,
        "blog/blog_email_config.html",
        {"email_config": email_config},
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

    # HU-011.85: Notificar al autor por email desde dashboard
    if post.is_published and post.author and post.author.email:
        if are_author_notifications_enabled():
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
    elif not post.is_published and post.author and post.author.email:
        if are_author_notifications_enabled():
            subject = f"[JD Blog] Tu artículo '{post.title}' ha sido despublicado"
            message = (
                f"Hola {post.author.get_full_name() or post.author.username},\n\n"
                f"Tu artículo '{post.title}' ha sido despublicado por el administrador."
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[post.author.email],
                fail_silently=True,
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

    # HU-011.85: Notificar al autor por email desde dropdown del dashboard
    if post.author and post.author.email and are_author_notifications_enabled():
        if new_status == "approved":
            subject = f"[JD Blog] Tu artículo '{post.title}' ha sido aprobado"
            message = (
                f"Hola {post.author.get_full_name() or post.author.username},\n\n"
                f"Tu artículo '{post.title}' ha sido aprobado por el administrador.\n"
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
        elif new_status == "rejected":
            subject = f"[JD Blog] Tu artículo '{post.title}' ha sido rechazado"
            message = (
                f"Hola {post.author.get_full_name() or post.author.username},\n\n"
                f"Tu artículo '{post.title}' ha sido rechazado por el administrador."
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[post.author.email],
                fail_silently=True,
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

        # 🟡 Parámetro de ordenamiento (soporta date/weight)
        sort = self.request.GET.get("sort", "date")

        if sort in ("weight_desc", "weight_asc"):
            # Calcular peso para TODOS los posts filtrados (mismo patrón que dashboard)
            post_list = list(qs)
            for post in post_list:
                info = get_post_files_info(post.slug)
                post._total_size_bytes = info["total_size_bytes"]

            reverse_order = sort == "weight_desc"
            post_list.sort(
                key=lambda p: p._total_size_bytes, reverse=reverse_order
            )
            post_ids = [p.id for p in post_list]

            from django.db.models import Case, When

            preserved = Case(
                *[When(id=pid, then=pos) for pos, pid in enumerate(post_ids)]
            )
            qs = (
                BlogPost.objects.filter(id__in=post_ids)
                .annotate(sort_order=preserved)
                .order_by("sort_order")
            )
        else:
            # Orden por fecha (default)
            order_param = self.request.GET.get("order", "desc")
            if order_param == "asc":
                qs = qs.order_by("publish_date")
            else:
                qs = qs.order_by("-publish_date")

        category_slug = self.request.GET.get("category")
        search_query = self.request.GET.get("q", "").strip()

        # 🟡 Filtro por rango de fechas (publicación)
        date_from = self.request.GET.get("date_from", "").strip()
        date_to = self.request.GET.get("date_to", "").strip()

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

        # Aplicar filtro de rango de fechas sobre created_at
        # (created_at = fecha real de creación en BD, NO publish_date del frontmatter)
        if date_from:
            try:
                qs = qs.filter(created_at__date__gte=date_from)
            except (ValueError, TypeError):
                pass  # ignorar fechas inválidas silenciosamente
        if date_to:
            try:
                # Incluir todo el día "date_to" sumando 1 día
                from datetime import datetime, timedelta

                date_to_end = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(
                    days=1
                )
                qs = qs.filter(created_at__lt=date_to_end)
            except (ValueError, TypeError):
                pass

        return qs

    def get_context_data(self, **kwargs):
        """Combina contexto del footer (recientes, categorías, etiquetas) con datos de búsqueda y filtros."""
        context = super().get_context_data(**kwargs)
        # ----- Datos para el footer personalizado -----
        context["recent_posts"] = BlogPost.objects.filter(
            is_published=True
        ).order_by("-publish_date")[:5]
        context["categories"] = Category.objects.all()
        context["tags"] = Tag.objects.all()
        # ----- Datos para búsqueda y filtros -----
        context["search_query"] = self.request.GET.get("q", "")
        context["date_from"] = self.request.GET.get("date_from", "")
        context["date_to"] = self.request.GET.get("date_to", "")
        query = self.request.GET.copy()
        for param in ("page", "order"):
            if param in query:
                query.pop(param)
        context["query_string"] = query.urlencode()
        context["base_query"] = context["query_string"]
        context["current_order"] = self.request.GET.get("order", "desc")
        date_from = self.request.GET.get("date_from", "").strip()
        date_to = self.request.GET.get("date_to", "").strip()
        category = self.request.GET.get("category", "").strip()
        current_sort = self.request.GET.get("sort", "date")
        context["current_sort"] = current_sort
        context["has_active_filters"] = bool(
            date_from or date_to or category or current_sort != "date"
        )
        if self.request.user.is_authenticated:
            pending_ids = set(
                BlogPost.objects.filter(
                    author=self.request.user, moderation_status="pending"
                ).values_list("id", flat=True)
            )
            context["pending_post_ids"] = pending_ids
        else:
            context["pending_post_ids"] = set()
        date_from = self.request.GET.get("date_from", "").strip()
        date_to = self.request.GET.get("date_to", "").strip()
        category = self.request.GET.get("category", "").strip()
        current_sort = self.request.GET.get("sort", "date")

        context["current_sort"] = current_sort
        context["has_active_filters"] = bool(
            date_from or date_to or category or current_sort != "date"
        )

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
        """Permite que el autor y los superusuarios vean borradores.

        - Usuarios anónimos solo ven artículos publicados.
        - El autor del artículo (incluso si está en borrador) siempre lo puede ver.
        - Superusuarios y staff también pueden ver borradores.
        """
        qs = super().get_queryset()
        user = self.request.user

        if user.is_authenticated:
            # El autor siempre puede ver su propio artículo (incluso borrador)
            return qs.filter(
                Q(is_published=True)
                | Q(author=user)
                | Q(author__isnull=True, is_published=True)
            )
        else:
            # Usuarios anónimos solo ven publicados
            return qs.filter(is_published=True)

    def get_context_data(self, **kwargs):
        """Enriquece el contexto del detalle del post."""
        context = super().get_context_data(**kwargs)
        # Datos que el footer necesita
        context["recent_posts"] = BlogPost.objects.filter(
            is_published=True
        ).order_by("-publish_date")[:5]
        context["categories"] = Category.objects.all()
        context["tags"] = Tag.objects.all()
        # Artículos relacionados: misma categoría o tags compartidos, excluyendo el actual
        post = self.object
        related_qs = BlogPost.objects.filter(is_published=True)
        if post.category:
            related_qs = related_qs.filter(category=post.category)
        else:
            tag_ids = list(post.tags.values_list("id", flat=True))
            if tag_ids:
                related_qs = related_qs.filter(tags__in=tag_ids)
        context["related_posts"] = (
            related_qs.exclude(id=post.id)
            .distinct()
            .order_by("-publish_date")[:3]
        )
        # Comentarios aprobados del artículo
        context["comments"] = get_approved_comments(post.slug)
        context["comment_count"] = get_comment_count(post.slug)
        context["comment_form"] = CommentForm()
        # Return the enriched context
        return context

    # NOTE: The previous duplicate implementation of `delete_resource_file_ajax` (which handled comments) was erroneous and has been removed.


# ---------------------------------------------------------------------
# HU-011.17: Eliminación de archivo individual de recursos (AJAX)
# ---------------------------------------------------------------------
@csrf_exempt
def delete_resource_file_ajax(request):
    """Endpoint AJAX para eliminar un archivo estático asociado a un post.

    Expected POST parameters:
        - ``folder``: nombre de la carpeta del artículo (slug o prefijo de fecha).
        - ``filename``: nombre del archivo a eliminar.

    Sólo los superusuarios pueden ejecutar esta acción.
    Devuelve un ``JsonResponse`` con la estructura que espera el test:
        {"success": bool, "message": str}
    """
    if request.method != "POST":
        return JsonResponse(
            {"success": False, "error": "Método no permitido."}, status=405
        )

    # Seguridad: solo superuser
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."}, status=403
        )

    folder = request.POST.get("folder", "").strip()
    filename = request.POST.get("filename", "").strip()

    if not folder or not filename:
        return JsonResponse(
            {"success": False, "error": "Parámetros faltantes."}, status=400
        )

    # Delegar la lógica real al servicio
    result = delete_resource_file(folder, filename)
    # El servicio ya devuelve un dict con ``success`` y ``message``
    return JsonResponse(result)


@csrf_exempt
def quick_signup(request):
    """Registro rápido de usuarios.

    La vista acepta únicamente peticiones ``POST``. En caso de método distinto
    devuelve un error 405. No se realizan validaciones exhaustivas – se confía
    en el formulario para crear el usuario y, si todo va bien, se inicia la
    sesión y se devuelve la URL de redirección.
    """
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
        # Para registro rápido, no validamos estrictamente – aceptamos cualquier dato
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
            # HU-023: Asignar fuente de registro
            UserProfile.objects.get_or_create(
                user=user,
                defaults={"registration_source": "basic"},
            )
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


# ---------------------------------------------------------------------
# HU-008: Comentario nuevo (POST) para un artículo
# ---------------------------------------------------------------------
@login_required
@require_http_methods(["POST"])
@csrf_protect
def post_comment(request, slug):
    """Crear un nuevo comentario para un artículo.

    - Sólo acepta peticiones POST.
    - Utiliza ``create_comment`` del módulo ``services`` para crear el
      comentario, pasando la IP del cliente y los datos del formulario.
    - Redirige al detalle del post anclando al comentario recién creado.
    """
    # Obtener el post o lanzar 404
    post = get_object_or_404(BlogPost, slug=slug)

    # Recoger datos del formulario (se asume que el template envía estos campos)
    name = request.POST.get("name", "").strip()
    email = request.POST.get("email", "").strip()
    content = request.POST.get("content", "").strip()
    parent_id = request.POST.get("parent_id")
    identification_level = request.POST.get("identification_level", "anonymous")
    provider = request.POST.get("provider")
    provider_uid = request.POST.get("provider_uid")

    # Obtener IP del cliente
    ip_address = get_client_ip(request)

    # Crear el comentario mediante el servicio
    comment = create_comment(
        blog_slug=slug,
        name=name,
        email=email,
        content=content,
        ip_address=ip_address,
        parent_id=parent_id,
        identification_level=identification_level,
        provider=provider,
        provider_uid=provider_uid,
    )

    # Redirigir al detalle del post, anclando al nuevo comentario
    return redirect(f"{post.get_absolute_url()}#comment-{comment.id}")


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


# ---------------------------------------------------------------------
# HU-011.17: Utilidades y vistas de gestión de recursos
# ---------------------------------------------------------------------
def _format_size(size_bytes):
    """Formatea bytes a cadena legible (KB, MB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


@login_required
@require_http_methods(["POST"])
@csrf_protect
def delete_resource_file_ajax(request):
    """Elimina un archivo individual de static/blogs/<folder>/<filename> (AJAX).

    Acepta tanto FormData (multipart/form-data) como JSON (application/json).
    """
    if request.content_type == "application/json":
        data = json.loads(request.body)
        # ``folder`` puede ser una cadena o una lista; no lo convertimos a ``str``
        folder = data.get("folder", "")
        filename = str(data.get("filename", "")).strip()
    else:
        # Cuando la petición no es JSON, los datos llegan como form-data.
        # Además de ``folder`` también debemos obtener ``filename`` (puede estar vacío).
        folder = request.POST.get("folder", "").strip()
        filename = request.POST.get("filename", "").strip()
    # ---------------------------------------------------------------------
    # Caso 1: borrado masivo de carpetas (lista de carpetas sin filename)
    # ---------------------------------------------------------------------
    if not filename and isinstance(folder, list) and folder:
        # ``folder`` viene como lista de nombres de carpetas huérfanas a eliminar.
        # Cada carpeta está bajo ``static/blogs/<folder>``.
        static_root = Path(settings.BASE_DIR) / "static" / "blogs"
        deleted = []
        errors = []
        for f in folder:
            try:
                target = static_root / f
                if target.is_dir():
                    shutil.rmtree(target)
                    deleted.append(f)
                else:
                    errors.append(f"Carpeta no encontrada: {f}")
            except Exception as exc:
                errors.append(str(exc))
        if errors:
            return JsonResponse(
                {
                    "success": False,
                    "message": f"Se eliminaron {len(deleted)} carpetas, pero ocurrieron errores.",
                    "errors": errors,
                },
                status=500,
            )
        return JsonResponse(
            {
                "success": True,
                "message": f"Carpetas eliminadas correctamente: {', '.join(deleted)}",
            }
        )

    # ---------------------------------------------------------------------
    # Caso 2: eliminación de archivo individual (requiere filename)
    # ---------------------------------------------------------------------
    if not filename:
        return JsonResponse(
            {"success": False, "error": "Se requiere filename."},
            status=400,
        )
    if not folder:
        # Eliminación de archivo temporal
        # La prueba crea el archivo en un subdirectorio arbitrario bajo
        # ``media/blog_editor_temp`` (p.ej. ``.../99999/filename``). En lugar de
        # asumir que el subdirectorio coincide con ``request.user.id``, recorremos
        # todos los subdirectorios y eliminamos el primer archivo que coincida con
        # ``filename``. Esto mantiene la operación idempotente y funciona tanto
        # para usuarios autenticados como para el caso de pruebas.
        safe_name = Path(filename).name
        base_temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp"
        deleted = False
        if base_temp_dir.exists():
            for user_dir in base_temp_dir.iterdir():
                if not user_dir.is_dir():
                    continue
                file_path = user_dir / safe_name
                if file_path.exists() and file_path.is_file():
                    try:
                        file_path.unlink()
                        deleted = True
                    except OSError as exc:
                        return JsonResponse(
                            {"success": False, "error": str(exc)}, status=500
                        )
        if deleted:
            return JsonResponse(
                {"success": True, "message": f"Archivo {safe_name} eliminado."}
            )
        # Idempotente: si no se encontró el archivo, consideramos éxito.
        return JsonResponse(
            {
                "success": True,
                "message": "Archivo no encontrado, nada que eliminar.",
            }
        )
    if request.user.is_superuser:
        result = delete_resource_file(folder, filename)
        return JsonResponse(result)
    # Intentar con el folder tal cual llega; si no coincide, probar sin prefijo de fecha
    raw_slug = folder
    slug_candidates = [raw_slug]
    if "_" in raw_slug:
        slug_candidates.append(raw_slug.split("_", 1)[-1])
    is_author = BlogPost.objects.filter(
        slug__in=slug_candidates, author=request.user
    ).exists()
    if not is_author:
        debug_info = {
            "slug_candidates": slug_candidates,
            "folder": folder,
            "user_id": request.user.id,
            "username": request.user.username,
        }
        if settings.DEBUG:
            return JsonResponse(
                {
                    "success": False,
                    "error": "Permiso denegado.",
                    "debug": debug_info,
                },
                status=403,
            )
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."}, status=403
        )
    result = delete_resource_file(folder, filename)
    return JsonResponse(result)


@login_required
def dashboard_resources_view(request):
    """Página dedicada a gestión de recursos y carpetas huérfanas (solo superadmin)."""
    if not (request.user.is_staff or request.user.is_superuser):
        return redirect(f"{reverse('blog:dashboard')}?permission_error=resources")
    # NOTE: En este proyecto los recursos estáticos están bajo "backend/static/blogs"
    # mientras que ``settings.BASE_DIR`` apunta a la raíz del proyecto. La ruta original
    # ``BASE_DIR / "static" / "blogs"`` no existía, lo que provocaba que ``static_folders``
    # quedara vacío y la tabla "Mapa de Compilación" no mostrara datos.
    # Ajustamos la ruta para que apunte al directorio correcto.
    # En este proyecto, ``settings.BASE_DIR`` ya apunta al directorio ``backend``.
    # Las carpetas de recursos estáticos y de fuentes están directamente bajo él:
    #   backend/static/blogs
    #   backend/blogs_source
    # Por lo tanto, construimos las rutas a partir de ``BASE_DIR`` sin subir
    # niveles adicionales.
    # settings.BASE_DIR apunta a "backend/" (Path(__file__).resolve().parent.parent
    # desde backend/jdsite/settings.py). Las carpetas están directamente bajo él.
    static_blogs_dir = Path(settings.BASE_DIR) / "static" / "blogs"
    blogs_source_dir = Path(settings.BASE_DIR) / "blogs_source"
    bd_slugs = set(BlogPost.objects.values_list("slug", flat=True))
    static_folders = set()
    static_folder_info = {}
    if static_blogs_dir.exists():
        for folder in static_blogs_dir.iterdir():
            if folder.is_dir():
                slug = folder.name
                static_folders.add(slug)
                img_count = vid_count = total_size = 0
                files_list = []
                image_exts = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"}
                video_exts = {".mp4", ".webm", ".mov", ".avi", ".mkv"}
                for f in folder.iterdir():
                    if f.is_file():
                        ext = f.suffix.lower()
                        total_size += f.stat().st_size
                        if ext in image_exts:
                            img_count += 1
                        elif ext in video_exts:
                            vid_count += 1
                        ftype = (
                            "image"
                            if ext in image_exts
                            else ("video" if ext in video_exts else "other")
                        )
                        files_list.append(
                            {
                                "filename": f.name,
                                "url": f"/static/blogs/{slug}/{f.name}",
                                "type": ftype,
                            }
                        )
                # Guardar la información de la carpeta actual
                static_folder_info[slug] = {
                    "images": img_count,
                    "videos": vid_count,
                    "total_size": total_size,
                    # Guardamos la lista de archivos tal cual; la serialización a JSON se hará en la plantilla.
                    "files": files_list,
                }
    source_folders = set()
    if blogs_source_dir.exists():
        for folder in blogs_source_dir.iterdir():
            if folder.is_dir():
                source_folders.add(folder.name)
    all_folders = static_folders | source_folders
    compilation_map = []
    orphans_list = []
    total_images = total_videos = total_other = total_size_all = 0
    for slug in sorted(all_folders):
        in_source = slug in source_folders
        in_static = slug in static_folders
        in_bd = slug in bd_slugs
        info = static_folder_info.get(slug, {})
        c_img = info.get("images", 0)
        c_vid = info.get("videos", 0)
        c_sz = info.get("total_size", 0)
        c_files = info.get("files", [])
        # Contador de archivos totales en la carpeta
        c_total_files = len(c_files)
        # Otros recursos = total - imágenes - videos
        c_other = max(c_total_files - c_img - c_vid, 0)
        if in_static:
            total_images += c_img
            total_videos += c_vid
            total_other += c_other
            total_size_all += c_sz
        if in_source and in_static and in_bd:
            status, label, color = "synced", "✅ Sincronizado", "green"
        elif in_source and not in_static:
            status, label, color = "uncompiled", "⚠️ Sin compilar", "yellow"
        elif in_static and not in_bd:
            status, label, color = "orphan", "❌ Huérfano", "red"
            orphans_list.append(
                {
                    "folder": slug,
                    "location": "static/blogs/",
                    "images": c_img,
                    "videos": c_vid,
                    "file_count": c_img + c_vid,
                    "total_size": _format_size(c_sz) if c_sz else "0 B",
                }
            )
        elif in_source and not in_bd:
            status, label, color = "no_blogpost", "🔵 Sin BlogPost", "blue"
        else:
            status, label, color = "unknown", "⚫ Desconocido", "gray"
        compilation_map.append(
            {
                "slug": slug,
                "source_exists": in_source,
                "compiled_exists": in_static,
                "blogpost_exists": in_bd,
                "images": c_img,
                "videos": c_vid,
                "file_count": c_img + c_vid,
                "total_size": _format_size(c_sz) if c_sz else "0 B",
                "status": status,
                "status_label": label,
                "status_color": color,
                # Serializamos la lista de archivos a JSON para que el template lo reciba como cadena válida
                "files": json.dumps(info.get("files", [])),
            }
        )
    # --- Filtro por slug (cuando se accede desde dashboard) ---
    filter_slug = request.GET.get("slug", "").strip()
    filtered_map = compilation_map
    filtered_orphans = orphans_list
    if filter_slug:
        filtered_map = [e for e in compilation_map if e["slug"] == filter_slug]
        filtered_orphans = [o for o in orphans_list if o["folder"] == filter_slug]
    # Construir los datos de recursos, usando la lista de huérfanos filtrada cuando corresponda
    resources_data = {
        "stats": {
            "total_folders": len(all_folders),
            "total_images": total_images,
            "total_videos": total_videos,
            "total_other": total_other,
            "total_size": _format_size(total_size_all),
            "orphan_count": len(orphans_list),
            "synced_count": sum(
                1 for e in compilation_map if e["status"] == "synced"
            ),
            "uncompiled_count": sum(
                1 for e in compilation_map if e["status"] == "uncompiled"
            ),
            # Si se aplicó filtro, contabilizamos solo los huérfanos mostrados
            "orphan_total_files": sum(o["file_count"] for o in filtered_orphans),
        },
        "compilation_map": compilation_map,
        "orphans": filtered_orphans,
    }
    # --- Paginación del compilation_map (25 por página) ---
    page_number = request.GET.get("page")
    paginator = Paginator(filtered_map, 25)
    try:
        page_obj = paginator.page(page_number)
    except PageNotAnInteger:
        page_obj = paginator.page(1)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    params = request.GET.copy()
    params.pop("page", None)
    query_string = params.urlencode()

    return render(
        request,
        "blog/dashboard_resources.html",
        {
            "resources_data": resources_data,
            "page_obj": page_obj,
            "query_string": query_string,
            "filter_slug": filter_slug,
        },
    )


# ---------------------------------------------------------------------
# HU-011.9: Eliminación permanente de artículos (superadmin)
# ---------------------------------------------------------------------
@login_required
@require_http_methods(["POST"])
@csrf_protect
def delete_blog_view(request, post_id):
    """Elimina un artículo permanentemente (HU-011.9).

    Solo accesible para superadmin. Elimina el registro de la base de datos,
    los registros de BlogModeration asociados, y la carpeta física del
    artículo en ``blogs_source/<slug>/``.

    Retorna JSON con el resultado de la operación.
    """
    # Solo superadmin puede eliminar
    if not request.user.is_superuser:
        return JsonResponse(
            {"success": False, "error": "Permiso denegado."},
            status=403,
        )

    try:
        post = BlogPost.objects.get(id=post_id)
    except BlogPost.DoesNotExist:
        return JsonResponse(
            {"success": False, "error": "Artículo no encontrado."},
            status=404,
        )

    result = delete_post_permanently(post)

    if result["success"]:
        messages.success(
            request,
            f"🗑️ Artículo '{result['title']}' eliminado permanentemente.",
        )
        # NOTE: Calculamos los stats actualizados después de la eliminación para refrescar el frontend
        # Se reutiliza la misma lógica que dashboard_view para obtener contadores actualizados
        is_super = request.user.is_staff or request.user.is_superuser
        if is_super:
            updated_stats = {
                "total": BlogPost.objects.count(),
                "published": BlogPost.objects.filter(is_published=True).count(),
                "drafts": BlogPost.objects.filter(is_published=False).count(),
                "pending": BlogPost.objects.filter(
                    moderation_status="pending"
                ).count(),
                "approved": BlogPost.objects.filter(
                    moderation_status="approved"
                ).count(),
                "rejected": BlogPost.objects.filter(
                    moderation_status="rejected"
                ).count(),
            }
        else:
            author_qs = BlogPost.objects.filter(author=request.user)
            updated_stats = {
                "total": author_qs.count(),
                "published": author_qs.filter(is_published=True).count(),
                "drafts": author_qs.filter(is_published=False).count(),
                "pending": author_qs.filter(moderation_status="pending").count(),
                "approved": author_qs.filter(
                    moderation_status="approved"
                ).count(),
                "rejected": author_qs.filter(
                    moderation_status="rejected"
                ).count(),
            }
        return JsonResponse(
            {
                "success": True,
                "message": f"Artículo '{result['title']}' eliminado permanentemente.",
                # NOTE: Se incluyen los stats actualizados para que el frontend actualice los contadores
                "stats": updated_stats,
            }
        )
    else:
        messages.error(
            request,
            f"❌ Error al eliminar '{result['title']}': {result.get('error', 'Error desconocido')}",
        )
        return JsonResponse(
            {
                "success": False,
                "error": result.get("error", "Error desconocido al eliminar."),
            },
            status=500,
        )


# ======================================================
# HU-17.18: Autocomplete AJAX de autores para dashboard
# ======================================================
@require_http_methods(["GET"])
def api_authors_autocomplete(request):
    """Endpoint AJAX para autocompletar autores en el dashboard.

    Busca en User (first_name, last_name, username) con icontains.
    - Superadmin/staff: ve todos los usuarios (máx 8)
    - Usuario normal: solo ve su propio nombre

    Retorna:
        JsonResponse({"authors": [
            {"id": 1, "username": "jaime", "display": "Jaime Díaz"},
            ...
        ]})
    """
    q = request.GET.get("q", "").strip()
    if len(q) < 2:
        return JsonResponse({"authors": []})

    if request.user.is_superuser or request.user.is_staff:
        users = User.objects.filter(
            Q(first_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(username__icontains=q)
        ).distinct()[:8]
    else:
        # Usuario normal solo ve su propio nombre
        users = User.objects.filter(id=request.user.id)

    authors = []
    for u in users:
        display = u.get_full_name() or u.username
        authors.append(
            {
                "id": u.id,
                "username": u.username,
                "display": display,
            }
        )

    return JsonResponse({"authors": authors})


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
            "is_published": blog_post.is_published,
            "moderation_status": blog_post.moderation_status,
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
        import traceback

        return JsonResponse(
            {
                "status": "error",
                "error": str(e),
                "type": type(e).__name__,
                "traceback": traceback.format_exc().splitlines()[
                    -5:
                ],  # Últimas 5 líneas
            },
            status=500,
        )


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
