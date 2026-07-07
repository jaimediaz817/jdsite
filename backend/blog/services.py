from django.utils.html import escape
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse

from .utils import get_owner_email
from datetime import timedelta
from django.db.models import Prefetch

import yaml
import re

from .models import BlogComment, BlogPost
from .utils.importer.filename_utils import sanitizar_nombre


def are_admin_notifications_enabled():
    """Verifica si las notificaciones al admin están habilitadas (HU-011.85).

    Consulta la tabla singleton ``BlogEmailConfig`` para decidir si se
    deben enviar notificaciones por correo al administrador.
    """
    from .models import BlogEmailConfig

    return BlogEmailConfig.get_config().admin_notifications_enabled


def are_author_notifications_enabled():
    """Verifica si las notificaciones al autor están habilitadas (HU-011.85).

    Consulta la tabla singleton ``BlogEmailConfig`` para decidir si se
    deben enviar notificaciones por correo al autor.
    """
    from .models import BlogEmailConfig

    return BlogEmailConfig.get_config().author_notifications_enabled


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

    # ✅ FASE 9: Notificacion por email al administrador (HU-011.85)
    if are_admin_notifications_enabled():
        admin_url = reverse("admin:blog_blogcomment_change", args=[comment.id])
        full_admin_link = f"{settings.SITE_URL}{admin_url}"
        dashboard_link = (
            f"{settings.SITE_URL}/blog/dashboard/comments/{blog_slug}/"
        )

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

🔗 Moderar desde Dashboard: {dashboard_link}
🔗 Moderar desde Admin Django: {full_admin_link}

