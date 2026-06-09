"""
HU: Backfill ``BlogPost.created_at`` para filas antiguas donde está ``NULL``.

Causa: el campo ``created_at`` se añadió con ``auto_now_add=True``, que solo
rellena el valor en el momento del primer ``INSERT``. Los posts importados
antes de que el campo existiera (o insertados por SQL crudo) tienen
``created_at = NULL``.

Solución: para cada ``BlogPost`` con ``created_at IS NULL``, se asigna
``publish_date`` como mejor aproximación. Si también ``publish_date`` es
``NULL``, se usa ``last_modified`` o, en última instancia, ``timezone.now``.

Uso:
    python manage.py backfill_created_at

Idempotente: solo actualiza las filas que aún tienen ``created_at`` ``NULL``.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from blog.models import BlogPost


class Command(BaseCommand):
    help = (
        "Rellena el campo ``created_at`` de los BlogPost que lo tengan "
        "en NULL, usando publish_date / last_modified como fallback."
    )

    def handle(self, *args, **options):
        qs = BlogPost.objects.filter(created_at__isnull=True)
        total = qs.count()
        if total == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "No hay BlogPost con created_at NULL. Nada que hacer."
                )
            )
            return

        self.stdout.write(
            f"Se encontraron {total} BlogPost con created_at NULL. "
            "Aplicando fallback..."
        )

        fixed = 0
        for post in qs.iterator():
            if post.publish_date:
                post.created_at = post.publish_date
            elif post.last_modified:
                post.created_at = post.last_modified
            else:
                post.created_at = timezone.now()
            post.save(update_fields=["created_at"])
            fixed += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Hecho: {fixed} BlogPost actualizados con un created_at válido."
            )
        )
