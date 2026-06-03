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


# ======================================================
# HU-011: Editor Online - Servicio de Guardado de Blogs
# ======================================================

import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.utils.text import slugify
from allauth.socialaccount.models import SocialAccount


def save_blog_to_source(data, user):
    """
    Guarda un artículo en blogs_source/ y ejecuta import_blogs.

    Recibe:
        data (dict): title, description, content_md, category, tags,
                     tiempo_lectura, meta_title, meta_description,
                     keywords, palabra_clave_principal, files[]
        user (User): usuario autenticado

    Retorna:
        dict: {slug, folder, published}
    """
    # 1. Extraer datos
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    content_md = data.get("content_md", "")
    category = data.get("category", "").strip()
    tags = data.get("tags", [])
    tiempo_lectura = int(data.get("tiempo_lectura", 1))
    meta_title = data.get("meta_title") or title
    meta_description = data.get("meta_description") or description
    keywords = data.get("keywords", "")
    palabra_clave_principal = data.get("palabra_clave_principal", "")
    files_list = data.get("files", [])
    is_admin = user.is_superuser

    # 2. Generar slug único
    base_slug = slugify(title)[:60] or f"articulo-{uuid.uuid4().hex[:8]}"
    slug = base_slug
    counter = 1
    source_dir = Path(settings.BASE_DIR) / "blogs_source"
    while list(source_dir.glob(f"*_{slug}")):
        slug = f"{base_slug}-{counter}"
        counter += 1

    # 3. Crear carpeta YYYY-MM-DD_slug/
    today = datetime.now().strftime("%Y-%m-%d")
    folder_name = f"{today}_{slug}"
    target_dir = source_dir / folder_name
    target_dir.mkdir(parents=True, exist_ok=True)

    # 4. Mover archivos de /media/blog_editor_temp/<user_id>/ a target_dir
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
    image_filename = ""
    for f in files_list:
        filename = f.get("filename", "")
        filetype = f.get("type", "image")
        src = temp_dir / filename
        if src.exists():
            shutil.move(str(src), str(target_dir / filename))
            if filetype == "image" and not image_filename:
                image_filename = filename

    # 5. Obtener proveedor OAuth del usuario
    try:
        provider = user.socialaccount_set.first().provider
    except Exception:
        provider = "local"

    # 6. Generar frontmatter
    author_name = user.get_full_name() or user.username
    frontmatter = f"""---
title: "{title}"
description: "{description}"
date: {today}
draft: {'false' if is_admin else 'true'}
image: "{image_filename}"
author: "{author_name}"
author_email: "{user.email}"
author_provider: "{provider}"
category: "{category}"
tags: {json.dumps(tags, ensure_ascii=False)}
meta_title: "{meta_title}"
meta_description: "{meta_description}"
keywords: "{keywords}"
tiempo_lectura: {tiempo_lectura}
palabra_clave_principal: "{palabra_clave_principal}"
---


"""

    # 7. Guardar blog.md
    blog_content = frontmatter + content_md
    (target_dir / "blog.md").write_text(blog_content, encoding="utf-8")

    # 8. Ejecutar import_blogs (el comando registra el artículo en BD)
    call_command("import_blogs")

    return {
        "slug": slug,
        "folder": folder_name,
        "published": is_admin,
        "status": "published" if is_admin else "draft",
    }


def save_uploaded_file(uploaded_file, user):
    """
    Guarda un archivo subido (imagen/video) en /media/blog_editor_temp/<user_id>/
    y retorna metadatos.

    Recibe:
        uploaded_file (InMemoryUploadedFile): archivo subido
        user (User): usuario autenticado

    Retorna:
        dict: {filename, url, type} o None si hay error
    """
    # Extensiones permitidas
    valid_ext = (
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".mp4",
        ".webm",
        ".mov",
        ".avi",
    )
    ext = Path(uploaded_file.name).suffix.lower()
    if ext not in valid_ext:
        return None

    # Validar tamaño (100MB máximo)
    max_size = 100 * 1024 * 1024
    if uploaded_file.size > max_size:
        return None

    # Asegurar nombre único para evitar colisiones
    original_name = Path(uploaded_file.name).stem
    safe_name = f"{original_name}{ext}"
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
    temp_dir.mkdir(parents=True, exist_ok=True)

    filepath = temp_dir / safe_name
    with open(filepath, "wb+") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    # Determinar tipo
    video_exts = (".mp4", ".webm", ".mov", ".avi")
    ftype = "video" if ext in video_exts else "image"

    # Construir URL accesible para el frontend. Usamos MEDIA_URL que normalmente apunta a '/media/'
    # y la ruta donde guardamos los archivos temporales: blog_editor_temp/<user_id>/
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    url_path = f"{media_url.rstrip('/')}/blog_editor_temp/{user.id}/{safe_name}"
    return {
        "filename": safe_name,
        "url": url_path,
        "type": ftype,
    }
