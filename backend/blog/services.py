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
    # HU-014: tiempo_lectura alias
    "reading_time",
}


def _parse_frontmatter(text):
    """
    Parsea el frontmatter YAML de un .md. Retorna (dict, body_str).
    Si no hay frontmatter, retorna ({}, text).
    """
    import yaml

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
from allauth.socialaccount.models import SocialAccount


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
    is_published = is_admin
    existing_fm = {}  # frontmatter del .md original (vacío si es nuevo)

    if is_edit:
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
            raise ValueError(
                f"No se encontró la carpeta del artículo con slug: {existing_slug}"
            )

        # Leer frontmatter existente para hacer merge
        blog_file = target_dir / "blog.md"
        if blog_file.exists():
            try:
                raw = blog_file.read_text(encoding="utf-8")
                existing_fm, _ = _parse_frontmatter(raw)
            except Exception:
                pass

            # Preservar estado draft si existe
            draft_val = existing_fm.get("draft")
            if draft_val is not None:
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
    for f in files_list:
        filename = f.get("filename", "")
        filetype = f.get("type", "image")
        src = temp_dir / filename
        if src.exists():
            shutil.move(str(src), str(target_dir / filename))
            if filetype == "image" and not image_filename:
                image_filename = filename

    # 4.1. HU-011.4 Fase 4: cover_filename del editor tiene PRIORIDAD
    if cover_filename:
        # Verificar que el cover_filename realmente esté en la carpeta destino
        if (target_dir / cover_filename).exists():
            image_filename = cover_filename
        else:
            # Si pidió un cover que no existe, intentar con la primera imagen
            pass

    # 4.2. En edición, si no hay cover nuevo, preservar el del .md original
    if is_edit and not image_filename:
        # Intentamos recuperar la portada guardada previamente. El frontmatter
        # ahora usa la clave ``cover_image``; mantenemos compatibilidad leyendo
        # también ``image`` por si existen artículos antiguos.
        image_filename = existing_fm.get("cover_image", "") or existing_fm.get(
            "image", ""
        )
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
    new_fm["draft"] = is_published  # bool — se serializa a 'true'/'false'
    # NOTE: El campo de portada en el modelo se llama ``cover_image``.
    # Anteriormente se guardaba bajo la clave ``image`` en el frontmatter,
    # lo que provocaba que la plantilla ``blog_list.html`` no encontrara
    # la ruta y mostrara un ``src`` vacío. Cambiamos la clave a
    # ``cover_image`` para que sea coherente con el modelo y el filtro
    # ``blog_thumbnail``.
    new_fm["cover_image"] = image_filename
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

    # Construir el archivo final y guardarlo
    blog_path = target_dir / "blog.md"
    blog_path.write_text(
        _build_frontmatter(new_fm) + content_md, encoding="utf-8"
    )

    # 7. Ejecutar import_blogs para actualizar la base de datos y generar token si es borrador
    call_command("import_blogs")

    # 8. Notificar al administrador si el artículo quedó como borrador (draft)
    if not is_published:
        # Obtener el objeto BlogPost recién creado/actualizado para obtener el token de aprobación
        try:
            post_obj = BlogPost.objects.get(slug=slug)
            token = post_obj.approval_token
            approve_url = (
                f"{settings.SITE_URL}{reverse('blog:approve_blog', args=[token])}"
                if token
                else ""
            )
        except Exception:
            approve_url = ""

        admin_subject = f"[JD Blog] Borrador guardado: {title}"
        admin_message = (
            f"Se ha guardado un borrador del artículo '{title}'.\n"
            f"Autor: {author_name} ({author_email})\n"
            f"Slug: {slug}\n"
            f"Puedes revisarlo en el panel de moderación.\n"
        )
        if approve_url:
            admin_message += f"Aprobar directamente: {approve_url}\n"
        send_mail(
            subject=admin_subject,
            message=admin_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.OWNER_EMAIL],
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

    # Construir URL accesible para el frontend.
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    url_path = f"{media_url.rstrip('/')}/blog_editor_temp/{user.id}/{safe_name}"
    return {
        "filename": safe_name,
        "url": url_path,
        "type": ftype,
    }
