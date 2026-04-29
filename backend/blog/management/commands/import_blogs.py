import os
import hashlib
import re
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
                cursor.execute(
                    """
                    SELECT setval(pg_get_serial_sequence('blog_blogpost', 'id'), 
                    COALESCE((SELECT MAX(id) FROM blog_blogpost), 0) + 1, false);
                """
                )
            elif "mysql" in db_engine:
                # MySQL no permite subconsultas directamente en ALTER TABLE
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
            return

        # ✅ Convertir Markdown a HTML
        html_content = self.convert_markdown_to_html(content_md)

        # ✅ Procesar bloques especiales (galerias, carruseles)
        processed_html = self.process_special_blocks(
            html_content, blog_dir, blog_static_dir, slug
        )

        # ✅ Procesar y reemplazar rutas de imagenes
        processed_html = self.process_images(
            processed_html, blog_dir, blog_static_dir, slug
        )

        # ✅ Auto crear carruseles de imagenes seguidas
        html_final = self.auto_create_carousels(processed_html)

        # ✅ Obtener o crear categoria
        category_obj = self.get_or_create_category(frontmatter)

        # ✅ Obtener tags
        tags_objects = self.get_tags_from_frontmatter(frontmatter)

        # ✅ Guardar finalmente en BD
        obj = self.save_blog_post(
            slug, file_hash, title, html_final, category_obj
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
        """Lee el archivo markdown y extrae el frontmatter"""
        with open(md_file, "r", encoding="utf-8") as f:
            md_content = f.read()

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

                        # Limpiar comillas dobles y simples automaticamente
                        # Funciona igual si las pusiste o no
                        if (value.startswith('"') and value.endswith('"')) or (
                            value.startswith("'") and value.endswith("'")
                        ):
                            value = value[1:-1].strip()

                        frontmatter[key] = value

        return content_md, frontmatter

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
        """Convierte markdown a HTML con todas las extensiones"""
        return markdown.markdown(
            content_md,
            extensions=["extra", "codehilite", "tables", "fenced_code"],
        )

    # -------------------------------------------------------------------------
    # 🔹 BLOQUE: COMPONENTES ESPECIALES
    # -------------------------------------------------------------------------
    def process_special_blocks(
        self, html_content, blog_dir, blog_static_dir, slug
    ):
        """Procesa bloques especiales: galerias popup y carruseles manuales"""
        processed_html = html_content

        # Procesar Galerias Popup
        popup_gallery_pattern = r":::\s*popup:gallery\s*\n(.*?)\n:::"
        processed_html = re.sub(
            popup_gallery_pattern,
            lambda match: self.replace_popup_gallery(
                match, blog_dir, blog_static_dir, slug
            ),
            processed_html,
            flags=re.DOTALL,
        )

        # Procesar Carruseles Manuales
        carousel_pattern = r":::\s*carousel\s*\n(.*?)\n:::"
        processed_html = re.sub(
            carousel_pattern,
            self.replace_carousel,
            processed_html,
            flags=re.DOTALL,
        )

        return processed_html

    def replace_popup_gallery(self, match, blog_dir, blog_static_dir, slug):
        """Renderiza componente Galeria Popup"""
        content = match.group(1).strip()
        temp_html = markdown.markdown(content)
        img_soup = BeautifulSoup(temp_html, "html.parser")
        images = img_soup.find_all("img")

        if not images:
            return ""

        # Reemplazar rutas de imagenes y copiar archivos
        for img in images:
            img_src = img["src"]
            if not img_src.startswith(("http://", "https://", "/")):
                source_img = blog_dir / img_src
                if source_img.exists():
                    target_img = blog_static_dir / source_img.name
                    shutil.copy2(source_img, target_img)
                    img["src"] = f"/static/blogs/{slug}/{source_img.name}"

        first_img = images[0]

        return f"""
            <div class="popup-gallery-container mb-5">
                <div class="gallery-preview d-inline-block position-relative cursor-pointer" onclick="openGalleryPopup(this)">
                    <img src="{first_img['src']}" alt="{first_img.get('alt', '')}" class="img-fluid rounded shadow-sm" loading="lazy">
                    <div class="gallery-badge position-relative" style="bottom:12px; right:12px; background-color: rgba(0,0,0,0.75) !important; backdrop-filter: blur(4px);" class="text-white px-3 py-1 rounded-pill small">
                        <i class="fas fa-images mr-1"></i> {len(images)} imágenes
                    </div>
                    <input type="hidden" class="gallery-images" value="{ '|'.join([ img['src'] for img in images ]) }">
                </div>
            </div>
        """

    def replace_carousel(self, match):
        """Renderiza componente Carrusel Manual"""
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

        return str(soup)

    def auto_create_carousels(self, html_content):
        """
        Detecta 2 o mas imagenes seguidas sin texto entre medio
        y las convierte automaticamente en carrusel
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
                    # Agregar carrusel
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
                    # Agregar imagen normal
                    html_parts.append(f"<p>{carousel_images[0]}</p>")
                    carousel_images = []
                    in_carousel = False

                # Agregar el elemento actual
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
            # Primero buscamos coincidencia exacta
            category_obj = Category.objects.filter(
                name__iexact=category_input, is_active=True
            ).first()

            # Si no existe exacta, buscamos coincidencia parcial por palabras
            if not category_obj:
                palabras_busqueda = category_input.lower().split()
                for palabra in palabras_busqueda:
                    coincidencia = Category.objects.filter(
                        name__icontains=palabra, is_active=True
                    ).first()
                    if coincidencia:
                        category_obj = coincidencia
                        break

            # Si aun no existe, CREAMOS LA NUEVA CATEGORIA
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
                except:
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
    def save_blog_post(self, slug, file_hash, title, html_final, category_obj):
        """Crea o actualiza el BlogPost en la base de datos"""
        obj, created = BlogPost.objects.update_or_create(
            slug=slug,
            defaults={
                "source_hash": file_hash,
                "title": title,
                "content_html": html_final,
                "is_published": True,
                "category": category_obj,
            },
        )
        return obj

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
        Soluciona definitivamente el problema de referencias y datos huerfanos
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
                    # Django se encarga AUTOMATICAMENTE de borrar TODAS las relaciones:
                    # reacciones, comentarios, tags, TODO
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
