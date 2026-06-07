"""Utility class to encapsulate the per-blog processing logic.

The original ``import_blogs`` management command contained a large ``process_single_blog``
method with many helper functions.  To improve modularity and testability we move that
logic into this dedicated class.  The public API mirrors the previous implementation
so that the command can delegate to it with minimal changes.

Only the responsibilities directly related to a single blog are included here.  Higher
level orchestration (iteration over source directories, sequence reset, final summary)
remains in ``import_blogs.py``.
"""

from __future__ import annotations

import os
import re
import shutil
from pathlib import Path
from typing import Tuple, List

import markdown
from bs4 import BeautifulSoup
from django.utils.text import slugify

from blog.models import BlogPost, Category, Tag

# Relative imports within the same ``importer`` package
from .markdown_utils import calculate_file_hash, read_markdown_file


class BlogProcessor:
    """Encapsulates the processing of a single blog directory.

    Parameters
    ----------
    command : BaseCommand
        The management command instance - used for ``stdout`` output.
    static_target : Path
        Directory where static assets for the blog are copied.
    """

    def __init__(self, command, static_target: Path):
        self.command = command
        self.stdout = command.stdout
        self.STATIC_TARGET = static_target

    # ---------------------------------------------------------------------
    # Public entry point used by ``import_blogs``
    # ---------------------------------------------------------------------
    def process_single_blog(self, blog_dir: Path) -> str:
        """Process a single blog directory and return its slug."""
        md_file = blog_dir / "blog.md"

        if not md_file.exists():
            self.stdout.write(f"[!] Saltando {blog_dir.name}: no hay blog.md")
            return slugify(blog_dir.name)

        # Generate a permanent slug
        slug = slugify(blog_dir.name)

        # Compute hash to detect changes
        file_hash = calculate_file_hash(md_file)

        # Read markdown content and front-matter
        md_content, frontmatter = read_markdown_file(md_file)

        # [OK] HU-014: Re-leer el .md DIRECTAMENTE y extraer tiempo_lectura
        # Bypassea cualquier bug del parser de markdown_utils
        try:
            raw_md = md_file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raw_md = md_file.read_text(encoding="latin-1", errors="replace")

        for line in raw_md.split("\n")[:30]:
            stripped = line.strip()
            if stripped.startswith("tiempo_lectura:") or stripped.startswith(
                "reading_time:"
            ):
                valor = stripped.split(":", 1)[1].strip().strip('"').strip("'")
                if valor:
                    key = (
                        "tiempo_lectura"
                        if "tiempo_lectura" in stripped
                        else "reading_time"
                    )
                    if key not in frontmatter or not frontmatter[key]:
                        frontmatter[key] = valor

        # Extract title
        title, content_md = self.extract_title(md_content, blog_dir)

        # Check if the blog already exists and whether it needs updating
        existing_blog, necesita_actualizar = self.check_existing_blog(
            slug, file_hash, title
        )

        # Always copy images (fixes 404 bugs)
        blog_static_dir = self.STATIC_TARGET / slug
        self.copy_blog_images(blog_dir, blog_static_dir)

        if not necesita_actualizar:
            self.stdout.write(
                "[OK] Imagenes verificadas y copiadas correctamente"
            )
            return slug

        # Extract and remove the first image as cover (with frontmatter fallback)
        cover_image_path, content_sin_portada = self.extract_cover_image(
            content_md, blog_dir, blog_static_dir, slug, frontmatter
        )

        # Pre-process special markdown blocks before conversion
        markdown_with_specials = self.replace_special_blocks_md(
            content_sin_portada, blog_dir, blog_static_dir, slug
        )

        # Convert markdown -> HTML
        html_content = self.convert_markdown_to_html(markdown_with_specials)

        # Process legacy special blocks (gallery, carousel)
        processed_html = self.process_special_blocks(
            html_content, blog_dir, blog_static_dir, slug
        )

        # Replace image URLs and add lazy loading / alt attributes
        processed_html = self.process_images(
            processed_html, blog_dir, blog_static_dir, slug
        )

        # Process videos (convert img->video, rewrite <video> tags)
        processed_html = self.process_videos(
            processed_html, blog_dir, blog_static_dir, slug
        )

        # Auto-create carousels for consecutive images
        processed_html = self.auto_create_carousels(processed_html)

        # Apply final custom formatting (steps, emojis, etc.)
        html_final = self.apply_custom_formatting(processed_html)

        # Category handling
        category_obj = self.get_or_create_category(frontmatter)

        # Tags handling
        tags_objects = self.get_tags_from_frontmatter(frontmatter)

        # Persist the blog post
        obj = self.save_blog_post(
            slug,
            file_hash,
            title,
            html_final,
            category_obj,
            frontmatter,
            cover_image_path,
        )

        # Associate tags
        self.associate_tags_to_blog(obj, tags_objects)

        self.stdout.write(f"[OK] GUARDADO EN BD EXITOSAMENTE ID={obj.id}")
        self.command.count_imported += 1
        self.stdout.write(f"[OK] Importado: {title}")

        return slug

    # ---------------------------------------------------------------------
    # Helper methods (mostly copied from the original command)
    # ---------------------------------------------------------------------
    def extract_title(self, content_md: str, blog_dir: Path) -> Tuple[str, str]:
        """Extract the title from markdown or fallback to the folder name."""
        lines = content_md.strip().split("\n")
        if lines and lines[0].startswith("# "):
            title = lines[0][2:].strip()
            content_md = "\n".join(lines[1:])
        else:
            title = blog_dir.name
            title = re.sub(r"^\d{4}-\d{2}-\d{2}_", "", title)
            title = title.replace("-", " ").replace("_", " ").title()
        return title, content_md

    def check_existing_blog(self, slug: str, file_hash: str, title: str):
        """Return existing BlogPost (if any) and a bool indicating if an update is needed."""
        existing_by_slug = BlogPost.objects.filter(slug=slug).first()
        necesita_actualizar = True
        if existing_by_slug:
            if existing_by_slug.source_hash == file_hash:
                self.command.count_skipped += 1
                self.stdout.write(
                    f"[SKIP] Sin cambios en contenido: {existing_by_slug.title}"
                )
                necesita_actualizar = False
            else:
                self.stdout.write(
                    f"[SYNC] Detectados cambios, actualizando: {title}"
                )
        else:
            self.stdout.write(f"[NEW] Nuevo blog encontrado: {title}")
        return existing_by_slug, necesita_actualizar

    def copy_blog_images(self, blog_dir: Path, blog_static_dir: Path):
        """Copy all image and video files from the source directory to static."""
        blog_static_dir.mkdir(exist_ok=True)
        IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg")
        VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogv")
        for archivo in blog_dir.iterdir():
            if archivo.is_file() and archivo.suffix.lower() in (
                *IMAGE_EXTENSIONS,
                *VIDEO_EXTENSIONS,
            ):
                destino = blog_static_dir / archivo.name
                shutil.copy2(archivo, destino)

    # The following methods are unchanged copies from the original file.
    def convert_markdown_to_html(self, content_md: str) -> str:
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

    def process_special_blocks(
        self, html_content: str, blog_dir: Path, blog_static_dir: Path, slug: str
    ) -> str:
        processed_html = html_content
        # Popup gallery legacy
        popup_gallery_pattern = r":::\s*popup:gallery\s*\n(.*?)\n:::"
        processed_html = re.sub(
            popup_gallery_pattern,
            lambda match: self.replace_popup_gallery(
                match, blog_dir, blog_static_dir, slug
            ),
            processed_html,
            flags=re.DOTALL,
        )
        # Carousel legacy
        carousel_pattern = r":::\s*carousel\s*\n(.*?)\n:::"
        processed_html = re.sub(
            carousel_pattern,
            self.replace_carousel,
            processed_html,
            flags=re.DOTALL,
        )
        return processed_html

    def replace_special_blocks_md(
        self,
        markdown_content: str,
        blog_dir: Path,
        blog_static_dir: Path,
        slug: str,
    ) -> str:
        """Delegate to the command's full implementation which includes ALL block types:
        slides, callout (info/warning/tip), pullquote, codefile, popup:gallery, [vl] tags.
        """
        return self.command.replace_special_blocks_md(
            markdown_content, blog_dir, blog_static_dir, slug
        )

    def replace_popup_gallery(
        self, match, blog_dir: Path, blog_static_dir: Path, slug: str
    ) -> str:
        # Simplified version - retains core behaviour.
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
            title, desc = (
                (alt_text.split("|", 1) + [""])[:2]
                if "|" in alt_text
                else (alt_text, "")
            )
            if not img_src.startswith(("http://", "https://", "/")):
                source_img = blog_dir / img_src
                if source_img.exists():
                    target_img = blog_static_dir / source_img.name
                    shutil.copy2(source_img, target_img)
                    img_src = f"/static/blogs/{slug}/{source_img.name}"
            final_images.append((img_src, title.strip(), desc.strip()))
        if not final_images:
            return ""
        if len(final_images) == 1:
            src, title, desc = final_images[0]
            caption_html = (
                f'<figcaption class="image-caption"><strong>{title}</strong> {desc}</figcaption>'
                if title or desc
                else ""
            )
            return (
                f'<figure class="single-image-container mb-5"><img src="{src}" alt="{title}" '
                f'class="img-fluid rounded shadow-sm" loading="lazy"/>{caption_html}</figure>'
            )
        # Multiple images -> popup gallery (simplified markup)
        first_src, first_title, _ = final_images[0]
        images_value = "|||".join(
            [f"{src}||{title}||{desc}" for src, title, desc in final_images]
        )
        return (
            f'<div class="popup-gallery-container mb-5"><div class="gallery-preview" onclick="openGalleryPopup(this)">'
            f'<img src="{first_src}" alt="{first_title}" class="img-fluid rounded shadow-sm" loading="lazy">'
            f'<div class="gallery-badge"><i class="fas fa-images"></i> {len(final_images)} imagenes</div>'
            f'<input type="hidden" class="gallery-images" value="{images_value}"></div></div>'
        )

    def replace_carousel(self, match):
        content = match.group(1).strip()
        img_soup = BeautifulSoup(markdown.markdown(content), "html.parser")
        images = img_soup.find_all("img")
        if len(images) < 2:
            return content
        return f"""
            <div class=\"blog-carousel-container mb-5\"><div class=\"swiper\"><div class=\"swiper-wrapper\">{''.join([f'<div class=\"swiper-slide text-center\">{str(img)}</div>' for img in images])}</div><div class=\"swiper-pagination\"></div><div class=\"swiper-button-prev\"></div><div class=\"swiper-button-next\"></div></div></div>
        """

    def process_images(
        self, html_content: str, blog_dir: Path, blog_static_dir: Path, slug: str
    ) -> str:
        VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogv")
        soup = BeautifulSoup(html_content, "html.parser")
        for img in soup.find_all("img"):
            img_src = img["src"]
            # Skip video files - they are processed in process_videos()
            src_lower = img_src.lower()
            if any(src_lower.endswith(ext) for ext in VIDEO_EXTENSIONS):
                continue
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
                            f"[OK] Atributo alt generado automaticamente: {nombre_limpio}"
                        )
        return str(soup)

    def process_videos(
        self, html_content: str, blog_dir: Path, blog_static_dir: Path, slug: str
    ) -> str:
        """Detect video files in HTML and convert them to styled video players."""
        VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogv")
        soup = BeautifulSoup(html_content, "html.parser")
        modified = False

        # Case 1: Convert <img> tags pointing to video files
        for img in soup.find_all("img"):
            img_src = img.get("src", "")
            src_lower = img_src.lower()
            if not any(src_lower.endswith(ext) for ext in VIDEO_EXTENSIONS):
                continue

            video_title = img.get("alt", "")
            if not video_title:
                file_name = (
                    img_src.rsplit("/", 1)[-1] if "/" in img_src else img_src
                )
                video_title = (
                    file_name.rsplit(".", 1)[0]
                    .replace("-", " ")
                    .replace("_", " ")
                    .title()
                )

            video_src = self._resolve_video_src(
                img_src, blog_dir, blog_static_dir, slug
            )
            video_html = self._build_video_html(video_src, video_title)

            parent = img.parent
            if parent and parent.name == "p":
                new_tag = BeautifulSoup(video_html, "html.parser")
                parent.replace_with(new_tag)
            else:
                new_tag = BeautifulSoup(video_html, "html.parser")
                img.replace_with(new_tag)

            self.stdout.write(f"[VIDEO] Video convertido: {video_src}")
            modified = True

        # Case 2: Rewrite existing <video> tags
        for video in soup.find_all("video"):
            video_src = ""
            video_title = video.get("title", "")
            source_tag = video.find("source")
            if source_tag:
                video_src = source_tag.get("src", "")
            if not video_src:
                video_src = video.get("src", "")
            if not video_src:
                continue
            src_lower = video_src.lower()
            if not any(src_lower.endswith(ext) for ext in VIDEO_EXTENSIONS):
                continue

            resolved_src = self._resolve_video_src(
                video_src, blog_dir, blog_static_dir, slug
            )
            if not video_title:
                file_name = (
                    video_src.rsplit("/", 1)[-1]
                    if "/" in video_src
                    else video_src
                )
                video_title = (
                    file_name.rsplit(".", 1)[0]
                    .replace("-", " ")
                    .replace("_", " ")
                    .title()
                )

            new_video_html = self._build_video_html(resolved_src, video_title)
            new_tag = BeautifulSoup(new_video_html, "html.parser")
            video.replace_with(new_tag)
            self.stdout.write(
                f"[VIDEO] Video (html tag) reescrito: {resolved_src}"
            )
            modified = True

        return str(soup) if modified else html_content

    def _resolve_video_src(self, video_src, blog_dir, blog_static_dir, slug):
        """Resolve video source path to the static location."""
        if video_src.startswith(("http://", "https://", "/static/")):
            return video_src
        if not video_src.startswith("/"):
            source_video = blog_dir / video_src
            if source_video.exists():
                target_video = blog_static_dir / source_video.name
                shutil.copy2(source_video, target_video)
                return f"/static/blogs/{slug}/{source_video.name}"
        return video_src

    def _build_video_html(self, video_src, video_title=""):
        """Build styled video player HTML."""
        caption_html = ""
        if video_title:
            caption_html = f'<div class="blog-video-caption"><span class="blog-video-title">{video_title}</span></div>'
        mime_type = self._get_video_mime_type(video_src)
        return (
            f'<div class="blog-video-container mb-5">'
            f'<div class="blog-video-wrapper">'
            f'<video controls preload="metadata" playsinline class="blog-video-player">'
            f'<source src="{video_src}" type="{mime_type}">'
            f"Tu navegador no soporta la reproduccion de video."
            f"</video>"
            f"{caption_html}"
            f"</div>"
            f"</div>"
        )

    @staticmethod
    def _get_video_mime_type(video_src):
        ext = video_src.rsplit(".", 1)[-1].lower() if "." in video_src else "mp4"
        mime_map = {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "ogv": "video/ogg",
            "mov": "video/mp4",
            "avi": "video/x-msvideo",
            "mkv": "video/x-matroska",
        }
        return mime_map.get(ext, "video/mp4")

    def auto_create_carousels(self, html_content: str) -> str:
        # Re-use the original implementation (trimmed for brevity)
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
                        <div class=\"blog-carousel-container mb-5\"><div class=\"swiper\"><div class=\"swiper-wrapper\">{''.join([f'<div class=\"swiper-slide text-center\">{img}</div>' for img in carousel_images])}</div><div class=\"swiper-pagination\"></div><div class=\"swiper-button-prev\"></div><div class=\"swiper-button-next\"></div></div></div>
                    """
                    html_parts.append(carousel_html)
                    carousel_images = []
                    in_carousel = False
                elif in_carousel and len(carousel_images) == 1:
                    html_parts.append(f"<p>{carousel_images[0]}</p>")
                    carousel_images = []
                    in_carousel = False
                html_parts.append(str(element))
        if in_carousel:
            if len(carousel_images) >= 2:
                carousel_html = f"""
                    <div class=\"blog-carousel-container mb-5\"><div class=\"swiper\"><div class=\"swiper-wrapper\">{''.join([f'<div class=\"swiper-slide text-center\">{img}</div>' for img in carousel_images])}</div><div class=\"swiper-pagination\"></div><div class=\"swiper-button-prev\"></div><div class=\"swiper-button-next\"></div></div></div>
                """
                html_parts.append(carousel_html)
            else:
                html_parts.append(f"<p>{carousel_images[0]}</p>")
        return "".join(html_parts)

    # The following methods delegate to the original command's implementations.
    def apply_custom_formatting(self, html: str) -> str:
        """Delegate to the command's full formatting implementation."""
        return self.command.apply_custom_formatting(html)

    def get_or_create_category(self, frontmatter: dict):
        # Simplified - reuse the original logic via the command instance.
        return self.command.get_or_create_category(frontmatter)

    def get_tags_from_frontmatter(self, frontmatter: dict):
        return self.command.get_tags_from_frontmatter(frontmatter)

    def save_blog_post(
        self,
        slug,
        file_hash,
        title,
        html,
        category_obj,
        frontmatter,
        cover_image_path,
    ):
        return self.command.save_blog_post(
            slug,
            file_hash,
            title,
            html,
            category_obj,
            frontmatter,
            cover_image_path,
        )

    def associate_tags_to_blog(self, blog_obj, tags):
        self.command.associate_tags_to_blog(blog_obj, tags)

    def extract_cover_image(
        self,
        content_md: str,
        blog_dir: Path,
        blog_static_dir: Path,
        slug: str,
        frontmatter: dict | None = None,
    ):
        """Extract the first image as cover, skipping video files.

        If no image is found in the markdown content, falls back to the
        ``image`` field from the frontmatter (if provided), constructing
        the full path ``/static/blogs/{slug}/{filename}``.
        """
        VIDEO_EXTENSIONS = (".mp4", ".webm", ".mov", ".avi", ".mkv", ".ogv")
        lines = content_md.split("\n")
        cover_path = None
        new_content = []

        # FASE 1: Si hay cover_image en frontmatter, USARLO DIRECTAMENTE
        # como portada. NO buscamos en el contenido para no romper bloques
        # :::slides, :::callout, etc. La portada se define en frontmatter.
        if frontmatter and frontmatter.get("cover_image"):
            fm_cover = str(frontmatter["cover_image"]).strip()
            if fm_cover:
                if fm_cover.startswith(("/static/", "http://", "https://")):
                    cover_path = fm_cover
                else:
                    cover_path = f"/static/blogs/{slug}/{fm_cover}"
            return cover_path, "\n".join(lines)

        # FASE 2 (fallback): Si no hay cover_image en frontmatter,
        # buscar PRIMERA imagen FUERA de bloques ::: en el contenido
        for line in lines:
            img_match = re.match(r"!\[(.*?)\]\((.*?)\)", line)
            if img_match and not cover_path:
                img_src = img_match.group(2).strip()
                if any(img_src.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
                    new_content.append(line)
                    continue
                if not img_src.startswith(("http://", "https://", "/")):
                    source_img = blog_dir / img_src
                    if source_img.exists():
                        target_img = blog_static_dir / source_img.name
                        shutil.copy2(source_img, target_img)
                        img_src = f"/static/blogs/{slug}/{source_img.name}"
                cover_path = img_src
                new_content.append(line)
                continue
            new_content.append(line)

        # FASE 2: Si no se encontro imagen en el contenido, usar el frontmatter
        # Primero usamos ``cover_image`` (clave actual, escrita por el editor
        # y por HU-011.4). Como fallback conservamos ``image`` para articulos
        # antiguos que aun usen la clave deprecada.
        if not cover_path and frontmatter:
            fm_image_raw = frontmatter.get("cover_image") or frontmatter.get(
                "image"
            )
            if fm_image_raw:
                fm_image = str(fm_image_raw).strip()
                if fm_image:
                    # Si el frontmatter ya trae la ruta completa
                    # (``/static/blogs/<slug>/<filename>``) la respetamos.
                    if fm_image.startswith(("/static/", "http://", "https://")):
                        cover_path = fm_image
                    else:
                        # Si solo trae el nombre del archivo, intentamos
                        # copiarlo a ``static/blogs/<slug>/`` si existe.
                        static_file = blog_static_dir / fm_image
                        source_file = blog_dir / fm_image
                        if source_file.exists():
                            shutil.copy2(source_file, static_file)
                        cover_path = f"/static/blogs/{slug}/{fm_image}"

        return cover_path, "\n".join(new_content)
