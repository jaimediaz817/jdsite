from django.db import models
from django.utils.text import slugify
from django.utils import timezone
from django.conf import settings

# Import avatar helper functions from the sibling ``utils.py`` module.
# Using ``.utils.utils`` avoids the circular import caused by importing the
# package ``utils`` (which previously attempted to re-export these symbols).
# Import avatar helper functions directly from the sibling ``utils.py`` module.
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

    # ---------------------------------------------------------------------
    # 🟡 Auditoría: fecha de creación y última modificación en BD.
    # ``created_at`` se establece en el primer INSERT (no se vuelve a tocar).
    # ``updated_at`` se actualiza en cada ``save()``.
    # Son útiles para mostrar al usuario "hace cuánto se creó este post
    # en la base de datos" sin depender de ``publish_date`` (que refleja
    # la fecha del frontmatter y puede ser muy anterior).
    # ---------------------------------------------------------------------
    # ``created_at`` se asigna manualmente en ``save()`` para que, al crear
    # un artículo mediante el editor o la importación, tome la fecha del
    # front‑matter (``publish_date``) cuando esté disponible. Si no hay una
    # fecha, se usa la hora actual.
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    is_published = models.BooleanField(
        default=False,
        help_text="Los artículos se crean como borradores. El administrador los publica desde la dashboard.",
    )
    # ---------------------------------------------------------------------
    # 🟡 Moderación de borradores
    # ---------------------------------------------------------------------
    MODERATION_CHOICES = [
        ("pending", "Pendiente"),
        ("approved", "Aprobado"),
        ("rejected", "Rechazado"),
    ]
    moderation_status = models.CharField(
        max_length=20,
        choices=MODERATION_CHOICES,
        default="pending",
        help_text="Estado de moderación del artículo",
    )
    # Token para aprobación vía URL
    approval_token = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        help_text="Token único para aprobar el artículo vía URL",
    )
    approval_token_created = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp de creación del token de aprobación",
    )
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

    # Tiempo de lectura (HU-014)
    reading_time = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text=(
            "Tiempo de lectura en minutos, leido del frontmatter "
            "'tiempo_lectura' o 'reading_time'."
        ),
    )

    # Autoría (para HU-011.3: edición de artículos propios)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="blog_posts",
        help_text="Usuario autor del artículo",
    )

    # ---------------------------------------------------------------------
    # 📌 Propiedad auxiliar para compatibilidad con plantillas
    # ---------------------------------------------------------------------
    @property
    def author_email(self):
        """Devuelve el email del autor del artículo.

        La plantilla ``blog_list.html`` verifica ``post.author_email`` para
        decidir si muestra el botón de edición. En versiones anteriores el
        modelo tenía un campo ``author_email`` en el front‑matter, pero se
        migró a una relación FK con ``User``. Esta propiedad mantiene la
        compatibilidad sin introducir un nuevo campo en la base de datos.
        """
        if self.author:
            return getattr(self.author, "email", "")
        return ""

    class Meta:
        ordering = ["-publish_date"]
        verbose_name = "Entrada de blog"
        verbose_name_plural = "Entradas de blog"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        """Guarda el modelo asegurando coherencia de auditoría.

        - Genera ``slug`` si falta.
        - Genera token de aprobación para borradores.
        - Asigna ``created_at`` cuando el registro se crea por primera vez.
        """
        if not self.slug:
            self.slug = slugify(self.title)

        # Generar token de aprobación cuando el post es borrador y aún no tiene token
        if not self.is_published and not self.approval_token:
            import uuid

            self.approval_token = uuid.uuid4().hex
            self.approval_token_created = timezone.now()

        # Si ``created_at`` está vacío, usar ``publish_date`` (más fiable) o la hora actual
        if not self.created_at:
            self.created_at = self.publish_date or timezone.now()

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


class BlogModeration(models.Model):
    ACTION_CHOICES = [
        ("pending", "Pendiente"),
        ("approved", "Aprobado"),
        ("rejected", "Rechazado"),
    ]

    blog_post = models.ForeignKey(
        BlogPost, on_delete=models.CASCADE, related_name="moderations"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="authored_moderations",
    )
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_moderations",
    )
    action = models.CharField(
        max_length=20, choices=ACTION_CHOICES, default="pending"
    )
    comment = models.TextField(
        blank=True, null=True, help_text="Comentario del revisor"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Moderacion de blog"
        verbose_name_plural = "Moderaciones de blog"

    def __str__(self):
        return f"{self.blog_post.title} - {self.get_action_display()}"
