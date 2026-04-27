import os
import hashlib
import re
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.text import slugify
from blog.models import BlogPost, Category, Tag
import markdown
from bs4 import BeautifulSoup


class Command(BaseCommand):
    help = "Importa todos los blogs desde la carpeta blogs_source"

    def handle(self, *args, **options):
        self.stdout.write("🔍 Iniciando importación de blogs...")

        SOURCE_DIR = Path(settings.BASE_DIR) / "blogs_source"
        STATIC_TARGET = Path(settings.BASE_DIR) / "static" / "blogs"

        STATIC_TARGET.mkdir(exist_ok=True, parents=True)

        count_imported = 0
        count_skipped = 0

        # Iterar todas las carpetas de blogs
        for blog_dir in SOURCE_DIR.iterdir():
            if not blog_dir.is_dir():
                continue

            md_file = blog_dir / "blog.md"

            if not md_file.exists():
                self.stdout.write(f"⚠️  Saltando {blog_dir.name}: no hay blog.md")
                continue

            # ✅ SLUG UNICO PERMANENTE, NUNCA CAMBIA Y NUNCA GENERA COPIAS
            # EL SLUG SIEMPRE SERA EXACTAMENTE EL NOMBRE DE LA CARPETA
            # NUNCA MAS NUMEROS AL FINAL, NUNCA MAS DUPLICADOS
            slug = slugify(blog_dir.name)

            # Calcular hash para detectar cambios
            with open(md_file, "rb") as f:
                file_hash = hashlib.sha256(f.read()).hexdigest()

            # Leer contenido markdown
            with open(md_file, "r", encoding="utf-8") as f:
                md_content = f.read()

            # ✅ EXTRAER FRONTMATTER CORRECTAMENTE
            frontmatter = {}
            content_md = md_content

            # Detectar y eliminar frontmatter si existe
            if md_content.startswith("---"):
                parts = md_content.split("---", 2)
                if len(parts) >= 3:
                    frontmatter_raw = parts[1].strip()
                    content_md = parts[2].strip()

                    # Parsear frontmatter simple (solo valores basicos para evitar dependencia yaml)
                    for line in frontmatter_raw.split("\n"):
                        if ":" in line:
                            key, value = line.split(":", 1)
                            frontmatter[key.strip()] = value.strip()

            # Extraer título
            lines = content_md.strip().split("\n")

            if lines and lines[0].startswith("# "):
                title = lines[0][2:].strip()
                content_md = "\n".join(lines[1:])
            else:
                # Tomamos el nombre de la carpeta, quitamos guiones, fechas, etc
                title = blog_dir.name
                title = re.sub(r"^\d{4}-\d{2}-\d{2}_", "", title)
                title = title.replace("-", " ").replace("_", " ").title()

            # ✅ IDEMPOTENCIA 100% GARANTIZADA
            # Este hash es único para cada versión del archivo
            # NUNCA se procesará el mismo contenido dos veces
            # NUNCA habrá duplicados
            existing_by_slug = BlogPost.objects.filter(slug=slug).first()

            # Primero verificamos si existe por SLUG (identificador único real)
            necesita_actualizar = True
            if existing_by_slug:
                # Si existe, comparamos hash para ver si hay cambios
                if existing_by_slug.source_hash == file_hash:
                    count_skipped += 1
                    self.stdout.write(
                        f"⏭️  Sin cambios en contenido: {existing_by_slug.title}"
                    )
                    necesita_actualizar = False
                else:
                    # HAY CAMBIOS! ACTUALIZAMOS TODO, NO SOLO EL HASH
                    self.stdout.write(
                        f"🔄 Detectados cambios, actualizando: {title}"
                    )
            else:
                self.stdout.write(f"🆕 Nuevo blog encontrado: {title}")

            # Convertir Markdown a HTML
            html_content = markdown.markdown(
                content_md,
                extensions=["extra", "codehilite", "tables", "fenced_code"],
            )

            # ✅ SIEMPRE EJECUTAR COPIA DE ARCHIVOS, INCLUSO SI NO HAY CAMBIOS EN EL CONTENIDO
            # ✅ ESTO SOLUCIONA EL BUG DE IMAGENES FALTANTES 404 CUANDO SE BORRA EL DIRECTORIO STATIC O CAMBIO EL SLUG
            blog_static_dir = STATIC_TARGET / slug
            blog_static_dir.mkdir(exist_ok=True)

            # 🔹 COPIAR TODAS LAS IMAGENES DEL DIRECTORIO FUENTE A STATIC SIEMPRE
            import shutil

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

            if not necesita_actualizar:
                self.stdout.write(
                    f"✅ Imagenes verificadas y copiadas correctamente"
                )
                continue

            # ✅ SISTEMA MODULAR DE BLOQUES ESPECIALES PRIMERO, ANTES DE PROCESAR IMAGENES
            # Detecta patrones especiales en el markdown para renderizar componentes complejos
            processed_html = html_content

            # 🔹 Componente: Galeria Popup
            # Patrón:
            # ::: popup:gallery
            # ![imagen1](img1.png)
            # ![imagen2](img2.png)
            # ![imagen3](img3.png)
            # :::
            popup_gallery_pattern = r":::\s*popup:gallery\s*\n(.*?)\n:::"

            def replace_popup_gallery(match):
                content = match.group(1).strip()
                # Extraer todas las imagenes dentro del bloque
                temp_html = markdown.markdown(content)
                img_soup = BeautifulSoup(temp_html, "html.parser")
                images = img_soup.find_all("img")

                if not images:
                    return ""

                # Primero reemplazamos las rutas de las imagenes ANTES de usarlas Y COPIAMOS LOS ARCHIVOS
                for img in images:
                    img_src = img["src"]
                    if not img_src.startswith(("http://", "https://", "/")):
                        source_img = blog_dir / img_src
                        if source_img.exists():
                            target_img = blog_static_dir / source_img.name
                            import shutil

                            # ✅ PRIMERO COPIAMOS EL ARCHIVO FISICAMENTE
                            shutil.copy2(source_img, target_img)
                            # ✅ LUEGO ACTUALIZAMOS LA RUTA
                            img["src"] = f"/static/blogs/{slug}/{source_img.name}"

                first_img = images[0]

                return f"""
<div class="popup-gallery-container mb-5">
    <div class="gallery-preview d-inline-block position-relative cursor-pointer" onclick="openGalleryPopup(this)">
        <img src="{first_img['src']}" alt="{first_img.get('alt', '')}" class="img-fluid rounded shadow-sm" loading="lazy">
        <div class="gallery-badge position-absolute" style="bottom:12px; right:12px; background-color: rgba(0,0,0,0.75) !important; backdrop-filter: blur(4px);" class="text-white px-3 py-1 rounded-pill small">
            <i class="fas fa-images mr-1"></i> {len(images)} imágenes
        </div>
                <input type="hidden" class="gallery-images" value="{ '|'.join([ img['src'] for img in images ]) }">
    </div>
</div>
"""

            # 🔹 Componente: Carrusel Manual
            # Patrón:
            # ::: carousel
            # ![imagen1](img1.png)
            # ![imagen2](img2.png)
            # :::
            carousel_pattern = r":::\s*carousel\s*\n(.*?)\n:::"

            def replace_carousel(match):
                content = match.group(1).strip()
                img_soup = BeautifulSoup(
                    markdown.markdown(content), "html.parser"
                )
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

            processed_html = re.sub(
                popup_gallery_pattern,
                replace_popup_gallery,
                processed_html,
                flags=re.DOTALL,
            )
            processed_html = re.sub(
                carousel_pattern,
                replace_carousel,
                processed_html,
                flags=re.DOTALL,
            )

            # Ahora SI procesamos imagenes despues de reemplazar los bloques
            soup = BeautifulSoup(processed_html, "html.parser")

            for img in soup.find_all("img"):
                img_src = img["src"]

                # Si es ruta relativa, copiamos el archivo
                if not img_src.startswith(("http://", "https://", "/")):
                    source_img = blog_dir / img_src

                    if source_img.exists():
                        target_img = blog_static_dir / source_img.name

                        import shutil

                        shutil.copy2(source_img, target_img)

                        # Reescribir ruta a static
                        img["src"] = f"/static/blogs/{slug}/{source_img.name}"
                        img["loading"] = "lazy"

            # ✅ AGRUPAR IMAGENES SEGUIDAS EN CARRUSEL AUTOMATICAMENTE
            # Detecta 2 o mas imagenes seguidas sin ningun texto entre medio y las convierte en carrusel
            html_parts = []
            carousel_images = []
            in_carousel = False

            # Procesar hijos en orden
            for element in list(soup.children):
                if (
                    element.name == "p"
                    and len(element.contents) == 1
                    and element.contents[0].name == "img"
                ):
                    # Es un parrafo que solo contiene una imagen
                    img = element.find("img")
                    carousel_images.append(str(img))
                    in_carousel = True
                    continue

                else:
                    if in_carousel and len(carousel_images) >= 2:
                        # Cerramos el carrusel y lo agregamos
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
                        # Solo una imagen, la agregamos normal
                        html_parts.append(f"<p>{carousel_images[0]}</p>")
                        carousel_images = []
                        in_carousel = False

                    # Agregamos el elemento actual
                    html_parts.append(str(element))

            # Caso donde el carrusel esta al final del documento
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

            html_final = "".join(html_parts)

            # ✅ SISTEMA CATEGORIAS AUTOMATICO INTELIGENTE
            category_obj = None

            # Busca tanto en campo 'category' como 'categoria' por compatibilidad
            category_input = frontmatter.get(
                "category", frontmatter.get("categoria", "")
            ).strip()

            if category_input:
                # Separamos todas las palabras del texto ingresado
                palabras_busqueda = category_input.lower().split()

                # Buscamos cualquier coincidencia parcial con cualquier categoria existente
                for palabra in palabras_busqueda:
                    coincidencia = Category.objects.filter(
                        name__icontains=palabra, is_active=True
                    ).first()
                    if coincidencia:
                        category_obj = coincidencia
                        break

            # Si no encontramos ninguna coincidencia, usamos la categoria por defecto
            if not category_obj:
                category_obj, _ = Category.objects.get_or_create(
                    slug="sin-categoria-asignada",
                    defaults={
                        "name": "Sin Categoria Asignada",
                        "is_active": True,
                    },
                )

            # ✅ SISTEMA TAGS AUTOMATICO
            tags_objects = []
            if "tags" in frontmatter:
                tags_raw = frontmatter["tags"].strip()
                # Limpiamos y separamos los tags, soporta tanto formato array como string separado por comas
                if tags_raw.startswith("[") and tags_raw.endswith("]"):
                    # Formato array yaml
                    import ast

                    try:
                        tags_list = ast.literal_eval(tags_raw)
                    except:
                        tags_list = [t.strip() for t in tags_raw.split(",")]
                else:
                    # Formato string separado por comas
                    tags_list = [t.strip() for t in tags_raw.split(",")]

                # Creamos o buscamos cada tag
                for tag_name in tags_list:
                    if tag_name:
                        tag, _ = Tag.objects.get_or_create(
                            name__iexact=tag_name, defaults={"name": tag_name}
                        )
                        tags_objects.append(tag)

            # Crear o actualizar BlogPost
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

        # Asociamos los tags despues de guardar el objeto (requerido para ManyToMany)
        if tags_objects:
            obj.tags.set(tags_objects)
        else:
            obj.tags.clear()
            self.stdout.write(f"✅ GUARDADO EN BD EXITOSAMENTE ID={obj.id}")

            count_imported += 1
            self.stdout.write(f"✅ Importado: {title}")

        self.stdout.write("\n✅ Importación completada:")
        self.stdout.write(f"   - Importados/Actualizados: {count_imported}")
        self.stdout.write(f"   - Sin cambios: {count_skipped}")