Este comentario esta actualmente PENDIENTE y no es visible publicamente hasta que lo apruebes.
        """

        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[get_owner_email()],
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
# HU-011.4: Consistencia Markdown ↔ Editor Online
# ======================================================
# Constantes de campos gestionados por el editor. Cualquier campo
# del frontmatter que NO esté en esta lista se preserva tal cual
# (merge inteligente).
# ======================================================
# Los campos que el editor gestiona directamente. "cover_image" reemplaza al antiguo
# campo "image" para ser coherente con el modelo ``BlogPost``.
EDITOR_MANAGED_FIELDS = {
    "title",
    "description",
    "date",
    "draft",
    "cover_image",
    "category",
    "tags",
    "meta_title",
    "meta_description",
    "keywords",
    "tiempo_lectura",
    "palabra_clave_principal",
    "author",
    "author_email",
    "author_provider",
    "author_id",
    # HU-014: tiempo_lectura alias
    "reading_time",
}


def _parse_frontmatter(text):
    """
    Parsea el frontmatter YAML de un .md. Retorna (dict, body_str).
    Si no hay frontmatter, retorna ({}, text).
    """
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    try:
        fm = yaml.safe_load(parts[1]) or {}
        if not isinstance(fm, dict):
            fm = {}
        return fm, parts[2]
    except Exception:
        return {}, text


def _build_frontmatter(fm_dict):
    """
    Construye el string del frontmatter YAML desde un dict.
    Mantiene el orden de las claves que ya existían y añade las
    nuevas al final. Esto preserva el formato legible.
    """
    lines = ["---"]
    for key, value in fm_dict.items():
        # Saltar valores None o vacíos que no aportan
        if value is None or value == "":
            # Solo saltar si NO es draft (que puede ser false)
            if key != "draft":
                continue
        if isinstance(value, list):
            # tags: ["a", "b", "c"]
            value_str = json.dumps(value, ensure_ascii=False)
            lines.append(f"{key}: {value_str}")
        elif isinstance(value, bool):
            lines.append(f"{key}: {'true' if value else 'false'}")
        elif isinstance(value, int):
            lines.append(f"{key}: {value}")
        else:
            # String normal — escapar comillas dobles internas
            escaped = str(value).replace('"', '\\"')
            lines.append(f'{key}: "{escaped}"')
    lines.append("---")
    lines.append("")  # línea en blanco después del cierre
    return "\n".join(lines) + "\n"


import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management import call_command
from django.utils.text import slugify


def save_blog_to_source(data, user):
    """
    HU-011.4: Guarda o actualiza un artículo en blogs_source/ y ejecuta
    import_blogs. Hace MERGE inteligente del frontmatter:
    - Campos gestionados por el editor: se sobreescriben.
    - Campos custom del .md original: se PRESERVAN intactos.

    Recibe:
        data (dict): title, description, content_md, category, tags,
                     tiempo_lectura, meta_title, meta_description,
                     keywords, palabra_clave_principal, files[],
                     cover_filename (opcional), slug (opcional)
        user (User): usuario autenticado

    Retorna:
        dict: {slug, folder, published, status}
    """
    # 1. Extraer datos del payload
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
    cover_filename = data.get("cover_filename", "").strip()
    is_admin = user.is_superuser

    # Detectar si es edición o creación
    existing_slug = data.get("slug", "").strip()
    is_edit = bool(existing_slug)

    # 2. Determinar carpeta y leer frontmatter previo si es edición
    source_dir = Path(settings.BASE_DIR) / "blogs_source"
    target_dir = None
    existing_fm = {}  # frontmatter del .md original (vacío si es nuevo)

    # Por defecto, un artículo NUEVO es borrador (no publicado)
    is_published = is_admin

    # Si es edición, verificar si el artículo ya existe y está publicado
    if is_edit:
        # Buscar en BD primero para preservar estado publicado
        try:
            existing_post = BlogPost.objects.get(slug=existing_slug)
            is_published = (
                existing_post.is_published
                and existing_post.moderation_status == "approved"
            )
        except BlogPost.DoesNotExist:
            pass

        for folder in source_dir.iterdir():
            if folder.is_dir():
                if (
                    folder.name == existing_slug
                    or folder.name.endswith(f"_{existing_slug}")
                    or (
                        "_" in folder.name
                        and "_".join(folder.name.split("_")[1:]) == existing_slug
                    )
                ):
                    target_dir = folder
                    break

        if not target_dir:
            # Crear la carpeta si no existe (artículo recién creado o import_blogs no ejecutó)
            target_dir = source_dir / existing_slug
            target_dir.mkdir(parents=True, exist_ok=True)

        # Leer frontmatter existente para hacer merge
        blog_file = target_dir / "blog.md"
        if blog_file.exists():
            try:
                raw = blog_file.read_text(encoding="utf-8")
                existing_fm, _ = _parse_frontmatter(raw)
            except Exception:
                pass

            # Preservar estado draft del frontmatter (pero solo si no está ya publicado en BD)
            draft_val = existing_fm.get("draft")
            if draft_val is not None and not is_published:
                is_published = str(draft_val).lower() != "true"

    # 3. Generar slug
    today = datetime.now().strftime("%Y-%m-%d")

    if is_edit:
        slug = existing_slug
        folder_name = target_dir.name
    else:
        base_slug = slugify(title)[:60] or f"articulo-{uuid.uuid4().hex[:8]}"
        slug = base_slug
        counter = 1
        while list(source_dir.glob(f"*_{slug}")):
            slug = f"{base_slug}-{counter}"
            counter += 1
        folder_name = f"{today}_{slug}"
        target_dir = source_dir / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)

    # 4. Mover archivos subidos de /media/blog_editor_temp/<user_id>/ a target_dir
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
    image_filename = ""

    # Mapeo nombre_original -> nombre_sanitizado para actualizar rutas en el markdown
    moved_sanitized = {}

    # Primero mover todos los archivos
    for f in files_list:
        filename = f.get("filename", "")
        filetype = f.get("type", "image")
        src = temp_dir / filename
        if src.exists():
            safe_name = sanitizar_nombre(filename)
            if safe_name != filename:
                # Renombrar para eliminar espacios/caracteres conflictivos
                destino = target_dir / safe_name
                shutil.move(str(src), str(destino))
                moved_sanitized[filename] = safe_name
            else:
                shutil.move(str(src), str(target_dir / filename))
            if filetype == "image" and not image_filename:
                image_filename = safe_name if safe_name else filename

    # 4.1. HU-011.4 Fase 4: cover_filename del editor tiene PRIORIDAD ABSOLUTA
    # Después de mover todos los archivos, si el usuario especificó una portada,
    # esa es la que usamos, independientemente de si es la primera imagen o no.
    if cover_filename:
        # Verificar que el cover_filename realmente esté en la carpeta destino
        # (ya debería estar después del bucle de movimiento O ya existir en target_dir)
        if (target_dir / cover_filename).exists():
            image_filename = cover_filename
        else:
            # Si pidió un cover que no existe, intentar buscar en target_dir
            # (puede que la imagen ya esté en la carpeta pero con nombre diferente)
            for f in target_dir.iterdir():
                if f.is_file() and f.name.lower() == cover_filename.lower():
                    image_filename = f.name
                    break
            # Si aún no se encuentra, mantener la primera imagen del bucle anterior
    # Si no hay cover_filename especificado, mantenemos la primera imagen del bucle

    # 4.2. En edición, si no hay cover nuevo, preservar el del .md original
    if is_edit and not image_filename:
        # Recuperamos la portada guardada previamente. El frontmatter usa
        # la clave ``cover_image`` (también aceptamos ``image`` por
        # compatibilidad con artículos antiguos). El valor puede venir
        # como:
        #   - ruta completa: "/static/blogs/<slug>/<filename>"
        #   - solo el nombre: "<filename>"
        #   - ruta relativa Markdown: "./<filename>" o "<filename>"
        # Lo normalizamos a **solo el nombre del archivo** para que la
        # lógica de abajo construya la ruta correcta
        # ``/static/blogs/<folder_name>/<filename>``.
        raw_cover = existing_fm.get("cover_image", "") or existing_fm.get(
            "image", ""
        )
        if raw_cover:
            # ``Path(...).name`` extrae solo el nombre del archivo,
            # descartando cualquier prefijo de ruta.
            image_filename = Path(str(raw_cover).strip()).name
        if not image_filename:
            # Fallback: primera imagen de la carpeta
            for f in target_dir.iterdir():
                if f.is_file() and f.suffix.lower() in (
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".gif",
                    ".webp",
                ):
                    image_filename = f.name
                    break

    # 5. HU-011.4 Fase 2: Preservar author_email y author originales
    # Si el .md ya tiene un autor, lo respetamos (no se sobreescribe con
    # el usuario que está editando). Solo en artículos NUEVOS se asigna
    # el autor actual.
    if is_edit and existing_fm.get("author_email"):
        author_name = existing_fm.get(
            "author", user.get_full_name() or user.username
        )
        author_email = existing_fm.get("author_email")
        author_provider = existing_fm.get("author_provider", "local")
    else:
        author_name = user.get_full_name() or user.username
        author_email = user.email
        try:
            author_provider = user.socialaccount_set.first().provider
        except Exception:
            author_provider = "local"

    # 6. HU-011.4 Fase 1: MERGE inteligente del frontmatter
    # Empezamos con existing_fm (preserva TODO lo desconocido) y
    # sobreescribimos solo los campos gestionados por el editor.
    new_fm = dict(existing_fm)  # copia

    # Campos gestionados por el editor
    new_fm["title"] = title
    new_fm["description"] = description
    new_fm["date"] = today
    # 🟡 CORREGIDO: draft = True significa "es borrador" (NO publicado).
    # Antes guardaba is_published (False para usuarios normales), lo que
    # provocaba que import_blogs interpretara draft: false → is_published=True.
    new_fm["draft"] = not is_published  # True = borrador, False = publicado
    # NOTE: El campo de portada en el modelo se llama ``cover_image``.
    # Anteriormente se guardaba bajo la clave ``image`` en el frontmatter,
    # lo que provocaba que la plantilla ``blog_list.html`` no encontrara la ruta.
    # ``cover_image`` es coherente con el modelo y el filtro ``blog_thumbnail``.
    # Guardamos la ruta completa de la portada para que las plantillas puedan servirla
    # directamente desde ``/static/blogs/<folder>/<filename>``.
    # ``folder_name`` contiene el nombre del directorio del artículo (con prefijo de fecha
    # si es nuevo o el nombre existente en caso de edición).
    # Si se subió una nueva imagen, usamos su ruta; si no, conservamos la portada
    # existente (útil al editar un artículo sin cambiar la imagen). ``existing_fm``
    # contiene el front‑matter previo, por lo que podemos reutilizar su valor.
    if image_filename:
        new_fm["cover_image"] = f"/static/blogs/{folder_name}/{image_filename}"
    else:
        # Mantener la portada anterior cuando no se proporciona una nueva.
        new_fm["cover_image"] = existing_fm.get("cover_image", "")
    new_fm["category"] = category
    new_fm["tags"] = tags
    new_fm["meta_title"] = meta_title
    new_fm["meta_description"] = meta_description
    new_fm["keywords"] = keywords
    new_fm["tiempo_lectura"] = tiempo_lectura
    new_fm["palabra_clave_principal"] = palabra_clave_principal
    new_fm["author"] = author_name
    new_fm["author_email"] = author_email
    new_fm["author_provider"] = author_provider
    new_fm["author_id"] = user.id

    # 4.3. Si se sanitizó algún nombre, actualizar las rutas en el markdown
    # para que apunten al nombre real en disco (sin espacios).
    if moved_sanitized:
        for original, safe_name in moved_sanitized.items():
            # Reemplazar todas las ocurrencias del nombre original (con o sin ruta previa)
            content_md = content_md.replace(original, safe_name)

    # Construir el archivo final y guardarlo
    blog_path = target_dir / "blog.md"
    blog_path.write_text(
        _build_frontmatter(new_fm) + content_md, encoding="utf-8"
    )

    # 7. Ejecutar import_blogs para actualizar la base de datos y generar token si es borrador
    call_command("import_blogs")

    # HU-026: Si el autor es superadmin, actualizar moderation_status a "approved"
    # El import_blogs deja moderation_status="pending" por default del modelo,
    # pero para el superadmin debe ser "approved" automáticamente.
    if is_admin:
        BlogPost.objects.filter(slug=slug).update(moderation_status="approved")

    # 8. Notificar al administrador si el artículo quedó como borrador (draft)
    if not is_published:
        # Obtener el objeto BlogPost recién creado/actualizado para obtener el token
        dashboard_url = f"{settings.SITE_URL}/blog/dashboard/"
        try:
            # TODO: ¿? - evaluar/verificarcorregir
            post_obj = BlogPost.objects.get(slug=slug)
            token = post_obj.approval_token
            approve_url = (
                f"{settings.SITE_URL}{reverse('blog:approve_blog', args=[token])}"
                if token
                else ""
            )
        except Exception:
            approve_url = ""

        admin_subject = f"[JD Blog] Nuevo borrador pendiente: {title}"
        admin_message = (
            f"📝 Se ha guardado un borrador del artículo:\n\n"
            f"Título: {title}\n"
            f"Autor: {author_name} ({author_email})\n"
            f"Slug: {slug}\n"
            f"Estado: Borrador (pendiente de revisión)\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"📊 PANEL DE MODERACIÓN:\n"
            f"   {dashboard_url}\n\n"
        )
        if approve_url:
            admin_message += (
                f"⚡ APROBACIÓN RÁPIDA (1 clic):\n" f"   {approve_url}\n\n"
            )
        admin_message += (
            f"Desde el panel puedes:\n"
            f"  • Ver todos los artículos (publicados y borradores)\n"
            f"  • Activar/desactivar la publicación\n"
            f"  • Cambiar el estado de moderación\n"
            f"  • Buscar y filtrar artículos\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )
        # HU-011.85: Solo enviar si las notificaciones admin están habilitadas
        # TEMPORAL: 2026-07-04 - Resend API key restringida, deshabilitado hasta nuevo key
        if are_admin_notifications_enabled():
            send_mail(
                subject=admin_subject,
                message=admin_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[get_owner_email()],
                fail_silently=True,
            )

    # Nota: ``import_blogs`` almacena ``slugify(folder_name)`` como slug
    # en la BD, por lo que el enlace del editor debe usar ``folder_name``
    # para que coincida con el slug real de la tabla ``blog_blogpost``.
    return {
        "slug": folder_name,
        "folder": folder_name,
        "published": is_published,
        "status": "published" if is_published else "draft",
    }


def delete_post_permanently(post):
    """Elimina un artículo permanentemente: BD + archivos físicos (HU-011.9).

    1. Elimina registros de BlogModeration asociados.
    2. Elimina la carpeta física del artículo en ``blogs_source/<folder>/``.
    3. Elimina el ``BlogPost`` de la base de datos.

    Retorna un dict con el resultado de la operación.
    """
    import shutil
    import logging
    from pathlib import Path

    from django.conf import settings

    logger = logging.getLogger(__name__)

    slug = post.slug
    title = post.title
    result = {"success": False, "title": title, "slug": slug}

    try:
        # 1. Eliminar registros de moderación asociados
        from .models import BlogModeration

        moderation_count = BlogModeration.objects.filter(blog_post=post).delete()[
            0
        ]

        # 2. Eliminar comentarios asociados al artículo
        from .models import BlogComment

        comment_count = BlogComment.objects.filter(blog_slug=slug).delete()[0]

        # 3. Eliminar carpeta física del artículo en blogs_source/
        blogs_source = Path(settings.BASE_DIR) / "blogs_source"
        # El slug puede tener prefijo de fecha (e.g. "2026-06-08_titulo")
        # Buscamos la carpeta que coincida
        folder_path = blogs_source / slug
        files_deleted = 0
        if folder_path.exists() and folder_path.is_dir():
            shutil.rmtree(folder_path)
            files_deleted = 1
            logger.info(f"Carpeta eliminada: {folder_path}")
        else:
            # Buscar por prefijo parcial
            for d in blogs_source.iterdir():
                if d.is_dir() and slug in d.name:
                    shutil.rmtree(d)
                    files_deleted = 1
                    logger.info(f"Carpeta eliminada (match parcial): {d}")
                    break

        # 4. Eliminar carpeta estática copiada por import_blogs
        #    (static/blogs/<slug>/)
        static_blogs = Path(settings.BASE_DIR) / "static" / "blogs" / slug
        static_deleted = 0
        if static_blogs.exists() and static_blogs.is_dir():
            shutil.rmtree(static_blogs)
            static_deleted = 1
            logger.info(f"Carpeta estática eliminada: {static_blogs}")
        else:
            # Buscar por prefijo parcial (mismo fallback que blogs_source)
            static_base = Path(settings.BASE_DIR) / "static" / "blogs"
            if static_base.exists():
                for d in static_base.iterdir():
                    if d.is_dir() and slug in d.name:
                        shutil.rmtree(d)
                        static_deleted = 1
                        logger.info(
                            f"Carpeta estática eliminada (match parcial): {d}"
                        )
                        break

        # 5. Eliminar el BlogPost de la base de datos
        post.delete()

        result["success"] = True
        result["moderation_deleted"] = moderation_count
        result["comments_deleted"] = comment_count
        result["files_deleted"] = files_deleted
        result["static_deleted"] = static_deleted

        logger.info(
            f"Artículo eliminado permanentemente: '{title}' (slug={slug}) "
            f"moderación={moderation_count}, comentarios={comment_count}, "
            f"archivos_source={files_deleted}, archivos_static={static_deleted}"
        )

    except Exception as e:
        logger.error(f"Error al eliminar artículo '{title}': {e}")
        result["error"] = str(e)

    return result


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

    # HU-028: Validar tamaño con mensaje de error parametrizado
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if uploaded_file.size > max_size:
        return {
            "success": False,
            "error": f"Archivo demasiado pesado (máximo: {settings.MAX_UPLOAD_SIZE_MB}MB)",
        }

    # Generar un nombre único siempre, independientemente de colisiones.
    # Utilizamos el nombre original como base y le añadimos un sufijo corto de UUID
    # (primeros 8 caracteres) para garantizar que cada archivo tenga un nombre
    # distinto, evitando sobrescrituras al pegar varias imágenes con el mismo
    # nombre (por ejemplo, "image.png" desde el portapapeles).
    original_name = Path(uploaded_file.name).stem
    unique_suffix = uuid.uuid4().hex[:8]
    safe_name = f"{original_name}_{unique_suffix}{ext}"
    temp_dir = Path(settings.MEDIA_ROOT) / "blog_editor_temp" / str(user.id)
    temp_dir.mkdir(parents=True, exist_ok=True)

    filepath = temp_dir / safe_name

    with open(filepath, "wb+") as dest:
        for chunk in uploaded_file.chunks():
            dest.write(chunk)

    # Determinar tipo
    video_exts = (".mp4", ".webm", ".mov", ".avi")
    ftype = "video" if ext in video_exts else "image"

    # Construir URL accesible para el frontend.
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    url_path = f"{media_url.rstrip('/')}/blog_editor_temp/{user.id}/{safe_name}"
    return {
        "filename": safe_name,
        "url": url_path,
        "type": ftype,
    }


# ---------------------------------------------------------------------
# 🟡 HU-011.10: Gestión de archivos/recursos asociados a artículos
# ---------------------------------------------------------------------
def _format_size(size_bytes):
    """Formatea bytes a una cadena legible (KB, MB, GB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


def get_post_files_info(post_slug):
    """Retorna información sobre los archivos estáticos de un artículo.

    Escanea la carpeta ``blogs_source/<slug>/`` y cuenta todos los archivos
    que no sean ``blog.md``, clasificándolos por tipo (imágenes, videos, otros).

    Retorna:
        dict con claves:
        - ``file_count`` (int): cantidad total de archivos (excluyendo blog.md)
        - ``total_size_bytes`` (int): tamaño total en bytes
        - ``total_size_human`` (str): tamaño formateado legiblemente
        - ``files_by_type`` (dict): desglose ``{ 'images': N, 'videos': N, 'others': N }``
        - ``size_by_type`` (dict): desglose de tamaño ``{ 'images': '1.2 MB', ... }``
    """
    from django.conf import settings

    empty = {
        "file_count": 0,
        "total_size_bytes": 0,
        "total_size_human": "0 B",
        "files_by_type": {"images": 0, "videos": 0, "others": 0},
        "size_by_type": {"images": "0 B", "videos": "0 B", "others": "0 B"},
    }

    blogs_source = Path(settings.BASE_DIR) / "blogs_source"
    if not blogs_source.exists():
        return empty

    # Buscar carpeta que coincida con el slug
    target_dir = blogs_source / post_slug
    if not target_dir.exists() or not target_dir.is_dir():
        # Buscar por prefijo parcial (patrón común: "2026-06-08_titulo")
        for d in blogs_source.iterdir():
            if d.is_dir() and post_slug in d.name:
                target_dir = d
                break
        else:
            return empty

    image_exts = {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".ico",
    }
    video_exts = {".mp4", ".webm", ".mov", ".avi", ".mkv"}

    file_count = 0
    total_size = 0
    images_count = 0
    videos_count = 0
    others_count = 0
    images_size = 0
    videos_size = 0
    others_size = 0

    for entry in target_dir.iterdir():
        if entry.is_file() and entry.name.lower() != "blog.md":
            size = entry.stat().st_size
            ext = Path(entry.name).suffix.lower()
            file_count += 1
            total_size += size

            if ext in image_exts:
                images_count += 1
                images_size += size
            elif ext in video_exts:
                videos_count += 1
                videos_size += size
            else:
                others_count += 1
                others_size += size

    # Construir lista detallada de archivos para el popup
    detailed_files = []
    for entry in target_dir.iterdir():
        if entry.is_file() and entry.name.lower() != "blog.md":
            ext = Path(entry.name).suffix.lower()
            ftype = (
                "image"
                if ext in image_exts
                else ("video" if ext in video_exts else "other")
            )
            # Construir URL estática que coincide con la ruta usada por import_blogs
            # import_blogs copia los archivos a static/blogs/<folder>/, por lo que la URL es
            # /static/blogs/<folder_name>/<filename>
            url = f"/static/blogs/{target_dir.name}/{entry.name}"
            detailed_files.append(
                {
                    "filename": entry.name,
                    "url": url,
                    "type": ftype,
                }
            )

    return {
        "file_count": file_count,
        "total_size_bytes": total_size,
        "total_size_human": _format_size(total_size),
        "files_by_type": {
            "images": images_count,
            "videos": videos_count,
            "others": others_count,
        },
        "size_by_type": {
            "images": _format_size(images_size),
            "videos": _format_size(videos_size),
            "others": _format_size(others_size),
        },
        "files": detailed_files,
    }


def delete_resource_file(folder, filename):
    """Elimina un archivo individual de static/blogs/<folder>/<filename>.

    Args:
        folder: nombre de la carpeta (slug del artículo)
        filename: nombre del archivo a eliminar

    Returns:
        dict con claves:
        - ``success`` (bool): True si se eliminó correctamente
        - ``message`` (str): mensaje descriptivo
    """
    from django.conf import settings
    from pathlib import Path

    static_blogs = Path(settings.BASE_DIR) / "static" / "blogs"
    # Seguridad: evitar path traversal
    safe_folder = Path(folder).name
    safe_filename = Path(filename).name
    file_path = static_blogs / safe_folder / safe_filename

    if not file_path.exists():
        return {
            "success": False,
            "message": f"Archivo {safe_filename} no encontrado en {safe_folder}/",
        }

    if not file_path.is_file():
        return {
            "success": False,
            "message": f"{safe_filename} no es un archivo válido",
        }

    try:
        file_path.unlink()
        # Además, eliminar la copia en ``blogs_source`` para que los contadores de archivos
        # (usados por ``get_post_files_info``) reflejen la eliminación.  La carpeta del
        # artículo en ``blogs_source`` suele incluir un prefijo de fecha
        # (p.ej. ``2026-06-08_<slug>``), por lo que debemos buscar la carpeta que
        # contenga el slug recibido en ``folder``.
        blogs_source_root = Path(settings.BASE_DIR) / "blogs_source"
        source_dir = None
        # Intentar coincidencia directa primero
        possible_path = blogs_source_root / folder
        if possible_path.is_dir():
            source_dir = possible_path
        else:
            # Buscar por prefijo parcial
            for d in blogs_source_root.iterdir():
                if d.is_dir() and folder in d.name:
                    source_dir = d
                    break

        if source_dir:
            source_file_path = source_dir / filename
            if source_file_path.exists() and source_file_path.is_file():
                try:
                    source_file_path.unlink()
                except OSError:
                    import logging

                    logger = logging.getLogger(__name__)
                    logger.exception(
                        "Error al eliminar archivo fuente %s", source_file_path
                    )
        # ---------------------------------
        # Eliminar referencias a la imagen en los posts
        # ---------------------------------
        from .models import BlogPost
        import re

        # Patrón markdown simple para la imagen eliminada
        markdown_pattern = re.compile(
            r"!\[.*?\]\([^)]*" + re.escape(filename) + r"\)", re.IGNORECASE
        )

        # Patrón para bloques de slides que pueden contener la imagen
        slides_block_pattern = re.compile(
            r":::slides\s+(.*?)\s+:::", re.DOTALL | re.IGNORECASE
        )

        for post in BlogPost.objects.filter(slug__icontains=folder):
            original = post.content_html or ""
            updated = original

            # Eliminar referencias markdown sueltas
            updated = markdown_pattern.sub("", updated)

            # Procesar bloques de slides
            def clean_slides(match):
                inner = match.group(1)
                cleaned_inner = markdown_pattern.sub("", inner).strip()
                return (
                    ""
                    if not cleaned_inner
                    else f":::slides\n{cleaned_inner}\n:::"
                )

            updated = slides_block_pattern.sub(clean_slides, updated)

            # Normalizar saltos de línea
            updated = re.sub(r"\n{3,}", "\n\n", updated).strip()

            if updated != original:
                post.content_html = updated
                post.save(update_fields=["content_html"])

        # -----------------------------------------------------------------
        # Además, actualizar el archivo markdown fuente (blog.md) para que el
        # editor refleje la eliminación. Esto evita que la imagen siga
        # apareciendo al abrir el artículo en el editor.
        # -----------------------------------------------------------------
        source_md_path = (
            Path(settings.BASE_DIR) / "blogs_source" / folder / "blog.md"
        )
        if source_md_path.exists() and source_md_path.is_file():
            try:
                md_content = source_md_path.read_text(encoding="utf-8")
                # Eliminar referencias markdown sueltas en el archivo fuente
                md_updated = markdown_pattern.sub("", md_content)
                # Eliminar bloques de slides en el archivo fuente
                md_updated = slides_block_pattern.sub(clean_slides, md_updated)
                # Eliminar etiquetas <img> que referencien la imagen
                img_tag_pattern = re.compile(
                    r"<img[^>]*src=[\"'].*?"
                    + re.escape(filename)
                    + r"[\"'][^>]*>",
                    re.IGNORECASE,
                )
                md_updated = img_tag_pattern.sub("", md_updated)
                # Normalizar saltos de línea
                md_updated = re.sub(r"\n{3,}", "\n\n", md_updated).strip()
                if md_updated != md_content:
                    source_md_path.write_text(md_updated, encoding="utf-8")
            except Exception as e:
                # Si falla la actualización del markdown, registramos pero no
                # interrumpimos el flujo de eliminación de recursos.
                import logging

                logger = logging.getLogger(__name__)
                logger.exception(
                    "Error al actualizar markdown para %s: %s", source_md_path, e
                )

        return {
            "success": True,
            "message": f"Archivo {safe_filename} eliminado correctamente de {safe_folder}/",
        }
    except OSError as e:
        return {
            "success": False,
            "message": f"Error al eliminar {safe_filename}: {str(e)}",
        }
