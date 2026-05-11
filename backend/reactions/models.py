from django.conf import settings
from django.db import models
from django.db.models import Q


class BlogReaction(models.Model):
    """
    Modelo independiente para reacciones de blog.
    SIN NINGUNA FOREIGN KEY, NINGUNA DEPENDENCIA, NINGUN ACOPLAMIENTO.

    La unica asociacion con el blog es el campo blog_slug que es un simple string.
    Funciona incluso si el blog no existe, fue borrado o se volvio a crear.

    Diseñado especificamente para no romperse con el comando import_blogs.
    """

    blog_slug = models.CharField(max_length=200, db_index=True)
    ip_address = models.CharField(max_length=45, db_index=True)  # Soporta IPv6
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        db_index=True,
    )
    reaction_type = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["blog_slug", "reaction_type"]),
        ]
        constraints = [
            # Para usuarios autenticados: unico por user
            models.UniqueConstraint(
                fields=["blog_slug", "user", "reaction_type"],
                name="unique_reaction_per_user_per_blog",
                condition=Q(user__isnull=False),
            ),
            # Para usuarios anonimos: unico por ip_address
            models.UniqueConstraint(
                fields=["blog_slug", "ip_address", "reaction_type"],
                name="unique_reaction_per_ip_per_blog",
                condition=Q(user__isnull=True),
            ),
        ]
        verbose_name = "Reacción Blog"
        verbose_name_plural = "Reacciones Blog"

    def __str__(self):
        return f"{self.blog_slug} | {self.user or self.ip_address} | {self.reaction_type}"


class CommentReaction(models.Model):
    """
    Modelo independiente para reacciones a comentarios del blog.
    SIN NINGUNA FOREIGN KEY, NINGUNA DEPENDENCIA, NINGUN ACOPLAMIENTO.

    La unica asociacion con el comentario es el campo comment_id que es un simple integer.
    Funciona incluso si el comentario no existe, fue borrado o se volvio a crear.
    """

    comment_id = models.BigIntegerField(db_index=True)
    ip_address = models.CharField(max_length=45, db_index=True)  # Soporta IPv6
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        db_index=True,
    )
    reaction_type = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["comment_id", "reaction_type"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["comment_id", "user", "reaction_type"],
                name="unique_reaction_per_user_per_comment",
                condition=Q(user__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["comment_id", "ip_address", "reaction_type"],
                name="unique_reaction_per_ip_per_comment",
                condition=Q(user__isnull=True),
            ),
        ]
        verbose_name = "Reacción Comentario Blog"
        verbose_name_plural = "Reacciones Comentarios Blog"

    def __str__(self):
        return f"Comentario #{self.comment_id} | {self.user or self.ip_address} | {self.reaction_type}"
