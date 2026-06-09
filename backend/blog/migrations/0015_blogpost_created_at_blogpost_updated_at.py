"""
HU: Añade campos de auditoría ``created_at`` y ``updated_at`` a ``BlogPost``.

Decisión clave: para preservar la coherencia histórica del blog, los
valores de ``created_at`` para filas existentes se backfillean desde
``publish_date`` (que es la mejor aproximación disponible) y solo las
filas **nuevas** se regirán por ``auto_now_add``.

Pipeline de la migración:
1. Añade las columnas como ``DateTimeField`` nullable SIN ``auto_now_add`` /
   ``auto_now`` (así los registros existentes quedan con ``NULL`` y no se
   rellenan automáticamente con la fecha de la migración, que es lo que
   estaba pasando antes y daba "hace 3 minutos" para todo).
2. ``RunPython``: backfillea ``created_at`` desde ``publish_date`` (con
   fallbacks ``last_modified`` → ``timezone.now()``). ``updated_at`` se
   backfillea con el mismo valor que ``created_at`` (es coherente para
   filas legacy donde no tenemos mejor referencia).
3. Modifica los campos para que en futuras inserciones/actualizaciones se
   aplique ``auto_now_add`` / ``auto_now`` respectivamente.

Este flujo garantiza que:
- Filas legacy → mantienen su fecha histórica (publish_date).
- Filas nuevas → reciben automáticamente el timestamp real de creación.
"""

from django.db import migrations, models
from django.utils import timezone


def backfill_created_at(apps, schema_editor):
    """Backfillea ``created_at`` y ``updated_at`` para los BlogPost existentes.

    Reglas:
    - Si ``created_at`` está NULL, se asigna ``publish_date`` como mejor
      aproximación. Si también está NULL, ``last_modified``, y en última
      instancia ``timezone.now()``.
    - ``updated_at`` se inicializa con el mismo valor que ``created_at``
      para mantener coherencia (no tenemos mejor información histórica).
    """
    BlogPost = apps.get_model("blog", "BlogPost")
    now = timezone.now()
    for post in BlogPost.objects.filter(created_at__isnull=True).iterator():
        ts = post.publish_date or post.last_modified or now
        # save(update_fields=...) evita tocar ``last_modified`` (auto_now)
        post.created_at = ts
        post.updated_at = ts
        post.save(update_fields=["created_at", "updated_at"])


def reverse_noop(apps, schema_editor):
    """La operación inversa no necesita deshacer el backfill, solo las columnas."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("blog", "0014_change_is_published_default_to_false"),
    ]

    operations = [
        # Paso 1: añadir las columnas como nullable SIN auto_now para no
        # rellenar con la fecha de la migración.
        migrations.AddField(
            model_name="blogpost",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=False,
                null=True,
                blank=True,
                help_text="Fecha de creación del registro en BD",
            ),
        ),
        migrations.AddField(
            model_name="blogpost",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=False,
                null=True,
                blank=True,
                help_text="Fecha de la última modificación del registro",
            ),
        ),
        # Paso 2: backfillear los registros existentes con la mejor
        # aproximación disponible (publish_date -> last_modified -> now).
        migrations.RunPython(backfill_created_at, reverse_noop),
        # Paso 3: activar auto_now_add / auto_now. A partir de aquí, los
        # NUEVOS registros y saves actualizarán automáticamente los campos
        # sin pisar los valores que acabamos de backfillear.
        migrations.AlterField(
            model_name="blogpost",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                null=True,
                blank=True,
                help_text="Fecha de creación del registro en BD",
            ),
        ),
        migrations.AlterField(
            model_name="blogpost",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                null=True,
                blank=True,
                help_text="Fecha de la última modificación del registro",
            ),
        ),
    ]
