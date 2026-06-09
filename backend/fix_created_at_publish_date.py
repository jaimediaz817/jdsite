"""
Script one-time para corregir ``created_at`` en posts donde fue backfilleado
desde ``publish_date`` (que suele ser medianoche por ``parse_date``).

El error visible: un post creado hoy a las 15:30 muestra "hace 15 horas, 30 min"
porque ``created_at`` se backfilleó desde ``publish_date`` = ``2026-06-08 00:00:00``.

Corrección: para posts donde ``created_at`` y ``publish_date`` son EXACTAMENTE
iguales y ``last_modified`` es más reciente (o distinto), asignamos
``created_at = last_modified`` (que es un datetime preciso con ``auto_now``).

Mejor aún: si ``created_at`` y ``publish_date`` están en el mismo día y
``publish_date`` tiene hora = 0 (medianoche), actualizamos ``created_at``
con ``last_modified`` o, en última instancia, ``timezone.now()``.
"""

import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jdsite.settings")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import django

django.setup()

from django.utils import timezone
from blog.models import BlogPost

now = timezone.now()
today = now.date()
fixed = 0
total = 0

for post in BlogPost.objects.iterator():
    if post.created_at and post.publish_date:
        # Si created_at es IGUAL a publish_date, probablemente fue backfilleado
        diff = abs((post.created_at - post.publish_date).total_seconds())
        if diff < 1:
            total += 1
            # Usar last_modified como mejor referencia
            new_ts = post.last_modified or now
            # Solo corregir si last_modified es diferente a publish_date
            if (
                post.last_modified
                and abs((post.last_modified - post.publish_date).total_seconds())
                > 1
            ):
                post.created_at = post.last_modified
                post.save(update_fields=["created_at"])
                fixed += 1
                print(
                    f"  FIXED: {post.slug} - created_at: {post.publish_date} -> {post.created_at}"
                )
            elif (
                post.publish_date.hour == 0
                and post.publish_date.minute == 0
                and post.publish_date.second == 0
            ):
                # publish_date es medianoche - usar now
                post.created_at = now
                post.save(update_fields=["created_at"])
                fixed += 1
                print(
                    f"  FIXED (midnight): {post.slug} - created_at: {post.publish_date} -> {post.created_at}"
                )

print(f"\nTotal posts con created_at == publish_date: {total}")
print(f"Posts corregidos: {fixed}")
print("Listo.")
