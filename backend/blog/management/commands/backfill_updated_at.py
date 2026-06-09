"""
HU: Backfill ``BlogPost.updated_at`` para filas donde el campo es ``NULL``.

Motivo: el campo ``updated_at`` se añadió con ``auto_now=True``. Los
registros creados antes de que existiera el campo quedan con ``NULL`` y la
plantilla muestra valores vacíos. Para mantener la coherencia con
``created_at`` asignamos ``updated_at`` al mismo timestamp que ``created_at``
cuando está disponible; de lo contrario usamos ``timezone.now()``.

Uso::

    python manage.py backfill_updated_at

El comando es idempotente: solo actualiza los registros que aún tienen
``updated_at`` ``NULL``.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone

from blog.models import BlogPost


class Command(BaseCommand):
    help = (
        "Rellena el campo ``updated_at`` de los BlogPost que lo tengan "
        "en NULL, usando ``created_at`` como referencia."
    )

    def handle(self, *args, **options):
        qs = BlogPost.objects.filter(updated_at__isnull=True)
        total = qs.count()
        if total == 0:
            self.stdout.write(
                self.style.SUCCESS(
                    "No hay BlogPost con updated_at NULL. Nada que hacer."
                )
            )
            return

        self.stdout.write(
            f"Se encontraron {total} BlogPost con updated_at NULL. Aplicando backfill..."
        )

        updated = 0
        for post in qs.iterator():
            # Preferimos el valor de created_at; si falta usamos la hora actual.
            post.updated_at = post.created_at or timezone.now()
            post.save(update_fields=["updated_at"])
            updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Hecho: {updated} BlogPost actualizados con un updated_at válido."
            )
        )
