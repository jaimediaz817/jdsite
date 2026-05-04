from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from .utils import generate_avatar_seed, get_avatar_color, get_avatar_initials


class Category(models.Model):
    """
    Categorias para organizar los articulos del blog
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Tag(models.Model):
    """
    Etiquetas para organizar los articulos del blog
    Relacion ManyToMany con BlogPost
    """

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetas"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    """
    Modelo para entradas de blog importadas desde archivos Markdown
    La fuente de verdad siempre son los archivos .md, esta tabla es solo cache
    """

    slug = models.SlugField(max_length=200, unique=True, db_index=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name="posts")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    content_html = models.TextField()

    publish_date = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    is_published = models.BooleanField(default=True)
    source_hash = models.CharField(
        max_length=64,
        db_index=True,
        help_text="Hash del archivo md para detectar cambios",
    )

    # SEO
    meta_title = models.CharField(max_length=120, blank=True, null=True)
    meta_description = models.CharField(max_length=160, blank=True, null=True)

    # Imagen Portada
    cover_image = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Ruta a imagen de portada",
    )

    class Meta:
        ordering = ["-publish_date"]
        verbose_name = "Entrada de blog"
        verbose_name_plural = "Entradas de blog"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        from django.urls import reverse

        return reverse("blog:blog_detail", args=[self.slug])

    # ---------------------------------------------------------------------
    # Comentarios
    # ---------------------------------------------------------------------
    @property
    def comment_count(self):
        """Devuelve la cantidad de comentarios aprobados asociados a este post.

        Se realiza una consulta ligera a ``BlogComment`` filtrando por el slug
        del post y por el estado ``approved``. La importación del modelo se hace
        dentro del método para evitar problemas de importación circular, ya que
        ``BlogComment`` se define más abajo en este mismo archivo.
        """
        from .models import BlogComment  # Importación tardía para evitar circular

        return BlogComment.objects.filter(
            blog_slug=self.slug, status="approved"
        ).count()


class BlogComment(models.Model):
    """
    Comentarios y respuestas para articulos del blog
    """

    STATUS_CHOICES = [
        ("pending", "Pendiente"),
        ("approved", "Aprobado"),
        ("rejected", "Rechazado"),
    ]

    blog_slug = models.CharField(max_length=200, db_index=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
    )

    name = models.CharField(max_length=80)
    email = models.EmailField(max_length=150, null=True, blank=True)
    content = models.TextField(max_length=1000)

    ip_address = models.CharField(max_length=45)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )

    # Nivel de identificación (HU-008)
    IDENTIFICATION_LEVELS = [
        ("anonymous", "Anónimo"),
        ("identified", "Identificado por email"),
        ("registered", "Registrado (OAuth)"),
    ]
    identification_level = models.CharField(
        max_length=20, choices=IDENTIFICATION_LEVELS, default="anonymous"
    )

    # Para usuarios registrados con OAuth (Google/GitHub)
    provider = models.CharField(
        max_length=20,
        choices=[("google", "Google"), ("github", "GitHub")],
        null=True,
        blank=True,
    )
    provider_uid = models.CharField(max_length=255, null=True, blank=True)

    # Identificación automática de administradores
    is_admin = models.BooleanField(default=False)

    # Límite de edición de comentarios
    editable_until = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Comentario"
        verbose_name_plural = "Comentarios"
        indexes = [
            models.Index(fields=["blog_slug", "status", "created_at"]),
            models.Index(fields=["parent"]),
            models.Index(fields=["ip_address", "created_at"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.blog_slug}"

    @property
    def avatar_seed(self) -> str:
        return generate_avatar_seed(self.ip_address, self.name)

    @property
    def avatar_color(self) -> str:
        return get_avatar_color(self.avatar_seed)

    @property
    def avatar_initials(self) -> str:
        return get_avatar_initials(self.name)
