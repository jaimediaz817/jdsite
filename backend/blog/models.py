from django.db import models
from django.utils.text import slugify
from django.utils import timezone


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
