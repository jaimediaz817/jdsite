import os
import hashlib
import re
import html as html_lib
import shutil
import ast
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.text import slugify
from django.db import connection
from blog.models import BlogPost, Category, Tag
import markdown
from bs4 import BeautifulSoup


class Command(BaseCommand):
    help = "Importa todos los blogs desde la carpeta blogs_source"

    def handle(self, *args, **options):
        """
        ✨ METODO PRINCIPAL DEL COMANDO
        Orquesta todo el flujo de importacion.
        Cada responsabilidad esta delegada a un metodo individual.
        """
        self.stdout.write("🔍 Iniciando importación de blogs...")

        # Configuracion de directorios
        self.SOURCE_DIR = Path(settings.BASE_DIR) / "blogs_source"
        self.STATIC_TARGET = Path(settings.BASE_DIR) / "static" / "blogs"
        self.STATIC_TARGET.mkdir(exist_ok=True, parents=True)

        # Contadores
        self.count_imported = 0
        self.count_skipped = 0

        # ✅ Paso 1: Resetear secuencias de ID
        self.reset_id_sequences()

        # ✅ Paso 2: Iterar y procesar cada blog
        slugs_procesados = set()

        for blog_dir in self.SOURCE_DIR.iterdir():
            if not blog_dir.is_dir():
                continue

            slug = self.process_single_blog(blog_dir)
            slugs_procesados.add(slug)

        # ✅ Paso 3: LIMPIEZA AUTOMATICA - Borrar blogs que ya no existen en filesystem
        self.cleanup_removed_blogs(slugs_procesados)

        # ✅ Paso 4: Mostrar resumen final
        self.show_final_summary()

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: GESTION SECUENCIAS BASE DE DATOS
    # -------------------------------------------------------------------------
    def reset_id_sequences(self):
        """
        Resetea el contador autoincremental de la tabla BlogPost
        Soluciona el bug donde los IDs se incrementaban infinitamente despues de borrar
        Compatible con MySQL y PostgreSQL
        """
        db_engine = settings.DATABASES["default"]["ENGINE"]

        with connection.cursor() as cursor:
            if "postgresql" in db_engine:
                cursor.execute("""
                    SELECT setval(pg_get_serial_sequence('blog_blogpost', 'id'),
                    COALESCE((SELECT MAX(id) FROM blog_blogpost), 0) + 1, false);
                """)
            elif "mysql" in db_engine:
                cursor.execute(
                    "SELECT COALESCE(MAX(id), 0) + 1 FROM blog_blogpost"
                )
                next_id = cursor.fetchone()[0]
                cursor.execute(
                    f"ALTER TABLE blog_blogpost AUTO_INCREMENT = {next_id}"
                )

        self.stdout.write("✅ Secuencia de IDs reseteada correctamente")

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: PROCESADO INDIVIDUAL DE CADA BLOG
    # -------------------------------------------------------------------------
    def process_single_blog(self, blog_dir):
        """
        Orquesta todo el procesamiento de UN SOLO blog de principio a fin
        """
        md_file = blog_dir / "blog.md"

        if not md_file.exists():
            self.stdout.write(f"⚠️  Saltando {blog_dir.name}: no hay blog.md")
            return slugify(blog_dir.name)

        # ✅ Generar SLUG unico permanente
        slug = slugify(blog_dir.name)

        # ✅ Calcular hash para detectar cambios
        file_hash = self.calculate_file_hash(md_file)

        # ✅ Leer y extraer contenido
        md_content, frontmatter = self.read_markdown_file(md_file)

        # ✅ Extraer titulo
        title, content_md = self.extract_title(md_content, blog_dir)

        # ✅ Verificar si ya existe y si necesita actualizarse
        existing_blog, necesita_actualizar = self.check_existing_blog(
            slug, file_hash, title
        )

        # ✅ SIEMPRE copiar imagenes incluso si no hay cambios (soluciona bug 404)
        blog_static_dir = self.STATIC_TARGET / slug
        self.copy_blog_images(blog_dir, blog_static_dir)

        if not necesita_actualizar:
            self.stdout.write("✅ Imagenes verificadas y copiadas correctamente")
            return slug

        # ✅ Extraer y eliminar la PRIMERA imagen como portada
        cover_image_path, content_sin_portada = self.extract_cover_image(
            content_md, blog_dir, blog_static_dir, slug
        )

        # ✅ Procesar bloques especiales ANTES de convertir a HTML
        markdown_with_specials = self.replace_special_blocks_md(
            content_sin_portada, blog_dir, blog_static_dir, slug
        )

        # ✅ Convertir Markdown a HTML
        html_content = self.convert_markdown_to_html(markdown_with_specials)

        # ✅ Procesar bloques especiales legacy (popup:gallery, carousel manual)
        processed_html = self.process_special_blocks(
            html_content, blog_dir, blog_static_dir, slug
        )

        # ✅ Procesar y reemplazar rutas de imagenes
        processed_html = self.process_images(
            processed_html, blog_dir, blog_static_dir, slug
        )

        # ✅ Auto crear carruseles de imagenes seguidas
        processed_html = self.auto_create_carousels(processed_html)

        # ✅ Aplicar formateo custom (steps, emoji-list, conclusion)
        html_final = self.apply_custom_formatting(processed_html)

        # ✅ Obtener o crear categoria
        category_obj = self.get_or_create_category(frontmatter)

        # ✅ Obtener tags
        tags_objects = self.get_tags_from_frontmatter(frontmatter)

        # ✅ Guardar finalmente en BD
        obj = self.save_blog_post(
            slug,
            file_hash,
            title,
            html_final,
            category_obj,
            frontmatter,
            cover_image_path,
        )

        # ✅ Asociar tags
        self.associate_tags_to_blog(obj, tags_objects)

        self.stdout.write(f"✅ GUARDADO EN BD EXITOSAMENTE ID={obj.id}")
        self.count_imported += 1
        self.stdout.write(f"✅ Importado: {title}")

        return slug

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: LECTURA Y EXTRACCION DE DATOS
    # -------------------------------------------------------------------------
    def calculate_file_hash(self, md_file):
        """Calcula hash SHA256 del archivo para detectar cambios"""
        with open(md_file, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()

    def read_markdown_file(self, md_file):
        """Lee el archivo markdown y extrae el frontmatter.

        - Normaliza saltos de línea simples SOLO dentro de párrafos,
          preservando listas, headings, blockquotes y bloques especiales.
        - Protege bloques ::: antes de normalizar para no destruirlos.
        - Elimina comentarios HTML <!-- --> del contenido.
        """
        try:
            with open(md_file, "r", encoding="utf-8") as f:
                md_content = f.read()
        except UnicodeDecodeError:
            with open(md_file, "r", encoding="latin-1", errors="replace") as f:
                md_content = f.read()

        # 🔹 LIMPIEZA: Eliminar backslashes al final de línea (usados como salto de línea)
        lines = md_content.split("\n")
        cleaned_lines = []
        for line in lines:
            # Eliminar uno o más backslashes al final de la línea
            cleaned = re.sub(r"\\+$", "", line)
            cleaned_lines.append(cleaned)
        md_content = "\n".join(cleaned_lines)

        # 🔴 PROTEGER bloques ::: antes de normalizar saltos de línea
        placeholders = {}
        placeholder_counter = [0]

        def protect_special_block(match):
            placeholder_counter[0] += 1
            key = f"__SPECIAL_BLOCK_{placeholder_counter[0]}__"
            placeholders[key] = match.group(0)
            return key

        md_content = re.sub(
            r":::[a-zA-Z0-9:_\-]+\s*\n.*?:::",
            protect_special_block,
            md_content,
            flags=re.DOTALL,
        )

        # ✅ Normalizar saltos simples respetando estructuras (listas, headings, etc.)
        md_content = self._normalize_lines(md_content)

        # 🔴 RESTAURAR los bloques ::: protegidos
        for key, original in placeholders.items():
            md_content = md_content.replace(key, original)

        frontmatter = {}
        content_md = md_content

        # Extraer frontmatter si existe
        if md_content.startswith("---"):
            parts = md_content.split("---", 2)
            if len(parts) >= 3:
                frontmatter_raw = parts[1].strip()
                content_md = parts[2].strip()

                for line in frontmatter_raw.split("\n"):
                    if ":" in line:
                        key, value = line.split(":", 1)
                        key = key.strip()
                        value = value.strip()

                        if (value.startswith('"') and value.endswith('"')) or (
                            value.startswith("'") and value.endswith("'")
                        ):
                            value = value[1:-1].strip()

                        frontmatter[key] = value

        # ✅ Eliminar comentarios HTML del contenido
        content_md = re.sub(
            r"<!--.*?-->", "", content_md, flags=re.DOTALL
        ).strip()

        return content_md, frontmatter

    def _normalize_lines(self, text):
        """
        Normaliza saltos simples a espacios SOLO dentro de párrafos.
        Protege: listas (- * + 1.), blockquotes (>), headings (#),
        líneas vacías, bloques de código y placeholders especiales.
        """
        lines = text.split("\n")
        result = []
        in_code_block = False

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detectar inicio/fin de bloque de código
            if stripped.startswith("```"):
                in_code_block = not in_code_block
                result.append(line)
                continue

            if in_code_block:
                result.append(line)
                continue

            # Líneas estructurales que NUNCA se unen
            is_structural = (
                stripped == ""
                or stripped.startswith(("#", ">", "```"))
                or re.match(r"^[-*+]\s", stripped)
                or re.match(r"^\d+\.\s", stripped)
                or re.match(r"^\|", stripped)
                or stripped.startswith(":::")
                or stripped.startswith("__SPECIAL_BLOCK_")
            )

            prev_line = lines[i - 1].strip() if i > 0 else ""
            prev_is_structural = (
                prev_line == ""
                or prev_line.startswith(("#", ">", "```"))
                or re.match(r"^[-*+]\s", prev_line)
                or re.match(r"^\d+\.\s", prev_line)
                or re.match(r"^\|", prev_line)
                or prev_line.startswith(":::")
                or prev_line.startswith("__SPECIAL_BLOCK_")
            )

            if is_structural or prev_is_structural:
                result.append(line)
            else:
                result.append(line + " §JOIN§")

        joined = "\n".join(result)
        # Unir líneas consecutivas con espacio (no con salto de línea)
        joined = re.sub(r" §JOIN§\n", " ", joined)
        # Limpiar posibles marcadores que quedaron al final
        joined = re.sub(r" §JOIN§$", "", joined)
        return joined

    def extract_title(self, content_md, blog_dir):
        """Extrae el titulo del markdown o del nombre de la carpeta"""
        lines = content_md.strip().split("\n")

        if lines and lines[0].startswith("# "):
            title = lines[0][2:].strip()
            content_md = "\n".join(lines[1:])
        else:
            title = blog_dir.name
            title = re.sub(r"^\d{4}-\d{2}-\d{2}_", "", title)
            title = title.replace("-", " ").replace("_", " ").title()

        return title, content_md

    def check_existing_blog(self, slug, file_hash, title):
        """Verifica si el blog ya existe y si hay cambios"""
        existing_by_slug = BlogPost.objects.filter(slug=slug).first()
        necesita_actualizar = True

        if existing_by_slug:
            if existing_by_slug.source_hash == file_hash:
                self.count_skipped += 1
                self.stdout.write(
                    f"⏭️  Sin cambios en contenido: {existing_by_slug.title}"
                )
                necesita_actualizar = False
            else:
                self.stdout.write(f"🔄 Detectados cambios, actualizando: {title}")
        else:
            self.stdout.write(f"🆕 Nuevo blog encontrado: {title}")

        return existing_by_slug, necesita_actualizar

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: ARCHIVOS ESTATICOS E IMAGENES
    # -------------------------------------------------------------------------
    def copy_blog_images(self, blog_dir, blog_static_dir):
        """Copia todas las imagenes del directorio fuente a static"""
        blog_static_dir.mkdir(exist_ok=True)

        for archivo in blog_dir.iterdir():
            if archivo.is_file() and archivo.suffix.lower() in (
                ".png",
                ".jpg",
                ".jpeg",
                ".gif",
                ".webp",
                ".svg",
            ):
                destino = blog_static_dir / archivo.name
                shutil.copy2(archivo, destino)

    def convert_markdown_to_html(self, content_md):
        """Convierte markdown a HTML.

        - Las líneas consecutivas ya están unidas con espacios en _normalize_lines
        - sane_lists: mejora el manejo de listas
        - extra, codehilite, tables, fenced_code: extensiones estándar
        """
        return markdown.markdown(
            content_md,
            extensions=[
                "extra",
                "codehilite",
                "tables",
                "fenced_code",
                "sane_lists",
            ],
        )

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: COMPONENTES ESPECIALES
    # -------------------------------------------------------------------------
    def process_special_blocks(
        self, html_content, blog_dir, blog_static_dir, slug
    ):
        """Procesa bloques especiales legacy: popup:gallery y carousel manual.
        Se mantiene para compatibilidad con MDs antiguos."""
        processed_html = html_content

        # Procesar Galerias Popup legacy
        popup_gallery_pattern = r":::\s*popup:gallery\s*\n(.*?)\n:::"
        processed_html = re.sub(
            popup_gallery_pattern,
            lambda match: self.replace_popup_gallery(
                match, blog_dir, blog_static_dir, slug
            ),
            processed_html,
            flags=re.DOTALL,
        )

        # Procesar Carruseles Manuales legacy
        carousel_pattern = r":::\s*carousel\s*\n(.*?)\n:::"
        processed_html = re.sub(
            carousel_pattern,
            self.replace_carousel,
            processed_html,
            flags=re.DOTALL,
        )

        return processed_html

    def replace_special_blocks_md(
        self, markdown_content, blog_dir, blog_static_dir, slug
    ):
        """Pre-procesa bloques especiales ::: en el markdown antes de convertir a HTML.

        Bloques soportados:
        - :::slides              → slider con navegación
        - :::callout:info        → caja informativa azul
        - :::callout:warning     → caja de advertencia amarilla
        - :::callout:tip         → caja de tip verde
        - :::pullquote           → cita destacada grande
        - :::codefile:ruta       → bloque de código con header de archivo
        - :::popup:gallery       → galería popup legacy (compatibilidad)
        """

        # ── 1. SLIDES ──────────────────────────────────────────────────────────
        def _replace_slides(match):
            content = match.group(1).strip()
            images_data = []

            for line in content.split("\n"):
                line = line.strip()
                img_match = re.match(r"!\[(.*?)\]\((.*?)\)", line)
                if not img_match:
                    continue
                alt_text = img_match.group(1)
                img_src = img_match.group(2).strip()
                title, desc = (
                    alt_text.split("|", 1) if "|" in alt_text else (alt_text, "")
                )

                if not img_src.startswith(("http://", "https://", "/")):
                    source_img = blog_dir / img_src
                    if source_img.exists():
                        shutil.copy2(
                            source_img, blog_static_dir / source_img.name
                        )
                        img_src = f"/static/blogs/{slug}/{source_img.name}"

                images_data.append((img_src, title.strip(), desc.strip()))

            if not images_data:
                return ""

            # Una sola imagen → figure simple
            if len(images_data) == 1:
                src, title, desc = images_data[0]
                caption = ""
                if title or desc:
                    desc_html = f"<span>{desc}</span>" if desc else ""
                    caption = (
                        f'<figcaption class="slide-caption">'
                        f"<strong>{title}</strong>{desc_html}"
                        f"</figcaption>"
                    )
                return (
                    f'<figure class="single-image-container mb-5">'
                    f'<img src="{src}" alt="{title}" '
                    f'class="img-fluid rounded shadow-sm" loading="lazy"/>'
                    f"{caption}"
                    f"</figure>"
                )

            # Múltiples imágenes → slider
            slides_items = ""
            dots = ""
            for i, (src, title, desc) in enumerate(images_data):
                active = " active" if i == 0 else ""
                caption_html = ""
                if title or desc:
                    desc_html = f"<span>{desc}</span>" if desc else ""
                    caption_html = (
                        f'<div class="slide-caption">'
                        f"<strong>{title}</strong>{desc_html}"
                        f"</div>"
                    )
                slides_items += (
                    f'<div class="slide{active}">'
                    f'<img src="{src}" alt="{title}" loading="lazy"/>'
                    f"{caption_html}"
                    f"</div>"
                )
                dots += (
                    f'<button class="slide-dot{active}" '
                    f'onclick="goToSlide(this,{i})"></button>'
                )

            return (
                f'<div class="slides-container mb-5" data-current="0">'
                f"{slides_items}"
                f'<div class="slides-nav">'
                f'<button class="slide-prev" onclick="prevSlide(this)"><i class="fas fa-chevron-left"></i></button>'
                f'<div class="slides-dots">{dots}</div>'
                f'<button class="slide-next" onclick="nextSlide(this)"><i class="fas fa-chevron-right"></i></button>'
                f"</div>"
                f'<span class="slides-counter">1 / {len(images_data)}</span>'
                f"</div>"
            )

        markdown_content = re.sub(
            r":::slides\s*\n(.*?):::",
            _replace_slides,
            markdown_content,
            flags=re.DOTALL,
        )

        # ── 2. CALLOUT (info / warning / tip) ──────────────────────────────────
        def _replace_callout(match):
            variant = match.group(1).lower()
            text = match.group(2).strip()
            icons = {"info": "ℹ️", "warning": "⚠️", "tip": "💡"}
            icon = icons.get(variant, "ℹ️")
            # Convertir el texto interno de markdown a HTML
            text_html = markdown.markdown(text).strip()
            # Quitar el <p> wrapper si es un solo párrafo
            text_html = re.sub(
                r"^<p>(.*)</p>$", r"\1", text_html, flags=re.DOTALL
            )
            return (
                f'<div class="callout callout-{variant}">'
                f'<span class="callout-icon">{icon}</span>'
                f'<div class="callout-body">{text_html}</div>'
                f"</div>"
            )

        markdown_content = re.sub(
            r":::callout:(info|warning|tip)\s*\n(.*?):::",
            _replace_callout,
            markdown_content,
            flags=re.DOTALL,
        )

        # ── 3. PULLQUOTE ────────────────────────────────────────────────────────
        def _replace_pullquote(match):
            text = match.group(1).strip()
            return (
                f'<blockquote class="pullquote">'
                f"<p>{text}</p>"
                f"</blockquote>"
            )

        markdown_content = re.sub(
            r":::pullquote\s*\n(.*?):::",
            _replace_pullquote,
            markdown_content,
            flags=re.DOTALL,
        )

        # ── 4. CODEFILE (código con nombre de archivo) ─────────────────────────
        def _replace_codefile(match):
            filename = match.group(1).strip()
            code_block = match.group(2).strip()
            # Eliminar backticks del bloque si existen
            code_block = re.sub(r"^```\w*\n?", "", code_block)
            code_block = re.sub(r"\n?```$", "", code_block)
            escaped = html_lib.escape(code_block)
            # Detectar extensión para el ícono
            ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
            icon_map = {
                "py": "🐍",
                "js": "📜",
                "ts": "📘",
                "html": "🌐",
                "css": "🎨",
                "json": "📋",
                "md": "📝",
                "sh": "⚙️",
            }
            icon = icon_map.get(ext, "📄")
            return (
                f'<div class="codefile-container">'
                f'<div class="codefile-header">'
                f'<span class="codefile-icon">{icon}</span>'
                f'<span class="codefile-name">{filename}</span>'
                f"</div>"
                f'<pre class="codefile-body"><code>{escaped}</code></pre>'
                f"</div>"
            )

        markdown_content = re.sub(
            r":::codefile:(.*?)\n(.*?):::",
            _replace_codefile,
            markdown_content,
            flags=re.DOTALL,
        )

        # ── 5. POPUP:GALLERY legacy ─────────────────────────────────────────────
        popup_gallery_pattern = r":::popup:gallery\s*\n(.*?):::"
        markdown_content = re.sub(
            popup_gallery_pattern,
            lambda m: self.replace_popup_gallery(
                m, blog_dir, blog_static_dir, slug
            ),
            markdown_content,
            flags=re.DOTALL,
        )

        # ── 6. VISUAL LAYOUT [vl]: TAG ──────────────────────────────────────────
        # El tag [vl]: debe envolver contenido. Formatos soportados:
        # - [vl]: tipo (opcional) + contenido en la misma línea
        # - [vl]: contenido en líneas siguientes (hasta línea vacía o heading)
        # Tipos: full, limited, highlight (default), bullet

        # Primero, procesar [vl]: en la misma línea: [vl]: tipo? contenido
        def _replace_vl_inline(match):
            vl_type = match.group(1).strip().lower() if match.group(1) else ""
            content = match.group(2).strip() if match.group(2) else ""
            class_map = {
                "full": "vl-full",
                "limited": "vl-limited",
                "highlight": "vl-highlight",
                "bullet": "vl-bullet",
            }
            # Si no se especifica tipo válido, usar highlight como default
            css_class = class_map.get(vl_type, "vl-highlight")
            if not content:
                return f'<div class="{css_class}"></div>'
            # Convertir el contenido interno de markdown a HTML
            content_html = markdown.markdown(content).strip()
            # Quitar el <p> wrapper si es un solo párrafo
            content_html = re.sub(
                r"^<p>(.*)</p>$", r"\1", content_html, flags=re.DOTALL
            )
            return f'<div class="{css_class}">{content_html}</div>'

        # Patrón para [vl]: tipo? contenido (todo en una línea)
        markdown_content = re.sub(
            r"\[vl\]:\s*(full|limited|highlight|bullet)?\s*(.+?)$",
            _replace_vl_inline,
            markdown_content,
            flags=re.MULTILINE,
        )

        # Segundo, procesar [vl]: al inicio de línea seguido de contenido en siguientes líneas
        # hasta encontrar línea vacía o heading
        def _replace_vl_block(match):
            vl_type = match.group(1).strip().lower() if match.group(1) else ""
            content = match.group(2).strip() if match.group(2) else ""
            class_map = {
                "full": "vl-full",
                "limited": "vl-limited",
                "highlight": "vl-highlight",
                "bullet": "vl-bullet",
            }
            css_class = class_map.get(vl_type, "vl-highlight")
            if not content:
                return f'<div class="{css_class}"></div>'
            content_html = markdown.markdown(content).strip()
            content_html = re.sub(
                r"^<p>(.*)</p>$", r"\1", content_html, flags=re.DOTALL
            )
            return f'<div class="{css_class}">{content_html}</div>'

        # Patrón para [vl]: al inicio de línea, contenido en siguientes líneas
        markdown_content = re.sub(
            r"^\[vl\]:\s*(full|limited|highlight|bullet)?\s*\n([\s\S]*?)(?=^$|^\#|\n\n)",
            _replace_vl_block,
            markdown_content,
            flags=re.MULTILINE,
        )

        return markdown_content

    def replace_popup_gallery(self, match, blog_dir, blog_static_dir, slug):
        """Renderiza componente Galeria Popup legacy.

        Formato (títulos y descripciones van en el alt text con |):
        ::: popup:gallery
        ![Título|Descripción](image.png)
        ![Título2|Descripción2](image2.png)
        :::
        """
        content = match.group(1).strip()
        final_images = []

        for line in content.split("\n"):
            line = line.strip()
            if not line:
                continue

            img_match = re.match(r"!\[(.*?)\]\((.*?)\)", line)
            if not img_match:
                continue

            alt_text = img_match.group(1)
            img_src = img_match.group(2).strip()

            # Extraer título y descripción del alt text (formato: Título|Descripción)
            if "|" in alt_text:
                title, desc = alt_text.split("|", 1)
                title = title.strip()
                desc = desc.strip()
            else:
                title = alt_text
                desc = ""

            # Copiar imagen a static si es local
            if not img_src.startswith(("http://", "https://", "/")):
                source_img = blog_dir / img_src
                if source_img.exists():
                    target_img = blog_static_dir / source_img.name
                    shutil.copy2(source_img, target_img)
                    img_src = f"/static/blogs/{slug}/{source_img.name}"

            final_images.append((img_src, title, desc))

        if not final_images:
            return ""

        # Una sola imagen → figure simple
        if len(final_images) == 1:
            src, title, desc = final_images[0]
            caption_html = ""
            if title or desc:
                caption_html = (
                    f'<figcaption class="image-caption">'
                    f"<strong>{title}</strong> {desc}"
                    f"</figcaption>"
                ).strip()
            return (
                f'<figure class="single-image-container mb-5">'
                f'<img src="{src}" alt="{title}" '
                f'class="img-fluid rounded shadow-sm" loading="lazy"/>'
                f"{caption_html}"
                f"</figure>"
            )

        # Múltiples imágenes → popup gallery
        first_src, first_title, first_desc = final_images[0]
        images_value = "|||".join(
            [f"{src}||{title}||{desc}" for src, title, desc in final_images]
        )

        return (
            f'<div class="popup-gallery-container mb-5">'
            f'<div class="gallery-preview d-inline-block position-relative cursor-pointer" '
            f'onclick="openGalleryPopup(this)">'
            f'<img src="{first_src}" alt="{first_title}" '
            f'class="img-fluid rounded shadow-sm" loading="lazy">'
            f'<div class="gallery-badge">'
            f'<i class="fas fa-images"></i> {len(final_images)} imágenes'
            f"</div>"
            f'<input type="hidden" class="gallery-images" value="{images_value}">'
            f"</div>"
            f"</div>"
        )

    def replace_carousel(self, match):
        """Renderiza componente Carrusel Manual legacy"""
        content = match.group(1).strip()
        img_soup = BeautifulSoup(markdown.markdown(content), "html.parser")
        images = img_soup.find_all("img")

        if len(images) < 2:
            return content

        return f"""
            <div class="blog-carousel-container mb-5">
                <div class="swiper">
                    <div class="swiper-wrapper">
                        {''.join([f'<div class="swiper-slide text-center">{str(img)}</div>' for img in images])}
                    </div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                </div>
            </div>
        """

    def process_images(self, html_content, blog_dir, blog_static_dir, slug):
        """Procesa todas las imagenes normales del contenido"""
        soup = BeautifulSoup(html_content, "html.parser")

        for img in soup.find_all("img"):
            img_src = img["src"]

            if not img_src.startswith(("http://", "https://", "/")):
                source_img = blog_dir / img_src

                if source_img.exists():
                    target_img = blog_static_dir / source_img.name
                    shutil.copy2(source_img, target_img)
                    img["src"] = f"/static/blogs/{slug}/{source_img.name}"
                    img["loading"] = "lazy"

                    if not img.get("alt"):
                        nombre_limpio = (
                            source_img.stem.replace("-", " ")
                            .replace("_", " ")
                            .title()
                        )
                        img["alt"] = nombre_limpio
                        self.stdout.write(
                            f"✅ Atributo alt generado automaticamente: {nombre_limpio}"
                        )

        return str(soup)

    def auto_create_carousels(self, html_content):
        """
        Detecta 2 o mas imagenes seguidas sin texto entre medio
        y las convierte automaticamente en carrusel Swiper
        """
        soup = BeautifulSoup(html_content, "html.parser")
        html_parts = []
        carousel_images = []
        in_carousel = False

        for element in soup.children:
            if (
                element.name == "p"
                and len(element.contents) == 1
                and element.contents[0].name == "img"
            ):
                img = element.find("img")
                carousel_images.append(str(img))
                in_carousel = True

            else:
                if in_carousel and len(carousel_images) >= 2:
                    carousel_html = f"""
                        <div class="blog-carousel-container mb-5">
                            <div class="swiper">
                                <div class="swiper-wrapper">
                                    {''.join([f'<div class="swiper-slide text-center">{img}</div>' for img in carousel_images])}
                                </div>
                                <div class="swiper-pagination"></div>
                                <div class="swiper-button-prev"></div>
                                <div class="swiper-button-next"></div>
                            </div>
                        </div>
                    """
                    html_parts.append(carousel_html)
                    carousel_images = []
                    in_carousel = False

                elif in_carousel and len(carousel_images) == 1:
                    html_parts.append(f"<p>{carousel_images[0]}</p>")
                    carousel_images = []
                    in_carousel = False

                html_parts.append(str(element))

        # Caso donde el carrusel esta al final
        if in_carousel:
            if len(carousel_images) >= 2:
                carousel_html = f"""
                    <div class="blog-carousel-container mb-5">
                        <div class="swiper">
                            <div class="swiper-wrapper">
                                {''.join([f'<div class="swiper-slide text-center">{img}</div>' for img in carousel_images])}
                            </div>
                            <div class="swiper-pagination"></div>
                            <div class="swiper-button-prev"></div>
                            <div class="swiper-button-next"></div>
                        </div>
                    </div>
                """
                html_parts.append(carousel_html)
            else:
                html_parts.append(f"<p>{carousel_images[0]}</p>")

        return "".join(html_parts)

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: CATEGORIAS Y TAGS
    # -------------------------------------------------------------------------
    def get_or_create_category(self, frontmatter):
        """Obtiene o crea categoria inteligente"""
        category_obj = None

        category_input = frontmatter.get(
            "category", frontmatter.get("categoria", "")
        ).strip()

        if category_input:
            category_obj = Category.objects.filter(
                name__iexact=category_input, is_active=True
            ).first()

            if not category_obj:
                palabras_busqueda = category_input.lower().split()
                for palabra in palabras_busqueda:
                    coincidencia = Category.objects.filter(
                        name__icontains=palabra, is_active=True
                    ).first()
                    if coincidencia:
                        category_obj = coincidencia
                        break

            if not category_obj:
                category_obj, _ = Category.objects.get_or_create(
                    name__iexact=category_input,
                    defaults={
                        "name": category_input,
                        "is_active": True,
                        "slug": slugify(category_input),
                    },
                )

        if not category_obj:
            category_obj, _ = Category.objects.get_or_create(
                slug="sin-categoria-asignada",
                defaults={
                    "name": "Sin Categoria Asignada",
                    "is_active": True,
                },
            )

        return category_obj

    def get_tags_from_frontmatter(self, frontmatter):
        """Obtiene tags desde el frontmatter"""
        tags_objects = []

        if "tags" in frontmatter:
            tags_raw = frontmatter["tags"].strip()

            if tags_raw.startswith("[") and tags_raw.endswith("]"):
                try:
                    tags_list = ast.literal_eval(tags_raw)
                except Exception:
                    tags_list = [t.strip() for t in tags_raw.split(",")]
            else:
                tags_list = [t.strip() for t in tags_raw.split(",")]

            for tag_name in tags_list:
                if tag_name:
                    tag, _ = Tag.objects.get_or_create(
                        name__iexact=tag_name, defaults={"name": tag_name}
                    )
                    tags_objects.append(tag)

        return tags_objects

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: GUARDADO Y FINALIZACION
    # -------------------------------------------------------------------------
    def extract_cover_image(self, content_md, blog_dir, blog_static_dir, slug):
        """
        ✨ MAGIA DE LA IMAGEN DE PORTADA
        Busca la PRIMERA imagen del markdown que NO esté dentro de un bloque :::,
        la extrae como portada y la ELIMINA del contenido.
        No aparece nunca en el detalle del blog. Solo en listados y redes.
        """
        lines = content_md.strip().split("\n")
        cover_image_path = None
        inside_special_block = False

        for i, line in enumerate(lines):
            stripped = line.strip()

            if stripped.startswith(":::"):
                if ":::" in stripped[3:].strip():
                    pass
                elif not inside_special_block:
                    inside_special_block = True
                    continue
                else:
                    inside_special_block = False
                    continue

            if inside_special_block:
                continue

            match = re.search(r"!\[.*?\]\((.*?)\)", stripped)
            if match:
                img_src = match.group(1).strip()
                if not img_src.startswith(("http://", "https://", "/")):
                    source_img = blog_dir / img_src
                    if source_img.exists():
                        target_img = blog_static_dir / source_img.name
                        shutil.copy2(source_img, target_img)
                        cover_image_path = (
                            f"/static/blogs/{slug}/{source_img.name}"
                        )
                        del lines[i]
                        self.stdout.write(
                            "✅ Imagen de portada detectada automaticamente"
                        )
                        break

        return cover_image_path, "\n".join(lines)

    def save_blog_post(
        self,
        slug,
        file_hash,
        title,
        html_final,
        category_obj,
        frontmatter,
        cover_image_path=None,
    ):
        """Crea o actualiza el BlogPost en la base de datos"""

        is_published = not frontmatter.get("draft", "false").lower() == "true"

        # ✅ SEO: Validar y truncar longitudes correctas segun Google 2026
        meta_title_raw = frontmatter.get("meta_title", title)
        meta_description_raw = frontmatter.get(
            "meta_description", frontmatter.get("description", "")
        )

        meta_title = meta_title_raw[:59].strip()
        meta_description = meta_description_raw[:154].strip()

        if len(meta_title_raw) > 59:
            self.stdout.write(
                f"⚠️  Meta Title truncado: '{meta_title_raw[:55]}...'"
            )
        if len(meta_description_raw) > 154:
            self.stdout.write(
                f"⚠️  Meta Description truncado: '{meta_description_raw[:50]}...'"
            )

        defaults = {
            "source_hash": file_hash,
            "title": title,
            "content_html": html_final,
            "is_published": is_published,
            "category": category_obj,
            "description": frontmatter.get("description", ""),
            "meta_title": meta_title,
            "meta_description": meta_description,
            "cover_image": cover_image_path or frontmatter.get("image", None),
        }

        if "date" in frontmatter:
            from django.utils.dateparse import parse_date

            fecha = parse_date(frontmatter["date"])
            if fecha:
                defaults["publish_date"] = fecha

        obj, created = BlogPost.objects.update_or_create(
            slug=slug,
            defaults=defaults,
        )
        return obj

    def apply_custom_formatting(self, html_content):
        """Aplica transformaciones de HTML para cumplir con los requisitos de estilo.

        - Convierte <ol> en <ul class='steps'>
        - Añade clase 'step' a cada <li>
        - Convierte párrafos con emoji-bullet (✅ ❌ 💡...) en <ul class='emoji-list'>
        - Envuelve la sección de conclusión en <div class='conclusion'>
        """

        # ── Convertir <ol> a <ul class='steps'> ──
        html_content = re.sub(
            r"<ol>(.*?)</ol>",
            r"<ul class='steps'>\1</ul>",
            html_content,
            flags=re.DOTALL,
        )

        # ── Añadir clase 'step' a cada <li> ──
        html_content = re.sub(
            r"<li>(.*?)</li>",
            r"<li class='step'>\1</li>",
            html_content,
            flags=re.DOTALL,
        )

        # ── Convertir párrafos con emoji-bullet en listas reales ──
        EMOJI_BULLETS = "✅❌⚠️💡🔹🔸▶️➡️🚀🎯📌🔑🟢🔴🟡"
        emoji_list_pattern = re.compile(
            r"<p>((?:[" + EMOJI_BULLETS + r"][^\n<]*(?:<br\s*/?>)?){2,})</p>",
            re.DOTALL,
        )

        def convert_emoji_list(m):
            content = m.group(1)
            # Separar por <br> o por inicio de emoji
            items = re.split(r"<br\s*/?>", content)
            items = [i.strip() for i in items if i.strip()]
            if len(items) < 2:
                return m.group(0)
            li_items = "".join(f"<li>{item}</li>" for item in items)
            return f'<ul class="emoji-list">{li_items}</ul>'

        html_content = emoji_list_pattern.sub(convert_emoji_list, html_content)

        # ── Envolver sección Conclusión ──
        def wrap_conclusion(match):
            heading = match.group(0)
            return f"<div class='conclusion'>{heading}</div>"

        html_content = re.sub(
            r"<h[23][^>]*>\s*Conclusi[oó]n\s*</h[23]>",
            wrap_conclusion,
            html_content,
            flags=re.IGNORECASE,
        )

        return html_content

    def associate_tags_to_blog(self, obj, tags_objects):
        """Asocia los tags al blog"""
        if tags_objects and len(tags_objects) > 0:
            obj.tags.set(tags_objects)
        else:
            obj.tags.clear()

    def cleanup_removed_blogs(self, slugs_procesados):
        """
        ✨ LIMPIEZA AUTOMATICA CONSISTENTE
        Borra de la base de datos TODO blog que ya no exista en el filesystem
        """
        blogs_bd = BlogPost.objects.values_list("slug", flat=True)
        slugs_a_borrar = set(blogs_bd) - slugs_procesados

        self.count_deleted = 0

        if slugs_a_borrar:
            self.stdout.write(
                f"\n🔍 Detectados {len(slugs_a_borrar)} blogs que ya no existen en disco"
            )

            for slug in slugs_a_borrar:
                try:
                    blog = BlogPost.objects.get(slug=slug)
                    blog.delete()
                    self.count_deleted += 1
                    self.stdout.write(f"🗑️  Eliminado correctamente: {slug}")
                except Exception as e:
                    self.stdout.write(f"⚠️  Error eliminando {slug}: {str(e)}")

            self.stdout.write(
                f"✅ Limpieza completada: {self.count_deleted} blogs eliminados"
            )
        else:
            self.stdout.write("\n✅ No hay blogs huerfanos para eliminar")

    def show_final_summary(self):
        """Muestra resumen final de la importacion"""
        self.stdout.write("\n✅ IMPORTACIÓN COMPLETADA CORRECTAMENTE:")
        self.stdout.write(f"   ✅ Importados/Actualizados: {self.count_imported}")
        self.stdout.write(f"   ⏭️  Sin cambios: {self.count_skipped}")
        if hasattr(self, "count_deleted"):
            self.stdout.write(f"   🗑️  Eliminados: {self.count_deleted}")
