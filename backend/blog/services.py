from django.utils.html import escape
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from datetime import timedelta
from django.db.models import Prefetch

from .models import BlogComment


def create_comment(
    blog_slug,
    name,
    email,
    content,
    ip_address,
    parent_id=None,
    identification_level="anonymous",
    provider=None,
    provider_uid=None,
):
    """
    Crea un nuevo comentario pendiente de moderacion
    """
    from django.utils import timezone

    # Sanitizar todo el contenido
    name = escape(name.strip())
    content = escape(content.strip())

    # Validar longitud máxima (el modelo permite 1000)
    if len(content) > 1000:
        raise ValueError(
            "El contenido del comentario no puede exceder los 1000 caracteres."
        )

    if email:
        email = email.strip().lower()

    # Validar parent si existe
    parent = None
    if parent_id:
        try:
            parent = BlogComment.objects.get(id=parent_id, status="approved")
        except BlogComment.DoesNotExist:
            parent = None

    # Detectar administrador por dominio de email
    is_admin = False
    if email and email.endswith("@jaimediaz817.com"):
        is_admin = True

    # Calcular editable_until
    editable_until = None
    if identification_level == "identified":
        editable_until = timezone.now() + timedelta(days=7)
    elif identification_level == "registered":
        # Sin límite mientras la sesión esté activa (se maneja en vista)
        editable_until = None

    comment = BlogComment.objects.create(
        blog_slug=blog_slug,
        parent=parent,
        name=name,
        email=email,
        content=content,
        ip_address=ip_address,
        status="pending",
        identification_level=identification_level,
        provider=provider,
        provider_uid=provider_uid,
        is_admin=is_admin,
        editable_until=editable_until,
    )

    # ✅ FASE 9: Notificacion por email al administrador
    admin_url = reverse("admin:blog_blogcomment_change", args=[comment.id])
    full_admin_link = f"{settings.SITE_URL}{admin_url}"

    email_subject = f"[JD Blog] Nuevo comentario pendiente de moderacion"
    email_body = f"""
Nuevo comentario recibido en el blog:

📝 Blog: {blog_slug}
👤 Nombre: {name}
📧 Email: {email if email else 'No proporcionado'}
🌐 IP: {ip_address}
📅 Fecha: {comment.created_at.strftime('%d/%m/%Y %H:%M')}

💬 Contenido:
{content}

🔗 Moderar comentario: {full_admin_link}

Este comentario esta actualmente PENDIENTE y no es visible publicamente hasta que lo apruebes.
    """

    send_mail(
        subject=email_subject,
        message=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.OWNER_EMAIL],
        fail_silently=True,
    )

    return comment


def get_approved_comments(blog_slug, limit=None):
    """
    Devuelve los comentarios aprobados para un blog, con sus respuestas
    Si limit se especifica, devuelve solo esa cantidad inicial
    """
    queryset = (
        BlogComment.objects.filter(
            blog_slug=blog_slug, status="approved", parent__isnull=True
        )
        .order_by("-created_at")
        .prefetch_related(
            Prefetch(
                "replies",
                queryset=BlogComment.objects.filter(status="approved"),
            )
        )
    )
    if limit is not None:
        return queryset[:limit]
    return queryset


def get_comment_count(blog_slug):
    """
    Devuelve la cantidad total de comentarios aprobados
    """
    return BlogComment.objects.filter(
        blog_slug=blog_slug, status="approved"
    ).count()
